export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  let badgeClass = `status-${normalized}`;

  return (
    <span className={`status-badge ${badgeClass}`}>
      {status}
    </span>
  );
}
