import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Sidebar() {
  const { admin } = useAuth();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '⚡' },
    { path: '/admin/students', label: 'All Students', icon: '🎓' },
    { path: '/admin/students/create', label: 'Create Student', icon: '➕' },
    { path: '/admin/students/bulk-create', label: 'Bulk Create', icon: '📦' },
    { path: '/admin/maps', label: 'Question Maps', icon: '🗺️' },
    { path: '/admin/maps/create', label: 'Create Map', icon: '📍' },
    { path: '/admin/routes', label: 'Route Keys', icon: '🔑' },
    { path: '/admin/members', label: 'Admin Members', icon: '🛡️' },
    { path: '/admin/members/add', label: 'Add Member', icon: '👤' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">PATHFINDER OS</div>
        <h2 className="brand-title">ADMIN PANEL</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">MAIN NAVIGATION</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin/students' || item.path === '/admin/maps' || item.path === '/admin/members'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">
            {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-info">
            <div className="user-name">{admin?.name || 'Administrator'}</div>
            <div className="user-role">{admin?.role || 'ADMIN'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
