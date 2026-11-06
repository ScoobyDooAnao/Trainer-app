import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { TIPO_FOCO, TIPO_BLOCO_AULA, DIAS, getFoco, getBloco, S } from '../../../lib/escolinhaShared'

// ── Modal Novo Planejamento ───────────────────────────────────────────────────
export function ModalNovoPlanejamento({ turmaId, turma, onSave, onClose }) {
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
export function PlanejamentoView({ turma, planejamentos, students, teacherId, onRefresh }) {
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
export function PlanoAulaEditor({ blocoSemana, diasTurma, onBack }) {
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
export function FeedbackAula({ blocoSemana, alunosDaTurma, onBack }) {
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
