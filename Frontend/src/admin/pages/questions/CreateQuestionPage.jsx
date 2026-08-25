import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import NeoButton from '../../components/NeoButton';
import BentoCard from '../../components/BentoCard';
import NeoInput from '../../components/NeoInput';
import { showToast } from '../../components/Toast';
import { questionService } from '../../api/questionService';

export default function CreateQuestionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    Question: '',
    answer: '',
    nextLocationHint: '',
    hintText: '',
    hintPenalty: '30',
    isFirstPuzzle: false,
    isFinalPuzzle: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Question.trim()) {
      showToast('Question text is required', 'error');
      return;
    }
    if (!formData.answer.trim()) {
      showToast('At least one accepted answer is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        Question: formData.Question.trim(),
        answer: formData.answer.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean),
        nextLocationHint: formData.nextLocationHint.trim() || null,
        hints: formData.hintText.trim()
          ? { text: formData.hintText.trim(), penaltySeconds: Number(formData.hintPenalty || 30) }
          : null,
        isFirstPuzzle: formData.isFirstPuzzle,
        isFinalPuzzle: formData.isFinalPuzzle,
        isActive: true,
      };

      await questionService.createQuestion(payload);
      showToast('Question created successfully!', 'success');
      navigate('/admin/questions');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create question', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create Question" subtitle="Add a new puzzle challenge with question hints and next location directions">
      <BentoCard style={{ maxWidth: '850px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION 1: QUESTION & ANSWERS */}
          <div style={{ background: '#f8fafc', padding: '16px', border: '2px solid #000', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#0f172a' }}>📝 1. Question & Answer Details</h4>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Question / Riddle Text *</label>
              <textarea
                rows={3}
                className="neo-input"
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="e.g. What optical instrument uses curved lenses to observe distant celestial bodies?"
                value={formData.Question}
                onChange={(e) => setFormData({ ...formData, Question: e.target.value })}
                required
              />
            </div>

            <NeoInput
              label="Accepted Answers * (comma-separated for variants)"
              placeholder="e.g. telescope, a telescope, the telescope"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
            />
          </div>

          {/* SECTION 2: QUESTION HINT (FOR SOLVING THE RIDDLE WITH PENALTY) */}
          <div style={{ background: '#fffbeb', padding: '16px', border: '2px solid #000', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#92400e' }}>💡 2. Question Hint (To Help Solve the Riddle)</h4>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#fef3c7', padding: '2px 8px', border: '1px solid #fde68a', color: '#b45309' }}>
                With Time Penalty
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#78350f', margin: '0 0 12px' }}>
              This hint is requested by the student in the popup if they are stuck on this question. Using it incurs a time penalty.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
              <NeoInput
                label="Question Hint Text (Optional)"
                placeholder="e.g. Galileo famously improved this device in 1609"
                value={formData.hintText}
                onChange={(e) => setFormData({ ...formData, hintText: e.target.value })}
              />
              <NeoInput
                label="Penalty (Seconds)"
                type="number"
                value={formData.hintPenalty}
                onChange={(e) => setFormData({ ...formData, hintPenalty: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 3: NEXT LOCATION DIRECTION (SHOWN AFTER ANSWER IS SOLVED) */}
          <div style={{ background: '#f0fdf4', padding: '16px', border: '2px solid #000', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#166534' }}>🗺️ 3. Next Location Clue / Direction (After Solving)</h4>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#dcfce7', padding: '2px 8px', border: '1px solid #bbf7d0', color: '#15803d' }}>
                Shown Upon Correct Answer
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#14532d', margin: '0 0 12px' }}>
              This is <strong>NOT</strong> the question hint. This is the physical/Gather map direction revealed to the student once they solve the answer, telling them where to go next to enter their auto-generated verification code.
            </p>

            <NeoInput
              label="Next Location Instructions / Map Destination"
              placeholder="e.g. Go to Central Library 2nd Floor observation deck"
              value={formData.nextLocationHint}
              onChange={(e) => setFormData({ ...formData, nextLocationHint: e.target.value })}
            />

            {!formData.isFinalPuzzle && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>
                ℹ️ The verification code for this location checkpoint will be <strong>automatically generated as a unique code for each student</strong>.
              </div>
            )}
          </div>

          {/* SECTION 4: PUZZLE ROLE */}
          <div style={{ display: 'flex', gap: '24px', padding: '12px 0', borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={formData.isFirstPuzzle}
                onChange={(e) => setFormData({ ...formData, isFirstPuzzle: e.target.checked, isFinalPuzzle: e.target.checked ? false : formData.isFinalPuzzle })}
              />
              Designate as First Question (Q1 for all students)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={formData.isFinalPuzzle}
                onChange={(e) => setFormData({ ...formData, isFinalPuzzle: e.target.checked, isFirstPuzzle: e.target.checked ? false : formData.isFirstPuzzle })}
              />
              Designate as Final Victory Puzzle
            </label>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <NeoButton type="button" variant="outline" onClick={() => navigate('/admin/questions')}>
              Cancel
            </NeoButton>
            <NeoButton type="submit" variant="primary" loading={loading}>
              Save Question
            </NeoButton>
          </div>
        </form>
      </BentoCard>
    </AdminLayout>
  );
}
