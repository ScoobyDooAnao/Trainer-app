import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EXERCISE_TYPES = ['Peito', 'Costas', 'Bíceps', 'Tríceps', 'Ombro', 'Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha', 'Core', 'Cardio', 'Full Body']
const STATUS_OPTIONS = ['draft', 'active', 'archived']
const STATUS_LABEL = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' }
const STATUS_COLOR = { active: '#34D399', draft: '#FBBF24', archived: '#64748B' }
const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']

const s = {
  wrap: { minHeight: '100vh', background: '#080B12', padding: '24px 20px' },
  inner: { maxWidth: 860, margin: '0 auto' },
  back: { background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 },
  header: { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  input: { background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none' },
  select: { background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none' },
  btn: (color = '#34D399') => ({ background: `linear-gradient(135deg,${color},${color}bb)`, border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  outlineBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  dayCard: (color) => ({ background: '#0D1117', borderRadius: 16, border: `1px solid ${color}35`, overflow: 'hidden', marginBottom: 14 }),
  dayHeader: (color) => ({ background: `${color}12`, padding: '14px 20px', borderBottom: `1px solid ${color}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }),
  exRow: { display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  addRow: { padding: '16px 20px', background: 'rgba(255,255,255,0.02)' },
  badge: (color) => ({ fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }),
  delBtn: { background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 15, padding: '2px 6px' },
  smallInput: { background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none', width: '100%' },
  smallSelect: { background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none', width: '100%' },
}

const emptyEx = { name: '', sets: '3', reps: '10–12', rest: '60s', tip: '', type: 'Peito' }

export default function WorkoutEditor({ navigate, studentId, planId }) {
  const [plan, setPlan] = useState(null)
  const [days, setDays] = useState([]) // each day has .exercises[]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newExForms, setNewExForms] = useState({}) // dayId -> exercise form

  useEffect(() => { fetchPlan() }, [planId])

  const fetchPlan = async () => {
    setLoading(true)
    const { data: planData } = await supabase.from('workout_plans').select('*').eq('id', planId).single()
    const { data: daysData } = await supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', planId).order('order_index')
    if (planData) setPlan(planData)
    if (daysData) {
      setDays(daysData.map(d => ({ ...d, exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
    }
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
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <div style={{ fontSize: 11, color: '#334155' }}>Salvo automaticamente</div>
          {saving && <div style={{ fontSize: 11, color: '#FBBF24' }}>Salvando...</div>}
        </div>

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
                <div key={ex.id} style={s.exRow}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <select
                        style={{ ...s.smallSelect, maxWidth: 110, fontSize: 9, padding: '2px 6px' }}
                        value={ex.type || ''}
                        onChange={e => updateExercise(day.id, ex.id, 'type', e.target.value)}>
                        {EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
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
