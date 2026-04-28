import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Users, BarChart3, Sparkles, Receipt } from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import AddMemberModal from '../components/AddMemberModal';
import BalanceView from '../components/BalanceView';
import ExpenseList from '../components/ExpenseList';
import InsightsPanel from '../components/InsightsPanel';
import Toast from '../components/Toast';

const TABS = [
  { id: 'expenses', label: 'Expenses',    icon: <Receipt size={14} /> },
  { id: 'balances', label: 'Balances',    icon: <BarChart3 size={14} /> },
  { id: 'insights', label: 'AI Insights', icon: <Sparkles size={14} /> },
];

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [g, e, b] = await Promise.all([api.getGroup(id), api.getExpenses(id), api.getBalances(id)]);
      setGroup(g); setExpenses(e); setBalances(b);
    } catch (e) { console.error(e); navigate('/dashboard'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{group?.icon}</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
              {group?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              {group?.members?.slice(0, 5).map(m => (
                <div key={m.id} className="avatar avatar-xs" style={{ background: m.avatar_color }} title={m.name}>
                  {m.name[0]}
                </div>
              ))}
              {group?.members?.length > 5 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>+{group.members.length - 5}</span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: 2 }}>
                {group?.members?.length} members
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>
            <Users size={13} /> Add Member
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddExpense(true)}>
            <Plus size={13} /> Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '22px 24px' }} className="animate-in">
        {tab === 'expenses' && (
          <ExpenseList expenses={expenses} user={user} onDeleted={() => { load(); showToast('Expense deleted'); }} />
        )}
        {tab === 'balances' && balances && (
          <BalanceView balances={balances} user={user} group={group} onSettled={() => { load(); showToast('Settlement recorded!'); }} />
        )}
        {tab === 'insights' && (
          <InsightsPanel expenses={expenses} members={group?.members} groupName={group?.name} />
        )}
      </div>

      {showAddExpense && (
        <AddExpenseModal group={group} user={user} onClose={() => setShowAddExpense(false)}
          onAdded={() => { load(); setShowAddExpense(false); showToast('Expense added!'); }} />
      )}
      {showAddMember && (
        <AddMemberModal groupId={id} onClose={() => setShowAddMember(false)}
          onAdded={() => { load(); setShowAddMember(false); showToast('Member added!'); }} />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
