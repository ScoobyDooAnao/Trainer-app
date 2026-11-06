// ── Paleta simples (temporária, sem tema visual ainda) ────────────────────────
export const V = {
  bg:          '#000000',
  bgSolid:     '#000000',
  bgCard:      '#0A0A0A',
  bgCardHov:   '#111111',
  bgInput:     '#111111',
  bgRow:       'rgba(255,255,255,0.02)',
  border:      'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.06)',
  borderStrong:'rgba(255,255,255,0.2)',
  accent:      '#3B82F6',
  accentBr:    '#60A5FA',
  accentDim:   '#64748B',
  accentFaint: 'rgba(255,255,255,0.05)',
  text:        '#E2E8F0',
  textSub:     '#94A3B8',
  textMuted:   '#64748B',
  textDim:     '#475569',
  white:       '#FFFFFF',
}

// ── Constants ──────────────────────────────────────────────────────────────────
export const MUSCLE_TYPES = [
  'Peito','Costas','Bíceps','Tríceps','Ombro',
  'Quadríceps','Posterior','Glúteo','Panturrilha','Core','Cardio','Full Body',
]

export const STATUS_OPTIONS = ['draft','active','archived']

export const STATUS_LABEL   = { draft:'Rascunho', active:'Ativo', archived:'Arquivado' }

export const DAY_COLORS     = ['#D97706','#F97316','#FBBF24','#B45309','#D97706','#F59E0B']

export const emptyEx        = { name:'', sets:'3', reps:'10-12', rest:'60s', rir:'2', tip:'', type:'Peito' }

export const getAgeGroup = (birthDate, age) => {
  const a = birthDate
    ? Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000))
    : age ? parseInt(age) : null
  if (!a) return 'adulto_jovem'
  if (a < 13) return 'crianca'
  if (a < 18) return 'adolescente'
  if (a < 40) return 'adulto_jovem'
  if (a < 60) return 'adulto_maduro'
  return 'idoso'
}

export const AGE_GROUP_LABEL = {
  crianca:'Criança', adolescente:'Adolescente',
  adulto_jovem:'Adulto', adulto_maduro:'Adulto Maduro', idoso:'Idoso 60+',
}

export const AGE_GROUP_COLOR = {
  crianca:'#34D399', adolescente:'#60A5FA',
  adulto_jovem:'#FBBF24', adulto_maduro:'#F97316', idoso:'#F87171',
}

export const AGE_RESTRICTIONS = {
  crianca:       { maxPct:60,  warning:'Criança: sem carga máxima. Prescrever por PSE e peso corporal.',     blockedZones:['Força Máxima','Hipertrofia'] },
  adolescente:   { maxPct:70,  warning:'Adolescente: limitar a 70% 1RM durante fase de crescimento ósseo.', blockedZones:['Força Máxima'] },
  adulto_jovem:  { maxPct:100, warning:null,                                                                 blockedZones:[] },
  adulto_maduro: { maxPct:100, warning:'Adulto maduro: aumentar descanso entre séries (48-72h por grupo).', blockedZones:[] },
  idoso:         { maxPct:75,  warning:'60+: iniciar com 40-50% 1RM. Avaliação médica recomendada.',        blockedZones:['Força Máxima'] },
}

export const ZONES = [
  { label:'Força Máxima',      pct:[85,100], reps:'1-5',   rest:'3-5min',  color:'#EF4444' },
  { label:'Hipertrofia',       pct:[65,85],  reps:'6-12',  rest:'60-120s', color:'#A78BFA' },
  { label:'Resistência Musc.', pct:[40,65],  reps:'15-30', rest:'30-60s',  color:'#34D399' },
]

export const calc1RM = (carga, reps) => {
  if (!carga || !reps || reps < 1 || carga <= 0) return null
  const r = Number(reps), c = Number(carga)
  if (r === 1) return c
  if (r > 15)  return null
  const epley    = c * (1 + r / 30)
  const brzycki  = r > 10 ? null : c / (1.0278 - 0.0278 * r)
  const lombardi = c * Math.pow(r, 0.10)
  const valid    = [epley, brzycki, lombardi].filter(v => v !== null && v > 0)
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

// ── TYPE COLORS ────────────────────────────────────────────────────────────────
export const TYPE_COLOR = {
  'Funcional':     '#34D399',
  'Elástico':      '#FBBF24',
  'Peso Corporal': '#60A5FA',
  'Mobilidade':    '#F472B6',
  'Core':          '#34D399',
  'Full Body':     '#6EE7B7',
  'Cardio':        '#F87171',
}

export const getTypeColor = (type) => TYPE_COLOR[type] || V.accentBr

// ── Styles base (Vestiário Pré-Jogo) ──────────────────────────────────────────
export const ss = {
  input: {
    background:  V.bgInput,
    border:      `1px solid ${V.border}`,
    borderRadius: 8,
    padding:     '9px 12px',
    color:        V.text,
    fontSize:    14,
    outline:     'none',
    fontFamily:  'inherit',
  },
  smallInput: {
    background:  V.bgInput,
    border:      `1px solid ${V.borderLight}`,
    borderRadius: 6,
    padding:     '7px 10px',
    color:        V.text,
    fontSize:    12,
    outline:     'none',
    width:       '100%',
    fontFamily:  'inherit',
  },
  btn: (c) => ({
    background:   c || V.accent,
    border:       'none',
    borderRadius:  8,
    padding:      '9px 16px',
    color:         '#431C00',
    fontWeight:    700,
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   'inherit',
  }),
  outlineBtn: {
    background:   V.accentFaint,
    border:       `1px solid ${V.border}`,
    borderRadius:  8,
    padding:      '9px 14px',
    color:         V.accentDim,
    fontWeight:    600,
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   'inherit',
  },
  delBtn: {
    background: 'none',
    border:     'none',
    color:      V.textDim,
    cursor:     'pointer',
    fontSize:   14,
    padding:    '2px 6px',
    flexShrink:  0,
  },
}
