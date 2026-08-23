export default function NeoButton({
  children,
  variant = 'default',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  style,
  ...props
}) {
  const variantClass = variant !== 'default' ? `neo-btn-${variant}` : '';
  const sizeClass = size !== 'md' ? `neo-btn-${size}` : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`neo-btn ${variantClass} ${sizeClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
