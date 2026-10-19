import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { GOAL, GRAUS, DIAS_SEMANA_LABELS, FUND_BLOCOS, calcDensidade } from '../../lib/dashboardShared'

export function MensalModal({ student, teacherId, onClose }) {
  const today = new Date()
  const [mesRef, setMesRef]     = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [entradas, setEntradas] = useState({}) // { 'YYYY-MM-DD': tipo }
  const [loading, setLoading]   = useState(true)
  const [grauSel, setBlocoSel] = useState('moderado')
  const [saving, setSaving]     = useState(false)

  const mesLabel = new Date(mesRef.year, mesRef.month, 1)
    .toLocaleDateString('pt-BR', { month:'long', year:'numeric' })

  useEffect(() => { loadMes() }, [mesRef])

  const loadMes = async () => {
    setLoading(true)
    const ini = `${mesRef.year}-${String(mesRef.month+1).padStart(2,'0')}-01`
    const fim = new Date(mesRef.year, mesRef.month+1, 0).toISOString().slice(0,10)
    const { data } = await supabase.from('planejamento_diario')
      .select('data,tipo').eq('student_id', student.id)
      .gte('data', ini).lte('data', fim)
    const map = {}
    ;(data||[]).forEach(e => { map[e.data] = e.tipo })
    setEntradas(map)
    setLoading(false)
  }

  const toggleDia = async (dateStr) => {
    setSaving(true)
    if (entradas[dateStr] === grauSel) {
      // Remove
      await supabase.from('planejamento_diario')
        .delete().eq('student_id', student.id).eq('data', dateStr)
      setEntradas(p => { const n={...p}; delete n[dateStr]; return n })
    } else {
      // Upsert
      await supabase.from('planejamento_diario').upsert([{
        teacher_id: teacherId, student_id: student.id,
        data: dateStr, tipo: grauSel,
      }], { onConflict: 'student_id,data' })
      setEntradas(p => ({ ...p, [dateStr]: grauSel }))
    }
    setSaving(false)
  }

  const prevMes = () => setMesRef(p => p.month === 0 ? { year:p.year-1, month:11 } : { year:p.year, month:p.month-1 })
  const nextMes = () => setMesRef(p => p.month === 11 ? { year:p.year+1, month:0 } : { year:p.year, month:p.month+1 })

  // Build calendar grid
  const primeiroDia = new Date(mesRef.year, mesRef.month, 1)
  const ultimoDia   = new Date(mesRef.year, mesRef.month+1, 0)
  const startOffset = primeiroDia.getDay() // 0=Dom
  const totalDias   = ultimoDia.getDate()

  // Build weeks array
  const semanas = []
  let semana = Array(7).fill(null)
  for (let d = 1; d <= totalDias; d++) {
    const diaSemana = (startOffset + d - 1) % 7
    semana[diaSemana] = d
    if (diaSemana === 6 || d === totalDias) {
      semanas.push([...semana])
      semana = Array(7).fill(null)
    }
  }

  const todayStr = today.toISOString().slice(0,10)

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:12 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, width:'100%', maxWidth:700, maxHeight:'95vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>Grade Mensal — {student.name.split(' ')[0]}</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{student.goal} · {student.level}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'6px 12px', color:'#475569', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>✕</button>
        </div>

        {/* Seletor de bloco */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:10, color:'#334155', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>
            Selecione o tipo de estímulo e clique nos dias
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {Object.entries(GRAUS).map(([k,b]) => (
              <button key={k} onClick={() => setBlocoSel(k)}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${grauSel===k ? b.cor : 'transparent'}`, background: grauSel===k ? b.bg : 'rgba(255,255,255,0.04)', color: grauSel===k ? b.cor : '#475569', transition:'all 0.15s' }}>
                {b.label}
              </button>
            ))}
          </div>
          {grauSel && (
            <div style={{ marginTop:8, fontSize:11, color:GRAUS[grauSel].cor, opacity:0.8 }}>
              {GRAUS[grauSel].desc} — clique num dia para atribuir ou remover
            </div>
          )}
        </div>

        {/* Calendário */}
        <div style={{ padding:'14px 20px 20px' }}>
          {/* Navegação mês */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <button onClick={prevMes} style={{ background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, padding:'5px 12px', color:'#475569', cursor:'pointer', fontSize:16, fontFamily:'inherit' }}>‹</button>
            <div style={{ flex:1, textAlign:'center', fontSize:14, fontWeight:700, color:'#E2E8F0', textTransform:'capitalize' }}>{mesLabel}</div>
            <button onClick={nextMes} style={{ background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, padding:'5px 12px', color:'#475569', cursor:'pointer', fontSize:16, fontFamily:'inherit' }}>›</button>
          </div>

          {/* Header dias */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
            {DIAS_SEMANA_LABELS.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#334155', textTransform:'uppercase', letterSpacing:0.8, padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Grade */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#334155' }}>Carregando...</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {semanas.map((sem, si) => (
                <div key={si} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {sem.map((dia, di) => {
                    if (!dia) return <div key={di} />
                    const dateStr = `${mesRef.year}-${String(mesRef.month+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                    const tipo    = entradas[dateStr]
                    const bloco   = tipo ? GRAUS[tipo] : null
                    const isToday = dateStr === todayStr
                    return (
                      <div key={di} onClick={() => toggleDia(dateStr)}
                        title={bloco ? bloco.label : 'Clique para atribuir'}
                        style={{
                          aspectRatio:'1',
                          borderRadius:8,
                          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
                          cursor: saving ? 'wait' : 'pointer',
                          background: bloco ? bloco.bg : 'rgba(255,255,255,0.03)',
                          border: isToday
                            ? `2px solid ${bloco ? bloco.cor : '#60A5FA'}`
                            : bloco ? `1px solid ${bloco.border}` : '1px solid rgba(255,255,255,0.05)',
                          transition:'all 0.15s',
                          position:'relative',
                        }}>
                        <span style={{ fontSize:12, fontWeight: isToday ? 800 : 500, color: bloco ? bloco.cor : '#334155' }}>{dia}</span>
                        {bloco && (
                          <div style={{ width:6, height:6, borderRadius:'50%', background:bloco.cor }} />
                        )}
                        {isToday && !bloco && (
                          <div style={{ width:4, height:4, borderRadius:'50%', background:'#60A5FA' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Legenda resumo do mês */}
          {Object.keys(entradas).length > 0 && (
            <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:10, color:'#334155', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Resumo do mês</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.entries(GRAUS).map(([k,b]) => {
                  const count = Object.values(entradas).filter(t => t === k).length
                  if (!count) return null
                  return (
                    <div key={k} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:b.bg, border:`1px solid ${b.border}` }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:b.cor }} />
                      <span style={{ fontSize:11, fontWeight:700, color:b.cor }}>{b.label}: {count}d</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function FundamentosModal({ student, teacherId, onClose }) {
  const [semanas,  setSemanas]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const NUM_SEMANAS = 12

  useEffect(() => { loadFundamentos() }, [])

  const loadFundamentos = async () => {
    setLoading(true)
    const { data } = await supabase.from('fundamentos_semana')
      .select('*').eq('student_id', student.id).order('semana_num')
    if (data && data.length) {
      setSemanas(data)
    } else {
      // Inicializa semanas vazias
      setSemanas(Array.from({ length: NUM_SEMANAS }, (_, i) => ({
        semana_num: i + 1, volume: '', intensidade: '', frequencia: '', recuperacao: '', notas: '',
      })))
    }
    setLoading(false)
  }

  const updateSemana = (idx, field, val) => {
    setSemanas(p => p.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const salvar = async () => {
    setSaving(true)
    const rows = semanas.map(s => ({
      teacher_id: teacherId, student_id: student.id,
      semana_num: s.semana_num, volume: s.volume || null,
      intensidade: s.intensidade || null, frequencia: s.frequencia || null,
      recuperacao: s.recuperacao || null, notas: s.notas || null,
    }))
    await supabase.from('fundamentos_semana').upsert(rows, { onConflict: 'student_id,semana_num' })
    setSaving(false)
  }

  const inp = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'6px 8px', color:'#E2E8F0', fontSize:11, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:12 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, width:'100%', maxWidth:900, maxHeight:'95vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:'#0D1117', zIndex:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>Planilha de Fundamentos — {student.name.split(' ')[0]}</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{student.goal} · {student.level} · {NUM_SEMANAS} semanas</div>
          </div>
          <button onClick={salvar} disabled={saving}
            style={{ padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#A855F7,#7C3AED)', color:'#fff', fontWeight:700, fontSize:12, fontFamily:'inherit' }}>
            {saving ? 'Salvando...' : '💾 Salvar'}
          </button>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'7px 12px', color:'#475569', cursor:'pointer', fontSize:13 }}>✕</button>
        </div>

        {/* Legenda dos blocos */}
        <div style={{ padding:'12px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:12, flexWrap:'wrap' }}>
          {Object.entries(FUND_BLOCOS).map(([k,b]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:b.bg, border:`1px solid ${b.border}` }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:b.cor, flexShrink:0 }} />
              <div>
                <span style={{ fontSize:10, fontWeight:700, color:b.cor }}>{b.label}</span>
                <span style={{ fontSize:9, color:b.cor, opacity:0.7, marginLeft:5 }}>{b.desc}</span>
              </div>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.25)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#EAB308' }} />
            <span style={{ fontSize:10, fontWeight:700, color:'#EAB308' }}>Densidade</span>
            <span style={{ fontSize:9, color:'#EAB308', opacity:0.7, marginLeft:2 }}>calculada automaticamente</span>
          </div>
        </div>

        {/* Planilha */}
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#334155' }}>Carregando...</div>
        ) : (
          <div style={{ padding:'16px 22px 24px' }}>
            {/* Cabeçalho colunas */}
            <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr 1fr 1fr 80px 1fr', gap:6, marginBottom:6, padding:'0 2px' }}>
              {['Sem','Volume','Intensidade','Frequência','Recuperação','Densidade','Notas'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:'#334155', textTransform:'uppercase', letterSpacing:0.8, padding:'4px 6px' }}>{h}</div>
              ))}
            </div>

            {/* Linhas de semanas */}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {semanas.map((s, i) => {
                const dens = calcDensidade(s.intensidade, s.recuperacao)
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr 1fr 1fr 80px 1fr', gap:6, padding:'6px 2px', borderRadius:8, background: i%2===0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {/* Semana */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#60A5FA', background:'rgba(96,165,250,0.1)', borderRadius:6, padding:'6px' }}>
                      S{s.semana_num}
                    </div>
                    {/* Volume */}
                    <div style={{ border:`1px solid ${FUND_BLOCOS.volume.border}`, borderRadius:6, background:FUND_BLOCOS.volume.bg }}>
                      <input style={inp} placeholder="ex: 16 séries · 3x/sem"
                        value={s.volume||''} onChange={e=>updateSemana(i,'volume',e.target.value)} />
                    </div>
                    {/* Intensidade */}
                    <div style={{ border:`1px solid ${FUND_BLOCOS.intensidade.border}`, borderRadius:6, background:FUND_BLOCOS.intensidade.bg }}>
                      <input style={inp} placeholder="ex: 75% 1RM · PSE 7"
                        value={s.intensidade||''} onChange={e=>updateSemana(i,'intensidade',e.target.value)} />
                    </div>
                    {/* Frequência */}
                    <div style={{ border:`1px solid ${FUND_BLOCOS.frequencia.border}`, borderRadius:6, background:FUND_BLOCOS.frequencia.bg }}>
                      <input style={inp} placeholder="ex: 4x · 2x/grupo"
                        value={s.frequencia||''} onChange={e=>updateSemana(i,'frequencia',e.target.value)} />
                    </div>
                    {/* Recuperação */}
                    <div style={{ border:`1px solid ${FUND_BLOCOS.recuperacao.border}`, borderRadius:6, background:FUND_BLOCOS.recuperacao.bg }}>
                      <input style={inp} placeholder="ex: 2 dias · 8h sono"
                        value={s.recuperacao||''} onChange={e=>updateSemana(i,'recuperacao',e.target.value)} />
                    </div>
                    {/* Densidade calculada */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:dens.cor, background:`${dens.cor}15`, border:`1px solid ${dens.cor}30`, borderRadius:6, padding:'4px' }}>
                      {dens.label}
                    </div>
                    {/* Notas */}
                    <div style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, background:'rgba(255,255,255,0.03)' }}>
                      <input style={inp} placeholder="observações..."
                        value={s.notas||''} onChange={e=>updateSemana(i,'notas',e.target.value)} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop:16, fontSize:11, color:'#334155', textAlign:'center' }}>
              Densidade calculada a partir da relação Intensidade ÷ Recuperação. Preencha ambos os campos com valores numéricos para ativar.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TabPlanejamento — lista de alunos com acesso direto ao Planner ────────────
export function TabPlanejamento({ students, navigate, session }) {
  const [search,      setSearch]      = useState('')
  const [mensalAluno, setMensalAluno] = useState(null)
  const [fundAluno,   setFundAluno]   = useState(null)

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'#0C3251', letterSpacing:'-0.5px', marginBottom:3, textShadow:'0 1px 3px rgba(255,255,255,0.5)' }}>Planejamento</h1>
          <p style={{ fontSize:13, color:'#0C4A6E', fontWeight:500 }}>{students.length} aluno{students.length!==1?'s':''} · macrociclos, carga e fundamentos</p>
        </div>
        {/* Legenda graus de intensidade */}
        <div style={{ display:'flex', gap:6, alignItems:'center', background:'rgba(255,255,255,0.55)', backdropFilter:'blur(8px)', borderRadius:10, padding:'8px 14px', border:'1px solid rgba(255,255,255,0.8)', flexWrap:'wrap' }}>
          {Object.entries(GRAUS).map(([k,g]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:g.cor }} />
              <span style={{ fontSize:9, color:'#64748B', fontWeight:600 }}>{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Busca */}
      <div style={{ marginBottom:14, background:'rgba(255,255,255,0.55)', borderRadius:12, border:'1px solid rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#94A3B8"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input placeholder="Buscar aluno..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'#0D1B2A', fontFamily:'inherit' }} />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#0C4A6E', opacity:0.4 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
          <div style={{ fontSize:15, fontWeight:700 }}>Nenhum aluno encontrado</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map(st => {
            const g   = GOAL[st.goal]
            const cor = g?.accent || '#64748B'
            return (
              <div key={st.id} style={{ background:'rgba(255,255,255,0.68)', backdropFilter:'blur(10px)', borderRadius:14, border:'1.5px solid rgba(255,255,255,0.9)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 10px rgba(12,50,81,0.07)' }}>
                {/* Avatar */}
                <div style={{ width:40, height:40, borderRadius:10, background:`${cor}18`, border:`1.5px solid ${cor}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:cor }}>{st.name.charAt(0).toUpperCase()}</span>
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0C3251', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{st.name}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {st.goal  && <span style={{ fontSize:10, fontWeight:700, color:cor }}>{st.goal}</span>}
                    {st.level && <span style={{ fontSize:10, color:'#94A3B8' }}>· {st.level}</span>}
                    {st.age   && <span style={{ fontSize:10, color:'#94A3B8' }}>· {st.age} anos</span>}
                  </div>
                </div>
                {/* Ações */}
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  <button onClick={() => setMensalAluno(st)} title="Diário de Carga"
                    style={{ padding:'7px 11px', borderRadius:9, border:'1.5px solid rgba(34,197,94,0.35)', cursor:'pointer', background:'rgba(34,197,94,0.08)', color:'#16A34A', fontWeight:700, fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                    Carga
                  </button>
                  <button onClick={() => setFundAluno(st)} title="Planilha de Fundamentos"
                    style={{ padding:'7px 11px', borderRadius:9, border:'1.5px solid rgba(168,85,247,0.35)', cursor:'pointer', background:'rgba(168,85,247,0.08)', color:'#9333EA', fontWeight:700, fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3z"/></svg>
                    Fundamentos
                  </button>
                  <button onClick={() => navigate('planner', { studentId: st.id })}
                    style={{ padding:'7px 13px', borderRadius:9, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:700, fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, boxShadow:'0 2px 8px rgba(59,130,246,0.3)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    Planejar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mensalAluno && <MensalModal student={mensalAluno} teacherId={session?.user?.id} onClose={() => setMensalAluno(null)} />}
      {fundAluno   && <FundamentosModal student={fundAluno} teacherId={session?.user?.id} onClose={() => setFundAluno(null)} />}
    </div>
  )
}
