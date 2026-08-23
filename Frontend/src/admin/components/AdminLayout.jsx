import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-app-wrapper">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-body">
          {children}
        </main>
      </div>
    </div>
  );
}
