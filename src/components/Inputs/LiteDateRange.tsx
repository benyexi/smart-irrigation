import React, { useId, useState } from 'react';

interface LiteDateRangeProps {
  compact?: boolean;
  endLabel?: string;
  startLabel?: string;
  width?: number | string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(15, 23, 42, 0.14)',
  borderRadius: 12,
  background: '#f7fafd',
  color: 'var(--text-primary)',
  fontSize: 13,
  lineHeight: 1.2,
  padding: '9px 12px',
  outline: 'none',
};

const LiteDateRange = ({
  compact = false,
  endLabel = '结束日期',
  startLabel = '开始日期',
  width = compact ? 260 : '100%',
}: LiteDateRangeProps) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const startId = useId();
  const endId = useId();

  return (
    <div
      style={{
        width,
        display: 'grid',
        gridTemplateColumns: compact ? '1fr auto 1fr' : '1fr',
        gap: compact ? 8 : 10,
        alignItems: 'center',
      }}
    >
      <label htmlFor={startId} style={{ display: 'grid', gap: 6 }}>
        {!compact ? (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{startLabel}</span>
        ) : null}
        <input
          id={startId}
          type="date"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          style={inputStyle}
        />
      </label>

      {compact ? (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>至</span>
      ) : null}

      <label htmlFor={endId} style={{ display: 'grid', gap: 6 }}>
        {!compact ? (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{endLabel}</span>
        ) : null}
        <input
          id={endId}
          type="date"
          value={end}
          min={start || undefined}
          onChange={(event) => setEnd(event.target.value)}
          style={inputStyle}
        />
      </label>
    </div>
  );
};

export default LiteDateRange;
