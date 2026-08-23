import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import BentoCard from '../../components/BentoCard';
import NeoTable from '../../components/NeoTable';
import StatusBadge from '../../components/StatusBadge';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import { studentService } from '../../api/studentService';

export default function RouteKeysPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchRouteKeys = async () => {
    try {
      setLoading(true);
      const res = await studentService.getStudents({ page, limit: 12, search });
      setStudents(res.data || []);
      setPagination(res.pagination || { totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteKeys();
  }, [page, search]);

  const columns = [
    { header: 'USER NO.', accessor: 'userNumber', cell: (r) => <strong>#{r.userNumber}</strong> },
    { header: 'STUDENT NAME', accessor: 'name' },
    { header: 'ASSIGNED MAP', accessor: 'mapId', cell: (r) => r.mapId?.name || 'Unassigned' },
    {
      header: 'UNIQUE ROUTE KEY',
      accessor: 'routeKey',
      cell: (r) => (
        <code style={{ fontSize: 16, fontWeight: 900, color: 'var(--neo-purple)', background: 'var(--neo-purple-light)', padding: '4px 10px', border: '2px solid var(--neo-black)' }}>
          {r.routeKey || 'N/A'}
        </code>
      ),
    },
    { header: 'ACCOUNT STATUS', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
          ROUTE KEY MANAGEMENT & MAPPING
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '4px 0 0' }}>
          Every student has a unique route key. Students on the same map receive different route keys to unlock distinct puzzle paths.
        </p>
      </div>

      <div className="bento-grid" style={{ marginBottom: 24 }}>
        <BentoCard title="MAP & ROUTE KEY RELATIONSHIP RULE" span="bento-span-12" variant="yellow">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 8 }}>
            {[
              { user: 'Student 100001', map: 'Map 01', key: 'A7K291' },
              { user: 'Student 100002', map: 'Map 01', key: 'X8P432' },
              { user: 'Student 100003', map: 'Map 01', key: 'Q9M871' },
              { user: 'Student 100004', map: 'Map 01', key: 'B2D654' },
            ].map((ex, idx) => (
              <div key={idx} style={{ padding: 12, border: 'var(--neo-border-sm)', background: 'var(--neo-white)' }}>
                <div style={{ fontSize: 11, fontWeight: 800 }}>{ex.user}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--neo-purple)' }}>{ex.map}</div>
                <code style={{ fontSize: 14, fontWeight: 900, marginTop: 4, display: 'block' }}>{ex.key}</code>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      <BentoCard span="bento-span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="SEARCH BY ROUTEKEY, STUDENT NAME, OR MAP..." />
        </div>

        <NeoTable columns={columns} data={students} loading={loading} emptyMessage="No routekeys found matching your query" />

        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      </BentoCard>
    </AdminLayout>
  );
}
