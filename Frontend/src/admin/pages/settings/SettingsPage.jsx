import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../auth/AuthContext';

export default function SettingsPage() {
  const { admin } = useAuth();

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
          SYSTEM SETTINGS & ENVIRONMENT
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
          Overview of system architecture settings, admin session metadata, and auto-allocation rules.
        </p>
      </div>

      <div className="bento-grid">
        {/* CURRENT ADMIN PROFILE */}
        <BentoCard title="CURRENT SESSION PROFILE" span="bento-span-6" variant="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ padding: 12, background: 'var(--neo-white)', border: 'var(--neo-border-sm)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>NAME</div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{admin?.name || 'Administrator'}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--neo-white)', border: 'var(--neo-border-sm)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>EMAIL</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace' }}>{admin?.email || 'admin@iitg.ac.in'}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--neo-white)', border: 'var(--neo-border-sm)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)', marginBottom: 4 }}>ROLE</div>
              <StatusBadge status={admin?.role || 'ADMIN'} />
            </div>
          </div>
        </BentoCard>

        {/* SYSTEM ENGINE CONFIGURATION */}
        <BentoCard title="STUDENT ENGINE CONSTANTS" span="bento-span-6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[
              { label: 'MAP CAPACITY LIMIT', val: '10 USERS / MAP (FIXED)' },
              { label: 'USER NUMBER SEQUENCE', val: '100001 → ATOMIC INCREMENT' },
              { label: 'ROUTE KEY FORMAT', val: '8-CHAR ALPHANUMERIC (UNIQUE)' },
              { label: 'PASSWORD ENCRYPTION', val: 'BCRYPT (SALT ROUNDS: 12)' },
              { label: 'SESSION TIMEOUT', val: '8 HOURS (ADMIN JWT)' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: 'var(--neo-border-sm)',
                  background: 'var(--neo-surface)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--neo-purple)' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </AdminLayout>
  );
}
