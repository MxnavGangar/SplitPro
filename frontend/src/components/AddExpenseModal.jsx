import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Sparkles } from 'lucide-react';

const CATEGORIES = ['food','transport','accommodation','entertainment','shopping','utilities','health','other'];
const CAT_EMOJI  = { food:'🍕', transport:'🚗', accommodation:'🏠', entertainment:'🎮', shopping:'🛍️', utilities:'💡', health:'💊', other:'📌' };

export default function AddExpenseModal({ group, user, onClose, onAdded }) {
  const [form, setForm] = useState({
    description: '', amount: '', paid_by: user.id,
    split_type: 'equal', category: 'other', notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [customSplits, setCustomSplits] = useState({});
  const [loading, setLoading]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]       = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const init = {};
    group.members.forEach(m => { init[m.id] = ''; });
    setCustomSplits(init);
  }, [group.members]);

  const autoCategorize = async () => {
    if (!form.description) return;
    setAiLoading(true);
    try {
      const { category } = await api.categorize({ description: form.description, amount: form.amount || 0 });
      setForm(f => ({ ...f, category }));
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  };

  const submit = async () => {
    if (!form.description || !form.amount) return setError('Description and amount are required');
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return setError('Enter a valid amount');

    let splits = null;
    if (form.split_type === 'custom') {
      splits = Object.entries(customSplits)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([user_id, amt]) => ({ user_id, amount: parseFloat(amt) }));
      const total = splits.reduce((s, sp) => s + sp.amount, 0);
      if (Math.abs(total - amount) > 0.01)
        return setError(`Splits (₹${total.toFixed(2)}) must equal total (₹${amount.toFixed(2)})`);
    }

    setLoading(true); setError('');
    try { await api.addExpense({ group_id: group.id, ...form, amount, splits }); onAdded(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const equalAmount = group.members.length > 0
    ? (parseFloat(form.amount) / group.members.length).toFixed(2)
    : '0.00';

  const customTotal = Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <span className="modal-title">Add Expense</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Description + AI */}
        <div className="field">
          <label className="field-label">Description</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Dinner, Uber, Hotel..." value={form.description}
              onChange={set('description')} style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-icon" onClick={autoCategorize}
              disabled={!form.description || aiLoading}
              title="Auto-categorize with AI"
              style={{ color: aiLoading ? 'var(--text-3)' : 'var(--accent-hi)', flexShrink: 0 }}>
              {aiLoading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={15} />}
            </button>
          </div>
        </div>

        {/* Amount + Paid by */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">Amount (₹)</label>
            <input className="input" type="number" placeholder="0.00" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} />
          </div>
          <div className="field">
            <label className="field-label">Paid By</label>
            <select className="input" value={form.paid_by} onChange={set('paid_by')}>
              {group.members.map(m => (
                <option key={m.id} value={m.id}>{m.name}{m.id === user.id ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category + Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">Category</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Date</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </div>
        </div>

        {/* Split type */}
        <div className="field">
          <label className="field-label">Split</label>
          <div className="split-toggle">
            {['equal','custom'].map(t => (
              <button key={t} className={`split-option${form.split_type === t ? ' active' : ''}`}
                onClick={() => setForm(f => ({ ...f, split_type: t }))}>
                {t === 'equal' ? '⚖️ Split Equally' : '✏️ Custom Split'}
              </button>
            ))}
          </div>
        </div>

        {/* Equal preview */}
        {form.split_type === 'equal' && form.amount && (
          <div className="card-flat" style={{ marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Each person pays</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {group.members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-3)', padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)' }}>
                  <div className="avatar avatar-xs" style={{ background: m.avatar_color }}>{m.name[0]}</div>
                  <span style={{ fontSize: '0.82rem' }}>{m.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-hi)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹{equalAmount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom splits */}
        {form.split_type === 'custom' && (
          <div className="field">
            <label className="field-label">Custom Amounts</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {group.members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar avatar-sm" style={{ background: m.avatar_color }}>{m.name[0]}</div>
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{m.name}{m.id === user.id ? ' (you)' : ''}</span>
                  <input className="input" type="number" placeholder="0.00" min="0" step="0.01"
                    style={{ width: 110 }} value={customSplits[m.id] || ''}
                    onChange={e => setCustomSplits(s => ({ ...s, [m.id]: e.target.value }))} />
                </div>
              ))}
              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: customTotal === parseFloat(form.amount || 0) ? 'var(--green)' : 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {customTotal.toFixed(2)} / {parseFloat(form.amount || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding...</> : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
