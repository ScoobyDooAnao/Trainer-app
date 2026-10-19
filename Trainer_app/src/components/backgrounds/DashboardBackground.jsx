import { CLOUDS } from '../../lib/dashboardShared'

export function Cloud({ top, left, scale, dur, delay, opacity }) {
  const style = {
    position: 'absolute', top, left,
    opacity,
    transform: `scale(${scale})`,
    animation: `cloudFloat ${dur}s linear ${delay}s infinite`,
    pointerEvents: 'none',
    zIndex: 0,
  }
  return (
    <div style={style}>
      <svg width="220" height="70" viewBox="0 0 220 70" fill="none">
        <ellipse cx="110" cy="50" rx="100" ry="22" fill="white" />
        <ellipse cx="75"  cy="38" rx="55"  ry="30" fill="white" />
        <ellipse cx="138" cy="36" rx="48"  ry="26" fill="white" />
        <ellipse cx="105" cy="28" rx="38"  ry="24" fill="white" />
      </svg>
    </div>
  )
}

export function SkyBackground() {
  return (
    <>
      <style>{`
        @keyframes cloudFloat {
          0%   { transform: translateX(0)   scale(var(--s,1)); }
          100% { transform: translateX(110vw) scale(var(--s,1)); }
        }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden',
        background:'linear-gradient(175deg, #4AB8E8 0%, #7DCEEF 30%, #B3E5F7 60%, #D9F1FB 100%)' }}>
        {CLOUDS.map((c, i) => <Cloud key={i} {...c} />)}
      </div>
    </>
  )
}

// ── WaveDivider ────────────────────────────────────────────────────────────
export function WaveDivider() {
  return (
    <div style={{ lineHeight: 0, padding: '2px 0 8px' }}>
      <svg viewBox="0 0 220 14" width="220" height="14" style={{ display: 'block' }}>
        <path d="M0,7 C18,1 36,13 55,7 C73,1 91,13 110,7 C129,1 147,13 165,7 C183,1 201,13 220,7"
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}
