import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { GOAL, MEDIDAS_CONFIG, GLASS_CARD, YELLOW, fmtDate } from '../../lib/dashboardShared'
import { CustomTooltip, EmptyChart } from '../shared/DashboardUI'

// Modal para registrar nova entrada
export function EvolucaoModal({ studentId, mode, onSave, onClose, exercises }) {
  const today = new Date().toISOString().slice(0,10)
  const [date, setDate]       = useState(today)
  const [saving, setSaving]   = useState(false)

  // Peso
  const [weight, setWeight]   = useState('')
  const [notes, setNotes]     = useState('')

  // Medidas
  const [medidas, setMedidas] = useState({})

  // Força
  const [exId, setExId]       = useState(exercises?.[0]?.id || '')
  const [sets, setSets]       = useState([{ weight: '', reps: '' }])

  const inp  = { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 8, padding: '9px 12px', color: '#0D1B2A', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl  = { fontSize: 11, color: '#0C4A6E', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5, display: 'block', marginTop: 14 }

  const save = async () => {
    if (!studentId) return
    setSaving(true)
    if (mode === 'peso') {
      await supabase.from('progress_entries').insert([{ student_id: studentId, date, weight: +weight || null, notes }])
    } else if (mode === 'medidas') {
      const m = {}
      MEDIDAS_CONFIG.forEach(({ key }) => { if (medidas[key]) m[key] = +medidas[key] })
      await supabase.from('progress_entries').insert([{ student_id: studentId, date, measurements: m }])
    } else if (mode === 'forca') {
      const validSets = sets.filter(s => s.weight && s.reps)
      if (validSets.length > 0 && exId) {
        await supabase.from('exercise_logs').insert([{ student_id: studentId, exercise_id: exId, date, sets: validSets.map(s => ({ weight: +s.weight, reps: +s.reps })) }])
      }
    }
    setSaving(false)
    onSave()
    onClose()
  }

  const titles = { peso: 'Registrar Peso', medidas: 'Registrar Medidas', forca: 'Registrar Carga' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(12,50,81,0.2)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0C3251', marginBottom: 18 }}>{titles[mode]}</div>

        <label style={lbl}>Data</label>
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />

        {mode === 'peso' && (
          <>
            <label style={lbl}>Peso (kg)</label>
            <input type="number" step="0.1" placeholder="Ex: 80.5" style={inp} value={weight} onChange={e => setWeight(e.target.value)} />
            <label style={lbl}>Observações</label>
            <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Opcional..." value={notes} onChange={e => setNotes(e.target.value)} />
          </>
        )}

        {mode === 'medidas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            {MEDIDAS_CONFIG.map(({ key, label }) => (
              <div key={key}>
                <label style={{ ...lbl, marginTop: 6 }}>{label} (cm)</label>
                <input type="number" step="0.1" placeholder="—" style={inp} value={medidas[key] || ''} onChange={e => setMedidas(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {mode === 'forca' && (
          <>
            <label style={lbl}>Exercício</label>
            <select style={inp} value={exId} onChange={e => setExId(e.target.value)}>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <label style={{ ...lbl, marginTop: 14 }}>Séries</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sets.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, minWidth: 20 }}>S{i+1}</span>
                  <input type="number" placeholder="kg" style={{ ...inp, flex: 1 }} value={s.weight} onChange={e => setSets(prev => prev.map((x,j) => j===i ? { ...x, weight: e.target.value } : x))} />
                  <input type="number" placeholder="reps" style={{ ...inp, flex: 1 }} value={s.reps} onChange={e => setSets(prev => prev.map((x,j) => j===i ? { ...x, reps: e.target.value } : x))} />
                  {sets.length > 1 && <button onClick={() => setSets(p => p.filter((_,j) => j!==i))} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}>×</button>}
                </div>
              ))}
              <button onClick={() => setSets(p => [...p, { weight: '', reps: '' }])} style={{ background: 'rgba(12,74,110,0.08)', border: '1px dashed rgba(12,74,110,0.3)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#0C4A6E', fontSize: 12, fontWeight: 700 }}>+ Adicionar série</button>
            </div>
          </>
        )}

        <button onClick={save} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: 13, color: '#431C00', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(12,74,110,0.2)', borderRadius: 10, padding: 12, color: '#0C4A6E', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>Cancelar</button>
      </div>
    </div>
  )
}

export function TabEvolucao({ students }) {
  const [selectedId, setSelectedId] = useState(null)
  const [subTab, setSubTab]         = useState('peso')
  const [entries, setEntries]       = useState([])
  const [exLogs, setExLogs]         = useState([])
  const [exercises, setExercises]   = useState([])
  const [selExId, setSelExId]       = useState(null)
  const [modal, setModal]           = useState(null) // 'peso' | 'medidas' | 'forca'
  const [loading, setLoading]       = useState(false)

  const student = students.find(s => s.id === selectedId)

  const fetchData = useCallback(async (sid) => {
    if (!sid) return
    setLoading(true)
    const [progRes, logsRes, exRes] = await Promise.all([
      supabase.from('progress_entries').select('*').eq('student_id', sid).order('date'),
      supabase.from('exercise_logs').select('*, exercises(name)').eq('student_id', sid).order('date'),
      supabase.from('exercises')
        .select('id, name, workout_days!inner(workout_plans!inner(student_id))')
        .eq('workout_days.workout_plans.student_id', sid),
    ])
    setEntries(progRes.data || [])
    setExLogs(logsRes.data || [])
    // Deduplicate exercises by name
    const seen = new Set()
    const exList = []
    ;(exRes.data || []).forEach(e => { if (!seen.has(e.name)) { seen.add(e.name); exList.push(e) } })
    // Also add exercises from logs in case plan changed
    ;(logsRes.data || []).forEach(l => {
      if (l.exercises && !seen.has(l.exercises.name)) {
        seen.add(l.exercises.name)
        exList.push({ id: l.exercise_id, name: l.exercises.name })
      }
    })
    setExercises(exList)
    if (exList.length > 0 && !selExId) setSelExId(exList[0].id)
    setLoading(false)
  }, [selExId])

  useEffect(() => { if (selectedId) fetchData(selectedId) }, [selectedId])

  // ── Dados para gráfico de peso ──
  const pesoData = entries
    .filter(e => e.weight)
    .map(e => ({ date: fmtDate(e.date), Peso: +e.weight, full: e.date }))

  // ── Dados para gráfico de medidas ──
  const medidasData = entries
    .filter(e => e.measurements && Object.keys(e.measurements).length > 0)
    .map(e => {
      const obj = { date: fmtDate(e.date) }
      MEDIDAS_CONFIG.forEach(({ key, label }) => { if (e.measurements[key]) obj[label] = +e.measurements[key] })
      return obj
    })
  const medidasAtivas = MEDIDAS_CONFIG.filter(m => medidasData.some(d => d[m.label] !== undefined))

  // ── Dados para gráfico de força ──
  const forcaData = (() => {
    if (!selExId) return []
    const filtered = exLogs.filter(l => l.exercise_id === selExId)
    // Group by date, get max weight of all sets
    const byDate = {}
    filtered.forEach(l => {
      const d = fmtDate(l.date)
      const maxW = Math.max(...(l.sets || []).map(s => +s.weight || 0))
      if (!byDate[d] || maxW > byDate[d]) byDate[d] = maxW
    })
    return Object.entries(byDate).map(([date, Máx]) => ({ date, Máx }))
  })()

  const selEx = exercises.find(e => e.id === selExId)

  const subTabs = [
    { id: 'peso',    icon: null, label: 'Peso'    },
    { id: 'medidas', icon: null, label: 'Medidas' },
    { id: 'forca',   icon: null, label: 'Força'   },
  ]

  return (
    <div>
      {modal && (
        <EvolucaoModal
          studentId={selectedId}
          mode={modal}
          exercises={exercises}
          onSave={() => fetchData(selectedId)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 4, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>Evolução</h1>
        <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight: 600 }}>Acompanhe o progresso dos seus alunos</p>
      </div>

      {/* Selector de aluno */}
      <div style={{ ...GLASS_CARD, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Selecionar Aluno</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {students.map(s => {
            const sel = s.id === selectedId
            const g = GOAL[s.goal]
            return (
              <button key={s.id} onClick={() => { setSelectedId(s.id); setSubTab('peso') }}
                style={{ padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: sel ? 'none' : '1px solid rgba(12,74,110,0.15)', transition: 'all 0.15s', background: sel ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(255,255,255,0.7)', color: sel ? '#431C00' : '#0C4A6E', boxShadow: sel ? '0 3px 12px rgba(245,200,66,0.4)' : 'none' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
          {students.length === 0 && <span style={{ fontSize: 13, color: '#94A3B8' }}>Nenhum aluno cadastrado</span>}
        </div>
      </div>

      {!selectedId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#0C4A6E', opacity: 0.4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Selecione um aluno para ver a evolução</div>
        </div>
      )}

      {selectedId && (
        <>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {subTabs.map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                style={{ padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: subTab === t.id ? 'linear-gradient(135deg,#0C4A6E,#155E8E)' : 'rgba(255,255,255,0.65)', color: subTab === t.id ? '#FFF' : '#0C4A6E', boxShadow: subTab === t.id ? '0 4px 14px rgba(12,74,110,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', backdropFilter: 'blur(6px)' }}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setModal(subTab)}
              style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', boxShadow: '0 4px 14px rgba(245,200,66,0.4)' }}>
              + Registrar
            </button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#0C4A6E', opacity: 0.5, fontWeight: 600 }}>Carregando...</div>}

          {!loading && (
            <>
              {/* ── PESO ── */}
              {subTab === 'peso' && (
                <div style={GLASS_CARD}>
                  <div className="db-search-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Peso ao longo do tempo</div>
                      {pesoData.length > 0 && (
                        <div style={{ fontSize: 12, color: '#0C4A6E', marginTop: 4 }}>
                          Início: <b>{pesoData[0].Peso}kg</b>
                          {' · '}Atual: <b>{pesoData[pesoData.length-1].Peso}kg</b>
                          {' · '}
                          <span style={{ color: pesoData[pesoData.length-1].Peso < pesoData[0].Peso ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                            {pesoData[pesoData.length-1].Peso < pesoData[0].Peso ? '▼' : '▲'}
                            {Math.abs(pesoData[pesoData.length-1].Peso - pesoData[0].Peso).toFixed(1)}kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {pesoData.length < 2 ? <EmptyChart label="peso" /> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={pesoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="kg" domain={['auto','auto']} />
                        <Tooltip content={<CustomTooltip unit="kg" />} />
                        <Line type="monotone" dataKey="Peso" stroke="#155E8E" strokeWidth={2.5} dot={{ r: 4, fill: '#155E8E', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        {pesoData.length > 0 && (
                          <ReferenceLine y={pesoData[pesoData.length-1].Peso} stroke="#F5C842" strokeDasharray="4 4" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {/* Histórico */}
                  {pesoData.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(12,74,110,0.08)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Histórico</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {[...entries].filter(e => e.weight).reverse().map(e => (
                          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(12,74,110,0.04)', borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{String(e.date).slice(0,10).split('-').reverse().join('/')}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0C3251' }}>{e.weight} kg</span>
                            {e.notes && <span style={{ fontSize: 11, color: '#94A3B8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MEDIDAS ── */}
              {subTab === 'medidas' && (
                <div style={GLASS_CARD}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251', marginBottom: 20 }}>Medidas corporais</div>
                  {medidasData.length < 2 ? <EmptyChart label="medidas" /> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={medidasData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="cm" domain={['auto','auto']} />
                        <Tooltip content={<CustomTooltip unit="cm" />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {medidasAtivas.map(m => (
                          <Line key={m.key} type="monotone" dataKey={m.label} stroke={m.color} strokeWidth={2} dot={{ r: 3, fill: m.color, stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {/* Último registro */}
                  {medidasData.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(12,74,110,0.08)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Último Registro</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {MEDIDAS_CONFIG.map(({ key, label, color }) => {
                          const last = [...entries].filter(e => e.measurements?.[key]).pop()
                          if (!last) return null
                          const prev = [...entries].filter(e => e.measurements?.[key] && e.id !== last.id).pop()
                          const diff = prev ? (+last.measurements[key] - +prev.measurements[key]).toFixed(1) : null
                          return (
                            <div key={key} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 16px', border: `2px solid ${color}30`, minWidth: 110, textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#0C3251' }}>{last.measurements[key]}<span style={{ fontSize: 11 }}>cm</span></div>
                              {diff !== null && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: +diff < 0 ? '#10B981' : '#EF4444', marginTop: 3 }}>
                                  {+diff < 0 ? '▼' : '▲'}{Math.abs(diff)}cm
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── FORÇA ── */}
              {subTab === 'forca' && (
                <div style={GLASS_CARD}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Força por exercício</div>
                  </div>
                  {exercises.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum exercício encontrado para este aluno</div>
                    </div>
                  ) : (
                    <>
                      {/* Selector de exercício */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                        {exercises.map(ex => (
                          <button key={ex.id} onClick={() => setSelExId(ex.id)}
                            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: selExId === ex.id ? 'none' : '1px solid rgba(12,74,110,0.15)', background: selExId === ex.id ? 'linear-gradient(135deg,#155E8E,#0C4A6E)' : 'rgba(255,255,255,0.7)', color: selExId === ex.id ? '#FFF' : '#0C4A6E', transition: 'all 0.15s' }}>
                            {ex.name}
                          </button>
                        ))}
                      </div>

                      {forcaData.length < 2 ? <EmptyChart label={`carga em ${selEx?.name || 'exercício'}`} /> : (
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={forcaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="kg" domain={['auto','auto']} />
                            <Tooltip content={<CustomTooltip unit="kg" />} />
                            <Line type="monotone" dataKey="Máx" name="Carga máx." stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4, fill: '#7C3AED', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {/* Novo PR banner */}
                      {forcaData.length > 1 && forcaData[forcaData.length-1].Máx >= Math.max(...forcaData.slice(0,-1).map(d => d.Máx)) && (
                        <div style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', borderRadius: 14, padding: '12px 18px', marginTop: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(124,58,237,0.4)', animation: 'pulse 2s ease-in-out infinite' }}>
                          <div style={{ fontSize: 28, color:'#7C3AED' }}>PR</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>Novo Recorde Pessoal!</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                              {selEx?.name}: <strong>{forcaData[forcaData.length-1].Máx}kg</strong> em {forcaData[forcaData.length-1].date}
                            </div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, color: '#FFF', fontWeight: 700 }}>
                            +{(forcaData[forcaData.length-1].Máx - forcaData[forcaData.length-2].Máx).toFixed(1)}kg
                          </div>
                        </div>
                      )}

                      {/* PR — maior carga registrada */}
                      {forcaData.length > 0 && (
                        <div style={{ marginTop: 20, borderTop: '1px solid rgba(12,74,110,0.08)', paddingTop: 14, display: 'flex', gap: 16 }}>
                          {[
                            { label: 'Carga Inicial', val: forcaData[0].Máx, color: '#64748B' },
                            { label: 'Carga Atual',   val: forcaData[forcaData.length-1].Máx, color: '#155E8E' },
                            { label: 'PR',          val: Math.max(...forcaData.map(d => d.Máx)), color: '#7C3AED' },
                          ].map(({ label, val, color }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 18px', border: `1px solid rgba(255,255,255,0.9)`, textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}<span style={{ fontSize: 11 }}>kg</span></div>
                            </div>
                          ))}
                          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 18px', border: `1px solid rgba(255,255,255,0.9)`, textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Evolução</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: forcaData[forcaData.length-1].Máx >= forcaData[0].Máx ? '#10B981' : '#EF4444' }}>
                              {forcaData[forcaData.length-1].Máx >= forcaData[0].Máx ? '▲' : '▼'}
                              {Math.abs(forcaData[forcaData.length-1].Máx - forcaData[0].Máx).toFixed(1)}<span style={{ fontSize: 11 }}>kg</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
