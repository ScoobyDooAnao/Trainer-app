import { supabase } from '../supabase'

/** Valores canônicos de status — nunca usar strings soltas 'pendente'/'ativo'/'rejeitado' fora daqui. */
export const STUDENT_STATUS = {
  PENDENTE:  'pendente',
  ATIVO:     'ativo',
  REJEITADO: 'rejeitado',
}

/**
 * Salva (cria ou atualiza) a anamnese de um aluno SEM depender de nenhuma
 * constraint UNIQUE no banco — faz select primeiro, depois update (se já
 * existir linha) ou insert (se não existir). Isso corrige o bug recorrente
 * de "anamnese não salva" quando o upsert com onConflict falhava
 * silenciosamente por falta/duplicidade da constraint.
 */
export async function upsertAnamnese(studentId, fields) {
  const { data: existente } = await supabase.from('anamnese').select('id').eq('student_id', studentId).limit(1)
  if (existente?.[0]) {
    return supabase.from('anamnese').update(fields).eq('id', existente[0].id)
  }
  return supabase.from('anamnese').insert([{ ...fields, student_id: studentId }])
}

/**
 * Transcreve a resposta da anamnese "Como você se descreve em relação
 * ao exercício?" para o nível de experiência do aluno (mesmo campo
 * `level` usado no WorkoutEditor para volume/frequência de referência).
 */
export function nivelFromExperiencia(texto) {
  if (!texto) return null
  const t = texto.toLowerCase()
  if (t.includes('pratico regularmente')) return 'Avançado'
  if (t.includes('forma irregular') || t.includes('menos de 6 meses')) return 'Intermediário'
  if (t.includes('nunca pratiquei') || t.includes('mais de 6 meses')) return 'Iniciante'
  return null
}

/** UUID gerado no navegador — evita depender do RETURNING do banco (que exige permissão de leitura). */
const novoUuid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })

/**
 * CADASTRO PELO PROFESSOR (logado). Cria o aluno pendente + anamnese + notificação.
 * O id é gerado aqui: o insert NÃO usa .select(), então não depende de nenhuma
 * política de leitura. Devolve { aluno, error, avisos } — quem chama DEVE mostrar
 * erro/avisos ao usuário (nunca engolir em silêncio).
 */
export async function criarAlunoPendente({ teacherId, studentData, anamneseData, token, notifPayload }) {
  const avisos = []
  const id = novoUuid()
  const { error: alunoErr } = await supabase
    .from('students')
    .insert([{ id, ...studentData, teacher_id: teacherId, status: STUDENT_STATUS.PENDENTE }])
  if (alunoErr) return { aluno: null, error: alunoErr, avisos }
  const aluno = { id, ...studentData, teacher_id: teacherId, status: STUDENT_STATUS.PENDENTE }

  if (anamneseData) {
    const { error: anamErr } = await upsertAnamnese(aluno.id, { ...anamneseData, teacher_id: teacherId })
    if (anamErr) { console.error('criarAlunoPendente: anamnese', anamErr); avisos.push('anamnese não foi salva') }
  }

  if (token) {
    const { error: tokenErr } = await supabase
      .from('anamnese_tokens')
      .update({ student_id: aluno.id, status: 'respondido', respondido_em: new Date().toISOString() })
      .eq('token', token)
    if (tokenErr) { console.error('criarAlunoPendente: token', tokenErr); avisos.push('link não foi marcado como usado') }
  }

  const { error: notifErr } = await supabase.from('notificacoes').insert([{
    teacher_id: teacherId,
    tipo: 'nova_anamnese',
    titulo: notifPayload?.titulo || 'Novo aluno pendente',
    corpo: notifPayload?.corpo || `${aluno.name} aguarda confirmação.`,
    lida: false,
    payload: { student_id: aluno.id, ...(notifPayload?.payload || {}) },
  }])
  if (notifErr) { console.error('criarAlunoPendente: notificação', notifErr); avisos.push('notificação não foi criada') }

  return { aluno, error: null, avisos }
}

/**
 * ANAMNESE PÚBLICA (visitante sem login). Uma única chamada ao servidor
 * (função submeter_anamnese) grava aluno + anamnese + notificação + link usado
 * numa transação. Ou tudo acontece, ou nada. Devolve { studentId, error }.
 */
export async function submeterAnamnesePublica({ token, studentData, anamneseData, notifPayload }) {
  const { data, error } = await supabase.rpc('submeter_anamnese', {
    p_token: token,
    p_aluno: studentData,
    p_anamnese: anamneseData,
    p_notif: notifPayload || {},
  })
  if (error) return { studentId: null, error }
  return { studentId: data?.student_id || null, error: null }
}

/** Lê o link da anamnese (professor + plano) sem listar os links — null se inválido/já usado. */
export async function buscarInfoLink(token) {
  const { data, error } = await supabase.rpc('anamnese_token_info', { p_token: token })
  if (error) return { info: null, error }
  return { info: data || null, error: null }
}

/**
 * Confirma matrícula: status -> 'ativo' e resolve SOMENTE a notificação
 * deste aluno (corrige bug de marcar todas as nova_anamnese como lidas).
 */
export async function confirmarMatricula(studentId) {
  const { error } = await supabase.from('students').update({ status: STUDENT_STATUS.ATIVO }).eq('id', studentId)
  if (error) return { error }

  const { data: notifs } = await supabase
    .from('notificacoes')
    .select('id, payload')
    .eq('tipo', 'nova_anamnese')
    .eq('lida', false)

  const alvo = (notifs || []).filter(n => n.payload?.student_id === studentId)
  if (alvo.length) {
    await supabase.from('notificacoes').update({ lida: true }).in('id', alvo.map(n => n.id))
  }
  return { error: null }
}

/**
 * Rejeita candidato: soft-delete (status -> 'rejeitado', preserva histórico
 * para auditoria) + remove a notificação. Dashboard filtra 'rejeitado' de
 * "Meus Alunos" (nunca aparece pro professor, mas o registro não se perde).
 */
export async function rejeitarCandidato(studentId, notifId) {
  if (studentId) {
    const { error } = await supabase.from('students').update({ status: STUDENT_STATUS.REJEITADO }).eq('id', studentId)
    if (error) return { error }
  }
  if (notifId) {
    await supabase.from('notificacoes').delete().eq('id', notifId)
  }
  return { error: null }
}
