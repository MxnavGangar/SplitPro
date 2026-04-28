import { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CAT_COLORS = {
  food:'#fb923c', transport:'#60a5fa', accommodation:'#a78bfa',
  entertainment:'#f472b6', shopping:'#2dd4bf', utilities:'#9ca3af', health:'#4ade80', other:'#94a3b8'
};

export default function InsightsPanel({ expenses, members, groupName }) {
  const [insights, setInsights] = useState('');
  const [loading, setLoading]   = useState(false);
  const [loaded, setLoaded]     = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await api.insights({ expenses, members, groupName });
      setInsights(data.insights); setLoaded(true);
    } catch (e) { setInsights('Could not load insights. Please try again.'); }
    finally { setLoading(false); }
  };

  const catData = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount); return acc; }, {})
  ).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const memberData = Object.entries(
    expenses.reduce((acc, e) => { acc[e.payer_name] = (acc[e.payer_name] || 0) + parseFloat(e.amount); return acc; }, {})
  ).map(([name, value]) => ({ name: name.split(' ')[0], value: parseFloat(value.toFixed(2)) }));

  if (expenses.length === 0) return (
    <div className="empty">
      <div className="empty-icon" style={{ fontSize: '1.3rem' }}>🤖</div>
      <h3>No data yet</h3>
      <p>Add expenses to unlock AI-powered spending analytics.</p>
    </div>
  );

  const tooltipStyle = {
  background: 'rgba(17, 24, 39, 0.95)',  // darker + glass feel
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#ffffff',
  fontSize: '0.85rem',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
};

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="section-label" style={{ marginBottom: 14 }}>By Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} dataKey="value">
                {catData.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
  formatter={(value, name) => [
    `₹${value.toFixed(2)}`,
    name.charAt(0).toUpperCase() + name.slice(1)
  ]}
  contentStyle={tooltipStyle}
  itemStyle={{ color: '#fff', fontWeight: 500 }}
  labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {catData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--text-2)' }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: CAT_COLORS[d.name] || '#94a3b8', flexShrink: 0 }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-label" style={{ marginBottom: 14 }}>By Member</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={memberData} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
              <Tooltip
  formatter={(value, name) => [`₹${value}`, name]}
  contentStyle={tooltipStyle}
  itemStyle={{ color: '#fff', fontWeight: 500 }}
  labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
/>
              <Bar dataKey="value" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: loaded || loading ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={15} style={{ color: 'var(--accent-hi)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>AI Insights</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchInsights} disabled={loading}>
            {loading
              ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Analyzing...</>
              : <><RefreshCw size={12} /> {loaded ? 'Refresh' : 'Generate Insights'}</>}
          </button>
        </div>

        {!loaded && !loading && (
          <p style={{ fontSize: '0.855rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            Click "Generate Insights" to get an AI-powered breakdown of your group's spending habits.
          </p>
        )}

        {insights && (
          <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--r)', padding: '14px 16px', border: '1px solid var(--border)' }}>
            {insights.split('\n').filter(Boolean).map((line, i, arr) => (
              <div key={i} className="insight-line" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
