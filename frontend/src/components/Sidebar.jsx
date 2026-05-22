import { useAuth } from '../context/AuthContext';

export default function Sidebar({ navItems, activeTab, onTabChange, unreadWarnings = 0 }) {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">📚</span>
        <div>
          <h2>Sar Kyi Tite</h2>
        </div>
        {user?.role === 'admin' && <span>Admin</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
            {item.id === 'warnings' && unreadWarnings > 0 && (
              <span className="nav-badge">{unreadWarnings}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="name">{user?.username}</div>
            <div className="role">{user?.role === 'admin' ? 'Administrator' : 'Member'}</div>
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ color: '#f87171', width: '100%' }}>
          <span className="icon">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
