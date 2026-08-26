import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import NeoButton from '../../components/NeoButton';
import BentoCard from '../../components/BentoCard';
import NeoInput from '../../components/NeoInput';
import { showToast } from '../../components/Toast';
import { setsService } from '../../api/setsService';

export default function GenerateSetsPage() {
  const navigate = useNavigate();
  const [numberOfSets, setNumberOfSets] = useState('5');
  const [middleQuestionsCount, setMiddleQuestionsCount] = useState('3');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await setsService.generateSets({
        numberOfSets: Number(numberOfSets),
        middleQuestionsCount: Number(middleQuestionsCount),
      });

      showToast(res.message || 'Sets generated successfully!', 'success');
      navigate('/admin/sets');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate sets', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Generate Question Sets" subtitle="Deterministic sequence generator (Q1 identical, middle randomized, Final Q identical)">
      <BentoCard style={{ maxWidth: '600px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', border: '2px solid #000', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#0f172a' }}>📐 Set Architecture Rules</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#334155' }}>
              <li><strong>Question 1:</strong> Always identical for all students.</li>
              <li><strong>Middle Questions:</strong> Randomly drawn and permuted per set without duplicates.</li>
              <li><strong>Final Question:</strong> Always identical for all students (Final victory equation).</li>
            </ul>
          </div>

          <NeoInput
            label="Number of Sets to Generate (e.g. 5)"
            type="number"
            min="1"
            max="20"
            value={numberOfSets}
            onChange={(e) => setNumberOfSets(e.target.value)}
            required
          />

          <NeoInput
            label="Number of Middle Questions per Set (e.g. 3)"
            type="number"
            min="1"
            max="15"
            value={middleQuestionsCount}
            onChange={(e) => setMiddleQuestionsCount(e.target.value)}
            required
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <NeoButton type="button" variant="outline" onClick={() => navigate('/admin/sets')}>
              Cancel
            </NeoButton>
            <NeoButton type="submit" variant="primary" loading={loading}>
              🎲 Generate Sets Now
            </NeoButton>
          </div>
        </form>
      </BentoCard>
    </AdminLayout>
  );
}
