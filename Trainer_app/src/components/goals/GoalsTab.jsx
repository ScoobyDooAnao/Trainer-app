import { useState } from 'react'
import { supabase } from '../../supabase'
import { CARD, INP, LBL } from '../../lib/studentViewShared'

// ── Metas — cores de categoria, sugestões, modal, aba principal e constelação ──
const CAT_STAR_COLOR = {
  peso:'#34D399', imc:'#60A5FA', medida:'#A78BFA',
  forca:'#FBBF24', cardio:'#F87171', habito:'#F5C842', outro:'#94A3B8',
}

// ── METAS DATA ────────────────────────────────────────────────────────────────
const METAS_SUGERIDAS = {
  'Emagrecimento': [
    {icon:'⚖️',titulo:'Perder peso',        categoria:'peso',  unidade:'kg',     placeholder:'Ex: 5',    desc:'Reduzir meu peso corporal em'},
    {icon:'📉',titulo:'Abaixar meu IMC',     categoria:'imc',   unidade:'pontos', placeholder:'Ex: 2',    desc:'Reduzir meu IMC em'},
    {icon:'📏',titulo:'Diminuir cintura',    categoria:'medida',unidade:'cm',     placeholder:'Ex: 8',    desc:'Diminuir minha cintura em'},
    {icon:'🏃',titulo:'Correr sem parar',    categoria:'cardio',unidade:'km',     placeholder:'Ex: 5',    desc:'Conseguir correr'},
    {icon:'🔥',titulo:'Sequência de treinos',categoria:'habito',unidade:'dias',   placeholder:'Ex: 30',   desc:'Manter sequência por'},
    {icon:'🥗',titulo:'Meta personalizada',  categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
  'Ganho de Massa': [
    {icon:'⚖️',titulo:'Ganhar massa',        categoria:'peso',  unidade:'kg',     placeholder:'Ex: 4',    desc:'Ganhar'},
    {icon:'💪',titulo:'Aumentar braço',      categoria:'medida',unidade:'cm',     placeholder:'Ex: 3',    desc:'Aumentar o braço em'},
    {icon:'🏋️',titulo:'PR no Supino',       categoria:'forca', unidade:'kg',     placeholder:'Ex: 80',   desc:'Supino com'},
    {icon:'🏋️',titulo:'PR no Agachamento',  categoria:'forca', unidade:'kg',     placeholder:'Ex: 100',  desc:'Agachamento com'},
    {icon:'🔥',titulo:'Sequência de treinos',categoria:'habito',unidade:'dias',   placeholder:'Ex: 30',   desc:'Manter sequência por'},
    {icon:'⭐',titulo:'Meta personalizada',  categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
  'Condicionamento': [
    {icon:'🏃',titulo:'Correr X km',         categoria:'cardio',unidade:'km',     placeholder:'Ex: 10',   desc:'Correr'},
    {icon:'⏱️',titulo:'Pace alvo',           categoria:'cardio',unidade:'min/km', placeholder:'Ex: 5:30', desc:'Atingir pace de'},
    {icon:'⚡',titulo:'Completar HIIT',      categoria:'cardio',unidade:'sessões',placeholder:'Ex: 8',    desc:'Completar'},
    {icon:'🔥',titulo:'Sequência de treinos',categoria:'habito',unidade:'dias',   placeholder:'Ex: 60',   desc:'Manter sequência por'},
    {icon:'💪',titulo:'Aumentar carga base', categoria:'forca', unidade:'kg',     placeholder:'Ex: 10',   desc:'Aumentar carga base em'},
    {icon:'🎯',titulo:'Meta personalizada',  categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
  'Força e Performance': [
    {icon:'🏋️',titulo:'1RM Supino',         categoria:'forca', unidade:'kg',     placeholder:'Ex: 100',  desc:'1RM Supino de'},
    {icon:'🏋️',titulo:'1RM Agachamento',    categoria:'forca', unidade:'kg',     placeholder:'Ex: 120',  desc:'1RM Agachamento de'},
    {icon:'🏋️',titulo:'1RM Terra',          categoria:'forca', unidade:'kg',     placeholder:'Ex: 140',  desc:'1RM Levantamento Terra de'},
    {icon:'📈',titulo:'PR em exercício',     categoria:'forca', unidade:'kg',     placeholder:'Ex: 60',   desc:'Bater PR de'},
    {icon:'🔥',titulo:'Sequência de treinos',categoria:'habito',unidade:'dias',   placeholder:'Ex: 30',   desc:'Manter sequência por'},
    {icon:'🏆',titulo:'Meta personalizada',  categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
}
const CAT_COLORS = {
  peso:  {bg:'rgba(52,211,153,0.1)', border:'rgba(52,211,153,0.25)', text:'#34D399'},
  imc:   {bg:'rgba(96,165,250,0.1)', border:'rgba(96,165,250,0.25)', text:'#60A5FA'},
  medida:{bg:'rgba(167,139,250,0.1)',border:'rgba(167,139,250,0.25)',text:'#A78BFA'},
  forca: {bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.25)', text:'#FBBF24'},
  cardio:{bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)',  text:'#F87171'},
  habito:{bg:'rgba(245,200,66,0.1)', border:'rgba(245,200,66,0.25)', text:'#F5C842'},
  outro: {bg:'rgba(148,163,184,0.1)',border:'rgba(148,163,184,0.25)',text:'#94A3B8'},
}

// ── NOVA META MODAL ───────────────────────────────────────────────────────────
function NovaMetaModal({ studentId, goal, goals, onSave, onClose }) {
  const sugestoes = METAS_SUGERIDAS[goal] || METAS_SUGERIDAS['Ganho de Massa']
  const [step, setStep]     = useState('escolher')
  const [sel, setSel]       = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor]   = useState('')
  const [unidade, setUnidade] = useState('')
  const [prazo, setPrazo]   = useState('')
  const [saving, setSaving] = useState(false)

  const escolher = (s) => {
    setSel(s); setTitulo(s.titulo==='Meta personalizada'?'':s.titulo)
    setDescricao(s.desc); setUnidade(s.unidade); setStep('detalhar')
  }
  const [saveError, setSaveError] = useState(null)
  const salvar = async () => {
    if (!titulo.trim()) return
    // Check duplicate category
    if (sel?.categoria && sel.categoria !== 'outro') {
      const dupl = (goals||[]).filter(g => g.status==='ativa' && g.category===sel.categoria)
      if (dupl.length > 0) {
        setSaveError(`Você já tem uma meta ativa na categoria "${sel.categoria}". Conclua ou exclua ela antes de criar outra.`)
        return
      }
    }
    setSaving(true); setSaveError(null)
    const { error } = await supabase.from('student_goals').insert([{
      student_id:studentId, title:titulo, description:descricao,
      category:sel?.categoria||'outro', target_value:valor?parseFloat(valor):null,
      target_unit:unidade, deadline:prazo||null, status:'ativa',
    }])
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    onSave(); onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ ...CARD, padding:24, width:'100%',
        maxWidth:430, maxHeight:'90vh', overflowY:'auto', marginBottom:0,
        border:'1px solid rgba(167,139,250,0.2)' }}>
        {step==='escolher' ? (
          <>
            <div style={{ fontSize:16,fontWeight:900,color:'#E2E8F0',marginBottom:3,
              fontFamily:"'Nunito',sans-serif" }}>🎯 Nova Meta</div>
            <div style={{ fontSize:12,color:'#475569',marginBottom:18 }}>
              Escolha uma sugestão ou crie a sua própria</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {sugestoes.map((s,i) => {
                const cc = CAT_COLORS[s.categoria]||CAT_COLORS.outro
                return (
                  <button key={i} onClick={()=>escolher(s)} style={{
                    display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                    borderRadius:12,border:`1px solid ${cc.border}`,background:cc.bg,
                    cursor:'pointer',textAlign:'left',transition:'all 0.15s',
                    fontFamily:"'Nunito',sans-serif",
                  }}>
                    <span style={{ fontSize:20 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:800,color:'#E2E8F0' }}>{s.titulo}</div>
                      {s.desc&&<div style={{ fontSize:11,color:'#64748B',marginTop:1 }}>{s.desc} {s.placeholder}</div>}
                    </div>
                    <span style={{ marginLeft:'auto',color:cc.text,fontSize:16 }}>→</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <button onClick={()=>setStep('escolher')} style={{ background:'none',border:'none',
              color:'#475569',fontSize:13,cursor:'pointer',marginBottom:16,
              display:'flex',alignItems:'center',gap:6,fontFamily:"'Nunito',sans-serif" }}>← Voltar</button>
            <div style={{ fontSize:16,fontWeight:800,color:'#E2E8F0',marginBottom:3,
              fontFamily:"'Nunito',sans-serif" }}>{sel?.icon} Definir Meta</div>
            <div style={{ fontSize:12,color:'#475569',marginBottom:18 }}>
              Quanto mais específico, mais fácil de acompanhar!</div>
            <label style={LBL}>Título da meta</label>
            <input style={INP} placeholder="Ex: Perder 5kg até o verão" value={titulo} onChange={e=>setTitulo(e.target.value)} />
            {sel?.categoria!=='outro' && (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div>
                  <label style={LBL}>Valor alvo</label>
                  <input type="number" step="0.1" style={INP} placeholder={sel?.placeholder} value={valor} onChange={e=>setValor(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Unidade</label>
                  <input style={INP} placeholder="kg, cm, dias..." value={unidade} onChange={e=>setUnidade(e.target.value)} />
                </div>
              </div>
            )}
            <label style={LBL}>Prazo (opcional)</label>
            <input type="date" style={INP} value={prazo} onChange={e=>setPrazo(e.target.value)} />
            <label style={LBL}>Motivação (opcional)</label>
            <textarea style={{ ...INP,minHeight:56,resize:'vertical' }}
              placeholder="Por que essa meta é importante?" value={descricao} onChange={e=>setDescricao(e.target.value)} />
            {saveError && (
              <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10,
                background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)',
                fontSize:12, color:'#F87171' }}>
                ⚠️ Erro ao salvar: {saveError}
              </div>
            )}
            <button onClick={salvar} disabled={saving||!titulo.trim()} style={{
              width:'100%',background:titulo.trim()?'linear-gradient(135deg,#34D399,#059669)':'rgba(255,255,255,0.05)',
              border:'none',borderRadius:12,padding:13,color:titulo.trim()?'#022c22':'#334155',
              fontWeight:800,fontSize:14,cursor:'pointer',marginTop:16,
              fontFamily:"'Nunito',sans-serif",
              boxShadow:titulo.trim()?'0 4px 20px rgba(52,211,153,0.35)':'none',
            }}>{saving?'Salvando...':'🎯 Criar Meta'}</button>
          </>
        )}
        <button onClick={onClose} style={{ width:'100%',background:'transparent',
          border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:11,
          color:'#475569',fontWeight:600,fontSize:13,cursor:'pointer',marginTop:8,
          fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── TAB METAS ─────────────────────────────────────────────────────────────────
function TabMetas({ studentId, student, goals, onUpdate }) {
  const [showModal, setShowModal]         = useState(false)
  const [updating, setUpdating]           = useState(null)
  const [editingProgress, setEditingProgress] = useState(null)
  const [progressInput, setProgressInput] = useState('')

  const updateStatus = async (goalId, status) => {
    setUpdating(goalId)
    await supabase.from('student_goals').update({ status, completed_at: status === 'concluida' ? new Date().toISOString() : null }).eq('id', goalId)
    await onUpdate(); setUpdating(null)
  }
  const updateCurrentValue = async (goalId) => {
    const val = parseFloat(progressInput)
    if (isNaN(val)) { setEditingProgress(null); return }
    await supabase.from('student_goals').update({ current_value: val }).eq('id', goalId)
    await onUpdate(); setEditingProgress(null); setProgressInput('')
  }
  const deleteGoal = async (goalId) => {
    await supabase.from('student_goals').delete().eq('id', goalId); await onUpdate()
  }
  const getAutoProgress = (g) => g.current_value ?? null

  const ativas     = goals.filter(g => g.status==='ativa')
  const concluidas = goals.filter(g => g.status==='concluida' && (!g.completed_at || (Date.now() - new Date(g.completed_at).getTime()) < 2*86400000))
  const sugestoes  = METAS_SUGERIDAS[student?.goal] || []

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      {showModal && <NovaMetaModal studentId={studentId} goal={student?.goal} goals={goals}
        onSave={onUpdate} onClose={()=>setShowModal(false)} />}

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:900,color:'#E2E8F0',fontFamily:"'Nunito',sans-serif" }}>
            🎯 Minhas Metas
          </div>
          <div style={{ fontSize:12,color:'#64748B',marginTop:2 }}>
            {ativas.length} ativa{ativas.length!==1?'s':''} · {concluidas.length} conquistada{concluidas.length!==1?'s':''}
          </div>
        </div>
        <button onClick={()=>setShowModal(true)} className="cosmic-btn-glow" style={{
          padding:'10px 18px',borderRadius:12,border:'none',cursor:'pointer',
          background:'linear-gradient(135deg,#A78BFA,#7C3AED)',
          color:'#FFF',fontWeight:800,fontSize:13,transition:'all 0.2s',
          fontFamily:"'Nunito',sans-serif",
          boxShadow:'0 4px 16px rgba(167,139,250,0.35)',
        }}>+ Nova Meta</button>
      </div>

      {/* ── CONSTELAÇÃO DE CONQUISTAS ── */}
      <ConstellationDisplay goals={concluidas} />

      {/* Sugestões rápidas */}
      <SugestoesMetas goals={goals} sugestoes={sugestoes} student={student} onAdd={() => setAddGoalModal(true)} />

      {/* Metas ativas */}
      {ativas.length===0 && concluidas.length===0 ? (
        <div style={{ textAlign:'center',padding:'40px 20px' }}>
          <div style={{ fontSize:44,marginBottom:12,animation:'float 3s ease-in-out infinite' }}>🌌</div>
          <div style={{ fontSize:15,fontWeight:800,color:'#E2E8F0',marginBottom:6,
            fontFamily:"'Nunito',sans-serif" }}>Nenhuma meta ainda</div>
          <div style={{ fontSize:13,color:'#475569' }}>Adicione metas e veja sua constelação crescer!</div>
        </div>
      ) : (
        <>
          {ativas.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:10,color:'#60A5FA',fontWeight:800,letterSpacing:2,
                textTransform:'uppercase',marginBottom:12,fontFamily:"'Nunito',sans-serif" }}>
                ◎ Em andamento
              </div>
              {ativas.map(g => {
                const cc  = CAT_COLORS[g.category]||CAT_COLORS.outro
                const isU = updating===g.id
                const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline)-new Date())/86400000) : null
                const current  = getAutoProgress(g)
                const pct      = g.target_value && current != null
                  ? Math.min(Math.round((current/g.target_value)*100), 100) : null
                return (
                  <div key={g.id} style={{ ...CARD, borderLeft:`3px solid ${cc.text}`,
                    borderRadius:'0 16px 16px 0', padding:'16px 18px', marginBottom:10 }}>
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap' }}>
                          <span style={{ fontSize:14,fontWeight:800,color:'#E2E8F0',
                            fontFamily:"'Nunito',sans-serif" }}>{g.title}</span>
                          <span style={{ fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,
                            background:cc.bg,color:cc.text,border:`1px solid ${cc.border}`,letterSpacing:0.5 }}>
                            {g.category}
                          </span>
                        </div>

                        {/* Progress bar */}
                        {g.target_value && (
                          <div style={{ marginBottom:8 }}>
                            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                              <span style={{ fontSize:12,color:'#94A3B8' }}>
                                🎯 Alvo: <strong style={{ color:cc.text }}>{g.target_value} {g.target_unit}</strong>
                              </span>
                              {pct!=null && (
                                <span style={{ fontSize:13,fontWeight:900,color:pct>=100?'#34D399':pct>=60?'#F5C842':cc.text }}>
                                  {pct}%
                                </span>
                              )}
                            </div>
                            {pct!=null && (
                              <div style={{ height:7,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden',marginBottom:5 }}>
                                <div style={{ height:'100%',width:`${pct}%`,borderRadius:99,transition:'width 0.7s ease',
                                  background:pct>=100?'linear-gradient(90deg,#34D399,#059669)':
                                    pct>=60?'linear-gradient(90deg,#F5C842,#D97706)':
                                    `linear-gradient(90deg,${cc.text}80,${cc.text})`,
                                  boxShadow:pct>0?`0 0 8px ${cc.text}55`:undefined }} />
                              </div>
                            )}
                            {current!=null && (
                              <div style={{ fontSize:11,color:'#64748B',fontFamily:"'Nunito',sans-serif" }}>
                                Atual: <strong style={{ color:cc.text }}>{current} {g.target_unit}</strong>
                                {editingProgress!==g.id && (
                                  <button onClick={()=>{setEditingProgress(g.id);setProgressInput(String(current))}}
                                    style={{ marginLeft:8,background:'none',border:'none',color:'#475569',
                                      cursor:'pointer',fontSize:11,textDecoration:'underline' }}>✏️ editar</button>
                                )}
                              </div>
                            )}
                            {current==null && editingProgress!==g.id && (
                              <button onClick={()=>{setEditingProgress(g.id);setProgressInput('')}}
                                style={{ fontSize:11,background:cc.bg,border:`1px solid ${cc.border}`,
                                  borderRadius:8,padding:'4px 10px',color:cc.text,cursor:'pointer',fontWeight:800,
                                  fontFamily:"'Nunito',sans-serif" }}>📝 Registrar progresso</button>
                            )}
                            {editingProgress===g.id && (
                              <div style={{ display:'flex',gap:6,marginTop:6,alignItems:'center' }}>
                                <input type="number" value={progressInput} autoFocus
                                  onChange={e=>setProgressInput(e.target.value)}
                                  placeholder={`Ex: ${Math.round(g.target_value/2)}`}
                                  style={{ flex:1,...INP,padding:'7px 10px',fontSize:13 }} />
                                <span style={{ fontSize:11,color:'#64748B' }}>{g.target_unit}</span>
                                <button onClick={()=>updateCurrentValue(g.id)} style={{
                                  padding:'7px 12px',borderRadius:8,border:'none',background:cc.text,
                                  color:'#02040F',fontWeight:900,fontSize:12,cursor:'pointer' }}>✓</button>
                                <button onClick={()=>setEditingProgress(null)} style={{
                                  padding:'7px 10px',borderRadius:8,border:'none',
                                  background:'rgba(255,255,255,0.06)',color:'#64748B',fontSize:12,cursor:'pointer' }}>✕</button>
                              </div>
                            )}
                          </div>
                        )}

                        {!g.target_value&&g.description&&g.description!==g.title&&(
                          <div style={{ fontSize:12,color:'#475569',marginBottom:6,fontStyle:'italic' }}>{g.description}</div>
                        )}
                        {daysLeft!==null&&(
                          <div style={{ fontSize:11,fontWeight:700,
                            color:daysLeft<7?'#F87171':daysLeft<30?'#FBBF24':'#475569',
                            fontFamily:"'Nunito',sans-serif" }}>
                            {daysLeft>0?`⏳ ${daysLeft} dias restantes`:daysLeft===0?'🔔 Prazo hoje!':`⚠️ ${Math.abs(daysLeft)}d em atraso`}
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex',flexDirection:'column',gap:6,flexShrink:0 }}>
                        <button onClick={()=>updateStatus(g.id,'concluida')} disabled={isU} style={{
                          padding:'8px 14px',borderRadius:10,border:'1px solid rgba(52,211,153,0.25)',
                          background:'rgba(52,211,153,0.08)',color:'#34D399',fontWeight:800,fontSize:12,
                          cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Nunito',sans-serif",
                          transition:'all 0.2s',
                        }}>{isU?'...':'⭐ Concluir'}</button>
                        <button onClick={()=>{ if(window.confirm('Excluir esta meta?')) deleteGoal(g.id) }} style={{
                          padding:'6px 14px',borderRadius:10,border:'1px solid rgba(248,113,113,0.2)',
                          background:'rgba(248,113,113,0.07)',color:'#F87171',fontWeight:700,fontSize:11,
                          cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Nunito',sans-serif",
                        }}>🗑 Excluir</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {concluidas.length > 0 && (
            <div>
              <div style={{ fontSize:10,color:'#F5C842',fontWeight:800,letterSpacing:2,
                textTransform:'uppercase',marginBottom:12,fontFamily:"'Nunito',sans-serif" }}>
                ★ Conquistadas ({concluidas.length})
              </div>
              {concluidas.map((g,i) => (
                <div key={g.id} style={{ ...CARD, marginBottom:8, padding:'12px 16px',
                  opacity:0.7, borderLeft:`2px solid ${CAT_STAR_COLOR[g.category]||'#94A3B8'}` }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <svg width={20} height={20} viewBox="0 0 100 100"
                      style={{ '--c':CAT_STAR_COLOR[g.category]||'#94A3B8', color:CAT_STAR_COLOR[g.category], flexShrink:0 }}>
                      <polygon points="50,4 61,36 95,36 68,58 79,92 50,71 21,92 32,58 5,36 39,36"
                        fill={CAT_STAR_COLOR[g.category]||'#94A3B8'} />
                    </svg>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:'#94A3B8',textDecoration:'line-through',
                        fontFamily:"'Nunito',sans-serif" }}>{g.title}</div>
                      {g.target_value&&<div style={{ fontSize:11,color:'#475569' }}>{g.target_value} {g.target_unit}</div>}
                    </div>
                    <button onClick={()=>deleteGoal(g.id)} style={{ background:'transparent',border:'none',
                      color:'#334155',cursor:'pointer',fontSize:14 }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}


// ── Céu estrelado (mobile only) ───────────────────────────────────────────────

// ── Achievement Stars ────────────────────────────────────────────────────────
function AchievementStar({ goal, size, index }) {
  const color = CAT_STAR_COLOR[goal.category] || '#94A3B8'
  const pts   = '50,4 61,36 95,36 68,58 79,92 50,71 21,92 32,58 5,36 39,36'
  return (
    <div title={goal.title} style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'default',
      animation:`starAppear 0.6s ${index * 0.12}s both cubic-bezier(0.34,1.56,0.64,1)`,
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100"
        style={{ '--sc': color, animation:`starGlow 3.5s ${index * 0.4}s ease-in-out infinite` }}>
        <polygon points={pts} fill={color} opacity="0.93" />
        <polygon points={pts} fill="rgba(255,255,255,0.25)"
          style={{ transform:'scale(0.45)', transformOrigin:'50px 52px' }} />
      </svg>
      <span style={{ fontSize:9, color, fontWeight:800, textAlign:'center',
        maxWidth:size+14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', opacity:0.85 }}>
        {goal.title.length > 14 ? goal.title.slice(0,13)+'…' : goal.title}
      </span>
    </div>
  )
}

function ConstellationDisplay({ goals }) {
  if (!goals.length) return null
  const getSize = (i) => Math.max(28, 58 - i * 8)
  return (
    <div style={{ ...CARD, position:'relative', overflow:'hidden',
      border:'1px solid rgba(167,139,250,0.22)', padding:'22px 18px 18px', marginBottom:16 }}>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none',
        animation:'constellationPulse 4s ease-in-out infinite' }} preserveAspectRatio="none">
        {goals.slice(0,7).map((_,i) => {
          if (i===0) return null
          const x1=((i-1)*15+7)+'%', y1='55%', x2=(i*15+7)+'%', y2='55%'
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#A78BFA" strokeWidth="1" strokeDasharray="3,5" />
        })}
      </svg>
      <div style={{ fontSize:10, color:'#A78BFA', fontWeight:800, letterSpacing:2.5,
        textTransform:'uppercase', textAlign:'center', marginBottom:18 }}>
        ✦ Constelação de Conquistas · {goals.length} {goals.length===1?'estrela':'estrelas'}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center', alignItems:'flex-end' }}>
        {goals.map((g,i) => <AchievementStar key={g.id} goal={g} size={getSize(i)} index={i} />)}
      </div>
      {goals.length >= 3 && (
        <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'#64748B', fontStyle:'italic' }}>
          {goals.length >= 10 ? '🌌 Constelação completa — você é incrível!' :
           goals.length >= 5  ? '⭐ Sua constelação está crescendo!' :
           '✨ Continue e faça sua constelação brilhar!'}
        </div>
      )}
    </div>
  )
}

export { TabMetas, ConstellationDisplay }
