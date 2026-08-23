import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoInput from '../../components/NeoInput';
import NeoButton from '../../components/NeoButton';
import { showToast } from '../../components/Toast';
import { mapService } from '../../api/mapService';

export default function CreateMapPage() {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mapUrl.trim()) {
      setError('Map URL is required');
      return;
    }

    try {
      setLoading(true);
      const res = await mapService.createMap(mapUrl.trim());
      showToast(`Map "${res.map.name}" created successfully with capacity of 10 slots!`, 'success');
      navigate('/admin/maps');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create map. Make sure the URL is valid (http/https).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
          CREATE QUESTION MAP
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
          Admin provides ONLY the question map URL. Backend handles map ID, capacity, and user assignment automatically.
        </p>
      </div>

      <div className="bento-grid">
        <BentoCard title="QUESTION MAP CONFIGURATION" span="bento-span-6">
          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--neo-pink)', color: '#fff', border: 'var(--neo-border-sm)', fontWeight: 800, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <NeoInput
              label="MAP URL (GATHER / WORKADVENTURE)"
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://example.com/question-map/abc123"
              required
            />

            <div style={{ padding: 14, background: 'var(--neo-yellow)', border: 'var(--neo-border-sm)', marginBottom: 20, fontSize: 12, fontWeight: 800 }}>
              📌 AUTOMATIC BACKEND RULES:
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                <li>Capacity fixed at <strong>10 Students</strong> per map</li>
                <li>Initial status set to <strong>AVAILABLE</strong></li>
                <li>Auto-generates sequential map ID & number</li>
                <li>Student map allocator will automatically fill this map</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <NeoButton type="submit" variant="purple" disabled={loading}>
                {loading ? 'CREATING MAP...' : 'CREATE MAP →'}
              </NeoButton>
              <NeoButton variant="white" onClick={() => navigate('/admin/maps')}>
                CANCEL
              </NeoButton>
            </div>
          </form>
        </BentoCard>

        <BentoCard title="AUTOMATIC MAP ALLOCATION SYSTEM" span="bento-span-6" variant="purple">
          <div style={{ padding: 8 }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, marginTop: 0 }}>
              HOW STUDENT MAP ASSIGNMENT WORKS
            </h4>
            <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
              When a new student is created (individually or in bulk), the backend map allocation service automatically claims a slot on the lowest-numbered available map.
            </p>
            <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-white)', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>
              Map 01 → Users 100001–100010 (10/10 FULL)<br />
              Map 02 → Users 100011–100020 (Slot Claimed)<br />
              Map 03 → Standby...
            </div>
          </div>
        </BentoCard>
      </div>
    </AdminLayout>
  );
}
