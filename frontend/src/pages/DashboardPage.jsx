import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowRight, TrendingUp, Receipt, Plus } from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';

export default function DashboardPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try { const data = await api.getGroups(); setGroups(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalExpenses = groups.reduce((s, g) => s + parseFloat(g.total_expenses || 0), 0);
  const myPaidThisMonth = groups.reduce(
  (sum, g) => sum + parseFloat(g.my_paid_this_month || 0),
  0
);
const myNetSpent = groups.reduce(
  (sum, g) => sum + parseFloat(g.my_net_spent_this_month || 0),
  0
);

  return (
    <div style={{ padding: '0 0 40px' }} className="animate-in">
      {/* Page header */}
      <div className="page-header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Group
        </button>
      </div>

      <div style={{ padding: '24px 26px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { icon: <Users size={18} />, label: 'Active Groups',  value: groups.length,       color: 'var(--accent)',  bg: 'var(--accent-dim)' },
            { icon: <Receipt size={18} />, label: 'Total Tracked', value: `₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'var(--green)', bg: 'var(--green-dim)' },
            { icon: <TrendingUp size={18} />, label: 'Your Spending This Month',  value: `₹${myNetSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'var(--yellow)', bg: 'rgba(233,167,62,0.10)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Groups */}
        <div className="section-label">Your Groups</div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : groups.length === 0 ? (
          <div className="empty" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
            <div className="empty-icon"><Users size={22} /></div>
            <h3>No groups yet</h3>
            <p>Create a group to start splitting expenses with friends or teammates.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create your first group
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))', gap: 10 }}>
            {groups.map((g, i) => (
              <div
                key={g.id}
                className="group-card animate-in"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="group-card-icon">{g.icon || '💰'}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 2 }}>{g.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
                        {g.member_count} member{g.member_count !== '1' ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={15} style={{ color: 'var(--text-3)' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>Total spent</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.95rem' }}>
                    ₹{parseFloat(g.total_expenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { load(); setShowCreate(false); navigate(`/groups/${g.id}`); }}
        />
      )}
    </div>
  );
}
