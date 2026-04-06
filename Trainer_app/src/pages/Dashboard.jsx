import { useState, useEffect, useCallback } from 'react'
import TabEscolinha from './TabEscolinha'
const useIsMobile = () => { const [m,setM]=useState(()=>window.innerWidth<768); useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[]);return m }
import { supabase } from '../supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'

const SIDEBAR_BG    = '#155E8E'
const SIDEBAR_TEXT  = '#E0F2FE'
const YELLOW        = '#F5C842'
const YELLOW_BG     = 'rgba(245,200,66,0.15)'
const YELLOW_BORDER = 'rgba(245,200,66,0.45)'

const GOAL = {
  'Ganho de Massa':           { bg: '#E0F4FF', accent: '#0284C7', icon: null },
  'Emagrecimento':            { bg: '#FEF2F2', accent: '#E05252', icon: null },
  'Força e Performance':      { bg: '#EDE9FE', accent: '#7C3AED', icon: null },
  'Condicionamento':          { bg: '#FFFBEB', accent: '#D97706', icon: null },
  'Saúde e Bem-Estar':        { bg: '#F0FDF4', accent: '#16A34A', icon: null },
  'Iniciação Esportiva':      { bg: '#ECFDF5', accent: '#059669', icon: null },
  'Desenvolvimento Atlético': { bg: '#EFF6FF', accent: '#3B82F6', icon: null },
  'Treinamento Competitivo':  { bg: '#FDF4FF', accent: '#A21CAF', icon: null },
}
// Objetivo como ponto colorido + texto
function GoalBadge({ goal, size = 'sm' }) {
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

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const DIA_JS_MAP  = { Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6, Dom: 0 }

const NAV = [
  { id: 'alunos',    icon: '', label: 'Meus Alunos' },
  { id: 'treinos',   icon: '', label: 'Cronograma'   },
  { id: 'evolucao',  icon: '', label: 'Evolução'     },
  { id: 'cardio',    icon: '', label: 'Cardio'       },
  { id: 'escolinha', icon: '', label: 'Escolinha'    },
]
const GOALS  = ['Ganho de Massa', 'Emagrecimento', 'Condicionamento', 'Força e Performance', 'Saúde e Bem-Estar', 'Iniciação Esportiva', 'Desenvolvimento Atlético', 'Treinamento Competitivo']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Atleta Jovem', 'Atleta Competitivo']

const SPORT_SVG = {
  futebol:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 2l2.5 7.5H7.5L12 2zm0 20l-2.5-7.5h5L12 22zM2 12l7.5-2.5v5L2 12zm20 0l-7.5 2.5v-5L22 12z" opacity=".6"/><circle cx="12" cy="12" r="2.5"/></svg>',
  futsal:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="5" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><rect x="2" y="8" width="3" height="8" rx=".5" fill="currentColor" opacity=".5"/><rect x="19" y="8" width="3" height="8" rx=".5" fill="currentColor" opacity=".5"/></svg>',
  natacao:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 16c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1v2c-1.5 0-2.5-1-4-1s-2.5 1-4 1-2.5-1-4-1-2.5 1-4 1v-2z"/><path d="M14.5 6.5a2 2 0 100-4 2 2 0 000 4z"/><path d="M6 14.5l4-5 3 3 3.5-4.5 4 2.5"/></svg>',
  tenis:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5 5.5C7 8 7 16 5 18.5M19 5.5C17 8 17 16 19 18.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>',
  basquete:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M2.5 12h19M12 2.5v19M5.5 5.5C8 9 8 15 5.5 18.5M18.5 5.5C16 9 16 15 18.5 18.5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>',
  volei:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M2.5 9.5h19M12 2.5c0 0-4 5-4 9.5s4 9.5 4 9.5M12 2.5c0 0 4 5 4 9.5s-4 9.5-4 9.5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>',
  atletismo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M12 7l-3 5h6l-3-5zm-3 5l-2 8h2l1-4 2 2 2-2 1 4h2l-2-8"/></svg>',
  ginastica: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M9 8h6l1 5H8l1-5zm-2 5l-3 7h2l2-4h8l2 4h2l-3-7" opacity=".8"/><path d="M7 11.5l-3 1.5M17 11.5l3 1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>',
  judo:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M9 7h6v5l2 8h-2l-1.5-5h-3L9 20H7l2-8V7z"/><path d="M7 10l-3 3M17 10l3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>',
  ciclismo:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="18" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M6 16l6-10 2 4h4M12 6l2 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="14" cy="5" r="1.5"/></svg>',
  handebol:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="13" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 5l-4 3M10 4l-2-2M7 9l-5-.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>',
  saude:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C7 17 3 13.5 3 9.5a4.5 4.5 0 018-2.83A4.5 4.5 0 0119 9.5c0 4-4 7.5-7 11.5z" opacity=".7"/><path d="M9 9h6M12 6v6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>',
  custom:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,3 15,9 22,9.5 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.5 9,9" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>',
}
function SportIcon({ id, size, color }) {
  var s = size || 14
  var col = color || 'currentColor'
  var svg = (SPORT_SVG[id] || SPORT_SVG.custom)
    .replace(/width="14"/g, 'width="' + s + '"')
    .replace(/height="14"/g, 'height="' + s + '"')
  return <span style={{ display:'inline-flex', alignItems:'center', color:col }} dangerouslySetInnerHTML={{ __html: svg }} />
}
const SPORTS = [
  { id: 'futebol',   label: 'Futebol',           icon: null },
  { id: 'futsal',    label: 'Futsal',             icon: null },
  { id: 'natacao',   label: 'Natação',            icon: null },
  { id: 'tenis',     label: 'Tênis',              icon: null },
  { id: 'basquete',  label: 'Basquete',           icon: null },
  { id: 'volei',     label: 'Vôlei',              icon: null },
  { id: 'atletismo', label: 'Atletismo',          icon: null },
  { id: 'ginastica', label: 'Ginástica',          icon: null },
  { id: 'judo',      label: 'Judô',               icon: null },
  { id: 'ciclismo',  label: 'Ciclismo',           icon: null },
  { id: 'handebol',  label: 'Handebol',           icon: null },
  { id: 'saude',     label: 'Saúde e Bem-Estar',  icon: null },
  { id: 'custom',    label: 'Outro',              icon: null },
]

// LTAD — Long-Term Athlete Development
// Retorna fase com base na idade e anos de experiência
function calcLTAD(age, expYears, sport) {
  // LTAD só se aplica a alunos com esporte cadastrado e até 23 anos
  if (!age || !sport) return null
  const exp = expYears || 0

  // FUNdamentals — 6 a 9 anos, ou até 11 com pouca experiência
  if (age < 9)               return { fase: 'FUNdamentals',     cor: '#0284C7', bg: 'rgba(2,132,199,0.1)',  icon: null, desc: 'Habilidades motoras fundamentais e ludicidade' }
  if (age <= 11 && exp < 3)  return { fase: 'FUNdamentals',     cor: '#0284C7', bg: 'rgba(2,132,199,0.1)',  icon: null, desc: 'Habilidades motoras fundamentais e ludicidade' }

  // Learn to Train — 9 a 12 anos (ou até 15 com pouca exp)
  if (age <= 12)             return { fase: 'Learn to Train',   cor: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: null, desc: 'Aprender habilidades esportivas gerais' }
  if (age <= 15 && exp < 4)  return { fase: 'Learn to Train',   cor: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: null, desc: 'Aprender habilidades esportivas gerais' }

  // Train to Train — 12 a 16 anos (base física específica)
  if (age <= 16)             return { fase: 'Train to Train',   cor: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: null, desc: 'Construir base física específica ao esporte' }
  if (age <= 17 && exp < 5)  return { fase: 'Train to Train',   cor: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: null, desc: 'Construir base física específica ao esporte' }

  // Train to Compete — 17–18 anos, apenas se tiver esporte E for de fato atleta jovem competitivo
  if (age <= 18)             return { fase: 'Train to Compete', cor: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: null, desc: 'Especialização e desempenho competitivo' }

  // 19+ anos → fora do modelo LTAD, usar faixas etárias normais
  return null
}

// ── Helpers ────────────────────────────────────────────────────────────────
function imcStyle(w, h, precomputed) {
  if (!w || !h) return { val: '—', color: '#94A3B8', label: '—' }
  const v = precomputed ?? parseFloat((w / ((h / 100) ** 2)).toFixed(1))
  let color, label
  if      (v < 16)   { color = '#BFDBFE'; label = 'Muito baixo' }
  else if (v < 18.5) { color = '#60A5FA'; label = 'Abaixo'      }
  else if (v < 22)   { color = '#34D399'; label = 'Ideal'       }
  else if (v < 25)   { color = '#10B981'; label = 'Normal'      }
  else if (v < 27.5) { color = '#F5C842'; label = 'Sobrepeso'   }
  else if (v < 30)   { color = '#F59E0B'; label = 'Sobrepeso+'  }
  else if (v < 35)   { color = '#EF4444'; label = 'Obesidade'   }
  else               { color = '#B91C1C'; label = 'Ob. Severa'  }
  return { val: v.toFixed(1), color, label }
}

function streakStyle(days) {
  if (!days || days === 0) return { color: '#94A3B8', display: '—', glow: false }
  let color, glow = false
  if      (days < 7)   color = '#FDE68A'
  else if (days < 14)  color = '#FCD34D'
  else if (days < 30)  color = '#F5C842'
  else if (days < 90)  { color = '#F59E0B'; glow = true }
  else if (days < 180) { color = '#EA580C'; glow = true }
  else if (days < 365) { color = '#DC2626'; glow = true }
  else                 { color = '#D97706'; glow = true }
  const emoji = days >= 365 ? '★' : days >= 180 ? '◆' : days >= 90 ? '▲' : '●'
  return { color, display: `${emoji}${days}`, glow }
}

function getDayStatus(dia, attendanceDates, logDates, makeupDates) {
  const todayJS  = new Date().getDay()
  const diaJS    = DIA_JS_MAP[dia]
  const jaPassou = diaJS < todayJS || (diaJS === 0 && todayJS > 0)
  const eHoje    = diaJS === todayJS
  const now      = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const allDates = [...(attendanceDates || []), ...(logDates || [])]
  const fez = allDates.some(d => {
    const date = new Date(d + 'T12:00:00')
    return date.getDay() === diaJS && date >= weekStart
  })
  // Verificar se foi recuperado (feito num dia diferente)
  const recuperado = !fez && jaPassou && (makeupDates || []).some(d => d === dia)
  if (fez)        return { bg: 'rgba(52,211,153,0.18)',  color: '#065F46', border: 'rgba(52,211,153,0.45)', label: 'Feito',      emoji: '' }
  if (recuperado) return { bg: 'rgba(251,191,36,0.18)',  color: '#92400E', border: 'rgba(251,191,36,0.45)', label: 'Recuperado', emoji: '' }
  if (eHoje)      return { bg: 'rgba(59,130,246,0.15)',  color: '#1E3A8A', border: 'rgba(59,130,246,0.4)',  label: 'Ainda dá',   emoji: '' }
  if (jaPassou)   return { bg: 'rgba(239,68,68,0.12)',   color: '#7F1D1D', border: 'rgba(239,68,68,0.38)',  label: 'Faltou',     emoji: '' }
  return            { bg: 'rgba(148,163,184,0.12)', color: '#475569', border: 'rgba(148,163,184,0.3)', label: 'Agendado',   emoji: '' }
}

function calcStreak(dates, plannedDays) {
  const JS_TO_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const doneSet = new Set((dates || []).map(d => String(d).slice(0, 10)))
  let streak = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cursor = new Date(today)

  // Sem dias planejados: conta presença em dias consecutivos quaisquer
  if (!plannedDays || plannedDays.length === 0) {
    for (let i = 0; i < 730; i++) {
      const ds = cursor.toISOString().slice(0, 10)
      if (doneSet.has(ds)) streak++
      else if (i > 0) break
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  // Com dias planejados: ignora dias de descanso, quebra só em dia de treino faltado
  for (let i = 0; i < 730; i++) {
    const dayName = JS_TO_DIA[cursor.getDay()]
    const isToday = cursor.getTime() === today.getTime()
    if (plannedDays.includes(dayName)) {
      const ds = cursor.toISOString().slice(0, 10)
      if (doneSet.has(ds)) {
        streak++
      } else if (!isToday) {
        break // faltou num dia planejado → sequência quebra
      }
    }
    // dias de descanso são pulados sem quebrar a sequência
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ── Clouds background ─────────────────────────────────────────────────────
const CLOUDS = [
  { top:'6%',  left:'-10%', scale:1.3,  dur:90,  delay:0,   opacity:0.85 },
  { top:'18%', left:'-12%', scale:0.8,  dur:120, delay:-35, opacity:0.6  },
  { top:'38%', left:'-8%',  scale:1.0,  dur:100, delay:-60, opacity:0.7  },
  { top:'55%', left:'-15%', scale:1.5,  dur:140, delay:-20, opacity:0.5  },
  { top:'72%', left:'-10%', scale:0.9,  dur:110, delay:-80, opacity:0.65 },
  { top:'85%', left:'-12%', scale:1.1,  dur:130, delay:-50, opacity:0.55 },
]

function Cloud({ top, left, scale, dur, delay, opacity }) {
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

function SkyBackground() {
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
function WaveDivider() {
  return (
    <div style={{ lineHeight: 0, padding: '2px 0 8px' }}>
      <svg viewBox="0 0 220 14" width="220" height="14" style={{ display: 'block' }}>
        <path d="M0,7 C18,1 36,13 55,7 C73,1 91,13 110,7 C129,1 147,13 165,7 C183,1 201,13 220,7"
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// ── NavItem ────────────────────────────────────────────────────────────────
const NAV_ICONS = {
  alunos:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  treinos:  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>,
  evolucao: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>,
  cardio:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  perfil:   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  escolinha: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18V15c0 3 3.58 6 7 6s7-3 7-6v-3.82L22 9 12 3zm6 10.99l-1 .55V15c0 1.76-2.69 4-5 4s-5-2.24-5-4v-1.46l-1-.55V9.7l6-3.27 6 3.27v4.29z"/></svg>,
  sair:     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
}

function NavItem({ item, active, onClick }) {
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

// ── StudentCard ────────────────────────────────────────────────────────────
// ── Helpers de idade ───────────────────────────────────────────────────────
function calcAgeFromStudent(st) {
  if (st.birth_date) {
    const birth = new Date(st.birth_date)
    return Math.floor((new Date() - birth) / (365.25 * 24 * 3600000))
  }
  return st.age ? parseInt(st.age) : null
}

function ageBadge(age) {
  if (age === null) return null
  let emoji, color, bg, label
  if      (age < 12)  { emoji = ''; color = '#0284C7'; bg = 'rgba(2,132,199,0.12)';  label = `${age} anos · Criança`        }
  else if (age < 18)  { emoji = ''; color = '#7C3AED'; bg = 'rgba(124,58,237,0.12)'; label = `${age} anos · Adolescente`    }
  else if (age < 30)  { emoji = ''; color = '#059669'; bg = 'rgba(5,150,105,0.12)';  label = `${age} anos · Adulto Jovem`   }
  else if (age < 45)  { emoji = ''; color = '#0891B2'; bg = 'rgba(8,145,178,0.12)';  label = `${age} anos · Adulto`         }
  else if (age < 60)  { emoji = ''; color = '#7C3AED'; bg = 'rgba(124,58,237,0.12)'; label = `${age} anos · Adulto Maduro`  }
  else                { emoji = ''; color = '#D97706'; bg = 'rgba(217,119,6,0.12)';  label = `${age} anos · Idoso`          }
  return { emoji, color, bg, label }
}

// ── Modal de confirmação de exclusão ───────────────────────────────────────
function ConfirmDeleteModal({ student, onConfirm, onClose, deleting }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, padding:'28px 28px 24px', maxWidth:380, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.25)', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ fontSize:36, textAlign:'center', marginBottom:10 }}></div>
        <div style={{ fontSize:18, fontWeight:800, color:'#0D1B2A', textAlign:'center', marginBottom:6 }}>Excluir aluno?</div>
        <div style={{ fontSize:14, color:'#64748B', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>
          Tem certeza que deseja excluir <strong style={{ color:'#0D1B2A' }}>{student.name}</strong>?<br/>
          <span style={{ fontSize:12, color:'#EF4444', fontWeight:600 }}>Esta ação não pode ser desfeita. Todo histórico, treinos e registros serão removidos permanentemente.</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#64748B', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background: deleting ? '#FCA5A5' : 'linear-gradient(135deg,#EF4444,#DC2626)', color:'#fff', fontWeight:800, fontSize:14, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
            {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StudentCard({ st, onClick, onDelete }) {
  const [hov,      setHov]      = useState(false)
  const [hovDel,   setHovDel]   = useState(false)
  const [showDel,  setShowDel]  = useState(false)
  const [deleting, setDeleting] = useState(false)

  const g      = GOAL[st.goal] || GOAL['Ganho de Massa']
  const imc    = imcStyle(st.weight, st.height, st.imc_calc)
  const streak = streakStyle(st.streak || 0)
  const active = (st.lastSeenDays ?? 999) < 5
  const age    = calcAgeFromStudent(st)
  const badge  = ageBadge(age)
  const ltad   = calcLTAD(age, st.experience_years, st.sport)
  const sport  = SPORTS.find(s => s.id === st.sport)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await Promise.all([
        supabase.from('exercise_logs').delete().eq('student_id', st.id),
        supabase.from('attendance').delete().eq('student_id', st.id),
        supabase.from('progress_entries').delete().eq('student_id', st.id),
        supabase.from('student_feedbacks').delete().eq('student_id', st.id),
        supabase.from('cardio_sessions').delete().eq('student_id', st.id),
        supabase.from('student_goals').delete().eq('student_id', st.id),
      ])
      const { data: plans } = await supabase.from('workout_plans').select('id').eq('student_id', st.id)
      if (plans?.length) {
        const pids = plans.map(p => p.id)
        const { data: days } = await supabase.from('workout_days').select('id').in('workout_plan_id', pids)
        if (days?.length) await supabase.from('exercises').delete().in('workout_day_id', days.map(d => d.id))
        await supabase.from('workout_days').delete().in('workout_plan_id', pids)
        await supabase.from('workout_plans').delete().in('id', pids)
      }
      await supabase.from('students').delete().eq('id', st.id)
      onDelete()
    } catch (e) {
      console.error(e)
      setDeleting(false)
    }
  }

  return (
    <>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
        style={{
          background:   hov ? 'linear-gradient(160deg,#FDE68A,#F5C842)' : 'linear-gradient(160deg,#FEF3C7,#FBBF24CC)',
          borderRadius: 18, overflow: 'hidden',
          border:       `1.5px solid ${hov ? '#D97706' : '#F5C84280'}`,
          boxShadow:    hov ? '0 12px 36px rgba(245,200,66,0.45)' : '0 4px 14px rgba(245,200,66,0.25)',
          transition:   'all 0.2s', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', position: 'relative',
        }}>

        {/* Botão excluir */}
        <button
          onClick={e => { e.stopPropagation(); setShowDel(true) }}
          onMouseEnter={() => setHovDel(true)}
          onMouseLeave={() => setHovDel(false)}
          title="Excluir aluno"
          style={{ position:'absolute', top:10, right:10, width:28, height:28, borderRadius:'50%', border:'none', background: hovDel ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.08)', color: hovDel ? '#EF4444' : '#FCA5A5', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', zIndex:2, lineHeight:1 }}>
          
        </button>

        {/* Topo */}
        <div style={{ padding: '16px 18px 14px', background: `linear-gradient(135deg,${g.bg},#FFFDF0)`, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#34D399' : '#CBD5E1', boxShadow: active ? '0 0 7px #34D399' : 'none' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: active ? '#065F46' : '#94A3B8' }}>
                {active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {!active && st.lastSeenDays < 999 && (
              <span style={{ fontSize: 10, color: YELLOW, fontWeight: 600, background: 'rgba(245,200,66,0.1)', padding: '2px 8px', borderRadius: 20, border: `1px solid ${YELLOW_BORDER}`, marginRight: 24 }}>
                {st.lastSeenDays}d sem interagir
              </span>
            )}
          </div>

          {/* Nome */}
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0D1B2A', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 6, paddingRight: 28 }}>{st.name}</div>

          {/* Badges — faixa etária + esporte + LTAD */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
            {badge && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, background: badge.bg, border:`1px solid ${badge.color}33` }}>
                <span style={{ fontSize:11 }}>{badge.emoji}</span>
                <span style={{ fontSize:11, fontWeight:700, color: badge.color }}>{badge.label}</span>
              </div>
            )}
            {sport && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)' }}>
                <SportIcon id={sport.id} size={14} />
                <span style={{ fontSize:11, fontWeight:700, color:'#3B82F6' }}>{sport.label}</span>
              </div>
            )}
            {ltad && (
              <div title={ltad.desc} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, background: ltad.bg, border:`1px solid ${ltad.cor}33` }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:ltad.cor, display:"inline-block", flexShrink:0 }} />
                <span style={{ fontSize:11, fontWeight:700, color: ltad.cor }}>{ltad.fase}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <GoalBadge goal={st.goal} />
            {st.guardian_name && <>
              <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Resp.: {st.guardian_name.split(' ')[0]}</span>
            </>
            }
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '14px 18px', display: 'flex', gap: 8 }}>
          {[
            { label: 'Peso',     val: st.weight ? `${st.weight}` : '—', unit: st.weight ? 'kg' : '', color: '#431C00', sub: null },
            { label: 'IMC',      val: imc.val,        unit: '',           color: imc.color,            sub: imc.label },
            { label: 'Ofensiva', val: streak.display, unit: '',           color: streak.color,         sub: (st.streak || 0) > 0 ? 'dias' : null, glow: streak.glow },
          ].map(({ label, val, unit, color, sub, glow }) => (
            <div key={label} style={{ flex: 1, borderRadius: 10, padding: '10px 6px', textAlign: 'center', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: glow ? `0 0 12px ${color}35` : 'none' }}>
              <div style={{ fontSize: 9, color: '#7C4A00', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: val.length > 5 ? 11 : 15, fontWeight: 800, color, lineHeight: 1 }}>{val}<span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>{unit}</span></div>
              {sub && <div style={{ fontSize: 8, color: '#431C00', opacity: 0.75, marginTop: 2, fontWeight: 700 }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.09)', background: hov ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.2s' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#431C00' }}>Ver Perfil Completo</span>
          <span style={{ fontSize: 13, color: '#431C00', transform: hov ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s', display: 'inline-block' }}>→</span>
        </div>
      </div>

      {showDel && (
        <ConfirmDeleteModal
          student={st}
          onClose={() => { setShowDel(false); setDeleting(false) }}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  )
}

// ── AddCard ────────────────────────────────────────────────────────────────
function AddCard({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ borderRadius: 18, minHeight: 220, border: `2px dashed ${hov ? YELLOW : 'rgba(245,200,66,0.35)'}`, background: hov ? 'linear-gradient(135deg,rgba(245,200,66,0.12),rgba(245,158,11,0.06))' : 'linear-gradient(135deg,rgba(245,200,66,0.06),rgba(245,158,11,0.02))', boxShadow: hov ? '0 8px 28px rgba(245,200,66,0.15)' : 'none', transition: 'all 0.22s', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: hov ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(245,200,66,0.15)', border: `2px solid ${hov ? YELLOW : 'rgba(245,200,66,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#431C00', transition: 'all 0.22s', boxShadow: hov ? '0 0 20px rgba(245,200,66,0.35)' : 'none' }}>+</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: hov ? YELLOW : 'rgba(245,200,66,0.6)' }}>Adicionar Aluno</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Clique para cadastrar</div>
      </div>
    </div>
  )
}

// ── WorkoutModal ───────────────────────────────────────────────────────────
function WorkoutModal({ workout, onClose, navigate }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'linear-gradient(135deg,#FEF3C7,#FBBF24)', padding: '22px 24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#7C3700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Plano de Treino</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#431C00' }}>{workout.title}</div>
              <div style={{ fontSize: 13, color: '#7C4A00', marginTop: 3, fontWeight: 600 }}>{workout.studentName}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#431C00' }}>×</button>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Status desta semana</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(workout.days || []).map(dia => {
                const s = getDayStatus(dia, workout.attendanceDates, workout.logDates)
                return (
                  <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, minWidth: 52 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{dia}</span>
                    <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {workout.workoutDays?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Divisão</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workout.workoutDays.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#F5C842,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#431C00', flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{d.day_of_week ? `${d.day_of_week} — ` : ''}{d.name}{d.focus ? ` (${d.focus})` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { onClose(); navigate('workout-editor', { studentId: workout.student_id, planId: workout.id }) }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              Editar Treino
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── WorkoutChip ────────────────────────────────────────────────────────────
function WorkoutChip({ workout, dia, onClick }) {
  const [hov, setHov] = useState(false)
  const s        = getDayStatus(dia, workout.attendanceDates, workout.logDates, workout.makeupDays)
  const initials = workout.studentName.split(' ').map(p => p[0]).slice(0, 2).join('')
  const g        = GOAL[workout.goal]
  return (
    <div onClick={() => onClick(workout)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 12, padding: '9px 10px', cursor: 'pointer', marginBottom: 7, background: hov ? 'linear-gradient(135deg,#FDE68A,#F5C842)' : 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: `1.5px solid ${hov ? '#D97706' : '#FBBF2455'}`, boxShadow: hov ? '0 6px 18px rgba(245,200,66,0.35)' : '0 2px 6px rgba(245,200,66,0.15)', transition: 'all 0.18s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: g ? g.accent : SIDEBAR_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>{initials}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#431C00' }}>{workout.studentName.split(' ')[0]}</div>
      </div>
      <div style={{ fontSize: 10, color: '#7C4A00', fontWeight: 600, marginBottom: 5, lineHeight: 1.3 }}>{workout.title}</div>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
    </div>
  )
}



// ── AvaliacaoChip ─────────────────────────────────────────────────────────────
function AvaliacaoChip({ item }) {
  const [hov, setHov] = useState(false)
  const TIPO_LABEL = { motor:'Motor', tecnico:'Técnico', completa:'Completa' }
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius:12, padding:'9px 10px', marginBottom:7, cursor:'default',
        background: hov ? '#E9D5FF' : '#F3E8FF',
        border: '1.5px solid #D8B4FE',
        boxShadow: hov ? '0 4px 14px rgba(139,92,246,0.25)' : '0 1px 4px rgba(139,92,246,0.1)',
        transition:'all 0.18s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
        <div style={{ width:16, height:16, borderRadius:4, background:'#7C3AED', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <div style={{ fontSize:10, fontWeight:800, color:'#5B21B6', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          Avaliação
        </div>
      </div>
      <div style={{ fontSize:10, color:'#6D28D9', fontWeight:600, lineHeight:1.3 }}>{item.titulo}</div>
      <div style={{ fontSize:8, color:'#8B5CF6', marginTop:3, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>
        {TIPO_LABEL[item.tipo] || item.tipo} · {item.turma}
      </div>
    </div>
  )
}

// ── DiaDetalheModal ──────────────────────────────────────────────────────────
function DiaDetalheModal({ dia, workouts, escolinhaItems, avaliacaoItems, onClose }) {
  const FOCO_COLORS = {
    'Físico':      { color:'#EF4444', bg:'rgba(239,68,68,0.1)' },
    'Técnico':     { color:'#3B82F6', bg:'rgba(59,130,246,0.1)' },
    'Lúdico':      { color:'#8B5CF6', bg:'rgba(139,92,246,0.1)' },
    'Competitivo': { color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },
    'Progressão':  { color:'#10B981', bg:'rgba(16,185,129,0.1)' },
    'Misto':       { color:'#64748B', bg:'rgba(100,116,139,0.1)' },
  }
  const diaWorkouts  = workouts.filter(w => (w.days||[]).includes(dia))
  const diaEscolinha = escolinhaItems.filter(e => e.dia === dia)
  const diaAvaliacoes = avaliacaoItems.filter(a => a.dia === dia)
  const temConteudo  = diaWorkouts.length > 0 || diaEscolinha.length > 0 || diaAvaliacoes.length > 0

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0C4A6E,#155E8E)', padding:'18px 22px', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{dia}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>
              {diaWorkouts.length} academia · {diaEscolinha.length} escolinha {diaAvaliacoes.length > 0 ? `· ${diaAvaliacoes.length} avaliação` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            Fechar
          </button>
        </div>

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Avaliações */}
          {diaAvaliacoes.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#5B21B6', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Avaliações Programadas
              </div>
              {diaAvaliacoes.map((av, i) => (
                <div key={i} style={{ background:'#F3E8FF', border:'1.5px solid #D8B4FE', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#5B21B6', marginBottom:4 }}>{av.titulo}</div>
                  <div style={{ fontSize:11, color:'#7C3AED' }}>{av.turma} · {av.tipo === 'completa' ? 'Motor + Técnico' : av.tipo === 'motor' ? 'Motor (TGMD-3)' : 'Técnico'}</div>
                  {av.data && (
                    <div style={{ fontSize:10, color:'#9CA3AF', marginTop:4 }}>
                      {new Date(av.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Escolinha */}
          {diaEscolinha.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#1E40AF', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Escolinha
              </div>
              {diaEscolinha.map((item, i) => {
                const fc = FOCO_COLORS[item.focoTipo] || FOCO_COLORS['Misto']
                return (
                  <div key={i} style={{ background:fc.bg, border:`1.5px solid ${fc.color}30`, borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:fc.color, flexShrink:0 }} />
                      <div style={{ fontSize:13, fontWeight:800, color:fc.color }}>{item.turma}</div>
                      <span style={{ fontSize:10, background:fc.color+'20', color:fc.color, borderRadius:20, padding:'2px 8px', fontWeight:700 }}>{item.focoTipo}</span>
                    </div>
                    {item.descricao && (
                      <div style={{ fontSize:12, color:fc.color, opacity:0.8, marginBottom:8 }}>{item.descricao}</div>
                    )}
                    {/* Quadro tático / blocos da aula */}
                    {item.blocos.length > 0 && (
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:fc.color, opacity:0.7, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                          Plano de Aula
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {item.blocos.map((b, j) => {
                            const BLOCO_COLORS = { 'Aquecimento':'#F97316','Físico':'#EF4444','Técnico':'#3B82F6','Lúdico':'#8B5CF6','Competitivo':'#F59E0B','Progressão':'#10B981','Volta à calma':'#06B6D4' }
                            const bc = BLOCO_COLORS[b.tipo] || '#64748B'
                            return (
                              <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.7)', borderRadius:8, border:`1px solid ${bc}25` }}>
                                <div style={{ width:3, borderRadius:2, background:bc, alignSelf:'stretch', flexShrink:0 }} />
                                <div style={{ flex:1 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span style={{ fontSize:11, fontWeight:700, color:'#0D1B2A' }}>{b.nome || b.tipo}</span>
                                    {b.duracao_min && <span style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>{b.duracao_min}min</span>}
                                  </div>
                                  <span style={{ fontSize:9, background:bc+'18', color:bc, borderRadius:10, padding:'1px 6px', fontWeight:700 }}>{b.tipo}</span>
                                </div>
                              </div>
                            )
                          })}
                          <div style={{ textAlign:'right', fontSize:10, color:'#94A3B8', marginTop:2 }}>
                            Total: {item.blocos.reduce((a,b) => a+(parseInt(b.duracao_min)||0), 0)}min
                          </div>
                        </div>
                      </div>
                    )}
                    {item.blocos.length === 0 && (
                      <div style={{ fontSize:11, color:fc.color, opacity:0.5, fontStyle:'italic' }}>
                        Plano de aula ainda não definido
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Academia */}
          {diaWorkouts.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#92400E', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Academia — {diaWorkouts.length} aluno{diaWorkouts.length!==1?'s':''}
              </div>
              {diaWorkouts.map(w => {
                const g = GOAL[w.goal]
                return (
                  <div key={w.id} style={{ background:'#FFFBEB', border:'1.5px solid #FBBF2450', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:g?g.accent:'#0C4A6E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>
                        {w.studentName.split(' ').map(p=>p[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#431C00' }}>{w.studentName}</div>
                        <div style={{ fontSize:10, color:'#92400E' }}>{w.title}</div>
                      </div>
                    </div>
                    {w.workoutDays?.filter(d => d.day_of_week === dia).map(d => (
                      <div key={d.id || d.name} style={{ fontSize:11, color:'#7C4A00', padding:'4px 8px', background:'rgba(245,200,66,0.1)', borderRadius:6, marginTop:4 }}>
                        {d.name}{d.focus ? ` — ${d.focus}` : ''}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {!temConteudo && (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#94A3B8', fontSize:13 }}>
              Nenhuma atividade programada para {dia}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── EscolinhaChip ─────────────────────────────────────────────────────────────
const FOCO_CHIP_COLORS = {
  'Físico':      { bg:'#FEE2E2', border:'#FECACA', text:'#991B1B', dot:'#EF4444' },
  'Técnico':     { bg:'#DBEAFE', border:'#BFDBFE', text:'#1E40AF', dot:'#3B82F6' },
  'Lúdico':      { bg:'#EDE9FE', border:'#DDD6FE', text:'#5B21B6', dot:'#8B5CF6' },
  'Competitivo': { bg:'#FEF3C7', border:'#FDE68A', text:'#92400E', dot:'#F59E0B' },
  'Progressão':  { bg:'#D1FAE5', border:'#A7F3D0', text:'#064E3B', dot:'#10B981' },
  'Misto':       { bg:'#F1F5F9', border:'#E2E8F0', text:'#475569', dot:'#94A3B8' },
}
// SPORT_ICON_SMALL removed — use SportIcon component
function EscolinhaChip({ item }) {
  const [hov, setHov] = useState(false)
  const fc = FOCO_CHIP_COLORS[item.focoTipo] || FOCO_CHIP_COLORS['Misto']
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius:12, padding:'9px 10px', marginBottom:7, cursor:'default',
        background: hov ? fc.border : fc.bg,
        border: `1.5px solid ${fc.border}`,
        boxShadow: hov ? '0 4px 14px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition:'all 0.18s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <SportIcon id={item.esporte} size={14} />
        <div style={{ fontSize:11, fontWeight:800, color:fc.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {item.turma}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:fc.dot, flexShrink:0 }} />
        <span style={{ fontSize:10, fontWeight:700, color:fc.text }}>{item.focoTipo}</span>
      </div>
      {item.blocos.length > 0 && (
        <div style={{ marginTop:4, display:'flex', gap:3, flexWrap:'wrap' }}>
          {item.blocos.slice(0,3).map((b,i) => (
            <span key={i} style={{ fontSize:8, background:'rgba(0,0,0,0.08)', borderRadius:10, padding:'1px 5px', color:fc.text, fontWeight:600 }}>
              {b.nome || b.tipo} {b.duracao_min ? b.duracao_min+'m' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TabTreinos ─────────────────────────────────────────────────────────────
function TabTreinos({ workouts, navigate, session }) {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [modalWorkout, setModalWorkout]       = useState(null)
  const [escolinhaItems, setEscolinhaItems]   = useState([])
  const [avaliacaoItems, setAvaliacaoItems]   = useState([]) // { dia, turma, titulo, tipo }
  const [diaModal, setDiaModal]               = useState(null) // dia clicado para ver detalhe

  const filtered       = selectedStudent ? workouts.filter(w => w.student_id === selectedStudent) : workouts
  const uniqueStudents = [...new Map(workouts.map(w => [w.student_id, { id: w.student_id, name: w.studentName }])).values()]

  // Buscar aulas da Escolinha da semana atual
  useEffect(() => {
    if (!session?.user?.id) return
    const load = async () => {
      try {
        // Pegar turmas do professor
        const { data: turmas } = await supabase.from('turmas')
          .select('id, nome, esporte, dias_semana')
          .eq('teacher_id', session.user.id).eq('ativo', true)
        if (!turmas || turmas.length === 0) return

        const turmaIds = turmas.map(t => t.id)
        // Pegar planejamentos ativos
        const { data: plans } = await supabase.from('planejamentos')
          .select('id, turma_id, titulo, total_semanas, data_inicio')
          .in('turma_id', turmaIds)
        if (!plans || plans.length === 0) return

        const today = new Date()
        const items = []

        for (const plan of plans) {
          // Calcular semana atual
          let semanaAtual = 1
          if (plan.data_inicio) {
            const inicio = new Date(plan.data_inicio)
            const diff = Math.floor((today - inicio) / (7 * 24 * 3600 * 1000))
            semanaAtual = Math.max(1, Math.min(diff + 1, plan.total_semanas))
          }
          // Buscar bloco da semana atual
          const { data: bloco } = await supabase.from('blocos_semana')
            .select('*, planos_aula(*)')
            .eq('planejamento_id', plan.id)
            .eq('semana_numero', semanaAtual)
            .single()

          if (!bloco) continue
          const turma = turmas.find(t => t.id === plan.turma_id)

          // Cada dia de treino da turma gera um item no cronograma
          const diasTurma = turma?.dias_semana || []
          // Buscar planos de aula do bloco para pegar dias específicos
          const { data: planos } = await supabase.from('planos_aula')
            .select('dia_semana, status, blocos_aula(tipo, nome, duracao_min)')
            .eq('bloco_semana_id', bloco.id)

          const diasComPlano = new Set((planos || []).map(p => p.dia_semana))

          // Adicionar todos os dias da turma
          const todosOsDias = diasComPlano.size > 0
            ? [...diasComPlano]
            : diasTurma

          todosOsDias.forEach(dia => {
            const planoDodia = (planos || []).find(p => p.dia_semana === dia)
            items.push({
              dia,
              turmaId: turma.id,
              turma: turma.nome,
              esporte: turma.esporte,
              planTitulo: plan.titulo,
              semana: semanaAtual,
              focoTipo: bloco.tipo_foco,
              descricao: bloco.descricao_geral || '',
              blocos: planoDodia?.blocos_aula || [],
              status: planoDodia?.status || 'planejado',
            })
          })
        }
        setEscolinhaItems(items)

        // Buscar avaliações da semana atual para cada turma
        const avItems = []
        if (turmaIds.length > 0) {
          const { data: avals } = await supabase.from('avaliacoes_turma')
            .select('id, turma_id, titulo, tipo, semana_numero, data_prevista')
            .in('turma_id', turmaIds)
          if (avals) {
            avals.forEach(av => {
              const turma = turmas.find(t => t.id === av.turma_id)
              if (!turma) return
              // Determinar em qual dia cai baseado na data_prevista ou dias da turma
              if (av.data_prevista) {
                const d = new Date(av.data_prevista + 'T12:00:00')
                const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
                const diaSemana = DIAS[d.getDay()]
                avItems.push({ dia: diaSemana, turma: turma.nome, turmaId: turma.id, titulo: av.titulo, tipo: av.tipo, data: av.data_prevista, avId: av.id })
              } else if (av.semana_numero) {
                // Sem data: marcar no primeiro dia da turma
                const diasTurma = turma.dias_semana || []
                if (diasTurma.length > 0) {
                  avItems.push({ dia: diasTurma[0], turma: turma.nome, turmaId: turma.id, titulo: av.titulo, tipo: av.tipo, avId: av.id })
                }
              }
            })
          }
        }
        setAvaliacaoItems(avItems)
      } catch (err) {
        console.error('escolinha cronograma error:', err)
      }
    }
    load()
  }, [session])

  return (
    <div>
      {modalWorkout && <WorkoutModal workout={modalWorkout} onClose={() => setModalWorkout(null)} navigate={navigate} />}
      {diaModal && (
        <DiaDetalheModal
          dia={diaModal}
          workouts={filtered}
          escolinhaItems={escolinhaItems}
          avaliacaoItems={avaliacaoItems}
          onClose={() => setDiaModal(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 4, textShadow:'0 1px 3px rgba(255,255,255,0.5)' }}>Cronograma Semanal</h1>
          <p style={{ fontSize: 13, color: '#0C4A6E' }}>
            <span style={{ color: '#059669', fontWeight: 700 }}>{workouts.length} planos ativos</span>
            {' · '}{uniqueStudents.length} alunos com treino
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.8)', backdropFilter:'blur(8px)' }}>
        <span style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, alignSelf: 'center', marginRight: 4 }}>Filtrar:</span>
        {[{ id: null, name: 'Todos' }, ...uniqueStudents].map(opt => (
          <button key={opt.id ?? 'all'} onClick={() => setSelectedStudent(opt.id)}
            style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: selectedStudent === opt.id ? 'linear-gradient(135deg,#F5C842,#D97706)' : 'rgba(255,255,255,0.7)', color: selectedStudent === opt.id ? '#431C00' : '#64748B', boxShadow: selectedStudent === opt.id ? '0 3px 10px rgba(245,200,66,0.4)' : '0 1px 3px rgba(0,0,0,0.07)' }}>
            {opt.name === 'Todos' ? 'Todos' : opt.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: '#FFF', borderRadius: 18, overflow: 'hidden', border: '1.5px solid rgba(245,200,66,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        <div className="db-week-grid"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '2px solid #FEF3C7' }}>
          {DIAS_SEMANA.map((dia, i) => {
            const count = filtered.filter(w => (w.days || []).includes(dia)).length
            const countEsc = escolinhaItems.filter(e => e.dia === dia).length
            const countAv = avaliacaoItems.filter(a => a.dia === dia).length
            return (
              <div key={dia} onClick={() => setDiaModal(dia)}
                style={{ padding: '14px 8px 12px', textAlign: 'center', background: i >= 5 ? 'rgba(245,200,66,0.06)' : 'transparent', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = i>=5?'rgba(245,200,66,0.12)':'rgba(12,74,110,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i>=5?'rgba(245,200,66,0.06)':'transparent'}>
                <div style={{ fontSize: 13, fontWeight: 800, color: i >= 5 ? '#D97706' : '#0D1B2A', marginBottom: 4 }}>{dia}</div>
                <div style={{ display:'flex', gap:3, justifyContent:'center', flexWrap:'wrap' }}>
                  {count > 0 && <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00' }}>{count} acad.</div>}
                  {countEsc > 0 && <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#DBEAFE', color: '#1E40AF', border:'1px solid #BFDBFE' }}>{countEsc} esc.</div>}
                  {countAv > 0 && <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#F3E8FF', color: '#5B21B6', border:'1px solid #D8B4FE' }}>{countAv} aval.</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', minHeight: 260 }}>
          {DIAS_SEMANA.map((dia, i) => {
            const dayWorkouts = filtered.filter(w => (w.days || []).includes(dia))
            const dayEscolinha = escolinhaItems.filter(e => e.dia === dia)
            const isEmpty = dayWorkouts.length === 0 && dayEscolinha.length === 0
            return (
              <div key={dia} style={{ padding: '12px 8px', background: i >= 5 ? 'rgba(245,200,66,0.03)' : 'transparent', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none' }}>
                {isEmpty
                  ? <div style={{ textAlign: 'center', paddingTop: 30, color: '#E2E8F0', fontSize: 20 }}>·</div>
                  : (
                    <>
                      {dayWorkouts.map(w => <WorkoutChip key={w.id + dia} workout={w} dia={dia} onClick={setModalWorkout} />)}
                      {dayEscolinha.map((item, idx) => <EscolinhaChip key={item.turmaId + dia + idx} item={item} />)}
                      {avaliacaoItems.filter(a => a.dia === dia).map((item, idx) => <AvaliacaoChip key={item.avId + idx} item={item} />)}
                    </>
                  )
                }
              </div>
            )
          })}
        </div>
      </div>
      </div>{/* end db-week-grid */}
      {/* Legenda */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'linear-gradient(135deg,#F5C842,#D97706)' }} />
          <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>Academia</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#3B82F6' }} />
          <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>Escolinha</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#7C3AED' }} />
          <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>Avaliação</span>
        </div>
        <span style={{ fontSize:11, color:'#0C4A6E', opacity:0.5 }}>·</span>
        {[{ dot:'#059669', label:'Feito' }, { dot:'#F59E0B', label:'Recuperado' }, { dot:'#F97316', label:'Ainda dá' }, { dot:'#EF4444', label:'Faltou' }, { dot:'#94A3B8', label:'Agendado' }].map(({ dot, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:dot }} />
            <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


// ── TabEvolucao ────────────────────────────────────────────────────────────
const MEDIDAS_CONFIG = [
  { key: 'waist', label: 'Cintura',  color: '#6366F1', unit: 'cm' },
  { key: 'chest', label: 'Peito',    color: '#EC4899', unit: 'cm' },
  { key: 'hip',   label: 'Quadril',  color: '#F59E0B', unit: 'cm' },
  { key: 'thigh', label: 'Coxa',     color: '#10B981', unit: 'cm' },
  { key: 'arm',   label: 'Braço',    color: '#3B82F6', unit: 'cm' },
  { key: 'calf',  label: 'Panturrilha', color: '#EF4444', unit: 'cm' },
]

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(12px)',
  borderRadius: 18,
  border: '1.5px solid rgba(255,255,255,0.85)',
  boxShadow: '0 4px 24px rgba(12,50,81,0.1)',
  padding: '22px 24px',
  marginBottom: 20,
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = String(d).slice(0,10).split('-')
  return `${day}/${m}`
}

function CustomTooltip({ active, payload, label, unit }) {
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

// Modal para registrar nova entrada
function EvolucaoModal({ studentId, mode, onSave, onClose, exercises }) {
  const today = new Date().toISOString().slice(0,10)
  const [date, setDate]       = useState(today)
  const [saving, setSaving]   = useState(false)

  // Peso
  const [weight, setWeight]   = useState('')
  const [notes, setNotes]     = useState('')

  // Medidas
  const [medidas, setMedidas] = useState({})

  // Força
  const [exId, setExId]       = useState(exercises?.[0]?.id || '')
  const [sets, setSets]       = useState([{ weight: '', reps: '' }])

  const inp  = { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 8, padding: '9px 12px', color: '#0D1B2A', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl  = { fontSize: 11, color: '#0C4A6E', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5, display: 'block', marginTop: 14 }

  const save = async () => {
    if (!studentId) return
    setSaving(true)
    if (mode === 'peso') {
      await supabase.from('progress_entries').insert([{ student_id: studentId, date, weight: +weight || null, notes }])
    } else if (mode === 'medidas') {
      const m = {}
      MEDIDAS_CONFIG.forEach(({ key }) => { if (medidas[key]) m[key] = +medidas[key] })
      await supabase.from('progress_entries').insert([{ student_id: studentId, date, measurements: m }])
    } else if (mode === 'forca') {
      const validSets = sets.filter(s => s.weight && s.reps)
      if (validSets.length > 0 && exId) {
        await supabase.from('exercise_logs').insert([{ student_id: studentId, exercise_id: exId, date, sets: validSets.map(s => ({ weight: +s.weight, reps: +s.reps })) }])
      }
    }
    setSaving(false)
    onSave()
    onClose()
  }

  const titles = { peso: 'Registrar Peso', medidas: 'Registrar Medidas', forca: 'Registrar Carga' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(12,50,81,0.2)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0C3251', marginBottom: 18 }}>{titles[mode]}</div>

        <label style={lbl}>Data</label>
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />

        {mode === 'peso' && (
          <>
            <label style={lbl}>Peso (kg)</label>
            <input type="number" step="0.1" placeholder="Ex: 80.5" style={inp} value={weight} onChange={e => setWeight(e.target.value)} />
            <label style={lbl}>Observações</label>
            <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} />
          </>
        )}

        {mode === 'medidas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            {MEDIDAS_CONFIG.map(({ key, label }) => (
              <div key={key}>
                <label style={{ ...lbl, marginTop: 6 }}>{label} (cm)</label>
                <input type="number" step="0.1" placeholder="—" style={inp} value={medidas[key] || ''} onChange={e => setMedidas(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {mode === 'forca' && (
          <>
            <label style={lbl}>Exercício</label>
            <select style={inp} value={exId} onChange={e => setExId(e.target.value)}>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <label style={{ ...lbl, marginTop: 14 }}>Séries</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sets.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, minWidth: 20 }}>S{i+1}</span>
                  <input type="number" placeholder="kg" style={{ ...inp, flex: 1 }} value={s.weight} onChange={e => setSets(prev => prev.map((x,j) => j===i ? { ...x, weight: e.target.value } : x))} />
                  <input type="number" placeholder="reps" style={{ ...inp, flex: 1 }} value={s.reps} onChange={e => setSets(prev => prev.map((x,j) => j===i ? { ...x, reps: e.target.value } : x))} />
                  {sets.length > 1 && <button onClick={() => setSets(p => p.filter((_,j) => j!==i))} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}>×</button>}
                </div>
              ))}
              <button onClick={() => setSets(p => [...p, { weight: '', reps: '' }])} style={{ background: 'rgba(12,74,110,0.08)', border: '1px dashed rgba(12,74,110,0.3)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#0C4A6E', fontSize: 12, fontWeight: 700 }}>+ Adicionar série</button>
            </div>
          </>
        )}

        <button onClick={save} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: 13, color: '#431C00', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(12,74,110,0.2)', borderRadius: 10, padding: 12, color: '#0C4A6E', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>Cancelar</button>
      </div>
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: 10 }}>
      <div style={{ fontSize: 36 }}></div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum registro de {label} ainda</div>
    </div>
  )
}

function TabEvolucao({ students }) {
  const [selectedId, setSelectedId] = useState(null)
  const [subTab, setSubTab]         = useState('peso')
  const [entries, setEntries]       = useState([])
  const [exLogs, setExLogs]         = useState([])
  const [exercises, setExercises]   = useState([])
  const [selExId, setSelExId]       = useState(null)
  const [modal, setModal]           = useState(null) // 'peso' | 'medidas' | 'forca'
  const [loading, setLoading]       = useState(false)

  const student = students.find(s => s.id === selectedId)

  const fetchData = useCallback(async (sid) => {
    if (!sid) return
    setLoading(true)
    const [progRes, logsRes, exRes] = await Promise.all([
      supabase.from('progress_entries').select('*').eq('student_id', sid).order('date'),
      supabase.from('exercise_logs').select('*, exercises(name)').eq('student_id', sid).order('date'),
      supabase.from('exercises')
        .select('id, name, workout_days!inner(workout_plans!inner(student_id))')
        .eq('workout_days.workout_plans.student_id', sid),
    ])
    setEntries(progRes.data || [])
    setExLogs(logsRes.data || [])
    // Deduplicate exercises by name
    const seen = new Set()
    const exList = []
    ;(exRes.data || []).forEach(e => { if (!seen.has(e.name)) { seen.add(e.name); exList.push(e) } })
    // Also add exercises from logs in case plan changed
    ;(logsRes.data || []).forEach(l => {
      if (l.exercises && !seen.has(l.exercises.name)) {
        seen.add(l.exercises.name)
        exList.push({ id: l.exercise_id, name: l.exercises.name })
      }
    })
    setExercises(exList)
    if (exList.length > 0 && !selExId) setSelExId(exList[0].id)
    setLoading(false)
  }, [selExId])

  useEffect(() => { if (selectedId) fetchData(selectedId) }, [selectedId])

  // ── Dados para gráfico de peso ──
  const pesoData = entries
    .filter(e => e.weight)
    .map(e => ({ date: fmtDate(e.date), Peso: +e.weight, full: e.date }))

  // ── Dados para gráfico de medidas ──
  const medidasData = entries
    .filter(e => e.measurements && Object.keys(e.measurements).length > 0)
    .map(e => {
      const obj = { date: fmtDate(e.date) }
      MEDIDAS_CONFIG.forEach(({ key, label }) => { if (e.measurements[key]) obj[label] = +e.measurements[key] })
      return obj
    })
  const medidasAtivas = MEDIDAS_CONFIG.filter(m => medidasData.some(d => d[m.label] !== undefined))

  // ── Dados para gráfico de força ──
  const forcaData = (() => {
    if (!selExId) return []
    const filtered = exLogs.filter(l => l.exercise_id === selExId)
    // Group by date, get max weight of all sets
    const byDate = {}
    filtered.forEach(l => {
      const d = fmtDate(l.date)
      const maxW = Math.max(...(l.sets || []).map(s => +s.weight || 0))
      if (!byDate[d] || maxW > byDate[d]) byDate[d] = maxW
    })
    return Object.entries(byDate).map(([date, Máx]) => ({ date, Máx }))
  })()

  const selEx = exercises.find(e => e.id === selExId)

  const subTabs = [
    { id: 'peso',    icon: null, label: 'Peso'    },
    { id: 'medidas', icon: null, label: 'Medidas' },
    { id: 'forca',   icon: null, label: 'Força'   },
  ]

  return (
    <div>
      {modal && (
        <EvolucaoModal
          studentId={selectedId}
          mode={modal}
          exercises={exercises}
          onSave={() => fetchData(selectedId)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 4, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>Evolução</h1>
        <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight: 600 }}>Acompanhe o progresso dos seus alunos</p>
      </div>

      {/* Selector de aluno */}
      <div style={{ ...GLASS_CARD, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Selecionar Aluno</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {students.map(s => {
            const sel = s.id === selectedId
            const g = GOAL[s.goal]
            return (
              <button key={s.id} onClick={() => { setSelectedId(s.id); setSubTab('peso') }}
                style={{ padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: sel ? 'none' : '1px solid rgba(12,74,110,0.15)', transition: 'all 0.15s', background: sel ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(255,255,255,0.7)', color: sel ? '#431C00' : '#0C4A6E', boxShadow: sel ? '0 3px 12px rgba(245,200,66,0.4)' : 'none' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
          {students.length === 0 && <span style={{ fontSize: 13, color: '#94A3B8' }}>Nenhum aluno cadastrado</span>}
        </div>
      </div>

      {!selectedId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#0C4A6E', opacity: 0.4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Selecione um aluno para ver a evolução</div>
        </div>
      )}

      {selectedId && (
        <>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {subTabs.map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                style={{ padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: subTab === t.id ? 'linear-gradient(135deg,#0C4A6E,#155E8E)' : 'rgba(255,255,255,0.65)', color: subTab === t.id ? '#FFF' : '#0C4A6E', boxShadow: subTab === t.id ? '0 4px 14px rgba(12,74,110,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', backdropFilter: 'blur(6px)' }}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setModal(subTab)}
              style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', boxShadow: '0 4px 14px rgba(245,200,66,0.4)' }}>
              + Registrar
            </button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#0C4A6E', opacity: 0.5, fontWeight: 600 }}>Carregando...</div>}

          {!loading && (
            <>
              {/* ── PESO ── */}
              {subTab === 'peso' && (
                <div style={GLASS_CARD}>
                  <div className="db-search-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Peso ao longo do tempo</div>
                      {pesoData.length > 0 && (
                        <div style={{ fontSize: 12, color: '#0C4A6E', marginTop: 4 }}>
                          Início: <b>{pesoData[0].Peso}kg</b>
                          {' · '}Atual: <b>{pesoData[pesoData.length-1].Peso}kg</b>
                          {' · '}
                          <span style={{ color: pesoData[pesoData.length-1].Peso < pesoData[0].Peso ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                            {pesoData[pesoData.length-1].Peso < pesoData[0].Peso ? '▼' : '▲'}
                            {Math.abs(pesoData[pesoData.length-1].Peso - pesoData[0].Peso).toFixed(1)}kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {pesoData.length < 2 ? <EmptyChart label="peso" /> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={pesoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="kg" domain={['auto','auto']} />
                        <Tooltip content={<CustomTooltip unit="kg" />} />
                        <Line type="monotone" dataKey="Peso" stroke="#155E8E" strokeWidth={2.5} dot={{ r: 4, fill: '#155E8E', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        {pesoData.length > 0 && (
                          <ReferenceLine y={pesoData[pesoData.length-1].Peso} stroke="#F5C842" strokeDasharray="4 4" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {/* Histórico */}
                  {pesoData.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(12,74,110,0.08)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Histórico</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {[...entries].filter(e => e.weight).reverse().map(e => (
                          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(12,74,110,0.04)', borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{String(e.date).slice(0,10).split('-').reverse().join('/')}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0C3251' }}>{e.weight} kg</span>
                            {e.notes && <span style={{ fontSize: 11, color: '#94A3B8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MEDIDAS ── */}
              {subTab === 'medidas' && (
                <div style={GLASS_CARD}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251', marginBottom: 20 }}>Medidas corporais</div>
                  {medidasData.length < 2 ? <EmptyChart label="medidas" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={medidasData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="cm" domain={['auto','auto']} />
                        <Tooltip content={<CustomTooltip unit="cm" />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {medidasAtivas.map(m => (
                          <Line key={m.key} type="monotone" dataKey={m.label} stroke={m.color} strokeWidth={2} dot={{ r: 3, fill: m.color, stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {/* Último registro */}
                  {medidasData.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(12,74,110,0.08)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Último Registro</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {MEDIDAS_CONFIG.map(({ key, label, color }) => {
                          const last = [...entries].filter(e => e.measurements?.[key]).pop()
                          if (!last) return null
                          const prev = [...entries].filter(e => e.measurements?.[key] && e.id !== last.id).pop()
                          const diff = prev ? (+last.measurements[key] - +prev.measurements[key]).toFixed(1) : null
                          return (
                            <div key={key} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 16px', border: `2px solid ${color}30`, minWidth: 110, textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#0C3251' }}>{last.measurements[key]}<span style={{ fontSize: 11 }}>cm</span></div>
                              {diff !== null && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: +diff < 0 ? '#10B981' : '#EF4444', marginTop: 3 }}>
                                  {+diff < 0 ? '▼' : '▲'}{Math.abs(diff)}cm
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── FORÇA ── */}
              {subTab === 'forca' && (
                <div style={GLASS_CARD}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Força por exercício</div>
                  </div>
                  {exercises.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum exercício encontrado para este aluno</div>
                    </div>
                  ) : (
                    <>
                      {/* Selector de exercício */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                        {exercises.map(ex => (
                          <button key={ex.id} onClick={() => setSelExId(ex.id)}
                            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: selExId === ex.id ? 'none' : '1px solid rgba(12,74,110,0.15)', background: selExId === ex.id ? 'linear-gradient(135deg,#155E8E,#0C4A6E)' : 'rgba(255,255,255,0.7)', color: selExId === ex.id ? '#FFF' : '#0C4A6E', transition: 'all 0.15s' }}>
                            {ex.name}
                          </button>
                        ))}
                      </div>

                      {forcaData.length < 2 ? <EmptyChart label={`carga em ${selEx?.name || 'exercício'}`} /> : (
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={forcaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="kg" domain={['auto','auto']} />
                            <Tooltip content={<CustomTooltip unit="kg" />} />
                            <Line type="monotone" dataKey="Máx" name="Carga máx." stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4, fill: '#7C3AED', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {/* Novo PR banner */}
                      {forcaData.length > 1 && forcaData[forcaData.length-1].Máx >= Math.max(...forcaData.slice(0,-1).map(d => d.Máx)) && (
                        <div style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', borderRadius: 14, padding: '12px 18px', marginTop: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(124,58,237,0.4)', animation: 'pulse 2s ease-in-out infinite' }}>
                          <div style={{ fontSize: 28, color:'#7C3AED' }}>PR</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Novo Recorde Pessoal!</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                              {selEx?.name}: <strong>{forcaData[forcaData.length-1].Máx}kg</strong> em {forcaData[forcaData.length-1].date}
                            </div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, color: '#FFF', fontWeight: 700 }}>
                            +{(forcaData[forcaData.length-1].Máx - forcaData[forcaData.length-2].Máx).toFixed(1)}kg
                          </div>
                        </div>
                      )}

                      {/* PR — maior carga registrada */}
                      {forcaData.length > 0 && (
                        <div style={{ marginTop: 20, borderTop: '1px solid rgba(12,74,110,0.08)', paddingTop: 14, display: 'flex', gap: 16 }}>
                          {[
                            { label: 'Carga Inicial', val: forcaData[0].Máx, color: '#64748B' },
                            { label: 'Carga Atual',   val: forcaData[forcaData.length-1].Máx, color: '#155E8E' },
                            { label: 'PR',          val: Math.max(...forcaData.map(d => d.Máx)), color: '#7C3AED' },
                          ].map(({ label, val, color }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 18px', border: `1px solid rgba(255,255,255,0.9)`, textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}<span style={{ fontSize: 11 }}>kg</span></div>
                            </div>
                          ))}
                          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 18px', border: `1px solid rgba(255,255,255,0.9)`, textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Evolução</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: forcaData[forcaData.length-1].Máx >= forcaData[0].Máx ? '#10B981' : '#EF4444' }}>
                              {forcaData[forcaData.length-1].Máx >= forcaData[0].Máx ? '▲' : '▼'}
                              {Math.abs(forcaData[forcaData.length-1].Máx - forcaData[0].Máx).toFixed(1)}<span style={{ fontSize: 11 }}>kg</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}


// ── TabCardio ──────────────────────────────────────────────────────────────
const CARDIO_TYPES = [
  { id: 'corrida',     label: 'Corrida',       icon: null, color: '#EF4444', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'bike',        label: 'Bike',          icon: null, color: '#F59E0B', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'esteira',     label: 'Esteira',       icon: null, color: '#8B5CF6', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'eliptico',    label: 'Elíptico',      icon: null, color: '#06B6D4', hasDistance: false, hasHR: true,  isHIIT: false },
  { id: 'natacao',     label: 'Natação',       icon: null, color: '#3B82F6', hasDistance: true,  hasHR: false, isHIIT: false },
  { id: 'pular_corda', label: 'Pular Corda',   icon: null, color: '#10B981', hasDistance: false, hasHR: true,  isHIIT: false },
  { id: 'hiit',        label: 'HIIT',          icon: null, color: '#F5C842', hasDistance: false, hasHR: true,  isHIIT: true  },
]

const PSE_LABELS = ['', 'Muito leve', 'Leve', 'Moderado leve', 'Moderado', 'Moderado intenso', 'Intenso', 'Muito intenso', 'Difícil', 'Muito difícil', 'Máximo']

// Proporção cardio/musculação por objetivo (soma = 100)
// Baseado em: Willis et al. (2012), Pontzer et al. (2016), Hickson (1980), Seiler (2010)
const PRESCRICAO = {
  'Emagrecimento': {
    tipo: ['corrida','esteira','eliptico','bike'],
    destaque: 'corrida', // modalidade mais eficaz para o objetivo
    sessoes: '3–4x/semana',
    duracao: '30–50 min',
    pse: { min: 4, max: 6, label: 'PSE 4–6 — Moderado' },
    pace: 'Pace confortável — consegue conversar durante o esforço (zona aeróbica)',
    volume: '120–200 min/semana',
    mixCardio: 60, // % de cardio vs musculação na semana
    obs: 'Priorize esforço contínuo e controlado. Evite intensidade alta demais — compromete a recuperação e aumenta o apetite.',
    dicaCientifica: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg> Sem controle alimentar, o cardio isolado tem eficácia limitada. Estudos mostram que o corpo compensa o gasto do exercício reduzindo o metabolismo basal (Pontzer et al., 2016). Combine com treino de força para melhores resultados.',
  },
  'Ganho de Massa': {
    tipo: ['esteira','bike','eliptico','natacao'],
    destaque: 'bike', // baixo impacto, não interfere na recuperação muscular
    sessoes: '2x/semana',
    duracao: '20–30 min',
    pse: { min: 3, max: 5, label: 'PSE 3–5 — Leve a moderado' },
    pace: 'Recuperação ativa — ritmo leve, sem gerar fadiga muscular',
    volume: '40–60 min/semana',
    mixCardio: 20, // % de cardio — dominância de musculação
    obs: 'Cardio deve preservar a recuperação muscular. Volume alto prejudica o ganho de massa.',
    dicaCientifica: 'Cardio excessivo ativa o "efeito interferência" — compete com a síntese proteica e reduz os ganhos de força (Hickson, 1980; Wilson et al., 2012). Mantenha volume mínimo e priorize a musculação.',
  },
  'Condicionamento': {
    tipo: ['corrida','hiit','bike','eliptico'],
    destaque: 'corrida', // maior impacto no VO₂máx
    sessoes: '3–4x/semana',
    duracao: '30–45 min (base) + 1 sessão HIIT',
    pse: { min: 5, max: 8, label: 'PSE 5–8 — Moderado a intenso' },
    pace: '80% em ritmo estável (PSE 5–6) + 20% em alta intensidade — modelo polarizado',
    volume: '150–200 min/semana',
    mixCardio: 70, // % de cardio — foco aeróbico
    obs: 'Periodize a intensidade — não faça todo treino no mesmo ritmo. Modelo 80/20 comprovado em atletas.',
    dicaCientifica: 'O modelo polarizado (80% moderado / 20% intenso) superou o treinamento contínuo em melhora de VO₂máx (Seiler & Tønnessen, 2009; Stöggl & Sperlich, 2014). Evite fazer todos os treinos na mesma intensidade.',
  },
  'Força e Performance': {
    tipo: ['bike','eliptico','natacao','esteira'],
    destaque: 'bike', // menor impacto articular e menor interferência neural
    sessoes: '1–2x/semana',
    duracao: '20–30 min',
    pse: { min: 3, max: 4, label: 'PSE 3–4 — Leve' },
    pace: 'Baixa intensidade, baixo impacto — foco em recuperação ativa, não em performance aeróbia',
    volume: '30–50 min/semana',
    mixCardio: 15, // % mínimo de cardio — dominância absoluta de força
    obs: 'Cardio intenso compete diretamente com adaptações neuromusculares. Mantenha volume mínimo.',
    dicaCientifica: 'Cardio de alta intensidade inibe a via mTOR e reduz ganhos de 1RM (Hawley, 2009). Para atletas de força, o cardio serve apenas para saúde cardiovascular mínima e recuperação — não como ferramenta de performance.',
  },
}



function formatPace(distKm, durMin) {
  if (!distKm || !durMin || distKm === 0) return '—'
  const paceMin = durMin / distKm
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60).toString().padStart(2, '0')
  return `${m}:${s}/km`
}

// Modal de registro de sessão de cardio (pelo aluno)
function CardioSessionModal({ studentId, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]           = useState(today)
  const [type, setType]           = useState('corrida')
  const [duration, setDuration]   = useState('')
  const [distance, setDistance]   = useState('')
  const [avgHr, setAvgHr]         = useState('')
  const [maxHr, setMaxHr]         = useState('')
  const [workSec, setWorkSec]     = useState('30')
  const [restSec, setRestSec]     = useState('15')
  const [rounds, setRounds]       = useState('8')
  const [pse, setPse]             = useState(5)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)

  const typeInfo = CARDIO_TYPES.find(t => t.id === type)

  const save = async () => {
    setSaving(true)
    const payload = {
      student_id: studentId,
      date,
      type,
      duration_minutes: +duration || null,
      distance_km:      typeInfo?.hasDistance ? (+distance || null) : null,
      avg_hr:           typeInfo?.hasHR       ? (+avgHr   || null) : null,
      max_hr:           typeInfo?.hasHR       ? (+maxHr   || null) : null,
      work_seconds:     typeInfo?.isHIIT      ? (+workSec || null) : null,
      rest_seconds:     typeInfo?.isHIIT      ? (+restSec || null) : null,
      rounds:           typeInfo?.isHIIT      ? (+rounds  || null) : null,
      pse:              +pse,
      notes,
    }
    await supabase.from('cardio_sessions').insert([payload])
    setSaving(false)
    onSave()
    onClose()
  }

  const inp = { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 8, padding: '9px 12px', color: '#0D1B2A', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: '#0C4A6E', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5, display: 'block', marginTop: 14 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(12,50,81,0.2)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0C3251', marginBottom: 18 }}>Registrar Sessão de Cárdio</div>

        <label style={lbl}>Data</label>
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />

        <label style={lbl}>Modalidade</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
          {CARDIO_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              style={{ padding: '7px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: type === t.id ? t.color : 'rgba(255,255,255,0.7)', color: type === t.id ? '#FFF' : '#0C4A6E', transition: 'all 0.15s', boxShadow: type === t.id ? `0 3px 10px ${t.color}55` : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          <div>
            <label style={lbl}>Duração (min)</label>
            <input type="number" placeholder="Ex: 30" style={inp} value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          {typeInfo?.hasDistance && (
            <div>
              <label style={lbl}>Distância (km)</label>
              <input type="number" step="0.1" placeholder="Ex: 5.2" style={inp} value={distance} onChange={e => setDistance(e.target.value)} />
            </div>
          )}
          {typeInfo?.hasHR && (
            <>
              <div>
                <label style={lbl}>FC Média (bpm)</label>
                <input type="number" placeholder="Ex: 145" style={inp} value={avgHr} onChange={e => setAvgHr(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>FC Máx (bpm)</label>
                <input type="number" placeholder="Ex: 172" style={inp} value={maxHr} onChange={e => setMaxHr(e.target.value)} />
              </div>
            </>
          )}
          {typeInfo?.isHIIT && (
            <>
              <div>
                <label style={lbl}>Esforço (seg)</label>
                <input type="number" placeholder="30" style={inp} value={workSec} onChange={e => setWorkSec(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Descanso (seg)</label>
                <input type="number" placeholder="15" style={inp} value={restSec} onChange={e => setRestSec(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Rodadas</label>
                <input type="number" placeholder="8" style={inp} value={rounds} onChange={e => setRounds(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* PSE */}
        <label style={{ ...lbl, marginTop: 18 }}>PSE — Esforço Percebido: <span style={{ color: '#EF4444', fontWeight: 800 }}>{pse} — {PSE_LABELS[pse]}</span></label>
        <input type="range" min="1" max="10" value={pse} onChange={e => setPse(+e.target.value)}
          style={{ width: '100%', accentColor: '#155E8E', marginBottom: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
          <span>1 Leve</span><span>5 Moderado</span><span>10 Máximo</span>
        </div>

        <label style={lbl}>Observações</label>
        <textarea style={{ ...inp, minHeight: 55, resize: 'vertical' }} placeholder="Como foi o treino?" value={notes} onChange={e => setNotes(e.target.value)} />

        <button onClick={save} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: 13, color: '#431C00', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
          {saving ? 'Salvando...' : 'Salvar Sessão'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(12,74,110,0.2)', borderRadius: 10, padding: 12, color: '#0C4A6E', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>Cancelar</button>
      </div>
    </div>
  )
}

function TabCardio({ students }) {
  const [selectedId, setSelectedId] = useState(null)
  const [sessions, setSessions]     = useState([])
  const [modal, setModal]           = useState(false)
  const [loading, setLoading]       = useState(false)
  const [filterType, setFilterType] = useState('todos')

  const student = students.find(s => s.id === selectedId)
  // Normaliza objetivo: mapeia aliases comuns para as chaves do PRESCRICAO
  const GOAL_ALIAS = {
    'Perda de Peso':      'Emagrecimento',
    'Emagrecer':          'Emagrecimento',
    'Perda de peso':      'Emagrecimento',
    'Emagrecimento':      'Emagrecimento',
    'Ganho de Massa':     'Ganho de Massa',
    'Hipertrofia':        'Ganho de Massa',
    'Força':              'Força e Performance',
    'Força e Performance':'Força e Performance',
    'Condicionamento':    'Condicionamento',
    'Condicionamento Físico': 'Condicionamento',
    'Saúde e Bem-Estar':  'Condicionamento',
    'Desenvolvimento Atlético': 'Condicionamento',
    'Treinamento Competitivo':  'Condicionamento',
    'Iniciação Esportiva':      'Condicionamento',
  }
  const goalKey = student?.goal ? (GOAL_ALIAS[student.goal] || null) : null
  const presc   = goalKey ? PRESCRICAO[goalKey] : null

  const fetchSessions = useCallback(async (sid) => {
    if (!sid) return
    setLoading(true)
    const { data } = await supabase
      .from('cardio_sessions')
      .select('*')
      .eq('student_id', sid)
      .order('date', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (selectedId) fetchSessions(selectedId) }, [selectedId])

  const filtered = filterType === 'todos' ? sessions : sessions.filter(s => s.type === filterType)

  // Dados gráfico pace (corrida/esteira/bike com distância)
  const paceData = sessions
    .filter(s => s.distance_km && s.duration_minutes && ['corrida','esteira','bike'].includes(s.type))
    .map(s => ({
      date:   fmtDate(s.date),
      Pace:   parseFloat((s.duration_minutes / s.distance_km).toFixed(2)),
      type:   s.type,
    }))

  // Dados gráfico volume semanal (minutos por semana)
  const volumeData = (() => {
    const byWeek = {}
    sessions.forEach(s => {
      const d   = new Date(s.date + 'T12:00:00')
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(5, 10) // MM-DD
      byWeek[key] = (byWeek[key] || 0) + (s.duration_minutes || 0)
    })
    return Object.entries(byWeek).sort().map(([week, min]) => ({ week, Min: min }))
  })()

  // Stats gerais
  const totalSessoes = sessions.length
  const totalMin     = sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0)
  const totalKm      = sessions.reduce((a, s) => a + (s.distance_km || 0), 0)
  const avgPse       = sessions.length ? (sessions.reduce((a, s) => a + (s.pse || 0), 0) / sessions.length).toFixed(1) : '—'

  // ── Métricas inteligentes ──────────────────────────────────────────
  const _now = new Date()
  const _monOffset = (_now.getDay() + 6) % 7
  const _startOfWeek = new Date(_now); _startOfWeek.setDate(_now.getDate() - _monOffset); _startOfWeek.setHours(0,0,0,0)
  const thisWeekSessions = sessions.filter(s => new Date(s.date + 'T12:00:00') >= _startOfWeek)
  const thisWeekMin   = thisWeekSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0)
  const thisWeekCount = thisWeekSessions.length
  const _twoWeeksAgo = new Date(_now); _twoWeeksAgo.setDate(_now.getDate() - 14)
  const recentPse    = sessions.filter(s => new Date(s.date + 'T12:00:00') >= _twoWeeksAgo && s.pse)
  const avgPse2w     = recentPse.length ? recentPse.reduce((a,s) => a + s.pse, 0) / recentPse.length : null
  const overtraining = avgPse2w && avgPse2w > 7
  const metabAlert   = thisWeekCount > 4
  const volColor     = thisWeekMin === 0 ? '#94A3B8' : thisWeekMin < 150 ? '#16A34A' : thisWeekMin <= 200 ? '#D97706' : '#DC2626'
  const volBg        = thisWeekMin === 0 ? 'rgba(148,163,184,0.06)' : thisWeekMin < 150 ? 'rgba(22,163,74,0.08)' : thisWeekMin <= 200 ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)'
  const volLabel     = thisWeekMin === 0 ? 'Sem sessões esta semana' : thisWeekMin < 150 ? 'Volume adequado' : thisWeekMin <= 200 ? 'Volume elevado' : 'Volume excessivo'
  const volSub       = thisWeekMin === 0 ? 'Nenhuma sessão registrada esta semana' : thisWeekMin < 150 ? `${thisWeekMin} min — dentro do ideal (< 150 min)` : thisWeekMin <= 200 ? `${thisWeekMin} min — monitore a recuperação` : `${thisWeekMin} min — risco de overreaching (> 200 min)`

  // ── Faixa etária ───────────────────────────────────────────────────
  const _age         = student?.age
  const isElderly    = _age && _age >= 60
  const isChild      = _age && _age < 12
  const isAdolesc    = _age && _age >= 12 && _age < 18
  const isAdultYoung = _age && _age >= 18 && _age < 30   // 18–29: adulto jovem
  const isAdult      = _age && _age >= 30 && _age < 45   // 30–44: adulto
  const isAdultMat   = _age && _age >= 45 && _age < 60   // 45–59: adulto maduro
  // FCmáx: Tanaka para 40+ e idosos, 220-idade para jovens
  const fcmax      = _age ? (_age >= 40 ? Math.round(208 - 0.7 * _age) : 220 - _age) : null
  const fcFormula  = _age >= 40 ? 'Tanaka (208 − 0,7 × idade)' : '220 − idade'

  return (
    <div>
      {modal && <CardioSessionModal studentId={selectedId} onSave={() => fetchSessions(selectedId)} onClose={() => setModal(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 4, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>Cárdio</h1>
          <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight: 600 }}>Monitoramento e prescrição cardiovascular</p>
        </div>
      </div>

      {/* Seletor de aluno */}
      <div style={{ ...GLASS_CARD, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Selecionar Aluno</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {students.map(s => {
            const sel = s.id === selectedId
            const g   = GOAL[s.goal]
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                style={{ padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: sel ? 'none' : '1px solid rgba(12,74,110,0.15)', background: sel ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(255,255,255,0.7)', color: sel ? '#431C00' : '#0C4A6E', boxShadow: sel ? '0 3px 12px rgba(245,200,66,0.4)' : 'none', transition: 'all 0.15s' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>

      {!selectedId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#0C4A6E', opacity: 0.4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Selecione um aluno para ver o cárdio</div>
        </div>
      )}

      {selectedId && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── ALERTAS INTELIGENTES ── */}
          {(() => {
            const SVG_WARN_LG = <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            const SVG_OK_LG   = <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" opacity=".3"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            const SVG_FIRE    = <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
            const pse2wBar = avgPse2w ? Math.round((avgPse2w / 10) * 100) : 0
            const pse2wColor = !avgPse2w ? '#94A3B8' : avgPse2w <= 5 ? '#16A34A' : avgPse2w <= 7 ? '#D97706' : '#DC2626'
            return (
              <div style={{ ...GLASS_CARD, marginBottom: 0, border: '1.5px solid rgba(12,74,110,0.12)', boxShadow: '0 4px 20px rgba(12,74,110,0.08)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 16 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0C4A6E"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0C3251', letterSpacing: '-0.2px' }}>Alertas de Carga</div>
                  <div style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:600 }}>Semana atual</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {sessions.length === 0 && (
                    <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>
                      Registre sessões de cárdio para ativar os alertas de carga.
                    </div>
                  )}
                  {sessions.length > 0 && <>

                  {/* ── 1. ALERTA OVERTRAINING ── */}
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: overtraining ? '1.5px solid #FCA5A5' : '1.5px solid rgba(22,163,74,0.2)', background: overtraining ? 'rgba(220,38,38,0.04)' : 'rgba(22,163,74,0.03)' }}>
                    {/* Barra de status */}
                    <div style={{ height: 5, background: overtraining ? 'linear-gradient(90deg,#DC2626,#EF4444)' : 'linear-gradient(90deg,#16A34A,#4ADE80)', width: overtraining ? '100%' : pse2wBar + '%', transition: 'width 0.8s ease' }} />
                    <div style={{ padding: '18px 18px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      {/* Ícone */}
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: overtraining ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.1)', color: overtraining ? '#DC2626' : '#16A34A' }}>
                        {overtraining ? SVG_FIRE : SVG_OK_LG}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: overtraining ? '#DC2626' : '#16A34A' }}>
                            {overtraining ? 'Overtraining Detectado' : 'Carga de Intensidade — OK'}
                          </div>
                          {avgPse2w && (
                            <div style={{ fontSize: 18, fontWeight: 900, color: pse2wColor, lineHeight: 1 }}>
                              {avgPse2w.toFixed(1)}<span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8' }}>/10</span>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: 10 }}>
                          {avgPse2w
                            ? overtraining
                              ? 'PSE médio nas últimas 2 semanas acima de 7/10. Risco de acúmulo de fadiga e queda de performance.'
                              : 'PSE médio nas últimas 2 semanas dentro da faixa segura.'
                            : 'Registre pelo menos 5 sessões com PSE para ativar esta análise.'}
                        </div>
                        {/* Barra de PSE */}
                        {avgPse2w && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8', marginBottom: 3 }}>
                              <span>PSE 1</span><span style={{ color: '#16A34A' }}>Zona ideal (≤7)</span><span>PSE 10</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
                              {/* Zona segura */}
                              <div style={{ position: 'absolute', left: 0, width: '70%', height: '100%', background: 'rgba(22,163,74,0.15)', borderRadius: 99 }} />
                              {/* Marcador PSE atual */}
                              <div style={{ position: 'absolute', left: pse2wBar + '%', transform: 'translateX(-50%)', width: 10, height: 6, background: pse2wColor, borderRadius: 99, boxShadow: '0 0 6px ' + pse2wColor + '80', transition: 'left 0.8s ease' }} />
                            </div>
                          </div>
                        )}
                        {overtraining && (
                          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.15)' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', marginBottom: 3 }}>Recomendação</div>
                            <div style={{ fontSize: 10, color: '#7F1D1D', lineHeight: 1.5 }}>
                              Reduza para 1–2 sessões leves (PSE 3–4) nesta semana. Priorize recuperação ativa: caminhada, mobilidade ou descanso completo.
                              <span style={{ color: '#94A3B8', marginLeft: 4 }}>(Meeusen et al., 2013)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── 2. ALERTA COMPENSAÇÃO METABÓLICA ── */}
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: metabAlert ? '1.5px solid #FDE68A' : '1.5px solid rgba(148,163,184,0.2)', background: metabAlert ? 'rgba(217,119,6,0.04)' : 'rgba(148,163,184,0.03)' }}>
                    <div style={{ height: 5, background: metabAlert ? 'linear-gradient(90deg,#D97706,#F59E0B)' : 'rgba(148,163,184,0.2)' }} />
                    <div style={{ padding: '18px 18px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: metabAlert ? 'rgba(217,119,6,0.12)' : 'rgba(148,163,184,0.08)', color: metabAlert ? '#D97706' : '#94A3B8' }}>
                        {metabAlert ? SVG_WARN_LG : SVG_OK_LG}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: metabAlert ? '#D97706' : '#94A3B8' }}>
                            {metabAlert ? 'Risco de Compensação Metabólica' : 'Volume de Sessões Normal'}
                          </div>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {[1,2,3,4].map(i => (
                              <div key={i} style={{ width: 6, height: 20, borderRadius: 3, background: thisWeekCount >= i ? (metabAlert ? '#D97706' : '#16A34A') : 'rgba(0,0,0,0.08)', transition: 'background 0.3s' }} />
                            ))}
                            {thisWeekCount > 4 && (
                              <div style={{ width: 6, height: 20, borderRadius: 3, background: '#DC2626' }} />
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: metabAlert ? 10 : 0 }}>
                          {metabAlert
                            ? thisWeekCount + ' sessões esta semana. Acima de 4 sessões/semana o corpo pode compensar reduzindo NEAT e metabolismo basal.'
                            : thisWeekCount + ' sessão' + (thisWeekCount !== 1 ? 'ões' : '') + ' esta semana — dentro do limite recomendado (≤4).'}
                        </div>
                        {metabAlert && (
                          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.15)' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginBottom: 3 }}>Recomendação</div>
                            <div style={{ fontSize: 10, color: '#92400E', lineHeight: 1.5 }}>
                              Mantenha até 4 sessões/semana e adicione treino de força se o objetivo é composição corporal. Cardio isolado em excesso ativa mecanismos de compensação.
                              <span style={{ color: '#94A3B8', marginLeft: 4 }}>(Pontzer et al., 2016)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  </>
                  }
                </div>
              </div>
            )
          })()}



          {/* ── PRESCRIÇÃO INTELIGENTE ── */}
          {presc && (
            <div style={GLASS_CARD}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Prescrição Inteligente</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${GOAL[student.goal]?.accent}20`, color: GOAL[student.goal]?.accent, border: `1px solid ${GOAL[student.goal]?.accent}40` }}>
                  <GoalBadge goal={student.goal} />
                </span>
              </div>

              {/* Cards de prescrição */}
              <div className="db-stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { icon: null, label: 'Frequência',  val: presc.sessoes  },
                  { icon: null, label: 'Duração',     val: presc.duracao  },
                  { icon: null, label: 'Volume/semana',val: presc.volume   },
                ].map(({ icon, label, val }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.85)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0C3251', lineHeight: 1.3 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* PSE alvo */}
              <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.85)', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>PSE Alvo — Esforço Percebido</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 10, borderRadius: 10, background: 'linear-gradient(90deg,#60A5FA,#34D399,#F5C842,#F59E0B,#EF4444)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: `${(presc.pse.min - 1) / 9 * 100}%`, width: `${(presc.pse.max - presc.pse.min) / 9 * 100}%`, height: '100%', background: 'rgba(12,50,81,0.35)', borderRadius: 10, border: '2px solid #0C3251' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0C3251', whiteSpace: 'nowrap' }}>{presc.pse.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{presc.pace}</div>
              </div>

              {/* Modalidades + barra de proporção */}
              <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.85)', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Modalidades Recomendadas</div>

                {/* Barra cardio vs musculação */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#0C4A6E' }}>Cárdio — {presc.mixCardio}%</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED' }}>Musculação — {100 - presc.mixCardio}%</span>
                  </div>
                  <div style={{ height: 14, borderRadius: 99, overflow: 'hidden', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{
                      height: '100%', width: `${presc.mixCardio}%`,
                      background: presc.mixCardio >= 60
                        ? 'linear-gradient(90deg,#F5C842,#F59E0B,#EF4444)'
                        : presc.mixCardio >= 40
                        ? 'linear-gradient(90deg,#34D399,#F5C842,#F59E0B)'
                        : 'linear-gradient(90deg,#60A5FA,#34D399,#F5C842)',
                      borderRadius: 99, transition: 'width 0.6s ease',
                      boxShadow: '0 0 8px rgba(245,200,66,0.4)',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>
                    Distribuição ideal de estímulos na semana para este objetivo
                  </div>
                </div>

                {/* Lista de modalidades com destaque */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {presc.tipo.map(t => {
                    const info = CARDIO_TYPES.find(x => x.id === t)
                    const isDestaque = t === presc.destaque
                    return (
                      <span key={t} style={{
                        fontSize: isDestaque ? 13 : 12,
                        fontWeight: 800,
                        padding: isDestaque ? '7px 16px' : '5px 13px',
                        borderRadius: 20,
                        background: isDestaque ? `${info?.color}` : `${info?.color}18`,
                        color: isDestaque ? '#FFF' : info?.color,
                        border: `1.5px solid ${info?.color}`,
                        boxShadow: isDestaque ? `0 3px 14px ${info?.color}55` : 'none',
                        position: 'relative',
                      }}>
                        {info?.label}
                        {isDestaque && <span style={{ fontSize: 9, marginLeft: 5, background: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: 10 }}>recomendado</span>}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Dica científica */}
              <div style={{ background: 'rgba(245,200,66,0.08)', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid #F5C842', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#431C00', lineHeight: 1.7 }}>{presc.dicaCientifica}</span>
              </div>

              {/* Observação clínica */}
              <div style={{ background: 'rgba(12,74,110,0.06)', borderRadius: 10, padding: '10px 14px', borderLeft: '3px solid #155E8E' }}>
                <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> {presc.obs}</span>
              </div>

              {/* ── Alerta de faixa etária ── */}
              {_age && (() => {
                // Configuração por faixa
                const cfg = isChild      ? { color:'#7C3AED', bg:'rgba(124,58,237,0.08)', border:'#7C3AED20', title:'Criança (<12 anos) — Restrições Ativas' }
                          : isAdolesc    ? { color:'#D97706', bg:'rgba(217,119,6,0.08)',   border:'#D9770620', title:'Adolescente (12–17 anos) — Observações' }
                          : isAdultYoung ? { color:'#059669', bg:'rgba(5,150,105,0.06)',   border:'#05966918', title:'Adulto Jovem (18–29 anos) — Alta Performance' }
                          : isAdult      ? { color:'#0891B2', bg:'rgba(8,145,178,0.06)',   border:'#0891B218', title:'Adulto (30–44 anos) — Atenção à Sarcopenia' }
                          : isAdultMat   ? { color:'#7C3AED', bg:'rgba(124,58,237,0.07)',  border:'#7C3AED20', title:'Adulto Maduro (45–59 anos) — Prescrição Diferenciada' }
                          : isElderly    ? { color:'#D97706', bg:'rgba(217,119,6,0.08)',   border:'#D9770620', title:'Idoso (60+ anos) — Prescrição Adaptada' }
                          : null
                if (!cfg) return null
                return (
                  <div style={{ marginTop: 10, borderRadius: 12, padding: '14px 16px', background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: cfg.color, marginBottom: 8 }}>{cfg.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

                      {/* FCmáx — aparece em todas as faixas */}
                      {fcmax && (
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '6px 10px' }}>
                          <strong>FCmáx estimada:</strong> {fcmax} bpm ({fcFormula})
                        </div>
                      )}

                      {/* ── Criança ── */}
                      {isChild && <>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(220,38,38,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg><strong>HIIT bloqueado</strong> — não recomendado para menores de 12 anos.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(220,38,38,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg><strong>1RM não aplicável</strong> — prescrição por PSE e peso corporal.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.06)', borderRadius: 8, padding: '6px 10px' }}><strong>LTAD — FUNdamentals:</strong> foco em habilidades motoras multilaterais e ludicidade.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M7.05 9.29l-4.24-4.24a2 2 0 112.83-2.83l.71.71.71-.71a2 2 0 012.83 2.83L7.76 6.47l1.41 1.41 8.49 8.49 1.41-1.41-1.41-1.41 1.41-1.41a2 2 0 11-2.83 2.83l-.71-.71-.71.71a2 2 0 01-2.83-2.83l1.41-1.41-1.41-1.41-4.94 4.94"/></svg><strong>Atenção:</strong> placas epifisárias vulneráveis — evitar cargas axiais pesadas.</div>
                      </>}

                      {/* ── Adolescente ── */}
                      {isAdolesc && <>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(217,119,6,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><strong>Carga máxima:</strong> limitar a 70–75% do 1RM durante fase de crescimento ósseo.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(217,119,6,0.06)', borderRadius: 8, padding: '6px 10px' }}><strong>LTAD — Learn/Train to Train:</strong> técnica em primeiro lugar, volume progressivo. (Faigenbaum et al., 2009)</div>
                        {_age < 14 && <div style={{ fontSize: 11, color: '#334155', background: 'rgba(220,38,38,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg><strong>1RM:</strong> não recomendado abaixo de 14 anos — fórmula de Epley não validada.</div>}
                      </>}

                      {/* ── Adulto Jovem 18–29 ── */}
                      {isAdultYoung && <>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(5,150,105,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>Capacidade máxima:</strong> pico de VO₂ máx e resposta hormonal. Tolerância alta a volume e intensidade.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(5,150,105,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>Recuperação:</strong> 24–48h entre sessões do mesmo grupo muscular. Permite alta frequência.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(5,150,105,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>Periodização:</strong> suporta bloco de alta densidade. Atenção à técnica para evitar lesões por excesso de confiança.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(8,145,178,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><strong>PSE alvo:</strong> 6–9/10 em sessões de alta intensidade. HIIT bem tolerado.</div>
                      </>}

                      {/* ── Adulto 30–44 ── */}
                      {isAdult && <>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(8,145,178,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><strong>Sarcopenia subclínica:</strong> perda de ~0,5–1% de massa muscular/ano após os 30. Treino de força 2–3x/semana é essencial.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(8,145,178,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>Recuperação:</strong> 48h ideais entre sessões intensas. VO₂ máx declina ~1%/ano — compensar com consistência.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(8,145,178,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><strong>Periodização:</strong> ondulada diária (DUP) ou semanal. Manter volume moderado-alto com boa gestão de recuperação.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(8,145,178,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><strong>Mobilidade:</strong> incluir 1–2 sessões/semana de mobilidade articular para prevenção de lesões.</div>
                      </>}

                      {/* ── Adulto Maduro 45–59 ── */}
                      {isAdultMat && <>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><strong>Declínio hormonal:</strong> testosterona ↓ ~1–2%/ano (homens); menopausa em mulheres — impacta força, massa óssea e composição corporal.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M7.05 9.29l-4.24-4.24a2 2 0 112.83-2.83l.71.71.71-.71a2 2 0 012.83 2.83L7.76 6.47l1.41 1.41 8.49 8.49 1.41-1.41-1.41-1.41 1.41-1.41a2 2 0 11-2.83 2.83l-.71-.71-.71.71a2 2 0 01-2.83-2.83l1.41-1.41-1.41-1.41-4.94 4.94"/></svg><strong>Osteoporose:</strong> treino de força com impacto é a principal estratégia não farmacológica de prevenção. (Kohrt et al., 2004)</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>Risco cardiovascular:</strong> monitorar FC durante esforço. PSE máx recomendado 7/10 sem avaliação médica prévia.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>Recuperação:</strong> 48–72h entre sessões intensas. Reduzir volume total em 10–15% vs. adulto jovem.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(124,58,237,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><strong>Mobilidade + equilíbrio:</strong> incluir obrigatoriamente — prevenção de quedas e manutenção funcional.</div>
                        {_age >= 50 && <div style={{ fontSize: 11, color: '#334155', background: 'rgba(220,38,38,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><strong>50+ anos:</strong> recomendável avaliação médica com ECG de esforço antes de iniciar treinos de alta intensidade.</div>}
                      </>}

                      {/* ── Idoso 60+ ── */}
                      {isElderly && <>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(220,38,38,0.06)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><strong>HIIT:</strong> avaliar individualmente. Iniciar apenas com aprovação médica e histórico de atividade.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(217,119,6,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><strong>PSE máx recomendado:</strong> 6/10 — intensidades acima aumentam risco cardiovascular.</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(217,119,6,0.07)', borderRadius: 8, padding: '6px 10px' }}><strong>4º pilar:</strong> 1 sessão semanal de equilíbrio e mobilidade obrigatória. (Sherrington et al., 2019)</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(217,119,6,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M7.05 9.29l-4.24-4.24a2 2 0 112.83-2.83l.71.71.71-.71a2 2 0 012.83 2.83L7.76 6.47l1.41 1.41 8.49 8.49 1.41-1.41-1.41-1.41 1.41-1.41a2 2 0 11-2.83 2.83l-.71-.71-.71.71a2 2 0 01-2.83-2.83l1.41-1.41-1.41-1.41-4.94 4.94"/></svg><strong>Sarcopenia:</strong> 2–3x/semana de força é a 1ª linha de prevenção e tratamento. (Hurst et al., 2022)</div>
                        <div style={{ fontSize: 11, color: '#334155', background: 'rgba(217,119,6,0.07)', borderRadius: 8, padding: '6px 10px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:inline;verticalAlign:-2px;marginRight:4px;flexShrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><strong>Progressão conservadora:</strong> aumentar carga máx 5% por semana. Priorizar funcionalidade sobre performance.</div>
                      </>}

                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── STATS GERAIS ── */}
          {sessions.length > 0 && (
            <div style={{ ...GLASS_CARD, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251', marginBottom: 14 }}>Resumo Geral</div>
              <div className="db-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[
                  { label: 'Sessões',      val: totalSessoes,              unit: '',    color: '#155E8E' },
                  { label: 'Total Tempo',  val: totalMin >= 60 ? `${Math.floor(totalMin/60)}h${totalMin%60}` : totalMin, unit: totalMin < 60 ? 'min' : '', color: '#7C3AED' },
                  { label: 'Total Km',     val: totalKm.toFixed(1),        unit: 'km',  color: '#059669' },
                  { label: 'PSE Médio',    val: avgPse,                    unit: '/10', color: '#D97706' },
                ].map(({ label, val, unit, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.8)' }}>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}<span style={{ fontSize: 11, color: '#94A3B8' }}>{unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GRÁFICOS ── */}
          {paceData.length >= 2 && (
            <div style={GLASS_CARD}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0C3251', marginBottom: 16 }}>Evolução do Pace</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={paceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="'/km" domain={['auto','auto']} reversed />
                  <Tooltip content={<CustomTooltip unit=" min/km" />} />
                  <Line type="monotone" dataKey="Pace" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 }}>Eixo Y invertido — pace menor = mais rápido</div>
            </div>
          )}

          {volumeData.length >= 2 && (
            <div style={GLASS_CARD}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0C3251', marginBottom: 16 }}>Volume Semanal (minutos)</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={volumeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="min" />
                  <Tooltip content={<CustomTooltip unit=" min" />} />
                  <Line type="monotone" dataKey="Min" name="Minutos" stroke="#155E8E" strokeWidth={2.5} dot={{ r: 4, fill: '#155E8E', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          <div style={GLASS_CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Histórico de Sessões</div>
              <button onClick={() => setModal(true)}
                style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                + Registrar
              </button>
            </div>

            {/* Filtro por modalidade */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <button onClick={() => setFilterType('todos')}
                style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: filterType === 'todos' ? 'linear-gradient(135deg,#155E8E,#0C4A6E)' : 'rgba(255,255,255,0.7)', color: filterType === 'todos' ? '#FFF' : '#0C4A6E' }}>
                Todos
              </button>
              {CARDIO_TYPES.filter(t => sessions.some(s => s.type === t.id)).map(t => (
                <button key={t.id} onClick={() => setFilterType(t.id)}
                  style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: filterType === t.id ? t.color : 'rgba(255,255,255,0.7)', color: filterType === t.id ? '#FFF' : '#0C4A6E', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhuma sessão registrada ainda</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>O aluno pode registrar pelo link dele</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {[...filtered].reverse().map(s => {
                  const info = CARDIO_TYPES.find(t => t.id === s.type)
                  const pace = formatPace(s.distance_km, s.duration_minutes)
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.65)', borderRadius: 12, border: `1.5px solid ${info?.color}25` }}>
                      {/* Ícone modalidade */}
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${info?.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ width:14, height:14, borderRadius:"50%", background:info?.color, display:"block" }} /></div>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0C3251' }}>{info?.label}</span>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{String(s.date).slice(0,10).split('-').reverse().join('/')}</span>
                          {s.type === 'hiit' && s.work_seconds && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#F5C842', background: 'rgba(245,200,66,0.12)', padding: '1px 7px', borderRadius: 20 }}>
                              {s.work_seconds}s/{s.rest_seconds}s × {s.rounds}x
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {s.duration_minutes && <span style={{ fontSize: 11, color: '#64748B' }}>{s.duration_minutes}min</span>}
                          {s.distance_km      && <span style={{ fontSize: 11, color: '#64748B' }}>{s.distance_km}km</span>}
                          {pace !== '—'        && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>{pace}</span>}
                          {s.avg_hr           && <span style={{ fontSize: 11, color: '#64748B' }}>{s.avg_hr}bpm</span>}
                          {s.pse              && <span style={{ fontSize: 11, color: '#64748B' }}>PSE {s.pse}/10</span>}
                        </div>
                        {s.notes && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' }}>{s.notes}</div>}
                      </div>
                      {/* PSE badge */}
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${120 - (s.pse||5)*12},70%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#FFF', flexShrink: 0 }}>
                        {s.pse}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {selectedId && loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#0C4A6E', opacity: 0.5, fontWeight: 600 }}>Carregando...</div>
      )}
    </div>
  )
}

// ── NovoAlunoModal ─────────────────────────────────────────────────────────
function NovoAlunoModal({ onSave, onClose, teacherId }) {
  const [form, setForm] = useState({
    name: '', age: '', weight: '', height: '',
    goal: 'Iniciação Esportiva', level: 'Iniciante', notes: '',
    sport: '', sport_position: '', experience_years: '',
    guardian_name: '', guardian_phone: '',
  })
  const [saving, setSaving] = useState(false)
  const f   = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const inp = { width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', color: '#0D1B2A', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block', marginTop: 14 }
  const sep = (title) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:22, marginBottom:4 }}>
      <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
      <span style={{ fontSize:10, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
    </div>
  )

  // Preview LTAD em tempo real
  const previewAge  = parseInt(form.age) || null
  const previewLTAD = calcLTAD(previewAge, parseInt(form.experience_years) || 0, form.sport)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('students').insert([{
      teacher_id:       teacherId,
      name:             form.name.trim(),
      age:              +form.age              || null,
      weight:           +form.weight           || null,
      height:           +form.height           || null,
      goal:             form.goal,
      level:            form.level,
      notes:            form.notes             || null,
      sport:            form.sport === 'custom' ? (form.sport_custom||'outro') : (form.sport || null),
      sport_position:   form.sport_position    || null,
      experience_years: +form.experience_years || null,
      guardian_name:    form.guardian_name     || null,
      guardian_phone:   form.guardian_phone    || null,
    }])
    setSaving(false); onSave(); onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
      <div onClick={e=>e.stopPropagation()} className="db-modal-inner" style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:500, maxHeight:'92vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ fontSize:19, fontWeight:900, color:'#0D1B2A', marginBottom:2 }}>Cadastrar Aluno</div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>Preencha os dados do aluno e do responsável</div>

        {/* ── Dados pessoais ── */}
        {sep('Dados Pessoais')}
        <label style={lbl}>Nome completo</label>
        <input style={inp} type="text" placeholder="Ex: João Silva" value={form.name} onChange={e=>f('name',e.target.value)} />

        <div className="db-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Idade</label>
            <input style={inp} type="number" placeholder="Ex: 13" value={form.age} onChange={e=>f('age',e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Altura (cm)</label>
            <input style={inp} type="number" placeholder="Ex: 165" value={form.height} onChange={e=>f('height',e.target.value)} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Peso (kg)</label>
            <input style={inp} type="number" placeholder="Ex: 55" value={form.weight} onChange={e=>f('weight',e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Nível</label>
            <select style={inp} value={form.level} onChange={e=>f('level',e.target.value)}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <label style={lbl}>Objetivo</label>
        <select style={inp} value={form.goal} onChange={e=>f('goal',e.target.value)}>
          <optgroup label="— Esportivo (infantojuvenil)">
            {['Iniciação Esportiva','Desenvolvimento Atlético','Treinamento Competitivo'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
          <optgroup label="— Saúde e Bem-Estar">
            {['Saúde e Bem-Estar','Condicionamento'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
          <optgroup label="— Estética / Força">
            {['Ganho de Massa','Emagrecimento','Força e Performance'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
        </select>

        {/* ── Esporte ── */}
        {sep('Esporte')}
        <label style={lbl}>Modalidade principal</label>
        <select style={inp} value={form.sport} onChange={e=>f('sport',e.target.value)}>
          <option value="">Selecionar...</option>
          {SPORTS.map(s=>(
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {form.sport === 'custom' && (
          <input style={{ ...inp, marginTop:8 }} type="text" placeholder="Qual esporte? Ex: Remo, Rugby, Padel..."
            value={form.sport_custom||''} onChange={e=>f('sport_custom',e.target.value)} />
        )}

        <div className="db-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Posição / Especialidade</label>
            <input style={inp} type="text" placeholder="Ex: Meia, Goleiro..." value={form.sport_position} onChange={e=>f('sport_position',e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Anos de experiência</label>
            <input style={inp} type="number" placeholder="Ex: 2" min="0" value={form.experience_years} onChange={e=>f('experience_years',e.target.value)} />
          </div>
        </div>

        {/* LTAD preview em tempo real */}
        {previewLTAD && (
          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background: previewLTAD.bg, border:`1px solid ${previewLTAD.cor}33`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:12, height:12, borderRadius:"50%", background:previewLTAD?.cor, display:"inline-block" }} />
            <div>
              <div style={{ fontSize:12, fontWeight:800, color: previewLTAD.cor }}>Fase LTAD: {previewLTAD.fase}</div>
              <div style={{ fontSize:11, color:'#64748B' }}>{previewLTAD.desc}</div>
            </div>
          </div>
        )}

        {/* ── Responsável — apenas para menores de 18 anos ── */}
        {sep('Responsável')}
        <div className="db-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Nome do responsável</label>
            <input style={inp} type="text" placeholder="Ex: Maria Silva" value={form.guardian_name} onChange={e=>f('guardian_name',e.target.value)} />
          </div>
          {previewAge && previewAge < 18 ? (
            <div>
              <label style={lbl}>WhatsApp do responsável</label>
              <input style={inp} type="text" placeholder="Ex: (41) 99999-9999" value={form.guardian_phone} onChange={e=>f('guardian_phone',e.target.value)} />
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', padding:'10px 12px', borderRadius:8, background:'rgba(0,0,0,0.03)', border:'1px dashed #E2E8F0', fontSize:12, color:'#94A3B8' }}>
              WhatsApp disponível para menores de 18 anos
            </div>
          )}
        </div>

        {/* ── Observações ── */}
        {sep('Observações')}
        <label style={lbl}>Lesões, restrições ou observações</label>
        <textarea style={{ ...inp, minHeight:65, resize:'vertical' }} placeholder="Ex: Histórico de entorse no tornozelo direito..." value={form.notes} onChange={e=>f('notes',e.target.value)} />

        <button onClick={save} disabled={saving||!form.name.trim()} style={{ width:'100%', background: form.name.trim() ? 'linear-gradient(135deg,#F5C842,#D97706)' : '#F1F5F9', border:'none', borderRadius:10, padding:14, color: form.name.trim() ? '#431C00' : '#94A3B8', fontWeight:800, fontSize:15, cursor: form.name.trim() ? 'pointer' : 'default', marginTop:22 }}>
          {saving ? 'Salvando...' : 'Cadastrar Aluno'}
        </button>
        <button onClick={onClose} style={{ width:'100%', background:'rgba(0,0,0,0.04)', border:'1px solid #E2E8F0', borderRadius:10, padding:12, color:'#64748B', fontWeight:600, fontSize:14, cursor:'pointer', marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
// ── Mobile CSS injection ──────────────────────────────────────────────────────
function DashboardMobileCSS() {
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
function MobileBottomNav({ nav, setNav, navigate, logout }) {
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

export default function Dashboard({ navigate, session }) {
  const [nav, setNav]             = useState('alunos')
  const [students, setStudents]   = useState([])
  const [workouts, setWorkouts]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('Todos')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const uid = session.user.id
    const { data: studs } = await supabase.from('students').select('*').eq('teacher_id', uid).order('created_at', { ascending: false })

    if (studs && studs.length > 0) {
      const ids = studs.map(s => s.id)
      const [att, prog, logs, feed, plansRes] = await Promise.all([
        supabase.from('attendance').select('student_id,date').in('student_id', ids),
        supabase.from('progress_entries').select('student_id,date,weight').in('student_id', ids).order('date', { ascending: false }),
        supabase.from('exercise_logs').select('student_id,date,day_id,is_makeup,scheduled_day').in('student_id', ids),
        supabase.from('student_feedbacks').select('student_id,date').in('student_id', ids),
        supabase.from('workout_plans').select('id,student_id,title,status,updated_at').in('student_id', ids).eq('status', 'active'),
      ])

      const datesByStudent = {}
      ids.forEach(id => { datesByStudent[id] = [] })
      ;[att, prog, logs, feed].forEach(({ data }) => {
        if (data) data.forEach(r => datesByStudent[r.student_id]?.push(r.date))
      })

      // Peso mais recente por aluno (de progress_entries — fonte da verdade)
      const latestWeightMap = {}
      if (prog.data) {
        prog.data.forEach(r => {
          if (r.weight && !latestWeightMap[r.student_id]) {
            latestWeightMap[r.student_id] = +r.weight
          }
        })
      }

      // Monta mapa de dias planejados por aluno (ex: { uuid: ['Seg','Qua','Sex'] })
      const plannedDaysMap = {}
      ids.forEach(id => { plannedDaysMap[id] = [] })
      // workout_days não mais no join — plannedDaysMap vazio por ora (ok, streak ainda funciona via logs)
      if (plansRes.data) {
        plansRes.data.forEach(p => {
          plannedDaysMap[p.student_id] = plannedDaysMap[p.student_id] || []
        })
      }

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const enriched = studs.map(s => {
        const dates      = datesByStudent[s.id] || []
        const streak     = calcStreak(dates, plannedDaysMap[s.id] || [])
        let lastSeenDays = 999
        if (dates.length > 0) {
          const sorted = [...dates].sort((a, b) => new Date(b) - new Date(a))
          const last = new Date(sorted[0] + 'T12:00:00')
          lastSeenDays = Math.floor((today - last) / 86400000)
        }
        const latestW = latestWeightMap[s.id]
        const weight  = latestW ?? s.weight  // progress_entries tem prioridade
        const height  = s.height
        const imc     = (weight && height) ? +(weight / ((height / 100) ** 2)).toFixed(1) : null
        return { ...s, weight, imc_calc: imc, streak, lastSeenDays }
      })
      setStudents(enriched)

      // Monta workouts para o Cronograma
      const plans = plansRes.data || []
      if (plans.length > 0) {
        const attMap = {}; const logMap = {}
        ids.forEach(id => { attMap[id] = []; logMap[id] = [] })
        if (att.data) att.data.forEach(r => attMap[r.student_id]?.push(r.date))
        const makeupMap = {} // student_id -> [dia_semana que foi recuperado]
        ids.forEach(id => { makeupMap[id] = [] })
        if (logs.data) logs.data.forEach(r => {
          logMap[r.student_id]?.push(r.date)
          if (r.is_makeup && r.scheduled_day) {
            makeupMap[r.student_id]?.push(r.scheduled_day)
            // Adicionar também a data do dia original para o streak contar
            const logDate = new Date(r.date + 'T12:00:00')
            const DIA_JS = { Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6,Dom:0 }
            const targetDayJS = DIA_JS[r.scheduled_day]
            if (targetDayJS !== undefined) {
              const scheduled = new Date(logDate)
              const diff = targetDayJS - logDate.getDay()
              scheduled.setDate(scheduled.getDate() + diff)
              logMap[r.student_id]?.push(scheduled.toISOString().slice(0,10))
            }
          }
        })

        // Buscar dias da semana de cada plano (leve — só day_of_week e name)
        const planIds = plans.map(p => p.id)
        const { data: wDays } = await supabase
          .from('workout_days')
          .select('plan_id, day_of_week, name, focus')
          .in('plan_id', planIds)

        // Montar mapa planId → dias e workoutDays
        const daysMap = {}
        const wdMap   = {}
        planIds.forEach(pid => { daysMap[pid] = []; wdMap[pid] = [] })
        if (wDays) {
          wDays.forEach(d => {
            if (d.day_of_week) daysMap[d.plan_id]?.push(d.day_of_week)
            wdMap[d.plan_id]?.push(d)
          })
        }

        setWorkouts(plans.map(p => {
          const st = studs.find(s => s.id === p.student_id)
          return {
            ...p,
            studentName: st?.name || '—',
            goal: st?.goal || '',
            days: [...new Set(daysMap[p.id] || [])],
            workoutDays: wdMap[p.id] || [],
            attendanceDates: attMap[p.student_id] || [],
            logDates: logMap[p.student_id] || [],
            makeupDays: makeupMap[p.student_id] || [],
          }
        }))
      }
    } else {
      setStudents([])
    }
    setLoading(false)
  }

  const logout = async () => { await supabase.auth.signOut(); window.location.reload() }

  const filtered = students.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'Todos' ? true : filter === 'Ativos' ? s.lastSeenDays < 5 : filter === 'Inativos' ? s.lastSeenDays >= 5 : s.goal === filter
    return ms && mf
  })

  const ativos   = students.filter(s => s.lastSeenDays < 5).length
  const inativos = students.length - ativos

  const isMobile = useIsMobile()

  if (loading) return <div style={{ minHeight: '100vh', background: 'linear-gradient(175deg,#4AB8E8,#B3E5F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>Carregando...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans','Segoe UI',sans-serif", position: 'relative' }}>
      <DashboardMobileCSS />
      <SkyBackground />

      {/* SIDEBAR */}
      <div className="db-sidebar" style={{ position: 'relative', flexShrink: 0, width: 220, zIndex: 2 }}>
        <aside style={{ width: 220, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ padding: '26px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#34D399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 12px rgba(52,211,153,0.35)' }}><svg width='18' height='18' viewBox='0 0 24 24' fill='white'><path d='M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z'/></svg></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>TrainerApp</div>
                <div style={{ fontSize: 10, color: '#BEE3F8', fontWeight: 500 }}>Gestão de Alunos</div>
              </div>
            </div>
          </div>
          <WaveDivider />
          <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(item => <NavItem key={item.id} item={item} active={nav === item.id} onClick={() => setNav(item.id)} />)}
          </nav>
          <WaveDivider />
          <div style={{ padding: '4px 10px 26px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem item={{ id: 'perfil', icon: null, label: 'Meu Perfil' }}   active={false} onClick={() => navigate('teacher-profile')} />
            <NavItem item={{ id: 'sair',   icon: '', label: 'Sair' }}         active={false} onClick={logout} />
          </div>
        </aside>
        {/* Onda lateral */}
        <svg viewBox="0 0 20 900" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: -18, height: '100vh', width: 20, zIndex: 10, pointerEvents: 'none' }}>
          <path d="M0,0 C10,50 10,50 0,100 C10,150 10,150 0,200 C10,250 10,250 0,300 C10,350 10,350 0,400 C10,450 10,450 0,500 C10,550 10,550 0,600 C10,650 10,650 0,700 C10,750 10,750 0,800 C10,850 10,850 0,900" fill={SIDEBAR_BG} />
        </svg>
      </div>

      {/* MAIN */}
      <main className="db-main" style={{ flex: 1, padding: '32px 28px', background: 'transparent', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* ABA: MEUS ALUNOS */}
        {nav === 'alunos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 3, textShadow:'0 1px 3px rgba(255,255,255,0.5)' }}>Meus Alunos</h1>
                <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight:600 }}>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>{ativos} ativos</span>{' · '}
                  <span style={{ color: YELLOW, fontWeight: 700 }}>{inativos} inativos</span>{' · '}
                  {students.length} cadastrados
                </p>
              </div>
              <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: '11px 22px', color: '#431C00', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,200,66,0.45)' }}>
                + Novo Aluno
              </button>
            </div>

            {/* Busca + Filtros */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94A3B8' }}></span>
                <input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: 10, fontSize: 13, color: '#0D1B2A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backdropFilter:'blur(6px)' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Todos', 'Ativos', 'Inativos', 'Ganho de Massa', 'Emagrecimento', 'Força e Performance', 'Condicionamento'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: filter === f ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(255,255,255,0.7)', color: filter === f ? '#7C3700' : '#64748B', boxShadow: filter === f ? '0 3px 10px rgba(245,200,66,0.4)' : '0 1px 3px rgba(0,0,0,0.07)' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Legenda ofensiva */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, padding: '10px 16px', background: 'rgba(255,255,255,0.45)', borderRadius: 10, border: `1px solid rgba(255,255,255,0.7)`, backdropFilter:'blur(6px)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0C4A6E' }}>Ofensiva:</span>
              {[{ label: '1–6d', c: '#FDE68A' }, { label: '1 sem+', c: '#FCD34D' }, { label: '2 sem+', c: '#F5C842' }, { label: '1 mês+', c: '#F59E0B' }, { label: '3 mes+', c: '#EA580C' }, { label: '6 mes+', c: '#DC2626' }, { label: '1 ano ', c: '#D97706' }].map(({ label, c }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}80` }} />
                  <span style={{ fontSize: 10, color: '#0C4A6E', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>

            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#0C4A6E', opacity: 0.5 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}></div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Nenhum aluno cadastrado</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Clique em "+ Novo Aluno" para começar</div>
              </div>
            ) : (
              <div className="db-students-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {filtered.map(st => <StudentCard key={st.id} st={st} onClick={() => navigate('student-detail', { id: st.id })} onDelete={fetchAll} />)}
                {Array.from({ length: (3 - (filtered.length % 3)) % 3 }).map((_, i) => <AddCard key={'add' + i} onClick={() => setShowModal(true)} />)}
              </div>
            )}
          </div>
        )}

        {/* ABA: TREINOS */}
        {nav === 'treinos' && <TabTreinos workouts={workouts} navigate={navigate} session={session} />}

        {/* ABA: EVOLUÇÃO */}
        {nav === 'evolucao' && <TabEvolucao students={students} />}

        {/* ABA: CÁRDIO */}
        {nav === 'cardio' && <TabCardio students={students} />}

        {nav === 'escolinha' && (
          <TabEscolinha session={session} students={students} />
        )}

        {/* OUTRAS ABAS */}
        {nav !== 'alunos' && nav !== 'treinos' && nav !== 'evolucao' && nav !== 'cardio' && nav !== 'escolinha' && (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#0C4A6E', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}></div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Em desenvolvimento</div>
          </div>
        )}
      </main>

      {showModal && <NovoAlunoModal teacherId={session.user.id} onSave={fetchAll} onClose={() => setShowModal(false)} />}
      <MobileBottomNav nav={nav} setNav={setNav} navigate={navigate} logout={logout} />
    </div>
  )
}
