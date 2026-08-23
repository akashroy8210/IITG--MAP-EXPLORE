export default function NeoInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  name,
  children,
  ...props
}) {
  return (
    <div className={`neo-input-group ${className}`}>
      {label && (
        <label className="neo-label">
          {label} {required && <span style={{ color: 'var(--neo-pink)' }}>*</span>}
        </label>
      )}
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="neo-select"
          {...props}
        >
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="neo-textarea"
          rows={4}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="neo-input"
          {...props}
        />
      )}
      {error && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--neo-pink)', marginTop: 4 }}>⚠ {error}</span>}
    </div>
  );
}
