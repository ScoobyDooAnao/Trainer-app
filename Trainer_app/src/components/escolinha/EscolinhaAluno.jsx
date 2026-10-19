import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { today } from '../../lib/studentViewShared'

// ── STUDENT VIEW PRINCIPAL ────────────────────────────────────────────────────

// ── Aba Escolinha — Visão do Aluno ───────────────────────────────────────────
export function TabEscolinhaAluno({ studentId, student }) {
  const [turmas,     setTurmas]     = useState([])
  const [blocos,     setBlocos]     = useState([]) // { turma, bloco, plano, feedback }
  const [loading,    setLoading]    = useState(true)

  const TIPO_FOCO_COLORS = {
    'Físico':      { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    'Técnico':     { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    'Lúdico':      { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
    'Competitivo': { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    'Progressão':  { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    'Misto':       { color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  }
  const foco = (tipo) => TIPO_FOCO_COLORS[tipo] || TIPO_FOCO_COLORS['Misto']

  const TIPO_BLOCO_COLOR = {
    'Aquecimento': '#F97316', 'Físico': '#EF4444', 'Técnico': '#3B82F6',
    'Lúdico': '#A78BFA', 'Competitivo': '#F59E0B', 'Progressão': '#10B981', 'Volta à calma': '#06B6D4',
  }
  const blocoColor = (tipo) => TIPO_BLOCO_COLOR[tipo] || '#64748B'

  useEffect(() => {
    const load = async () => {
      try {
        // Buscar turmas do aluno
        const { data: ta } = await supabase
          .from('turma_alunos').select('turma_id').eq('student_id', studentId)
        if (!ta || ta.length === 0) { setLoading(false); return }

        const turmaIds = ta.map(r => r.turma_id)
        const { data: turmasData } = await supabase
          .from('turmas').select('*').in('id', turmaIds)
        setTurmas(turmasData || [])

        // Para cada turma, buscar planejamento ativo e semana atual
        const today = new Date()
        const allBlocos = []

        for (const turma of (turmasData || [])) {
          const { data: plans } = await supabase
            .from('planejamentos').select('*')
            .eq('turma_id', turma.id).order('created_at').limit(1)

          if (!plans || plans.length === 0) continue
          const plan = plans[0]

          // Calcular semana atual
          let semanaAtual = 1
          if (plan.data_inicio) {
            const inicio = new Date(plan.data_inicio)
            const diff = Math.floor((today - inicio) / (7 * 24 * 3600 * 1000))
            semanaAtual = Math.max(1, Math.min(diff + 1, plan.total_semanas))
          }

          // Buscar bloco da semana atual e próxima
          const { data: bls } = await supabase
            .from('blocos_semana').select('*')
            .eq('planejamento_id', plan.id)
            .in('semana_numero', [semanaAtual, semanaAtual + 1])
            .order('semana_numero')

          for (const bloco of (bls || [])) {
            // Buscar planos de aula do bloco
            const { data: planos } = await supabase
              .from('planos_aula').select('*, blocos_aula(*)')
              .eq('bloco_semana_id', bloco.id)

            // Buscar feedback (presença)
            const planoIds = (planos || []).map(p => p.id)
            let feedbacks = []
            if (planoIds.length > 0) {
              const { data: fbs } = await supabase
                .from('feedbacks_aula').select('*').in('plano_aula_id', planoIds)
              feedbacks = fbs || []
            }

            allBlocos.push({ turma, plan, bloco, planos: planos || [], feedbacks })
          }
        }

        setBlocos(allBlocos)
      } catch (err) {
        console.error('TabEscolinhaAluno error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
      Carregando escolinha...
    </div>
  )

  if (turmas.length === 0) return (
    <div style={{ padding: '50px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏟️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
        Nenhuma turma ativa
      </div>
      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
        Você ainda não foi adicionado a uma turma da escolinha.
      </div>
    </div>
  )

  // Agrupar blocos por turma
  const blocosPorTurma = {}
  blocos.forEach(b => {
    if (!blocosPorTurma[b.turma.id]) blocosPorTurma[b.turma.id] = []
    blocosPorTurma[b.turma.id].push(b)
  })

  const SPORT_ICON = { futebol:'⚽', futsal:'🥅', natacao:'🏊', basquete:'🏀', volei:'🏐', outro:'🏅' }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {turmas.map(turma => {
        const tblocos = blocosPorTurma[turma.id] || []
        const atual   = tblocos[0]
        const proxima = tblocos[1]
        const sport   = SPORT_ICON[turma.esporte] || '🏅'

        return (
          <div key={turma.id} style={{ marginBottom: 24 }}>
            {/* Header da turma */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{sport}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#E2E8F0' }}>{turma.nome}</div>
                {turma.posicao && <div style={{ fontSize: 11, color: '#475569' }}>{turma.posicao}</div>}
              </div>
            </div>

            {/* Objetivo final com progresso */}
            {atual?.plan && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                {turma.objetivo_final && (
                  <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
                    Objetivo: {turma.objetivo_final}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    Semana {atual.bloco.semana_numero} de {atual.plan.total_semanas}
                  </span>
                  <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                    {Math.round((atual.bloco.semana_numero / atual.plan.total_semanas) * 100)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#34D399,#059669)', width: Math.round((atual.bloco.semana_numero / atual.plan.total_semanas) * 100) + '%', transition: 'width 1s ease' }} />
                </div>
              </div>
            )}

            {/* Semana atual */}
            {atual && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Esta Semana — Semana {atual.bloco.semana_numero}
                </div>
                <SemanaCard
                  blocoData={atual}
                  studentId={studentId}
                  focoStyle={foco(atual.bloco.tipo_foco)}
                  blocoColorFn={blocoColor}
                  isAtual={true}
                />
              </div>
            )}

            {/* Próxima semana */}
            {proxima && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Próxima Semana — Semana {proxima.bloco.semana_numero}
                </div>
                <SemanaCard
                  blocoData={proxima}
                  studentId={studentId}
                  focoStyle={foco(proxima.bloco.tipo_foco)}
                  blocoColorFn={blocoColor}
                  isAtual={false}
                />
              </div>
            )}

            {tblocos.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#334155', fontSize: 13, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                Nenhum planejamento ativo para esta turma.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SemanaCard({ blocoData, studentId, focoStyle, blocoColorFn, isAtual }) {
  const { bloco, planos, feedbacks } = blocoData
  const { color, bg } = focoStyle

  // Verificar presença do aluno nesta semana
  const presencaCount = feedbacks.filter(fb => (fb.presencas || []).includes(studentId)).length
  const totalAulas    = planos.length

  return (
    <div style={{ background: bg, border: '1px solid ' + color + '30', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header do bloco */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + color + '20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color }}>
            {bloco.tipo_foco}
          </span>
        </div>
        {isAtual && totalAulas > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: presencaCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: presencaCount > 0 ? '#10B981' : '#475569' }}>
              {presencaCount}/{totalAulas} presenças
            </span>
          </div>
        )}
      </div>

      {/* Descrição geral */}
      {bloco.descricao_geral && (
        <div style={{ padding: '10px 16px', fontSize: 12, color, opacity: 0.8, borderBottom: '1px solid ' + color + '15' }}>
          {bloco.descricao_geral}
        </div>
      )}

      {/* Planos de aula */}
      {planos.length > 0 ? (
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {planos.map(plano => {
            const temFeedback   = feedbacks.some(fb => fb.plano_aula_id === plano.id)
            const estaPresente  = feedbacks.some(fb => fb.plano_aula_id === plano.id && (fb.presencas || []).includes(studentId))
            const bls           = (plano.blocos_aula || []).sort((a, b) => a.ordem - b.ordem)
            const minTotal      = bls.reduce((acc, b) => acc + (parseInt(b.duracao_min) || 0), 0)

            return (
              <div key={plano.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Dia + status */}
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: bls.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>
                      {plano.dia_semana}
                    </span>
                    {minTotal > 0 && (
                      <span style={{ fontSize: 10, color: '#475569' }}>{minTotal} min</span>
                    )}
                  </div>
                  {temFeedback && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: estaPresente ? '#10B981' : '#EF4444', background: estaPresente ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', borderRadius: 20, padding: '2px 8px' }}>
                      {estaPresente ? 'Presente' : 'Ausente'}
                    </span>
                  )}
                </div>

                {/* Blocos da aula */}
                {bls.length > 0 && (
                  <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {bls.map(b => {
                      const bc = blocoColorFn(b.tipo)
                      return (
                        <div key={b.id} style={{ background: bc + '15', border: '1px solid ' + bc + '30', borderRadius: 8, padding: '4px 10px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: bc }}>
                            {b.nome || b.tipo}
                          </div>
                          {b.duracao_min && (
                            <div style={{ fontSize: 9, color: bc, opacity: 0.7 }}>{b.duracao_min}min</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '14px 16px', fontSize: 11, color, opacity: 0.5, textAlign: 'center' }}>
          {isAtual ? 'Plano de aula ainda não definido para esta semana' : 'Aguardando planejamento'}
        </div>
      )}
    </div>
  )
}
