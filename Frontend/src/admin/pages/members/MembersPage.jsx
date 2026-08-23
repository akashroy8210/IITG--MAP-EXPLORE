import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoTable from '../../components/NeoTable';
import StatusBadge from '../../components/StatusBadge';
import NeoButton from '../../components/NeoButton';
import LoadingState from '../../components/LoadingState';
import { showToast } from '../../components/Toast';
import { adminService } from '../../api/adminService';
import { useAuth } from '../../auth/AuthContext';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { admin } = useAuth();
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMembers();
      setMembers(data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch admin members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleStatusToggle = async (member) => {
    const newStatus = !member.isActive;
    try {
      await adminService.updateMemberStatus(member._id, newStatus);
      showToast(`Member ${member.name} ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchMembers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update member status', 'error');
    }
  };

  const columns = [
    { header: 'NAME', accessor: 'name', cell: (r) => <strong>{r.name}</strong> },
    { header: 'EMAIL ADDRESS', accessor: 'email', cell: (r) => <code>{r.email}</code> },
    { header: 'ROLE', accessor: 'role', cell: (r) => <StatusBadge status={r.role} /> },
    { header: 'STATUS', accessor: 'isActive', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { header: 'CREATED AT', accessor: 'createdAt', cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      header: 'ACTIONS',
      cell: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {admin?.role === 'ADMIN' && r._id !== admin.id && (
            <NeoButton
              variant={r.isActive ? 'pink' : 'green'}
              className="neo-btn-sm"
              onClick={() => handleStatusToggle(r)}
            >
              {r.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
            </NeoButton>
          )}
          {r._id === admin.id && (
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-purple)' }}>(YOU)</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            ADMIN & DEVOPS MEMBERS
          </h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
            System operators who manage student accounts and map configurations. Authenticate via Email + Password.
          </p>
        </div>

        {admin?.role === 'ADMIN' && (
          <NeoButton variant="purple" onClick={() => navigate('/admin/members/add')}>
            + ADD MEMBER
          </NeoButton>
        )}
      </div>

      <BentoCard span="bento-span-12">
        <NeoTable columns={columns} data={members} loading={loading} emptyMessage="No admin members found" />
      </BentoCard>
    </AdminLayout>
  );
}
