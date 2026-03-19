import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const s = {
  wrap: { minHeight: '100vh', background: '#080B12', padding: '24px 20px' },
  inner: { maxWidth: 800, margin: '0 auto' },
  back: { background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 },
  header: { background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(52,211,153,0.15)' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: (active, isEval) => ({ flex: 1, padding: '12px 8px', borderRadius: 10, border: isEval && !active ? '1px solid rgba(99,102,241,0.25)' : 'none', background: active ? (isEval ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'linear-gradient(135deg,#34D399,#059669)') : (isEval ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)'), color: active ? '#fff' : (isEval ? '#818CF8' : '#64748B'), fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: active && isEval ? '0 4px 16px rgba(99,102,241,0.4)' : 'none' }),
  card: { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 },
  label: { fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  val: { fontSize: 15, fontWeight: 700, color: '#fff' },
  input: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10 },
  select: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', marginBottom: 10 },
  btn: (color = '#34D399') => ({ background: `linear-gradient(135deg,${color},${color}99)`, border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  outlineBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', color: '#94A3B8', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  shareBox: { background: 'rgba(0,201,255,0.08)', border: '1px solid rgba(0,201,255,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#7DD3FC', wordBreak: 'break-all', marginTop: 12 },
}

const GOALS  = ['Iniciação Esportiva', 'Desenvolvimento Atlético', 'Treinamento Competitivo', 'Saúde e Bem-Estar', 'Condicionamento', 'Ganho de Massa', 'Emagrecimento', 'Força e Performance']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Atleta Jovem', 'Atleta Competitivo']

const SPORTS = [
  { id: 'futebol',   label: 'Futebol',          icon: '⚽' },
  { id: 'futsal',    label: 'Futsal',            icon: '🥅' },
  { id: 'natacao',   label: 'Natação',           icon: '🏊' },
  { id: 'tenis',     label: 'Tênis',             icon: '🎾' },
  { id: 'basquete',  label: 'Basquete',          icon: '🏀' },
  { id: 'volei',     label: 'Vôlei',             icon: '🏐' },
  { id: 'atletismo', label: 'Atletismo',         icon: '🏃' },
  { id: 'ginastica', label: 'Ginástica',         icon: '🤸' },
  { id: 'judo',      label: 'Judô',              icon: '🥋' },
  { id: 'ciclismo',  label: 'Ciclismo',          icon: '🚴' },
  { id: 'handebol',  label: 'Handebol',          icon: '🤾' },
  { id: 'saude',     label: 'Saúde e Bem-Estar', icon: '🌿' },
  { id: 'custom',    label: 'Outro',             icon: '🏅' },
]

function calcLTAD(age, expYears, sport) {
  if (!age || !sport) return null
  const exp = expYears || 0
  if (age < 9)               return { fase: 'FUNdamentals',     cor: '#0284C7', bg: 'rgba(2,132,199,0.1)',  icon: '🎮', desc: 'Habilidades motoras fundamentais e ludicidade' }
  if (age <= 11 && exp < 3)  return { fase: 'FUNdamentals',     cor: '#0284C7', bg: 'rgba(2,132,199,0.1)',  icon: '🎮', desc: 'Habilidades motoras fundamentais e ludicidade' }
  if (age <= 12)             return { fase: 'Learn to Train',   cor: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: '📚', desc: 'Aprender habilidades esportivas gerais' }
  if (age <= 15 && exp < 4)  return { fase: 'Learn to Train',   cor: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: '📚', desc: 'Aprender habilidades esportivas gerais' }
  if (age <= 16)             return { fase: 'Train to Train',   cor: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: '💪', desc: 'Construir base física específica ao esporte' }
  if (age <= 17 && exp < 5)  return { fase: 'Train to Train',   cor: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: '💪', desc: 'Construir base física específica ao esporte' }
  if (age <= 18)             return { fase: 'Train to Compete', cor: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: '🏆', desc: 'Especialização e desempenho competitivo' }
  return null
}
const STATUS_COLOR = { active: '#34D399', draft: '#FBBF24', archived: '#64748B' }
const STATUS_LABEL = { active: 'Ativo', draft: 'Rascunho', archived: 'Arquivado' }

// ── DuplicarPlanoModal ──────────────────────────────────────────────────────
function DuplicarPlanoModal({ plan, student, onClose }) {
  const [allStudents, setAllStudents] = useState([])
  const [selected, setSelected]       = useState(null)
  const [saving, setSaving]           = useState(false)
  const [done, setDone]               = useState(false)

  useEffect(() => {
    supabase.from('students').select('id,name,goal')
      .eq('teacher_id', student.teacher_id)
      .neq('id', student.id)
      .order('name')
      .then(({ data }) => setAllStudents(data || []))
  }, [])

  const duplicate = async () => {
    if (!selected) return
    setSaving(true)
    try {
      // Busca plano completo com dias e exercícios
      const { data: fullPlan } = await supabase
        .from('workout_plans')
        .select('*, workout_days(*, exercises(*))')
        .eq('id', plan.id)
        .single()

      // Cria novo plano para o aluno destino
      const { data: newPlan } = await supabase
        .from('workout_plans')
        .insert([{ student_id: selected, teacher_id: student.teacher_id, title: fullPlan.title + ' (cópia)', status: 'draft' }])
        .select().single()

      if (!newPlan) throw new Error('Falha ao criar plano')

      // Copia dias e exercícios sequencialmente
      for (const day of (fullPlan.workout_days || [])) {
        const { data: newDay } = await supabase
          .from('workout_days')
          .insert([{ workout_plan_id: newPlan.id, day_of_week: day.day_of_week, name: day.name }])
          .select().single()

        if (newDay) {
          const exs = (day.exercises || []).map(ex => ({
            workout_day_id: newDay.id,
            name:        ex.name,
            sets:        ex.sets,
            reps:        ex.reps,
            weight:      ex.weight,
            rest_seconds:ex.rest_seconds,
            notes:       ex.notes,
            order_index: ex.order_index,
          }))
          if (exs.length) await supabase.from('exercises').insert(exs)
        }
      }
      setDone(true)
    } catch(e) {
      alert('Erro ao duplicar: ' + e.message)
    }
    setSaving(false)
  }

  const targetName = allStudents.find(s => s.id === selected)?.name

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0D1117',borderRadius:20,padding:28,width:'100%',maxWidth:440,border:'1px solid rgba(255,255,255,0.1)' }}>
        {done ? (
          <div style={{ textAlign:'center',padding:'20px 0' }}>
            <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
            <div style={{ fontSize:18,fontWeight:800,color:'#34D399',marginBottom:6 }}>Plano duplicado!</div>
            <div style={{ fontSize:13,color:'#64748B',marginBottom:24 }}>
              "{plan.title}" foi copiado para <strong style={{ color:'#E2E8F0' }}>{targetName}</strong> como rascunho.
            </div>
            <button onClick={onClose} style={{ padding:'10px 28px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#34D399,#059669)',color:'#FFF',fontWeight:800,fontSize:14,cursor:'pointer' }}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:18,fontWeight:800,color:'#E2E8F0',marginBottom:4 }}>📋 Duplicar Plano</div>
            <div style={{ fontSize:13,color:'#475569',marginBottom:20 }}>"{plan.title}" → Selecione o aluno destino</div>

            {allStudents.length === 0 ? (
              <div style={{ textAlign:'center',padding:'30px 0',color:'#334155' }}>Nenhum outro aluno cadastrado.</div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:8,maxHeight:280,overflowY:'auto',marginBottom:20 }}>
                {allStudents.map(st => (
                  <button key={st.id} onClick={() => setSelected(st.id)}
                    style={{ padding:'12px 16px',borderRadius:12,border:`2px solid ${selected===st.id ? '#34D399' : 'rgba(255,255,255,0.07)'}`, background: selected===st.id ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)', color:'#E2E8F0',fontWeight:600,fontSize:13,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10,transition:'all 0.15s' }}>
                    <span style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0 }}>
                      {st.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div>{st.name}</div>
                      <div style={{ fontSize:11,color:'#475569' }}>{st.goal}</div>
                    </div>
                    {selected===st.id && <span style={{ marginLeft:'auto',color:'#34D399',fontSize:18 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display:'flex',gap:10 }}>
              <button onClick={onClose} style={{ flex:1,padding:'11px 0',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#64748B',fontWeight:600,fontSize:13,cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={duplicate} disabled={!selected || saving}
                style={{ flex:2,padding:'11px 0',borderRadius:10,border:'none',background: selected ? 'linear-gradient(135deg,#34D399,#059669)' : 'rgba(255,255,255,0.05)',color: selected ? '#FFF' : '#334155',fontWeight:800,fontSize:13,cursor: selected ? 'pointer' : 'default',transition:'all 0.2s' }}>
                {saving ? 'Duplicando...' : `📋 Duplicar para ${targetName || 'aluno selecionado'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ── MOTOR DE AVALIAÇÃO CIENTÍFICA v2 ───────────────────────────────────────
// 11 pilares ponderados + confiança + histórico + recomendações automáticas
// Refs: ACSM 2022, Schoenfeld 2017, Kraemer 2004, Tanaka 2001,
//       Balyi LTAD 2013, WHO 2020, Boyle 2016, Foster 1998 (ACWR),
//       Fonseca 2014 (stimulus variation), NSCA Guidelines 2021
// ═══════════════════════════════════════════════════════════════════════════

function calcAge(student) {
  if (student.birth_date) {
    const birth = new Date(student.birth_date)
    return Math.floor((new Date() - birth) / (365.25 * 24 * 3600000))
  }
  return student.age ? parseInt(student.age) : null
}

// ── PHV & Tanner (apenas para <18 anos) ──────────────────────────────────
// Tanner 1970: altura alvo genética (approximação estatística, não diagnóstico)
function calcTargetHeight(fatherCm, motherCm, sex) {
  if (!fatherCm || !motherCm) return null
  const raw = sex === 'M'
    ? (fatherCm + motherCm + 13) / 2
    : (fatherCm + motherCm - 13) / 2
  return { target: Math.round(raw), low: Math.round(raw - 8.5), high: Math.round(raw + 8.5) }
}

// Mirwald 2002: Maturity Offset (anos antes/depois do PHV)
// Requer: altura (cm), peso (kg), altura sentado (cm), idade decimal
function calcMaturityOffset(heightCm, weightKg, sittingCm, ageDecimal, sex) {
  if (!heightCm || !weightKg || !sittingCm || !ageDecimal) return null
  const legLength = heightCm - sittingCm
  let offset
  if (sex === 'M') {
    offset = -9.236
      + 0.0002708 * (legLength * sittingCm)
      - 0.001663  * (ageDecimal * legLength)
      + 0.007216  * (ageDecimal * sittingCm)
      + 0.02292   * (weightKg / heightCm * 100)
  } else {
    offset = -9.376
      + 0.0001882 * (legLength * sittingCm)
      + 0.0022    * (ageDecimal * legLength)
      + 0.005841  * (ageDecimal * sittingCm)
      - 0.002658  * (ageDecimal * weightKg)
      + 0.07693   * (weightKg / heightCm * 100)
  }
  return +offset.toFixed(2)
}

function offsetLabel(offset) {
  if (offset === null) return null
  if (offset < -2)   return { label: 'Pré-puberdade', color: '#60A5FA', desc: 'Longe do pico de crescimento — fase ideal para velocidade e habilidades motoras' }
  if (offset < -0.5) return { label: 'Pré-PHV',       color: '#34D399', desc: 'Aproximando do pico — priorizar técnica e padrões motores, carga moderada' }
  if (offset < 0.5)  return { label: 'No PHV',         color: '#FBBF24', desc: 'Período de vulnerabilidade — crescimento ósseo à frente do muscular, reduzir carga axial intensa' }
  if (offset < 2)    return { label: 'Pós-PHV',        color: '#F97316', desc: 'Janela de força — resposta hormonal elevada, progressão de carga pode ser acelerada' }
  return               { label: 'Pós-puberdade',      color: '#C084FC', desc: 'Base consolidada — periodização de atleta jovem competitivo' }
}

// TGMD-3 — 13 padrões motores (Ulrich 2019)
const TGMD3_LOCOMOTION = [
  { id:'corrida',    label:'Corrida',           desc:'Padrão de corrida: braços em oposição, fase aérea visível, apoio no antepé' },
  { id:'galope',     label:'Galope',            desc:'Passo-toque rítmico lateral, corpo levemente inclinado para frente' },
  { id:'passada',    label:'Passada (skip)',    desc:'Alternância de passo+salto, coordenação braço-perna' },
  { id:'salto_h',    label:'Salto horizontal',  desc:'Pré-balanço de braços, impulsão bilateral, aterrissagem amortecida' },
  { id:'salto_v',    label:'Salto vertical',    desc:'Extensão completa do corpo, alcance dos braços, aterrissagem suave' },
  { id:'lateral',    label:'Corrida lateral',   desc:'Passos cruzados, centro de gravidade baixo, mudança de direção' },
]
const TGMD3_OBJECT = [
  { id:'chutar',     label:'Chute',             desc:'Passo de aproximação, balanço de braços, contato com peito do pé, follow-through' },
  { id:'arremesso',  label:'Arremesso (acima)', desc:'Rotação de tronco, transferência de peso, liberação acima do ombro' },
  { id:'receber',    label:'Recepção',          desc:'Preparação das mãos, olhos no alvo, absorção do impacto com dedos' },
  { id:'driblar',    label:'Drible',            desc:'Contato com os dedos, altura do quadril, olhos longe da bola' },
  { id:'rebater',    label:'Rebater',           desc:'Rotação de quadril, contato na zona de strike, follow-through' },
  { id:'rolar',      label:'Rolar (boliche)',   desc:'Abaixamento do corpo, liberação na altura do joelho, follow-through' },
  { id:'underhand',  label:'Arremesso (abaixo)',desc:'Balanço pendular, transferência de peso, liberação na altura do quadril' },
]
const TGMD3_LEVELS = [
  { val: 0, label: 'Inicial',         color: '#F87171', short: 'I' },
  { val: 1, label: 'Elementar',       color: '#FBBF24', short: 'E' },
  { val: 2, label: 'Maduro',          color: '#34D399', short: 'M' },
]

function tgmdScore(scores) {
  if (!scores) return null
  const all = [...TGMD3_LOCOMOTION, ...TGMD3_OBJECT]
  const filled = all.filter(p => scores[p.id] !== undefined)
  if (filled.length === 0) return null
  const sum = filled.reduce((a, p) => a + (scores[p.id] || 0), 0)
  const max = filled.length * 2
  return { pct: Math.round((sum / max) * 100), filled: filled.length, total: all.length }
}

function getScoreColor(score) {
  if (score >= 80) return { text: '#4ADE80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', label: 'Excelente' }
  if (score >= 65) return { text: '#A3E635', bg: 'rgba(163,230,53,0.10)', border: 'rgba(163,230,53,0.25)', label: 'Bom' }
  if (score >= 45) return { text: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', label: 'Regular' }
  if (score >= 25) return { text: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)', label: 'Atenção' }
  return { text: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: 'Crítico' }
}

// ── Confiança da avaliação ─────────────────────────────────────────────────
function getConfidence({ allExercises, exerciseLogs, cardioSessions, progress, student, allDays }) {
  let pts = 0
  const items = []
  if (allExercises.length >= 4)                  { pts += 18; items.push('plano com exercícios') }
  else if (allExercises.length > 0)              { pts += 8;  items.push('plano parcial') }
  else                                           { items.push('sem plano ativo') }
  if (allDays.some(d => d.exercises?.some(e => e.type))) { pts += 10; items.push('tipos musculares definidos') }
  if (exerciseLogs.length >= 30)                 { pts += 22; items.push('histórico de cargas rico') }
  else if (exerciseLogs.length >= 10)            { pts += 14; items.push('histórico de cargas parcial') }
  else if (exerciseLogs.length >= 3)             { pts += 6;  items.push('poucos registros de carga') }
  else                                           { items.push('sem registros de carga') }
  if (student.birth_date || student.age)         { pts += 12; items.push('dados etários') }
  if (student.weight && student.height)          { pts += 10; items.push('antropometria completa') }
  else if (student.weight || student.height)     { pts += 5;  items.push('antropometria parcial') }
  if (progress.length >= 2)                      { pts += 14; items.push('avaliações físicas') }
  else if (progress.length === 1)                { pts += 7;  items.push('1 avaliação física') }
  if (cardioSessions.length >= 5)                { pts += 10; items.push('histórico cárdio') }
  else if (cardioSessions.length >= 1)           { pts += 5;  items.push('cárdio parcial') }
  // Span temporal dos logs
  if (exerciseLogs.length >= 2) {
    const dates = exerciseLogs.map(l => l.date).sort()
    const spanWeeks = (new Date(dates[dates.length-1]) - new Date(dates[0])) / (7*864e5)
    if (spanWeeks >= 8) { pts += 4; items.push('span ≥8 semanas') }
  }
  return { pct: Math.min(100, pts), items }
}

// ── Recomendações automáticas por pilar ───────────────────────────────────
const RECS = {
  volume:     s => s >= 80 ? [] : s >= 50 ? ['Aumente gradualmente para 15–20 séries/semana por grupo muscular (ACSM 2022).'] : ['Cadastre o plano ativo com séries e grupos musculares para avaliação completa.', 'Volume atual muito baixo — considere 10+ séries/semana para resultados mínimos.'],
  freq:       s => s >= 80 ? [] : s >= 55 ? ['Ajuste a frequência semanal de acordo com o objetivo: Massa/Emagrecimento 3–5×, Força 3–4×.'] : ['Nenhum dia de treino configurado. Cadastre os dias da semana no plano ativo.'],
  balance:    s => s >= 80 ? [] : ['Revise a proporção de exercícios de puxada vs empurrão (alvo 1:1). Adicione puxadas dorsais se houver excesso de peito/ombro.', 'Verifique cadeia posterior (posterior de coxa, glúteo) para equilibrar com quadríceps.'],
  progress:   s => s >= 80 ? [] : s >= 50 ? ['Registre cargas semanalmente para monitorar progressão. ACSM: aumento de 2–10%/semana.'] : ['Nenhuma progressão detectada. Aplique sobrecarga progressiva — aumente 1 variável (peso, reps ou séries) a cada 1–2 semanas.'],
  objective:  s => s >= 80 ? [] : ['Ajuste as faixas de repetição ao objetivo: Massa 6–12 reps, Força 1–6, Condicionamento 12–20, Emagrecimento 8–15.'],
  age:        s => s >= 80 ? [] : ['Revise os alertas etários no pilar Adequação Etária e ajuste o plano conforme as diretrizes LTAD/ACSM para a faixa do aluno.'],
  monitor:    s => s >= 80 ? [] : ['Realize avaliação física a cada 30 dias. Registre peso, medidas e cargas para aumentar a confiança da avaliação.'],
  recovery:   s => s >= 80 ? [] : ['Insira pelo menos 1 dia de descanso entre sessões do mesmo grupo muscular (Schoenfeld 2018: 48–72h mínimo).', 'Considere dividir o plano por grupos musculares para garantir recuperação adequada.'],
  overtraining: s => s >= 80 ? [] : s >= 55 ? ['PSE médio elevado. Considere sessões de baixa intensidade (PSE ≤5) ou 1 semana de deload.'] : ['Razão carga aguda:crônica elevada (ACWR >1.5) — risco de overtraining. Reduza volume ou intensidade por 5–7 dias.'],
  variation:  s => s >= 80 ? [] : ['Varie os estímulos a cada 4–6 semanas: alterne períodos de hipertrofia (6–12 reps), força (1–6) e resistência (12–20) para evitar estagnação (Fonseca 2014).'],
  levelFit:   s => s >= 80 ? [] : ['Ajuste o plano ao nível do aluno. Iniciantes: 2–3×/sem, 10–15 séries, foco em movimentos compostos. Avançados: periodização com variação de métodos.'],
}

function generateRecommendations(pilares) {
  return pilares
    .filter(p => p.score < 80)
    .sort((a, b) => a.score - b.score)
    .flatMap(p => (RECS[p.id] ? RECS[p.id](p.score).map(txt => ({ pilar: p.name, icon: p.icon, txt, score: p.score })) : []))
    .slice(0, 6)
}

// ── Motor de avaliação ─────────────────────────────────────────────────────
function runEvaluation({ student, allExercises, allDays, plannedDays, exerciseLogs, cardioSessions, progress }) {
  const age    = calcAge(student)
  const goal   = student.goal || ''
  const level  = student.level || 'Iniciante'

  // ── Pillar 1: Volume de Força ────────────────────────────────────────────
  // ACSM 2022: 10–20 séries/grupo muscular/semana (Schoenfeld meta-analysis 2017)
  const totalSets = allExercises.reduce((sum, ex) => sum + (parseInt(ex.sets) || 3), 0)
  let volumeScore = 0
  let volumeMsg   = ''
  if (totalSets === 0) {
    volumeScore = 0
    volumeMsg = 'Nenhum exercício cadastrado no plano ativo.'
  } else if (totalSets < 10) {
    volumeScore = 30
    volumeMsg = `${totalSets} séries semanais — volume muito baixo. Mínimo recomendado: 10 séries/semana por grupo muscular (Schoenfeld 2017).`
  } else if (totalSets < 20) {
    volumeScore = 60
    volumeMsg = `${totalSets} séries semanais — volume moderado. Alvo ideal: 15–25 séries para hipertrofia e performance (ACSM 2022).`
  } else if (totalSets < 40) {
    volumeScore = 90
    volumeMsg = `${totalSets} séries semanais — volume adequado para o nível ${level}. Dentro da janela recomendada pelo ACSM.`
  } else if (totalSets < 60) {
    volumeScore = 100
    volumeMsg = `${totalSets} séries semanais — excelente volume para atleta ${level}. Monitore sinais de overtraining.`
  } else {
    volumeScore = 55
    volumeMsg = `${totalSets} séries semanais — volume elevado. Risco de overtraining. Considere deload semanal a cada 4–6 semanas.`
  }

  // ── Pillar 2: Frequência Semanal ─────────────────────────────────────────
  // ACSM Position Stand 2022 por objetivo
  const FREQ = {
    'Ganho de Massa':           { min: 3, max: 5, ideal: '3–5×/sem' },
    'Emagrecimento':            { min: 3, max: 5, ideal: '3–5×/sem' },
    'Condicionamento':          { min: 4, max: 5, ideal: '4–5×/sem' },
    'Força e Performance':      { min: 3, max: 4, ideal: '3–4×/sem' },
    'Saúde e Bem-Estar':        { min: 2, max: 4, ideal: '2–4×/sem' },
    'Iniciação Esportiva':      { min: 2, max: 3, ideal: '2–3×/sem' },
    'Desenvolvimento Atlético': { min: 3, max: 4, ideal: '3–4×/sem' },
    'Treinamento Competitivo':  { min: 3, max: 5, ideal: '3–5×/sem' },
  }
  const freqTarget = FREQ[goal] || { min: 3, max: 5, ideal: '3–5×/sem' }
  const daysPerWeek = plannedDays.length
  let freqScore = 0, freqMsg = ''
  if (daysPerWeek === 0) {
    freqScore = 0; freqMsg = 'Nenhum dia de treino configurado no plano.'
  } else if (daysPerWeek < freqTarget.min) {
    freqScore = 55; freqMsg = `${daysPerWeek} dia${daysPerWeek > 1 ? 's' : ''}/semana — abaixo do ideal para "${goal}" (ACSM: ${freqTarget.ideal}).`
  } else if (daysPerWeek <= freqTarget.max) {
    freqScore = 100; freqMsg = `${daysPerWeek} dias/semana — frequência ideal para "${goal}" segundo ACSM 2022.`
  } else {
    freqScore = 65; freqMsg = `${daysPerWeek} dias/semana — frequência elevada. Verifique dias de descanso para recuperação (ACSM: ${freqTarget.ideal}).`
  }

  // ── Pillar 3: Equilíbrio Muscular ────────────────────────────────────────
  // Boyle 2016 (Functional Training Bible): razão puxada:empurrão 1:1–1.2
  const PUSH = ['Peito', 'Tríceps', 'Ombro']
  const PULL = ['Costas', 'Bíceps']
  const ANTERIOR  = ['Quadríceps']
  const POSTERIOR = ['Posterior', 'Glúteo', 'Panturrilha']

  const pushN = allExercises.filter(ex => PUSH.includes(ex.type)).length
  const pullN = allExercises.filter(ex => PULL.includes(ex.type)).length
  const antN  = allExercises.filter(ex => ANTERIOR.includes(ex.type)).length
  const postN = allExercises.filter(ex => POSTERIOR.includes(ex.type)).length

  let balanceScore = 80
  const balanceIssues = []

  if (pushN + pullN >= 2) {
    const ppRatio = pushN / Math.max(pullN, 1)
    if (ppRatio > 1.8) { balanceScore -= 25; balanceIssues.push(`excesso de empurrão vs puxada (${pushN}:${pullN}) — risco de desequilíbrio postural`) }
    else if (ppRatio < 0.4) { balanceScore -= 10; balanceIssues.push(`excesso de puxada vs empurrão (${pullN}:${pushN})`) }
    else if (ppRatio >= 0.7 && ppRatio <= 1.3) balanceScore = 100
  } else if (allExercises.length > 0) {
    balanceScore = 55; balanceIssues.push('grupos push/pull insuficientes para avaliar equilíbrio horizontal')
  }

  if (antN > 2 && postN === 0) {
    balanceScore -= 25; balanceIssues.push('cadeia posterior (posterior/glúteo) ausente — risco de síndrome patelofemoral')
  } else if (antN > 0 && postN > 0 && antN / postN > 2) {
    balanceScore -= 15; balanceIssues.push(`dominância anterior excessiva vs posterior (${antN}:${postN})`)
  }
  balanceScore = Math.max(0, Math.min(100, balanceScore))
  const balanceMsg = balanceIssues.length
    ? balanceIssues.map(i => `⚠️ ${i}`).join(' · ')
    : pushN + pullN + antN + postN > 0
      ? `Boa distribuição push/pull detectada (${pushN} empurrão : ${pullN} puxada). Equilíbrio muscular adequado.`
      : 'Não foi possível avaliar — adicione o tipo muscular nos exercícios do plano.'

  // ── Pillar 4: Progressão de Carga ────────────────────────────────────────
  // ACSM FITT-VP: sobrecarga progressiva 2–10% por semana (Kraemer 2004)
  let progressScore = 50, progressMsg = 'Dados insuficientes para avaliar progressão (mínimo 2 registros por exercício).'

  if (exerciseLogs && exerciseLogs.length >= 3) {
    const byEx = {}
    exerciseLogs.forEach(log => {
      const name = log.exercises?.name || log.exercise_id
      if (!byEx[name]) byEx[name] = []
      const maxW = Math.max(...(log.sets || []).map(s => +s.weight || 0))
      if (maxW > 0) byEx[name].push({ date: log.date, maxW })
    })
    const exsTracked = Object.values(byEx).filter(arr => arr.length >= 2)
    if (exsTracked.length > 0) {
      let up = 0, flat = 0, down = 0
      exsTracked.forEach(arr => {
        const sorted = [...arr].sort((a, b) => a.date > b.date ? 1 : -1)
        const delta = (sorted[sorted.length - 1].maxW - sorted[0].maxW) / sorted[0].maxW
        if (delta >  0.03) up++
        else if (delta < -0.03) down++
        else flat++
      })
      const total = up + flat + down
      progressScore = Math.round((up * 100 + flat * 62 + down * 20) / total)
      progressMsg = `${total} exercício${total > 1 ? 's' : ''} acompanhado${total > 1 ? 's' : ''}: ${up} com carga crescente↑, ${flat} estável→, ${down} decrescente↓. ${down > 0 ? '⚠️ Investigue redução de carga.' : up > 0 ? '✅ Progressão detectada.' : 'Considere aumentar cargas progressivamente (ACSM: 2–10%/semana).'}`
    }
  }

  // ── Pillar 5: Adequação ao Objetivo ──────────────────────────────────────
  // Rep ranges: Schoenfeld 2010 — força 1-6, hipertrofia 6-12, endurance >12
  const REP_RANGES = {
    'Ganho de Massa':           { min: 6,  max: 12, label: '6–12 reps (zona de hipertrofia)' },
    'Força e Performance':      { min: 1,  max: 6,  label: '1–6 reps (zona de força máxima)' },
    'Condicionamento':          { min: 12, max: 20, label: '12–20 reps (zona de resistência muscular)' },
    'Emagrecimento':            { min: 8,  max: 15, label: '8–15 reps (metabólico + hipertrofia moderada)' },
    'Saúde e Bem-Estar':        { min: 12, max: 20, label: '12–20 reps (resistência muscular, mobilidade e funcional)' },
    'Iniciação Esportiva':      { min: 10, max: 20, label: '10–20 reps (multilateral, peso corporal e baixa carga)' },
    'Desenvolvimento Atlético': { min: 6,  max: 15, label: '6–15 reps (misto: base de força + resistência)' },
    'Treinamento Competitivo':  { min: 4,  max: 12, label: '4–12 reps (potência + força funcional)' },
  }
  const repRange = REP_RANGES[goal]
  let objScore = 70, objIssues = []

  if (repRange && allExercises.length > 0) {
    let aligned = 0
    allExercises.forEach(ex => {
      const m = (ex.reps || '').match(/\d+/)
      if (m) { const r = parseInt(m[0]); if (r >= repRange.min && r <= repRange.max) aligned++ }
    })
    const pct = aligned / allExercises.length
    objScore = Math.round(40 + pct * 60)
    if (pct < 0.5) objIssues.push(`${Math.round(pct * 100)}% dos exercícios com reps alinhadas ao objetivo (alvo: ${repRange.label})`)
    else objIssues = []
  }

  // Cárdio complementar para objetivos de condicionamento/emagrecimento
  if (goal === 'Emagrecimento' || goal === 'Condicionamento') {
    const now = new Date()
    const last14sessions = (cardioSessions || []).filter(s => (now - new Date(s.date)) < 14 * 864e5)
    const weeklyCardioMin = last14sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 2
    if (weeklyCardioMin < 90 && last14sessions.length < 2) {
      objScore = Math.max(objScore - 15, 10)
      objIssues.push(`volume cárdio insuficiente nas últimas 2 semanas — WHO 2020 recomenda ≥150 min/sem para ${goal}`)
    } else if (weeklyCardioMin >= 150) {
      objScore = Math.min(objScore + 8, 100)
    }
  }
  const objMsg = objIssues.length
    ? objIssues.map(i => `⚠️ ${i}`).join('. ')
    : repRange
      ? `Faixas de repetição e volume compatíveis com objetivo "${goal}" (${repRange.label}).`
      : 'Configure o objetivo do aluno para avaliação detalhada.'

  // ── Pillar 6: Adequação Etária + Fase LTAD ──────────────────────────────
  // LTAD (Balyi 2013), Tanaka 2001, ACSM 2022, NSCA Youth Resistance Training 2009
  let ageScore = 100, ageIssues = [], ageOk = []
  const ltadPhase = calcLTAD(age, student.experience_years, student.sport)

  if (age !== null) {
    const lowRepCount    = allExercises.filter(ex => parseInt(ex.reps) <= 3).length
    const heavyRepCount  = allExercises.filter(ex => { const m=(ex.reps||'').match(/\d+/); return m && parseInt(m[0]) < 6 }).length
    const heavyLoadPct   = heavyRepCount / Math.max(allExercises.length, 1)
    const hasCoreWork    = allExercises.some(ex => ['Core','Full Body'].includes(ex.type))
    const hasLegsWork    = allExercises.some(ex => ['Quadríceps','Posterior','Glúteo','Panturrilha'].includes(ex.type))
    const hasUpperWork   = allExercises.some(ex => ['Peito','Costas','Ombro','Bíceps','Tríceps'].includes(ex.type))

    if (age >= 60) {
      // ── Idoso 60+ ── Tanaka 2001, ACSM 2022, Sherrington 2019
      if (daysPerWeek > 4)  { ageScore -= 12; ageIssues.push('frequência >4×/sem — risco de overuse em 60+ (recomendado 3–4×/sem)') }
      if (lowRepCount > 0)  { ageScore -= 15; ageIssues.push('exercícios de força máxima (<4 reps) sem avaliação cardiovascular prévia') }
      if (!hasCoreWork)     { ageScore -= 12; ageIssues.push('ausência de Core/equilíbrio — pilar obrigatório para prevenir quedas (Sherrington 2019)') }
      else ageOk.push('✅ Core presente — prevenção de quedas contemplada')
      if (daysPerWeek >= 2 && daysPerWeek <= 4 && lowRepCount === 0) ageOk.push('✅ Frequência e intensidade adequadas para 60+')

    } else if (ltadPhase?.fase === 'FUNdamentals') {
      // ── FUNdamentals (6–11 anos) ── LTAD, NSCA 2009
      if (lowRepCount > 0)       { ageScore -= 40; ageIssues.push('carga máxima contraindicada na fase FUNdamentals — risco de lesão epifisária (LTAD)') }
      if (heavyLoadPct > 0.2)    { ageScore -= 20; ageIssues.push('>20% exercícios com carga elevada (<6 reps) — fase FUNdamentals prioriza peso corporal e coordenação') }
      if (daysPerWeek > 3)       { ageScore -= 10; ageIssues.push('frequência >3×/sem excessiva para fase FUNdamentals — priorize diversificação motora') }
      if (!hasCoreWork && !hasLegsWork) { ageScore -= 10; ageIssues.push('treino deve incluir padrões motores multilaterais: saltar, correr, girar (LTAD FUNdamentals)') }
      else ageOk.push('✅ Padrões multilaterais presentes')
      if (daysPerWeek <= 3 && lowRepCount === 0) ageOk.push('✅ Frequência e intensidade corretas para FUNdamentals')

    } else if (ltadPhase?.fase === 'Learn to Train') {
      // ── Learn to Train (9–15 anos) ── Faigenbaum 2009, LTAD
      if (age < 14 && lowRepCount > 0) { ageScore -= 25; ageIssues.push('1RM contraindicado antes dos 14 anos — protocolo de Epley não validado (Balyi 2013)') }
      if (heavyLoadPct > 0.3)    { ageScore -= 15; ageIssues.push('>30% exercícios com carga pesada — Learn to Train: técnica primeiro, carga depois (Faigenbaum 2009)') }
      if (!hasCoreWork)          { ageScore -= 10; ageIssues.push('Core ausente — estabilidade central é base do desenvolvimento atlético nesta fase') }
      else ageOk.push('✅ Core presente — estabilidade central contemplada')
      if (daysPerWeek >= 2 && daysPerWeek <= 4) ageOk.push('✅ Frequência adequada para Learn to Train')
      if (heavyLoadPct <= 0.3)   ageOk.push('✅ Carga compatível com fase Learn to Train')

    } else if (ltadPhase?.fase === 'Train to Train') {
      // ── Train to Train (12–17 anos) ── LTAD, NSCA 2009
      if (heavyLoadPct > 0.4)    { ageScore -= 15; ageIssues.push('>40% exercícios com carga pesada — Train to Train: limite 70–75% de 1RM (NSCA 2009)') }
      if (daysPerWeek > 5)       { ageScore -= 10; ageIssues.push('frequência >5×/sem — fase Train to Train requer deload semanal para recuperação óssea') }
      if (!hasCoreWork)          { ageScore -= 8;  ageIssues.push('Core ausente — estabilização obrigatória para construção de base atlética (Train to Train)') }
      if (!hasLegsWork)          { ageScore -= 8;  ageIssues.push('Ausência de trabalho de membros inferiores — base de potência essencial nesta fase') }
      if (daysPerWeek >= 3 && daysPerWeek <= 5) ageOk.push('✅ Frequência adequada para Train to Train')
      if (heavyLoadPct <= 0.4 && hasCoreWork)  ageOk.push('✅ Intensidade e equilíbrio corretos para Train to Train')

    } else if (ltadPhase?.fase === 'Train to Compete') {
      // ── Train to Compete (17–18 anos) ── LTAD, NSCA 2021
      if (daysPerWeek > 5)       { ageScore -= 10; ageIssues.push('frequência >5×/sem pode comprometer recuperação em atleta jovem em competição') }
      if (!hasCoreWork)          { ageScore -= 8;  ageIssues.push('Core ausente — integração neuromuscular crítica para performance competitiva') }
      if (daysPerWeek >= 3)      ageOk.push('✅ Frequência de treino adequada para nível competitivo')
      if (heavyLoadPct <= 0.5)   ageOk.push('✅ Distribuição de carga compatível com Train to Compete')

    } else if (age >= 18 && age < 30) {
      // ── Adulto Jovem 18–29 ── sem restrições específicas de fase
      if (daysPerWeek >= 3) ageOk.push('✅ Frequência adequada para adulto jovem')

    } else if (age >= 30 && age < 45) {
      // ── Adulto 30–44 ── sarcopenia subclínica
      if (!hasLegsWork && !hasUpperWork) { ageScore -= 10; ageIssues.push('treino de força incompleto — a partir dos 30 anos, 2–3×/sem de força previne sarcopenia subclínica') }
      else ageOk.push('✅ Treino de força presente — prevenção de sarcopenia contemplada')

    } else if (age >= 45 && age < 60) {
      // ── Adulto Maduro 45–59 ── hormônios, ossos, CV
      if (lowRepCount > 2)       { ageScore -= 10; ageIssues.push('múltiplos exercícios de força máxima — 45+ anos: recomendável avaliação cardiovascular prévia') }
      if (!hasCoreWork)          { ageScore -= 8;  ageIssues.push('Core/equilíbrio ausente — funcional e preventivo para 45+ anos') }
      if (daysPerWeek >= 2 && daysPerWeek <= 4) ageOk.push('✅ Frequência adequada para adulto maduro')
      if (!hasLegsWork)          { ageScore -= 8;  ageIssues.push('Membros inferiores ausentes — manutenção óssea e funcional crítica para 45–59 anos (Kohrt 2004)') }
    }

    ageScore = Math.max(0, ageScore)
  }

  // TGMD-3 integration — add motor alerts to age pillar
  const tgmd = student.tgmd_scores
  if (tgmd && age && age < 18) {
    const kickScore = tgmd.chutar
    const jumpScore = tgmd.salto_h ?? tgmd.salto_v
    const runScore  = tgmd.corrida
    if (kickScore === 0) {
      ageScore -= 10
      ageIssues.push('padrão de chute Inicial (TGMD-3) — priorizar treino motor antes de exercícios de potência de MMII')
    }
    if (jumpScore === 0) {
      ageScore -= 8
      ageIssues.push('padrão de salto Inicial (TGMD-3) — incluir trabalho de recepção e aterrissagem antes de pliometria')
    }
    if (runScore === 0) {
      ageScore -= 8
      ageIssues.push('padrão de corrida Inicial (TGMD-3) — trabalhar mecânica de corrida antes de exercícios de velocidade')
    }
    ageScore = Math.max(0, ageScore)
    const tgmdSc = tgmdScore(tgmd)
    if (tgmdSc && tgmdSc.pct >= 75) ageOk.push('Padrões motores adequados (TGMD-3)')
  }

  // Use maturity offset if available for more precise phase
  const matOffset = calcMaturityOffset(student.height, student.weight, student.height_sitting, (age||0)+(new Date().getMonth()/12), 'M')
  const matLabel  = offsetLabel(matOffset)
  const phvNote   = matLabel ? ` | ${matLabel.label}` : ''

  const agePhaseLine = ltadPhase ? ` | Fase LTAD: ${ltadPhase.fase}${phvNote}` : phvNote
  const ageMsg = age === null
    ? '⚠️ Idade não cadastrada — cadastre a idade do aluno para habilitar avaliação etária completa.'
    : ageIssues.length
      ? ageIssues.map(i => `⚠️ ${i}`).join(' · ') + '.'
      : `Prescrição adequada à faixa etária (${age} anos${agePhaseLine}). ${ageOk.join(' · ')}`

  // ── Pillar 7: Dados & Monitoramento ──────────────────────────────────────
  const now2 = new Date()
  let monitorScore = 0, monitorItems = []
  if (student.weight) { monitorScore += 20; monitorItems.push('✅ Peso cadastrado') }
  else monitorItems.push('❌ Peso não cadastrado')
  if (student.height) { monitorScore += 15; monitorItems.push('✅ Altura cadastrada') }
  else monitorItems.push('❌ Altura não cadastrada')
  if (progress.some(p => (now2 - new Date(p.date + 'T12:00:00')) < 30 * 864e5)) { monitorScore += 30; monitorItems.push('✅ Avaliação física registrada nos últimos 30 dias') }
  else monitorItems.push('⚠️ Sem avaliação física recente (>30 dias)')
  if (exerciseLogs && exerciseLogs.some(l => (now2 - new Date(l.date + 'T12:00:00')) < 14 * 864e5)) { monitorScore += 35; monitorItems.push('✅ Registros de carga nos últimos 14 dias') }
  else monitorItems.push('⚠️ Sem registros de carga recentes (>14 dias)')
  const monitorMsg = monitorItems.join(' · ')

  // ── Pilar 8: Recuperação ─────────────────────────────────────────────────
  // Schoenfeld & Ogborn 2018: 48–72h entre sessões do mesmo grupo muscular
  const DIA_ORDER = { Seg:0, Ter:1, Qua:2, Qui:3, Sex:4, Sáb:5, Dom:6 }
  let recoveryScore = 100, recoveryIssues = []
  if (allDays && allDays.length >= 2) {
    const sortedDays = [...allDays].sort((a, b) => (DIA_ORDER[a.day_of_week]??9) - (DIA_ORDER[b.day_of_week]??9))
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const dayA = sortedDays[i], dayB = sortedDays[i+1]
      const gapDays = (DIA_ORDER[dayB.day_of_week]??0) - (DIA_ORDER[dayA.day_of_week]??0)
      if (gapDays <= 1) {
        const typesA = new Set((dayA.exercises||[]).map(e => e.type).filter(Boolean))
        const typesB = new Set((dayB.exercises||[]).map(e => e.type).filter(Boolean))
        const shared = [...typesA].filter(t => typesB.has(t))
        if (shared.length > 0) {
          recoveryScore -= 20
          recoveryIssues.push(`${dayA.day_of_week}→${dayB.day_of_week}: mesmo grupo muscular em dias consecutivos (${shared.slice(0,2).join(', ')})`)
        }
      }
    }
    recoveryScore = Math.max(0, recoveryScore)
  } else if (allExercises.length > 0) {
    recoveryScore = 70
  }
  const recoveryMsg = recoveryIssues.length
    ? recoveryIssues.map(i => `⚠️ ${i}`).join('. ') + '. Insira descanso de ≥48h entre sessões do mesmo grupo (Schoenfeld 2018).'
    : allDays && allDays.length >= 2
      ? `Distribuição de dias adequada — sem sobreposição de grupos musculares em dias consecutivos detectada.`
      : 'Configure os dias do plano com tipos musculares para avaliação de recuperação.'

  // ── Pilar 9: PSE & Overtraining (ACWR) ──────────────────────────────────
  // Foster 1998: carga interna = PSE × duração. ACWR seguro: 0.8–1.3
  let overtScore = 80, overtMsg = 'Dados de PSE insuficientes para calcular índice de carga interna (mínimo 4 sessões de cárdio).'
  if (cardioSessions && cardioSessions.length >= 4) {
    const now3 = new Date()
    const withLoad = cardioSessions
      .filter(s => s.pse && s.duration_minutes)
      .map(s => ({ load: s.pse * s.duration_minutes, date: new Date(s.date + 'T12:00:00') }))
      .filter(s => (now3 - s.date) < 28 * 864e5)
      .sort((a,b) => b.date - a.date)

    if (withLoad.length >= 4) {
      const acuteLoad    = withLoad.filter(s => (now3 - s.date) < 7  * 864e5).reduce((s,r) => s + r.load, 0)
      const chronicBase  = withLoad.filter(s => (now3 - s.date) < 28 * 864e5).reduce((s,r) => s + r.load, 0) / 4
      const acwr         = chronicBase > 0 ? acuteLoad / chronicBase : 1.0
      const allLoads     = withLoad.map(s => s.load)
      const meanL        = allLoads.reduce((s,v) => s+v, 0) / allLoads.length
      const stdL         = Math.sqrt(allLoads.map(v => (v-meanL)**2).reduce((s,v)=>s+v,0) / allLoads.length)
      const monotony     = stdL > 0 ? meanL / stdL : 1.0

      if (acwr > 1.5) {
        overtScore = 25
        overtMsg = `⚠️ ACWR = ${acwr.toFixed(2)} — zona de risco elevado (>1.5). Carga aguda muito superior à crônica. Reduza volume/intensidade imediatamente (Foster 1998).`
      } else if (acwr > 1.3) {
        overtScore = 55
        overtMsg = `⚠️ ACWR = ${acwr.toFixed(2)} — zona de atenção (1.3–1.5). Monitore sinais de fadiga e considere reduzir PSE das próximas sessões.`
      } else if (acwr < 0.8) {
        overtScore = 65
        overtMsg = `ACWR = ${acwr.toFixed(2)} — carga aguda abaixo da crônica. Pode indicar destreinamento ou baixa intensidade recente. Considere aumentar progressivamente.`
      } else {
        overtScore = 100
        overtMsg = `ACWR = ${acwr.toFixed(2)} — zona segura (0.8–1.3). Carga aguda e crônica equilibradas.${monotony > 2 ? ' ⚠️ Monotonia elevada (' + monotony.toFixed(1) + ') — varie tipos de sessão.' : ''}`
      }
    }
  }

  // ── Pilar 10: Variação de Estímulo ───────────────────────────────────────
  // Fonseca 2014; ACSM FITT-VP: variação de rep range a cada 4–6 semanas
  let varScore = 70, varMsg = 'Dados insuficientes para avaliar variação de estímulo (mínimo 3 semanas de registros).'
  if (exerciseLogs && exerciseLogs.length >= 6) {
    const now4 = new Date()
    const weekBuckets = {}
    exerciseLogs.forEach(log => {
      const wk = Math.floor((now4 - new Date(log.date + 'T12:00:00')) / (7 * 864e5))
      if (wk < 8) {
        if (!weekBuckets[wk]) weekBuckets[wk] = []
        const m = (log.sets?.[0]?.reps || '').toString().match(/\d+/)
        if (m) weekBuckets[wk].push(parseInt(m[0]))
      }
    })
    const weeks = Object.values(weekBuckets)
    if (weeks.length >= 3) {
      const zoneOf = reps => reps <= 6 ? 'força' : reps <= 12 ? 'hipertrofia' : 'resistência'
      const weeklyZones = weeks.map(repsArr => {
        const counts = {}
        repsArr.forEach(r => { const z = zoneOf(r); counts[z] = (counts[z]||0)+1 })
        return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'hipertrofia'
      })
      const uniqueZones = new Set(weeklyZones)
      const sameZoneStreak = weeklyZones.slice(0,6).every(z => z === weeklyZones[0])
      if (uniqueZones.size >= 3)       { varScore = 100; varMsg = `Excelente variação de estímulo detectada: treino alterna zonas de força, hipertrofia e resistência (Fonseca 2014).` }
      else if (uniqueZones.size === 2) { varScore = 75;  varMsg = `Variação moderada — ${[...uniqueZones].join(' e ')} alternados. Para estagnação máxima considere incluir zona de ${uniqueZones.has('força') ? 'resistência' : 'força'}.` }
      else if (sameZoneStreak)         { varScore = 40;  varMsg = `⚠️ Mesma zona de estímulo (${weeklyZones[0]}) por >4 semanas consecutivas — risco de adaptação. Varie o rep range nas próximas semanas.` }
      else                             { varScore = 60;  varMsg = `Pouca variação de estímulo. Alterne periodicamente entre força (1–6), hipertrofia (6–12) e resistência (12–20) reps.` }
    }
  }

  // ── Pilar 11: Adequação ao Nível ─────────────────────────────────────────
  // NSCA 2021; ACSM: parâmetros diferenciados por nível de treinamento
  const levelMap = { 'Iniciante': 0, 'Intermediário': 1, 'Avançado': 2 }
  const lvl = levelMap[level] ?? 0
  let levelScore = 100, levelIssues = []

  const LEVEL_PARAMS = [
    { minSets: 8,  maxSets: 18, minFreq: 2, maxFreq: 3, minReps: 12, maxReps: 15, label: 'Iniciante' },
    { minSets: 12, maxSets: 25, minFreq: 3, maxFreq: 4, minReps: 8,  maxReps: 12, label: 'Intermediário' },
    { minSets: 18, maxSets: 40, minFreq: 4, maxFreq: 6, minReps: 5,  maxReps: 12, label: 'Avançado' },
  ]
  const lp = LEVEL_PARAMS[lvl]

  if (allExercises.length > 0) {
    // Volume vs nível
    if (totalSets > 0 && totalSets > lp.maxSets) {
      levelScore -= 15; levelIssues.push(`volume de ${totalSets} séries excede o recomendado para ${lp.label} (máx ~${lp.maxSets}/semana) — risco de overtraining`)
    } else if (totalSets > 0 && totalSets < lp.minSets) {
      levelScore -= 10; levelIssues.push(`volume de ${totalSets} séries abaixo do esperado para ${lp.label} (mín ~${lp.minSets}/semana)`)
    }
    // Frequência vs nível
    if (daysPerWeek > lp.maxFreq) {
      levelScore -= 15; levelIssues.push(`frequência de ${daysPerWeek}×/sem elevada para ${lp.label} (recomendado ${lp.minFreq}–${lp.maxFreq}×/sem)`)
    } else if (daysPerWeek > 0 && daysPerWeek < lp.minFreq) {
      levelScore -= 8; levelIssues.push(`frequência de ${daysPerWeek}×/sem baixa para ${lp.label}`)
    }
    // Complexidade para avançados: espera variação de rep range e periodização
    if (lvl === 2 && varScore < 60) {
      levelScore -= 15; levelIssues.push('aluno avançado sem periodização detectada — esperado variação de métodos e rep ranges (NSCA 2021)')
    }
    // Iniciantes: alertar sobre exercícios de força máxima
    if (lvl === 0 && allExercises.filter(ex => parseInt(ex.reps) <= 4).length > 0) {
      levelScore -= 20; levelIssues.push('exercícios de força máxima (<5 reps) para iniciante — risco técnico elevado sem base de movimento (NSCA 2021)')
    }
    levelScore = Math.max(0, levelScore)
  } else {
    levelScore = 50
  }
  const levelMsg = levelIssues.length
    ? levelIssues.map(i => `⚠️ ${i}`).join('. ') + '.'
    : `Parâmetros de volume, frequência e complexidade compatíveis com nível ${lp.label}.`

  // ── Pilar 12: Adequação Esportiva ───────────────────────────────────────
  // Verifica se os exercícios prescritos atendem às demandas da modalidade esportiva
  // Ref: Boyle 2016 (Movement), NSCA Sport-Specific Conditioning 2021
  let sportScore = 100, sportIssues = [], sportOk = []
  const sport = student.sport

  // Perfis por modalidade — grupos musculares e padrões de movimento essenciais
  const SPORT_PROFILES = {
    futebol:   { name: 'Futebol',   needs: ['Posterior','Glúteo','Quadríceps'], core: true,  unilateral: true,  explosao: true,  pull: false, desc: 'potência de membros inferiores, core estabilizador e agilidade' },
    futsal:    { name: 'Futsal',    needs: ['Posterior','Glúteo','Quadríceps'], core: true,  unilateral: true,  explosao: true,  pull: false, desc: 'explosão em curta distância, mudança de direção e core' },
    natacao:   { name: 'Natação',   needs: ['Costas','Ombro'],                  core: true,  unilateral: false, explosao: false, pull: true,  desc: 'estabilidade de ombro, puxada e core rotacional' },
    tenis:     { name: 'Tênis',     needs: ['Ombro','Costas'],                  core: true,  unilateral: true,  explosao: true,  pull: true,  desc: 'rotação de core, unilateral, ombro e cadeia posterior' },
    basquete:  { name: 'Basquete',  needs: ['Posterior','Glúteo','Quadríceps'], core: true,  unilateral: false, explosao: true,  pull: false, desc: 'salto vertical, posterior e core' },
    volei:     { name: 'Vôlei',     needs: ['Ombro','Posterior','Glúteo'],      core: true,  unilateral: false, explosao: true,  pull: true,  desc: 'ombro, salto vertical, core e estabilidade escapular' },
    atletismo: { name: 'Atletismo', needs: ['Posterior','Glúteo','Panturrilha'],core: true,  unilateral: true,  explosao: true,  pull: false, desc: 'cadeia posterior, potência e core' },
    ginastica: { name: 'Ginástica', needs: ['Core','Costas'],                   core: true,  unilateral: false, explosao: false, pull: true,  desc: 'força relativa, core e mobilidade' },
    judo:      { name: 'Judô',      needs: ['Costas','Bíceps'],                 core: true,  unilateral: false, explosao: false, pull: true,  desc: 'puxada, força de preensão e core' },
    ciclismo:  { name: 'Ciclismo',  needs: ['Quadríceps','Posterior','Glúteo'], core: true,  unilateral: true,  explosao: false, pull: false, desc: 'extensão de joelho, cadeia posterior e core' },
    handebol:  { name: 'Handebol',  needs: ['Ombro','Costas'],                  core: true,  unilateral: true,  explosao: true,  pull: true,  desc: 'arremesso, core rotacional e explosão' },
    saude:     { name: 'Saúde e Bem-Estar', needs: ['Core'],               core: true,  unilateral: false, explosao: false, pull: false, desc: 'mobilidade, equilíbrio e condicionamento geral' },
    custom:    { name: 'Outro',     needs: [],                                  core: false, unilateral: false, explosao: false, pull: false, desc: 'modalidade personalizada' },
    outro:     { name: 'Outro',     needs: [],                                  core: false, unilateral: false, explosao: false, pull: false, desc: 'modalidade personalizada' },
  }

  const profile = sport ? SPORT_PROFILES[sport] : null

  if (!profile || sport === 'outro') {
    // Sem esporte cadastrado: pilar neutro
    sportScore = 75
    sportIssues.push('esporte não cadastrado — adicione a modalidade no perfil para avaliação esportiva específica')
  } else {
    const exTypes = allExercises.map(ex => ex.type).filter(Boolean)
    const typeSet = new Set(exTypes)

    // 1. Grupos musculares prioritários presentes?
    const missingNeeds = profile.needs.filter(n => !typeSet.has(n))
    if (missingNeeds.length > 0) {
      const penalty = missingNeeds.length * 15
      sportScore -= Math.min(penalty, 40)
      sportIssues.push(`grupos ausentes para ${profile.name}: ${missingNeeds.join(', ')} — essenciais para ${profile.desc}`)
    } else if (profile.needs.length > 0) {
      sportOk.push(`✅ Grupos prioritários do ${profile.name} presentes: ${profile.needs.join(', ')}`)
    }

    // 2. Core — quase universal no esporte
    if (profile.core && !typeSet.has('Core') && !typeSet.has('Full Body')) {
      sportScore -= 20
      sportIssues.push(`Core ausente — ${profile.desc} exige estabilidade de tronco (Boyle 2016)`)
    } else if (profile.core && (typeSet.has('Core') || typeSet.has('Full Body'))) {
      sportOk.push('✅ Core presente')
    }

    // 3. Puxada — essencial para esportes de arremesso/natação/judô
    if (profile.pull) {
      const hasPull = ['Costas','Bíceps'].some(t => typeSet.has(t))
      if (!hasPull) {
        sportScore -= 15
        sportIssues.push(`puxada ausente — ${profile.name} demanda força de puxada para equilíbrio e performance`)
      } else {
        sportOk.push('✅ Puxada presente')
      }
    }

    // 4. Exercícios unilaterais — equilíbrio e transferência motora
    if (profile.unilateral && allExercises.length > 3) {
      const unilateralKeywords = ['unilateral','avanço','lunge','pistol','step','afundo','single']
      const hasUnilateral = allExercises.some(ex =>
        unilateralKeywords.some(kw => (ex.name||'').toLowerCase().includes(kw))
      )
      if (!hasUnilateral) {
        sportScore -= 10
        sportIssues.push(`exercícios unilaterais recomendados para ${profile.name} — melhora assimetrias e transferência motora`)
      } else {
        sportOk.push('✅ Padrão unilateral detectado')
      }
    }

    // 5. Explosão/potência — esportes intermitentes de alta intensidade
    if (profile.explosao && allExercises.length > 3) {
      const powerKeywords = ['salto','jump','agachamento','squat','power','clean','snatch','sprint','pliométrico','box']
      const hasExplosion = allExercises.some(ex =>
        powerKeywords.some(kw => (ex.name||'').toLowerCase().includes(kw))
      )
      if (!hasExplosion) {
        sportScore -= 8
        sportIssues.push(`potência/explosão ausente — ${profile.name} é esporte de alta intermitência: inclua agachamentos, saltos ou exercícios pliométricos`)
      } else {
        sportOk.push('✅ Trabalho de potência detectado')
      }
    }

    sportScore = Math.max(0, Math.min(100, sportScore))
  }

  const sportMsg = !profile || sport === 'outro'
    ? '⚠️ ' + sportIssues[0]
    : sportIssues.length
      ? sportIssues.map(i => `⚠️ ${i}`).join(' · ') + '.'
      : `Prescrição alinhada às demandas de ${profile.name}. ${sportOk.join(' · ')}`

  // ── Score final ponderado (12 pilares) ───────────────────────────────────
  // Pesos ajustados: esporte +8%, etária +2%; volume e equilíbrio -1% cada; nível -2%
  const W = { volume:0.11, freq:0.09, balance:0.12, progress:0.11, objective:0.09, age:0.10, monitor:0.04, recovery:0.09, overtraining:0.07, variation:0.06, levelFit:0.04, sport:0.08 }
  const finalScore = Math.round(
    volumeScore   * W.volume      +
    freqScore     * W.freq        +
    balanceScore  * W.balance     +
    progressScore * W.progress    +
    objScore      * W.objective   +
    ageScore      * W.age         +
    monitorScore  * W.monitor     +
    recoveryScore * W.recovery    +
    overtScore    * W.overtraining +
    varScore      * W.variation   +
    levelScore    * W.levelFit    +
    sportScore    * W.sport
  )

  return {
    finalScore,
    pilares: [
      { id: 'volume',      icon: '📦', name: 'Volume de Força',         score: volumeScore,   peso: '11%', msg: volumeMsg,   ref: 'Schoenfeld 2017; ACSM 2022' },
      { id: 'balance',     icon: '⚖️', name: 'Equilíbrio Muscular',     score: balanceScore,  peso: '12%', msg: balanceMsg,  ref: 'Boyle 2016; NSCA Guidelines' },
      { id: 'recovery',    icon: '🛌', name: 'Recuperação',             score: recoveryScore, peso: '9%',  msg: recoveryMsg, ref: 'Schoenfeld & Ogborn 2018' },
      { id: 'progress',    icon: '📈', name: 'Progressão de Carga',     score: progressScore, peso: '11%', msg: progressMsg, ref: 'ACSM FITT-VP; Kraemer 2004' },
      { id: 'freq',        icon: '📅', name: 'Frequência Semanal',      score: freqScore,     peso: '9%',  msg: freqMsg,     ref: 'ACSM Position Stand 2022' },
      { id: 'objective',   icon: '🎯', name: 'Adequação ao Objetivo',   score: objScore,      peso: '9%',  msg: objMsg,      ref: 'Schoenfeld 2010; WHO 2020' },
      { id: 'overtraining',icon: '💤', name: 'PSE & Fadiga (ACWR)',     score: overtScore,    peso: '7%',  msg: overtMsg,    ref: 'Foster 1998; NSCA 2021' },
      { id: 'age',         icon: '🧬', name: 'Adequação Etária (LTAD)', score: ageScore,      peso: '10%', msg: ageMsg,      ref: 'Tanaka 2001; Balyi LTAD 2013; NSCA 2009' },
      { id: 'sport',       icon: '🏆', name: 'Adequação Esportiva',     score: sportScore,    peso: '8%',  msg: sportMsg,    ref: 'Boyle 2016; NSCA Sport-Specific 2021' },
      { id: 'variation',   icon: '🧪', name: 'Variação de Estímulo',    score: varScore,      peso: '6%',  msg: varMsg,      ref: 'Fonseca 2014; ACSM FITT-VP' },
      { id: 'levelFit',    icon: '🏅', name: 'Adequação ao Nível',      score: levelScore,    peso: '4%',  msg: levelMsg,    ref: 'NSCA 2021; ACSM 2022' },
      { id: 'monitor',     icon: '📊', name: 'Monitoramento',           score: monitorScore,  peso: '4%',  msg: monitorMsg,  ref: 'ACSM 2022' },
    ],
  }
}

// ── Histórico de score (retroativo por semana) ────────────────────────────
function computeHistoricalScores({ student, allDays, allExercises, plannedDays, exerciseLogs, cardioSessions, progress }) {
  const weeks = []
  const now = new Date()
  for (let w = 5; w >= 0; w--) {
    const cutoff = new Date(now.getTime() - w * 7 * 864e5)
    const filteredLogs    = exerciseLogs.filter(l => new Date(l.date + 'T12:00:00') <= cutoff)
    const filteredCardio  = cardioSessions.filter(s => new Date(s.date + 'T12:00:00') <= cutoff)
    const filteredProg    = progress.filter(p => new Date(p.date + 'T12:00:00') <= cutoff)
    if (filteredLogs.length < 2 && filteredCardio.length < 2 && filteredProg.length < 1) continue
    const r = runEvaluation({ student, allExercises, allDays, plannedDays, exerciseLogs: filteredLogs, cardioSessions: filteredCardio, progress: filteredProg })
    const label = w === 0 ? 'Hoje' : w === 1 ? '1s' : `${w}s`
    weeks.push({ label, score: r.finalScore })
  }
  return weeks
}


// ── TabDesenvolvimentoMotor ───────────────────────────────────────────────────
function TabDesenvolvimentoMotor({ student, studentId, onUpdate }) {
  const [scores, setScores] = useState(student.tgmd_scores || {})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const age = calcAge(student)
  const isYouth = age && age < 18

  const save = async () => {
    setSaving(true)
    await supabase.from('students').update({
      tgmd_scores: scores,
      tgmd_date:   new Date().toISOString().slice(0,10),
    }).eq('id', studentId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if(onUpdate) onUpdate()
  }

  const sc = tgmdScore(scores)
  const phvOffset = calcMaturityOffset(+student.height||null,+student.weight||null,+student.height_sitting||null,(age||0)+(new Date().getMonth()/12),'M')
  const phvLabel  = offsetLabel(phvOffset)
  const tgt       = calcTargetHeight(+student.parent_height_father||null,+student.parent_height_mother||null,'M')

  const Section = ({ title, subtitle, items }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>{subtitle}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(pattern => {
          const val = scores[pattern.id]
          const lv  = TGMD3_LEVELS.find(l => l.val === val)
          return (
            <div key={pattern.id} style={{ background: '#0A0F1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 3 }}>{pattern.label}</div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{pattern.desc}</div>
                </div>
                {lv && <div style={{ flexShrink: 0, marginLeft: 12, padding: '3px 10px', borderRadius: 6, background: lv.color + '18', border: `1px solid ${lv.color}35`, fontSize: 11, fontWeight: 700, color: lv.color }}>{lv.label}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {TGMD3_LEVELS.map(level => (
                  <button key={level.val} onClick={() => setScores(prev => ({ ...prev, [pattern.id]: level.val }))}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: 8, border: `1px solid ${val === level.val ? level.color : 'rgba(255,255,255,0.08)'}`,
                      background: val === level.val ? level.color + '20' : 'rgba(255,255,255,0.03)',
                      color: val === level.val ? level.color : '#475569', fontSize: 11, fontWeight: val === level.val ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      {/* PHV Card — se tiver dados */}
      {(phvLabel || tgt) && (
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.04))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#6366F1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Maturação Biológica — Estimativa</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tgt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>Altura alvo genética <span style={{ color: '#334155', fontSize: 10 }}>(Tanner 1970)</span></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{tgt.low}–{tgt.high} cm</span>
              </div>
            )}
            {phvLabel && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: phvLabel.color, flexShrink: 0, marginTop: 3 }}/>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: phvLabel.color }}>{phvLabel.label} <span style={{ fontWeight: 400, color: '#475569' }}>offset {phvOffset > 0 ? '+' : ''}{phvOffset} anos (Mirwald 2002)</span></div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 1.5 }}>{phvLabel.desc}</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, color: '#334155', marginTop: 10, fontStyle: 'italic' }}>Estimativa estatística. Não substitui avaliação clínica. Cadastre altura dos pais e altura sentado no Editar Perfil para ativar.</div>
        </div>
      )}

      {/* Score summary */}
      {sc && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Padrões avaliados', val: `${sc.filled}/${sc.total}`, color: '#94A3B8' },
            { label: 'Score motor', val: `${sc.pct}%`, color: sc.pct >= 75 ? '#34D399' : sc.pct >= 50 ? '#FBBF24' : '#F87171' },
            { label: 'Data avaliação', val: student.tgmd_date ? new Date(student.tgmd_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) : '—', color: '#64748B' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#0A0F1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'DM Sans',sans-serif" }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
        <strong style={{ color: '#94A3B8' }}>Como aplicar o TGMD-3:</strong> observe o atleta realizando cada padrão por pelo menos 2 tentativas. Avalie com base na qualidade do movimento, não na velocidade ou distância. Registre o nível que melhor descreve o padrão atual.
      </div>

      <Section title="Habilidades de Locomoção" subtitle="Padrões de movimento que envolvem deslocamento do corpo no espaço" items={TGMD3_LOCOMOTION} />
      <Section title="Controle de Objeto" subtitle="Padrões de manipulação e controle de implementos e bolas" items={TGMD3_OBJECT} />

      <button onClick={save} disabled={saving}
        style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: saved ? 'linear-gradient(135deg,#34D399,#059669)' : 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8, transition: 'all 0.2s' }}>
        {saving ? 'Salvando…' : saved ? '✓ Avaliação salva' : 'Salvar Avaliação Motor'}
      </button>
      <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 8 }}>TGMD-3 — Ulrich (2019). Test of Gross Motor Development, 3ª edição.</div>
    </div>
  )
}

// ── TabAvaliacao UI v2 ────────────────────────────────────────────────────
function TabAvaliacao({ student, studentId, progress }) {
  const [loading,   setLoading]  = useState(true)
  const [result,    setResult]   = useState(null)
  const [history,   setHistory]  = useState([])
  const [confidence,setConf]     = useState(null)
  const [recs,      setRecs]     = useState([])
  const [expanded,  setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState('pilares') // 'pilares' | 'recs' | 'history'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [
        { data: plans },
        { data: exLogs },
        { data: cardio },
      ] = await Promise.all([
        supabase.from('workout_plans')
          .select('*, workout_days(*, exercises(*))')
          .eq('student_id', studentId)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1),
        supabase.from('exercise_logs')
          .select('*, exercises(name)')
          .eq('student_id', studentId)
          .order('date', { ascending: false })
          .limit(300),
        supabase.from('cardio_sessions')
          .select('*')
          .eq('student_id', studentId)
          .order('date', { ascending: false })
          .limit(120),
      ])

      const activePlan   = plans?.[0]
      const allDays      = activePlan?.workout_days || []
      const allExercises = allDays.flatMap(d => d.exercises || [])
      const plannedDays  = allDays.map(d => d.day_of_week).filter(Boolean)

      const evalResult = runEvaluation({
        student, allExercises, allDays, plannedDays,
        exerciseLogs:   exLogs   || [],
        cardioSessions: cardio   || [],
        progress:       progress || [],
      })

      const conf  = getConfidence({ allExercises, exerciseLogs: exLogs||[], cardioSessions: cardio||[], progress: progress||[], student, allDays })
      const hist  = computeHistoricalScores({ student, allDays, allExercises, plannedDays, exerciseLogs: exLogs||[], cardioSessions: cardio||[], progress: progress||[] })
      const recsList = generateRecommendations(evalResult.pilares)

      setResult(evalResult)
      setConf(conf)
      setHistory(hist)
      setRecs(recsList)
      setLoading(false)
    }
    load()
  }, [studentId, student, progress])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
      <div style={{ width:24, height:24, border:'2px solid rgba(71,85,105,0.3)', borderTopColor:'#6366F1', borderRadius:'50%', margin:'0 auto 12px', animation:'spin 1s linear infinite' }}/>
      <div style={{ fontSize: 13, letterSpacing:0.5 }}>Analisando prescrição…</div>
    </div>
  )
  if (!result) return null

  const final = getScoreColor(result.finalScore)
  const confColor = confidence?.pct >= 70 ? '#4ADE80' : confidence?.pct >= 40 ? '#FBBF24' : '#F87171'
  const confLabel = confidence?.pct >= 70 ? 'Alta' : confidence?.pct >= 40 ? 'Moderada' : 'Baixa'

  const GaugeArc = ({ score }) => {
    const r = 70, cx = 90, cy = 90
    const startAngle = 220 * (Math.PI/180)
    const sweepAngle = 280 * (Math.PI/180)
    const endAngle   = startAngle - sweepAngle * (score/100)
    const arcPath = angle => ({ x: cx + r*Math.cos(angle), y: cy - r*Math.sin(angle) })
    const start  = arcPath(startAngle - sweepAngle)
    const end    = arcPath(startAngle)
    const scored = arcPath(endAngle)
    const large  = sweepAngle > Math.PI ? 1 : 0
    const sLarge = sweepAngle*(score/100) > Math.PI ? 1 : 0
    return (
      <svg width="180" height="130" viewBox="0 0 180 130">
        <defs>
          <linearGradient id="gaugeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#F87171" />
            <stop offset="40%"  stopColor="#FBBF24" />
            <stop offset="75%"  stopColor="#A3E635" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
          <filter id="glow2"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${sLarge} 1 ${scored.x} ${scored.y}`} fill="none" stroke="url(#gaugeGrad2)" strokeWidth="10" strokeLinecap="round" filter="url(#glow2)" />
        <text x="90" y="82" textAnchor="middle" fontSize="32" fontWeight="900" fill={final.text} fontFamily="'DM Sans',sans-serif">{score}</text>
        <text x="90" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill={final.text} fontFamily="'DM Sans',sans-serif" opacity="0.85">{final.label}</text>
      </svg>
    )
  }

  return (
    <div>
      {/* ── Laudo Header ── */}
      <div style={{ background: '#0A0F1A', borderRadius: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {/* Report title bar */}
        <div style={{ background: 'rgba(99,102,241,0.12)', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: '#6366F1', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>Relatório de Avaliação — {new Date().toLocaleDateString('pt-BR')}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>Índice de Qualidade da Prescrição · 12 Pilares</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Confiança dos dados</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: confColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: confColor, fontWeight: 700 }}>{confLabel} · {confidence?.pct}%</span>
            </div>
          </div>
        </div>
        {/* Score + gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 24px', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}><GaugeArc score={result.finalScore} /></div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: final.text, lineHeight: 1, marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>{result.finalScore}<span style={{ fontSize: 18, color: '#475569', fontWeight: 400 }}>/100</span></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: final.text, marginBottom: 14, letterSpacing: 0.3 }}>{final.label}</div>
            {/* Pillar score summary — compact table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
              {result.pilares.map(p => {
                const c = getScoreColor(p.score)
                return (
                  <div key={p.id} style={{ padding: '5px 8px', borderRadius: 6, background: c.bg, border: `1px solid ${c.border}`, cursor: 'pointer', textAlign: 'center' }} onClick={() => { setActiveTab('pilares'); setExpanded(p.id) }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: c.text, lineHeight: 1 }}>{p.score}</div>
                    <div style={{ fontSize: 8, color: c.text, opacity: 0.7, marginTop: 1, letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name.split(' ')[0]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'pilares', label: `${result.pilares.length} Pilares`, },
          { id: 'recs',    label: `${recs.length} Recomendações`, badge: recs.filter(r=>r.score<45).length },
          { id: 'history', label: 'Histórico', },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex:1, padding:'10px 12px', borderRadius:10, border:'none', background: activeTab===t.id ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.04)', color: activeTab===t.id ? '#fff' : '#64748B', fontWeight:700, fontSize:12, cursor:'pointer', position:'relative', boxShadow: activeTab===t.id ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
            {t.label}
            {t.badge > 0 && <span style={{ position:'absolute', top:4, right:6, background:'#F87171', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab: Pilares ── */}
      {activeTab === 'pilares' && (
        <div>
          <div style={{ marginBottom: 8, fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Clique em cada pilar para expandir</div>
          {result.pilares.map(p => {
            const c   = getScoreColor(p.score)
            const open = expanded === p.id
            return (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <div onClick={() => setExpanded(open ? null : p.id)}
                  style={{ background: '#0A0F1A', border: `1px solid ${open ? c.border : 'rgba(255,255,255,0.06)'}`, borderRadius: open ? '10px 10px 0 0' : 10, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Numbered index */}
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: open ? c.bg : 'rgba(255,255,255,0.04)', border: `1px solid ${open ? c.border : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: open ? c.text : '#475569' }}>{String(result.pilares.indexOf(p)+1).padStart(2,'0')}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', letterSpacing: 0.1 }}>{p.name}</span>
                      <span style={{ fontSize: 9, color: '#334155', background: 'rgba(255,255,255,0.03)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{p.peso}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.score}%`, borderRadius: 99, background: `linear-gradient(90deg,${c.text}99,${c.text})`, transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: c.text, lineHeight: 1 }}>{p.score}</div>
                      <div style={{ fontSize: 8, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>/ 100</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#334155', marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
                  </div>
                </div>
                {open && (
                  <div style={{ background: '#080B12', border: `1px solid ${c.border}`, borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '16px 18px' }}>
                    <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.65, marginBottom: 12, paddingLeft: 4 }}>{p.msg}</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 600 }}>{p.ref}</span>
                      </div>
                      {(RECS[p.id]?.(p.score)||[]).length > 0 && (
                        <button onClick={e => { e.stopPropagation(); setActiveTab('recs') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 11, color: '#FBBF24', fontWeight: 600, cursor: 'pointer' }}>
                          Ver recomendações
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Recomendações ── */}
      {activeTab === 'recs' && (
        <div>
          {recs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4ADE80' }}>
              <div style={{ width:40, height:40, borderRadius:8, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#4ADE80"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Nenhuma recomendação crítica</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Todos os pilares estão com score adequado.</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {recs.length} ação{recs.length > 1 ? 'ões' : ''} sugerida{recs.length > 1 ? 's' : ''} — ordenadas por prioridade
              </div>
              {recs.map((rec, i) => {
                const c = getScoreColor(rec.score)
                return (
                  <div key={i} style={{ background: '#0D1117', border: `1px solid ${c.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 10, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: c.text, flexShrink: 0 }}>#{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: c.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{rec.pilar} — score {rec.score}</div>
                      <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>{rec.txt}</div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 11, color: '#334155', fontWeight: 700, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '4px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      #{i+1}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Histórico ── */}
      {activeTab === 'history' && (
        <div>
          {history.length < 2 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#475569' }}>
              <div style={{ width:32, height:32, borderRadius:6, background:"rgba(148,163,184,0.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="#475569"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg></div>
              <div style={{ fontSize:14, fontWeight:700, color:'#94A3B8' }}>Histórico insuficiente</div>
              <div style={{ fontSize:12, marginTop:4 }}>São necessários pelo menos 2 semanas de registros para gerar o gráfico de evolução do índice.</div>
            </div>
          ) : (
            <div style={{ background:'#0D1117', borderRadius:16, padding:'20px 16px', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#94A3B8', marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>📈 Evolução do Índice de Prescrição</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <XAxis dataKey="label" tick={{ fill:'#475569', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fill:'#475569', fontSize:11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background:'rgba(4,8,32,0.97)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:10, fontSize:12, color:'#E2E8F0' }}
                    formatter={v => [`${v}/100`, 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} dot={{ fill:'#818CF8', r:4, strokeWidth:2, stroke:'#6366F1' }} activeDot={{ r:6, fill:'#A78BFA' }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop:12, display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
                {history.length >= 2 && (() => {
                  const delta = history[history.length-1].score - history[0].score
                  const col = delta > 0 ? '#4ADE80' : delta < 0 ? '#F87171' : '#94A3B8'
                  return <div style={{ fontSize:12, color:col, fontWeight:700 }}>{delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)} pontos nas últimas {history.length - 1} semanas</div>
                })()}
              </div>
            </div>
          )}
          <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(99,102,241,0.04)', borderRadius:10, border:'1px solid rgba(99,102,241,0.10)', fontSize:11, color:'#475569', lineHeight:1.6 }}>
            O histórico é calculado retroativamente usando os dados de cargas e cárdio registrados. Reflete a qualidade da prescrição ao longo do tempo com base nos dados disponíveis em cada período.
          </div>
        </div>
      )}

      {/* ── Rodapé ── */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(99,102,241,0.05)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.12)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', marginBottom: 5 }}>🔬 Sobre este avaliador v2</div>
        <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.7 }}>
          12 pilares ponderados com confiança baseada em dados disponíveis. Referências: ACSM 2022, Schoenfeld 2017, Foster 1998 (ACWR), Boyle 2016, Balyi LTAD 2013, Faigenbaum 2009, Fonseca 2014, WHO 2020, NSCA 2021, Kohrt 2004, Sherrington 2019. Ferramenta de suporte ao julgamento clínico — não substitui avaliação presencial.
        </div>
      </div>
    </div>
  )
}


export default function StudentDetail({ navigate, studentId }) {
  const [student, setStudent] = useState(null)
  const [plans, setPlans] = useState([])
  const [progress, setProgress] = useState([])
  const [tab, setTab] = useState('plans')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newProgress, setNewProgress] = useState({ date: new Date().toISOString().slice(0, 10), weight: '', notes: '', waist: '', chest: '', hip: '', thigh: '' })
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [goals, setGoals] = useState([])
  const [duplicarPlan, setDuplicarPlan] = useState(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    fetchAll()
    setShareLink(`${window.location.origin}/view/${studentId}`)
  }, [studentId])

  const fetchAll = async () => {
    setLoadingPage(true)
    setFetchError(null)
    try {
      const [stRes, plRes, prRes, gsRes] = await Promise.all([
        supabase.from('students').select('id,name,age,weight,height,goal,level,notes,teacher_id,birth_date,sport,sport_position,experience_years,guardian_name,guardian_phone,parent_message,parent_message_date,parent_height_father,parent_height_mother,height_sitting,tgmd_scores,tgmd_date').eq('id', studentId).single(),
        supabase.from('workout_plans').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
        supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      ])

      // Se a query de student falhar por coluna nova inexistente, tenta com colunas básicas
      let st = stRes.data
      if (stRes.error) {
        console.warn('fetch with new cols failed, retrying basic:', stRes.error.message)
        const fallback = await supabase.from('students').select('id,name,age,weight,height,goal,level,notes,teacher_id').eq('id', studentId).single()
        st = fallback.data
        if (!st) { setFetchError('Aluno não encontrado. Verifique o ID ou as permissões.'); setLoadingPage(false); return }
      }

      if (plRes.data) setPlans(plRes.data)
      if (prRes.data) setProgress(prRes.data)
      if (gsRes.data) setGoals(gsRes.data)

      if (st) {
        const latestWeight = prRes.data?.find(e => e.weight)?.weight
        const merged = latestWeight ? { ...st, weight: latestWeight } : st
        setStudent(merged)
        setForm(merged)
      } else {
        setFetchError('Aluno não encontrado.')
      }
    } catch (err) {
      console.error('fetchAll error:', err)
      setFetchError('Erro ao carregar dados. Verifique sua conexão.')
    } finally {
      setLoadingPage(false)
    }
  }

  const saveStudent = async () => {
    setSaving(true)
    await supabase.from('students').update({
      ...form,
      age:              +form.age              || null,
      weight:           +form.weight           || null,
      height:           +form.height           || null,
      experience_years: +form.experience_years || null,
      sport:            form.sport === 'custom' ? (form.sport_custom || 'outro') : (form.sport || null),
      sport_position:   form.sport_position    || null,
      guardian_name:      form.guardian_name     || null,
      guardian_phone:    form.guardian_phone    || null,
      parent_message:       form.parent_message    || null,
      parent_message_date:  form.parent_message ? new Date().toISOString().slice(0,10) : null,
      parent_height_father: +form.parent_height_father || null,
      parent_height_mother: +form.parent_height_mother || null,
      height_sitting:       +form.height_sitting       || null,
    }).eq('id', studentId)
    await fetchAll()
    setEditing(false)
    setSaving(false)
  }

  const createPlan = async () => {
    const { data } = await supabase.from('workout_plans').insert([{ student_id: studentId, teacher_id: student.teacher_id, title: 'Novo Plano de Treino', status: 'draft' }]).select().single()
    if (data) navigate('workout-editor', { studentId, planId: data.id })
  }

  const addProgress = async () => {
    setSaving(true)
    const measurements = { waist: newProgress.waist, chest: newProgress.chest, hip: newProgress.hip, thigh: newProgress.thigh }
    const ops = [
      supabase.from('progress_entries').insert([{ student_id: studentId, date: newProgress.date, weight: +newProgress.weight || null, notes: newProgress.notes, measurements }])
    ]
    // Sincroniza peso nos dados pessoais do aluno
    if (newProgress.weight) {
      ops.push(supabase.from('students').update({ weight: +newProgress.weight }).eq('id', studentId))
    }
    await Promise.all(ops)
    await fetchAll()
    setShowProgressForm(false)
    setNewProgress({ date: new Date().toISOString().slice(0, 10), weight: '', notes: '', waist: '', chest: '', hip: '', thigh: '' })
    setSaving(false)
  }

  const deleteProgress = async (id) => {
    if (!confirm('Excluir este registro?')) return
    await supabase.from('progress_entries').delete().eq('id', id)
    await fetchAll()
  }

  if (loadingPage) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⚙️</div>
      <div style={{ color: '#475569', fontSize: 15 }}>Carregando perfil do aluno...</div>
    </div>
  )
  if (fetchError || !student) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div style={{ color: '#F87171', fontSize: 16, fontWeight: 700, textAlign: 'center' }}>{fetchError || 'Aluno não encontrado.'}</div>
      <button onClick={() => navigate('dashboard')} style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1E293B', color: '#94A3B8', cursor: 'pointer', fontSize: 14 }}>← Voltar ao Painel</button>
    </div>
  )

  const imc = student.weight && student.height ? (student.weight / ((student.height / 100) ** 2)).toFixed(1) : '—'

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        {duplicarPlan && <DuplicarPlanoModal plan={duplicarPlan} student={student} onClose={() => setDuplicarPlan(null)} />}
        <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Painel</button>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Perfil do Aluno</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{student.name}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{student.goal} · {student.level}</div>
            </div>
            <button style={s.outlineBtn} onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : '✏️ Editar Perfil'}</button>
          </div>

          {editing ? (() => {
            const editAge  = parseInt(form.age) || null
            const editLTAD = calcLTAD(editAge, parseInt(form.experience_years) || 0, form.sport)
            const lbl10 = { fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }
            const sep = (title) => (
              <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, marginTop:8, marginBottom:2 }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
              </div>
            )
            return (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

                {sep('Dados Pessoais')}
                {[['Nome', 'name', 'text'], ['Idade', 'age', 'number'], ['Peso (kg)', 'weight', 'number'], ['Altura (cm)', 'height', 'number']].map(([l, f, t]) => (
                  <div key={f}>
                    <div style={lbl10}>{l}</div>
                    <input style={s.input} type={t} value={form[f] || ''} onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <div style={lbl10}>Objetivo</div>
                  <select style={s.select} value={form.goal || ''} onChange={e => setForm(x => ({ ...x, goal: e.target.value }))}>
                    <optgroup label="— Esportivo">
                      {['Iniciação Esportiva','Desenvolvimento Atlético','Treinamento Competitivo'].map(g=><option key={g}>{g}</option>)}
                    </optgroup>
                    <optgroup label="— Saúde e Bem-Estar">
                      {['Saúde e Bem-Estar','Condicionamento'].map(g=><option key={g}>{g}</option>)}
                    </optgroup>
                    <optgroup label="— Estética / Força">
                      {['Ganho de Massa','Emagrecimento','Força e Performance'].map(g=><option key={g}>{g}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <div style={lbl10}>Nível</div>
                  <select style={s.select} value={form.level || ''} onChange={e => setForm(x => ({ ...x, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>

                {sep('Esporte')}
                <div>
                  <div style={lbl10}>Modalidade</div>
                  <select style={s.select} value={form.sport || ''} onChange={e => setForm(x => ({ ...x, sport: e.target.value }))}>
                    <option value="">Sem esporte</option>
                    {SPORTS.map(sp => <option key={sp.id} value={sp.id}>{sp.icon} {sp.label}</option>)}
                  </select>
                  {form.sport === 'custom' && (
                    <input style={{ ...s.input, marginTop:6 }} type="text" placeholder="Qual esporte? Ex: Remo, Rugby..."
                      value={form.sport_custom||''} onChange={e => setForm(x => ({ ...x, sport_custom: e.target.value }))} />
                  )}
                </div>
                <div>
                  <div style={lbl10}>Anos de experiência</div>
                  <input style={s.input} type="number" min="0" placeholder="Ex: 2" value={form.experience_years || ''} onChange={e => setForm(x => ({ ...x, experience_years: e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={lbl10}>Posição / Especialidade</div>
                  <input style={s.input} type="text" placeholder="Ex: Meia, Goleiro..." value={form.sport_position || ''} onChange={e => setForm(x => ({ ...x, sport_position: e.target.value }))} />
                </div>

                {/* Preview LTAD */}
                {editLTAD && (
                  <div style={{ gridColumn:'1/-1', padding:'10px 14px', borderRadius:10, background: editLTAD.bg, border:`1px solid ${editLTAD.cor}33`, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{editLTAD.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:800, color: editLTAD.cor }}>Fase LTAD: {editLTAD.fase}</div>
                      <div style={{ fontSize:11, color:'#64748B' }}>{editLTAD.desc}</div>
                    </div>
                  </div>
                )}

                {/* PHV — só para menores de 18 */}
                {editAge && editAge < 18 && (<>
                  {sep('Desenvolvimento Físico — Estimativa PHV')}
                  <div>
                    <div style={lbl10}>Altura do pai (cm)</div>
                    <input style={s.input} type="number" placeholder="Ex: 178" value={form.parent_height_father||''} onChange={e=>setForm(x=>({...x,parent_height_father:e.target.value}))}/>
                  </div>
                  <div>
                    <div style={lbl10}>Altura da mãe (cm)</div>
                    <input style={s.input} type="number" placeholder="Ex: 165" value={form.parent_height_mother||''} onChange={e=>setForm(x=>({...x,parent_height_mother:e.target.value}))}/>
                  </div>
                  <div style={{gridColumn:'1/-1'}}>
                    <div style={lbl10}>Altura sentado (cm) — tronco + cabeça</div>
                    <input style={s.input} type="number" placeholder="Ex: 82" value={form.height_sitting||''} onChange={e=>setForm(x=>({...x,height_sitting:e.target.value}))}/>
                    <div style={{fontSize:10,color:'#475569',marginTop:4}}>Meça do assento ao topo da cabeça com o aluno sentado ereto</div>
                  </div>
                  {(()=>{
                    const ageD = (editAge||0) + (new Date().getMonth()/12)
                    const offset = calcMaturityOffset(+form.height||null,+form.weight||null,+form.height_sitting||null,ageD,'M')
                    const tgt    = calcTargetHeight(+form.parent_height_father||null,+form.parent_height_mother||null,'M')
                    const ol     = offsetLabel(offset)
                    if(!tgt && !ol) return null
                    return(
                      <div style={{gridColumn:'1/-1',padding:'12px 14px',borderRadius:10,background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.18)',display:'flex',flexDirection:'column',gap:8}}>
                        <div style={{fontSize:10,color:'#6366F1',fontWeight:700,letterSpacing:1.2,textTransform:'uppercase'}}>Estimativa de Desenvolvimento</div>
                        {tgt&&<div style={{fontSize:12,color:'#94A3B8'}}>Altura alvo genética: <strong style={{color:'#E2E8F0'}}>{tgt.low}–{tgt.high} cm</strong> <span style={{color:'#475569'}}>(Tanner 1970)</span></div>}
                        {ol&&<div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:ol.color,flexShrink:0,marginTop:3}}/>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:ol.color}}>{ol.label}<span style={{fontWeight:400,color:'#475569',marginLeft:6}}>offset: {offset>0?'+':''}{offset} anos (Mirwald 2002)</span></div>
                            <div style={{fontSize:11,color:'#475569',marginTop:3,lineHeight:1.5}}>{ol.desc}</div>
                          </div>
                        </div>}
                        <div style={{fontSize:10,color:'#334155',fontStyle:'italic',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:8}}>Valores são estimativas populacionais com margem de ±1 ano. Não substituem avaliação clínica especializada.</div>
                      </div>
                    )
                  })()}
                </>)}

                {sep('Responsável')}
                <div>
                  <div style={lbl10}>Nome do responsável</div>
                  <input style={s.input} type="text" placeholder="Ex: Maria Silva" value={form.guardian_name || ''} onChange={e => setForm(x => ({ ...x, guardian_name: e.target.value }))} />
                </div>
                {editAge && editAge < 18 ? (
                  <div>
                    <div style={lbl10}>WhatsApp do responsável</div>
                    <input style={s.input} type="text" placeholder="Ex: (41) 99999-9999" value={form.guardian_phone || ''} onChange={e => setForm(x => ({ ...x, guardian_phone: e.target.value }))} />
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.1)', fontSize:11, color:'#475569' }}>
                    WhatsApp — disponível para menores de 18 anos
                  </div>
                )}

                {sep('Observações')}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={lbl10}>Lesões, restrições ou observações</div>
                  <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={form.notes || ''} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} />
                </div>
                {sep('Recado para o Responsável')}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={lbl10}>Recado mensal — aparece na área do responsável</div>
                  <textarea style={{ ...s.input, minHeight:80, resize:'vertical' }} placeholder="Ex: Lucas está evoluindo muito bem na resistência. O foco deste mês é a potência de membros inferiores..." value={form.parent_message || ''} onChange={e => setForm(x => ({ ...x, parent_message: e.target.value }))} />
                  {form.parent_message && <div style={{ fontSize:10, color:'#34D399', marginTop:4 }}>Será exibido na área do responsável com a data de hoje</div>}
                </div>

                <div style={{ gridColumn:'1/-1' }}>
                  <button style={s.btn()} onClick={saveStudent} disabled={saving}>{saving ? 'Salvando...' : '✓ Salvar Alterações'}</button>
                </div>
              </div>
            )
          })() : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[['Idade', `${student.age || '—'} anos`], ['Peso', `${student.weight || '—'} kg`], ['Altura', `${student.height || '—'} cm`], ['IMC', imc]].map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={s.label}>{l}</div>
                  <div style={s.val}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Share links */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>🎮 Link do <strong>aluno</strong> — para o atleta ver e registrar o treino:</div>
              <div style={s.shareBox} onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link do aluno copiado!') }}>
                {shareLink} <span style={{ color: '#34D399', marginLeft: 8, cursor: 'pointer' }}>📋 Copiar</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>👨‍👩‍👧 Link do <strong>responsável</strong> — para o pai/mãe acompanhar a evolução:</div>
              <div style={{ ...s.shareBox, borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/parent/${studentId}`); alert('Link do responsável copiado!') }}>
                {window.location.origin}/parent/{studentId}
                <span style={{ color: '#FBBF24', marginLeft: 8, cursor: 'pointer' }}>📋 Copiar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[['plans', 'Treinos'], ['progress', 'Evolução'], ['metas', 'Metas'], ['avaliacao', 'Avaliação'],
            ...(student.age < 18 ? [['motor', 'Desenv. Motor']] : []),
            ['notes', 'Obs.']
          ].map(([id, label]) => (
            <button key={id} style={s.tab(tab === id, id === 'avaliacao' || id === 'motor')} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* PLANS TAB */}
        {tab === 'plans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button style={s.btn()} onClick={createPlan}>+ Criar Plano de Treino</button>
            </div>
            {plans.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>Nenhum plano criado ainda</div>}
            {plans.map(plan => (
              <div key={plan.id} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${STATUS_COLOR[plan.status]}20`, color: STATUS_COLOR[plan.status], border: `1px solid ${STATUS_COLOR[plan.status]}40` }}>
                      {STATUS_LABEL[plan.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{plan.title}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <button style={s.btn('#00C9FF')} onClick={() => navigate('workout-editor', { studentId, planId: plan.id })}>
                  ✏️ Editar Treino
                </button>
                <button style={{ ...s.outlineBtn, fontSize: 12 }} onClick={() => setDuplicarPlan(plan)}>
                  📋 Duplicar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS TAB */}
        {tab === 'progress' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button style={s.btn()} onClick={() => setShowProgressForm(!showProgressForm)}>+ Registrar Evolução</button>
            </div>

            {showProgressForm && (
              <div style={{ ...s.card, marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Novo Registro</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Data', 'date', 'date'], ['Peso (kg)', 'weight', 'number'], ['Cintura (cm)', 'waist', 'number'], ['Peito (cm)', 'chest', 'number'], ['Quadril (cm)', 'hip', 'number'], ['Coxa (cm)', 'thigh', 'number']].map(([l, f, t]) => (
                    <div key={f}>
                      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>{l}</div>
                      <input style={s.input} type={t} value={newProgress[f]} onChange={e => setNewProgress(x => ({ ...x, [f]: e.target.value }))} />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>Observações</div>
                    <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={newProgress.notes} onChange={e => setNewProgress(x => ({ ...x, notes: e.target.value }))} placeholder="Ex: Aluno relatou cansaço, aumentou carga no supino..." />
                  </div>
                </div>
                <button style={s.btn()} onClick={addProgress} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
              </div>
            )}

            {progress.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>Nenhum registro ainda</div>}
            {progress.map((p, i) => (
              <div key={p.id} style={{ ...s.card, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
                      {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: '#34D39920', color: '#34D399', padding: '2px 8px', borderRadius: 20, border: '1px solid #34D39940' }}>Mais recente</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {p.weight && <div><span style={{ fontSize: 10, color: '#475569' }}>Peso: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.weight} kg</span></div>}
                      {p.measurements?.waist && <div><span style={{ fontSize: 10, color: '#475569' }}>Cintura: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.waist} cm</span></div>}
                      {p.measurements?.chest && <div><span style={{ fontSize: 10, color: '#475569' }}>Peito: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.chest} cm</span></div>}
                      {p.measurements?.hip && <div><span style={{ fontSize: 10, color: '#475569' }}>Quadril: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.hip} cm</span></div>}
                      {p.measurements?.thigh && <div><span style={{ fontSize: 10, color: '#475569' }}>Coxa: </span><span style={{ fontWeight: 700, color: '#E2E8F0' }}>{p.measurements.thigh} cm</span></div>}
                    </div>
                    {p.notes && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>📝 {p.notes}</div>}
                  </div>
                  <button onClick={() => deleteProgress(p.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* METAS TAB — read-only para o professor */}
        {tab === 'metas' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>🎯 Metas do Aluno</div>
              <span style={{ fontSize: 11, color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>👁️ Somente visualização</span>
            </div>
            {goals.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div style={{ fontSize: 14, color: '#475569' }}>O aluno ainda não cadastrou nenhuma meta.</div>
              </div>
            ) : (
              <>
                {['ativa','concluida'].map(status => {
                  const list = goals.filter(g => g.status === status)
                  if (!list.length) return null
                  const statusLabel = status === 'ativa' ? 'Em andamento' : 'Concluídas ✅'
                  return (
                    <div key={status} style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{statusLabel}</div>
                      {list.map(g => {
                        const catColors = { peso:'#34D399', imc:'#60A5FA', medida:'#A78BFA', forca:'#FBBF24', cardio:'#F87171', habito:'#F5C842', outro:'#94A3B8' }
                        const cc = catColors[g.category] || '#94A3B8'
                        const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null
                        return (
                          <div key={g.id} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${cc}`, opacity: status === 'concluida' ? 0.65 : 1 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                              <div>
                                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                                  <span style={{ fontSize:13, fontWeight:800, color:'#CBD5E1', textDecoration: status==='concluida'?'line-through':'none' }}>{g.title}</span>
                                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${cc}18`, color:cc, border:`1px solid ${cc}35` }}>{g.category}</span>
                                </div>
                                {g.target_value && <div style={{ fontSize:12, color:'#64748B' }}>Alvo: <strong style={{ color:cc }}>{g.target_value} {g.target_unit}</strong></div>}
                                {g.description && g.description !== g.title && <div style={{ fontSize:11, color:'#475569', marginTop:3, fontStyle:'italic' }}>{g.description}</div>}
                                {daysLeft !== null && status === 'ativa' && (
                                  <div style={{ fontSize:11, color: daysLeft<7?'#F87171':daysLeft<30?'#FBBF24':'#475569', fontWeight:600, marginTop:4 }}>
                                    {daysLeft>0 ? `⏳ ${daysLeft} dias restantes` : daysLeft===0 ? '🔔 Prazo hoje!' : `⚠️ ${Math.abs(daysLeft)}d em atraso`}
                                  </div>
                                )}
                              </div>
                              {status === 'concluida' && <span style={{ fontSize:18 }}>✅</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* AVALIACAO TAB */}
        {tab === 'avaliacao' && (
          <TabAvaliacao
            student={student}
            studentId={studentId}
            progress={progress}
          />
        )}

        {/* MOTOR DEVELOPMENT TAB */}
        {tab === 'motor' && student.age < 18 && (
          <TabDesenvolvimentoMotor
            student={student}
            studentId={studentId}
            onUpdate={fetchAll}
          />
        )}

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <div style={s.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>Observações do Aluno</div>
            {editing ? null : (
              student.notes
                ? <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.7 }}>{student.notes}</div>
                : <div style={{ color: '#334155', fontSize: 14 }}>Nenhuma observação registrada. Clique em "Editar Perfil" para adicionar.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
