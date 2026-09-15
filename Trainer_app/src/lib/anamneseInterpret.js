import { nivelFromExperiencia } from './alunos'

/** Q1 — nível de esforço físico no trabalho → nível de atividade diária */
export function interpretarNivelAtividade(resposta) {
  if (!resposta) return null
  const t = resposta.toLowerCase()
  if (t.includes('esforco fisico intenso') || t.includes('esforço físico intenso')) return 'Muito ativo / Alta demanda'
  if (t.includes('esforco fisico moderado') || t.includes('esforço físico moderado')) return 'Moderadamente ativo'
  if (t.includes('fico em pe') || t.includes('fico em pé') || t.includes('caminho boa parte')) return 'Ativo'
  if (t.includes('desloco bastante')) return 'Levemente ativo'
  if (t.includes('desloco pouco')) return 'Sedentário'
  return null
}

/** Q16 — reexporta a categorização já usada em students.level (Iniciante/Intermediário/Avançado) */
export { nivelFromExperiencia as interpretarExperiencia }

/** Q13 — dias por semana → formato curto usado no WorkoutEditor (2x, 3x...) */
export function interpretarFrequencia(resposta) {
  if (!resposta) return null
  const n = resposta.match(/\d+/)?.[0]
  if (!n) return null
  return resposta.includes('mais') ? `${n}x+` : `${n}x`
}

/** Q15 — local de treino (multi-select) → labels curtos */
const LOCAL_MAP = { 'Academia':'Academia', 'Ao ar livre':'Ar livre', 'Em casa':'Casa', 'Sem preferencia':'Flexível', 'Sem preferência':'Flexível' }
export function interpretarLocal(respostas = []) {
  const labels = respostas.map(r => LOCAL_MAP[r] || r).filter(Boolean)
  return labels.length ? labels.join(' / ') : null
}

/** Q10 (condição de saúde) + Q11 (dor/limitação) → lista de tags de restrição pro WorkoutEditor */
const COND_SAUDE_MAP = {
  'Hipertensao': 'Restrição cardiovascular', 'Hipertensão': 'Restrição cardiovascular',
  'Problema cardiaco': 'Restrição cardiovascular', 'Problema cardíaco': 'Restrição cardiovascular',
  'Osteoporose': 'Restrição óssea',
  'Artrite ou artrose': 'Restrição articular',
  'Hernia de disco': 'Restrição coluna', 'Hérnia de disco': 'Restrição coluna',
  'Diabetes': 'Atenção glicemia (secundário)',
  'Outra': 'Restrição específica',
}
const LIMITACAO_MAP = {
  'Ombro': 'Restrição ombro',
  'Coluna lombar': 'Restrição lombar',
  'Coluna cervical': 'Restrição cervical',
  'Joelho': 'Restrição joelho',
  'Quadril': 'Restrição quadril',
  'Tornozelo': 'Restrição tornozelo',
  'Punho ou cotovelo': 'Restrição punho/cotovelo',
  'Outra regiao': 'Restrição outra', 'Outra região': 'Restrição outra',
}
export function interpretarRestricoes(condicaoSaude = [], limitacao = []) {
  const tags = new Set()
  ;(condicaoSaude || []).forEach(c => { if (c !== 'Nenhuma' && COND_SAUDE_MAP[c]) tags.add(COND_SAUDE_MAP[c]) })
  ;(limitacao || []).forEach(l => { if (l !== 'Nenhuma' && LIMITACAO_MAP[l]) tags.add(LIMITACAO_MAP[l]) })
  return [...tags]
}

/**
 * Q17 — motivação. Interpretação de perfil PSICOLÓGICO, reservada para
 * quando montarmos a parte financeira/comercial do app. NÃO usar no
 * WorkoutEditor por enquanto — só armazenar.
 */
const MOTIVACAO_MAP = {
  'Insatisfacao com meu corpo atual': { label:'Estético / Visual', comentario:'priorizar exercícios que geram mudança visível mais rápido.' },
  'Insatisfação com meu corpo atual': { label:'Estético / Visual', comentario:'priorizar exercícios que geram mudança visível mais rápido.' },
  'Recomendacao medica': { label:'Saúde prioritária', comentario:'volume e intensidade mais conservadores.' },
  'Recomendação médica': { label:'Saúde prioritária', comentario:'volume e intensidade mais conservadores.' },
  'Tenho um evento ou data importante': { label:'Prazo definido', comentario:'periodização com data-alvo (mais agressivo no começo).' },
  'Indicacao de alguem': { label:'Motivação externa', comentario:'programa mais simples e fácil de aderir (maior risco de desistência).' },
  'Indicação de alguém': { label:'Motivação externa', comentario:'programa mais simples e fácil de aderir (maior risco de desistência).' },
  'Quero mais energia no dia a dia': { label:'Bem-estar / Energia', comentario:'foco em disposição e não só em estética ou carga.' },
  'Decidi que e hora de mudar': { label:'Mudança interna', comentario:'pode receber progressão mais firme (melhor aderência a longo prazo).' },
  'Decidi que é hora de mudar': { label:'Mudança interna', comentario:'pode receber progressão mais firme (melhor aderência a longo prazo).' },
}
export function interpretarMotivacao(respostas = []) {
  return (respostas || []).map(r => MOTIVACAO_MAP[r]).filter(Boolean)
}

/**
 * Monta o perfil interpretado completo a partir das respostas cruas da
 * anamnese pública (objeto D do formulário). Guardado em anamnese.perfil.
 */
export function montarPerfilInterpretado(D, objetivoLabel) {
  return {
    nivel:       interpretarNivelAtividade(D.rotina_trabalho),
    experiencia: nivelFromExperiencia(D.experiencia),
    objetivo:    objetivoLabel || null,
    pq:          interpretarMotivacao(D.motivacao), // reservado — não usar no WorkoutEditor ainda
    frequencia:  interpretarFrequencia(D.dias_semana),
    local:       interpretarLocal(D.local_treino),
    restricoes:  interpretarRestricoes(D.condicao_saude, D.limitacao),
    horario:     D.horario || null,
  }
}
