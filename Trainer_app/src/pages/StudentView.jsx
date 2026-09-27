import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabase'
import FichaAvaliacao from './FichaAvaliacao'
import { today, DAY_COLORS } from '../lib/studentViewShared'
import { CosmicCSS, StarField } from '../components/backgrounds/CosmicBackground'
import { WorkoutCarousel } from '../components/training/TrainingSession'
import { StudentCardioTab } from '../components/cardio/CardioTab'
import { TabMetas } from '../components/goals/GoalsTab'

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



// ── NOVA MEDIDA MODAL ────────────────────────────────────────────────────────
function NovaMedidaModal({ studentId, onSave, onClose }) {
  const [date,        setDate]        = useState(today())
  const [peso,        setPeso]        = useState('')
  const [cintura,     setCintura]     = useState('')
  const [quadril,     setQuadril]     = useState('')
  const [peito,       setPeito]       = useState('')
  const [braco,       setBraco]       = useState('')
  const [coxa,        setCoxa]        = useState('')
  const [panturrilha, setPanturrilha] = useState('')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const save = async () => {
    if (!peso && !cintura && !quadril && !peito && !braco && !coxa && !panturrilha) return
    setSaving(true)
    await supabase.from('progress_entries').insert([{
      student_id:  studentId,
      date,
      weight:      peso       ? parseFloat(peso)        : null,
      measurements: {
        waist:       cintura     ? parseFloat(cintura)     : null,
        hip:         quadril     ? parseFloat(quadril)     : null,
        chest:       peito       ? parseFloat(peito)       : null,
        arm:         braco       ? parseFloat(braco)       : null,
        thigh:       coxa        ? parseFloat(coxa)        : null,
        calf:        panturrilha ? parseFloat(panturrilha) : null,
      },
      notes: notes || null,
    }])
    setSaving(false)
    onSave()
    onClose()
  }

  const campos = [
    { label:'Peso corporal', unit:'kg',  value:peso,        set:setPeso        },
    { label:'Cintura',       unit:'cm',  value:cintura,     set:setCintura     },
    { label:'Quadril',       unit:'cm',  value:quadril,     set:setQuadril     },
    { label:'Peito',         unit:'cm',  value:peito,       set:setPeito       },
    { label:'Braço',         unit:'cm',  value:braco,       set:setBraco       },
    { label:'Coxa',          unit:'cm',  value:coxa,        set:setCoxa        },
    { label:'Panturrilha',   unit:'cm',  value:panturrilha, set:setPanturrilha },
  ]

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:400, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ ...CARD, padding:24, width:'100%',
        maxWidth:420, maxHeight:'90vh', overflowY:'auto', marginBottom:0,
        border:'1px solid rgba(52,211,153,0.2)' }}>

        <div style={{ fontSize:17, fontWeight:800, color:'#E2E8F0', marginBottom:3 }}>📏 Registrar Medidas</div>
        <div style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Preencha os campos que deseja registrar hoje</div>

        <label style={LBL}>Data</label>
        <input type="date" style={INP} value={date} onChange={e=>setDate(e.target.value)} />

        {/* Grid 2 colunas para as medidas */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
          {campos.map(({ label, unit, value, set }) => (
            <div key={label}>
              <label style={LBL}>{label} <span style={{ color:'#334155', fontWeight:500 }}>({unit})</span></label>
              <input
                type="number" inputMode="decimal" step="0.1"
                placeholder={unit === 'kg' ? 'Ex: 72.5' : 'Ex: 80'}
                value={value}
                onChange={e => set(e.target.value)}
                style={{ ...INP, padding:'12px 10px', fontSize:15, textAlign:'center', fontWeight:700,
                  border:`1px solid ${value ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}` }}
              />
            </div>
          ))}
        </div>

        <label style={{ ...LBL, gridColumn:'1/-1' }}>Observações (opcional)</label>
        <textarea
          style={{ ...INP, minHeight:60, resize:'vertical' }}
          placeholder="Como você está se sentindo? Alguma observação?"
          value={notes}
          onChange={e=>setNotes(e.target.value)}
        />

        <button onClick={save} disabled={saving} style={{
          width:'100%', marginTop:20, borderRadius:12, padding:14, border:'none',
          background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#34D399,#059669)',
          color: saving ? '#475569' : '#022c22',
          fontWeight:800, fontSize:15, cursor: saving ? 'default' : 'pointer',
          boxShadow: saving ? 'none' : '0 4px 20px rgba(52,211,153,0.35)',
        }}>{saving ? 'Salvando...' : '💾 Salvar Medidas'}</button>

        <button onClick={onClose} style={{ width:'100%', background:'transparent',
          border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:11,
          color:'#475569', fontWeight:600, fontSize:13, cursor:'pointer', marginTop:8 }}>Cancelar</button>
      </div>
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
  const [showMedidaModal, setShowMedidaModal] = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [confirmedToday, setConfirmedToday] = useState(false)
  const [confirming,     setConfirming]     = useState(false)
  const [showMakeup,     setShowMakeup]     = useState(false)
  const [missedDays,     setMissedDays]     = useState([]) // dias perdidos da semana
  const [anamData,        setAnamData]        = useState(null)
  const [avaliacoesProf,  setAvaliacoesProf]  = useState([])
  const [openAvalId,      setOpenAvalId]      = useState(null)

  useEffect(() => {
    if (!studentId) return
    supabase.from('anamnese').select('*').eq('student_id', studentId).limit(1)
      .then(({ data }) => { if (data?.[0]) setAnamData(data[0]) })
    supabase.from('measure_logs').select('*').eq('student_id', studentId).not('medidas','is',null).order('date', { ascending:false })
      .then(({ data }) => setAvaliacoesProf(data || []))
  }, [studentId])

  useEffect(() => {
    if (!studentId) { setLoading(false); return }

    const timeout = setTimeout(() => setLoading(false), 10000)

    const load = async () => {
      try {
        const { data: st } = await supabase
          .from('students_public').select('*').eq('id', studentId).single()
        if (st) setStudent(st)

        const { data: plans } = await supabase
          .from('workout_plans').select('*')
          .eq('student_id', studentId).eq('status', 'active')
          .order('updated_at', { ascending: false }).limit(1)

        if (plans?.[0]) {
          setActivePlan(plans[0])
          const { data: daysData } = await supabase
            .from('workout_days').select('*, exercises(*)')
            .eq('plan_id', plans[0].id).order('order_index')
          if (daysData) setDays(daysData.map(d => ({
            ...d,
            exercises: (d.exercises || []).sort((a, b) => a.order_index - b.order_index),
          })))
        }

        const results = await Promise.allSettled([
          supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(10),
          supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
          supabase.from('cardio_sessions').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(120),
        ])
        const [prR, gsR, csR] = results
        if (prR.status === 'fulfilled' && prR.value.data) setProgress(prR.value.data)
        if (gsR.status === 'fulfilled' && gsR.value.data) setGoals(gsR.value.data)
        if (csR.status === 'fulfilled' && csR.value.data) setCardio(csR.value.data)

        // Check if already confirmed today
        const todayStr = today()
        const { data: logsToday } = await supabase
          .from('exercise_logs').select('id, day_id')
          .eq('student_id', studentId).eq('date', todayStr)
        if (logsToday?.length) setConfirmedToday(true)

        // Find missed days this week (days that had workouts but no log)
        const JS_TO_DIA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        weekStart.setHours(0,0,0,0)

        const { data: weekLogs } = await supabase
          .from('exercise_logs').select('date, day_id')
          .eq('student_id', studentId)
          .gte('date', weekStart.toISOString().slice(0,10))
        const loggedDayIds = new Set((weekLogs||[]).map(l => l.day_id).filter(Boolean))
        const loggedDates  = new Set((weekLogs||[]).map(l => l.date))

        // days é populado do plano ativo buscado acima
        // Precisamos aguardar o state ser setado, então fazemos direto aqui
        if (plans?.[0]) {
          const { data: daysData2 } = await supabase
            .from('workout_days').select('*, exercises(*)')
            .eq('plan_id', plans[0].id).order('order_index')

          if (daysData2) {
            const missed = []
            const DIA_JS = { Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6,Dom:0 }
            const todayJS = now.getDay()

            daysData2.forEach(d => {
              if (!d.day_of_week) return
              const diaJS = DIA_JS[d.day_of_week]
              if (diaJS === undefined) return
              // Só inclui dias que já passaram esta semana (não hoje, não futuros)
              const alreadyPassed = diaJS !== todayJS && (
                (diaJS < todayJS && !(diaJS === 0 && todayJS !== 0)) ||
                (diaJS === 0 && todayJS > 0)
              )
              if (!alreadyPassed) return
              // Já foi feito este dia?
              const jaFez = loggedDayIds.has(d.id) || (() => {
                // Verifica se tem log na data correta do dia nesta semana
                const cursor = new Date(weekStart)
                while (cursor <= now) {
                  if (cursor.getDay() === diaJS) {
                    const ds = cursor.toISOString().slice(0,10)
                    if (loggedDates.has(ds)) return true
                    break
                  }
                  cursor.setDate(cursor.getDate()+1)
                }
                return false
              })()
              if (!jaFez) missed.push({ ...d, dia: d.day_of_week, exercises: (d.exercises || []).sort((a,b) => a.order_index - b.order_index) })
            })
            setMissedDays(missed)
          }
        }
      } catch (err) {
        console.error('StudentView load error:', err)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
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

  const confirmWorkout = async (overrideDay = null) => {
    const targetDay = overrideDay || day
    if (!overrideDay && (confirmedToday || confirming || !day)) return
    setConfirming(true)
    const isMakeup = !!overrideDay
    const { error } = await supabase.from('exercise_logs').insert({
      student_id:    studentId,
      exercise_id:   targetDay?.exercises?.[0]?.id || null,
      date:          today(),
      sets:          [],
      day_id:        targetDay?.id || null,
      is_makeup:     isMakeup,
      scheduled_day: targetDay?.day_of_week || null,
    })
    setConfirming(false)
    if (!error) {
      if (!isMakeup) setConfirmedToday(true)
      else {
        // Remove o dia da lista de perdidos
        setMissedDays(prev => prev.filter(d => d.id !== targetDay.id))
        setShowMakeup(false)
      }
    }
  }

  // Tabs config
  const hasEscolinha = !!student?.sport

  const TABS = [
    { id: 'treino',    icon: '🏋️', label: 'Treino'    },
    { id: 'metas',     icon: '🎯', label: 'Metas'     },
    { id: 'cardio',    icon: '❤️', label: 'Cárdio'    },
    { id: 'evolucao',  icon: '📈', label: 'Evolução'  },
    ...(hasEscolinha ? [{ id: 'escolinha', icon: '⚽', label: 'Escolinha' }] : []),
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
            {!activePlan ? (
              <div style={{ textAlign:'center', padding:'50px 20px', color:'#334155' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🏋️</div>
                <div style={{ fontSize:15, lineHeight:1.6 }}>Nenhum treino ativo.<br/>Aguarde seu professor configurar seu plano.</div>
              </div>
            ) : (
              <WorkoutCarousel
                days={days}
                activePlan={activePlan}
                confirmedToday={confirmedToday}
                confirming={confirming}
                confirmWorkout={confirmWorkout}
                missedDays={missedDays}
                showMakeup={showMakeup}
                setShowMakeup={setShowMakeup}
                studentId={studentId}
                isMobile={isMobile}
              />
            )}
          </>
        )}

        {/* ── ABA METAS ── */}
        {tab === 'metas' && (
          <TabMetas
            studentId={studentId}
            student={student}
            goals={goals}
            onUpdate={async () => {
              const { data: gs } = await supabase.from('student_goals').select('*')
                .eq('student_id', studentId).order('created_at', { ascending: false })
              if (gs) setGoals(gs)
            }}
          />
        )}

        {/* ── ABA CÁRDIO ── */}
        {tab === 'cardio' && (
          (parseInt(student?.age)||0) > 0 && (parseInt(student?.age)||0) <= 12
          ? (
            <div style={{ ...CARD, textAlign:'center', padding:'48px 24px' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🏃</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0', marginBottom:10 }}>
                Seu cardio é feito correndo e brincando!
              </div>
              <div style={{ fontSize:14, color:'#64748B', lineHeight:1.8, maxWidth:320, margin:'0 auto' }}>
                Nessa fase, as brincadeiras, os jogos e as atividades em grupo já desenvolvem
                todo o condicionamento que você precisa. Continue se movimentando e se
                divertindo — isso é o mais importante!
              </div>
              <div style={{ marginTop:20, padding:'12px 18px', background:'rgba(52,211,153,0.08)', borderRadius:12, border:'1px solid rgba(52,211,153,0.2)', display:'inline-block' }}>
                <div style={{ fontSize:12, color:'#34D399', fontWeight:700 }}>
                  Dica: participe das aulas, corra, pule e jogue bastante!
                </div>
              </div>
            </div>
          )
          : (
            <StudentCardioTab
              studentId={studentId}
              student={student}
              sessions={cardio}
              simplified={(parseInt(student?.age)||0) >= 13 && (parseInt(student?.age)||0) <= 17}
              onNewSession={async () => {
                const { data: cs } = await supabase.from('cardio_sessions').select('*')
                  .eq('student_id', studentId).order('date', { ascending: false }).limit(120)
                if (cs) setCardio(cs)
              }}
            />
          )
        )}

        {/* ── ABA EVOLUÇÃO ── */}
        {tab === 'evolucao' && (
          <div>
            {showMedidaModal && (
              <NovaMedidaModal
                studentId={studentId}
                onSave={async () => {
                  const { data: pr } = await supabase.from('progress_entries').select('*')
                    .eq('student_id', studentId).order('date', { ascending: false }).limit(10)
                  if (pr) setProgress(pr)
                }}
                onClose={() => setShowMedidaModal(false)}
              />
            )}

            {/* Header com botão */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0' }}>📈 Evolução</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{progress.length} registro{progress.length !== 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => setShowMedidaModal(true)}
                style={{
                  padding:'10px 16px', borderRadius:12, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#34D399,#059669)', color:'#022c22',
                  fontWeight:800, fontSize:13, boxShadow:'0 4px 16px rgba(52,211,153,0.3)',
                }}>+ Medidas</button>
            </div>

            {/* ── Avaliações do professor (somente leitura) ── */}
            {avaliacoesProf.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Avaliações do Professor</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {avaliacoesProf.map(a => (
                    <button key={a.id} onClick={() => setOpenAvalId(a.id)} style={{ textAlign:'left', background:'#111827', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:'inherit', fontFamily:'inherit', width:'100%' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>Avaliação Antropométrica do dia {a.date?.split('-').reverse().join('/')}{a.hora ? `, ${a.hora}` : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {openAvalId && (
              <FichaAvaliacao
                avaliacaoId={openAvalId}
                studentId={studentId}
                student={student}
                anamData={anamData}
                readOnly={true}
                onClose={() => setOpenAvalId(null)}
              />
            )}

            {progress.length === 0 ? (
              <div style={{ ...CARD, textAlign:'center', padding:'48px 20px' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📏</div>
                <div style={{ fontSize:15, color:'#475569', lineHeight:1.6 }}>
                  Nenhum registro ainda.<br/>Toque em <strong style={{color:'#34D399'}}>+ Medidas</strong> para começar!
                </div>
              </div>
            ) : (
              <>
                <ProgressChart progress={progress} />
                {progress.map((p, i) => {
                  const m = p.measurements || {}
                  const itens = [
                    { label:'Peso',        val: p.weight           ? p.weight + ' kg'              : null },
                    { label:'Cintura',     val: m.waist || p.waist ? (m.waist || p.waist) + ' cm'  : null },
                    { label:'Quadril',     val: m.hip   || p.hip   ? (m.hip   || p.hip)   + ' cm'  : null },
                    { label:'Peito',       val: m.chest || p.chest ? (m.chest || p.chest) + ' cm'  : null },
                    { label:'Braço',       val: m.arm              ? m.arm   + ' cm'               : null },
                    { label:'Coxa',        val: m.thigh || p.thigh ? (m.thigh || p.thigh) + ' cm'  : null },
                    { label:'Panturrilha', val: m.calf             ? m.calf  + ' cm'               : null },
                  ].filter(x => x.val)
                  return (
                    <div key={p.id} style={{ ...CARD, marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                        <div style={{ fontSize:13, color:'#34D399', fontWeight:700 }}>
                          {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
                        </div>
                        {i === 0 && <span style={{ fontSize:10, background:'#34D39918', color:'#34D399', padding:'2px 10px', borderRadius:20, border:'1px solid #34D39930' }}>Mais recente</span>}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
                        {itens.map(it => (
                          <div key={it.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px' }}>
                            <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{it.label}</div>
                            <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>{it.val}</div>
                          </div>
                        ))}
                      </div>
                      {p.notes && (
                        <div style={{ fontSize:12, color:'#64748B', marginTop:10, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8 }}>
                          {p.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ── ABA ESCOLINHA ── */}
        {tab === 'escolinha' && (
          <TabEscolinhaAluno studentId={studentId} student={student} />
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
                {active && <div style={{ position: 'absolute', bottom: 0, width: 32, height: 2, borderRadius: '2px 2px 0 0', background: '#34D399' }} />
              }
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
