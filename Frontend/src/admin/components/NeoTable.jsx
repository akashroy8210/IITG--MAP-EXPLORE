import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

export default function NeoTable({ columns, data, loading, emptyMessage = 'No items found' }) {
  if (loading) return <LoadingState type="table" rows={5} columns={columns.length} />;

  if (!data || data.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="neo-table-wrapper">
      <table className="neo-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row._id || row.id || rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>
                  {col.cell ? col.cell(row, rowIdx) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
