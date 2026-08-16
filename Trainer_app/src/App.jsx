import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentDetail from './pages/StudentDetail'
import WorkoutEditor from './pages/WorkoutEditor'
import StudentView from './pages/StudentView'
import ParentView from './pages/ParentView'
import TeacherProfile from './pages/TeacherProfile'
import Planner from './pages/Planner'
import AnamnesePublica from './pages/AnamnesePublica'

export default function App() {
  const [session,    setSession]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState('dashboard')
  const [pageParams, setPageParams] = useState({})

  const path = window.location.pathname

  useEffect(() => {
    // Rotas públicas — libera sem sessão
    if (path.startsWith('/novo/')  ||
        path.startsWith('/view/')  ||
        path.startsWith('/parent/')) {
      const matchView   = path.match(/^\/view\/(.+)$/)
      const matchParent = path.match(/^\/parent\/(.+)$/)
      if (matchView)   { setPage('student-view'); setPageParams({ id: matchView[1] }) }
      if (matchParent) { setPage('parent-view');  setPageParams({ id: matchParent[1] }) }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const navigate = (name, params = {}) => { setPage(name); setPageParams(params) }

  // ── Rotas públicas — render direto, sem auth ──────────────────────────────
  if (path.startsWith('/novo/')) return <AnamnesePublica token={path.split('/novo/')[1]} />

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080B12', color:'#3B82F6', fontSize:16, fontFamily:"'DM Sans',sans-serif" }}>
      Carregando...
    </div>
  )

  if (page === 'student-view') return <StudentView studentId={pageParams.id} />
  if (page === 'parent-view')  return <ParentView  studentId={pageParams.id} />
  if (!session) return <Login onLogin={() => navigate('dashboard')} />

  return (
    <>
      {page === 'dashboard'       && <Dashboard navigate={navigate} session={session} />}
      {page === 'student-detail'  && <StudentDetail navigate={navigate} studentId={pageParams.id} />}
      {page === 'workout-editor'  && <WorkoutEditor navigate={navigate} studentId={pageParams.studentId} planId={pageParams.planId} />}
      {page === 'teacher-profile' && <TeacherProfile navigate={navigate} session={session} />}
      {page === 'planner'         && <Planner navigate={navigate} studentId={pageParams.studentId} />}
    </>
  )
}
