import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabase'
import { nivelFromExperiencia, STUDENT_STATUS, upsertAnamnese } from '../lib/alunos'
import { useConfirmarMatricula } from '../lib/queries'
import { useAppNavigate } from '../lib/useAppNavigate'
import { useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import FichaAvaliacao from './FichaAvaliacao'

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
      .eq('status', STUDENT_STATUS.ATIVO)
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

function FichaInformacoes({ student, anamData, studentId, onSaved, exLogs = [], plans = [] }) {
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
    nivel:                 st?.level || nivelFromExperiencia(an?.historico) || '',
    sexo:                  st?.sexo || '',
    motivacao:             an?.motivacao_inicio || '',
    notas_professor:       an?.notas || '',
  })

  const [F,  setF]    = useState(parseF(anamData, student))
  const lastSavedRef = useRef(JSON.stringify(parseF(anamData, student)))
  const [sav,setSav]  = useState(false)
  const [ok, setOk]   = useState(false)
  const [fichaPage,setFichaPage] = useState(0)

  // ── Página 2: Avaliações Físicas (medidas do aluno + testes do professor) ──
  const [avaliacoes, setAvaliacoes] = useState([])
  const [openAvaliacaoId, setOpenAvaliacaoId] = useState(null)
  const [criandoAval, setCriandoAval] = useState(false)
  const [loadingAval, setLoadingAval] = useState(false)
  const [showTesteForm, setShowTesteForm] = useState(false)
  const [novoTeste, setNovoTeste] = useState({ date: new Date().toISOString().slice(0,10), label:'', value:'' })
  const [savingTeste, setSavingTeste] = useState(false)

  useEffect(() => {
    if (fichaPage !== 2) return
    setLoadingAval(true)
    supabase.from('measure_logs').select('*').eq('student_id', studentId).order('date', { ascending:false })
      .then(({ data, error }) => { if (!error) setAvaliacoes(data || []); setLoadingAval(false) })
  }, [fichaPage, studentId])

  const excluirAvaliacao = async (id) => {
    if (!window.confirm('Excluir esta avaliação permanentemente?')) return
    await supabase.from('measure_logs').delete().eq('id', id)
    setAvaliacoes(p => p.filter(a => a.id !== id))
  }

  const criarNovaAvaliacao = async () => {    setCriandoAval(true)
    const jaTemPrimeira = avaliacoes.some(a => a.is_primeira)
    const agora = new Date()
    const { data, error } = await supabase.from('measure_logs').insert([{
      student_id: studentId, teacher_id: student?.teacher_id,
      date: agora.toISOString().slice(0,10),
      hora: agora.toTimeString().slice(0,5),
      is_primeira: !jaTemPrimeira,
      medidas: {},
    }]).select().single()
    setCriandoAval(false)
    if (!error && data) {
      setAvaliacoes(p => [data, ...p])
      setOpenAvaliacaoId(data.id)
    }
  }

  const salvarTeste = async () => {
    if (!novoTeste.label || !novoTeste.value) return
    setSavingTeste(true)
    const payload = {
      student_id: studentId, teacher_id: student?.teacher_id,
      date: novoTeste.date,
      tests: { [novoTeste.label]: novoTeste.value },
    }
    const { data, error } = await supabase.from('measure_logs').insert([payload]).select().single()
    if (!error && data) {
      setAvaliacoes(p => [data, ...p])
      setNovoTeste({ date: new Date().toISOString().slice(0,10), label:'', value:'' })
      setShowTesteForm(false)
    }
    setSavingTeste(false)
  }

  // ── Página 1: Evolução do Treinamento ──
  const exerciciosDisponiveis = useMemo(() => {
    const map = new Map()
    exLogs.forEach(l => { if (l.exercise_id) map.set(l.exercise_id, l._name || l.exercise_id) })
    return [...map.entries()]
  }, [exLogs])
  const [exSelecionado, setExSelecionado] = useState('')
  useEffect(() => { if (!exSelecionado && exerciciosDisponiveis.length) setExSelecionado(exerciciosDisponiveis[0][0]) }, [exerciciosDisponiveis, exSelecionado])

  const cargaPorExercicio = useMemo(() => {
    if (!exSelecionado) return []
    return exLogs
      .filter(l => l.exercise_id === exSelecionado)
      .map(l => ({ date: l.date, carga: Math.max(0, ...(l.sets || []).map(s => +s.weight || 0)) }))
      .sort((a,b) => new Date(a.date) - new Date(b.date))
  }, [exLogs, exSelecionado])

  const recordeCarga = useMemo(() => cargaPorExercicio.reduce((m,e) => Math.max(m, e.carga), 0), [cargaPorExercicio])
  const ultimaCarga = cargaPorExercicio[cargaPorExercicio.length - 1]?.carga || 0

  const diasTreinadosMes = useMemo(() => {
    const cutoff = Date.now() - 30*24*60*60*1000
    const dias = new Set(exLogs.filter(l => new Date(l.date).getTime() >= cutoff).map(l => l.date))
    return dias.size
  }, [exLogs])

  const f = k => v => setF(p=>({...p,[k]:v}))

  useEffect(() => { setF(parseF(anamData, student)) }, [anamData, student])

  // Autosave: salva automaticamente 900ms após qualquer alteração
  useEffect(() => {
    const current = JSON.stringify(F)
    if (current === lastSavedRef.current) return
    const t = setTimeout(async () => {
      await save()
      lastSavedRef.current = current
    }, 900)
    return () => clearTimeout(t)
  }, [F])

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
      guardian_phone: F.whatsapp, level: F.nivel || null, sexo: F.sexo || null,
    }).eq('id', studentId)

    await upsertAnamnese(studentId, {
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
    })

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
      {/* Page navigation */}
      <div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:16 }}>
        {[['Dados',0],['Evolução',1],['Avaliações',2]].map(([lbl,pg]) => (
          <button key={pg} onClick={() => setFichaPage(pg)}
            style={{ padding:'7px 14px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${fichaPage===pg ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`, background:fichaPage===pg ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color:fichaPage===pg ? '#3B82F6' : '#475569' }}>
            {lbl}
          </button>
        ))}
      </div>
      {fichaPage===1 && (
        <div style={{ padding:'8px 0' }}>
          {exerciciosDisponiveis.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:36,marginBottom:10,opacity:0.2}}>📈</div><div style={{fontSize:14,fontWeight:700,color:'#475569',marginBottom:6}}>Evolução do Treinamento</div><div style={{fontSize:12,color:'#334155'}}>Nenhum registro de carga ainda.</div></div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                <div style={{ background:'#111827', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>Recorde</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F0' }}>{recordeCarga || '—'} <span style={{fontSize:11,color:'#64748B'}}>kg</span></div>
                </div>
                <div style={{ background:'#111827', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>Última carga</div>
                  <div style={{ fontSize:20, fontWeight:800, color: ultimaCarga >= recordeCarga && ultimaCarga>0 ? '#22C55E' : '#E2E8F0' }}>{ultimaCarga || '—'} <span style={{fontSize:11,color:'#64748B'}}>kg</span></div>
                </div>
                <div style={{ background:'#111827', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>Dias treinados (30d)</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F0' }}>{diasTreinadosMes}</div>
                </div>
              </div>

              <select value={exSelecionado} onChange={e=>setExSelecionado(e.target.value)} style={{ width:'100%', background:'#0D1117', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'8px 11px', color:'#E2E8F0', fontSize:13, marginBottom:12 }}>
                {exerciciosDisponiveis.map(([id,name]) => <option key={id} value={id}>{name}</option>)}
              </select>

              <div style={{ height:220, background:'#111827', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cargaPorExercicio}>
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#64748B' }} />
                    <YAxis tick={{ fontSize:10, fill:'#64748B' }} />
                    <Tooltip contentStyle={{ background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', fontSize:12 }} />
                    <Line type="monotone" dataKey="carga" stroke="#3B82F6" strokeWidth={2} dot={{ r:3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {plans.length > 0 && (
                <>
                  {SECTION('Histórico de Planos')}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {plans.map(p => (
                      <div key={p.id} style={{ display:'flex', justifyContent:'space-between', background:'#111827', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize:12, color:'#E2E8F0' }}>{p.title}</span>
                        <span style={{ fontSize:11, color:'#64748B' }}>{p.status} · {p.created_at?.slice(0,10)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
      {fichaPage===2 && (
        <div style={{ padding:'8px 0' }}>
          {(() => {
            const testes  = avaliacoes.filter(a => a.tests && Object.keys(a.tests).length)
            const antropometricas = avaliacoes.filter(a => a.medidas != null)
            return (
              <>
                {/* ── Avaliações Antropométricas ── */}
                {SECTION('Avaliações Antropométricas')}
                <button onClick={criarNovaAvaliacao} disabled={criandoAval} style={{ padding:'9px 16px', borderRadius:10, border:'1px solid rgba(59,130,246,0.4)', background:'rgba(59,130,246,0.1)', color:'#3B82F6', fontWeight:700, fontSize:12, cursor:'pointer', marginBottom:12 }}>
                  {criandoAval ? 'Criando...' : '+ Nova Avaliação'}
                </button>

                {loadingAval ? (
                  <div style={{ textAlign:'center', color:'#475569', fontSize:12, padding:20 }}>Carregando...</div>
                ) : antropometricas.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#334155', fontSize:12, padding:20 }}>Nenhuma avaliação registrada ainda.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                    {antropometricas.map(a => (
                      <div key={a.id} style={{ display:'flex', alignItems:'stretch', gap:8 }}>
                        <button onClick={() => setOpenAvaliacaoId(a.id)} style={{ flex:1, textAlign:'left', background:'#111827', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:'inherit', fontFamily:'inherit' }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>Avaliação Antropométrica do dia {a.date?.split('-').reverse().join('/')}{a.hora ? `, ${a.hora}` : ''}</div>
                          {a.is_primeira && <span style={{ fontSize:10, color:'#60A5FA', fontWeight:700 }}>Avaliação inicial (completa)</span>}
                        </button>
                        <button onClick={() => excluirAvaliacao(a.id)} title="Excluir avaliação"
                          style={{ width:40, borderRadius:10, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#F87171', fontSize:16, cursor:'pointer', flexShrink:0 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Testes de Performance (professor registra) ── */}
                {SECTION('Testes de Performance')}
                <button onClick={()=>setShowTesteForm(p=>!p)} style={{ padding:'9px 16px', borderRadius:10, border:'1px solid rgba(59,130,246,0.4)', background:'rgba(59,130,246,0.1)', color:'#3B82F6', fontWeight:700, fontSize:12, cursor:'pointer', marginBottom:12 }}>
                  {showTesteForm ? '✕ Cancelar' : '+ Novo Teste'}
                </button>

                {showTesteForm && (
                  <div style={{ background:'#111827', borderRadius:10, padding:14, border:'1px solid rgba(255,255,255,0.07)', marginBottom:14 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Data</label><input type="date" style={inp} value={novoTeste.date} onChange={e=>setNovoTeste(p=>({...p,date:e.target.value}))} /></div>
                      <div><label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Teste</label>
                        <select style={sel} value={novoTeste.label} onChange={e=>setNovoTeste(p=>({...p,label:e.target.value}))}>
                          <option value="">Selecione</option>
                          <option value="RM">RM (Repetição Máxima)</option>
                          <option value="FC Repouso">FC Repouso</option>
                          <option value="VO2 Máx">VO2 Máx</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                    <label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Valor</label>
                    <input style={{...inp,marginBottom:10}} value={novoTeste.value} onChange={e=>setNovoTeste(p=>({...p,value:e.target.value}))} placeholder="Ex: 80kg, 62bpm, 45ml/kg/min..." />
                    <button onClick={salvarTeste} disabled={savingTeste} style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:'#22C55E', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>
                      {savingTeste ? 'Salvando...' : '✓ Salvar Teste'}
                    </button>
                  </div>
                )}

                {testes.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#334155', fontSize:12, padding:20 }}>Nenhum teste registrado ainda.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {testes.map(a => (
                      <div key={a.id} style={{ background:'#111827', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#E2E8F0' }}>{a.date}</span>
                        </div>
                        {Object.entries(a.tests).map(([k,v]) => (
                          <div key={k} style={{ fontSize:12, color:'#94A3B8' }}>{k}: <strong style={{color:'#E2E8F0'}}>{v}</strong></div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
      {openAvaliacaoId && (
        <FichaAvaliacao
          avaliacaoId={openAvaliacaoId}
          studentId={studentId}
          student={student}
          anamData={anamData}
          readOnly={false}
          onClose={() => { setOpenAvaliacaoId(null); fetchAll() }}
        />
      )}
      {fichaPage===0 && <>
      {/* Status de salvamento automático */}
      <div style={{ textAlign:'right', fontSize:11, fontWeight:600, marginBottom:12, height:14, color: sav ? '#64748B' : ok ? '#22C55E' : 'transparent' }}>
        {sav ? 'Salvando...' : ok ? '✓ Salvo automaticamente' : ''}
      </div>

      {/* ── Perfil Interpretado (leitura rápida pro WorkoutEditor) ── */}
      {anamData?.perfil ? (
        <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:12, padding:'14px 16px', marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:0.6, marginBottom:10 }}>Perfil Interpretado</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
            {[
              ['Nível de Atividade', anamData.perfil.nivel],
              ['Experiência', anamData.perfil.experiencia],
              ['Objetivo', anamData.perfil.objetivo],
              ['Sexo', student?.sexo === 'M' ? 'Masculino' : student?.sexo === 'F' ? 'Feminino' : null],
              ['Frequência', anamData.perfil.frequencia],
              ['Local', anamData.perfil.local],
              ['Horário', anamData.perfil.horario],
            ].filter(([,v]) => v).map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize:9, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>{label}</div>
                <div style={{ fontSize:13, color:'#E2E8F0', fontWeight:700 }}>{val}</div>
              </div>
            ))}
          </div>
          {anamData.perfil.restricoes?.length > 0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Restrições</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {anamData.perfil.restricoes.map(r => (
                  <span key={r} style={{ fontSize:11, fontWeight:700, color:'#FBBF24', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:8, padding:'2px 8px' }}>{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize:11, color:'#334155', marginBottom:18, fontStyle:'italic' }}>Perfil interpretado indisponível (anamnese anterior a essa atualização).</div>
      )}

      {/* ── Dados Pessoais ───────────────────────────────── */}
      {SECTION('Dados Pessoais')}

      <FichaField label="Objetivo Geral">
        <select style={sel} value={F.objetivo} onChange={e=>f('objetivo')(e.target.value)}>
          <option value="">Selecione</option>
          {GOALS.map(g=><option key={g}>{g}</option>)}
        </select>
      </FichaField>

      <FichaField label="Sexo">
        <select style={sel} value={F.sexo} onChange={e=>f('sexo')(e.target.value)}>
          <option value="">Selecione</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
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

      <FichaField label="Nível de Experiência">
        <select style={sel} value={F.nivel} onChange={e=>f('nivel')(e.target.value)}>
          <option value="">Selecione</option>
          {['Iniciante','Intermediário','Avançado','Atleta Jovem','Atleta Competitivo'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {F.experiencia && <div style={{ fontSize:11, color:'#475569', marginTop:6, fontStyle:'italic' }}>Relato da anamnese: "{F.experiencia}"</div>}
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
    </>}
    </div>
  )
}

export default function StudentDetail() {
  const navigate = useAppNavigate()
  const { id: studentId } = useParams()
  const [student, setStudent] = useState(null)
  const confirmarMatriculaMut = useConfirmarMatricula(student?.teacher_id)
  const [plans,   setPlans]   = useState([])
  const [progress,setProgress]= useState([])
  const [exLogs,  setExLogs]  = useState([])
  const [anamData,setAnamData]= useState(null)
  const [editName,setEditName]= useState(false)
  const [tmpName, setTmpName] = useState('')
  const [editAge, setEditAge] = useState(false)
  const [tmpAge, setTmpAge]   = useState('')
  const [tab, setTab] = useState('plans')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newProgress, setNewProgress] = useState({ date: new Date().toISOString().slice(0, 10), weight: '', notes: '', waist: '', chest: '', hip: '', thigh: '' })
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [goals, setGoals] = useState([])
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState({ title:'', category:'outro', deadline:'', target_value:'', target_unit:'' })

  const salvarMeta = async () => {
    if (!novaMeta.title.trim()) return
    setSavingMeta(true)
    const { data, error } = await supabase.from('student_goals').insert([{
      student_id: studentId, title: novaMeta.title.trim(), description: novaMeta.title.trim(),
      category: novaMeta.category, deadline: novaMeta.deadline || null,
      target_value: novaMeta.target_value ? +novaMeta.target_value : null,
      target_unit: novaMeta.target_unit || null, status: 'ativa', created_by: 'professor',
    }]).select().single()
    setSavingMeta(false)
    if (!error && data) {
      setGoals(p => [data, ...p])
      setNovaMeta({ title:'', category:'outro', deadline:'', target_value:'', target_unit:'' })
      setShowAddGoal(false)
    }
  }
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
        supabase.from('students').select('id,name,age,weight,height,goal,level,notes,teacher_id,status,birth_date,sport,sport_position,experience_years,guardian_name,guardian_phone,parent_message,parent_message_date,parent_height_father,parent_height_mother,height_sitting,tgmd_scores,tgmd_date').eq('id', studentId).single(),
        supabase.from('workout_plans').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('progress_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
        supabase.from('student_goals').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
        supabase.from('exercise_logs').select('exercise_id,date,sets').eq('student_id', studentId).order('date', { ascending: true }).limit(300),
      ])

      // Se a query de student falhar por coluna nova inexistente, tenta com colunas básicas
      let st = stRes.data
      if (stRes.error) {
        console.warn('fetch with new cols failed, retrying basic:', stRes.error.message)
        const fallback = await supabase.from('students').select('id,name,age,weight,height,goal,level,notes,teacher_id,status').eq('id', studentId).single()
        st = fallback.data
        if (!st) { setFetchError('Aluno não encontrado. Verifique o ID ou as permissões.'); setLoadingPage(false); return }
      }

      if (plRes.data) setPlans(plRes.data)
      // Load anamnese — tabela não tem created_at, e como há UNIQUE em
      // student_id só pode existir 1 linha; .single() ainda assim evitado
      // pra nunca voltar a quebrar silenciosamente se isso mudar.
      const { data: anamRows, error: anamErr } = await supabase
        .from('anamnese').select('*').eq('student_id', studentId).limit(1)
      if (anamErr) console.error('fetchAll: falha ao buscar anamnese', anamErr)
      if (anamRows && anamRows[0]) setAnamData(anamRows[0])
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

  const isPendente = student?.status === STUDENT_STATUS.PENDENTE

  const imc = student.weight && student.height ? (student.weight / ((student.height / 100) ** 2)).toFixed(1) : '—'

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        {duplicarPlan && <DuplicarPlanoModal plan={duplicarPlan} student={student} onClose={() => setDuplicarPlan(null)} />}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:10 }}>
          <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Painel</button>
          <div style={{ display:'flex', gap:10 }}>
            {isPendente && (
              <button onClick={() => {
                confirmarMatriculaMut.mutate(studentId, {
                  onSuccess: () => setStudent(p => ({ ...p, status: STUDENT_STATUS.ATIVO })),
                  onError: (err) => alert('Não foi possível confirmar a matrícula: ' + err.message),
                })
              }} disabled={confirmarMatriculaMut.isPending} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#22C55E', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(34,197,94,0.35)' }}>
                {confirmarMatriculaMut.isPending ? 'Confirmando...' : 'Confirmar Matrícula'}
              </button>
            )}
            <button onClick={() => setEditing(p => !p)} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#22C55E', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(34,197,94,0.35)' }}>
              {editing ? 'Fechar Ficha' : 'Abrir Ficha'}
            </button>
          </div>
        </div>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <div style={{ fontSize: 10, color: C.blue, letterSpacing: 2, textTransform: 'uppercase' }}>Ficha do Aluno</div>
                {isPendente && (
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
            <div style={{ textAlign:'right' }}>
              {editAge ? (
                <input autoFocus type="number" value={tmpAge}
                  onChange={e=>setTmpAge(e.target.value)}
                  onBlur={async()=>{
                    const val = tmpAge === '' ? null : +tmpAge
                    if (val !== student.age) {
                      await supabase.from('students').update({ age: val }).eq('id', studentId)
                      setStudent(p=>({...p, age: val}))
                    }
                    setEditAge(false)
                  }}
                  onKeyDown={e=>{ if(e.key==='Enter') e.target.blur() }}
                  style={{ fontSize:22, fontWeight:800, color:C.text, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:8, padding:'2px 10px', outline:'none', fontFamily:'inherit', width:80, textAlign:'right' }}/>
              ) : (
                <div onClick={()=>{ setTmpAge(student.age ?? ''); setEditAge(true) }} style={{ cursor:'pointer' }}>
                  <div style={{ fontSize:10, color:C.textSub, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>Idade</div>
                  <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{student.age ?? '—'} <span style={{ fontSize:13, color:C.textSub }}>anos</span></div>
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <>
              <FichaInformacoes
                student={student}
                anamData={anamData}
                studentId={studentId}
                onSaved={fetchAll}
                exLogs={exLogs}
                plans={plans}
              />
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
            {student.age != null && student.age < 18 && (
              <div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Link do <strong>responsável</strong> — para o pai/mãe acompanhar a evolução:</div>
                <div style={{ ...s.shareBox, borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/parent/${studentId}`); alert('Link do responsável copiado!') }}>
                  {window.location.origin}/parent/{studentId}
                  <span style={{ color: '#FBBF24', marginLeft: 8, cursor: 'pointer' }}>Copiar</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banner pendente */}
        {isPendente && (
          <div style={{ marginBottom:12, padding:'11px 16px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#FBBF24', flexShrink:0 }}/>
            <div style={{ fontSize:13, color:'#FBBF24', fontWeight:600 }}>Candidatura pendente — revise a anamnese na Ficha do Aluno (aba "Dados") e confirme o aluno para iniciar a prescrição.</div>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[['plans', 'Treinos'], ['metas', 'Metas']].map(([id, label]) => (
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
        {/* METAS TAB — read-only para o professor */}
        {tab === 'metas' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>🎯 Metas do Aluno</div>
              <button onClick={() => setShowAddGoal(v => !v)} style={{ fontSize: 11, fontWeight:700, color: showAddGoal ? '#F87171' : '#34D399', background: showAddGoal ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', padding: '6px 12px', borderRadius: 20, border: `1px solid ${showAddGoal ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`, cursor:'pointer' }}>
                {showAddGoal ? '✕ Cancelar' : '+ Adicionar Meta'}
              </button>
            </div>

            {showAddGoal && (
              <div style={{ ...s.card, marginBottom: 16, padding: 16 }}>
                {(() => {
                  const mInp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
                  return (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Título</label>
                    <input style={mInp} value={novaMeta.title} onChange={e=>setNovaMeta(p=>({...p,title:e.target.value}))} placeholder="Ex: Perder 5kg" />
                  </div>
                  <div>
                    <label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Categoria</label>
                    <select style={mInp} value={novaMeta.category} onChange={e=>setNovaMeta(p=>({...p,category:e.target.value}))}>
                      {['peso','imc','medida','forca','cardio','habito','outro'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Prazo</label>
                    <input type="date" style={mInp} value={novaMeta.deadline} onChange={e=>setNovaMeta(p=>({...p,deadline:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Valor Alvo</label>
                    <input type="number" style={mInp} value={novaMeta.target_value} onChange={e=>setNovaMeta(p=>({...p,target_value:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{fontSize:10,color:'#64748B',fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:4}}>Unidade</label>
                    <input style={mInp} value={novaMeta.target_unit} onChange={e=>setNovaMeta(p=>({...p,target_unit:e.target.value}))} placeholder="kg, cm, reps..." />
                  </div>
                </div>
                  )
                })()}
                <button onClick={salvarMeta} disabled={savingMeta || !novaMeta.title.trim()} style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:'#22C55E', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>
                  {savingMeta ? 'Salvando...' : '✓ Adicionar Meta'}
                </button>
              </div>
            )}

            {goals.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div style={{ fontSize: 14, color: '#475569' }}>Nenhuma meta cadastrada ainda.</div>
              </div>
            ) : (
              <>
                {[
                  { key:'aluno',     label:'🧑 Metas do Aluno',     filtro: g => g.created_by !== 'professor' },
                  { key:'professor', label:'🎓 Metas do Professor', filtro: g => g.created_by === 'professor' },
                ].map(grupo => {
                  const goalsGrupo = goals.filter(grupo.filtro)
                  if (!goalsGrupo.length) return null
                  return (
                    <div key={grupo.key} style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8', marginBottom: 10 }}>{grupo.label}</div>
                      {['ativa','concluida'].map(status => {
                        const list = goalsGrupo.filter(g => g.status === status && (status !== 'concluida' || !g.completed_at || (Date.now() - new Date(g.completed_at).getTime()) < 2*86400000))
                        if (!list.length) return null
                        const statusLabel = status === 'ativa' ? 'Em andamento' : 'Concluídas ✅'
                        return (
                          <div key={status} style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{statusLabel}</div>
                            {list.map(g => {
                              const catColors = { peso:'#34D399', imc:'#60A5FA', medida:'#A78BFA', forca:'#FBBF24', cardio:'#F87171', habito:'#F5C842', outro:'#94A3B8' }
                              const isDourada = status === 'concluida'
                              const cc = isDourada ? '#F5C842' : (catColors[g.category] || '#94A3B8')
                              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null
                              return (
                                <div key={g.id} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${cc}`, background: isDourada ? 'linear-gradient(135deg, rgba(245,200,66,0.1), transparent)' : s.card.background, opacity: 1 }}>
                                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                                    <div>
                                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                                        <span style={{ fontSize:13, fontWeight:800, color: isDourada ? '#F5C842' : '#CBD5E1' }}>{g.title}</span>
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
                                    {isDourada && <span style={{ fontSize:18 }}>🏆</span>}
                                  </div>
                                </div>
                              )
                            })}
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

      </div>
    </div>
  )
}
