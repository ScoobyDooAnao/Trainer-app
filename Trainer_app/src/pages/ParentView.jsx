import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

function calcAge(student) {
  if (student?.birth_date) return Math.floor((new Date() - new Date(student.birth_date)) / (365.25*24*3600000))
  return student?.age ? parseInt(student.age) : null
}
function calcLTAD(age, exp, sport) {
  if (!age||!sport) return null
  const e = exp||0
  if (age<9)              return {fase:'FUNdamentals',    cor:'#60A5FA',desc:'Habilidades motoras fundamentais e ludicidade'}
  if (age<=11&&e<3)       return {fase:'FUNdamentals',    cor:'#60A5FA',desc:'Habilidades motoras fundamentais e ludicidade'}
  if (age<=12)            return {fase:'Learn to Train',  cor:'#34D399',desc:'Aprender habilidades esportivas gerais'}
  if (age<=15&&e<4)       return {fase:'Learn to Train',  cor:'#34D399',desc:'Aprender habilidades esportivas gerais'}
  if (age<=16)            return {fase:'Train to Train',  cor:'#FBBF24',desc:'Construir base física específica ao esporte'}
  if (age<=17&&e<5)       return {fase:'Train to Train',  cor:'#FBBF24',desc:'Construir base física específica ao esporte'}
  if (age<=18)            return {fase:'Train to Compete',cor:'#C084FC',desc:'Especialização e desempenho competitivo'}
  return null
}
const SPORT_LABELS = {
  futebol:'⚽ Futebol',futsal:'🥅 Futsal',natacao:'🏊 Natação',tenis:'🎾 Tênis',
  basquete:'🏀 Basquete',volei:'🏐 Vôlei',atletismo:'🏃 Atletismo',ginastica:'🤸 Ginástica',
  judo:'🥋 Judô',ciclismo:'🚴 Ciclismo',handebol:'🤾 Handebol',saude:'🌿 Saúde e Bem-Estar',custom:'🏅 Outro',
}
function getFreq(logs, cardio) {
  const now=new Date(), w=[0,0,0,0]
  ;[...(logs||[]).map(l=>l.date),...(cardio||[]).map(c=>c.date)].forEach(d=>{
    const wk=Math.floor((now-new Date(d+'T12:00:00'))/(7*86400000))
    if(wk>=0&&wk<4) w[wk]++
  })
  return w.reverse()
}

function CSS() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    .pv{font-family:'Barlow',sans-serif;background:#040D18;min-height:100vh;color:#E8F0F8;}
    .pv-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:22px;}
    .pv-card-gold{background:rgba(255,220,100,0.04);border:1px solid rgba(255,220,100,0.12);border-radius:18px;padding:22px;}
    .pv-stat{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 12px;text-align:center;}
    .pv-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;}
    .pv-day{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.05);margin-bottom:8px;}
    .pv-bar-t{height:7px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;}
    .pv-bar-f{height:100%;border-radius:99px;transition:width 1s cubic-bezier(.4,0,.2,1);}
    .pv-wa{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:17px;border-radius:14px;background:linear-gradient(135deg,#22C55E,#16A34A);color:#fff;font-family:'Barlow',sans-serif;font-size:16px;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 24px rgba(34,197,94,0.3);transition:all 0.2s;}
    .pv-wa:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(34,197,94,0.4);}
    .pv-h1{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;letter-spacing:0.5px;color:#F0F6FF;margin-bottom:3px;}
    .pv-sub{font-size:12px;color:rgba(255,255,255,0.35);}
    @keyframes pvIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes flkr{0%,100%{opacity:1}50%{opacity:.88}92%{opacity:.94}95%{opacity:.98}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes twinkle{0%,100%{opacity:.9;r:1}50%{opacity:.3;r:.5}}
    @keyframes grassWave{0%,100%{opacity:.13}50%{opacity:.18}}
    @keyframes fogDrift{0%{transform:translateX(-8px)}100%{transform:translateX(8px)}}
    @keyframes crowdPulse{0%,100%{opacity:.55}50%{opacity:.75}}
    .ani{animation:pvIn 0.5s ease both;}
    .star{animation:twinkle 3s ease-in-out infinite;}
  `}</style>
}

function FreqBars({weeks}) {
  const max=Math.max(...weeks,1)
  const labels=['3 sem atrás','2 sem atrás','Sem passada','Esta semana']
  return (
    <div style={{display:'flex',gap:10,alignItems:'flex-end',height:100}}>
      {weeks.map((v,i)=>{
        const isNow=i===3, h=v>0?Math.max((v/max)*72,14):5
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{fontSize:13,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:v>0?(isNow?'#FFDC64':'rgba(255,255,255,0.5)'):'rgba(255,255,255,0.15)'}}>{v>0?`${v}x`:'—'}</div>
            <div style={{width:'100%',borderRadius:8,height:h,background:v>0?(isNow?'linear-gradient(180deg,#FFDC64,#F59E0B)':'rgba(255,255,255,0.15)'):'rgba(255,255,255,0.05)',boxShadow:isNow&&v>0?'0 0 16px rgba(255,220,100,0.4)':'none',transition:'height 1s cubic-bezier(.4,0,.2,1)'}}/>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textAlign:'center',lineHeight:1.3,textTransform:'uppercase',letterSpacing:0.5}}>{labels[i]}</div>
          </div>
        )
      })}
    </div>
  )
}

function GoalRow({goal}) {
  const done=goal.status==='concluida'
  const pct=goal.target_value&&goal.current_value!=null?Math.min(Math.round((goal.current_value/goal.target_value)*100),100):null
  return (
    <div style={{padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',gap:12,alignItems:'flex-start'}}>
      <div style={{width:34,height:34,borderRadius:10,background:done?'rgba(52,211,153,0.12)':'rgba(251,191,36,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{done?'⭐':'🎯'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,color:'#E8F0F8',marginBottom:5}}>{goal.title}</div>
        {done?(
          <span className="pv-pill" style={{background:'rgba(52,211,153,0.1)',color:'#34D399',border:'1px solid rgba(52,211,153,0.2)',fontSize:11}}>✓ Conquistada</span>
        ):pct!=null?(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{goal.current_value} / {goal.target_value} {goal.target_unit}</span>
              <span style={{fontSize:11,fontWeight:700,color:pct>=80?'#34D399':pct>=50?'#FBBF24':'#60A5FA'}}>{pct}%</span>
            </div>
            <div className="pv-bar-t"><div className="pv-bar-f" style={{width:`${pct}%`,background:pct>=80?'linear-gradient(90deg,#34D399,#059669)':pct>=50?'linear-gradient(90deg,#FBBF24,#D97706)':'linear-gradient(90deg,#60A5FA,#3B82F6)'}}/></div>
          </div>
        ):(
          <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Em andamento</span>
        )}
      </div>
      </div>
    </div>
  )
}

export default function ParentView({studentId}) {
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(null)
  const [student,setStudent]=useState(null)
  const [teacher,setTeacher]=useState(null)
  const [plan,setPlan]=useState(null)
  const [goals,setGoals]=useState([])
  const [logs,setLogs]=useState([])
  const [cardio,setCardio]=useState([])
  const [progress,setProgress]=useState([])
  const statRef=useRef(null)

  useEffect(()=>{
    const load=async()=>{
      try{
        const {data:st,error:e}=await supabase.from('students')
          .select('id,name,age,weight,height,goal,level,sport,sport_position,experience_years,guardian_name,teacher_id,notes,birth_date')
          .eq('id',studentId).single()
        if(e||!st){setError('Aluno não encontrado.');setLoading(false);return}
        setStudent(st)
        const [tR,plR,gsR,lR,cR,pR]=await Promise.all([
          supabase.from('teacher_profiles').select('display_name,emoji,cref,whatsapp').eq('id',st.teacher_id).single(),
          supabase.from('workout_plans').select('*,workout_days(*,exercises(*))').eq('student_id',studentId).eq('status','active').order('updated_at',{ascending:false}).limit(1),
          supabase.from('student_goals').select('*').eq('student_id',studentId).order('created_at',{ascending:false}),
          supabase.from('exercise_logs').select('date').eq('student_id',studentId).order('date',{ascending:false}).limit(200),
          supabase.from('cardio_sessions').select('date,duration_minutes,type,pse').eq('student_id',studentId).order('date',{ascending:false}).limit(60),
          supabase.from('progress_entries').select('date,weight').eq('student_id',studentId).order('date',{ascending:false}).limit(1),
        ])
        if(tR.data) setTeacher(tR.data)
        if(plR.data?.[0]) setPlan(plR.data[0])
        if(gsR.data) setGoals(gsR.data)
        if(lR.data) setLogs(lR.data)
        if(cR.data) setCardio(cR.data)
        if(pR.data) setProgress(pR.data)
      }catch(err){setError('Erro ao carregar. Tente novamente.')}
      finally{setLoading(false)}
    }
    load()
  },[studentId])

  if(loading) return(
    <div className="pv" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
      <CSS/>
      <div style={{width:36,height:36,border:'3px solid rgba(255,255,255,0.1)',borderTopColor:'#FFDC64',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.3)',letterSpacing:1}}>Carregando...</div>
    </div>
  )
  if(error||!student) return(
    <div className="pv" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:12}}>
      <CSS/>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:15,color:'#F87171',fontWeight:600}}>{error||'Página não encontrada'}</div>
    </div>
  )

  const age=calcAge(student)
  const ltad=calcLTAD(age,student.experience_years,student.sport)
  const freq=getFreq(logs,cardio)
  const totalSess=freq.reduce((a,b)=>a+b,0)
  const activeDays=plan?.workout_days?.length||0
  const activeGoals=goals.filter(g=>g.status==='ativa')
  const wonGoals=goals.filter(g=>g.status==='concluida')
  const lastW=progress[0]?.weight||student.weight
  const lastSeen=logs[0]?.date||cardio[0]?.date
  const dAgo=lastSeen?Math.floor((new Date()-new Date(lastSeen+'T12:00:00'))/86400000):null
  const act=dAgo==null?null
    :dAgo===0?{label:'Treinou hoje',color:'#34D399',bg:'rgba(52,211,153,0.12)'}
    :dAgo===1?{label:'Treinou ontem',color:'#34D399',bg:'rgba(52,211,153,0.12)'}
    :dAgo<=4?{label:`Há ${dAgo} dias`,color:'#FBBF24',bg:'rgba(251,191,36,0.12)'}
    :{label:`${dAgo}d sem treinar`,color:'#F87171',bg:'rgba(248,113,113,0.12)'}
  const waMsg=encodeURIComponent(`Olá ${teacher?.display_name||'professor'}! Sou responsável pelo atleta ${student.name} e gostaria de conversar sobre seu acompanhamento.`)
  const waUrl=teacher?.whatsapp?`https://wa.me/55${teacher.whatsapp.replace(/\D/g,'')}?text=${waMsg}`:null
  const accs=['#60A5FA','#34D399','#FBBF24','#C084FC','#F87171','#22D3EE']
  const sport=SPORT_LABELS[student.sport]||student.sport

  // Esta semana
  const now7=new Date(), week7ago=new Date(now7.getTime()-7*86400000)
  const sessWeek=[...logs,...cardio].filter(s=>new Date(s.date+'T12:00:00')>=week7ago).length
  const cardioMin=cardio.filter(s=>new Date(s.date+'T12:00:00')>=week7ago).reduce((a,s)=>a+(s.duration_minutes||0),0)
  const allDatesSet=[...new Set([...logs,...cardio].map(s=>s.date))].sort((a,b)=>b.localeCompare(a))
  let streak=0
  if(allDatesSet.length){
    let cursor=new Date(); cursor.setHours(0,0,0,0)
    for(const d of allDatesSet){
      const dd=new Date(d+'T12:00:00'); dd.setHours(0,0,0,0)
      if(Math.round((cursor-dd)/86400000)<=1){streak++; cursor=new Date(dd)} else break
    }
  }
  const motivMsg=streak>=7?`🔥 ${streak} dias seguidos treinando — dedicação impressionante!`
    :streak>=3?`💪 ${streak} dias consecutivos de treino`
    :sessWeek>=3?`✅ ${sessWeek} sessões esta semana — dentro do planejado`
    :sessWeek>=1?`🏃 ${sessWeek} sessão${sessWeek>1?'s':''} registrada${sessWeek>1?'s':''} esta semana`
    :'📋 Nenhuma sessão registrada esta semana'
  const motivColor=streak>=7?'#FBBF24':streak>=3?'#34D399':sessWeek>=3?'#34D399':sessWeek>=1?'#60A5FA':'#64748B'


  return(
    <div className="pv">
      <CSS/>

      {/* ══ HEADER — STADIUM NIGHT ══════════════════════════════════════════ */}
      <div style={{position:'relative',background:'linear-gradient(180deg,#020912 0%,#040E1C 40%,#061526 70%,#0C2240 100%)',overflow:'hidden',minHeight:420,paddingBottom:0}}>

        {/* ── Layer 1: Night sky + stars ── */}
        <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'55%',pointerEvents:'none'}} viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
          {/* Stars — varied sizes and delays */}
          {[
            [30,15,1.1,0],[65,8,0.8,1.2],[110,22,1.3,0.5],[155,6,0.7,2.1],[195,18,1,0.8],
            [240,10,0.9,1.5],[285,25,1.2,0.3],[330,12,0.8,1.8],[370,7,1,0.6],[50,35,0.7,2.4],
            [90,42,1.1,0.9],[140,30,0.8,1.4],[200,38,1.3,0.2],[260,28,0.9,1.7],[310,45,0.7,0.7],
            [360,33,1,2],[20,55,0.8,1.1],[80,60,1.2,0.4],[160,52,0.7,1.9],[220,65,1,0.1],
            [290,58,0.9,1.3],[345,48,1.1,0.8],[120,70,0.8,2.2],[175,75,1,0.5],[250,68,0.7,1.6],
          ].map(([cx,cy,r,delay],i)=>(
            <circle key={i} cx={cx} cy={cy} r={r} fill="white" fillOpacity="0.7" className="star" style={{animationDelay:`${delay}s`,animationDuration:`${2.5+i*0.15}s`}}/>
          ))}
          {/* Moon glow top-right */}
          <circle cx="360" cy="22" r="14" fill="none" stroke="rgba(255,240,180,0.12)" strokeWidth="8"/>
          <circle cx="360" cy="22" r="8" fill="rgba(255,240,180,0.06)"/>
        </svg>

        {/* ── Layer 2: Stadium structure (roof arc + masts) ── */}
        <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none'}} viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Floodlight beam gradients */}
            <linearGradient id="bL1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor="#FFDC64" stopOpacity="0.22"/><stop offset="100%" stopColor="#FFDC64" stopOpacity="0"/></linearGradient>
            <linearGradient id="bL2" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#FFDC64" stopOpacity="0.15"/><stop offset="100%" stopColor="#FFDC64" stopOpacity="0"/></linearGradient>
            <linearGradient id="bR1" x1="1" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#FFDC64" stopOpacity="0.22"/><stop offset="100%" stopColor="#FFDC64" stopOpacity="0"/></linearGradient>
            <linearGradient id="bR2" x1="1" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#FFDC64" stopOpacity="0.15"/><stop offset="100%" stopColor="#FFDC64" stopOpacity="0"/></linearGradient>
            {/* Grass glow */}
            <radialGradient id="grassGlow" cx="50%" cy="100%" r="60%"><stop offset="0%" stopColor="#22C55E" stopOpacity="0.18"/><stop offset="100%" stopColor="#22C55E" stopOpacity="0"/></radialGradient>
            {/* Stands gradient */}
            <linearGradient id="standsL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1a3a6e" stopOpacity="0.9"/><stop offset="100%" stopColor="#0f2347" stopOpacity="0.7"/></linearGradient>
            <linearGradient id="standsR" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stopColor="#1a3a6e" stopOpacity="0.9"/><stop offset="100%" stopColor="#0f2347" stopOpacity="0.7"/></linearGradient>
          </defs>

          {/* Stadium roof arc */}
          <path d="M-20,80 Q200,10 420,80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2"/>
          <path d="M-20,86 Q200,16 420,86" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          {/* Roof support cables */}
          {[60,130,200,270,340].map((x,i)=>(
            <line key={i} x1={x} y1={i%2===0?14:18} x2={x+20} y2={85} stroke="rgba(255,255,255,0.07)" strokeWidth="0.7"/>
          ))}

          {/* Floodlight masts */}
          {/* Left mast */}
          <rect x="18" y="14" width="4" height="55" fill="rgba(200,210,230,0.25)" rx="1"/>
          <rect x="8"  y="12" width="24" height="5"  fill="rgba(200,210,230,0.2)"  rx="1"/>
          {/* Right mast */}
          <rect x="378" y="14" width="4" height="55" fill="rgba(200,210,230,0.25)" rx="1"/>
          <rect x="368" y="12" width="24" height="5"  fill="rgba(200,210,230,0.2)"  rx="1"/>

          {/* ── Floodlight beams — wide cones ── */}
          {/* Left outer beam */}
          <polygon points="20,17 -10,320 40,320" fill="url(#bL1)"/>
          {/* Left inner beam */}
          <polygon points="20,17 60,300 140,300" fill="url(#bL2)"/>
          {/* Right outer beam */}
          <polygon points="380,17 410,320 360,320" fill="url(#bR1)"/>
          {/* Right inner beam */}
          <polygon points="380,17 340,300 260,300" fill="url(#bR2)"/>
          {/* Beam edge glows */}
          <line x1="20" y1="17" x2="-10" y2="320" stroke="#FFDC64" strokeWidth="0.6" strokeOpacity="0.3"/>
          <line x1="20" y1="17" x2="140" y2="300" stroke="#FFDC64" strokeWidth="0.6" strokeOpacity="0.2"/>
          <line x1="380" y1="17" x2="410" y2="320" stroke="#FFDC64" strokeWidth="0.6" strokeOpacity="0.3"/>
          <line x1="380" y1="17" x2="260" y2="300" stroke="#FFDC64" strokeWidth="0.6" strokeOpacity="0.2"/>

          {/* ── Left stands (arquibancada) ── */}
          <path d="M0,420 L0,200 L80,240 L80,420 Z" fill="url(#standsL)"/>
          {/* Seat rows left — 8 rows */}
          {[0,1,2,3,4,5,6,7].map(row=>{
            const y=210+row*26, x1=2, x2=78, tilt=row*5
            return <line key={row} x1={x1} y1={y+tilt*0.3} x2={x2} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
          })}
          {/* Crowd dots left */}
          {[0,1,2,3,4,5,6].map(row=>
            [0,1,2,3,4,5,6,7].map(col=>{
              const x=6+col*9, y=214+row*26
              const col2=['#e03','#c55','#fff','#aaf','#f80','#8f8'][Math.floor(Math.random()*6)]
              return <circle key={`${row}-${col}`} cx={x} cy={y} r="2.2" fill={col2} fillOpacity="0.35"/>
            })
          )}

          {/* ── Right stands (arquibancada) ── */}
          <path d="M400,420 L400,200 L320,240 L320,420 Z" fill="url(#standsR)"/>
          {/* Seat rows right */}
          {[0,1,2,3,4,5,6,7].map(row=>{
            const y=210+row*26
            return <line key={row} x1={322} y1={y} x2={398} y2={y+row*0.3} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
          })}
          {/* Crowd dots right */}
          {[0,1,2,3,4,5,6].map(row=>
            [0,1,2,3,4,5,6,7].map(col=>{
              const x=324+col*9, y=214+row*26
              const col2=['#e03','#c55','#fff','#aaf','#f80','#8f8'][Math.floor(Math.random()*6)]
              return <circle key={`${row}-${col}`} cx={x} cy={y} r="2.2" fill={col2} fillOpacity="0.35"/>
            })
          )}

          {/* ── Top stands (fundo do estádio) ── */}
          <rect x="80" y="200" width="240" height="65" fill="rgba(15,35,71,0.85)"/>
          {/* Top stand rows */}
          {[0,1,2,3,4,5].map(row=>(
            <line key={row} x1="80" y1={210+row*10} x2="320" y2={210+row*10} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
          ))}
          {/* Top crowd dots */}
          {[0,1,2,3,4].map(row=>
            Array.from({length:24}).map((_,col)=>{
              const x=85+col*9.5, y=213+row*10
              const cols=['#e03','#c55','#fff','#aaf','#f80','#e03','#8f8']
              return <circle key={`t${row}-${col}`} cx={x} cy={y} r="2" fill={cols[col%cols.length]} fillOpacity="0.3"/>
            })
          )}

          {/* ── Pitch / field ── */}
          {/* Field base */}
          <rect x="80" y="265" width="240" height="155" fill="rgba(15,80,35,0.6)" rx="2"/>
          {/* Grass glow overlay */}
          <rect x="80" y="265" width="240" height="155" fill="url(#grassGlow)" rx="2"/>
          {/* Field lines */}
          <rect x="82" y="267" width="236" height="151" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" rx="1"/>
          {/* Centre line */}
          <line x1="200" y1="267" x2="200" y2="418" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
          {/* Centre circle */}
          <circle cx="200" cy="342" r="30" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
          <circle cx="200" cy="342" r="2"  fill="rgba(255,255,255,0.4)"/>
          {/* Penalty areas */}
          <rect x="153" y="267" width="94" height="30" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9"/>
          <rect x="153" y="388" width="94" height="30" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9"/>
          {/* Goal areas */}
          <rect x="177" y="267" width="46" height="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
          <rect x="177" y="404" width="46" height="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
          {/* Goals */}
          <rect x="188" y="263" width="24" height="6"  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <rect x="188" y="418" width="24" height="6"  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          {/* Grass stripe pattern */}
          {[0,1,2,3,4,5,6,7].map(i=>(
            <rect key={i} x={82+i*30} y="267" width="15" height="151" fill="rgba(0,0,0,0.06)"/>
          ))}
          {/* Penalty spot */}
          <circle cx="200" cy="285" r="1.5" fill="rgba(255,255,255,0.35)"/>
          <circle cx="200" cy="400" r="1.5" fill="rgba(255,255,255,0.35)"/>
        </svg>

        {/* ── Layer 3: Atmospheric fog / light haze on pitch ── */}
        <div style={{
          position:'absolute',bottom:'8%',left:'15%',right:'15%',height:'35%',
          background:'radial-gradient(ellipse at 50% 100%,rgba(255,220,100,0.07) 0%,rgba(34,197,94,0.05) 40%,transparent 70%)',
          animation:'grassWave 4s ease-in-out infinite alternate',
          pointerEvents:'none',
        }}/>
        {/* Side fog */}
        <div style={{position:'absolute',top:'45%',left:0,width:'22%',height:'55%',background:'linear-gradient(90deg,rgba(10,30,60,0.6),transparent)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'45%',right:0,width:'22%',height:'55%',background:'linear-gradient(-90deg,rgba(10,30,60,0.6),transparent)',pointerEvents:'none'}}/>

        {/* ── Layer 4: Floodlight glow halos at fixture points ── */}
        <div style={{position:'absolute',top:10,left:14,width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,220,100,0.9) 20%,rgba(255,220,100,0.3) 60%,transparent 80%)',boxShadow:'0 0 20px 8px rgba(255,220,100,0.35)',animation:'flkr 3.6s ease-in-out infinite'}}/>
        <div style={{position:'absolute',top:10,right:14,width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,220,100,0.9) 20%,rgba(255,220,100,0.3) 60%,transparent 80%)',boxShadow:'0 0 20px 8px rgba(255,220,100,0.35)',animation:'flkr 3.6s ease-in-out infinite 0.7s'}}/>

        {/* ── Layer 5: Content overlay fade ── */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'45%',background:'linear-gradient(to top,rgba(4,13,24,0.95) 0%,rgba(4,13,24,0.6) 60%,transparent 100%)',pointerEvents:'none'}}/>

        {/* Content */}
        <div style={{position:'relative',zIndex:2,padding:'26px 20px 36px',marginTop:220}}>

          {/* Coach badge */}
          {teacher&&(
            <div className="ani" style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,220,100,0.08)',border:'1px solid rgba(255,220,100,0.18)',borderRadius:99,padding:'6px 14px',marginBottom:20}}>
              <span style={{fontSize:15}}>{teacher.emoji||'💪'}</span>
              <span style={{fontSize:12,color:'rgba(255,220,100,0.85)',fontWeight:600,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5}}>{teacher.display_name||'Seu professor'}</span>
              {teacher.cref&&<span style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:"'Barlow Condensed',sans-serif"}}>CREF {teacher.cref}</span>}
            </div>
          )}

          <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',letterSpacing:3,textTransform:'uppercase',marginBottom:8,fontFamily:"'Barlow Condensed',sans-serif"}}>Acompanhamento do Atleta</div>

          {/* Name — scoreboard font */}
          <div className="ani" style={{animationDelay:'0.07s',fontFamily:"'Barlow Condensed',sans-serif",fontSize:46,fontWeight:900,color:'#FFFFFF',letterSpacing:'-0.5px',lineHeight:1,marginBottom:16,textShadow:'0 0 60px rgba(255,220,100,0.12)'}}>
            {student.name}
          </div>

          {/* Badges */}
          <div className="ani" style={{animationDelay:'0.14s',display:'flex',flexWrap:'wrap',gap:7,marginBottom:26}}>
            {age&&<span className="pv-pill" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.65)',border:'1px solid rgba(255,255,255,0.1)'}}>{age} anos</span>}
            {sport&&<span className="pv-pill" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.65)',border:'1px solid rgba(255,255,255,0.1)'}}>{sport}</span>}
            {ltad&&<span className="pv-pill" style={{background:`${ltad.cor}18`,color:ltad.cor,border:`1px solid ${ltad.cor}35`}}>{ltad.fase}</span>}
            {act&&<span className="pv-pill" style={{background:act.bg,color:act.color,border:`1px solid ${act.color}35`}}>{act.label}</span>}
          </div>

          {/* Scoreboard strip */}
          <div className="ani" style={{animationDelay:'0.2s',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,220,100,0.1)',background:'rgba(0,0,0,0.25)'}}>
            {[
              {icon:'🏃',val:totalSess,label:'Sessões (4 sem)'},
              {icon:'📅',val:activeDays||'—',label:'Dias/semana'},
              {icon:'🎯',val:activeGoals.length,label:'Metas ativas'},
            ].map(({icon,val,label},i)=>(
              <div key={i} style={{padding:'15px 8px',textAlign:'center',borderLeft:i>0?'1px solid rgba(255,220,100,0.07)':undefined,background:'rgba(255,220,100,0.02)'}}>
                <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,color:'#FFDC64',lineHeight:1}}>{val}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:0.7,marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{position:'relative',background:'#040D18'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)',backgroundSize:'48px 48px',pointerEvents:'none'}}/>
        <svg style={{position:'absolute',top:0,right:0,opacity:0.03,pointerEvents:'none'}} width='220' height='220' viewBox='0 0 220 220'><circle cx='220' cy='0' r='140' fill='none' stroke='white' strokeWidth='1.5'/><circle cx='220' cy='0' r='90' fill='none' stroke='white' strokeWidth='1'/></svg>
        <svg style={{position:'absolute',bottom:0,left:0,opacity:0.03,pointerEvents:'none'}} width='220' height='220' viewBox='0 0 220 220'><circle cx='0' cy='220' r='140' fill='none' stroke='white' strokeWidth='1.5'/><circle cx='0' cy='220' r='90' fill='none' stroke='white' strokeWidth='1'/></svg>
      {/* ══ CARDS ════════════════════════════════════════════════════════════ */}
      <div style={{padding:'20px 16px',display:'flex',flexDirection:'column',gap:14,maxWidth:560,margin:'0 auto',position:'relative',zIndex:1}}>

        {/* Esta Semana */}
        <div className="ani" style={{animationDelay:'0.05s',borderRadius:18,overflow:'hidden',position:'relative',background:'linear-gradient(135deg,rgba(255,220,100,0.08),rgba(255,220,100,0.03))',border:'1px solid rgba(255,220,100,0.18)'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(255,220,100,0.6),transparent)'}}/>
          <div style={{padding:'18px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,color:'rgba(255,220,100,0.6)',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Esta Semana</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:'#F0F6FF',letterSpacing:0.3}}>{student.name.split(' ')[0]}</div>
              </div>
              {streak>0&&(
                <div style={{textAlign:'center',background:'rgba(255,220,100,0.1)',border:'1px solid rgba(255,220,100,0.2)',borderRadius:12,padding:'8px 14px'}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:'#FFDC64',lineHeight:1}}>{streak}</div>
                  <div style={{fontSize:9,color:'rgba(255,220,100,0.5)',textTransform:'uppercase',letterSpacing:0.8,marginTop:2}}>dias seguidos</div>
                </div>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
              {[
                {icon:'🏋️',label:'Treinos',val:sessWeek},
                {icon:'❤️',label:'Min. Cardio',val:cardioMin||'—'},
                {icon:'⭐',label:'Metas',val:wonGoals.length||'—'},
              ].map(({icon,label,val},i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'10px 8px',textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{fontSize:16,marginBottom:3}}>{icon}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:'#F0F6FF',lineHeight:1}}>{val}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:0.5,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:`1px solid ${motivColor}30`,fontSize:13,color:motivColor,fontWeight:600}}>
              {motivMsg}
            </div>
          </div>
        </div>

        {/* Frequência */}
        <div className="pv-card ani" style={{animationDelay:'0.1s'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
            <div><div className="pv-h1">Frequência</div><div className="pv-sub">Sessões registradas nas últimas 4 semanas</div></div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,color:'#FFDC64',lineHeight:1}}>{totalSess}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:0.5}}>sessões</div>
            </div>
          </div>
          <FreqBars weeks={freq}/>
          {totalSess===0&&<div style={{marginTop:14,padding:'10px 14px',borderRadius:10,background:'rgba(248,113,113,0.07)',border:'1px solid rgba(248,113,113,0.14)',fontSize:12,color:'#F87171'}}>Nenhuma sessão registrada nas últimas 4 semanas</div>}
        </div>

        {/* Plano */}
        {plan&&(
          <div className="pv-card ani" style={{animationDelay:'0.15s'}}>
            <div className="pv-h1" style={{marginBottom:3}}>Plano Ativo</div>
            <div className="pv-sub" style={{marginBottom:14}}>Estrutura do treino atual</div>
            <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.3)',marginBottom:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:'uppercase'}}>{plan.title}</div>
            {(plan.workout_days||[]).sort((a,b)=>(a.order_index||0)-(b.order_index||0)).map((day,i)=>{
              const types=[...new Set((day.exercises||[]).map(e=>e.type).filter(Boolean))]
              const acc=accs[i%accs.length]
              return(
                <div key={day.id} className="pv-day">
                  <div style={{width:36,height:36,borderRadius:10,background:`${acc}18`,border:`1px solid ${acc}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:acc,flexShrink:0,fontFamily:"'Barlow Condensed',sans-serif"}}>{day.day_of_week?.slice(0,3)||`D${i+1}`}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#E8F0F8'}}>{day.title||`Treino ${i+1}`}</div>
                    {types.length>0&&<div style={{fontSize:11,color:'rgba(255,255,255,0.28)',marginTop:2}}>{types.slice(0,3).join(' · ')}</div>}
                  </div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.22)',fontWeight:500,flexShrink:0}}>{(day.exercises||[]).length} exerc.</div>
                </div>
              )
            })}
            {activeDays>0&&<div style={{marginTop:4,padding:'10px 14px',borderRadius:10,background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.12)',fontSize:12,color:'#34D399',fontWeight:500}}>✅ {activeDays} treino{activeDays>1?'s':''}/semana planejado{activeDays>1?'s':''} — frequência adequada para a fase de desenvolvimento</div>}
          </div>
        )}

        {/* Metas */}
        {goals.length>0&&(
          <div className="pv-card ani" style={{animationDelay:'0.2s'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
              <div className="pv-h1">Metas</div>
              {wonGoals.length>0&&<span style={{fontSize:12,color:'#34D399',fontWeight:600}}>⭐ {wonGoals.length} conquistada{wonGoals.length>1?'s':''}</span>}
            </div>
            <div className="pv-sub" style={{marginBottom:6}}>{activeGoals.length} em andamento</div>
            {goals.slice(0,5).map(g=><GoalRow key={g.id} goal={g}/>)}
          </div>
        )}

        {/* Físico */}
        {(lastW||student.height)&&(
          <div className="pv-card ani" style={{animationDelay:'0.25s'}}>
            <div className="pv-h1" style={{marginBottom:3}}>Físico</div>
            <div className="pv-sub" style={{marginBottom:14}}>Dados corporais mais recentes</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{label:'Peso',val:lastW?`${lastW} kg`:'—'},{label:'Altura',val:student.height?`${student.height} cm`:'—'}].map(({label,val})=>(
                <div key={label} className="pv-stat">
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:6}}>{label}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:'#F0F6FF'}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LTAD */}
        {ltad&&(
          <div className="pv-card-gold ani" style={{animationDelay:'0.3s'}}>
            <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
              <div style={{width:42,height:42,borderRadius:12,background:`${ltad.cor}18`,border:`1px solid ${ltad.cor}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🏅</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:ltad.cor,marginBottom:4,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5,textTransform:'uppercase'}}>Fase de Desenvolvimento: {ltad.fase}</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.55}}>{ltad.desc}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.22)',marginTop:6}}>Modelo LTAD (Balyi 2013) — O treino é periodizado para esta fase específica.</div>
              </div>
            </div>
          </div>
        )}

        {/* Obs. professor */}
        {student.notes&&(
          <div className="pv-card ani" style={{animationDelay:'0.33s'}}>
            <div className="pv-h1" style={{marginBottom:12}}>Observações do Professor</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.65,padding:'12px 14px',background:'rgba(251,191,36,0.04)',borderRadius:12,borderLeft:'3px solid rgba(251,191,36,0.35)'}}>{student.notes}</div>
          </div>
        )}

        {/* WhatsApp */}
        <div className="pv-card ani" style={{animationDelay:'0.36s'}}>
          <div className="pv-h1" style={{marginBottom:3}}>Fale com o Professor</div>
          <div className="pv-sub" style={{marginBottom:16}}>Dúvidas sobre o treino ou a evolução do seu filho</div>
          {waUrl?(
            <button className="pv-wa" onClick={()=>window.open(waUrl,'_blank')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar mensagem no WhatsApp
            </button>
          ):(
            <div style={{padding:'14px',borderRadius:12,background:'rgba(255,255,255,0.03)',fontSize:13,color:'rgba(255,255,255,0.2)',textAlign:'center',border:'1px dashed rgba(255,255,255,0.07)'}}>Professor ainda não cadastrou o WhatsApp</div>
          )}
        </div>

        {/* Footer */}
        <div style={{textAlign:'center',padding:'8px 0 40px'}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.13)',fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:'uppercase'}}>{teacher?.display_name||'Personal Trainer'} · Acompanhamento Esportivo Personalizado</div>
        </div>
      </div>
    </div>
  )
}
