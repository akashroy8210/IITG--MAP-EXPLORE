import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoButton from '../../components/NeoButton';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import { showToast } from '../../components/Toast';
import { mapService } from '../../api/mapService';

export default function MapsPage() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMaps = async () => {
    try {
      setLoading(true);
      const data = await mapService.getMaps();
      setMaps(data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch question maps', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            QUESTION MAP MANAGEMENT
          </h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
            Each map hosts a maximum capacity of 10 students. Backend automatically manages slot allocations.
          </p>
        </div>

        <NeoButton variant="purple" onClick={() => navigate('/admin/maps/create')}>
          + CREATE QUESTION MAP
        </NeoButton>
      </div>

      {loading ? (
        <LoadingState type="cards" rows={4} />
      ) : maps.length === 0 ? (
        <BentoCard span="bento-span-12">
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>
              NO QUESTION MAPS FOUND
            </h4>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', marginBottom: 20 }}>
              Create your first question map by providing its Gather / WorkAdventure URL.
            </p>
            <NeoButton variant="purple" onClick={() => navigate('/admin/maps/create')}>
              + CREATE FIRST MAP
            </NeoButton>
          </div>
        </BentoCard>
      ) : (
        <div className="bento-grid">
          {maps.map((map) => {
            const isFull = map.status === 'full' || map.assignedCount >= map.capacity;
            const percentage = Math.min(100, Math.round((map.assignedCount / map.capacity) * 100));

            return (
              <BentoCard
                key={map._id}
                span="bento-span-4"
                variant={isFull ? 'pink' : 'white'}
                badgeText={`MAP #${String(map.mapNumber).padStart(2, '0')}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, margin: 0 }}>
                    {map.name}
                  </h3>
                  <StatusBadge status={isFull ? 'full' : 'available'} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-gray)', textTransform: 'uppercase', marginBottom: 4 }}>
                    MAP URL
                  </div>
                  <a
                    href={map.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--neo-purple)',
                      wordBreak: 'break-all',
                      textDecoration: 'underline',
                    }}
                  >
                    {map.mapUrl}
                  </a>
                </div>

                {/* CAPACITY PROGRESS BAR */}
                <div style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-surface)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
                    <span>CAPACITY ASSIGNMENT</span>
                    <span>{map.assignedCount} / {map.capacity} USERS</span>
                  </div>

                  <div style={{ height: 14, border: '2px solid var(--neo-black)', background: 'var(--neo-white)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: isFull ? 'var(--neo-pink)' : 'var(--neo-green)',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6, color: 'var(--neo-black)' }}>
                    {map.capacity - map.assignedCount} AVAILABLE SLOTS REMAINING
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neo-gray)' }}>
                    CREATED: {new Date(map.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={map.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="neo-btn neo-btn-sm neo-btn-yellow"
                    style={{ textDecoration: 'none' }}
                  >
                    OPEN MAP ↗
                  </a>
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
