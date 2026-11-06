import { supabase } from '../supabase'
import { calcFinal } from './anthropometry'

// ── Objetivo geral → grupo de gráficos ───────────────────────────────────────
export function goalGroup(goal) {
  if (goal === 'Emagrecimento') return 'emagrecimento'
  if (goal === 'Ganho de Massa') return 'hipertrofia'
  if (['Força e Performance', 'Treinamento Competitivo', 'Desenvolvimento Atlético'].includes(goal)) return 'performance'
  return 'saude' // Saúde e Bem-Estar, Condicionamento e demais
}

// Circunferências que o professor pode priorizar (hipertrofia)
export const CIRC_OPTIONS = [
  { key: 'coxa',           label: 'Coxa',            bilateral: true },
  { key: 'braco_relaxado', label: 'Braço relaxado',  bilateral: true },
  { key: 'braco_contraido',label: 'Braço contraído', bilateral: true },
  { key: 'antebraco',      label: 'Antebraço',       bilateral: true },
  { key: 'panturrilha',    label: 'Panturrilha',     bilateral: true },
  { key: 'ombro',          label: 'Ombro',           bilateral: false },
  { key: 'cintura',        label: 'Cintura',         bilateral: false },
  { key: 'quadril',        label: 'Quadril',         bilateral: false },
]

// Grupos musculares com 1RM estimado (hipertrofia)
export const RM_GROUPS = ['Peito', 'Costas', 'Quadríceps', 'Posterior', 'Ombro']

export const parseNum = (v) => {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

// 1RM estimado (Epley) — só séries até 12 reps, onde a fórmula é confiável
export const epley1RM = (weight, reps) => {
  const w = parseNum(weight), r = parseNum(reps)
  if (!w || !r || r > 12) return null
  return r === 1 ? w : +(w * (1 + r / 30)).toFixed(1)
}

// Valor final de uma circunferência numa avaliação (média D/E nas bilaterais)
export function circValue(medidas, key) {
  if (!medidas) return null
  const opt = CIRC_OPTIONS.find(o => o.key === key)
  const fin = (k) => medidas[k] ? calcFinal(medidas[k].t1, medidas[k].t2, medidas[k].t3) : null
  if (opt && opt.bilateral) {
    const vals = [fin(`${key}_d`), fin(`${key}_e`)].filter(v => v != null)
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
  }
  return fin(key)
}

// ── Busca de dados (aluno usa as views públicas; professor, as tabelas) ──────
export async function fetchEvolutionData(studentId, { publicMode = false, needLogs = false } = {}) {
  const tbl = publicMode ? 'measure_logs_public' : 'measure_logs'
  const { data: measures } = await supabase.from(tbl).select('*').eq('student_id', studentId).order('date', { ascending: true })
  let logs = [], exercises = {}
  if (needLogs) {
    const { data: l } = await supabase.from('exercise_logs').select('exercise_id,date,sets').eq('student_id', studentId).order('date', { ascending: true })
    logs = l || []
    const ids = [...new Set(logs.map(x => x.exercise_id).filter(Boolean))]
    if (ids.length) {
      const { data: ex } = await supabase.from('exercises').select('id,name,type').in('id', ids)
      ;(ex || []).forEach(e => { exercises[e.id] = e })
    }
  }
  return { measures: measures || [], logs, exercises }
}

// ── Constrói as séries de gráfico conforme o objetivo ────────────────────────
const fromMeasures = (measures, fn) =>
  measures.map(m => ({ date: m.date, value: fn(m) })).filter(p => p.date && p.value != null)

const testSeries = (measures, regex) => {
  const pts = []
  measures.forEach(m => {
    if (!m.tests) return
    const k = Object.keys(m.tests).find(x => regex.test(x))
    const v = k ? parseNum(m.tests[k]) : null
    if (v != null) pts.push({ date: m.date, value: v })
  })
  return pts
}

function rmSeriesByGroup({ logs, exercises }) {
  // 1RM estimado por exercício e por dia (melhor série)
  const perEx = {}
  logs.forEach(l => {
    const ex = exercises[l.exercise_id]
    if (!ex || !Array.isArray(l.sets)) return
    const best = Math.max(0, ...l.sets.map(s => epley1RM(s.weight, s.reps) || 0))
    if (!best) return
    if (!perEx[ex.id]) perEx[ex.id] = { ex, byDate: {} }
    perEx[ex.id].byDate[l.date] = Math.max(perEx[ex.id].byDate[l.date] || 0, best)
  })
  return RM_GROUPS.map(type => {
    const cands = Object.values(perEx).filter(x => x.ex.type === type)
    if (!cands.length) return null
    cands.sort((a, b) => Object.keys(b.byDate).length - Object.keys(a.byDate).length)
    const top = cands[0]
    const points = Object.entries(top.byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }))
    return { key: `rm_${type}`, title: `${type} · ${top.ex.name}`, subtitle: '1RM estimado', unit: 'kg', points }
  }).filter(Boolean)
}

export function buildSeries({ measures, logs, exercises }, goal, medidaPrioritaria) {
  const grp = goalGroup(goal)
  const S = (key, title, unit, points, subtitle) => ({ key, title, unit, points, subtitle })
  const peso = S('peso', 'Peso', 'kg', fromMeasures(measures, m => parseNum(m.weight)))
  const gordura = S('gordura', '% Gordura', '%', fromMeasures(measures, m => parseNum(m.body_fat)), 'Bioimpedância')
  const magra = S('magra', 'Massa magra', 'kg', fromMeasures(measures, m => parseNum(m.lean_mass)), 'Bioimpedância')
  const rcq = S('rcq', 'RCQ', '', fromMeasures(measures, m => parseNum(m.rcq)), 'Cintura ÷ Quadril')
  const imc = S('imc', 'IMC', '', fromMeasures(measures, m => parseNum(m.imc)))
  let out = []

  if (grp === 'emagrecimento') out = [rcq, peso, gordura]
  else if (grp === 'saude') out = [imc, S('vo2', 'VO₂ máx', 'ml/kg/min', testSeries(measures, /vo2/i)), gordura]
  else if (grp === 'hipertrofia') {
    const key = medidaPrioritaria || 'coxa'
    const opt = CIRC_OPTIONS.find(o => o.key === key) || CIRC_OPTIONS[0]
    out = [
      ...rmSeriesByGroup({ logs, exercises }),
      S('circ', `Circunferência · ${opt.label}`, 'cm', fromMeasures(measures, m => circValue(m.medidas, opt.key)), opt.bilateral ? 'Média D/E' : undefined),
      magra, gordura,
    ]
  } else { // performance — flexível por enquanto
    out = [
      S('rm', 'RM', 'kg', testSeries(measures, /^rm/i)),
      S('vel', 'Velocidade máx', '', testSeries(measures, /veloc/i)),
      S('limiar', 'Limiar aeróbio', '', testSeries(measures, /limiar/i)),
      S('salto', 'Altura de salto', 'cm', testSeries(measures, /salto|impuls/i)),
    ]
  }
  return out.filter(s => s.points.length > 0)
}
