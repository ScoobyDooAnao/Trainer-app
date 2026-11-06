import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { S, CATEGORIA_COLORS, FAIXA_COLORS, BANCO_SUGERIDO } from '../../../lib/escolinhaShared'

// ── Modal de nova atividade ───────────────────────────────────────────────────
export function ModalNovaAtividade({ teacherId, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: '', categoria: 'Personalizada', faixa: 'Todas',
    duracao: '', material: '', desc: '', objetivo: '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    await supabase.from('atividades_escolinha').insert([{
      teacher_id: teacherId,
      titulo:     form.titulo.trim(),
      categoria:  form.categoria,
      faixa_etaria: form.faixa,
      duracao_min:  parseInt(form.duracao) || null,
      material:   form.material || null,
      descricao:  form.desc || null,
      objetivo:   form.objetivo || null,
      sugerida:   false,
    }])
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, padding:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#0C3251', marginBottom:18 }}>Nova Atividade</div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <div style={S.label}>Título *</div>
            <input style={S.input} placeholder="Ex: Circuito de saltos" value={form.titulo} onChange={e => f('titulo', e.target.value)} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={S.label}>Categoria</div>
              <select style={S.input} value={form.categoria} onChange={e => f('categoria', e.target.value)}>
                {Object.keys(CATEGORIA_COLORS).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Faixa etária</div>
              <select style={S.input} value={form.faixa} onChange={e => f('faixa', e.target.value)}>
                {Object.keys(FAIXA_COLORS).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={S.label}>Duração (min)</div>
              <input style={S.input} type="number" placeholder="Ex: 10" value={form.duracao} onChange={e => f('duracao', e.target.value)} />
            </div>
            <div>
              <div style={S.label}>Material</div>
              <input style={S.input} placeholder="Ex: Cones, bola" value={form.material} onChange={e => f('material', e.target.value)} />
            </div>
          </div>
          <div>
            <div style={S.label}>Como executar</div>
            <textarea style={{ ...S.input, minHeight:75, resize:'vertical' }} placeholder="Descreva o passo a passo da atividade..." value={form.desc} onChange={e => f('desc', e.target.value)} />
          </div>
          <div>
            <div style={S.label}>Objetivo / Habilidade trabalhada</div>
            <input style={S.input} placeholder="Ex: Coordenação bilateral, reação auditiva" value={form.objetivo} onChange={e => f('objetivo', e.target.value)} />
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={save} disabled={saving || !form.titulo.trim()} style={{ ...S.btn('#059669'), flex:1, padding:'12px' }}>
            {saving ? 'Salvando...' : 'Salvar Atividade'}
          </button>
          <button onClick={onClose} style={{ ...S.ghost, flex:1, padding:'12px' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Card de atividade ─────────────────────────────────────────────────────────
export function AtividadeCard({ at, isSugestao, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATEGORIA_COLORS[at.categoria] || CATEGORIA_COLORS['Personalizada']
  const faixa = FAIXA_COLORS[at.faixa_etaria || at.faixa] || FAIXA_COLORS['Todas']

  return (
    <div style={{ background:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:14, overflow:'hidden', transition:'all 0.2s' }}>
      {/* Topo colorido */}
      <div style={{ height:3, background:cat.dot }} />
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:7 }}>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:cat.bg, color:cat.text, border:'1px solid '+cat.border }}>{at.categoria}</span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:faixa.bg, color:faixa.text }}>{at.faixa_etaria || at.faixa}</span>
              {at.duracao_min || at.duracao ? <span style={{ fontSize:10, color:'#94A3B8', padding:'2px 6px', background:'rgba(0,0,0,0.04)', borderRadius:20 }}>{at.duracao_min || at.duracao} min</span> : null}
              {isSugestao && <span style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'rgba(5,150,105,0.1)', color:'#059669', border:'1px solid rgba(5,150,105,0.2)' }}>TGMD-3</span>}
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:'#0C3251', marginBottom:4 }}>{at.titulo}</div>
            {at.material && <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>Material: {at.material}</div>}
          </div>
          <button onClick={() => setExpanded(v => !v)} style={{ background:'rgba(12,74,110,0.07)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#0C4A6E', fontWeight:700, fontSize:12, flexShrink:0 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop:10, borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:10, display:'flex', flexDirection:'column', gap:8 }}>
            {(at.desc || at.descricao) && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Como Executar</div>
                <div style={{ fontSize:12, color:'#334155', lineHeight:1.6 }}>{at.desc || at.descricao}</div>
              </div>
            )}
            {(at.objetivo) && (
              <div style={{ padding:'8px 12px', background:'rgba(5,150,105,0.07)', borderRadius:8, border:'1px solid rgba(5,150,105,0.15)' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#059669', marginBottom:2 }}>Objetivo Motor</div>
                <div style={{ fontSize:12, color:'#065F46' }}>{at.objetivo}</div>
              </div>
            )}
            {!isSugestao && onDelete && (
              <button onClick={onDelete} style={{ alignSelf:'flex-start', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'5px 12px', color:'#DC2626', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── BancoAtividades — tab completo ────────────────────────────────────────────
export function BancoAtividades({ teacherId }) {
  const [ativas, setAtivas]         = useState([])  // salvas pelo professor
  const [showModal, setShowModal]   = useState(false)
  const [filterCat, setFilterCat]   = useState('Todas')
  const [filterFaixa, setFilterFaixa] = useState('Todas')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [abaSel, setAbaSel]         = useState('sugeridas') // 'sugeridas' | 'minhas'

  const fetchAtivas = async () => {
    const { data } = await supabase.from('atividades_escolinha')
      .select('*').eq('teacher_id', teacherId).order('created_at')
    setAtivas(data || [])
    setLoading(false)
  }

  useEffect(() => { if (teacherId) fetchAtivas() }, [teacherId])

  const deleteAt = async (id) => {
    await supabase.from('atividades_escolinha').delete().eq('id', id)
    fetchAtivas()
  }

  const cats = ['Todas', ...Object.keys(CATEGORIA_COLORS)]
  const faixas = ['Todas', ...Object.keys(FAIXA_COLORS).filter(k => k !== 'Todas')]

  const applyFilters = (list) => list.filter(at => {
    const catOk   = filterCat === 'Todas' || at.categoria === filterCat
    const faixaOk = filterFaixa === 'Todas' || (at.faixa_etaria || at.faixa) === filterFaixa
    const searchOk = !search || at.titulo.toLowerCase().includes(search.toLowerCase())
    return catOk && faixaOk && searchOk
  })

  const sugeridosFiltrados = applyFilters(BANCO_SUGERIDO)
  const minhasFiltradas    = applyFilters(ativas)

  return (
    <div>
      {showModal && <ModalNovaAtividade teacherId={teacherId} onSave={fetchAtivas} onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0C4A6E' }}>Banco de Atividades</div>
          <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{BANCO_SUGERIDO.length} sugeridas · {ativas.length} suas</div>
        </div>
        <button onClick={() => setShowModal(true)} style={S.btn('#059669')}>+ Nova Atividade</button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[
          { id:'sugeridas', label:'Sugestões TGMD-3', count: sugeridosFiltrados.length },
          { id:'minhas',    label:'Minhas Atividades', count: minhasFiltradas.length },
        ].map(t => (
          <button key={t.id} onClick={() => setAbaSel(t.id)}
            style={{ padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:13, transition:'all 0.15s',
              background: abaSel === t.id ? 'linear-gradient(135deg,#0C4A6E,#155E8E)' : 'rgba(255,255,255,0.65)',
              color: abaSel === t.id ? '#fff' : '#0C4A6E',
              boxShadow: abaSel === t.id ? '0 4px 14px rgba(12,74,110,0.3)' : 'none' }}>
            {t.label} <span style={{ fontSize:10, opacity:0.7 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
        <input placeholder="Buscar atividade..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, background:'rgba(255,255,255,0.9)' }} />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                background: filterCat === c ? (CATEGORIA_COLORS[c]?.dot || '#0C4A6E') : 'rgba(255,255,255,0.8)',
                color: filterCat === c ? '#fff' : '#475569' }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['Todas', ...Object.keys(FAIXA_COLORS).filter(k => k !== 'Todas')].map(f => (
            <button key={f} onClick={() => setFilterFaixa(f)}
              style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                background: filterFaixa === f ? '#0C4A6E' : 'rgba(255,255,255,0.8)',
                color: filterFaixa === f ? '#fff' : '#475569' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {abaSel === 'sugeridas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {sugeridosFiltrados.length === 0
            ? <div style={{ textAlign:'center', padding:'40px 0', color:'#94A3B8', fontSize:13 }}>Nenhuma atividade encontrada com esse filtro.</div>
            : sugeridosFiltrados.map(at => <AtividadeCard key={at.id} at={at} isSugestao />)
          }
        </div>
      )}

      {abaSel === 'minhas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {loading
            ? <div style={{ textAlign:'center', padding:30, color:'#94A3B8' }}>Carregando...</div>
            : minhasFiltradas.length === 0
              ? (
                <div style={{ textAlign:'center', padding:'48px 20px', color:'#94A3B8' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Nenhuma atividade criada ainda</div>
                  <div style={{ fontSize:12 }}>Clique em "+ Nova Atividade" para adicionar</div>
                </div>
              )
              : minhasFiltradas.map(at => (
                  <AtividadeCard key={at.id} at={at} isSugestao={false} onDelete={() => deleteAt(at.id)} />
                ))
          }
        </div>
      )}
    </div>
  )
}
