export default function BentoCard({
  title,
  subtitle,
  badgeText,
  variant = 'white',
  span = 'bento-span-4',
  className = '',
  action,
  children,
}) {
  const variantClass = variant !== 'white' ? `neo-card-${variant}` : '';

  return (
    <div className={`neo-card ${variantClass} ${span} ${className}`}>
      {(title || action || badgeText) && (
        <div className="card-header-row">
          <div>
            {badgeText && <span className="brand-badge" style={{ marginBottom: 4 }}>{badgeText}</span>}
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p style={{ fontSize: 12, margin: '2px 0 0', fontWeight: 600, color: 'var(--neo-gray)' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
