import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { criarAlunoPendente, confirmarMatricula, rejeitarCandidato } from './alunos'

/**
 * Query keys centralizadas. Toda leitura relacionada a essas entidades
 * deve usar essas chaves para que a invalidação nas mutações funcione.
 */
export const qk = {
  students:      (teacherId) => ['students', teacherId],
  student:       (studentId) => ['student', studentId],
  notificacoes:  (teacherId) => ['notificacoes', teacherId],
  avaliacoes:    (studentId) => ['avaliacoes', studentId],
}

/** Cria aluno pendente e invalida a lista de alunos + notificações do professor. */
export function useCriarAlunoPendente(teacherId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args) => criarAlunoPendente(args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.students(teacherId) })
      qc.invalidateQueries({ queryKey: qk.notificacoes(teacherId) })
    },
  })
}

/** Confirma matrícula: invalida aluno, lista de alunos e notificações. */
export function useConfirmarMatricula(teacherId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId) => confirmarMatricula(studentId),
    onSuccess: (_data, studentId) => {
      qc.invalidateQueries({ queryKey: qk.student(studentId) })
      qc.invalidateQueries({ queryKey: qk.students(teacherId) })
      qc.invalidateQueries({ queryKey: qk.notificacoes(teacherId) })
    },
  })
}

/** Rejeita candidato: invalida lista de alunos e notificações. */
export function useRejeitarCandidato(teacherId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, notifId }) => rejeitarCandidato(studentId, notifId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.students(teacherId) })
      qc.invalidateQueries({ queryKey: qk.notificacoes(teacherId) })
    },
  })
}

/** Salva uma avaliação física (medida ou teste) e invalida o histórico do aluno. */
export function useSalvarAvaliacao(studentId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => supabase.from('measure_logs').insert([payload]).select().single(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.avaliacoes(studentId) })
    },
  })
}
