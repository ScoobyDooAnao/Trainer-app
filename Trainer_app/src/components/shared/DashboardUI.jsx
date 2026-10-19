import { useState } from 'react'
import { GOAL, SPORT_SVG, SIDEBAR_BG, SIDEBAR_TEXT, YELLOW, NAV } from '../../lib/dashboardShared'

// Objetivo como ponto colorido + texto
export function GoalBadge({ goal, size = 'sm' }) {
  const g = GOAL[goal]
  if (!g) return <span style={{ fontSize: 12, color: '#64748B' }}>{goal}</span>
  const fs = size === 'sm' ? 11 : 12
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.accent, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: fs, fontWeight: 600, color: g.accent }}>{goal}</span>
    </span>
  )
}

export function SportIcon({ id, size, color }) {
  var s = size || 14
  var col = color || 'currentColor'
  var svg = (SPORT_SVG[id] || SPORT_SVG.custom)
    .replace(/width="14"/g, 'width="' + s + '"')
    .replace(/height="14"/g, 'height="' + s + '"')
  return <span style={{ display:'inline-flex', alignItems:'center', color:col }} dangerouslySetInnerHTML={{ __html: svg }} />
}

// ── NavItem ────────────────────────────────────────────────────────────────
export const NAV_ICONS = {
  alunos:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  treinos:  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>,
  evolucao: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>,
  cardio:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  perfil:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  escolinha: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18V15c0 3 3.58 6 7 6s7-3 7-6v-3.82L22 9 12 3zm6 10.99l-1 .55V15c0 1.76-2.69 4-5 4s-5-2.24-5-4v-1.46l-1-.55V9.7l6-3.27 6 3.27v4.29z"/></svg>,
  sair:         <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
  planejamento: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>,
}

export function NavItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', borderRadius: 8,
        border: 'none',
        cursor: 'pointer', textAlign: 'left',
        background: active ? 'rgba(245,200,66,0.12)' : hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        boxShadow: active ? 'inset 3px 0 0 #F5C842' : 'none',
        transition: 'all 0.15s',
      }}>
      <span style={{ color: active ? YELLOW : SIDEBAR_TEXT, opacity: active ? 1 : 0.55, flexShrink: 0, lineHeight: 0 }}>
        {NAV_ICONS[item.id] || NAV_ICONS.perfil}
      </span>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? YELLOW : SIDEBAR_TEXT, letterSpacing: 0.1 }}>
        {item.label}
      </span>
    </button>
  )
}

export function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
          {p.name}: {p.value}{unit || ''}
        </div>
      ))}
    </div>
  )
}

export function EmptyChart({ label }) {
  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: 10 }}>
      <div style={{ fontSize: 36 }}></div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum registro de {label} ainda</div>
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
// ── Mobile CSS injection ──────────────────────────────────────────────────────
export function DashboardMobileCSS() {
  return <style>{`
    @media (max-width:767px){
      .db-sidebar    { display:none !important; }
      .db-main       { padding:16px 12px 90px !important; }
      .db-students-grid { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
      .db-stats-3    { grid-template-columns:repeat(2,1fr) !important; }
      .db-stats-4    { grid-template-columns:repeat(2,1fr) !important; }
      .db-grid-2     { grid-template-columns:1fr !important; }
      .db-week-grid  { overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .db-week-grid > div { min-width:340px; }
      .db-filter-bar { flex-wrap:nowrap !important; overflow-x:auto; padding-bottom:4px; -webkit-overflow-scrolling:touch; }
      .db-filter-bar > button { flex-shrink:0; }
      .db-search-row { flex-direction:column !important; gap:10px !important; }
      .db-modal-inner { max-height:100vh !important; border-radius:20px 20px 0 0 !important; position:fixed !important; bottom:0 !important; left:0 !important; right:0 !important; max-width:100% !important; }
      .db-modal-wrap  { align-items:flex-end !important; padding:0 !important; }
      .db-tabs        { overflow-x:auto; -webkit-overflow-scrolling:touch; gap:6px !important; }
      .db-avaliacao-grid  { grid-template-columns:1fr !important; }
    }
    @media (max-width:400px){
      .db-students-grid { grid-template-columns:1fr !important; }
    }
    .db-bottom-nav{display:none}
    @media(max-width:767px){ .db-bottom-nav{display:flex} }
  `}</style>
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
export function MobileBottomNav({ nav, setNav, navigate, logout }) {
  const items = [
    ...NAV,
    { id: 'perfil', icon: '', label: 'Perfil' },
  ]
  return (
    <div className="db-bottom-nav" style={{
      position:'fixed',bottom:0,left:0,right:0,height:64,
      background:SIDEBAR_BG,
      borderTop:'1px solid rgba(255,255,255,0.12)',
      zIndex:200,alignItems:'center',justifyContent:'space-around',
      boxShadow:'0 -4px 20px rgba(0,0,0,0.25)',
    }}>
      {items.map(item=>{
        const active=nav===item.id
        return(
          <button key={item.id} onClick={()=>{
            if(item.id==='perfil') navigate('teacher-profile')
            else setNav(item.id)
          }} style={{
            display:'flex',flexDirection:'column',alignItems:'center',gap:2,
            background:'none',border:'none',cursor:'pointer',padding:'6px 4px',
            flex:1,
          }}>
            <span style={{
                lineHeight:0,
                filter: active ? 'drop-shadow(0 0 6px rgba(245,200,66,0.7))' : 'none',
                color: active ? YELLOW : 'rgba(224,242,254,0.55)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22,
              }}>
                {NAV_ICONS[item.id] || NAV_ICONS.perfil}
              </span>
            <span style={{fontSize:9,fontWeight:active?800:500,color:active?YELLOW:'rgba(224,242,254,0.6)',textTransform:'uppercase',letterSpacing:0.5,transition:'color 0.15s'}}>{item.label}</span>
            {active && (
              <div style={{position:'absolute',bottom:0,width:32,height:2.5,background:YELLOW,borderRadius:2}} />
            )}
          </button>
        )
      })}
    </div>
  )
}
