import { query } from '../utils/db.js';

export const createGroup = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name required' });

    const result = await query(
      'INSERT INTO groups (name, description, icon, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', icon || '💰', req.user.id]
    );
    const group = result.rows[0];

    // Auto-add creator as member
    await query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const result = await query(
      `SELECT g.*, 
  COUNT(DISTINCT gm.user_id) as member_count,

  -- total group expenses
  COALESCE((
    SELECT SUM(e.amount)
    FROM expenses e
    WHERE e.group_id = g.id
  ), 0) as total_expenses,

  -- 🧠 YOUR PAYMENTS THIS MONTH
  COALESCE((
  SELECT SUM(es.amount)
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  WHERE e.group_id = g.id
  AND es.user_id = $1
  AND DATE_TRUNC('month', e.date) = DATE_TRUNC('month', CURRENT_DATE)
), 0) as my_net_spent_this_month

FROM groups g
JOIN group_members gm2 ON gm2.group_id = g.id AND gm2.user_id = $1
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id
ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Check membership
    const memberCheck = await query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (memberCheck.rows.length === 0)
      return res.status(403).json({ error: 'Not a member of this group' });

    const group = await query('SELECT * FROM groups WHERE id = $1', [id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Group not found' });

    const members = await query(
      `SELECT u.id, u.name, u.email, u.avatar_color 
       FROM users u 
       JOIN group_members gm ON gm.user_id = u.id 
       WHERE gm.group_id = $1`,
      [id]
    );

    res.json({ ...group.rows[0], members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const user = await query('SELECT id, name, email, avatar_color FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found. They must register first.' });

    const targetUser = user.rows[0];
    const alreadyMember = await query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, targetUser.id]
    );
    if (alreadyMember.rows.length > 0)
      return res.status(409).json({ error: 'Already a member' });

    await query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [id, targetUser.id]);
    res.json({ message: 'Member added', user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await query('SELECT created_by FROM groups WHERE id = $1', [id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    if (group.rows[0].created_by !== req.user.id)
      return res.status(403).json({ error: 'Only group creator can delete' });

    await query('DELETE FROM groups WHERE id = $1', [id]);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
