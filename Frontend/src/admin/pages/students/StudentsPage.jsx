import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoTable from '../../components/NeoTable';
import StatusBadge from '../../components/StatusBadge';
import NeoButton from '../../components/NeoButton';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import NeoModal from '../../components/NeoModal';
import { showToast } from '../../components/Toast';
import { studentService } from '../../api/studentService';
import { mapService } from '../../api/mapService';
import { useAuth } from '../../auth/AuthContext';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mapFilter, setMapFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Dialog & Modal state
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', student: null });
  const [tempPasswordModal, setTempPasswordModal] = useState({ isOpen: false, password: '', username: '' });
  const { admin } = useAuth();
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        mapId: mapFilter || undefined,
      };
      const res = await studentService.getStudents(params);
      setStudents(res.data || []);
      setPagination(res.pagination || { totalPages: 1, total: 0 });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, statusFilter, mapFilter]);

  useEffect(() => {
    mapService.getMaps().then((data) => setMaps(data || [])).catch(() => {});
  }, []);

  const handleStatusToggle = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await studentService.updateStudentStatus(student._id, newStatus);
      showToast(`Student #${student.userNumber} ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleResetPassword = async (student) => {
    try {
      const res = await studentService.resetPassword(student._id);
      setTempPasswordModal({
        isOpen: true,
        password: res.temporaryPassword,
        username: res.username,
      });
      showToast(`Password reset for ${res.username}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const handleDeleteStudent = async () => {
    if (!confirmState.student) return;
    try {
      await studentService.deleteStudent(confirmState.student._id);
      showToast(`Student #${confirmState.student.userNumber} deleted`, 'success');
      setConfirmState({ isOpen: false, type: '', student: null });
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete student', 'error');
    }
  };

  const columns = [
    { header: 'USER NO.', accessor: 'userNumber', cell: (r) => <strong>#{r.userNumber}</strong> },
    { header: 'USERNAME', accessor: 'username', cell: (r) => <code>{r.username}</code> },
    { header: 'NAME', accessor: 'name' },
    { header: 'EMAIL', accessor: 'email', cell: (r) => r.email || '—' },
    { header: 'MAP', accessor: 'mapId', cell: (r) => r.mapId?.name || 'Unassigned' },
    { header: 'ROUTE KEY', accessor: 'routeKey', cell: (r) => <code style={{ color: 'var(--neo-purple)', fontWeight: 800 }}>{r.routeKey || 'N/A'}</code> },
    { header: 'STATUS', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'ACTIONS',
      cell: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <NeoButton variant="white" className="neo-btn-sm" onClick={() => navigate(`/admin/students/${r._id}`)}>
            VIEW
          </NeoButton>
          <NeoButton
            variant={r.status === 'active' ? 'yellow' : 'green'}
            className="neo-btn-sm"
            onClick={() => handleStatusToggle(r)}
          >
            {r.status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
          </NeoButton>
          <NeoButton variant="purple" className="neo-btn-sm" onClick={() => handleResetPassword(r)}>
            RESET PW
          </NeoButton>
          <NeoButton
            variant="pink"
            className="neo-btn-sm"
            onClick={() => setConfirmState({ isOpen: true, type: 'delete', student: r })}
          >
            REMOVE
          </NeoButton>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            STUDENT MANAGEMENT
          </h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
            Manage individual student accounts, map assignments, and route keys
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <NeoButton variant="purple" onClick={() => navigate('/admin/students/create')}>
            + CREATE STUDENT
          </NeoButton>
          <NeoButton variant="yellow" onClick={() => navigate('/admin/students/bulk-create')}>
            📦 BULK CREATE
          </NeoButton>
        </div>
      </div>

      <BentoCard span="bento-span-12">
        {/* CONTROLS ROW */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="SEARCH BY NAME, USERNAME, EMAIL, ROUTEKEY..." />

          <div style={{ width: 180 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neo-select"
            >
              <option value="">ALL STATUSES</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
            </select>
          </div>

          <div style={{ width: 180 }}>
            <select
              value={mapFilter}
              onChange={(e) => setMapFilter(e.target.value)}
              className="neo-select"
            >
              <option value="">ALL MAPS</option>
              {maps.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <NeoTable columns={columns} data={students} loading={loading} emptyMessage="No students match your search filters" />

        {/* PAGINATION */}
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={(p) => setPage(p)}
        />
      </BentoCard>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: '', student: null })}
        onConfirm={handleDeleteStudent}
        title="REMOVE STUDENT ACCOUNT?"
        message={`Are you sure you want to permanently remove Student #${confirmState.student?.userNumber} (${confirmState.student?.name})? This will delete their progress and free up their assigned map slot.`}
        confirmLabel="REMOVE STUDENT"
        confirmVariant="pink"
      />

      {/* RESET PASSWORD RESULT MODAL */}
      <NeoModal
        isOpen={tempPasswordModal.isOpen}
        onClose={() => setTempPasswordModal({ isOpen: false, password: '', username: '' })}
        title="PASSWORD RESET SUCCESSFUL"
      >
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          A new temporary password has been generated for <strong>{tempPasswordModal.username}</strong>:
        </p>

        <div
          style={{
            padding: 16,
            background: 'var(--neo-yellow)',
            border: 'var(--neo-border)',
            boxShadow: 'var(--neo-shadow-sm)',
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: 2,
            marginBottom: 20,
          }}
        >
          {tempPasswordModal.password}
        </div>

        <NeoButton
          variant="purple"
          style={{ width: '100%' }}
          onClick={() => {
            navigator.clipboard.writeText(tempPasswordModal.password);
            showToast('Temporary password copied to clipboard', 'success');
          }}
        >
          📋 COPY TEMPORARY PASSWORD
        </NeoButton>
      </NeoModal>
    </AdminLayout>
  );
}
