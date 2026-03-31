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
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => saveBloco(editingBloco)} disabled={saving} style={S.btn(foco.color)}>
                            {saving ? 'Salvando...' : 'Salvar'}
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

// ── Detalhe de Turma ──────────────────────────────────────────────────────────
function TurmaDetail({ turma, students, teacherId, onBack, onRefresh }) {
  const [tab, setTab]               = useState('planejamento')
  const [turmaAlunos, setTurmaAlunos] = useState([])
  const [planejamentos, setPlanejamentos] = useState([])
  const [showAddAluno, setShowAddAluno]   = useState(false)

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
        {[['planejamento', 'Planejamento'], ['alunos', 'Alunos']].map(([id, label]) => (
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
    const { data } = await supabase.from('turmas').select('*')
      .eq('teacher_id', teacherId).order('created_at')
    setTurmas(data || [])
    setLoading(false)
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
      Carregando turmas...
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
