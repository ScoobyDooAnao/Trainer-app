import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(student) {
  if (student?.birth_date) return Math.floor((new Date() - new Date(student.birth_date)) / (365.25 * 24 * 3600000))
  return student?.age ? parseInt(student.age) : null
}

function calcLTAD(age, expYears, sport) {
  if (!age || !sport) return null
  const exp = expYears || 0
  if (age < 9)               return { fase: 'FUNdamentals',     cor: '#3B82F6', desc: 'Habilidades motoras fundamentais e ludicidade' }
  if (age <= 11 && exp < 3)  return { fase: 'FUNdamentals',     cor: '#3B82F6', desc: 'Habilidades motoras fundamentais e ludicidade' }
  if (age <= 12)             return { fase: 'Learn to Train',   cor: '#10B981', desc: 'Aprender habilidades esportivas gerais' }
  if (age <= 15 && exp < 4)  return { fase: 'Learn to Train',   cor: '#10B981', desc: 'Aprender habilidades esportivas gerais' }
  if (age <= 16)             return { fase: 'Train to Train',   cor: '#F59E0B', desc: 'Construir base física específica ao esporte' }
  if (age <= 17 && exp < 5)  return { fase: 'Train to Train',   cor: '#F59E0B', desc: 'Construir base física específica ao esporte' }
  if (age <= 18)             return { fase: 'Train to Compete', cor: '#8B5CF6', desc: 'Especialização e desempenho competitivo' }
  return null
}

const SPORT_LABELS = {
  futebol: '⚽ Futebol', futsal: '🥅 Futsal', natacao: '🏊 Natação',
  tenis: '🎾 Tênis', basquete: '🏀 Basquete', volei: '🏐 Vôlei',
  atletismo: '🏃 Atletismo', ginastica: '🤸 Ginástica', judo: '🥋 Judô',
  ciclismo: '🚴 Ciclismo', handebol: '🤾 Handebol', saude: '🌿 Saúde e Bem-Estar',
  custom: '🏅 Outro',
}

function getFreqLast4Weeks(exerciseLogs, cardio) {
  const now = new Date()
  const weeks = [0, 0, 0, 0]
  const allDates = [
    ...(exerciseLogs || []).map(l => l.date),
    ...(cardio || []).map(c => c.date),
  ]
  allDates.forEach(d => {
    const daysAgo = Math.floor((now - new Date(d + 'T12:00:00')) / 86400000)
    const wk = Math.floor(daysAgo / 7)
    if (wk >= 0 && wk < 4) weeks[wk]++
  })
  return weeks.reverse() // oldest → newest
}

// ── CSS injection ─────────────────────────────────────────────────────────────
function ParentCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #F8F6F1; }
      .pv-root { font-family: 'DM Sans', sans-serif; background: #F8F6F1; min-height: 100vh; }
      .pv-fade { animation: pvFade 0.5s ease both; }
      .pv-slide { animation: pvSlide 0.45s ease both; }
      @keyframes pvFade  { from { opacity:0 } to { opacity:1 } }
      @keyframes pvSlide { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      .pv-card { background:#fff; border-radius:20px; padding:24px; box-shadow:0 2px 16px rgba(0,0,0,0.06); }
      .pv-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:600; }
      .pv-bar-track { height:8px; border-radius:99px; background:#F0EDE8; overflow:hidden; }
      .pv-bar-fill  { height:100%; border-radius:99px; transition: width 1s cubic-bezier(.4,0,.2,1); }
      .pv-week-dot  { width:36px; height:36px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
      .pv-whatsapp-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:16px; border-radius:16px; background:#22C55E; color:#fff; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; border:none; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 20px rgba(34,197,94,0.35); }
      .pv-whatsapp-btn:hover { background:#16A34A; transform:translateY(-1px); box-shadow:0 6px 24px rgba(34,197,94,0.45); }
      .pv-section-title { font-family:'DM Serif Display',serif; font-size:22px; color:#1A1A2E; margin-bottom:4px; }
    `}</style>
  )
}

// ── Frequency Chart ───────────────────────────────────────────────────────────
function FreqChart({ weeks }) {
  const labels = ['3 sem atrás', '2 sem atrás', 'Sem passada', 'Esta semana']
  const max = Math.max(...weeks, 1)
  const colors = ['#D1D5DB', '#9CA3AF', '#6B7280', '#10B981']

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 90 }}>
      {weeks.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: v > 0 ? colors[i] : '#D1D5DB' }}>{v}x</div>
          <div style={{
            width: '100%', borderRadius: 8,
            height: `${Math.max((v / max) * 60, v > 0 ? 12 : 4)}px`,
            background: v > 0 ? colors[i] : '#F0EDE8',
            transition: 'height 1s cubic-bezier(.4,0,.2,1)',
          }} />
          <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.2 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal }) {
  const pct = goal.target_value && goal.current_value != null
    ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100) : null
  const statusColor = goal.status === 'concluida' ? '#10B981' : '#F59E0B'

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #F0EDE8', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: goal.status === 'concluida' ? '#ECFDF5' : '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {goal.status === 'concluida' ? '⭐' : '🎯'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>{goal.title}</div>
        {goal.status === 'concluida' ? (
          <span className="pv-pill" style={{ background: '#ECFDF5', color: '#059669' }}>✓ Conquistada</span>
        ) : pct != null ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{goal.current_value} / {goal.target_value} {goal.target_unit}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{pct}%</span>
            </div>
            <div className="pv-bar-track">
              <div className="pv-bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#3B82F6' }} />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>Em andamento</span>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ParentView({ studentId }) {
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [student, setStudent]   = useState(null)
  const [teacher, setTeacher]   = useState(null)
  const [plan, setPlan]         = useState(null)
  const [goals, setGoals]       = useState([])
  const [logs, setLogs]         = useState([])
  const [cardio, setCardio]     = useState([])
  const [progress, setProgress] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        // Student
        const { data: st, error: stErr } = await supabase
          .from('students')
          .select('id,name,age,weight,height,goal,level,sport,sport_position,experience_years,guardian_name,teacher_id,notes')
          .eq('id', studentId).single()

        if (stErr || !st) { setError('Aluno não encontrado.'); setLoading(false); return }
        setStudent(st)

        // All other data in parallel
        const [tRes, plRes, gsRes, logsRes, cardioRes, progRes] = await Promise.all([
          supabase.from('teacher_profiles').select('display_name,emoji,cref,whatsapp').eq('id', st.teacher_id).single(),
          supabase.from('workout_plans').select('*, workout_days(*, exercises(*))').eq('student_id', studentId).eq('status', 'active').order('updated_at', { ascending: false }).limit(1),
          supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
          supabase.from('exercise_logs').select('date').eq('student_id', studentId).order('date', { ascending: false }).limit(200),
          supabase.from('cardio_sessions').select('date,duration_minutes,type,pse').eq('student_id', studentId).order('date', { ascending: false }).limit(60),
          supabase.from('progress_entries').select('date,weight').eq('student_id', studentId).order('date', { ascending: false }).limit(1),
        ])

        if (tRes.data) setTeacher(tRes.data)
        if (plRes.data?.[0]) setPlan(plRes.data[0])
        if (gsRes.data) setGoals(gsRes.data)
        if (logsRes.data) setLogs(logsRes.data)
        if (cardioRes.data) setCardio(cardioRes.data)
        if (progRes.data) setProgress(progRes.data)
      } catch (e) {
        setError('Erro ao carregar. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) return (
    <div className="pv-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <ParentCSS />
      <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 14, color: '#6B7280' }}>Carregando acompanhamento...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error || !student) return (
    <div className="pv-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <ParentCSS />
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 16, color: '#EF4444', fontWeight: 600 }}>{error || 'Página não encontrada'}</div>
    </div>
  )

  const age       = calcAge(student)
  const ltad      = calcLTAD(age, student.experience_years, student.sport)
  const sportLabel = SPORT_LABELS[student.sport] || student.sport || '—'
  const freqWeeks = getFreqLast4Weeks(logs, cardio)
  const totalSessions = freqWeeks.reduce((a, b) => a + b, 0)
  const activeDays = plan?.workout_days?.length || 0
  const activeGoals = goals.filter(g => g.status === 'ativa')
  const wonGoals = goals.filter(g => g.status === 'concluida')
  const lastWeight = progress[0]?.weight || student.weight
  const lastSeen = logs[0]?.date || cardio[0]?.date
  const daysSinceActivity = lastSeen
    ? Math.floor((new Date() - new Date(lastSeen + 'T12:00:00')) / 86400000)
    : null
  const activityStatus = daysSinceActivity == null ? null
    : daysSinceActivity === 0 ? { label: 'Treinou hoje', color: '#10B981', bg: '#ECFDF5' }
    : daysSinceActivity === 1 ? { label: 'Treinou ontem', color: '#10B981', bg: '#ECFDF5' }
    : daysSinceActivity <= 4  ? { label: `Há ${daysSinceActivity} dias`, color: '#F59E0B', bg: '#FFFBEB' }
    : { label: `${daysSinceActivity}d sem treinar`, color: '#EF4444', bg: '#FEF2F2' }

  const whatsappMsg = encodeURIComponent(`Olá ${teacher?.display_name || 'professor'}! Sou responsável pelo atleta ${student.name} e gostaria de conversar sobre seu acompanhamento.`)
  const whatsappUrl = teacher?.whatsapp
    ? `https://wa.me/55${teacher.whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`
    : null

  return (
    <div className="pv-root">
      <ParentCSS />

      {/* ── Header ── */}
      <div style={{ background: '#1A1A2E', padding: '0 0 32px', position: 'relative', overflow: 'hidden' }}>
        {/* decorative field lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.04 }} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="100" r="60" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="100" r="4" fill="white" />
          <line x1="200" y1="0" x2="200" y2="200" stroke="white" strokeWidth="1.5" />
          <rect x="10" y="60" width="40" height="80" fill="none" stroke="white" strokeWidth="1.5" />
          <rect x="350" y="60" width="40" height="80" fill="none" stroke="white" strokeWidth="1.5" />
          <rect x="0" y="0" width="400" height="200" fill="none" stroke="white" strokeWidth="2" />
        </svg>

        <div style={{ position: 'relative', zIndex: 1, padding: '28px 24px 0' }}>
          {/* Coach badge */}
          {teacher && (
            <div className="pv-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>{teacher.emoji || '💪'}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {teacher.display_name || 'Seu professor'}
                {teacher.cref && <span style={{ opacity: 0.5 }}> · CREF {teacher.cref}</span>}
              </span>
            </div>
          )}

          {/* Athlete name */}
          <div className="pv-slide" style={{ animationDelay: '0.05s' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Acompanhamento do Atleta
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
              {student.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {age && (
                <span className="pv-pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  {age} anos
                </span>
              )}
              {student.sport && (
                <span className="pv-pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  {sportLabel}
                </span>
              )}
              {ltad && (
                <span className="pv-pill" style={{ background: `${ltad.cor}25`, color: ltad.cor, border: `1px solid ${ltad.cor}40` }}>
                  {ltad.fase}
                </span>
              )}
              {activityStatus && (
                <span className="pv-pill" style={{ background: activityStatus.bg, color: activityStatus.color }}>
                  {activityStatus.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="pv-slide" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, margin: '24px 0 0', background: 'rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Sessões (4 sem)', val: totalSessions, icon: '🏃' },
            { label: 'Dias/semana',     val: activeDays || '—', icon: '📅' },
            { label: 'Metas ativas',    val: activeGoals.length, icon: '🎯' },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ padding: '16px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>

        {/* Frequência */}
        <div className="pv-card pv-slide" style={{ animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <div>
              <div className="pv-section-title">Frequência</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Sessões registradas nas últimas 4 semanas</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1A1A2E' }}>{totalSessions}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>sessões</div>
            </div>
          </div>
          <FreqChart weeks={freqWeeks} />
          {totalSessions === 0 && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', fontSize: 12, color: '#EF4444' }}>
              Nenhuma sessão registrada nas últimas 4 semanas
            </div>
          )}
        </div>

        {/* Plano de treino */}
        {plan && (
          <div className="pv-card pv-slide" style={{ animationDelay: '0.2s' }}>
            <div style={{ marginBottom: 16 }}>
              <div className="pv-section-title">Plano Ativo</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Estrutura do treino atual</div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginBottom: 14 }}>{plan.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(plan.workout_days || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((day, i) => {
                const exCount = (day.exercises || []).length
                const types = [...new Set((day.exercises || []).map(e => e.type).filter(Boolean))]
                const dotColors = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4']
                return (
                  <div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#F8F6F1' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: dotColors[i % dotColors.length] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: dotColors[i % dotColors.length], flexShrink: 0 }}>
                      {day.day_of_week?.slice(0, 3) || `D${i+1}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{day.title || `Treino ${i+1}`}</div>
                      {types.length > 0 && (
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{types.slice(0, 3).join(' · ')}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{exCount} exerc.</div>
                  </div>
                )
              })}
            </div>
            {activeDays > 0 && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', fontSize: 12, color: '#059669', fontWeight: 500 }}>
                ✅ {activeDays} treino{activeDays > 1 ? 's' : ''}/semana planejado{activeDays > 1 ? 's' : ''} — frequência adequada para a fase de desenvolvimento
              </div>
            )}
          </div>
        )}

        {/* Metas */}
        {goals.length > 0 && (
          <div className="pv-card pv-slide" style={{ animationDelay: '0.25s' }}>
            <div style={{ marginBottom: 4 }}>
              <div className="pv-section-title">Metas</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {wonGoals.length > 0 && `${wonGoals.length} conquistada${wonGoals.length > 1 ? 's' : ''} · `}{activeGoals.length} em andamento
              </div>
            </div>
            {goals.slice(0, 5).map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        )}

        {/* Peso/Medidas */}
        {lastWeight && (
          <div className="pv-card pv-slide" style={{ animationDelay: '0.3s' }}>
            <div style={{ marginBottom: 14 }}>
              <div className="pv-section-title">Físico</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Dados corporais mais recentes</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Peso', val: lastWeight ? `${lastWeight} kg` : '—' },
                { label: 'Altura', val: student.height ? `${student.height} cm` : '—' },
              ].map(({ label, val }) => (
                <div key={label} style={{ padding: '14px 16px', borderRadius: 14, background: '#F8F6F1' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fase LTAD explicada para o pai */}
        {ltad && (
          <div className="pv-card pv-slide" style={{ animationDelay: '0.35s', border: `1.5px solid ${ltad.cor}25`, background: `${ltad.cor}08` }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${ltad.cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏅</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ltad.cor, marginBottom: 4 }}>Fase de Desenvolvimento: {ltad.fase}</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{ltad.desc}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                  Modelo LTAD (Long-Term Athlete Development) — Balyi 2013. O treino é periodizado para esta fase específica.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observações do professor */}
        {student.notes && (
          <div className="pv-card pv-slide" style={{ animationDelay: '0.38s' }}>
            <div style={{ marginBottom: 12 }}>
              <div className="pv-section-title">Observações do Professor</div>
            </div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, padding: '12px 14px', background: '#FFFBEB', borderRadius: 12, borderLeft: '3px solid #F59E0B' }}>
              {student.notes}
            </div>
          </div>
        )}

        {/* Fale com o professor */}
        <div className="pv-card pv-slide" style={{ animationDelay: '0.4s' }}>
          <div style={{ marginBottom: 16 }}>
            <div className="pv-section-title">Fale com o Professor</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Dúvidas sobre o treino ou a evolução do seu filho</div>
          </div>
          {whatsappUrl ? (
            <button className="pv-whatsapp-btn" onClick={() => window.open(whatsappUrl, '_blank')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar mensagem no WhatsApp
            </button>
          ) : (
            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F8F6F1', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
              Professor ainda não cadastrou o WhatsApp no perfil
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '8px 0 32px' }}>
          <div style={{ fontSize: 11, color: '#D1D5DB' }}>
            {teacher?.display_name || 'Personal Trainer'} · Acompanhamento Esportivo Personalizado
          </div>
        </div>
      </div>
    </div>
  )
}
