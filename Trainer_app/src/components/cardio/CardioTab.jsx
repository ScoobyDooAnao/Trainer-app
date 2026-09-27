import { useState } from 'react'
import { supabase } from '../../supabase'
import { today, CARD, INP, LBL } from '../../lib/studentViewShared'

// ── Cárdio — modais de registro, prescrição e aba principal do aluno ───────────
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



export { StudentCardioTab }
