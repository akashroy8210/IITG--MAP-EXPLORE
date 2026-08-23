import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoInput from '../../components/NeoInput';
import NeoButton from '../../components/NeoButton';
import NeoModal from '../../components/NeoModal';
import { showToast } from '../../components/Toast';
import { studentService } from '../../api/studentService';
import { mapService } from '../../api/mapService';

export default function CreateStudentPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdStudent, setCreatedStudent] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(null);
  const navigate = useNavigate();

  const fetchCapacity = async () => {
    try {
      const maps = await mapService.getMaps();
      const openSlots = maps.reduce((acc, m) => acc + Math.max(0, m.capacity - (m.assignedCount || 0)), 0);
      setAvailableSlots(openSlots);
    } catch {
      setAvailableSlots(null);
    }
  };

  useEffect(() => {
    fetchCapacity();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (availableSlots === 0) {
      setError('Cannot create student: No map slots available. All question maps have reached their maximum limit of 10 students. Please create a new map first.');
      return;
    }

    if (!name.trim()) {
      setError('Student name is required');
      return;
    }

    try {
      setLoading(true);
      const res = await studentService.createStudent({
        name: name.trim(),
        email: email.trim() || undefined,
      });

      setCreatedStudent({
        userNumber: res.student.userNumber,
        username: res.student.username,
        temporaryPassword: res.temporaryPassword,
        mapName: res.student.map?.name || 'Assigned Map',
        routeKey: res.student.routeKey,
        name: res.student.name,
      });

      showToast(`Student ${res.student.username} created successfully!`, 'success');
      setName('');
      setEmail('');
      fetchCapacity();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student. All maps are full (10 max per map). Please create a new map first.');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdStudent) return;
    const text = `STUDENT CREDENTIALS
-------------------
User Number: ${createdStudent.userNumber}
Username: ${createdStudent.username}
Temporary Password: ${createdStudent.temporaryPassword}
Map: ${createdStudent.mapName}
Route Key: ${createdStudent.routeKey}`;
    navigator.clipboard.writeText(text);
    showToast('All credentials copied to clipboard!', 'success');
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
          CREATE SINGLE STUDENT
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
          Provide the student's name and optional email. All credentials & map slots are allocated with strict 10 users/map limit.
        </p>
      </div>

      {availableSlots === 0 && (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--neo-pink)',
            color: '#fff',
            border: 'var(--neo-border)',
            boxShadow: 'var(--neo-shadow)',
            fontWeight: 800,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 16 }}>⚠️ NO AVAILABLE MAP SLOTS (MAP CAPACITY FULL)</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              All maps have reached the maximum limit of 10 students. You must create a new question map before creating more students.
            </div>
          </div>
          <NeoButton variant="black" onClick={() => navigate('/admin/maps/create')}>
            + CREATE NEW MAP
          </NeoButton>
        </div>
      )}

      <div className="bento-grid">
        <BentoCard title="STUDENT INFORMATION FORM" span="bento-span-6">
          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--neo-pink)', color: '#fff', border: 'var(--neo-border-sm)', fontWeight: 800, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <NeoInput
              label="STUDENT FULL NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />

            <NeoInput
              label="EMAIL ADDRESS (OPTIONAL)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
            />

            <div style={{ padding: 14, background: 'var(--neo-purple-light)', border: 'var(--neo-border-sm)', marginBottom: 20, fontSize: 12, fontWeight: 700 }}>
              💡 <strong>STRICT 10 USERS / MAP RULE:</strong> Max 10 students per map. If full, student creation stops until you add a new map.
              {availableSlots !== null && (
                <div style={{ marginTop: 6, fontWeight: 900, color: availableSlots > 0 ? 'var(--neo-black)' : 'var(--neo-pink)' }}>
                  Current Available Map Slots: {availableSlots}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <NeoButton type="submit" variant="purple" disabled={loading || availableSlots === 0}>
                {loading ? 'GENERATING CREDENTIALS...' : 'CREATE STUDENT →'}
              </NeoButton>
              <NeoButton variant="white" onClick={() => navigate('/admin/students')}>
                CANCEL
              </NeoButton>
            </div>
          </form>
        </BentoCard>

        {/* QUICK LINK CARD */}
        <BentoCard title="MAP CAPACITY MONITOR" span="bento-span-6" variant="yellow">
          <div style={{ padding: 8 }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, marginTop: 0 }}>
              QUESTION MAP ASSIGNMENT
            </h4>
            <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>
              Each virtual question map holds strictly 10 students. No overflow or fallback is permitted.
            </p>
            <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-white)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800 }}>TOTAL AVAILABLE SLOTS REMAINING:</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-heading)', color: availableSlots === 0 ? 'var(--neo-pink)' : 'var(--neo-purple)', marginTop: 4 }}>
                {availableSlots !== null ? `${availableSlots} SLOTS` : 'Checking...'}
              </div>
            </div>
            <NeoButton variant="black" onClick={() => navigate('/admin/maps')}>
              🗺️ VIEW ALL MAPS
            </NeoButton>
          </div>
        </BentoCard>
      </div>

      {/* CREATION RESULT MODAL */}
      <NeoModal
        isOpen={!!createdStudent}
        onClose={() => setCreatedStudent(null)}
        title="✓ STUDENT CREATED SUCCESSFULLY"
        maxWidth={580}
      >
        {createdStudent && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', marginTop: 0 }}>
              Share these generated credentials with student <strong>{createdStudent.name}</strong>:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>USER NUMBER</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace' }}>#{createdStudent.userNumber}</div>
              </div>

              <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>USERNAME</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace' }}>{createdStudent.username}</div>
              </div>

              <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-yellow)', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, fontWeight: 800 }}>TEMPORARY PASSWORD</div>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2 }}>{createdStudent.temporaryPassword}</div>
              </div>

              <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-gray)' }}>ASSIGNED MAP</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{createdStudent.mapName}</div>
              </div>

              <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-purple-light)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neo-purple)' }}>ROUTE KEY</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: 'var(--neo-purple)' }}>{createdStudent.routeKey}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <NeoButton variant="purple" style={{ flex: 1 }} onClick={copyCredentials}>
                📋 COPY ALL CREDENTIALS
              </NeoButton>
              <NeoButton variant="black" onClick={() => setCreatedStudent(null)}>
                DONE
              </NeoButton>
            </div>
          </div>
        )}
      </NeoModal>
    </AdminLayout>
  );
}
