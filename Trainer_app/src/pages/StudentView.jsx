import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ── Responsividade ────────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:     '#02040F',
  card:   'rgba(7,11,26,0.78)',
  border: 'rgba(255,255,255,0.08)',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  cyan:   '#38BDF8',
  green:  '#34D399',
  yellow: '#F5C842',
  red:    '#F87171',
  orange: '#FB923C',
  text:   '#E8EDF8',
  sub:    '#8896BB',
  muted:  '#3D4F7A',
}
const CARD  = { background: C.card, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 18, border: `1px solid ${C.border}`, padding: 18, marginBottom: 14 }
const INP   = { background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none', width: '100%', fontFamily: "'Nunito',sans-serif", boxSizing: 'border-box' }
const LBL   = { fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5, display: 'block', marginTop: 14 }

const DAY_COLORS  = ['#A78BFA','#60A5FA','#34D399','#F5C842','#F87171','#FB923C']
const TYPE_COLORS = {
  'Peito':'#F87171','Costas':'#60A5FA','Bíceps':'#38BDF8','Tríceps':'#FB923C',
  'Ombro':'#FDE68A','Quadríceps':'#A78BFA','Posterior':'#C084FC','Glúteo':'#F472B6',
  'Panturrilha':'#FBBF24','Core':'#34D399','Cardio':'#F87171','Full Body':'#6EE7B7',
}
const CAT_STAR_COLOR = {
  peso:'#34D399', imc:'#60A5FA', medida:'#A78BFA',
  forca:'#F5C842', cardio:'#F87171', habito:'#FB923C', outro:'#94A3B8',
}
const CAT_COLORS = {
  peso:  { bg:'rgba(52,211,153,0.10)',  border:'rgba(52,211,153,0.25)',  text:'#34D399' },
  imc:   { bg:'rgba(96,165,250,0.10)',  border:'rgba(96,165,250,0.25)',  text:'#60A5FA' },
  medida:{ bg:'rgba(167,139,250,0.10)', border:'rgba(167,139,250,0.25)', text:'#A78BFA' },
  forca: { bg:'rgba(245,200,66,0.10)',  border:'rgba(245,200,66,0.25)',  text:'#F5C842' },
  cardio:{ bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.25)', text:'#F87171' },
  habito:{ bg:'rgba(251,146,60,0.10)',  border:'rgba(251,146,60,0.25)',  text:'#FB923C' },
  outro: { bg:'rgba(148,163,184,0.10)', border:'rgba(148,163,184,0.25)', text:'#94A3B8' },
}

const today = () => new Date().toISOString().split('T')[0]
const parseSets = (f) => { const n=parseInt(f)||3; return Array.from({length:n},(_,i)=>({set:i+1,weight:'',reps:''})) }
const svFmtDate = (d) => { if(!d) return ''; const [,m,dy]=String(d).slice(0,10).split('-'); return `${dy}/${m}` }
const svFormatPace = (distKm,durMin) => {
  if(!distKm||!durMin||distKm===0) return null
  const pm=durMin/distKm, mi=Math.floor(pm), s=Math.round((pm-mi)*60).toString().padStart(2,'0')
  return `${mi}:${s}/km`
}

// ── CSS ───────────────────────────────────────────────────────────────────────
function CosmicCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: ${C.bg}; }

      @keyframes twinkle {
        0%,100% { opacity:0.08; transform:scale(0.6); }
        50%      { opacity:1;   transform:scale(1.5); }
      }
      @keyframes aurora {
        0%,100% { transform:translate(0,0) scale(1); opacity:0.07; }
        50%      { transform:translate(28px,-12px) scale(1.2); opacity:0.13; }
      }
      @keyframes starBurst {
        0%   { opacity:0; transform:scale(0) rotate(-20deg); }
        60%  { opacity:1; transform:scale(1.25) rotate(6deg); }
        100% { opacity:1; transform:scale(1) rotate(0deg); }
      }
      @keyframes starPulse {
        0%,100% { filter:drop-shadow(0 0 4px var(--sc)) drop-shadow(0 0 1px var(--sc)); transform:scale(1); }
        50%      { filter:drop-shadow(0 0 16px var(--sc)) drop-shadow(0 0 32px var(--sc)); transform:scale(1.1); }
      }
      @keyframes constellationLine {
        0%,100% { opacity:0.10; }
        50%      { opacity:0.28; }
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(12px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes float {
        0%,100% { transform:translateY(0); }
        50%      { transform:translateY(-7px); }
      }
      @keyframes shimmer {
        0%   { background-position:0% 50%; }
        100% { background-position:200% 50%; }
      }
      @keyframes goalComplete {
        0%   { transform:scale(1); }
        25%  { transform:scale(1.06); }
        50%  { transform:scale(0.97); }
        100% { transform:scale(1); }
      }

      .sv-btn-glow:hover { filter:brightness(1.15); transform:translateY(-1px); }
      .sv-tab:hover      { background:rgba(255,255,255,0.07) !important; }
      .sv-ex-row:hover   { background:rgba(255,255,255,0.025) !important; }
      input:focus, textarea:focus, select:focus {
        border-color:rgba(167,139,250,0.5) !important;
        box-shadow:0 0 0 3px rgba(167,139,250,0.1) !important;
      }
      ::-webkit-scrollbar { width:4px; height:4px; }
      ::-webkit-scrollbar-track  { background:transparent; }
      ::-webkit-scrollbar-thumb  { background:rgba(99,102,241,0.35); border-radius:99px; }
    `}</style>
  )
}

// ── StarField background ──────────────────────────────────────────────────────
function StarField() {
  const stars = useMemo(() => Array.from({ length: 140 }, (_, i) => {
    const big = i < 20
    return {
      id: i,
      x:  ((i * 7919 + 13) % 1000) / 10,
      y:  ((i * 6271 + 97) % 1000) / 10,
      size:  big ? (1.8 + (i % 5) * 0.4) : (0.4 + (i % 4) * 0.3),
      delay: ((i * 1.37) % 7).toFixed(2),
      dur:   (2.5 + (i % 5) * 0.7).toFixed(2),
      op:    (0.2 + (i % 8) * 0.09).toFixed(2),
    }
  }), [])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      {/* Deep space */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#02040F 0%,#060A1A 55%,#090D24 100%)' }} />
      {/* Nebula blobs */}
      <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'65%', height:'55%', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 70%)', animation:'aurora 14s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-15%', right:'-5%', width:'55%', height:'50%', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(56,189,248,0.07) 0%,transparent 70%)', animation:'aurora 18s 5s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'40%', right:'15%', width:'35%', height:'30%', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(139,92,246,0.07) 0%,transparent 70%)', animation:'aurora 22s 9s ease-in-out infinite' }} />
      {/* Stars */}
      {stars.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
          width:`${s.size}px`, height:`${s.size}px`, borderRadius:'50%',
          background: s.size > 1.5 ? '#E8EEFF' : '#FFFFFF',
          opacity: s.op,
          animation:`twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          boxShadow: s.size > 1.5 ? `0 0 ${s.size*3}px rgba(200,210,255,0.55)` : 'none',
        }} />
      ))}
    </div>
  )
}

// ── Achievement Star ──────────────────────────────────────────────────────────
function AchievementStar({ goal, size, index }) {
  const color = CAT_STAR_COLOR[goal.category] || '#94A3B8'
  const pts   = '50,4 61,36 95,36 68,58 79,92 50,71 21,92 32,58 5,36 39,36'
  return (
    <div title={goal.title} style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'default',
      animation:`starBurst 0.6s ${index * 0.12}s both cubic-bezier(0.34,1.56,0.64,1)`,
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100"
        style={{ '--sc': color, animation:`starPulse 3.5s ${index * 0.4}s ease-in-out infinite`, color }}>
        <polygon points={pts} fill={color} opacity="0.93" />
        <polygon points={pts} fill="rgba(255,255,255,0.25)"
          style={{ transform:'scale(0.45)', transformOrigin:'50px 52px' }} />
      </svg>
      <span style={{
        fontSize: 9, color, fontWeight: 800, textAlign: 'center',
        maxWidth: size + 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85,
      }}>{goal.title.length > 14 ? goal.title.slice(0, 13) + '…' : goal.title}</span>
    </div>
  )
}

// ── Constellation of Achievements ────────────────────────────────────────────
function ConstellationDisplay({ goals }) {
  if (!goals.length) return null
  const getSize = (i) => Math.max(28, 60 - i * 8)
  return (
    <div style={{ ...CARD, position:'relative', overflow:'hidden',
      border:'1px solid rgba(167,139,250,0.22)', padding:'22px 18px 18px' }}>
      {/* SVG lines */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none',
        animation:'constellationLine 4s ease-in-out infinite' }} preserveAspectRatio="none">
        {goals.slice(0,7).map((_,i) => {
          if (i===0) return null
          const x1=((i-1)*15+7)+'%', y1='55%', x2=(i*15+7)+'%', y2='55%'
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#A78BFA" strokeWidth="1" strokeDasharray="3,5" />
        })}
      </svg>
      <div style={{ fontSize:10, color:'#A78BFA', fontWeight:800, letterSpacing:2.5, textTransform:'uppercase',
        textAlign:'center', marginBottom:18, fontFamily:"'Nunito',sans-serif" }}>
        ✦ Constelação de Conquistas · {goals.length} {goals.length === 1 ? 'estrela' : 'estrelas'}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center', alignItems:'flex-end' }}>
        {goals.map((g, i) => <AchievementStar key={g.id} goal={g} size={getSize(i)} index={i} />)}
      </div>
      {goals.length >= 3 && (
        <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:C.muted, fontStyle:'italic' }}>
          {goals.length >= 10 ? '🌌 Constelação completa — você é incrível!' :
           goals.length >= 5  ? '⭐ Sua constelação está crescendo!' :
           '✨ Continue e faça sua constelação brilhar!'}
        </div>
      )}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone, isMobile }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position:'fixed', bottom: isMobile ? 86 : 32, left:'50%', transform:'translateX(-50%)',
      background:'linear-gradient(135deg,#34D399,#059669)', color:'#022c22',
      borderRadius: 50, padding:'12px 28px', fontWeight:800, fontSize:14,
      zIndex:999, whiteSpace:'nowrap', fontFamily:"'Nunito',sans-serif",
      boxShadow:'0 4px 28px rgba(52,211,153,0.5)', animation:'fadeUp 0.3s ease',
    }}>{msg}</div>
  )
}

// ── ExerciseLogRow ────────────────────────────────────────────────────────────
function ExerciseLogRow({ ex, studentId, dayColor, isMobile }) {
  const [open,    setOpen]    = useState(false)
  const [sets,    setSets]    = useState(parseSets(ex.sets))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [lastLog, setLastLog] = useState(null)
  const [toast,   setToast]   = useState(null)
  const typeColor = TYPE_COLORS[ex.type] || C.muted

  useEffect(() => {
    if (!open || lastLog !== null) return
    supabase.from('exercise_logs').select('*')
      .eq('student_id', studentId).eq('exercise_id', ex.id)
      .order('date', { ascending:false }).limit(1).single()
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
      sets: sets.map(s => ({ set:s.set, weight:s.weight||null, reps:s.reps||null })),
    })
    setSaving(false)
    if (!error) { setSaved(true); setToast('✅ Carga registrada!'); setOpen(false); setLastLog(null) }
  }

  return (
    <>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} isMobile={isMobile} />}

      <div className="sv-ex-row" style={{ padding: isMobile ? '14px 14px' : '14px 20px',
        borderBottom:`1px solid ${C.border}`, transition:'background 0.15s',
        background: open ? 'rgba(255,255,255,0.025)' : 'transparent' }}>

        {isMobile ? (
          /* Mobile layout */
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7, flexWrap:'wrap' }}>
              {ex.type && (
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:700,
                  background:`${typeColor}22`, color:typeColor, border:`1px solid ${typeColor}40` }}>
                  {ex.type}
                </span>
              )}
              <span style={{ fontWeight:800, fontSize:15, color:C.text, fontFamily:"'Nunito',sans-serif" }}>{ex.name}</span>
            </div>
            <div style={{ display:'flex', gap:14, marginBottom:8, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>Séries</div>
                <div style={{ fontSize:18, fontWeight:900, color:dayColor, lineHeight:1.1 }}>{ex.sets}×</div>
              </div>
              <div style={{ width:1, height:28, background:C.border }} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>Reps</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{ex.reps}</div>
              </div>
              {ex.rest && <>
                <div style={{ width:1, height:28, background:C.border }} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>Descanso</div>
                  <div style={{ fontSize:12, fontWeight:600, color:C.sub }}>{ex.rest}</div>
                </div>
              </>}
            </div>
            {ex.tip && <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>💡 {ex.tip}</div>}
            <button onClick={() => { setOpen(o => !o); setSaved(false) }} style={{
              width:'100%', padding:'13px', borderRadius:12, cursor:'pointer',
              fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, transition:'all 0.15s',
              background: saved ? 'rgba(52,211,153,0.12)' : open ? `${dayColor}18` : 'rgba(255,255,255,0.05)',
              border:`1px solid ${saved ? '#34D39950' : open ? `${dayColor}50` : C.border}`,
              color: saved ? '#34D399' : open ? dayColor : C.sub,
            }}>
              {saved ? '✅ Carga registrada hoje' : open ? '▲ Fechar' : '⚖️ Registrar carga'}
            </button>
          </div>
        ) : (
          /* Desktop layout — grid 4 cols */
          <div style={{ display:'grid', gridTemplateColumns:'2fr 0.5fr 0.7fr 0.6fr', gap:8, alignItems:'start' }}>
            <div>
              {ex.type && <div style={{ marginBottom:4 }}><span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:700, background:`${typeColor}20`, color:typeColor, border:`1px solid ${typeColor}40` }}>{ex.type}</span></div>}
              <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:3, fontFamily:"'Nunito',sans-serif" }}>{ex.name}</div>
              {ex.tip && <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>💡 {ex.tip}</div>}
              <button onClick={() => { setOpen(o => !o); setSaved(false) }} style={{
                marginTop:4, background: saved ? 'rgba(52,211,153,0.12)' : open ? `${dayColor}18` : 'rgba(255,255,255,0.05)',
                border:`1px solid ${saved ? '#34D39940' : open ? `${dayColor}40` : C.border}`,
                borderRadius:8, padding:'5px 12px', color: saved ? '#34D399' : open ? dayColor : C.sub,
                fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif",
              }}>
                {saved ? '✅ Salvo hoje' : open ? '▲ Fechar' : '⚖️ Registrar carga'}
              </button>
            </div>
            <div style={{ fontWeight:800, color:dayColor, fontSize:16, paddingTop:20, fontFamily:"'Nunito',sans-serif" }}>{ex.sets}×</div>
            <div style={{ fontWeight:700, fontSize:13, color:C.text, paddingTop:20 }}>{ex.reps}</div>
            <div style={{ fontSize:12, color:C.sub, paddingTop:20 }}>{ex.rest}</div>
          </div>
        )}

        {/* Log panel */}
        {open && (
          <div style={{ marginTop:14, background:'rgba(2,4,15,0.85)', borderRadius:14,
            border:`1px solid ${dayColor}25`, padding: isMobile ? 14 : 18 }}>

            {lastLog && (
              <div style={{ marginBottom:12, background:'rgba(52,211,153,0.06)',
                border:'1px solid rgba(52,211,153,0.15)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:'#34D399', fontWeight:800, marginBottom:6,
                  textTransform:'uppercase', letterSpacing:1, fontFamily:"'Nunito',sans-serif" }}>
                  📅 Último — {new Date(lastLog.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {lastLog.sets.map((s,i) => (
                    <span key={i} style={{ fontSize:12, background:'rgba(52,211,153,0.10)',
                      borderRadius:8, padding:'4px 10px', color:'#6EE7B7', fontWeight:700 }}>
                      S{s.set}: {s.weight?`${s.weight}kg`:'—'} × {s.reps||'—'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lastLog === false && (
              <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>Nenhum registro anterior para este exercício.</div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr', gap:8, marginBottom:8 }}>
              {['Série','Carga (kg)','Reps feitas'].map(h => (
                <div key={h} style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
              ))}
            </div>

            {sets.map((s,idx) => (
              <div key={idx} style={{ display:'grid', gridTemplateColumns:'32px 1fr 1fr', gap:8, marginBottom:8, alignItems:'center' }}>
                <div style={{ fontSize:13, color:dayColor, fontWeight:900, textAlign:'center',
                  fontFamily:"'Nunito',sans-serif" }}>S{s.set}</div>
                {['weight','reps'].map((field,fi) => (
                  <input key={field} type="number" inputMode={fi===0?'decimal':'numeric'}
                    placeholder={lastLog&&lastLog.sets[idx]?.[field]?`Ant: ${lastLog.sets[idx][field]}`:fi===0?'kg':'reps'}
                    value={s[field]} onChange={e => updateSet(idx, field, e.target.value)}
                    style={{ ...INP, padding: isMobile ? '13px 10px' : '9px 12px',
                      fontSize: isMobile ? 16 : 14, textAlign:'center', fontWeight:800,
                      border:`1px solid ${s[field] ? dayColor+'55' : C.border}` }}
                  />
                ))}
              </div>
            ))}

            <button onClick={handleSave} disabled={saving} style={{
              width:'100%', marginTop:10, borderRadius:12, padding: isMobile ? '15px' : '13px',
              fontWeight:800, fontSize: isMobile ? 16 : 14, cursor: saving ? 'default' : 'pointer',
              fontFamily:"'Nunito',sans-serif", border:'none',
              background: saving ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,${dayColor},${dayColor}bb)`,
              color: saving ? C.muted : '#02040F',
              boxShadow: saving ? 'none' : `0 4px 20px ${dayColor}40`,
              transition:'all 0.2s',
            }}>{saving ? 'Salvando...' : '💾 Salvar registro de hoje'}</button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Cardio constants ──────────────────────────────────────────────────────────
const SV_CARDIO_TYPES = [
  { id:'corrida',     label:'Corrida',     icon:'🏃', color:'#EF4444', hasDistance:true,  hasHR:true,  isHIIT:false },
  { id:'bike',        label:'Bike',        icon:'🚴', color:'#F59E0B', hasDistance:true,  hasHR:true,  isHIIT:false },
  { id:'esteira',     label:'Esteira',     icon:'🏃', color:'#8B5CF6', hasDistance:true,  hasHR:true,  isHIIT:false },
  { id:'eliptico',    label:'Elíptico',    icon:'⭕', color:'#06B6D4', hasDistance:false, hasHR:true,  isHIIT:false },
  { id:'natacao',     label:'Natação',     icon:'🏊', color:'#3B82F6', hasDistance:true,  hasHR:false, isHIIT:false },
  { id:'pular_corda', label:'Pular Corda', icon:'🪢', color:'#10B981', hasDistance:false, hasHR:true,  isHIIT:false },
  { id:'hiit',        label:'HIIT',        icon:'⚡', color:'#F5C842', hasDistance:false, hasHR:true,  isHIIT:true  },
]
const SV_PSE_LABELS   = ['','Muito leve','Leve','Moderado leve','Moderado','Moderado intenso','Intenso','Muito intenso','Difícil','Muito difícil','Máximo']
const SV_PRESCRICAO   = {
  'Emagrecimento':      { sessoes:'3–4×/sem', duracao:'30–50 min', pse:{min:4,max:6,label:'PSE 4–6'}, pace:'Ritmo conversacional', volume:'120–200 min/sem', obs:'Esforço contínuo e controlado. Evite intensidade muito alta.' },
  'Ganho de Massa':     { sessoes:'2×/sem',   duracao:'20–30 min', pse:{min:3,max:5,label:'PSE 3–5'}, pace:'Recuperação ativa — bem leve', volume:'40–60 min/sem', obs:'Cardio leve preserva sua recuperação muscular.' },
  'Condicionamento':    { sessoes:'3–4×/sem', duracao:'30–45 min', pse:{min:5,max:8,label:'PSE 5–8'}, pace:'2 estável + 1 HIIT/semana', volume:'150–200 min/sem', obs:'Alterne intensidades para progredir.' },
  'Força e Performance':{ sessoes:'2×/sem',   duracao:'20–30 min', pse:{min:3,max:4,label:'PSE 3–4'}, pace:'Low-impact — foco em recuperação', volume:'40–60 min/sem', obs:'Cardio intenso compete com seus ganhos de força.' },
}

// ── Cardio Modal ──────────────────────────────────────────────────────────────
function SvCardioModal({ studentId, onSave, onClose }) {
  const [type,  setType]  = useState('corrida')
  const [date,  setDate]  = useState(today())
  const [dur,   setDur]   = useState('')
  const [dist,  setDist]  = useState('')
  const [hr,    setHr]    = useState('')
  const [pse,   setPse]   = useState(5)
  const [ws,    setWs]    = useState(30)
  const [rs,    setRs]    = useState(90)
  const [rds,   setRds]   = useState(8)
  const [notes, setNotes] = useState('')
  const [saving,setSaving]= useState(false)
  const info = SV_CARDIO_TYPES.find(t => t.id === type)

  const save = async () => {
    setSaving(true)
    const payload = { student_id:studentId, type, date, duration_minutes:+dur||null,
      distance_km:+dist||null, avg_hr:+hr||null, pse:+pse||null, notes:notes||null,
      ...(info?.isHIIT ? {work_seconds:+ws, rest_seconds:+rs, rounds:+rds} : {}) }
    await supabase.from('cardio_sessions').insert([payload])
    setSaving(false); onSave(); onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:400, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...CARD, padding:24, width:'100%',
        maxWidth:400, maxHeight:'90vh', overflowY:'auto', marginBottom:0,
        border:'1px solid rgba(167,139,250,0.25)' }}>
        <div style={{ fontSize:17, fontWeight:900, color:C.text, marginBottom:4, fontFamily:"'Nunito',sans-serif" }}>❤️ Nova Sessão de Cárdio</div>

        <label style={LBL}>Modalidade</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:4 }}>
          {SV_CARDIO_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              padding:'7px 12px', borderRadius:20, fontSize:11, fontWeight:800, cursor:'pointer',
              border:`1.5px solid ${type===t.id ? t.color : C.border}`,
              background: type===t.id ? `${t.color}22` : 'transparent',
              color: type===t.id ? t.color : C.sub, fontFamily:"'Nunito',sans-serif",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {[['Data','date',date,setDate],['Duração (min)','number',dur,setDur],
          ...(info?.hasDistance ? [['Distância (km)','number',dist,setDist]] : []),
          ...(info?.hasHR       ? [['FC Média (bpm)', 'number',hr, setHr]]   : []),
        ].map(([l,t,v,set]) => (
          <div key={l}><label style={LBL}>{l}</label>
            <input type={t} style={INP} value={v} onChange={e => set(e.target.value)} /></div>
        ))}

        {info?.isHIIT && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[['Trabalho(s)',ws,setWs],['Descanso(s)',rs,setRs],['Rounds',rds,setRds]].map(([l,v,s]) => (
              <div key={l}><label style={LBL}>{l}</label>
                <input type="number" style={INP} value={v} onChange={e => s(e.target.value)} /></div>
            ))}
          </div>
        )}

        <label style={LBL}>PSE — Esforço: <span style={{ color:'#A78BFA' }}>{pse} — {SV_PSE_LABELS[pse]}</span></label>
        <input type="range" min={1} max={10} value={pse} onChange={e => setPse(+e.target.value)}
          style={{ width:'100%', accentColor:'#A78BFA', marginBottom:4 }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.muted, fontWeight:700, marginBottom:8 }}>
          <span>1 Leve</span><span>5 Moderado</span><span>10 Máximo</span>
        </div>

        <label style={LBL}>Observações</label>
        <textarea style={{ ...INP, minHeight:56, resize:'vertical' }}
          placeholder="Como foi o treino?" value={notes} onChange={e => setNotes(e.target.value)} />

        <button onClick={save} disabled={saving} className="sv-btn-glow" style={{
          width:'100%', background:'linear-gradient(135deg,#A78BFA,#7C3AED)',
          border:'none', borderRadius:12, padding:14, color:'#FFF',
          fontWeight:800, fontSize:14, cursor:'pointer', marginTop:20,
          fontFamily:"'Nunito',sans-serif", boxShadow:'0 4px 20px rgba(167,139,250,0.35)',
          transition:'all 0.2s',
        }}>{saving ? 'Salvando...' : '💾 Salvar Sessão'}</button>
        <button onClick={onClose} style={{ width:'100%', background:'transparent',
          border:`1px solid ${C.border}`, borderRadius:10, padding:11,
          color:C.sub, fontWeight:600, fontSize:13, cursor:'pointer', marginTop:8,
          fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Metas data ────────────────────────────────────────────────────────────────
const METAS_SUGERIDAS = {
  'Emagrecimento':      [
    {icon:'⚖️',titulo:'Perder peso',         categoria:'peso',  unidade:'kg',     placeholder:'Ex: 5',    desc:'Reduzir meu peso em'},
    {icon:'📏',titulo:'Diminuir cintura',     categoria:'medida',unidade:'cm',     placeholder:'Ex: 8',    desc:'Diminuir cintura em'},
    {icon:'🏃',titulo:'Correr sem parar',     categoria:'cardio',unidade:'km',     placeholder:'Ex: 5',    desc:'Correr'},
    {icon:'🔥',titulo:'Sequência de treinos', categoria:'habito',unidade:'dias',   placeholder:'Ex: 30',   desc:'Manter sequência por'},
    {icon:'🥗',titulo:'Meta personalizada',   categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
  'Ganho de Massa':     [
    {icon:'⚖️',titulo:'Ganhar massa',         categoria:'peso',  unidade:'kg',     placeholder:'Ex: 4',    desc:'Ganhar'},
    {icon:'💪',titulo:'Aumentar braço',       categoria:'medida',unidade:'cm',     placeholder:'Ex: 3',    desc:'Aumentar braço em'},
    {icon:'🏋️',titulo:'PR no Supino',        categoria:'forca', unidade:'kg',     placeholder:'Ex: 80',   desc:'Supino com'},
    {icon:'🔥',titulo:'Sequência de treinos', categoria:'habito',unidade:'dias',   placeholder:'Ex: 30',   desc:'Manter sequência por'},
    {icon:'⭐',titulo:'Meta personalizada',   categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
  'Condicionamento':    [
    {icon:'🏃',titulo:'Correr X km',          categoria:'cardio',unidade:'km',     placeholder:'Ex: 10',   desc:'Correr'},
    {icon:'⚡',titulo:'Completar HIIT',       categoria:'cardio',unidade:'sessões',placeholder:'Ex: 8',    desc:'Completar'},
    {icon:'🔥',titulo:'Sequência de treinos', categoria:'habito',unidade:'dias',   placeholder:'Ex: 60',   desc:'Manter sequência por'},
    {icon:'💪',titulo:'Aumentar carga base',  categoria:'forca', unidade:'kg',     placeholder:'Ex: 10',   desc:'Aumentar carga em'},
    {icon:'🎯',titulo:'Meta personalizada',   categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
  'Força e Performance':[
    {icon:'🏋️',titulo:'1RM Supino',          categoria:'forca', unidade:'kg',     placeholder:'Ex: 100',  desc:'1RM Supino de'},
    {icon:'🏋️',titulo:'1RM Agachamento',     categoria:'forca', unidade:'kg',     placeholder:'Ex: 120',  desc:'1RM Agachamento de'},
    {icon:'🏋️',titulo:'1RM Terra',           categoria:'forca', unidade:'kg',     placeholder:'Ex: 140',  desc:'1RM Terra de'},
    {icon:'🔥',titulo:'Sequência de treinos', categoria:'habito',unidade:'dias',   placeholder:'Ex: 30',   desc:'Manter sequência por'},
    {icon:'🏆',titulo:'Meta personalizada',   categoria:'outro', unidade:'',       placeholder:'',         desc:''},
  ],
}

// ── Nova Meta Modal ───────────────────────────────────────────────────────────
function NovaMetaModal({ studentId, goal, onSave, onClose }) {
  const sugestoes = METAS_SUGERIDAS[goal] || METAS_SUGERIDAS['Ganho de Massa']
  const [step,   setStep]   = useState('escolher')
  const [sel,    setSel]    = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descricao,setDescricao]=useState('')
  const [valor,  setValor]  = useState('')
  const [unidade,setUnidade]=useState('')
  const [prazo,  setPrazo]  = useState('')
  const [saving, setSaving] = useState(false)

  const escolher = (s) => {
    setSel(s); setTitulo(s.titulo==='Meta personalizada'?'':s.titulo)
    setDescricao(s.desc); setUnidade(s.unidade); setStep('detalhar')
  }
  const salvar = async () => {
    if (!titulo.trim()) return
    setSaving(true)
    await supabase.from('student_goals').insert([{
      student_id:studentId, title:titulo, description:descricao,
      category:sel?.categoria||'outro', target_value:valor?parseFloat(valor):null,
      target_unit:unidade, deadline:prazo||null, status:'ativa',
    }])
    setSaving(false); onSave(); onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.90)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:400, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...CARD, padding:24, width:'100%',
        maxWidth:420, maxHeight:'90vh', overflowY:'auto', marginBottom:0,
        border:'1px solid rgba(167,139,250,0.25)' }}>
        {step === 'escolher' ? (
          <>
            <div style={{ fontSize:17, fontWeight:900, color:C.text, marginBottom:3, fontFamily:"'Nunito',sans-serif" }}>🎯 Nova Meta</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>Escolha uma sugestão ou crie a sua própria</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {sugestoes.map((s, i) => {
                const cc = CAT_COLORS[s.categoria] || CAT_COLORS.outro
                return (
                  <button key={i} onClick={() => escolher(s)} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    borderRadius:12, border:`1px solid ${cc.border}`, background:cc.bg,
                    cursor:'pointer', textAlign:'left', fontFamily:"'Nunito',sans-serif",
                  }}>
                    <span style={{ fontSize:20 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{s.titulo}</div>
                      {s.desc && <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{s.desc} {s.placeholder}</div>}
                    </div>
                    <span style={{ marginLeft:'auto', color:cc.text, fontSize:16 }}>→</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep('escolher')} style={{ background:'none', border:'none',
              color:C.sub, fontSize:13, cursor:'pointer', marginBottom:16,
              display:'flex', alignItems:'center', gap:6, fontFamily:"'Nunito',sans-serif" }}>← Voltar</button>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:3, fontFamily:"'Nunito',sans-serif" }}>{sel?.icon} Definir Meta</div>
            <label style={LBL}>Título da meta</label>
            <input style={INP} placeholder="Ex: Perder 5kg até o verão" value={titulo} onChange={e => setTitulo(e.target.value)} />
            {sel?.categoria !== 'outro' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={LBL}>Valor alvo</label>
                  <input type="number" step="0.1" style={INP} placeholder={sel?.placeholder} value={valor} onChange={e => setValor(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Unidade</label>
                  <input style={INP} placeholder="kg, cm, dias..." value={unidade} onChange={e => setUnidade(e.target.value)} />
                </div>
              </div>
            )}
            <label style={LBL}>Prazo (opcional)</label>
            <input type="date" style={INP} value={prazo} onChange={e => setPrazo(e.target.value)} />
            <label style={LBL}>Motivação (opcional)</label>
            <textarea style={{ ...INP, minHeight:56, resize:'vertical' }}
              placeholder="Por que essa meta é importante?" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <button onClick={salvar} disabled={saving || !titulo.trim()} className="sv-btn-glow" style={{
              width:'100%', background: titulo.trim() ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)',
              border:'none', borderRadius:12, padding:14, color: titulo.trim() ? '#022c22' : C.muted,
              fontWeight:800, fontSize:14, cursor:'pointer', marginTop:20,
              fontFamily:"'Nunito',sans-serif",
              boxShadow: titulo.trim() ? '0 4px 20px rgba(52,211,153,0.35)' : 'none',
              transition:'all 0.2s',
            }}>{saving ? 'Salvando...' : '🎯 Criar Meta'}</button>
          </>
        )}
        <button onClick={onClose} style={{ width:'100%', background:'transparent',
          border:`1px solid ${C.border}`, borderRadius:10, padding:11,
          color:C.sub, fontWeight:600, fontSize:13, cursor:'pointer', marginTop:8,
          fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Tab Metas ─────────────────────────────────────────────────────────────────
function TabMetas({ studentId, student, goals, onUpdate, isMobile }) {
  const [showModal,       setShowModal]       = useState(false)
  const [updating,        setUpdating]        = useState(null)
  const [editingProgress, setEditingProgress] = useState(null)
  const [progressInput,   setProgressInput]   = useState('')
  const [justCompleted,   setJustCompleted]   = useState(null)

  const updateStatus = async (goalId, status) => {
    setUpdating(goalId)
    if (status === 'concluida') setJustCompleted(goalId)
    await supabase.from('student_goals').update({ status }).eq('id', goalId)
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

  const ativas     = goals.filter(g => g.status === 'ativa')
  const concluidas = goals.filter(g => g.status === 'concluida')
  const sugestoes  = METAS_SUGERIDAS[student?.goal] || []

  return (
    <div style={{ animation:'fadeUp 0.35s ease' }}>
      {showModal && <NovaMetaModal studentId={studentId} goal={student?.goal}
        onSave={onUpdate} onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Nunito',sans-serif" }}>🎯 Minhas Metas</div>
          <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>
            {ativas.length} ativa{ativas.length!==1?'s':''} · {concluidas.length} conquistada{concluidas.length!==1?'s':''}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="sv-btn-glow" style={{
          padding:'10px 18px', borderRadius:12, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#A78BFA,#7C3AED)', color:'#FFF',
          fontWeight:800, fontSize:13, fontFamily:"'Nunito',sans-serif",
          boxShadow:'0 4px 16px rgba(167,139,250,0.35)', transition:'all 0.2s',
        }}>+ Nova Meta</button>
      </div>

      {/* ── CONSTELAÇÃO ── */}
      <ConstellationDisplay goals={concluidas} />

      {/* Sugestões rápidas */}
      {(() => {
        const jaAdicionadas = goals.map(g => g.title)
        const disponiveis = sugestoes.filter(s => !jaAdicionadas.includes(s.titulo) && s.titulo !== 'Meta personalizada')
        if (!disponiveis.length) return null
        return (
          <div style={{ ...CARD, marginBottom:20 }}>
            <div style={{ fontSize:10, color:'#A78BFA', fontWeight:800, textTransform:'uppercase',
              letterSpacing:2, marginBottom:12, fontFamily:"'Nunito',sans-serif" }}>
              ✦ Sugestões para {student?.goal}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {disponiveis.slice(0,4).map((s, i) => {
                const cc = CAT_COLORS[s.categoria] || CAT_COLORS.outro
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    borderRadius:12, background:cc.bg, border:`1px solid ${cc.border}` }}>
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                    <span style={{ fontSize:13, color:C.text, fontWeight:600, flex:1,
                      fontFamily:"'Nunito',sans-serif" }}>{s.titulo}</span>
                    <button onClick={async () => {
                      await supabase.from('student_goals').insert([{
                        student_id:studentId, title:s.titulo, description:s.desc,
                        category:s.categoria, target_unit:s.unidade||null, status:'ativa',
                      }]); await onUpdate()
                    }} style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${cc.border}`,
                      background:cc.bg, color:cc.text, fontSize:18, fontWeight:800, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Estado vazio */}
      {ativas.length === 0 && concluidas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'44px 20px' }}>
          <div style={{ fontSize:48, marginBottom:12, animation:'float 3s ease-in-out infinite' }}>🌌</div>
          <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:6, fontFamily:"'Nunito',sans-serif" }}>Nenhuma meta ainda</div>
          <div style={{ fontSize:13, color:C.sub }}>Adicione metas e veja sua constelação crescer!</div>
        </div>
      ) : (
        <>
          {/* Metas ativas */}
          {ativas.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:10, color:'#60A5FA', fontWeight:800, letterSpacing:2,
                textTransform:'uppercase', marginBottom:12, fontFamily:"'Nunito',sans-serif" }}>◎ Em andamento</div>
              {ativas.map(g => {
                const cc      = CAT_COLORS[g.category] || CAT_COLORS.outro
                const isU     = updating === g.id
                const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline)-new Date())/86400000) : null
                const pct     = g.target_value && g.current_value != null
                  ? Math.min(Math.round((g.current_value/g.target_value)*100), 100) : null
                const isJC    = justCompleted === g.id
                return (
                  <div key={g.id} style={{ ...CARD,
                    borderLeft:`3px solid ${cc.text}`, borderRadius:'0 18px 18px 0', padding:'16px 18px', marginBottom:10,
                    animation: isJC ? 'goalComplete 0.5s ease' : undefined }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                          <span style={{ fontSize:14, fontWeight:800, color:C.text, fontFamily:"'Nunito',sans-serif" }}>{g.title}</span>
                          <span style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20,
                            background:cc.bg, color:cc.text, border:`1px solid ${cc.border}`, letterSpacing:0.5 }}>
                            {g.category}
                          </span>
                        </div>

                        {/* Barra de progresso */}
                        {g.target_value && (
                          <div style={{ marginBottom:8 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                              <span style={{ fontSize:12, color:C.sub }}>
                                🎯 Alvo: <strong style={{ color:cc.text }}>{g.target_value} {g.target_unit}</strong>
                              </span>
                              {pct != null && (
                                <span style={{ fontSize:13, fontWeight:900,
                                  color:pct>=100?'#34D399':pct>=60?'#F5C842':cc.text }}>{pct}%</span>
                              )}
                            </div>
                            {pct != null && (
                              <div style={{ height:7, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:5 }}>
                                <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, transition:'width 0.8s ease',
                                  background: pct>=100 ? 'linear-gradient(90deg,#34D399,#059669)' :
                                    pct>=60 ? 'linear-gradient(90deg,#F5C842,#D97706)' :
                                    `linear-gradient(90deg,${cc.text}70,${cc.text})`,
                                  boxShadow: pct>0 ? `0 0 8px ${cc.text}55` : undefined }} />
                              </div>
                            )}
                            {g.current_value != null && (
                              <div style={{ fontSize:11, color:C.sub, fontFamily:"'Nunito',sans-serif" }}>
                                Atual: <strong style={{ color:cc.text }}>{g.current_value} {g.target_unit}</strong>
                                {editingProgress !== g.id && (
                                  <button onClick={() => { setEditingProgress(g.id); setProgressInput(String(g.current_value)) }}
                                    style={{ marginLeft:8, background:'none', border:'none', color:C.muted,
                                      cursor:'pointer', fontSize:11, textDecoration:'underline' }}>✏️ editar</button>
                                )}
                              </div>
                            )}
                            {g.current_value == null && editingProgress !== g.id && (
                              <button onClick={() => { setEditingProgress(g.id); setProgressInput('') }}
                                style={{ fontSize:11, background:cc.bg, border:`1px solid ${cc.border}`,
                                  borderRadius:8, padding:'4px 10px', color:cc.text, cursor:'pointer', fontWeight:800,
                                  fontFamily:"'Nunito',sans-serif" }}>📝 Registrar progresso</button>
                            )}
                            {editingProgress === g.id && (
                              <div style={{ display:'flex', gap:6, marginTop:6, alignItems:'center' }}>
                                <input type="number" value={progressInput} autoFocus
                                  onChange={e => setProgressInput(e.target.value)}
                                  placeholder={`Ex: ${Math.round(g.target_value/2)}`}
                                  style={{ flex:1, ...INP, padding:'8px 10px', fontSize:14 }} />
                                <span style={{ fontSize:11, color:C.sub }}>{g.target_unit}</span>
                                <button onClick={() => updateCurrentValue(g.id)} style={{
                                  padding:'8px 13px', borderRadius:8, border:'none', background:cc.text,
                                  color:'#02040F', fontWeight:900, fontSize:12, cursor:'pointer' }}>✓</button>
                                <button onClick={() => setEditingProgress(null)} style={{
                                  padding:'8px 10px', borderRadius:8, border:'none',
                                  background:'rgba(255,255,255,0.06)', color:C.sub, fontSize:12, cursor:'pointer' }}>✕</button>
                              </div>
                            )}
                          </div>
                        )}

                        {daysLeft != null && (
                          <div style={{ fontSize:11, fontWeight:700, fontFamily:"'Nunito',sans-serif",
                            color: daysLeft<7?'#F87171':daysLeft<30?'#FBBF24':C.sub }}>
                            {daysLeft>0?`⏳ ${daysLeft} dias restantes`:daysLeft===0?'🔔 Prazo hoje!':`⚠️ ${Math.abs(daysLeft)}d em atraso`}
                          </div>
                        )}
                      </div>

                      {/* Botão concluir */}
                      <button onClick={() => updateStatus(g.id, 'concluida')} disabled={isU} style={{
                        padding: isMobile ? '10px 12px' : '8px 14px', borderRadius:10,
                        border:'1px solid rgba(52,211,153,0.25)',
                        background:'rgba(52,211,153,0.08)', color:'#34D399',
                        fontWeight:800, fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
                        flexShrink:0, fontFamily:"'Nunito',sans-serif", transition:'all 0.2s',
                      }}>{isU ? '...' : '⭐ Concluir'}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Conquistas */}
          {concluidas.length > 0 && (
            <div>
              <div style={{ fontSize:10, color:'#F5C842', fontWeight:800, letterSpacing:2,
                textTransform:'uppercase', marginBottom:12, fontFamily:"'Nunito',sans-serif" }}>
                ★ Conquistadas ({concluidas.length})
              </div>
              {concluidas.map(g => (
                <div key={g.id} style={{ ...CARD, marginBottom:8, padding:'12px 16px',
                  opacity:0.72, borderLeft:`2px solid ${CAT_STAR_COLOR[g.category]||'#94A3B8'}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <svg width={20} height={20} viewBox="0 0 100 100" style={{ flexShrink:0 }}>
                      <polygon points="50,4 61,36 95,36 68,58 79,92 50,71 21,92 32,58 5,36 39,36"
                        fill={CAT_STAR_COLOR[g.category]||'#94A3B8'} />
                    </svg>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8',
                        textDecoration:'line-through', fontFamily:"'Nunito',sans-serif" }}>{g.title}</div>
                      {g.target_value && <div style={{ fontSize:11, color:C.muted }}>{g.target_value} {g.target_unit}</div>}
                    </div>
                    <button onClick={() => deleteGoal(g.id)} style={{ background:'transparent',
                      border:'none', color:C.muted, cursor:'pointer', fontSize:14 }}>🗑</button>
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

// ── Tab Cárdio ────────────────────────────────────────────────────────────────
function TabCardio({ studentId, student, sessions, onNewSession, isMobile }) {
  const [modal,  setModal]  = useState(false)
  const [filter, setFilter] = useState('todos')
  const presc    = SV_PRESCRICAO[student?.goal]
  const filtered = filter === 'todos' ? sessions : sessions.filter(s => s.type === filter)
  const totalMin = sessions.reduce((a,s) => a+(s.duration_minutes||0), 0)
  const totalKm  = sessions.reduce((a,s) => a+(s.distance_km||0), 0)
  const paceData = sessions
    .filter(s => s.distance_km&&s.duration_minutes&&['corrida','esteira','bike'].includes(s.type))
    .map(s => ({ date:svFmtDate(s.date), Pace:parseFloat((s.duration_minutes/s.distance_km).toFixed(2)) }))

  return (
    <div style={{ animation:'fadeUp 0.35s ease' }}>
      {modal && <SvCardioModal studentId={studentId}
        onSave={() => { onNewSession(); setModal(false) }} onClose={() => setModal(false)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Nunito',sans-serif" }}>❤️ Cárdio</div>
          <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{sessions.length} sessões registradas</div>
        </div>
        <button onClick={() => setModal(true)} className="sv-btn-glow" style={{
          padding:'10px 18px', borderRadius:12, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#F87171,#DC2626)', color:'#FFF',
          fontWeight:800, fontSize:13, fontFamily:"'Nunito',sans-serif",
          boxShadow:'0 4px 16px rgba(239,68,68,0.35)', transition:'all 0.2s',
        }}>+ Registrar</button>
      </div>

      {/* Stats */}
      {sessions.length > 0 && (
        <div style={{ ...CARD, marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { label:'Sessões', val:sessions.length,    unit:'',   color:'#60A5FA' },
              { label:'Total',   val:totalMin>=60?`${Math.floor(totalMin/60)}h${totalMin%60}`:totalMin, unit:totalMin<60?'min':'', color:'#A78BFA' },
              { label:'Km',      val:totalKm.toFixed(1), unit:'km', color:'#34D399' },
            ].map(({ label, val, unit, color }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'12px 10px', textAlign:'center' }}>
                <div style={{ fontSize:9, color:C.muted, fontWeight:800, textTransform:'uppercase', letterSpacing:1.2, marginBottom:4, fontFamily:"'Nunito',sans-serif" }}>{label}</div>
                <div style={{ fontSize:22, fontWeight:900, color, fontFamily:"'Nunito',sans-serif" }}>
                  {val}<span style={{ fontSize:11, color:C.muted }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescrição inteligente */}
      {presc && (
        <div style={{ ...CARD, marginBottom:14 }}>
          <div style={{ fontSize:10, color:'#A78BFA', fontWeight:800, textTransform:'uppercase',
            letterSpacing:2, marginBottom:12, fontFamily:"'Nunito',sans-serif" }}>
            ✦ Prescrição para {student?.goal}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
            {[['📅',presc.sessoes,'Frequência'],['⏱',presc.duracao,'Duração'],['📊',presc.volume,'Volume']].map(([icon,val,label]) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:9, color:C.muted, fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:4, fontFamily:"'Nunito',sans-serif" }}>{label}</div>
                <div style={{ fontSize:11, fontWeight:800, color:C.text, lineHeight:1.3, fontFamily:"'Nunito',sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px', marginBottom:8 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🎯 PSE Alvo</div>
            <div style={{ height:8, borderRadius:99, background:'linear-gradient(90deg,#60A5FA,#34D399,#F5C842,#F59E0B,#EF4444)', position:'relative', marginBottom:4 }}>
              <div style={{ position:'absolute', left:`${(presc.pse.min-1)/9*100}%`,
                width:`${(presc.pse.max-presc.pse.min)/9*100}%`, height:'100%',
                background:'rgba(255,255,255,0.3)', borderRadius:99, border:'2px solid rgba(255,255,255,0.7)' }} />
            </div>
            <div style={{ fontSize:11, fontWeight:800, color:C.text }}>{presc.pse.label}</div>
            <div style={{ fontSize:11, color:C.sub, marginTop:3 }}>🏃 {presc.pace}</div>
          </div>
          <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.6, padding:'8px 12px',
            background:'rgba(167,139,250,0.05)', borderRadius:10,
            borderLeft:'2px solid rgba(167,139,250,0.3)', fontFamily:"'Nunito',sans-serif" }}>
            💡 {presc.obs}
          </div>
        </div>
      )}

      {/* Gráfico de pace */}
      {paceData.length >= 2 && (
        <div style={{ ...CARD, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:14, fontFamily:"'Nunito',sans-serif" }}>🏃 Evolução do Pace</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={paceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize:10, fill:C.muted }} />
              <YAxis tick={{ fontSize:10, fill:C.muted }} unit="'/km" domain={['auto','auto']} reversed />
              <Tooltip contentStyle={{ background:'#070B1A', border:`1px solid rgba(167,139,250,0.2)`, borderRadius:10 }} />
              <Line type="monotone" dataKey="Pace" stroke="#A78BFA" strokeWidth={2.5}
                dot={{ r:4, fill:'#A78BFA', stroke:'#02040F', strokeWidth:2 }} activeDot={{ r:6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
        <button onClick={() => setFilter('todos')} style={{
          padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:800, cursor:'pointer',
          border:'none', background:filter==='todos'?'rgba(167,139,250,0.2)':'rgba(255,255,255,0.05)',
          color:filter==='todos'?'#A78BFA':C.sub, fontFamily:"'Nunito',sans-serif" }}>Todos</button>
        {SV_CARDIO_TYPES.filter(t => sessions.some(s => s.type===t.id)).map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:800, cursor:'pointer',
            border:'none', background:filter===t.id?`${t.color}28`:'rgba(255,255,255,0.05)',
            color:filter===t.id?t.color:C.sub, fontFamily:"'Nunito',sans-serif" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Histórico */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'44px 20px', color:C.muted }}>
          <div style={{ fontSize:40, marginBottom:10, animation:'float 3s ease-in-out infinite' }}>❤️</div>
          <div style={{ fontSize:13, fontWeight:700, fontFamily:"'Nunito',sans-serif" }}>Nenhuma sessão registrada ainda</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[...filtered].reverse().map(s => {
            const info = SV_CARDIO_TYPES.find(t => t.id===s.type)
            const pace = svFormatPace(s.distance_km, s.duration_minutes)
            return (
              <div key={s.id} style={{ ...CARD, padding:'12px 14px', marginBottom:0,
                display:'flex', alignItems:'center', gap:12, border:`1px solid ${info?.color}18` }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${info?.color}18`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {info?.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:C.text, fontFamily:"'Nunito',sans-serif" }}>{info?.label}</span>
                    <span style={{ fontSize:10, color:C.sub }}>{String(s.date).slice(0,10).split('-').reverse().join('/')}</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {s.duration_minutes && <span style={{ fontSize:11, color:C.sub }}>⏱ {s.duration_minutes}min</span>}
                    {s.distance_km      && <span style={{ fontSize:11, color:C.sub }}>📍 {s.distance_km}km</span>}
                    {pace               && <span style={{ fontSize:11, color:'#A78BFA', fontWeight:800 }}>🏃 {pace}</span>}
                    {s.pse              && <span style={{ fontSize:11, color:C.sub }}>PSE {s.pse}/10</span>}
                  </div>
                  {s.notes && <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:'italic' }}>{s.notes}</div>}
                </div>
                <div style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:13, fontWeight:900, color:'#02040F', flexShrink:0,
                  background:`hsl(${120-(s.pse||5)*12},70%,50%)`,
                  boxShadow:`0 0 10px hsl(${120-(s.pse||5)*12},70%,50%)60` }}>
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

// ── STUDENT VIEW ──────────────────────────────────────────────────────────────
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
  const [loading,    setLoading]    = useState(true)

  const loadAll = async () => {
    const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single()
    if (st) setStudent(st)

    const { data: plans } = await supabase.from('workout_plans').select('*')
      .eq('student_id', studentId).eq('status', 'active')
      .order('updated_at', { ascending:false }).limit(1)

    if (plans?.[0]) {
      setActivePlan(plans[0])
      const { data: daysData } = await supabase.from('workout_days').select('*, exercises(*)')
        .eq('plan_id', plans[0].id).order('order_index')
      if (daysData) setDays(daysData.map(d => ({
        ...d, exercises:(d.exercises||[]).sort((a,b) => a.order_index-b.order_index)
      })))
    }

    const [{ data:pr }, { data:gs }, { data:cs }] = await Promise.all([
      supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date',{ascending:false}).limit(10),
      supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at',{ascending:false}),
      supabase.from('cardio_sessions').select('*').eq('student_id', studentId).order('date',{ascending:false}).limit(120),
    ])
    if (pr) setProgress(pr)
    if (gs) setGoals(gs)
    if (cs) setCardio(cs)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [studentId])

  if (loading) return (
    <>
      <CosmicCSS />
      <StarField />
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        color:'#A78BFA', fontSize:16, fontFamily:"'Nunito',sans-serif", position:'relative', zIndex:1 }}>
        ✨ Carregando seu treino...
      </div>
    </>
  )

  if (!student) return (
    <>
      <CosmicCSS />
      <StarField />
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        color:C.sub, fontFamily:"'Nunito',sans-serif", position:'relative', zIndex:1 }}>
        Aluno não encontrado.
      </div>
    </>
  )

  const day           = days[activeDay]
  const dayColor      = DAY_COLORS[activeDay % DAY_COLORS.length]
  const concluidas    = goals.filter(g => g.status === 'concluida')

  const TABS = [
    { id:'treino',   icon:'🏋️', label:'Treino'   },
    { id:'metas',    icon:'🎯', label:'Metas'    },
    { id:'cardio',   icon:'❤️', label:'Cárdio'   },
    { id:'evolucao', icon:'📈', label:'Evolução' },
  ]

  return (
    <>
      <CosmicCSS />
      <StarField />

      <div style={{
        minHeight: '100vh', position:'relative', zIndex:1,
        fontFamily: "'Nunito', system-ui, sans-serif", color: C.text,
        paddingBottom: isMobile ? 82 : 32,
      }}>
        <div style={{ maxWidth:700, margin:'0 auto', padding: isMobile ? '16px 14px' : '28px 20px' }}>

          {/* ── HEADER ── */}
          <div style={{ ...CARD, marginBottom:18, padding: isMobile ? 18 : 24,
            background:'rgba(7,11,34,0.85)',
            border:'1px solid rgba(99,102,241,0.2)',
            boxShadow:'0 0 40px rgba(99,102,241,0.08)' }}>
            <div style={{ fontSize:10, color:'#A78BFA', letterSpacing:3.5, textTransform:'uppercase',
              marginBottom:6, fontWeight:800 }}>Seu Plano de Treino</div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight:900, color:C.text, marginBottom:4,
              lineHeight:1.1 }}>
              Olá, {student.name.split(' ')[0]}! 💪
            </div>
            <div style={{ fontSize:13, color:C.sub, marginBottom: concluidas.length ? 12 : 0 }}>
              {student.goal} · {student.level}
            </div>

            {/* Estrelas conquistadas no header */}
            {concluidas.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ display:'flex', gap:4 }}>
                  {concluidas.slice(0, isMobile ? 5 : 8).map((g, i) => {
                    const color = CAT_STAR_COLOR[g.category] || '#94A3B8'
                    return (
                      <svg key={g.id} width={14} height={14} viewBox="0 0 100 100" title={g.title}
                        style={{ '--sc':color, animation:`starPulse 3s ${i*0.4}s ease-in-out infinite`, cursor:'default' }}>
                        <polygon points="50,4 61,36 95,36 68,58 79,92 50,71 21,92 32,58 5,36 39,36" fill={color} />
                      </svg>
                    )
                  })}
                  {concluidas.length > (isMobile ? 5 : 8) && (
                    <span style={{ fontSize:11, color:C.muted, fontWeight:700 }}>+{concluidas.length - (isMobile ? 5 : 8)}</span>
                  )}
                </div>
                <span style={{ fontSize:11, color:'#F5C842', fontWeight:700 }}>
                  {concluidas.length} conquista{concluidas.length!==1?'s':''}
                </span>
              </div>
            )}

            {activePlan && (
              <div style={{ marginTop:12, background:'rgba(99,102,241,0.1)', borderRadius:10,
                padding:'7px 14px', display:'inline-block', border:'1px solid rgba(99,102,241,0.2)' }}>
                <span style={{ fontSize:12, color:'#A78BFA', fontWeight:700 }}>📋 {activePlan.title}</span>
              </div>
            )}
          </div>

          {/* ── TABS DESKTOP ── */}
          {!isMobile && (
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {TABS.map(({ id, icon, label }) => (
                <button key={id} className="sv-tab" onClick={() => setTab(id)} style={{
                  flex:1, padding:'12px 8px', borderRadius:12, border:'none', cursor:'pointer',
                  background: tab===id ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.04)',
                  color: tab===id ? '#fff' : C.sub, fontWeight:800, fontSize:13,
                  boxShadow: tab===id ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
                  fontFamily:"'Nunito',sans-serif", transition:'all 0.15s',
                }}>{icon} {label}</button>
              ))}
            </div>
          )}

          {/* ── ABA TREINO ── */}
          {tab === 'treino' && (
            <div style={{ animation:'fadeUp 0.35s ease' }}>
              {!activePlan || days.length === 0 ? (
                <div style={{ ...CARD, textAlign:'center', padding:'48px 20px' }}>
                  <div style={{ fontSize:44, marginBottom:12, animation:'float 3s ease-in-out infinite' }}>🏋️</div>
                  <div style={{ fontSize:15, color:C.sub, lineHeight:1.7 }}>
                    Nenhum treino ativo.<br/>Aguarde seu professor configurar seu plano.
                  </div>
                </div>
              ) : (
                <>
                  {/* Seletor de dias */}
                  <div style={{ display:'flex', gap:8, marginBottom:16,
                    overflowX: isMobile ? 'auto' : 'visible',
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    paddingBottom: isMobile ? 4 : 0,
                    WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
                    {days.map((d, i) => {
                      const c = DAY_COLORS[i % DAY_COLORS.length]
                      return (
                        <button key={d.id} onClick={() => setActiveDay(i)} style={{
                          flexShrink: isMobile ? 0 : 1,
                          flex: isMobile ? 'none' : 1,
                          minWidth: 72,
                          padding:'12px 10px', borderRadius:14, cursor:'pointer',
                          border: activeDay===i ? `2px solid ${c}` : `1px solid ${C.border}`,
                          background: activeDay===i ? `${c}20` : 'rgba(255,255,255,0.03)',
                          color: activeDay===i ? c : C.sub,
                          fontWeight:800, fontSize:13, fontFamily:"'Nunito',sans-serif",
                          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                          transition:'all 0.15s',
                        }}>
                          <span>{d.name}</span>
                          {d.day_of_week && <span style={{ fontSize:9, fontWeight:500, opacity:0.7 }}>{d.day_of_week}</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Card do dia */}
                  {day && (
                    <div style={{ background:C.card, backdropFilter:'blur(16px)', borderRadius:18,
                      overflow:'hidden', border:`1px solid ${dayColor}28`, marginBottom:14 }}>
                      {/* Day header */}
                      <div style={{ background:`${dayColor}10`, padding: isMobile ? '14px 14px' : '16px 20px',
                        borderBottom:`1px solid ${dayColor}20` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:dayColor,
                            boxShadow:`0 0 10px ${dayColor}`, flexShrink:0 }} />
                          <span style={{ fontWeight:800, color:dayColor, fontSize: isMobile ? 15 : 16,
                            fontFamily:"'Nunito',sans-serif" }}>{day.name}</span>
                          {day.focus && <span style={{ fontSize:12, color:C.sub }}>— {day.focus}</span>}
                        </div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>
                          ⚖️ Toque em <strong style={{ color:C.sub }}>Registrar carga</strong> para anotar o peso usado
                        </div>
                      </div>

                      {/* Cabeçalho colunas — desktop */}
                      {!isMobile && (
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 0.5fr 0.7fr 0.6fr',
                          gap:8, padding:'10px 20px', borderBottom:`1px solid ${C.border}` }}>
                          {['Exercício','Séries','Reps','Descanso'].map(h => (
                            <div key={h} style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
                          ))}
                        </div>
                      )}

                      {/* Exercícios */}
                      {day.exercises.length === 0 ? (
                        <div style={{ padding:30, textAlign:'center', color:C.muted, fontSize:13 }}>
                          Nenhum exercício neste dia ainda.
                        </div>
                      ) : (
                        day.exercises.map(ex => (
                          <ExerciseLogRow key={ex.id} ex={ex} studentId={studentId}
                            dayColor={dayColor} isMobile={isMobile} />
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ABA METAS ── */}
          {tab === 'metas' && (
            <TabMetas
              studentId={studentId}
              student={student}
              goals={goals}
              isMobile={isMobile}
              onUpdate={async () => {
                const { data:gs } = await supabase.from('student_goals').select('*')
                  .eq('student_id', studentId).order('created_at',{ascending:false})
                if (gs) setGoals(gs)
              }}
            />
          )}

          {/* ── ABA CÁRDIO ── */}
          {tab === 'cardio' && (
            <TabCardio
              studentId={studentId}
              student={student}
              sessions={cardio}
              isMobile={isMobile}
              onNewSession={async () => {
                const { data:cs } = await supabase.from('cardio_sessions').select('*')
                  .eq('student_id', studentId).order('date',{ascending:false}).limit(120)
                if (cs) setCardio(cs)
              }}
            />
          )}

          {/* ── ABA EVOLUÇÃO ── */}
          {tab === 'evolucao' && (
            <div style={{ animation:'fadeUp 0.35s ease' }}>
              {progress.length === 0 ? (
                <div style={{ ...CARD, textAlign:'center', padding:'48px 20px' }}>
                  <div style={{ fontSize:44, marginBottom:12, animation:'float 3s ease-in-out infinite' }}>📈</div>
                  <div style={{ fontSize:15, color:C.sub }}>Nenhum registro de evolução ainda.</div>
                </div>
              ) : (
                progress.map((p, i) => (
                  <div key={p.id} style={{ ...CARD }}>
                    <div style={{ fontSize:13, color:C.green, fontWeight:700, marginBottom:12,
                      display:'flex', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                      {new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
                      {i === 0 && <span style={{ fontSize:10, background:'rgba(52,211,153,0.12)',
                        color:'#34D399', padding:'2px 10px', borderRadius:20, border:'1px solid rgba(52,211,153,0.2)' }}>
                        Mais recente
                      </span>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,auto)',
                      gap: isMobile ? '10px 16px' : '8px 20px' }}>
                      {[
                        { label:'Peso',    val: p.weight                                  ? `${p.weight} kg`                                  : null },
                        { label:'Cintura', val: p.waist  || p.measurements?.waist         ? `${p.waist||p.measurements?.waist} cm`             : null },
                        { label:'Peito',   val: p.chest  || p.measurements?.chest         ? `${p.chest||p.measurements?.chest} cm`             : null },
                        { label:'Quadril', val: p.hip    || p.measurements?.hip           ? `${p.hip||p.measurements?.hip} cm`                 : null },
                        { label:'Coxa',    val: p.thigh  || p.measurements?.thigh         ? `${p.thigh||p.measurements?.thigh} cm`             : null },
                      ].filter(m => m.val).map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize:10, color:C.sub, textTransform:'uppercase',
                            letterSpacing:0.8, marginBottom:2 }}>{m.label}</div>
                          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    {p.notes && <div style={{ fontSize:12, color:C.sub, marginTop:10,
                      borderTop:`1px solid ${C.border}`, paddingTop:8 }}>📝 {p.notes}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Rodapé */}
          <div style={{ marginTop:24, textAlign:'center', fontSize:10,
            color:'rgba(61,79,122,0.5)', letterSpacing:1.5, textTransform:'uppercase' }}>
            Trainer App · Gerenciado pelo seu professor
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV MOBILE ── */}
      {isMobile && (
        <nav style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:200,
          background:'rgba(2,4,15,0.96)', backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(99,102,241,0.15)',
          display:'flex', height:72,
          paddingBottom:'env(safe-area-inset-bottom)',
        }}>
          {TABS.map(({ id, icon, label }) => {
            const active = tab === id
            const hasStars = id === 'metas' && concluidas.length > 0
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:3,
                background:'none', border:'none', cursor:'pointer',
                color: active ? '#A78BFA' : C.muted,
                position:'relative', transition:'color 0.15s',
              }}>
                {hasStars && !active && (
                  <div style={{ position:'absolute', top:8, right:'25%', width:7, height:7,
                    borderRadius:'50%', background:'#F5C842',
                    boxShadow:'0 0 6px #F5C84288' }} />
                )}
                <span style={{ fontSize:22, lineHeight:1,
                  filter: active ? 'drop-shadow(0 0 8px rgba(167,139,250,0.7))' : 'none',
                  transition:'filter 0.15s' }}>{icon}</span>
                <span style={{ fontSize:10, fontWeight: active ? 800 : 600, letterSpacing:0.3,
                  fontFamily:"'Nunito',sans-serif" }}>{label}</span>
                {active && (
                  <div
