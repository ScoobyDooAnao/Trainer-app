import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ── Design tokens StudentDetail ──────────────────────────────────────────────
const C = {
  bg:      '#080F1A',
  surface: '#0D1117',
  surface2:'#111827',
  border:  'rgba(255,255,255,0.07)',
  text:    '#E2E8F0',
  textSub: '#64748B',
  textDim: '#334155',
  blue:    '#3B82F6',
  green:   '#22C55E',
  amber:   '#F59E0B',
}
const s = {
  wrap:  { minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif" },
  inner: { maxWidth:780, margin:'0 auto', padding:'22px 16px' },
  back:  { background:'none', border:'none', color:C.textSub, fontSize:13, cursor:'pointer', marginBottom:18, display:'flex', alignItems:'center', gap:5, fontFamily:'inherit', fontWeight:600 },
  header:{ background:C.surface, borderRadius:16, padding:'18px 22px', marginBottom:14, border:`1px solid ${C.border}` },
  tabs:  { display:'flex', gap:4, marginBottom:14, background:C.surface, borderRadius:12, padding:4, border:`1px solid ${C.border}` },
  tab:   (active) => ({
    flex:1, padding:'10px 6px', borderRadius:9, border:'none',
    background: active ? C.blue : 'transparent',
    color: active ? '#fff' : C.textSub,
    fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit',
    boxShadow: active ? '0 2px 10px rgba(59,130,246,0.4)' : 'none',
    transition:'all 0.15s', whiteSpace:'nowrap',
  }),
  card:  { background:C.surface, borderRadius:14, padding:'16px 18px', border:`1px solid ${C.border}`, marginBottom:10 },
  label: { fontSize:10, color:C.textSub, textTransform:'uppercase', letterSpacing:1, marginBottom:3, display:'block' },
  val:   { fontSize:15, fontWeight:700, color:C.text },
  input: { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:9, padding:'10px 13px', color:C.text, fontSize:13, outline:'none', marginBottom:10, boxSizing:'border-box', fontFamily:'inherit' },
  select:{ width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:9, padding:'10px 13px', color:C.text, fontSize:13, outline:'none', marginBottom:10, boxSizing:'border-box', fontFamily:'inherit' },
  btn:   (color='#22C55E') => ({ background:color, border:'none', borderRadius:9, padding:'10px 18px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }),
  outlineBtn: { background:'transparent', border:`1px solid ${C.border}`, borderRadius:9, padding:'10px 18px', color:C.textSub, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  shareBox: { background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:9, padding:'10px 14px', fontSize:12, color:'#93C5FD', wordBreak:'break-all', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 },
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

  // ── Pillar 1: Volume ─────────────────────────────────────────────────────
  const totalSets = allExercises.reduce((sum, ex) => sum + (parseInt(ex.sets) || 3), 0)
  let volumeScore = 0, volumeMsg = ''

  if (goal === 'Saúde e Bem-Estar') {
    // Saúde e Bem-Estar: avalia combinação força + cardio vs diretrizes OMS/ACSM EIM
    // OMS 2020: ≥150 min/sem aeróbio moderado + força 2x/sem
    const now_vol = new Date()
    const last14c = (cardioSessions||[]).filter(s => (now_vol - new Date(s.date+'T12:00:00')) < 14*864e5)
    const weeklyCardioMin = last14c.reduce((a,s) => a+(s.duration_minutes||0), 0) / 2
    const hasStrength = daysPerWeek >= 2 && totalSets >= 4  // pelo menos 2 dias e 4 séries
    const cardioOk   = weeklyCardioMin >= 150
    const cardioMod  = weeklyCardioMin >= 90

    if (totalSets === 0 && last14c.length === 0) {
      volumeScore = 0
      volumeMsg = 'Nenhum exercício ou sessão de cardio registrado. OMS 2020: ≥150 min/sem aeróbio + força 2×/sem para saúde geral.'
    } else if (!hasStrength && !cardioOk) {
      volumeScore = 30
      volumeMsg = `Volume insuficiente em ambas as modalidades. Força: ${totalSets} séries (alvo: ≥4 séries, 2×/sem). Cardio: ~${Math.round(weeklyCardioMin)} min/sem (alvo: ≥150 min). OMS 2020; ACSM Exercise is Medicine.`
    } else if (hasStrength && !cardioMod) {
      volumeScore = 55
      volumeMsg = `Força adequada (${totalSets} séries, ${daysPerWeek}×/sem). Volume de cardio baixo (~${Math.round(weeklyCardioMin)} min/sem) — OMS recomenda ≥150 min/sem para saúde cardiovascular. Inclua ≥3 sessões aeróbias semanais.`
    } else if (!hasStrength && cardioOk) {
      volumeScore = 65
      volumeMsg = `Cardio adequado (~${Math.round(weeklyCardioMin)} min/sem). Treino de força insuficiente (${daysPerWeek}×/sem) — ACSM EIM recomenda ≥2×/sem de força para prevenção de sarcopenia e osteoporose.`
    } else if (hasStrength && cardioMod && !cardioOk) {
      volumeScore = 80
      volumeMsg = `Boa combinação de força e cardio. Volume aeróbio próximo do alvo (~${Math.round(weeklyCardioMin)}/150 min/sem). Aumentar 1–2 sessões de cardio para atingir diretriz OMS 2020.`
    } else {
      volumeScore = 100
      volumeMsg = `Excelente combinação: força ${daysPerWeek}×/sem (${totalSets} séries) + ~${Math.round(weeklyCardioMin)} min/sem de cardio. Dentro das diretrizes OMS 2020 e ACSM Exercise is Medicine.`
    }
  } else {
    // Demais objetivos — lógica original (hipertrofia/performance)
    // ACSM 2022: 10–20 séries/grupo muscular/semana (Schoenfeld 2017)
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

  if (goal === 'Saúde e Bem-Estar') {
    // ── Saúde e Bem-Estar — avaliação completamente diferente ──
    // Foco: exercícios multiarticulares funcionais + mobilidade + cardio OMS 2020
    objScore = 70; objIssues = []

    // 1. Exercícios multiarticulares funcionais (Cook 2010; ACSM EIM)
    const FUNCTIONAL_KEYWORDS = ['agachamento','squat','leg press','terra','deadlift','afundo','lunge','step','remada','puxada','pull','supino','desenvolvimento','flexão','push']
    const hasFunctional = allExercises.filter(ex =>
      FUNCTIONAL_KEYWORDS.some(kw => (ex.name||'').toLowerCase().includes(kw))
    ).length
    const functionalPct = allExercises.length > 0 ? hasFunctional / allExercises.length : 0

    if (functionalPct >= 0.6) {
      objScore += 15
    } else if (functionalPct >= 0.3) {
      objScore += 5
      objIssues.push('menos de 60% dos exercícios são multiarticulares funcionais — para saúde geral priorize padrões: agachar, empurrar, puxar, carregar (Cook 2010)')
    } else if (allExercises.length > 0) {
      objScore -= 10
      objIssues.push('poucos exercícios funcionais detectados — ACSM EIM recomenda movimentos multiarticulares como base da prescrição para saúde')
    }

    // 2. Mobilidade — grupos Core e Full Body como proxy (Nelson 2007)
    const hasMobility = allExercises.some(ex => ['Core','Full Body'].includes(ex.type))
    if (hasMobility) {
      objScore += 10
    } else if (allExercises.length > 3) {
      objIssues.push('ausência de trabalho de Core/mobilidade — para capacidade funcional inclua mobilidade de quadril, torácica e ombro (Nelson et al. 2007)')
    }

    // 3. Intensidade adequada — PSE e rep range (ACSM EIM: 40–60% 1RM, PSE 3–5)
    const heavyCount = allExercises.filter(ex => { const m=(ex.reps||'').match(/\d+/); return m && parseInt(m[0]) < 6 }).length
    const heavyPct   = allExercises.length > 0 ? heavyCount/allExercises.length : 0
    if (heavyPct > 0.3) {
      objScore -= 12
      objIssues.push(`${Math.round(heavyPct*100)}% dos exercícios com carga pesada (<6 reps) — para saúde e bem-estar a intensidade ideal é 40–60% de 1RM (PSE 3–5), não força máxima (ACSM EIM)`)
    }

    // 4. Volume aeróbio — central para saúde cardiovascular (OMS 2020; Kodama 2009)
    const now_obj = new Date()
    const last14c_obj = (cardioSessions||[]).filter(s => (now_obj - new Date(s.date+'T12:00:00')) < 14*864e5)
    const weeklyCardioMin_obj = last14c_obj.reduce((a,s) => a+(s.duration_minutes||0), 0) / 2
    if (weeklyCardioMin_obj >= 150) {
      objScore += 15
    } else if (weeklyCardioMin_obj >= 90) {
      objScore += 5
      objIssues.push(`cardio: ~${Math.round(weeklyCardioMin_obj)} min/sem — aumentar para ≥150 min/sem para atingir diretriz OMS 2020 de saúde cardiovascular`)
    } else {
      objScore -= 10
      objIssues.push(`cardio insuficiente (~${Math.round(weeklyCardioMin_obj)} min/sem) — OMS 2020 recomenda 150–300 min/sem de intensidade moderada para prevenção de doenças crônicas`)
    }

    objScore = Math.max(0, Math.min(100, objScore))

  } else {
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
  }

  const objMsg = goal === 'Saúde e Bem-Estar'
    ? objIssues.length
      ? objIssues.map(i => `⚠️ ${i}`).join('. ') + '.'
      : `Prescrição alinhada às diretrizes de saúde: exercícios funcionais, mobilidade e volume aeróbio adequados. OMS 2020; ACSM Exercise is Medicine; Cook 2010.`
    : objIssues.length
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
  // Para Saúde e Bem-Estar: recuperação entre sessões de baixa intensidade não é problema crítico
  // O risco de overuse é muito menor — mas ausência total de dias ativos pode ser sinalizada
  const recoveryMsg = goal === 'Saúde e Bem-Estar'
    ? recoveryIssues.length
      ? recoveryIssues.map(i => `⚠️ ${i}`).join('. ') + '. Para saúde geral, a intensidade moderada permite recuperação mais rápida — porém respeite ≥24h entre sessões do mesmo grupo.'
      : allDays && allDays.length >= 2
        ? 'Distribuição de dias adequada para saúde e bem-estar. Intensidade moderada permite recuperação em 24–48h (ACSM EIM).'
        : 'Configure os dias do plano para avaliação de recuperação.'
    : recoveryIssues.length
      ? recoveryIssues.map(i => `⚠️ ${i}`).join('. ') + '. Insira descanso de ≥48h entre sessões do mesmo grupo (Schoenfeld 2018).'
      : allDays && allDays.length >= 2
        ? 'Distribuição de dias adequada — sem sobreposição de grupos musculares em dias consecutivos detectada.'
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
  // ── Pesos diferenciados por objetivo ─────────────────────────────────────
  // Saúde e Bem-Estar: cardio e funcionalidade pesam mais; força máx e esporte pesam menos
  const isSaude = goal === 'Saúde e Bem-Estar'
  const W = isSaude
    ? { volume:0.16, freq:0.10, balance:0.10, progress:0.06, objective:0.16, age:0.08, monitor:0.05, recovery:0.07, overtraining:0.10, variation:0.05, levelFit:0.04, sport:0.03 }
    : { volume:0.11, freq:0.09, balance:0.12, progress:0.11, objective:0.09, age:0.10, monitor:0.04, recovery:0.09, overtraining:0.07, variation:0.06, levelFit:0.04, sport:0.08 }

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
    pilares: isSaude ? [
      // Saúde e Bem-Estar — pilares renomeados e reordenados por relevância clínica
      { id: 'volume',       name: 'Volume: Força + Cardio',         score: volumeScore,   peso: '16%', msg: volumeMsg,   ref: 'OMS 2020; ACSM Exercise is Medicine; Kodama 2009' },
      { id: 'objective',    name: 'Prescrição Funcional',           score: objScore,      peso: '16%', msg: objMsg,      ref: 'Cook 2010; Nelson 2007; ACSM EIM; OMS 2020' },
      { id: 'overtraining', name: 'Carga Interna (PSE/ACWR)',       score: overtScore,    peso: '10%', msg: overtMsg,    ref: 'Foster 1998 — intensidade moderada é central' },
      { id: 'freq',         name: 'Consistência Semanal',           score: freqScore,     peso: '10%', msg: freqMsg,     ref: 'ACSM EIM: 3–5×/sem para saúde geral' },
      { id: 'balance',      name: 'Equilíbrio Funcional',           score: balanceScore,  peso: '10%', msg: balanceMsg,  ref: 'Boyle 2016; Cook 2010 — prevenção de lesão' },
      { id: 'age',          name: 'Adequação Etária',               score: ageScore,      peso: '8%',  msg: ageMsg,      ref: 'Kohrt 2004; Sherrington 2019; Tanaka 2001' },
      { id: 'recovery',     name: 'Recuperação',                    score: recoveryScore, peso: '7%',  msg: recoveryMsg, ref: 'ACSM EIM — intensidade moderada, 24–48h' },
      { id: 'monitor',      name: 'Monitoramento',                  score: monitorScore,  peso: '5%',  msg: monitorMsg,  ref: 'ACSM 2022' },
      { id: 'progress',     name: 'Progressão',                     score: progressScore, peso: '6%',  msg: progressMsg, ref: 'ACSM FITT-VP — progressão conservadora' },
      { id: 'variation',    name: 'Variação de Estímulo',           score: varScore,      peso: '5%',  msg: varMsg,      ref: 'Fonseca 2014 — variedade mantém adesão' },
      { id: 'levelFit',     name: 'Adequação ao Nível',             score: levelScore,    peso: '4%',  msg: levelMsg,    ref: 'NSCA 2021' },
      { id: 'sport',        name: 'Especificidade',                 score: sportScore,    peso: '3%',  msg: sportMsg,    ref: 'Menor peso — saúde geral não requer especificidade esportiva' },
    ] : [
      { id: 'volume',      name: 'Volume de Força',         score: volumeScore,   peso: '11%', msg: volumeMsg,   ref: 'Schoenfeld 2017; ACSM 2022' },
      { id: 'balance',     name: 'Equilíbrio Muscular',     score: balanceScore,  peso: '12%', msg: balanceMsg,  ref: 'Boyle 2016; NSCA Guidelines' },
      { id: 'recovery',    name: 'Recuperação',             score: recoveryScore, peso: '9%',  msg: recoveryMsg, ref: 'Schoenfeld & Ogborn 2018' },
      { id: 'progress',    name: 'Progressão de Carga',     score: progressScore, peso: '11%', msg: progressMsg, ref: 'ACSM FITT-VP; Kraemer 2004' },
      { id: 'freq',        name: 'Frequência Semanal',      score: freqScore,     peso: '9%',  msg: freqMsg,     ref: 'ACSM Position Stand 2022' },
      { id: 'objective',   name: 'Adequação ao Objetivo',   score: objScore,      peso: '9%',  msg: objMsg,      ref: 'Schoenfeld 2010; WHO 2020' },
      { id: 'overtraining',name: 'PSE & Fadiga (ACWR)',     score: overtScore,    peso: '7%',  msg: overtMsg,    ref: 'Foster 1998; NSCA 2021' },
      { id: 'age',         name: 'Adequação Etária (LTAD)', score: ageScore,      peso: '10%', msg: ageMsg,      ref: 'Tanaka 2001; Balyi LTAD 2013; NSCA 2009' },
      { id: 'sport',       name: 'Adequação Esportiva',     score: sportScore,    peso: '8%',  msg: sportMsg,    ref: 'Boyle 2016; NSCA Sport-Specific 2021' },
      { id: 'variation',   name: 'Variação de Estímulo',    score: varScore,      peso: '6%',  msg: varMsg,      ref: 'Fonseca 2014; ACSM FITT-VP' },
      { id: 'levelFit',    name: 'Adequação ao Nível',      score: levelScore,    peso: '4%',  msg: levelMsg,    ref: 'NSCA 2021; ACSM 2022' },
      { id: 'monitor',     name: 'Monitoramento',           score: monitorScore,  peso: '4%',  msg: monitorMsg,  ref: 'ACSM 2022' },
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

// ── TabAvaliacao — Painel de 6 Fatores (automático) ──────────────────────────
function TabAvaliacao({ student, studentId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Step 1: fetch all plans (sem filtro de status) + logs em paralelo
        const [plansRes, exLogsRes] = await Promise.all([
          supabase.from('workout_plans').select('id,title,status').eq('student_id', studentId).order('created_at',{ascending:false}),
          supabase.from('exercise_logs').select('exercise_id,date,sets,exercises(name,type,rest_seconds)').eq('student_id', studentId).order('date',{ascending:false}).limit(200),
        ])
        // Prefere plano ativo, se não tiver pega o primeiro
        const allPlans = plansRes.data || []
        const activePlan = allPlans.find(p => p.status === 'active') || allPlans[0] || null
        const plans  = activePlan ? [activePlan] : []
        const exLogs = exLogsRes.data || []

        // Step 2: buscar dias do plano encontrado, depois exercícios separadamente
        let wDays = []
        if (activePlan) {
          const { data: wd } = await supabase
            .from('workout_days')
            .select('id,day_of_week,name')
            .eq('plan_id', activePlan.id)
          if (wd && wd.length > 0) {
            const dayIds = wd.map(d => d.id)
            const { data: exs } = await supabase
              .from('exercises')
              .select('id,name,sets,reps,rest,type,day_id')
              .in('day_id', dayIds)
            const exByDay = {}
            ;(exs || []).forEach(e => {
              if (!exByDay[e.day_id]) exByDay[e.day_id] = []
              exByDay[e.day_id].push({ ...e, rest_seconds: e.rest })
            })
            wDays = wd.map(d => ({ ...d, exercises: exByDay[d.id] || [] }))
          }
        }

        setData({ plans, exLogs, wDays })
      } catch (err) {
        console.error('TabAvaliacao load error:', err)
        setData({ plans:[], exLogs:[], wDays:[] })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#64748B' }}>Analisando treinos...</div>

  const { plans, exLogs, wDays } = data
  const hasPlan = plans.length > 0
  const age     = parseInt(student.age) || null
  const nivel   = student.level || 'Iniciante'
  const goal    = student.goal  || ''

  // ── helpers ────────────────────────────────────────────────────────────────
  const semaforo = (status) => {
    const map = {
      ok:      { cor:'#34D399', bg:'rgba(52,211,153,0.07)',  border:'rgba(52,211,153,0.2)',  label:'Adequado'    },
      atencao: { cor:'#FBBF24', bg:'rgba(251,191,36,0.07)',  border:'rgba(251,191,36,0.2)',  label:'Atenção'     },
      critico: { cor:'#F87171', bg:'rgba(248,113,113,0.07)', border:'rgba(248,113,113,0.2)', label:'Crítico'     },
      sem:     { cor:'#475569', bg:'rgba(255,255,255,0.03)', border:'rgba(255,255,255,0.07)',label:'Sem dados'   },
    }
    return map[status] || map.sem
  }

  // ── 1. INTENSIDADE (1RM via Epley) ─────────────────────────────────────────
  const calcIntensidade = () => {
    if (!exLogs.length) return { status:'sem', valor:null, rec:'', detail:'' }

    // Agrupar logs por exercício, pegar carga máx por série
    const byEx = {}
    exLogs.forEach(l => {
      if (!l.sets) return
      const maxW = Math.max(...l.sets.map(s => +(s.weight||0)))
      const maxR = Math.max(...l.sets.map(s => +(s.reps||0)))
      if (maxW > 0 && maxR > 0) {
        const rm = maxW * (1 + maxR / 30) // Epley
        const name = l.exercises?.name || l.exercise_id
        if (!byEx[name] || rm > byEx[name].rm) byEx[name] = { rm, w: maxW, r: maxR }
      }
    })

    const entries = Object.entries(byEx)
    if (!entries.length) return { status:'sem', valor:null, rec:'', detail:'' }

    // Calcular % média de intensidade relativa ao 1RM estimado
    const pcts = entries.map(([, v]) => {
      const pct = (v.w / v.rm) * 100
      return pct
    })
    const avgPct = pcts.reduce((a,b) => a+b, 0) / pcts.length

    // Faixas por objetivo
    const zonas = {
      'Força e Performance': { ideal:[80,95], nome:'Força (80–95% 1RM)' },
      'Ganho de Massa':      { ideal:[67,80], nome:'Hipertrofia (67–80% 1RM)' },
      'Emagrecimento':       { ideal:[50,70], nome:'Resistência (50–70% 1RM)' },
      'Condicionamento':     { ideal:[50,70], nome:'Resistência (50–70% 1RM)' },
    }
    const zona = zonas[goal] || { ideal:[60,80], nome:'Moderada (60–80% 1RM)' }
    const [min, max] = zona.ideal

    let status = avgPct >= min && avgPct <= max ? 'ok'
               : avgPct < min - 10 || avgPct > max + 10 ? 'critico' : 'atencao'

    return {
      status,
      valor: avgPct.toFixed(0) + '% 1RM médio',
      detail: `Zona alvo: ${zona.nome}. Baseado em ${entries.length} exercício(s) com carga registrada.`,
      rec: status === 'ok'
        ? 'Intensidade dentro da zona ideal para o objetivo. Mantenha a progressão de carga gradual.'
        : status === 'atencao'
        ? 'Intensidade fora da zona ideal. Revise as cargas dos principais exercícios.'
        : avgPct < min
        ? 'Cargas abaixo do necessário para o objetivo. Aumente progressivamente 5% por semana.'
        : 'Cargas muito elevadas — risco de fadiga acumulada. Reduza 10% e reconstrua progressão.',
    }
  }

  // ── 2. VOLUME por grupo muscular (Schoenfeld et al., 2017) ──────────────────
  const calcVolume = () => {
    if (!wDays.length) return { status:'sem', valor:null, rec:'', detail:'' }

    // Mapeamento exercício → grupo muscular primário
    const MUSCLE_MAP = {
      // Peito
      supino: 'Peito', 'supino reto': 'Peito', 'supino inclinado': 'Peito',
      'supino declinado': 'Peito', crucifixo: 'Peito', voador: 'Peito',
      'crossover': 'Peito', 'peck deck': 'Peito', 'flexão': 'Peito', 'push up': 'Peito',
      // Costas
      remada: 'Costas', 'puxada': 'Costas', 'barra fixa': 'Costas',
      'levantamento terra': 'Costas', 'pulldown': 'Costas', 'pull': 'Costas',
      'serrote': 'Costas', 'cavalinho': 'Costas', 'hiperextensão': 'Costas',
      // Ombro
      desenvolvimento: 'Ombro', 'elevação lateral': 'Ombro', 'elevação frontal': 'Ombro',
      'arnold': 'Ombro', 'face pull': 'Ombro', 'encolhimento': 'Ombro',
      // Bíceps
      'rosca direta': 'Bíceps', 'rosca alternada': 'Bíceps', 'rosca martelo': 'Bíceps',
      'rosca concentrada': 'Bíceps', 'rosca scott': 'Bíceps', 'curl': 'Bíceps',
      // Tríceps
      'tríceps': 'Tríceps', 'triceps': 'Tríceps', 'mergulho': 'Tríceps',
      'extensão': 'Tríceps', 'testa': 'Tríceps', 'corda': 'Tríceps', 'paralelas': 'Tríceps',
      // Quadríceps
      agachamento: 'Quadríceps', 'leg press': 'Quadríceps', 'hack': 'Quadríceps',
      'cadeira extensora': 'Quadríceps', 'avanço': 'Quadríceps', 'afundo': 'Quadríceps',
      'passada': 'Quadríceps', 'búlgaro': 'Quadríceps',
      // Posterior/Isquiotibiais
      stiff: 'Posterior', 'mesa flexora': 'Posterior', 'flexora': 'Posterior',
      'leg curl': 'Posterior', 'good morning': 'Posterior',
      // Glúteo
      'glúteo': 'Glúteo', 'gluteo': 'Glúteo', 'hip thrust': 'Glúteo',
      'elevação pélvica': 'Glúteo', 'abdução': 'Glúteo',
      // Panturrilha
      'panturrilha': 'Panturrilha', 'gêmeos': 'Panturrilha', 'gemeos': 'Panturrilha',
      'calf': 'Panturrilha',
      // Abdômen
      'abdominal': 'Abdômen', 'prancha': 'Abdômen', 'crunch': 'Abdômen',
      'oblíquo': 'Abdômen', 'obliquo': 'Abdômen', 'plank': 'Abdômen',
    }

    const findGroup = (name) => {
      const n = (name || '').toLowerCase()
      for (const [key, group] of Object.entries(MUSCLE_MAP)) {
        if (n.includes(key)) return group
      }
      return 'Outros'
    }

    // Contar sets por grupo muscular
    const setsByGroup = {}
    wDays.forEach(d => {
      ;(d.exercises || []).forEach(ex => {
        const group = findGroup(ex.name)
        const sets  = +(ex.sets || 0)
        setsByGroup[group] = (setsByGroup[group] || 0) + sets
      })
    })

    const grupos = Object.entries(setsByGroup).filter(([g]) => g !== 'Outros')
    if (!grupos.length) return { status:'sem', valor:null, rec:'', detail:'Nenhum exercício mapeado para grupo muscular.' }

    // Faixa de referência por nível (sets/grupo/semana)
    const REF = {
      'Iniciante':          { min:10, max:15 },
      'Intermediário':      { min:12, max:18 },
      'Avançado':           { min:16, max:22 },
      'Atleta Jovem':       { min:12, max:20 },
      'Atleta Competitivo': { min:18, max:25 },
    }
    const ref = REF[nivel] || REF['Iniciante']

    // Avaliar cada grupo
    const baixos   = grupos.filter(([,s]) => s < ref.min).map(([g,s]) => `${g} (${s} sets)`)
    const altos    = grupos.filter(([,s]) => s > ref.max).map(([g,s]) => `${g} (${s} sets)`)
    const ok       = grupos.filter(([,s]) => s >= ref.min && s <= ref.max).length
    const total    = grupos.length

    // Score geral: % de grupos dentro da faixa
    const pctOk = total > 0 ? ok / total : 0
    const status = pctOk >= 0.8 ? 'ok' : pctOk >= 0.5 ? 'atencao' : 'critico'

    // Texto de recomendação focado nos grupos problemáticos
    let rec = ''
    if (status === 'ok') {
      rec = 'Volume equilibrado entre os grupos musculares. Mantenha a progressão gradual.'
    } else {
      const partes = []
      if (baixos.length) partes.push(`Volume insuficiente em: ${baixos.join(', ')} — adicione séries ou um dia extra para esses grupos.`)
      if (altos.length)  partes.push(`Volume excessivo em: ${altos.join(', ')} — reduza séries ou distribua em mais dias para evitar overreaching.`)
      rec = partes.join(' ')
    }

    const totalSets = grupos.reduce((a,[,s]) => a+s, 0)

    return {
      status,
      valor: `${ok}/${total} grupos musculares no volume ideal`,
      detail: `Análise por grupo: ${grupos.map(([g,s])=>`${g}: ${s} sets`).join(' · ')}. Ref. ${nivel}: ${ref.min}–${ref.max} sets/grupo/semana. (Schoenfeld et al., 2017)`,
      rec,
    }
  }

  // ── 3. FREQUÊNCIA (vezes por músculo por semana) ───────────────────────────
  const calcFrequencia = () => {
    if (!wDays.length) return { status:'sem', valor:null, rec:'', detail:'' }

    const diasComTreino = wDays.filter(d => (d.exercises||[]).length > 0).length

    const refFreq = {
      'Iniciante':    { min:2, max:3, label:'2–3x/semana' },
      'Intermediário':{ min:3, max:4, label:'3–4x/semana' },
      'Avançado':     { min:4, max:6, label:'4–6x/semana' },
      'Atleta Jovem': { min:3, max:5, label:'3–5x/semana' },
      'Atleta Competitivo': { min:4, max:6, label:'4–6x/semana' },
    }
    const ref = refFreq[nivel] || refFreq['Iniciante']
    const status = diasComTreino >= ref.min && diasComTreino <= ref.max ? 'ok'
                 : diasComTreino < ref.min - 1 || diasComTreino > ref.max + 1 ? 'critico' : 'atencao'

    return {
      status,
      valor: diasComTreino + 'x/semana',
      detail: `Referência para ${nivel}: ${ref.label}. Cada grupo muscular deve ser estimulado 2x/semana para hipertrofia ideal.`,
      rec: status === 'ok'
        ? 'Frequência adequada para o nível. Garanta que grupos musculares principais apareçam em pelo menos 2 dias.'
        : diasComTreino < ref.min
        ? 'Frequência abaixo do ideal. Adicione mais dias de treino ou redistribua os grupos musculares.'
        : 'Frequência elevada — verifique se há descanso suficiente entre os dias de mesmo grupo muscular.',
    }
  }

  // ── 4. DENSIDADE (tempo estimado de sessão) ────────────────────────────────
  const calcDensidade = () => {
    if (!wDays.length) return { status:'sem', valor:null, rec:'', detail:'' }

    // Estimativa: (sets × tempo_série) + (sets × descanso)
    // Tempo por série: ~40s execução. Descanso padrão: 90s se não cadastrado
    let totalMinEstimado = 0
    let diasCount = 0

    wDays.forEach(d => {
      if (!(d.exercises||[]).length) return
      diasCount++
      let minDia = 0
      d.exercises.forEach(ex => {
        const sets     = +(ex.sets || 3)
        const descanso = +(ex.rest_seconds || 90) // segundos de descanso entre séries
        // 1 min (60s) por série + descanso entre séries (sets-1 intervalos)
        minDia += sets * 60 + (sets - 1) * descanso
      })
      totalMinEstimado += minDia / 60
    })

    if (!diasCount) return { status:'sem', valor:null, rec:'', detail:'' }
    const mediaPorDia = Math.round(totalMinEstimado / diasCount)

    // Referência: 45–75 min por sessão (ACSM)
    const status = mediaPorDia >= 45 && mediaPorDia <= 75 ? 'ok'
                 : mediaPorDia < 30 || mediaPorDia > 90 ? 'critico' : 'atencao'

    return {
      status,
      valor: '~' + mediaPorDia + ' min/sessão',
      detail: 'Estimativa baseada nos sets, execução (~40s/série) e descanso prescrito. Referência ACSM: 45–75 min.',
      rec: status === 'ok'
        ? 'Duração de sessão dentro do ideal. Sessões muito longas reduzem cortisol e prejudicam a recuperação.'
        : mediaPorDia < 45
        ? 'Sessão curta — pode indicar volume insuficiente ou descanso muito curto entre séries.'
        : 'Sessão longa demais. Acima de 75–90 min, o nível de cortisol e fadiga comprometem o ganho. Reduza volume ou aumente o descanso.',
    }
  }

  // ── 5. ORDEM DOS EXERCÍCIOS ────────────────────────────────────────────────
  const calcOrdem = () => {
    if (!wDays.length) return { status:'sem', valor:null, rec:'', detail:'' }

    const MULTIARTICULARES = ['agachamento','supino','levantamento','terra','remada','barra','desenvolvimento','leg press','hack','stiff','avanço','afundo','paralelas','mergulho','clean','snatch']
    const ISOLADOS = ['curl','rosca','extensão','crucifixo','voador','pulldown','puxada','tríceps','bíceps','panturrilha','elevação']

    let diasOk = 0, diasTotal = 0

    wDays.forEach(d => {
      const exs = (d.exercises || [])
      if (exs.length < 2) return
      diasTotal++
      const names = exs.map(e => (e.name||'').toLowerCase())

      const firstMulti = names.findIndex(n => MULTIARTICULARES.some(m => n.includes(m)))
      const firstIsolado = names.findIndex(n => ISOLADOS.some(i => n.includes(i)))

      // Ok se: não tem isolado (tudo é multi), ou multi vem antes do isolado
      if (firstIsolado === -1 || firstMulti === -1 || firstMulti < firstIsolado) diasOk++
    })

    if (!diasTotal) return { status:'sem', valor:null, rec:'', detail:'' }

    const pct = Math.round((diasOk / diasTotal) * 100)
    const status = pct >= 80 ? 'ok' : pct >= 50 ? 'atencao' : 'critico'

    return {
      status,
      valor: pct + '% dos dias com ordem correta',
      detail: 'Multiarticulares (agachamento, supino, terra) devem preceder isolados (curl, extensão). Pesos livres antes de máquinas quando possível.',
      rec: status === 'ok'
        ? 'Ordem dos exercícios adequada. Exercícios compostos no início garantem máximo recrutamento neural.'
        : 'Revise a ordem dos exercícios. Coloque multiarticulares (agachamento, supino, terra) antes dos isolados para otimizar o estímulo neuromuscular.',
    }
  }

  // ── 6. RECUPERAÇÃO ─────────────────────────────────────────────────────────
  const calcRecuperacao = () => {
    if (!exLogs.length) return { status:'sem', valor:null, rec:'', detail:'' }

    // Verificar dias consecutivos de treino (sem folga)
    const datesSet = [...new Set(exLogs.map(l => l.date?.slice(0,10)).filter(Boolean))].sort()
    if (datesSet.length < 2) return { status:'sem', valor:null, rec:'', detail:'' }

    let maxConsec = 1, currConsec = 1, alerts = 0
    for (let i = 1; i < datesSet.length; i++) {
      const diff = (new Date(datesSet[i]) - new Date(datesSet[i-1])) / 86400000
      if (diff === 1) {
        currConsec++
        if (currConsec > 3) alerts++
      } else {
        maxConsec = Math.max(maxConsec, currConsec)
        currConsec = 1
      }
    }
    maxConsec = Math.max(maxConsec, currConsec)

    // Descanso médio entre os dias do plano
    const descansosPlan = []
    if (wDays.length > 1) {
      const DIA_JS = { Dom:0,Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6 }
      const diasJS = wDays.map(d => DIA_JS[d.day_of_week]).filter(x => x !== undefined).sort((a,b)=>a-b)
      for (let i = 1; i < diasJS.length; i++) descansosPlan.push(diasJS[i] - diasJS[i-1])
    }
    const minDescanso = descansosPlan.length ? Math.min(...descansosPlan) : 1

    const status = maxConsec <= 3 && minDescanso >= 1 ? 'ok'
                 : maxConsec > 5 || minDescanso === 0 ? 'critico' : 'atencao'

    return {
      status,
      valor: maxConsec + ' dias consecutivos máx · ' + (minDescanso) + 'd descanso mín entre sessões',
      detail: 'Baseado nos logs de treino registrados. Recomendado: máx 3 dias consecutivos, mínimo 48h entre grupos musculares iguais.',
      rec: status === 'ok'
        ? 'Padrão de recuperação adequado. Mantenha pelo menos 1 dia de descanso a cada 3 dias de treino.'
        : maxConsec > 3
        ? 'Muitos dias consecutivos sem descanso detectados. Inclua dias de recuperação ativa ou descanso completo.'
        : 'Dias de treino consecutivos no plano sem descanso suficiente. Redistribua os dias para garantir 48h de recuperação por grupo muscular.',
    }
  }

  const fatores = [
    { id:'intensidade', label:'Intensidade das Cargas', icone:'🏋️', ...calcIntensidade(), ref:'Zatsiorsky & Kraemer, 2006' },
    { id:'volume',      label:'Volume Semanal',         icone:'📊', ...calcVolume(),      ref:'Schoenfeld et al., 2017' },
    { id:'frequencia',  label:'Frequência',             icone:'📅', ...calcFrequencia(),  ref:'Ralston et al., 2017' },
    { id:'densidade',   label:'Densidade (estimada)',   icone:'⏱️', ...calcDensidade(),   ref:'ACSM Guidelines, 2022' },
    { id:'ordem',       label:'Ordem dos Exercícios',   icone:'🔢', ...calcOrdem(),       ref:'NSCA, 2016' },
    { id:'recuperacao', label:'Recuperação',            icone:'😴', ...calcRecuperacao(), ref:'Meeusen et al., 2013' },
  ]

  const semCount = { ok:0, atencao:0, critico:0, sem:0 }
  fatores.forEach(f => semCount[f.status]++)


  return (
    <div style={s.card}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0', marginBottom:4 }}>Avaliação de Treino</div>
        <div style={{ fontSize:12, color:'#475569' }}>Análise automática baseada no plano ativo e logs de carga</div>
        {!hasPlan && (
          <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(217,119,6,0.08)', borderRadius:10, border:'1px solid rgba(217,119,6,0.2)', fontSize:12, color:'#92400E', fontWeight:600 }}>
            Nenhum plano ativo encontrado. Crie um plano de treino para ativar a análise completa.
          </div>
        )}
      </div>

      {/* Semáforo geral */}
      <div style={{ display:'flex', gap:8, marginBottom:20, padding:'12px 16px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
        {[
          { k:'ok',      label:'Adequado', cor:'#16A34A' },
          { k:'atencao', label:'Atenção',  cor:'#D97706' },
          { k:'critico', label:'Crítico',  cor:'#DC2626' },
          { k:'sem',     label:'Sem dados',cor:'#94A3B8' },
        ].map(({ k, label, cor }) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:6, flex:1, justifyContent:'center' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:cor, boxShadow: semCount[k] > 0 ? '0 0 8px '+cor : 'none' }} />
            <span style={{ fontSize:12, fontWeight:700, color:cor }}>{semCount[k]}</span>
            <span style={{ fontSize:10, color:'#64748B' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Fatores */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {fatores.map(f => {
          const sem  = semaforo(f.status)
          const open = expandido === f.id
          return (
            <div key={f.id}
              style={{ borderRadius:12, border:'1.5px solid '+sem.border, background:sem.bg, overflow:'hidden', transition:'all 0.2s' }}>
              {/* Linha principal — clicável */}
              <div onClick={() => setExpandido(open ? null : f.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}>
                {/* Semáforo dot */}
                <div style={{ width:12, height:12, borderRadius:'50%', background:sem.cor, boxShadow:'0 0 8px '+sem.cor+'80', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F0' }}>{f.label}</div>
                  {f.valor && <div style={{ fontSize:11, color:sem.cor, fontWeight:700, marginTop:2 }}>{f.valor}</div>}
                  {!f.valor && <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>Sem dados suficientes</div>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, background:sem.cor+'18', color:sem.cor, border:'1px solid '+sem.cor+'40' }}>{sem.label}</span>
                  <span style={{ color:'#94A3B8', fontSize:14 }}>{open ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expandido */}
              {open && (
                <div style={{ padding:'0 16px 14px', borderTop:'1px solid '+sem.border }}>
                  {f.detail && (
                    <div style={{ fontSize:11, color:'#64748B', lineHeight:1.6, marginTop:10, marginBottom:8 }}>{f.detail}</div>
                  )}
                  <div style={{ padding:'10px 12px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', fontSize:12, color:'#CBD5E1', lineHeight:1.6 }}>
                    <span style={{ fontWeight:700, color:sem.cor }}>Recomendação: </span>{f.rec}
                  </div>
                  <div style={{ marginTop:6, fontSize:9, color:'#94A3B8', fontStyle:'italic' }}>Ref: {f.ref}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}




// ── TgmdDeltaRow — delta between first and last score ────────────────────────
function TgmdDeltaRow({ history }) {
  if (!history || history.length < 2) return null
  const delta = history[history.length-1].score - history[0].score
  const col = delta > 0 ? '#4ADE80' : delta < 0 ? '#F87171' : '#94A3B8'
  return (
    <div style={{ fontSize:12, color:col, fontWeight:700 }}>
      {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)} pontos nas últimas {history.length - 1} semanas
    </div>
  )
}

// ── EditFormFields — form de edição do perfil do aluno ───────────────────────
// ── SepDark — separador dark para formulário de edição ───────────────────────
function SepDark({ title }) {
  return (
    <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, marginTop:16, marginBottom:4 }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

function EditFormFields({ form, setForm }) {
  const f   = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const inp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase', letterSpacing:1, fontWeight:700, display:'block', marginTop:12 }
  // Sep defined at module level
  const editAge  = parseInt(form.age) || null
  const editLTAD = calcLTAD(editAge, parseInt(form.experience_years) || 0, form.sport)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <SepDark title="Dados Pessoais" />
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Nome</label>
        <input style={inp} value={form.name||''} onChange={e=>f('name',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Idade</label>
        <input style={inp} type="number" placeholder="Ex: 14" value={form.age||''} onChange={e=>f('age',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Nível</label>
        <select style={inp} value={form.level||''} onChange={e=>f('level',e.target.value)}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Peso (kg)</label>
        <input style={inp} type="number" placeholder="Ex: 55" value={form.weight||''} onChange={e=>f('weight',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Altura (cm)</label>
        <input style={inp} type="number" placeholder="Ex: 165" value={form.height||''} onChange={e=>f('height',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Altura sentado (cm)</label>
        <input style={inp} type="number" placeholder="Para PHV" value={form.height_sitting||''} onChange={e=>f('height_sitting',e.target.value)} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Objetivo</label>
        <select style={inp} value={form.goal||''} onChange={e=>f('goal',e.target.value)}>
          <optgroup label="Esportivo">
            {['Iniciação Esportiva','Desenvolvimento Atlético','Treinamento Competitivo'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
          <optgroup label="Saúde">
            {['Saúde e Bem-Estar','Condicionamento'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
          <optgroup label="Estética / Força">
            {['Ganho de Massa','Emagrecimento','Força e Performance'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
        </select>
      </div>

      <SepDark title="Esporte" />
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Modalidade</label>
        <select style={inp} value={form.sport||''} onChange={e=>f('sport',e.target.value)}>
          <option value="">Nenhuma</option>
          {SPORTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Posição / Especialidade</label>
        <input style={inp} placeholder="Ex: Meia, Ala..." value={form.sport_position||''} onChange={e=>f('sport_position',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Anos de experiência</label>
        <input style={inp} type="number" min="0" placeholder="Ex: 2" value={form.experience_years||''} onChange={e=>f('experience_years',e.target.value)} />
      </div>
      {editLTAD && (
        <div style={{ gridColumn:'1/-1', padding:'8px 12px', borderRadius:10, background:editLTAD.bg, border:'1px solid '+editLTAD.cor+'33', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:editLTAD.cor, display:'inline-block', flexShrink:0 }} />
          <div style={{ fontSize:11, fontWeight:700, color:editLTAD.cor }}>LTAD: {editLTAD.fase}</div>
        </div>
      )}

      <SepDark title="Responsável" />
      <div>
        <label style={lbl}>Nome do responsável</label>
        <input style={inp} placeholder="Ex: Maria Silva" value={form.guardian_name||''} onChange={e=>f('guardian_name',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>WhatsApp</label>
        <input style={inp} placeholder="(41) 99999-9999" value={form.guardian_phone||''} onChange={e=>f('guardian_phone',e.target.value)} />
      </div>

      <SepDark title="Maturação (PHV)" />
      <div>
        <label style={lbl}>Altura pai (cm)</label>
        <input style={inp} type="number" placeholder="Ex: 178" value={form.parent_height_father||''} onChange={e=>f('parent_height_father',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Altura mãe (cm)</label>
        <input style={inp} type="number" placeholder="Ex: 165" value={form.parent_height_mother||''} onChange={e=>f('parent_height_mother',e.target.value)} />
      </div>

      <SepDark title="Observações" />
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Lesões, restrições, notas</label>
        <textarea style={{ ...inp, minHeight:65, resize:'vertical', fontFamily:'inherit' }}
          placeholder="Ex: entorse tornozelo direito..."
          value={form.notes||''} onChange={e=>f('notes',e.target.value)} />
      </div>
    </div>
  )
}


// ── ProgressTab — Medidas e Força ────────────────────────────────────────────
function ProgressTab({ progress, exLogs, showProgressForm, setShowProgressForm, newProgress, setNewProgress, addProgress, deleteProgress, saving, s }) {
  const [subTab, setSubTab] = useState('medidas')
  const [selEx,  setSelEx]  = useState(null)

  const fmtDate = (d) => {
    if (!d) return ''
    const [,m,day] = String(d).slice(0,10).split('-')
    return day + '/' + m
  }

  // ── Força: agrupar logs por exercício ──────────────────────────────────────
  const exercicios = useMemo(() => {
    const map = {}
    ;(exLogs || []).forEach(l => {
      const name = l._name || l.exercise_id
      if (!map[name]) map[name] = []
      const maxW = Math.max(...(l.sets||[]).map(s => +(s.weight||0)))
      if (maxW > 0) map[name].push({ date: l.date?.slice(0,10), max: maxW })
    })
    // Sort each exercise by date
    Object.values(map).forEach(arr => arr.sort((a,b) => a.date > b.date ? 1 : -1))
    return map
  }, [exLogs])

  const exNames = Object.keys(exercicios)
  const exSel   = selEx || exNames[0] || null
  const exData  = exSel ? exercicios[exSel] || [] : []

  // Deduplicate by date (keep max per date)
  const exDataDedup = useMemo(() => {
    const byDate = {}
    exData.forEach(e => { if (!byDate[e.date] || e.max > byDate[e.date]) byDate[e.date] = e.max })
    return Object.entries(byDate).sort().map(([date, max]) => ({ date, max }))
  }, [exData])

  // ── Mini SVG chart ─────────────────────────────────────────────────────────
  const MiniChart = ({ data, color }) => {
    if (data.length < 2) return (
      <div style={{ textAlign:'center', padding:'24px 0', color:'#334155', fontSize:12 }}>
        Registre pelo menos 2 sessões com carga para ver o gráfico.
      </div>
    )
    const W=320, H=100, PL=36, PR=12, PT=8, PB=24
    const vals = data.map(d => d.max)
    const minV = Math.min(...vals), maxV = Math.max(...vals)
    const range = maxV - minV || 1
    const cx = (i) => PL + (i/(data.length-1))*(W-PL-PR)
    const cy = (v) => PT + (1-(v-minV)/range)*(H-PT-PB)
    const pts = data.map((d,i) => cx(i)+','+cy(d.max)).join(' ')
    const area = 'M'+cx(0)+','+cy(data[0].max)+' '+
      data.slice(1).map((d,i)=>'L'+cx(i+1)+','+cy(d.max)).join(' ')+
      ' L'+cx(data.length-1)+','+(H-PB)+' L'+cx(0)+','+(H-PB)+' Z'
    const first = data[0].max, last = data[data.length-1].max
    const delta = +(last-first).toFixed(1)
    const pr = exDataDedup.length > 0 ? Math.max(...exDataDedup.map(d=>d.max)) : 0
    const isNewPr = last >= pr && data.length > 1

    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'#475569' }}>
            <span style={{ fontWeight:700, color:'#E2E8F0', fontSize:20 }}>{last}kg</span>
            {' '}
            <span style={{ fontSize:11, fontWeight:700, color: delta >= 0 ? '#34D399' : '#F87171', background: (delta>=0?'#34D399':'#F87171')+'18', padding:'2px 8px', borderRadius:20 }}>
              {delta >= 0 ? '+' : ''}{delta}kg
            </span>
          </div>
          {isNewPr && (
            <div style={{ fontSize:10, fontWeight:800, color:'#A78BFA', background:'rgba(167,139,250,0.15)', padding:'3px 10px', borderRadius:20, border:'1px solid rgba(167,139,250,0.3)' }}>
              PR {pr}kg
            </div>
          )}
        </div>
        <div style={{ overflowX:'auto' }}>
          <svg width={W} height={H} style={{ display:'block', minWidth:W }}>
            {[0,0.5,1].map(t => {
              const y = PT + t*(H-PT-PB)
              const v = (maxV - t*range).toFixed(1)
              return (
                <g key={t}>
                  <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="rgba(255,255,255,0.04)" />
                  <text x={PL-4} y={y+4} textAnchor="end" fontSize={8} fill="#334155">{v}</text>
                </g>
              )
            })}
            {data.map((d,i) => (
              (i===0||i===data.length-1||(data.length>4&&i===Math.floor(data.length/2)))
                ? <text key={i} x={cx(i)} y={H-PB+14} textAnchor="middle" fontSize={8} fill="#334155">{fmtDate(d.date)}</text>
                : null
            ))}
            <path d={area} fill={color+'10'} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d,i) => (
              <circle key={i} cx={cx(i)} cy={cy(d.max)} r={i===data.length-1?5:3}
                fill={color} stroke="#0D1117" strokeWidth={2} />
            ))}
          </svg>
        </div>
        <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{data.length} sessões registradas · {fmtDate(data[0].date)} → {fmtDate(data[data.length-1].date)}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['medidas','Medidas'],['forca','Força']].map(([id,label]) => (
          <button key={id} onClick={() => setSubTab(id)}
            style={{ padding:'8px 20px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
              background: subTab===id ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.05)',
              color: subTab===id ? '#fff' : '#475569',
              boxShadow: subTab===id ? '0 4px 14px rgba(124,58,237,0.35)' : 'none' }}>
            {label}
          </button>
        ))}
        <button style={{ ...s.btn(C.green), marginLeft:'auto' }} onClick={() => setShowProgressForm(!showProgressForm)}>
          + Registrar Evolução
        </button>
      </div>

      {/* Form */}
      {showProgressForm && (
        <div style={{ ...s.card, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:16 }}>Novo Registro de Medidas</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Data','date','date'],['Peso (kg)','weight','number'],['Cintura (cm)','waist','number'],['Peito (cm)','chest','number'],['Quadril (cm)','hip','number'],['Coxa (cm)','thigh','number']].map(([l,f,t]) => (
              <div key={f}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                <input style={s.input} type={t} value={newProgress[f]} onChange={e => setNewProgress(x => ({ ...x, [f]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observações</div>
              <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={newProgress.notes} onChange={e => setNewProgress(x => ({ ...x, notes: e.target.value }))} placeholder="Ex: Aluno relatou cansaço, aumentou carga no supino..." />
            </div>
          </div>
          <button style={s.btn(C.green)} onClick={addProgress} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
        </div>
      )}

      {/* ── MEDIDAS ── */}
      {subTab === 'medidas' && (
        <>
          {progress.length === 0
            ? <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhum registro ainda</div>
            : progress.map((p, i) => (
              <div key={p.id} style={{ ...s.card, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:13, color:'#34D399', fontWeight:700, marginBottom:8 }}>
                      {new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
                      {i===0 && <span style={{ marginLeft:8, fontSize:10, background:'#34D39920', color:'#34D399', padding:'2px 8px', borderRadius:20, border:'1px solid #34D39940' }}>Mais recente</span>}
                    </div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                      {p.weight && <div><span style={{ fontSize:10, color:'#475569' }}>Peso: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.weight} kg</span></div>}
                      {p.measurements?.waist && <div><span style={{ fontSize:10, color:'#475569' }}>Cintura: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.waist} cm</span></div>}
                      {p.measurements?.chest && <div><span style={{ fontSize:10, color:'#475569' }}>Peito: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.chest} cm</span></div>}
                      {p.measurements?.hip && <div><span style={{ fontSize:10, color:'#475569' }}>Quadril: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.hip} cm</span></div>}
                      {p.measurements?.thigh && <div><span style={{ fontSize:10, color:'#475569' }}>Coxa: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.thigh} cm</span></div>}
                    </div>
                    {p.notes && <div style={{ fontSize:12, color:'#64748B', marginTop:8 }}>{p.notes}</div>}
                  </div>
                  <button onClick={() => deleteProgress(p.id)} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16 }}>🗑</button>
                </div>
              </div>
            ))
          }
        </>
      )}

      {/* ── FORÇA ── */}
      {subTab === 'forca' && (
        <div>
          {exNames.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#334155', fontSize:13 }}>
              Nenhuma carga registrada ainda. O aluno precisa registrar as cargas nos exercícios pelo link dele.
            </div>
          ) : (
            <>
              {/* Seletor de exercício */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                {exNames.map(name => (
                  <button key={name} onClick={() => setSelEx(name)}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                      background: (exSel===name) ? '#7C3AED' : 'rgba(255,255,255,0.05)',
                      color: (exSel===name) ? '#fff' : '#475569',
                      transition:'all 0.15s' }}>
                    {name}
                  </button>
                ))}
              </div>

              {/* Gráfico */}
              {exSel && (
                <div style={{ ...s.card, marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F0', marginBottom:12 }}>{exSel}</div>
                  <MiniChart data={exDataDedup} color="#A78BFA" />
                </div>
              )}

              {/* Histórico de cargas */}
              {exSel && exDataDedup.length > 0 && (
                <div style={{ ...s.card }}>
                  <div style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Histórico</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
                    {[...exDataDedup].reverse().map((d,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                        <span style={{ fontSize:12, color:'#475569' }}>{new Date(d.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>
                        <span style={{ fontSize:14, fontWeight:800, color:'#A78BFA' }}>{d.max} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}


// ── AnamneseTab — PAR-Q + Anamnese do Personal (ACSM) ───────────────────────

// ── Camada 1: PAR-Q ──────────────────────────────────────────────────────────
const PARQ_PERGUNTAS = [
  { id:'cardiaco',    texto:'Médico já disse que você tem algum problema no coração?' },
  { id:'dor_peito',  texto:'Você sente dor no peito ao realizar atividade física?' },
  { id:'tontura',    texto:'Já perdeu o equilíbrio ou a consciência por tontura recentemente?' },
  { id:'osseo',      texto:'Tem problema ósseo ou articular que piora com exercício?' },
  { id:'medicamento',texto:'Usa medicamento para pressão arterial ou problema cardíaco?' },
  { id:'gestante',   texto:'Está grávida ou deu à luz nos últimos 3 meses?' },
  { id:'outra_razao',texto:'Existe outra razão física pela qual não deveria praticar atividade física?' },
]

// ── Camada 2: Anamnese do Personal ───────────────────────────────────────────
const LIMITACOES_OPTS = [
  { id:'nenhuma',       label:'Nenhuma' },
  { id:'ombro_esq',     label:'Ombro Esq.' },
  { id:'ombro_dir',     label:'Ombro Dir.' },
  { id:'joelho_esq',    label:'Joelho Esq.' },
  { id:'joelho_dir',    label:'Joelho Dir.' },
  { id:'coluna_lom',    label:'Coluna Lombar' },
  { id:'coluna_cer',    label:'Coluna Cervical' },
  { id:'quadril',       label:'Quadril' },
  { id:'tornozelo_esq', label:'Tornozelo Esq.' },
  { id:'tornozelo_dir', label:'Tornozelo Dir.' },
  { id:'cotovelo_esq',  label:'Cotovelo Esq.' },
  { id:'cotovelo_dir',  label:'Cotovelo Dir.' },
  { id:'punho_esq',     label:'Punho Esq.' },
  { id:'punho_dir',     label:'Punho Dir.' },
  { id:'quadriceps',    label:'Quadríceps' },
  { id:'posterior',     label:'Posterior Coxa' },
]

const EXPERIENCIA_OPTS = [
  { id:'nunca',    label:'Nunca treinou' },
  { id:'menos1',   label:'Menos de 1 ano' },
  { id:'1a2',      label:'1–2 anos' },
  { id:'3a5',      label:'3–5 anos' },
  { id:'5mais',    label:'5+ anos' },
  { id:'voltando', label:'Voltando após pausa' },
]

const PAUSA_OPTS = [
  { id:'1a3m',     label:'1–3 meses' },
  { id:'3a6m',     label:'3–6 meses' },
  { id:'6a12m',    label:'6–12 meses' },
  { id:'mais1ano', label:'Mais de 1 ano' },
]

const PREFERENCIAS_OPTS = [
  { id:'nenhuma',       label:'Nenhuma preferência' },
  { id:'musculacao',    label:'Musculação' },
  { id:'cardio',        label:'Cardio' },
  { id:'aparelhos',     label:'Aparelhos/Máquinas' },
  { id:'pesos_livres',  label:'Pesos Livres' },
  { id:'funcional',     label:'Funcional' },
  { id:'hiit',          label:'HIIT' },
  { id:'alongamento',   label:'Alongamento/Mobilidade' },
  { id:'natacao',       label:'Natação' },
  { id:'outdoor',       label:'Ao ar livre' },
]

const SAUDE_OPTS = [
  { id:'nenhuma',      label:'Nenhuma' },
  { id:'hipertensao',  label:'Hipertensão' },
  { id:'diabetes',     label:'Diabetes' },
  { id:'cardiopatia',  label:'Cardiopatia' },
  { id:'asma',         label:'Asma/Respiratório' },
  { id:'osteoporose',  label:'Osteoporose' },
  { id:'artrite',      label:'Artrite/Artrose' },
  { id:'herniadisco',  label:'Hérnia de Disco' },
]

function Chip({ label, selected, onClick, color, warn }) {
  const cor = warn ? '#F87171' : (color || '#60A5FA')
  return (
    <button onClick={onClick} style={{
      padding:'6px 13px', borderRadius:20, fontSize:11, fontWeight:600,
      cursor:'pointer', fontFamily:'inherit',
      border:`1.5px solid ${selected ? cor : 'rgba(255,255,255,0.1)'}`,
      background: selected ? `${cor}22` : 'rgba(255,255,255,0.04)',
      color: selected ? cor : '#475569', transition:'all 0.15s',
    }}>{label}</button>
  )
}

function SecLabel({ title, sub }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F0' }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function AnamneseTab({ studentId, teacherId, s }) {
  const [data,    setData]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  const EMPTY = {
    // PAR-Q
    parq: {},
    // Anamnese
    limitacoes: [], limitacao_detalhe: '',
    experiencia: '', tempo_pausa: '',
    preferencias: [], condicoes_saude: [],
    historico: '',
  }

  useEffect(() => {
    supabase.from('anamnese').select('*').eq('student_id', studentId).single()
      .then(({ data: d }) => { setData(d ? { ...EMPTY, ...d } : EMPTY); setLoading(false) })
  }, [studentId])

  // Toggle array — se clicar em "nenhuma", limpa tudo e coloca só nenhuma
  const toggleArr = (field, val) => setData(p => {
    const arr = p[field] || []
    if (val === 'nenhuma') return { ...p, [field]: arr.includes('nenhuma') ? [] : ['nenhuma'] }
    const sem = arr.filter(x => x !== 'nenhuma')
    return { ...p, [field]: sem.includes(val) ? sem.filter(x=>x!==val) : [...sem, val] }
  })

  const toggleParq = (id) => setData(p => ({
    ...p, parq: { ...p.parq, [id]: !p.parq?.[id] }
  }))

  const set1 = (field, val) => setData(p => ({ ...p, [field]: p[field]===val ? '' : val }))

  const save = async () => {
    setSaving(true)
    await supabase.from('anamnese').upsert([{
      student_id: studentId, teacher_id: teacherId,
      ...data, updated_at: new Date().toISOString(),
    }], { onConflict: 'student_id' })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding:30, textAlign:'center', color:'#334155' }}>Carregando...</div>

  const parqPositivos = PARQ_PERGUNTAS.filter(q => data.parq?.[q.id])
  const alerta = parqPositivos.length > 0

  const inp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ══ CAMADA 1: PAR-Q ══════════════════════════════════════════════════ */}
      <div style={{ ...s.card, borderColor: alerta ? 'rgba(248,113,113,0.35)' : undefined }}>
        <SecLabel
          title="PAR-Q — Prontidão para Atividade Física"
          sub="Instrumento validado pelo ACSM. Marque SIM nas perguntas que se aplicam ao aluno."
        />

        {alerta && (
          <div style={{ marginBottom:12, padding:'10px 14px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, fontSize:12, color:'#F87171', lineHeight:1.6 }}>
            ⚠ {parqPositivos.length} resposta(s) positiva(s). Recomendado encaminhamento médico antes do início do programa.
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {PARQ_PERGUNTAS.map(q => {
            const sim = !!data.parq?.[q.id]
            return (
              <div key={q.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background: sim ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.03)', border:`1px solid ${sim ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ flex:1, fontSize:12, color: sim ? '#F87171' : '#CBD5E1', lineHeight:1.5 }}>{q.texto}</div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => { if (sim) toggleParq(q.id) }}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${!sim ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`, background: !sim ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)', color: !sim ? '#34D399' : '#475569' }}>
                    Não
                  </button>
                  <button onClick={() => { if (!sim) toggleParq(q.id) }}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${sim ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`, background: sim ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.04)', color: sim ? '#F87171' : '#475569' }}>
                    Sim
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ CAMADA 2: ANAMNESE DO PERSONAL ══════════════════════════════════ */}

      {/* Limitações físicas */}
      <div style={s.card}>
        <SecLabel title="Limitações Físicas" sub="Regiões com dor, lesão ou restrição de movimento" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: (data.limitacoes||[]).some(l=>l!=='nenhuma') ? 10 : 0 }}>
          {LIMITACOES_OPTS.map(o => (
            <Chip key={o.id} label={o.label}
              color={o.id==='nenhuma' ? '#34D399' : '#F87171'}
              selected={(data.limitacoes||[]).includes(o.id)}
              onClick={() => toggleArr('limitacoes', o.id)} />
          ))}
        </div>
        {(data.limitacoes||[]).some(l => l!=='nenhuma') && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>Descreva a limitação</div>
            <input style={inp} placeholder="Ex: dor no ombro esquerdo ao elevar acima da cabeça..."
              value={data.limitacao_detalhe||''} onChange={e=>setData(p=>({...p,limitacao_detalhe:e.target.value}))} />
          </div>
        )}
      </div>

      {/* Experiência */}
      <div style={s.card}>
        <SecLabel title="Experiência de Academia" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: data.experiencia==='voltando' ? 10 : 0 }}>
          {EXPERIENCIA_OPTS.map(o => (
            <Chip key={o.id} label={o.label} color="#60A5FA"
              selected={data.experiencia===o.id}
              onClick={() => set1('experiencia', o.id)} />
          ))}
        </div>
        {data.experiencia==='voltando' && (
          <>
            <div style={{ fontSize:11, color:'#475569', marginBottom:6 }}>Tempo afastado:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {PAUSA_OPTS.map(o => (
                <Chip key={o.id} label={o.label} color="#FBBF24"
                  selected={data.tempo_pausa===o.id}
                  onClick={() => set1('tempo_pausa', o.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preferências */}
      <div style={s.card}>
        <SecLabel title="Preferências de Treino" sub="O que o aluno prefere ou gosta de fazer" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {PREFERENCIAS_OPTS.map(o => (
            <Chip key={o.id} label={o.label}
              color={o.id==='nenhuma' ? '#94A3B8' : '#34D399'}
              selected={(data.preferencias||[]).includes(o.id)}
              onClick={() => toggleArr('preferencias', o.id)} />
          ))}
        </div>
      </div>

      {/* Condições de saúde */}
      <div style={s.card}>
        <SecLabel title="Condições de Saúde" sub="Marque o que for relevante" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {SAUDE_OPTS.map(o => (
            <Chip key={o.id} label={o.label}
              color={o.id==='nenhuma' ? '#34D399' : '#FBBF24'}
              selected={(data.condicoes_saude||[]).includes(o.id)}
              onClick={() => toggleArr('condicoes_saude', o.id)} />
          ))}
        </div>
      </div>

      {/* Histórico livre */}
      <div style={s.card}>
        <SecLabel title="Observações e Histórico Livre" />
        <textarea value={data.historico||''} onChange={e=>setData(p=>({...p,historico:e.target.value}))}
          placeholder="Cirurgias, medicamentos, metas específicas, comportamento, outras informações relevantes..."
          style={{ ...inp, minHeight:75, resize:'vertical', lineHeight:1.6 }} />
      </div>

      {/* Salvar */}
      <button onClick={save} disabled={saving}
        style={{ padding:'13px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:800, fontSize:14, fontFamily:'inherit', transition:'all 0.2s',
          background: saved ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
          color: saved ? '#34D399' : '#fff' }}>
        {saving ? 'Salvando...' : saved ? '✓ Anamnese Salva' : 'Salvar Anamnese'}
      </button>
    </div>
  )
}



// ── FichaInformacoes ──────────────────────────────────────────────────────────
function alertLvl(field, val, imc) {
  const v = String(val || '').toLowerCase()
  const CRITICO = {
    imc:                  () => parseFloat(imc) >= 30,
    condicao_saude:       () => ['cardiaco','diabetes','cardiopatia','problema cardiaco'].some(x=>v.includes(x)),
    medicamentos:         () => ['insulina','beta bloq','pressão','coração','controlado'].some(x=>v.includes(x)),
    limitacoes:           () => v.length > 3 && !v.includes('nenhuma'),
    horas_sono:           () => v.includes('menos de 5'),
    qualidade_alimentacao:() => v.includes('muita melhora'),
  }
  const ATENCAO = {
    imc:                  () => parseFloat(imc) >= 25 && parseFloat(imc) < 30,
    // fix: 'descansado' continha 'cansado' — usar termos mais específicos
    qualidade_sono:       () => ['durmo mal','insonia','acordo cansado','muito irregular'].some(x=>v.includes(x)),
    horas_sono:           () => v.includes('5 a 6'),
    alcool:               () => ['frequen','diariamente','semana'].some(x=>v.includes(x)),
    tabaco:               () => ['regularmente','diariamente','ocasionalmente'].some(x=>v.includes(x)),
    qualidade_alimentacao:() => v.includes('regular'),
    condicao_saude:       () => ['hipertensao','hipertens','artrite','hernia'].some(x=>v.includes(x)),
  }
  if (CRITICO[field]?.()) return 'critico'
  if (ATENCAO[field]?.()) return 'atencao'
  return null
}

const AL_STYLE = {
  critico: { border:'1.5px solid rgba(248,113,113,0.55)', background:'rgba(248,113,113,0.05)' },
  atencao: { border:'1.5px solid rgba(251,191,36,0.45)',  background:'rgba(251,191,36,0.04)' },
  ok:      { border:'1px solid rgba(255,255,255,0.07)',   background:'#111827' },
}

function FichaField({ label, children, alert }) {
  const st = AL_STYLE[alert] || AL_STYLE.ok
  return (
    <div style={{ ...st, borderRadius:10, padding:'10px 14px', marginBottom:8 }}>
      <div style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
        {label}
        {alert === 'critico' && <span style={{ fontSize:9, background:'rgba(248,113,113,0.15)', color:'#F87171', padding:'1px 6px', borderRadius:20, fontWeight:700 }}>Critico</span>}
        {alert === 'atencao' && <span style={{ fontSize:9, background:'rgba(251,191,36,0.15)',  color:'#FBBF24', padding:'1px 6px', borderRadius:20, fontWeight:700 }}>Atencao</span>}
      </div>
      {children}
    </div>
  )
}

function FichaInformacoes({ student, anamData, studentId, onSaved }) {
  const parseF = (an, st) => ({
    nome:                  st?.name || '',
    idade:                 st?.age  || '',
    peso:                  st?.weight || '',
    altura:                st?.height || '',
    objetivo:              st?.goal  || an?.parq?.goal || '',
    objetivo_especifico:   an?.objetivo_estetico || '',
    whatsapp:              st?.guardian_phone || '',
    rotina_trabalho:       an?.profissao?.split(' | ')[0] || '',
    lazer:                 an?.profissao?.includes('Lazer:') ? an.profissao.split('Lazer:')[1]?.split(' | ')[0]?.trim() : '',
    qualidade_sono:        an?.qualidade_sono || '',
    horas_sono:            an?.horas_sono || '',
    refeicoes:             an?.alimentacao?.split(' refeições')[0]?.split('— ').pop() || '',
    qualidade_alimentacao: an?.alimentacao?.split('qualidade:')[1]?.trim() || '',
    alcool:                an?.alcool_cigarro?.split('Álcool:')[1]?.split(' (')[0]?.trim() || '',
    alcool_freq:           an?.alcool_cigarro?.match(/Álcool:[^(]*\(([^)]+)\)/)?.[1] || '',
    tabaco:                an?.alcool_cigarro?.split('Tabaco:')[1]?.split(' (')[0]?.trim() || '',
    tabaco_freq:           an?.alcool_cigarro?.match(/Tabaco:[^(]*\(([^)]+)\)/)?.[1] || '',
    medicamentos:          an?.parq?.medicamentos || '',
    condicao_saude:        an?.historico_saude || '',
    limitacoes:            an?.limitacao_detalhe || '',
    dias_semana:           an?.dias_disponiveis || '',
    horario:               an?.horario_preferido || '',
    local_treino:          an?.local_treino || '',
    experiencia:           an?.historico || '',
    motivacao:             an?.motivacao_inicio || '',
    notas_professor:       an?.notas || '',
  })

  const [F,  setF]  = useState(parseF(anamData, student))
  const [sav,setSav]= useState(false)
  const [ok, setOk] = useState(false)
  const f = k => v => setF(p=>({...p,[k]:v}))

  useEffect(() => { setF(parseF(anamData, student)) }, [anamData, student])

  const imc = F.peso && F.altura
    ? (parseFloat(F.peso) / Math.pow(parseFloat(F.altura)/100, 2)).toFixed(1)
    : null

  const al = (field, val) => alertLvl(field, val ?? F[field], imc)

  const inp = { width:'100%', background:'#0D1117', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'8px 11px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const sel = { ...inp }

  const save = async () => {
    setSav(true)
    await supabase.from('students').update({
      name: F.nome, age: +F.idade||null,
      weight: +F.peso||null, height: +F.altura||null, goal: F.objetivo,
      guardian_phone: F.whatsapp,
    }).eq('id', studentId)

    await supabase.from('anamnese').upsert([{
      student_id: studentId,
      qualidade_sono: F.qualidade_sono, horas_sono: F.horas_sono,
      alimentacao: `${F.refeicoes} refeições/dia — qualidade: ${F.qualidade_alimentacao}`,
      alcool_cigarro: [
        F.alcool ? `Álcool: ${F.alcool}${F.alcool_freq?` (${F.alcool_freq})`:''}`:'',
        F.tabaco ? `Tabaco: ${F.tabaco}${F.tabaco_freq?` (${F.tabaco_freq})`:''}`:'',
      ].filter(Boolean).join(' | '),
      limitacao_detalhe: F.limitacoes, historico_saude: F.condicao_saude,
      objetivo_estetico: F.objetivo_especifico,
      dias_disponiveis: F.dias_semana, horario_preferido: F.horario,
      local_treino: F.local_treino, historico: F.experiencia,
      motivacao_inicio: F.motivacao, notas: F.notas_professor,
      profissao: [F.rotina_trabalho, F.lazer?`Lazer: ${F.lazer}`:''].filter(Boolean).join(' | '),
      parq: { medicamentos: F.medicamentos },
    }], { onConflict:'student_id' })

    setSav(false); setOk(true); setTimeout(()=>setOk(false),2000)
    onSaved?.()
  }

  const SECTION = t => (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 12px' }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
      <span style={{ fontSize:10, color:'#334155', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{t}</span>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
    </div>
  )

  const GOALS = ['Ganho de Massa','Emagrecimento','Força e Performance','Condicionamento','Saúde e Bem-Estar','Iniciação Esportiva']

  return (
    <div style={{ background:'#0D1117', borderRadius:14, border:'1px solid rgba(255,255,255,0.07)', padding:'18px 20px' }}>
      {/* Salvar */}
      <button onClick={save} disabled={sav}
        style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:18,
          background: ok ? '#22C55E' : sav ? '#1E293B' : '#3B82F6',
          color:'#fff', fontWeight:800, fontSize:14, fontFamily:'inherit' }}>
        {sav ? 'Salvando...' : ok ? '✓ Mudanças Confirmadas' : 'Confirmar Mudanças'}
      </button>

      {/* ── Dados Pessoais ───────────────────────────────── */}
      {SECTION('Dados Pessoais')}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <FichaField label="Nome">
          <input style={inp} value={F.nome} onChange={e=>f('nome')(e.target.value)} placeholder="Nome completo"/>
        </FichaField>
        <FichaField label="Idade">
          <input style={inp} type="number" value={F.idade} onChange={e=>f('idade')(e.target.value)} placeholder="Anos"/>
        </FichaField>
      </div>

      <FichaField label="Objetivo Geral">
        <select style={sel} value={F.objetivo} onChange={e=>f('objetivo')(e.target.value)}>
          <option value="">Selecione</option>
          {GOALS.map(g=><option key={g}>{g}</option>)}
        </select>
      </FichaField>

      <FichaField label="Objetivo Específico — como o aluno descreveu">
        <textarea style={{...inp,minHeight:55,resize:'vertical',lineHeight:1.6}}
          value={F.objetivo_especifico} onChange={e=>f('objetivo_especifico')(e.target.value)}
          placeholder="Descrição do objetivo pelo próprio aluno..."/>
      </FichaField>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        <FichaField label="Peso (kg)">
          <input style={inp} type="number" value={F.peso} onChange={e=>f('peso')(e.target.value)} placeholder="kg"/>
        </FichaField>
        <FichaField label="Altura (cm)">
          <input style={inp} type="number" value={F.altura} onChange={e=>f('altura')(e.target.value)} placeholder="cm"/>
        </FichaField>
        <FichaField label="IMC" alert={al('imc', imc)}>
          <div style={{ fontSize:16, fontWeight:800, color: al('imc',imc)==='critico'?'#F87171':al('imc',imc)==='atencao'?'#FBBF24':'#E2E8F0', paddingTop:2 }}>
            {imc || '—'}
          </div>
          {imc && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>
            {parseFloat(imc)<18.5?'Abaixo do peso':parseFloat(imc)<25?'Normal':parseFloat(imc)<30?'Sobrepeso':parseFloat(imc)<35?'Obesidade I':'Obesidade II+'}
          </div>}
        </FichaField>
      </div>

      <FichaField label="WhatsApp">
        <input style={inp} value={F.whatsapp} onChange={e=>f('whatsapp')(e.target.value)} placeholder="(XX) XXXXX-XXXX"/>
      </FichaField>

      <FichaField label="Rotina de trabalho — como o aluno descreveu">
        <input style={inp} value={F.rotina_trabalho} onChange={e=>f('rotina_trabalho')(e.target.value)} placeholder="Tipo de esforço físico no trabalho..."/>
      </FichaField>

      <FichaField label="Tempo livre e lazer">
        <input style={inp} value={F.lazer} onChange={e=>f('lazer')(e.target.value)} placeholder="Como ocupa o tempo livre..."/>
      </FichaField>

      {/* ── Saúde e Hábitos ──────────────────────────────── */}
      {SECTION('Saúde e Hábitos')}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <FichaField label="Qualidade do sono" alert={al('qualidade_sono')}>
          <input style={inp} value={F.qualidade_sono} onChange={e=>f('qualidade_sono')(e.target.value)} placeholder="Ex: Durmo mal..."/>
        </FichaField>
        <FichaField label="Horas de sono">
          <input style={inp} value={F.horas_sono} onChange={e=>f('horas_sono')(e.target.value)} placeholder="Ex: 6 a 7h"/>
        </FichaField>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <FichaField label="Qualidade da alimentação" alert={al('qualidade_alimentacao')}>
          <input style={inp} value={F.qualidade_alimentacao} onChange={e=>f('qualidade_alimentacao')(e.target.value)} placeholder="Ex: Regular..."/>
        </FichaField>
        <FichaField label="Refeições por dia">
          <input style={inp} value={F.refeicoes} onChange={e=>f('refeicoes')(e.target.value)} placeholder="Ex: 3 refeições"/>
        </FichaField>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <FichaField label="Uso de álcool" alert={al('alcool')}>
          <input style={inp} value={F.alcool} onChange={e=>f('alcool')(e.target.value)} placeholder="Frequência..."/>
          <input style={{...inp,marginTop:5,fontSize:12}} value={F.alcool_freq} onChange={e=>f('alcool_freq')(e.target.value)} placeholder="Quantidade por semana/mês"/>
        </FichaField>
        <FichaField label="Uso de tabaco" alert={al('tabaco')}>
          <input style={inp} value={F.tabaco} onChange={e=>f('tabaco')(e.target.value)} placeholder="Frequência..."/>
          <input style={{...inp,marginTop:5,fontSize:12}} value={F.tabaco_freq} onChange={e=>f('tabaco_freq')(e.target.value)} placeholder="Quantidade por dia/semana"/>
        </FichaField>
      </div>

      {/* ── Histórico de Saúde ────────────────────────────── */}
      {SECTION('Histórico de Saúde')}

      <FichaField label="Condições de saúde diagnosticadas" alert={al('condicao_saude')}>
        <textarea style={{...inp,minHeight:55,resize:'vertical',lineHeight:1.6}}
          value={F.condicao_saude} onChange={e=>f('condicao_saude')(e.target.value)}
          placeholder="Condições, cirurgias, diagnósticos..."/>
      </FichaField>

      <FichaField label="Limitações físicas e dores recorrentes" alert={al('limitacoes')}>
        <textarea style={{...inp,minHeight:55,resize:'vertical',lineHeight:1.6}}
          value={F.limitacoes} onChange={e=>f('limitacoes')(e.target.value)}
          placeholder="Regiões com dor ou restrição de movimento..."/>
      </FichaField>

      <FichaField label="Medicamentos de uso contínuo ou frequente" alert={al('medicamentos')}>
        <input style={inp} value={F.medicamentos} onChange={e=>f('medicamentos')(e.target.value)}
          placeholder="Nome, dosagem e frequência..."/>
      </FichaField>

      {/* ── Objetivos e Motivação ────────────────────────── */}
      {SECTION('Objetivos e Motivação')}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        <FichaField label="Dias por semana">
          <input style={inp} value={F.dias_semana} onChange={e=>f('dias_semana')(e.target.value)} placeholder="Ex: 3 dias"/>
        </FichaField>
        <FichaField label="Horário preferido">
          <input style={inp} value={F.horario} onChange={e=>f('horario')(e.target.value)} placeholder="Ex: Manhã"/>
        </FichaField>
        <FichaField label="Local de treino">
          <input style={inp} value={F.local_treino} onChange={e=>f('local_treino')(e.target.value)} placeholder="Ex: Academia"/>
        </FichaField>
      </div>

      <FichaField label="Experiência com exercício físico">
        <textarea style={{...inp,minHeight:55,resize:'vertical',lineHeight:1.6}}
          value={F.experiencia} onChange={e=>f('experiencia')(e.target.value)}
          placeholder="Histórico de treinos anteriores..."/>
      </FichaField>

      <FichaField label="Motivação para começar agora">
        <textarea style={{...inp,minHeight:55,resize:'vertical',lineHeight:1.6}}
          value={F.motivacao} onChange={e=>f('motivacao')(e.target.value)}
          placeholder="O que levou o aluno a buscar o programa..."/>
      </FichaField>

      <FichaField label="Notas do professor">
        <textarea style={{...inp,minHeight:65,resize:'vertical',lineHeight:1.6}}
          value={F.notas_professor} onChange={e=>f('notas_professor')(e.target.value)}
          placeholder="Observações, estratégias, pontos de atenção..."/>
      </FichaField>
    </div>
  )
}

export default function StudentDetail({ navigate, studentId }) {
  const [student, setStudent] = useState(null)
  const [plans,   setPlans]   = useState([])
  const [progress,setProgress]= useState([])
  const [exLogs,  setExLogs]  = useState([])
  const [anamData,setAnamData]= useState(null)
  const [editName,setEditName]= useState(false)
  const [tmpName, setTmpName] = useState('')
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
      const [stRes, plRes, prRes, gsRes, elRes] = await Promise.all([
        supabase.from('students').select('id,name,age,weight,height,goal,level,notes,teacher_id,birth_date,sport,sport_position,experience_years,guardian_name,guardian_phone,parent_message,parent_message_date,parent_height_father,parent_height_mother,height_sitting,tgmd_scores,tgmd_date').eq('id', studentId).single(),
        supabase.from('workout_plans').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
        supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('exercise_logs').select('exercise_id,date,sets').eq('student_id', studentId).order('date', { ascending: true }).limit(300),
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
      // Load anamnese
      const { data: anam } = await supabase.from('anamnese').select('*').eq('student_id', studentId).single()
      if (anam) setAnamData(anam)
      if (elRes.data) {
        // Enrich with exercise names from exercises table
        const exIds = [...new Set((elRes.data||[]).map(l => l.exercise_id).filter(Boolean))]
        let nameMap = {}
        if (exIds.length > 0) {
          const { data: exNames } = await supabase.from('exercises').select('id,name').in('id', exIds)
          if (exNames) exNames.forEach(e => { nameMap[e.id] = e.name })
        }
        const enriched = (elRes.data||[]).map(l => ({ ...l, _name: nameMap[l.exercise_id] || l.exercise_id }))
        setExLogs(enriched)
      }
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Painel</button>
          {((student.status === 'pendente' || !student.status) || student.status === null || student.status === undefined) && (
            <button onClick={async () => {
              const { error: upErr } = await supabase.from('students').update({ status:'ativo' }).eq('id', studentId)
              if (!upErr) {
                await supabase.from('notificacoes').update({ lida:true })
                  .eq('teacher_id', student.teacher_id).eq('tipo','nova_anamnese')
              }
              setStudent(p => ({ ...p, status:'ativo' }))
              setEditing(false)
            }} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#22C55E', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(34,197,94,0.35)' }}>
              Confirmar Matrícula
            </button>
          )}
        </div>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <div style={{ fontSize: 10, color: C.blue, letterSpacing: 2, textTransform: 'uppercase' }}>Perfil do Aluno</div>
                {(student.status === 'pendente' || !student.status) && (
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:18, height:2, background:'#EF4444', borderRadius:99 }}/>
                    <span style={{ fontSize:11, fontWeight:800, color:'#F87171', textTransform:'uppercase', letterSpacing:0.8, background:'rgba(239,68,68,0.15)', border:'1.5px solid rgba(239,68,68,0.4)', borderRadius:20, padding:'3px 12px' }}>Em Análise</span>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                {editName ? (
                  <input autoFocus value={tmpName}
                    onChange={e=>setTmpName(e.target.value)}
                    onBlur={async()=>{
                      if(tmpName.trim()&&tmpName!==student.name){
                        await supabase.from('students').update({name:tmpName.trim()}).eq('id',studentId)
                        setStudent(p=>({...p,name:tmpName.trim()}))
                      }
                      setEditName(false)
                    }}
                    onKeyDown={e=>{ if(e.key==='Enter') e.target.blur() }}
                    style={{ fontSize:22,fontWeight:800,color:C.text,background:'rgba(255,255,255,0.06)',border:`1px solid ${C.border}`,borderRadius:8,padding:'2px 10px',outline:'none',fontFamily:'inherit' }}/>
                ) : (
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{student.name}</div>
                )}
                <button onClick={()=>{setTmpName(student.name);setEditName(true)}}
                  style={{ background:'none',border:'none',cursor:'pointer',padding:2,lineHeight:1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 13, color: C.textSub }}>{student.goal} · {student.level}</div>
            </div>
            <button style={s.outlineBtn} onClick={() => setEditing(!editing)}>
              {editing ? 'Fechar Ficha' : 'Abrir Ficha'}
            </button>
          </div>

          {editing ? (
            <>
              <FichaInformacoes
                student={student}
                anamData={anamData}
                studentId={studentId}
                onSaved={fetchAll}
              />
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                <button onClick={saveStudent} disabled={saving} style={{ flex:1, padding:'13px', borderRadius:12, border:'none', background:C.green, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                  {saving ? 'Salvando...' : '✓ Salvar Alterações'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding:'13px 18px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.textSub, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[['Idade', `${student.age || '—'} anos`], ['Peso', `${student.weight || '—'} kg`], ['Altura', `${student.height || '—'} cm`], ['IMC', imc]].map(([l, v]) => (
                <div key={l} style={{ background: C.surface2, borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.border}` }}>
                  <div style={s.label}>{l}</div>
                  <div style={s.val}>{v}</div>
                </div>
              ))}
            </div>)}

          {/* Share links */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Link do <strong>aluno</strong> — para o atleta ver e registrar o treino:</div>
              <div style={s.shareBox} onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link do aluno copiado!') }}>
                {shareLink} <span style={{ color: '#34D399', marginLeft: 8, cursor: 'pointer' }}>Copiar</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Link do <strong>responsável</strong> — para o pai/mãe acompanhar a evolução:</div>
              <div style={{ ...s.shareBox, borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/parent/${studentId}`); alert('Link do responsável copiado!') }}>
                {window.location.origin}/parent/{studentId}
                <span style={{ color: '#FBBF24', marginLeft: 8, cursor: 'pointer' }}>Copiar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner pendente */}
        {(student.status === 'pendente' || !student.status) && (
          <div style={{ marginBottom:12, padding:'11px 16px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#FBBF24', flexShrink:0 }}/>
            <div style={{ fontSize:13, color:'#FBBF24', fontWeight:600 }}>Candidatura pendente — revise a anamnese na aba Obs. e confirme o aluno para iniciar a prescrição.</div>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[['plans', 'Treinos'], ['progress', 'Evolução'], ['metas', 'Metas'], ['notes', 'Obs.']].map(([id, label]) => (
            <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* PLANS TAB */}
        {tab === 'plans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={() => navigate('planner', { studentId })}
                style={{ padding:'9px 16px', borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.blue, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                Periodização
              </button>
              <button style={s.btn(C.green)} onClick={createPlan}>+ Criar Plano de Treino</button>
            </div>
            {plans.length === 0 && <div style={{ textAlign:'center', padding:60, color:C.textDim }}>Nenhum plano criado ainda</div>}
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
                <button style={s.btn(C.blue)} onClick={() => navigate('workout-editor', { studentId, planId: plan.id })}>
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
          <ProgressTab
            progress={progress}
            exLogs={exLogs}
            showProgressForm={showProgressForm}
            setShowProgressForm={setShowProgressForm}
            newProgress={newProgress}
            setNewProgress={setNewProgress}
            addProgress={addProgress}
            deleteProgress={deleteProgress}
            saving={saving}
            s={s}
          />
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

        {/* Avaliação movida para WorkoutEditor */}

        {/* NOTES TAB — Anamnese + observações */}
        {tab === 'notes' && (
          <AnamneseTab studentId={studentId} teacherId={student.teacher_id} s={s} />
        )}
      </div>
    </div>
  )
}
