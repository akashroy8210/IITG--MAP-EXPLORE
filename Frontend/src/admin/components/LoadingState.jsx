export default function LoadingState({ type = 'cards', rows = 4, columns = 4 }) {
  if (type === 'table') {
    return (
      <div className="neo-table-wrapper">
        <table className="neo-table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton-box" style={{ height: 16, width: '70%' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c}>
                    <div className="skeleton-box" style={{ height: 16, width: '85%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bento-grid">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="neo-card bento-span-3">
          <div className="skeleton-box" style={{ height: 16, width: '40%', marginBottom: 12 }} />
          <div className="skeleton-box" style={{ height: 36, width: '60%', marginBottom: 8 }} />
          <div className="skeleton-box" style={{ height: 14, width: '80%' }} />
        </div>
      ))}
    </div>
  );
}
