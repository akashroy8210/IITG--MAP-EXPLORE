import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import NeoButton from '../../components/NeoButton';
import BentoCard from '../../components/BentoCard';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../components/Toast';
import { setsService } from '../../api/setsService';

export default function SetsPage() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const res = await setsService.listSets();
      setSets(res.sets || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch sets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToStudents = async () => {
    if (!window.confirm('Assign these predefined Sets round-robin to all unassigned students?')) return;
    try {
      setAssigning(true);
      const res = await setsService.assignSets();
      showToast(res.message || 'Sets assigned successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign sets', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteSet = async (id, setsKey) => {
    if (!window.confirm(`Are you sure you want to delete Question Set "${setsKey}"? Any students assigned to this set will be unassigned.`)) return;
    try {
      await setsService.deleteSet(id);
      showToast(`Set "${setsKey}" deleted successfully!`, 'success');
      fetchSets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete set', 'error');
    }
  };

  const handleDeleteAllSets = async () => {
    if (!window.confirm('⚠️ Are you sure you want to DELETE ALL question sets? This will remove all sets and unassign them from all students.')) return;
    try {
      setClearing(true);
      const res = await setsService.deleteAllSets();
      showToast(res.message || 'All sets deleted successfully!', 'success');
      fetchSets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete all sets', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <AdminLayout title="Question Sets" subtitle="Predefined deterministic question sequences assigned to students">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Active Sets: {sets.length}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {sets.length > 0 && (
            <NeoButton variant="danger" onClick={handleDeleteAllSets} loading={clearing}>
              🗑️ Clear All Sets
            </NeoButton>
          )}
          <NeoButton variant="secondary" onClick={handleAssignToStudents} loading={assigning} disabled={sets.length === 0}>
            🔄 Assign Sets to Students
          </NeoButton>
          <NeoButton variant="primary" onClick={() => navigate('/admin/sets/generate')}>
            🎲 Generate New Sets
          </NeoButton>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold' }}>Loading Question Sets...</div>
      ) : sets.length === 0 ? (
        <BentoCard>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3>No Question Sets Configured</h3>
            <p style={{ margin: '12px 0 20px' }}>Generate deterministic sets ensuring Q1 and Final Q are identical for all students with randomized middle questions.</p>
            <NeoButton variant="primary" onClick={() => navigate('/admin/sets/generate')}>
              🎲 Generate Sets Now
            </NeoButton>
          </div>
        </BentoCard>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {sets.map((s, idx) => (
            <BentoCard key={s._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #000', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="brand-badge" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                    {s.setsKey}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{s.questions?.length || 0} Stages</span>
                </div>

                <div>
                  <NeoButton variant="danger" size="sm" onClick={() => handleDeleteSet(s._id, s.setsKey)}>
                    🗑️ Delete Set
                  </NeoButton>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.questions?.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: qIdx === 0 ? '#f0fdf4' : qIdx === s.questions.length - 1 ? '#fff1f2' : '#f8fafc',
                      border: '1px solid #000',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', minWidth: '70px' }}>Stage {qIdx + 1}:</span>
                    {qIdx === 0 && <span className="status-badge status-active" style={{ background: '#dcfce7', color: '#15803d' }}>FIRST</span>}
                    {qIdx === s.questions.length - 1 && <span className="status-badge status-full" style={{ background: '#ffe4e6', color: '#be123c' }}>FINAL</span>}
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{q?.Question || 'Question reference'}</span>
                    {qIdx !== s.questions.length - 1 && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', border: '1px solid #bae6fd', borderRadius: '3px' }}>
                        🎲 Auto-Generated Code per Student
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
