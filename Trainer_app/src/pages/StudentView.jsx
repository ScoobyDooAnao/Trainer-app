import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabase'
import FichaAvaliacao from './FichaAvaliacao'

// ── Responsividade ────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── Constantes ────────────────────────────────────────────────────────────────
const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}
const today = () => new Date().toISOString().split('T')[0]
const parseSets = (setsField) => {
  const n = parseInt(setsField) || 3
  return Array.from({ length: n }, (_, i) => ({ set: i + 1, weight: '', reps: '' }))
}

const CAT_STAR_COLOR = {
  peso:'#34D399', imc:'#60A5FA', medida:'#A78BFA',
  forca:'#FBBF24', cardio:'#F87171', habito:'#F5C842', outro:'#94A3B8',
}
// Tokens de estilo compartilhados pelos componentes de Metas e Cárdio
const CARD = {
  background:'rgba(13,17,23,0.92)', backdropFilter:'blur(14px)',
  WebkitBackdropFilter:'blur(14px)',
  border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:18, marginBottom:12,
}
const INP = {
  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:10, padding:'11px 14px', color:'#E2E8F0', fontSize:14,
  outline:'none', width:'100%', boxSizing:'border-box',
}
const LBL = {
  fontSize:10, color:'#64748B', fontWeight:800, letterSpacing:1.2,
  textTransform:'uppercase', marginBottom:5, display:'block', marginTop:14,
}

// ── Cárdio + Metas components ───────────────────────────────────────────────────
const SV_CARDIO_TYPES = [
  { id:'corrida',     label:'Corrida',     icon:'🏃', color:'#EF4444', hasDistance:true,  hasHR:true,  isHIIT:false },
  { id:'bike',        label:'Bike',        icon:'🚴', color:'#F59E0B', hasDistance:true,  hasHR:true,  isHIIT:false },
  { id:'esteira',     label:'Esteira',     icon:'🏃', color:'#8B5CF6', hasDistance:true,  hasHR:true,  isHIIT:false },
  { id:'eliptico',    label:'Elíptico',    icon:'⭕', color:'#06B6D4', hasDistance:false, hasHR:true,  isHIIT:false },
  { id:'natacao',     label:'Natação',     icon:'🏊', color:'#3B82F6', hasDistance:true,  hasHR:false, isHIIT:false },
  { id:'pular_corda', label:'Pular Corda', icon:'🪢', color:'#10B981', hasDistance:false, hasHR:true,  isHIIT:false },
  { id:'hiit',        label:'HIIT',        icon:'⚡', color:'#F5C842', hasDistance:false, hasHR:true,  isHIIT:true  },
]
const SV_PSE_LABELS = ['','Muito leve','Leve','Moderado leve','Moderado','Moderado intenso','Intenso','Muito intenso','Difícil','Muito difícil','Máximo']
const SV_PRESCRICAO = {
  'Emagrecimento':    { tipo:['corrida','esteira','eliptico'], sessoes:'3–4x/semana', duracao:'30–50 min', pse:{min:4,max:6,label:'PSE 4–6'}, pace:'Ritmo confortável — você consegue conversar', volume:'120–200 min/semana', obs:'Esforço contínuo e controlado. Evite intensidade alta demais.' },
  'Ganho de Massa':   { tipo:['esteira','bike','eliptico'],    sessoes:'2x/semana',   duracao:'20–30 min', pse:{min:3,max:5,label:'PSE 3–5'}, pace:'Recuperação ativa — ritmo bem leve', volume:'40–60 min/semana', obs:'Cardio leve preserva sua recuperação muscular.' },
  'Condicionamento':  { tipo:['corrida','hiit','bike'],        sessoes:'3–4x/semana', duracao:'30–45 min', pse:{min:5,max:8,label:'PSE 5–8'}, pace:'2–3 sessões em ritmo estável + 1 HIIT', volume:'150–200 min/semana', obs:'Alterne intensidades para progredir.' },
  'Força e Performance':{ tipo:['bike','eliptico','natacao'],  sessoes:'2x/semana',   duracao:'20–30 min', pse:{min:3,max:4,label:'PSE 3–4'}, pace:'Low-impact — foco em recuperação', volume:'40–60 min/semana', obs:'Cardio intenso compete com seus ganhos de força.' },
}
function svFmtDate(d) { if(!d)return''; const[,m,dy]=String(d).slice(0,10).split('-'); return`${dy}/${m}` }
function svFormatPace(distKm,durMin) {
  if(!distKm||!durMin||distKm===0)return null
  const pm=durMin/distKm, m=Math.floor(pm), s=Math.round((pm-m)*60).toString().padStart(2,'0')
  return `${m}:${s}/km`
}

// ── PSE Explicação ───────────────────────────────────────────────────────────
const PSE_SCALE = [
  { n:1,  label:'Muito leve',       ex:'Caminhar devagar',       color:'#34D399' },
  { n:2,  label:'Leve',             ex:'Caminhada normal',       color:'#4ADE80' },
  { n:3,  label:'Moderado leve',    ex:'Conversa fácil',         color:'#A3E635' },
  { n:4,  label:'Moderado',         ex:'Consegue falar frases',  color:'#FDE047' },
  { n:5,  label:'Moderado intenso', ex:'Frases curtas',          color:'#FBBF24' },
  { n:6,  label:'Intenso',          ex:'Difícil conversar',      color:'#FB923C' },
  { n:7,  label:'Muito intenso',    ex:'Quase sem fôlego',       color:'#F97316' },
  { n:8,  label:'Difícil',          ex:'Respiração pesada',      color:'#EF4444' },
  { n:9,  label:'Muito difícil',    ex:'Máximo sustentável',     color:'#DC2626' },
  { n:10, label:'Máximo',           ex:'Esforço total',          color:'#B91C1C' },
]

function PseExplainer({ highlight }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop:8 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        background:'rgba(167,139,250,0.10)', border:'1px solid rgba(167,139,250,0.25)',
        borderRadius:20, padding:'5px 14px', cursor:'pointer',
        fontSize:11, fontWeight:700, color:'#A78BFA', display:'flex', alignItems:'center', gap:6,
      }}>
        {open ? '▲' : '▼'} O que é PSE?
      </button>
      {open && (
        <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:14,
          border:'1px solid rgba(255,255,255,0.07)', padding:'14px', marginTop:8 }}>
          <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6, marginBottom:12 }}>
            <strong style={{ color:'#E2E8F0' }}>PSE = Percepção Subjetiva de Esforço.</strong>{' '}
            Escala de 1 a 10 que mede o quão difícil o exercício está para você — sem precisar de nenhum aparelho.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {PSE_SCALE.map(({ n, label, ex, color }) => {
              const hl = highlight && n >= highlight.min && n <= highlight.max
              return (
                <div key={n} style={{ display:'flex', alignItems:'center', gap:8,
                  padding:'5px 8px', borderRadius:8,
                  background: hl ? `${color}18` : 'transparent',
                  border: hl ? `1px solid ${color}40` : '1px solid transparent',
                }}>
                  <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
                    background:`${color}22`, border:`1px solid ${color}50`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:900, color }}>
                    {n}
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12, fontWeight: hl?800:600, color: hl?'#E2E8F0':'#64748B' }}>{label}</span>
                    <span style={{ fontSize:10, color:'#475569', marginLeft:6 }}>— {ex}</span>
                  </div>
                  {hl && <span style={{ fontSize:10, fontWeight:800, color }}>← Alvo</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CARDIO MODAL ──────────────────────────────────────────────────────────────
function SvCardioModal({ studentId, onSave, onClose }) {
  const [type, setType]    = useState('corrida')
  const [date, setDate]    = useState(today())
  const [dur,  setDur]     = useState('')
  const [dist, setDist]    = useState('')
  const [hr,   setHr]      = useState('')
  const [pse,  setPse]     = useState(5)
  const [ws,   setWs]      = useState(30)
  const [rs,   setRs]      = useState(90)
  const [rds,  setRds]     = useState(8)
  const [notes,setNotes]   = useState('')
  const [saving,setSaving] = useState(false)
  const info = SV_CARDIO_TYPES.find(t=>t.id===type)

  const save = async () => {
    setSaving(true)
    const payload = { student_id:studentId, type, date, duration_minutes:+dur||null,
      distance_km:+dist||null, avg_hr:+hr||null, pse:+pse||null, notes:notes||null,
      ...(info?.isHIIT ? {work_seconds:+ws,rest_seconds:+rs,rounds:+rds} : {}) }
    await supabase.from('cardio_sessions').insert([payload])
    setSaving(false); onSave(); onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ ...CARD, padding:24, width:'100%',
        maxWidth:400, maxHeight:'90vh', overflowY:'auto', marginBottom:0,
        border:'1px solid rgba(167,139,250,0.2)' }}>
        <div style={{ fontSize:16,fontWeight:800,color:'#E2E8F0',marginBottom:4,
          fontFamily:"'Nunito',sans-serif" }}>❤️ Nova Sessão de Cárdio</div>
        <div style={{ fontSize:11,color:'#64748B',marginBottom:16 }}>
          Registre sua atividade cardiovascular</div>

        <label style={LBL}>Modalidade</label>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:4 }}>
          {SV_CARDIO_TYPES.map(t => (
            <button key={t.id} onClick={()=>setType(t.id)} style={{
              padding:'7px 13px',borderRadius:20,fontSize:11,fontWeight:800,cursor:'pointer',
              border:`1.5px solid ${type===t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
              background:type===t.id ? `${t.color}22` : 'transparent',
              color:type===t.id ? t.color : '#64748B', fontFamily:"'Nunito',sans-serif",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {[['Data','date','date',date,setDate],['Duração (min)','dur','number',dur,setDur],
          ...(info?.hasDistance?[['Distância (km)','dist','number',dist,setDist]]:[]),
          ...(info?.hasHR?[['FC Média (bpm)','hr','number',hr,setHr]]:[]),
        ].map(([l,,t,v,set]) => (
          <div key={l}><label style={LBL}>{l}</label>
            <input type={t} style={INP} value={v} onChange={e=>set(e.target.value)} /></div>
        ))}

        {info?.isHIIT && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
            {[['Trabalho(s)','ws',ws,setWs],['Descanso(s)','rs',rs,setRs],['Rounds','rds',rds,setRds]].map(([l,k,v,s])=>(
              <div key={k}><label style={LBL}>{l}</label>
                <input type="number" style={INP} value={v} onChange={e=>s(e.target.value)} /></div>
            ))}
          </div>
        )}

        <label style={LBL}>PSE — Esforço Percebido: <span style={{color:'#A78BFA'}}>{pse} — {SV_PSE_LABELS[pse]}</span></label>
        <input type="range" min={1} max={10} value={pse} onChange={e=>setPse(+e.target.value)}
          style={{ width:'100%', accentColor:'#A78BFA', marginBottom:4 }} />
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:9,color:'#334155',fontWeight:700 }}>
          <span>1 Leve</span><span>5 Moderado</span><span>10 Máximo</span>
        </div>
        <PseExplainer />

        <label style={LBL}>Observações</label>
        <textarea style={{ ...INP, minHeight:60, resize:'vertical' }}
          placeholder="Como foi o treino?" value={notes} onChange={e=>setNotes(e.target.value)} />

        <button onClick={save} disabled={saving} style={{
          width:'100%', background:'linear-gradient(135deg,#A78BFA,#7C3AED)',
          border:'none', borderRadius:12, padding:13, color:'#FFF',
          fontWeight:800, fontSize:14, cursor:'pointer', marginTop:20,
          fontFamily:"'Nunito',sans-serif",
          boxShadow:'0 4px 20px rgba(167,139,250,0.35)',
        }}>{saving ? 'Salvando...' : '💾 Salvar Sessão'}</button>
        <button onClick={onClose} style={{ width:'100%',background:'transparent',
          border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:11,
          color:'#475569',fontWeight:600,fontSize:13,cursor:'pointer',marginTop:8,
          fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
      </div>
    </div>
  )
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

// ── STUDENT CARDIO TAB ────────────────────────────────────────────────────────

// ── CardioSimplificadoModal — versão para adolescentes (13–17 anos) ──────────
function CardioSimplificadoModal({ studentId, onSave, onClose }) {
  const today = new Date().toISOString().slice(0,10)
  const [date,     setDate]     = useState(today)
  const [tipo,     setTipo]     = useState('corrida')
  const [duracao,  setDuracao]  = useState('')
  const [distancia,setDistancia]= useState('')
  const [pse,      setPse]      = useState(5)
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  const TIPOS = [
    { id:'corrida', label:'Corrida' },
    { id:'bike',    label:'Bike' },
    { id:'natacao', label:'Natação' },
    { id:'outro',   label:'Outro' },
  ]
  const PSE_LABELS = ['','Muito fácil','Fácil','Tranquilo','Ok','Cansou um pouco','Cansou','Puxado','Muito puxado','Quase no limite','No limite']

  const save = async () => {
    setSaving(true)
    await supabase.from('cardio_sessions').insert([{
      student_id: studentId, date, type: tipo,
      duration_minutes: +duracao || null,
      distance_km: +distancia || null,
      pse: +pse, notes,
    }])
    setSaving(false)
    onSave()
    onClose()
  }

  const inp = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'11px 14px', color:'#E2E8F0', fontSize:14, outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5, display:'block', marginTop:14 }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, padding:24, width:'100%', maxWidth:400, border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0', marginBottom:4 }}>Registrar Atividade</div>
        <div style={{ fontSize:12, color:'#475569', marginBottom:18 }}>Como foi sua atividade hoje?</div>

        <label style={lbl}>Tipo de atividade</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)}
              style={{ padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:'none',
                background: tipo===t.id ? '#34D399' : 'rgba(255,255,255,0.06)',
                color: tipo===t.id ? '#022c22' : '#475569' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4 }}>
          <div>
            <label style={lbl}>Duração (min)</label>
            <input style={inp} type="number" placeholder="Ex: 30" value={duracao} onChange={e=>setDuracao(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Distância (km)</label>
            <input style={inp} type="number" step="0.1" placeholder="Ex: 3.0" value={distancia} onChange={e=>setDistancia(e.target.value)} />
          </div>
        </div>

        <label style={{ ...lbl, marginTop:18 }}>
          Como você se sentiu? <span style={{ color:'#34D399', fontWeight:800 }}>{pse}/10 — {PSE_LABELS[pse]}</span>
        </label>
        <input type="range" min="1" max="10" value={pse} onChange={e=>setPse(+e.target.value)}
          style={{ width:'100%', accentColor:'#34D399', marginBottom:4 }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#334155' }}>
          <span>1 — Fácil</span><span>10 — No limite</span>
        </div>

        <label style={lbl}>Observações</label>
        <textarea style={{ ...inp, minHeight:55, resize:'vertical' }} placeholder="Como foi? Algo diferente?" value={notes} onChange={e=>setNotes(e.target.value)} />

        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={save} disabled={saving}
            style={{ flex:1, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#34D399,#059669)', color:'#022c22', fontWeight:800, fontSize:14 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose}
            style={{ flex:1, padding:'13px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#475569', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function StudentCardioTab({ studentId, student, sessions, onNewSession, simplified=false }) {
  const [modal, setModal]   = useState(false)
  const [filter, setFilter] = useState('todos')
  const presc = SV_PRESCRICAO[student?.goal]

  const filtered = filter==='todos' ? sessions : sessions.filter(s=>s.type===filter)
  const totalMin = sessions.reduce((a,s)=>a+(s.duration_minutes||0),0)
  const totalKm  = sessions.reduce((a,s)=>a+(s.distance_km||0),0)
  const avgPse   = sessions.length ? (sessions.reduce((a,s)=>a+(s.pse||0),0)/sessions.length).toFixed(1) : '—'

  const paceData = sessions
    .filter(s=>s.distance_km&&s.duration_minutes&&['corrida','esteira','bike'].includes(s.type))
    .map(s=>({ date:svFmtDate(s.date), Pace:parseFloat((s.duration_minutes/s.distance_km).toFixed(2)) }))

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      {modal && (
        simplified
          ? <CardioSimplificadoModal studentId={studentId} onSave={()=>{onNewSession();setModal(false)}} onClose={()=>setModal(false)} />
          : <SvCardioModal studentId={studentId} onSave={()=>{onNewSession();setModal(false)}} onClose={()=>setModal(false)} />
      )}
      {simplified && (
        <div style={{ ...CARD, marginBottom:14, display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
          <div style={{ fontSize:26 }}>🟡</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#FBBF24' }}>Cardio para Adolescentes</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:2, lineHeight:1.5 }}>
              Mantenha o esforço entre 5–7/10. Evite intensidade máxima sem orientação do professor.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:900,color:'#E2E8F0',fontFamily:"'Nunito',sans-serif" }}>❤️ Cárdio</div>
          <div style={{ fontSize:12,color:'#64748B',marginTop:2 }}>{sessions.length} sessões registradas</div>
        </div>
        <button onClick={()=>setModal(true)} className="cosmic-btn-glow" style={{
          padding:'10px 18px',borderRadius:12,border:'none',cursor:'pointer',
          background:'linear-gradient(135deg,#F87171,#DC2626)', color:'#FFF',
          fontWeight:800,fontSize:13,fontFamily:"'Nunito',sans-serif",
          boxShadow:'0 4px 16px rgba(239,68,68,0.35)', transition:'all 0.2s',
        }}>+ Registrar</button>
      </div>

      {/* Stats */}
      {sessions.length > 0 && (
        <div style={{ ...CARD, marginBottom:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
            {[
              {label:'Sessões',val:sessions.length,unit:'',color:'#60A5FA'},
              {label:'Total',val:totalMin>=60?`${Math.floor(totalMin/60)}h${totalMin%60}`:totalMin,unit:totalMin<60?'min':'',color:'#A78BFA'},
              {label:'Km',val:totalKm.toFixed(1),unit:'km',color:'#34D399'},
            ].map(({label,val,unit,color})=>(
              <div key={label} style={{ background:'rgba(255,255,255,0.04)',borderRadius:12,
                padding:'12px 14px',textAlign:'center' }}>
                <div style={{ fontSize:9,color:'#475569',fontWeight:800,textTransform:'uppercase',
                  letterSpacing:1.2,marginBottom:4,fontFamily:"'Nunito',sans-serif" }}>{label}</div>
                <div style={{ fontSize:22,fontWeight:900,color,fontFamily:"'Nunito',sans-serif" }}>
                  {val}<span style={{ fontSize:11,color:'#475569' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescrição inteligente */}
      {presc && (
        <div style={{ ...CARD, marginBottom:14 }}>
          <div style={{ fontSize:11,color:'#A78BFA',fontWeight:800,textTransform:'uppercase',
            letterSpacing:2,marginBottom:14,fontFamily:"'Nunito',sans-serif" }}>
            ✦ Prescrição para {student?.goal}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12 }}>
            {[['📅',presc.sessoes,'Frequência'],['⏱',presc.duracao,'Duração'],['📊',presc.volume,'Volume']].map(([icon,val,label])=>(
              <div key={label} style={{ background:'rgba(255,255,255,0.04)',borderRadius:10,
                padding:'10px 12px',textAlign:'center' }}>
                <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:9,color:'#475569',fontWeight:800,textTransform:'uppercase',
                  letterSpacing:1,marginBottom:4,fontFamily:"'Nunito',sans-serif" }}>{label}</div>
                <div style={{ fontSize:11,fontWeight:800,color:'#CBD5E1',lineHeight:1.3,
                  fontFamily:"'Nunito',sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
          {/* PSE bar */}
          <div style={{ background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'10px 14px',marginBottom:8 }}>
            <div style={{ fontSize:10,color:'#475569',fontWeight:800,textTransform:'uppercase',
              letterSpacing:1,marginBottom:6,fontFamily:"'Nunito',sans-serif" }}>🎯 PSE Alvo</div>
            <div style={{ height:8,borderRadius:99,background:'linear-gradient(90deg,#60A5FA,#34D399,#F5C842,#F59E0B,#EF4444)',
              position:'relative',marginBottom:4 }}>
              <div style={{ position:'absolute',left:`${(presc.pse.min-1)/9*100}%`,
                width:`${(presc.pse.max-presc.pse.min)/9*100}%`,height:'100%',
                background:'rgba(255,255,255,0.3)',borderRadius:99,border:'2px solid rgba(255,255,255,0.7)' }} />
            </div>
            <div style={{ fontSize:11,fontWeight:800,color:'#E2E8F0',fontFamily:"'Nunito',sans-serif" }}>
              {presc.pse.label}</div>
            <div style={{ fontSize:11,color:'#475569',marginTop:3 }}>🏃 {presc.pace}</div>
          </div>
          <PseExplainer highlight={presc.pse} />
          <div style={{ fontSize:11,color:'#94A3B8',lineHeight:1.6,padding:'8px 12px',marginTop:8,
            background:'rgba(167,139,250,0.05)',borderRadius:10,borderLeft:'2px solid rgba(167,139,250,0.3)',
            fontFamily:"'Nunito',sans-serif" }}>💡 {presc.obs}</div>
        </div>
      )}

      {/* Gráfico pace — SVG puro (sem dependência) */}
      {paceData.length >= 2 && <PaceChart paceData={paceData} />}

      {/* Filtro */}
      <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:12 }}>
        <button onClick={()=>setFilter('todos')} style={{
          padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:800,cursor:'pointer',
          border:'none',background:filter==='todos'?'rgba(167,139,250,0.2)':'rgba(255,255,255,0.05)',
          color:filter==='todos'?'#A78BFA':'#64748B',fontFamily:"'Nunito',sans-serif" }}>Todos</button>
        {SV_CARDIO_TYPES.filter(t=>sessions.some(s=>s.type===t.id)).map(t=>(
          <button key={t.id} onClick={()=>setFilter(t.id)} style={{
            padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:800,cursor:'pointer',
            border:'none',background:filter===t.id?`${t.color}30`:'rgba(255,255,255,0.05)',
            color:filter===t.id?t.color:'#64748B',fontFamily:"'Nunito',sans-serif" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Histórico */}
      {filtered.length===0 ? (
        <div style={{ textAlign:'center',padding:'50px 20px',color:'#334155' }}>
          <div style={{ fontSize:36,marginBottom:10,animation:'float 3s ease-in-out infinite' }}>❤️</div>
          <div style={{ fontSize:13,fontWeight:700,fontFamily:"'Nunito',sans-serif" }}>
            Nenhuma sessão registrada ainda</div>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {[...filtered].reverse().map(s => {
            const info = SV_CARDIO_TYPES.find(t=>t.id===s.type)
            const pace = svFormatPace(s.distance_km,s.duration_minutes)
            return (
              <div key={s.id} style={{ ...CARD, padding:'12px 14px', marginBottom:0,
                display:'flex',alignItems:'center',gap:12,
                border:`1px solid ${info?.color}18` }}>
                <div style={{ width:38,height:38,borderRadius:10,background:`${info?.color}18`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>
                  {info?.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                    <span style={{ fontSize:13,fontWeight:800,color:'#E2E8F0',
                      fontFamily:"'Nunito',sans-serif" }}>{info?.label}</span>
                    <span style={{ fontSize:10,color:'#475569' }}>{String(s.date).slice(0,10).split('-').reverse().join('/')}</span>
                  </div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                    {s.duration_minutes&&<span style={{ fontSize:11,color:'#64748B' }}>⏱ {s.duration_minutes}min</span>}
                    {s.distance_km&&<span style={{ fontSize:11,color:'#64748B' }}>📍 {s.distance_km}km</span>}
                    {pace&&<span style={{ fontSize:11,color:'#A78BFA',fontWeight:800 }}>🏃 {pace}</span>}
                    {s.pse&&<span style={{ fontSize:11,color:'#64748B' }}>PSE {s.pse}/10</span>}
                  </div>
                  {s.notes&&<div style={{ fontSize:11,color:'#475569',marginTop:3,fontStyle:'italic' }}>{s.notes}</div>}
                </div>
                <div title={s.pse ? `PSE ${s.pse}/10 — ${PSE_SCALE[s.pse-1]?.label||''}` : 'PSE não registrado'}
                style={{ width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:13,fontWeight:900,color:'#02040F',flexShrink:0,
                  background:`hsl(${120-(s.pse||5)*12},70%,50%)`,
                  boxShadow:`0 0 10px hsl(${120-(s.pse||5)*12},70%,50%)50`,
                  cursor:'default',
                }}>
                  {s.pse||'—'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ── NOVA MEDIDA MODAL ────────────────────────────────────────────────────────
function NovaMedidaModal({ studentId, onSave, onClose }) {
  const [date,        setDate]        = useState(today())
  const [peso,        setPeso]        = useState('')
  const [cintura,     setCintura]     = useState('')
  const [quadril,     setQuadril]     = useState('')
  const [peito,       setPeito]       = useState('')
  const [braco,       setBraco]       = useState('')
  const [coxa,        setCoxa]        = useState('')
  const [panturrilha, setPanturrilha] = useState('')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const save = async () => {
    if (!peso && !cintura && !quadril && !peito && !braco && !coxa && !panturrilha) return
    setSaving(true)
    await supabase.from('progress_entries').insert([{
      student_id:  studentId,
      date,
      weight:      peso       ? parseFloat(peso)        : null,
      measurements: {
        waist:       cintura     ? parseFloat(cintura)     : null,
        hip:         quadril     ? parseFloat(quadril)     : null,
        chest:       peito       ? parseFloat(peito)       : null,
        arm:         braco       ? parseFloat(braco)       : null,
        thigh:       coxa        ? parseFloat(coxa)        : null,
        calf:        panturrilha ? parseFloat(panturrilha) : null,
      },
      notes: notes || null,
    }])
    setSaving(false)
    onSave()
    onClose()
  }

  const campos = [
    { label:'Peso corporal', unit:'kg',  value:peso,        set:setPeso        },
    { label:'Cintura',       unit:'cm',  value:cintura,     set:setCintura     },
    { label:'Quadril',       unit:'cm',  value:quadril,     set:setQuadril     },
    { label:'Peito',         unit:'cm',  value:peito,       set:setPeito       },
    { label:'Braço',         unit:'cm',  value:braco,       set:setBraco       },
    { label:'Coxa',          unit:'cm',  value:coxa,        set:setCoxa        },
    { label:'Panturrilha',   unit:'cm',  value:panturrilha, set:setPanturrilha },
  ]

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:400, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ ...CARD, padding:24, width:'100%',
        maxWidth:420, maxHeight:'90vh', overflowY:'auto', marginBottom:0,
        border:'1px solid rgba(52,211,153,0.2)' }}>

        <div style={{ fontSize:17, fontWeight:800, color:'#E2E8F0', marginBottom:3 }}>📏 Registrar Medidas</div>
        <div style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Preencha os campos que deseja registrar hoje</div>

        <label style={LBL}>Data</label>
        <input type="date" style={INP} value={date} onChange={e=>setDate(e.target.value)} />

        {/* Grid 2 colunas para as medidas */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
          {campos.map(({ label, unit, value, set }) => (
            <div key={label}>
              <label style={LBL}>{label} <span style={{ color:'#334155', fontWeight:500 }}>({unit})</span></label>
              <input
                type="number" inputMode="decimal" step="0.1"
                placeholder={unit === 'kg' ? 'Ex: 72.5' : 'Ex: 80'}
                value={value}
                onChange={e => set(e.target.value)}
                style={{ ...INP, padding:'12px 10px', fontSize:15, textAlign:'center', fontWeight:700,
                  border:`1px solid ${value ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}` }}
              />
            </div>
          ))}
        </div>

        <label style={{ ...LBL, gridColumn:'1/-1' }}>Observações (opcional)</label>
        <textarea
          style={{ ...INP, minHeight:60, resize:'vertical' }}
          placeholder="Como você está se sentindo? Alguma observação?"
          value={notes}
          onChange={e=>setNotes(e.target.value)}
        />

        <button onClick={save} disabled={saving} style={{
          width:'100%', marginTop:20, borderRadius:12, padding:14, border:'none',
          background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#34D399,#059669)',
          color: saving ? '#475569' : '#022c22',
          fontWeight:800, fontSize:15, cursor: saving ? 'default' : 'pointer',
          boxShadow: saving ? 'none' : '0 4px 20px rgba(52,211,153,0.35)',
        }}>{saving ? 'Salvando...' : '💾 Salvar Medidas'}</button>

        <button onClick={onClose} style={{ width:'100%', background:'transparent',
          border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:11,
          color:'#475569', fontWeight:600, fontSize:13, cursor:'pointer', marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Céu estrelado (mobile only) ───────────────────────────────────────────────
function CosmicCSS() {
  return (
    <style>{`
      @keyframes twinkle {
        0%,100% { opacity: 0.08; transform: scale(0.6); }
        50%      { opacity: 1;   transform: scale(1.5); }
      }
      @keyframes aurora {
        0%,100% { transform: translate(0,0) scale(1);            opacity: 0.07; }
        50%      { transform: translate(24px,-10px) scale(1.18);  opacity: 0.13; }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes float {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-7px); }
      }
      @keyframes starAppear {
        0%   { opacity: 0; transform: scale(0) rotate(-20deg); }
        60%  { opacity: 1; transform: scale(1.25) rotate(6deg); }
        100% { opacity: 1; transform: scale(1)    rotate(0deg); }
      }
      @keyframes starGlow {
        0%,100% { filter: drop-shadow(0 0 4px var(--sc))  drop-shadow(0 0 1px var(--sc)); transform: scale(1);   }
        50%      { filter: drop-shadow(0 0 16px var(--sc)) drop-shadow(0 0 32px var(--sc)); transform: scale(1.1); }
      }
      @keyframes constellationPulse {
        0%,100% { opacity: 0.10; }
        50%      { opacity: 0.28; }
      }
      .cosmic-btn-glow:hover { filter: brightness(1.15); transform: translateY(-1px); }
    `}</style>
  )
}

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

function StarField() {
  const stars = useMemo(() => Array.from({ length: 130 }, (_, i) => {
    const big = i < 18
    return {
      id:    i,
      x:     ((i * 7919 + 13) % 1000) / 10,
      y:     ((i * 6271 + 97) % 1000) / 10,
      size:  big ? (1.8 + (i % 5) * 0.4) : (0.4 + (i % 4) * 0.3),
      delay: ((i * 1.37) % 7).toFixed(2),
      dur:   (2.5 + (i % 5) * 0.7).toFixed(2),
      op:    (0.18 + (i % 8) * 0.09).toFixed(2),
    }
  }), [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#02040F 0%,#060A1A 55%,#090D24 100%)' }} />
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '65%', height: '55%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 70%)', animation: 'aurora 14s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55%', height: '50%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(56,189,248,0.07) 0%,transparent 70%)', animation: 'aurora 18s 5s ease-in-out infinite' }} />
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`, borderRadius: '50%',
          background: s.size > 1.5 ? '#E8EEFF' : '#FFFFFF',
          opacity: s.op,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          boxShadow: s.size > 1.5 ? `0 0 ${s.size * 3}px rgba(200,210,255,0.55)` : 'none',
        }} />
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: '#34D399', color: '#052e16', borderRadius: 50, padding: '12px 26px',
      fontWeight: 800, fontSize: 14, zIndex: 1000, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(52,211,153,0.5)',
    }}>{msg}</div>
  )
}

// ── ExerciseLogRow — responsivo ───────────────────────────────────────────────
function parseRestSeconds(rest) {
  if (!rest) return 60
  const s = String(rest).toLowerCase()
  const min = s.match(/(\d+)\s*min/)
  if (min) return parseInt(min[1]) * 60
  const sec = s.match(/(\d+)/)
  return sec ? parseInt(sec[1]) : 60
}

function RestTimer({ seconds, dayColor, onDone }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onDone?.(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, background:`${dayColor}15`, border:`1px solid ${dayColor}40`, borderRadius:10, padding:'8px 14px', marginTop:8 }}>
      <span style={{ fontSize:11, color:dayColor, fontWeight:700, textTransform:'uppercase' }}>⏱ Descanso</span>
      <span style={{ fontSize:18, fontWeight:900, color:'#E2E8F0', fontVariantNumeric:'tabular-nums' }}>{mm}:{ss}</span>
      {left <= 0
        ? <span style={{ fontSize:11, color:'#34D399', fontWeight:700 }}>Pronto para a próxima série!</span>
        : <button onClick={() => setLeft(0)} style={{ marginLeft:'auto', fontSize:10, color:'#64748B', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>pular</button>}
    </div>
  )
}

// ── Sessão de treino ativa — timer geral + cards de série por exercício ──────
function fmtDuracao(seg) {
  const m = Math.floor(seg / 60), s = seg % 60
  return `${m}min ${String(s).padStart(2,'0')}s`
}

function ExerciseSetsCard({ ex, dayColor, sets, todayLog, lastLog, onChangeSets }) {
  const typeColor = TYPE_COLORS[ex.type] || '#64748B'
  const [activeTimer, setActiveTimer] = useState(false)
  const [restKey, setRestKey] = useState(0)

  const updateSet = (idx, field, val) => {
    const novo = sets.map((s,i) => i===idx ? { ...s, [field]:val } : s)
    // Auto-confirma a série assim que peso e reps estiverem preenchidos
    novo[idx].checked = !!(novo[idx].weight && novo[idx].reps)
    onChangeSets(novo)
  }

  return (
    <div style={{ marginBottom: 18, padding:'14px', borderRadius:16, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:10 }}>
        <div style={{ minWidth:0 }}>
          {ex.type && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, fontWeight:700, background:`${typeColor}22`, color:typeColor, border:`1px solid ${typeColor}40`, display:'inline-block', marginBottom:4 }}>{ex.type}</span>}
          <div style={{ fontWeight:800, fontSize:15, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</div>
        </div>
        {ex.rest && (
          <button onClick={() => { setActiveTimer(true); setRestKey(k=>k+1) }}
            style={{ flexShrink:0, padding:'8px 14px', borderRadius:12, border:'1px solid rgba(59,130,246,0.4)', background:'rgba(59,130,246,0.12)', color:'#60A5FA', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            ⏱ {ex.rest}
          </button>
        )}
      </div>
      {ex.tip && <div style={{ fontSize:11, color:'#475569', marginBottom:10 }}>💡 {ex.tip}</div>}
      {activeTimer && <div style={{ marginBottom:10 }}><RestTimer key={restKey} seconds={parseRestSeconds(ex.rest)} dayColor={dayColor} onDone={() => {}} /></div>}

      <div style={{ display:'grid', gridTemplateColumns:'24px 46px 1fr 1fr', gap:6, marginBottom:4, padding:'0 2px' }}>
        {['','Ant.','Kg','Reps'].map(h => (
          <div key={h} style={{ fontSize:8, color:'#334155', textTransform:'uppercase', letterSpacing:0.5, textAlign: h==='Ant.'?'center':undefined }}>{h}</div>
        ))}
      </div>

      {sets.map((s, idx) => {
        const ant = lastLog?.sets?.[idx]
        return (
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'24px 46px 1fr 1fr', gap:6, marginBottom:5, alignItems:'center' }}>
            <div style={{ fontSize:11, fontWeight:800, color: s.checked ? '#34D399' : dayColor, textAlign:'center' }}>{s.set}</div>
            <div style={{ fontSize:10, color:'#475569', textAlign:'center' }}>{ant ? `${ant.weight||'—'}×${ant.reps||'—'}` : '—'}</div>
            <input type="number" inputMode="decimal" placeholder="0" value={s.weight}
              onChange={e => updateSet(idx,'weight',e.target.value)}
              style={{ background: s.checked ? 'rgba(52,211,153,0.08)' : '#12161F', border:`1px solid ${s.checked?'rgba(52,211,153,0.4)':'rgba(255,255,255,0.07)'}`, borderRadius:7, padding:'6px 4px', color:'#E2E8F0', fontSize:13, textAlign:'center', outline:'none', width:'100%', fontWeight:700, boxSizing:'border-box' }} />
            <input type="number" inputMode="numeric" placeholder="0" value={s.reps}
              onChange={e => updateSet(idx,'reps',e.target.value)}
              style={{ background: s.checked ? 'rgba(52,211,153,0.08)' : '#12161F', border:`1px solid ${s.checked?'rgba(52,211,153,0.4)':'rgba(255,255,255,0.07)'}`, borderRadius:7, padding:'6px 4px', color:'#E2E8F0', fontSize:13, textAlign:'center', outline:'none', width:'100%', fontWeight:700, boxSizing:'border-box' }} />
          </div>
        )
      })}
    </div>
  )
}

function TrainingSessionView({ day, studentId, dayColor, onClose, onConfirm, confirming }) {
  const [startedAt] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [logsByEx, setLogsByEx] = useState({}) // { [exId]: { sets:[], todayLogId, lastLog } }
  const [loading, setLoading] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const saveTimers = useRef({})

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  useEffect(() => {
    const exIds = (day.exercises || []).map(e => e.id)
    if (!exIds.length) { setLoading(false); return }
    supabase.from('exercise_logs').select('*').eq('student_id', studentId).in('exercise_id', exIds).order('date', { ascending:false })
      .then(({ data }) => {
        const map = {}
        ;(day.exercises || []).forEach(ex => {
          const logs = (data || []).filter(l => l.exercise_id === ex.id)
          const todayL = logs.find(l => l.date === today())
          const lastL  = logs.find(l => l.date !== today())
          map[ex.id] = {
            sets: todayL ? todayL.sets.map(s => ({ ...s, checked: !!(s.weight || s.reps) })) : parseSets(ex.sets),
            todayLogId: todayL?.id || null,
            lastLog: lastL || null,
          }
        })
        setLogsByEx(map)
        setLoading(false)
      })
  }, [day.id])

  const persist = (exId) => {
    clearTimeout(saveTimers.current[exId])
    saveTimers.current[exId] = setTimeout(async () => {
      const entry = logsByEx[exId]
      if (!entry) return
      const payload = { student_id: studentId, exercise_id: exId, date: today(),
        sets: entry.sets.map(s => ({ set:s.set, weight:s.weight||null, reps:s.reps||null, rir: s.rir!=='' && s.rir!=null ? +s.rir : null })) }
      if (entry.todayLogId) {
        await supabase.from('exercise_logs').update({ sets: payload.sets }).eq('id', entry.todayLogId)
      } else {
        const { data } = await supabase.from('exercise_logs').insert(payload).select().single()
        if (data) setLogsByEx(p => ({ ...p, [exId]: { ...p[exId], todayLogId: data.id } }))
      }
    }, 500)
  }

  const updateExSets = (exId, newSets) => {
    setLogsByEx(p => ({ ...p, [exId]: { ...p[exId], sets:newSets } }))
    persist(exId)
  }

  const volume = Object.values(logsByEx).reduce((tot, e) => tot + (e.sets||[]).reduce((s,x) => s + (x.checked ? (+x.weight||0)*(+x.reps||0) : 0), 0), 0)
  const grupos = [...new Set((day.exercises||[]).map(e => e.type).filter(Boolean))]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, overflowY:'auto' }}>
      <CosmicCSS />
      <StarField />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ position:'sticky', top:0, background:'rgba(8,11,18,0.92)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'14px 16px', zIndex:2 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748B', fontSize:14, fontWeight:700, cursor:'pointer' }}>▾ {day.focus || day.name || 'Treino'}</button>
            <button onClick={() => setShowFeedback(true)} disabled={confirming}
              style={{ padding:'9px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg, ${dayColor}, ${dayColor}cc)`, color:'#0B0F17', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:`0 4px 16px ${dayColor}55` }}>
              Concluir
            </button>
          </div>
          <div style={{ display:'flex', gap:18, alignItems:'center', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:0.5 }}>Duração</div>
              <div style={{ fontSize:17, fontWeight:800, color:dayColor, fontVariantNumeric:'tabular-nums' }}>{fmtDuracao(elapsed)}</div>
            </div>
            <div style={{ width:1, height:26, background:'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:0.5 }}>Volume</div>
              <div style={{ fontSize:17, fontWeight:800, color:'#E2E8F0' }}>{volume} <span style={{fontSize:11,fontWeight:600,color:'#64748B'}}>kg</span></div>
            </div>
            {grupos.length > 0 && (
              <>
                <div style={{ width:1, height:26, background:'rgba(255,255,255,0.1)' }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:0.5 }}>Grupos</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#94A3B8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{grupos.join(' · ')}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ padding:'16px 16px 100px' }}>
          {loading ? (
            <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Carregando...</div>
          ) : (day.exercises || []).map(ex => (
            <ExerciseSetsCard key={ex.id} ex={ex} dayColor={dayColor}
              sets={logsByEx[ex.id]?.sets || []}
              todayLog={logsByEx[ex.id]?.todayLogId}
              lastLog={logsByEx[ex.id]?.lastLog}
              onChangeSets={(s) => updateExSets(ex.id, s)}
            />
          ))}
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal studentId={studentId} confirming={confirming}
          onClose={() => setShowFeedback(false)}
          onConfirm={async () => { await onConfirm(); setShowFeedback(false); onClose() }} />
      )}
    </div>
  )
}

function ExerciseLogRow({ ex, studentId, dayColor, isMobile }) {
  const [open,    setOpen]    = useState(false)
  const [sets,    setSets]    = useState(parseSets(ex.sets))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [lastLog, setLastLog] = useState(null)
  const [toast,   setToast]   = useState(null)
  const [restKey, setRestKey] = useState(0) // força reiniciar o timer a cada série salva
  const [activeTimerIdx, setActiveTimerIdx] = useState(null)
  const typeColor = TYPE_COLORS[ex.type] || '#64748B'

  useEffect(() => {
    if (!open || lastLog !== null) return
    supabase.from('exercise_logs')
      .select('*').eq('student_id', studentId).eq('exercise_id', ex.id)
      .order('date', { ascending: false }).limit(1).single()
      .then(({ data }) => setLastLog(data || false))
  }, [open])

  const updateSet = (idx, field, val) =>
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))

  const handleSave = async () => {
    const filled = sets.filter(s => s.weight !== '' || s.reps !== '')
    if (!filled.length) return
    setSaving(true)
    const { error } = await supabase.from('exercise_logs').insert({
      student_id: studentId, exercise_id: ex.id, date: today(),
      sets: sets.map(s => ({ set: s.set, weight: s.weight || null, reps: s.reps || null, rir: s.rir !== '' && s.rir != null ? +s.rir : null })),
    })
    setSaving(false)
    if (!error) { setSaved(true); setToast('✅ Carga salva!'); setOpen(false); setLastLog(null) }
  }

  return (
    <>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div style={{ padding: isMobile ? '14px 16px' : '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: open ? 'rgba(255,255,255,0.02)' : 'transparent' }}>

        {/* Layout MOBILE: stack vertical */}
        {isMobile ? (
          <div>
            {/* Nome + badge tipo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              {ex.type && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                  {ex.type}
                </span>
              )}
              <span style={{ fontWeight: 700, fontSize: 15, color: '#E2E8F0' }}>{ex.name}</span>
            </div>

            {/* Séries · Reps · Descanso em linha */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Séries</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: dayColor }}>{ex.sets}×</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Reps</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1' }}>{ex.reps}</div>
              </div>
              {ex.rest && <>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Descanso</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{ex.rest}</div>
                </div>
              </>
            }
            </div>

            {ex.tip && <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>💡 {ex.tip}</div>}

            {/* Botão registrar — full width no mobile */}
            <button
              onClick={() => { setOpen(o => !o); setSaved(false) }}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${saved ? '#34D39940' : open ? `${dayColor}50` : 'rgba(255,255,255,0.1)'}`,
                background: saved ? 'rgba(52,211,153,0.12)' : open ? `${dayColor}18` : 'rgba(255,255,255,0.04)',
                color: saved ? '#34D399' : open ? dayColor : '#94A3B8',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              {saved ? '✅ Carga salva hoje' : open ? '▲ Fechar registro' : '⚖️ Registrar carga'}
            </button>
          </div>
        ) : (
          /* Layout DESKTOP: grid 4 colunas */
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, alignItems: 'start' }}>
            <div>
              {ex.type && (
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>{ex.type}</span>
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0', marginBottom: 3 }}>{ex.name}</div>
              {ex.tip && <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>💡 {ex.tip}</div>}
              <button
                onClick={() => { setOpen(o => !o); setSaved(false) }}
                style={{
                  marginTop: 4, background: saved ? 'rgba(52,211,153,0.15)' : open ? `${dayColor}20` : 'rgba(255,255,255,0.05)',
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
        )}

        {/* Painel de log inline */}
        {open && (
          <div style={{ marginTop: 14, background: '#080B12', borderRadius: 14, border: `1px solid ${dayColor}25`, padding: isMobile ? 14 : 16 }}>

            {/* Último registro */}
            {lastLog && (
              <div style={{ marginBottom: 12, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#34D399', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  📅 Último — {new Date(lastLog.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lastLog.sets.map((s, i) => (
                    <span key={i} style={{ fontSize: 12, background: 'rgba(52,211,153,0.1)', borderRadius: 8, padding: '4px 10px', color: '#6EE7B7', fontWeight: 600 }}>
                      S{s.set}: {s.weight ? `${s.weight}kg` : '—'} × {s.reps || '—'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lastLog === false && (
              <div style={{ fontSize: 12, color: '#334155', marginBottom: 10 }}>Nenhum registro anterior para este exercício.</div>
            )}

            {/* Header colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 46px', gap: 6, marginBottom: 8 }}>
              {['Série', 'Carga (kg)', 'Reps feitas', 'RIR'].map(h => (
                <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>

            {/* Inputs por série */}
            {sets.map((s, idx) => (
              <div key={idx}>
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 46px 34px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: dayColor, fontWeight: 800, textAlign: 'center' }}>S{s.set}</div>
                  <input
                    type="number" inputMode="decimal"
                    placeholder={lastLog && lastLog.sets[idx]?.weight ? `Ant: ${lastLog.sets[idx].weight}` : 'kg'}
                    value={s.weight} onChange={e => updateSet(idx, 'weight', e.target.value)}
                    style={{ background: '#161B27', border: `1px solid ${s.weight ? dayColor + '60' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: isMobile ? '13px 10px' : '9px 12px', color: '#E2E8F0', fontSize: isMobile ? 16 : 14, outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                  <input
                    type="number" inputMode="numeric"
                    placeholder={lastLog && lastLog.sets[idx]?.reps ? `Ant: ${lastLog.sets[idx].reps}` : 'reps'}
                    value={s.reps} onChange={e => updateSet(idx, 'reps', e.target.value)}
                    style={{ background: '#161B27', border: `1px solid ${s.reps ? dayColor + '60' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: isMobile ? '13px 10px' : '9px 12px', color: '#E2E8F0', fontSize: isMobile ? 16 : 14, outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                  <input
                    type="number" inputMode="numeric" min="0" max="5"
                    placeholder="RIR"
                    value={s.rir||''} onChange={e => updateSet(idx, 'rir', e.target.value)}
                    title="Repetições em reserva — quanto faltava pra falhar"
                    style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: isMobile ? '13px 6px' : '9px 8px', color: '#E2E8F0', fontSize: isMobile ? 14 : 13, outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                  <button onClick={() => { setActiveTimerIdx(idx); setRestKey(k => k+1) }}
                    title="Iniciar descanso" style={{ width:32, height:32, borderRadius:8, border:`1px solid ${dayColor}50`, background: activeTimerIdx===idx ? dayColor : 'transparent', color: activeTimerIdx===idx ? '#0B0F17' : dayColor, fontSize:13, cursor:'pointer' }}>
                    ▶
                  </button>
                </div>
                {activeTimerIdx === idx && (
                  <RestTimer key={`${idx}-${restKey}`} seconds={parseRestSeconds(ex.rest)} dayColor={dayColor} onDone={() => {}} />
                )}
              </div>
            ))}

            <button
              onClick={handleSave} disabled={saving}
              style={{
                width: '100%', marginTop: 8,
                background: saving ? '#1E293B' : `linear-gradient(135deg, ${dayColor}, ${dayColor}aa)`,
                border: 'none', borderRadius: 12, padding: isMobile ? '15px' : '12px',
                color: '#fff', fontWeight: 800, fontSize: isMobile ? 16 : 14, cursor: saving ? 'default' : 'pointer',
              }}>
              {saving ? 'Salvando...' : '💾 Salvar registro de hoje'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── STUDENT VIEW PRINCIPAL ────────────────────────────────────────────────────

// ── Aba Escolinha — Visão do Aluno ───────────────────────────────────────────
function TabEscolinhaAluno({ studentId, student }) {
  const [turmas,     setTurmas]     = useState([])
  const [blocos,     setBlocos]     = useState([]) // { turma, bloco, plano, feedback }
  const [loading,    setLoading]    = useState(true)

  const TIPO_FOCO_COLORS = {
    'Físico':      { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    'Técnico':     { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    'Lúdico':      { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
    'Competitivo': { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    'Progressão':  { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    'Misto':       { color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  }
  const foco = (tipo) => TIPO_FOCO_COLORS[tipo] || TIPO_FOCO_COLORS['Misto']

  const TIPO_BLOCO_COLOR = {
    'Aquecimento': '#F97316', 'Físico': '#EF4444', 'Técnico': '#3B82F6',
    'Lúdico': '#A78BFA', 'Competitivo': '#F59E0B', 'Progressão': '#10B981', 'Volta à calma': '#06B6D4',
  }
  const blocoColor = (tipo) => TIPO_BLOCO_COLOR[tipo] || '#64748B'

  useEffect(() => {
    const load = async () => {
      try {
        // Buscar turmas do aluno
        const { data: ta } = await supabase
          .from('turma_alunos').select('turma_id').eq('student_id', studentId)
        if (!ta || ta.length === 0) { setLoading(false); return }

        const turmaIds = ta.map(r => r.turma_id)
        const { data: turmasData } = await supabase
          .from('turmas').select('*').in('id', turmaIds)
        setTurmas(turmasData || [])

        // Para cada turma, buscar planejamento ativo e semana atual
        const today = new Date()
        const allBlocos = []

        for (const turma of (turmasData || [])) {
          const { data: plans } = await supabase
            .from('planejamentos').select('*')
            .eq('turma_id', turma.id).order('created_at').limit(1)

          if (!plans || plans.length === 0) continue
          const plan = plans[0]

          // Calcular semana atual
          let semanaAtual = 1
          if (plan.data_inicio) {
            const inicio = new Date(plan.data_inicio)
            const diff = Math.floor((today - inicio) / (7 * 24 * 3600 * 1000))
            semanaAtual = Math.max(1, Math.min(diff + 1, plan.total_semanas))
          }

          // Buscar bloco da semana atual e próxima
          const { data: bls } = await supabase
            .from('blocos_semana').select('*')
            .eq('planejamento_id', plan.id)
            .in('semana_numero', [semanaAtual, semanaAtual + 1])
            .order('semana_numero')

          for (const bloco of (bls || [])) {
            // Buscar planos de aula do bloco
            const { data: planos } = await supabase
              .from('planos_aula').select('*, blocos_aula(*)')
              .eq('bloco_semana_id', bloco.id)

            // Buscar feedback (presença)
            const planoIds = (planos || []).map(p => p.id)
            let feedbacks = []
            if (planoIds.length > 0) {
              const { data: fbs } = await supabase
                .from('feedbacks_aula').select('*').in('plano_aula_id', planoIds)
              feedbacks = fbs || []
            }

            allBlocos.push({ turma, plan, bloco, planos: planos || [], feedbacks })
          }
        }

        setBlocos(allBlocos)
      } catch (err) {
        console.error('TabEscolinhaAluno error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
      Carregando escolinha...
    </div>
  )

  if (turmas.length === 0) return (
    <div style={{ padding: '50px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏟️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
        Nenhuma turma ativa
      </div>
      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
        Você ainda não foi adicionado a uma turma da escolinha.
      </div>
    </div>
  )

  // Agrupar blocos por turma
  const blocosPorTurma = {}
  blocos.forEach(b => {
    if (!blocosPorTurma[b.turma.id]) blocosPorTurma[b.turma.id] = []
    blocosPorTurma[b.turma.id].push(b)
  })

  const SPORT_ICON = { futebol:'⚽', futsal:'🥅', natacao:'🏊', basquete:'🏀', volei:'🏐', outro:'🏅' }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {turmas.map(turma => {
        const tblocos = blocosPorTurma[turma.id] || []
        const atual   = tblocos[0]
        const proxima = tblocos[1]
        const sport   = SPORT_ICON[turma.esporte] || '🏅'

        return (
          <div key={turma.id} style={{ marginBottom: 24 }}>
            {/* Header da turma */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{sport}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#E2E8F0' }}>{turma.nome}</div>
                {turma.posicao && <div style={{ fontSize: 11, color: '#475569' }}>{turma.posicao}</div>}
              </div>
            </div>

            {/* Objetivo final com progresso */}
            {atual?.plan && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                {turma.objetivo_final && (
                  <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
                    Objetivo: {turma.objetivo_final}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    Semana {atual.bloco.semana_numero} de {atual.plan.total_semanas}
                  </span>
                  <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                    {Math.round((atual.bloco.semana_numero / atual.plan.total_semanas) * 100)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#34D399,#059669)', width: Math.round((atual.bloco.semana_numero / atual.plan.total_semanas) * 100) + '%', transition: 'width 1s ease' }} />
                </div>
              </div>
            )}

            {/* Semana atual */}
            {atual && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Esta Semana — Semana {atual.bloco.semana_numero}
                </div>
                <SemanaCard
                  blocoData={atual}
                  studentId={studentId}
                  focoStyle={foco(atual.bloco.tipo_foco)}
                  blocoColorFn={blocoColor}
                  isAtual={true}
                />
              </div>
            )}

            {/* Próxima semana */}
            {proxima && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Próxima Semana — Semana {proxima.bloco.semana_numero}
                </div>
                <SemanaCard
                  blocoData={proxima}
                  studentId={studentId}
                  focoStyle={foco(proxima.bloco.tipo_foco)}
                  blocoColorFn={blocoColor}
                  isAtual={false}
                />
              </div>
            )}

            {tblocos.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#334155', fontSize: 13, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                Nenhum planejamento ativo para esta turma.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SemanaCard({ blocoData, studentId, focoStyle, blocoColorFn, isAtual }) {
  const { bloco, planos, feedbacks } = blocoData
  const { color, bg } = focoStyle

  // Verificar presença do aluno nesta semana
  const presencaCount = feedbacks.filter(fb => (fb.presencas || []).includes(studentId)).length
  const totalAulas    = planos.length

  return (
    <div style={{ background: bg, border: '1px solid ' + color + '30', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header do bloco */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + color + '20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color }}>
            {bloco.tipo_foco}
          </span>
        </div>
        {isAtual && totalAulas > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: presencaCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: presencaCount > 0 ? '#10B981' : '#475569' }}>
              {presencaCount}/{totalAulas} presenças
            </span>
          </div>
        )}
      </div>

      {/* Descrição geral */}
      {bloco.descricao_geral && (
        <div style={{ padding: '10px 16px', fontSize: 12, color, opacity: 0.8, borderBottom: '1px solid ' + color + '15' }}>
          {bloco.descricao_geral}
        </div>
      )}

      {/* Planos de aula */}
      {planos.length > 0 ? (
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {planos.map(plano => {
            const temFeedback   = feedbacks.some(fb => fb.plano_aula_id === plano.id)
            const estaPresente  = feedbacks.some(fb => fb.plano_aula_id === plano.id && (fb.presencas || []).includes(studentId))
            const bls           = (plano.blocos_aula || []).sort((a, b) => a.ordem - b.ordem)
            const minTotal      = bls.reduce((acc, b) => acc + (parseInt(b.duracao_min) || 0), 0)

            return (
              <div key={plano.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Dia + status */}
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: bls.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>
                      {plano.dia_semana}
                    </span>
                    {minTotal > 0 && (
                      <span style={{ fontSize: 10, color: '#475569' }}>{minTotal} min</span>
                    )}
                  </div>
                  {temFeedback && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: estaPresente ? '#10B981' : '#EF4444', background: estaPresente ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', borderRadius: 20, padding: '2px 8px' }}>
                      {estaPresente ? 'Presente' : 'Ausente'}
                    </span>
                  )}
                </div>

                {/* Blocos da aula */}
                {bls.length > 0 && (
                  <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {bls.map(b => {
                      const bc = blocoColorFn(b.tipo)
                      return (
                        <div key={b.id} style={{ background: bc + '15', border: '1px solid ' + bc + '30', borderRadius: 8, padding: '4px 10px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: bc }}>
                            {b.nome || b.tipo}
                          </div>
                          {b.duracao_min && (
                            <div style={{ fontSize: 9, color: bc, opacity: 0.7 }}>{b.duracao_min}min</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '14px 16px', fontSize: 11, color, opacity: 0.5, textAlign: 'center' }}>
          {isAtual ? 'Plano de aula ainda não definido para esta semana' : 'Aguardando planejamento'}
        </div>
      )}
    </div>
  )
}


// ── SugestoesMetas ───────────────────────────────────────────────────────────
function SugestoesMetas({ goals, sugestoes, student, onAdd }) {
  const jaAdicionadas = (goals||[]).map(g => g.title)
  const disponiveis   = (sugestoes||[]).filter(s => !jaAdicionadas.includes(s.titulo) && s.titulo !== 'Meta personalizada')
  if (!disponiveis.length) return null
  const CAT_C = { forca:'rgba(99,102,241,0.15)', cardio:'rgba(239,68,68,0.15)', mobilidade:'rgba(16,185,129,0.15)', composicao:'rgba(245,158,11,0.15)', outro:'rgba(100,116,139,0.15)' }
  const CAT_T = { forca:'#818CF8', cardio:'#F87171', mobilidade:'#34D399', composicao:'#FBBF24', outro:'#94A3B8' }
  return (
    <div style={{ background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
      <div style={{ fontSize:10, color:'#A78BFA', fontWeight:800, textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>
        Sugestões para {student?.goal}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {disponiveis.slice(0,4).map((s,i) => {
          const cc = CAT_C[s.categoria] || CAT_C.outro
          const ct = CAT_T[s.categoria] || CAT_T.outro
          return (
            <div key={i} onClick={onAdd}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background:cc, cursor:'pointer' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:ct }}>{s.titulo}</div>
                {s.descricao && <div style={{ fontSize:10, color:ct, opacity:0.7, marginTop:1 }}>{s.descricao}</div>}
              </div>
              <span style={{ fontSize:16, color:ct }}>+</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── PaceChart ────────────────────────────────────────────────────────────────
function PaceChart({ paceData }) {
  if (!paceData || paceData.length < 2) return null
  const W = 340, H = 140, PAD = { t:14, r:14, b:30, l:44 }
  const vals  = paceData.map(d => d.Pace)
  const minV  = Math.min(...vals), maxV = Math.max(...vals)
  const range = maxV - minV || 1
  const cx = (i) => PAD.l + (i/(paceData.length-1))*(W-PAD.l-PAD.r)
  const cy = (v) => PAD.t + ((v-minV)/range)*(H-PAD.t-PAD.b)
  const pts  = paceData.map((d,i) => cx(i)+','+cy(d.Pace)).join(' ')
  const area = 'M'+cx(0)+','+cy(paceData[0].Pace)+' '+
    paceData.slice(1).map((d,i)=>'L'+cx(i+1)+','+cy(d.Pace)).join(' ')+
    ' L'+cx(paceData.length-1)+','+(H-PAD.b)+' L'+cx(0)+','+(H-PAD.b)+' Z'
  const bestM = Math.floor(minV)
  const bestS = Math.round((minV-bestM)*60).toString().padStart(2,'0')
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
      <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F0', marginBottom:10 }}>Evolução do Pace</div>
      <div style={{ overflowX:'auto' }}>
        <svg width={W} height={H} style={{ display:'block', minWidth:W }}>
          {[0,.5,1].map(t => {
            const y = PAD.t + t*(H-PAD.t-PAD.b)
            const lv = minV + (1-t)*range
            const m=Math.floor(lv), s=Math.round((lv-m)*60).toString().padStart(2,'0')
            return (
              <g key={t}>
                <line x1={PAD.l} y1={y} x2={W-PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                <text x={PAD.l-4} y={y+4} textAnchor="end" fontSize={9} fill="#475569">{m}:{s}</text>
              </g>
            )
          })}
          {paceData.map((d,i) => (
            (i===0||i===paceData.length-1||(paceData.length>4&&i===Math.floor(paceData.length/2)))
              ? <text key={i} x={cx(i)} y={H-PAD.b+14} textAnchor="middle" fontSize={9} fill="#475569">{d.date}</text>
              : null
          ))}
          <path d={area} fill="rgba(167,139,250,0.08)" />
          <polyline points={pts} fill="none" stroke="#A78BFA" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {paceData.map((d,i) => (
            <circle key={i} cx={cx(i)} cy={cy(d.Pace)} r={4} fill="#A78BFA" stroke="#02040F" strokeWidth={2} />
          ))}
        </svg>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#475569', marginTop:6 }}>
        <span>Melhor pace: {bestM}:{bestS}/km</span>
        <span>Últimas {paceData.length} sessões com distância</span>
      </div>
    </div>
  )
}


// ── ProgressChart — gráfico SVG de evolução de peso/medidas ──────────────────
function ProgressChart({ progress }) {
  const [metric, setMetric] = useState('weight')

  const METRICS = [
    { id:'weight', label:'Peso', unit:'kg', color:'#34D399' },
    { id:'waist',  label:'Cintura', unit:'cm', color:'#60A5FA' },
    { id:'chest',  label:'Peito', unit:'cm', color:'#F59E0B' },
    { id:'hip',    label:'Quadril', unit:'cm', color:'#A78BFA' },
    { id:'thigh',  label:'Coxa', unit:'cm', color:'#F87171' },
  ]

  // Build data series from progress entries (oldest first for chart)
  const sorted = [...progress].reverse()
  const cur = METRICS.find(m => m.id === metric)

  const getData = (p) => {
    if (metric === 'weight') return p.weight ? +p.weight : null
    const m = p.measurements || {}
    const v = m[metric] || p[metric]
    return v ? +v : null
  }

  const points = sorted.map(p => ({ date: p.date, val: getData(p) })).filter(p => p.val !== null)

  if (points.length < 2) return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 16px', marginBottom:14, textAlign:'center' }}>
      <div style={{ fontSize:12, color:'#334155' }}>Registre pelo menos 2 medições para ver o gráfico de evolução.</div>
    </div>
  )

  const W = 340, H = 120, PAD = { t:12, r:16, b:28, l:40 }
  const vals  = points.map(p => p.val)
  const minV  = Math.min(...vals), maxV = Math.max(...vals)
  const range = maxV - minV || 1
  const cx = (i) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const cy = (v) => PAD.t + (1 - (v - minV) / range) * (H - PAD.t - PAD.b)
  const pts = points.map((p, i) => cx(i) + ',' + cy(p.val)).join(' ')
  const area = 'M' + cx(0) + ',' + cy(points[0].val) + ' ' +
    points.slice(1).map((p, i) => 'L' + cx(i + 1) + ',' + cy(p.val)).join(' ') +
    ' L' + cx(points.length - 1) + ',' + (H - PAD.b) + ' L' + cx(0) + ',' + (H - PAD.b) + ' Z'

  const first = points[0].val, last = points[points.length - 1].val
  const delta = +(last - first).toFixed(1)
  const improving = metric === 'weight' ? delta <= 0 : delta >= 0
  const deltaColor = delta === 0 ? '#94A3B8' : improving ? '#34D399' : '#F87171'
  const fmtDate = (d) => { const [,m,day] = d.split('-'); return day + '/' + m }

  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
      {/* Metric selector */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {METRICS.map(m => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            style={{ padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', border:'1px solid ' + (metric===m.id ? m.color : 'rgba(255,255,255,0.08)'), background: metric===m.id ? m.color+'20' : 'transparent', color: metric===m.id ? m.color : '#475569', transition:'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Delta summary */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{cur.label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:18, fontWeight:900, color:cur.color }}>{last}{cur.unit}</span>
          <span style={{ fontSize:11, fontWeight:700, color:deltaColor, background:deltaColor+'18', padding:'2px 8px', borderRadius:20 }}>
            {delta > 0 ? '+' : ''}{delta} {cur.unit}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX:'auto' }}>
        <svg width={W} height={H} style={{ display:'block', minWidth:W }}>
          {[0, 0.5, 1].map(t => {
            const y = PAD.t + t * (H - PAD.t - PAD.b)
            const v = (maxV - t * range).toFixed(1)
            return (
              <g key={t}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.04)" />
                <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={8} fill="#334155">{v}</text>
              </g>
            )
          })}
          {points.map((p, i) => (
            (i === 0 || i === points.length - 1 || (points.length > 4 && i === Math.floor(points.length / 2)))
              ? <text key={i} x={cx(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize={8} fill="#334155">{fmtDate(p.date)}</text>
              : null
          ))}
          <path d={area} fill={cur.color + '12'} />
          <polyline points={pts} fill="none" stroke={cur.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={i} cx={cx(i)} cy={cy(p.val)} r={i === points.length - 1 ? 5 : 3.5}
              fill={cur.color} stroke="#02040F" strokeWidth={2} />
          ))}
        </svg>
      </div>
      <div style={{ fontSize:10, color:'#334155', marginTop:6 }}>
        {points.length} registros · {fmtDate(points[0].date)} → {fmtDate(points[points.length-1].date)}
      </div>
    </div>
  )
}


// ── Feedback pós-treino ──────────────────────────────────────────────────────
function FeedbackModal({ studentId, onConfirm, onClose, confirming }) {
  const [esforco, setEsforco] = useState(null)
  const [dor,     setDor]     = useState(null)
  const [dorRegiao, setDorRegiao] = useState('')
  const [energia, setEnergia] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const salvar = async () => {
    setSaving(true)
    await supabase.from('student_feedbacks').insert({
      student_id: studentId, date: today(),
      esforco, dor: dor === 'sim', dor_regiao: dor === 'sim' ? (dorRegiao || null) : null, energia,
    })
    setSaving(false)
    onConfirm()
  }

  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{ padding:'8px 14px', borderRadius:20, border: active ? '1.5px solid #34D399' : '1px solid rgba(255,255,255,0.1)', background: active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)', color: active ? '#34D399' : '#94A3B8', fontSize:12, fontWeight:700, cursor:'pointer' }}>
      {children}
    </button>
  )

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0D1117', border:'1px solid rgba(52,211,153,0.25)', borderRadius:18, padding:24, width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:17, fontWeight:900, color:'#E2E8F0', marginBottom:4 }}>Como foi o treino hoje?</div>
        <div style={{ fontSize:12, color:'#475569', marginBottom:18 }}>Seu professor usa isso pra ajustar sua evolução</div>

        <div style={{ fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Percepção de esforço (1 leve · 10 máximo)</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => setEsforco(n)} style={{ width:32, height:32, borderRadius:8, border: esforco===n ? '1.5px solid #34D399' : '1px solid rgba(255,255,255,0.1)', background: esforco===n ? '#34D399' : 'rgba(255,255,255,0.03)', color: esforco===n ? '#022c22' : '#94A3B8', fontWeight:800, fontSize:12, cursor:'pointer' }}>{n}</button>
          ))}
        </div>

        <div style={{ fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Sentiu dor ou desconforto?</div>
        <div style={{ display:'flex', gap:8, marginBottom: dor==='sim' ? 10 : 18 }}>
          <Chip active={dor==='nao'} onClick={() => { setDor('nao'); setDorRegiao('') }}>Não</Chip>
          <Chip active={dor==='sim'} onClick={() => setDor('sim')}>Sim</Chip>
        </div>
        {dor === 'sim' && (
          <input value={dorRegiao} onChange={e => setDorRegiao(e.target.value)} placeholder="Onde? (ex: joelho, lombar...)"
            style={{ width:'100%', background:'#161B27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 12px', color:'#E2E8F0', fontSize:13, marginBottom:18, boxSizing:'border-box' }} />
        )}

        <div style={{ fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Nível de energia</div>
        <div style={{ display:'flex', gap:8, marginBottom:22 }}>
          {['Baixa','Média','Alta'].map(e => <Chip key={e} active={energia===e} onClick={() => setEnergia(e)}>{e}</Chip>)}
        </div>

        <button onClick={salvar} disabled={saving || confirming || !esforco || !dor || !energia}
          style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor: (saving||confirming||!esforco||!dor||!energia) ? 'not-allowed' : 'pointer', background: (!esforco||!dor||!energia) ? 'rgba(52,211,153,0.25)' : 'linear-gradient(135deg,#34D399,#059669)', color:'#022c22', fontWeight:800, fontSize:15 }}>
          {saving || confirming ? 'Salvando...' : '✓ Concluir Dia de Treino'}
        </button>
      </div>
    </div>
  )
}

// ── WorkoutCarousel — carrossel semanal de treinos ───────────────────────────
function WorkoutCarousel({ days, activePlan, confirmedToday, confirming, confirmWorkout, missedDays, showMakeup, setShowMakeup, studentId, isMobile }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [makeupSession, setMakeupSession] = useState(null)
  const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const DAY_COLORS = ['#60A5FA','#34D399','#F59E0B','#A78BFA','#F87171','#38BDF8','#FB923C']

  // Build full week: 7 slots, today highlighted
  const todayJS  = new Date().getDay() // 0=Dom
  const todayDia = DIAS_SEMANA[todayJS]

  // Map workout days by day_of_week
  const dayMap = {}
  ;(days || []).forEach(d => { if (d.day_of_week) dayMap[d.day_of_week] = d })

  // Build ordered week starting from today
  const weekSlots = DIAS_SEMANA.map((dia, jsIdx) => {
    const workout = dayMap[dia] || null
    const isToday = jsIdx === todayJS
    const diff    = (jsIdx - todayJS + 7) % 7
    return { dia, jsIdx, workout, isToday, diff }
  }).sort((a, b) => a.diff - b.diff) // today first

  const [carouselIdx, setCarouselIdx] = useState(0)
  const slot = weekSlots[carouselIdx]
  const workout = slot?.workout
  const color   = workout ? DAY_COLORS[days.findIndex(d => d.id === workout.id) % DAY_COLORS.length] : '#475569'
  const isToday = slot?.isToday

  const prev = () => setCarouselIdx(i => (i - 1 + 7) % 7)
  const next = () => setCarouselIdx(i => (i + 1) % 7)

  // Touch swipe
  const touchStart = useRef(null)
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (!touchStart.current) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStart.current = null
  }

  return (
    <div>
      {/* Day indicators row */}
      <div style={{ display:'flex', gap:4, marginBottom:14, justifyContent:'center' }}>
        {weekSlots.map((s, i) => {
          const isActive = i === carouselIdx
          const hasWorkout = !!s.workout
          const dotColor = hasWorkout ? DAY_COLORS[days.findIndex(d => d.id === s.workout?.id) % DAY_COLORS.length] : '#1E293B'
          return (
            <button key={s.dia} onClick={() => setCarouselIdx(i)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 8px', borderRadius:10, border: isActive ? '1.5px solid ' + (hasWorkout ? dotColor : '#475569') : '1.5px solid transparent', background: isActive ? (hasWorkout ? dotColor+'18' : 'rgba(255,255,255,0.05)') : 'transparent', cursor:'pointer', transition:'all 0.2s', minWidth:36 }}>
              <div style={{ fontSize:9, fontWeight:700, color: isActive ? (hasWorkout ? dotColor : '#E2E8F0') : '#334155', textTransform:'uppercase' }}>{s.dia}</div>
              <div style={{ width:6, height:6, borderRadius:'50%', background: hasWorkout ? dotColor : '#1E293B', border:'1px solid ' + (hasWorkout ? dotColor+'60' : '#334155'), boxShadow: s.isToday ? '0 0 6px ' + (hasWorkout ? dotColor : '#475569') : 'none' }} />
              {s.isToday && <div style={{ fontSize:7, color: hasWorkout ? dotColor : '#475569', fontWeight:800 }}>HOJE</div>}
            </button>
          )
        })}
      </div>

      {/* Main card */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ position:'relative', background:'#0D1117', borderRadius:18, overflow:'hidden', border:'1px solid ' + (isToday ? color : 'rgba(255,255,255,0.06)'), boxShadow: isToday ? '0 0 0 1px ' + color + '40' : 'none', transition:'all 0.3s', minHeight:200 }}>

        {/* Header */}
        <div style={{ background: color + (isToday ? '18' : '0A'), padding:'14px 16px', borderBottom:'1px solid ' + color + '20', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {isToday && <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:'0 0 8px ' + color, flexShrink:0 }} />}
            <div>
              <div style={{ fontSize:15, fontWeight:800, color: workout ? color : '#475569' }}>
                {slot.dia}{isToday ? ' — Hoje' : slot.diff === 1 ? ' — Amanhã' : ''}
              </div>
              {workout && <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{workout.focus || workout.name}</div>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={prev} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#475569', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <button onClick={next} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#475569', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>
        </div>

        {/* Content */}
        {!workout ? (
          <div style={{ padding:'32px 20px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>{isToday ? '🌙' : '—'}</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#334155' }}>
              {isToday ? 'Dia de Descanso' : 'Dia de Descanso'}
            </div>
            <div style={{ fontSize:11, color:'#1E293B', marginTop:4 }}>Recuperação é parte do treino</div>
          </div>
        ) : workout.exercises && workout.exercises.length === 0 ? (
          <div style={{ padding:'32px 20px', textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#334155' }}>Ainda em Planejamento</div>
            <div style={{ fontSize:11, color:'#1E293B', marginTop:4 }}>Seu professor ainda está montando este treino</div>
          </div>
        ) : (
          <div>
            {isToday && !confirmedToday ? (
              <div style={{ padding:'16px' }}>
                {workout.exercises.map(ex => {
                  const tc = TYPE_COLORS[ex.type] || '#64748B'
                  return (
                    <div key={ex.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      {ex.type && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:700, background:`${tc}20`, color:tc, border:`1px solid ${tc}40` }}>{ex.type}</span>}
                      <span style={{ fontSize:13, fontWeight:600, color:'#CBD5E1', flex:1 }}>{ex.name}</span>
                      <span style={{ fontSize:12, color:'#475569' }}>{ex.sets}×{ex.reps}</span>
                    </div>
                  )
                })}
                <button onClick={() => setSessionActive(true)}
                  style={{ width:'100%', marginTop:14, padding:'15px', borderRadius:12, border:'none', background:`linear-gradient(135deg, ${color}, ${color}cc)`, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  ▶ Iniciar Treino
                </button>
              </div>
            ) : (
              <div>
                {/* Column headers desktop */}
                {!isMobile && (
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 0.5fr 0.7fr 0.6fr', gap:8, padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    {['Exercício','Séries','Reps','Descanso'].map(h => (
                      <div key={h} style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
                    ))}
                  </div>
                )}
                {workout.exercises.map(ex => (
                  <ExerciseLogRow key={ex.id} ex={ex} studentId={studentId} dayColor={color} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {sessionActive && (
        <TrainingSessionView
          day={workout} studentId={studentId} dayColor={color}
          confirming={confirming}
          onClose={() => setSessionActive(false)}
          onConfirm={confirmWorkout}
        />
      )}
      {makeupSession && (
        <TrainingSessionView
          day={makeupSession} studentId={studentId} dayColor={color}
          confirming={confirming}
          onClose={() => setMakeupSession(null)}
          onConfirm={() => confirmWorkout(makeupSession)}
        />
      )}

      {/* Status — botão de concluir agora vive dentro da sessão de treino */}
      {isToday && workout && confirmedToday && (
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'16px', borderRadius:14, background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#34D399"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span style={{ fontSize:15, fontWeight:700, color:'#34D399' }}>Treino confirmado hoje!</span>
          </div>
        </div>
      )}

      {showFeedback && (
        <FeedbackModal studentId={studentId} confirming={confirming}
          onClose={() => setShowFeedback(false)}
          onConfirm={async () => { await confirmWorkout(); setShowFeedback(false) }} />
      )}

      {/* Missed days */}
      {missedDays.length > 0 && (
        <div style={{ marginTop:10 }}>
          <button onClick={() => setShowMakeup(v => !v)}
            style={{ width:'100%', padding:'11px', borderRadius:12, border:'1px solid rgba(251,191,36,0.35)', background: showMakeup ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.07)', color:'#D97706', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {missedDays.length} treino{missedDays.length > 1 ? 's' : ''} perdido{missedDays.length > 1 ? 's' : ''} esta semana — fazer agora?
          </button>
          {showMakeup && (
            <div style={{ marginTop:8, background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:14, padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:'#92400E', fontWeight:700, marginBottom:8, textAlign:'center' }}>Selecione o treino para recuperar</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {missedDays.map(missed => (
                  <button key={missed.id} onClick={() => setMakeupSession(missed)} disabled={confirming}
                    style={{ padding:'11px 14px', borderRadius:12, border:'1px solid rgba(251,191,36,0.4)', background:'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#F5C842,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:10, fontWeight:900, color:'#431C00' }}>{missed.dia}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#431C00' }}>{missed.name}</div>
                      {missed.focus && <div style={{ fontSize:10, color:'#92400E' }}>{missed.focus}</div>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#D97706"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Swipe hint */}
      <div style={{ textAlign:'center', marginTop:10, fontSize:10, color:'#1E293B' }}>
        {isMobile ? 'Deslize para ver outros dias' : 'Use ‹ › para navegar entre os dias'}
      </div>
    </div>
  )
}

export default function StudentView({ studentId }) {
  const isMobile = useIsMobile()
  const [student,    setStudent]    = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [days,       setDays]       = useState([])
  const [activeDay,  setActiveDay]  = useState(0)
  const [progress,   setProgress]   = useState([])
  const [goals,      setGoals]      = useState([])
  const [cardio,     setCardio]     = useState([])
  const [tab,        setTab]        = useState('treino')
  const [showMedidaModal, setShowMedidaModal] = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [confirmedToday, setConfirmedToday] = useState(false)
  const [confirming,     setConfirming]     = useState(false)
  const [showMakeup,     setShowMakeup]     = useState(false)
  const [missedDays,     setMissedDays]     = useState([]) // dias perdidos da semana
  const [anamData,        setAnamData]        = useState(null)
  const [avaliacoesProf,  setAvaliacoesProf]  = useState([])
  const [openAvalId,      setOpenAvalId]      = useState(null)

  useEffect(() => {
    if (!studentId) return
    supabase.from('anamnese').select('*').eq('student_id', studentId).limit(1)
      .then(({ data }) => { if (data?.[0]) setAnamData(data[0]) })
    supabase.from('measure_logs').select('*').eq('student_id', studentId).not('medidas','is',null).order('date', { ascending:false })
      .then(({ data }) => setAvaliacoesProf(data || []))
  }, [studentId])

  useEffect(() => {
    if (!studentId) { setLoading(false); return }

    const timeout = setTimeout(() => setLoading(false), 10000)

    const load = async () => {
      try {
        const { data: st } = await supabase
          .from('students').select('*').eq('id', studentId).single()
        if (st) setStudent(st)

        const { data: plans } = await supabase
          .from('workout_plans').select('*')
          .eq('student_id', studentId).eq('status', 'active')
          .order('updated_at', { ascending: false }).limit(1)

        if (plans?.[0]) {
          setActivePlan(plans[0])
          const { data: daysData } = await supabase
            .from('workout_days').select('*, exercises(*)')
            .eq('plan_id', plans[0].id).order('order_index')
          if (daysData) setDays(daysData.map(d => ({
            ...d,
            exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index),
          })))
        }

        const results = await Promise.allSettled([
          supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(10),
          supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
          supabase.from('cardio_sessions').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(120),
        ])
        const [prR, gsR, csR] = results
        if (prR.status === 'fulfilled' && prR.value.data) setProgress(prR.value.data)
        if (gsR.status === 'fulfilled' && gsR.value.data) setGoals(gsR.value.data)
        if (csR.status === 'fulfilled' && csR.value.data) setCardio(csR.value.data)

        // Check if already confirmed today
        const todayStr = today()
        const { data: logsToday } = await supabase
          .from('exercise_logs').select('id, day_id')
          .eq('student_id', studentId).eq('date', todayStr)
        if (logsToday?.length) setConfirmedToday(true)

        // Find missed days this week (days that had workouts but no log)
        const JS_TO_DIA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        weekStart.setHours(0,0,0,0)

        const { data: weekLogs } = await supabase
          .from('exercise_logs').select('date, day_id')
          .eq('student_id', studentId)
          .gte('date', weekStart.toISOString().slice(0,10))
        const loggedDayIds = new Set((weekLogs||[]).map(l => l.day_id).filter(Boolean))
        const loggedDates  = new Set((weekLogs||[]).map(l => l.date))

        // days é populado do plano ativo buscado acima
        // Precisamos aguardar o state ser setado, então fazemos direto aqui
        if (plans?.[0]) {
          const { data: daysData2 } = await supabase
            .from('workout_days').select('id, name, day_of_week, focus, order_index')
            .eq('plan_id', plans[0].id).order('order_index')

          if (daysData2) {
            const missed = []
            const DIA_JS = { Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6,Dom:0 }
            const todayJS = now.getDay()

            daysData2.forEach(d => {
              if (!d.day_of_week) return
              const diaJS = DIA_JS[d.day_of_week]
              if (diaJS === undefined) return
              // Só inclui dias que já passaram esta semana (não hoje, não futuros)
              const alreadyPassed = diaJS !== todayJS && (
                (diaJS < todayJS && !(diaJS === 0 && todayJS !== 0)) ||
                (diaJS === 0 && todayJS > 0)
              )
              if (!alreadyPassed) return
              // Já foi feito este dia?
              const jaFez = loggedDayIds.has(d.id) || (() => {
                // Verifica se tem log na data correta do dia nesta semana
                const cursor = new Date(weekStart)
                while (cursor <= now) {
                  if (cursor.getDay() === diaJS) {
                    const ds = cursor.toISOString().slice(0,10)
                    if (loggedDates.has(ds)) return true
                    break
                  }
                  cursor.setDate(cursor.getDate()+1)
                }
                return false
              })()
              if (!jaFez) missed.push({ ...d, dia: d.day_of_week })
            })
            setMissedDays(missed)
          }
        }
      } catch (err) {
        console.error('StudentView load error:', err)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: 18, fontFamily: 'system-ui,sans-serif' }}>
      ⚙️ Carregando seu treino...
    </div>
  )

  if (!student) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
      Aluno não encontrado.
    </div>
  )

  const day   = days[activeDay]
  const color = DAY_COLORS[activeDay % DAY_COLORS.length]

  const confirmWorkout = async (overrideDay = null) => {
    const targetDay = overrideDay || day
    if (!overrideDay && (confirmedToday || confirming || !day)) return
    setConfirming(true)
    const isMakeup = !!overrideDay
    const { error } = await supabase.from('exercise_logs').insert({
      student_id:    studentId,
      exercise_id:   targetDay?.exercises?.[0]?.id || null,
      date:          today(),
      sets:          [],
      day_id:        targetDay?.id || null,
      is_makeup:     isMakeup,
      scheduled_day: targetDay?.day_of_week || null,
    })
    setConfirming(false)
    if (!error) {
      if (!isMakeup) setConfirmedToday(true)
      else {
        // Remove o dia da lista de perdidos
        setMissedDays(prev => prev.filter(d => d.id !== targetDay.id))
        setShowMakeup(false)
      }
    }
  }

  // Tabs config
  const hasEscolinha = !!student?.sport

  const TABS = [
    { id: 'treino',    icon: '🏋️', label: 'Treino'    },
    { id: 'metas',     icon: '🎯', label: 'Metas'     },
    { id: 'cardio',    icon: '❤️', label: 'Cárdio'    },
    { id: 'evolucao',  icon: '📈', label: 'Evolução'  },
    ...(hasEscolinha ? [{ id: 'escolinha', icon: '⚽', label: 'Escolinha' }] : []),
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: isMobile ? 'transparent' : '#080B12',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#E2E8F0',
      // Espaço para a bottom nav no mobile
      paddingBottom: isMobile ? 80 : 0,
      position: 'relative',
    }}>
      {/* ── Céu estrelado — apenas mobile ── */}
      {isMobile && <><CosmicCSS /><StarField /></>}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '16px 14px' : '24px 16px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '18px 18px' : 24, marginBottom: 16, border: '1px solid rgba(52,211,153,0.15)' }}>
          <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Seu Plano de Treino</div>
          <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
            Olá, {student.name.split(' ')[0]}! 💪
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>{student.goal} · {student.level}</div>
          {activePlan && (
            <div style={{ marginTop: 10, background: 'rgba(52,211,153,0.08)', borderRadius: 8, padding: '7px 12px', display: 'inline-block' }}>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>📋 {activePlan.title}</span>
            </div>
          )}
        </div>

        {/* ── Tabs — desktop only (mobile usa bottom nav) ── */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {TABS.map(({ id, icon, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                background: tab === id ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)',
                color: tab === id ? '#fff' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>{icon} {label}</button>
            ))}
          </div>
        )}

        {/* ── ABA TREINO ── */}
        {tab === 'treino' && (
          <>
            {!activePlan ? (
              <div style={{ textAlign:'center', padding:'50px 20px', color:'#334155' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🏋️</div>
                <div style={{ fontSize:15, lineHeight:1.6 }}>Nenhum treino ativo.<br/>Aguarde seu professor configurar seu plano.</div>
              </div>
            ) : (
              <WorkoutCarousel
                days={days}
                activePlan={activePlan}
                confirmedToday={confirmedToday}
                confirming={confirming}
                confirmWorkout={confirmWorkout}
                missedDays={missedDays}
                showMakeup={showMakeup}
                setShowMakeup={setShowMakeup}
                studentId={studentId}
                isMobile={isMobile}
              />
            )}
          </>
        )}

        {/* ── ABA METAS ── */}
        {tab === 'metas' && (
          <TabMetas
            studentId={studentId}
            student={student}
            goals={goals}
            onUpdate={async () => {
              const { data: gs } = await supabase.from('student_goals').select('*')
                .eq('student_id', studentId).order('created_at', { ascending: false })
              if (gs) setGoals(gs)
            }}
          />
        )}

        {/* ── ABA CÁRDIO ── */}
        {tab === 'cardio' && (
          (parseInt(student?.age)||0) > 0 && (parseInt(student?.age)||0) <= 12
          ? (
            <div style={{ ...CARD, textAlign:'center', padding:'48px 24px' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🏃</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0', marginBottom:10 }}>
                Seu cardio é feito correndo e brincando!
              </div>
              <div style={{ fontSize:14, color:'#64748B', lineHeight:1.8, maxWidth:320, margin:'0 auto' }}>
                Nessa fase, as brincadeiras, os jogos e as atividades em grupo já desenvolvem
                todo o condicionamento que você precisa. Continue se movimentando e se
                divertindo — isso é o mais importante!
              </div>
              <div style={{ marginTop:20, padding:'12px 18px', background:'rgba(52,211,153,0.08)', borderRadius:12, border:'1px solid rgba(52,211,153,0.2)', display:'inline-block' }}>
                <div style={{ fontSize:12, color:'#34D399', fontWeight:700 }}>
                  Dica: participe das aulas, corra, pule e jogue bastante!
                </div>
              </div>
            </div>
          )
          : (
            <StudentCardioTab
              studentId={studentId}
              student={student}
              sessions={cardio}
              simplified={(parseInt(student?.age)||0) >= 13 && (parseInt(student?.age)||0) <= 17}
              onNewSession={async () => {
                const { data: cs } = await supabase.from('cardio_sessions').select('*')
                  .eq('student_id', studentId).order('date', { ascending: false }).limit(120)
                if (cs) setCardio(cs)
              }}
            />
          )
        )}

        {/* ── ABA EVOLUÇÃO ── */}
        {tab === 'evolucao' && (
          <div>
            {showMedidaModal && (
              <NovaMedidaModal
                studentId={studentId}
                onSave={async () => {
                  const { data: pr } = await supabase.from('progress_entries').select('*')
                    .eq('student_id', studentId).order('date', { ascending: false }).limit(10)
                  if (pr) setProgress(pr)
                }}
                onClose={() => setShowMedidaModal(false)}
              />
            )}

            {/* Header com botão */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0' }}>📈 Evolução</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{progress.length} registro{progress.length !== 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => setShowMedidaModal(true)}
                style={{
                  padding:'10px 16px', borderRadius:12, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#34D399,#059669)', color:'#022c22',
                  fontWeight:800, fontSize:13, boxShadow:'0 4px 16px rgba(52,211,153,0.3)',
                }}>+ Medidas</button>
            </div>

            {/* ── Avaliações do professor (somente leitura) ── */}
            {avaliacoesProf.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Avaliações do Professor</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {avaliacoesProf.map(a => (
                    <button key={a.id} onClick={() => setOpenAvalId(a.id)} style={{ textAlign:'left', background:'#111827', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:'inherit', fontFamily:'inherit', width:'100%' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>Avaliação Antropométrica do dia {a.date?.split('-').reverse().join('/')}{a.hora ? `, ${a.hora}` : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {openAvalId && (
              <FichaAvaliacao
                avaliacaoId={openAvalId}
                studentId={studentId}
                student={student}
                anamData={anamData}
                readOnly={true}
                onClose={() => setOpenAvalId(null)}
              />
            )}

            {progress.length === 0 ? (
              <div style={{ ...CARD, textAlign:'center', padding:'48px 20px' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📏</div>
                <div style={{ fontSize:15, color:'#475569', lineHeight:1.6 }}>
                  Nenhum registro ainda.<br/>Toque em <strong style={{color:'#34D399'}}>+ Medidas</strong> para começar!
                </div>
              </div>
            ) : (
              <>
                <ProgressChart progress={progress} />
                {progress.map((p, i) => {
                  const m = p.measurements || {}
                  const itens = [
                    { label:'Peso',        val: p.weight           ? p.weight + ' kg'              : null },
                    { label:'Cintura',     val: m.waist || p.waist ? (m.waist || p.waist) + ' cm'  : null },
                    { label:'Quadril',     val: m.hip   || p.hip   ? (m.hip   || p.hip)   + ' cm'  : null },
                    { label:'Peito',       val: m.chest || p.chest ? (m.chest || p.chest) + ' cm'  : null },
                    { label:'Braço',       val: m.arm              ? m.arm   + ' cm'               : null },
                    { label:'Coxa',        val: m.thigh || p.thigh ? (m.thigh || p.thigh) + ' cm'  : null },
                    { label:'Panturrilha', val: m.calf             ? m.calf  + ' cm'               : null },
                  ].filter(x => x.val)
                  return (
                    <div key={p.id} style={{ ...CARD, marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                        <div style={{ fontSize:13, color:'#34D399', fontWeight:700 }}>
                          {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
                        </div>
                        {i === 0 && <span style={{ fontSize:10, background:'#34D39918', color:'#34D399', padding:'2px 10px', borderRadius:20, border:'1px solid #34D39930' }}>Mais recente</span>}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
                        {itens.map(it => (
                          <div key={it.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px' }}>
                            <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{it.label}</div>
                            <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>{it.val}</div>
                          </div>
                        ))}
                      </div>
                      {p.notes && (
                        <div style={{ fontSize:12, color:'#64748B', marginTop:10, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8 }}>
                          {p.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ── ABA ESCOLINHA ── */}
        {tab === 'escolinha' && (
          <TabEscolinhaAluno studentId={studentId} student={student} />
        )}

        {/* Rodapé */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#1E293B' }}>
          Trainer App · Plano gerenciado pelo seu professor
        </div>
      </div>

      {/* ── Bottom Navigation — MOBILE ONLY ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(8,11,18,0.97)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', height: 68, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {TABS.map(({ id, icon, label }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: active ? '#34D399' : '#475569',
                transition: 'color 0.15s',
              }}>
                <span style={{ fontSize: 22, lineHeight: 1, filter: active ? 'drop-shadow(0 0 6px #34D39966)' : 'none', transition: 'filter 0.15s' }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: 0.3 }}>{label}</span>
                {active && <div style={{ position: 'absolute', bottom: 0, width: 32, height: 2, borderRadius: '2px 2px 0 0', background: '#34D399' }} />
              }
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
