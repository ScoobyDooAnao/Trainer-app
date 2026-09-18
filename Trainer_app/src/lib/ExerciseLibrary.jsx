import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAppNavigate } from '../lib/useAppNavigate'

const MUSCLE_TYPES = [
  'Peito','Costas','Bíceps','Tríceps','Ombro',
  'Quadríceps','Posterior','Glúteo','Panturrilha','Core','Cardio','Full Body',
]

const inp = { width:'100%', background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

export default function ExerciseLibrary() {
  const navigate = useAppNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', type:'Peito', tip:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('exercise_library').select('*').eq('teacher_id', user.id).order('name')
    setItems(data || [])
    setLoading(false)
  }

  const salvar = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('exercise_library').insert([{
      teacher_id: user.id, name: form.name.trim(), type: form.type, tip: form.tip || null,
    }]).select().single()
    setSaving(false)
    if (!error && data) {
      setItems(p => [...p, data].sort((a,b) => a.name.localeCompare(b.name)))
      setForm({ name:'', type:'Peito', tip:'' })
      setShowForm(false)
    }
  }

  const excluir = async (id) => {
    if (!window.confirm('Excluir este exercício da biblioteca?')) return
    await supabase.from('exercise_library').delete().eq('id', id)
    setItems(p => p.filter(i => i.id !== id))
  }

  const filtered = items.filter(i =>
    (!filterType || i.type === filterType) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ minHeight:'100vh', background:'#000', fontFamily:"'DM Sans',system-ui,sans-serif", padding:'24px 20px' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <button onClick={() => navigate('dashboard')} style={{ background:'none', border:'none', color:'#64748B', fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:600, marginBottom:20 }}>
          ← Voltar ao Painel
        </button>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#fff' }}>Biblioteca de Exercícios</div>
          <button onClick={() => setShowForm(v => !v)} style={{ padding:'9px 16px', borderRadius:10, border:'1px solid rgba(59,130,246,0.4)', background: showForm ? 'rgba(248,113,113,0.1)' : 'rgba(59,130,246,0.1)', color: showForm ? '#F87171' : '#3B82F6', fontWeight:700, fontSize:12, cursor:'pointer' }}>
            {showForm ? '✕ Cancelar' : '+ Adicionar Exercício'}
          </button>
        </div>
        <div style={{ fontSize:12, color:'#475569', marginBottom:20 }}>Seus exercícios cadastrados — também usado futuramente na Escolinha.</div>

        {showForm && (
          <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, marginBottom:20 }}>
            <input style={{ ...inp, marginBottom:10 }} value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} placeholder="Nome do exercício" />
            <select style={{ ...inp, marginBottom:10 }} value={form.type} onChange={e => setForm(p => ({ ...p, type:e.target.value }))}>
              {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <textarea style={{ ...inp, minHeight:60, resize:'vertical', marginBottom:12 }} value={form.tip} onChange={e => setForm(p => ({ ...p, tip:e.target.value }))} placeholder="Como se realiza (opcional)" />
            <button onClick={salvar} disabled={saving || !form.name.trim()} style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:'#22C55E', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>
              {saving ? 'Salvando...' : '✓ Salvar na Biblioteca'}
            </button>
          </div>
        )}

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          <input style={{ ...inp, flex:1, minWidth:160 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercício..." />
          <select style={{ ...inp, width:160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos os grupos</option>
            {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'#334155', padding:40, fontSize:13 }}>
            {items.length === 0 ? 'Nenhum exercício cadastrado ainda.' : 'Nada encontrado com esse filtro.'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(ex => (
              <div key={ex.id} style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{ex.name}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(59,130,246,0.12)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.3)' }}>{ex.type}</span>
                  </div>
                  {ex.tip && <div style={{ fontSize:12, color:'#64748B' }}>{ex.tip}</div>}
                </div>
                <button onClick={() => excluir(ex.id)} style={{ background:'none', border:'none', color:'#F87171', cursor:'pointer', fontSize:12, opacity:0.6, flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
