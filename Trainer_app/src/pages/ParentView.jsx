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
        <rect x="18" y="14" width="4" height="55" fill="rgba(200,210,230,0.25)" rx
