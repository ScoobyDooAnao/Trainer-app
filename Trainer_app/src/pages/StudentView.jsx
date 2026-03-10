import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}

const today = () => new Date().toISOString().split('T')[0]

// Gera array de sets baseado no campo sets do exercício (ex: "3" → [{set:1},{set:2},{set:3}])
const parseSets = (setsField) => {
  const n = parseInt(setsField) || 3
  return Array.from({ length: n }, (_, i) => ({ set: i + 1, weight: '', reps: '' }))
}

// Toast simples
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#34D399', color: '#052e16', borderRadius: 50, padding: '10px 22px',
      fontWeight: 800, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(52,211,153,0.4)',
    }}>{msg}</div>
  )
}

// ── Componente de log de carga por exercício ─────────────────────────────────
function ExerciseLogRow({ ex, studentId, dayColor }) {
  const [open, setOpen]         = useState(false)
  const [sets, setSets]         = useState(parseSets(ex.sets))
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [lastLog, setLastLog]   = useState(null)
  const [toast, setToast]       = useState(null)
  const typeColor = TYPE_COLORS[ex.type] || '#64748B'

  // Carrega último log ao abrir
  useEffect(() => {
    if (!open || lastLog !== null) return
    const load = async () => {
      const { data } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('student_id', studentId)
        .eq('exercise_id', ex.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()
      if (data) setLastLog(data)
      else setLastLog(false)
    }
    load()
  }, [open])

  const updateSet = (idx, field, val) => {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const handleSave = async () => {
    const filled = sets.filter(s => s.weight !== '' || s.reps !== '')
    if (filled.length === 0) return
    setSaving(true)
    const { error } = await supabase.from('exercise_logs').insert({
      student_id: studentId,
      exercise_id: ex.id,
      date: today(),
      sets: sets.map(s => ({ set: s.set, weight: s.weight || null, reps: s.reps || null })),
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setToast('✅ Carga salva!')
      setOpen(false)
      // Reseta last log para recarregar na próxima abertura
      setLastLog(null)
    }
  }

  return (
    <>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* Linha principal do exercício */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: open ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, alignItems: 'start' }}>

          {/* Coluna exercício */}
          <div>
            {ex.type && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                  {ex.type}
                </span>
              </div>
            )}
            <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0', marginBottom: 3 }}>{ex.name}</div>
            {ex.tip && <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>💡 {ex.tip}</div>}

            {/* Botão registrar carga */}
            <button
              onClick={() => { setOpen(o => !o); setSaved(false) }}
              style={{
                marginTop: 4,
                background: saved ? 'rgba(52,211,153,0.15)' : open ? `${dayColor}20` : 'rgba(255,255,255,0.05)',
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

        {/* Painel de log inline */}
        {open && (
          <div style={{ marginTop: 14, background: '#080B12', borderRadius: 12, border: `1px solid ${dayColor}25`, padding: 16 }}>

            {/* Último registro */}
            {lastLog && (
              <div style={{ marginBottom: 12, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: '#34D399', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  📅 Último registro — {new Date(lastLog.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lastLog.sets.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, background: 'rgba(52,211,153,0.1)', borderRadius: 6, padding: '3px 8px', color: '#6EE7B7' }}>
                      S{s.set}: {s.weight ? `${s.weight}kg` : '—'} × {s.reps || '—'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lastLog === false && (
              <div style={{ fontSize: 11, color: '#334155', marginBottom: 10 }}>Nenhum registro anterior para este exercício.</div>
            )}

            {/* Header colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>Série</div>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>Carga (kg)</div>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>Reps feitas</div>
            </div>

            {/* Inputs por série */}
            {sets.map((s, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: dayColor, fontWeight: 800, textAlign: 'center' }}>S{s.set}</div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={lastLog && lastLog.sets[idx]?.weight ? `Ant: ${lastLog.sets[idx].weight}` : 'kg'}
                  value={s.weight}
                  onChange={e => updateSet(idx, 'weight', e.target.value)}
                  style={{
                    background: '#161B27', border: `1px solid ${s.weight ? dayColor + '60' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14,
                    outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700,
                  }}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={lastLog && lastLog.sets[idx]?.reps ? `Ant: ${lastLog.sets[idx].reps}` : 'reps'}
                  value={s.reps}
                  onChange={e => updateSet(idx, 'reps', e.target.value)}
                  style={{
                    background: '#161B27', border: `1px solid ${s.reps ? dayColor + '60' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 14,
                    outline: 'none', width: '100%', textAlign: 'center', fontWeight: 700,
                  }}
                />
              </div>
            ))}

            {/* Botão salvar */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', marginTop: 8,
                background: saving ? '#1E293B' : `linear-gradient(135deg, ${dayColor}, ${dayColor}aa)`,
                border: 'none', borderRadius: 10, padding: '12px',
                color: '#fff', fontWeight: 800, fontSize: 14, cursor: saving ? 'default' : 'pointer',
              }}>
              {saving ? 'Salvando...' : '💾 Salvar registro de hoje'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── STUDENT VIEW PRINCIPAL ───────────────────────────────────────────────────

// ── Dados de prescrição por objetivo (mesma lógica do Dashboard) ──────────
const SV_CARDIO_TYPES = [
  { id: 'corrida',     label: 'Corrida',     icon: '🏃', color: '#EF4444', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'bike',        label: 'Bike',        icon: '🚴', color: '#F59E0B', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'esteira',     label: 'Esteira',     icon: '🏃', color: '#8B5CF6', hasDistance: true,  hasHR: true,  isHIIT: false },
  { id: 'eliptico',    label: 'Elíptico',    icon: '⭕', color: '#06B6D4', hasDistance: false, hasHR: true,  isHIIT: false },
  { id: 'natacao',     label: 'Natação',     icon: '🏊', color: '#3B82F6', hasDistance: true,  hasHR: false, isHIIT: false },
  { id: 'pular_corda', label: 'Pular Corda', icon: '🪢', color: '#10B981', hasDistance: false, hasHR: true,  isHIIT: false },
  { id: 'hiit',        label: 'HIIT',        icon: '⚡', color: '#F5C842', hasDistance: false, hasHR: true,  isHIIT: true  },
]

const SV_PSE_LABELS = ['','Muito leve','Leve','Moderado leve','Moderado','Moderado intenso','Intenso','Muito intenso','Difícil','Muito difícil','Máximo']

const SV_PRESCRICAO = {
  'Emagrecimento': {
    tipo: ['corrida','esteira','eliptico'], sessoes: '3–4x/semana', duracao: '30–50 min',
    pse: { min: 4, max: 6, label: 'PSE 4–6 — Moderado' },
    pace: 'Ritmo confortável — você consegue conversar durante o esforço',
    volume: '120–200 min/semana',
    obs: 'Esforço contínuo e controlado. Evite intensidade alta demais — aumenta o apetite e dificulta a recuperação.',
  },
  'Ganho de Massa': {
    tipo: ['esteira','bike','eliptico'], sessoes: '2x/semana', duracao: '20–30 min',
    pse: { min: 3, max: 5, label: 'PSE 3–5 — Leve a moderado' },
    pace: 'Recuperação ativa — ritmo bem leve, sem gerar fadiga',
    volume: '40–60 min/semana',
    obs: 'Cardio leve preserva sua recuperação muscular. Volume alto prejudica o ganho de massa.',
  },
  'Condicionamento': {
    tipo: ['corrida','hiit','bike'], sessoes: '3–4x/semana', duracao: '30–45 min + 1 HIIT',
    pse: { min: 5, max: 8, label: 'PSE 5–8 — Moderado a intenso' },
    pace: 'Varie: 2–3 sessões em ritmo estável + 1 HIIT com esforços curtos e máximos',
    volume: '150–200 min/semana',
    obs: 'Não faça todo treino no mesmo ritmo. Alternar intensidades é chave para o condicionamento.',
  },
  'Força e Performance': {
    tipo: ['bike','eliptico','natacao'], sessoes: '2x/semana', duracao: '20–30 min',
    pse: { min: 3, max: 4, label: 'PSE 3–4 — Leve' },
    pace: 'Low-impact e baixa intensidade — foco em recuperação, não em performance aeróbia',
    volume: '40–60 min/semana',
    obs: 'Cardio intenso compete com seus ganhos de força. Mantenha o volume mínimo.',
  },
}

function svFmtDate(d) {
  if (!d) return ''
  const [,m,day] = String(d).slice(0,10).split('-')
  return `${day}/${m}`
}

function svFormatPace(distKm, durMin) {
  if (!distKm || !durMin || distKm === 0) return null
  const pm = durMin / distKm
  const m  = Math.floor(pm)
  const s  = Math.round((pm - m) * 60).toString().padStart(2,'0')
  return `${m}:${s}/km`
}

// Modal de registro — tema escuro igual ao resto da StudentView
function SvCardioModal({ studentId, onSave, onClose }) {
  const today = new Date().toISOString().slice(0,10)
  const [date,     setDate]     = useState(today)
  const [type,     setType]     = useState('corrida')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [avgHr,    setAvgHr]    = useState('')
  const [maxHr,    setMaxHr]    = useState('')
  const [workSec,  setWorkSec]  = useState('30')
  const [restSec,  setRestSec]  = useState('15')
  const [rounds,   setRounds]   = useState('8')
  const [pse,      setPse]      = useState(5)
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  const typeInfo = SV_CARDIO_TYPES.find(t => t.id === type)

  const inp = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: '#94A3B8', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5, display: 'block', marginTop: 14 }

  const save = async () => {
    setSaving(true)
    await supabase.from('cardio_sessions').insert([{
      student_id:       studentId,
      date,
      type,
      duration_minutes: +duration || null,
      distance_km:      typeInfo?.hasDistance ? (+distance || null) : null,
      avg_hr:           typeInfo?.hasHR       ? (+avgHr    || null) : null,
      max_hr:           typeInfo?.hasHR       ? (+maxHr    || null) : null,
      work_seconds:     typeInfo?.isHIIT      ? (+workSec  || null) : null,
      rest_seconds:     typeInfo?.isHIIT      ? (+restSec  || null) : null,
      rounds:           typeInfo?.isHIIT      ? (+rounds   || null) : null,
      pse:              +pse,
      notes,
    }])
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:28, width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#E2E8F0', marginBottom:18 }}>❤️ Registrar Sessão de Cárdio</div>

        <label style={lbl}>Data</label>
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />

        <label style={lbl}>Modalidade</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
          {SV_CARDIO_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{ padding:'7px 13px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background: type === t.id ? t.color : 'rgba(255,255,255,0.08)', color: type === t.id ? '#FFF' : '#94A3B8', transition:'all 0.15s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4 }}>
          <div>
            <label style={lbl}>Duração (min)</label>
            <input type="number" placeholder="Ex: 30" style={inp} value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          {typeInfo?.hasDistance && (
            <div>
              <label style={lbl}>Distância (km)</label>
              <input type="number" step="0.1" placeholder="Ex: 5.2" style={inp} value={distance} onChange={e => setDistance(e.target.value)} />
            </div>
          )}
          {typeInfo?.hasHR && (<>
            <div>
              <label style={lbl}>FC Média (bpm)</label>
              <input type="number" placeholder="Ex: 145" style={inp} value={avgHr} onChange={e => setAvgHr(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>FC Máx (bpm)</label>
              <input type="number" placeholder="Ex: 172" style={inp} value={maxHr} onChange={e => setMaxHr(e.target.value)} />
            </div>
          </>)}
          {typeInfo?.isHIIT && (<>
            <div><label style={lbl}>Esforço (seg)</label><input type="number" placeholder="30" style={inp} value={workSec} onChange={e => setWorkSec(e.target.value)} /></div>
            <div><label style={lbl}>Descanso (seg)</label><input type="number" placeholder="15" style={inp} value={restSec} onChange={e => setRestSec(e.target.value)} /></div>
            <div><label style={lbl}>Rodadas</label><input type="number" placeholder="8" style={inp} value={rounds} onChange={e => setRounds(e.target.value)} /></div>
          </>)}
        </div>

        <label style={{ ...lbl, marginTop:18 }}>PSE — Esforço Percebido: <span style={{ color:'#F87171', fontWeight:800 }}>{pse} — {SV_PSE_LABELS[pse]}</span></label>
        <input type="range" min="1" max="10" value={pse} onChange={e => setPse(+e.target.value)} style={{ width:'100%', accentColor:'#34D399', marginBottom:4 }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#475569', fontWeight:600 }}>
          <span>1 Leve</span><span>5 Moderado</span><span>10 Máximo</span>
        </div>

        <label style={lbl}>Observações</label>
        <textarea style={{ ...inp, minHeight:55, resize:'vertical' }} placeholder="Como foi o treino?" value={notes} onChange={e => setNotes(e.target.value)} />

        <button onClick={save} disabled={saving} style={{ width:'100%', background:'linear-gradient(135deg,#34D399,#059669)', border:'none', borderRadius:10, padding:13, color:'#FFF', fontWeight:800, fontSize:14, cursor:'pointer', marginTop:20 }}>
          {saving ? 'Salvando...' : 'Salvar Sessão'}
        </button>
        <button onClick={onClose} style={{ width:'100%', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:12, color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer', marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

function StudentCardioTab({ studentId, student, sessions, onNewSession }) {
  const [showModal,    setShowModal]    = useState(false)
  const [filterType,   setFilterType]   = useState('todos')

  const presc    = SV_PRESCRICAO[student?.goal]
  const filtered = filterType === 'todos' ? sessions : sessions.filter(s => s.type === filterType)

  const totalMin = sessions.reduce((a,s) => a + (s.duration_minutes||0), 0)
  const totalKm  = sessions.reduce((a,s) => a + (s.distance_km||0), 0)
  const avgPse   = sessions.length ? (sessions.reduce((a,s) => a+(s.pse||0),0)/sessions.length).toFixed(1) : '—'

  const card  = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 18px', marginBottom:14 }
  const lbl11 = { fontSize:11, color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }

  return (
    <div>
      {showModal && <SvCardioModal studentId={studentId} onSave={() => { onNewSession(); setShowModal(false) }} onClose={() => setShowModal(false)} />}

      {/* ── PRESCRIÇÃO ── */}
      {presc && (
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:800, color:'#E2E8F0', marginBottom:14 }}>🎯 Prescrição do seu Professor</div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[
              { icon:'📅', label:'Frequência', val:presc.sessoes  },
              { icon:'⏱',  label:'Duração',    val:presc.duracao  },
              { icon:'📊', label:'Volume/sem',  val:presc.volume   },
            ].map(({ icon, label, val }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:16, marginBottom:3 }}>{icon}</div>
                <div style={{ ...lbl11, marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:11, fontWeight:800, color:'#E2E8F0', lineHeight:1.3 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* PSE alvo */}
          <div style={{ marginBottom:12 }}>
            <div style={{ ...lbl11, marginBottom:8 }}>🎯 Esforço alvo — {presc.pse.label}</div>
            <div style={{ height:8, borderRadius:8, background:'linear-gradient(90deg,#60A5FA,#34D399,#F5C842,#F59E0B,#EF4444)', position:'relative', marginBottom:6 }}>
              <div style={{ position:'absolute', left:`${(presc.pse.min-1)/9*100}%`, width:`${(presc.pse.max-presc.pse.min)/9*100}%`, height:'100%', background:'rgba(255,255,255,0.25)', borderRadius:8, border:'2px solid #FFF' }} />
            </div>
            <div style={{ fontSize:12, color:'#94A3B8' }}>🏃 {presc.pace}</div>
          </div>

          {/* Modalidades */}
          <div style={{ marginBottom:12 }}>
            <div style={{ ...lbl11, marginBottom:8 }}>Modalidades recomendadas</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {presc.tipo.map(t => {
                const info = SV_CARDIO_TYPES.find(x => x.id === t)
                return <span key={t} style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20, background:`${info?.color}20`, color:info?.color, border:`1px solid ${info?.color}40` }}>{info?.icon} {info?.label}</span>
              })}
            </div>
          </div>

          {/* Dica */}
          <div style={{ background:'rgba(52,211,153,0.08)', borderRadius:8, padding:'10px 14px', borderLeft:'3px solid #34D399' }}>
            <span style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6 }}>💡 {presc.obs}</span>
          </div>
        </div>
      )}

      {/* ── RESUMO ── */}
      {sessions.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          {[
            { label:'Sessões',     val:sessions.length,         unit:'',    color:'#34D399' },
            { label:'Total Tempo', val:totalMin>=60 ? `${Math.floor(totalMin/60)}h${String(totalMin%60).padStart(2,'0')}` : totalMin, unit:totalMin<60?'min':'', color:'#8B5CF6' },
            { label:'Total Km',    val:totalKm.toFixed(1),      unit:'km',  color:'#3B82F6' },
          ].map(({ label, val, unit, color }) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px', textAlign:'center' }}>
              <div style={{ ...lbl11, marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:20, fontWeight:800, color }}>{val}<span style={{ fontSize:10, color:'#475569' }}>{unit}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#E2E8F0' }}>📋 Minhas Sessões</div>
          <button onClick={() => setShowModal(true)} style={{ padding:'8px 16px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#34D399,#059669)', color:'#FFF', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            + Registrar
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
          <button onClick={() => setFilterType('todos')} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', background: filterType==='todos' ? '#34D399' : 'rgba(255,255,255,0.07)', color: filterType==='todos' ? '#FFF' : '#94A3B8' }}>
            Todos
          </button>
          {SV_CARDIO_TYPES.filter(t => sessions.some(s => s.type === t.id)).map(t => (
            <button key={t.id} onClick={() => setFilterType(t.id)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', background: filterType===t.id ? t.color : 'rgba(255,255,255,0.07)', color: filterType===t.id ? '#FFF' : '#94A3B8', transition:'all 0.15s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'#334155' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>❤️</div>
            <div style={{ fontSize:13 }}>Nenhuma sessão registrada ainda</div>
            <div style={{ fontSize:12, marginTop:4, color:'#1E293B' }}>Clique em "+ Registrar" para começar</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(s => {
              const info = SV_CARDIO_TYPES.find(t => t.id === s.type)
              const pace = svFormatPace(s.distance_km, s.duration_minutes)
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:`1px solid ${info?.color}25` }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${info?.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{info?.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:800, color:'#E2E8F0' }}>{info?.label}</span>
                      <span style={{ fontSize:10, color:'#475569' }}>{String(s.date).slice(0,10).split('-').reverse().join('/')}</span>
                      {s.type==='hiit' && s.work_seconds && (
                        <span style={{ fontSize:10, fontWeight:700, color:'#F5C842', background:'rgba(245,200,66,0.1)', padding:'1px 7px', borderRadius:20 }}>
                          {s.work_seconds}s/{s.rest_seconds}s × {s.rounds}x
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                      {s.duration_minutes && <span style={{ fontSize:11, color:'#64748B' }}>⏱ {s.duration_minutes}min</span>}
                      {s.distance_km      && <span style={{ fontSize:11, color:'#64748B' }}>📍 {s.distance_km}km</span>}
                      {pace               && <span style={{ fontSize:11, color:'#EF4444', fontWeight:700 }}>🏃 {pace}</span>}
                      {s.avg_hr           && <span style={{ fontSize:11, color:'#64748B' }}>❤️ {s.avg_hr}bpm</span>}
                      {s.pse              && <span style={{ fontSize:11, color:'#64748B' }}>PSE {s.pse}/10</span>}
                    </div>
                    {s.notes && <div style={{ fontSize:11, color:'#475569', marginTop:3, fontStyle:'italic' }}>{s.notes}</div>}
                  </div>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`hsl(${120-(s.pse||5)*12},60%,45%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#FFF', flexShrink:0 }}>
                    {s.pse}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentView({ studentId }) {
  const [student, setStudent]     = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [days, setDays]           = useState([])
  const [activeDay, setActiveDay] = useState(0)
  const [progress, setProgress]   = useState([])
  const [tab, setTab]             = useState('treino')
  const [loading, setLoading]     = useState(true)
  const [cardioSessions, setCardioSessions] = useState([])
  const [cardioModal, setCardioModal]       = useState(false)
  const [cardioFilter, setCardioFilter]     = useState('todos')

  useEffect(() => {
    const load = async () => {
      const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single()
      if (st) setStudent(st)

      const { data: cardio } = await supabase
        .from('cardio_sessions').select('*')
        .eq('student_id', studentId).order('date', { ascending: false })
      if (cardio) setCardioSessions(cardio)

      const { data: plans } = await supabase
        .from('workout_plans').select('*')
        .eq('student_id', studentId).eq('status', 'active')
        .order('updated_at', { ascending: false }).limit(1)

      if (plans && plans[0]) {
        setActivePlan(plans[0])
        const { data: daysData } = await supabase
          .from('workout_days').select('*, exercises(*)')
          .eq('plan_id', plans[0].id).order('order_index')
        if (daysData) setDays(daysData.map(d => ({ ...d, exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
      }

      const { data: pr } = await supabase
        .from('progress_entries').select('*')
        .eq('student_id', studentId).order('date', { ascending: false }).limit(10)
      if (pr) setProgress(pr)
      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: 18 }}>
      Carregando seu treino...
    </div>
  )

  if (!student) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
      Aluno não encontrado.
    </div>
  )

  const day = days[activeDay]
  const color = DAY_COLORS[activeDay % DAY_COLORS.length]

  return (
    <div style={{ minHeight: '100vh', background: '#080B12', padding: '24px 16px', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#E2E8F0' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(52,211,153,0.15)' }}>
          <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Seu Plano de Treino</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Olá, {student.name.split(' ')[0]}! 💪</div>
          <div style={{ fontSize: 13, color: '#475569' }}>{student.goal} · {student.level}</div>
          {activePlan && (
            <div style={{ marginTop: 12, background: 'rgba(52,211,153,0.08)', borderRadius: 8, padding: '8px 14px', display: 'inline-block' }}>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>📋 {activePlan.title}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['treino', '🏋️ Treino'], ['evolucao', '📈 Evolução'], ['cardio', '❤️ Cárdio']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: tab === id ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)',
              color: tab === id ? '#fff' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* ── ABA TREINO ── */}
        {tab === 'treino' && (
          <>
            {!activePlan || days.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
                <div>Nenhum treino ativo. Aguarde seu professor configurar seu plano.</div>
              </div>
            ) : (
              <>
                {/* Day selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {days.map((d, i) => {
                    const c = DAY_COLORS[i % DAY_COLORS.length]
                    return (
                      <button key={d.id} onClick={() => setActiveDay(i)} style={{
                        flex: 1, minWidth: 70, padding: '12px 8px', borderRadius: 12,
                        border: activeDay === i ? `2px solid ${c}` : '1px solid rgba(255,255,255,0.08)',
                        background: activeDay === i ? `${c}18` : 'rgba(255,255,255,0.03)',
                        color: activeDay === i ? c : '#475569', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      }}>
                        {d.name}
                        {d.day_of_week && <div style={{ fontSize: 9, marginTop: 2, fontWeight: 500 }}>{d.day_of_week}</div>}
                      </button>
                    )
                  })}
                </div>

                {day && (
                  <div style={{ background: '#0D1117', borderRadius: 16, overflow: 'hidden', border: `1px solid ${color}30` }}>
                    {/* Day header */}
                    <div style={{ background: `${color}12`, padding: '16px 20px', borderBottom: `1px solid ${color}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                        <span style={{ fontWeight: 700, color, fontSize: 16 }}>{day.name}</span>
                        {day.focus && <span style={{ fontSize: 13, color: '#475569' }}>— {day.focus}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>
                        ⚖️ Toque em <strong style={{ color: '#64748B' }}>Registrar carga</strong> em cada exercício para anotar o peso usado
                      </div>
                    </div>

                    {/* Coluna headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {['Exercício', 'Séries', 'Reps', 'Descanso'].map(h => (
                        <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                      ))}
                    </div>

                    {/* Exercícios com log de carga */}
                    {day.exercises.length === 0 ? (
                      <div style={{ padding: 30, textAlign: 'center', color: '#334155', fontSize: 13 }}>Nenhum exercício neste dia ainda.</div>
                    ) : (
                      day.exercises.map(ex => (
                        <ExerciseLogRow
                          key={ex.id}
                          ex={ex}
                          studentId={studentId}
                          dayColor={color}
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ABA EVOLUÇÃO ── */}
        {tab === 'evolucao' && (
          <div>
            {progress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div>Nenhum registro de evolução ainda.</div>
              </div>
            ) : (
              progress.map((p, i) => (
                <div key={p.id} style={{ background: '#0D1117', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
                    {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: '#34D39920', color: '#34D399', padding: '2px 8px', borderRadius: 20 }}>Mais recente</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {p.weight && <div><span style={{ fontSize: 11, color: '#475569' }}>Peso </span><span style={{ fontWeight: 700 }}>{p.weight} kg</span></div>}
                    {p.measurements?.waist && <div><span style={{ fontSize: 11, color: '#475569' }}>Cintura </span><span style={{ fontWeight: 700 }}>{p.measurements.waist} cm</span></div>}
                    {p.measurements?.chest && <div><span style={{ fontSize: 11, color: '#475569' }}>Peito </span><span style={{ fontWeight: 700 }}>{p.measurements.chest} cm</span></div>}
                    {p.measurements?.hip && <div><span style={{ fontSize: 11, color: '#475569' }}>Quadril </span><span style={{ fontWeight: 700 }}>{p.measurements.hip} cm</span></div>}
                    {p.measurements?.thigh && <div><span style={{ fontSize: 11, color: '#475569' }}>Coxa </span><span style={{ fontWeight: 700 }}>{p.measurements.thigh} cm</span></div>}
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>📝 {p.notes}</div>}
                </div>
              ))
            )}
          </div>
        )}


        {/* ── ABA CÁRDIO ── */}
        {tab === 'cardio' && (
          <StudentCardioTab
            studentId={studentId}
            student={student}
            sessions={cardioSessions}
            onNewSession={() => {
              supabase.from('cardio_sessions').select('*')
                .eq('student_id', studentId).order('date', { ascending: false })
                .then(({ data }) => { if (data) setCardioSessions(data) })
            }}
          />
        )}

                <div style={{ marginTop: 30, textAlign: 'center', fontSize: 11, color: '#1E293B' }}>Trainer App · Plano gerenciado pelo seu professor</div>
      </div>
    </div>
  )
}
