import { useNavigate } from 'react-router-dom'

/**
 * Mapa do modelo antigo de roteamento por estado (navigate('nome', params))
 * para rotas reais do React Router. Existe para migrar para rotas
 * declarativas sem precisar reescrever todos os call-sites de navigate()
 * espalhados pelas páginas.
 */
const ROUTES = {
  'dashboard':       () => '/dashboard',
  'student-detail':  (p) => `/students/${p.id}`,
  'workout-editor':  (p) => `/workout/${p.studentId}/${p.planId}`,
  'teacher-profile': () => '/perfil',
  'planner':         (p) => `/planner/${p.studentId}`,
  'exercise-library':() => '/biblioteca-exercicios',
}

export function useAppNavigate() {
  const rrNavigate = useNavigate()
  return (name, params = {}) => {
    const build = ROUTES[name]
    if (!build) {
      console.error('useAppNavigate: rota desconhecida ->', name)
      return
    }
    rrNavigate(build(params))
  }
}
