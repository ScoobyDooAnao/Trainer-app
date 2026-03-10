import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// ── Constants ───────────────────────────────────────────────────────────────
const EMOJIS = [
  '💪','🏋️','🔥','⚡','🎯','🏆','🦁','🐺','🦅','🐉',
  '🌟','💥','🚀','🏃','🤸','🥊','🧠','🫀','🌊','🏔️',
  '🎖️','⚔️','🛡️','🧬','💎','🌀','🔱','🦾','🫁','🏅',
]

const DAY_OPTIONS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

const s = {
  wrap:    { minHeight:'100vh', background:'#080B12', padding:'24px 20px', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'#E2E8F0' },
  inner:   { maxWidth:680, margin:'0 auto' },
  back:    { background:'none', border:'none', color:'#475569', fontSize:14, cursor:'pointer', marginBottom:24, display:'flex', alignItems:'center', gap:6 },
  section: { background:'#0D1117', borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16, overflow:'hidden' },
  secHead: (color) => ({ background:`${color}10`, borderBottom:`1px solid ${color}25`, padding:'14px 20px', display:'flex', alignItems:'center', gap:10 }),
  secTitle:(color) => ({ fontWeight:700, fontSize:14, color }),
  secBody: { padding:'20px' },
  label:   { fontSize:11, color:'#64748B', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:6, display:'block', marginTop:14 },
  input:   { width:'100%', background:'#161B27', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 12px', color:'#E2E8F0', fontSize:14, outline:'none', boxSizing:'border-box' },
  saveBtn: (c='#34D399') => ({ background:`linear-gradient(135deg,${c},${c}cc)`, border:'none', borderRadius:10, padding:'12px 24px', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }),
  btn:     (bg,color='#fff') => ({ background:bg, border:'none', borderRadius:10, padding:'9px 18px', color, fontWeight:700, fontSize:13, cursor:'pointer' }),
}

const inp  = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#E2E8F0', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl  = { fontSize:11, color:'#94A3B8', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:5, display:'block', marginTop:14 }
const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 18px', marginBottom:12 }
const ttStyle = { background:'#1E293B', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#E2E8F0', padding:'8px 12px' }

function fmtDate(d) {
  if (!d) return ''
  return String(d).slice(5,10).split('-').reverse().join('/')
}

// ── Streak helper ────────────────────────────────────────────────────────────
function streakStyle(n) {
  if (!n) return { color:'#94A3B8', emoji:'—', glow:false }
  let color='#FDE68A', glow=false
  if      (n < 7)   color='#FDE68A'
  else if (n < 14)  color='#FCD34D'
  else if (n < 30)  color='#F5C842'
  else if (n < 90)  { color='#F59E0B'; glow=true }
  else if (n < 180) { color='#EA580C'; glow=true }
  else if (n < 365) { color='#DC2626'; glow=true }
  else              { color='#D97706'; glow=true }
  const emoji = n>=365?'👑':n>=180?'💎':n>=90?'⚡':'🔥'
  return { color, emoji, glow }
}

function calcStreak(dates) {
  const set = new Set((dates||[]).map(d=>String(d).slice(0,10)))
  const today = new Date(); today.setHours(0,0,0,0)
  let streak=0
  for (let i=0; i<730; i++) {
    const d=new Date(today); d.setDate(today.getDate()-i)
    const ds=d.toISOString().slice(0,10)
    if (set.has(ds)) streak++
    else if (i>0) break
  }
  return streak
}

// ── WeightModal ──────────────────────────────────────────────────────────────
function WeightModal({ teacherId, onSave, onClose }) {
  const [date,setPeso_d] = useState(new Date().toISOString().slice(0,10))
  const [peso,setPeso]   = useState('')
  const [notes,setNotes] = useState('')
  const [saving,setSav]  = useState(false)
  const save = async () => {
    if (!peso) return
    setSav(true)
    await supabase.from('teacher_progress').insert([{ teacher_id:teacherId, date, weight:+peso, notes }])
    setSav(false); onSave(); onClose()
  }
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:28,width:'100%',maxWidth:360 }}>
        <div style={{ fontSize:17,fontWeight:800,color:'#E2E8F0',marginBottom:18 }}>⚖️ Registrar Peso</div>
        <label style={lbl}>Data</label><input type="date" style={inp} value={date} onChange={e=>setPeso_d(e.target.value)} />
        <label style={lbl}>Peso (kg)</label><input type="number" step="0.1" placeholder="Ex: 78.5" style={inp} value={peso} onChange={e=>setPeso(e.target.value)} />
        <label style={lbl}>Observações</label><input type="text" placeholder="Opcional" style={inp} value={notes} onChange={e=>setNotes(e.target.value)} />
        <button onClick={save} disabled={saving} style={{ ...s.saveBtn('#34D399'),width:'100%',marginTop:20 }}>{saving?'Salvando...':'Salvar'}</button>
        <button onClick={onClose} style={{ width:'100%',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:12,color:'#64748B',fontWeight:600,fontSize:13,cursor:'pointer',marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── MeasureModal ─────────────────────────────────────────────────────────────
function MeasureModal({ teacherId, onSave, onClose }) {
  const [date,setDate] = useState(new Date().toISOString().slice(0,10))
  const [vals,setVals] = useState({ arm:'',chest:'',waist:'',hip:'',thigh:'',calf:'' })
  const [saving,setSav]= useState(false)
  const FIELDS = [
    {key:'arm',   label:'Braço (cm)',       icon:'💪'},
    {key:'chest', label:'Peito (cm)',        icon:'🫁'},
    {key:'waist', label:'Cintura (cm)',      icon:'📏'},
    {key:'hip',   label:'Quadril (cm)',      icon:'🍑'},
    {key:'thigh', label:'Coxa (cm)',         icon:'🦵'},
    {key:'calf',  label:'Panturrilha (cm)', icon:'🦶'},
  ]
  const save = async () => {
    setSav(true)
    const measurements = Object.fromEntries(Object.entries(vals).filter(([,v])=>v!=='').map(([k,v])=>[k,+v]))
    await supabase.from('teacher_progress').insert([{ teacher_id:teacherId, date, measurements }])
    setSav(false); onSave(); onClose()
  }
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:28,width:'100%',maxWidth:420,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ fontSize:17,fontWeight:800,color:'#E2E8F0',marginBottom:6 }}>📏 Registrar Medidas</div>
        <div style={{ fontSize:12,color:'#475569',marginBottom:18 }}>Preencha apenas os campos que mediu hoje.</div>
        <label style={lbl}>Data</label><input type="date" style={inp} value={date} onChange={e=>setDate(e.target.value)} />
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10 }}>
          {FIELDS.map(f=>(
            <div key={f.key}>
              <label style={{ ...lbl,marginTop:8 }}>{f.icon} {f.label}</label>
              <input type="number" step="0.1" placeholder="cm" style={inp} value={vals[f.key]} onChange={e=>setVals(p=>({...p,[f.key]:e.target.value}))} />
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving} style={{ ...s.saveBtn('#8B5CF6'),width:'100%',marginTop:20 }}>{saving?'Salvando...':'Salvar Medidas'}</button>
        <button onClick={onClose} style={{ width:'100%',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:12,color:'#64748B',fontWeight:600,fontSize:13,cursor:'pointer',marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── WorkoutDayEditor ─────────────────────────────────────────────────────────
function WorkoutDayEditor({ day, onUpdate }) {
  const [exName,setExName] = useState('')
  const addEx = async () => {
    if (!exName.trim()) return
    const { data } = await supabase.from('teacher_exercises').insert([{ day_id:day.id, name:exName.trim(), sets:'3', reps:'10-12', rest:'1min', order_index:(day.exercises||[]).length }]).select().single()
    if (data) onUpdate()
    setExName('')
  }
  const updateEx = async (exId, field, val) => {
    await supabase.from('teacher_exercises').update({ [field]:val }).eq('id',exId)
    onUpdate()
  }
  const deleteEx = async (exId) => {
    await supabase.from('teacher_exercises').delete().eq('id',exId)
    onUpdate()
  }
  const updateDay = async (field, val) => {
    await supabase.from('teacher_workout_days').update({ [field]:val }).eq('id',day.id)
    onUpdate()
  }

  return (
    <div style={{ ...card, border:'1px solid rgba(167,139,250,0.2)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <input defaultValue={day.name} onBlur={e=>updateDay('name',e.target.value)} style={{ ...inp,width:110,fontSize:13,fontWeight:700,color:'#A78BFA' }} />
        <input defaultValue={day.focus||''} placeholder="Foco (ex: Peito+Tríceps)" onBlur={e=>updateDay('focus',e.target.value)} style={{ ...inp,flex:1,fontSize:13 }} />
        <select defaultValue={day.day_of_week||''} onChange={e=>updateDay('day_of_week',e.target.value)} style={{ ...inp,width:80,fontSize:12 }}>
          <option value="">Dia</option>
          {DAY_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Exercícios */}
      {(day.exercises||[]).map(ex=>(
        <div key={ex.id} style={{ display:'flex',gap:8,alignItems:'center',padding:'8px 10px',background:'rgba(255,255,255,0.03)',borderRadius:8,marginBottom:6,flexWrap:'wrap' }}>
          <input defaultValue={ex.name} onBlur={e=>updateEx(ex.id,'name',e.target.value)} style={{ ...inp,flex:2,minWidth:100,fontSize:12 }} />
          <input defaultValue={ex.sets} onBlur={e=>updateEx(ex.id,'sets',e.target.value)} style={{ ...inp,width:45,fontSize:12,textAlign:'center' }} placeholder="Séries" />
          <input defaultValue={ex.reps} onBlur={e=>updateEx(ex.id,'reps',e.target.value)} style={{ ...inp,width:65,fontSize:12,textAlign:'center' }} placeholder="Reps" />
          <input defaultValue={ex.rest} onBlur={e=>updateEx(ex.id,'rest',e.target.value)} style={{ ...inp,width:60,fontSize:12,textAlign:'center' }} placeholder="Des." />
          <button onClick={()=>deleteEx(ex.id)} style={{ background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,padding:'4px 10px',color:'#F87171',fontSize:12,cursor:'pointer' }}>✕</button>
        </div>
      ))}

      {/* Adicionar exercício */}
      <div style={{ display:'flex',gap:8,marginTop:8 }}>
        <input value={exName} onChange={e=>setExName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addEx()} placeholder="Nome do exercício..." style={{ ...inp,flex:1,fontSize:12 }} />
        <button onClick={addEx} style={{ ...s.btn('rgba(167,139,250,0.15)','#A78BFA'),padding:'9px 14px',border:'1px solid rgba(167,139,250,0.3)' }}>+ Adicionar</button>
      </div>
    </div>
  )
}

// ── TabMeuTreino ─────────────────────────────────────────────────────────────
function TabMeuTreino({ teacherId }) {
  const [plans,setPlans]     = useState([])
  const [activePlan,setAP]   = useState(null)
  const [days,setDays]       = useState([])
  const [activeDay,setAD]    = useState(0)
  const [attendance,setAtt]  = useState([])
  const [checkedIn,setCI]    = useState(false)
  const [loading,setLoading] = useState(true)
  const [newPlanName,setNPN] = useState('')
  const [creatingPlan,setCP] = useState(false)
  const [exLogs,setExLogs]   = useState([])

  const loadAll = useCallback(async () => {
    const [{ data: ps }, { data: att }, { data: logs }] = await Promise.all([
      supabase.from('teacher_workout_plans').select('*').eq('teacher_id',teacherId).order('created_at',{ascending:false}),
      supabase.from('teacher_attendance').select('date').eq('teacher_id',teacherId).order('date',{ascending:false}),
      supabase.from('teacher_exercise_logs').select('*, teacher_exercises(name)').eq('teacher_id',teacherId).order('date',{ascending:true}),
    ])
    setPlans(ps||[])
    setAtt((att||[]).map(a=>a.date))
    setExLogs(logs||[])
    const todayStr = new Date().toISOString().slice(0,10)
    setCI((att||[]).some(a=>a.date===todayStr))
    setLoading(false)
  }, [teacherId])

  const loadDays = useCallback(async (planId) => {
    const { data } = await supabase.from('teacher_workout_days').select('*, teacher_exercises(*)').eq('plan_id',planId).order('order_index')
    setDays((data||[]).map(d=>({ ...d, exercises:(d.teacher_exercises||[]).sort((a,b)=>a.order_index-b.order_index) })))
    setAD(0)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { if (activePlan) loadDays(activePlan.id) }, [activePlan, loadDays])

  const createPlan = async () => {
    const title = newPlanName.trim() || 'Meu Plano de Treino'
    const { data } = await supabase.from('teacher_workout_plans').insert([{ teacher_id:teacherId, title, status:'active' }]).select().single()
    if (data) { setPlans(p=>[data,...p]); setAP(data); setNPN('') }
    setCP(false)
  }

  const addDay = async () => {
    if (!activePlan) return
    const { data } = await supabase.from('teacher_workout_days').insert([{ plan_id:activePlan.id, name:`Treino ${String.fromCharCode(65+days.length)}`, focus:'', day_of_week:'', order_index:days.length }]).select().single()
    if (data) loadDays(activePlan.id)
  }

  const deleteDay = async (dayId) => {
    await supabase.from('teacher_workout_days').delete().eq('id',dayId)
    loadDays(activePlan.id)
  }

  const checkIn = async () => {
    const todayStr = new Date().toISOString().slice(0,10)
    await supabase.from('teacher_attendance').insert([{ teacher_id:teacherId, date:todayStr }])
    setAtt(p=>[todayStr,...p]); setCI(true)
  }

  const streak = calcStreak(attendance)
  const st     = streakStyle(streak)
  const day    = days[activeDay]
  const DAY_COLORS = ['#A78BFA','#34D399','#F5C842','#F87171','#60A5FA','#FBBF24']
  const dayColor = DAY_COLORS[activeDay % DAY_COLORS.length]

  if (loading) return <div style={{ padding:40,textAlign:'center',color:'#475569' }}>Carregando...</div>

  return (
    <div style={s.secBody}>

      {/* Streak + Check-in */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10 }}>
        {streak > 0 ? (
          <div style={{ display:'flex',alignItems:'center',gap:8,background:`${st.color}15`,borderRadius:10,padding:'10px 16px',border:`1px solid ${st.color}35`,boxShadow:st.glow?`0 0 16px ${st.color}40`:'none' }}>
            <span style={{ fontSize:20 }}>{st.emoji}</span>
            <div>
              <div style={{ fontSize:14,fontWeight:800,color:st.color }}>{streak} dia{streak!==1?'s':''} seguidos</div>
              <div style={{ fontSize:10,color:'#64748B' }}>sua sequência de treinos</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:13,color:'#475569' }}>✨ Comece sua sequência hoje!</div>
        )}
        <button disabled={checkedIn} onClick={checkIn} style={{ padding:'10px 20px',borderRadius:10,border:'none',cursor:checkedIn?'default':'pointer',fontWeight:800,fontSize:13,transition:'all 0.2s',
          background:checkedIn?'rgba(52,211,153,0.15)':'linear-gradient(135deg,#34D399,#059669)',
          color:checkedIn?'#34D399':'#FFF',boxShadow:checkedIn?'none':'0 4px 15px rgba(52,211,153,0.3)' }}>
          {checkedIn ? '✅ Presença marcada!' : '📍 Marcar presença hoje'}
        </button>
      </div>

      {/* Seletor de plano */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,color:'#64748B',fontWeight:700,letterSpacing:1,textTransform:'uppercase',marginBottom:10 }}>Plano ativo</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:12 }}>
          {plans.map(p=>(
            <button key={p.id} onClick={()=>setAP(p)} style={{ padding:'8px 16px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,
              background:activePlan?.id===p.id?'linear-gradient(135deg,#A78BFA,#7C3AED)':'rgba(255,255,255,0.06)',
              color:activePlan?.id===p.id?'#FFF':'#94A3B8' }}>
              🏋️ {p.title}
            </button>
          ))}
          {!creatingPlan ? (
            <button onClick={()=>setCP(true)} style={{ padding:'8px 16px',borderRadius:10,border:'1px dashed rgba(167,139,250,0.4)',background:'transparent',color:'#A78BFA',fontSize:12,fontWeight:700,cursor:'pointer' }}>+ Novo plano</button>
          ) : (
            <div style={{ display:'flex',gap:6 }}>
              <input autoFocus value={newPlanName} onChange={e=>setNPN(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createPlan()} placeholder="Nome do plano..." style={{ ...inp,width:180,fontSize:12,padding:'8px 12px' }} />
              <button onClick={createPlan} style={{ ...s.btn('rgba(167,139,250,0.2)','#A78BFA'),padding:'8px 12px',border:'1px solid rgba(167,139,250,0.3)' }}>✓</button>
              <button onClick={()=>setCP(false)} style={{ ...s.btn('rgba(255,255,255,0.05)','#64748B'),padding:'8px 12px' }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Editor do plano */}
      {activePlan && (
        <>
          {/* Seletor de dias */}
          <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:18 }}>
            {days.map((d,i)=>{
              const c=DAY_COLORS[i%DAY_COLORS.length]
              return (
                <button key={d.id} onClick={()=>setAD(i)} style={{ flex:1,minWidth:70,padding:'10px 8px',borderRadius:10,cursor:'pointer',fontWeight:800,fontSize:12,
                  border:activeDay===i?`2px solid ${c}`:'1px solid rgba(255,255,255,0.08)',
                  background:activeDay===i?`${c}18`:'rgba(255,255,255,0.03)',
                  color:activeDay===i?c:'#475569' }}>
                  {d.name}
                  {d.day_of_week&&<div style={{ fontSize:9,marginTop:2,fontWeight:500 }}>{d.day_of_week}</div>}
                </button>
              )
            })}
            <button onClick={addDay} style={{ flex:1,minWidth:70,padding:'10px 8px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:12,border:'1px dashed rgba(167,139,250,0.35)',background:'transparent',color:'#A78BFA' }}>+</button>
          </div>

          {/* Editor do dia selecionado */}
          {day && (
            <div>
              <WorkoutDayEditor day={day} onUpdate={()=>loadDays(activePlan.id)} />
              <button onClick={()=>deleteDay(day.id)} style={{ fontSize:11,color:'#475569',background:'transparent',border:'none',cursor:'pointer',marginTop:4 }}>🗑 Excluir este dia</button>
            </div>
          )}
          {days.length===0 && (
            <div style={{ textAlign:'center',padding:30,color:'#334155' }}>
              <div style={{ fontSize:30,marginBottom:8 }}>📋</div>
              <div>Clique em "+" para adicionar o primeiro dia de treino.</div>
            </div>
          )}
        </>
      )}

      {!activePlan && plans.length===0 && (
        <div style={{ textAlign:'center',padding:40,color:'#334155' }}>
          <div style={{ fontSize:36,marginBottom:10 }}>🏋️</div>
          <div>Crie seu primeiro plano de treino acima.</div>
        </div>
      )}
    </div>
  )
}

// ── TabMinhaEvolucao ─────────────────────────────────────────────────────────
function TabMinhaEvolucao({ teacherId }) {
  const [progress,setProg]         = useState([])
  const [exLogs,setExLogs]         = useState([])
  const [showWeight,setShowWeight] = useState(false)
  const [showMeasure,setShowMeas]  = useState(false)
  const [loading,setLoading]       = useState(true)

  const loadAll = useCallback(async () => {
    const [{ data: pr }, { data: logs }] = await Promise.all([
      supabase.from('teacher_progress').select('*').eq('teacher_id',teacherId).order('date',{ascending:true}),
      supabase.from('teacher_exercise_logs').select('*, teacher_exercises(name)').eq('teacher_id',teacherId).order('date',{ascending:true}),
    ])
    setProg(pr||[])
    setExLogs(logs||[])
    setLoading(false)
  }, [teacherId])

  useEffect(() => { loadAll() }, [loadAll])

  const pesoData = progress.filter(p=>p.weight).map(p=>({ x:fmtDate(p.date), Peso:+p.weight }))

  const medidasData = progress.filter(p=>p.measurements&&Object.keys(p.measurements).length>0).map(p=>({
    x:fmtDate(p.date),
    Braço:       p.measurements.arm   ? +p.measurements.arm   : undefined,
    Cintura:     p.measurements.waist ? +p.measurements.waist : undefined,
    Peito:       p.measurements.chest ? +p.measurements.chest : undefined,
    Quadril:     p.measurements.hip   ? +p.measurements.hip   : undefined,
    Coxa:        p.measurements.thigh ? +p.measurements.thigh : undefined,
    Panturrilha: p.measurements.calf  ? +p.measurements.calf  : undefined,
  }))

  const forcaByEx={}
  exLogs.forEach(log=>{
    const name=log.teacher_exercises?.name||'Exercício'
    const maxW=Math.max(...(log.sets||[]).map(s=>+s.weight||0))
    if (!maxW) return
    if (!forcaByEx[name]) forcaByEx[name]=[]
    forcaByEx[name].push({ x:fmtDate(log.date), [name]:maxW })
  })
  const forcaExs=['#34D399','#F5C842','#F87171','#60A5FA']
  const forcaKeys=Object.keys(forcaByEx).slice(0,4)
  const forcaData=(() => {
    const byDate={}
    forcaKeys.forEach(ex=>forcaByEx[ex].forEach(row=>{ if(!byDate[row.x])byDate[row.x]={x:row.x}; byDate[row.x][ex]=row[ex] }))
    return Object.values(byDate).sort((a,b)=>a.x>b.x?1:-1)
  })()

  const MEDS_COLORS={ Braço:'#34D399', Cintura:'#F5C842', Peito:'#60A5FA', Quadril:'#F87171', Coxa:'#A78BFA', Panturrilha:'#FBBF24' }

  if (loading) return <div style={{ padding:40,textAlign:'center',color:'#475569' }}>Carregando...</div>

  return (
    <div style={s.secBody}>
      {showWeight  && <WeightModal  teacherId={teacherId} onSave={loadAll} onClose={()=>setShowWeight(false)} />}
      {showMeasure && <MeasureModal teacherId={teacherId} onSave={loadAll} onClose={()=>setShowMeas(false)} />}

      {/* Botões */}
      <div style={{ display:'flex',gap:10,marginBottom:20 }}>
        <button onClick={()=>setShowWeight(true)} style={{ flex:1,...s.saveBtn('#34D399'),padding:'12px' }}>⚖️ Adicionar Peso</button>
        <button onClick={()=>setShowMeas(true)}   style={{ flex:1,...s.saveBtn('#8B5CF6'),padding:'12px' }}>📏 Adicionar Medidas</button>
      </div>

      {/* Gráfico Peso */}
      {pesoData.length>=2 && (
        <div style={card}>
          <div style={{ fontSize:14,fontWeight:800,color:'#E2E8F0',marginBottom:14 }}>⚖️ Evolução do Peso</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={pesoData} margin={{ top:5,right:10,left:-10,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" tick={{ fontSize:10,fill:'#475569' }} />
              <YAxis tick={{ fontSize:10,fill:'#475569' }} unit="kg" domain={['auto','auto']} />
              <Tooltip contentStyle={ttStyle} />
              <Line type="monotone" dataKey="Peso" stroke="#34D399" strokeWidth={2.5} dot={{ r:4,fill:'#34D399',stroke:'#080B12',strokeWidth:2 }} unit=" kg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico Medidas */}
      {medidasData.length>=2 && (
        <div style={card}>
          <div style={{ fontSize:14,fontWeight:800,color:'#E2E8F0',marginBottom:14 }}>📏 Evolução das Medidas</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={medidasData} margin={{ top:5,right:10,left:-10,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" tick={{ fontSize:10,fill:'#475569' }} />
              <YAxis tick={{ fontSize:10,fill:'#475569' }} unit="cm" domain={['auto','auto']} />
              <Tooltip contentStyle={ttStyle} />
              <Legend wrapperStyle={{ fontSize:11,color:'#94A3B8' }} />
              {Object.keys(MEDS_COLORS).map(key=>
                medidasData.some(d=>d[key]!==undefined) &&
                <Line key={key} type="monotone" dataKey={key} stroke={MEDS_COLORS[key]} strokeWidth={2} dot={{ r:3 }} unit=" cm" connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico Força */}
      {forcaData.length>=2 && (
        <div style={card}>
          <div style={{ fontSize:14,fontWeight:800,color:'#E2E8F0',marginBottom:14 }}>💪 Evolução da Força</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={forcaData} margin={{ top:5,right:10,left:-10,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" tick={{ fontSize:10,fill:'#475569' }} />
              <YAxis tick={{ fontSize:10,fill:'#475569' }} unit="kg" domain={['auto','auto']} />
              <Tooltip contentStyle={ttStyle} />
              <Legend wrapperStyle={{ fontSize:11,color:'#94A3B8' }} />
              {forcaKeys.map((ex,i)=><Line key={ex} type="monotone" dataKey={ex} stroke={forcaExs[i]} strokeWidth={2} dot={{ r:3 }} unit=" kg" connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {pesoData.length===0 && medidasData.length===0 && forcaData.length===0 && (
        <div style={{ textAlign:'center',padding:40,color:'#334155' }}>
          <div style={{ fontSize:36,marginBottom:10 }}>📈</div>
          <div>Use os botões acima para começar a monitorar sua evolução.</div>
        </div>
      )}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function TeacherProfile({ navigate, session }) {
  const uid = session.user.id

  const [profile,setProfile]     = useState(null)
  const [loading,setLoading]     = useState(true)
  const [saving,setSaving]       = useState(null)
  const [toast,setToast]         = useState(null)
  const [workoutTab,setWT]       = useState('treino')  // treino | evolucao

  // Campos públicos
  const [displayName,setDN] = useState('')
  const [emoji,setEmoji]    = useState('💪')
  const [cref,setCref]      = useState('')
  const [whatsapp,setWA]    = useState('')

  // Campos privados
  const [fullName,setFN] = useState('')
  const [age,setAge]     = useState('')

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('teacher_profiles').select('*').eq('id',uid).single()
    if (data) {
      setProfile(data); setDN(data.display_name||''); setEmoji(data.emoji||'💪')
      setCref(data.cref||''); setWA(data.whatsapp||''); setFN(data.full_name||''); setAge(data.age||'')
    }
    setLoading(false)
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2500) }

  const savePublic = async () => {
    setSaving('public')
    const payload = { id:uid, display_name:displayName, emoji, cref, whatsapp, updated_at:new Date().toISOString() }
    const { error } = profile ? await supabase.from('teacher_profiles').update(payload).eq('id',uid) : await supabase.from('teacher_profiles').insert(payload)
    setSaving(null)
    if (!error) { setProfile(p=>({...p,...payload})); showToast('✅ Dados públicos salvos!') }
  }

  const savePrivate = async () => {
    setSaving('private')
    const payload = { id:uid, full_name:fullName, age:age?+age:null, updated_at:new Date().toISOString() }
    const { error } = profile ? await supabase.from('teacher_profiles').update(payload).eq('id',uid) : await supabase.from('teacher_profiles').insert(payload)
    setSaving(null)
    if (!error) { setProfile(p=>({...p,...payload})); showToast('✅ Dados privados salvos!') }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh',background:'#080B12',display:'flex',alignItems:'center',justifyContent:'center',color:'#34D399' }}>
      Carregando perfil...
    </div>
  )

  return (
    <div style={s.wrap}>
      {toast && (
        <div style={{ position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:'#34D399',color:'#052e16',borderRadius:50,padding:'10px 22px',fontWeight:800,fontSize:13,zIndex:999,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(52,211,153,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={s.inner}>
        <button style={s.back} onClick={()=>navigate('dashboard')}>← Voltar ao Dashboard</button>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0f2027,#203a43)',borderRadius:20,padding:24,marginBottom:20,border:'1px solid rgba(52,211,153,0.12)',display:'flex',alignItems:'center',gap:20 }}>
          <div style={{ width:72,height:72,borderRadius:20,background:'rgba(52,211,153,0.1)',border:'2px solid rgba(52,211,153,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:38 }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontSize:10,color:'#34D399',letterSpacing:3,textTransform:'uppercase',marginBottom:4 }}>Perfil do Professor</div>
            <div style={{ fontSize:22,fontWeight:800,color:'#fff' }}>{displayName||fullName||session.user.email}</div>
            <div style={{ fontSize:13,color:'#475569',marginTop:2 }}>
              {cref&&<span style={{ marginRight:12 }}>📋 CREF {cref}</span>}
              {whatsapp&&<span>📱 {whatsapp}</span>}
            </div>
          </div>
        </div>

        {/* ── SEÇÃO PÚBLICA ── */}
        <div style={s.section}>
          <div style={s.secHead('#34D399')}>
            <span style={{ fontSize:16 }}>👁️</span>
            <div>
              <div style={s.secTitle('#34D399')}>Visível para os alunos</div>
              <div style={{ fontSize:11,color:'#475569' }}>Estas informações aparecem na página de cada aluno</div>
            </div>
          </div>
          <div style={s.secBody}>
            <label style={s.label}>Emoji que representa você</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:4 }}>
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>setEmoji(e)} style={{ fontSize:22,width:44,height:44,borderRadius:10,cursor:'pointer',
                  background:emoji===e?'rgba(52,211,153,0.15)':'rgba(255,255,255,0.04)',
                  border:`2px solid ${emoji===e?'#34D399':'rgba(255,255,255,0.07)'}`,transition:'all 0.15s' }}>
                  {e}
                </button>
              ))}
            </div>
            <label style={s.label}>Nome de exibição</label>
            <input style={s.input} placeholder="Ex: Prof. Carlos" value={displayName} onChange={e=>setDN(e.target.value)} />
            <label style={s.label}>CREF</label>
            <input style={s.input} placeholder="Ex: 012345-G/SP" value={cref} onChange={e=>setCref(e.target.value)} />
            <label style={s.label}>WhatsApp para contato</label>
            <input style={s.input} placeholder="Ex: (11) 99999-9999" value={whatsapp} onChange={e=>setWA(e.target.value)} />
            <div style={{ marginTop:20 }}>
              <button style={s.saveBtn('#34D399')} onClick={savePublic} disabled={saving==='public'}>
                {saving==='public'?'Salvando...':'💾 Salvar dados públicos'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO PRIVADA ── */}
        <div style={s.section}>
          <div style={s.secHead('#A78BFA')}>
            <span style={{ fontSize:16 }}>🔒</span>
            <div>
              <div style={s.secTitle('#A78BFA')}>Informações privadas</div>
              <div style={{ fontSize:11,color:'#475569' }}>Somente você vê estes dados</div>
            </div>
          </div>
          <div style={s.secBody}>
            <label style={s.label}>Nome completo</label>
            <input style={s.input} placeholder="Seu nome completo" value={fullName} onChange={e=>setFN(e.target.value)} />
            <label style={s.label}>Idade</label>
            <input style={s.input} type="number" placeholder="Ex: 30" value={age} onChange={e=>setAge(e.target.value)} />
            <div style={{ marginTop:6,padding:'10px 14px',background:'rgba(167,139,250,0.06)',borderRadius:10,border:'1px solid rgba(167,139,250,0.15)' }}>
              <div style={{ fontSize:11,color:'#94A3B8' }}>📧 E-mail da conta: <strong style={{ color:'#CBD5E1' }}>{session.user.email}</strong></div>
            </div>
            <div style={{ marginTop:20 }}>
              <button style={s.saveBtn('#A78BFA')} onClick={savePrivate} disabled={saving==='private'}>
                {saving==='private'?'Salvando...':'💾 Salvar dados privados'}
              </button>
            </div>
          </div>
        </div>

        {/* ── MEU TREINO PESSOAL ── */}
        <div style={s.section}>
          <div style={s.secHead('#FBBF24')}>
            <span style={{ fontSize:16 }}>🏋️</span>
            <div>
              <div style={s.secTitle('#FBBF24')}>Meu Treino Pessoal</div>
              <div style={{ fontSize:11,color:'#475569' }}>Privado — apenas você tem acesso</div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{ display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {[['treino','🏋️ Treino'],['evolucao','📈 Evolução']].map(([id,label])=>(
              <button key={id} onClick={()=>setWT(id)} style={{ flex:1,padding:'12px',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,transition:'all 0.15s',
                background:workoutTab===id?'rgba(251,191,36,0.08)':'transparent',
                color:workoutTab===id?'#FBBF24':'#475569',
                borderBottom:workoutTab===id?'2px solid #FBBF24':'2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>

          {workoutTab==='treino'   && <TabMeuTreino      teacherId={uid} />}
          {workoutTab==='evolucao' && <TabMinhaEvolucao  teacherId={uid} />}
        </div>

      </div>
    </div>
  )
}
