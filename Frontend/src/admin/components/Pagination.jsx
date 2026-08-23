import NeoButton from './NeoButton';

export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
        SHOWING PAGE <span style={{ color: 'var(--neo-purple)' }}>{page}</span> OF {totalPages} ({total} TOTAL RECORDS)
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <NeoButton
          variant="white"
          className="neo-btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ◄ PREV
        </NeoButton>
        <NeoButton
          variant="white"
          className="neo-btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          NEXT ►
        </NeoButton>
      </div>
    </div>
  );
}
