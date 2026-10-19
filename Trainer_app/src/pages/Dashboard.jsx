import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { criarAlunoPendente, STUDENT_STATUS } from '../lib/alunos'
import { useConfirmarMatricula, useRejeitarCandidato } from '../lib/queries'
import { useAppNavigate } from '../lib/useAppNavigate'
import TabEscolinha from './TabEscolinha'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { SIDEBAR_BG, YELLOW, INACTIVE_THRESHOLD_DAYS, NAV, calcStreak } from '../lib/dashboardShared'
import { SkyBackground, WaveDivider } from '../components/backgrounds/DashboardBackground'
import { NavItem, DashboardMobileCSS, MobileBottomNav } from '../components/shared/DashboardUI'
import { StudentCard, AddCard, NovoAlunoModal } from '../components/students/StudentsTab'
import { TabTreinos } from '../components/treinos/TreinosTab'
import { TabEvolucao } from '../components/evolucao/EvolucaoTab'
import { TabCardio } from '../components/cardio/ProfessorCardioTab'
import { TabPlanejamento } from '../components/planejamento/PlanejamentoTab'
import { NotificacoesPanel } from '../components/notifications/NotificacoesPanel'

const useIsMobile = () => { const [m,setM]=useState(()=>window.innerWidth<768); useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h)},[]);return m }


const GOALS  = ['Ganho de Massa', 'Emagrecimento', 'Condicionamento', 'Força e Performance', 'Saúde e Bem-Estar', 'Iniciação Esportiva', 'Desenvolvimento Atlético', 'Treinamento Competitivo']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Atleta Jovem', 'Atleta Competitivo']


 // doc Fase 3: Inativo se sem interação > 7 dias


export default function Dashboard({ session }) {
  const navigate = useAppNavigate()
  const confirmarMatriculaMut = useConfirmarMatricula(session?.user?.id)
  const rejeitarCandidatoMut  = useRejeitarCandidato(session?.user?.id)
  const [nav, setNav]             = useState('alunos')
  const [notifs,      setNotifs]      = useState([])
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [students, setStudents]   = useState([])
  const [workouts, setWorkouts]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('Todos')
  const [sortBy, setSortBy]       = useState('recente')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchAll(); fetchNotifs() }, [])

  const fetchNotifs = async () => {
    const { data } = await supabase.from('notificacoes')
      .select('*').eq('teacher_id', session.user.id)
      .order('data', { ascending: false }).limit(20)
    setNotifs(data || [])
  }

  const fetchAll = async () => {
    setLoading(true)
    const uid = session.user.id
    const { data: studs } = await supabase.from('students').select('*').eq('teacher_id', uid).eq('status', STUDENT_STATUS.ATIVO).order('created_at', { ascending: false })

    if (studs && studs.length > 0) {
      const ids = studs.map(s => s.id)
      const [att, prog, logs, feed, plansRes, anam, measures] = await Promise.all([
        supabase.from('attendance').select('student_id,date').in('student_id', ids),
        supabase.from('progress_entries').select('student_id,date,weight').in('student_id', ids).order('date', { ascending: false }),
        supabase.from('exercise_logs').select('student_id,date,day_id,is_makeup,scheduled_day').in('student_id', ids),
        supabase.from('student_feedbacks').select('student_id,date').in('student_id', ids),
        supabase.from('workout_plans').select('id,student_id,title,status,updated_at').in('student_id', ids).eq('status', 'active'),
        supabase.from('anamnese').select('student_id,objetivo_estetico').in('student_id', ids),
        supabase.from('measure_logs').select('student_id,date,waist,tests').in('student_id', ids).order('date', { ascending:false }),
      ])

      const datesByStudent = {}
      ids.forEach(id => { datesByStudent[id] = [] })
      ;[att, prog, logs, feed].forEach(({ data }) => {
        if (data) data.forEach(r => datesByStudent[r.student_id]?.push(r.date))
      })

      // Peso mais recente por aluno (de progress_entries — fonte da verdade)
      const latestWeightMap = {}
      if (prog.data) {
        prog.data.forEach(r => {
          if (r.weight && !latestWeightMap[r.student_id]) {
            latestWeightMap[r.student_id] = +r.weight
          }
        })
      }

      // Monta mapa de dias planejados por aluno (ex: { uuid: ['Seg','Qua','Sex'] })
      const plannedDaysMap = {}
      ids.forEach(id => { plannedDaysMap[id] = [] })
      // workout_days não mais no join — plannedDaysMap vazio por ora (ok, streak ainda funciona via logs)
      if (plansRes.data) {
        plansRes.data.forEach(p => {
          plannedDaysMap[p.student_id] = plannedDaysMap[p.student_id] || []
        })
      }

      const objEspecificoMap = {}
      if (anam.data) anam.data.forEach(a => { objEspecificoMap[a.student_id] = a.objetivo_estetico })

      // ── Métrica-base por objetivo (Fase 3.1) ──
      // Emagrecimento -> Waist-to-Height Ratio (WHtR) via measure_logs.waist
      // Ganho de Massa -> 1RM (supino/legpress) via measure_logs.tests
      // Saúde/Bem-Estar -> VO2 Máx via measure_logs.tests
      // Força e Performance (atletas de rendimento) -> fora por enquanto
      const measuresByStudent = {}
      ;(measures.data || []).forEach(m => {
        if (!measuresByStudent[m.student_id]) measuresByStudent[m.student_id] = []
        measuresByStudent[m.student_id].push(m)
      })
      const metricaBase = {}
      Object.entries(measuresByStudent).forEach(([sid, regs]) => {
        const st = studs.find(s => s.id === sid)
        if (!st) return
        if (st.goal === 'Emagrecimento') {
          const comWaist = regs.find(r => r.waist)
          if (comWaist && st.height) {
            const whtr = (comWaist.waist / st.height).toFixed(2)
            metricaBase[sid] = { label: 'WHtR (Cintura/Altura)', value: whtr }
          }
        } else if (st.goal === 'Ganho de Massa') {
          const comRM = regs.find(r => r.tests && Object.keys(r.tests).some(k => /rm/i.test(k)))
          if (comRM) {
            const key = Object.keys(comRM.tests).find(k => /rm/i.test(k))
            metricaBase[sid] = { label: key, value: comRM.tests[key] }
          }
        } else if (st.goal === 'Saúde e Bem-Estar') {
          const comVO2 = regs.find(r => r.tests && Object.keys(r.tests).some(k => /vo2/i.test(k)))
          if (comVO2) {
            const key = Object.keys(comVO2.tests).find(k => /vo2/i.test(k))
            metricaBase[sid] = { label: key, value: comVO2.tests[key] }
          }
        }
        // 'Força e Performance' (atletas de rendimento) fica de fora por enquanto
      })

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
        const latestW = latestWeightMap[s.id]
        const weight  = latestW ?? s.weight  // progress_entries tem prioridade
        const height  = s.height
        const imc     = (weight && height) ? +(weight / ((height / 100) ** 2)).toFixed(1) : null
        return { ...s, weight, imc_calc: imc, streak, lastSeenDays, objetivo_especifico: objEspecificoMap[s.id] || null, metrica_base: metricaBase[s.id] || null }
      })
      setStudents(enriched)

      // Monta workouts para o Cronograma
      const plans = plansRes.data || []
      if (plans.length > 0) {
        const attMap = {}; const logMap = {}
        ids.forEach(id => { attMap[id] = []; logMap[id] = [] })
        if (att.data) att.data.forEach(r => attMap[r.student_id]?.push(r.date))
        const makeupMap = {} // student_id -> [dia_semana que foi recuperado]
        ids.forEach(id => { makeupMap[id] = [] })
        if (logs.data) logs.data.forEach(r => {
          logMap[r.student_id]?.push(r.date)
          if (r.is_makeup && r.scheduled_day) {
            makeupMap[r.student_id]?.push(r.scheduled_day)
            // Adicionar também a data do dia original para o streak contar
            const logDate = new Date(r.date + 'T12:00:00')
            const DIA_JS = { Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6,Dom:0 }
            const targetDayJS = DIA_JS[r.scheduled_day]
            if (targetDayJS !== undefined) {
              const scheduled = new Date(logDate)
              const diff = targetDayJS - logDate.getDay()
              scheduled.setDate(scheduled.getDate() + diff)
              logMap[r.student_id]?.push(scheduled.toISOString().slice(0,10))
            }
          }
        })

        // Buscar dias da semana de cada plano (leve — só day_of_week e name)
        const planIds = plans.map(p => p.id)
        const { data: wDays } = await supabase
          .from('workout_days')
          .select('plan_id, day_of_week, name, focus')
          .in('plan_id', planIds)

        // Montar mapa planId → dias e workoutDays
        const daysMap = {}
        const wdMap   = {}
        planIds.forEach(pid => { daysMap[pid] = []; wdMap[pid] = [] })
        if (wDays) {
          wDays.forEach(d => {
            if (d.day_of_week) daysMap[d.plan_id]?.push(d.day_of_week)
            wdMap[d.plan_id]?.push(d)
          })
        }

        setWorkouts(plans.map(p => {
          const st = studs.find(s => s.id === p.student_id)
          return {
            ...p,
            studentName: st?.name || '—',
            goal: st?.goal || '',
            days: [...new Set(daysMap[p.id] || [])],
            workoutDays: wdMap[p.id] || [],
            attendanceDates: attMap[p.student_id] || [],
            logDates: logMap[p.student_id] || [],
            makeupDays: makeupMap[p.student_id] || [],
          }
        }))
      }
    } else {
      setStudents([])
    }
    setLoading(false)
  }

  const markRead = async () => {
    // Only mark generic notifications as read — not nova_anamnese (candidatures)
    await supabase.from('notificacoes').update({ lida: true })
      .eq('teacher_id', session.user.id).eq('lida', false).neq('tipo','nova_anamnese')
    setNotifs(p => p.map(n => n.tipo === 'nova_anamnese' ? n : { ...n, lida: true }))
  }

  const rejeitarAluno = (notif) => {
    if (!window.confirm('Recusar este candidato? O perfil será marcado como rejeitado.')) return
    rejeitarCandidatoMut.mutate({ studentId: notif.payload?.student_id, notifId: notif.id }, {
      onSuccess: () => { setNotifs(p => p.filter(n => n.id !== notif.id)); fetchAll() },
      onError:   (err) => alert('Não foi possível rejeitar: ' + err.message),
    })
  }

  const confirmarAluno = (notif) => {
    confirmarMatriculaMut.mutate(notif.payload?.student_id, {
      onSuccess: () => { setNotifs(p => p.map(n => n.id === notif.id ? { ...n, lida: true } : n)); fetchAll() },
      onError:   (err) => alert('Não foi possível confirmar: ' + err.message),
    })
  }

  const logout = async () => { await supabase.auth.signOut(); window.location.reload() }

  const filtered = students.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'Todos' ? true : filter === 'Ativos' ? s.lastSeenDays <= INACTIVE_THRESHOLD_DAYS : filter === 'Inativos' ? s.lastSeenDays > INACTIVE_THRESHOLD_DAYS : s.goal === filter
    return ms && mf
  }).sort((a, b) => {
    if (sortBy === 'alfabetica')   return a.name.localeCompare(b.name)
    if (sortBy === 'ofensiva')     return (b.streak || 0) - (a.streak || 0)
    if (sortBy === 'sem_treinar')  return (b.lastSeenDays ?? 999) - (a.lastSeenDays ?? 999)
    return new Date(b.created_at) - new Date(a.created_at) // 'recente' (padrão)
  })

  const ativos   = students.filter(s => s.lastSeenDays <= INACTIVE_THRESHOLD_DAYS).length
  const inativos = students.length - ativos

  const isMobile = useIsMobile()

  if (loading) return <div style={{ minHeight: '100vh', background: 'linear-gradient(175deg,#4AB8E8,#B3E5F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>Carregando...</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans','Segoe UI',sans-serif", position: 'relative' }}>
      <DashboardMobileCSS />
      <SkyBackground />

      {/* SIDEBAR */}
      <div className="db-sidebar" style={{ position: 'relative', flexShrink: 0, width: 220, zIndex: 2 }}>
        <aside style={{ width: 220, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ padding: '26px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#34D399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 12px rgba(52,211,153,0.35)' }}><svg width='18' height='18' viewBox='0 0 24 24' fill='white'><path d='M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z'/></svg></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>TrainerApp</div>
                <div style={{ fontSize: 10, color: '#BEE3F8', fontWeight: 500 }}>Gestão de Alunos</div>
              </div>
              <button onClick={() => { setShowNotifs(true); markRead(); fetchNotifs() }}
                style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:4, flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                {notifs.filter(n=>!n.lida).length > 0 && (
                  <span style={{ position:'absolute', top:2, right:2, width:8, height:8, borderRadius:'50%', background:'#EF4444', border:'2px solid rgba(0,0,0,0.3)' }}/>
                )}
              </button>
            </div>
          </div>
          <WaveDivider />
          <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(item => <NavItem key={item.id} item={item} active={nav === item.id} onClick={() => setNav(item.id)} />)}
          </nav>
          <WaveDivider />
          <div style={{ padding: '4px 10px 26px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem item={{ id: 'biblioteca', icon: null, label: 'Biblioteca de Exercícios' }} active={false} onClick={() => navigate('exercise-library')} />
            <NavItem item={{ id: 'perfil', icon: null, label: 'Meu Perfil' }}   active={false} onClick={() => navigate('teacher-profile')} />
            <NavItem item={{ id: 'sair',   icon: '', label: 'Sair' }}         active={false} onClick={logout} />
          </div>
        </aside>
        {/* Onda lateral */}
        <svg viewBox="0 0 20 900" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: -18, height: '100vh', width: 20, zIndex: 10, pointerEvents: 'none' }}>
          <path d="M0,0 C10,50 10,50 0,100 C10,150 10,150 0,200 C10,250 10,250 0,300 C10,350 10,350 0,400 C10,450 10,450 0,500 C10,550 10,550 0,600 C10,650 10,650 0,700 C10,750 10,750 0,800 C10,850 10,850 0,900" fill={SIDEBAR_BG} />
        </svg>
      </div>

      {/* MAIN */}
      <main className="db-main" style={{ flex: 1, padding: '32px 28px', background: 'transparent', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* ABA: MEUS ALUNOS */}
        {nav === 'alunos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 3, textShadow:'0 1px 3px rgba(255,255,255,0.5)' }}>Meus Alunos</h1>
                <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight:600 }}>
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
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94A3B8' }}></span>
                <input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: 10, fontSize: 13, color: '#0D1B2A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backdropFilter:'blur(6px)' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Todos', 'Ativos', 'Inativos', 'Ganho de Massa', 'Emagrecimento', 'Força e Performance', 'Condicionamento'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: filter === f ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(255,255,255,0.7)', color: filter === f ? '#7C3700' : '#64748B', boxShadow: filter === f ? '0 3px 10px rgba(245,200,66,0.4)' : '0 1px 3px rgba(0,0,0,0.07)' }}>
                    {f}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#0C4A6E', background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.9)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option value="recente">Mais recente</option>
                <option value="sem_treinar">Mais tempo sem treinar</option>
                <option value="alfabetica">Alfabética</option>
                <option value="ofensiva">Maior ofensiva</option>
              </select>
            </div>

            {/* Legenda ofensiva */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, padding: '10px 16px', background: 'rgba(255,255,255,0.45)', borderRadius: 10, border: `1px solid rgba(255,255,255,0.7)`, backdropFilter:'blur(6px)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0C4A6E' }}>Ofensiva:</span>
              {[{ label: '1–6d', c: '#FDE68A' }, { label: '1 sem+', c: '#FCD34D' }, { label: '2 sem+', c: '#F5C842' }, { label: '1 mês+', c: '#F59E0B' }, { label: '3 mes+', c: '#EA580C' }, { label: '6 mes+', c: '#DC2626' }, { label: '1 ano ', c: '#D97706' }].map(({ label, c }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}80` }} />
                  <span style={{ fontSize: 10, color: '#0C4A6E', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>

            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#0C4A6E', opacity: 0.5 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}></div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Nenhum aluno cadastrado</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Clique em "+ Novo Aluno" para começar</div>
              </div>
            ) : (
              <div className="db-students-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {filtered.map(st => <StudentCard key={st.id} st={st} onClick={() => navigate('student-detail', { id: st.id })} onDelete={(deletedId) => { setStudents(p => p.filter(s => s.id !== deletedId)); fetchAll() }} />)}
                {Array.from({ length: (3 - (filtered.length % 3)) % 3 }).map((_, i) => <AddCard key={'add' + i} onClick={() => setShowModal(true)} />)}
              </div>
            )}
          </div>
        )}

        {/* ABA: TREINOS */}
        {nav === 'treinos' && <TabTreinos workouts={workouts} navigate={navigate} session={session} />}

        {/* ABA: EVOLUÇÃO */}
        {nav === 'evolucao' && <TabEvolucao students={students} />}

        {/* ABA: CÁRDIO */}
        {nav === 'cardio' && <TabCardio students={students} />}

        {nav === 'escolinha' && (
          <TabEscolinha session={session} students={students} />
        )}

        {/* ABA: PLANEJAMENTO */}
        {nav === 'planejamento' && (
          <TabPlanejamento students={students} navigate={navigate} session={session} />
        )}

        {/* OUTRAS ABAS */}
        {nav !== 'alunos' && nav !== 'treinos' && nav !== 'evolucao' && nav !== 'cardio' && nav !== 'escolinha' && (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#0C4A6E', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}></div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Em desenvolvimento</div>
          </div>
        )}
      </main>

      {showModal && <NovoAlunoModal teacherId={session.user.id} onSave={fetchAll} onClose={() => setShowModal(false)} />}
      {showNotifs && (
        <NotificacoesPanel
          notifs={notifs}
          navigate={navigate}
          onClose={() => setShowNotifs(false)}
          onMarkRead={markRead}
          onConfirm={confirmarAluno}
          onReject={rejeitarAluno}
        />
      )}
      <MobileBottomNav nav={nav} setNav={setNav} navigate={navigate} logout={logout} />
    </div>
  )
}
