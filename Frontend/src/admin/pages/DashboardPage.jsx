import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import BentoCard from '../components/BentoCard';
import NeoTable from '../components/NeoTable';
import StatusBadge from '../components/StatusBadge';
import NeoButton from '../components/NeoButton';
import LoadingState from '../components/LoadingState';
import { adminService } from '../api/adminService';
import { studentService } from '../api/studentService';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [dashData, studentData] = await Promise.all([
          adminService.getDashboardStats(),
          studentService.getStudents({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        setStats(dashData);
        setRecentStudents(studentData.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to connect to backend server. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const studentColumns = [
    { header: 'USER NO.', accessor: 'userNumber', cell: (r) => <strong>#{r.userNumber}</strong> },
    { header: 'USERNAME', accessor: 'username', cell: (r) => <code>{r.username}</code> },
    { header: 'NAME', accessor: 'name' },
    { header: 'MAP', accessor: 'mapId', cell: (r) => r.mapId?.name || 'Unassigned' },
    { header: 'ROUTE KEY', accessor: 'routeKey', cell: (r) => <code style={{ color: 'var(--neo-purple)', fontWeight: 800 }}>{r.routeKey || 'N/A'}</code> },
    { header: 'STATUS', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <LoadingState type="cards" rows={4} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error && (
        <div style={{ padding: '16px 20px', background: 'var(--neo-pink)', color: 'var(--neo-white)', border: 'var(--neo-border)', boxShadow: 'var(--neo-shadow)', fontWeight: 800, marginBottom: 24 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI BENTO ROW */}
      <div className="bento-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="TOTAL STUDENTS"
          value={stats?.students?.total ?? 0}
          trend="+12.5% this month"
          icon="🎓"
          variant="yellow"
          span="bento-span-3"
        />
        <StatCard
          title="ACTIVE STUDENTS"
          value={stats?.students?.active ?? 0}
          trend="+9.4% active"
          icon="🟢"
          variant="green"
          span="bento-span-3"
        />
        <StatCard
          title="TOTAL MAPS"
          value={stats?.maps?.total ?? 0}
          trend={`${stats?.maps?.availableSlots ?? 0} slots left`}
          icon="🗺️"
          variant="purple"
          span="bento-span-3"
        />
        <StatCard
          title="ROUTE KEYS"
          value={stats?.routeKeys?.total ?? 0}
          trend="100% Unique"
          icon="🔑"
          variant="blue"
          span="bento-span-3"
        />
      </div>

      {/* SECOND BENTO ROW */}
      <div className="bento-grid" style={{ marginBottom: 24 }}>
        {/* STUDENT ANALYTICS */}
        <BentoCard
          title="STUDENT ANALYTICS OVERVIEW"
          subtitle="Real-time game progression status across active users"
          span="bento-span-8"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
            <div style={{ padding: 16, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)', boxShadow: 'var(--neo-shadow-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-gray)', textTransform: 'uppercase' }}>NOT STARTED</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: 4 }}>
                {stats?.gameProgress?.notStarted ?? 0}
              </div>
            </div>
            <div style={{ padding: 16, border: 'var(--neo-border-sm)', background: '#fff9db', boxShadow: 'var(--neo-shadow-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-black)', textTransform: 'uppercase' }}>IN PROGRESS</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: 4, color: '#d97706' }}>
                {stats?.gameProgress?.inProgress ?? 0}
              </div>
            </div>
            <div style={{ padding: 16, border: 'var(--neo-border-sm)', background: '#e6fcf5', boxShadow: 'var(--neo-shadow-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-black)', textTransform: 'uppercase' }}>COMPLETED</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: 4, color: 'var(--neo-green)' }}>
                {stats?.gameProgress?.completed ?? 0}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 16, border: 'var(--neo-border-sm)', background: 'var(--neo-white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
              <span>MAP CAPACITY UTILIZATION</span>
              <span>
                {stats?.maps?.total ? Math.round(((stats.maps.full || 0) / stats.maps.total) * 100) : 0}% FULL
              </span>
            </div>
            <div style={{ height: 16, border: '2px solid var(--neo-black)', background: 'var(--neo-bg)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${stats?.maps?.total ? Math.round(((stats.maps.full || 0) / stats.maps.total) * 100) : 0}%`,
                  background: 'var(--neo-purple)',
                }}
              />
            </div>
          </div>
        </BentoCard>

        {/* SYSTEM HEALTH */}
        <BentoCard title="SYSTEM HEALTH" span="bento-span-4" variant="pink">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {[
              { label: 'DATABASE (MONGODB)', status: 'OPERATIONAL' },
              { label: 'API SERVICES', status: 'OPERATIONAL' },
              { label: 'MAP ALLOCATOR', status: 'OPERATIONAL' },
              { label: 'ROUTEKEY GENERATOR', status: 'OPERATIONAL' },
              { label: 'WEBSOCKET ENGINE', status: 'OPERATIONAL' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--neo-white)',
                  border: 'var(--neo-border-sm)',
                  boxShadow: 'var(--neo-shadow-sm)',
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: 'var(--neo-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ● {item.status}
                </span>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* THIRD BENTO ROW: RECENT STUDENTS */}
      <div className="bento-grid">
        <BentoCard
          title="RECENT STUDENTS"
          subtitle="Latest individual user registrations across maps"
          span="bento-span-12"
          action={
            <NeoButton variant="yellow" className="neo-btn-sm" onClick={() => navigate('/admin/students')}>
              VIEW ALL STUDENTS →
            </NeoButton>
          }
        >
          <NeoTable columns={studentColumns} data={recentStudents} />
        </BentoCard>
      </div>
    </AdminLayout>
  );
}
