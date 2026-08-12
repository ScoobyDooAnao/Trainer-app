import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const INP = { width:'100%', background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#E2E8F0', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:12 }
const LBL = { fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5, display:'block' }
const CARD = { background:'#0D1117', borderRadius:16, padding:'20px 22px', border:'1px solid rgba(255,255,255,0.07)', marginBottom:12 }

const SEC = ({ title }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 14px' }}>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
    <span style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
  </div>
)

export default function AnamnesePublica() {
  const token = window.location.pathname.split('/novo/')[1]
  const [tokenData, setTokenData] = useState(null)
  const [status,    setStatus]    = useState('loading') // loading | form | success | invalid
  const [saving,    setSaving]    = useState(false)
  const [step,      setStep]      = useState(1)

  const [form, setForm] = useState({
    name:'', age:'', weight:'', height:'',
    profissao:'', historico_saude:'', historico_familiar:'',
    horas_sono:'', qualidade_sono:'',
    alimentacao:'', alcool_cigarro:'', motivacao_inicio:'',
    experiencia:'', limitacoes_desc:'',
    objetivo_estetico:'', dias_disponiveis:'',
    horario_preferido:'', local_treino:'',
  })

  const f = (k,v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    supabase.from('anamnese_tokens').select('*').eq('token', token).eq('status','pendente').single()
      .then(({ data }) => {
        if (!data) { setStatus('invalid'); return }
        setTokenData(data)
        setStatus('form')
      })
  }, [token])

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    // Cria aluno
    const { data: aluno } = await supabase.from('students').insert([{
      teacher_id: tokenData.teacher_id,
      name: form.name, age: +form.age || null,
      weight: +form.weight || null, height: +form.height || null,
      plano: tokenData.plano,
    }]).select().single()

    if (aluno) {
      // Salva anamnese
      await supabase.from('anamnese').upsert([{
        student_id: aluno.id, teacher_id: tokenData.teacher_id,
        profissao: form.profissao,
        historico_saude: form.historico_saude,
        historico_familiar: form.historico_familiar,
        horas_sono: form.horas_sono, qualidade_sono: form.qualidade_sono,
        alimentacao: form.alimentacao, alcool_cigarro: form.alcool_cigarro,
        motivacao_inicio: form.motivacao_inicio,
        historico: form.experiencia,
        limitacao_detalhe: form.limitacoes_desc,
        objetivo_estetico: form.objetivo_estetico,
        dias_disponiveis: form.dias_disponiveis,
        horario_preferido: form.horario_preferido,
        local_treino: form.local_treino,
      }], { onConflict: 'student_id' })

      // Atualiza token
      await supabase.from('anamnese_tokens').update({
        student_id: aluno.id, status: 'respondido',
        respondido_em: new Date().toISOString(),
      }).eq('token', token)
    }

    setSaving(false)
    setStatus('success')
  }

  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#080F1A', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:"'DM Sans',sans-serif" }}>
      Carregando...
    </div>
  )

  if (status === 'invalid') return (
    <div style={{ minHeight:'100vh', background:'#080F1A', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:16, opacity:0.4 }}>—</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F0', marginBottom:8 }}>Link inválido ou já utilizado</div>
        <div style={{ fontSize:14, color:'#64748B', lineHeight:1.6 }}>Este link de anamnese não está disponível. Solicite um novo link ao seu professor.</div>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div style={{ minHeight:'100vh', background:'#080F1A', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#22C55E', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:'#E2E8F0', marginBottom:8 }}>Anamnese enviada!</div>
        <div style={{ fontSize:14, color:'#64748B', lineHeight:1.7 }}>
          Seus dados foram recebidos com sucesso. Seu professor irá analisar e entrar em contato em breve com seu programa personalizado.
        </div>
      </div>
    </div>
  )

  const progressPct = step === 1 ? 50 : 100

  return (
    <div style={{ minHeight:'100vh', background:'#080F1A', fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background:'#0D1117', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'14px 20px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#E2E8F0' }}>Anamnese Inicial</div>
          <div style={{ fontSize:11, color:'#475569' }}>Preencha com calma — leva cerca de 3 minutos</div>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6' }}>Parte {step} de 2</div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:'rgba(255,255,255,0.05)' }}>
        <div style={{ height:'100%', width:`${progressPct}%`, background:'#3B82F6', transition:'width 0.4s' }} />
      </div>

      <div style={{ maxWidth:540, margin:'0 auto', padding:'20px 16px 40px' }}>

        {/* ── PARTE 1: Quem é você ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F0', marginBottom:4 }}>Quem é você</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>Conte um pouco sobre sua vida para personalizarmos seu programa</div>

            <div style={CARD}>
              <SEC title="Dados Pessoais" />
              <label style={LBL}>Seu nome completo *</label>
              <input style={INP} placeholder="Ex: João Silva" value={form.name} onChange={e=>f('name',e.target.value)} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <div><label style={LBL}>Idade</label><input style={INP} type="number" placeholder="Anos" value={form.age} onChange={e=>f('age',e.target.value)} /></div>
                <div><label style={LBL}>Peso (kg)</label><input style={INP} type="number" placeholder="75" value={form.weight} onChange={e=>f('weight',e.target.value)} /></div>
                <div><label style={LBL}>Altura (cm)</label><input style={INP} type="number" placeholder="175" value={form.height} onChange={e=>f('height',e.target.value)} /></div>
              </div>

              <SEC title="Trabalho e Rotina" />
              <label style={LBL}>Profissão e tipo de trabalho</label>
              <input style={INP} placeholder="Ex: Analista — fico sentado 8h por dia" value={form.profissao} onChange={e=>f('profissao',e.target.value)} />

              <SEC title="Saúde" />
              <label style={LBL}>Histórico de saúde pessoal</label>
              <input style={INP} placeholder="Condições, cirurgias, medicamentos (ou 'Nenhum')" value={form.historico_saude} onChange={e=>f('historico_saude',e.target.value)} />
              <label style={LBL}>Histórico familiar</label>
              <input style={INP} placeholder="Pai/mãe/irmão com problema cardíaco, diabetes, hipertensão?" value={form.historico_familiar} onChange={e=>f('historico_familiar',e.target.value)} />

              <SEC title="Sono" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><label style={LBL}>Horas de sono por noite</label><input style={INP} placeholder="Ex: 6–7h" value={form.horas_sono} onChange={e=>f('horas_sono',e.target.value)} /></div>
                <div>
                  <label style={LBL}>Qualidade do sono</label>
                  <select style={INP} value={form.qualidade_sono} onChange={e=>f('qualidade_sono',e.target.value)}>
                    <option value="">Selecione</option>
                    {['Ótima','Boa','Regular','Ruim'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <SEC title="Alimentação e Hábitos" />
              <label style={LBL}>Como descreve sua alimentação hoje</label>
              <input style={INP} placeholder="Quantas refeições, come bem, come mal, sem tempo..." value={form.alimentacao} onChange={e=>f('alimentacao',e.target.value)} />
              <label style={LBL}>Uso de álcool, cigarro ou fumaça em geral</label>
              <input style={INP} placeholder="Ex: Bebo socialmente / Não fumo / Fumo ocasionalmente" value={form.alcool_cigarro} onChange={e=>f('alcool_cigarro',e.target.value)} />

              <SEC title="Motivação" />
              <label style={LBL}>O que te fez decidir começar agora?</label>
              <textarea style={{ ...INP, minHeight:70, resize:'vertical', lineHeight:1.7, marginBottom:0 }}
                placeholder="Conta um pouco sobre o que motivou essa decisão..."
                value={form.motivacao_inicio} onChange={e=>f('motivacao_inicio',e.target.value)} />
            </div>

            <button onClick={() => setStep(2)} disabled={!form.name.trim()}
              style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', cursor:form.name.trim()?'pointer':'default', background:form.name.trim()?'#3B82F6':'rgba(255,255,255,0.06)', color:form.name.trim()?'#fff':'#334155', fontWeight:800, fontSize:15, fontFamily:'inherit' }}>
              Próximo →
            </button>
          </div>
        )}

        {/* ── PARTE 2: O que você quer ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F0', marginBottom:4 }}>O que você quer</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>Agora nos conta sobre seus objetivos e preferências de treino</div>

            <div style={CARD}>
              <SEC title="Histórico de Exercício" />
              <label style={LBL}>Já praticou exercício físico antes?</label>
              <textarea style={{ ...INP, minHeight:65, resize:'vertical', lineHeight:1.7 }}
                placeholder="O quê, por quanto tempo, por que parou? (ou 'Nunca pratiquei')"
                value={form.experiencia} onChange={e=>f('experiencia',e.target.value)} />

              <label style={LBL}>Limitação física ou dor recorrente</label>
              <input style={INP} placeholder="Joelho, ombro, coluna... (ou 'Nenhuma')" value={form.limitacoes_desc} onChange={e=>f('limitacoes_desc',e.target.value)} />

              <SEC title="Seus Objetivos" />
              <label style={LBL}>Objetivo e estética que almeja</label>
              <textarea style={{ ...INP, minHeight:80, resize:'vertical', lineHeight:1.7 }}
                placeholder="Quando imagina o corpo que quer ter, como ele é? Seja específico — corpo seco, ganhar volume, mais disposição..."
                value={form.objetivo_estetico} onChange={e=>f('objetivo_estetico',e.target.value)} />

              <SEC title="Disponibilidade" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><label style={LBL}>Dias por semana para treinar</label><input style={INP} placeholder="Ex: 3x" value={form.dias_disponiveis} onChange={e=>f('dias_disponiveis',e.target.value)} /></div>
                <div>
                  <label style={LBL}>Horário preferido</label>
                  <select style={INP} value={form.horario_preferido} onChange={e=>f('horario_preferido',e.target.value)}>
                    <option value="">Selecione</option>
                    {['Manhã','Tarde','Noite','Qualquer'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <label style={LBL}>Onde prefere treinar</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                {['Academia','Ao ar livre','Em casa','Sem preferência'].map(o => (
                  <button key={o} onClick={() => f('local_treino', form.local_treino===o?'':o)}
                    style={{ padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${form.local_treino===o?'#3B82F6':'rgba(255,255,255,0.1)'}`, background:form.local_treino===o?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.04)', color:form.local_treino===o?'#60A5FA':'#475569' }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(1)}
                style={{ padding:'14px 20px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#64748B', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                ← Voltar
              </button>
              <button onClick={submit} disabled={saving || !form.objetivo_estetico.trim()}
                style={{ flex:1, padding:'14px', borderRadius:12, border:'none', cursor:'pointer', background: saving ? 'rgba(255,255,255,0.06)' : '#22C55E', color: saving ? '#334155' : '#fff', fontWeight:800, fontSize:15, fontFamily:'inherit' }}>
                {saving ? 'Enviando...' : 'Enviar Anamnese'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
