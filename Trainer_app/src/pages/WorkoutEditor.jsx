import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EXERCISE_TYPES = ['Peito', 'Costas', 'Bíceps', 'Tríceps', 'Ombro', 'Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha', 'Core', 'Cardio', 'Full Body']
const STATUS_OPTIONS = ['draft', 'active', 'archived']
const STATUS_LABEL = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' }
const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']

// ─── 1RM FORMULAS (Epley 1985, Brzycki 1993, Lombardi 1989) ────────────────
const calc1RM = (carga, reps) => {
  if (!carga || !reps || reps < 1 || carga <= 0) return null
  const r = Number(reps), c = Number(carga)
  if (r === 1) return c
  if (r > 15) return null // acima de 15 reps a estimativa perde precisão
  const epley    = c * (1 + r / 30)
  const brzycki  = r > 10 ? null : c / (1.0278 - 0.0278 * r)
  const lombardi = c * Math.pow(r, 0.10)
  const valid    = [epley, brzycki, lombardi].filter(v => v !== null && v > 0)
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

// ─── SUGESTÕES POR OBJETIVO E FAIXA ETÁRIA ─────────────────────────────────
const getAgeGroup = (birthDate) => {
  if (!birthDate) return 'adulto_jovem'
  const age = Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000))
  if (age < 13) return 'crianca'
  if (age < 18) return 'adolescente'
  if (age < 40) return 'adulto_jovem'
  if (age < 60) return 'adulto_maduro'
  return 'idoso'
}

const AGE_GROUP_LABEL = {
  crianca: 'Criança',
  adolescente: 'Adolescente',
  adulto_jovem: 'Adulto',
  adulto_maduro: 'Adulto Maduro',
  idoso: 'Idoso 60+',
}

const AGE_GROUP_COLOR = {
  crianca: '#34D399',
  adolescente: '#60A5FA',
  adulto_jovem: '#A78BFA',
  adulto_maduro: '#FBBF24',
  idoso: '#F97316',
}

// Tabela de zonas — % 1RM, faixa de reps, descanso (REF: NSCA 2016, Schoenfeld 2017)
const ZONES = [
  { label: 'Força Máxima',     pct: [85, 100], reps: '1–5',   rest: '3–5min', color: '#EF4444' },
  { label: 'Hipertrofia',      pct: [65,  85], reps: '6–12',  rest: '60–120s', color: '#A78BFA' },
  { label: 'Resistência Musc.',pct: [40,  65], reps: '15–30', rest: '30–60s', color: '#34D399' },
]

// Restrições por faixa etária
const AGE_RESTRICTIONS = {
  crianca:      { maxPct: 60,  warning: '⚠️ Criança: sem carga máxima. Prescrever por PSE e peso corporal.', blockedZones: ['Força Máxima', 'Hipertrofia'] },
  adolescente:  { maxPct: 70,  warning: '⚠️ Adolescente: limitar a 70% 1RM durante fase de crescimento ósseo.', blockedZones: ['Força Máxima'] },
  adulto_jovem: { maxPct: 100, warning: null, blockedZones: [] },
  adulto_maduro:{ maxPct: 100, warning: '💡 Adulto maduro: aumentar descanso entre séries (48–72h por grupo).', blockedZones: [] },
  idoso:        { maxPct: 75,  warning: '🚨 Idoso 60+: iniciar com 40–50% 1RM. Avaliação médica recomendada.', blockedZones: ['Força Máxima'] },
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const s = {
  wrap:       { minHeight: '100vh', background: '#080B12', padding: '24px 20px' },
  inner:      { maxWidth: 860, margin: '0 auto' },
  back:       { background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 },
  header:     { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  input:      { background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none' },
  select:     { background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none' },
  btn:        (c = '#34D399') => ({ background: `linear-gradient(135deg,${c},${c}bb)`, border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  outlineBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  dayCard:    (c) => ({ background: '#0D1117', borderRadius: 16, border: `1px solid ${c}35`, overflow: 'hidden', marginBottom: 14 }),
  dayHeader:  (c) => ({ background: `${c}12`, padding: '14px 20px', borderBottom: `1px solid ${c}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }),
  exRow:      { display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '12px 20px', alignItems: 'start', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  addRow:     { padding: '16px 20px', background: 'rgba(255,255,255,0.02)' },
  delBtn:     { background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 15, padding: '2px 6px' },
  smallInput: { background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none', width: '100%' },
  smallSelect:{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none', width: '100%' },
}

const emptyEx = { name: '', sets: '3', reps: '10–12', rest: '60s', tip: '', type: 'Peito' }

// ─── COMPONENTE 1RM CALCULATOR ─────────────────────────────────────────────
function OneRMCalc({ exId, ageGroup, onApply, onClose }) {
  const [carga, setCarga]   = useState('')
  const [reps, setReps]     = useState('')
  const oneRM  = calc1RM(carga, reps)
  const rest   = AGE_RESTRICTIONS[ageGroup] || AGE_RESTRICTIONS.adulto_jovem
  const ageLbl = AGE_GROUP_LABEL[ageGroup]
  const ageClr = AGE_GROUP_COLOR[ageGroup]

  const suggestLoad = (zone) => {
    if (!oneRM) return null
    const maxAllowed = Math.round(oneRM * rest.maxPct / 100)
    const lo = Math.round(oneRM * zone.pct[0] / 100)
    const hi = Math.round(Math.min(oneRM * zone.pct[1] / 100, maxAllowed))
    if (lo > maxAllowed) return null
    return { lo, hi }
  }

  return (
    <div style={{ background: '#0A0F1E', border: '1px solid #1E293B', borderRadius: 12, padding: 16, margin: '8px 0', gridColumn: '1 / -1' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>📊 Calculadora de 1RM</span>
          <span style={{ fontSize: 11, background: `${ageClr}20`, color: ageClr, border: `1px solid ${ageClr}40`, borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>
            {ageLbl}
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>

      {/* Alerta por faixa etária */}
      {rest.warning && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#FBBF24', marginBottom: 12 }}>
          {rest.warning}
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Carga usada (kg)</div>
          <input
            type="number"
            style={{ ...s.smallInput, fontSize: 15, fontWeight: 700, textAlign: 'center' }}
            value={carga}
            onChange={e => setCarga(e.target.value)}
            placeholder="ex: 80"
          />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Reps realizadas (1–15)</div>
          <input
            type="number"
            style={{ ...s.smallInput, fontSize: 15, fontWeight: 700, textAlign: 'center' }}
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="ex: 8"
          />
        </div>
        <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>1RM Estimado</div>
          <div style={{
            background: oneRM ? 'rgba(167,139,250,0.12)' : '#161B27',
            border: `1px solid ${oneRM ? '#A78BFA40' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 6, padding: '7px 10px', textAlign: 'center',
            fontSize: 18, fontWeight: 900, color: oneRM ? '#A78BFA' : '#334155',
          }}>
            {oneRM ? `${oneRM} kg` : '—'}
          </div>
          {oneRM && <div style={{ fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 3 }}>média Epley · Brzycki · Lombardi</div>}
          {reps > 15 && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 3 }}>⚠️ Acima de 15 reps perde precisão</div>}
        </div>
      </div>

      {/* Sugestões de carga por zona */}
      {oneRM && (
        <div>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Sugestão de carga por objetivo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ZONES.map(zone => {
              const load = suggestLoad(zone)
              const blocked = rest.blockedZones.includes(zone.label)
              return (
                <div key={zone.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: blocked ? 'rgba(255,255,255,0.02)' : `${zone.color}10`,
                  border: `1px solid ${blocked ? 'rgba(255,255,255,0.05)' : zone.color + '30'}`,
                  borderRadius: 8, padding: '8px 12px',
                  opacity: blocked ? 0.45 : 1,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: blocked ? '#334155' : zone.color }}>
                      {blocked ? '🚫 ' : ''}{zone.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {zone.pct[0]}–{zone.pct[1]}% 1RM · {zone.reps} reps · {zone.rest} descanso
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {load && !blocked ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 900, color: zone.color }}>{load.lo}–{load.hi} kg</div>
                        <button
                          onClick={() => onApply({ reps: zone.reps, rest: zone.rest })}
                          style={{ fontSize: 10, background: `${zone.color}20`, border: `1px solid ${zone.color}40`, borderRadius: 6, padding: '3px 8px', color: zone.color, cursor: 'pointer', marginTop: 3, fontWeight: 700 }}>
                          Usar
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: '#1E293B' }}>{blocked ? 'Restrito' : 'Informe os dados'}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 10, color: '#1E293B', marginTop: 8 }}>
            REF: NSCA (2016) · Schoenfeld (2017) · Epley (1985) · Brzycki (1993)
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WORKOUT EDITOR PRINCIPAL ───────────────────────────────────────────────
export default function WorkoutEditor({ navigate, studentId, planId }) {
  const [plan, setPlan]           = useState(null)
  const [days, setDays]           = useState([])
  const [student, setStudent]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [newExForms, setNewExForms] = useState({})
  const [openCalc, setOpenCalc]   = useState(null) // exId or null

  const ageGroup = getAgeGroup(student?.birth_date)

  useEffect(() => { fetchAll() }, [planId])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: planData }, { data: daysData }, { data: studentData }] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('id', planId).single(),
      supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', planId).order('order_index'),
      supabase.from('students').select('id, name, birth_date, goal').eq('id', studentId).single(),
    ])
    if (planData) setPlan(planData)
    if (daysData) setDays(daysData.map(d => ({ ...d, exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
    if (studentData) setStudent(studentData)
    setLoading(false)
  }

  const savePlanTitle = async () => {
    setSaving(true)
    await supabase.from('workout_plans').update({ title: plan.title, status: plan.status, updated_at: new Date().toISOString() }).eq('id', planId)
    setSaving(false)
  }

  const addDay = async () => {
    const name = `Treino ${String.fromCharCode(65 + days.length)}`
    const { data } = await supabase.from('workout_days').insert([{ plan_id: planId, name, focus: '', day_of_week: '', order_index: days.length }]).select().single()
    if (data) setDays(d => [...d, { ...data, exercises: [] }])
  }

  const updateDay = async (dayId, field, val) => {
    setDays(d => d.map(day => day.id === dayId ? { ...day, [field]: val } : day))
    await supabase.from('workout_days').update({ [field]: val }).eq('id', dayId)
  }

  const deleteDay = async (dayId) => {
    if (!confirm('Excluir este dia de treino e todos os exercícios?')) return
    await supabase.from('workout_days').delete().eq('id', dayId)
    setDays(d => d.filter(day => day.id !== dayId))
  }

  const addExercise = async (dayId) => {
    const form = newExForms[dayId] || { ...emptyEx }
    if (!form.name.trim()) return
    const { data } = await supabase.from('exercises').insert([{
      day_id: dayId, name: form.name, sets: form.sets, reps: form.reps,
      rest: form.rest, tip: form.tip, type: form.type,
      order_index: (days.find(d => d.id === dayId)?.exercises?.length || 0)
    }]).select().single()
    if (data) {
      setDays(d => d.map(day => day.id === dayId ? { ...day, exercises: [...day.exercises, data] } : day))
      setNewExForms(f => ({ ...f, [dayId]: { ...emptyEx } }))
    }
  }

  const updateExercise = async (dayId, exId, field, val) => {
    setDays(d => d.map(day => day.id === dayId
      ? { ...day, exercises: day.exercises.map(ex => ex.id === exId ? { ...ex, [field]: val } : ex) }
      : day))
    await supabase.from('exercises').update({ [field]: val }).eq('id', exId)
  }

  const deleteExercise = async (dayId, exId) => {
    await supabase.from('exercises').delete().eq('id', exId)
    setDays(d => d.map(day => day.id === dayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exId) } : day))
  }

  const applyCalcSuggestion = (dayId, exId, { reps, rest }) => {
    updateExercise(dayId, exId, 'reps', reps)
    updateExercise(dayId, exId, 'rest', rest)
    setOpenCalc(null)
  }

  const getNewExForm = (dayId) => newExForms[dayId] || { ...emptyEx }
  const setNewExField = (dayId, field, val) => setNewExForms(f => ({ ...f, [dayId]: { ...getNewExForm(dayId), [field]: val } }))

  if (loading) return <div style={{ padding: 40, color: '#475569' }}>Carregando treino...</div>
  if (!plan) return null

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <button style={s.back} onClick={() => navigate('student-detail', { id: studentId })}>← Voltar ao Aluno</button>

        {/* Plan header */}
        <div style={s.header}>
          <input
            style={{ ...s.input, flex: 2, fontSize: 18, fontWeight: 700 }}
            value={plan.title}
            onChange={e => setPlan(p => ({ ...p, title: e.target.value }))}
            onBlur={savePlanTitle}
            placeholder="Nome do plano..."
          />
          <select style={s.select} value={plan.status} onChange={e => { setPlan(p => ({ ...p, status: e.target.value })); setTimeout(savePlanTitle, 100) }}>
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
          </select>

          {/* Badge faixa etária */}
          {student && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${AGE_GROUP_COLOR[ageGroup]}15`, border: `1px solid ${AGE_GROUP_COLOR[ageGroup]}30`, borderRadius: 8, padding: '6px 12px' }}>
              <span style={{ fontSize: 11, color: AGE_GROUP_COLOR[ageGroup], fontWeight: 700 }}>
                👤 {student.name} · {AGE_GROUP_LABEL[ageGroup]}
              </span>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#334155' }}>
            {saving ? <span style={{ color: '#FBBF24' }}>Salvando...</span> : 'Salvo automaticamente'}
          </div>
        </div>

        {/* Aviso faixa etária restritiva */}
        {student && AGE_RESTRICTIONS[ageGroup]?.warning && (
          <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#FBBF24', marginBottom: 16 }}>
            {AGE_RESTRICTIONS[ageGroup].warning}
          </div>
        )}

        {/* Days */}
        {days.map((day, idx) => {
          const color = DAY_COLORS[idx % DAY_COLORS.length]
          const newEx = getNewExForm(day.id)
          return (
            <div key={day.id} style={s.dayCard(color)}>
              {/* Day header */}
              <div style={s.dayHeader(color)}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                  <input
                    style={{ ...s.input, fontWeight: 700, color, background: 'transparent', border: 'none', fontSize: 15, minWidth: 80 }}
                    value={day.name}
                    onChange={e => updateDay(day.id, 'name', e.target.value)}
                    placeholder="Nome do treino"
                  />
                  <span style={{ color: '#334155' }}>—</span>
                  <input
                    style={{ ...s.input, fontSize: 13, flex: 1, minWidth: 120 }}
                    value={day.focus || ''}
                    onChange={e => updateDay(day.id, 'focus', e.target.value)}
                    placeholder="Foco (ex: Peito + Tríceps)"
                  />
                  <input
                    style={{ ...s.input, fontSize: 13, maxWidth: 120 }}
                    value={day.day_of_week || ''}
                    onChange={e => updateDay(day.id, 'day_of_week', e.target.value)}
                    placeholder="Dia (ex: Seg)"
                  />
                </div>
                <button style={s.delBtn} onClick={() => deleteDay(day.id)} title="Excluir dia">🗑</button>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '8px 20px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Exercício / Dica', 'Séries', 'Reps', 'Descanso'].map(h => (
                  <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                ))}
              </div>

              {/* Exercises */}
              {day.exercises.map(ex => (
                <div key={ex.id}>
                  <div style={s.exRow}>
                    <div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                        <select
                          style={{ ...s.smallSelect, maxWidth: 110, fontSize: 9, padding: '2px 6px' }}
                          value={ex.type || ''}
                          onChange={e => updateExercise(day.id, ex.id, 'type', e.target.value)}>
                          {EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        {/* Botão calculadora 1RM */}
                        <button
                          title="Calcular 1RM e sugerir carga"
                          onClick={() => setOpenCalc(openCalc === ex.id ? null : ex.id)}
                          style={{
                            background: openCalc === ex.id ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.07)',
                            border: `1px solid ${openCalc === ex.id ? '#A78BFA60' : 'rgba(167,139,250,0.2)'}`,
                            borderRadius: 6, padding: '2px 7px', color: '#A78BFA',
                            fontSize: 11, cursor: 'pointer', fontWeight: 700,
                          }}>
                          📊 1RM
                        </button>
                        <button style={s.delBtn} onClick={() => deleteExercise(day.id, ex.id)}>✕</button>
                      </div>
                      <input
                        style={{ ...s.smallInput, marginBottom: 4, fontWeight: 600 }}
                        value={ex.name}
                        onChange={e => updateExercise(day.id, ex.id, 'name', e.target.value)}
                        placeholder="Nome do exercício"
                      />
                      <input
                        style={{ ...s.smallInput, fontSize: 11, color: '#475569' }}
                        value={ex.tip || ''}
                        onChange={e => updateExercise(day.id, ex.id, 'tip', e.target.value)}
                        placeholder="💡 Dica de execução"
                      />
                    </div>
                    <input style={s.smallInput} value={ex.sets || ''} onChange={e => updateExercise(day.id, ex.id, 'sets', e.target.value)} placeholder="3" />
                    <input style={s.smallInput} value={ex.reps || ''} onChange={e => updateExercise(day.id, ex.id, 'reps', e.target.value)} placeholder="10–12" />
                    <input style={s.smallInput} value={ex.rest || ''} onChange={e => updateExercise(day.id, ex.id, 'rest', e.target.value)} placeholder="60s" />
                  </div>

                  {/* 1RM Calculator panel (inline) */}
                  {openCalc === ex.id && (
                    <div style={{ padding: '0 20px 4px' }}>
                      <OneRMCalc
                        exId={ex.id}
                        ageGroup={ageGroup}
                        onApply={(vals) => applyCalcSuggestion(day.id, ex.id, vals)}
                        onClose={() => setOpenCalc(null)}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Add exercise row */}
              <div style={s.addRow}>
                <div style={{ fontSize: 11, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>+ Adicionar Exercício</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <select style={{ ...s.smallSelect, marginBottom: 4 }} value={newEx.type} onChange={e => setNewExField(day.id, 'type', e.target.value)}>
                      {EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input style={{ ...s.smallInput, marginBottom: 4 }} value={newEx.name} onChange={e => setNewExField(day.id, 'name', e.target.value)} placeholder="Nome do exercício *" />
                    <input style={{ ...s.smallInput, fontSize: 11 }} value={newEx.tip} onChange={e => setNewExField(day.id, 'tip', e.target.value)} placeholder="💡 Dica (opcional)" />
                  </div>
                  <input style={s.smallInput} value={newEx.sets} onChange={e => setNewExField(day.id, 'sets', e.target.value)} placeholder="3" />
                  <input style={s.smallInput} value={newEx.reps} onChange={e => setNewExField(day.id, 'reps', e.target.value)} placeholder="10–12" />
                  <input style={s.smallInput} value={newEx.rest} onChange={e => setNewExField(day.id, 'rest', e.target.value)} placeholder="60s" />
                </div>
                <button style={s.btn(color)} onClick={() => addExercise(day.id)}>Adicionar Exercício</button>
              </div>
            </div>
          )
        })}

        {/* Add day button */}
        <button style={{ ...s.outlineBtn, width: '100%', padding: '16px', fontSize: 14, borderStyle: 'dashed' }} onClick={addDay}>
          + Adicionar Dia de Treino (Treino {String.fromCharCode(65 + days.length)})
        </button>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#1E293B' }}>
          Todas as alterações são salvas automaticamente
        </div>
      </div>
    </div>
  )
}
