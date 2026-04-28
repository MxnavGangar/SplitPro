import { useState } from 'react';
import { api } from '../services/api';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const CAT_EMOJI  = { food:'🍕', transport:'🚗', accommodation:'🏠', entertainment:'🎮', shopping:'🛍️', utilities:'💡', health:'💊', other:'📌' };
const CAT_CLASS  = { food:'cat-food', transport:'cat-transport', accommodation:'cat-accommodation', entertainment:'cat-entertainment', shopping:'cat-shopping', utilities:'cat-utilities', health:'cat-health', other:'cat-other' };

function ExpenseItem({ expense, user, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this expense?')) return;
    setDeleting(true);
    try { await api.deleteExpense(expense.id); onDeleted(); }
    catch (err) { alert(err.message); setDeleting(false); }
  };

  const userSplit  = expense.splits?.find(s => s.user_id === user.id);
  const isMyExpense = expense.paid_by === user.id;
  const date = new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="expense-item" onClick={() => setExpanded(v => !v)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Category pill */}
        <div className={`cat-pill ${CAT_CLASS[expense.category] || 'cat-other'}`}>
          {CAT_EMOJI[expense.category] || '📌'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {expense.description}
            </span>
            {expense.ai_categorized && (
              <span style={{ fontSize: '0.64rem', color: 'var(--accent-hi)', background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: 99, flexShrink: 0, fontWeight: 600 }}>
                AI
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
            <span style={{ color: expense.payer_color || 'var(--text-2)', fontWeight: 500 }}>
              {isMyExpense ? 'You' : expense.payer_name}
            </span>
            {' '}paid · {date}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.95rem' }}>
            ₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {userSplit && (
            <div style={{ fontSize: '0.74rem', marginTop: 2, fontFamily: 'var(--font-mono)', color: isMyExpense ? 'var(--green)' : 'var(--red)' }}>
              {isMyExpense
                ? `+₹${(parseFloat(expense.amount) - parseFloat(userSplit.amount)).toFixed(2)}`
                : `-₹${parseFloat(userSplit.amount).toFixed(2)}`}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn btn-danger btn-icon btn-sm" onClick={handleDelete} disabled={deleting}
            style={{ opacity: deleting ? 0.4 : 1 }}>
            <Trash2 size={12} />
          </button>
          {expanded
            ? <ChevronDown size={15} style={{ color: 'var(--text-3)' }} />
            : <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />}
        </div>
      </div>

      {/* Expanded splits */}
      {expanded && expense.splits && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Split breakdown</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {expense.splits.filter(s => s.user_id).map(s => (
              <div key={s.user_id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-2)', padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)' }}>
                <div className="avatar avatar-xs" style={{ background: s.user_color }}>{(s.user_name || '?')[0]}</div>
                <span style={{ fontSize: '0.8rem' }}>{s.user_name?.split(' ')[0]}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹{parseFloat(s.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpenseList({ expenses, user, onDeleted }) {
  if (expenses.length === 0) return (
    <div className="empty">
      <div className="empty-icon" style={{ fontSize: '1.3rem' }}>💸</div>
      <h3>No expenses yet</h3>
      <p>Add your first expense to start tracking shared costs.</p>
    </div>
  );

  const grouped = expenses.reduce((acc, e) => {
    const d = new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([date, exps]) => (
        <div key={date} style={{ marginBottom: 22 }}>
          <div className="section-label">{date}</div>
          {exps.map(e => <ExpenseItem key={e.id} expense={e} user={user} onDeleted={onDeleted} />)}
        </div>
      ))}
    </div>
  );
}
