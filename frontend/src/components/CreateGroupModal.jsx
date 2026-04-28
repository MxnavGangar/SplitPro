import { useState } from 'react';
import { api } from '../services/api';
import { X } from 'lucide-react';

const ICONS = ['💰','🏖️','🏠','🍕','🚗','✈️','🎉','🏋️','🎮','🛍️','🧳','🎵'];

export default function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', icon: '💰' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name.trim()) return setError('Group name is required');
    setLoading(true); setError('');
    try { const group = await api.createGroup(form); onCreated(group); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">Create New Group</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="field">
          <label className="field-label">Icon</label>
          <div className="icon-grid">
            {ICONS.map(i => (
              <button key={i} className={`icon-btn${form.icon === i ? ' active' : ''}`}
                onClick={() => setForm(f => ({ ...f, icon: i }))}>{i}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Group Name</label>
          <input className="input" placeholder="Weekend Trip, House Expenses..." value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        <div className="field">
          <label className="field-label">Description <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input className="input" placeholder="What's this group for?" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
