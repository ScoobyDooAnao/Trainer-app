import { StudentCard } from '../components/students/StudentsTab'
import { EscolinhaChip } from '../components/treinos/TreinosTab'
import { TabEvolucao } from '../components/evolucao/EvolucaoTab'
import { TabCardio } from '../components/cardio/ProfessorCardioTab'
import { FundamentosModal } from '../components/planejamento/PlanejamentoTab'
import { NotificacoesPanel } from '../components/notifications/NotificacoesPanel'

export const SIDEBAR_BG    = '#155E8E'

export const SIDEBAR_TEXT  = '#E0F2FE'

export const YELLOW        = '#F5C842'

export const YELLOW_BG     = 'rgba(245,200,66,0.15)'

export const YELLOW_BORDER = 'rgba(245,200,66,0.45)'

export const GOAL = {
  'Ganho de Massa':           { bg: '#E0F4FF', accent: '#0284C7', icon: null },
  'Emagrecimento':            { bg: '#FEF2F2', accent: '#E05252', icon: null },
  'Força e Performance':      { bg: '#EDE9FE', accent: '#7C3AED', icon: null },
  'Condicionamento':          { bg: '#FFFBEB', accent: '#D97706', icon: null },
  'Saúde e Bem-Estar':        { bg: '#F0FDF4', accent: '#16A34A', icon: null },
  'Iniciação Esportiva':      { bg: '#ECFDF5', accent: '#059669', icon: null },
  'Desenvolvimento Atlético': { bg: '#EFF6FF', accent: '#3B82F6', icon: null },
  'Treinamento Competitivo':  { bg: '#FDF4FF', accent: '#A21CAF', icon: null },
}

export const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const DIA_JS_MAP  = { Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6, Dom: 0 }

export const NAV = [
  { id: 'alunos',        icon: '', label: 'Meus Alunos'    },
  { id: 'treinos',       icon: '', label: 'Cronograma'      },
  { id: 'evolucao',      icon: '', label: 'Evolução'        },
  { id: 'cardio',        icon: '', label: 'Cardio'          },
  { id: 'escolinha',     icon: '', label: 'Escolinha'       },
  { id: 'planejamento',  icon: '', label: 'Planejamento'    },
]

export const SPORT_SVG = {
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

export const SPORTS = [
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

export function streakStyle(days) {
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

export function getDayStatus(dia, attendanceDates, logDates, makeupDates) {
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

export function calcStreak(dates, plannedDays) {
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
export const CLOUDS = [
  { top:'6%',  left:'-10%', scale:1.3,  dur:90,  delay:0,   opacity:0.85 },
  { top:'18%', left:'-12%', scale:0.8,  dur:120, delay:-35, opacity:0.6  },
  { top:'38%', left:'-8%',  scale:1.0,  dur:100, delay:-60, opacity:0.7  },
  { top:'55%', left:'-15%', scale:1.5,  dur:140, delay:-20, opacity:0.5  },
  { top:'72%', left:'-10%', scale:0.9,  dur:110, delay:-80, opacity:0.65 },
  { top:'85%', left:'-12%', scale:1.1,  dur:130, delay:-50, opacity:0.55 },
]

// ── StudentCard ────────────────────────────────────────────────────────────
export const INACTIVE_THRESHOLD_DAYS = 7

// ── Helpers de idade ───────────────────────────────────────────────────────
export function calcAgeFromStudent(st) {
  if (st.birth_date) {
    const birth = new Date(st.birth_date)
    return Math.floor((new Date() - birth) / (365.25 * 24 * 3600000))
  }
  return st.age ? parseInt(st.age) : null
}

// ── EscolinhaChip ─────────────────────────────────────────────────────────────
export const FOCO_CHIP_COLORS = {
  'Físico':      { bg:'#FEE2E2', border:'#FECACA', text:'#991B1B', dot:'#EF4444' },
  'Técnico':     { bg:'#DBEAFE', border:'#BFDBFE', text:'#1E40AF', dot:'#3B82F6' },
  'Lúdico':      { bg:'#EDE9FE', border:'#DDD6FE', text:'#5B21B6', dot:'#8B5CF6' },
  'Competitivo': { bg:'#FEF3C7', border:'#FDE68A', text:'#92400E', dot:'#F59E0B' },
  'Progressão':  { bg:'#D1FAE5', border:'#A7F3D0', text:'#064E3B', dot:'#10B981' },
  'Misto':       { bg:'#F1F5F9', border:'#E2E8F0', text:'#475569', dot:'#94A3B8' },
}

// ── TabEvolucao ────────────────────────────────────────────────────────────
export const MEDIDAS_CONFIG = [
  { key: 'waist', label: 'Cintura',  color: '#6366F1', unit: 'cm' },
  { key: 'chest', label: 'Peito',    color: '#EC4899', unit: 'cm' },
  { key: 'hip',   label: 'Quadril',  color: '#F59E0B', unit: 'cm' },
  { key: 'thigh', label: 'Coxa',     color: '#10B981', unit: 'cm' },
  { key: 'arm',   label: 'Braço',    color: '#3B82F6', unit: 'cm' },
  { key: 'calf',  label: 'Panturrilha', color: '#EF4444', unit: 'cm' },
]

export const GLASS_CARD = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(12px)',
  borderRadius: 18,
  border: '1.5px solid rgba(255,255,255,0.85)',
  boxShadow: '0 4px 24px rgba(12,50,81,0.1)',
  padding: '22px 24px',
  marginBottom: 20,
}

export function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = String(d).slice(0,10).split('-')
  return `${day}/${m}`
}

// ── TabCardio ──────────────────────────────────────────────────────────────
export const CARDIO_TYPES = [
  { id: 'corrida',     label: 'Corrida',       icon: null, color: '#EF4444', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'bike',        label: 'Bike',          icon: null, color: '#F59E0B', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'esteira',     label: 'Esteira',       icon: null, color: '#8B5CF6', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'eliptico',    label: 'Elíptico',      icon: null, color: '#06B6D4', hasDistance: false, hasHR: true,  isHIIT: false },
  { id: 'natacao',     label: 'Natação',       icon: null, color: '#3B82F6', hasDistance: true,  hasHR: false, isHIIT: false },
  { id: 'pular_corda', label: 'Pular Corda',   icon: null, color: '#10B981', hasDistance: false, hasHR: true,  isHIIT: false },
  { id: 'hiit',        label: 'HIIT',          icon: null, color: '#F5C842', hasDistance: false, hasHR: true,  isHIIT: true  },
]

export const PSE_LABELS = ['', 'Muito leve', 'Leve', 'Moderado leve', 'Moderado', 'Moderado intenso', 'Intenso', 'Muito intenso', 'Difícil', 'Muito difícil', 'Máximo']

// Proporção cardio/musculação por objetivo (soma = 100)
// Baseado em: Willis et al. (2012), Pontzer et al. (2016), Hickson (1980), Seiler (2010)
export const PRESCRICAO = {
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
    dicaCientifica: 'Sem controle alimentar, o cardio isolado tem eficácia limitada. Estudos mostram que o corpo compensa o gasto do exercício reduzindo o metabolismo basal (Pontzer et al., 2016). Combine com treino de força para melhores resultados.',
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

export function formatPace(distKm, durMin) {
  if (!distKm || !durMin || distKm === 0) return '—'
  const paceMin = durMin / distKm
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60).toString().padStart(2, '0')
  return `${m}:${s}/km`
}

// ── Blocos de planejamento ────────────────────────────────────────────────────
// Diário de Carga — graus de intensidade
export const GRAUS = {
  repouso:    { label:'Repouso',         cor:'#334155', bg:'rgba(51,65,85,0.18)',    border:'rgba(51,65,85,0.35)',    desc:'Descanso completo — sem atividade física' },
  regeneracao:{ label:'Regeneração',     cor:'#22C55E', bg:'rgba(34,197,94,0.15)',   border:'rgba(34,197,94,0.35)',   desc:'Atividade leve: mobilidade, caminhada, alongamento' },
  moderado:   { label:'Moderado',        cor:'#60A5FA', bg:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.35)',  desc:'Treino dentro da zona de conforto — volume controlado' },
  intenso:    { label:'Intenso',         cor:'#F59E0B', bg:'rgba(245,158,11,0.15)',  border:'rgba(245,158,11,0.35)',  desc:'Acima do confortável — exige esforço real e foco' },
  maximo:     { label:'Máximo',          cor:'#EF4444', bg:'rgba(239,68,68,0.15)',   border:'rgba(239,68,68,0.35)',   desc:'Sessão de pico — limite do aluno, usar com parcimônia' },
}

export const DIAS_SEMANA_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

// ── FundamentosModal — Planilha de Fundamentos por semana ────────────────────
export const FUND_BLOCOS = {
  volume:      { label:'Volume',       cor:'#3B82F6', bg:'rgba(59,130,246,0.13)', border:'rgba(59,130,246,0.3)', desc:'Séries · Repetições · Exercícios · km · min' },
  intensidade: { label:'Intensidade',  cor:'#EF4444', bg:'rgba(239,68,68,0.13)',  border:'rgba(239,68,68,0.3)',  desc:'% 1RM · Velocidade · Altura · PSE alvo' },
  frequencia:  { label:'Frequência',   cor:'#F97316', bg:'rgba(249,115,22,0.13)', border:'rgba(249,115,22,0.3)', desc:'Sessões/semana · Dias por grupo muscular' },
  recuperacao: { label:'Recuperação',  cor:'#22C55E', bg:'rgba(34,197,94,0.13)',  border:'rgba(34,197,94,0.3)',  desc:'Dias descanso · Sono · Alimentação' },
}

export function calcDensidade(intens, rec) {
  // Densidade = relação Intensidade × (1 / Recuperação)
  // Inputs livres — faz análise qualitativa
  if (!intens || !rec) return { label:'—', cor:'#475569' }
  const intensNum = parseFloat(intens)
  const recNum    = parseFloat(rec)
  if (!intensNum || !recNum) return { label:'—', cor:'#475569' }
  const ratio = intensNum / recNum
  if (ratio > 25)  return { label:'Muito Alta', cor:'#EF4444' }
  if (ratio > 15)  return { label:'Alta',       cor:'#F97316' }
  if (ratio > 8)   return { label:'Moderada',   cor:'#F59E0B' }
  return               { label:'Baixa',      cor:'#22C55E' }
}

// ── NotificacoesPanel ─────────────────────────────────────────────────────────
export function imcInfo(imc) {
  const v = parseFloat(imc)
  if (!v) return null
  if (v < 18.5) return { cat:'Abaixo do peso', cor:'#60A5FA' }
  if (v < 25)   return { cat:'Normal',         cor:'#22C55E' }
  if (v < 30)   return { cat:'Sobrepeso',       cor:'#F59E0B' }
  if (v < 35)   return { cat:'Obesidade I',     cor:'#F97316' }
  return              { cat:'Obesidade II+',    cor:'#EF4444' }
}

export const OBJ_LABEL = { emagrecimento:'Perda de gordura', massa:'Ganho de massa', saude:'Saúde e disposição', performance:'Performance' }
