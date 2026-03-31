import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import {
  MotorActivityCard,
  MotorSectionDivider,
  extractMotorActivities,
  extractRegularExercises,
} from './MotorActivityCard'

const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']

const getAgeGroup = (birthDate, age) => {
  const a = birthDate
    ? Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000))
    : age ? parseInt(age) : null
  if (!a) return 'adulto_jovem'
  if (a < 13) return 'crianca'
  if (a < 18) return 'adolescente'
  if (a < 40) return 'adulto_jovem'
  if (a < 60) return 'adulto_maduro'
  return 'idoso'
}

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

function parseFirstInt(str) {
  const m = (str || '').toString().match(/\d+/)
  if (!m) return null
  const n = parseInt(m[0])
  return Number.isFinite(n) ? n : null
}

function RegularExerciseRow({ ex, dayColor, done, onToggleDone, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '14px 16px' : '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            flexShrink: 0,
            background: (dayColor || '#60A5FA') + '18',
            border: `1px solid ${(dayColor || '#60A5FA')}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          {ex.type === 'Cardio' ? '🏃' : ex.type === 'Core' ? '🧠' : '💪'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#E2E8F0', fontSize: isMobile ? 15 : 14 }}>{ex.name}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span>🔁 {ex.sets}× · {ex.reps}</span>
            <span>💤 {ex.rest}</span>
          </div>
          {ex.tip && ex.tip.trim() && (
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
              {ex.tip.startsWith('[Motor:') ? ex.tip.replace(/\[Motor:[^\]]+\]\s*/, '') : ex.tip}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onToggleDone?.(ex.id)}
        style={{
          width: '100%',
          padding: isMobile ? '11px' : '9px',
          borderRadius: 10,
          border: `1px solid ${done ? '#34D39940' : (dayColor || '#60A5FA') + '40'}`,
          background: done ? 'rgba(52,211,153,0.1)' : (dayColor || '#60A5FA') + '10',
          color: done ? '#34D399' : (dayColor || '#60A5FA'),
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {done ? '✅ Feito' : '🎯 Marcar como feito'}
      </button>
    </div>
  )
}

export default function StudentView({ studentId }) {
  const isMobile = useIsMobile()

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [plan, setPlan] = useState(null)
  const [doneSet, setDoneSet] = useState(() => new Set())
  const [busyExId, setBusyExId] = useState(null)

  const ageGroup = useMemo(() => getAgeGroup(student?.birth_date, student?.age), [student])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [studentRes, planRes, logsRes] = await Promise.all([
          supabase.from('students').select('id,name,birth_date,age,goal,sport').eq('id', studentId).single(),
          supabase
            .from('workout_plans')
            .select('*, workout_days(*, exercises(*))')
            .eq('student_id', studentId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1),
          supabase.from('exercise_logs').select('exercise_id').eq('student_id', studentId).eq('date', today),
        ])

        const planData = planRes?.data?.[0] || null
        setStudent(studentRes?.data || null)
        setPlan(
          planData
            ? {
                ...planData,
                workout_days: (planData.workout_days || []).map(d => ({
                  ...d,
                  exercises: (d.exercises || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
                })),
              }
            : null,
        )

        setDoneSet(new Set((logsRes?.data || []).map(l => l.exercise_id)))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId, today])

  const toggleDone = async (exerciseId) => {
    if (!studentId) return
    if (busyExId === exerciseId) return
    setBusyExId(exerciseId)
    try {
      const isDone = doneSet.has(exerciseId)
      if (isDone) {
        await supabase
          .from('exercise_logs')
          .delete()
          .eq('student_id', studentId)
          .eq('exercise_id', exerciseId)
          .eq('date', today)
        setDoneSet(prev => {
          const next = new Set(prev)
          next.delete(exerciseId)
          return next
        })
      } else {
        // Encontrar reps planejadas para registrar algo mínimo na avaliação
        const ex = (plan?.workout_days || []).flatMap(d => d.exercises || []).find(e => e.id === exerciseId)
        const repsNum = parseFirstInt(ex?.reps)
        const safeReps = repsNum ?? 0
        await supabase.from('exercise_logs').insert([
          {
            student_id: studentId,
            exercise_id: exerciseId,
            date: today,
            sets: [{ weight: 0, reps: safeReps }],
          },
        ])
        setDoneSet(prev => {
          const next = new Set(prev)
          next.add(exerciseId)
          return next
        })
      }
    } catch (e) {
      // Falha silenciosa para não quebrar o treino; o usuário pode tentar novamente.
      // eslint-disable-next-line no-console
      console.error('Falha ao atualizar exercício', e)
    } finally {
      setBusyExId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#040D18', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando treino...
      </div>
    )
  }

  if (!plan) {
    return (
      <div style={{ minHeight: '100vh', background: '#040D18', color: '#E2E8F0', padding: 24 }}>
        Nenhum plano ativo encontrado para este aluno.
      </div>
    )
  }

  const days = plan.workout_days || []

  return (
    <div style={{ minHeight: '100vh', background: '#040D18', color: '#E2E8F0', padding: '20px 14px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ marginBottom: 18, opacity: 0.95 }}>
          <div style={{ fontSize: 10, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 900 }}>
            Treino do aluno
          </div>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, marginTop: 3, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {student?.name || '—'} {ageGroup === 'crianca' || ageGroup === 'adolescente' ? `(${ageGroup})` : null}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Data: {today} · Plano: {plan.title || '—'}
          </div>
        </div>

        {days.map((day, idx) => {
          const color = DAY_COLORS[idx % DAY_COLORS.length]
          const exercises = day.exercises || []
          const regularExs = extractRegularExercises(exercises)
          const motorExs = extractMotorActivities(exercises)
          return (
            <div key={day.id} style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ background: color + '12', borderBottom: '1px solid ' + color + '25', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{day.name || 'Treino'}</div>
                  {day.day_of_week && <div style={{ fontSize: 12, color: '#64748B' }}>- {day.day_of_week}</div>}
                </div>
                {day.focus && <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{day.focus}</div>}
              </div>

              <div>
                {regularExs.map(ex => (
                  <RegularExerciseRow
                    key={ex.id}
                    ex={ex}
                    dayColor={color}
                    isMobile={isMobile}
                    done={doneSet.has(ex.id)}
                    onToggleDone={(id) => toggleDone(id)}
                  />
                ))}

                {motorExs.length > 0 && (
                  <>
                    <MotorSectionDivider count={motorExs.length} dayColor={color} />
                    {motorExs.map(ex => (
                      <MotorActivityCard
                        key={ex.id}
                        ex={ex}
                        dayColor={color}
                        isMobile={isMobile}
                        done={doneSet.has(ex.id)}
                        onToggleDone={(id) => toggleDone(id)}
                      />
                    ))}
                  </>
                )}

                {exercises.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                    Nenhum exercício neste dia ainda.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

