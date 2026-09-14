import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
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

// ── Wrappers que leem params da URL e repassam no formato que cada página já espera ──
function AnamnesePublicaRoute() {
  const { token } = useParams()
  return <AnamnesePublica token={token} />
}
function StudentViewRoute() {
  const { studentId } = useParams()
  return <StudentView studentId={studentId} />
}
function ParentViewRoute() {
  const { studentId } = useParams()
  return <ParentView studentId={studentId} />
}

function Loading() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080B12', color:'#3B82F6', fontSize:16, fontFamily:"'DM Sans',sans-serif" }}>
      Carregando...
    </div>
  )
}

// ── Layout protegido: exige sessão Supabase, senão manda pro login ──
function ProtectedLayout({ session, loading, children }) {
  if (loading) return <Loading />
  if (!session) return <Login onLogin={() => {}} />
  // Sessão atualiza via onAuthStateChange no App — a rota originalmente
  // acessada (deep link) é preservada, sem redirecionar para /dashboard.
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rotas públicas — resolvidas ANTES de qualquer sessão/loading ── */}
        <Route path="/novo/:token" element={<AnamnesePublicaRoute />} />
        <Route path="/view/:studentId" element={<StudentViewRoute />} />
        <Route path="/parent/:studentId" element={<ParentViewRoute />} />

        {/* ── Rotas autenticadas ── */}
        <Route path="/dashboard" element={
          <ProtectedLayout session={session} loading={loading}><Dashboard session={session} /></ProtectedLayout>
        } />
        <Route path="/students/:id" element={
          <ProtectedLayout session={session} loading={loading}><StudentDetail /></ProtectedLayout>
        } />
        <Route path="/workout/:studentId/:planId" element={
          <ProtectedLayout session={session} loading={loading}><WorkoutEditor /></ProtectedLayout>
        } />
        <Route path="/planner/:studentId" element={
          <ProtectedLayout session={session} loading={loading}><Planner /></ProtectedLayout>
        } />
        <Route path="/perfil" element={
          <ProtectedLayout session={session} loading={loading}><TeacherProfile session={session} /></ProtectedLayout>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
