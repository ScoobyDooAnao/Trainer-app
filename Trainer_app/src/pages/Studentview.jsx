import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}

export default function StudentView({ studentId }) {
  const [student, setStudent] = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [days, setDays] = useState([])
  const [activeDay, setActiveDay] = useState(0)
  const [progress, setProgress] = useState([])
  const [tab, setTab] = useState('treino')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single()
      if (st) setStudent(st)

      const { data: plans } = await supabase.from('workout_plans').select('*').eq('student_id', studentId).eq('status', 'active').order('updated_at', { ascending: false }).limit(1)
      if (plans && plans[0]) {
        setActivePlan(plans[0])
        const { data: daysData } = await supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', plans[0].id).order('order_index')
        if (daysData) setDays(daysData.map(d => ({ ...d, exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
      }

      const { data: pr } = await supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(10)
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
                        flex: 1, minWidth: 70, padding: '12px 8px', borderRadius: 12, border: activeDay === i ? `2px solid ${c}` : '1px solid rgba(255,255,255,0.08)',
                        background: activeDay === i ? `${c}18` : 'rgba(255,255,255,0.03)', color: activeDay === i ? c : '#475569',
                        fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      }}>
                        {d.name}
                        {d.day_of_week && <div style={{ fontSize: 9, marginTop: 2, fontWeight: 500 }}>{d.day_of_week}</div>}
                      </button>
                    )
                  })}
                </div>

                {day && (
                  <div style={{ background: '#0D1117', borderRadius: 16, overflow: 'hidden', border: `1px solid ${color}30` }}>
                    <div style={{ background: `${color}12`, padding: '16px 20px', borderBottom: `1px solid ${color}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                        <span style={{ fontWeight: 700, color, fontSize: 16 }}>{day.name}</span>
                        {day.focus && <span style={{ fontSize: 13, color: '#475569' }}>— {day.focus}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {['Exercício', 'Séries', 'Reps', 'Descanso'].map(h => (
                        <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                      ))}
                    </div>

                    {day.exercises.map((ex, i) => (
                      <div key={ex.id} style={{
                        display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr',
                        gap: 8, padding: '14px 20px', alignItems: 'start',
                        borderBottom: i < day.exercises.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      }}>
                        <div>
                          {ex.type && (
                            <div style={{ marginBottom: 4 }}>
                              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: `${TYPE_COLORS[ex.type] || '#64748B'}20`, color: TYPE_COLORS[ex.type] || '#64748B', border: `1px solid ${TYPE_COLORS[ex.type] || '#64748B'}40` }}>
                                {ex.type}
                              </span>
                            </div>
                          )}
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0', marginBottom: 4 }}>{ex.name}</div>
                          {ex.tip && <div style={{ fontSize: 11, color: '#475569' }}>💡 {ex.tip}</div>}
                        </div>
                        <div style={{ fontWeight: 700, color, fontSize: 15 }}>{ex.sets}x</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#CBD5E1' }}>{ex.reps}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{ex.rest}</div>
                      </div>
                    ))}

                    {day.exercises.length === 0 && (
                      <div style={{ padding: 30, textAlign: 'center', color: '#334155', fontSize: 13 }}>Nenhum exercício neste dia ainda.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

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