import { supabase } from '../supabase'

/**
 * Centraliza a criação de aluno pendente.
 * Sempre: INSERT students (status='pendente') + upsert anamnese (opcional)
 * + marca token como respondido (opcional) + cria notificação nova_anamnese.
 *
 * Nunca criar aluno fora desta função — evita status inconsistente
 * e aluno "órfão" sem notificação.
 */
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

export async function criarAlunoPendente({ teacherId, studentData, anamneseData, token, notifPayload }) {
  const { data: aluno, error: alunoErr } = await supabase
    .from('students')
    .insert([{ ...studentData, teacher_id: teacherId, status: 'pendente' }])
    .select().single()

  if (alunoErr || !aluno) return { aluno: null, error: alunoErr }

  if (anamneseData) {
    const { error: anamErr } = await supabase
      .from('anamnese')
      .upsert([{ ...anamneseData, student_id: aluno.id, teacher_id: teacherId }], { onConflict: 'student_id' })
    if (anamErr) console.error('criarAlunoPendente: falha ao salvar anamnese', anamErr)
  }

  if (token) {
    const { error: tokenErr } = await supabase
      .from('anamnese_tokens')
      .update({ student_id: aluno.id, status: 'respondido', respondido_em: new Date().toISOString() })
      .eq('token', token)
    if (tokenErr) console.error('criarAlunoPendente: falha ao marcar token', tokenErr)
  }

  const { error: notifErr } = await supabase.from('notificacoes').insert([{
    teacher_id: teacherId,
    tipo: 'nova_anamnese',
    titulo: notifPayload?.titulo || 'Novo aluno pendente',
    corpo: notifPayload?.corpo || `${aluno.name} aguarda confirmação.`,
    lida: false,
    payload: { student_id: aluno.id, ...(notifPayload?.payload || {}) },
  }])
  if (notifErr) console.error('criarAlunoPendente: falha ao criar notificação', notifErr)

  return { aluno, error: null }
}

/**
 * Confirma matrícula: status -> 'ativo' e resolve SOMENTE a notificação
 * deste aluno (corrige bug de marcar todas as nova_anamnese como lidas).
 */
export async function confirmarMatricula(studentId) {
  const { error } = await supabase.from('students').update({ status: 'ativo' }).eq('id', studentId)
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
 * Rejeita candidato: remove notificação e deleta o aluno (mesmo
 * comportamento atual). Ver observação sobre soft-delete no relatório.
 */
export async function rejeitarCandidato(studentId, notifId) {
  if (studentId) {
    const { error } = await supabase.from('students').delete().eq('id', studentId)
    if (error) return { error }
  }
  if (notifId) {
    await supabase.from('notificacoes').delete().eq('id', notifId)
  }
  return { error: null }
}
