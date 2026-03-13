import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'

// ── Responsividade ────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── Constantes ────────────────────────────────────────────────────────────────
const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']
const TYPE_COLORS = {
  'Peito': '#FF6B6B', 'Costas': '#00C9FF', 'Bíceps': '#38BDF8', 'Tríceps': '#FF8C42',
  'Ombro': '#FDE68A', 'Quadríceps': '#A78BFA', 'Posterior': '#C084FC', 'Glúteo': '#F472B6',
  'Panturrilha': '#FBBF24', 'Core': '#34D399', 'Cardio': '#F87171', 'Full Body': '#6EE7B7',
}
const today = () => new Date().toISOString().split('T')[0]
const parseSets = (setsField) => {
  const n = parseInt(setsField) || 3
  return Array.from({ length: n }, (_, i) => ({ set: i + 1, weight: '', reps: '' }))
}

// ── Céu estrelado (mobile only) ───────────────────────────────────────────────
function CosmicCSS() {
  return (
    <style>{`
      @keyframes twinkle {
        0%,100% { opacity: 0.08; transform: scale(0.6); }
        50%      { opacity: 1;   transform: scale(1.5); }
      }
      @keyframes aurora {
        0%,100% { transform: translate(0,0) scale(1);         opacity: 0.07; }
        50%      { transform: translate(24px,-10px) scale(1.18); opacity: 0.13; }
      }
    `}</style>
  )
}

function StarField() {
  const stars = useMemo(() => Array.from({ length: 130 }, (_, i) => {
    const big = i < 18
    return {
      id:    i,
      x:     ((i * 7919 + 13) % 1000) / 10,
      y:     ((i * 6271 + 97) % 1000) / 10,
      size:  big ? (1.8 + (i % 5) * 0.4) : (0.4 + (i % 4) * 0.3),
      delay: ((i * 1.37) % 7).toFixed(2),
      dur:   (2.5 + (i % 5) * 0.7).toFixed(2),
      op:    (0.18 + (i % 8) * 0.09).toFixed(2),
    }
  }), [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#02040F 0%,#060A1A 55%,#090D24 100%)' }} />
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '65%', height: '55%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 70%)', animation: 'aurora 14s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55%', height: '50%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(56,189,248,0.07) 0%,transparent 70%)', animation: 'aurora 18s 5s ease-in-out infinite' }} />
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`, borderRadius: '50%',
          background: s.size > 1.5 ? '#E8EEFF' : '#FFFFFF',
          opacity: s.op,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          boxShadow: s.size > 1.5 ? `0 0 ${s.size * 3}px rgba(200,210,255,0.55)` : 'none',
        }} />
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: '#34D399', color: '#052e16', borderRadius: 50, padding: '12px 26px',
      fontWeight: 800, fontSize: 14, zIndex: 1000, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(52,211,153,0.5)',
    }}>{msg}</div>
  )
}

// ── ExerciseLogRow — responsivo ───────────────────────────────────────────────
function ExerciseLogRow({ ex, studentId, dayColor, isMobile }) {
  const [open,    setOpen]    = useState(false)
  const [sets,    setSets]    = useState(parseSets(ex.sets))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [lastLog, setLastLog] = useState(null)
  const [toast,   setToast]   = useState(null)
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
      sets: sets.map(s => ({ set: s.set, weight: s.weight || null, reps: s.reps || null })),
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
              </>}
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
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 8 }}>
              {['Série', 'Carga (kg)', 'Reps feitas'].map(h => (
                <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>

            {/* Inputs por série */}
            {sets.map((s, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 8, alignItems: 'center' }}>
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
export default function StudentView({ studentId }) {
  const isMobile = useIsMobile()
  const [student,    setStudent]    = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [days,       setDays]       = useState([])
  const [activeDay,  setActiveDay]  = useState(0)
  const [progress,   setProgress]   = useState([])
  const [tab,        setTab]        = useState('treino')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single()
      if (st) setStudent(st)

      const { data: plans } = await supabase.from('workout_plans').select('*')
        .eq('student_id', studentId).eq('status', 'active')
        .order('updated_at', { ascending: false }).limit(1)

      if (plans?.[0]) {
        setActivePlan(plans[0])
        const { data: daysData } = await supabase.from('workout_days').select('*, exercises(*)')
          .eq('plan_id', plans[0].id).order('order_index')
        if (daysData) setDays(daysData.map(d => ({ ...d, exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
      }

      const { data: pr } = await supabase.from('progress_entries').select('*')
        .eq('student_id', studentId).order('date', { ascending: false }).limit(10)
      if (pr) setProgress(pr)
      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: 18, fontFamily: 'system-ui,sans-serif' }}>
      ⚙️ Carregando seu treino...
    </div>
  )

  if (!student) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
      Aluno não encontrado.
    </div>
  )

  const day   = days[activeDay]
  const color = DAY_COLORS[activeDay % DAY_COLORS.length]

  // Tabs config
  const TABS = [
    { id: 'treino',   icon: '🏋️', label: 'Treino'   },
    { id: 'evolucao', icon: '📈', label: 'Evolução' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: isMobile ? 'transparent' : '#080B12',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#E2E8F0',
      // Espaço para a bottom nav no mobile
      paddingBottom: isMobile ? 80 : 0,
      position: 'relative',
    }}>
      {/* ── Céu estrelado — apenas mobile ── */}
      {isMobile && <><CosmicCSS /><StarField /></>}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '16px 14px' : '24px 16px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '18px 18px' : 24, marginBottom: 16, border: '1px solid rgba(52,211,153,0.15)' }}>
          <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Seu Plano de Treino</div>
          <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
            Olá, {student.name.split(' ')[0]}! 💪
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>{student.goal} · {student.level}</div>
          {activePlan && (
            <div style={{ marginTop: 10, background: 'rgba(52,211,153,0.08)', borderRadius: 8, padding: '7px 12px', display: 'inline-block' }}>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>📋 {activePlan.title}</span>
            </div>
          )}
        </div>

        {/* ── Tabs — desktop only (mobile usa bottom nav) ── */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {TABS.map(({ id, icon, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                background: tab === id ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)',
                color: tab === id ? '#fff' : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>{icon} {label}</button>
            ))}
          </div>
        )}

        {/* ── ABA TREINO ── */}
        {tab === 'treino' && (
          <>
            {!activePlan || days.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#334155' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🏋️</div>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>Nenhum treino ativo.<br/>Aguarde seu professor configurar seu plano.</div>
              </div>
            ) : (
              <>
                {/* ── Seletor de dias ── */}
                {isMobile ? (
                  /* Mobile: scroll horizontal, botões maiores */
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                    {days.map((d, i) => {
                      const c = DAY_COLORS[i % DAY_COLORS.length]
                      return (
                        <button key={d.id} onClick={() => setActiveDay(i)} style={{
                          flexShrink: 0, minWidth: 72, padding: '12px 10px', borderRadius: 14,
                          border: activeDay === i ? `2px solid ${c}` : '1px solid rgba(255,255,255,0.08)',
                          background: activeDay === i ? `${c}22` : 'rgba(255,255,255,0.03)',
                          color: activeDay === i ? c : '#475569', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                          <span>{d.name}</span>
                          {d.day_of_week && <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>{d.day_of_week}</span>}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  /* Desktop: flex wrap */
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
                )}

                {/* ── Card do dia ── */}
                {day && (
                  <div style={{ background: '#0D1117', borderRadius: 16, overflow: 'hidden', border: `1px solid ${color}30` }}>
                    {/* Header do dia */}
                    <div style={{ background: `${color}12`, padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${color}25` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color, fontSize: isMobile ? 15 : 16 }}>{day.name}</span>
                        {day.focus && <span style={{ fontSize: 12, color: '#475569' }}>— {day.focus}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>
                        ⚖️ Toque em <strong style={{ color: '#64748B' }}>Registrar carga</strong> para anotar o peso usado
                      </div>
                    </div>

                    {/* Cabeçalho de colunas — só no desktop */}
                    {!isMobile && (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 0.6fr', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {['Exercício', 'Séries', 'Reps', 'Descanso'].map(h => (
                          <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                        ))}
                      </div>
                    )}

                    {/* Lista de exercícios */}
                    {day.exercises.length === 0 ? (
                      <div style={{ padding: 30, textAlign: 'center', color: '#334155', fontSize: 13 }}>Nenhum exercício neste dia ainda.</div>
                    ) : (
                      day.exercises.map(ex => (
                        <ExerciseLogRow key={ex.id} ex={ex} studentId={studentId} dayColor={color} isMobile={isMobile} />
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
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#334155' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 15 }}>Nenhum registro de evolução ainda.</div>
              </div>
            ) : (
              progress.map((p, i) => (
                <div key={p.id} style={{ background: '#0D1117', borderRadius: 14, padding: isMobile ? '14px 16px' : '16px 20px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: '#34D399', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {i === 0 && <span style={{ fontSize: 10, background: '#34D39920', color: '#34D399', padding: '2px 9px', borderRadius: 20 }}>Mais recente</span>}
                  </div>
                  {/* Grid de medidas — 2 colunas no mobile */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,auto)', gap: isMobile ? '10px 16px' : '8px 20px' }}>
                    {[
                      { label: 'Peso', val: p.weight ? `${p.weight} kg` : null },
                      { label: 'Cintura', val: p.waist || p.measurements?.waist ? `${p.waist || p.measurements?.waist} cm` : null },
                      { label: 'Peito',   val: p.chest || p.measurements?.chest  ? `${p.chest || p.measurements?.chest} cm` : null },
                      { label: 'Quadril', val: p.hip   || p.measurements?.hip    ? `${p.hip   || p.measurements?.hip} cm`   : null },
                      { label: 'Coxa',    val: p.thigh || p.measurements?.thigh  ? `${p.thigh || p.measurements?.thigh} cm` : null },
                    ].filter(m => m.val).map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: '#64748B', marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>📝 {p.notes}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#1E293B' }}>
          Trainer App · Plano gerenciado pelo seu professor
        </div>
      </div>

      {/* ── Bottom Navigation — MOBILE ONLY ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(8,11,18,0.97)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', height: 68, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {TABS.map(({ id, icon, label }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: active ? '#34D399' : '#475569',
                transition: 'color 0.15s',
              }}>
                <span style={{ fontSize: 22, lineHeight: 1, filter: active ? 'drop-shadow(0 0 6px #34D39966)' : 'none', transition: 'filter 0.15s' }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: 0.3 }}>{label}</span>
                {active && <div style={{ position: 'absolute', bottom: 0, width: 32, height: 2, borderRadius: '2px 2px 0 0', background: '#34D399' }} />}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
