import { query, getClient } from '../utils/db.js';

export const addExpense = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { group_id, description, amount, paid_by, split_type, splits, category, notes, date } = req.body;

    if (!group_id || !description || !amount || !paid_by)
      return res.status(400).json({ error: 'Missing required fields' });

    const memberCheck = await client.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group_id, req.user.id]
    );
    if (memberCheck.rows.length === 0)
      return res.status(403).json({ error: 'Not a member' });

    const expense = await client.query(
      `INSERT INTO expenses (group_id, description, amount, paid_by, split_type, category, notes, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [group_id, description, amount, paid_by, split_type || 'equal', category || 'other', notes || '', date || new Date()]
    );
    const expenseId = expense.rows[0].id;

    if (split_type === 'equal' || !split_type) {
      const members = await client.query(
        'SELECT user_id FROM group_members WHERE group_id = $1',
        [group_id]
      );
      const n = members.rows.length;
      const total = parseFloat(amount);
      const base = Math.floor((total / n) * 100) / 100;          // floor to 2dp
      const remainder = Math.round((total - base * n) * 100);     // leftover cents

      for (let i = 0; i < members.rows.length; i++) {
        // distribute leftover cents to first N members
        const share = i < remainder ? base + 0.01 : base;
        await client.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [expenseId, members.rows[i].user_id, share]
        );
      }
    } else if (split_type === 'custom' && splits) {
      for (const s of splits) {
        await client.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [expenseId, s.user_id, s.amount]
        );
      }
    }

    await client.query('COMMIT');

    const full = await query(
      `SELECT e.*, u.name as payer_name, u.avatar_color as payer_color
       FROM expenses e JOIN users u ON u.id = e.paid_by WHERE e.id = $1`,
      [expenseId]
    );
    res.status(201).json(full.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const { id: group_id } = req.params;
    const result = await query(
      `SELECT e.*,
        u.name as payer_name, u.avatar_color as payer_color,
        json_agg(json_build_object(
          'user_id', es.user_id,
          'amount', es.amount,
          'is_paid', es.is_paid,
          'user_name', us.name,
          'user_color', us.avatar_color
        )) as splits
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       LEFT JOIN expense_splits es ON es.expense_id = e.id
       LEFT JOIN users us ON us.id = es.user_id
       WHERE e.group_id = $1
       GROUP BY e.id, u.name, u.avatar_color
       ORDER BY e.date DESC, e.created_at DESC`,
      [group_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await query('SELECT paid_by FROM expenses WHERE id = $1', [id]);
    if (expense.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    await query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// Balance calculation
// ---------------------------------------------------------------------------
// For each expense:
//   payer gets credit  = full expense amount
//   every member owes  = their split amount
//
// Net(user) = sum of expenses they paid  -  sum of splits assigned to them
//           + settlements received       -  settlements paid
//
// Positive net  → group owes this person money  ("is owed")
// Negative net  → this person owes the group    ("owes")
// ---------------------------------------------------------------------------
export const getGroupBalances = async (req, res) => {
  try {
    const { id: group_id } = req.params;

    // 1. All members in this group
    const membersRes = await query(
      `SELECT u.id, u.name, u.avatar_color
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [group_id]
    );
    const members = membersRes.rows;

    // 2. How much each person paid (as the payer on an expense)
    const paidRes = await query(
      `SELECT paid_by AS user_id, SUM(amount)::numeric AS total
       FROM expenses
       WHERE group_id = $1
       GROUP BY paid_by`,
      [group_id]
    );

    // 3. How much each person owes across all splits
    const owedRes = await query(
      `SELECT es.user_id, SUM(es.amount)::numeric AS total
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $1
       GROUP BY es.user_id`,
      [group_id]
    );

    // 4. Settlements
    const settleRes = await query(
      `SELECT paid_by, paid_to, SUM(amount)::numeric AS total
       FROM settlements
       WHERE group_id = $1
       GROUP BY paid_by, paid_to`,
      [group_id]
    );

    // Build lookup maps
    const paidMap  = Object.fromEntries(paidRes.rows.map(r  => [r.user_id, parseFloat(r.total)]));
    const owedMap  = Object.fromEntries(owedRes.rows.map(r  => [r.user_id, parseFloat(r.total)]));

    // Net balance per member
    const netMap = {};
    members.forEach(m => {
      const paid  = paidMap[m.id]  || 0;
      const owed  = owedMap[m.id]  || 0;
      netMap[m.id] = paid - owed;
    });

    // Apply settlements
    settleRes.rows.forEach(s => {
      netMap[s.paid_by] = (netMap[s.paid_by] || 0) + parseFloat(s.total);
      netMap[s.paid_to] = (netMap[s.paid_to]  || 0) - parseFloat(s.total);
    });

    // Simplify debts
    const transactions = simplifyDebts(netMap, members);

    const memberBalances = members.map(m => ({
      ...m,
      net_balance:  parseFloat((netMap[m.id]  || 0).toFixed(2)),
      total_paid:   parseFloat((paidMap[m.id]  || 0).toFixed(2)),
      total_owed:   parseFloat((owedMap[m.id]  || 0).toFixed(2)),
    }));

    res.json({ members: memberBalances, transactions });
  } catch (err) {
    console.error('getGroupBalances error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

function simplifyDebts(netMap, members) {
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

  const creditors = [];  // net > 0: are owed money
  const debtors   = [];  // net < 0: owe money

  Object.entries(netMap).forEach(([id, net]) => {
    if (net >  0.005) creditors.push({ id, amount:  net });
    if (net < -0.005) debtors.push({   id, amount: -net });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort(  (a, b) => b.amount - a.amount);

  const transactions = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const settle = Math.min(creditors[ci].amount, debtors[di].amount);
    if (settle > 0.005) {
      transactions.push({
        from:       debtors[di].id,
        from_name:  memberMap[debtors[di].id]?.name,
        from_color: memberMap[debtors[di].id]?.avatar_color,
        to:         creditors[ci].id,
        to_name:    memberMap[creditors[ci].id]?.name,
        to_color:   memberMap[creditors[ci].id]?.avatar_color,
        amount:     parseFloat(settle.toFixed(2)),
      });
    }
    creditors[ci].amount -= settle;
    debtors[di].amount   -= settle;
    if (creditors[ci].amount < 0.005) ci++;
    if (debtors[di].amount   < 0.005) di++;
  }

  return transactions;
}

export const settleUp = async (req, res) => {
  try {
    const { group_id, paid_to, amount, note } = req.body;
    const result = await query(
      'INSERT INTO settlements (group_id, paid_by, paid_to, amount, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [group_id, req.user.id, paid_to, amount, note || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ---------------------------------------------------------------------------
// Debug endpoint: dumps raw DB rows for a group — helps verify data integrity
// GET /api/groups/:id/debug-balances
// ---------------------------------------------------------------------------
export const debugBalances = async (req, res) => {
  try {
    const { id: group_id } = req.params;

    const expenses = await query(
      `SELECT e.id, e.description, e.amount, u.name as paid_by, e.created_at
       FROM expenses e JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = $1 ORDER BY e.created_at`,
      [group_id]
    );

    const splits = await query(
      `SELECT e.description, u.name as user_name, es.amount
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       JOIN users u ON u.id = es.user_id
       WHERE e.group_id = $1 ORDER BY e.created_at, u.name`,
      [group_id]
    );

    res.json({
      expenses: expenses.rows,
      splits: splits.rows,
      split_totals_by_expense: splits.rows.reduce((acc, r) => {
        acc[r.description] = (acc[r.description] || 0) + parseFloat(r.amount);
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
