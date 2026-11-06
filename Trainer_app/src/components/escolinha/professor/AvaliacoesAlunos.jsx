import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { getSport, S, TGMD3_LOCOMOCAO, TGMD3_OBJETO, TGMD3_NIVEIS, TESTES_ESPORTE, ESCALA_TECNICO } from '../../../lib/escolinhaShared'

// ── Avaliação Individual de um Aluno ─────────────────────────────────────────
export function AvaliacaoAluno({ avaliacao, aluno, turma, onBack }) {
  const [scores, setScores]         = useState({})
  const [scoresTec, setScoresTec]   = useState({})
  const [obs, setObs]               = useState('')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [resultadoId, setResultadoId] = useState(null)

  const testesEsporte = TESTES_ESPORTE[turma.esporte] || []
  const tipo          = avaliacao.tipo || 'completa'

  useEffect(() => {
    supabase.from('resultados_avaliacao').select('*')
      .eq('avaliacao_id', avaliacao.id).eq('student_id', aluno.id).single()
      .then(({ data }) => {
        if (data) {
          setResultadoId(data.id)
          setScores(data.scores || {})
          setScoresTec(data.scores_tecnicos || {})
          setObs(data.observacoes || '')
        }
      })
  }, [avaliacao.id, aluno.id])

  const save = async () => {
    setSaving(true)
    const payload = { avaliacao_id:avaliacao.id, student_id:aluno.id, scores, scores_tecnicos:scoresTec, observacoes:obs, avaliado_em:new Date().toISOString() }
    if (resultadoId) {
      await supabase.from('resultados_avaliacao').update(payload).eq('id', resultadoId)
    } else {
      const { data } = await supabase.from('resultados_avaliacao').insert([payload]).select().single()
      if (data) setResultadoId(data.id)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const PatternRow = ({ pattern, source, setter }) => {
    const niveis = source === 'motor' ? TGMD3_NIVEIS : ESCALA_TECNICO
    const val    = source === 'motor' ? scores[pattern.id] : scoresTec[pattern.id]
    const cur    = niveis.find(n => n.val === val)
    return (
      <div style={{ background: '#0A0F1A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding:'12px 14px', marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>{pattern.label}</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{pattern.desc}</div>
            {pattern.categoria && (
              <span style={{ fontSize:9, color: pattern.categoria==='Físico'?'#EF4444':'#3B82F6', background: pattern.categoria==='Físico'?'rgba(239,68,68,0.1)':'rgba(59,130,246,0.1)', borderRadius:10, padding:'1px 7px', fontWeight:700, marginTop:4, display:'inline-block' }}>
                {pattern.categoria}
              </span>
            )}
          </div>
          {cur && <div style={{ flexShrink:0, marginLeft:10, padding:'3px 10px', borderRadius:6, background:cur.color+'18', border:`1px solid ${cur.color}35`, fontSize:11, fontWeight:700, color:cur.color }}>{cur.label}</div>}
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {niveis.map(nivel => (
            <button key={nivel.val} onClick={() => setter(prev => ({ ...prev, [pattern.id]:nivel.val }))}
              style={{ flex:1, padding:'7px 4px', borderRadius:8, border:`1px solid ${val===nivel.val?nivel.color:'rgba(255,255,255,0.08)'}`, background:val===nivel.val?nivel.color+'20':'rgba(255,255,255,0.03)', color:val===nivel.val?nivel.color:'#475569', fontSize:11, fontWeight:val===nivel.val?700:400, cursor:'pointer', transition:'all 0.15s' }}>
              {nivel.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ ...S.ghost, padding:'7px 12px', fontSize:12 }}>← Voltar</button>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>{aluno.name}</div>
          <div style={{ fontSize:11, color:'#64748B' }}>{avaliacao.titulo}</div>
        </div>
      </div>

      {/* Testes técnicos do esporte */}
      {(tipo==='tecnico'||tipo==='completa') && testesEsporte.length>0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>
            Habilidades Técnicas — {getSport(turma.esporte)?.label}
          </div>
          <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>Avalie cada habilidade pela escala de desenvolvimento</div>
          {testesEsporte.map(t => <PatternRow key={t.id} pattern={t} source="tecnico" setter={setScoresTec} />)}
        </div>
      )}

      {/* TGMD-3 Motor */}
      {(tipo==='motor'||tipo==='completa') && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#6366F1', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>
            Habilidades de Locomoção — TGMD-3
          </div>
          <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>Padrões motores de deslocamento</div>
          {TGMD3_LOCOMOCAO.map(p => <PatternRow key={p.id} pattern={p} source="motor" setter={setScores} />)}

          <div style={{ fontSize:11, fontWeight:700, color:'#6366F1', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4, marginTop:20 }}>
            Controle de Objeto — TGMD-3
          </div>
          <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>Padrões motores de manipulação</div>
          {TGMD3_OBJETO.map(p => <PatternRow key={p.id} pattern={p} source="motor" setter={setScores} />)}
        </div>
      )}

      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Observações</div>
        <textarea style={{ ...S.input, minHeight:80, resize:'vertical', fontFamily:'inherit' }}
          value={obs} onChange={e => setObs(e.target.value)}
          placeholder="Notas sobre o desempenho, pontos de atenção..." />
      </div>

      <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:16 }}>
        <button onClick={save} disabled={saving} style={{ ...S.btn('#6366F1'), flex:1, padding:'14px' }}>
          {saving ? 'Salvando...' : resultadoId ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
        </button>
        {saved && <span style={{ fontSize:13, color:'#34D399', fontWeight:700 }}>✓ Salvo!</span>}
      </div>
    </div>
  )
}

// ── Editor de Avaliação (professor cria/edita) ────────────────────────────────
export function AvaliacaoEditor({ turma, planejamentos, alunosDaTurma, onBack }) {
  const [avaliacoes, setAvaliacoes]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [showNew, setShowNew]         = useState(false)
  const [alunoView, setAlunoView]     = useState(null) // { avaliacao, aluno }
  const [visaoGeral, setVisaoGeral]   = useState(null) // avaliacao para ver resultados
  const [form, setForm]               = useState({ titulo:'', tipo:'completa', semana_numero:'', data_prevista:'' })
  const [planId, setPlanId]           = useState(planejamentos[0]?.id || '')
  const [saving, setSaving]           = useState(false)
  const [resultados, setResultados]   = useState([])

  const f = (k,v) => setForm(x => ({ ...x, [k]:v }))

  useEffect(() => {
    supabase.from('avaliacoes_turma').select('*')
      .eq('turma_id', turma.id).order('created_at', { ascending:false })
      .then(({ data }) => { setAvaliacoes(data||[]); setLoading(false) })
  }, [turma.id])

  useEffect(() => {
    if (!visaoGeral) return
    supabase.from('resultados_avaliacao').select('*').eq('avaliacao_id', visaoGeral.id)
      .then(({ data }) => setResultados(data||[]))
  }, [visaoGeral])

  const createAvaliacao = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    const { data } = await supabase.from('avaliacoes_turma').insert([{
      turma_id: turma.id,
      planejamento_id: planId || null,
      titulo: form.titulo,
      tipo: form.tipo,
      semana_numero: form.semana_numero ? +form.semana_numero : null,
      data_prevista: form.data_prevista || null,
    }]).select().single()
    if (data) setAvaliacoes(prev => [data, ...prev])
    setShowNew(false)
    setForm({ titulo:'', tipo:'completa', semana_numero:'', data_prevista:'' })
    setSaving(false)
  }

  if (alunoView) return (
    <AvaliacaoAluno
      avaliacao={alunoView.avaliacao}
      aluno={alunoView.aluno}
      turma={turma}
      onBack={() => setAlunoView(null)}
    />
  )

  const TIPO_LABEL = { motor:'Motor (TGMD-3)', tecnico:'Técnico', completa:'Completa (Motor + Técnico)' }
  const TIPO_COLOR = { motor:'#6366F1', tecnico:'#3B82F6', completa:'#10B981' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#0C4A6E' }}>Avaliações da Turma</div>
        <button onClick={() => setShowNew(true)} style={S.btn()}>+ Nova Avaliação</button>
      </div>

      {/* Form nova avaliação */}
      {showNew && (
        <div style={{ ...S.card, marginBottom:20, border:'1px solid rgba(99,102,241,0.3)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#6366F1', marginBottom:14 }}>Nova Avaliação</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <div style={S.label}>Título *</div>
              <input style={S.input} placeholder="Ex: Avaliação Trimestral — Semana 12" value={form.titulo} onChange={e => f('titulo',e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={S.label}>Tipo</div>
                <select style={S.input} value={form.tipo} onChange={e => f('tipo',e.target.value)}>
                  <option value="completa">Completa (Motor + Técnico)</option>
                  <option value="motor">Só Motor (TGMD-3)</option>
                  <option value="tecnico">Só Técnico</option>
                </select>
              </div>
              <div>
                <div style={S.label}>Planejamento</div>
                <select style={S.input} value={planId} onChange={e => setPlanId(e.target.value)}>
                  <option value="">Sem vínculo</option>
                  {planejamentos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={S.label}>Semana do Planejamento</div>
                <input style={S.input} type="number" min="1" placeholder="ex: 12" value={form.semana_numero} onChange={e => f('semana_numero',e.target.value)} />
              </div>
              <div>
                <div style={S.label}>Data Prevista</div>
                <input style={S.input} type="date" value={form.data_prevista} onChange={e => f('data_prevista',e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={createAvaliacao} disabled={saving} style={S.btn('#6366F1')}>
                {saving ? 'Criando...' : 'Criar Avaliação'}
              </button>
              <button onClick={() => setShowNew(false)} style={S.ghost}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', padding:'30px', color:'#64748B' }}>Carregando...</div>}

      {!loading && avaliacoes.length===0 && !showNew && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#94A3B8', fontSize:13 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
          Nenhuma avaliação criada.<br/>Crie uma para registrar o desenvolvimento da turma.
        </div>
      )}

      {/* Lista de avaliações */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {avaliacoes.map(av => {
          const tc = TIPO_COLOR[av.tipo] || '#64748B'
          const avaliados = resultados.filter(r => r.avaliacao_id===av.id).length
          return (
            <div key={av.id} style={{ ...S.card, border:'1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0C4A6E', marginBottom:4 }}>{av.titulo}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, background:tc+'15', color:tc, border:'1px solid '+tc+'30', borderRadius:20, padding:'2px 8px', fontWeight:700 }}>
                      {TIPO_LABEL[av.tipo]}
                    </span>
                    {av.semana_numero && (
                      <span style={{ fontSize:10, background:'rgba(12,74,110,0.08)', color:'#0C4A6E', borderRadius:20, padding:'2px 8px' }}>
                        Semana {av.semana_numero}
                      </span>
                    )}
                    {av.data_prevista && (
                      <span style={{ fontSize:10, color:'#64748B' }}>
                        {new Date(av.data_prevista+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alunos para avaliar */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {alunosDaTurma.map(aluno => {
                  const temResultado = resultados.some(r => r.avaliacao_id===av.id && r.student_id===aluno.id)
                  return (
                    <div key={aluno.id} onClick={() => setAlunoView({ avaliacao:av, aluno })}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, cursor:'pointer', background: temResultado?'rgba(16,185,129,0.06)':'rgba(0,0,0,0.03)', border:'1px solid '+(temResultado?'rgba(16,185,129,0.2)':'rgba(0,0,0,0.06)'), transition:'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background=temResultado?'rgba(16,185,129,0.1)':'rgba(12,74,110,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background=temResultado?'rgba(16,185,129,0.06)':'rgba(0,0,0,0.03)'}>
                      <div style={{ width:32, height:32, borderRadius:8, background:temResultado?'rgba(16,185,129,0.15)':'rgba(12,74,110,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:temResultado?'#10B981':'#0C4A6E' }}>{aluno.name[0]}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0D1B2A' }}>{aluno.name}</div>
                        {aluno.sport_position && <div style={{ fontSize:10, color:'#94A3B8' }}>{aluno.sport_position}</div>}
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:temResultado?'#10B981':'#94A3B8' }}>
                        {temResultado ? '✓ Avaliado' : 'Avaliar →'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
