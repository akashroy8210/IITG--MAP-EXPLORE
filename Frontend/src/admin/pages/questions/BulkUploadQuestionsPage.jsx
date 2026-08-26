import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import NeoButton from '../../components/NeoButton';
import BentoCard from '../../components/BentoCard';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../components/Toast';
import { questionService } from '../../api/questionService';

/**
 * Robust CSV parser compliant with RFC 4180
 * Correctly handles embedded commas, quotes, and newlines inside quoted fields.
 */
function parseRFC4180CSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      currentVal = '';
      if (currentRow.some((col) => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((col) => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export default function BulkUploadQuestionsPage() {
  const navigate = useNavigate();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);

  const sampleCsv = `Question,answer,nextLocationHint,hintText,hintPenalty,isFirst,isFinal
"What optical instrument uses lenses to observe stars?","telescope, a telescope","Go to Central Library observation desk","Galileo used it",30,true,false
"What phenomenon describes bending of light in glass?","refraction","Search near Physics Dept Core 4","Think of prism",30,false,false
"Solve the equation on New SAC chalkboard: 36 - 2 + 1","35","Proceed to Main Gate!","Standard BODMAS",30,false,true`;

  const parseCsv = () => {
    if (!csvText.trim()) {
      showToast('Please paste CSV content first', 'error');
      return;
    }

    const rawGrid = parseRFC4180CSV(csvText.trim());
    if (rawGrid.length < 2) {
      showToast('CSV must include headers and at least 1 row of data', 'error');
      return;
    }

    const rawHeaders = rawGrid[0];
    const headerKeyMap = {};

    rawHeaders.forEach((h, idx) => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean === 'question' || clean === 'questiontext' || clean === 'riddle') headerKeyMap[idx] = 'Question';
      else if (clean === 'answer' || clean === 'answers' || clean === 'acceptedanswers') headerKeyMap[idx] = 'answer';
      else if (clean === 'nextlocationhint' || clean === 'nextlocation' || clean === 'nextclue' || clean === 'locationclue' || clean === 'locationhint') headerKeyMap[idx] = 'nextLocationHint';
      else if (clean === 'hint' || clean === 'hinttext' || clean === 'questionhint' || clean === 'hints') headerKeyMap[idx] = 'hintText';
      else if (clean === 'hintpenalty' || clean === 'penalty' || clean === 'penaltyseconds') headerKeyMap[idx] = 'hintPenalty';
      else if (clean === 'isfirst' || clean === 'isfirstpuzzle' || clean === 'first') headerKeyMap[idx] = 'isFirst';
      else if (clean === 'isfinal' || clean === 'isfinalpuzzle' || clean === 'final') headerKeyMap[idx] = 'isFinal';
      else headerKeyMap[idx] = h;
    });

    const parsed = [];
    for (let r = 1; r < rawGrid.length; r++) {
      const row = rawGrid[r];
      const rowObj = {};
      row.forEach((val, idx) => {
        const key = headerKeyMap[idx] || `col_${idx}`;
        rowObj[key] = val;
      });

      if (rowObj.Question) {
        parsed.push(rowObj);
      }
    }

    if (parsed.length === 0) {
      showToast('No valid questions parsed. Check header row formatting.', 'error');
      return;
    }

    setParsedRows(parsed);
    setUploadSummary(null);
    showToast(`Successfully parsed ${parsed.length} questions!`, 'success');
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) {
      showToast('No parsed questions to upload', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await questionService.bulkUploadQuestions(parsedRows);
      setUploadSummary(res.summary);
      showToast(`Upload complete: ${res.summary.successful} successful, ${res.summary.failed} failed`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Bulk Upload Questions" subtitle="Import questions via CSV with auto-generated numeric verification codes">
      <div style={{ display: 'grid', gap: '20px', maxWidth: '1200px' }}>
        <BentoCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px' }}>Paste CSV Content</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neo-gray)' }}>
                Headers supported: <code>Question</code>, <code>answer</code>, <code>nextLocationHint</code>, <code>hintText</code>, <code>hintPenalty</code>, <code>isFirst</code>, <code>isFinal</code>
              </p>
            </div>
            <NeoButton variant="outline" size="sm" onClick={() => setCsvText(sampleCsv)}>
              Load Sample Template
            </NeoButton>
          </div>

          <textarea
            rows={8}
            className="neo-input"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder={`Question,answer,nextLocationHint,hintText,hintPenalty,isFirst,isFinal\n"What is ...?","answer1, answer2","Location clue","Hint...",30,false,false`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
            <NeoButton variant="outline" onClick={() => navigate('/admin/questions')}>
              Cancel
            </NeoButton>
            <NeoButton variant="primary" onClick={parseCsv}>
              Parse & Preview CSV →
            </NeoButton>
          </div>
        </BentoCard>

        {parsedRows.length > 0 && (
          <BentoCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0 }}>Parsed Preview ({parsedRows.length} Questions)</h3>
              <NeoButton variant="success" onClick={handleUpload} loading={loading}>
                🚀 Upload All Questions ({parsedRows.length})
              </NeoButton>
            </div>

            {uploadSummary && (
              <div style={{ padding: '12px', background: '#f8fafc', border: '2px solid #000', borderRadius: '4px', marginBottom: '16px', display: 'flex', gap: '20px' }}>
                <div>Total: <strong>{uploadSummary.total}</strong></div>
                <div style={{ color: '#16a34a' }}>Successful: <strong>{uploadSummary.successful}</strong></div>
                <div style={{ color: '#dc2626' }}>Failed: <strong>{uploadSummary.failed}</strong></div>
              </div>
            )}

            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #000', background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>#</th>
                    <th style={{ padding: '10px 8px', minWidth: '220px' }}>Question / Riddle</th>
                    <th style={{ padding: '10px 8px', minWidth: '120px' }}>Answer(s)</th>
                    <th style={{ padding: '10px 8px', minWidth: '160px' }}>💡 Question Hint</th>
                    <th style={{ padding: '10px 8px', minWidth: '160px' }}>🗺️ Next Location Clue</th>
                    <th style={{ padding: '10px 8px' }}>Code</th>
                    <th style={{ padding: '10px 8px' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{i + 1}</td>
                      <td style={{ padding: '8px', fontWeight: '500' }}>{r.Question || r.question}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 6px', border: '1px solid #cbd5e1' }}>
                          {r.answer || r.answers}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        {r.hintText || r.hint ? (
                          <div style={{ color: '#92400e', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                            <div>{r.hintText || r.hint}</div>
                            <small style={{ fontWeight: 'bold' }}>Penalty: {r.hintPenalty || 30}s</small>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        {r.nextLocationHint || r.locationClue ? (
                          <div style={{ color: '#166534', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                            {r.nextLocationHint || r.locationClue}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', color: '#0369a1' }}>
                        (Auto-generated)
                      </td>
                      <td style={{ padding: '8px' }}>
                        {String(r.isFirst).toLowerCase() === 'true' || String(r.isFirstPuzzle).toLowerCase() === 'true' ? (
                          <span className="status-badge status-active" style={{ background: '#dcfce7', color: '#15803d' }}>FIRST</span>
                        ) : String(r.isFinal).toLowerCase() === 'true' || String(r.isFinalPuzzle).toLowerCase() === 'true' ? (
                          <span className="status-badge status-full" style={{ background: '#ffe4e6', color: '#be123c' }}>FINAL</span>
                        ) : (
                          <span className="status-badge status-available">MIDDLE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}
      </div>
    </AdminLayout>
  );
}
