import { useMemo } from 'react'

// ── Fundo cósmico compartilhado (usado no StudentView e na sessão de treino) ──
function CosmicCSS() {
  return (
    <style>{`
      @keyframes twinkle {
        0%,100% { opacity: 0.08; transform: scale(0.6); }
        50%      { opacity: 1;   transform: scale(1.5); }
      }
      @keyframes aurora {
        0%,100% { transform: translate(0,0) scale(1);            opacity: 0.07; }
        50%      { transform: translate(24px,-10px) scale(1.18);  opacity: 0.13; }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes float {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-7px); }
      }
      @keyframes starAppear {
        0%   { opacity: 0; transform: scale(0) rotate(-20deg); }
        60%  { opacity: 1; transform: scale(1.25) rotate(6deg); }
        100% { opacity: 1; transform: scale(1)    rotate(0deg); }
      }
      @keyframes starGlow {
        0%,100% { filter: drop-shadow(0 0 4px var(--sc))  drop-shadow(0 0 1px var(--sc)); transform: scale(1);   }
        50%      { filter: drop-shadow(0 0 16px var(--sc)) drop-shadow(0 0 32px var(--sc)); transform: scale(1.1); }
      }
      @keyframes constellationPulse {
        0%,100% { opacity: 0.10; }
        50%      { opacity: 0.28; }
      }
      .cosmic-btn-glow:hover { filter: brightness(1.15); transform: translateY(-1px); }
    `}</style>
  )
}

function StarField() {
  const stars = useMemo(() => Array.from({ length: 130 }, (_, i) => {
    const big = i < 18
    return {
      id:    i,
      x:     ((i * 7919 + 13) % 1000) / 10,
      y:     ((i * 6271 + 97) % 1000) / 10,
      size:  big ? (1.8 + (i % 5) * 0.4) : (0.4 + (i % 4) * 0.3),
      delay: ((i * 1.37) % 7).toFixed(2),
      dur:   (2.5 + (i % 5) * 0.7).toFixed(2),
      op:    (0.18 + (i % 8) * 0.09).toFixed(2),
    }
  }), [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#02040F 0%,#060A1A 55%,#090D24 100%)' }} />
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '65%', height: '55%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 70%)', animation: 'aurora 14s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55%', height: '50%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(56,189,248,0.07) 0%,transparent 70%)', animation: 'aurora 18s 5s ease-in-out infinite' }} />
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`, borderRadius: '50%',
          background: s.size > 1.5 ? '#E8EEFF' : '#FFFFFF',
          opacity: s.op,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          boxShadow: s.size > 1.5 ? `0 0 ${s.size * 3}px rgba(200,210,255,0.55)` : 'none',
        }} />
      ))}
    </div>
  )
}

export { CosmicCSS, StarField }
