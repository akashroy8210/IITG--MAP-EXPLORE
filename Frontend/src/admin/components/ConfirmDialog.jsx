import NeoModal from './NeoModal';
import NeoButton from './NeoButton';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'CONFIRM ACTION',
  message = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'CONFIRM',
  confirmVariant = 'pink',
  loading = false,
}) {
  return (
    <NeoModal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
        {message}
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <NeoButton variant="white" onClick={onClose} disabled={loading}>
          CANCEL
        </NeoButton>
        <NeoButton variant={confirmVariant} onClick={onConfirm} disabled={loading}>
          {loading ? 'PROCESSING...' : confirmLabel}
        </NeoButton>
      </div>
    </NeoModal>
  );
}
