import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Constantes ────────────────────────────────────────────────────────────────
const FASES = {
  adaptacao:       { label:'Adaptação',      cor:'#60A5FA', bg:'rgba(96,165,250,0.12)',  border:'rgba(96,165,250,0.3)'  },
  acumulacao:      { label:'Acumulação',     cor:'#34D399', bg:'rgba(52,211,153,0.12)',  border:'rgba(52,211,153,0.3)'  },
  intensificacao:  { label:'Intensificação', cor:'#A78BFA', bg:'rgba(167,139,250,0.12)', border:'rgba(167,139,250,0.3)' },
  deload:          { label:'Deload',         cor:'#FBBF24', bg:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.3)'  },
  pico:            { label:'Pico',           cor:'#F87171', bg:'rgba(248,113,113,0.12)', border:'rgba(248,113,113,0.3)' },
}

const FASE_DEFAULTS = {
  adaptacao:      { sets:[2,3], reps:[12,15], intensidade:'60–65% 1RM', descanso:'1min–1min30s', semanas:4 },
  acumulacao:     { sets:[3,4], reps:[8,12],  intensidade:'67–75% 1RM', descanso:'1min–2min',    semanas:6 },
  intensificacao: { sets:[4,5], reps:[5,8],   intensidade:'78–85% 1RM', descanso:'2min–3min',    semanas:5 },
  deload:         { sets:[2,3], reps:[10,15], intensidade:'50–60% 1RM', descanso:'1min',          semanas:1 },
  pico:           { sets:[3,4], reps:[3,5],   intensidade:'85–92% 1RM', descanso:'3min–5min',     semanas:3 },
}

// ── Background SVG symbols ────────────────────────────────────────────────────
function PlannerBg() {
  return (
    <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', opacity:0.03, pointerEvents:'none', zIndex:0 }} xmlns="http://www.w3.org/2000/svg">
      {/* Clipboard */}
      <g transform="translate(80,60)">
        <rect x="0" y="8" width="48" height="58" rx="4" fill="none" stroke="#fff" strokeWidth="2"/>
        <rect x="14" y="2" width="20" height="12" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
        <line x1="8" y1="26" x2="40" y2="26" stroke="#fff" strokeWidth="1.5"/>
        <line x1="8" y1="34" x2="40" y2="34" stroke="#fff" strokeWidth="1.5"/>
        <line x1="8" y1="42" x2="30" y2="42" stroke="#fff" strokeWidth="1.5"/>
      </g>
      {/* Calendar */}
      <g transform="translate(600,120)">
        <rect x="0" y="8" width="56" height="52" rx="4" fill="none" stroke="#fff" strokeWidth="2"/>
        <line x1="0" y1="24" x2="56" y2="24" stroke="#fff" strokeWidth="2"/>
        <line x1="16" y1="0" x2="16" y2="16" stroke="#fff" strokeWidth="2"/>
        <line x1="40" y1="0" x2="40" y2="16" stroke="#fff" strokeWidth="2"/>
        {[0,1,2,3].map(c => [0,1,2].map(r => (
          <rect key={`${c}${r}`} x={8+c*14} y={30+r*12} width="8" height="7" rx="1" fill="#fff" opacity="0.5"/>
        )))}
      </g>
      {/* Pencil */}
      <g transform="translate(300,400) rotate(-30)">
        <rect x="0" y="0" width="12" height="60" rx="2" fill="none" stroke="#fff" strokeWidth="2"/>
        <polygon points="0,60 12,60 6,72" fill="none" stroke="#fff" strokeWidth="2"/>
        <line x1="0" y1="10" x2="12" y2="10" stroke="#fff" strokeWidth="1.5"/>
      </g>
      {/* Chart bars */}
      <g transform="translate(900,350)">
        <rect x="0"  y="40" width="16" height="20" rx="2" fill="#fff"/>
        <rect x="22" y="24" width="16" height="36" rx="2" fill="#fff"/>
        <rect x="44" y="10" width="16" height="50" rx="2" fill="#fff"/>
        <line x1="-4" y1="60" x2="68" y2="60" stroke="#fff" strokeWidth="1.5"/>
      </g>
      {/* Timeline dots */}
      <g transform="translate(150,500)">
        <line x1="0" y1="10" x2="200" y2="10" stroke="#fff" strokeWidth="1.5"/>
        {[0,50,100,150,200].map(x => <circle key={x} cx={x} cy="10" r="5" fill="none" stroke="#fff" strokeWidth="2"/>)}
      </g>
    </svg>
  )
}

// ── Modal criar macrociclo ────────────────────────────────────────────────────
function ModalMacro({ student, teacherId, onSave, onClose }) {
  const [titulo,  setTitulo]  = useState(student?.goal ? `${student.goal} — Macrociclo` : 'Novo Macrociclo')
  const [semanas, setSemanas] = useState(16)
  const [inicio,  setInicio]  = useState(new Date().toISOString().slice(0,10))
  const [saving,  setSaving]  = useState(false)

  const TEMPLATES = [
    { label:'Emagrecimento 16 sem', semanas:16, fases:[
      { nome:'Adaptação',     fase:'adaptacao',      semana_inicio:1,  semana_fim:4  },
      { nome:'Acumulação',    fase:'acumulacao',     semana_inicio:5,  semana_fim:10 },
      { nome:'Intensificação',fase:'intensificacao', semana_inicio:11, semana_fim:14 },
      { nome:'Deload',        fase:'deload',         semana_inicio:15, semana_fim:16 },
    ]},
    { label:'Hipertrofia 20 sem', semanas:20, fases:[
      { nome:'Adaptação',     fase:'adaptacao',      semana_inicio:1,  semana_fim:4  },
      { nome:'Acumulação',    fase:'acumulacao',     semana_inicio:5,  semana_fim:12 },
      { nome:'Intensificação',fase:'intensificacao', semana_inicio:13, semana_fim:18 },
      { nome:'Deload',        fase:'deload',         semana_inicio:19, semana_fim:20 },
    ]},
    { label:'Força 12 sem', semanas:12, fases:[
      { nome:'Volume',        fase:'acumulacao',     semana_inicio:1,  semana_fim:4  },
      { nome:'Intensificação',fase:'intensificacao', semana_inicio:5,  semana_fim:9  },
      { nome:'Pico',          fase:'pico',           semana_inicio:10, semana_fim:11 },
      { nome:'Deload',        fase:'deload',         semana_inicio:12, semana_fim:12 },
    ]},
  ]

  const [selectedTpl, setSelectedTpl] = useState(0)

  const save = async () => {
    setSaving(true)
    const { data: macro } = await supabase.from('macrociclos').insert([{
      teacher_id: teacherId, student_id: student.id,
      titulo, objetivo: student?.goal, semanas_total: semanas, data_inicio: inicio,
    }]).select().single()

    if (macro) {
      const tpl = TEMPLATES[selectedTpl]
      const mesos = tpl.fases.map((f, i) => {
        const def = FASE_DEFAULTS[f.fase]
        return {
          macrociclo_id: macro.id, nome: f.nome, fase: f.fase,
          semana_inicio: f.semana_inicio, semana_fim: f.semana_fim,
          ref_sets_min: def.sets[0], ref_sets_max: def.sets[1],
          ref_reps_min: def.reps[0], ref_reps_max: def.reps[1],
          ref_intensidade: def.intensidade, ref_descanso: def.descanso, ordem: i,
        }
      })
      await supabase.from('mesociclos').insert(mesos)
    }
    setSaving(false)
    onSave()
    onClose()
  }

  const inp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5, display:'block', marginTop:14 }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, padding:28, width:'100%', maxWidth:480, border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0', marginBottom:4 }}>Novo Macrociclo</div>
        <div style={{ fontSize:12, color:'#475569', marginBottom:20 }}>Para: {student?.name}</div>

        <label style={lbl}>Nome</label>
        <input style={inp} value={titulo} onChange={e=>setTitulo(e.target.value)} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={lbl}>Data de início</label>
            <input style={inp} type="date" value={inicio} onChange={e=>setInicio(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Semanas totais</label>
            <input style={inp} type="number" min="4" max="52" value={semanas} onChange={e=>setSemanas(+e.target.value)} />
          </div>
        </div>

        <label style={lbl}>Template de mesociclos</label>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {TEMPLATES.map((t,i) => (
            <div key={i} onClick={() => { setSelectedTpl(i); setSemanas(t.semanas) }}
              style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${selectedTpl===i ? '#60A5FA' : 'rgba(255,255,255,0.08)'}`, background: selectedTpl===i ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)', cursor:'pointer' }}>
              <div style={{ fontSize:12, fontWeight:700, color: selectedTpl===i ? '#60A5FA' : '#E2E8F0', marginBottom:6 }}>{t.label}</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {t.fases.map((f,j) => {
                  const fc = FASES[f.fase]
                  const w = f.semana_fim - f.semana_inicio + 1
                  return (
                    <span key={j} style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:fc.bg, color:fc.cor, border:`1px solid ${fc.border}` }}>
                      {f.nome} ({w}sem)
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, marginTop:24 }}>
          <button onClick={save} disabled={saving} style={{ flex:1, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:800, fontSize:14 }}>
            {saving ? 'Criando...' : 'Criar Macrociclo'}
          </button>
          <button onClick={onClose} style={{ flex:1, padding:'13px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#475569', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal editar mesociclo ────────────────────────────────────────────────────
function ModalMeso({ meso, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: meso.nome, fase: meso.fase,
    semana_inicio: meso.semana_inicio, semana_fim: meso.semana_fim,
    ref_sets_min: meso.ref_sets_min, ref_sets_max: meso.ref_sets_max,
    ref_reps_min: meso.ref_reps_min, ref_reps_max: meso.ref_reps_max,
    ref_intensidade: meso.ref_intensidade, ref_descanso: meso.ref_descanso,
  })
  const [saving, setSaving] = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const applyDefaults = (fase) => {
    const d = FASE_DEFAULTS[fase]
    setForm(p => ({ ...p, fase,
      ref_sets_min:d.sets[0], ref_sets_max:d.sets[1],
      ref_reps_min:d.reps[0], ref_reps_max:d.reps[1],
      ref_intensidade:d.intensidade, ref_descanso:d.descanso,
    }))
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('mesociclos').update({ ...form }).eq('id', meso.id)
    setSaving(false); onSave(); onClose()
  }

  const inp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5, display:'block', marginTop:12 }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, padding:24, width:'100%', maxWidth:440, border:'1px solid rgba(255,255,255,0.08)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0', marginBottom:18 }}>Editar Mesociclo</div>

        <label style={lbl}>Nome</label>
        <input style={inp} value={form.nome} onChange={e=>f('nome',e.target.value)} />

        <label style={lbl}>Fase</label>
        <select style={inp} value={form.fase} onChange={e=>applyDefaults(e.target.value)}>
          {Object.entries(FASES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div><label style={lbl}>Semana início</label><input style={inp} type="number" value={form.semana_inicio} onChange={e=>f('semana_inicio',+e.target.value)} /></div>
          <div><label style={lbl}>Semana fim</label><input style={inp} type="number" value={form.semana_fim} onChange={e=>f('semana_fim',+e.target.value)} /></div>
          <div><label style={lbl}>Séries mín</label><input style={inp} type="number" value={form.ref_sets_min||''} onChange={e=>f('ref_sets_min',+e.target.value)} /></div>
          <div><label style={lbl}>Séries máx</label><input style={inp} type="number" value={form.ref_sets_max||''} onChange={e=>f('ref_sets_max',+e.target.value)} /></div>
          <div><label style={lbl}>Reps mín</label><input style={inp} type="number" value={form.ref_reps_min||''} onChange={e=>f('ref_reps_min',+e.target.value)} /></div>
          <div><label style={lbl}>Reps máx</label><input style={inp} type="number" value={form.ref_reps_max||''} onChange={e=>f('ref_reps_max',+e.target.value)} /></div>
        </div>
        <label style={lbl}>Intensidade ref.</label>
        <input style={inp} value={form.ref_intensidade||''} onChange={e=>f('ref_intensidade',e.target.value)} placeholder="ex: 70–75% 1RM" />
        <label style={lbl}>Descanso ref.</label>
        <input style={inp} value={form.ref_descanso||''} onChange={e=>f('ref_descanso',e.target.value)} placeholder="ex: 1min–2min" />

        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={save} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:800, fontSize:13 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#475569', fontSize:13, cursor:'pointer' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Macro Overview (visão panorâmica) ─────────────────────────────────────────
function MacroOverview({ macro, mesos, semanaAtual, onMesoClick }) {
  const total = macro.semanas_total

  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
      {/* Barra de progresso geral */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <span style={{ fontSize:11, color:'#334155', flexShrink:0 }}>Sem 1</span>
        <div style={{ flex:1, position:'relative', height:8, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'visible' }}>
          <div style={{ width:`${(semanaAtual/total)*100}%`, height:'100%', background:'linear-gradient(90deg,#3B82F6,#60A5FA)', borderRadius:99, transition:'width 0.5s' }} />
          {semanaAtual > 0 && semanaAtual <= total && (
            <div style={{ position:'absolute', left:`${(semanaAtual/total)*100}%`, top:'50%', transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', background:'#60A5FA', border:'2px solid #0D1117', boxShadow:'0 0 10px #60A5FA' }} />
          )}
        </div>
        <span style={{ fontSize:11, color:'#334155', flexShrink:0 }}>Sem {total}</span>
        <span style={{ fontSize:10, background:'rgba(96,165,250,0.15)', color:'#60A5FA', padding:'2px 10px', borderRadius:20, fontWeight:700, flexShrink:0 }}>
          {semanaAtual > 0 ? `Sem ${semanaAtual}` : 'Não iniciado'}
        </span>
      </div>

      {/* Blocos proporcionais dos mesos */}
      <div style={{ display:'flex', gap:4 }}>
        {mesos.map(m => {
          const fc   = FASES[m.fase] || FASES.adaptacao
          const span = m.semana_fim - m.semana_inicio + 1
          const done = semanaAtual > m.semana_fim
          const curr = semanaAtual >= m.semana_inicio && semanaAtual <= m.semana_fim
          return (
            <div key={m.id} onClick={() => onMesoClick(m)}
              style={{ flex:span, background:fc.bg, border:`1.5px solid ${curr ? fc.cor : fc.border}`, borderRadius:10, padding:'8px 10px', cursor:'pointer', position:'relative', transition:'all 0.2s', opacity: done ? 0.7 : 1 }}>
              {/* Badge status */}
              {done && (
                <div style={{ position:'absolute', top:-1, right:-1, background:'rgba(52,211,153,0.2)', color:'#34D399', fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:'0 9px 0 6px' }}>✓</div>
              )}
              {curr && (
                <div style={{ position:'absolute', top:-1, right:-1, background:fc.bg, color:fc.cor, fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:'0 9px 0 6px', border:`1px solid ${fc.border}` }}>●</div>
              )}
              <div style={{ fontSize:10, fontWeight:700, color:fc.cor, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.nome}</div>
              <div style={{ fontSize:9, color:fc.cor, opacity:0.7, marginBottom:6 }}>Sem {m.semana_inicio}–{m.semana_fim}</div>
              {/* Mini barras de semanas */}
              <div style={{ display:'flex', gap:2 }}>
                {Array.from({length:span}).map((_,i) => {
                  const s = m.semana_inicio + i
                  const isDeload = m.fase === 'deload' || i === span-1
                  const isDone = semanaAtual > s
                  const isCurr = semanaAtual === s
                  return (
                    <div key={i} style={{ flex:1, height:16, borderRadius:3,
                      background: isDeload ? 'rgba(251,191,36,0.3)' : isDone ? fc.cor : isCurr ? fc.cor+'80' : 'rgba(255,255,255,0.08)',
                      border: isCurr ? `1px solid ${fc.cor}` : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {span <= 8 && <span style={{ fontSize:7, color: isDone||isCurr ? '#fff' : '#334155', fontWeight:600 }}>{s}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Planner principal ─────────────────────────────────────────────────────────
export default function Planner({ navigate, studentId, student: studentProp }) {
  const [student,    setStudent]    = useState(studentProp || null)
  const [macros,     setMacros]     = useState([])
  const [mesosByMacro, setMesosByMacro] = useState({})
  const [plansByMeso, setPlansByMeso]  = useState({})
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editMeso,   setEditMeso]   = useState(null)
  const [view,       setView]       = useState('macro')   // 'macro' | 'detalhe'
  const [activeMacro, setActiveMacro] = useState(null)
  const [expandedMesos, setExpandedMesos] = useState({})

  const teacherId = student?.teacher_id

  useEffect(() => {
    if (!studentId) return
    load()
  }, [studentId])

  const load = async () => {
    setLoading(true)
    // Load student if not passed
    if (!studentProp) {
      const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single()
      if (st) setStudent(st)
    }
    // Load macrociclos
    const { data: macData } = await supabase.from('macrociclos')
      .select('*').eq('student_id', studentId).order('created_at')
    setMacros(macData || [])

    if (macData?.length) {
      const macIds = macData.map(m => m.id)
      // Load mesociclos
      const { data: mesoData } = await supabase.from('mesociclos')
        .select('*').in('macrociclo_id', macIds).order('semana_inicio')
      const mesoMap = {}
      macIds.forEach(id => { mesoMap[id] = [] })
      ;(mesoData||[]).forEach(m => mesoMap[m.macrociclo_id]?.push(m))
      setMesosByMacro(mesoMap)

      // Load plans linked to mesos
      const mesoIds = (mesoData||[]).map(m => m.id)
      if (mesoIds.length) {
        const { data: planData } = await supabase.from('workout_plans')
          .select('id,title,status,mesociclo_id').in('mesociclo_id', mesoIds)
        const planMap = {}
        mesoIds.forEach(id => { planMap[id] = [] })
        ;(planData||[]).forEach(p => planMap[p.mesociclo_id]?.push(p))
        setPlansByMeso(planMap)
      }

      if (!activeMacro && macData.length) setActiveMacro(macData[0].id)
    }
    setLoading(false)
  }

  const semanaAtual = (macro) => {
    if (!macro?.data_inicio) return 0
    const diff = Math.floor((new Date() - new Date(macro.data_inicio)) / (7*24*3600*1000))
    return Math.max(1, Math.min(diff + 1, macro.semanas_total))
  }

  const faseDaMesociclo = (mesos, semana) =>
    mesos.find(m => semana >= m.semana_inicio && semana <= m.semana_fim)

  const toggleMeso = (id) => setExpandedMesos(p => ({ ...p, [id]: !p[id] }))

  const deleteMacro = async (id) => {
    if (!window.confirm('Excluir este macrociclo e todos seus mesociclos?')) return
    await supabase.from('macrociclos').delete().eq('id', id)
    load()
  }

  const deleteMeso = async (id) => {
    if (!window.confirm('Excluir este mesociclo?')) return
    await supabase.from('mesociclos').delete().eq('id', id)
    load()
  }

  const addMeso = async (macroId, mesos) => {
    const lastSem = mesos.length ? Math.max(...mesos.map(m => m.semana_fim)) : 0
    const def = FASE_DEFAULTS.adaptacao
    await supabase.from('mesociclos').insert([{
      macrociclo_id: macroId, nome: 'Novo Mesociclo', fase: 'adaptacao',
      semana_inicio: lastSem + 1, semana_fim: lastSem + 4,
      ref_sets_min: def.sets[0], ref_sets_max: def.sets[1],
      ref_reps_min: def.reps[0], ref_reps_max: def.reps[1],
      ref_intensidade: def.intensidade, ref_descanso: def.descanso,
      ordem: mesos.length,
    }])
    load()
  }

  const createPlanInMeso = async (mesoId, macroId) => {
    const mac  = macros.find(m => m.id === macroId)
    const meso = (mesosByMacro[macroId]||[]).find(m => m.id === mesoId)
    const { data } = await supabase.from('workout_plans').insert([{
      student_id: studentId, teacher_id: teacherId,
      title: meso ? `Treino — ${meso.nome}` : 'Novo Plano',
      status: 'draft', mesociclo_id: mesoId,
    }]).select().single()
    if (data) navigate('workout-editor', { studentId, planId: data.id })
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const BG = '#080F1A'
  const CARD = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px' }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', color:'#60A5FA', fontSize:16, fontFamily:"'DM Sans',sans-serif" }}>
      Carregando planejamento...
    </div>
  )

  const macro = macros.find(m => m.id === activeMacro) || macros[0]
  const mesos = macro ? (mesosByMacro[macro.id] || []) : []
  const sem   = macro ? semanaAtual(macro) : 0
  const mesoAtual = faseDaMesociclo(mesos, sem)

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:"'DM Sans','Segoe UI',sans-serif", position:'relative' }}>
      <PlannerBg />

      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 20px', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <button onClick={() => navigate('student-detail', { id: studentId })}
            style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
            ← Voltar ao Perfil
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#E2E8F0', letterSpacing:'-0.4px' }}>
              Planejamento — {student?.name?.split(' ')[0]}
            </div>
            <div style={{ fontSize:12, color:'#334155', marginTop:2 }}>
              {student?.goal} · {student?.level}
              {mesoAtual && <span style={{ marginLeft:8, color:FASES[mesoAtual.fase]?.cor, fontWeight:700 }}>· {mesoAtual.nome} em curso</span>}
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ padding:'9px 18px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
            + Macrociclo
          </button>
        </div>

        {macros.length === 0 ? (
          <div style={{ ...CARD, textAlign:'center', padding:'64px 20px' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0', marginBottom:8 }}>Nenhum macrociclo ainda</div>
            <div style={{ fontSize:13, color:'#334155', marginBottom:24 }}>Crie o primeiro macrociclo para começar a periodizar os treinos de {student?.name?.split(' ')[0]}</div>
            <button onClick={() => setShowModal(true)}
              style={{ padding:'12px 28px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:700, fontSize:14, fontFamily:'inherit' }}>
              Criar Macrociclo
            </button>
          </div>
        ) : (
          <>
            {/* Seletor de macrociclo (se tiver mais de um) */}
            {macros.length > 1 && (
              <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
                {macros.map(m => (
                  <button key={m.id} onClick={() => setActiveMacro(m.id)}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit',
                      background: activeMacro===m.id ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                      color: activeMacro===m.id ? '#60A5FA' : '#475569',
                      outline: activeMacro===m.id ? '1px solid rgba(96,165,250,0.3)' : 'none' }}>
                    {m.titulo}
                  </button>
                ))}
              </div>
            )}

            {macro && (
              <>
                {/* Macro header card */}
                <div style={{ ...CARD, marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0', marginBottom:2 }}>{macro.titulo}</div>
                    <div style={{ fontSize:11, color:'#475569' }}>
                      {macro.data_inicio ? new Date(macro.data_inicio+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}) : 'Sem data de início'} · {macro.semanas_total} semanas · {mesos.length} mesociclos
                    </div>
                  </div>
                  {/* View toggle */}
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => setView('macro')}
                      style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit',
                        background: view==='macro' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                        color: view==='macro' ? '#60A5FA' : '#475569', outline: view==='macro' ? '1px solid rgba(96,165,250,0.3)' : 'none' }}>
                      🗺 Panorama
                    </button>
                    <button onClick={() => setView('detalhe')}
                      style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit',
                        background: view==='detalhe' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                        color: view==='detalhe' ? '#60A5FA' : '#475569', outline: view==='detalhe' ? '1px solid rgba(96,165,250,0.3)' : 'none' }}>
                      📋 Detalhe
                    </button>
                  </div>
                  <button onClick={() => deleteMacro(macro.id)}
                    style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'6px 12px', color:'#F87171', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    🗑
                  </button>
                </div>

                {/* ── VISÃO PANORAMA ── */}
                {view === 'macro' && (
                  <>
                    <MacroOverview macro={macro} mesos={mesos} semanaAtual={sem}
                      onMesoClick={(m) => { setExpandedMesos(p=>({...p,[m.id]:true})); setView('detalhe') }} />
                    {/* Legenda */}
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
                      {Object.entries(FASES).map(([k,v]) => (
                        <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:10, height:10, borderRadius:3, background:v.cor }} />
                          <span style={{ fontSize:11, color:'#334155' }}>{v.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── VISÃO DETALHE: Mesos expansíveis ── */}
                {view === 'detalhe' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {mesos.map(m => {
                      const fc   = FASES[m.fase] || FASES.adaptacao
                      const open = expandedMesos[m.id]
                      const done = sem > m.semana_fim
                      const curr = sem >= m.semana_inicio && sem <= m.semana_fim
                      const plans = plansByMeso[m.id] || []

                      return (
                        <div key={m.id} style={{ border:`1.5px solid ${curr ? fc.cor : fc.border}`, borderRadius:14, overflow:'hidden', opacity: done ? 0.85 : 1 }}>
                          {/* Header do meso — clicável */}
                          <div onClick={() => toggleMeso(m.id)}
                            style={{ padding:'12px 16px', background:fc.bg, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                            <span style={{ fontSize:14, color:fc.cor }}>{ open ? '▼' : '▶' }</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:14, fontWeight:800, color:fc.cor }}>{m.nome}</div>
                              <div style={{ fontSize:11, color:fc.cor, opacity:0.8 }}>
                                {fc.label} · Sem {m.semana_inicio}–{m.semana_fim} · {m.semana_fim-m.semana_inicio+1} semanas
                              </div>
                            </div>
                            {done && <span style={{ fontSize:10, background:'rgba(52,211,153,0.15)', color:'#34D399', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>✓ Concluído</span>}
                            {curr && <span style={{ fontSize:10, background:fc.bg, color:fc.cor, padding:'2px 8px', borderRadius:20, fontWeight:700, border:`1px solid ${fc.border}` }}>● Em curso — Sem {sem}</span>}
                            <button onClick={e=>{e.stopPropagation();setEditMeso(m)}}
                              style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, padding:'4px 8px', color:fc.cor, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                              ✏️
                            </button>
                            <button onClick={e=>{e.stopPropagation();deleteMeso(m.id)}}
                              style={{ background:'rgba(248,113,113,0.1)', border:'none', borderRadius:6, padding:'4px 8px', color:'#F87171', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                              🗑
                            </button>
                          </div>

                          {/* Conteúdo expandido */}
                          {open && (
                            <div style={{ padding:'14px 16px', background:'rgba(0,0,0,0.2)' }}>
                              {/* Parâmetros da fase */}
                              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                                {[
                                  { label:'Séries',     val: m.ref_sets_min ? `${m.ref_sets_min}–${m.ref_sets_max}` : '—' },
                                  { label:'Repetições', val: m.ref_reps_min ? `${m.ref_reps_min}–${m.ref_reps_max}` : '—' },
                                  { label:'Intensidade',val: m.ref_intensidade || '—' },
                                  { label:'Descanso',   val: m.ref_descanso   || '—' },
                                ].map(({ label, val }) => (
                                  <div key={label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', textAlign:'center', border:`1px solid ${fc.border}` }}>
                                    <div style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>{label}</div>
                                    <div style={{ fontSize:13, fontWeight:700, color:fc.cor }}>{val}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Planos vinculados */}
                              <div style={{ fontSize:11, color:'#334155', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>
                                Planos de Treino
                              </div>
                              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                {plans.length === 0 && (
                                  <div style={{ fontSize:12, color:'#1E293B', padding:'12px', textAlign:'center', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px dashed rgba(255,255,255,0.08)' }}>
                                    Nenhum plano vinculado ainda
                                  </div>
                                )}
                                {plans.map(p => (
                                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                                    <div style={{ flex:1 }}>
                                      <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{p.title}</div>
                                      <div style={{ fontSize:10, color:'#334155', marginTop:2 }}>
                                        {p.status === 'active' ? '● Ativo' : p.status === 'draft' ? '○ Rascunho' : '◎ Arquivado'}
                                      </div>
                                    </div>
                                    <button onClick={() => navigate('workout-editor', { studentId, planId: p.id })}
                                      style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', background:`${fc.cor}18`, color:fc.cor, fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
                                      Editar →
                                    </button>
                                  </div>
                                ))}
                                <button onClick={() => createPlanInMeso(m.id, macro.id)}
                                  style={{ padding:'9px', borderRadius:10, border:`1px dashed ${fc.border}`, background:'transparent', color:fc.cor, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                  + Criar Plano neste Mesociclo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Adicionar meso */}
                    <button onClick={() => addMeso(macro.id, mesos)}
                      style={{ padding:'12px', borderRadius:12, border:'1px dashed rgba(255,255,255,0.12)', background:'transparent', color:'#334155', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      + Adicionar Mesociclo
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modais */}
      {showModal && student && (
        <ModalMacro student={student} teacherId={teacherId} onSave={load} onClose={() => setShowModal(false)} />
      )}
      {editMeso && (
        <ModalMeso meso={editMeso} onSave={load} onClose={() => setEditMeso(null)} />
      )}
    </div>
  )
}
