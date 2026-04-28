import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login, register } = useAuth();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      {/* Left branding panel */}
      <div className="auth-left">
        <div style={{ maxWidth: 420, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
            <div className="sidebar-logo-icon" style={{ width: 38, height: 38, borderRadius: 11 }}>
              <Layers size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              SplitPro
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font)', fontSize: '2.6rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 18, color: 'var(--text)' }}>
            Split expenses,<br />
            <span style={{ color: 'var(--accent-hi)' }}>not friendships.</span>
          </h1>

          <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.95rem', maxWidth: 360 }}>
            Track group expenses, see who owes what in real-time, and settle up — with AI-powered categorization.
          </p>

          <div style={{ marginTop: 36 }}>
            {[
              'Add expenses and split equally or custom',
              'Real-time balance calculations',
              'AI-powered spending insights',
              'One-click settlements',
            ].map(f => (
              <div className="auth-feature" key={f}>
                <div className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right" style={{ background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 340 }} className="animate-in">
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font)', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 5 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
              {mode === 'login' ? 'Sign in to continue' : 'Start splitting smarter'}
            </p>
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="input" placeholder="Jane Doe" value={form.name} onChange={set('name')} onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          )}

          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={{ paddingRight: 42 }}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '0.9rem', marginBottom: 20 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Signing in...</> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.855rem', color: 'var(--text-2)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-hi)', fontWeight: 600, fontSize: '0.855rem', fontFamily: 'var(--font)' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
