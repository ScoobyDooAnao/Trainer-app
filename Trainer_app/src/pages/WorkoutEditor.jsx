import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAppNavigate } from '../lib/useAppNavigate'

// ── Paleta simples (temporária, sem tema visual ainda) ────────────────────────
const V = {
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
const MUSCLE_TYPES = [
  'Peito','Costas','Bíceps','Tríceps','Ombro',
  'Quadríceps','Posterior','Glúteo','Panturrilha','Core','Cardio','Full Body',
]
const NEW_TYPES = ['Funcional','Elástico','Peso Corporal','Mobilidade']
const EXERCISE_TYPES = [...MUSCLE_TYPES, ...NEW_TYPES]

const MODALITY_MAP = {
  'Musculação': MUSCLE_TYPES,
  'Funcional':  ['Funcional','Full Body','Core','Cardio'],
  'Elástico':   ['Elástico'],
  'Corpo':      ['Peso Corporal','Mobilidade'],
}
const MODALITY_COLORS = {
  'Musculação': '#A78BFA',
  'Funcional':  '#34D399',
  'Elástico':   '#FBBF24',
  'Corpo':      '#60A5FA',
}

const STATUS_OPTIONS = ['draft','active','archived']
const STATUS_LABEL   = { draft:'Rascunho', active:'Ativo', archived:'Arquivado' }
const DAY_COLORS     = ['#D97706','#F97316','#FBBF24','#B45309','#D97706','#F59E0B']
const emptyEx        = { name:'', sets:'3', reps:'10-12', rest:'60s', rir:'2', tip:'', type:'Peito' }

const getAgeGroup = (birthDate, age) => {
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

const AGE_GROUP_LABEL = {
  crianca:'Criança', adolescente:'Adolescente',
  adulto_jovem:'Adulto', adulto_maduro:'Adulto Maduro', idoso:'Idoso 60+',
}
const AGE_GROUP_COLOR = {
  crianca:'#34D399', adolescente:'#60A5FA',
  adulto_jovem:'#FBBF24', adulto_maduro:'#F97316', idoso:'#F87171',
}
const AGE_RESTRICTIONS = {
  crianca:       { maxPct:60,  warning:'Criança: sem carga máxima. Prescrever por PSE e peso corporal.',     blockedZones:['Força Máxima','Hipertrofia'] },
  adolescente:   { maxPct:70,  warning:'Adolescente: limitar a 70% 1RM durante fase de crescimento ósseo.', blockedZones:['Força Máxima'] },
  adulto_jovem:  { maxPct:100, warning:null,                                                                 blockedZones:[] },
  adulto_maduro: { maxPct:100, warning:'Adulto maduro: aumentar descanso entre séries (48-72h por grupo).', blockedZones:[] },
  idoso:         { maxPct:75,  warning:'60+: iniciar com 40-50% 1RM. Avaliação médica recomendada.',        blockedZones:['Força Máxima'] },
}
const ZONES = [
  { label:'Força Máxima',      pct:[85,100], reps:'1-5',   rest:'3-5min',  color:'#EF4444' },
  { label:'Hipertrofia',       pct:[65,85],  reps:'6-12',  rest:'60-120s', color:'#A78BFA' },
  { label:'Resistência Musc.', pct:[40,65],  reps:'15-30', rest:'30-60s',  color:'#34D399' },
]

const calc1RM = (carga, reps) => {
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
const TYPE_COLOR = {
  'Funcional':     '#34D399',
  'Elástico':      '#FBBF24',
  'Peso Corporal': '#60A5FA',
  'Mobilidade':    '#F472B6',
  'Core':          '#34D399',
  'Full Body':     '#6EE7B7',
  'Cardio':        '#F87171',
}
const getTypeColor = (type) => TYPE_COLOR[type] || V.accentBr

// ── Styles base (Vestiário Pré-Jogo) ──────────────────────────────────────────
const ss = {
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

// ── 1RM Calculator ─────────────────────────────────────────────────────────────
function OneRMCalc({ ageGroup, onApply, onClose }) {
  const [carga, setCarga] = useState('')
  const [reps,  setReps]  = useState('')
  const oneRM = calc1RM(carga, reps)
  const rest  = AGE_RESTRICTIONS[ageGroup] || AGE_RESTRICTIONS.adulto_jovem

  return (
    <div style={{ background:'rgba(14,9,0,0.95)', border:`1px solid ${V.border}`, borderRadius:12, padding:16, margin:'8px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:V.accentBr }}>Calculadora 1RM</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:V.textSub, cursor:'pointer', fontSize:16 }}>×</button>
      </div>
      {rest.warning && (
        <div style={{ background:'rgba(217,119,6,0.08)', border:`1px solid rgba(217,119,6,0.2)`, borderRadius:8, padding:'8px 12px', fontSize:11, color:V.accentBr, marginBottom:12 }}>
          {rest.warning}
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:9, color:V.textMuted, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>Carga (kg)</div>
          <input type="number" style={{ ...ss.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={carga} onChange={e => setCarga(e.target.value)} placeholder="ex: 80" />
        </div>
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:9, color:V.textMuted, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>Reps (1-15)</div>
          <input type="number" style={{ ...ss.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={reps} onChange={e => setReps(e.target.value)} placeholder="ex: 8" />
        </div>
        <div style={{ flex:1, minWidth:100, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ fontSize:9, color:V.textMuted, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>1RM Estimado</div>
          <div style={{ background: oneRM ? 'rgba(217,119,6,0.15)' : V.bgInput, border:`1px solid ${oneRM ? V.borderStrong : V.borderLight}`, borderRadius:6, padding:'7px', textAlign:'center', fontSize:18, fontWeight:900, color: oneRM ? V.accentBr : V.textDim }}>
            {oneRM ? oneRM + ' kg' : '-'}
          </div>
        </div>
      </div>
      {oneRM && (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {ZONES.map(zone => {
            const blocked    = rest.blockedZones.includes(zone.label)
            const maxAllowed = Math.round(oneRM * rest.maxPct / 100)
            const lo         = Math.round(oneRM * zone.pct[0] / 100)
            const hi         = Math.round(Math.min(oneRM * zone.pct[1] / 100, maxAllowed))
            const load       = lo <= maxAllowed ? { lo, hi } : null
            return (
              <div key={zone.label} style={{ display:'flex', alignItems:'center', gap:8, background: blocked ? 'rgba(255,255,255,0.01)' : zone.color + '10', border:`1px solid ${blocked ? 'rgba(255,255,255,0.04)' : zone.color + '30'}`, borderRadius:8, padding:'7px 10px', opacity: blocked ? 0.4 : 1 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color: blocked ? V.textDim : zone.color }}>{blocked ? 'Restrito — ':''}{zone.label}</div>
                  <div style={{ fontSize:9, color:V.textMuted }}>{zone.reps} reps · {zone.rest}</div>
                </div>
                {load && !blocked ? (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:900, color:zone.color }}>{load.lo}-{load.hi}kg</div>
                    <button onClick={() => onApply({ reps:zone.reps, rest:zone.rest })} style={{ fontSize:9, background:zone.color+'20', border:`1px solid ${zone.color}40`, borderRadius:5, padding:'2px 7px', color:zone.color, cursor:'pointer', fontWeight:700 }}>Usar</button>
                  </div>
                ) : (
                  <div style={{ fontSize:10, color:V.textDim }}>{blocked ? 'Restrito':'-'}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Popup obrigatório de configuração — abre ao criar um plano novo ───────────
// Só fecha ao salvar ou ao voltar pra Ficha do Aluno (nunca com X/backdrop).
function SetupPlanoModal({ plan, student, anamData, mesoAtual, onSave, onVoltar }) {
  const perfil = anamData?.perfil || null
  const freqSugerida = perfil?.frequencia ? parseInt(perfil.frequencia) : null

  const [diasSemana, setDiasSemana]   = useState(freqSugerida || 3)
  const [gruposFoco, setGruposFoco]   = useState([])
  const [intensidade, setIntensidade] = useState('Moderada')
  const [saving, setSaving] = useState(false)

  const toggleGrupo = (g) => setGruposFoco(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g])

  const salvar = async () => {
    setSaving(true)
    await onSave({ dias_semana: diasSemana, grupos_foco: gruposFoco, intensidade })
    setSaving(false)
  }

  const infoRow = (label, val) => val ? (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>{label}: </span>
      <span style={{ fontSize:13, color:'#E2E8F0', fontWeight:700 }}>{val}</span>
    </div>
  ) : null

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:500, overflowY:'auto', display:'flex', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:520 }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>Antes de montar o treino</div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:24 }}>Essas informações guiam a prescrição — preencha antes de continuar.</div>

        {(mesoAtual || perfil) && (
          <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:0.6, marginBottom:10 }}>Contexto do Aluno</div>
            {mesoAtual && infoRow('Mesociclo Ativo', `${mesoAtual.nome} (semana ${mesoAtual.semanaAtual - mesoAtual.semana_inicio + 1} de ${mesoAtual.semana_fim - mesoAtual.semana_inicio + 1})`)}
            {perfil?.nivel && infoRow('Nível de Atividade', perfil.nivel)}
            {perfil?.experiencia && infoRow('Experiência', perfil.experiencia)}
            {perfil?.objetivo && infoRow('Objetivo', perfil.objetivo)}
            {perfil?.local && infoRow('Local de Treino', perfil.local)}
            {perfil?.horario && infoRow('Horário Preferido', perfil.horario)}
            {perfil?.restricoes?.length > 0 && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Limitações do Aluno</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {perfil.restricoes.map(r => (
                    <span key={r} style={{ fontSize:11, fontWeight:700, color:'#F87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'2px 8px' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
            {!mesoAtual && <div style={{ fontSize:12, color:'#475569', fontStyle:'italic' }}>Nenhum mesociclo ativo no Planejamento.</div>}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Dias por semana</label>
          <div style={{ display:'flex', gap:8 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setDiasSemana(n)} style={{ width:38, height:38, borderRadius:10, border: diasSemana===n ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: diasSemana===n ? '#3B82F6' : '#0A0A0A', color: diasSemana===n ? '#fff' : '#94A3B8', fontWeight:800, fontSize:14, cursor:'pointer' }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Grupo Muscular Focado</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {MUSCLE_TYPES.map(g => (
              <button key={g} onClick={() => toggleGrupo(g)} style={{ padding:'7px 12px', borderRadius:20, border: gruposFoco.includes(g) ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: gruposFoco.includes(g) ? 'rgba(59,130,246,0.15)' : '#0A0A0A', color: gruposFoco.includes(g) ? '#60A5FA' : '#94A3B8', fontSize:12, fontWeight:700, cursor:'pointer' }}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 26 }}>
          <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Intensidade</label>
          <div style={{ display:'flex', gap:8 }}>
            {['Leve','Moderada','Intensa'].map(i => (
              <button key={i} onClick={() => setIntensidade(i)} style={{ flex:1, padding:'10px', borderRadius:10, border: intensidade===i ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: intensidade===i ? '#3B82F6' : '#0A0A0A', color: intensidade===i ? '#fff' : '#94A3B8', fontWeight:700, fontSize:13, cursor:'pointer' }}>{i}</button>
            ))}
          </div>
        </div>

        <button onClick={salvar} disabled={saving || !diasSemana}
          style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#3B82F6', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', marginBottom:10 }}>
          {saving ? 'Salvando...' : 'Salvar e Montar Treino'}
        </button>
        <button onClick={onVoltar} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          ← Voltar à Ficha do Aluno
        </button>
      </div>
    </div>
  )
}

// ── WorkoutEditor Principal ────────────────────────────────────────────────────
export default function WorkoutEditor() {
  const navigate = useAppNavigate()
  const { studentId, planId } = useParams()
  const [plan,         setPlan]         = useState(null)
  const [days,         setDays]         = useState([])
  const [student,      setStudent]      = useState(null)
  const [anamData,     setAnamData]     = useState(null)
  const [mesoAtual,    setMesoAtual]    = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [newExForms,   setNewExForms]   = useState({})
  const [openCalc,     setOpenCalc]     = useState(null)
  const [showAval,     setShowAval]     = useState(false)
  const [historico,    setHistorico]    = useState({}) // { nomeExercicioLower: { last, sugestao } }

  const ageGroup   = getAgeGroup(student?.birth_date, student?.age)
  const studentAge = student?.birth_date
    ? Math.floor((Date.now() - new Date(student.birth_date)) / (365.25 * 24 * 3600 * 1000))
    : student?.age ? parseInt(student.age) : null

  useEffect(() => { fetchAll() }, [planId])
  useEffect(() => { if (studentId) fetchHistorico() }, [studentId])
  useEffect(() => { if (studentId) fetchContexto() }, [studentId])

  // ── Contexto pro popup obrigatório: mesociclo ativo (Planner) + Perfil Interpretado (Ficha) ──
  const fetchContexto = async () => {
    const { data: anam } = await supabase.from('anamnese').select('*').eq('student_id', studentId).limit(1)
    if (anam?.[0]) setAnamData(anam[0])

    const { data: macros } = await supabase.from('macrociclos').select('*').eq('student_id', studentId).order('data_inicio', { ascending:false }).limit(1)
    const macro = macros?.[0]
    if (!macro?.data_inicio) return
    const diff = Math.floor((Date.now() - new Date(macro.data_inicio)) / (7*24*3600*1000))
    const semana = Math.max(1, Math.min(diff + 1, macro.semanas_total))
    const { data: mesos } = await supabase.from('mesociclos').select('*').eq('macrociclo_id', macro.id).order('semana_inicio')
    const atual = (mesos || []).find(m => semana >= m.semana_inicio && semana <= m.semana_fim)
    if (atual) setMesoAtual({ ...atual, semanaAtual: semana })
  }

  // ── 4.1: histórico de cargas do aluno (todos os planos) p/ sugestão de progressão ──
  const fetchHistorico = async () => {
    const { data: plansIds }  = await supabase.from('workout_plans').select('id').eq('student_id', studentId)
    if (!plansIds?.length) return
    const { data: daysIds }   = await supabase.from('workout_days').select('id').in('plan_id', plansIds.map(p => p.id))
    if (!daysIds?.length) return
    const { data: exs }       = await supabase.from('exercises').select('id,name').in('day_id', daysIds.map(d => d.id))
    if (!exs?.length) return
    const { data: logs }      = await supabase.from('exercise_logs').select('exercise_id,date,sets').eq('student_id', studentId).order('date', { ascending:false })
    if (!logs?.length) return

    const idToName = {}
    exs.forEach(e => { idToName[e.id] = e.name.trim().toLowerCase() })

    const porNome = {}
    logs.forEach(l => {
      const nome = idToName[l.exercise_id]
      if (!nome || porNome[nome]) return // já temos o mais recente (logs vem ordenado desc)
      porNome[nome] = l
    })

    const result = {}
    Object.entries(porNome).forEach(([nome, log]) => {
      const pesos = (log.sets || []).map(s => +s.weight || 0).filter(Boolean)
      const reps  = (log.sets || []).map(s => +s.reps || 0).filter(Boolean)
      if (!pesos.length) return
      const maxPeso = Math.max(...pesos)
      const rirs = (log.sets || []).map(s => s.rir != null ? +s.rir : null).filter(v => v !== null && !isNaN(v))
      const avgRir = rirs.length ? rirs.reduce((a,b) => a+b, 0) / rirs.length : null
      let sugestao
      if (avgRir !== null && avgRir >= 3) sugestao = `RIR alto — pode subir ~${Math.round(maxPeso*0.05*2)/2}kg`
      else if (avgRir !== null && avgRir <= 1) sugestao = `RIR baixo — manter ${maxPeso}kg`
      else sugestao = `manter ou +${Math.round(maxPeso*0.025*2)/2}kg`
      result[nome] = { last: { peso: maxPeso, reps: reps[0] || null, date: log.date, rir: avgRir }, sugestao }
    })
    setHistorico(result)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [{ data:planData }, { data:daysData }, { data:studentData }] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('id', planId).single(),
      supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', planId).order('order_index'),
      supabase.from('students').select('id,name,birth_date,age,goal,sport').eq('id', studentId).single(),
    ])
    if (planData)    setPlan(planData)
    if (daysData)    setDays(daysData.map(d => ({ ...d, exercises:(d.exercises||[]).sort((a,b) => a.order_index - b.order_index) })))
    if (studentData) setStudent(studentData)
    setLoading(false)
  }

  const savePlanTitle = async () => {
    setSaving(true)
    await supabase.from('workout_plans').update({ title:plan.title, status:plan.status, updated_at:new Date().toISOString() }).eq('id', planId)
    setSaving(false)
  }

  const saveStatus = async (newStatus) => {
    setSaving(true)
    await supabase.from('workout_plans').update({ status:newStatus, updated_at:new Date().toISOString() }).eq('id', planId)
    setSaving(false)
  }

  // ── Análise de avaliação — calculada em tempo real a partir dos days ────────
  const avalAnalysis = (() => {
    if (!days.length) return {}

    const goal  = student?.goal  || ''
    const nivel = student?.level || 'Iniciante'
    const age   = parseInt(student?.age) || null

    // ── Classificações de exercícios ─────────────────────────────────────────
    const MUSCLE_MAP = {
      supino:'Peito','supino reto':'Peito','supino inclinado':'Peito','supino declinado':'Peito',
      crucifixo:'Peito',voador:'Peito',crossover:'Peito','peck deck':'Peito','flexão':'Peito','push up':'Peito',
      remada:'Costas',puxada:'Costas','barra fixa':'Costas','levantamento terra':'Costas',
      pulldown:'Costas',serrote:'Costas',cavalinho:'Costas',hiperextensão:'Costas',
      desenvolvimento:'Ombro','elevação lateral':'Ombro','elevação frontal':'Ombro',
      arnold:'Ombro','face pull':'Ombro',encolhimento:'Ombro',
      'rosca direta':'Bíceps','rosca alternada':'Bíceps','rosca martelo':'Bíceps',
      'rosca concentrada':'Bíceps','rosca scott':'Bíceps',curl:'Bíceps',
      tríceps:'Tríceps',triceps:'Tríceps',mergulho:'Tríceps',extensão:'Tríceps',
      testa:'Tríceps',corda:'Tríceps',paralelas:'Tríceps',
      agachamento:'Quadríceps','leg press':'Quadríceps',hack:'Quadríceps',
      'cadeira extensora':'Quadríceps',avanço:'Quadríceps',afundo:'Quadríceps',búlgaro:'Quadríceps',
      stiff:'Posterior','mesa flexora':'Posterior',flexora:'Posterior','leg curl':'Posterior',
      glúteo:'Glúteo',gluteo:'Glúteo','hip thrust':'Glúteo','elevação pélvica':'Glúteo',
      panturrilha:'Panturrilha',gêmeos:'Panturrilha',calf:'Panturrilha',
      abdominal:'Abdômen',prancha:'Abdômen',crunch:'Abdômen',plank:'Abdômen',
    }
    // Padrões de movimento
    const EMPURRAR  = ['supino','flexão','push','desenvolvimento','arnold','tríceps','triceps','paralelas','mergulho','crossover','crucifixo','voador','peck','extensão de tríceps']
    const PUXAR     = ['remada','pulldown','puxada','barra fixa','pull','serrote','rosca','curl','bíceps','biceps']
    const JOELHO    = ['agachamento','leg press','hack','cadeira','avanço','afundo','búlgaro','passada']
    const QUADRIL   = ['stiff','mesa','flexora','leg curl','hip thrust','glúteo','elevação pélvica','levantamento terra']
    const LIVRE     = ['agachamento','barra','halteres','kettlebell','terra','stiff']
    const MAQUINA   = ['leg press','cadeira','mesa','voador','peck','crossover','pulldown','hack']
    const MULTI_EX  = ['agachamento','supino','levantamento','terra','remada','barra','desenvolvimento','leg press','hack','stiff','avanço','afundo','paralelas','mergulho']
    const ISOL_EX   = ['curl','rosca','extensão','crucifixo','voador','pulldown','puxada','tríceps','bíceps','panturrilha','elevação lateral','elevação frontal','face pull']

    const chk   = (name, list) => list.some(k => (name||'').toLowerCase().includes(k))
    const group = (name) => { const n=(name||'').toLowerCase(); for(const[k,g] of Object.entries(MUSCLE_MAP)){if(n.includes(k))return g}; return null }

    // ── Faixas de referência por objetivo e nível ────────────────────────────
    const REF_REPS = {
      'Força e Performance':  { min:1,  max:6,  label:'1–6 reps (força máxima)' },
      'Ganho de Massa':       { min:6,  max:15, label:'6–15 reps (hipertrofia)' },
      'Emagrecimento':        { min:12, max:20, label:'12–20 reps (resistência metabólica)' },
      'Condicionamento':      { min:12, max:20, label:'12–20 reps (resistência)' },
      'Saúde e Bem-Estar':    { min:10, max:15, label:'10–15 reps (saúde geral)' },
    }
    const REF_SETS = {
      'Força e Performance':  [3,6],
      'Ganho de Massa':       [3,5],
      'Emagrecimento':        [2,4],
      'Condicionamento':      [2,4],
      'Saúde e Bem-Estar':    [2,4],
    }
    const REF_REST = {
      'Força e Performance':  { min:120, max:300, label:'2min–5min' },
      'Ganho de Massa':       { min:60,  max:120, label:'1min–2min' },
      'Emagrecimento':        { min:30,  max:60,  label:'30s–1min'  },
      'Condicionamento':      { min:30,  max:90,  label:'30s–1min30s' },
      'Saúde e Bem-Estar':    { min:45,  max:90,  label:'45s–1min30s' },
    }
    const refReps = REF_REPS[goal] || { min:8, max:15, label:'8–15 reps' }
    const refSets = REF_SETS[goal] || [2,5]
    const refRest = REF_REST[goal] || { min:45, max:120, label:'45s–2min' }

    const parseRest = (r) => {
      if (!r) return null
      const s = String(r).trim().toLowerCase()
      const minSec = s.match(/^(\d+(?:\.\d+)?)\s*min\s*(\d+)\s*s?$/)
      if (minSec) return Math.round(+minSec[1]*60 + +minSec[2])
      const col = s.match(/^(\d+):(\d{2})$/)
      if (col) return +col[1]*60 + +col[2]
      const minOnly = s.match(/^(\d+(?:\.\d+)?)\s*min$/)
      if (minOnly) return Math.round(+minOnly[1]*60)
      const secOnly = s.match(/^(\d+)\s*s?$/)
      if (secOnly) return +secOnly[1]
      return null
    }
    const fmtSec = (s) => s >= 60 ? Math.floor(s/60)+'min'+(s%60?s%60+'s':'') : s+'s'
    const parseRepsRange = (r) => {
      if (!r) return null
      const m = String(r).match(/^(\d+)(?:[–-](\d+))?/)
      if (!m) return null
      return m[2] ? { min:+m[1], max:+m[2] } : { min:+m[1], max:+m[1] }
    }

    // ── Volume por grupo muscular (semana inteira) ────────────────────────────
    const setsByGroup = {}
    days.forEach(d => {
      ;(d.exercises||[]).forEach(ex => {
        const g = group(ex.name)
        if (g) setsByGroup[g] = (setsByGroup[g]||0) + (+(ex.sets)||0)
      })
    })
    const REF_VOL = { 'Iniciante':{min:10,max:15},'Intermediário':{min:12,max:18},'Avançado':{min:16,max:22},'Atleta Jovem':{min:12,max:20},'Atleta Competitivo':{min:18,max:25} }
    const refVol = REF_VOL[nivel] || REF_VOL['Iniciante']

    // ── Overlap muscular entre dias consecutivos ──────────────────────────────
    const DIA_JS = {Dom:0,Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6}
    const daysSorted = [...days].sort((a,b) => (DIA_JS[a.day_of_week]||0) - (DIA_JS[b.day_of_week]||0))

    const overlapMap = {} // { dayId: [overlapping muscle groups] }
    for (let i=1; i<daysSorted.length; i++) {
      const prev = daysSorted[i-1], curr = daysSorted[i]
      const prevDayJs = DIA_JS[prev.day_of_week], currDayJs = DIA_JS[curr.day_of_week]
      if (currDayJs - prevDayJs === 1) { // dias consecutivos
        const prevGroups = new Set((prev.exercises||[]).map(e=>group(e.name)).filter(Boolean))
        const currGroups = (curr.exercises||[]).map(e=>group(e.name)).filter(Boolean)
        const overlap = currGroups.filter(g => prevGroups.has(g))
        if (overlap.length) overlapMap[curr.id] = overlap
      }
    }

    // ── Análise global de empurrar/puxar ─────────────────────────────────────
    let totalEmpurrar = 0, totalPuxar = 0
    days.forEach(d => {
      ;(d.exercises||[]).forEach(ex => {
        if (chk(ex.name, EMPURRAR)) totalEmpurrar += +(ex.sets||0)
        if (chk(ex.name, PUXAR))    totalPuxar    += +(ex.sets||0)
      })
    })
    const razaoPP = totalPuxar && totalEmpurrar ? totalPuxar/totalEmpurrar : null

    // ── Análise por dia ───────────────────────────────────────────────────────
    const dayResults = {}
    days.forEach(d => {
      const exs    = d.exercises || []
      const issues = []
      const exFields = {}

      if (!exs.length) {
        dayResults[d.id] = { status:'atencao', issues:[{ type:'atencao', msg:'Nenhum exercício cadastrado neste dia.' }], exFields:{} }
        return
      }

      // ── 1. ORDEM: multiarticulares antes de isolados ─────────────────────
      const firstMulti = exs.findIndex(e => chk(e.name, MULTI_EX))
      const firstIsol  = exs.findIndex(e => chk(e.name, ISOL_EX))
      const ordemErrada = firstIsol !== -1 && firstMulti !== -1 && firstIsol < firstMulti
      if (ordemErrada) {
        issues.push({ type:'critico', msg:`Ordem incorreta: exercícios isolados aparecem antes dos multiarticulares. Comece sempre por agachamento, supino, terra e similares — eles recrutam mais fibras e exigem maior foco neural.` })
      }

      // ── 2. PESOS LIVRES antes de máquinas (quando possível) ─────────────
      const firstLivre   = exs.findIndex(e => chk(e.name, LIVRE))
      const firstMaquina = exs.findIndex(e => chk(e.name, MAQUINA))
      if (firstLivre !== -1 && firstMaquina !== -1 && firstLivre > firstMaquina) {
        issues.push({ type:'atencao', msg:`Pesos livres aparecem depois das máquinas. O ideal é usar pesos livres (barra, halteres) primeiro — eles exigem mais estabilização e devem ser feitos quando há mais energia.` })
      }

      // ── 3. EMPURRAR × PUXAR no dia (para dias de corpo inteiro) ─────────
      const empDia = exs.filter(e => chk(e.name, EMPURRAR)).length
      const puxDia = exs.filter(e => chk(e.name, PUXAR)).length
      if (empDia >= 2 && puxDia === 0) {
        issues.push({ type:'atencao', msg:`Desequilíbrio muscular: ${empDia} exercícios de empurrar e nenhum de puxar. Inclua uma remada ou puxada para equilibrar ombros e prevenir lesões posturais.` })
      }
      if (puxDia >= 2 && empDia === 0) {
        issues.push({ type:'atencao', msg:`Desequilíbrio muscular: ${puxDia} exercícios de puxar e nenhum de empurrar. Inclua um supino ou desenvolvimento para equilibrar.` })
      }

      // ── 4. JOELHO × QUADRIL (dias de lower) ─────────────────────────────
      const joelhoDia = exs.filter(e => chk(e.name, JOELHO)).length
      const quadrilDia = exs.filter(e => chk(e.name, QUADRIL)).length
      if (joelhoDia >= 2 && quadrilDia === 0) {
        issues.push({ type:'atencao', msg:`Muitos exercícios dominantes de joelho (agachamento, leg press) sem nenhum dominante de quadril (stiff, terra, flexora). Inclua 1–2 exercícios para posterior de coxa e glúteo.` })
      }

      // ── 5. OVERLAP MUSCULAR com dia anterior ────────────────────────────
      if (overlapMap[d.id]) {
        const g = overlapMap[d.id].join(', ')
        issues.push({ type:'atencao', msg:`Recuperação insuficiente: ${g} também foi treinado ontem. Músculo precisa de 48h para se recuperar — considere reorganizar os dias.` })
      }

      // ── 6. ADEQUAÇÃO AO NÍVEL ────────────────────────────────────────────
      const livresNoDia = exs.filter(e => chk(e.name, LIVRE))
      if ((nivel === 'Iniciante') && livresNoDia.length >= 3) {
        issues.push({ type:'atencao', msg:`Iniciante com ${livresNoDia.length} exercícios com pesos livres num mesmo dia. Para iniciantes, priorize máquinas e movimentos guiados nos primeiros meses — reduz risco de lesão por técnica incorreta.` })
      }
      if (age && age < 16 && exs.some(e => chk(e.name,['terra','agachamento livre','barra']))) {
        issues.push({ type:'atencao', msg:`Adolescente em desenvolvimento: exercícios com carga axial pesada (terra, agachamento com barra) devem ser supervisionados com atenção. Priorize técnica e cargas submáximas.` })
      }

      // ── Por exercício ────────────────────────────────────────────────────
      exs.forEach((ex, i) => {
        const s       = +(ex.sets||0)
        const restSec = parseRest(ex.rest)
        const repsR   = parseRepsRange(ex.reps)
        const grp     = group(ex.name)
        const fields  = {}

        // Sets
        if (!ex.sets || s===0) {
          fields.sets = { status:'atencao', msg:`Defina o número de séries. Para ${goal||'este objetivo'}: ${refSets[0]}–${refSets[1]} séries.` }
          issues.push({ type:'atencao', msg:`${ex.name||'Exercício'}: séries não definidas.` })
        } else if (s < refSets[0]) {
          fields.sets = { status:'atencao', msg:`${s} série${s>1?'s':''} — abaixo do ideal. Para ${goal||'este objetivo'}, use ${refSets[0]}–${refSets[1]} séries.` }
          issues.push({ type:'atencao', msg:`${ex.name}: ${s} séries — abaixo do ideal para ${goal||'o objetivo'}.` })
        } else if (s > refSets[1]) {
          fields.sets = { status:'atencao', msg:`${s} séries — acima do ideal. Reduza para ${refSets[1]} séries e prefira aumentar a intensidade (carga).` }
        } else {
          fields.sets = { status:'ok', msg:`${s} séries — correto para ${goal||'o objetivo'}.` }
        }

        // Reps × objetivo
        if (!ex.reps) {
          fields.reps = { status:'atencao', msg:`Reps não definidas. Recomendado: ${refReps.label}.` }
          issues.push({ type:'atencao', msg:`${ex.name||'Exercício'}: repetições não definidas.` })
        } else if (repsR) {
          const repMid = (repsR.min + repsR.max) / 2
          if (repMid < refReps.min - 2) {
            fields.reps = { status:'atencao', msg:`${ex.reps} reps — baixo para ${goal}. Carga muito pesada pode ser força pura, não ${goal}. Ideal: ${refReps.label}.` }
            issues.push({ type:'atencao', msg:`${ex.name}: ${ex.reps} reps — fora da faixa ideal para ${goal} (${refReps.label}).` })
          } else if (repMid > refReps.max + 2) {
            fields.reps = { status:'atencao', msg:`${ex.reps} reps — alto para ${goal}. Carga muito leve gera pouca tensão mecânica. Ideal: ${refReps.label}.` }
            issues.push({ type:'atencao', msg:`${ex.name}: ${ex.reps} reps — acima da faixa ideal para ${goal} (${refReps.label}).` })
          } else {
            fields.reps = { status:'ok', msg:`${ex.reps} reps — dentro da faixa para ${goal}.` }
          }
        } else {
          fields.reps = { status:'ok', msg:'Preenchido.' }
        }

        // Descanso
        if (!restSec) {
          fields.rest = { status:'atencao', msg:`Descanso não definido. Para ${goal||'este objetivo'}: ${refRest.label}.` }
          issues.push({ type:'atencao', msg:`${ex.name||'Exercício'}: descanso não definido.` })
        } else if (restSec < refRest.min) {
          fields.rest = { status:'atencao', msg:`${fmtSec(restSec)} de descanso — curto demais para ${goal}. Aumente para ${refRest.label} para garantir recuperação entre séries.` }
          issues.push({ type:'atencao', msg:`${ex.name}: descanso de ${fmtSec(restSec)} — curto para ${goal} (ideal: ${refRest.label}).` })
        } else if (restSec > refRest.max) {
          fields.rest = { status:'atencao', msg:`${fmtSec(restSec)} — descanso longo. Para ${goal}, o ideal é ${refRest.label}. Descanso longo demais reduz o estímulo metabólico.` }
          issues.push({ type:'atencao', msg:`${ex.name}: descanso de ${fmtSec(restSec)} — longo para ${goal} (ideal: ${refRest.label}).` })
        } else {
          fields.rest = { status:'ok', msg:`${fmtSec(restSec)} — adequado para ${goal}.` }
        }

        // Ordem
        if (ordemErrada && chk(ex.name, ISOL_EX) && (firstMulti===-1 || i<firstMulti)) {
          fields.order = { status:'critico', msg:`Este exercício isolado está antes dos multiarticulares. Mova-o para depois de agachamento, supino ou terra.` }
        }

        // Volume do grupo muscular (semanal)
        if (grp && setsByGroup[grp]) {
          const vs = setsByGroup[grp]
          if (vs < refVol.min) {
            if (!fields.volume) fields.volume = { status:'atencao', msg:`${grp} com ${vs} sets/semana — abaixo do mínimo (${refVol.min}–${refVol.max} sets). Adicione mais volume para este grupo.` }
          } else if (vs > refVol.max) {
            if (!fields.volume) fields.volume = { status:'atencao', msg:`${grp} com ${vs} sets/semana — alto (máx recomendado: ${refVol.max} sets). Risco de overreaching — redistribua em mais dias ou reduza séries.` }
          } else {
            if (!fields.volume) fields.volume = { status:'ok', msg:`${grp}: ${vs} sets/semana — volume adequado.` }
          }
        }

        const hasC = Object.values(fields).some(f=>f.status==='critico')
        const hasA = Object.values(fields).some(f=>f.status==='atencao')
        fields.overall = hasC ? 'critico' : hasA ? 'atencao' : 'ok'
        exFields[ex.id] = fields
      })

      // ── 7. COERÊNCIA COM OBJETIVO (nível de plano) ───────────────────────
      if (goal === 'Emagrecimento') {
        const avgSets = exs.reduce((a,e)=>a+(+(e.sets)||0),0) / exs.length
        if (avgSets > 5) issues.push({ type:'atencao', msg:`Para Emagrecimento, muitas séries por exercício reduzem a densidade do treino. Prefira mais exercícios com menos séries (circuito ou supersets).` })
      }
      if (goal === 'Força e Performance') {
        const temIsol = exs.some(e => chk(e.name, ISOL_EX))
        const temMulti = exs.some(e => chk(e.name, MULTI_EX))
        if (temIsol && !temMulti) issues.push({ type:'atencao', msg:`Dia com apenas exercícios isolados — para Força e Performance, multiarticulares são essenciais (agachamento, terra, supino, remada).` })
      }

      // ── 8. BALANÇO EMPURRAR/PUXAR semanal ───────────────────────────────
      if (d.id === days[0].id && razaoPP !== null) {
        if (razaoPP < 0.7) {
          issues.push({ type:'atencao', msg:`No plano inteiro: muito mais volume de empurrar (${totalEmpurrar} sets) do que puxar (${totalPuxar} sets). Desequilíbrio crônico causa postura cifótica e lesão de ombro. Adicione mais remadas e puxadas.` })
        } else if (razaoPP > 1.5) {
          issues.push({ type:'atencao', msg:`No plano inteiro: muito mais volume de puxar (${totalPuxar} sets) do que empurrar (${totalEmpurrar} sets). Adicione supino, desenvolvimento ou flexões para equilibrar.` })
        }
      }

      const hasC = issues.some(i=>i.type==='critico')
      const hasA = issues.some(i=>i.type==='atencao')
      dayResults[d.id] = {
        status: hasC ? 'critico' : hasA ? 'atencao' : 'ok',
        issues,
        exFields,
      }
    })

    return dayResults
  })()

    const salvarSetup = async ({ dias_semana, grupos_foco, intensidade }) => {
    await supabase.from('workout_plans').update({ dias_semana, grupos_foco, intensidade }).eq('id', planId)
    setPlan(p => ({ ...p, dias_semana, grupos_foco, intensidade }))
  }

    const deletePlan = async () => {
    if (!window.confirm('Excluir este plano de treino? Todos os dias e exercícios serão removidos permanentemente.')) return
    setSaving(true)
    // Delete exercises first, then days, then plan
    const dayIds = days.map(d => d.id)
    if (dayIds.length > 0) {
      await supabase.from('exercises').delete().in('workout_day_id', dayIds)
      await supabase.from('workout_days').delete().in('id', dayIds)
    }
    await supabase.from('workout_plans').delete().eq('id', planId)
    navigate('student-detail', { id: studentId })
  }

  const addDay = async () => {
    const name = 'Treino ' + String.fromCharCode(65 + days.length)
    const { data } = await supabase.from('workout_days').insert([{ plan_id:planId, name, focus:'', day_of_week:'', order_index:days.length }]).select().single()
    if (data) setDays(d => [...d, { ...data, exercises:[] }])
  }

  const updateDay = async (dayId, field, val) => {
    setDays(d => d.map(day => day.id === dayId ? { ...day, [field]:val } : day))
    await supabase.from('workout_days').update({ [field]:val }).eq('id', dayId)
  }

  const deleteDay = async (dayId) => {
    if (!confirm('Excluir este dia de treino e todos os exercícios?')) return
    await supabase.from('workout_days').delete().eq('id', dayId)
    setDays(d => d.filter(day => day.id !== dayId))
  }

  const addExercise = async (dayId, exData) => {
    const form = exData || (newExForms[dayId] || { ...emptyEx })
    if (!form.name?.trim()) return
    const { data } = await supabase.from('exercises').insert([{
      day_id:dayId, name:form.name, sets:form.sets, reps:form.reps,
      rest:form.rest, rir:form.rir||'2', tip:form.tip||'', type:form.type,
      order_index:(days.find(d => d.id === dayId)?.exercises?.length || 0),
    }]).select().single()
    if (data) {
      setDays(d => d.map(day => day.id === dayId ? { ...day, exercises:[...day.exercises, data] } : day))
      if (!exData) setNewExForms(f => ({ ...f, [dayId]:{ ...emptyEx } }))
    }
  }

  const updateExercise = async (dayId, exId, field, val) => {
    setDays(d => d.map(day => day.id === dayId
      ? { ...day, exercises:day.exercises.map(ex => ex.id === exId ? { ...ex, [field]:val } : ex) }
      : day))
    await supabase.from('exercises').update({ [field]:val }).eq('id', exId)
  }

  const deleteExercise = async (dayId, exId) => {
    await supabase.from('exercises').delete().eq('id', exId)
    setDays(d => d.map(day => day.id === dayId ? { ...day, exercises:day.exercises.filter(ex => ex.id !== exId) } : day))
  }

  const getNewExForm  = (dayId) => newExForms[dayId] || { ...emptyEx }
  const setNewExField = (dayId, field, val) => setNewExForms(f => ({ ...f, [dayId]:{ ...getNewExForm(dayId), [field]:val } }))

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:14, color:'#3B82F6', fontWeight:700, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        Carregando treino...
      </div>
    </div>
  )
  if (!plan) return null

  const ageRestr = AGE_RESTRICTIONS[ageGroup]
  const setupPendente = !plan.dias_semana

  return (
    <div style={{ minHeight:'100vh', background:'#000', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ padding:'24px 20px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          {/* Voltar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <button
              style={{ background:'none', border:'none', color:V.accentDim, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', fontWeight:600 }}
              onClick={() => navigate('student-detail', { id:studentId })}>
              ← Voltar ao Aluno
            </button>
            <button onClick={deletePlan} disabled={saving}
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'6px 14px', color:'#F87171', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Excluir Plano
            </button>
          </div>

          {/* ── Header do plano ── */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:10 }}>
              <input
                style={{ background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:24, fontWeight:800, fontFamily:'inherit', flex:1, minWidth:200 }}
                value={plan.title}
                onChange={e => setPlan(p => ({ ...p, title:e.target.value }))}
                onBlur={savePlanTitle}
                placeholder="Nome do plano..."
              />
              <select style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#E2E8F0', fontSize:13, fontFamily:'inherit', outline:'none' }} value={plan.status} onChange={e => { const v=e.target.value; setPlan(p => ({ ...p, status:v })); saveStatus(v) }}>
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <button onClick={() => setShowAval(v => !v)}
                style={{ background:'none', border:'none', padding:0, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color: showAval ? '#34D399' : '#64748B', textDecoration:'underline' }}>
                {showAval ? 'Avaliando plano' : 'Avaliar Plano'}
              </button>
              <span style={{ fontSize:11, color:'#475569' }}>{saving ? 'Salvando...' : 'Salvo automaticamente'}</span>
            </div>
          </div>

          {/* Warning de faixa etária */}
          {ageRestr?.warning && (
            <div style={{ background:'rgba(217,119,6,0.07)', border:`1px solid rgba(217,119,6,0.2)`, borderRadius:12, padding:'10px 16px', fontSize:13, color:V.accentBr, marginBottom:16 }}>
              ⚠️ {ageRestr.warning}
            </div>
          )}

          {/* ── Dias de treino ── */}
          {days.map((day, idx) => {
            const color  = DAY_COLORS[idx % DAY_COLORS.length]
            const newEx  = getNewExForm(day.id)
            return (
              <div style={{ background:V.bgCard, borderRadius:16, border:`1px solid ${color}30`, overflow:'hidden', marginBottom:14 }}>

                {/* Header do dia */}
                <div style={{ background:`${color}10`, padding:'16px 20px', borderBottom:`1px solid ${color}22`, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <input
                      style={{ background:'transparent', border:'none', outline:'none', color, fontWeight:800, fontSize:19, fontFamily:'inherit', width:'100%', marginBottom:8, padding:0 }}
                      value={day.focus||''}
                      onChange={e => updateDay(day.id, 'focus', e.target.value)}
                      placeholder="Foco do treino (ex: Inferior + Core)"
                    />
                    <select style={{ background:'transparent', border:`1px solid ${color}30`, borderRadius:6, padding:'4px 8px', color:V.textSub, fontSize:12, fontFamily:'inherit', outline:'none' }} value={day.day_of_week||''} onChange={e => updateDay(day.id, 'day_of_week', e.target.value)}>
                      <option value="">Dia...</option>
                      {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {showAval && avalAnalysis[day.id] && (
                      <>
                        {avalAnalysis[day.id].status === 'ok' && (
                          <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:20, background:'rgba(52,211,153,0.15)', color:'#34D399', border:'1px solid rgba(52,211,153,0.3)' }}>✓ OK</span>
                        )}
                        {avalAnalysis[day.id].status === 'atencao' && (
                          <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:20, background:'rgba(251,191,36,0.15)', color:'#FBBF24', border:'1px solid rgba(251,191,36,0.3)' }}>⚠ Atenção</span>
                        )}
                        {avalAnalysis[day.id].status === 'critico' && (
                          <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:20, background:'rgba(248,113,113,0.15)', color:'#F87171', border:'1px solid rgba(248,113,113,0.3)' }}>✕ Crítico</span>
                        )}
                      </>
                    )}
                    <button style={ss.delBtn} onClick={() => deleteDay(day.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity:0.35 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </div>

                {/* Lista de exercícios */}
                {day.exercises.length > 0 && (
                  <div style={{ padding:'4px 0' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:8, padding:'6px 16px 2px', borderBottom:`1px solid rgba(255,255,255,0.03)` }}>
                      {['Exercício','Tipo','Séries','Reps','Desc.'].map(h => (
                        <div key={h} style={{ fontSize:9, color:V.textDim, textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
                      ))}
                    </div>
                    {day.exercises.map(ex => {
                      const tc = getTypeColor(ex.type)
                      const exFields  = showAval ? (avalAnalysis[day.id]?.exFields?.[ex.id]) : null
                      const exOverall = exFields?.overall
                      const SEM = {
                        ok:      { bg:'rgba(52,211,153,0.13)',  color:'#34D399', border:'1px solid rgba(52,211,153,0.35)',  dot:'#34D399' },
                        atencao: { bg:'rgba(251,191,36,0.13)',  color:'#FBBF24', border:'1px solid rgba(251,191,36,0.35)',  dot:'#FBBF24' },
                        critico: { bg:'rgba(248,113,113,0.13)', color:'#F87171', border:'1px solid rgba(248,113,113,0.35)', dot:'#F87171' },
                      }
                      const fieldTag = (field) => {
                        if (!exFields || !exFields[field]) return null
                        const f = exFields[field]
                        const st = SEM[f.status]
                        return (
                          <span title={f.msg} style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:8, background:st.bg, color:st.color, border:st.border, cursor:'help', flexShrink:0, whiteSpace:'nowrap' }}>
                            {f.status==='ok' ? '✓' : f.status==='atencao' ? '⚠' : '✕'}
                          </span>
                        )
                      }
                      // Collect active warnings for this exercise
                      const exAlerts = !showAval || !exFields ? [] : [
                        exFields.order && exFields.order.status !== 'ok' ? { field:'Ordem', ...exFields.order } : null,
                        exFields.sets  && exFields.sets.status  !== 'ok' ? { field:'Séries', ...exFields.sets   } : null,
                        exFields.rest  && exFields.rest.status  !== 'ok' ? { field:'Descanso', ...exFields.rest } : null,
                        exFields.reps  && exFields.reps.status  !== 'ok' ? { field:'Reps', ...exFields.reps     } : null,
                      ].filter(Boolean)

                      return (
                        <div key={ex.id} style={{ borderLeft: exOverall && exOverall!=='ok' ? `3px solid ${SEM[exOverall]?.dot}` : '3px solid transparent' }}>
                          <div style={{ padding:'10px 16px', borderBottom:`1px solid rgba(255,255,255,0.03)`, display:'flex', gap:8, alignItems:'flex-start' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:4 }}>
                                <span style={{ fontSize:9, background:`${tc}18`, color:tc, border:`1px solid ${tc}35`, borderRadius:10, padding:'1px 6px', fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>{ex.type}</span>
                                <input style={{ ...ss.smallInput, fontWeight:600, flex:1 }} value={ex.name} onChange={e => updateExercise(day.id, ex.id, 'name', e.target.value)} placeholder="Nome" />
                                <button
                                  onClick={() => setOpenCalc(openCalc === ex.id ? null : ex.id)}
                                  style={{ background: openCalc===ex.id ? 'rgba(217,119,6,0.2)' : V.accentFaint, border:`1px solid ${openCalc===ex.id ? V.borderStrong : V.borderLight}`, borderRadius:6, padding:'4px 8px', color:V.accent, fontSize:10, cursor:'pointer', fontWeight:700, flexShrink:0, fontFamily:'inherit' }}>
                                  1RM
                                </button>
                                <button style={ss.delBtn} onClick={() => deleteExercise(day.id, ex.id)}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity:0.35 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                </button>
                              </div>
                              <input style={{ ...ss.smallInput, fontSize:11, color:V.textSub }} value={ex.tip||''} onChange={e => updateExercise(day.id, ex.id, 'tip', e.target.value)} placeholder="Dica de execução (opcional)" />
                              {/* ── Alert tags inline, below the name ── */}
                              {exAlerts.length > 0 && (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
                                  {exAlerts.map((al, ai) => {
                                    const col = al.status==='critico' ? '#F87171' : '#FBBF24'
                                    const bg  = al.status==='critico' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)'
                                    const brd = al.status==='critico' ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'
                                    return (
                                      <span key={ai} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:8, background:bg, color:col, border:`1px solid ${brd}`, whiteSpace:'nowrap' }}>
                                        <span>{al.status==='critico' ? '✕' : '⚠'}</span>
                                        <span>{al.field}: {al.msg}</span>
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <select style={{ ...ss.smallInput, width:110, flexShrink:0 }} value={ex.type||''} onChange={e => updateExercise(day.id, ex.id, 'type', e.target.value)}>
                              {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                            {[['sets','3'],['reps','10-12'],['rest','60s'],['rir','2']].map(([field, ph]) => {
                              const fData = exFields?.[field]
                              const fcol = fData?.status==='critico' ? '#F87171' : fData?.status==='atencao' ? '#FBBF24' : 'transparent'
                              return (
                                <div key={field} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
                                  {field==='rir' && <span style={{ fontSize:8, color:V.textMuted, textTransform:'uppercase', fontWeight:700 }}>RIR</span>}
                                  <input style={{ ...ss.smallInput, width:field==='rir'?40:58, outline: fData && fData.status!=='ok' ? `1.5px solid ${fcol}` : 'none' }} value={ex[field]||''} onChange={e => updateExercise(day.id, ex.id, field, e.target.value)} placeholder={ph} />
                                </div>
                              )
                            })}
                          </div>
                          {/* Histórico + sugestão de progressão (4.1) */}
                          {historico[ex.name?.trim().toLowerCase()] && (
                            <div style={{ padding:'4px 16px 8px', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ fontSize:10, color:V.textMuted }}>
                                Último: <strong style={{ color:V.text }}>{historico[ex.name.trim().toLowerCase()].last.peso}kg</strong>
                                {historico[ex.name.trim().toLowerCase()].last.reps ? ` × ${historico[ex.name.trim().toLowerCase()].last.reps}` : ''}
                              </span>
                              <span style={{ fontSize:10, color:'#60A5FA', fontWeight:700 }}>💡 {historico[ex.name.trim().toLowerCase()].sugestao}</span>
                            </div>
                          )}
                          {openCalc === ex.id && (
                            <div style={{ padding:'0 16px 4px' }}>
                              <OneRMCalc
                                ageGroup={ageGroup}
                                onApply={({ reps, rest }) => { updateExercise(day.id, ex.id, 'reps', reps); updateExercise(day.id, ex.id, 'rest', rest); setOpenCalc(null) }}
                                onClose={() => setOpenCalc(null)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              {showAval && avalAnalysis[day.id]?.issues?.length > 0 && (
                <div style={{ padding:'10px 16px', background:'rgba(0,0,0,0.2)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  {avalAnalysis[day.id].issues.map((issue, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', fontSize:11, color: issue.type==='critico' ? '#F87171' : '#FBBF24' }}>
                      <span>{issue.type==='critico' ? '✕' : '⚠'}</span>
                      <span>{issue.msg}</span>
                    </div>
                  ))}
                </div>
              )}

                {/* Adicionar exercício — simples: nome, execução, grupo, séries, reps, descanso */}
                <div style={{ padding:'16px 20px', background:'rgba(255,255,255,0.015)' }}>
                  <input style={{ ...ss.smallInput, marginBottom:8, fontWeight:600 }} value={newEx.name} onChange={e => setNewExField(day.id, 'name', e.target.value)} placeholder="Nome do exercício" />
                  <input style={{ ...ss.smallInput, marginBottom:10, fontSize:12, color:V.textSub }} value={newEx.tip} onChange={e => setNewExField(day.id, 'tip', e.target.value)} placeholder="Como se realiza (opcional)" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 58px 58px 58px 40px', gap:6, marginBottom:10 }}>
                    <select style={ss.smallInput} value={newEx.type} onChange={e => setNewExField(day.id, 'type', e.target.value)}>
                      {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input style={ss.smallInput} value={newEx.sets} onChange={e => setNewExField(day.id, 'sets', e.target.value)} placeholder="Séries" />
                    <input style={ss.smallInput} value={newEx.reps} onChange={e => setNewExField(day.id, 'reps', e.target.value)} placeholder="Reps" />
                    <input style={ss.smallInput} value={newEx.rest} onChange={e => setNewExField(day.id, 'rest', e.target.value)} placeholder="Desc." />
                    <input style={ss.smallInput} value={newEx.rir} onChange={e => setNewExField(day.id, 'rir', e.target.value)} placeholder="RIR" title="Repetições em reserva" />
                  </div>
                  <button style={{ ...ss.btn(color), fontFamily:'inherit' }} onClick={() => addExercise(day.id)}>+ Adicionar ao Treino</button>
                </div>

              </div>
            )
          })}

          {days.length < (plan.dias_semana || 99) ? (
            <button
              style={{ ...ss.outlineBtn, width:'100%', padding:'16px', fontSize:14, borderStyle:'dashed', borderRadius:12, fontFamily:'inherit' }}
              onClick={addDay}>
              + Adicionar Dia de Treino
            </button>
          ) : (
            <div style={{ textAlign:'center', padding:'14px', fontSize:12, color:V.textMuted }}>
              Limite de {plan.dias_semana} dias/semana atingido (definido na configuração do plano).
            </div>
          )}

          <div style={{ marginTop:12, textAlign:'center', fontSize:11, color:V.textDim }}>
            Alterações salvas automaticamente
          </div>

        </div>
      </div>

      {setupPendente && (
        <SetupPlanoModal
          plan={plan}
          student={student}
          anamData={anamData}
          mesoAtual={mesoAtual}
          onSave={salvarSetup}
          onVoltar={() => navigate('student-detail', { id: studentId })}
        />
      )}

    </div>
  )
}
