import { useState } from 'react';
import { api } from '../services/api';
import { ArrowRight, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function BalanceView({ balances, user, group, onSettled }) {
  const [settlingIdx, setSettlingIdx] = useState(null);

  const handleSettle = async (tx, idx) => {
    setSettlingIdx(idx);
    try {
      await api.settleUp({ group_id: group.id, paid_to: tx.to, amount: tx.amount, note: 'Settlement' });
      onSettled();
    } catch (e) { alert(e.message); }
    finally { setSettlingIdx(null); }
  };

  const isSettled = balances.transactions.length === 0;
  const totalSpend = balances.members.reduce((s, m) => s + m.total_paid, 0);

  return (
    <div style={{ maxWidth: 820 }}>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { emoji: '👥', value: `₹${totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: 'Total Group Spend', bg: 'rgba(124,106,255,0.12)', col: 'var(--accent)' },
          { emoji: '💰', value: `₹${(totalSpend / Math.max(balances.members.length, 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: 'Per Person (avg)', bg: 'rgba(34,197,94,0.10)', col: 'var(--green)' },
          { emoji: isSettled ? '✅' : '⏳', value: isSettled ? 'Settled' : `${balances.transactions.length} pending`, label: 'Status', bg: isSettled ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)', col: isSettled ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>{s.emoji}</div>
            <div>
              <div style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.col }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Left: member balance breakdown */}
        <div>
          <div className="section-label">Who Paid What</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {balances.members.map(m => {
              const net = m.net_balance;
              const isPos = net > 0.01;
              const isNeg = net < -0.01;
              const statusText = isPos ? `is owed ₹${net.toFixed(2)}` : isNeg ? `owes ₹${Math.abs(net).toFixed(2)}` : 'is settled up';
              const statusColor = isPos ? 'var(--green)' : isNeg ? 'var(--red)' : 'var(--text-3)';
              const StatusIcon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;

              return (
                <div key={m.id} className="card" style={{ padding: '14px 16px' }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div className="avatar" style={{ background: m.avatar_color, flexShrink: 0 }}>{m.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</span>
                      {m.id === user.id && (
                        <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--text-3)', background: 'var(--bg-4)', padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border)' }}>you</span>
                      )}
                    </div>
                    {/* Net pill */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: isPos ? 'rgba(34,197,94,0.1)' : isNeg ? 'rgba(239,68,68,0.1)' : 'var(--bg-3)',
                      border: `1px solid ${isPos ? 'rgba(34,197,94,0.25)' : isNeg ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                      borderRadius: 99, padding: '3px 10px',
                    }}>
                      <StatusIcon size={11} style={{ color: statusColor }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: statusColor }}>
                        {isPos ? '+' : ''}{net.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Paid − Share = Net */}
                  <div style={{ display: 'flex', gap: 6, fontSize: '0.74rem' }}>
                    <div style={{ flex: 1, background: 'var(--bg-3)', borderRadius: 6, padding: '6px 9px', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Paid</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)' }}>₹{m.total_paid.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', fontSize: '0.9rem' }}>−</div>
                    <div style={{ flex: 1, background: 'var(--bg-3)', borderRadius: 6, padding: '6px 9px', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Share</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--red)' }}>₹{m.total_owed.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', fontSize: '0.9rem' }}>=</div>
                    <div style={{
                      flex: 1, borderRadius: 6, padding: '6px 9px',
                      background: isPos ? 'rgba(34,197,94,0.06)' : isNeg ? 'rgba(239,68,68,0.06)' : 'var(--bg-3)',
                      border: `1px solid ${isPos ? 'rgba(34,197,94,0.2)' : isNeg ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                    }}>
                      <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>Net</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: statusColor }}>{isPos ? '+' : ''}{net.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Plain English */}
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: statusColor, fontWeight: 500 }}>
                    {m.name.split(' ')[0]} {statusText} overall
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: settle up */}
        <div>
          <div className="section-label">How to Settle Up</div>

          {isSettled ? (
            <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
              <CheckCircle size={28} style={{ color: 'var(--green)', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>All settled up!</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>No outstanding balances</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {balances.transactions.map((tx, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  {/* From → To */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: tx.from_color }}>{(tx.from_name || '?')[0]}</div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {tx.from === user.id ? 'You' : tx.from_name}
                    </span>
                    <ArrowRight size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div className="avatar avatar-sm" style={{ background: tx.to_color }}>{(tx.to_name || '?')[0]}</div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {tx.to === user.id ? 'You' : tx.to_name}
                    </span>
                  </div>

                  {/* Amount + CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.15rem', color: tx.from === user.id ? 'var(--red)' : 'var(--text)' }}>
                        ₹{tx.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
                        {tx.from === user.id
                          ? `You need to pay ${tx.to_name}`
                          : `${tx.from_name} needs to pay you`}
                      </div>
                    </div>
                    {tx.from === user.id && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleSettle(tx, i)} disabled={settlingIdx === i}>
                        {settlingIdx === i ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Paying...</> : '✓ Mark as Paid'}
                      </button>
                    )}
                    {tx.to === user.id && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'var(--bg-3)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                        Awaiting payment
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div style={{
                background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.15)',
                borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6
              }}>
                💡 These are the minimum transactions needed to clear all balances. Click "Mark as Paid" once money is sent.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
