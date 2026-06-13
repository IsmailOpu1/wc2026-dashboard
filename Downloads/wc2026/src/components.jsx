export function Card({ children, live = false, onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: live ? 'var(--red-dim)' : 'var(--surface)',
        border: `1px solid ${live ? 'rgba(255,61,61,0.3)' : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '20px',
        transition: 'border-color 0.2s, transform 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform='translateY(-1px)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.transform='translateY(0)' }}
    >
      {children}
    </div>
  )
}

export function Pill({ active, onClick, children, danger = false }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px',
      borderRadius: '30px',
      border: active
        ? `1.5px solid ${danger ? 'var(--red)' : 'var(--green)'}`
        : '1.5px solid var(--border)',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '13px',
      letterSpacing: '0.01em',
      background: active
        ? (danger ? 'var(--red-dim)' : 'var(--green-dim)')
        : 'transparent',
      color: active ? (danger ? 'var(--red)' : 'var(--green)') : 'var(--muted)',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  )
}

export function Spinner({ label = 'Loading live data…' }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid var(--surface2)',
        borderTopColor: 'var(--green)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        margin: '0 auto 14px',
      }} />
      <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div style={{
      background: 'var(--red-dim)', border: '1px solid rgba(255,61,61,0.25)',
      borderRadius: '14px', padding: '28px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚠️</div>
      <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Connection failed</div>
      <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '18px', maxWidth: '360px', margin: '0 auto 18px' }}>{message}</div>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'var(--green)', color: '#000', border: 'none',
          borderRadius: '10px', padding: '10px 24px',
          fontWeight: 700, cursor: 'pointer', fontSize: '14px',
        }}>
          Try Again
        </button>
      )}
    </div>
  )
}

export function Empty({ message = 'Nothing here yet.' }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--faint)' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚽</div>
      <div style={{ fontSize: '15px' }}>{message}</div>
    </div>
  )
}

export function LiveDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '8px', height: '8px',
      borderRadius: '50%',
      background: 'var(--red)',
      animation: 'liveDot 1.2s ease-in-out infinite',
      marginRight: '5px',
    }} />
  )
}
