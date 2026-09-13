import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { criarAlunoPendente } from '../lib/alunos'

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

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:600,
      cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s',
      border:`1.5px solid ${selected ? BLUE : BRD}`,
      background: selected ? `${BLUE}20` : SURF2,
      color: selected ? BLUE : SUB,
    }}>{label}</button>
  )
}

function ChipGroup({ options, value, onChange, multi=false, complement=false, complementLabel='', complementValue='', onComplementChange }) {
  const sel = multi ? (value || []) : value
  const toggle = (v) => {
    if (multi) onChange(sel.includes(v) ? sel.filter(x=>x!==v) : [...sel, v])
    else onChange(sel === v ? '' : v)
  }
  const showComp = complement && (multi ? sel.length > 0 : !!sel)
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: showComp ? 10 : 0 }}>
        {options.map(o => <Chip key={o} label={o} selected={multi ? sel.includes(o) : sel===o} onClick={() => toggle(o)} />)}
      </div>
      {showComp && complementLabel && (
        <input style={{ ...INP, fontSize:13 }} placeholder={complementLabel}
          value={complementValue} onChange={e => onComplementChange(e.target.value)} />
      )}
    </div>
  )
}

function Sec({ title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 12px' }}>
      <div style={{ flex:1, height:1, background:BRD }} />
      <span style={{ fontSize:10, color:DIM, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:1, background:BRD }} />
    </div>
  )
}

function Label({ children, required }) {
  return (
    <div style={{ fontSize:11, color:SUB, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, display:'flex', gap:4 }}>
      {children}{required && <span style={{ color:'#F87171' }}>*</span>}
    </div>
  )
}

// ── Resumo de saude pos-envio ──────────────────────────────────────────────────
function ResumoSaude({ d }) {
  const itens = []

  // Sono
  if (d.qualidade_sono === 'Tenho insonia frequente' || d.qualidade_sono === 'Durmo mal ou insuficiente')
    itens.push({ area:'Sono', status:'atencao', atual:'Sono irregular ou insuficiente', melhora:'O treino regular e um dos principais reguladores do sono, reduzindo o tempo para adormecer e aumentando o sono profundo em ate 65% (Walker, 2017).' })
  else if (d.qualidade_sono === 'Durmo bem e acordo descansado')
    itens.push({ area:'Sono', status:'ok', atual:'Sono adequado', melhora:'Continue mantendo essa rotina. O treinamento fisico vai potencializar ainda mais a qualidade do seu descanso.' })

  // Habitos
  if ((d.alcool_cigarro||[]).some(x => x.includes('frequencia') || x.includes('Fumo')))
    itens.push({ area:'Habitos', status:'atencao', atual:'Uso frequente de alcool ou tabaco', melhora:'O exercicio fisico regular reduz significativamente o desejo por substancias e melhora a resposta do organismo aos seus efeitos (ACSM, 2022). Seu programa ira apoiar essa mudança gradualmente.' })

  // Objetivo
  const obj = d.objetivo
  if (obj === 'emagrecimento')
    itens.push({ area:'Composicao corporal', status:'neutro', atual:'Objetivo: perda de gordura e definicao', melhora:'Combinando treino de forca e estrategia alimentar adequada, e possivel perder gordura preservando ou ganhando massa muscular. Seu programa sera desenhado especificamente para isso.' })
  if (obj === 'massa')
    itens.push({ area:'Composicao corporal', status:'neutro', atual:'Objetivo: ganho de musculo e volume', melhora:'A hipertrofia muscular e diretamente proporcional a qualidade da prescricao e da recuperacao. Vamos construir esse processo de forma progressiva e segura.' })
  if (obj === 'saude')
    itens.push({ area:'Qualidade de vida', status:'ok', atual:'Objetivo: saude, energia e disposicao', melhora:'Pesquisas mostram que 150 minutos de atividade moderada por semana reduzem em ate 35% o risco de doencas cronicas. Seu programa vai te colocar nessa faixa.' })

  // Limitacoes
  if ((d.limitacao||[]).some(x => x !== 'Nenhuma'))
    itens.push({ area:'Limitacoes fisicas', status:'atencao', atual:'Regioes sensiveis identificadas', melhora:'Todas as limitacoes reportadas serao levadas em conta na prescricao. Exercicios adaptados garantem evolucao sem agravar nenhuma condicao existente.' })

  // Experiencia
  if (d.experiencia && d.experiencia.includes('Nunca'))
    itens.push({ area:'Condicionamento', status:'neutro', atual:'Sem historico de treino', melhora:'Iniciantes tem a maior taxa de evolucao de todas as fases. As primeiras semanas de treino produzem ganhos expressivos de forca e condicionamento (Kraemer et al., 2021).' })

  const corStatus = { ok:'#22C55E', atencao:'#F59E0B', neutro:'#60A5FA' }

  return (
    <div style={{ background:BG, minHeight:'100vh', fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background:SURF, borderBottom:`1px solid ${BRD}`, padding:'18px 22px' }}>
        <div style={{ maxWidth:560, margin:'0 auto', textAlign:'center' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={GREEN}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:6 }}>Anamnese recebida, {d.nome.split(' ')[0]}</div>
          <div style={{ fontSize:13, color:SUB, lineHeight:1.7 }}>Seu professor recebeu suas respostas e vai montar um programa personalizado para voce. Enquanto isso, veja um resumo do seu ponto de partida.</div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'22px 16px 48px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:SUB, textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>Seu diagnostico inicial</div>

        {itens.map((it, i) => (
          <div key={i} style={{ ...CARD, borderLeft:`3px solid ${corStatus[it.status]}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:corStatus[it.status], flexShrink:0 }} />
              <div style={{ fontSize:12, fontWeight:700, color:corStatus[it.status], textTransform:'uppercase', letterSpacing:0.8 }}>{it.area}</div>
            </div>
            <div style={{ fontSize:13, color:TEXT, fontWeight:600, marginBottom:6 }}>{it.atual}</div>
            <div style={{ fontSize:12, color:SUB, lineHeight:1.7 }}>{it.melhora}</div>
          </div>
        ))}

        {/* Proximos passos */}
        <div style={{ ...CARD, background:'rgba(59,130,246,0.06)', borderColor:'rgba(59,130,246,0.2)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:BLUE, marginBottom:8 }}>Proximos passos</div>
          <div style={{ fontSize:12, color:SUB, lineHeight:1.8 }}>
            Seu professor ira analisar todas as suas respostas e entrar em contato em breve. O programa sera montado especificamente para voce — considerando seus objetivos, limitacoes e disponibilidade de tempo.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnamnesePublica({ token: tokenProp }) {
  const token = tokenProp || window.location.pathname.split('/novo/')[1]
  const [tokenData, setTokenData] = useState(null)
  const [status,    setStatus]    = useState('loading')
  const [step,      setStep]      = useState(1)
  const [saving,    setSaving]    = useState(false)
  const [errors,    setErrors]    = useState({})
  const [finalData, setFinalData] = useState(null)

  const [D, setD] = useState({
    nome:'', ddd:'', tel1:'', tel2:'',
    peso:'', altura:'',
    faixa_etaria:'', rotina_trabalho:'', rotina_detalhe:'',
    lazer:'', lazer_detalhe:'',
    qualidade_sono:'', horas_sono:'',
    alcool:'', alcool_freq:'',
    tabaco:'', tabaco_freq:'',
    refeicoes:'', qualidade_alimentacao:'',
    medicamentos:'', medicamentos_detalhe:'',
    condicao_saude:[], condicao_saude_detalhe:'',
    limitacao:[], limitacao_detalhe:'',
    objetivo:'', objetivo_detalhe:'',
    dias_semana:'', horario:'', local_treino:[],
    experiencia:'', experiencia_detalhe:'',
    motivacao:[], motivacao_detalhe:'',
  })
  const s = (k) => (v) => setD(p => ({ ...p, [k]: v }))

  const REQUIRED = {
    1: ['nome','ddd','tel1','tel2','faixa_etaria','rotina_trabalho','lazer'],
    2: ['qualidade_sono','horas_sono','alcool','tabaco','refeicoes','qualidade_alimentacao','condicao_saude','limitacao'],
    3: ['objetivo','dias_semana','horario','local_treino'],
    4: ['experiencia','motivacao'],
  }

  const validate = () => {
    const errs = {}
    REQUIRED[step].forEach(k => {
      const v = D[k]
      if (!v || (Array.isArray(v) && v.length===0) || v==='') errs[k]=true
    })
    setErrors(errs)
    return Object.keys(errs).length===0
  }

  const next = () => {
    if (!validate()) { window.scrollTo({top:0,behavior:'smooth'}); return }
    setStep(p=>p+1); window.scrollTo({top:0,behavior:'smooth'})
  }
  const back = () => { setStep(p=>p-1); window.scrollTo({top:0,behavior:'smooth'}) }

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    supabase.from('anamnese_tokens').select('*')
      .eq('token',token).eq('status','pendente').single()
      .then(({data}) => { if (!data){setStatus('invalid');return} setTokenData(data); setStatus('form') })
  }, [token])

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    const whatsapp = `(${D.ddd}) ${D.tel1}-${D.tel2}`

    const OBJ_MAP = { emagrecimento:'Emagrecimento', massa:'Ganho de Massa', saude:'Saúde e Bem-Estar', performance:'Força e Performance' }

    const imcVal = D.peso && D.altura
      ? (parseFloat(D.peso) / Math.pow(parseFloat(D.altura)/100, 2)).toFixed(1)
      : null

    await criarAlunoPendente({
      teacherId: tokenData.teacher_id,
      token,
      studentData: {
        name: D.nome, plano: tokenData.plano,
        guardian_phone: whatsapp,
        goal: OBJ_MAP[D.objetivo] || D.objetivo || null,
        weight: +D.peso || null,
        height: +D.altura || null,
      },
      anamneseData: {
        historico_saude: [...(D.condicao_saude||[]), D.condicao_saude_detalhe, D.medicamentos_detalhe].filter(Boolean).join(', '),
        alcool_cigarro: [
          D.alcool ? `Álcool: ${D.alcool} (${D.alcool_freq||'freq. não informada'})` : '',
          D.tabaco ? `Tabaco: ${D.tabaco} (${D.tabaco_freq||'freq. não informada'})` : '',
        ].filter(Boolean).join(' | '),
        alimentacao: `${D.refeicoes} refeições/dia — qualidade: ${D.qualidade_alimentacao}`,
        limitacao_detalhe: [...(D.limitacao||[]), D.limitacao_detalhe].filter(Boolean).join(', '),
        horas_sono: D.horas_sono, qualidade_sono: D.qualidade_sono,
        objetivo_estetico: D.objetivo_detalhe || '',
        dias_disponiveis: D.dias_semana, horario_preferido: D.horario,
        local_treino: (D.local_treino||[]).join(', '),
        historico: [D.experiencia, D.experiencia_detalhe].filter(Boolean).join(' — '),
        motivacao_inicio: [...(D.motivacao||[]), D.motivacao_detalhe].filter(Boolean).join(', '),
        profissao: [D.rotina_trabalho, D.rotina_detalhe, (D.lazer||[]).length ? `Lazer: ${(D.lazer||[]).join(', ')}` : '', D.lazer_detalhe].filter(Boolean).join(' | '),
        parq: { faixa_etaria: D.faixa_etaria, medicamentos: D.medicamentos },
      },
      notifPayload: {
        titulo: 'Nova anamnese recebida',
        corpo: `${D.nome} preencheu o formulário e aguarda confirmação.`,
        payload: {
          nome: D.nome,
          faixa_etaria: D.faixa_etaria,
          peso: D.peso,
          altura: D.altura,
          imc: imcVal,
          objetivo: OBJ_MAP[D.objetivo] || D.objetivo,
          dias_semana: D.dias_semana,
          whatsapp: whatsapp,
        },
      },
    })

    setSaving(false)
    setFinalData(D)
    setStatus('success')
  }

  if (status==='loading') return <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',color:SUB,fontFamily:"'DM Sans',sans-serif",fontSize:15}}>Carregando...</div>
  if (status==='invalid') return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:'center',maxWidth:380}}>
        <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:8}}>Link indisponivel</div>
        <div style={{fontSize:14,color:SUB,lineHeight:1.7}}>Este link ja foi utilizado ou nao e valido. Solicite um novo link ao seu professor.</div>
      </div>
    </div>
  )
  if (status==='success' && finalData) return <ResumoSaude d={finalData} />

  const err = (k) => errors[k] ? <div style={{fontSize:11,color:'#F87171',marginTop:4,marginBottom:6}}>Campo obrigatorio</div> : null
  const pct = (step/4)*100

  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      {/* Header */}
      <div style={{background:SURF,borderBottom:`1px solid ${BRD}`,padding:'13px 20px',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:560,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:TEXT}}>Anamnese Inicial</div>
            <div style={{fontSize:11,color:SUB}}>Etapa {step} de 4</div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:BLUE}}>{Math.round(pct)}% concluido</div>
        </div>
        <div style={{maxWidth:560,margin:'8px auto 0',height:3,background:BRD,borderRadius:99,overflow:'hidden'}}>
          <div style={{width:`${pct}%`,height:'100%',background:BLUE,transition:'width 0.4s',borderRadius:99}}/>
        </div>
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'22px 16px 48px'}}>

        {/* ══ ETAPA 1 ══ */}
        {step===1 && (
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:4}}>Sobre voce</div>
              <div style={{fontSize:13,color:SUB}}>Informacoes iniciais para personalizarmos seu programa</div>
            </div>

            <div style={CARD}>
              <Sec title="Identificacao"/>
              <Label required>Nome completo</Label>
              <input style={{...INP,...(errors.nome?{outline:'1.5px solid #F87171'}:{})}}
                placeholder="Seu nome completo" value={D.nome} onChange={e=>s('nome')(e.target.value)}/>
              {err('nome')}

              <div style={{marginTop:12}}>
                <Label required>WhatsApp</Label>
                <div style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr',gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:DIM,marginBottom:4}}>DDD</div>
                    <input style={{...INP,...(errors.ddd?{outline:'1.5px solid #F87171'}:{})}}
                      placeholder="11" maxLength={2} value={D.ddd}
                      onChange={e=>s('ddd')(e.target.value.replace(/\D/g,'').slice(0,2))}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:DIM,marginBottom:4}}>Numero (parte 1)</div>
                    <input style={{...INP,...(errors.tel1?{outline:'1.5px solid #F87171'}:{})}}
                      placeholder="99999" maxLength={5} value={D.tel1}
                      onChange={e=>s('tel1')(e.target.value.replace(/\D/g,'').slice(0,5))}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:DIM,marginBottom:4}}>Numero (parte 2)</div>
                    <input style={{...INP,...(errors.tel2?{outline:'1.5px solid #F87171'}:{})}}
                      placeholder="9999" maxLength={4} value={D.tel2}
                      onChange={e=>s('tel2')(e.target.value.replace(/\D/g,'').slice(0,4))}/>
                  </div>
                </div>
                {(errors.ddd||errors.tel1||errors.tel2) && <div style={{fontSize:11,color:'#F87171',marginTop:4}}>Preencha o WhatsApp completo</div>}
                {D.ddd && D.tel1 && D.tel2 && (
                  <div style={{fontSize:11,color:GREEN,marginTop:4}}>({D.ddd}) {D.tel1}-{D.tel2}</div>
                )}
              </div>

              <div style={{marginTop:14}}>
                <Label>Peso e altura</Label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:DIM,marginBottom:4}}>Peso atual (kg)</div>
                    <input style={INP} type="number" placeholder="Ex: 75"
                      value={D.peso} onChange={e=>s('peso')(e.target.value)}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:DIM,marginBottom:4}}>Altura (cm)</div>
                    <input style={INP} type="number" placeholder="Ex: 175"
                      value={D.altura} onChange={e=>s('altura')(e.target.value)}/>
                  </div>
                </div>
              </div>
            </div>

            <div style={CARD}>
              <Sec title="Faixa etaria"/>
              <Label required>Qual a sua faixa de idade?</Label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {[
                  {id:'18a29', label:'18 a 29 anos', sub:'Adulto Jovem'},
                  {id:'30a44', label:'30 a 44 anos', sub:'Adulto'},
                  {id:'45a59', label:'45 a 59 anos', sub:'Adulto Maduro'},
                  {id:'60mais',label:'60 anos ou mais',sub:'Idoso'},
                ].map(o=>(
                  <div key={o.id} onClick={()=>s('faixa_etaria')(D.faixa_etaria===o.id?'':o.id)}
                    style={{padding:'10px 16px',borderRadius:12,border:`1.5px solid ${D.faixa_etaria===o.id?BLUE:BRD}`,background:D.faixa_etaria===o.id?`${BLUE}15`:SURF2,cursor:'pointer',minWidth:120}}>
                    <div style={{fontSize:13,fontWeight:700,color:D.faixa_etaria===o.id?BLUE:TEXT}}>{o.label}</div>
                    <div style={{fontSize:10,color:SUB}}>{o.sub}</div>
                  </div>
                ))}
              </div>
              {err('faixa_etaria')}
            </div>

            <div style={CARD}>
              <Sec title="Sua rotina"/>
              <Label required>No trabalho, qual e o nivel de esforco fisico do seu dia?</Label>
              <div style={{fontSize:11,color:DIM,marginBottom:8,lineHeight:1.5}}>Inclua o deslocamento — quem passa horas em transporte publico ou no carro tambem esta ativo.</div>
              <ChipGroup
                options={[
                  'Trabalho sentado e me desloco pouco',
                  'Trabalho sentado mas me desloco bastante',
                  'Fico em pe ou caminho boa parte do dia',
                  'Realizo esforco fisico moderado no trabalho',
                  'Realizo esforco fisico intenso ou trabalho braçal',
                ]}
                value={D.rotina_trabalho} onChange={s('rotina_trabalho')}
                complement complementLabel="Tempo aproximado de deslocamento diario (opcional)"
                complementValue={D.rotina_detalhe} onComplementChange={s('rotina_detalhe')}/>
              {err('rotina_trabalho')}
            </div>

            <div style={CARD}>
              <Sec title="Seu tempo livre"/>
              <Label required>Fora do trabalho e do sono, como voce costuma ocupar seu tempo?</Label>
              <div style={{fontSize:11,color:DIM,marginBottom:8,lineHeight:1.5}}>Nao ha resposta certa — queremos entender sua rotina real para construir um programa que caiba nela.</div>
              <ChipGroup multi
                options={[
                  'Descanso e recuperacao (TV, streaming, celular)',
                  'Leitura ou aprendizado',
                  'Atividade fisica ou esporte',
                  'Vida social (amigos, familia, saidas)',
                  'Hobbies criativos (musica, arte, culinaria)',
                  'Cuidados com a casa ou familia',
                  'Pouco tempo livre disponivel',
                ]}
                value={D.lazer} onChange={s('lazer')}
                complement complementLabel="Algo que nao esta na lista? Conta aqui"
                complementValue={D.lazer_detalhe} onComplementChange={s('lazer_detalhe')}/>
              {err('lazer')}
            </div>
          </div>
        )}

        {/* ══ ETAPA 2 ══ */}
        {step===2 && (
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:4}}>Saude e habitos</div>
              <div style={{fontSize:13,color:SUB}}>Estas informacoes sao confidenciais e usadas apenas para personalizar seu programa</div>
            </div>

            {/* Sono */}
            <div style={CARD}>
              <Sec title="Qualidade do sono"/>
              <Label required>Como voce descreveria seu sono na maior parte das noites?</Label>
              <ChipGroup
                options={['Durmo bem e acordo descansado','Acordo cansado mesmo dormindo','Tenho dificuldade para dormir ou manter o sono','Muito irregular — varia bastante']}
                value={D.qualidade_sono} onChange={s('qualidade_sono')}/>
              {err('qualidade_sono')}
              <div style={{marginTop:14}}>
                <Label required>Quantas horas costuma dormir por noite?</Label>
                <ChipGroup options={['Menos de 5h','5 a 6h','6 a 7h','7 a 8h','Mais de 8h']}
                  value={D.horas_sono} onChange={s('horas_sono')}/>
                {err('horas_sono')}
              </div>
            </div>

            {/* Alimentacao */}
            <div style={CARD}>
              <Sec title="Alimentacao"/>
              <div style={{fontSize:11,color:DIM,marginBottom:10,lineHeight:1.6}}>A alimentacao influencia diretamente nos resultados do treino. Nao ha julgamento aqui — apenas queremos entender seu ponto de partida.</div>
              <Label required>Quantas refeicoes voce faz por dia, em media?</Label>
              <ChipGroup options={['1 a 2 refeicoes','3 refeicoes','4 a 5 refeicoes','6 ou mais refeicoes']}
                value={D.refeicoes} onChange={s('refeicoes')}/>
              {err('refeicoes')}
              <div style={{marginTop:14}}>
                <Label required>Como voce avalia a qualidade da sua alimentacao hoje?</Label>
                <ChipGroup
                  options={['Muito boa — equilibrada e variada','Boa — com alguns deslizes pontuais','Regular — poderia melhorar bastante','Precisa de muita melhora']}
                  value={D.qualidade_alimentacao} onChange={s('qualidade_alimentacao')}/>
                {err('qualidade_alimentacao')}
              </div>
            </div>

            {/* Habitos */}
            <div style={CARD}>
              <Sec title="Habitos e substancias"/>
              <div style={{fontSize:11,color:DIM,marginBottom:12,lineHeight:1.6}}>Essas informacoes sao importantes para ajustar a intensidade e o volume do seu programa com segurança.</div>

              <Label required>Voce faz uso de alcool?</Label>
              <ChipGroup
                options={['Nao faco uso','Raramente — ocasioes especiais','Fins de semana','Algumas vezes por semana','Diariamente']}
                value={D.alcool} onChange={s('alcool')}/>
              {err('alcool')}
              {D.alcool && D.alcool !== 'Nao faco uso' && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:11,color:SUB,marginBottom:5}}>Com que frequencia aproximada? (ex: 2 cervejas nos fins de semana)</div>
                  <input style={{...INP,fontSize:13}} placeholder="Descreva brevemente se quiser"
                    value={D.alcool_freq} onChange={e=>s('alcool_freq')(e.target.value)}/>
                </div>
              )}

              <div style={{marginTop:16}}>
                <Label required>E tabaco ou cigarro?</Label>
                <ChipGroup
                  options={['Nao faco uso','Ja fumei mas parei','Fumo ocasionalmente','Fumo regularmente','Fumo diariamente']}
                  value={D.tabaco} onChange={s('tabaco')}/>
                {err('tabaco')}
                {D.tabaco && D.tabaco !== 'Nao faco uso' && D.tabaco !== 'Ja fumei mas parei' && (
                  <div style={{marginTop:8}}>
                    <div style={{fontSize:11,color:SUB,marginBottom:5}}>Quantidade aproximada por dia ou semana</div>
                    <input style={{...INP,fontSize:13}} placeholder="Ex: 5 cigarros por dia"
                      value={D.tabaco_freq} onChange={e=>s('tabaco_freq')(e.target.value)}/>
                  </div>
                )}
              </div>
            </div>

            {/* Medicamentos */}
            <div style={CARD}>
              <Sec title="Medicamentos"/>
              <div style={{fontSize:11,color:DIM,marginBottom:10,lineHeight:1.6}}>Alguns medicamentos influenciam a resposta ao exercicio fisico. Esta informacao e confidencial e usada exclusivamente para adaptar seu programa com segurança.</div>
              <Label required>Voce faz uso de algum medicamento de forma continua ou frequente?</Label>
              <ChipGroup
                options={['Nao faco uso de medicamentos','Sim, uso medicamento controlado','Sim, uso medicamento para pressao ou coracao','Sim, uso insulina ou medicamento para diabetes','Sim, outro tipo de medicamento']}
                value={D.medicamentos} onChange={s('medicamentos')}/>
              {err('medicamentos')}
              {D.medicamentos && D.medicamentos !== 'Nao faco uso de medicamentos' && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:11,color:SUB,marginBottom:5}}>Qual medicamento? (nome e dosagem, se souber)</div>
                  <input style={{...INP,fontSize:13}} placeholder="Ex: Propranolol 40mg, uso diario"
                    value={D.medicamentos_detalhe} onChange={e=>s('medicamentos_detalhe')(e.target.value)}/>
                </div>
              )}
            </div>

            {/* Saude */}
            <div style={CARD}>
              <Sec title="Historico de saude"/>
              <Label required>Voce possui alguma condicao de saude diagnosticada?</Label>
              <ChipGroup multi
                options={['Nenhuma','Hipertensao','Diabetes','Problema cardiaco','Osteoporose','Artrite ou artrose','Hernia de disco','Outra']}
                value={D.condicao_saude} onChange={s('condicao_saude')}
                complement complementLabel="Especifique cirurgias ou outras condicoes relevantes"
                complementValue={D.condicao_saude_detalhe} onComplementChange={s('condicao_saude_detalhe')}/>
              {err('condicao_saude')}
              <div style={{marginTop:16}}>
                <Label required>Voce sente dor ou tem limitacao fisica em alguma regiao do corpo?</Label>
                <ChipGroup multi
                  options={['Nenhuma','Ombro','Coluna lombar','Coluna cervical','Joelho','Quadril','Tornozelo','Punho ou cotovelo','Outra regiao']}
                  value={D.limitacao} onChange={s('limitacao')}
                  complement complementLabel="Descreva a limitacao com mais detalhes"
                  complementValue={D.limitacao_detalhe} onComplementChange={s('limitacao_detalhe')}/>
                {err('limitacao')}
              </div>
            </div>
          </div>
        )}

        {/* ══ ETAPA 3 ══ */}
        {step===3 && (
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:4}}>Seus objetivos</div>
              <div style={{fontSize:13,color:SUB}}>O que voce quer alcançar com o programa</div>
            </div>

            <div style={CARD}>
              <Sec title="Objetivo principal"/>
              <Label required>Qual desses descreve melhor o que voce busca?</Label>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:D.objetivo?12:0}}>
                {[
                  {id:'emagrecimento',label:'Perder gordura e definir o corpo',desc:'Reducao de gordura com manutencao ou ganho de musculo'},
                  {id:'massa',label:'Ganhar musculo e volume',desc:'Hipertrofia com foco em tamanho e forca'},
                  {id:'saude',label:'Saude, energia e disposicao',desc:'Melhora da qualidade de vida e condicionamento geral'},
                  {id:'performance',label:'Performance e atletismo',desc:'Forca, potencia ou preparacao para esporte'},
                ].map(o=>(
                  <div key={o.id} onClick={()=>s('objetivo')(D.objetivo===o.id?'':o.id)}
                    style={{padding:'12px 16px',borderRadius:12,border:`1.5px solid ${D.objetivo===o.id?BLUE:BRD}`,background:D.objetivo===o.id?`${BLUE}12`:SURF2,cursor:'pointer'}}>
                    <div style={{fontSize:13,fontWeight:700,color:D.objetivo===o.id?BLUE:TEXT,marginBottom:2}}>{o.label}</div>
                    <div style={{fontSize:11,color:SUB}}>{o.desc}</div>
                  </div>
                ))}
              </div>
              {err('objetivo')}
              {D.objetivo && (
                <div style={{marginTop:10}}>
                  <Label>Descreva como imagina o resultado (opcional)</Label>
                  <textarea style={{...INP,minHeight:65,resize:'vertical',lineHeight:1.7}}
                    placeholder="Ex: quero perder 8kg e ter o abdomen definido ate dezembro..."
                    value={D.objetivo_detalhe} onChange={e=>s('objetivo_detalhe')(e.target.value)}/>
                </div>
              )}
            </div>

            <div style={CARD}>
              <Sec title="Disponibilidade"/>
              <Label required>Quantos dias por semana consegue treinar?</Label>
              <ChipGroup options={['2 dias','3 dias','4 dias','5 dias ou mais']}
                value={D.dias_semana} onChange={s('dias_semana')}/>
              {err('dias_semana')}
              <div style={{marginTop:14}}>
                <Label required>Qual horario prefere?</Label>
                <ChipGroup options={['Manha','Tarde','Noite','Qualquer horario']}
                  value={D.horario} onChange={s('horario')}/>
                {err('horario')}
              </div>
              <div style={{marginTop:14}}>
                <Label required>Onde prefere treinar?</Label>
                <ChipGroup multi options={['Academia','Ao ar livre','Em casa','Sem preferencia']}
                  value={D.local_treino} onChange={s('local_treino')}/>
                {err('local_treino')}
              </div>
            </div>
          </div>
        )}

        {/* ══ ETAPA 4 ══ */}
        {step===4 && (
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:TEXT,marginBottom:4}}>Historico e motivacao</div>
              <div style={{fontSize:13,color:SUB}}>Ultima etapa</div>
            </div>

            <div style={CARD}>
              <Sec title="Experiencia com exercicio"/>
              <Label required>Como voce se descreve em relacao ao exercicio?</Label>
              <ChipGroup
                options={['Nunca pratiquei exercicio','Ja pratiquei mas parei ha mais de 6 meses','Ja pratiquei mas parei ha menos de 6 meses','Pratico atualmente de forma irregular','Pratico regularmente']}
                value={D.experiencia} onChange={s('experiencia')}
                complement complementLabel="O que praticou? Por quanto tempo? Por que parou?"
                complementValue={D.experiencia_detalhe} onComplementChange={s('experiencia_detalhe')}/>
              {err('experiencia')}
            </div>

            <div style={CARD}>
              <Sec title="Motivacao"/>
              <Label required>O que te fez buscar um programa agora?</Label>
              <ChipGroup multi
                options={['Insatisfacao com meu corpo atual','Recomendacao medica','Tenho um evento ou data importante','Indicacao de alguem','Quero mais energia no dia a dia','Decidi que e hora de mudar']}
                value={D.motivacao} onChange={s('motivacao')}
                complement complementLabel="Conte mais se quiser (opcional)"
                complementValue={D.motivacao_detalhe} onComplementChange={s('motivacao_detalhe')}/>
              {err('motivacao')}
            </div>

            <div style={{...CARD,background:'rgba(34,197,94,0.04)',borderColor:'rgba(34,197,94,0.2)'}}>
              <div style={{fontSize:13,fontWeight:700,color:GREEN,marginBottom:6}}>Pronto para enviar</div>
              <div style={{fontSize:12,color:SUB,lineHeight:1.7}}>Ao enviar, suas respostas chegam imediatamente ao seu professor. Voce ira receber um diagnostico inicial personalizado logo em seguida.</div>
            </div>
          </div>
        )}

        {/* Navegacao */}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          {step>1 && (
            <button onClick={back} style={{padding:'13px 20px',borderRadius:12,border:`1px solid ${BRD}`,background:'transparent',color:SUB,fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
              Voltar
            </button>
          )}
          {step<4 ? (
            <button onClick={next} style={{flex:1,padding:'13px',borderRadius:12,border:'none',cursor:'pointer',background:BLUE,color:'#fff',fontWeight:800,fontSize:15,fontFamily:'inherit'}}>
              Continuar
            </button>
          ) : (
            <button onClick={submit} disabled={saving} style={{flex:1,padding:'13px',borderRadius:12,border:'none',cursor:saving?'wait':'pointer',background:saving?DIM:GREEN,color:'#fff',fontWeight:800,fontSize:15,fontFamily:'inherit'}}>
              {saving?'Enviando...':'Enviar Anamnese'}
            </button>
          )}
        </div>
        {Object.keys(errors).length>0 && (
          <div style={{marginTop:10,fontSize:12,color:'#F87171',textAlign:'center'}}>Preencha todos os campos obrigatorios para continuar.</div>
        )}
      </div>
    </div>
  )
}
