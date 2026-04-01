import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Constantes ────────────────────────────────────────────────────────────────
const SPORTS = [
  { id: 'futebol', label: 'Futebol', icon: '⚽' },
  { id: 'futsal',  label: 'Futsal',  icon: '🥅' },
  { id: 'natacao', label: 'Natação', icon: '🏊' },
  { id: 'basquete',label: 'Basquete',icon: '🏀' },
  { id: 'volei',   label: 'Vôlei',   icon: '🏐' },
  { id: 'tenis',   label: 'Tênis',   icon: '🎾' },
  { id: 'judo',    label: 'Judô',    icon: '🥋' },
  { id: 'handebol',label: 'Handebol',icon: '🤾' },
  { id: 'atletismo',label:'Atletismo',icon:'🏃' },
  { id: 'outro',   label: 'Outro',   icon: '🏅' },
]

const TIPO_FOCO = [
  { id: 'Físico',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 'Técnico',      color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'Lúdico',       color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  { id: 'Competitivo',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 'Progressão',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'Misto',        color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
]

const TIPO_BLOCO_AULA = [
  { id: 'Aquecimento',    color: '#F97316' },
  { id: 'Físico',         color: '#EF4444' },
  { id: 'Técnico',        color: '#3B82F6' },
  { id: 'Lúdico',         color: '#A78BFA' },
  { id: 'Competitivo',    color: '#F59E0B' },
  { id: 'Progressão',     color: '#10B981' },
  { id: 'Volta à calma',  color: '#06B6D4' },
]

const DIAS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

const getFoco = (id) => TIPO_FOCO.find(t => t.id === id) || TIPO_FOCO[5]
const getBloco = (id) => TIPO_BLOCO_AULA.find(t => t.id === id) || { color: '#64748B' }
const getSport = (id) => SPORTS.find(s => s.id === id)

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  card:    { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, padding: 20 },
  label:   { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:   { width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 8, padding: '9px 12px', color: '#0D1B2A', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn:     (c = '#0C4A6E') => ({ background: c, border: 'none', borderRadius: 8, padding: '9px 18px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  ghost:   { background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 14px', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  tag:     (color, bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700 }),
  row:     { display: 'flex', gap: 10, alignItems: 'flex-start' },
  divider: { height: 1, background: 'rgba(0,0,0,0.07)', margin: '18px 0' },
}

// ── Modal Nova Turma ──────────────────────────────────────────────────────────
function ModalNovaTurma({ teacherId, students, onSave, onClose }) {
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

// ── Modal Novo Planejamento ───────────────────────────────────────────────────
function ModalNovoPlanejamento({ turmaId, turma, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: '', total_semanas: 12,
    data_inicio: turma.data_inicio || '', data_fim: turma.data_fim || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(x => ({ ...x, [k]: v }))

  const save = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    const { data: plan } = await supabase.from('planejamentos').insert([{
      turma_id: turmaId, titulo: form.titulo,
      total_semanas: +form.total_semanas,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
    }]).select().single()

    // Criar blocos de semana vazios
    if (plan) {
      const blocos = Array.from({ length: +form.total_semanas }, (_, i) => ({
        planejamento_id: plan.id,
        semana_numero: i + 1,
        tipo_foco: 'Misto',
        descricao_geral: '',
      }))
      await supabase.from('blocos_semana').insert(blocos)
    }
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0C4A6E', marginBottom: 18 }}>Novo Planejamento</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={S.label}>Título</div>
            <input style={S.input} placeholder="Ex: Temporada 2026 — Peneira Sub-15" value={form.titulo} onChange={e => f('titulo', e.target.value)} />
          </div>
          <div>
            <div style={S.label}>Total de Semanas</div>
            <input style={S.input} type="number" min="1" max="52" value={form.total_semanas} onChange={e => f('total_semanas', e.target.value)} />
          </div>
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
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={S.btn()}>{saving ? 'Criando...' : 'Criar Planejamento'}</button>
            <button onClick={onClose} style={S.ghost}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Visualizador de Planejamento ──────────────────────────────────────────────
function PlanejamentoView({ turma, planejamentos, students, teacherId, onRefresh }) {
  const [selectedPlan, setSelectedPlan]       = useState(null)
  const [blocos, setBlocos]                   = useState([])
  const [showModalPlan, setShowModalPlan]     = useState(false)
  const [editingBloco, setEditingBloco]       = useState(null) // { id, tipo_foco, descricao_geral }
  const [viewMode, setViewMode]               = useState('semanas') // 'semanas' | 'mensal'
  const [saving, setSaving]                   = useState(false)
  const [planoAulaBloco, setPlanoAulaBloco]   = useState(null) // bloco aberto no editor de aula

  useEffect(() => {
    if (planejamentos.length && !selectedPlan) setSelectedPlan(planejamentos[0].id)
  }, [planejamentos])

  useEffect(() => {
    if (!selectedPlan) return
    supabase.from('blocos_semana').select('*')
      .eq('planejamento_id', selectedPlan)
      .order('semana_numero')
      .then(({ data }) => setBlocos(data || []))
  }, [selectedPlan])

  const plan = planejamentos.find(p => p.id === selectedPlan)

  // Progresso
  const totalSemanas  = plan?.total_semanas || 0
  const semanasFeitas = blocos.filter(b => b.tipo_foco !== 'Misto' || b.descricao_geral).length
  const pct           = totalSemanas > 0 ? Math.round((semanasFeitas / totalSemanas) * 100) : 0

  // Semanas por mês (para visão mensal)
  const semanasComData = plan?.data_inicio
    ? blocos.map(b => {
        const d = new Date(plan.data_inicio)
        d.setDate(d.getDate() + (b.semana_numero - 1) * 7)
        return { ...b, dataInicio: new Date(d) }
      })
    : blocos.map(b => ({ ...b, dataInicio: null }))

  const meses = {}
  semanasComData.forEach(b => {
    const key = b.dataInicio
      ? b.dataInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : `Bloco ${Math.ceil(b.semana_numero / 4)}`
    if (!meses[key]) meses[key] = []
    meses[key].push(b)
  })

  const saveBloco = async (bloco) => {
    setSaving(true)
    await supabase.from('blocos_semana').update({
      tipo_foco: bloco.tipo_foco,
      descricao_geral: bloco.descricao_geral,
    }).eq('id', bloco.id)
    setBlocos(prev => prev.map(b => b.id === bloco.id ? { ...b, ...bloco } : b))
    setEditingBloco(null)
    setSaving(false)
  }

  if (!planejamentos.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 15, color: '#64748B', marginBottom: 16 }}>Nenhum planejamento criado ainda</div>
      <button onClick={() => setShowModalPlan(true)} style={S.btn()}>Criar Planejamento</button>
      {showModalPlan && (
        <ModalNovoPlanejamento turmaId={turma.id} turma={turma} onSave={onRefresh} onClose={() => setShowModalPlan(false)} />
      )}
    </div>
  )

  // Modo: editor de plano de aula de uma semana
  if (planoAulaBloco) return (
    <PlanoAulaEditor
      blocoSemana={planoAulaBloco}
      diasTurma={turma.dias_semana || []}
      onBack={() => setPlanoAulaBloco(null)}
    />
  )

  return (
    <div>
      {/* Selector de planejamento + botão novo */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={{ ...S.input, maxWidth: 280 }} value={selectedPlan || ''} onChange={e => setSelectedPlan(e.target.value)}>
          {planejamentos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
        </select>
        <button onClick={() => setShowModalPlan(true)} style={{ ...S.ghost, fontSize: 12 }}>+ Novo Planejamento</button>
      </div>

      {plan && (
        <>
          {/* Barra de progresso */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0C4A6E' }}>{plan.titulo}</div>
                {turma.objetivo_final && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Objetivo: {turma.objetivo_final}</div>
                )}
                {plan.data_inicio && plan.data_fim && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {new Date(plan.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} →
                    {new Date(plan.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0C4A6E', lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{semanasFeitas}/{totalSemanas} semanas</div>
              </div>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#0C4A6E,#34D399)', transition: 'width 0.8s ease' }} />
            </div>
            {/* Legenda de tipos */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {TIPO_FOCO.map(t => (
                <span key={t.id} style={S.tag(t.color, t.bg)}>{t.id}</span>
              ))}
            </div>
          </div>

          {/* Toggle semanas / mensal */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['semanas', 'Semanas'], ['mensal', 'Mensal']].map(([id, label]) => (
              <button key={id} onClick={() => setViewMode(id)} style={{
                padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: viewMode === id ? '#0C4A6E' : 'rgba(0,0,0,0.06)',
                color: viewMode === id ? '#fff' : '#64748B',
              }}>{label}</button>
            ))}
          </div>

          {/* Visão por Semanas */}
          {viewMode === 'semanas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blocos.map(bloco => {
                const foco = getFoco(bloco.tipo_foco)
                const isEditing = editingBloco?.id === bloco.id
                return (
                  <div key={bloco.id} style={{ background: '#fff', border: `1px solid ${isEditing ? foco.color : 'rgba(0,0,0,0.08)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                    {/* Linha resumo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: isEditing ? foco.bg : 'transparent' }}
                      onClick={() => setEditingBloco(isEditing ? null : { ...bloco })}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: foco.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: foco.color }}>S{bloco.semana_numero}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0D1B2A' }}>Semana {bloco.semana_numero}</span>
                          <span style={S.tag(foco.color, foco.bg)}>{bloco.tipo_foco}</span>
                        </div>
                        {bloco.descricao_geral && (
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {bloco.descricao_geral}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>{isEditing ? '▲' : '▼'}</span>
                    </div>

                    {/* Editor inline */}
                    {isEditing && editingBloco && (
                      <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${foco.color}30` }}>
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={S.label}>Foco da Semana</div>
                            <select style={S.input} value={editingBloco.tipo_foco}
                              onChange={e => setEditingBloco(x => ({ ...x, tipo_foco: e.target.value }))}>
                              {TIPO_FOCO.map(t => <option key={t.id}>{t.id}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={S.label}>Descrição Geral da Semana</div>
                          <textarea style={{ ...S.input, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                            placeholder="O que será trabalhado nesta semana..."
                            value={editingBloco.descricao_geral || ''}
                            onChange={e => setEditingBloco(x => ({ ...x, descricao_geral: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => saveBloco(editingBloco)} disabled={saving} style={S.btn(foco.color)}>
                            {saving ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={() => { saveBloco(editingBloco); setPlanoAulaBloco(bloco) }} style={S.btn('#0C4A6E')}>
                            Plano de Aula
                          </button>
                          <button onClick={() => setEditingBloco(null)} style={S.ghost}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Visão Mensal */}
          {viewMode === 'mensal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(meses).map(([mes, semanasDoMes]) => (
                <div key={mes}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0C4A6E', textTransform: 'capitalize', marginBottom: 10, letterSpacing: 0.3 }}>
                    {mes}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                    {semanasDoMes.map(bloco => {
                      const foco = getFoco(bloco.tipo_foco)
                      return (
                        <div key={bloco.id} style={{ background: foco.bg, border: `1px solid ${foco.color}35`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
                          onClick={() => { setViewMode('semanas'); setEditingBloco({ ...bloco }) }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: foco.color, marginBottom: 4 }}>Semana {bloco.semana_numero}</div>
                          {bloco.dataInicio && (
                            <div style={{ fontSize: 9, color: foco.color, opacity: 0.7, marginBottom: 6 }}>
                              {bloco.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </div>
                          )}
                          <div style={{ fontSize: 11, fontWeight: 700, color: foco.color }}>{bloco.tipo_foco}</div>
                          {bloco.descricao_geral && (
                            <div style={{ fontSize: 9, color: foco.color, opacity: 0.65, marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {bloco.descricao_geral}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModalPlan && (
        <ModalNovoPlanejamento turmaId={turma.id} turma={turma} onSave={() => { onRefresh(); setShowModalPlan(false) }} onClose={() => setShowModalPlan(false)} />
      )}
    </div>
  )
}


// ── Etapa 3: Editor de Plano de Aula ─────────────────────────────────────────
function PlanoAulaEditor({ blocoSemana, diasTurma, onBack }) {
  const [planos, setPlanos]       = useState([]) // planos de aula do bloco
  const [loading, setLoading]     = useState(true)
  const [selectedDia, setSelectedDia] = useState(null)
  const [saving, setSaving]       = useState(false)

  const foco = getFoco(blocoSemana.tipo_foco)

  useEffect(() => {
    supabase.from('planos_aula').select('*, blocos_aula(*)')
      .eq('bloco_semana_id', blocoSemana.id)
      .then(({ data }) => {
        const list = (data || []).map(p => ({
          ...p,
          blocos_aula: (p.blocos_aula || []).sort((a, b) => a.ordem - b.ordem),
        }))
        setPlanos(list)
        setLoading(false)
      })
  }, [blocoSemana.id])

  const getDiaPlano = (dia) => planos.find(p => p.dia_semana === dia) || null

  const createPlano = async (dia) => {
    const { data } = await supabase.from('planos_aula').insert([{
      bloco_semana_id: blocoSemana.id,
      dia_semana: dia,
      status: 'planejado',
    }]).select().single()
    if (data) {
      setPlanos(prev => [...prev, { ...data, blocos_aula: [] }])
      setSelectedDia(dia)
    }
  }

  const addBlocoAula = async (planoId) => {
    const plano = planos.find(p => p.id === planoId)
    const ordem = (plano?.blocos_aula?.length || 0)
    const { data } = await supabase.from('blocos_aula').insert([{
      plano_aula_id: planoId,
      ordem,
      nome: '',
      tipo: blocoSemana.tipo_foco || 'Técnico',
      duracao_min: 15,
      descricao: '',
    }]).select().single()
    if (data) {
      setPlanos(prev => prev.map(p => p.id === planoId
        ? { ...p, blocos_aula: [...p.blocos_aula, data] }
        : p))
    }
  }

  const updateBlocoAula = async (planoId, blocoId, field, val) => {
    setPlanos(prev => prev.map(p => p.id === planoId
      ? { ...p, blocos_aula: p.blocos_aula.map(b => b.id === blocoId ? { ...b, [field]: val } : b) }
      : p))
    await supabase.from('blocos_aula').update({ [field]: val }).eq('id', blocoId)
  }

  const deleteBlocoAula = async (planoId, blocoId) => {
    await supabase.from('blocos_aula').delete().eq('id', blocoId)
    setPlanos(prev => prev.map(p => p.id === planoId
      ? { ...p, blocos_aula: p.blocos_aula.filter(b => b.id !== blocoId) }
      : p))
  }

  const duracaoTotal = (planoId) => {
    const plano = planos.find(p => p.id === planoId)
    return (plano?.blocos_aula || []).reduce((acc, b) => acc + (parseInt(b.duracao_min) || 0), 0)
  }

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>Carregando aulas...</div>

  const planoSelecionado = selectedDia ? getDiaPlano(selectedDia) : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...S.ghost, padding: '7px 12px', fontSize: 12 }}>← Voltar</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0C4A6E' }}>
              Semana {blocoSemana.semana_numero} — Plano de Aula
            </span>
            <span style={S.tag(foco.color, foco.bg)}>{blocoSemana.tipo_foco}</span>
          </div>
          {blocoSemana.descricao_geral && (
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{blocoSemana.descricao_geral}</div>
          )}
        </div>
      </div>

      {/* Seletor de dias */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {DIAS.filter(d => diasTurma.length === 0 || diasTurma.includes(d)).map(dia => {
          const temPlano = getDiaPlano(dia)
          const active   = selectedDia === dia
          return (
            <button key={dia} onClick={() => {
              if (!temPlano) createPlano(dia)
              else setSelectedDia(active ? null : dia)
            }} style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid ' + (active ? foco.color : temPlano ? foco.color + '50' : 'rgba(0,0,0,0.1)'),
              background: active ? foco.color : temPlano ? foco.bg : 'transparent',
              color: active ? '#fff' : temPlano ? foco.color : '#64748B',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', position: 'relative',
            }}>
              {dia}
              {temPlano && (
                <span style={{ display: 'block', fontSize: 9, fontWeight: 400, opacity: 0.8, marginTop: 1 }}>
                  {temPlano.blocos_aula.length} bloco{temPlano.blocos_aula.length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          )
        })}
        {diasTurma.length === 0 && (
          <div style={{ fontSize: 11, color: '#94A3B8', alignSelf: 'center', marginLeft: 4 }}>
            Selecione um dia para criar a aula
          </div>
        )}
      </div>

      {/* Editor do dia selecionado */}
      {selectedDia && planoSelecionado && (
        <div style={{ ...S.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0C4A6E' }}>
                {selectedDia} — Plano de Aula
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Duração total: {duracaoTotal(planoSelecionado.id)} min
              </div>
            </div>
            <button onClick={() => addBlocoAula(planoSelecionado.id)} style={S.btn(foco.color)}>
              + Bloco
            </button>
          </div>

          {planoSelecionado.blocos_aula.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>
              Nenhum bloco ainda. Clique em "+ Bloco" para começar.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {planoSelecionado.blocos_aula.map((bloco, idx) => {
              const bTipo = getBloco(bloco.tipo)
              return (
                <div key={bloco.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header do bloco */}
                  <div style={{ background: bTipo.color + '15', borderBottom: '1px solid ' + bTipo.color + '25', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: bTipo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{idx + 1}</span>
                    </div>
                    <select style={{ ...S.input, flex: 1, maxWidth: 150, padding: '5px 8px', fontSize: 12 }}
                      value={bloco.tipo} onChange={e => updateBlocoAula(planoSelecionado.id, bloco.id, 'tipo', e.target.value)}>
                      {TIPO_BLOCO_AULA.map(t => <option key={t.id}>{t.id}</option>)}
                    </select>
                    <input style={{ ...S.input, maxWidth: 70, padding: '5px 8px', fontSize: 12, textAlign: 'center' }}
                      type="number" min="1" max="120"
                      value={bloco.duracao_min || ''} onChange={e => updateBlocoAula(planoSelecionado.id, bloco.id, 'duracao_min', e.target.value)}
                      placeholder="min" />
                    <span style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0 }}>min</span>
                    <button onClick={() => deleteBlocoAula(planoSelecionado.id, bloco.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16, padding: '0 4px', marginLeft: 'auto' }}>
                      x
                    </button>
                  </div>
                  {/* Conteúdo do bloco */}
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={{ ...S.input, fontWeight: 600 }}
                      value={bloco.nome} onChange={e => updateBlocoAula(planoSelecionado.id, bloco.id, 'nome', e.target.value)}
                      placeholder={'Nome do bloco (ex: Rondo 5x2, Coletivo 7x7...)' } />
                    <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical', fontFamily: 'inherit', fontSize: 12 }}
                      value={bloco.descricao || ''} onChange={e => updateBlocoAula(planoSelecionado.id, bloco.id, 'descricao', e.target.value)}
                      placeholder="Descrição: regras, variações, referências técnicas..." />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resumo de todos os dias planejados */}
      {planos.length > 0 && !selectedDia && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {planos.map(p => {
            const minTotal = (p.blocos_aula || []).reduce((a, b) => a + (parseInt(b.duracao_min) || 0), 0)
            return (
              <div key={p.id} onClick={() => setSelectedDia(p.dia_semana)}
                style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(12,74,110,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: foco.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: foco.color }}>{p.dia_semana}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1B2A', marginBottom: 4 }}>
                    {p.blocos_aula.length} bloco{p.blocos_aula.length !== 1 ? 's' : ''} planejado{p.blocos_aula.length !== 1 ? 's' : ''}
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 400, marginLeft: 8 }}>{minTotal} min total</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.blocos_aula.map(b => {
                      const bt = getBloco(b.tipo)
                      return (
                        <span key={b.id} style={{ fontSize: 10, background: bt.color + '15', color: bt.color, border: '1px solid ' + bt.color + '30', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                          {b.tipo} {b.duracao_min ? b.duracao_min + 'min' : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Editar →</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Etapa 4: Feedback da Aula ─────────────────────────────────────────────────
function FeedbackAula({ blocoSemana, alunosDaTurma, onBack }) {
  const [planos, setPlanos]         = useState([])
  const [selectedPlano, setSelectedPlano] = useState(null)
  const [feedback, setFeedback]     = useState(null) // feedback existente
  const [presencas, setPresencas]   = useState([])
  const [nota, setNota]             = useState(3)
  const [obs, setObs]               = useState('')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [loading, setLoading]       = useState(true)

  const foco = getFoco(blocoSemana.tipo_foco)

  useEffect(() => {
    supabase.from('planos_aula').select('*, blocos_aula(*)')
      .eq('bloco_semana_id', blocoSemana.id)
      .then(({ data }) => {
        setPlanos(data || [])
        if (data && data.length > 0) setSelectedPlano(data[0].id)
        setLoading(false)
      })
  }, [blocoSemana.id])

  useEffect(() => {
    if (!selectedPlano) return
    setFeedback(null); setPresencas([]); setNota(3); setObs(''); setSaved(false)
    supabase.from('feedbacks_aula').select('*').eq('plano_aula_id', selectedPlano).single()
      .then(({ data }) => {
        if (data) {
          setFeedback(data)
          setPresencas(data.presencas || [])
          setNota(data.nota_geral || 3)
          setObs(data.observacoes || '')
        }
      })
  }, [selectedPlano])

  const togglePresenca = (sid) => setPresencas(prev =>
    prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
  )

  const marcarTodos = () => setPresencas(alunosDaTurma.map(a => a.id))
  const limparTodos = () => setPresencas([])

  const saveFeedback = async () => {
    if (!selectedPlano) return
    setSaving(true)
    const payload = { plano_aula_id: selectedPlano, presencas, nota_geral: nota, observacoes: obs, registrado_em: new Date().toISOString() }
    if (feedback) {
      await supabase.from('feedbacks_aula').update(payload).eq('id', feedback.id)
    } else {
      const { data } = await supabase.from('feedbacks_aula').insert([payload]).select().single()
      if (data) setFeedback(data)
      // Marcar plano como realizado
      await supabase.from('planos_aula').update({ status: 'realizado' }).eq('id', selectedPlano)
      setPlanos(prev => prev.map(p => p.id === selectedPlano ? { ...p, status: 'realizado' } : p))
    }
    setSaving(false)
    setSaved(true)
  }

  const notas = [
    { v: 1, label: 'Ruim',    emoji: '😞', color: '#EF4444' },
    { v: 2, label: 'Regular', emoji: '😐', color: '#F97316' },
    { v: 3, label: 'Boa',     emoji: '🙂', color: '#F59E0B' },
    { v: 4, label: 'Ótima',   emoji: '😃', color: '#10B981' },
    { v: 5, label: 'Excelente',emoji: '🌟', color: '#3B82F6' },
  ]

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>Carregando...</div>

  if (planos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
      <div style={{ fontSize: 14, color: '#64748B' }}>Nenhum plano de aula criado para esta semana.</div>
      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Crie um plano na aba "Plano de Aula" primeiro.</div>
      <button onClick={onBack} style={{ ...S.ghost, marginTop: 16, fontSize: 12 }}>← Voltar</button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...S.ghost, padding: '7px 12px', fontSize: 12 }}>← Voltar</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0C4A6E' }}>
            Feedback — Semana {blocoSemana.semana_numero}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Registre presença e avalie a aula</div>
        </div>
      </div>

      {/* Selector de dia */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {planos.map(p => {
          const temFeedback = p.status === 'realizado'
          return (
            <button key={p.id} onClick={() => setSelectedPlano(p.id)} style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid ' + (selectedPlano === p.id ? foco.color : 'rgba(0,0,0,0.1)'),
              background: selectedPlano === p.id ? foco.color : 'transparent',
              color: selectedPlano === p.id ? '#fff' : '#64748B',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              {p.dia_semana}
              {temFeedback && <span style={{ marginLeft: 4 }}>✓</span>}
            </button>
          )
        })}
      </div>

      {selectedPlano && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Presença */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E' }}>Presença</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{presencas.length} de {alunosDaTurma.length} presentes</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={marcarTodos} style={{ ...S.ghost, fontSize: 11, padding: '5px 10px' }}>Todos</button>
                <button onClick={limparTodos} style={{ ...S.ghost, fontSize: 11, padding: '5px 10px' }}>Limpar</button>
              </div>
            </div>

            {alunosDaTurma.length === 0 && (
              <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
                Nenhum aluno na turma
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alunosDaTurma.map(a => {
                const presente = presencas.includes(a.id)
                return (
                  <div key={a.id} onClick={() => togglePresenca(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', background: presente ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.03)', border: '1px solid ' + (presente ? '#10B98130' : 'transparent'), transition: 'all 0.15s' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: presente ? '#10B981' : 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {presente && <span style={{ fontSize: 12, color: '#fff', fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A' }}>{a.name}</div>
                      {a.sport_position && <div style={{ fontSize: 10, color: '#94A3B8' }}>{a.sport_position}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: presente ? '#10B981' : '#94A3B8' }}>
                      {presente ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nota da aula */}
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', marginBottom: 12 }}>Nota da Aula</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {notas.map(n => (
                <button key={n.v} onClick={() => setNota(n.v)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '12px 16px', borderRadius: 12, border: '2px solid ' + (nota === n.v ? n.color : 'rgba(0,0,0,0.08)'),
                  background: nota === n.v ? n.color + '15' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s', minWidth: 70,
                }}>
                  <span style={{ fontSize: 22 }}>{n.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: nota === n.v ? n.color : '#64748B' }}>{n.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', marginBottom: 10 }}>Observações</div>
            <textarea style={{ ...S.input, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Como foi a aula? Pontos de atenção, destaques individuais, ajustes para próxima sessão..." />
          </div>

          {/* Botão salvar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={saveFeedback} disabled={saving} style={{ ...S.btn(foco.color), flex: 1, padding: '14px' }}>
              {saving ? 'Salvando...' : feedback ? 'Atualizar Feedback' : 'Registrar Feedback'}
            </button>
            {saved && (
              <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700 }}>✓ Salvo!</span>
            )}
          </div>

          {feedback && (
            <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
              Último registro: {new Date(feedback.registrado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Detalhe de Turma ──────────────────────────────────────────────────────────
function TurmaDetail({ turma, students, teacherId, onBack, onRefresh }) {
  const [tab, setTab]               = useState('planejamento')
  const [turmaAlunos, setTurmaAlunos] = useState([])
  const [planejamentos, setPlanejamentos] = useState([])
  const [showAddAluno, setShowAddAluno]   = useState(false)
  const [feedbackBloco, setFeedbackBloco] = useState(null)

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
        {[['planejamento', 'Planejamento'], ['alunos', 'Alunos'], ['feedback', 'Feedback']].map(([id, label]) => (
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
    </div>
  )
}

// ── Seletor de bloco para feedback (lista semanas do planejamento) ─────────────
function FeedbackPlanSelector({ plan, onSelectBloco }) {
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

// ── Componente Principal ──────────────────────────────────────────────────────
export default function TabEscolinha({ session, students }) {
  const [turmas, setTurmas]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [selectedTurma, setSelectedTurma] = useState(null)

  const teacherId = session?.user?.id

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase.from('turmas').select('*')
        .eq('teacher_id', teacherId).order('created_at')
      if (error) {
        console.error('Escolinha: tabela turmas indisponivel -', error.message)
        console.error('Execute o SQL escolinha_migration.sql no Supabase.')
      }
      setTurmas(data || [])
    } catch (err) {
      console.error('Escolinha fetchTurmas error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (teacherId) fetchTurmas() }, [teacherId])

  // Agrupar turmas por esporte
  const porEsporte = {}
  turmas.forEach(t => {
    const key = t.esporte
    if (!porEsporte[key]) porEsporte[key] = []
    porEsporte[key].push(t)
  })

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#0C4A6E', opacity: 0.5 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Carregando turmas...
    </div>
  )

  // Tabela não existe — SQL não foi executado
  if (!Array.isArray(turmas)) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0C4A6E', marginBottom: 8 }}>Configuração necessária</div>
      <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
        Execute o arquivo <strong>escolinha_migration.sql</strong><br/>
        no Supabase SQL Editor para ativar a Escolinha.
      </div>
    </div>
  )

  if (selectedTurma) return (
    <TurmaDetail
      turma={selectedTurma}
      students={students}
      teacherId={teacherId}
      onBack={() => setSelectedTurma(null)}
      onRefresh={fetchTurmas}
    />
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C4A6E', marginBottom: 3 }}>Escolinha</h1>
          <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight: 600 }}>
            <span style={{ color: '#34D399', fontWeight: 700 }}>{turmas.length}</span> turma{turmas.length !== 1 ? 's' : ''} ativa{turmas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={S.btn()}>+ Nova Turma</button>
      </div>

      {/* Lista agrupada por esporte */}
      {turmas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#0C4A6E', opacity: 0.5 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🏟️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Nenhuma turma criada</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Clique em "+ Nova Turma" para começar</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(porEsporte).map(([esporte, turmasDoEsporte]) => {
            const sport = getSport(esporte)
            return (
              <div key={esporte}>
                {/* Cabeçalho do esporte */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{sport?.icon || '🏅'}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0C4A6E' }}>{sport?.label || esporte}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>{turmasDoEsporte.length} turma{turmasDoEsporte.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Cards de turma */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {turmasDoEsporte.map(turma => {
                    const diasLabel = (turma.dias_semana || []).join(' · ')
                    return (
                      <div key={turma.id} onClick={() => setSelectedTurma(turma)}
                        style={{ ...S.card, cursor: 'pointer', transition: 'all 0.18s', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(12,74,110,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#0C4A6E,#34D399)' }} />
                        <div style={{ paddingTop: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0C4A6E', marginBottom: 4 }}>{turma.nome}</div>
                          {turma.posicao && <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{turma.posicao}</div>}
                          {diasLabel && <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{diasLabel}</div>}
                          {turma.objetivo_final && (
                            <div style={{ fontSize: 10, color: '#0C4A6E', fontWeight: 600, background: 'rgba(12,74,110,0.07)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 6 }}>
                              {turma.objetivo_final}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            {turma.data_inicio && new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            {turma.data_fim && ` → ${new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#0C4A6E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Ver turma →
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <ModalNovaTurma teacherId={teacherId} students={students} onSave={fetchTurmas} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
