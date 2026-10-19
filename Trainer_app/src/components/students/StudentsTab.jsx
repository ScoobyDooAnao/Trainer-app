import { useState } from 'react'
import { supabase } from '../../supabase'
import { criarAlunoPendente } from '../../lib/alunos'
import { GOAL, SPORTS, YELLOW, INACTIVE_THRESHOLD_DAYS, streakStyle, calcAgeFromStudent } from '../../lib/dashboardShared'
import { GoalBadge } from '../shared/DashboardUI'

// ── Modal de confirmação de exclusão ───────────────────────────────────────
export function ConfirmDeleteModal({ student, onConfirm, onClose, deleting }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, padding:'28px 28px 24px', maxWidth:380, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.25)', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ fontSize:36, textAlign:'center', marginBottom:10 }}></div>
        <div style={{ fontSize:18, fontWeight:800, color:'#0D1B2A', textAlign:'center', marginBottom:6 }}>Excluir aluno?</div>
        <div style={{ fontSize:14, color:'#64748B', textAlign:'center', lineHeight:1.6, marginBottom:20 }}>
          Tem certeza que deseja excluir <strong style={{ color:'#0D1B2A' }}>{student.name}</strong>?<br/>
          <span style={{ fontSize:12, color:'#EF4444', fontWeight:600 }}>Esta ação não pode ser desfeita. Todo histórico, treinos e registros serão removidos permanentemente.</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#64748B', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background: deleting ? '#FCA5A5' : 'linear-gradient(135deg,#EF4444,#DC2626)', color:'#fff', fontWeight:800, fontSize:14, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
            {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function StudentCard({ st, onClick, onDelete }) {
  const [hov,      setHov]      = useState(false)
  const [hovDel,   setHovDel]   = useState(false)
  const [showDel,  setShowDel]  = useState(false)
  const [deleting, setDeleting] = useState(false)

  const g      = GOAL[st.goal] || GOAL['Ganho de Massa']
  const streak = streakStyle(st.streak || 0)
  const active = (st.lastSeenDays ?? 999) <= INACTIVE_THRESHOLD_DAYS
  const age    = calcAgeFromStudent(st)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await Promise.all([
        supabase.from('exercise_logs').delete().eq('student_id', st.id),
        supabase.from('attendance').delete().eq('student_id', st.id),
        supabase.from('progress_entries').delete().eq('student_id', st.id),
        supabase.from('student_feedbacks').delete().eq('student_id', st.id),
        supabase.from('cardio_sessions').delete().eq('student_id', st.id),
        supabase.from('student_goals').delete().eq('student_id', st.id),
        supabase.from('measure_logs').delete().eq('student_id', st.id),
        supabase.from('anamnese').delete().eq('student_id', st.id),
        supabase.from('anamnese_tokens').delete().eq('student_id', st.id),
      ])
      const { data: plans } = await supabase.from('workout_plans').select('id').eq('student_id', st.id)
      if (plans?.length) {
        const pids = plans.map(p => p.id)
        const { data: days } = await supabase.from('workout_days').select('id').in('plan_id', pids)
        if (days?.length) await supabase.from('exercises').delete().in('day_id', days.map(d => d.id))
        await supabase.from('workout_days').delete().in('plan_id', pids)
        await supabase.from('workout_plans').delete().in('id', pids)
      }
      const { error: delErr } = await supabase.from('students').delete().eq('id', st.id)
      if (delErr) throw delErr
      onDelete(st.id)
    } catch (e) {
      console.error(e)
      alert('Não foi possível excluir o aluno: ' + e.message)
      setDeleting(false)
    }
  }

  return (
    <>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
        style={{
          background:   hov ? 'linear-gradient(160deg,#FDE68A,#F5C842)' : 'linear-gradient(160deg,#FEF3C7,#FBBF24CC)',
          borderRadius: 18, overflow: 'hidden',
          border:       `1.5px solid ${hov ? '#D97706' : '#F5C84280'}`,
          boxShadow:    hov ? '0 12px 36px rgba(245,200,66,0.45)' : '0 4px 14px rgba(245,200,66,0.25)',
          transition:   'all 0.2s', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', position: 'relative',
        }}>

        {/* Botão excluir */}
        <button
          onClick={e => { e.stopPropagation(); setShowDel(true) }}
          onMouseEnter={() => setHovDel(true)}
          onMouseLeave={() => setHovDel(false)}
          title="Excluir aluno"
          style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%', border: `2px solid ${hovDel ? '#7F1D1D' : '#991B1B'}`, background: hovDel ? '#7F1D1D' : '#B91C1C', color:'#fff', fontSize:16, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', zIndex:2, lineHeight:1, boxShadow: hovDel ? '0 0 0 4px rgba(153,27,27,0.25)' : '0 2px 8px rgba(153,27,27,0.5)' }}>
          ✕
        </button>

        {/* Topo */}
        <div style={{ padding: '16px 18px 14px', background: `linear-gradient(135deg,${g.bg},#FFFDF0)`, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#34D399' : '#CBD5E1', boxShadow: active ? '0 0 7px #34D399' : 'none' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: active ? '#065F46' : '#94A3B8' }}>
                {active ? 'Ativo' : 'Inativo'}
              </span>
              {!active && st.lastSeenDays < 999 && (
                <span style={{ fontSize: 10, color: YELLOW, fontWeight: 600 }}>· {st.lastSeenDays}d sem interagir</span>
              )}
            </div>
            <div style={{ textAlign: 'right', paddingRight: 26 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0D1B2A', lineHeight: 1 }}>{age ?? '—'}<span style={{ fontSize: 11, color: '#7C4A00', fontWeight: 600 }}> anos</span></div>
            </div>
          </div>

          {/* Nome grande */}
          <div style={{ fontSize: 19, fontWeight: 800, color: '#0D1B2A', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 8 }}>{st.name}</div>

          {/* Objetivo geral + específico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: st.objetivo_especifico ? 4 : 0 }}>
            <GoalBadge goal={st.goal} />
          </div>
          {st.objetivo_especifico && (
            <div style={{ fontSize: 12, color: '#5C3A00', opacity: 0.85, lineHeight: 1.4 }}>{st.objetivo_especifico}</div>
          )}
          {st.metrica_base && (
            <div style={{ marginTop: 6, display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.7)' }}>
              <span style={{ fontSize: 10, color: '#7C4A00', fontWeight:700, textTransform:'uppercase' }}>{st.metrica_base.label}:</span>
              <span style={{ fontSize: 12, color: '#431C00', fontWeight:800 }}>{st.metrica_base.value}</span>
            </div>
          )}
        </div>

        {/* Ofensiva */}
        <div style={{ padding: '12px 18px' }}>
          <div style={{ borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: streak.glow ? `0 0 12px ${streak.color}35` : 'none' }}>
            <span style={{ fontSize: 10, color: '#7C4A00', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Ofensiva</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: streak.color }}>{streak.display}{(st.streak || 0) > 0 && <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}> dias</span>}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.09)', background: hov ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.2s' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#431C00' }}>Acessar Ficha</span>
          <span style={{ fontSize: 13, color: '#431C00', transform: hov ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s', display: 'inline-block' }}>→</span>
        </div>
      </div>

      {showDel && (
        <ConfirmDeleteModal
          student={st}
          onClose={() => { setShowDel(false); setDeleting(false) }}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  )
}

// ── AddCard ────────────────────────────────────────────────────────────────
export function AddCard({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ borderRadius: 18, minHeight: 220, border: `2px dashed ${hov ? YELLOW : 'rgba(245,200,66,0.35)'}`, background: hov ? 'linear-gradient(135deg,rgba(245,200,66,0.12),rgba(245,158,11,0.06))' : 'linear-gradient(135deg,rgba(245,200,66,0.06),rgba(245,158,11,0.02))', boxShadow: hov ? '0 8px 28px rgba(245,200,66,0.15)' : 'none', transition: 'all 0.22s', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: hov ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(245,200,66,0.15)', border: `2px solid ${hov ? YELLOW : 'rgba(245,200,66,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#431C00', transition: 'all 0.22s', boxShadow: hov ? '0 0 20px rgba(245,200,66,0.35)' : 'none' }}>+</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: hov ? YELLOW : 'rgba(245,200,66,0.6)' }}>Adicionar Aluno</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Clique para cadastrar</div>
      </div>
    </div>
  )
}

export function NovoAlunoModal({ onSave, onClose, teacherId }) {
  const [step,     setStep]     = useState('plano')   // plano | form
  const [plano,    setPlano]    = useState('')
  const [token,    setToken]    = useState('')
  const [copied,   setCopied]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({
    name:'', age:'', weight:'', height:'',
    profissao:'', tipo_trabalho:'',
    historico_saude:'', historico_familiar:'',
    horas_sono:'', qualidade_sono:'',
    alimentacao:'', alcool_cigarro:'',
    motivacao_inicio:'',
    experiencia:'', limitacoes_desc:'',
    objetivo_estetico:'', dias_disponiveis:'',
    horario_preferido:'', local_treino:'',
    goal:'', level:'', sport:'', guardian_name:'', guardian_phone:'',
  })

  const f = (k,v) => setForm(p => ({ ...p, [k]: v }))

  // Gera token ao selecionar Aperfeiçoamento Físico
  const selecionarPlano = async (p) => {
    setPlano(p)
    if (p === 'academia' || p === 'ambos') {
      // Gera token no banco
      const { data } = await supabase.from('anamnese_tokens').insert([{
        teacher_id: teacherId, plano: p, status: 'pendente',
      }]).select('token').single()
      if (data) setToken(data.token)
    }
    setStep('form')
  }

  const copyLink = () => {
    const url = `${window.location.origin}/novo/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const isAcademiaOuAmbos = plano === 'academia' || plano === 'ambos'

    await criarAlunoPendente({
      teacherId,
      token: isAcademiaOuAmbos ? token : null,
      studentData: {
        name: form.name, age: +form.age || null,
        weight: +form.weight || null, height: +form.height || null,
        goal: form.goal || null, level: form.level || null,
        sport: plano === 'escolinha' || plano === 'ambos' ? form.sport : null,
        guardian_name: form.guardian_name || null, guardian_phone: form.guardian_phone || null,
        plano: plano,
      },
      anamneseData: isAcademiaOuAmbos ? {
        profissao: form.profissao, tipo_trabalho: form.tipo_trabalho,
        historico_saude: form.historico_saude, historico_familiar: form.historico_familiar,
        horas_sono: form.horas_sono, qualidade_sono: form.qualidade_sono,
        alimentacao: form.alimentacao, alcool_cigarro: form.alcool_cigarro,
        motivacao_inicio: form.motivacao_inicio,
        historico: form.experiencia,
        limitacao_detalhe: form.limitacoes_desc,
        objetivo_estetico: form.objetivo_estetico,
        dias_disponiveis: form.dias_disponiveis,
        horario_preferido: form.horario_preferido,
        local_treino: form.local_treino,
      } : null,
      notifPayload: {
        titulo: 'Novo aluno cadastrado',
        corpo: `${form.name} foi cadastrado e aguarda confirmação.`,
        payload: { nome: form.name, objetivo: form.goal },
      },
    })

    setSaving(false)
    onSave()
    onClose()
  }

  const inp = { width:'100%', background:'#0D1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:10 }
  const lbl = { fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4, display:'block' }
  const sec = (t) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0 12px' }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{t}</span>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
    </div>
  )

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#080F1A', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* ── STEP: Seleção de plano ── */}
        {step === 'plano' && (
          <div style={{ padding:32 }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F0', marginBottom:6 }}>Novo Aluno</div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:28 }}>Selecione o tipo de programa</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { id:'academia', label:'Aperfeiçoamento Físico', cor:'#3B82F6', desc:'Academia, funcional, cardio' },
                { id:'ambos',    label:'Ambos',                  cor:'#A855F7', desc:'Academia + Escolinha' },
                { id:'escolinha',label:'Escolinha',              cor:'#22C55E', desc:'Esporte infantil e juvenil' },
              ].map(p => (
                <button key={p.id} onClick={() => selecionarPlano(p.id)}
                  style={{ padding:'20px 12px', borderRadius:14, border:`2px solid ${p.cor}30`, background:`${p.cor}0D`, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, fontFamily:'inherit', transition:'all 0.15s' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:p.cor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:p.cor, textAlign:'center', lineHeight:1.3 }}>{p.label}</div>
                  <div style={{ fontSize:10, color:'#475569', textAlign:'center' }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: Formulário ── */}
        {step === 'form' && (
          <div>
            {/* Header fixo */}
            <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, background:'#080F1A', zIndex:10 }}>
              <button onClick={() => setStep('plano')} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18, lineHeight:1 }}>‹</button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#E2E8F0' }}>
                  {plano==='academia'?'Aperfeiçoamento Físico':plano==='escolinha'?'Escolinha':'Ambos'}
                </div>
              </div>
              {/* Link token para academia/ambos */}
              {token && (
                <button onClick={copyLink}
                  style={{ padding:'7px 14px', borderRadius:9, border:'1px solid rgba(59,130,246,0.35)', background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(59,130,246,0.1)', color: copied ? '#34D399' : '#60A5FA', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  {copied ? 'Copiado!' : 'Copiar link da anamnese'}
                </button>
              )}
            </div>

            <div style={{ padding:'18px 22px' }}>

              {/* ── Dados básicos ── */}
              {sec('Dados Pessoais')}
              <div>
                <label style={lbl}>Nome completo *</label>
                <input style={inp} placeholder="Ex: João Silva" value={form.name} onChange={e=>f('name',e.target.value)} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <div><label style={lbl}>Idade</label><input style={inp} type="number" placeholder="Anos" value={form.age} onChange={e=>f('age',e.target.value)} /></div>
                <div><label style={lbl}>Peso (kg)</label><input style={inp} type="number" placeholder="Ex: 75" value={form.weight} onChange={e=>f('weight',e.target.value)} /></div>
                <div><label style={lbl}>Altura (cm)</label><input style={inp} type="number" placeholder="Ex: 175" value={form.height} onChange={e=>f('height',e.target.value)} /></div>
              </div>

              {(plano === 'academia' || plano === 'ambos') && (<>
                {sec('Quem é Você')}

                <label style={lbl}>Profissão e tipo de trabalho</label>
                <input style={inp} placeholder="Ex: Vendedor — fico em pé o dia todo" value={form.profissao} onChange={e=>f('profissao',e.target.value)} />

                <label style={lbl}>Histórico de saúde</label>
                <input style={inp} placeholder="Condições, cirurgias, medicamentos contínuos (ou 'Nenhum')" value={form.historico_saude} onChange={e=>f('historico_saude',e.target.value)} />

                <label style={lbl}>Histórico familiar</label>
                <input style={inp} placeholder="Pai/mãe/irmão com problema cardíaco, diabetes, hipertensão?" value={form.historico_familiar} onChange={e=>f('historico_familiar',e.target.value)} />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div><label style={lbl}>Horas de sono por noite</label><input style={inp} placeholder="Ex: 6–7 horas" value={form.horas_sono} onChange={e=>f('horas_sono',e.target.value)} /></div>
                  <div>
                    <label style={lbl}>Qualidade do sono</label>
                    <select style={inp} value={form.qualidade_sono} onChange={e=>f('qualidade_sono',e.target.value)}>
                      <option value="">Selecione</option>
                      {['Ótima','Boa','Regular','Ruim'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <label style={lbl}>Como descreve sua alimentação hoje</label>
                <input style={inp} placeholder="Quantas refeições, come bem, come mal, sem tempo..." value={form.alimentacao} onChange={e=>f('alimentacao',e.target.value)} />

                <label style={lbl}>Uso de álcool, cigarro ou fumaça em geral</label>
                <input style={inp} placeholder="Ex: Bebo socialmente nos fins de semana / Não fumo" value={form.alcool_cigarro} onChange={e=>f('alcool_cigarro',e.target.value)} />

                <label style={lbl}>O que te fez decidir começar agora?</label>
                <textarea style={{ ...inp, minHeight:65, resize:'vertical', lineHeight:1.6 }} placeholder="Conta um pouco sobre o que motivou essa decisão..." value={form.motivacao_inicio} onChange={e=>f('motivacao_inicio',e.target.value)} />

                {sec('O Que Você Quer')}

                <label style={lbl}>Experiência com exercício físico</label>
                <input style={inp} placeholder="Já praticou? O quê, por quanto tempo, por que parou?" value={form.experiencia} onChange={e=>f('experiencia',e.target.value)} />

                <label style={lbl}>Limitação física ou dor recorrente</label>
                <input style={inp} placeholder="Joelho, ombro, coluna... (ou 'Nenhuma')" value={form.limitacoes_desc} onChange={e=>f('limitacoes_desc',e.target.value)} />

                <label style={lbl}>Objetivo e estética que almeja</label>
                <textarea style={{ ...inp, minHeight:65, resize:'vertical', lineHeight:1.6 }} placeholder="Quando imagina o corpo que quer ter, como ele é? Seja específico." value={form.objetivo_estetico} onChange={e=>f('objetivo_estetico',e.target.value)} />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div><label style={lbl}>Dias disponíveis para treinar</label><input style={inp} placeholder="Ex: 3x / semana" value={form.dias_disponiveis} onChange={e=>f('dias_disponiveis',e.target.value)} /></div>
                  <div>
                    <label style={lbl}>Horário preferido</label>
                    <select style={inp} value={form.horario_preferido} onChange={e=>f('horario_preferido',e.target.value)}>
                      <option value="">Selecione</option>
                      {['Manhã','Tarde','Noite','Qualquer'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <label style={lbl}>Onde prefere treinar</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {['Academia','Ao ar livre','Em casa','Sem preferência'].map(o => (
                    <button key={o} onClick={() => f('local_treino', form.local_treino===o?'':o)}
                      style={{ padding:'6px 13px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${form.local_treino===o?'#3B82F6':'rgba(255,255,255,0.1)'}`, background:form.local_treino===o?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.04)', color:form.local_treino===o?'#60A5FA':'#475569' }}>
                      {o}
                    </button>
                  ))}
                </div>

                <label style={lbl}>Objetivo geral</label>
                <select style={inp} value={form.goal} onChange={e=>f('goal',e.target.value)}>
                  <option value="">Selecione</option>
                  {['Ganho de Massa','Emagrecimento','Força e Performance','Condicionamento','Saúde e Bem-Estar'].map(o=><option key={o}>{o}</option>)}
                </select>

                <label style={lbl}>Nível</label>
                <select style={inp} value={form.level} onChange={e=>f('level',e.target.value)}>
                  <option value="">Selecione</option>
                  {['Iniciante','Intermediário','Avançado'].map(o=><option key={o}>{o}</option>)}
                </select>
              </>)}

              {(plano === 'escolinha' || plano === 'ambos') && (<>
                {sec('Dados da Escolinha')}
                <label style={lbl}>Modalidade</label>
                <select style={inp} value={form.sport} onChange={e=>f('sport',e.target.value)}>
                  <option value="">Selecione</option>
                  {SPORTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <label style={lbl}>Nome do responsável</label>
                <input style={inp} placeholder="Ex: Maria Silva" value={form.guardian_name} onChange={e=>f('guardian_name',e.target.value)} />
                <label style={lbl}>WhatsApp do responsável</label>
                <input style={inp} placeholder="(41) 99999-9999" value={form.guardian_phone} onChange={e=>f('guardian_phone',e.target.value)} />
              </>)}

              <div style={{ display:'flex', gap:8, marginTop:18 }}>
                <button onClick={save} disabled={saving||!form.name.trim()}
                  style={{ flex:1, padding:'13px', borderRadius:12, border:'none', cursor: form.name.trim()?'pointer':'default', background: form.name.trim()?'#3B82F6':'rgba(255,255,255,0.06)', color: form.name.trim()?'#fff':'#334155', fontWeight:800, fontSize:14, fontFamily:'inherit' }}>
                  {saving?'Salvando...':'Criar Aluno'}
                </button>
                <button onClick={onClose} style={{ padding:'13px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#475569', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
