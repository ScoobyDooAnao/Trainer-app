import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'
import { today, DAY_COLORS } from '../../lib/studentViewShared'
import { CosmicCSS, StarField } from '../CosmicBackground'

// ── Constantes ────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}
const parseSets = (setsField) => {
  const n = parseInt(setsField) || 3
  return Array.from({ length: n }, (_, i) => ({ set: i + 1, weight: '', reps: '' }))
}

// ── Sessão de treino — timer, séries por exercício, execução completa ──────────
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
    novo[idx].checked = !!(novo[idx].weight && novo[idx].reps)
    onChangeSets(novo)
  }

  return (
    <div style={{ marginBottom: 10, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
          {ex.type && <span style={{ fontSize:8, padding:'1px 6px', borderRadius:20, fontWeight:700, background:`${typeColor}22`, color:typeColor, flexShrink:0 }}>{ex.type}</span>}
          <span style={{ fontWeight:700, fontSize:13, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</span>
        </div>
        {ex.rest && (
          <button onClick={() => { setActiveTimer(true); setRestKey(k=>k+1) }}
            style={{ flexShrink:0, padding:'5px 10px', borderRadius:9, border:'1px solid rgba(59,130,246,0.4)', background:'rgba(59,130,246,0.1)', color:'#60A5FA', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            ⏱ {ex.rest}
          </button>
        )}
      </div>
      {activeTimer && <div style={{ marginBottom:8 }}><RestTimer key={restKey} seconds={parseRestSeconds(ex.rest)} dayColor={dayColor} onDone={() => {}} /></div>}

      {sets.map((s, idx) => {
        const ant = lastLog?.sets?.[idx]
        return (
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'20px 40px 1fr 1fr', gap:5, marginBottom:4, alignItems:'center' }}>
            <div style={{ fontSize:10, fontWeight:800, color: s.checked ? '#34D399' : dayColor, textAlign:'center' }}>{s.set}</div>
            <div style={{ fontSize:9, color:'#3F4A5C', textAlign:'center' }}>{ant ? `${ant.weight||'—'}×${ant.reps||'—'}` : '—'}</div>
            <input type="number" inputMode="decimal" placeholder="kg" value={s.weight}
              onChange={e => updateSet(idx,'weight',e.target.value)}
              style={{ background: s.checked ? 'rgba(52,211,153,0.07)' : '#12161F', border:`1px solid ${s.checked?'rgba(52,211,153,0.35)':'rgba(255,255,255,0.06)'}`, borderRadius:6, padding:'5px 4px', color:'#E2E8F0', fontSize:12, textAlign:'center', outline:'none', width:'100%', fontWeight:700, boxSizing:'border-box' }} />
            <input type="number" inputMode="numeric" placeholder="reps" value={s.reps}
              onChange={e => updateSet(idx,'reps',e.target.value)}
              style={{ background: s.checked ? 'rgba(52,211,153,0.07)' : '#12161F', border:`1px solid ${s.checked?'rgba(52,211,153,0.35)':'rgba(255,255,255,0.06)'}`, borderRadius:6, padding:'5px 4px', color:'#E2E8F0', fontSize:12, textAlign:'center', outline:'none', width:'100%', fontWeight:700, boxSizing:'border-box' }} />
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
            ) : slot.diff > 0 ? (
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
                <button onClick={() => setMakeupSession(workout)}
                  style={{ width:'100%', marginTop:14, padding:'13px', borderRadius:12, border:`1px solid ${color}50`, background:`${color}15`, color, fontWeight:800, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  ⏩ Adiantar treino?
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

export { WorkoutCarousel }
