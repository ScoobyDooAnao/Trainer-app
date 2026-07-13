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

export default function App() {
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState('dashboard')
  const [pageParams, setPageParams] = useState({})

  useEffect(() => {
    const path = window.location.pathname

    // Rotas públicas — não precisam de sessão, carregam imediatamente
    const matchView   = path.match(/^\/view\/(.+)$/)
    const matchParent = path.match(/^\/parent\/(.+)$/)

    if (matchView) {
      setPage('student-view')
      setPageParams({ id: matchView[1] })
      setLoading(false)  // libera imediatamente, sem esperar sessão
      return
    }

    if (matchParent) {
      setPage('parent-view')
      setPageParams({ id: matchParent[1] })
      setLoading(false)  // libera imediatamente, sem esperar sessão
      return
    }

    // Rotas do professor — precisam de sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const navigate = (name, params = {}) => {
    setPage(name)
    setPageParams(params)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080B12', color: '#34D399', fontSize: 18 }}>
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
      {page === 'planner' && <Planner navigate={navigate} studentId={pageParams.studentId} />}
    </>
  )
}
