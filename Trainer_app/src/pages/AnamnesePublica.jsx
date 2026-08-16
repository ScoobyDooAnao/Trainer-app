import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── Design tokens (mesmos do StudentView) ────────────────────────────────────
const BG   = '#080F1A'
const SURF = '#0D1117'
const SURF2= '#111827'
const BRD  = 'rgba(255,255,255,0.07)'
const TEXT = '#E2E8F0'
const SUB  = '#64748B'
const DIM  = '#334155'
const BLUE = '#3B82F6'
const GREEN= '#22C55E'
const CARD = { background:SURF, borderRadius:16, padding:'20px 22px', border:`1px solid ${BRD}`, marginBottom:14 }
const INP  = { width:'100%', background:SURF2, border:`1px solid ${BRD}`, borderRadius:10, padding:'11px 14px', color:TEXT, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

// ── Chip clicável ─────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick, color }) {
  const c = color || BLUE
  return (
    <button type="button" onClick={onClick} style={{
      padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:600,
      cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s',
      border:`1.5px solid ${selected ? c : BRD}`,
      background: selected ? `${c}20` : SURF2,
      color: selected ? c : SUB,
    }}>{label}</button>
  )
}

// ── Campo com chips + complemento opcional ────────────────────────────────────
function ChipGroup({ options, value, onChange, multi=false, complement=false, complementLabel='', required=false, complementValue='', onComplementChange }) {
  const sel = multi ? (value || []) : value
  const toggle = (v) => {
    if (multi) {
      const arr = sel.includes(v) ? sel.filter(x=>x!==v) : [...sel, v]
      onChange(arr)
    } else {
      onChange(sel === v ? '' : v)
    }
  }
  const showComp = complement && (multi ? sel.length > 0 : !!sel)
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: showComp ? 10 : 0 }}>
        {options.map(o => (
          <Chip key={o} label={o}
            selected={multi ? sel.includes(o) : sel === o}
            onClick={() => toggle(o)} />
        ))}
      </div>
      {showComp && complementLabel && (
        <input style={{ ...INP, marginTop:4, fontSize:13 }}
          placeholder={complementLabel}
          value={complementValue} onChange={e => onComplementChange(e.target.value)} />
      )}
    </div>
  )
}

// ── Separador de seção ────────────────────────────────────────────────────────
function Sec({ title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 14px' }}>
      <div style={{ flex:1, height:1, background:BRD }} />
      <span style={{ fontSize:10, color:DIM, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:1, background:BRD }} />
    </div>
  )
}

// ── Label com asterisco obrigatório ───────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize:11, color:SUB, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
      {children}
      {required && <span style={{ color:'#F87171', fontSize:13 }}>*</span>}
    </div>
  )
}

// ── Cálculo de IMC ────────────────────────────────────────────────────────────
function calcIMC(peso, altura) {
  const p = parseFloat(peso), h = parseFloat(altura) / 100
  if (!p || !h || h === 0) return null
  const imc = p / (h * h)
  const cat = imc < 18.5 ? 'Abaixo do peso'
    : imc < 25 ? 'Peso normal'
    : imc < 30 ? 'Sobrepeso'
    : 'Obesidade'
  return { valor: imc.toFixed(1), cat }
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AnamnesePublica({ token: tokenProp }) {
  const token = tokenProp || window.location.pathname.split('/novo/')[1]
  const [tokenData, setTokenData] = useState(null)
  const [status,    setStatus]    = useState('loading')
  const [step,      setStep]      = useState(1)
  const [saving,    setSaving]    = useState(false)
  const [errors,    setErrors]    = useState({})
  const topRef = useRef(null)

  // ── Estado do formulário ───────────────────────────────────────────────────
  const [D, setD] = useState({
    // Etapa 1 — Sobre você
    nome: '', whatsapp: '',
    faixa_etaria: '', rotina_trabalho: '', rotina_detalhe: '',
    // Etapa 2 — Medidas e saúde
    peso: '', altura: '',
    qualidade_sono: '', horas_sono: '',
    alcool_cigarro: [],  alcool_cigarro_detalhe: '',
    condicao_saude: [], condicao_saude_detalhe: '',
    limitacao: [], limitacao_detalhe: '',
    // Etapa 3 — Objetivos
    objetivo: '', objetivo_detalhe: '',
    dias_semana: '', horario: '', local_treino: [],
    // Etapa 4 — Histórico e motivação
    experiencia: '', experiencia_detalhe: '',
    motivacao: [], motivacao_detalhe: '',
  })

  const s = (k) => (v) => setD(p => ({ ...p, [k]: v }))

  // Validações por etapa
  const REQUIRED = {
    1: ['nome', 'faixa_etaria', 'rotina_trabalho'],
    2: ['peso', 'altura', 'qualidade_sono', 'horas_sono', 'alcool_cigarro', 'condicao_saude', 'limitacao'],
    3: ['objetivo', 'dias_semana', 'horario', 'local_treino'],
    4: ['experiencia', 'motivacao'],
  }

  const validate = () => {
    const errs = {}
    REQUIRED[step].forEach(k => {
      const v = D[k]
      if (!v || (Array.isArray(v) && v.length === 0) || v === '') errs[k] = true
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (!validate()) {
      topRef.current?.scrollIntoView({ behavior:'smooth' })
      return
    }
    setStep(p => p + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => { setStep(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    supabase.from('anamnese_tokens').select('*')
      .eq('token', token).eq('status', 'pendente').single()
      .then(({ data }) => {
        if (!data) { setStatus('invalid'); return }
        setTokenData(data)
        setStatus('form')
      })
  }, [token])

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    const { data: aluno } = await supabase.from('students').insert([{
      teacher_id: tokenData.teacher_id,
      name: D.nome, plano: tokenData.plano,
      weight: +D.peso || null, height: +D.altura || null,
    }]).select().single()

    if (aluno) {
      await supabase.from('anamnese').upsert([{
        student_id: aluno.id, teacher_id: tokenData.teacher_id,
        historico_saude: [
          ...(D.condicao_saude || []),
          D.condicao_saude_detalhe ? `Obs: ${D.condicao_saude_detalhe}` : ''
        ].filter(Boolean).join(', '),
        alcool_cigarro: [...(D.alcool_cigarro||[]), D.alcool_cigarro_detalhe].filter(Boolean).join(', '),
        limitacao_detalhe: [...(D.limitacao||[]), D.limitacao_detalhe].filter(Boolean).join(', '),
        horas_sono: D.horas_sono,
        qualidade_sono: D.qualidade_sono,
        objetivo_estetico: [D.objetivo, D.objetivo_detalhe].filter(Boolean).join(' — '),
        dias_disponiveis: D.dias_semana,
        horario_preferido: D.horario,
        local_treino: (D.local_treino||[]).join(', '),
        historico: [D.experiencia, D.experiencia_detalhe].filter(Boolean).join(' — '),
        motivacao_inicio: [...(D.motivacao||[]), D.motivacao_detalhe].filter(Boolean).join(', '),
        profissao: [D.rotina_trabalho, D.rotina_detalhe].filter(Boolean).join(' — '),
        parq: { faixa_etaria: D.faixa_etaria },
      }], { onConflict: 'student_id' })

      await supabase.from('anamnese_tokens').update({
        student_id: aluno.id, status: 'respondido',
        respondido_em: new Date().toISOString(),
      }).eq('token', token)
    }
    setSaving(false)
    setStatus('success')
  }

  const imc = calcIMC(D.peso, D.altura)
  const pct = (step / 4) * 100

  // ── Estados especiais ──────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', color:SUB, fontFamily:"'DM Sans',sans-serif", fontSize:15 }}>
      Carregando...
    </div>
  )

  if (status === 'invalid') return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#F87171"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:8 }}>Link indisponivel</div>
        <div style={{ fontSize:14, color:SUB, lineHeight:1.7 }}>Este link ja foi utilizado ou nao e valido. Solicite um novo link ao seu professor.</div>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill={GREEN}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:TEXT, marginBottom:10 }}>Anamnese recebida</div>
        <div style={{ fontSize:14, color:SUB, lineHeight:1.8 }}>
          Suas informacoes foram registradas com sucesso.<br/>
          Seu professor ira analisar e entrar em contato com seu programa personalizado em breve.
        </div>
      </div>
    </div>
  )

  const errStyle = (k) => errors[k] ? { outline:`1.5px solid #F87171` } : {}
  const chipErr  = (k) => errors[k] ? <div style={{ fontSize:11, color:'#F87171', marginTop:4 }}>Campo obrigatorio</div> : null

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:"'DM Sans','Segoe UI',sans-serif" }} ref={topRef}>

      {/* Header fixo */}
      <div style={{ background:SURF, borderBottom:`1px solid ${BRD}`, padding:'13px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:TEXT }}>Anamnese Inicial</div>
            <div style={{ fontSize:11, color:SUB }}>Etapa {step} de 4</div>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:BLUE }}>{Math.round(pct)}% concluido</div>
        </div>
        {/* Barra de progresso */}
        <div style={{ maxWidth:560, margin:'10px auto 0', height:3, background:BRD, borderRadius:99, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:BLUE, transition:'width 0.4s', borderRadius:99 }} />
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'22px 16px 48px' }}>

        {/* ══ ETAPA 1 — Sobre voce ══════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:4 }}>Sobre voce</div>
              <div style={{ fontSize:13, color:SUB }}>Informacoes iniciais para personalizarmos seu programa</div>
            </div>

            <div style={CARD}>
              <Sec title="Identificacao" />
              <Label required>Nome completo</Label>
              <input style={{ ...INP, ...errStyle('nome') }}
                placeholder="Seu nome completo"
                value={D.nome} onChange={e => s('nome')(e.target.value)} />
              {errors.nome && <div style={{ fontSize:11, color:'#F87171', marginBottom:8 }}>Campo obrigatorio</div>}

              <div style={{ marginTop:14 }}>
                <Label>WhatsApp</Label>
                <input style={INP} placeholder="(00) 00000-0000"
                  value={D.whatsapp} onChange={e => s('whatsapp')(e.target.value)} />
              </div>
            </div>

            <div style={CARD}>
              <Sec title="Faixa etaria" />
              <Label required>Qual a sua faixa de idade?</Label>
              <ChipGroup
                options={['Ate 17 anos','18 a 25','26 a 35','36 a 45','46 a 55','56 ou mais']}
                value={D.faixa_etaria} onChange={s('faixa_etaria')} />
              {chipErr('faixa_etaria')}
            </div>

            <div style={CARD}>
              <Sec title="Rotina de trabalho" />
              <Label required>Como e seu dia de trabalho?</Label>
              <ChipGroup
                options={['Trabalho sentado a maior parte do dia','Fico em pe ou caminho muito','Esforco fisico moderado','Esforco fisico intenso','Nao trabalho atualmente']}
                value={D.rotina_trabalho} onChange={s('rotina_trabalho')}
                complement complementLabel="Detalhe se quiser (cargo, setor...)"
                complementValue={D.rotina_detalhe} onComplementChange={s('rotina_detalhe')} />
              {chipErr('rotina_trabalho')}
            </div>
          </div>
        )}

        {/* ══ ETAPA 2 — Medidas e saude ════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:4 }}>Medidas e saude</div>
              <div style={{ fontSize:13, color:SUB }}>Dados que guiam a prescricao do seu programa</div>
            </div>

            <div style={CARD}>
              <Sec title="Medidas corporais" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom: imc ? 12 : 0 }}>
                <div>
                  <Label required>Peso atual (kg)</Label>
                  <input style={{ ...INP, ...errStyle('peso') }} type="number"
                    placeholder="Ex: 75" value={D.peso} onChange={e => s('peso')(e.target.value)} />
                </div>
                <div>
                  <Label required>Altura (cm)</Label>
                  <input style={{ ...INP, ...errStyle('altura') }} type="number"
                    placeholder="Ex: 175" value={D.altura} onChange={e => s('altura')(e.target.value)} />
                </div>
              </div>
              {imc && (
                <div style={{ padding:'10px 14px', background: imc.cat==='Peso normal' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border:`1px solid ${imc.cat==='Peso normal' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:SUB }}>IMC calculado</span>
                  <span style={{ fontSize:13, fontWeight:700, color: imc.cat==='Peso normal' ? GREEN : '#F59E0B' }}>{imc.valor} — {imc.cat}</span>
                </div>
              )}
            </div>

            <div style={CARD}>
              <Sec title="Sono" />
              <Label required>Como voce classifica seu sono?</Label>
              <ChipGroup
                options={['Durmo bem e acordo descansado','Durmo mal ou insuficiente','Tenho insonia frequente','Muito irregular']}
                value={D.qualidade_sono} onChange={s('qualidade_sono')} />
              {chipErr('qualidade_sono')}

              <div style={{ marginTop:14 }}>
                <Label required>Quantas horas dorme por noite?</Label>
                <ChipGroup
                  options={['Menos de 5h','5 a 6h','6 a 7h','7 a 8h','Mais de 8h']}
                  value={D.horas_sono} onChange={s('horas_sono')} />
                {chipErr('horas_sono')}
              </div>
            </div>

            <div style={CARD}>
              <Sec title="Habitos" />
              <Label required>Uso de alcool ou tabaco</Label>
              <ChipGroup multi
                options={['Nao uso nenhum','Bebo socialmente','Bebo com frequencia','Fumo','Uso de forma ocasional']}
                value={D.alcool_cigarro} onChange={s('alcool_cigarro')}
                complement complementLabel="Detalhe se quiser"
                complementValue={D.alcool_cigarro_detalhe} onComplementChange={s('alcool_cigarro_detalhe')} />
              {chipErr('alcool_cigarro')}
            </div>

            <div style={CARD}>
              <Sec title="Saude" />
              <Label required>Condicao de saude diagnosticada</Label>
              <ChipGroup multi
                options={['Nenhuma','Hipertensao','Diabetes','Problema cardiaco','Osteoporose','Artrite ou artrose','Hernia de disco','Outra']}
                value={D.condicao_saude} onChange={s('condicao_saude')}
                complement complementLabel="Especifique medicamentos, cirurgias ou outras condicoes"
                complementValue={D.condicao_saude_detalhe} onComplementChange={s('condicao_saude_detalhe')} />
              {chipErr('condicao_saude')}

              <div style={{ marginTop:16 }}>
                <Label required>Limitacao fisica ou dor recorrente</Label>
                <ChipGroup multi
                  options={['Nenhuma','Ombro','Coluna lombar','Coluna cervical','Joelho','Quadril','Tornozelo','Punho ou cotovelo','Outra regiao']}
                  value={D.limitacao} onChange={s('limitacao')}
                  complement complementLabel="Descreva a limitacao com mais detalhes"
                  complementValue={D.limitacao_detalhe} onComplementChange={s('limitacao_detalhe')} />
                {chipErr('limitacao')}
              </div>
            </div>
          </div>
        )}

        {/* ══ ETAPA 3 — Objetivos ══════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:4 }}>Seus objetivos</div>
              <div style={{ fontSize:13, color:SUB }}>O que voce quer alcançar com seu programa de treino</div>
            </div>

            <div style={CARD}>
              <Sec title="Objetivo principal" />
              <Label required>Qual desses descreve melhor o que voce busca?</Label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom: D.objetivo ? 12 : 0 }}>
                {[
                  { id:'emagrecimento', label:'Perder gordura e definir o corpo', desc:'Reducao de peso com manutencao ou ganho de musculo' },
                  { id:'massa',         label:'Ganhar musculo e volume',           desc:'Hipertrofia com foco em tamanho e forca' },
                  { id:'saude',         label:'Saude, energia e disposicao',       desc:'Melhora da qualidade de vida e condicionamento geral' },
                  { id:'performance',   label:'Performance e atletismo',           desc:'Forca, potencia ou preparacao para esporte' },
                ].map(o => (
                  <div key={o.id} onClick={() => s('objetivo')(D.objetivo===o.id?'':o.id)}
                    style={{ padding:'12px 16px', borderRadius:12, border:`1.5px solid ${D.objetivo===o.id ? BLUE : BRD}`, background:D.objetivo===o.id ? `${BLUE}12` : SURF2, cursor:'pointer', transition:'all 0.12s' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:D.objetivo===o.id ? BLUE : TEXT, marginBottom:2 }}>{o.label}</div>
                    <div style={{ fontSize:11, color:SUB }}>{o.desc}</div>
                  </div>
                ))}
              </div>
              {errors.objetivo && <div style={{ fontSize:11, color:'#F87171', marginTop:4 }}>Selecione uma opcao</div>}
              {D.objetivo && (
                <div style={{ marginTop:12 }}>
                  <Label>Descreva como voce imagina o resultado (opcional)</Label>
                  <textarea style={{ ...INP, minHeight:70, resize:'vertical', lineHeight:1.7 }}
                    placeholder="Ex: quero perder 8kg e ter o abdomen definido ate dezembro..."
                    value={D.objetivo_detalhe} onChange={e => s('objetivo_detalhe')(e.target.value)} />
                </div>
              )}
            </div>

            <div style={CARD}>
              <Sec title="Disponibilidade" />
              <Label required>Quantos dias por semana voce consegue treinar?</Label>
              <ChipGroup
                options={['2 dias','3 dias','4 dias','5 dias ou mais']}
                value={D.dias_semana} onChange={s('dias_semana')} />
              {chipErr('dias_semana')}

              <div style={{ marginTop:16 }}>
                <Label required>Qual horario prefere treinar?</Label>
                <ChipGroup
                  options={['Manha','Tarde','Noite','Qualquer horario']}
                  value={D.horario} onChange={s('horario')} />
                {chipErr('horario')}
              </div>

              <div style={{ marginTop:16 }}>
                <Label required>Onde prefere treinar?</Label>
                <ChipGroup multi
                  options={['Academia','Ao ar livre','Em casa','Sem preferencia']}
                  value={D.local_treino} onChange={s('local_treino')} />
                {chipErr('local_treino')}
              </div>
            </div>
          </div>
        )}

        {/* ══ ETAPA 4 — Historico e motivacao ═════════════════════════════ */}
        {step === 4 && (
          <div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:4 }}>Historico e motivacao</div>
              <div style={{ fontSize:13, color:SUB }}>Ultima etapa — conte um pouco sobre sua trajetoria</div>
            </div>

            <div style={CARD}>
              <Sec title="Experiencia com exercicio" />
              <Label required>Como voce se descreve em relacao ao exercicio fisico?</Label>
              <ChipGroup
                options={['Nunca pratiquei exercicio','Ja pratiquei mas parei ha mais de 6 meses','Ja pratiquei mas parei ha menos de 6 meses','Pratico atualmente de forma irregular','Pratico regularmente']}
                value={D.experiencia} onChange={s('experiencia')}
                complement complementLabel="O que praticou? Por quanto tempo? Por que parou?"
                complementValue={D.experiencia_detalhe} onComplementChange={s('experiencia_detalhe')} />
              {chipErr('experiencia')}
            </div>

            <div style={CARD}>
              <Sec title="Motivacao" />
              <Label required>O que te fez buscar um programa de treino agora?</Label>
              <ChipGroup multi
                options={['Insatisfacao com meu corpo atual','Recomendacao medica ou de saude','Tenho um evento ou data importante','Indicacao de alguem que obteve resultado','Quero mais energia e disposicao no dia a dia','Decidi que e hora de mudar']}
                value={D.motivacao} onChange={s('motivacao')}
                complement complementLabel="Conte mais se quiser (opcional)"
                complementValue={D.motivacao_detalhe} onComplementChange={s('motivacao_detalhe')} />
              {chipErr('motivacao')}
            </div>

            {/* Resumo antes de enviar */}
            <div style={{ ...CARD, border:`1px solid rgba(34,197,94,0.2)`, background:'rgba(34,197,94,0.04)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:GREEN, marginBottom:8 }}>Pronto para enviar</div>
              <div style={{ fontSize:12, color:SUB, lineHeight:1.7 }}>
                Ao clicar em Enviar, suas respostas serao registradas e seu professor ira recebe-las imediatamente para montar seu programa personalizado.
              </div>
            </div>
          </div>
        )}

        {/* ── Botoes de navegacao ──────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          {step > 1 && (
            <button onClick={back}
              style={{ padding:'13px 20px', borderRadius:12, border:`1px solid ${BRD}`, background:'transparent', color:SUB, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              Voltar
            </button>
          )}
          {step < 4 ? (
            <button onClick={next}
              style={{ flex:1, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', background:BLUE, color:'#fff', fontWeight:800, fontSize:15, fontFamily:'inherit' }}>
              Continuar
            </button>
          ) : (
            <button onClick={submit} disabled={saving}
              style={{ flex:1, padding:'13px', borderRadius:12, border:'none', cursor:saving?'wait':'pointer', background:saving?DIM:GREEN, color:'#fff', fontWeight:800, fontSize:15, fontFamily:'inherit' }}>
              {saving ? 'Enviando...' : 'Enviar Anamnese'}
            </button>
          )}
        </div>

        {/* Campos obrigatorios */}
        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop:10, fontSize:12, color:'#F87171', textAlign:'center' }}>
            Preencha todos os campos obrigatorios antes de continuar.
          </div>
        )}
      </div>
    </div>
  )
}
