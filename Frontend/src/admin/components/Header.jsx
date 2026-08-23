import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NeoButton from './NeoButton';

export default function Header() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="admin-header">
      <div className="header-welcome">
        <h1>HEY, {admin?.name ? admin.name.split(' ')[0].toUpperCase() : 'ADMIN'} 👋</h1>
        <p>Here's what's happening with your student system today.</p>
      </div>

      <div className="header-actions">
        <NeoButton
          variant="purple"
          onClick={() => navigate('/admin/students/create')}
        >
          <span>⚡</span> + CREATE NEW
        </NeoButton>

        <NeoButton
          variant="yellow"
          onClick={() => navigate('/admin/students/bulk-create')}
        >
          <span>📦</span> BULK
        </NeoButton>

        <NeoButton
          variant="black"
          className="neo-btn-sm"
          onClick={handleLogout}
        >
          LOGOUT
        </NeoButton>
      </div>
    </header>
  );
}
