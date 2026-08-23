import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoTable from '../../components/NeoTable';
import NeoButton from '../../components/NeoButton';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../components/Toast';
import { studentService } from '../../api/studentService';
import { mapService } from '../../api/mapService';

export default function BulkCreatePage() {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
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

  const parseCSV = (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const rows = [];

    lines.forEach((line, idx) => {
      // Skip header row if present
      if (idx === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('email'))) {
        return;
      }
      const parts = line.split(',').map((p) => p.trim());
      if (parts[0]) {
        rows.push({
          name: parts[0],
          email: parts[1] || '',
        });
      }
    });

    setParsedRows(rows);
    if (rows.length > 0) {
      showToast(`Parsed ${rows.length} student rows from CSV!`, 'success');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setCsvText(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text) => {
    setCsvText(text);
    parseCSV(text);
  };

  const handleSubmitBulk = async () => {
    if (parsedRows.length === 0) {
      showToast('No valid student rows to upload', 'error');
      return;
    }

    if (availableSlots === 0) {
      showToast('Cannot upload: No available map slots. Please create a new map first.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await studentService.bulkCreateStudents(parsedRows);
      setResults(res);
      const createdCount = res.summary?.created || 0;
      const failedCount = res.summary?.failed || 0;
      if (createdCount > 0) {
        showToast(`Bulk creation completed! Created: ${createdCount}, Failed: ${failedCount}`, 'success');
      } else {
        showToast(`Bulk creation failed: No available map slots. Please create a new map first.`, 'error');
      }
      fetchCapacity();
    } catch (err) {
      if (err.response?.data?.results) {
        setResults(err.response.data);
        showToast(`Bulk creation processed with failures. See details below.`, 'error');
      } else {
        showToast(err.response?.data?.message || 'Failed to execute bulk student creation', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const previewColumns = [
    { header: 'ROW', accessor: 'idx', cell: (_, i) => <strong>#{Number(i) + 1}</strong> },
    { header: 'NAME', accessor: 'name' },
    { header: 'EMAIL', accessor: 'email', cell: (r) => r.email || '—' },
  ];

  const resultColumns = [
    { header: 'STATUS', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'USER NO.', accessor: 'userNumber', cell: (r) => r.userNumber ? <strong>#{r.userNumber}</strong> : '—' },
    { header: 'USERNAME', accessor: 'username', cell: (r) => r.username ? <code>{r.username}</code> : '—' },
    { header: 'NAME', accessor: 'name' },
    { header: 'TEMP PASSWORD', accessor: 'temporaryPassword', cell: (r) => r.temporaryPassword ? <code>{r.temporaryPassword}</code> : '—' },
    { header: 'MAP', accessor: 'mapName', cell: (r) => r.mapName || '—' },
    { header: 'ROUTE KEY', accessor: 'routeKey', cell: (r) => r.routeKey ? <code style={{ color: 'var(--neo-purple)', fontWeight: 800 }}>{r.routeKey}</code> : '—' },
    { header: 'ERROR / NOTE', accessor: 'error', cell: (r) => r.error ? <span style={{ color: 'var(--neo-pink)', fontWeight: 800 }}>⚠️ {r.error}</span> : 'OK' },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
          BULK STUDENT CREATION
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
          Upload a CSV file or paste CSV text containing student names and emails. Strict limit of 10 users per map.
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
            <div style={{ fontSize: 16 }}>⚠️ NO MAP SLOTS AVAILABLE (ALL MAPS ARE FULL)</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              All existing maps hold 10/10 students. You must create a new question map before uploading more students.
            </div>
          </div>
          <NeoButton variant="black" onClick={() => navigate('/admin/maps/create')}>
            + CREATE NEW MAP
          </NeoButton>
        </div>
      )}

      {!results ? (
        <div className="bento-grid">
          {/* FILE DROPZONE & INPUT */}
          <BentoCard title="1. UPLOAD CSV FILE" span="bento-span-6">
            <div
              style={{
                border: 'var(--neo-border)',
                background: 'var(--neo-yellow)',
                boxShadow: 'var(--neo-shadow-sm)',
                padding: 32,
                textAlign: 'center',
                marginBottom: 20,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>
                DROP CSV FILE HERE
              </h4>
              <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 16px' }}>Format: name, email</p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                style={{ fontSize: 12, fontWeight: 800 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="neo-label" style={{ display: 'block', marginBottom: 6 }}>OR PASTE CSV CONTENT DIRECTLY:</label>
              <textarea
                value={csvText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={"name,email\nRahul,rahul@example.com\nAman,aman@example.com\nPriya,priya@example.com"}
                rows={6}
                className="neo-textarea"
              />
            </div>

            <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)', fontSize: 12, fontWeight: 800 }}>
              <span>CURRENT OPEN CAPACITY: </span>
              <strong style={{ color: availableSlots === 0 ? 'var(--neo-pink)' : 'var(--neo-purple)', fontSize: 14 }}>
                {availableSlots !== null ? `${availableSlots} Available Slots` : 'Checking...'}
              </strong>
            </div>
          </BentoCard>

          {/* PREVIEW CARD */}
          <BentoCard
            title={`2. PARSED PREVIEW (${parsedRows.length} ROWS)`}
            span="bento-span-6"
            action={
              parsedRows.length > 0 && (
                <NeoButton
                  variant="purple"
                  onClick={handleSubmitBulk}
                  disabled={loading || availableSlots === 0}
                >
                  {loading ? 'CREATING STUDENTS...' : `CREATE ${parsedRows.length} STUDENTS →`}
                </NeoButton>
              )
            }
          >
            {parsedRows.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--neo-gray)', fontWeight: 700 }}>
                Upload or paste CSV rows to preview before student creation
              </div>
            ) : (
              <>
                {availableSlots !== null && parsedRows.length > availableSlots && (
                  <div style={{ padding: 10, background: 'var(--neo-yellow)', border: 'var(--neo-border-sm)', fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
                    ⚠️ Note: You have {parsedRows.length} students but only {availableSlots} available slots. The first {availableSlots} will be created, and the remaining will fail unless you create more maps.
                  </div>
                )}
                <NeoTable columns={previewColumns} data={parsedRows} />
              </>
            )}
          </BentoCard>
        </div>
      ) : (
        /* RESULTS SUMMARY & TABLE */
        <div className="bento-grid">
          <BentoCard
            title="BULK CREATION RESULTS SUMMARY"
            span="bento-span-12"
            action={
              <div style={{ display: 'flex', gap: 10 }}>
                {results.summary?.failed > 0 && (
                  <NeoButton variant="purple" onClick={() => navigate('/admin/maps/create')}>
                    + CREATE NEW MAP
                  </NeoButton>
                )}
                <NeoButton variant="black" onClick={() => { setResults(null); setParsedRows([]); setCsvText(''); }}>
                  RESET & CREATE MORE
                </NeoButton>
              </div>
            }
          >
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ padding: '16px 24px', background: 'var(--neo-green)', border: 'var(--neo-border-sm)', fontWeight: 900, fontSize: 18 }}>
                ✓ CREATED: {results.summary?.created || 0}
              </div>
              {results.summary?.failed > 0 && (
                <div style={{ padding: '16px 24px', background: 'var(--neo-pink)', color: '#fff', border: 'var(--neo-border-sm)', fontWeight: 900, fontSize: 18 }}>
                  ⚠️ FAILED: {results.summary?.failed}
                </div>
              )}
            </div>

            <NeoTable columns={resultColumns} data={results.results || []} />
          </BentoCard>
        </div>
      )}
    </AdminLayout>
  );
}
