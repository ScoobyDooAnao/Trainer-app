import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { GOAL, DIAS_SEMANA, FOCO_CHIP_COLORS, SIDEBAR_BG, getDayStatus } from '../../lib/dashboardShared'
import { SportIcon } from '../shared/DashboardUI'

// ── WorkoutModal ───────────────────────────────────────────────────────────
export function WorkoutModal({ workout, onClose, navigate }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background: 'linear-gradient(135deg,#FEF3C7,#FBBF24)', padding: '22px 24px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#7C3700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Plano de Treino</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#431C00' }}>{workout.title}</div>
              <div style={{ fontSize: 13, color: '#7C4A00', marginTop: 3, fontWeight: 600 }}>{workout.studentName}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#431C00' }}>×</button>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Status desta semana</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(workout.days || []).map(dia => {
                const s = getDayStatus(dia, workout.attendanceDates, workout.logDates)
                return (
                  <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, minWidth: 52 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{dia}</span>
                    <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {workout.workoutDays?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Divisão</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workout.workoutDays.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#F5C842,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#431C00', flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{d.day_of_week ? `${d.day_of_week} — ` : ''}{d.name}{d.focus ? ` (${d.focus})` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { onClose(); navigate('workout-editor', { studentId: workout.student_id, planId: workout.id }) }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              Editar Treino
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── WorkoutChip ────────────────────────────────────────────────────────────
export function WorkoutChip({ workout, dia, onClick }) {
  const [hov, setHov] = useState(false)
  const s        = getDayStatus(dia, workout.attendanceDates, workout.logDates, workout.makeupDays)
  const initials = workout.studentName.split(' ').map(p => p[0]).slice(0, 2).join('')
  const g        = GOAL[workout.goal]
  return (
    <div onClick={() => onClick(workout)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 12, padding: '9px 10px', cursor: 'pointer', marginBottom: 7, background: hov ? 'linear-gradient(135deg,#FDE68A,#F5C842)' : 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: `1.5px solid ${hov ? '#D97706' : '#FBBF2455'}`, boxShadow: hov ? '0 6px 18px rgba(245,200,66,0.35)' : '0 2px 6px rgba(245,200,66,0.15)', transition: 'all 0.18s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: g ? g.accent : SIDEBAR_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>{initials}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#431C00' }}>{workout.studentName.split(' ')[0]}</div>
      </div>
      <div style={{ fontSize: 10, color: '#7C4A00', fontWeight: 600, marginBottom: 5, lineHeight: 1.3 }}>{workout.title}</div>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
    </div>
  )
}

// ── AvaliacaoChip ─────────────────────────────────────────────────────────────
export function AvaliacaoChip({ item }) {
  const [hov, setHov] = useState(false)
  const TIPO_LABEL = { motor:'Motor', tecnico:'Técnico', completa:'Completa' }
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius:12, padding:'9px 10px', marginBottom:7, cursor:'default',
        background: hov ? '#E9D5FF' : '#F3E8FF',
        border: '1.5px solid #D8B4FE',
        boxShadow: hov ? '0 4px 14px rgba(139,92,246,0.25)' : '0 1px 4px rgba(139,92,246,0.1)',
        transition:'all 0.18s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
        <div style={{ width:16, height:16, borderRadius:4, background:'#7C3AED', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <div style={{ fontSize:10, fontWeight:800, color:'#5B21B6', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          Avaliação
        </div>
      </div>
      <div style={{ fontSize:10, color:'#6D28D9', fontWeight:600, lineHeight:1.3 }}>{item.titulo}</div>
      <div style={{ fontSize:8, color:'#8B5CF6', marginTop:3, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>
        {TIPO_LABEL[item.tipo] || item.tipo} · {item.turma}
      </div>
    </div>
  )
}

// ── DiaDetalheModal ──────────────────────────────────────────────────────────
export function DiaDetalheModal({ dia, workouts, escolinhaItems, avaliacaoItems, onClose }) {
  const FOCO_COLORS = {
    'Físico':      { color:'#EF4444', bg:'rgba(239,68,68,0.1)' },
    'Técnico':     { color:'#3B82F6', bg:'rgba(59,130,246,0.1)' },
    'Lúdico':      { color:'#8B5CF6', bg:'rgba(139,92,246,0.1)' },
    'Competitivo': { color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },
    'Progressão':  { color:'#10B981', bg:'rgba(16,185,129,0.1)' },
    'Misto':       { color:'#64748B', bg:'rgba(100,116,139,0.1)' },
  }
  const diaWorkouts  = workouts.filter(w => (w.days||[]).includes(dia))
  const diaEscolinha = escolinhaItems.filter(e => e.dia === dia)
  const diaAvaliacoes = avaliacaoItems.filter(a => a.dia === dia)
  const temConteudo  = diaWorkouts.length > 0 || diaEscolinha.length > 0 || diaAvaliacoes.length > 0

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0C4A6E,#155E8E)', padding:'18px 22px', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{dia}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>
              {diaWorkouts.length} academia · {diaEscolinha.length} escolinha {diaAvaliacoes.length > 0 ? `· ${diaAvaliacoes.length} avaliação` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            Fechar
          </button>
        </div>

        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Avaliações */}
          {diaAvaliacoes.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#5B21B6', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Avaliações Programadas
              </div>
              {diaAvaliacoes.map((av, i) => (
                <div key={i} style={{ background:'#F3E8FF', border:'1.5px solid #D8B4FE', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#5B21B6', marginBottom:4 }}>{av.titulo}</div>
                  <div style={{ fontSize:11, color:'#7C3AED' }}>{av.turma} · {av.tipo === 'completa' ? 'Motor + Técnico' : av.tipo === 'motor' ? 'Motor (TGMD-3)' : 'Técnico'}</div>
                  {av.data && (
                    <div style={{ fontSize:10, color:'#9CA3AF', marginTop:4 }}>
                      {new Date(av.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Escolinha */}
          {diaEscolinha.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#1E40AF', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Escolinha
              </div>
              {diaEscolinha.map((item, i) => {
                const fc = FOCO_COLORS[item.focoTipo] || FOCO_COLORS['Misto']
                return (
                  <div key={i} style={{ background:fc.bg, border:`1.5px solid ${fc.color}30`, borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:fc.color, flexShrink:0 }} />
                      <div style={{ fontSize:13, fontWeight:800, color:fc.color }}>{item.turma}</div>
                      <span style={{ fontSize:10, background:fc.color+'20', color:fc.color, borderRadius:20, padding:'2px 8px', fontWeight:700 }}>{item.focoTipo}</span>
                    </div>
                    {item.descricao && (
                      <div style={{ fontSize:12, color:fc.color, opacity:0.8, marginBottom:8 }}>{item.descricao}</div>
                    )}
                    {/* Quadro tático / blocos da aula */}
                    {item.blocos.length > 0 && (
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:fc.color, opacity:0.7, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                          Plano de Aula
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {item.blocos.map((b, j) => {
                            const BLOCO_COLORS = { 'Aquecimento':'#F97316','Físico':'#EF4444','Técnico':'#3B82F6','Lúdico':'#8B5CF6','Competitivo':'#F59E0B','Progressão':'#10B981','Volta à calma':'#06B6D4' }
                            const bc = BLOCO_COLORS[b.tipo] || '#64748B'
                            return (
                              <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.7)', borderRadius:8, border:`1px solid ${bc}25` }}>
                                <div style={{ width:3, borderRadius:2, background:bc, alignSelf:'stretch', flexShrink:0 }} />
                                <div style={{ flex:1 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span style={{ fontSize:11, fontWeight:700, color:'#0D1B2A' }}>{b.nome || b.tipo}</span>
                                    {b.duracao_min && <span style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>{b.duracao_min}min</span>}
                                  </div>
                                  <span style={{ fontSize:9, background:bc+'18', color:bc, borderRadius:10, padding:'1px 6px', fontWeight:700 }}>{b.tipo}</span>
                                </div>
                              </div>
                            )
                          })}
                          <div style={{ textAlign:'right', fontSize:10, color:'#94A3B8', marginTop:2 }}>
                            Total: {item.blocos.reduce((a,b) => a+(parseInt(b.duracao_min)||0), 0)}min
                          </div>
                        </div>
                      </div>
                    )}
                    {item.blocos.length === 0 && (
                      <div style={{ fontSize:11, color:fc.color, opacity:0.5, fontStyle:'italic' }}>
                        Plano de aula ainda não definido
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Academia */}
          {diaWorkouts.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#92400E', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                Academia — {diaWorkouts.length} aluno{diaWorkouts.length!==1?'s':''}
              </div>
              {diaWorkouts.map(w => {
                const g = GOAL[w.goal]
                return (
                  <div key={w.id} style={{ background:'#FFFBEB', border:'1.5px solid #FBBF2450', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:g?g.accent:'#0C4A6E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>
                        {w.studentName.split(' ').map(p=>p[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#431C00' }}>{w.studentName}</div>
                        <div style={{ fontSize:10, color:'#92400E' }}>{w.title}</div>
                      </div>
                    </div>
                    {w.workoutDays?.filter(d => d.day_of_week === dia).map(d => (
                      <div key={d.id || d.name} style={{ fontSize:11, color:'#7C4A00', padding:'4px 8px', background:'rgba(245,200,66,0.1)', borderRadius:6, marginTop:4 }}>
                        {d.name}{d.focus ? ` — ${d.focus}` : ''}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {!temConteudo && (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#94A3B8', fontSize:13 }}>
              Nenhuma atividade programada para {dia}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// SPORT_ICON_SMALL removed — use SportIcon component
export function EscolinhaChip({ item }) {
  const [hov, setHov] = useState(false)
  const fc = FOCO_CHIP_COLORS[item.focoTipo] || FOCO_CHIP_COLORS['Misto']
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius:12, padding:'9px 10px', marginBottom:7, cursor:'default',
        background: hov ? fc.border : fc.bg,
        border: `1.5px solid ${fc.border}`,
        boxShadow: hov ? '0 4px 14px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition:'all 0.18s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <SportIcon id={item.esporte} size={14} />
        <div style={{ fontSize:11, fontWeight:800, color:fc.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {item.turma}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:fc.dot, flexShrink:0 }} />
        <span style={{ fontSize:10, fontWeight:700, color:fc.text }}>{item.focoTipo}</span>
      </div>
      {item.blocos.length > 0 && (
        <div style={{ marginTop:4, display:'flex', gap:3, flexWrap:'wrap' }}>
          {item.blocos.slice(0,3).map((b,i) => (
            <span key={i} style={{ fontSize:8, background:'rgba(0,0,0,0.08)', borderRadius:10, padding:'1px 5px', color:fc.text, fontWeight:600 }}>
              {b.nome || b.tipo} {b.duracao_min ? b.duracao_min+'m' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TabTreinos ─────────────────────────────────────────────────────────────
export function TabTreinos({ workouts, navigate, session }) {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [modalWorkout, setModalWorkout]       = useState(null)
  const [escolinhaItems, setEscolinhaItems]   = useState([])
  const [avaliacaoItems, setAvaliacaoItems]   = useState([]) // { dia, turma, titulo, tipo }
  const [diaModal, setDiaModal]               = useState(null) // dia clicado para ver detalhe

  const filtered       = selectedStudent ? workouts.filter(w => w.student_id === selectedStudent) : workouts
  const uniqueStudents = [...new Map(workouts.map(w => [w.student_id, { id: w.student_id, name: w.studentName }])).values()]

  // Buscar aulas da Escolinha da semana atual
  useEffect(() => {
    if (!session?.user?.id) return
    const load = async () => {
      try {
        // Pegar turmas do professor
        const { data: turmas } = await supabase.from('turmas')
          .select('id, nome, esporte, dias_semana')
          .eq('teacher_id', session.user.id).eq('ativo', true)
        if (!turmas || turmas.length === 0) return

        const turmaIds = turmas.map(t => t.id)
        // Pegar planejamentos ativos
        const { data: plans } = await supabase.from('planejamentos')
          .select('id, turma_id, titulo, total_semanas, data_inicio')
          .in('turma_id', turmaIds)
        if (!plans || plans.length === 0) return

        const today = new Date()
        const items = []

        for (const plan of plans) {
          // Calcular semana atual
          let semanaAtual = 1
          if (plan.data_inicio) {
            const inicio = new Date(plan.data_inicio)
            const diff = Math.floor((today - inicio) / (7 * 24 * 3600 * 1000))
            semanaAtual = Math.max(1, Math.min(diff + 1, plan.total_semanas))
          }
          // Buscar bloco da semana atual
          const { data: bloco } = await supabase.from('blocos_semana')
            .select('*, planos_aula(*)')
            .eq('planejamento_id', plan.id)
            .eq('semana_numero', semanaAtual)
            .single()

          if (!bloco) continue
          const turma = turmas.find(t => t.id === plan.turma_id)

          // Cada dia de treino da turma gera um item no cronograma
          const diasTurma = turma?.dias_semana || []
          // Buscar planos de aula do bloco para pegar dias específicos
          const { data: planos } = await supabase.from('planos_aula')
            .select('dia_semana, status, blocos_aula(tipo, nome, duracao_min)')
            .eq('bloco_semana_id', bloco.id)

          const diasComPlano = new Set((planos || []).map(p => p.dia_semana))

          // Adicionar todos os dias da turma
          const todosOsDias = diasComPlano.size > 0
            ? [...diasComPlano]
            : diasTurma

          todosOsDias.forEach(dia => {
            const planoDodia = (planos || []).find(p => p.dia_semana === dia)
            items.push({
              dia,
              turmaId: turma.id,
              turma: turma.nome,
              esporte: turma.esporte,
              planTitulo: plan.titulo,
              semana: semanaAtual,
              focoTipo: bloco.tipo_foco,
              descricao: bloco.descricao_geral || '',
              blocos: planoDodia?.blocos_aula || [],
              status: planoDodia?.status || 'planejado',
            })
          })
        }
        setEscolinhaItems(items)

        // Buscar avaliações da semana atual para cada turma
        const avItems = []
        if (turmaIds.length > 0) {
          const { data: avals } = await supabase.from('avaliacoes_turma')
            .select('id, turma_id, titulo, tipo, semana_numero, data_prevista')
            .in('turma_id', turmaIds)
          if (avals) {
            avals.forEach(av => {
              const turma = turmas.find(t => t.id === av.turma_id)
              if (!turma) return
              // Determinar em qual dia cai baseado na data_prevista ou dias da turma
              if (av.data_prevista) {
                const d = new Date(av.data_prevista + 'T12:00:00')
                const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
                const diaSemana = DIAS[d.getDay()]
                avItems.push({ dia: diaSemana, turma: turma.nome, turmaId: turma.id, titulo: av.titulo, tipo: av.tipo, data: av.data_prevista, avId: av.id })
              } else if (av.semana_numero) {
                // Sem data: marcar no primeiro dia da turma
                const diasTurma = turma.dias_semana || []
                if (diasTurma.length > 0) {
                  avItems.push({ dia: diasTurma[0], turma: turma.nome, turmaId: turma.id, titulo: av.titulo, tipo: av.tipo, avId: av.id })
                }
              }
            })
          }
        }
        setAvaliacaoItems(avItems)
      } catch (err) {
        console.error('escolinha cronograma error:', err)
      }
    }
    load()
  }, [session])

  return (
    <div>
      {modalWorkout && <WorkoutModal workout={modalWorkout} onClose={() => setModalWorkout(null)} navigate={navigate} />}
      {diaModal && (
        <DiaDetalheModal
          dia={diaModal}
          workouts={filtered}
          escolinhaItems={escolinhaItems}
          avaliacaoItems={avaliacaoItems}
          onClose={() => setDiaModal(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 4, textShadow:'0 1px 3px rgba(255,255,255,0.5)' }}>Cronograma Semanal</h1>
          <p style={{ fontSize: 13, color: '#0C4A6E' }}>
            <span style={{ color: '#059669', fontWeight: 700 }}>{workouts.length} planos ativos</span>
            {' · '}{uniqueStudents.length} alunos com treino
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.8)', backdropFilter:'blur(8px)' }}>
        <span style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, alignSelf: 'center', marginRight: 4 }}>Filtrar:</span>
        {[{ id: null, name: 'Todos' }, ...uniqueStudents].map(opt => (
          <button key={opt.id ?? 'all'} onClick={() => setSelectedStudent(opt.id)}
            style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: selectedStudent === opt.id ? 'linear-gradient(135deg,#F5C842,#D97706)' : 'rgba(255,255,255,0.7)', color: selectedStudent === opt.id ? '#431C00' : '#64748B', boxShadow: selectedStudent === opt.id ? '0 3px 10px rgba(245,200,66,0.4)' : '0 1px 3px rgba(0,0,0,0.07)' }}>
            {opt.name === 'Todos' ? 'Todos' : opt.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: '#FFF', borderRadius: 18, overflow: 'hidden', border: '1.5px solid rgba(245,200,66,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        <div className="db-week-grid"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '2px solid #FEF3C7' }}>
          {DIAS_SEMANA.map((dia, i) => {
            const count = filtered.filter(w => (w.days || []).includes(dia)).length
            const countEsc = escolinhaItems.filter(e => e.dia === dia).length
            const countAv = avaliacaoItems.filter(a => a.dia === dia).length
            return (
              <div key={dia} onClick={() => setDiaModal(dia)}
                style={{ padding: '14px 8px 12px', textAlign: 'center', background: i >= 5 ? 'rgba(245,200,66,0.06)' : 'transparent', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = i>=5?'rgba(245,200,66,0.12)':'rgba(12,74,110,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i>=5?'rgba(245,200,66,0.06)':'transparent'}>
                <div style={{ fontSize: 13, fontWeight: 800, color: i >= 5 ? '#D97706' : '#0D1B2A', marginBottom: 4 }}>{dia}</div>
                <div style={{ display:'flex', gap:3, justifyContent:'center', flexWrap:'wrap' }}>
                  {count > 0 && <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00' }}>{count} acad.</div>}
                  {countEsc > 0 && <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#DBEAFE', color: '#1E40AF', border:'1px solid #BFDBFE' }}>{countEsc} esc.</div>}
                  {countAv > 0 && <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#F3E8FF', color: '#5B21B6', border:'1px solid #D8B4FE' }}>{countAv} aval.</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', minHeight: 260 }}>
          {DIAS_SEMANA.map((dia, i) => {
            const dayWorkouts = filtered.filter(w => (w.days || []).includes(dia))
            const dayEscolinha = escolinhaItems.filter(e => e.dia === dia)
            const isEmpty = dayWorkouts.length === 0 && dayEscolinha.length === 0
            return (
              <div key={dia} style={{ padding: '12px 8px', background: i >= 5 ? 'rgba(245,200,66,0.03)' : 'transparent', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none' }}>
                {isEmpty
                  ? <div style={{ textAlign: 'center', paddingTop: 30, color: '#E2E8F0', fontSize: 20 }}>·</div>
                  : (
                    <>
                      {dayWorkouts.map(w => <WorkoutChip key={w.id + dia} workout={w} dia={dia} onClick={setModalWorkout} />)}
                      {dayEscolinha.map((item, idx) => <EscolinhaChip key={item.turmaId + dia + idx} item={item} />)}
                      {avaliacaoItems.filter(a => a.dia === dia).map((item, idx) => <AvaliacaoChip key={item.avId + idx} item={item} />)}
                    </>
                  )
                }
              </div>
            )
          })}
        </div>
      </div>
      </div>{/* end db-week-grid */}
      {/* Legenda */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'linear-gradient(135deg,#F5C842,#D97706)' }} />
          <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>Academia</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#3B82F6' }} />
          <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>Escolinha</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#7C3AED' }} />
          <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>Avaliação</span>
        </div>
        <span style={{ fontSize:11, color:'#0C4A6E', opacity:0.5 }}>·</span>
        {[{ dot:'#059669', label:'Feito' }, { dot:'#F59E0B', label:'Recuperado' }, { dot:'#F97316', label:'Ainda dá' }, { dot:'#EF4444', label:'Faltou' }, { dot:'#94A3B8', label:'Agendado' }].map(({ dot, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:dot }} />
            <span style={{ fontSize:11, color:'#0C4A6E', fontWeight:600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
