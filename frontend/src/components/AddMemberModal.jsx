import { useState } from 'react';
import { api } from '../services/api';
import { X, UserPlus } from 'lucide-react';

export function AddMemberModal({ groupId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) return setError('Email required');
    setLoading(true); setError('');
    try { await api.addMember(groupId, { email }); onAdded(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-head">
          <span className="modal-title">Add Member</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <p style={{ fontSize: '0.855rem', color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.6 }}>
          Enter the email address of someone who already has a SplitPro account.
        </p>

        <div className="field">
          <label className="field-label">Email Address</label>
          <input className="input" type="email" placeholder="friend@example.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding...</> : <><UserPlus size={14} /> Add Member</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMemberModal;
