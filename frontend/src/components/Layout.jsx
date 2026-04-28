import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Plus, Layers } from 'lucide-react';
import { useState } from 'react';
import CreateGroupModal from './CreateGroupModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="sidebar-logo-text">SplitPro</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>

          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> New Group
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar" style={{ background: user?.avatar_color || 'var(--accent)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { logout(); navigate('/auth'); }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { setShowCreate(false); navigate(`/groups/${g.id}`); }}
        />
      )}
    </div>
  );
}
