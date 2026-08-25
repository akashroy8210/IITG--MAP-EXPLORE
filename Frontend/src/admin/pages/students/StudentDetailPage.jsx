import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import StatusBadge from '../../components/StatusBadge';
import NeoButton from '../../components/NeoButton';
import LoadingState from '../../components/LoadingState';
import ConfirmDialog from '../../components/ConfirmDialog';
import NeoModal from '../../components/NeoModal';
import { showToast } from '../../components/Toast';
import { studentService } from '../../api/studentService';
import { useAuth } from '../../auth/AuthContext';

export default function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog & Modal state
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '' });
  const [tempPasswordModal, setTempPasswordModal] = useState({ isOpen: false, password: '' });
  const { admin } = useAuth();
  const navigate = useNavigate();

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const data = await studentService.getStudent(id);
      setStudent(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load student details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleStatusToggle = async () => {
    if (!student) return;
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await studentService.updateStudentStatus(student._id, newStatus);
      showToast(`Student #${student.userNumber} ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchStudent();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await studentService.resetPassword(id);
      setTempPasswordModal({ isOpen: true, password: res.temporaryPassword });
      showToast('Password reset successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await studentService.deleteStudent(id);
      showToast(`Student deleted successfully`, 'success');
      navigate('/admin/students');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete student', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingState type="cards" rows={2} />
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h3>STUDENT NOT FOUND</h3>
          <NeoButton variant="black" onClick={() => navigate('/admin/students')}>
            ← BACK TO STUDENTS LIST
          </NeoButton>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              {student.name}
            </h2>
            <StatusBadge status={student.status} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
            USER NUMBER: #{student.userNumber} | USERNAME: <code>{student.username}</code>
          </p>
        </div>

        <NeoButton variant="white" onClick={() => navigate('/admin/students')}>
          ← BACK TO LIST
        </NeoButton>
      </div>

      <div className="bento-grid" style={{ marginBottom: 24 }}>
        {/* DETAILS CARD */}
        <BentoCard title="STUDENT PROFILE & CREDENTIALS" span="bento-span-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>USER NUMBER</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace' }}>#{student.userNumber}</div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>USERNAME</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace' }}>{student.username}</div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{student.email || 'None Provided'}</div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-purple-light)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-purple)' }}>ASSIGNED QUESTION SET</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: 'var(--neo-purple)' }}>
                {student.setsKey?.setsKey || 'Unassigned'}
              </div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-yellow)' }}>
              <div style={{ fontSize: 10, fontWeight: 800 }}>ASSIGNED WORKADVENTURE MAP</div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{student.mapId?.name || 'Unassigned'}</div>
              {student.mapId?.mapUrl && (
                <a
                  href={student.mapId.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-black)', textDecoration: 'underline', marginTop: 4, display: 'inline-block' }}
                >
                  OPEN MAP URL ↗
                </a>
              )}
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: '#ecfdf5' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#047857' }}>PERSONAL MAIN GATE CODE</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: '#047857' }}>
                {student.mainGateCode || 'Auto-generated'}
              </div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>GAME STATUS</div>
              <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', marginTop: 4 }}>
                {student.gameStatus || 'not_started'}
              </div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>HINT PENALTY SECONDS</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>
                {student.totalHintPenaltySeconds || 0}s
              </div>
            </div>
          </div>
        </BentoCard>

        {/* QUICK ACTIONS SIDEBAR */}
        <BentoCard title="MANAGEMENT ACTIONS" span="bento-span-4" variant="yellow">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <NeoButton
              variant={student.status === 'active' ? 'pink' : 'green'}
              onClick={handleStatusToggle}
              style={{ width: '100%' }}
            >
              {student.status === 'active' ? '🚫 DEACTIVATE ACCOUNT' : '✅ ACTIVATE ACCOUNT'}
            </NeoButton>

            <NeoButton variant="purple" onClick={handleResetPassword} style={{ width: '100%' }}>
              🔐 RESET PASSWORD
            </NeoButton>

            <NeoButton
              variant="black"
              onClick={() => setConfirmState({ isOpen: true, type: 'delete' })}
              style={{ width: '100%', marginTop: 12 }}
            >
              🗑️ REMOVE STUDENT
            </NeoButton>
          </div>
        </BentoCard>
      </div>

      {/* CONFIRM DIALOGS */}
      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.type === 'delete'}
        onClose={() => setConfirmState({ isOpen: false, type: '' })}
        onConfirm={handleDeleteStudent}
        title="REMOVE STUDENT ACCOUNT?"
        message={`Are you sure you want to permanently remove Student #${student.userNumber} (${student.name})? This will delete their progress and free up their assigned map slot.`}
        confirmLabel="REMOVE STUDENT"
        confirmVariant="pink"
      />

      {/* RESET PASSWORD MODAL */}
      <NeoModal
        isOpen={tempPasswordModal.isOpen}
        onClose={() => setTempPasswordModal({ isOpen: false, password: '' })}
        title="NEW TEMPORARY PASSWORD"
      >
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          Temporary password generated for <strong>{student.username}</strong>:
        </p>

        <div
          style={{
            padding: 16,
            background: 'var(--neo-yellow)',
            border: 'var(--neo-border)',
            fontFamily: 'monospace',
            fontSize: 22,
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
            showToast('Password copied!', 'success');
          }}
        >
          📋 COPY PASSWORD
        </NeoButton>
      </NeoModal>
    </AdminLayout>
  );
}
