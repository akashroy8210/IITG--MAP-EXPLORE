import NeoButton from './NeoButton';

export default function EmptyState({
  title = 'NO DATA FOUND',
  message = 'There are no records matching your current criteria.',
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--neo-white)',
        border: 'var(--neo-border)',
        boxShadow: 'var(--neo-shadow)',
        margin: '12px 0',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px' }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neo-gray)', margin: '0 0 20px' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <NeoButton variant="purple" onClick={onAction}>
          {actionLabel}
        </NeoButton>
      )}
    </div>
  );
}
