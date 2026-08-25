import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import NeoButton from '../../components/NeoButton';
import BentoCard from '../../components/BentoCard';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../components/Toast';
import { questionService } from '../../api/questionService';

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | first | final | middle

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionService.listQuestions();
      setQuestions(res.questions || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, text) => {
    if (!window.confirm(`Are you sure you want to delete question: "${text?.slice(0, 30)}..."?`)) return;
    try {
      await questionService.deleteQuestion(id);
      showToast('Question deleted successfully', 'success');
      fetchQuestions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete question', 'error');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'first') return q.isFirstPuzzle;
    if (filter === 'final') return q.isFinalPuzzle;
    if (filter === 'middle') return !q.isFirstPuzzle && !q.isFinalPuzzle;
    return true;
  });

  return (
    <AdminLayout title="Question Bank" subtitle="Manage all campus puzzles and verification codes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <NeoButton variant={filter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All ({questions.length})
          </NeoButton>
          <NeoButton variant={filter === 'first' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('first')}>
            First ({questions.filter((q) => q.isFirstPuzzle).length})
          </NeoButton>
          <NeoButton variant={filter === 'middle' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('middle')}>
            Middle Pool ({questions.filter((q) => !q.isFirstPuzzle && !q.isFinalPuzzle).length})
          </NeoButton>
          <NeoButton variant={filter === 'final' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('final')}>
            Final ({questions.filter((q) => q.isFinalPuzzle).length})
          </NeoButton>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <NeoButton variant="secondary" onClick={() => navigate('/admin/questions/upload')}>
            📤 Bulk Upload (CSV)
          </NeoButton>
          <NeoButton variant="primary" onClick={() => navigate('/admin/questions/create')}>
            ➕ Create Question
          </NeoButton>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold' }}>Loading Questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <BentoCard>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3>No questions found</h3>
            <p style={{ margin: '12px 0 20px' }}>Create questions or use bulk upload to populate the question bank.</p>
            <NeoButton variant="primary" onClick={() => navigate('/admin/questions/create')}>
              ➕ Add First Question
            </NeoButton>
          </div>
        </BentoCard>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredQuestions.map((q, idx) => (
            <BentoCard key={q._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '900', color: '#64748b' }}>#{idx + 1}</span>
                    {q.isFirstPuzzle && <span className="status-badge status-active" style={{ background: '#dcfce7', color: '#15803d' }}>FIRST QUESTION</span>}
                    {q.isFinalPuzzle && <span className="status-badge status-full" style={{ background: '#ffe4e6', color: '#be123c' }}>FINAL PUZZLE</span>}
                    {!q.isFirstPuzzle && !q.isFinalPuzzle && <span className="status-badge status-available">MIDDLE PUZZLE</span>}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px', color: '#0f172a' }}>{q.Question}</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '12px 16px', border: '2px solid #000', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                      <div>
                        <strong>Accepted Answers:</strong> <span style={{ background: '#e2e8f0', padding: '2px 6px', fontWeight: 'bold' }}>{q.answer?.join(', ') || 'N/A'}</span>
                      </div>
                      {!q.isFinalPuzzle && (
                        <div>
                          <strong>Location Checkpoint Code:</strong>{' '}
                          <span style={{ fontWeight: 'bold', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', border: '1px solid #bae6fd', borderRadius: '3px', fontSize: '0.8rem' }}>
                            🎲 Auto-Generated Unique per Student
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '4px' }}>
                      {q.hints?.text ? (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: '4px', color: '#92400e' }}>
                          <strong>💡 Question Hint (costs {q.hints.penaltySeconds}s):</strong>
                          <div style={{ marginTop: '2px', color: '#78350f' }}>{q.hints.text}</div>
                        </div>
                      ) : (
                        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '4px', color: '#64748b' }}>
                          <em>No question hint configured</em>
                        </div>
                      )}

                      {q.nextLocationHint ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '4px', color: '#166534' }}>
                          <strong>🗺️ Next Location Direction (after solve):</strong>
                          <div style={{ marginTop: '2px', color: '#14532d' }}>{q.nextLocationHint}</div>
                        </div>
                      ) : (
                        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '4px', color: '#64748b' }}>
                          <em>No location direction</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <NeoButton variant="danger" size="sm" onClick={() => handleDelete(q._id, q.Question)}>
                    🗑️ Delete
                  </NeoButton>
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
