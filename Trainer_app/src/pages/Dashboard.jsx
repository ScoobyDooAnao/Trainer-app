import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const SIDEBAR_BG    = '#155E8E'
const SIDEBAR_TEXT  = '#E0F2FE'
const YELLOW        = '#F5C842'
const YELLOW_BG     = 'rgba(245,200,66,0.15)'
const YELLOW_BORDER = 'rgba(245,200,66,0.45)'

const GOAL = {
  'Ganho de Massa':      { bg: '#E0F4FF', accent: '#0284C7', icon: '💪' },
  'Emagrecimento':       { bg: '#FEF2F2', accent: '#E05252', icon: '🔥' },
  'Força e Performance': { bg: '#EDE9FE', accent: '#7C3AED', icon: '⚡' },
  'Condicionamento':     { bg: '#FFFBEB', accent: '#D97706', icon: '🏃' },
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const DIA_JS_MAP  = { Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6, Dom: 0 }

const NAV = [
  { id: 'alunos',   icon: '👥', label: 'Meus Alunos' },
  { id: 'treinos',  icon: '🏋️', label: 'Treinos'      },
  { id: 'evolucao', icon: '📈', label: 'Evolução'     },
  { id: 'cardio',   icon: '❤️', label: 'Cardio'       },
]
const GOALS  = ['Ganho de Massa', 'Emagrecimento', 'Condicionamento', 'Força e Performance']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado']

// ── Helpers ────────────────────────────────────────────────────────────────
function imcStyle(w, h) {
  if (!w || !h) return { val: '—', color: '#94A3B8', label: '—' }
  const v = parseFloat((w / ((h / 100) ** 2)).toFixed(1))
  let color, label
  if      (v < 16)   { color = '#BFDBFE'; label = 'Muito baixo' }
  else if (v < 18.5) { color = '#60A5FA'; label = 'Abaixo'      }
  else if (v < 22)   { color = '#34D399'; label = 'Ideal'       }
  else if (v < 25)   { color = '#10B981'; label = 'Normal'      }
  else if (v < 27.5) { color = '#F5C842'; label = 'Sobrepeso'   }
  else if (v < 30)   { color = '#F59E0B'; label = 'Sobrepeso+'  }
  else if (v < 35)   { color = '#EF4444'; label = 'Obesidade'   }
  else               { color = '#B91C1C'; label = 'Ob. Severa'  }
  return { val: v.toFixed(1), color, label }
}

function streakStyle(days) {
  if (!days || days === 0) return { color: '#94A3B8', display: '—', glow: false }
  let color, glow = false
  if      (days < 7)   color = '#FDE68A'
  else if (days < 14)  color = '#FCD34D'
  else if (days < 30)  color = '#F5C842'
  else if (days < 90)  { color = '#F59E0B'; glow = true }
  else if (days < 180) { color = '#EA580C'; glow = true }
  else if (days < 365) { color = '#DC2626'; glow = true }
  else                 { color = '#D97706'; glow = true }
  const emoji = days >= 365 ? '👑' : days >= 180 ? '💎' : days >= 90 ? '⚡' : '🔥'
  return { color, display: `${emoji}${days}`, glow }
}

function getDayStatus(dia, attendanceDates, logDates) {
  const todayJS  = new Date().getDay()
  const diaJS    = DIA_JS_MAP[dia]
  const jaPassou = diaJS < todayJS
  const eHoje    = diaJS === todayJS
  const now      = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const allDates = [...(attendanceDates || []), ...(logDates || [])]
  const fez = allDates.some(d => {
    const date = new Date(d + 'T12:00:00')
    return date.getDay() === diaJS && date >= weekStart
  })
  if (fez)      return { bg: 'rgba(52,211,153,0.18)',  color: '#065F46', border: 'rgba(52,211,153,0.45)', label: 'Feito 👍',   emoji: '👍' }
  if (eHoje)    return { bg: 'rgba(59,130,246,0.15)',  color: '#1E3A8A', border: 'rgba(59,130,246,0.4)',  label: 'Ainda dá ⏳', emoji: '⏳' }
  if (jaPassou) return { bg: 'rgba(239,68,68,0.12)',   color: '#7F1D1D', border: 'rgba(239,68,68,0.38)',  label: 'Faltou 😓',  emoji: '😓' }
  return          { bg: 'rgba(148,163,184,0.12)', color: '#475569', border: 'rgba(148,163,184,0.3)', label: 'Agendado 📅', emoji: '📅' }
}

function calcStreak(dates, plannedDays) {
  // Se não tem dias planejados, retorna 0
  if (!plannedDays || plannedDays.length === 0) return 0

  const JS_TO_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  // Conjunto de datas em que o aluno treinou (YYYY-MM-DD)
  const doneSet = new Set((dates || []).map(d => String(d).slice(0, 10)))

  let streak = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cursor = new Date(today)

  // Percorre dia a dia para trás, ignorando dias que não são de treino
  for (let i = 0; i < 730; i++) {
    const dayName = JS_TO_DIA[cursor.getDay()]
    const isToday = cursor.getTime() === today.getTime()

    if (plannedDays.includes(dayName)) {
      const dateStr = cursor.toISOString().slice(0, 10)
      if (doneSet.has(dateStr)) {
        streak++ // dia de treino cumprido ✅
      } else if (!isToday) {
        break    // faltou num dia planejado → sequência quebra 💔
        // (hoje ainda não conta como falta — pode ainda treinar)
      }
    }
    // dias de descanso são simplesmente pulados

    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

// ── WaveDivider ────────────────────────────────────────────────────────────
function WaveDivider() {
  return (
    <div style={{ lineHeight: 0, padding: '2px 0 8px' }}>
      <svg viewBox="0 0 220 14" width="220" height="14" style={{ display: 'block' }}>
        <path d="M0,7 C18,1 36,13 55,7 C73,1 91,13 110,7 C129,1 147,13 165,7 C183,1 201,13 220,7"
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', borderRadius: 10,
        border: active ? `1px solid ${YELLOW_BORDER}` : '1px solid transparent',
        cursor: 'pointer', textAlign: 'left',
        background: active ? YELLOW_BG : hov ? 'rgba(255,255,255,0.07)' : 'transparent',
        transition: 'all 0.18s',
      }}>
      <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{item.icon}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? YELLOW : SIDEBAR_TEXT }}>
        {item.label}
      </span>
      {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: YELLOW, boxShadow: `0 0 8px ${YELLOW}` }} />}
    </button>
  )
}

// ── StudentCard ────────────────────────────────────────────────────────────
function StudentCard({ st, onClick }) {
  const [hov, setHov] = useState(false)
  const g      = GOAL[st.goal] || GOAL['Ganho de Massa']
  const imc    = imcStyle(st.weight, st.height)
  const streak = streakStyle(st.streak || 0)
  const active = (st.lastSeenDays ?? 999) < 5

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{
        background:   hov ? 'linear-gradient(160deg,#FDE68A,#F5C842)' : 'linear-gradient(160deg,#FEF3C7,#FBBF24CC)',
        borderRadius: 18, overflow: 'hidden',
        border:       `1.5px solid ${hov ? '#D97706' : '#F5C84280'}`,
        boxShadow:    hov ? '0 12px 36px rgba(245,200,66,0.45)' : '0 4px 14px rgba(245,200,66,0.25)',
        transition:   'all 0.2s', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}>
      {/* Topo */}
      <div style={{ padding: '16px 18px 14px', background: `linear-gradient(135deg,${g.bg},#FFFDF0)`, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#34D399' : '#CBD5E1', boxShadow: active ? '0 0 7px #34D399' : 'none' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: active ? '#065F46' : '#94A3B8' }}>
              {active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {!active && st.lastSeenDays < 999 && (
            <span style={{ fontSize: 10, color: YELLOW, fontWeight: 600, background: 'rgba(245,200,66,0.1)', padding: '2px 8px', borderRadius: 20, border: `1px solid ${YELLOW_BORDER}` }}>
              {st.lastSeenDays}d sem interagir
            </span>
          )}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0D1B2A', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 6 }}>{st.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: g.accent, fontWeight: 700 }}>{g.icon} {st.goal}</span>
          <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{st.level}</span>
        </div>
      </div>
      {/* Stats */}
      <div style={{ padding: '14px 18px', display: 'flex', gap: 8 }}>
        {[
          { label: 'Peso',     val: st.weight ? `${st.weight}` : '—', unit: st.weight ? 'kg' : '', color: '#431C00', sub: null },
          { label: 'IMC',      val: imc.val, unit: '',                  color: imc.color,            sub: imc.label },
          { label: 'Ofensiva', val: streak.display, unit: '',           color: streak.color,         sub: (st.streak || 0) > 0 ? 'dias' : null, glow: streak.glow },
        ].map(({ label, val, unit, color, sub, glow }) => (
          <div key={label} style={{ flex: 1, borderRadius: 10, padding: '10px 6px', textAlign: 'center', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: glow ? `0 0 12px ${color}35` : 'none' }}>
            <div style={{ fontSize: 9, color: '#7C4A00', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: val.length > 5 ? 11 : 15, fontWeight: 800, color, lineHeight: 1 }}>{val}<span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>{unit}</span></div>
            {sub && <div style={{ fontSize: 8, color: '#431C00', opacity: 0.75, marginTop: 2, fontWeight: 700 }}>{sub}</div>}
          </div>
        ))}
      </div>
      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.09)', background: hov ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.2s' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#431C00' }}>Ver Perfil Completo</span>
        <span style={{ fontSize: 13, color: '#431C00', transform: hov ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s', display: 'inline-block' }}>→</span>
      </div>
    </div>
  )
}

// ── AddCard ────────────────────────────────────────────────────────────────
function AddCard({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ borderRadius: 18, minHeight: 220, border: `2px dashed ${hov ? YELLOW : 'rgba(245,200,66,0.35)'}`, background: hov ? 'linear-gradient(135deg,rgba(245,200,66,0.12),rgba(245,158,11,0.06))' : 'linear-gradient(135deg,rgba(245,200,66,0.06),rgba(245,158,11,0.02))', boxShadow: hov ? '0 8px 28px rgba(245,200,66,0.15)' : 'none', transition: 'all 0.22s', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: hov ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(245,200,66,0.15)', border: `2px solid ${hov ? YELLOW : 'rgba(245,200,66,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#431C00', transition: 'all 0.22s', boxShadow: hov ? '0 0 20px rgba(245,200,66,0.35)' : 'none' }}>+</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: hov ? YELLOW : 'rgba(245,200,66,0.6)' }}>Adicionar Aluno</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Clique para cadastrar</div>
      </div>
    </div>
  )
}

// ── WorkoutModal ───────────────────────────────────────────────────────────
function WorkoutModal({ workout, onClose, navigate }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'linear-gradient(135deg,#FEF3C7,#FBBF24)', padding: '22px 24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#7C3700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Plano de Treino</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#431C00' }}>{workout.title}</div>
              <div style={{ fontSize: 13, color: '#7C4A00', marginTop: 3, fontWeight: 600 }}>👤 {workout.studentName}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#431C00' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Status desta semana</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(workout.days || []).map(dia => {
                const s = getDayStatus(dia, workout.attendanceDates, workout.logDates)
                return (
                  <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, minWidth: 52 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{dia}</span>
                    <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {workout.workoutDays?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Divisão</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workout.workoutDays.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#F5C842,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#431C00', flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{d.day_of_week ? `${d.day_of_week} — ` : ''}{d.name}{d.focus ? ` (${d.focus})` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { onClose(); navigate('workout-editor', { studentId: workout.student_id, planId: workout.id }) }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              ✏️ Editar Treino
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── WorkoutChip ────────────────────────────────────────────────────────────
function WorkoutChip({ workout, dia, onClick }) {
  const [hov, setHov] = useState(false)
  const s        = getDayStatus(dia, workout.attendanceDates, workout.logDates)
  const initials = workout.studentName.split(' ').map(p => p[0]).slice(0, 2).join('')
  const g        = GOAL[workout.goal]
  return (
    <div onClick={() => onClick(workout)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 12, padding: '9px 10px', cursor: 'pointer', marginBottom: 7, background: hov ? 'linear-gradient(135deg,#FDE68A,#F5C842)' : 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: `1.5px solid ${hov ? '#D97706' : '#FBBF2455'}`, boxShadow: hov ? '0 6px 18px rgba(245,200,66,0.35)' : '0 2px 6px rgba(245,200,66,0.15)', transition: 'all 0.18s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: g ? g.accent : SIDEBAR_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>{initials}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#431C00' }}>{workout.studentName.split(' ')[0]}</div>
      </div>
      <div style={{ fontSize: 10, color: '#7C4A00', fontWeight: 600, marginBottom: 5, lineHeight: 1.3 }}>{workout.title}</div>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
    </div>
  )
}

// ── TabTreinos ─────────────────────────────────────────────────────────────
function TabTreinos({ workouts, navigate }) {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [modalWorkout, setModalWorkout]       = useState(null)

  const filtered       = selectedStudent ? workouts.filter(w => w.student_id === selectedStudent) : workouts
  const uniqueStudents = [...new Map(workouts.map(w => [w.student_id, { id: w.student_id, name: w.studentName }])).values()]

  return (
    <div>
      {modalWorkout && <WorkoutModal workout={modalWorkout} onClose={() => setModalWorkout(null)} navigate={navigate} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2C1500', letterSpacing: '-0.5px', marginBottom: 4 }}>Treinos da Semana</h1>
          <p style={{ fontSize: 13, color: '#92400E' }}>
            <span style={{ color: '#059669', fontWeight: 700 }}>{workouts.length} planos ativos</span>
            {' · '}{uniqueStudents.length} alunos com treino
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', borderRadius: 12, border: '1px solid rgba(245,200,66,0.3)' }}>
        <span style={{ fontSize: 11, color: '#92400E', fontWeight: 700, alignSelf: 'center', marginRight: 4 }}>👤 Filtrar:</span>
        {[{ id: null, name: 'Todos' }, ...uniqueStudents].map(opt => (
          <button key={opt.id ?? 'all'} onClick={() => setSelectedStudent(opt.id)}
            style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: selectedStudent === opt.id ? 'linear-gradient(135deg,#F5C842,#D97706)' : '#FFF', color: selectedStudent === opt.id ? '#431C00' : '#64748B', boxShadow: selectedStudent === opt.id ? '0 3px 10px rgba(245,200,66,0.4)' : '0 1px 3px rgba(0,0,0,0.07)' }}>
            {opt.name === 'Todos' ? 'Todos' : opt.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: '#FFF', borderRadius: 18, overflow: 'hidden', border: '1.5px solid rgba(245,200,66,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '2px solid #FEF3C7' }}>
          {DIAS_SEMANA.map((dia, i) => {
            const count = filtered.filter(w => (w.days || []).includes(dia)).length
            return (
              <div key={dia} style={{ padding: '14px 8px 12px', textAlign: 'center', background: i >= 5 ? 'rgba(245,200,66,0.06)' : 'transparent', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: i >= 5 ? '#D97706' : '#0D1B2A', marginBottom: 4 }}>{dia}</div>
                {count > 0 && <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00' }}>{count} treino{count > 1 ? 's' : ''}</div>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', minHeight: 260 }}>
          {DIAS_SEMANA.map((dia, i) => {
            const dayWorkouts = filtered.filter(w => (w.days || []).includes(dia))
            return (
              <div key={dia} style={{ padding: '12px 8px', background: i >= 5 ? 'rgba(245,200,66,0.03)' : 'transparent', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none' }}>
                {dayWorkouts.length === 0
                  ? <div style={{ textAlign: 'center', paddingTop: 30, color: '#E2E8F0', fontSize: 20 }}>·</div>
                  : dayWorkouts.map(w => <WorkoutChip key={w.id + dia} workout={w} dia={dia} onClick={setModalWorkout} />)
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ emoji: '👍', label: 'Feito' }, { emoji: '⏳', label: 'Ainda dá' }, { emoji: '😓', label: 'Faltou' }, { emoji: '📅', label: 'Agendado' }].map(({ emoji, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13 }}>{emoji}</span>
            <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: '#92400E', opacity: 0.6 }}>· Clique num treino para ver detalhes</span>
      </div>
    </div>
  )
}

// ── NovoAlunoModal ─────────────────────────────────────────────────────────
function NovoAlunoModal({ onSave, onClose, teacherId }) {
  const [form, setForm]     = useState({ name: '', age: '', weight: '', height: '', goal: 'Ganho de Massa', level: 'Iniciante', notes: '' })
  const [saving, setSaving] = useState(false)
  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const inp = { width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', color: '#0D1B2A', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block', marginTop: 14 }
  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('students').insert([{ ...form, age: +form.age || null, weight: +form.weight || null, height: +form.height || null, teacher_id: teacherId }])
    setSaving(false)
    onSave()
    onClose()
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0D1B2A', marginBottom: 4 }}>Novo Aluno</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Preencha os dados do aluno</div>
        {[['Nome completo', 'name', 'text', 'Ex: João Silva'], ['Idade', 'age', 'number', 'Ex: 25'], ['Peso (kg)', 'weight', 'number', 'Ex: 80'], ['Altura (cm)', 'height', 'number', 'Ex: 175']].map(([label, field, type, ph]) => (
          <div key={field}><label style={lbl}>{label}</label><input style={inp} type={type} placeholder={ph} value={form[field]} onChange={e => f(field, e.target.value)} /></div>
        ))}
        <label style={lbl}>Objetivo</label>
        <select style={inp} value={form.goal} onChange={e => f('goal', e.target.value)}>{GOALS.map(g => <option key={g}>{g}</option>)}</select>
        <label style={lbl}>Nível</label>
        <select style={inp} value={form.level} onChange={e => f('level', e.target.value)}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select>
        <label style={lbl}>Observações</label>
        <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} placeholder="Lesões, restrições..." value={form.notes} onChange={e => f('notes', e.target.value)} />
        <button onClick={save} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: 13, color: '#431C00', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
          {saving ? 'Salvando...' : 'Cadastrar Aluno'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', borderRadius: 10, padding: 13, color: '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
export default function Dashboard({ navigate, session }) {
  const [nav, setNav]             = useState('alunos')
  const [students, setStudents]   = useState([])
  const [workouts, setWorkouts]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('Todos')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const uid = session.user.id
    const { data: studs } = await supabase.from('students').select('*').eq('teacher_id', uid).order('created_at', { ascending: false })

    if (studs && studs.length > 0) {
      const ids = studs.map(s => s.id)
      const [att, prog, logs, feed, plansRes] = await Promise.all([
        supabase.from('attendance').select('student_id,date').in('student_id', ids),
        supabase.from('progress_entries').select('student_id,date').in('student_id', ids),
        supabase.from('exercise_logs').select('student_id,date').in('student_id', ids),
        supabase.from('student_feedbacks').select('student_id,date').in('student_id', ids),
        supabase.from('workout_plans').select('*, workout_days(*)').in('student_id', ids).eq('status', 'active'),
      ])

      const datesByStudent = {}
      ids.forEach(id => { datesByStudent[id] = [] })
      ;[att, prog, logs, feed].forEach(({ data }) => {
        if (data) data.forEach(r => datesByStudent[r.student_id]?.push(r.date))
      })

      // Monta mapa de dias planejados por aluno (ex: { uuid: ['Seg','Qua','Sex'] })
      const plannedDaysMap = {}
      ids.forEach(id => { plannedDaysMap[id] = [] })
      if (plansRes.data) {
        plansRes.data.forEach(p => {
          const days = (p.workout_days || []).map(d => d.day_of_week).filter(Boolean)
          plannedDaysMap[p.student_id] = [...new Set([...(plannedDaysMap[p.student_id] || []), ...days])]
        })
      }

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const enriched = studs.map(s => {
        const dates      = datesByStudent[s.id] || []
        const streak     = calcStreak(dates, plannedDaysMap[s.id] || [])
        let lastSeenDays = 999
        if (dates.length > 0) {
          const sorted = [...dates].sort((a, b) => new Date(b) - new Date(a))
          const last = new Date(sorted[0] + 'T12:00:00')
          lastSeenDays = Math.floor((today - last) / 86400000)
        }
        return { ...s, streak, lastSeenDays }
      })
      setStudents(enriched)

      // Monta workouts para a aba Treinos
      const plans = plansRes.data || []
      if (plans.length > 0) {
        const attMap = {}; const logMap = {}
        ids.forEach(id => { attMap[id] = []; logMap[id] = [] })
        if (att.data) att.data.forEach(r => attMap[r.student_id]?.push(r.date))
        if (logs.data) logs.data.forEach(r => logMap[r.student_id]?.push(r.date))

        setWorkouts(plans.map(p => {
          const st   = studs.find(s => s.id === p.student_id)
          const days = (p.workout_days || []).map(d => d.day_of_week).filter(Boolean)
          return { ...p, studentName: st?.name || '—', goal: st?.goal || '', days, workoutDays: p.workout_days || [], attendanceDates: attMap[p.student_id] || [], logDates: logMap[p.student_id] || [] }
        }))
      }
    } else {
      setStudents([])
    }
    setLoading(false)
  }

  const logout = async () => { await supabase.auth.signOut(); window.location.reload() }

  const filtered = students.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'Todos' ? true : filter === 'Ativos' ? s.lastSeenDays < 5 : filter === 'Inativos' ? s.lastSeenDays >= 5 : s.goal === filter
    return ms && mf
  })

  const ativos   = students.filter(s => s.lastSeenDays < 5).length
  const inativos = students.length - ativos

  if (loading) return <div style={{ minHeight: '100vh', background: '#F5EFE0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SIDEBAR_BG, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>Carregando...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ position: 'relative', flexShrink: 0, width: 220 }}>
        <aside style={{ width: 220, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ padding: '26px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#34D399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 3px 12px rgba(52,211,153,0.35)' }}>💪</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>TrainerApp</div>
                <div style={{ fontSize: 10, color: '#BEE3F8', fontWeight: 500 }}>Gestão de Alunos</div>
              </div>
            </div>
          </div>
          <WaveDivider />
          <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(item => <NavItem key={item.id} item={item} active={nav === item.id} onClick={() => setNav(item.id)} />)}
          </nav>
          <WaveDivider />
          <div style={{ padding: '4px 10px 26px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem item={{ id: 'perfil', icon: '👤', label: 'Meu Perfil' }}   active={false} onClick={() => navigate('teacher-profile')} />
            <NavItem item={{ id: 'sair',   icon: '🚪', label: 'Sair' }}         active={false} onClick={logout} />
          </div>
        </aside>
        {/* Onda lateral */}
        <svg viewBox="0 0 20 900" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: -18, height: '100vh', width: 20, zIndex: 10, pointerEvents: 'none' }}>
          <path d="M0,0 C10,50 10,50 0,100 C10,150 10,150 0,200 C10,250 10,250 0,300 C10,350 10,350 0,400 C10,450 10,450 0,500 C10,550 10,550 0,600 C10,650 10,650 0,700 C10,750 10,750 0,800 C10,850 10,850 0,900" fill={SIDEBAR_BG} />
        </svg>
      </div>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '32px 28px', background: '#F5EFE0', overflowY: 'auto' }}>

        {/* ABA: MEUS ALUNOS */}
        {nav === 'alunos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2C1500', letterSpacing: '-0.5px', marginBottom: 3 }}>Meus Alunos</h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>{ativos} ativos</span>{' · '}
                  <span style={{ color: YELLOW, fontWeight: 700 }}>{inativos} inativos</span>{' · '}
                  {students.length} cadastrados
                </p>
              </div>
              <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: '11px 22px', color: '#431C00', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,200,66,0.45)' }}>
                + Novo Aluno
              </button>
            </div>

            {/* Busca + Filtros */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94A3B8' }}>🔍</span>
                <input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#FFF', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0D1B2A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Todos', 'Ativos', 'Inativos', 'Ganho de Massa', 'Emagrecimento', 'Força e Performance', 'Condicionamento'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: filter === f ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : '#FFF', color: filter === f ? '#7C3700' : '#64748B', boxShadow: filter === f ? '0 3px 10px rgba(245,200,66,0.4)' : '0 1px 3px rgba(0,0,0,0.07)' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Legenda ofensiva */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, padding: '10px 16px', background: 'rgba(245,200,66,0.07)', borderRadius: 10, border: `1px solid ${YELLOW_BORDER}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: YELLOW }}>🔥 Ofensiva:</span>
              {[{ label: '1–6d', c: '#FDE68A' }, { label: '1 sem+', c: '#FCD34D' }, { label: '2 sem+', c: '#F5C842' }, { label: '1 mês+', c: '#F59E0B' }, { label: '3 mes+', c: '#EA580C' }, { label: '6 mes+', c: '#DC2626' }, { label: '1 ano 👑', c: '#D97706' }].map(({ label, c }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}80` }} />
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>

            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#92400E', opacity: 0.4 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🏋️</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Nenhum aluno cadastrado</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Clique em "+ Novo Aluno" para começar</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {filtered.map(st => <StudentCard key={st.id} st={st} onClick={() => navigate('student-detail', { id: st.id })} />)}
                {Array.from({ length: (3 - (filtered.length % 3)) % 3 }).map((_, i) => <AddCard key={'add' + i} onClick={() => setShowModal(true)} />)}
              </div>
            )}
          </div>
        )}

        {/* ABA: TREINOS */}
        {nav === 'treinos' && <TabTreinos workouts={workouts} navigate={navigate} />}

        {/* OUTRAS ABAS */}
        {nav !== 'alunos' && nav !== 'treinos' && (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#92400E', opacity: 0.35 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🚧</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Em desenvolvimento</div>
          </div>
        )}
      </main>

      {showModal && <NovoAlunoModal teacherId={session.user.id} onSave={fetchAll} onClose={() => setShowModal(false)} />}
    </div>
  )
}
