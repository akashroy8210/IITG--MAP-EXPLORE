import { useEffect } from 'react';
import NeoButton from './NeoButton';

export default function NeoModal({ isOpen, onClose, title, children, maxWidth = 540 }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="neo-modal-backdrop" onClick={onClose}>
      <div
        className="neo-modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          {title && <h3 className="modal-title">{title}</h3>}
          <NeoButton
            variant="black"
            className="neo-btn-sm"
            onClick={onClose}
            style={{ padding: '4px 10px', marginLeft: 'auto' }}
          >
            ✕
          </NeoButton>
        </div>
        {children}
      </div>
    </div>
  );
}
