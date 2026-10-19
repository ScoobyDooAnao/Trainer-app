import { useEffect } from 'react'

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: '#34D399', color: '#052e16', borderRadius: 50, padding: '12px 26px',
      fontWeight: 800, fontSize: 14, zIndex: 1000, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(52,211,153,0.5)',
    }}>{msg}</div>
  )
}
