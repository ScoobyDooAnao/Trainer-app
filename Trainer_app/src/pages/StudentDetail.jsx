import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', background: '#080B12', padding: '24px 20px' },
  inner: { maxWidth: 800, margin: '0 auto' },
  back: { background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 },
  header: { background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(52,211,153,0.15)' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: (active) => ({ flex: 1, padding: '12px 8px', borderRadius: 10, border: 'none', background: active ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)', color: active ? '#fff' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  card: { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 },
  label: { fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  val: { fontSize: 15, fontWeight: 700, color: '#fff' },
  input: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10 },
  select: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10 },
  btn: (color = '#34D399') => ({ background: `linear-gradient(135deg,${color},${color}99)`, border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  outlineBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  shareBox: { background: 'rgba(0,201,255,0.08)', border: '1px solid rgba(0,201,255,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#7DD3FC', wordBreak: 'break-all', marginTop: 12 },
}

const GOALS = ['Ganho de Massa', 'Emagrecimento', 'Condicionamento', 'Força e Performance']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado']
const STATUS_COLOR = { active: '#34D399', draft: '#FBBF24', archived: '#64748B' }
const STATUS_LABEL = { active: 'Ativo', draft: 'Rascunho', archived: 'Arquivado' }

export default function StudentDetail({ navigate, studentId }) {
  const [student, setStudent] = useState(null)
  const [plans, setPlans] = useState([])
  const [progress, setProgress] = useState([])
  const [tab, setTab] = useState('plans')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newProgress, setNewProgress] = useState({ date: new Date().toISOString().slice(0, 10), weight: '', notes: '', waist: '', chest: '', hip: '', thigh: '' })
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [goals, setGoals] = useState([])

  useEffect(() => {
    fetchAll()
    setShareLink(`${window.location.origin}/view/${studentId}`)
  }, [studentId])

  const fetchAll = async () => {
    const [{ data: st }, { data: pl }, { data: pr }, { data: gs }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('workout_plans').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    ])
    if (st) { setStudent(st); setForm(st) }
    if (pl) setPlans(pl)
    if (pr) setProgress(pr)
    if (gs) setGoals(gs)
  }

  const saveStudent = async () => {
    setSaving(true)
    await supabase.from('students').update({ ...form, age: +form.age, weight: +form.weight, height: +form.height }).eq('id', studentId)
    await fetchAll()
    setEditing(false)
    setSaving(false)
  }

  const createPlan = async () => {
    const { data } = await supabase.from('workout_plans').insert([{ student_id: studentId, teacher_id: student.teacher_id, title: 'Novo Plano de Treino', status: 'draft' }]).select().single()
    if (data) navigate('workout-editor', { studentId, planId: data.id })
  }

  const addProgress = async () => {
    setSaving(true)
    const measurements = { waist: newProgress.waist, chest: newProgress.chest, hip: newProgress.hip, thigh: newProgress.thigh }
    await supabase.from('progress_entries').insert([{ student_id: studentId, date: newProgress.date, weight: +newProgress.weight || null, notes: newProgress.notes, measurements }])
    await fetchAll()
    setShowProgressForm(false)
    setNewProgress({ date: new Date().toISOString().slice(0, 10), weight: '', notes: '', waist: '', chest: '', hip: '', thigh: '' })
    setSaving(false)
  }

  const deleteProgress = async (id) => {
    if (!confirm('Excluir este registro?')) return
    await supabase.from('progress_entries').delete().eq('id', id)
    await fetchAll()
  }

  if (!student) return <div style={{ padding: 40, color: '#475569' }}>Carregando...</div>

  const imc = student.weight && student.height ? (student.weight / ((student.height / 100) ** 2)).toFixed(1) : '—'

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Painel</button>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Perfil do Aluno</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{student.name}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{student.goal} · {student.level}</div>
            </div>
            <button style={s.outlineBtn} onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : '✏️ Editar Perfil'}</button>
          </div>

          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Nome', 'name', 'text'], ['Idade', 'age', 'number'], ['Peso (kg)', 'weight', 'number'], ['Altura (cm)', 'height', 'number']].map(([l, f, t]) => (
                <div key={f}>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>{l}</div>
                  <input style={s.input} type={t} value={form[f] || ''} onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>Objetivo</div>
                <select style={s.select} value={form.goal} onChange={e => setForm(x => ({ ...x, goal: e.target.value }))}>
                  {GOALS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>Nível</div>
                <select style={s.select} value={form.level} onChange={e => setForm(x => ({ ...x, level: e.target.value }))}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>Observações</div>
                <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <button style={s.btn()} onClick={saveStudent} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[['Idade', `${student.age || '—'} anos`], ['Peso', `${student.weight || '—'} kg`], ['Altura', `${student.height || '—'} cm`], ['IMC', imc]].map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={s.label}>{l}</div>
                  <div style={s.val}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Share link */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>🔗 Link do aluno (compartilhe para ele ver o treino):</div>
            <div style={s.shareBox} onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link copiado!') }}>
              {shareLink} <span style={{ color: '#34D399', marginLeft: 8, cursor: 'pointer' }}>📋 Copiar</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[['plans', '🏋️ Treinos'], ['progress', '📈 Evolução'], ['metas', '🎯 Metas'], ['notes', '📋 Observações']].map(([id, label]) => (
            <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* PLANS TAB */}
        {tab === 'plans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button style={s.btn()} onClick={createPlan}>+ Criar Plano de Treino</button>
            </div>
            {plans.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>Nenhum plano criado ainda</div>}
            {plans.map(plan => (
              <div key={plan.id} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${STATUS_COLOR[plan.status]}20`, color: STATUS_COLOR[plan.status], border: `1px solid ${STATUS_COLOR[plan.status]}40` }}>
                      {STATUS_LABEL[plan.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{plan.title}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <button style={s.btn('#00C9FF')} onClick={() => navigate('workout-editor', { studentId, planId: plan.id })}>
                  ✏️ Editar Treino
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS TAB */}
        {tab === 'progress' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button style={s.btn()} onClick={() => setShowProgressForm(!showProgressForm)}>+ Registrar Evolução</button>
            </div>

            {showProgressForm && (
              <div style={{ ...s.card, marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Novo Registro</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Data', 'date', 'date'], ['Peso (kg)', 'weight', 'number'], ['Cintura (cm)', 'waist', 'number'], ['Peito (cm)', 'chest', 'number'], ['Quadril (cm)', 'hip', 'number'], ['Coxa (cm)', 'thigh', 'number']].map(([l, f, t]) => (
                    <div key={f}>
                      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>{l}</div>
                      <input style={s.input} type={t} value={newProgress[f]} onChange={e => setNewProgress(x => ({ ...x, [f]: e.target.value }))} />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>Observações</div>
                    <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={newProgress.notes} onChange={e => setNewProgress(x => ({ ...x, notes: e.target.value }))} placeholder="Ex: Aluno relatou cansaço, aumentou carga no supino..." />
                  </div>
                </div>
                <button style={s.btn()} onClick={addProgress} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
              </div>
            )}

            {progress.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>Nenhum registro ainda</div>}
            {progress.map((p, i) => (
              <div key={p.id} style={{ ...s.card, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
                      {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: '#34D39920', color: '#34D399', padding: '2px 8px', borderRadius: 20, border: '1px solid #34D39940' }}>Mais recente</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {p.weight && <div><span style={{ fontSize: 10, color: '#475569' }}>Peso: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.weight} kg</span></div>}
                      {p.measurements?.waist && <div><span style={{ fontSize: 10, color: '#475569' }}>Cintura: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.waist} cm</span></div>}
                      {p.measurements?.chest && <div><span style={{ fontSize: 10, color: '#475569' }}>Peito: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.chest} cm</span></div>}
                      {p.measurements?.hip && <div><span style={{ fontSize: 10, color: '#475569' }}>Quadril: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.hip} cm</span></div>}
                      {p.measurements?.thigh && <div><span style={{ fontSize: 10, color: '#475569' }}>Coxa: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.thigh} cm</span></div>}
                    </div>
                    {p.notes && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>📝 {p.notes}</div>}
                  </div>
                  <button onClick={() => deleteProgress(p.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* METAS TAB — read-only para o professor */}
        {tab === 'metas' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>🎯 Metas do Aluno</div>
              <span style={{ fontSize: 11, color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>👁️ Somente visualização</span>
            </div>
            {goals.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div style={{ fontSize: 14, color: '#475569' }}>O aluno ainda não cadastrou nenhuma meta.</div>
              </div>
            ) : (
              <>
                {['ativa','concluida'].map(status => {
                  const list = goals.filter(g => g.status === status)
                  if (!list.length) return null
                  const statusLabel = status === 'ativa' ? 'Em andamento' : 'Concluídas ✅'
                  return (
                    <div key={status} style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{statusLabel}</div>
                      {list.map(g => {
                        const catColors = { peso:'#34D399', imc:'#60A5FA', medida:'#A78BFA', forca:'#FBBF24', cardio:'#F87171', habito:'#F5C842', outro:'#94A3B8' }
                        const cc = catColors[g.category] || '#94A3B8'
                        const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null
                        return (
                          <div key={g.id} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${cc}`, opacity: status === 'concluida' ? 0.65 : 1 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                              <div>
                                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                                  <span style={{ fontSize:13, fontWeight:800, color:'#CBD5E1', textDecoration: status==='concluida'?'line-through':'none' }}>{g.title}</span>
                                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${cc}18`, color:cc, border:`1px solid ${cc}35` }}>{g.category}</span>
                                </div>
                                {g.target_value && <div style={{ fontSize:12, color:'#64748B' }}>Alvo: <strong style={{ color:cc }}>{g.target_value} {g.target_unit}</strong></div>}
                                {g.description && g.description !== g.title && <div style={{ fontSize:11, color:'#475569', marginTop:3, fontStyle:'italic' }}>{g.description}</div>}
                                {daysLeft !== null && status === 'ativa' && (
                                  <div style={{ fontSize:11, color: daysLeft<7?'#F87171':daysLeft<30?'#FBBF24':'#475569', fontWeight:600, marginTop:4 }}>
                                    {daysLeft>0 ? `⏳ ${daysLeft} dias restantes` : daysLeft===0 ? '🔔 Prazo hoje!' : `⚠️ ${Math.abs(daysLeft)}d em atraso`}
                                  </div>
                                )}
                              </div>
                              {status === 'concluida' && <span style={{ fontSize:18 }}>✅</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <div style={s.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>Observações do Aluno</div>
            {editing ? null : (
              student.notes
                ? <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.7 }}>{student.notes}</div>
                : <div style={{ color: '#334155', fontSize: 14 }}>Nenhuma observação registrada. Clique em "Editar Perfil" para adicionar.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
