import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}

const today = () => new Date().toISOString().split('T')[0]

// Gera array de sets baseado no campo sets do exercício (ex: "3" → [{set:1},{set:2},{set:3}])
const parseSets = (setsField) => {
  const n = parseInt(setsField) || 3
  return Array.from({ length: n }, (_, i) => ({ set: i + 1, weight: '', reps: '' }))
}

// Toast simples
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#34D399', color: '#052e16', borderRadius: 50, padding: '10px 22px',
      fontWeight: 800, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(52,211,153,0.4)',
    }}>{msg}</div>
  )
}

// ── Componente de log de carga por exercício ─────────────────────────────────
function ExerciseLogRow({ ex, studentId, dayColor }) {
  const [open, setOpen]         = useState(false)
  const [sets, setSets]         = useState(parseSets(ex.sets))
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [lastLog, setLastLog]   = useState(null)
  const [toast, setToast]       = useState(null)
  const typeColor = TYPE_COLORS[ex.type] || '#64748B'

  // Carrega último log ao abrir
  useEffect(() => {
    if (!open || lastLog !== null) return
    const load = async () => {
      const { data } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('student_id', studentId)
        .eq('exercise_id', ex.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()
      if (data) setLastLog(data)
      else setLastLog(false)
    }
    load()
  }, [open])

  const updateSet = (idx, field, val) => {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const handleSave = async () => {
    const filled = sets.filter(s => s.weight !== '' || s.reps !== '')
    if (filled.length === 0) return
    setSaving(true)
    const { error } = await supabase.from('exercise_logs').insert({
      student_id: studentId,
      exercise_id: ex.id,
      date: today(),
      sets: sets.map(s => ({ set: s.set, weight: s.weight || null, reps: s.reps || null })),
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setToast('✅ Carga salva!')
      setOpen(false)
      // Reseta last log para recarregar na próxima abertura
      setLastLog(null)
    }
  }

  return (
    <>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* Linha principal do exercício */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: open ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, alignItems: 'start' }}>

          {/* Coluna exercício */}
          <div>
            {ex.type && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                  {ex.type}
                </span>
              </div>
            )}
            <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0', marginBottom: 3 }}>{ex.name}</div>
            {ex.tip && <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>💡 {ex.tip}</div>}

            {/* Botão registrar carga */}
            <button
              onClick={() => { setOpen(o => !o); setSaved(false) }}
              style={{
                marginTop: 4,
                background: saved ? 'rgba(52,211,153,0.15)' : open ? `${dayColor}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${saved ? '#34D39940' : open ? `${dayColor}40` : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, padding: '5px 12px',
                color: saved ? '#34D399' : open ? dayColor : '#64748B',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
              {saved ? '✅ Salvo hoje' : open ? '▲ Fechar' : '⚖️ Registrar carga'}
            </button>
          </div>

          <div style={{ fontWeight: 700, color: dayColor, fontSize: 15, paddingTop: 20 }}>{ex.sets}x</div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#CBD5E1', paddingTop: 20 }}>{ex.reps}</div>
          <div style={{ fontSize: 12, color: '#64748B', paddingTop: 20 }}>{ex.rest}</div>
        </div>

        {/* Painel de log inline */}
        {open && (
          <div style={{ marginTop: 14, background: '#080B12', borderRadius: 12, border: `1px solid ${dayColor}25`, padding: 16 }}>

            {/* Último registro */}
            {lastLog && (
              <div style={{ marginBottom: 12, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: '#34D399', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  📅 Último registro — {new Date(lastLog.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lastLog.sets.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, background: 'rgba(52,211,153,0.1)', borderRadius: 6, padding: '3px 8px', color: '#6EE7B7' }}>
                      S{s.set}: {s.weight ? `${s.weight}kg` : '—'} × {s.reps || '—'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lastLog === false && (
              <div style={{ fontSize: 11, color: '#334155', marginBottom: 10 }}>Nenhum registro anterior para este exercício.</div>
            )}

            {/* Header colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>Série</div>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>Carga (kg)</div>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>Reps feitas</div>
            </div>

            {/* Inputs por série */}
            {sets.map((s, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: dayColor, fontWeight: 800, textAlign: 'center' }}>S{s.set}</div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={lastLog && lastLog.sets[idx]?.weight ? `Ant: ${lastLog.sets[idx].weight}` : 'kg'}
                  value={s.weight}
                  onChange={e => updateSet(idx, 'weight', e.target.value)}
                  style={{
                    background: '#161B27', border: `1px solid ${s.weight ? dayColor + '60' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14,
                    outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700,
                  }}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={lastLog && lastLog.sets[idx]?.reps ? `Ant: ${lastLog.sets[idx].reps}` : 'reps'}
                  value={s.reps}
                  onChange={e => updateSet(idx, 'reps', e.target.value)}
                  style={{
                    background: '#161B27', border: `1px solid ${s.reps ? dayColor + '60' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14,
                    outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700,
                  }}
                />
              </div>
            ))}

            {/* Botão salvar */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', marginTop: 8,
                background: saving ? '#1E293B' : `linear-gradient(135deg, ${dayColor}, ${dayColor}aa)`,
                border: 'none', borderRadius: 10, padding: '12px',
                color: '#fff', fontWeight: 800, fontSize: 14, cursor: saving ? 'default' : 'pointer',
              }}>
              {saving ? 'Salvando...' : '💾 Salvar registro de hoje'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── STUDENT VIEW PRINCIPAL ───────────────────────────────────────────────────
export default function StudentView({ studentId }) {
  const [student, setStudent]     = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [days, setDays]           = useState([])
  const [activeDay, setActiveDay] = useState(0)
  const [progress, setProgress]   = useState([])
  const [tab, setTab]             = useState('treino')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single()
      if (st) setStudent(st)

      const { data: plans } = await supabase
        .from('workout_plans').select('*')
        .eq('student_id', studentId).eq('status', 'active')
        .order('updated_at', { ascending: false }).limit(1)

      if (plans && plans[0]) {
        setActivePlan(plans[0])
        const { data: daysData } = await supabase
          .from('workout_days').select('*, exercises(*)')
          .eq('plan_id', plans[0].id).order('order_index')
        if (daysData) setDays(daysData.map(d => ({ ...d, exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
      }

      const { data: pr } = await supabase
        .from('progress_entries').select('*')
        .eq('student_id', studentId).order('date', { ascending: false }).limit(10)
      if (pr) setProgress(pr)
      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: 18 }}>
      Carregando seu treino...
    </div>
  )

  if (!student) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
      Aluno não encontrado.
    </div>
  )

  const day = days[activeDay]
  const color = DAY_COLORS[activeDay % DAY_COLORS.length]

  return (
    <div style={{ minHeight: '100vh', background: '#080B12', padding: '24px 16px', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#E2E8F0' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(52,211,153,0.15)' }}>
          <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Seu Plano de Treino</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Olá, {student.name.split(' ')[0]}! 💪</div>
          <div style={{ fontSize: 13, color: '#475569' }}>{student.goal} · {student.level}</div>
          {activePlan && (
            <div style={{ marginTop: 12, background: 'rgba(52,211,153,0.08)', borderRadius: 8, padding: '8px 14px', display: 'inline-block' }}>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>📋 {activePlan.title}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['treino', '🏋️ Treino'], ['evolucao', '📈 Evolução']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: tab === id ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)',
              color: tab === id ? '#fff' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* ── ABA TREINO ── */}
        {tab === 'treino' && (
          <>
            {!activePlan || days.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
                <div>Nenhum treino ativo. Aguarde seu professor configurar seu plano.</div>
              </div>
            ) : (
              <>
                {/* Day selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {days.map((d, i) => {
                    const c = DAY_COLORS[i % DAY_COLORS.length]
                    return (
                      <button key={d.id} onClick={() => setActiveDay(i)} style={{
                        flex: 1, minWidth: 70, padding: '12px 8px', borderRadius: 12,
                        border: activeDay === i ? `2px solid ${c}` : '1px solid rgba(255,255,255,0.08)',
                        background: activeDay === i ? `${c}18` : 'rgba(255,255,255,0.03)',
                        color: activeDay === i ? c : '#475569', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      }}>
                        {d.name}
                        {d.day_of_week && <div style={{ fontSize: 9, marginTop: 2, fontWeight: 500 }}>{d.day_of_week}</div>}
                      </button>
                    )
                  })}
                </div>

                {day && (
                  <div style={{ background: '#0D1117', borderRadius: 16, overflow: 'hidden', border: `1px solid ${color}30` }}>
                    {/* Day header */}
                    <div style={{ background: `${color}12`, padding: '16px 20px', borderBottom: `1px solid ${color}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                        <span style={{ fontWeight: 700, color, fontSize: 16 }}>{day.name}</span>
                        {day.focus && <span style={{ fontSize: 13, color: '#475569' }}>— {day.focus}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>
                        ⚖️ Toque em <strong style={{ color: '#64748B' }}>Registrar carga</strong> em cada exercício para anotar o peso usado
                      </div>
                    </div>

                    {/* Coluna headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {['Exercício', 'Séries', 'Reps', 'Descanso'].map(h => (
                        <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                      ))}
                    </div>

                    {/* Exercícios com log de carga */}
                    {day.exercises.length === 0 ? (
                      <div style={{ padding: 30, textAlign: 'center', color: '#334155', fontSize: 13 }}>Nenhum exercício neste dia ainda.</div>
                    ) : (
                      day.exercises.map(ex => (
                        <ExerciseLogRow
                          key={ex.id}
                          ex={ex}
                          studentId={studentId}
                          dayColor={color}
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ABA EVOLUÇÃO ── */}
        {tab === 'evolucao' && (
          <div>
            {progress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div>Nenhum registro de evolução ainda.</div>
              </div>
            ) : (
              progress.map((p, i) => (
                <div key={p.id} style={{ background: '#0D1117', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
                    {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: '#34D39920', color: '#34D399', padding: '2px 8px', borderRadius: 20 }}>Mais recente</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {p.weight && <div><span style={{ fontSize: 11, color: '#475569' }}>Peso </span><span style={{ fontWeight: 700 }}>{p.weight} kg</span></div>}
                    {p.measurements?.waist && <div><span style={{ fontSize: 11, color: '#475569' }}>Cintura </span><span style={{ fontWeight: 700 }}>{p.measurements.waist} cm</span></div>}
                    {p.measurements?.chest && <div><span style={{ fontSize: 11, color: '#475569' }}>Peito </span><span style={{ fontWeight: 700 }}>{p.measurements.chest} cm</span></div>}
                    {p.measurements?.hip && <div><span style={{ fontSize: 11, color: '#475569' }}>Quadril </span><span style={{ fontWeight: 700 }}>{p.measurements.hip} cm</span></div>}
                    {p.measurements?.thigh && <div><span style={{ fontSize: 11, color: '#475569' }}>Coxa </span><span style={{ fontWeight: 700 }}>{p.measurements.thigh} cm</span></div>}
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>📝 {p.notes}</div>}
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ marginTop: 30, textAlign: 'center', fontSize: 11, color: '#1E293B' }}>Trainer App · Plano gerenciado pelo seu professor</div>
      </div>
    </div>
  )
}
