import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { SPORTS, DIAS, getFoco, getSport, S } from '../../../lib/escolinhaShared'
import { PlanejamentoView, FeedbackAula } from './PlanejamentoAulas'
import { AvaliacaoEditor } from './AvaliacoesAlunos'

// ── Modal Nova Turma ──────────────────────────────────────────────────────────
export function ModalNovaTurma({ teacherId, students, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: '', esporte: 'futebol', posicao: '',
    dias_semana: [], data_inicio: '', data_fim: '', objetivo_final: '',
  })
  const [selectedAlunos, setSelectedAlunos] = useState([])
  const [saving, setSaving] = useState(false)

  const f = (k, v) => setForm(x => ({ ...x, [k]: v }))
  const toggleDia = (d) => f('dias_semana', form.dias_semana.includes(d) ? form.dias_semana.filter(x => x !== d) : [...form.dias_semana, d])
  const toggleAluno = (id) => setSelectedAlunos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // Sugestão de alunos pelo esporte selecionado
  const sugeridos = students.filter(s => s.sport === form.esporte)
  const outros    = students.filter(s => s.sport !== form.esporte)

  const save = async () => {
    if (!form.nome.trim()) return
    setSaving(true)
    const { data: turma } = await supabase.from('turmas').insert([{
      teacher_id: teacherId, nome: form.nome, esporte: form.esporte,
      posicao: form.posicao || null, dias_semana: form.dias_semana,
      data_inicio: form.data_inicio || null, data_fim: form.data_fim || null,
      objetivo_final: form.objetivo_final || null,
    }]).select().single()

    if (turma && selectedAlunos.length) {
      await supabase.from('turma_alunos').insert(selectedAlunos.map(sid => ({ turma_id: turma.id, student_id: sid })))
    }
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0C4A6E,#155E8E)', padding: '20px 24px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Nova Turma</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Escolinha Esportiva</div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nome */}
          <div>
            <div style={S.label}>Nome da Turma *</div>
            <input style={S.input} placeholder="Ex: Sub-13 Futebol Goleiros" value={form.nome} onChange={e => f('nome', e.target.value)} />
          </div>

          {/* Esporte + Posição */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={S.label}>Esporte</div>
              <select style={S.input} value={form.esporte} onChange={e => f('esporte', e.target.value)}>
                {SPORTS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Posição / Categoria</div>
              <input style={S.input} placeholder="Ex: Goleiro, Ala, Sub-13" value={form.posicao} onChange={e => f('posicao', e.target.value)} />
            </div>
          </div>

          {/* Dias da semana */}
          <div>
            <div style={S.label}>Dias de Treino</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIAS.map(d => (
                <button key={d} onClick={() => toggleDia(d)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: form.dias_semana.includes(d) ? '#0C4A6E' : 'rgba(0,0,0,0.05)',
                  color: form.dias_semana.includes(d) ? '#fff' : '#64748B',
                  border: 'none',
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={S.label}>Início</div>
              <input style={S.input} type="date" value={form.data_inicio} onChange={e => f('data_inicio', e.target.value)} />
            </div>
            <div>
              <div style={S.label}>Fim</div>
              <input style={S.input} type="date" value={form.data_fim} onChange={e => f('data_fim', e.target.value)} />
            </div>
          </div>

          {/* Objetivo final */}
          <div>
            <div style={S.label}>Objetivo Final (Competição / Peneira)</div>
            <input style={S.input} placeholder="Ex: Peneira Athletico Paranaense Sub-15 — Jun 2026" value={form.objetivo_final} onChange={e => f('objetivo_final', e.target.value)} />
          </div>

          {/* Alunos */}
          <div>
            <div style={S.label}>Adicionar Alunos</div>
            {sugeridos.length > 0 && (
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginBottom: 6 }}>
                Sugeridos — praticam {getSport(form.esporte)?.label || form.esporte}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
              {[...sugeridos, ...outros].map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: selectedAlunos.includes(s.id) ? 'rgba(12,74,110,0.08)' : 'rgba(0,0,0,0.03)', cursor: 'pointer', border: `1px solid ${selectedAlunos.includes(s.id) ? 'rgba(12,74,110,0.2)' : 'transparent'}` }}>
                  <input type="checkbox" checked={selectedAlunos.includes(s.id)} onChange={() => toggleAluno(s.id)} style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0D1B2A' }}>{s.name}</span>
                  {s.sport === form.esporte && <span style={{ fontSize: 10, color: '#059669', marginLeft: 'auto' }}>{getSport(s.sport)?.icon}</span>}
                  {s.sport_position && <span style={{ fontSize: 10, color: '#94A3B8' }}>{s.sport_position}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={save} disabled={saving} style={S.btn()}>
              {saving ? 'Salvando...' : 'Criar Turma'}
            </button>
            <button onClick={onClose} style={S.ghost}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detalhe de Turma ──────────────────────────────────────────────────────────
export function TurmaDetail({ turma, students, teacherId, onBack, onRefresh }) {
  const [tab, setTab]               = useState('planejamento')
  const [turmaAlunos, setTurmaAlunos] = useState([])
  const [planejamentos, setPlanejamentos] = useState([])
  const [showAddAluno, setShowAddAluno]   = useState(false)
  const [feedbackBloco, setFeedbackBloco] = useState(null)
  const [showAvaliacoes, setShowAvaliacoes] = useState(false)

  const alunosDaTurma = students.filter(s => turmaAlunos.includes(s.id))

  useEffect(() => {
    supabase.from('turma_alunos').select('student_id').eq('turma_id', turma.id)
      .then(({ data }) => setTurmaAlunos((data || []).map(r => r.student_id)))
    supabase.from('planejamentos').select('*').eq('turma_id', turma.id).order('created_at')
      .then(({ data }) => setPlanejamentos(data || []))
  }, [turma.id])

  const removeAluno = async (sid) => {
    await supabase.from('turma_alunos').delete().eq('turma_id', turma.id).eq('student_id', sid)
    setTurmaAlunos(prev => prev.filter(x => x !== sid))
  }

  const addAluno = async (sid) => {
    await supabase.from('turma_alunos').insert([{ turma_id: turma.id, student_id: sid }])
    setTurmaAlunos(prev => [...prev, sid])
    setShowAddAluno(false)
  }

  const sport = getSport(turma.esporte)
  const diasLabel = (turma.dias_semana || []).join(' · ')

  // Modo: avaliações da turma
  if (showAvaliacoes) return (
    <AvaliacaoEditor
      turma={turma}
      planejamentos={planejamentos}
      alunosDaTurma={alunosDaTurma}
      onBack={() => setShowAvaliacoes(false)}
    />
  )

  // Modo: feedback de uma semana específica
  if (feedbackBloco) return (
    <FeedbackAula
      blocoSemana={feedbackBloco}
      alunosDaTurma={alunosDaTurma}
      onBack={() => setFeedbackBloco(null)}
    />
  )

  return (
    <div>
      {/* Header da turma */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...S.ghost, padding: '8px 12px', flexShrink: 0 }}>← Voltar</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0C4A6E', lineHeight: 1.1 }}>
            {sport?.icon} {turma.nome}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            {turma.posicao && <span style={{ marginRight: 8 }}>{turma.posicao}</span>}
            {diasLabel && <span style={{ marginRight: 8 }}>{diasLabel}</span>}
            <span>{alunosDaTurma.length} aluno{alunosDaTurma.length !== 1 ? 's' : ''}</span>
          </div>
          {turma.objetivo_final && (
            <div style={{ fontSize: 11, color: '#0C4A6E', marginTop: 4, fontWeight: 600 }}>
              Objetivo: {turma.objetivo_final}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['planejamento', 'Planejamento'], ['alunos', 'Alunos'], ['feedback', 'Feedback'], ['avaliacoes', 'Avaliações']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
            background: tab === id ? '#0C4A6E' : 'rgba(0,0,0,0.06)',
            color: tab === id ? '#fff' : '#64748B',
          }}>{label}</button>
        ))}
      </div>

      {/* Aba Planejamento */}
      {tab === 'planejamento' && (
        <PlanejamentoView
          turma={turma}
          planejamentos={planejamentos}
          students={alunosDaTurma}
          teacherId={teacherId}
          onRefresh={() => {
            supabase.from('planejamentos').select('*').eq('turma_id', turma.id).order('created_at')
              .then(({ data }) => setPlanejamentos(data || []))
            onRefresh()
          }}
        />
      )}

      {/* Aba Alunos */}
      {tab === 'alunos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E' }}>{alunosDaTurma.length} aluno{alunosDaTurma.length !== 1 ? 's' : ''} nesta turma</div>
            <button onClick={() => setShowAddAluno(!showAddAluno)} style={{ ...S.ghost, fontSize: 12 }}>+ Adicionar</button>
          </div>

          {/* Adicionar alunos */}
          {showAddAluno && (
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0C4A6E', marginBottom: 10 }}>Selecione um aluno</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {students.filter(s => !turmaAlunos.includes(s.id)).map(s => (
                  <div key={s.id} onClick={() => addAluno(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.03)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(12,74,110,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0D1B2A' }}>{s.name}</span>
                    {s.sport && <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>{getSport(s.sport)?.icon} {s.sport_position || ''}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de alunos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alunosDaTurma.map(s => (
              <div key={s.id} style={{ ...S.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0C4A6E,#155E8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{s.name[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1B2A' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    {s.sport_position && <span>{s.sport_position}</span>}
                    {s.age && <span style={{ marginLeft: 6 }}>{s.age} anos</span>}
                  </div>
                </div>
                <button onClick={() => removeAluno(s.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6 }}>
                  Remover
                </button>
              </div>
            ))}
            {alunosDaTurma.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94A3B8', fontSize: 13 }}>
                Nenhum aluno na turma ainda
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aba Feedback */}
      {tab === 'feedback' && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', marginBottom: 4 }}>Selecione uma semana para registrar feedback</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Apenas semanas com plano de aula criado aparecerão no formulário.</div>

          {planejamentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8', fontSize: 13 }}>
              Nenhum planejamento criado ainda.
            </div>
          ) : (
            planejamentos.map(plan => (
              <FeedbackPlanSelector
                key={plan.id}
                plan={plan}
                onSelectBloco={(bloco) => setFeedbackBloco(bloco)}
              />
            ))
          )}
        </div>
      )}

      {/* Aba Avaliações */}
      {tab === 'avaliacoes' && (
        <div>
          <div style={{ fontSize:13, color:'#64748B', marginBottom:16, lineHeight:1.6 }}>
            Crie avaliações periódicas vinculadas ao planejamento. Registre o desenvolvimento motor (TGMD-3) e técnico de cada aluno.
          </div>
          <button onClick={() => setShowAvaliacoes(true)} style={{ ...S.btn('#6366F1'), width:'100%', padding:'14px' }}>
            Abrir Editor de Avaliações
          </button>
        </div>
      )}
    </div>
  )
}

// ── Seletor de bloco para feedback (lista semanas do planejamento) ─────────────
export function FeedbackPlanSelector({ plan, onSelectBloco }) {
  const [blocos, setBlocos] = useState([])
  const [open, setOpen]     = useState(true)

  useEffect(() => {
    supabase.from('blocos_semana').select('*')
      .eq('planejamento_id', plan.id).order('semana_numero')
      .then(({ data }) => setBlocos(data || []))
  }, [plan.id])

  return (
    <div style={{ marginBottom: 16 }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(12,74,110,0.06)', borderRadius: 10, cursor: 'pointer', marginBottom: open ? 8 : 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0C4A6E', flex: 1 }}>{plan.titulo}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {blocos.map(bloco => {
            const foco = getFoco(bloco.tipo_foco)
            return (
              <div key={bloco.id} onClick={() => onSelectBloco(bloco)}
                style={{ background: foco.bg, border: '1px solid ' + foco.color + '35', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ fontSize: 10, fontWeight: 700, color: foco.color }}>Semana {bloco.semana_numero}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: foco.color, marginTop: 2 }}>{bloco.tipo_foco}</div>
                {bloco.descricao_geral && (
                  <div style={{ fontSize: 9, color: foco.color, opacity: 0.7, marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {bloco.descricao_geral}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
