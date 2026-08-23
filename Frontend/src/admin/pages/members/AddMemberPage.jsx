import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoInput from '../../components/NeoInput';
import NeoButton from '../../components/NeoButton';
import NeoModal from '../../components/NeoModal';
import { showToast } from '../../components/Toast';
import { adminService } from '../../api/adminService';

export default function AddMemberPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVOPS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdMember, setCreatedMember] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email) {
      setError('Name and Email are required');
      return;
    }

    try {
      setLoading(true);
      const res = await adminService.createMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });

      setCreatedMember({
        name: res.member.name,
        email: res.member.email,
        role: res.member.role,
        temporaryPassword: res.temporaryPassword,
      });

      showToast(`Member ${res.member.name} created successfully!`, 'success');
      setName('');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
          ADD ADMIN / DEVOPS MEMBER
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
          Members log in using Email + Password. Roles dictate operational permissions.
        </p>
      </div>

      <div className="bento-grid">
        <BentoCard title="MEMBER REGISTRATION FORM" span="bento-span-6">
          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--neo-pink)', color: '#fff', border: 'var(--neo-border-sm)', fontWeight: 800, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <NeoInput
              label="FULL NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              required
            />

            <NeoInput
              label="EMAIL ADDRESS"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@iitg.ac.in"
              required
            />

            <NeoInput
              label="ASSIGN ROLE"
              type="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="DEVOPS">DEVOPS (Student & Map Management)</option>
              <option value="ADMIN">ADMIN (Full System Access)</option>
            </NeoInput>

            <div style={{ padding: 12, background: 'var(--neo-yellow)', border: 'var(--neo-border-sm)', marginBottom: 20, fontSize: 12, fontWeight: 800 }}>
              🔐 SECURITY NOTICE: A temporary login password will be generated automatically and displayed once upon submission.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <NeoButton type="submit" variant="purple" disabled={loading}>
                {loading ? 'CREATING MEMBER...' : 'ADD MEMBER →'}
              </NeoButton>
              <NeoButton variant="white" onClick={() => navigate('/admin/members')}>
                CANCEL
              </NeoButton>
            </div>
          </form>
        </BentoCard>
      </div>

      {/* MEMBER CREATED RESULT MODAL */}
      <NeoModal
        isOpen={!!createdMember}
        onClose={() => setCreatedMember(null)}
        title="✓ MEMBER ACCOUNT CREATED"
      >
        {createdMember && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Share these credentials with <strong>{createdMember.name}</strong> ({createdMember.role}):
            </p>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>LOGIN EMAIL</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace' }}>{createdMember.email}</div>
            </div>

            <div style={{ padding: 14, border: 'var(--neo-border-sm)', background: 'var(--neo-yellow)', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800 }}>TEMPORARY PASSWORD</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2 }}>{createdMember.temporaryPassword}</div>
            </div>

            <NeoButton
              variant="purple"
              style={{ width: '100%' }}
              onClick={() => {
                navigator.clipboard.writeText(`Email: ${createdMember.email}\nPassword: ${createdMember.temporaryPassword}`);
                showToast('Member login credentials copied!', 'success');
              }}
            >
              📋 COPY CREDENTIALS
            </NeoButton>
          </div>
        )}
      </NeoModal>
    </AdminLayout>
  );
}
