import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}

const STARS = [1,2,3,4,5]

const card = { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 }
const input = { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }
const btn = (color = '#34D399') => ({ background: `linear-gradient(135deg,${color},${color}99)`, border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' })
const tabStyle = (active) => ({ flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none', background: active ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)', color: active ? '#fff' : '#64748B', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' })

export default function StudentView({ studentId }) {
  const [student, setStudent]       = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [days, setDays]             = useState([])
  const [activeDay, setActiveDay]   = useState(0)
  const [progress, setProgress]     = useState([])
  const [goals, setGoals]           = useState([])
  const [attendance, setAttendance] = useState([])
  const [feedbacks, setFeedbacks]   = useState([])
  const [tab, setTab]               = useState('treino')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')

  // Forms
  const [newMeasure, setNewMeasure]   = useState({ date: new Date().toISOString().slice(0,10), weight:'', arm_cm:'', bust_cm:'', waist_cm:'', hip_cm:'', thigh_cm:'', notes:'' })
  const [showMeasure, setShowMeasure] = useState(false)
  const [newFeedback, setNewFeedback] = useState({ date: new Date().toISOString().slice(0,10), content:'', rating: 5 })
  const [showFeedback, setShowFeedback] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

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

      const [{ data: pr }, { data: go }, { data: at }, { data: fb }] = await Promise.all([
        supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(20),
        supabase.from('student_goals').select('*').eq('student_id', studentId).order('target_date', { ascending: true }),
        supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30),
        supabase.from('student_feedbacks').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      ])
      if (pr) setProgress(pr)
      if (go) setGoals(go)
      if (at) setAttendance(at)
      if (fb) setFeedbacks(fb)
      setLoading(false)
    }
    load()
  }, [studentId])

  const refetch = async () => {
    const [{ data: pr }, { data: go }, { data: at }, { data: fb }] = await Promise.all([
      supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(20),
      supabase.from('student_goals').select('*').eq('student_id', studentId).order('target_date', { ascending: true }),
      supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30),
      supabase.from('student_feedbacks').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    ])
    if (pr) setProgress(pr)
    if (go) setGoals(go)
    if (at) setAttendance(at)
    if (fb) setFeedbacks(fb)
  }

  const markAttendance = async (present) => {
    setSaving(true)
    const today = new Date().toISOString().slice(0,10)
    const already = attendance.find(a => a.date === today)
    if (already) { showToast('Presença já registrada hoje!'); setSaving(false); return }
    await supabase.from('attendance').insert([{ student_id: studentId, date: today, present }])
    await refetch()
    showToast(present ? '✅ Presença registrada!' : '❌ Falta registrada.')
    setSaving(false)
  }

  const toggleGoal = async (id, achieved) => {
    await supabase.from('student_goals').update({ achieved: !achieved }).eq('id', id)
    await refetch()
    showToast(!achieved ? '🏆 Meta concluída!' : 'Meta reaberta.')
  }

  const saveMeasure = async () => {
    setSaving(true)
    await supabase.from('progress_entries').insert([{
      student_id: studentId,
      date: newMeasure.date,
      weight: +newMeasure.weight || null,
      arm_cm: +newMeasure.arm_cm || null,
      bust_cm: +newMeasure.bust_cm || null,
      waist_cm: +newMeasure.waist_cm || null,
      hip_cm: +newMeasure.hip_cm || null,
      thigh_cm: +newMeasure.thigh_cm || null,
      notes: newMeasure.notes,
    }])
    await refetch()
    setShowMeasure(false)
    setNewMeasure({ date: new Date().toISOString().slice(0,10), weight:'', arm_cm:'', bust_cm:'', waist_cm:'', hip_cm:'', thigh_cm:'', notes:'' })
    showToast('📏 Medidas registradas!')
    setSaving(false)
  }

  const saveFeedback = async () => {
    if (!newFeedback.content.trim()) return
    setSaving(true)
    await supabase.from('student_feedbacks').insert([{
      student_id: studentId,
      date: newFeedback.date,
      content: newFeedback.content,
      rating: newFeedback.rating,
    }])
    await refetch()
    setShowFeedback(false)
    setNewFeedback({ date: new Date().toISOString().slice(0,10), content:'', rating: 5 })
    showToast('💬 Feedback enviado!')
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080B12', display:'flex', alignItems:'center', justifyContent:'center', color:'#34D399', fontSize:18 }}>
      Carregando...
    </div>
  )
  if (!student) return (
    <div style={{ minHeight:'100vh', background:'#080B12', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B' }}>
      Aluno não encontrado.
    </div>
  )

  const day = days[activeDay]
  const color = DAY_COLORS[activeDay % DAY_COLORS.length]
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100) : null
  const todayAtt = attendance.find(a => a.date === new Date().toISOString().slice(0,10))

  return (
    <div style={{ minHeight:'100vh', background:'#080B12', padding:'24px 16px', fontFamily:"'Segoe UI', system-ui, sans-serif", color:'#E2E8F0' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:'#0F2557', border:'1px solid #34D399', borderRadius:12, padding:'12px 24px', color:'#34D399', fontWeight:700, fontSize:14, zIndex:999, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0f2027,#203a43)', borderRadius:20, padding:24, marginBottom:20, border:'1px solid rgba(52,211,153,0.15)' }}>
          <div style={{ fontSize:10, color:'#34D399', letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>Seu Plano de Treino</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:2 }}>Olá, {student.name.split(' ')[0]}! 💪</div>
          <div style={{ fontSize:13, color:'#475569', marginBottom:12 }}>{student.goal} · {student.level}</div>

          {/* Stats rápidos */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {attendanceRate !== null && (
              <div style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
                <div style={{ fontSize:9, color:'#34D399', textTransform:'uppercase', letterSpacing:1 }}>Frequência</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#34D399' }}>{attendanceRate}%</div>
              </div>
            )}
            <div style={{ background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#A78BFA', textTransform:'uppercase', letterSpacing:1 }}>Metas</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#A78BFA' }}>{goals.filter(g=>g.achieved).length}/{goals.length}</div>
            </div>
            {progress.length > 0 && progress[0].weight && (
              <div style={{ background:'rgba(0,201,255,0.08)', border:'1px solid rgba(0,201,255,0.2)', borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
                <div style={{ fontSize:9, color:'#00C9FF', textTransform:'uppercase', letterSpacing:1 }}>Peso atual</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#00C9FF' }}>{progress[0].weight}kg</div>
              </div>
            )}
          </div>

          {/* Marcar presença hoje */}
          {!todayAtt ? (
            <div style={{ marginTop:16, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#475569' }}>Marcar hoje:</span>
              <button onClick={() => markAttendance(true)} disabled={saving} style={btn('#34D399')}>✅ Presente</button>
              <button onClick={() => markAttendance(false)} disabled={saving} style={btn('#F87171')}>❌ Faltei</button>
            </div>
          ) : (
            <div style={{ marginTop:16, background: todayAtt.present?'rgba(52,211,153,0.08)':'rgba(248,113,113,0.08)', border:`1px solid ${todayAtt.present?'rgba(52,211,153,0.2)':'rgba(248,113,113,0.2)'}`, borderRadius:10, padding:'8px 14px', display:'inline-block' }}>
              <span style={{ fontSize:12, color: todayAtt.present?'#34D399':'#F87171', fontWeight:600 }}>
                {todayAtt.present ? '✅ Presença registrada hoje' : '❌ Falta registrada hoje'}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
          {[['treino','🏋️ Treino'],['medidas','📏 Medidas'],['metas','🏆 Metas'],['frequencia','📅 Frequência'],['feedback','💬 Feedback']].map(([id,label]) => (
            <button key={id} style={tabStyle(tab===id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── ABA TREINO ── */}
        {tab === 'treino' && (
          <>
            {!activePlan || days.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, color:'#334155' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🏋️</div>
                <div>Nenhum treino ativo. Aguarde seu professor configurar seu plano.</div>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                  {days.map((d,i) => {
                    const c = DAY_COLORS[i % DAY_COLORS.length]
                    return (
                      <button key={d.id} onClick={() => setActiveDay(i)} style={{ flex:1, minWidth:70, padding:'12px 8px', borderRadius:12, border: activeDay===i?`2px solid ${c}`:'1px solid rgba(255,255,255,0.08)', background: activeDay===i?`${c}18`:'rgba(255,255,255,0.03)', color: activeDay===i?c:'#475569', fontWeight:800, fontSize:13, cursor:'pointer' }}>
                        {d.name}
                        {d.day_of_week && <div style={{ fontSize:9, marginTop:2, fontWeight:500 }}>{d.day_of_week}</div>}
                      </button>
                    )
                  })}
                </div>
                {day && (
                  <div style={{ background:'#0D1117', borderRadius:16, overflow:'hidden', border:`1px solid ${color}30` }}>
                    <div style={{ background:`${color}12`, padding:'16px 20px', borderBottom:`1px solid ${color}25` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }} />
                        <span style={{ fontWeight:700, color, fontSize:16 }}>{day.name}</span>
                        {day.focus && <span style={{ fontSize:13, color:'#475569' }}>— {day.focus}</span>}
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 0.5fr 0.7fr 0.6fr', gap:8, padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      {['Exercício','Séries','Reps','Descanso'].map(h => <div key={h} style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1 }}>{h}</div>)}
                    </div>
                    {day.exercises.map((ex,i) => (
                      <div key={ex.id} style={{ display:'grid', gridTemplateColumns:'2fr 0.5fr 0.7fr 0.6fr', gap:8, padding:'14px 20px', alignItems:'start', borderBottom: i<day.exercises.length-1?'1px solid rgba(255,255,255,0.04)':'none', background: i%2===0?'transparent':'rgba(255,255,255,0.015)' }}>
                        <div>
                          {ex.type && <div style={{ marginBottom:4 }}><span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:700, background:`${TYPE_COLORS[ex.type]||'#64748B'}20`, color:TYPE_COLORS[ex.type]||'#64748B', border:`1px solid ${TYPE_COLORS[ex.type]||'#64748B'}40` }}>{ex.type}</span></div>}
                          <div style={{ fontWeight:600, fontSize:14, color:'#E2E8F0', marginBottom:4 }}>{ex.name}</div>
                          {ex.tip && <div style={{ fontSize:11, color:'#475569' }}>💡 {ex.tip}</div>}
                        </div>
                        <div style={{ fontWeight:700, color, fontSize:15 }}>{ex.sets}x</div>
                        <div style={{ fontWeight:600, fontSize:13, color:'#CBD5E1' }}>{ex.reps}</div>
                        <div style={{ fontSize:12, color:'#64748B' }}>{ex.rest}</div>
                      </div>
                    ))}
                    {day.exercises.length === 0 && <div style={{ padding:30, textAlign:'center', color:'#334155', fontSize:13 }}>Nenhum exercício neste dia ainda.</div>}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ABA MEDIDAS ── */}
        {tab === 'medidas' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button style={btn()} onClick={() => setShowMeasure(!showMeasure)}>+ Registrar Medidas</button>
            </div>
            {showMeasure && (
              <div style={{ ...card, marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:14, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Novo Registro</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[['Data','date','date'],['Peso (kg)','weight','number']].map(([l,f,t]) => (
                    <div key={f}>
                      <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                      <input style={input} type={t} value={newMeasure[f]} onChange={e => setNewMeasure(x => ({...x,[f]:e.target.value}))} />
                    </div>
                  ))}
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:11, color:'#34D399', fontWeight:700, margin:'4px 0 10px' }}>📏 Medidas Corporais (cm)</div>
                  </div>
                  {[['Braço','arm_cm'],['Busto','bust_cm'],['Cintura','waist_cm'],['Quadril','hip_cm'],['Coxa','thigh_cm']].map(([l,f]) => (
                    <div key={f}>
                      <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                      <input style={input} type="number" placeholder="cm" value={newMeasure[f]} onChange={e => setNewMeasure(x => ({...x,[f]:e.target.value}))} />
                    </div>
                  ))}
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observações</div>
                    <textarea style={{ ...input, minHeight:50, resize:'vertical' }} value={newMeasure.notes} onChange={e => setNewMeasure(x => ({...x,notes:e.target.value}))} placeholder="Ex: treino em jejum, pós-refeição..." />
                  </div>
                </div>
                <button style={btn()} onClick={saveMeasure} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Medidas'}</button>
              </div>
            )}
            {progress.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}><div style={{ fontSize:36, marginBottom:10 }}>📏</div>Nenhuma medida registrada ainda.</div>}
            {progress.map((p,i) => (
              <div key={p.id} style={{ ...card }}>
                <div style={{ fontSize:13, color:'#34D399', fontWeight:700, marginBottom:10 }}>
                  {new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR',{ day:'2-digit', month:'long', year:'numeric' })}
                  {i===0 && <span style={{ marginLeft:8, fontSize:10, background:'#34D39920', color:'#34D399', padding:'2px 8px', borderRadius:20 }}>Mais recente</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
                  {[['⚖️ Peso',p.weight,'kg'],['💪 Braço',p.arm_cm,'cm'],['👙 Busto',p.bust_cm,'cm'],['🎀 Cintura',p.waist_cm,'cm'],['🍑 Quadril',p.hip_cm,'cm'],['🦵 Coxa',p.thigh_cm,'cm']].map(([l,v,u]) => v ? (
                    <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:9, color:'#475569', marginBottom:2 }}>{l}</div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{v} {u}</div>
                    </div>
                  ) : null)}
                </div>
                {p.notes && <div style={{ fontSize:12, color:'#64748B', marginTop:8 }}>📝 {p.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── ABA METAS ── */}
        {tab === 'metas' && (
          <div>
            {goals.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}><div style={{ fontSize:36, marginBottom:10 }}>🏆</div>Nenhuma meta cadastrada pelo professor ainda.</div>}
            {goals.map(g => (
              <div key={g.id} style={{ ...card, display:'flex', alignItems:'center', gap:14 }}>
                <div onClick={() => toggleGoal(g.id, g.achieved)} style={{ width:24, height:24, borderRadius:6, border:`2px solid ${g.achieved?'#34D399':'#334155'}`, background:g.achieved?'#34D399':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:14, color:'#fff' }}>
                  {g.achieved && '✓'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:g.achieved?'#475569':'#E2E8F0', textDecoration:g.achieved?'line-through':'none' }}>{g.description}</div>
                  {g.target_date && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>🗓 Prazo: {new Date(g.target_date+'T12:00:00').toLocaleDateString('pt-BR')}</div>}
                </div>
                <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:700, background:g.achieved?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)', color:g.achieved?'#34D399':'#FBBF24' }}>
                  {g.achieved ? '✅ Concluída' : '⏳ Em andamento'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA FREQUÊNCIA ── */}
        {tab === 'frequencia' && (
          <div>
            {attendanceRate !== null && (
              <div style={{ ...card, display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 }}>
                {[['Total',attendance.length,'#E2E8F0'],['Presenças',attendance.filter(a=>a.present).length,'#34D399'],['Faltas',attendance.filter(a=>!a.present).length,'#F87171'],['Taxa',`${attendanceRate}%`,'#00C9FF']].map(([l,v,c]) => (
                  <div key={l} style={{ flex:1, minWidth:70, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {attendance.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}><div style={{ fontSize:36, marginBottom:10 }}>📅</div>Nenhum registro de frequência ainda.</div>}
            {attendance.map(a => (
              <div key={a.id} style={{ ...card, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{a.present ? '✅' : '❌'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#E2E8F0' }}>{new Date(a.date+'T12:00:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'2-digit', month:'long' })}</div>
                  {a.notes && <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>📝 {a.notes}</div>}
                </div>
                <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:700, background:a.present?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)', color:a.present?'#34D399':'#F87171' }}>
                  {a.present ? 'Presente' : 'Faltou'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA FEEDBACK ── */}
        {tab === 'feedback' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button style={btn()} onClick={() => setShowFeedback(!showFeedback)}>+ Enviar Feedback</button>
            </div>
            {showFeedback && (
              <div style={{ ...card, marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:14, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Novo Feedback para o Professor</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Data</div>
                    <input style={input} type="date" value={newFeedback.date} onChange={e => setNewFeedback(x => ({...x,date:e.target.value}))} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:8, textTransform:'uppercase' }}>Como foi o treino?</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {STARS.map(n => (
                        <span key={n} onClick={() => setNewFeedback(x => ({...x,rating:n}))} style={{ fontSize:24, cursor:'pointer', opacity: n<=newFeedback.rating?1:0.25 }}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Mensagem</div>
                    <textarea style={{ ...input, minHeight:80, resize:'vertical' }} placeholder="Ex: Senti melhora no condicionamento, mas a carga do supino ainda está pesada..." value={newFeedback.content} onChange={e => setNewFeedback(x => ({...x,content:e.target.value}))} />
                  </div>
                </div>
                <button style={btn()} onClick={saveFeedback} disabled={saving}>{saving ? 'Enviando...' : '💬 Enviar Feedback'}</button>
              </div>
            )}
            {feedbacks.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}><div style={{ fontSize:36, marginBottom:10 }}>💬</div>Nenhum feedback enviado ainda.</div>}
            {feedbacks.map(f => (
              <div key={f.id} style={{ ...card }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ fontSize:13, color:'#34D399', fontWeight:700 }}>{new Date(f.date+'T12:00:00').toLocaleDateString('pt-BR',{ day:'2-digit', month:'long', year:'numeric' })}</div>
                  <div>{STARS.map(n => <span key={n} style={{ opacity: n<=f.rating?1:0.2, fontSize:14 }}>⭐</span>)}</div>
                </div>
                <div style={{ fontSize:14, color:'#CBD5E1', lineHeight:1.6 }}>{f.content}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:30, textAlign:'center', fontSize:11, color:'#1E293B' }}>Trainer App · Plano gerenciado pelo seu professor</div>
      </div>
    </div>
  )
}
