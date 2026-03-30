import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Helpers ──────────────────────────────────────────────────────────────────
const calcAge = s => s?.birth_date
  ? Math.floor((new Date()-new Date(s.birth_date))/(365.25*24*3600000))
  : s?.age ? parseInt(s.age) : null

const calcLTAD = (age,exp,sport) => {
  if(!age||!sport) return null
  const e=exp||0
  if(age<9)             return {fase:'FUNdamentals',    cor:'#60A5FA',desc:'Habilidades motoras fundamentais',next:'Learn to Train',nextAge:9}
  if(age<=11&&e<3)      return {fase:'FUNdamentals',    cor:'#60A5FA',desc:'Habilidades motoras fundamentais',next:'Learn to Train',nextAge:12}
  if(age<=12)           return {fase:'Learn to Train',  cor:'#34D399',desc:'Aprender habilidades esportivas gerais',next:'Train to Train',nextAge:13}
  if(age<=15&&e<4)      return {fase:'Learn to Train',  cor:'#34D399',desc:'Aprender habilidades esportivas gerais',next:'Train to Train',nextAge:16}
  if(age<=16)           return {fase:'Train to Train',  cor:'#FBBF24',desc:'Construir base física específica',next:'Train to Compete',nextAge:17}
  if(age<=17&&e<5)      return {fase:'Train to Train',  cor:'#FBBF24',desc:'Construir base física específica',next:'Train to Compete',nextAge:18}
  if(age<=18)           return {fase:'Train to Compete',cor:'#C084FC',desc:'Especialização competitiva',next:null,nextAge:null}
  return null
}

const SPORT_LABELS = {
  futebol:'⚽ Futebol',futsal:'🥅 Futsal',natacao:'🏊 Natação',tenis:'🎾 Tênis',
  basquete:'🏀 Basquete',volei:'🏐 Vôlei',atletismo:'🏃 Atletismo',ginastica:'🤸 Ginástica',
  judo:'🥋 Judô',ciclismo:'🚴 Ciclismo',handebol:'🤾 Handebol',saude:'🌿 Saúde',custom:'🏅 Outro',
}

// Benchmarks por faixa etária e modalidade (referência ACSM / NSCA)
const getBenchmarks = (age, sport) => {
  const isYouth = age && age <= 15
  const isTeen  = age && age > 15 && age <= 18
  const base = isYouth ? [
    {label:'Frequência semanal', unit:'dias/sem', student:null, ref:3,   max:5,  desc:'Meta: 3–4x por semana para a fase de desenvolvimento'},
    {label:'Resistência aeróbia', unit:'min contínuo', student:null, ref:20, max:45, desc:'Capacidade de manter esforço moderado contínuo'},
    {label:'Consistência mensal', unit:'% sessões', student:null, ref:75, max:100,desc:'Percentual de treinos realizados vs planejados'},
    {label:'Força relativa', unit:'nível 1–5', student:null, ref:3,   max:5,  desc:'Força em relação ao peso corporal (padrões NSCA)'},
  ] : [
    {label:'Frequência semanal', unit:'dias/sem', student:null, ref:4,   max:6,  desc:'Meta: 4–5x por semana para atleta competitivo'},
    {label:'Resistência aeróbia', unit:'min contínuo', student:null, ref:30, max:60, desc:'Capacidade de manter esforço moderado contínuo'},
    {label:'Consistência mensal', unit:'% sessões', student:null, ref:80, max:100,desc:'Percentual de treinos realizados vs planejados'},
    {label:'Força relativa', unit:'nível 1–5', student:null, ref:4,   max:5,  desc:'Força em relação ao peso corporal (padrões NSCA)'},
  ]
  if(sport==='futebol'||sport==='futsal') base.push(
    {label:'Agilidade / mudança dir.', unit:'nível 1–5', student:null, ref:isYouth?3:4, max:5, desc:'Capacidade de mudar direção com velocidade e controle'},
    {label:'Explosão (potência)', unit:'nível 1–5', student:null, ref:isYouth?2:3, max:5, desc:'Salto e sprint curto — base do futebol'}
  )
  if(sport==='natacao') base.push(
    {label:'Técnica de nado', unit:'nível 1–5', student:null, ref:isYouth?3:4, max:5, desc:'Eficiência de movimento na água'},
    {label:'Força de puxada', unit:'nível 1–5', student:null, ref:isYouth?2:3, max:5, desc:'Força dos membros superiores para propulsão'}
  )
  return base
}

const getFreq4w = (logs, cardio) => {
  const now=new Date(), w=[0,0,0,0]
  ;[...(logs||[]).map(l=>l.date),...(cardio||[]).map(c=>c.date)].forEach(d=>{
    const wk=Math.floor((now-new Date(d+'T12:00:00'))/(7*86400000))
    if(wk>=0&&wk<4) w[wk]++
  })
  return w.reverse()
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const PV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  .pv{font-family:'Barlow',sans-serif;background:#040D18;min-height:100vh;color:#E8F0F8;}
  .pv-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:22px;margin-bottom:0;}
  .pv-card-gold{background:rgba(255,220,100,0.05);border:1px solid rgba(255,220,100,0.15);border-radius:18px;padding:22px;}
  .pv-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;}
  .pv-h1{font-family:'Barlow Condensed',sans-serif;font-size:21px;font-weight:800;letter-spacing:0.3px;color:#F0F6FF;margin-bottom:3px;}
  .pv-sub{font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:0;}
  .pv-wa{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:17px;border-radius:14px;background:linear-gradient(135deg,#22C55E,#16A34A);color:#fff;font-family:'Barlow',sans-serif;font-size:16px;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 24px rgba(34,197,94,0.3);transition:all 0.2s;}
  .pv-wa:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(34,197,94,0.4);}
  .pv-day-dot{width:11px;height:11px;border-radius:3px;transition:transform 0.1s;}
  .pv-day-dot:hover{transform:scale(1.4);}
  @keyframes pvIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes flkr{0%,100%{opacity:1}50%{opacity:.88}92%{opacity:.94}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes twinkle{0%,100%{opacity:.8}50%{opacity:.2}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes barGrow{from{width:0}to{width:var(--w)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
  .ani{animation:pvIn 0.5s ease both;}
  .star{animation:twinkle 3s ease-in-out infinite;}
`

function CSS(){return <style>{PV_CSS}</style>}

// ── Stadium Header ────────────────────────────────────────────────────────────
function StadiumHeader({student,teacher,age,ltad,act,totalSess,activeDays,activeGoals}){
  const sport=SPORT_LABELS[student.sport]||student.sport
  return(
    <div style={{position:'relative',background:'linear-gradient(180deg,#020912 0%,#040E1C 40%,#061526 70%,#0C2240 100%)',overflow:'hidden',minHeight:420}}>
      <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'55%',pointerEvents:'none'}} viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
        {[[30,15,1.1,0],[65,8,0.8,1.2],[110,22,1.3,0.5],[155,6,0.7,2.1],[195,18,1,0.8],[240,10,0.9,1.5],[285,25,1.2,0.3],[330,12,0.8,1.8],[370,7,1,0.6],[50,35,0.7,2.4],[90,42,1.1,0.9],[140,30,0.8,1.4],[200,38,1.3,0.2],[260,28,0.9,1.7],[310,45,0.7,0.7],[360,33,1,2],[20,55,0.8,1.1],[80,60,1.2,0.4],[160,52,0.7,1.9],[220,65,1,0.1],[290,58,0.9,1.3],[345,48,1.1,0.8]].map(([cx,cy,r,delay],i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill="white" fillOpacity="0.7" className="star" style={{animationDelay:`${delay}s`,animationDuration:`${2.5+i*0.15}s`}}/>
        ))}
        <circle cx="360" cy="22" r="14" fill="none" stroke="rgba(255,240,180,0.12)" strokeWidth="8"/>
        <circle cx="360" cy="22" r="8" fill="rgba(255,240,180,0.06)"/>
      </svg>
      <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none'}} viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bL1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor="#FFDC64" stopOpacity="0.22"/><stop offset="100%" stopColor="#FFDC64" stopOpacity="0"/></linearGradient>
          <linearGradient id="bR1" x1="1" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#FFDC64" stopOpacity="0.22"/><stop offset="100%" stopColor="#FFDC64" stopOpacity="0"/></linearGradient>
          <linearGradient id="standsL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1a3a6e" stopOpacity="0.9"/><stop offset="100%" stopColor="#0f2347" stopOpacity="0.7"/></linearGradient>
          <linearGradient id="standsR" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stopColor="#1a3a6e" stopOpacity="0.9"/><stop offset="100%" stopColor="#0f2347" stopOpacity="0.7"/></linearGradient>
          <radialGradient id="grassG" cx="50%" cy="100%" r="60%"><stop offset="0%" stopColor="#22C55E" stopOpacity="0.2"/><stop offset="100%" stopColor="#22C55E" stopOpacity="0"/></radialGradient>
        </defs>
        <path d="M-20,80 Q200,10 420,80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2"/>
        {[60,130,200,270,340].map((x,i)=><line key={i} x1={x} y1={i%2===0?14:18} x2={x+20} y2={85} stroke="rgba(255,255,255,0.07)" strokeWidth="0.7"/>)}
        <rect x="18" y="14" width="4" height="55" fill="rgba(200,210,230,0.25)" rx="1"/>
        <rect x="8"  y="12" width="24" height="5" fill="rgba(200,210,230,0.2)" rx="1"/>
        <rect x="378" y="14" width="4" height="55" fill="rgba(200,210,230,0.25)" rx="1"/>
        <rect x="368" y="12" width="24" height="5" fill="rgba(200,210,230,0.2)" rx="1"/>
        <polygon points="20,17 -10,320 60,320" fill="url(#bL1)"/>
        <polygon points="380,17 410,320 340,320" fill="url(#bR1)"/>
        <line x1="20" y1="17" x2="-10" y2="320" stroke="#FFDC64" strokeWidth="0.6" strokeOpacity="0.3"/>
        <line x1="380" y1="17" x2="410" y2="320" stroke="#FFDC64" strokeWidth="0.6" strokeOpacity="0.3"/>
        <path d="M0,420 L0,200 L80,240 L80,420 Z" fill="url(#standsL)"/>
        {[0,1,2,3,4,5,6,7].map(row=><line key={row} x1={2} y1={210+row*26+row*0.3} x2={78} y2={210+row*26} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>)}
        {[0,1,2,3,4,5,6].map(row=>[0,1,2,3,4,5,6,7].map(col=>{const cols=['#e03','#c55','#fff','#aaf','#f80','#8f8'];return<circle key={`l${row}-${col}`} cx={6+col*9} cy={214+row*26} r="2.2" fill={cols[(row+col)%cols.length]} fillOpacity="0.3"/>}))}
        <path d="M400,420 L400,200 L320,240 L320,420 Z" fill="url(#standsR)"/>
        {[0,1,2,3,4,5,6,7].map(row=><line key={row} x1={322} y1={210+row*26} x2={398} y2={210+row*26+row*0.3} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>)}
        {[0,1,2,3,4,5,6].map(row=>[0,1,2,3,4,5,6,7].map(col=>{const cols=['#e03','#c55','#fff','#aaf','#f80','#8f8'];return<circle key={`r${row}-${col}`} cx={324+col*9} cy={214+row*26} r="2.2" fill={cols[(row+col+2)%cols.length]} fillOpacity="0.3"/>}))}
        <rect x="80" y="200" width="240" height="65" fill="rgba(15,35,71,0.85)"/>
        {[0,1,2,3,4,5].map(row=><line key={row} x1="80" y1={210+row*10} x2="320" y2={210+row*10} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>)}
        {[0,1,2,3,4].map(row=>Array.from({length:24}).map((_,col)=>{const cols=['#e03','#c55','#fff','#aaf','#f80','#e03','#8f8'];return<circle key={`t${row}-${col}`} cx={85+col*9.5} cy={213+row*10} r="2" fill={cols[col%cols.length]} fillOpacity="0.28"/>}))}
        <rect x="80" y="265" width="240" height="155" fill="rgba(15,80,35,0.55)" rx="2"/>
        <rect x="80" y="265" width="240" height="155" fill="url(#grassG)" rx="2"/>
        <rect x="82" y="267" width="236" height="151" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" rx="1"/>
        <line x1="200" y1="267" x2="200" y2="418" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
        <circle cx="200" cy="342" r="30" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
        <circle cx="200" cy="342" r="2" fill="rgba(255,255,255,0.4)"/>
        <rect x="153" y="267" width="94" height="30" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9"/>
        <rect x="153" y="388" width="94" height="30" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9"/>
        <rect x="188" y="263" width="24" height="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        <rect x="188" y="418" width="24" height="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        {[0,1,2,3,4,5,6,7].map(i=><rect key={i} x={82+i*30} y="267" width="15" height="151" fill="rgba(0,0,0,0.05)"/>)}
      </svg>
      <div style={{position:'absolute',top:10,left:14,width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,220,100,0.9) 20%,rgba(255,220,100,0.3) 60%,transparent 80%)',boxShadow:'0 0 20px 8px rgba(255,220,100,0.35)',animation:'flkr 3.6s ease-in-out infinite'}}/>
      <div style={{position:'absolute',top:10,right:14,width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,220,100,0.9) 20%,rgba(255,220,100,0.3) 60%,transparent 80%)',boxShadow:'0 0 20px 8px rgba(255,220,100,0.35)',animation:'flkr 3.6s ease-in-out infinite 0.7s'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'45%',background:'linear-gradient(to top,rgba(4,13,24,0.97) 0%,rgba(4,13,24,0.6) 60%,transparent 100%)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:2,padding:'26px 20px 36px',marginTop:220}}>
        {teacher&&<div className="ani" style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,220,100,0.08)',border:'1px solid rgba(255,220,100,0.18)',borderRadius:99,padding:'6px 14px',marginBottom:20}}><span style={{fontSize:15}}>{teacher.emoji||'💪'}</span><span style={{fontSize:12,color:'rgba(255,220,100,0.85)',fontWeight:600,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5}}>{teacher.display_name||'Seu professor'}</span>{teacher.cref&&<span style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:"'Barlow Condensed',sans-serif"}}>CREF {teacher.cref}</span>}</div>}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',letterSpacing:3,textTransform:'uppercase',marginBottom:8,fontFamily:"'Barlow Condensed',sans-serif"}}>Acompanhamento do Atleta</div>
        <div className="ani" style={{animationDelay:'0.07s',fontFamily:"'Barlow Condensed',sans-serif",fontSize:44,fontWeight:900,color:'#FFFFFF',lineHeight:1,marginBottom:14,textShadow:'0 0 60px rgba(255,220,100,0.12)'}}>{student.name}</div>
        <div className="ani" style={{animationDelay:'0.14s',display:'flex',flexWrap:'wrap',gap:7,marginBottom:22}}>
          {age&&<span className="pv-pill" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.65)',border:'1px solid rgba(255,255,255,0.1)'}}>{age} anos</span>}
          {sport&&<span className="pv-pill" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.65)',border:'1px solid rgba(255,255,255,0.1)'}}>{sport}</span>}
          {ltad&&<span className="pv-pill" style={{background:`${ltad.cor}18`,color:ltad.cor,border:`1px solid ${ltad.cor}35`}}>{ltad.fase}</span>}
          {act&&<span className="pv-pill" style={{background:act.bg,color:act.color,border:`1px solid ${act.color}35`}}>{act.label}</span>}
        </div>
        <div className="ani" style={{animationDelay:'0.2s',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,220,100,0.1)',background:'rgba(0,0,0,0.25)'}}>
          {[{icon:'🏃',val:totalSess,label:'Sessões (4 sem)'},{icon:'📅',val:activeDays||'—',label:'Dias/semana'},{icon:'🎯',val:activeGoals,label:'Metas ativas'}].map(({icon,val,label},i)=>(
            <div key={i} style={{padding:'15px 8px',textAlign:'center',borderLeft:i>0?'1px solid rgba(255,220,100,0.07)':undefined,background:'rgba(255,220,100,0.02)'}}>
              <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,color:'#FFDC64',lineHeight:1}}>{val}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:0.7,marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Weekly Training Calendar ─────────────────────────────────────────────────
function TrainingCalendar({logs,cardio}){
  const now=new Date()
  const allDates=new Set([...(logs||[]).map(l=>l.date),...(cardio||[]).map(c=>c.date)])
  const DAYS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  // Current week (Sun–Sat)
  const startOfWeek=new Date(now); startOfWeek.setDate(now.getDate()-now.getDay()); startOfWeek.setHours(0,0,0,0)
  const weekDays=Array.from({length:7},(_,i)=>{
    const d=new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i)
    const key=d.toISOString().slice(0,10)
    return{key,label:DAYS[i],dayNum:d.getDate(),trained:allDates.has(key),isToday:key===now.toISOString().slice(0,10),isFuture:d>now}
  })

  // Streak
  const streak=(()=>{
    let s=0,cur=new Date(); cur.setHours(0,0,0,0)
    const sorted=[...allDates].sort((a,b)=>b.localeCompare(a))
    for(const d of sorted){
      const dd=new Date(d+'T12:00:00'); dd.setHours(0,0,0,0)
      if(Math.round((cur-dd)/86400000)<=1){s++;cur=new Date(dd)} else break
    }
    return s
  })()

  const trainedThisWeek=weekDays.filter(d=>d.trained).length
  const weekLabel=(()=>{
    const opts={day:'numeric',month:'short'}
    return `${startOfWeek.toLocaleDateString('pt-BR',opts)} – ${new Date(startOfWeek.getTime()+6*86400000).toLocaleDateString('pt-BR',opts)}`
  })()

  return(
    <div className="pv-card ani" style={{animationDelay:'0.1s'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div className="pv-h1">Esta Semana</div>
          <div className="pv-sub">{weekLabel}</div>
        </div>
        {/* Streak badge */}
        {streak>0&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'linear-gradient(135deg,rgba(255,220,100,0.15),rgba(255,220,100,0.05))',border:'1px solid rgba(255,220,100,0.25)',borderRadius:14,padding:'10px 16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,rgba(255,220,100,0.5),transparent)'}}/>
            <div style={{fontSize:9,color:'rgba(255,220,100,0.5)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:2}}>Sequência</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:900,color:'#FFDC64',lineHeight:1}}>{streak}</div>
            <div style={{fontSize:9,color:'rgba(255,220,100,0.6)',textTransform:'uppercase',letterSpacing:1}}>dias seguidos</div>
            {streak>=7&&<div style={{fontSize:14,marginTop:2}}>🔥</div>}
          </div>
        )}
      </div>

      {/* 7-day row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
        {weekDays.map(day=>{
          const bg=day.trained
            ?'linear-gradient(160deg,#22C55E,#15803D)'
            :day.isToday
            ?'rgba(255,220,100,0.08)'
            :day.isFuture
            ?'rgba(255,255,255,0.02)'
            :'rgba(255,255,255,0.04)'
          const border=day.trained
            ?'1px solid rgba(34,197,94,0.4)'
            :day.isToday
            ?'1px solid rgba(255,220,100,0.35)'
            :'1px solid rgba(255,255,255,0.06)'
          const shadow=day.trained?'0 0 12px rgba(34,197,94,0.3)':undefined
          return(
            <div key={day.key} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'12px 4px',borderRadius:14,background:bg,border,boxShadow:shadow,transition:'all 0.2s'}}>
              <div style={{fontSize:9,fontWeight:700,color:day.trained?'rgba(255,255,255,0.7)':day.isToday?'rgba(255,220,100,0.6)':'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:0.5}}>{day.label}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:day.trained?'#fff':day.isToday?'#FFDC64':'rgba(255,255,255,0.25)',lineHeight:1}}>{day.dayNum}</div>
              <div style={{width:8,height:8,borderRadius:'50%',background:day.trained?'rgba(255,255,255,0.8)':day.isFuture?'transparent':'rgba(255,255,255,0.1)',border:day.isFuture?'1.5px solid rgba(255,255,255,0.08)':undefined}}/>
            </div>
          )
        })}
      </div>

      {/* Week summary */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>
          {trainedThisWeek===0?'Nenhum treino esta semana ainda'
          :trainedThisWeek===1?'1 treino realizado esta semana'
          :`${trainedThisWeek} treinos realizados esta semana`}
        </div>
        <div style={{display:'flex',gap:4}}>
          {weekDays.map(d=>(
            <div key={d.key} style={{width:8,height:8,borderRadius:2,background:d.trained?'#22C55E':d.isFuture?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.1)'}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Evolution Panel (3 charts) ────────────────────────────────────────────────
function WeightChart({progress}){
  const pts=progress.filter(p=>p.weight).slice(0,12).reverse()
  if(pts.length<2) return<div style={{fontSize:12,color:'rgba(255,255,255,0.25)',textAlign:'center',padding:'20px 0'}}>Adicione pelo menos 2 registros de peso para ver o gráfico</div>
  const vals=pts.map(p=>+p.weight)
  const mn=Math.min(...vals)-2, mx=Math.max(...vals)+2
  const W=280,H=80
  const x=(i)=>14+i*(W-28)/(pts.length-1)
  const y=(v)=>H-8-((v-mn)/(mx-mn))*(H-16)
  const path=pts.map((p,i)=>`${i===0?'M':'L'}${x(i)},${y(+p.weight)}`).join(' ')
  const area=`${path} L${x(pts.length-1)},${H} L${x(0)},${H} Z`
  return(
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:80,overflow:'visible'}}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wGrad)"/>
      <path d={path} fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={x(i)} cy={y(+p.weight)} r="3.5" fill="#60A5FA"/>
          {i===pts.length-1&&<text x={x(i)} y={y(+p.weight)-8} textAnchor="middle" fontSize="10" fill="#60A5FA" fontFamily="Barlow Condensed,sans-serif" fontWeight="700">{p.weight}kg</text>}
        </g>
      ))}
    </svg>
  )
}

function EvolutionPanel({progress,logs,cardio,exerciseLogs}){
  // Strength: find top exercise with most logs
  const byEx={}
  ;(exerciseLogs||[]).forEach(log=>{
    const name=log.exercises?.name||'Exercício'
    if(!byEx[name]) byEx[name]=[]
    const maxW=Math.max(...(log.sets||[]).map(s=>+s.weight||0))
    if(maxW>0) byEx[name].push({date:log.date,maxW})
  })
  const topEx=Object.entries(byEx).sort((a,b)=>b[1].length-a[1].length)[0]
  const strengthPts=topEx?topEx[1].slice(-6).sort((a,b)=>a.date.localeCompare(b.date)):[]
  return(
    <div className="pv-card ani" style={{animationDelay:'0.15s'}}>
      <div className="pv-h1" style={{marginBottom:3}}>Evolução</div>
      <div className="pv-sub" style={{marginBottom:18}}>Peso corporal e progressão de força</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>
        {/* Weight */}
        <div style={{background:'rgba(96,165,250,0.05)',border:'1px solid rgba(96,165,250,0.12)',borderRadius:14,padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,color:'#60A5FA',fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5,textTransform:'uppercase'}}>📊 Peso corporal</div>
            {progress.filter(p=>p.weight).length>0&&<div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{progress.filter(p=>p.weight).length} registros</div>}
          </div>
          <WeightChart progress={progress}/>
        </div>

        {/* Strength progression */}
        {strengthPts.length>=2?(
          <div style={{background:'rgba(52,211,153,0.04)',border:'1px solid rgba(52,211,153,0.1)',borderRadius:14,padding:'14px 16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:'#34D399',fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5,textTransform:'uppercase'}}>💪 {topEx[0]}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>última carga: <strong style={{color:'#34D399'}}>{strengthPts[strengthPts.length-1].maxW}kg</strong></div>
            </div>
            <svg viewBox="0 0 280 60" style={{width:'100%',height:60,overflow:'visible'}}>
              <defs><linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34D399" stopOpacity="0.25"/><stop offset="100%" stopColor="#34D399" stopOpacity="0"/></linearGradient></defs>
              {(()=>{
                const vs=strengthPts.map(p=>p.maxW), mn=Math.min(...vs)-2, mx=Math.max(...vs)+2
               {(()=>{
  const vs=strengthPts.map(p=>p.maxW), mn=Math.min(...vs)-2, mx=Math.max(...vs)+2
  // ✅ NOVO: Verificar se há pelo menos 2 pontos
  if(strengthPts.length < 2) return null
  const W=280,H=60,xp=(i)=>14+i*(W-28)/(strengthPts.length-1),yp=(v)=>H-8-((v-mn)/(mx-mn))*(H-16)
  const path=strengthPts.map((p,i)=>`${i===0?'M':'L'}${xp(i)},${yp(p.maxW)}`).join(' ')
  const area=`${path} L${xp(strengthPts.length-1)},${H} L${xp(0)},${H} Z`
  return<>
                  <path d={area} fill="url(#sGrad)"/>
                  <path d={path} fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {strengthPts.map((p,i)=><circle key={i} cx={xp(i)} cy={yp(p.maxW)} r="3" fill="#34D399"/>)}
                </>
              })()}
            </svg>
          </div>
        ):(
          <div style={{background:'rgba(52,211,153,0.04)',border:'1px solid rgba(52,211,153,0.08)',borderRadius:14,padding:'14px 16px',fontSize:12,color:'rgba(255,255,255,0.25)',textAlign:'center'}}>
            💪 Registre cargas nos exercícios para ver a progressão de força
          </div>
        )}
      </div>
    </div>
  )
}

// ── Benchmark Chart ───────────────────────────────────────────────────────────
function BenchmarkPanel({student,logs,cardio,progress,exerciseLogs,goals}){
  const age=calcAge(student)
  const benchmarks=getBenchmarks(age,student.sport)
  // Fill in student values
  const now=new Date(), week7=new Date(now.getTime()-7*86400000)
  const sessWeek=[...logs,...cardio].filter(s=>new Date(s.date+'T12:00:00')>=week7).length
  const allDatesSet=[...new Set([...logs,...cardio].map(s=>s.date))].sort((a,b)=>b.localeCompare(a))
  let streak=0; if(allDatesSet.length){let cur=new Date();cur.setHours(0,0,0,0);for(const d of allDatesSet){const dd=new Date(d+'T12:00:00');dd.setHours(0,0,0,0);if(Math.round((cur-dd)/86400000)<=1){streak++;cur=new Date(dd)}else break}}
  const totalPlanned=student.planned_days_count||4
  const totalDone=[...new Set([...logs,...cardio].filter(s=>{const d=new Date(s.date+'T12:00:00');return(now-d)<30*86400000}).map(s=>s.date))].length
  const consistency=totalPlanned>0?Math.min(Math.round((totalDone/(totalPlanned*4))*100),100):0
  const byEx={}; (exerciseLogs||[]).forEach(log=>{const name=log.exercises?.name||'ex';if(!byEx[name])byEx[name]=[];const mx=Math.max(...(log.sets||[]).map(s=>+s.weight||0));if(mx>0)byEx[name].push(mx)})
  const hasStrength=Object.keys(byEx).length>=3
  // Map student values to benchmark slots
  const filled=benchmarks.map(b=>{
    if(b.label==='Frequência semanal') return{...b,student:Math.min(sessWeek,b.max)}
    if(b.label==='Consistência mensal') return{...b,student:consistency}
    if(b.label==='Força relativa') return{...b,student:hasStrength?Math.min(streak>=14?4:streak>=7?3:hasStrength?2:1,b.max):1}
    if(b.label==='Resistência aeróbia'){
      const cardioSess=cardio.filter(s=>(now-new Date(s.date+'T12:00:00'))<30*86400000)
      const avgDur=cardioSess.length?cardioSess.reduce((a,s)=>a+(s.duration_minutes||0),0)/cardioSess.length:0
      return{...b,student:Math.min(Math.round(avgDur),b.max)}
    }
    return{...b,student:Math.round(b.ref*0.7)}
  })
  return(
    <div className="pv-card ani" style={{animationDelay:'0.2s'}}>
      <div style={{marginBottom:18}}>
        <div className="pv-h1">Potencial do Atleta</div>
        <div className="pv-sub">Comparativo com referências da faixa etária{student.sport?` — ${SPORT_LABELS[student.sport]||student.sport}`:''}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {filled.map((b,i)=>{
          const studentPct=Math.min((b.student/b.max)*100,100)
          const refPct=(b.ref/b.max)*100
          const isAbove=b.student>=b.ref
          const color=isAbove?'#34D399':'#60A5FA'
          return(
            <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'#E8F0F8'}}>{b.label}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:1}}>{b.desc}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:color}}>{b.student}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:3}}>{b.unit}</span>
                </div>
              </div>
              {/* Track */}
              <div style={{position:'relative',height:10,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'visible'}}>
                {/* Reference marker */}
                <div style={{position:'absolute',left:`${refPct}%`,top:-3,width:2,height:16,background:'rgba(255,255,255,0.3)',borderRadius:1,zIndex:2}}/>
                {/* Student bar */}
                <div style={{height:'100%',borderRadius:99,width:`${studentPct}%`,background:isAbove?'linear-gradient(90deg,#34D399,#059669)':'linear-gradient(90deg,#60A5FA,#3B82F6)',boxShadow:`0 0 8px ${color}50`,transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontSize:9,color:'rgba(255,255,255,0.2)'}}>{isAbove?'✅ Acima da referência':'📈 Em desenvolvimento'}</span>
                <span style={{fontSize:9,color:'rgba(255,255,255,0.2)'}}>Ref: {b.ref} {b.unit}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{marginTop:16,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',fontSize:11,color:'rgba(255,255,255,0.3)'}}>
        📚 Referências: ACSM 2022, NSCA Youth Guidelines 2021, Balyi LTAD 2013. Os dados são estimativas baseadas na atividade registrada.
      </div>
    </div>
  )
}

// ── Coach Reasoning Cards ─────────────────────────────────────────────────────
function CoachReasoning({student,plan,ltad,teacher}){
  const days=plan?.workout_days||[]
  const exTypes=[...new Set(days.flatMap(d=>(d.exercises||[]).map(e=>e.type).filter(Boolean)))]
  const hasPull=exTypes.some(t=>['Costas','Bíceps'].includes(t))
  const hasCore=exTypes.some(t=>['Core','Full Body'].includes(t))
  const hasLegs=exTypes.some(t=>['Quadríceps','Posterior','Glúteo','Panturrilha'].includes(t))
  const pillars=[]
  if(days.length) pillars.push({icon:'📅',title:'Estrutura semanal',color:'#FBBF24',text:`O treino foi dividido em ${days.length} dia${days.length>1?'s':''} por semana${ltad?`, adequado para a fase ${ltad.fase}`:''}. Essa distribuição permite recuperação ideal entre sessões.`})
  if(hasLegs) pillars.push({icon:'🦵',title:'Membros inferiores',color:'#34D399',text:`Exercícios para pernas e glúteos são fundamentais${student.sport==='futebol'||student.sport==='futsal'?' no futebol — potência, velocidade e estabilidade vêm dessa base':' para qualquer atleta em desenvolvimento'}. São a base da performance.`})
  if(hasPull) pillars.push({icon:'💪',title:'Equilíbrio muscular',color:'#60A5FA',text:'O treino inclui exercícios de puxada (costas/bíceps) para equilibrar os de empurrão. Isso previne lesões no ombro e melhora a postura — essencial na adolescência.'})
  if(hasCore) pillars.push({icon:'🎯',title:'Core e estabilidade',color:'#C084FC',text:'Exercícios de core treinam a musculatura profunda do tronco. No esporte juvenil, a estabilidade central é a base de todos os movimentos e previne lesões na lombar.'})
  if(ltad) pillars.push({icon:'📈',title:`Fase ${ltad.fase}`,color:ltad.cor,text:`Nesta fase, o foco é ${ltad.desc.toLowerCase()}. Os exercícios e cargas foram escolhidos respeitando o desenvolvimento biológico do atleta neste momento.`})
  if(!pillars.length) return null
  return(
    <div className="pv-card ani" style={{animationDelay:'0.1s'}}>
      <div className="pv-h1" style={{marginBottom:3}}>Raciocínio do Treino</div>
      <div className="pv-sub" style={{marginBottom:16}}>Por que o treino foi planejado assim</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {pillars.map((p,i)=>(
          <div key={i} style={{display:'flex',gap:12,padding:'12px 14px',borderRadius:12,background:`${p.color}08`,border:`1px solid ${p.color}20`}}>
            <div style={{fontSize:22,flexShrink:0,marginTop:1}}>{p.icon}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:p.color,marginBottom:4,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.3,textTransform:'uppercase'}}>{p.title}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>{p.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Professor Message ─────────────────────────────────────────────────────────
function ProfMessage({student,teacher}){
  if(!student.parent_message) return null
  const date=student.parent_message_date?new Date(student.parent_message_date+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):null
  return(
    <div className="pv-card-gold ani" style={{animationDelay:'0.05s',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(255,220,100,0.7),transparent)'}}/>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,220,100,0.1)',border:'1px solid rgba(255,220,100,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{teacher?.emoji||'💬'}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'rgba(255,220,100,0.85)',fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5,textTransform:'uppercase'}}>Recado do Professor</div>
              {date&&<div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2}}>{date}</div>}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>{teacher?.display_name||''}</div>
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',lineHeight:1.7,fontStyle:'italic',borderLeft:'2px solid rgba(255,220,100,0.3)',paddingLeft:12}}>
            "{student.parent_message}"
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Goals ─────────────────────────────────────────────────────────────────────
function GoalRow({goal}){
  const done=goal.status==='concluida'
  const pct=goal.target_value&&goal.current_value!=null?Math.min(Math.round((goal.current_value/goal.target_value)*100),100):null
  return(
    <div style={{padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',gap:12,alignItems:'flex-start'}}>
      <div style={{width:34,height:34,borderRadius:10,background:done?'rgba(52,211,153,0.12)':'rgba(251,191,36,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{done?'⭐':'🎯'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,color:'#E8F0F8',marginBottom:5}}>{goal.title}</div>
        {done?<span className="pv-pill" style={{background:'rgba(52,211,153,0.1)',color:'#34D399',border:'1px solid rgba(52,211,153,0.2)',fontSize:11}}>✓ Conquistada</span>
        :pct!=null?<div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{goal.current_value} / {goal.target_value} {goal.target_unit}</span>
            <span style={{fontSize:11,fontWeight:700,color:pct>=80?'#34D399':pct>=50?'#FBBF24':'#60A5FA'}}>{pct}%</span>
          </div>
          <div style={{height:7,borderRadius:99,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,width:`${pct}%`,background:pct>=80?'linear-gradient(90deg,#34D399,#059669)':pct>=50?'linear-gradient(90deg,#FBBF24,#D97706)':'linear-gradient(90deg,#60A5FA,#3B82F6)'}}/>
          </div>
        </div>:<span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Em andamento</span>}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ParentView({studentId}){
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(null)
  const [student,setStudent]=useState(null)
  const [teacher,setTeacher]=useState(null)
  const [plan,setPlan]=useState(null)
  const [goals,setGoals]=useState([])
  const [logs,setLogs]=useState([])
  const [cardio,setCardio]=useState([])
  const [progress,setProgress]=useState([])
  const [exLogs,setExLogs]=useState([])

  useEffect(()=>{
    const load=async()=>{
      try{
        const {data:st,error:e}=await supabase.from('students')
          .select('id,name,age,weight,height,goal,level,sport,sport_position,experience_years,guardian_name,teacher_id,notes,birth_date,parent_message,parent_message_date')
          .eq('id',studentId).single()
        if(e||!st){setError('Aluno não encontrado.');setLoading(false);return}
        setStudent(st)
        const [tR,plR,gsR,lR,cR,pR,exR]=await Promise.all([
          supabase.from('teacher_profiles').select('display_name,emoji,cref,whatsapp').eq('id',st.teacher_id).single(),
          supabase.from('workout_plans').select('*,workout_days(*,exercises(*))').eq('student_id',studentId).eq('status','active').order('updated_at',{ascending:false}).limit(1),
          supabase.from('student_goals').select('*').eq('student_id',studentId).order('created_at',{ascending:false}),
          supabase.from('exercise_logs').select('date').eq('student_id',studentId).order('date',{ascending:false}).limit(300),
          supabase.from('cardio_sessions').select('date,duration_minutes,type,pse').eq('student_id',studentId).order('date',{ascending:false}).limit(120),
          supabase.from('progress_entries').select('date,weight').eq('student_id',studentId).order('date',{ascending:false}).limit(20),
          supabase.from('exercise_logs').select('*,exercises(name)').eq('student_id',studentId).order('date',{ascending:false}).limit(200),
        ])
        if(tR.data)  setTeacher(tR.data)
        if(plR.data?.[0]) setPlan(plR.data[0])
        if(gsR.data) setGoals(gsR.data)
        if(lR.data)  setLogs(lR.data)
        if(cR.data)  setCardio(cR.data)
        if(pR.data)  setProgress(pR.data)
        if(exR.data) setExLogs(exR.data)
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
  const freq=getFreq4w(logs,cardio)
  const totalSess=freq.reduce((a,b)=>a+b,0)
  const activeDays=plan?.workout_days?.length||0
  const activeGoals=goals.filter(g=>g.status==='ativa').length
  const wonGoals=goals.filter(g=>g.status==='concluida')
  const lastSeen=logs[0]?.date||cardio[0]?.date
  const dAgo=lastSeen?Math.floor((new Date()-new Date(lastSeen+'T12:00:00'))/86400000):null
  const act=dAgo==null?null
    :dAgo===0?{label:'Treinou hoje',   color:'#34D399',bg:'rgba(52,211,153,0.12)'}
    :dAgo===1?{label:'Treinou ontem',  color:'#34D399',bg:'rgba(52,211,153,0.12)'}
    :dAgo<=4 ?{label:`Há ${dAgo} dias`,color:'#FBBF24',bg:'rgba(251,191,36,0.12)'}
    :         {label:`${dAgo}d sem treinar`,color:'#F87171',bg:'rgba(248,113,113,0.12)'}
  const waMsg=encodeURIComponent(`Olá ${teacher?.display_name||'professor'}! Sou responsável pelo atleta ${student.name} e gostaria de conversar sobre seu acompanhamento.`)
  const waUrl=teacher?.whatsapp?`https://wa.me/55${teacher.whatsapp.replace(/\D/g,'')}?text=${waMsg}`:null

  return(
    <div className="pv">
      <CSS/>
      <StadiumHeader student={student} teacher={teacher} age={age} ltad={ltad} act={act} totalSess={totalSess} activeDays={activeDays} activeGoals={activeGoals}/>

      {/* Background texture */}
      <div style={{position:'relative',background:'#040D18'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)',backgroundSize:'48px 48px',pointerEvents:'none'}}/>
        <svg style={{position:'absolute',top:0,right:0,opacity:0.03,pointerEvents:'none'}} width="220" height="220" viewBox="0 0 220 220"><circle cx="220" cy="0" r="140" fill="none" stroke="white" strokeWidth="1.5"/><circle cx="220" cy="0" r="90" fill="none" stroke="white" strokeWidth="1"/></svg>
        <svg style={{position:'absolute',bottom:0,left:0,opacity:0.03,pointerEvents:'none'}} width="220" height="220" viewBox="0 0 220 220"><circle cx="0" cy="220" r="140" fill="none" stroke="white" strokeWidth="1.5"/><circle cx="0" cy="220" r="90" fill="none" stroke="white" strokeWidth="1"/></svg>

        <div style={{padding:'20px 16px',display:'flex',flexDirection:'column',gap:14,maxWidth:560,margin:'0 auto',position:'relative',zIndex:1}}>

          {/* Recado do professor */}
          <ProfMessage student={student} teacher={teacher}/>

          {/* Calendário */}
          <TrainingCalendar logs={logs} cardio={cardio}/>

          {/* Raciocínio do treino */}
          {plan&&<CoachReasoning student={student} plan={plan} ltad={ltad} teacher={teacher}/>}

          {/* Evolução */}
          <EvolutionPanel progress={progress} logs={logs} cardio={cardio} exerciseLogs={exLogs}/>

          {/* Potencial */}
          <BenchmarkPanel student={student} logs={logs} cardio={cardio} progress={progress} exerciseLogs={exLogs} goals={goals}/>

          {/* Metas */}
          {goals.length>0&&(
            <div className="pv-card ani" style={{animationDelay:'0.25s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
                <div className="pv-h1">Metas</div>
                {wonGoals.length>0&&<span style={{fontSize:12,color:'#34D399',fontWeight:600}}>⭐ {wonGoals.length} conquistada{wonGoals.length>1?'s':''}</span>}
              </div>
              <div className="pv-sub" style={{marginBottom:6}}>{activeGoals} em andamento</div>
              {goals.slice(0,6).map(g=><GoalRow key={g.id} goal={g}/>)}
            </div>
          )}

          {/* WhatsApp */}
          <div className="pv-card ani" style={{animationDelay:'0.3s'}}>
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
    </div>
  )
}
