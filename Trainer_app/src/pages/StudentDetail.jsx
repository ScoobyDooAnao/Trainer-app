import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', background: '#080B12', padding: '24px 20px' },
  inner: { maxWidth: 860, margin: '0 auto' },
  back: { background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 },
  header: { background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(52,211,153,0.15)' },
  tabs: { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  tab: (active) => ({ padding: '10px 14px', borderRadius: 10, border: 'none', background: active ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)', color: active ? '#fff' : '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }),
  card: { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 },
  label: { fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  val: { fontSize: 15, fontWeight: 700, color: '#fff' },
  input: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  select: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  btn: (color = '#34D399') => ({ background: `linear-gradient(135deg,${color},${color}99)`, border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  outlineBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  shareBox: { background: 'rgba(0,201,255,0.08)', border: '1px solid rgba(0,201,255,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#7DD3FC', wordBreak: 'break-all', marginTop: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  badge: (color) => ({ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }),
}

const GOALS  = ['Ganho de Massa', 'Emagrecimento', 'Condicionamento', 'Força e Performance']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado']
const SLEEP  = ['Boa (7-9h)', 'Regular (5-7h)', 'Ruim (<5h)']
const STRESS = ['Baixo', 'Moderado', 'Alto']
const STATUS_COLOR = { active: '#34D399', Ativo: '#34D399', draft: '#FBBF24', Rascunho: '#FBBF24', archived: '#64748B', Arquivado: '#64748B' }
const STATUS_LABEL = { active: 'Ativo', draft: 'Rascunho', archived: 'Arquivado' }
const STARS = [1,2,3,4,5]

// ── NOVO ALUNO ────────────────────────────────────────────────────────────────
function NewStudentForm({ navigate }) {
  const [form, setForm]   = useState({ name:'', age:'', weight:'', height:'', goal:GOALS[0], level:LEVELS[0], notes:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const save = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase.from('students').insert([{
      name: form.name.trim(), age: form.age ? +form.age : null,
      weight: form.weight ? +form.weight : null, height: form.height ? +form.height : null,
      goal: form.goal, level: form.level, notes: form.notes, teacher_id: user.id,
    }]).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('student-detail', { id: data.id })
  }

  return (
    <div style={s.wrap}><div style={s.inner}>
      <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Painel</button>
      <div style={s.header}>
        <div style={{ fontSize:10, color:'#34D399', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Novo Aluno</div>
        <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Cadastrar Aluno</div>
        {error && <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'10px 14px', color:'#FCA5A5', fontSize:13, marginBottom:16 }}>{error}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['Nome completo','name','text'],['Idade','age','number'],['Peso (kg)','weight','number'],['Altura (cm)','height','number']].map(([l,f,t]) => (
            <div key={f}>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
              <input style={s.input} type={t} placeholder={l} value={form[f]} onChange={e => setForm(x => ({...x,[f]:e.target.value}))} />
            </div>
          ))}
          <div>
            <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Objetivo</div>
            <select style={s.select} value={form.goal} onChange={e => setForm(x => ({...x,goal:e.target.value}))}>
              {GOALS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Nível</div>
            <select style={s.select} value={form.level} onChange={e => setForm(x => ({...x,level:e.target.value}))}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observações</div>
            <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={form.notes} placeholder="Ex: aluno com problema no joelho..." onChange={e => setForm(x => ({...x,notes:e.target.value}))} />
          </div>
          <div style={{ gridColumn:'1/-1', display:'flex', gap:10 }}>
            <button style={s.btn()} onClick={save} disabled={saving}>{saving ? 'Salvando...' : '✅ Cadastrar Aluno'}</button>
            <button style={s.outlineBtn} onClick={() => navigate('dashboard')}>Cancelar</button>
          </div>
        </div>
      </div>
    </div></div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function StudentDetail({ navigate, studentId }) {
  const isNew = studentId === 'new'

  const [student, setStudent]               = useState(null)
  const [plans, setPlans]                   = useState([])
  const [progress, setProgress]             = useState([])
  const [goals, setGoals]                   = useState([])
  const [attendance, setAttendance]         = useState([])
  const [feedbacks, setFeedbacks]           = useState([])
  const [tab, setTab]                       = useState('plans')
  const [editing, setEditing]               = useState(false)
  const [form, setForm]                     = useState({})
  const [newProgress, setNewProgress]       = useState({ date: new Date().toISOString().slice(0,10), weight:'', notes:'', arm_cm:'', bust_cm:'', waist_cm:'', hip_cm:'', thigh_cm:'' })
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [newGoal, setNewGoal]               = useState({ description:'', target_date:'' })
  const [showGoalForm, setShowGoalForm]     = useState(false)
  const [newAttendance, setNewAttendance]   = useState({ date: new Date().toISOString().slice(0,10), present: true, notes:'' })
  const [showAttForm, setShowAttForm]       = useState(false)
  const [newFeedback, setNewFeedback]       = useState({ date: new Date().toISOString().slice(0,10), content:'', rating:5 })
  const [showFbForm, setShowFbForm]         = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [shareLink, setShareLink]           = useState('')

  useEffect(() => {
    if (!isNew) {
      fetchAll()
      setShareLink(`https://trainer-app-nu.vercel.app/view/${studentId}`)
    }
  }, [studentId])

  const fetchAll = async () => {
    const [{ data: st }, { data: pl }, { data: pr }, { data: go }, { data: at }, { data: fb }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('workout_plans').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      supabase.from('student_goals').select('*').eq('student_id', studentId).order('target_date', { ascending: true }),
      supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      supabase.from('student_feedbacks').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    ])
    if (st) { setStudent(st); setForm(st) }
    if (pl) setPlans(pl)
    if (pr) setProgress(pr)
    if (go) setGoals(go)
    if (at) setAttendance(at)
    if (fb) setFeedbacks(fb)
  }

  const saveStudent = async () => {
    setSaving(true)
    await supabase.from('students').update({
      ...form, age: +form.age, weight: +form.weight, height: +form.height,
    }).eq('id', studentId)
    await fetchAll(); setEditing(false); setSaving(false)
  }

  const createPlan = async () => {
    const { data } = await supabase.from('workout_plans').insert([{ student_id: studentId, teacher_id: student.teacher_id, title: 'Novo Plano de Treino', status: 'draft' }]).select().single()
    if (data) navigate('workout-editor', { studentId, planId: data.id })
  }

  const addProgress = async () => {
    setSaving(true)
    await supabase.from('progress_entries').insert([{
      student_id: studentId, date: newProgress.date,
      weight: +newProgress.weight || null, notes: newProgress.notes,
      arm_cm: +newProgress.arm_cm || null, bust_cm: +newProgress.bust_cm || null,
      waist_cm: +newProgress.waist_cm || null, hip_cm: +newProgress.hip_cm || null,
      thigh_cm: +newProgress.thigh_cm || null,
    }])
    await fetchAll(); setShowProgressForm(false)
    setNewProgress({ date: new Date().toISOString().slice(0,10), weight:'', notes:'', arm_cm:'', bust_cm:'', waist_cm:'', hip_cm:'', thigh_cm:'' })
    setSaving(false)
  }

  const addGoal = async () => {
    if (!newGoal.description.trim()) return
    setSaving(true)
    await supabase.from('student_goals').insert([{ student_id: studentId, description: newGoal.description, target_date: newGoal.target_date || null }])
    await fetchAll(); setShowGoalForm(false); setNewGoal({ description:'', target_date:'' }); setSaving(false)
  }

  const toggleGoal = async (id, achieved) => {
    await supabase.from('student_goals').update({ achieved: !achieved }).eq('id', id)
    await fetchAll()
  }

  const deleteGoal = async (id) => {
    await supabase.from('student_goals').delete().eq('id', id)
    await fetchAll()
  }

  const addAttendance = async () => {
    setSaving(true)
    await supabase.from('attendance').insert([{ student_id: studentId, date: newAttendance.date, present: newAttendance.present, notes: newAttendance.notes }])
    await fetchAll(); setShowAttForm(false); setNewAttendance({ date: new Date().toISOString().slice(0,10), present: true, notes:'' }); setSaving(false)
  }

  const addFeedback = async () => {
    if (!newFeedback.content.trim()) return
    setSaving(true)
    await supabase.from('student_feedbacks').insert([{ student_id: studentId, date: newFeedback.date, content: newFeedback.content, rating: newFeedback.rating }])
    await fetchAll(); setShowFbForm(false); setNewFeedback({ date: new Date().toISOString().slice(0,10), content:'', rating:5 }); setSaving(false)
  }

  if (isNew) return <NewStudentForm navigate={navigate} />
  if (!student) return <div style={{ padding:40, color:'#475569' }}>Carregando...</div>

  const imc = student.weight && student.height ? (student.weight / ((student.height/100)**2)).toFixed(1) : '—'
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100) : null

  return (
    <div style={s.wrap}><div style={s.inner}>
      <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Painel</button>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:10, color:'#34D399', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Perfil do Aluno</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{student.name}</div>
            <div style={{ fontSize:13, color:'#475569' }}>{student.goal} · {student.level}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {attendanceRate !== null && (
              <div style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
                <div style={{ fontSize:9, color:'#34D399', textTransform:'uppercase', letterSpacing:1 }}>Frequência</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#34D399' }}>{attendanceRate}%</div>
              </div>
            )}
            <button style={s.outlineBtn} onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : '✏️ Editar Perfil'}</button>
          </div>
        </div>

        {editing ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Nome','name','text'],['Idade','age','number'],['Peso (kg)','weight','number'],['Altura (cm)','height','number']].map(([l,f,t]) => (
              <div key={f}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                <input style={s.input} type={t} value={form[f]||''} onChange={e => setForm(x => ({...x,[f]:e.target.value}))} />
              </div>
            ))}
            <div>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Objetivo</div>
              <select style={s.select} value={form.goal} onChange={e => setForm(x => ({...x,goal:e.target.value}))}>
                {GOALS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Nível</div>
              <select style={s.select} value={form.level} onChange={e => setForm(x => ({...x,level:e.target.value}))}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Saúde */}
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:12, color:'#34D399', fontWeight:700, margin:'8px 0 10px', textTransform:'uppercase', letterSpacing:1 }}>🩺 Saúde & Bem-estar</div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Condições de saúde / Restrições médicas</div>
              <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={form.health_conditions||''} placeholder="Ex: hipertensão, problema no joelho, hérnia..." onChange={e => setForm(x => ({...x,health_conditions:e.target.value}))} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Medicamentos em uso</div>
              <textarea style={{ ...s.input, minHeight:50, resize:'vertical' }} value={form.medications||''} placeholder="Ex: losartana, metformina..." onChange={e => setForm(x => ({...x,medications:e.target.value}))} />
            </div>
            <div>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Qualidade do sono</div>
              <select style={s.select} value={form.sleep_quality||''} onChange={e => setForm(x => ({...x,sleep_quality:e.target.value}))}>
                <option value=''>Selecionar...</option>
                {SLEEP.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Nível de estresse</div>
              <select style={s.select} value={form.stress_level||''} onChange={e => setForm(x => ({...x,stress_level:e.target.value}))}>
                <option value=''>Selecionar...</option>
                {STRESS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observações gerais</div>
              <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={form.notes||''} onChange={e => setForm(x => ({...x,notes:e.target.value}))} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <button style={s.btn()} onClick={saveStudent} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom: (student.health_conditions||student.medications||student.sleep_quality||student.stress_level) ? 16 : 0 }}>
              {[['Idade',`${student.age||'—'} anos`],['Peso',`${student.weight||'—'} kg`],['Altura',`${student.height||'—'} cm`],['IMC',imc]].map(([l,v]) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={s.label}>{l}</div><div style={s.val}>{v}</div>
                </div>
              ))}
            </div>
            {(student.health_conditions||student.medications||student.sleep_quality||student.stress_level) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {student.health_conditions && (
                  <div style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, color:'#FCA5A5', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>🩺 Condições de saúde</div>
                    <div style={{ fontSize:13, color:'#E2E8F0' }}>{student.health_conditions}</div>
                  </div>
                )}
                {student.medications && (
                  <div style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, color:'#FCD34D', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>💊 Medicamentos</div>
                    <div style={{ fontSize:13, color:'#E2E8F0' }}>{student.medications}</div>
                  </div>
                )}
                {student.sleep_quality && (
                  <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, color:'#A5B4FC', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>😴 Sono</div>
                    <div style={{ fontSize:13, color:'#E2E8F0' }}>{student.sleep_quality}</div>
                  </div>
                )}
                {student.stress_level && (
                  <div style={{ background:'rgba(249,115,22,0.07)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, color:'#FDB97D', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>😤 Estresse</div>
                    <div style={{ fontSize:13, color:'#E2E8F0' }}>{student.stress_level}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:11, color:'#475569', marginBottom:4 }}>🔗 Link do aluno:</div>
          <div style={s.shareBox} onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link copiado!') }}>
            {shareLink} <span style={{ color:'#34D399', marginLeft:8, cursor:'pointer' }}>📋 Copiar</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={s.tabs}>
        {[['plans','🏋️ Treinos'],['progress','📏 Medidas'],['goals','🏆 Metas'],['attendance','📅 Frequência'],['feedbacks','💬 Feedbacks'],['notes','📋 Observações']].map(([id,label]) => (
          <button key={id} style={s.tab(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── ABA TREINOS ── */}
      {tab === 'plans' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button style={s.btn()} onClick={createPlan}>+ Criar Plano de Treino</button>
          </div>
          {plans.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhum plano criado ainda</div>}
          {plans.map(plan => (
            <div key={plan.id} style={{ ...s.card, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div>
                <span style={s.badge(STATUS_COLOR[plan.status]||'#64748B')}>{STATUS_LABEL[plan.status]||plan.status}</span>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginTop:6 }}>{plan.title}</div>
                <div style={{ fontSize:12, color:'#475569' }}>Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <button style={s.btn('#00C9FF')} onClick={() => navigate('workout-editor', { studentId, planId: plan.id })}>✏️ Editar Treino</button>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA MEDIDAS ── */}
      {tab === 'progress' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button style={s.btn()} onClick={() => setShowProgressForm(!showProgressForm)}>+ Registrar Medidas</button>
          </div>
          {showProgressForm && (
            <div style={{ ...s.card, marginBottom:16 }}>
              <div style={{ ...s.sectionTitle }}>Novo Registro de Medidas</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Data','date','date'],['Peso (kg)','weight','number']].map(([l,f,t]) => (
                  <div key={f}>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                    <input style={s.input} type={t} value={newProgress[f]} onChange={e => setNewProgress(x => ({...x,[f]:e.target.value}))} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:11, color:'#34D399', fontWeight:700, margin:'4px 0 10px', textTransform:'uppercase', letterSpacing:1 }}>📏 Medidas Corporais (cm)</div>
                </div>
                {[['Braço','arm_cm'],['Busto','bust_cm'],['Cintura','waist_cm'],['Quadril','hip_cm'],['Coxa','thigh_cm']].map(([l,f]) => (
                  <div key={f}>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                    <input style={s.input} type="number" placeholder="cm" value={newProgress[f]} onChange={e => setNewProgress(x => ({...x,[f]:e.target.value}))} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observações</div>
                  <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={newProgress.notes} onChange={e => setNewProgress(x => ({...x,notes:e.target.value}))} placeholder="Ex: Aluno relatou cansaço, aumentou carga no supino..." />
                </div>
              </div>
              <button style={s.btn()} onClick={addProgress} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
            </div>
          )}
          {progress.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhum registro ainda</div>}
          {progress.map((p,i) => (
            <div key={p.id} style={{ ...s.card, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:'#34D399', fontWeight:700, marginBottom:10 }}>
                    {new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR',{ day:'2-digit', month:'long', year:'numeric' })}
                    {i===0 && <span style={{ marginLeft:8, ...s.badge('#34D399') }}>Mais recente</span>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
                    {[['⚖️ Peso',p.weight,'kg'],['💪 Braço',p.arm_cm,'cm'],['👙 Busto',p.bust_cm,'cm'],['🎀 Cintura',p.waist_cm,'cm'],['🍑 Quadril',p.hip_cm,'cm'],['🦵 Coxa',p.thigh_cm,'cm']].map(([l,v,u]) => v ? (
                      <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, color:'#475569', marginBottom:2 }}>{l}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#E2E8F0' }}>{v} {u}</div>
                      </div>
                    ) : null)}
                  </div>
                  {p.notes && <div style={{ fontSize:12, color:'#64748B', marginTop:10 }}>📝 {p.notes}</div>}
                </div>
                <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('progress_entries').delete().eq('id',p.id); fetchAll() }}} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA METAS ── */}
      {tab === 'goals' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button style={s.btn()} onClick={() => setShowGoalForm(!showGoalForm)}>+ Nova Meta</button>
          </div>
          {showGoalForm && (
            <div style={{ ...s.card, marginBottom:16 }}>
              <div style={s.sectionTitle}>Nova Meta</div>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Descrição da meta</div>
              <input style={s.input} placeholder="Ex: Perder 5kg até junho" value={newGoal.description} onChange={e => setNewGoal(x => ({...x,description:e.target.value}))} />
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Prazo (opcional)</div>
              <input style={s.input} type="date" value={newGoal.target_date} onChange={e => setNewGoal(x => ({...x,target_date:e.target.value}))} />
              <button style={s.btn()} onClick={addGoal} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Meta'}</button>
            </div>
          )}
          {goals.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhuma meta cadastrada</div>}
          {goals.map(g => (
            <div key={g.id} style={{ ...s.card, display:'flex', alignItems:'center', gap:14 }}>
              <div onClick={() => toggleGoal(g.id, g.achieved)} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${g.achieved?'#34D399':'#334155'}`, background: g.achieved?'#34D399':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:13 }}>
                {g.achieved && '✓'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color: g.achieved?'#475569':'#E2E8F0', textDecoration: g.achieved?'line-through':'none' }}>{g.description}</div>
                {g.target_date && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>🗓 Prazo: {new Date(g.target_date+'T12:00:00').toLocaleDateString('pt-BR')}</div>}
              </div>
              <span style={s.badge(g.achieved?'#34D399':'#FBBF24')}>{g.achieved?'✅ Concluída':'⏳ Em andamento'}</span>
              <button onClick={() => deleteGoal(g.id)} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16 }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA FREQUÊNCIA ── */}
      {tab === 'attendance' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            {attendanceRate !== null && (
              <div style={{ display:'flex', gap:16 }}>
                {[['Total',attendance.length],['Presenças',attendance.filter(a=>a.present).length],['Faltas',attendance.filter(a=>!a.present).length],['Taxa',`${attendanceRate}%`]].map(([l,v]) => (
                  <div key={l} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'8px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            <button style={s.btn()} onClick={() => setShowAttForm(!showAttForm)}>+ Registrar Presença</button>
          </div>
          {showAttForm && (
            <div style={{ ...s.card, marginBottom:16 }}>
              <div style={s.sectionTitle}>Novo Registro</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Data</div>
                  <input style={s.input} type="date" value={newAttendance.date} onChange={e => setNewAttendance(x => ({...x,date:e.target.value}))} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Status</div>
                  <select style={s.select} value={newAttendance.present} onChange={e => setNewAttendance(x => ({...x,present:e.target.value==='true'}))}>
                    <option value="true">✅ Presente</option>
                    <option value="false">❌ Faltou</option>
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observação</div>
                  <input style={s.input} placeholder="Ex: chegou atrasado, treino intenso..." value={newAttendance.notes} onChange={e => setNewAttendance(x => ({...x,notes:e.target.value}))} />
                </div>
              </div>
              <button style={s.btn()} onClick={addAttendance} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          )}
          {attendance.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhum registro de frequência ainda</div>}
          {attendance.map(a => (
            <div key={a.id} style={{ ...s.card, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{a.present ? '✅' : '❌'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#E2E8F0' }}>{new Date(a.date+'T12:00:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'2-digit', month:'long' })}</div>
                {a.notes && <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>📝 {a.notes}</div>}
              </div>
              <span style={s.badge(a.present?'#34D399':'#F87171')}>{a.present ? 'Presente' : 'Faltou'}</span>
              <button onClick={async () => { await supabase.from('attendance').delete().eq('id',a.id); fetchAll() }} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16 }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA FEEDBACKS ── */}
      {tab === 'feedbacks' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button style={s.btn()} onClick={() => setShowFbForm(!showFbForm)}>+ Novo Feedback</button>
          </div>
          {showFbForm && (
            <div style={{ ...s.card, marginBottom:16 }}>
              <div style={s.sectionTitle}>Novo Feedback</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Data</div>
                  <input style={s.input} type="date" value={newFeedback.date} onChange={e => setNewFeedback(x => ({...x,date:e.target.value}))} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:8, textTransform:'uppercase' }}>Avaliação do aluno</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {STARS.map(n => (
                      <span key={n} onClick={() => setNewFeedback(x => ({...x,rating:n}))} style={{ fontSize:22, cursor:'pointer', opacity: n<=newFeedback.rating?1:0.3 }}>⭐</span>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Feedback / Observação</div>
                  <textarea style={{ ...s.input, minHeight:80, resize:'vertical' }} placeholder="Ex: Aluno relatou melhora no condicionamento, está mais motivado..." value={newFeedback.content} onChange={e => setNewFeedback(x => ({...x,content:e.target.value}))} />
                </div>
              </div>
              <button style={s.btn()} onClick={addFeedback} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Feedback'}</button>
            </div>
          )}
          {feedbacks.length === 0 && <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhum feedback registrado ainda</div>}
          {feedbacks.map(f => (
            <div key={f.id} style={{ ...s.card, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ fontSize:13, color:'#34D399', fontWeight:700 }}>{new Date(f.date+'T12:00:00').toLocaleDateString('pt-BR',{ day:'2-digit', month:'long', year:'numeric' })}</div>
                    <div style={{ fontSize:16 }}>{STARS.map(n => <span key={n} style={{ opacity: n<=f.rating?1:0.2 }}>⭐</span>)}</div>
                  </div>
                  <div style={{ fontSize:14, color:'#CBD5E1', lineHeight:1.6 }}>{f.content}</div>
                </div>
                <button onClick={async () => { await supabase.from('student_feedbacks').delete().eq('id',f.id); fetchAll() }} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA OBSERVAÇÕES ── */}
      {tab === 'notes' && (
        <div style={s.card}>
          <div style={{ fontSize:14, fontWeight:600, color:'#94A3B8', marginBottom:8 }}>Observações Gerais</div>
          {student.notes
            ? <div style={{ fontSize:14, color:'#CBD5E1', lineHeight:1.7 }}>{student.notes}</div>
            : <div style={{ color:'#334155', fontSize:14 }}>Nenhuma observação. Clique em "Editar Perfil" para adicionar.</div>
          }
        </div>
      )}

    </div></div>
  )
}
