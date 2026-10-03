import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

// ⚠️ RESERVADO — não importado/renderizado em lugar nenhum ainda.
// Telas antigas substituídas pela Ficha do Aluno atual (FichaInformacoes):
// EditFormFields (Fase 0), ProgressTab e AnamneseTab (removidas na Fase 3).
// Mantidas só como referência histórica — não precisam ser reativadas.
// Ao reativar: precisa de C, s, GOALS, LEVELS, SPORTS (em pages/StudentDetail.jsx).

// ── EditFormFields — form de edição do perfil do aluno ───────────────────────
// ── SepDark — separador dark para formulário de edição ───────────────────────
function SepDark({ title }) {
  return (
    <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, marginTop:16, marginBottom:4 }}>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

function EditFormFields({ form, setForm }) {
  const f   = (field, val) => setForm(prev => ({ ...prev, [field]: val }))
  const inp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase', letterSpacing:1, fontWeight:700, display:'block', marginTop:12 }
  // Sep defined at module level
  const editAge  = parseInt(form.age) || null
  const editLTAD = calcLTAD(editAge, parseInt(form.experience_years) || 0, form.sport)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <SepDark title="Dados Pessoais" />
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Nome</label>
        <input style={inp} value={form.name||''} onChange={e=>f('name',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Idade</label>
        <input style={inp} type="number" placeholder="Ex: 14" value={form.age||''} onChange={e=>f('age',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Nível</label>
        <select style={inp} value={form.level||''} onChange={e=>f('level',e.target.value)}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Peso (kg)</label>
        <input style={inp} type="number" placeholder="Ex: 55" value={form.weight||''} onChange={e=>f('weight',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Altura (cm)</label>
        <input style={inp} type="number" placeholder="Ex: 165" value={form.height||''} onChange={e=>f('height',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Altura sentado (cm)</label>
        <input style={inp} type="number" placeholder="Para PHV" value={form.height_sitting||''} onChange={e=>f('height_sitting',e.target.value)} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Objetivo</label>
        <select style={inp} value={form.goal||''} onChange={e=>f('goal',e.target.value)}>
          <optgroup label="Esportivo">
            {['Iniciação Esportiva','Desenvolvimento Atlético','Treinamento Competitivo'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
          <optgroup label="Saúde">
            {['Saúde e Bem-Estar','Condicionamento'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
          <optgroup label="Estética / Força">
            {['Ganho de Massa','Emagrecimento','Força e Performance'].map(g=><option key={g}>{g}</option>)}
          </optgroup>
        </select>
      </div>

      <SepDark title="Esporte" />
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Modalidade</label>
        <select style={inp} value={form.sport||''} onChange={e=>f('sport',e.target.value)}>
          <option value="">Nenhuma</option>
          {SPORTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Posição / Especialidade</label>
        <input style={inp} placeholder="Ex: Meia, Ala..." value={form.sport_position||''} onChange={e=>f('sport_position',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Anos de experiência</label>
        <input style={inp} type="number" min="0" placeholder="Ex: 2" value={form.experience_years||''} onChange={e=>f('experience_years',e.target.value)} />
      </div>
      {editLTAD && (
        <div style={{ gridColumn:'1/-1', padding:'8px 12px', borderRadius:10, background:editLTAD.bg, border:'1px solid '+editLTAD.cor+'33', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:editLTAD.cor, display:'inline-block', flexShrink:0 }} />
          <div style={{ fontSize:11, fontWeight:700, color:editLTAD.cor }}>LTAD: {editLTAD.fase}</div>
        </div>
      )}

      <SepDark title="Responsável" />
      <div>
        <label style={lbl}>Nome do responsável</label>
        <input style={inp} placeholder="Ex: Maria Silva" value={form.guardian_name||''} onChange={e=>f('guardian_name',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>WhatsApp</label>
        <input style={inp} placeholder="(41) 99999-9999" value={form.guardian_phone||''} onChange={e=>f('guardian_phone',e.target.value)} />
      </div>

      <SepDark title="Maturação (PHV)" />
      <div>
        <label style={lbl}>Altura pai (cm)</label>
        <input style={inp} type="number" placeholder="Ex: 178" value={form.parent_height_father||''} onChange={e=>f('parent_height_father',e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Altura mãe (cm)</label>
        <input style={inp} type="number" placeholder="Ex: 165" value={form.parent_height_mother||''} onChange={e=>f('parent_height_mother',e.target.value)} />
      </div>

      <SepDark title="Observações" />
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Lesões, restrições, notas</label>
        <textarea style={{ ...inp, minHeight:65, resize:'vertical', fontFamily:'inherit' }}
          placeholder="Ex: entorse tornozelo direito..."
          value={form.notes||''} onChange={e=>f('notes',e.target.value)} />
      </div>
    </div>
  )
}


// ── ProgressTab — Medidas e Força ────────────────────────────────────────────
function ProgressTab({ progress, exLogs, showProgressForm, setShowProgressForm, newProgress, setNewProgress, addProgress, deleteProgress, saving, s }) {
  const [subTab, setSubTab] = useState('medidas')
  const [selEx,  setSelEx]  = useState(null)

  const fmtDate = (d) => {
    if (!d) return ''
    const [,m,day] = String(d).slice(0,10).split('-')
    return day + '/' + m
  }

  // ── Força: agrupar logs por exercício ──────────────────────────────────────
  const exercicios = useMemo(() => {
    const map = {}
    ;(exLogs || []).forEach(l => {
      const name = l._name || l.exercise_id
      if (!map[name]) map[name] = []
      const maxW = Math.max(...(l.sets||[]).map(s => +(s.weight||0)))
      if (maxW > 0) map[name].push({ date: l.date?.slice(0,10), max: maxW })
    })
    // Sort each exercise by date
    Object.values(map).forEach(arr => arr.sort((a,b) => a.date > b.date ? 1 : -1))
    return map
  }, [exLogs])

  const exNames = Object.keys(exercicios)
  const exSel   = selEx || exNames[0] || null
  const exData  = exSel ? exercicios[exSel] || [] : []

  // Deduplicate by date (keep max per date)
  const exDataDedup = useMemo(() => {
    const byDate = {}
    exData.forEach(e => { if (!byDate[e.date] || e.max > byDate[e.date]) byDate[e.date] = e.max })
    return Object.entries(byDate).sort().map(([date, max]) => ({ date, max }))
  }, [exData])

  // ── Mini SVG chart ─────────────────────────────────────────────────────────
  const MiniChart = ({ data, color }) => {
    if (data.length < 2) return (
      <div style={{ textAlign:'center', padding:'24px 0', color:'#334155', fontSize:12 }}>
        Registre pelo menos 2 sessões com carga para ver o gráfico.
      </div>
    )
    const W=320, H=100, PL=36, PR=12, PT=8, PB=24
    const vals = data.map(d => d.max)
    const minV = Math.min(...vals), maxV = Math.max(...vals)
    const range = maxV - minV || 1
    const cx = (i) => PL + (i/(data.length-1))*(W-PL-PR)
    const cy = (v) => PT + (1-(v-minV)/range)*(H-PT-PB)
    const pts = data.map((d,i) => cx(i)+','+cy(d.max)).join(' ')
    const area = 'M'+cx(0)+','+cy(data[0].max)+' '+
      data.slice(1).map((d,i)=>'L'+cx(i+1)+','+cy(d.max)).join(' ')+
      ' L'+cx(data.length-1)+','+(H-PB)+' L'+cx(0)+','+(H-PB)+' Z'
    const first = data[0].max, last = data[data.length-1].max
    const delta = +(last-first).toFixed(1)
    const pr = exDataDedup.length > 0 ? Math.max(...exDataDedup.map(d=>d.max)) : 0
    const isNewPr = last >= pr && data.length > 1

    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'#475569' }}>
            <span style={{ fontWeight:700, color:'#E2E8F0', fontSize:20 }}>{last}kg</span>
            {' '}
            <span style={{ fontSize:11, fontWeight:700, color: delta >= 0 ? '#34D399' : '#F87171', background: (delta>=0?'#34D399':'#F87171')+'18', padding:'2px 8px', borderRadius:20 }}>
              {delta >= 0 ? '+' : ''}{delta}kg
            </span>
          </div>
          {isNewPr && (
            <div style={{ fontSize:10, fontWeight:800, color:'#A78BFA', background:'rgba(167,139,250,0.15)', padding:'3px 10px', borderRadius:20, border:'1px solid rgba(167,139,250,0.3)' }}>
              PR {pr}kg
            </div>
          )}
        </div>
        <div style={{ overflowX:'auto' }}>
          <svg width={W} height={H} style={{ display:'block', minWidth:W }}>
            {[0,0.5,1].map(t => {
              const y = PT + t*(H-PT-PB)
              const v = (maxV - t*range).toFixed(1)
              return (
                <g key={t}>
                  <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="rgba(255,255,255,0.04)" />
                  <text x={PL-4} y={y+4} textAnchor="end" fontSize={8} fill="#334155">{v}</text>
                </g>
              )
            })}
            {data.map((d,i) => (
              (i===0||i===data.length-1||(data.length>4&&i===Math.floor(data.length/2)))
                ? <text key={i} x={cx(i)} y={H-PB+14} textAnchor="middle" fontSize={8} fill="#334155">{fmtDate(d.date)}</text>
                : null
            ))}
            <path d={area} fill={color+'10'} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d,i) => (
              <circle key={i} cx={cx(i)} cy={cy(d.max)} r={i===data.length-1?5:3}
                fill={color} stroke="#0D1117" strokeWidth={2} />
            ))}
          </svg>
        </div>
        <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{data.length} sessões registradas · {fmtDate(data[0].date)} → {fmtDate(data[data.length-1].date)}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['medidas','Medidas'],['forca','Força']].map(([id,label]) => (
          <button key={id} onClick={() => setSubTab(id)}
            style={{ padding:'8px 20px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
              background: subTab===id ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.05)',
              color: subTab===id ? '#fff' : '#475569',
              boxShadow: subTab===id ? '0 4px 14px rgba(124,58,237,0.35)' : 'none' }}>
            {label}
          </button>
        ))}
        <button style={{ ...s.btn(C.green), marginLeft:'auto' }} onClick={() => setShowProgressForm(!showProgressForm)}>
          + Registrar Evolução
        </button>
      </div>

      {/* Form */}
      {showProgressForm && (
        <div style={{ ...s.card, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:16 }}>Novo Registro de Medidas</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Data','date','date'],['Peso (kg)','weight','number'],['Cintura (cm)','waist','number'],['Peito (cm)','chest','number'],['Quadril (cm)','hip','number'],['Coxa (cm)','thigh','number']].map(([l,f,t]) => (
              <div key={f}>
                <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>{l}</div>
                <input style={s.input} type={t} value={newProgress[f]} onChange={e => setNewProgress(x => ({ ...x, [f]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase' }}>Observações</div>
              <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }} value={newProgress.notes} onChange={e => setNewProgress(x => ({ ...x, notes: e.target.value }))} placeholder="Ex: Aluno relatou cansaço, aumentou carga no supino..." />
            </div>
          </div>
          <button style={s.btn(C.green)} onClick={addProgress} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Registro'}</button>
        </div>
      )}

      {/* ── MEDIDAS ── */}
      {subTab === 'medidas' && (
        <>
          {progress.length === 0
            ? <div style={{ textAlign:'center', padding:60, color:'#334155' }}>Nenhum registro ainda</div>
            : progress.map((p, i) => (
              <div key={p.id} style={{ ...s.card, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:13, color:'#34D399', fontWeight:700, marginBottom:8 }}>
                      {new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
                      {i===0 && <span style={{ marginLeft:8, fontSize:10, background:'#34D39920', color:'#34D399', padding:'2px 8px', borderRadius:20, border:'1px solid #34D39940' }}>Mais recente</span>}
                    </div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                      {p.weight && <div><span style={{ fontSize:10, color:'#475569' }}>Peso: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.weight} kg</span></div>}
                      {p.measurements?.waist && <div><span style={{ fontSize:10, color:'#475569' }}>Cintura: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.waist} cm</span></div>}
                      {p.measurements?.chest && <div><span style={{ fontSize:10, color:'#475569' }}>Peito: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.chest} cm</span></div>}
                      {p.measurements?.hip && <div><span style={{ fontSize:10, color:'#475569' }}>Quadril: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.hip} cm</span></div>}
                      {p.measurements?.thigh && <div><span style={{ fontSize:10, color:'#475569' }}>Coxa: </span><span style={{ fontWeight:700, color:'#E2E8F0' }}>{p.measurements.thigh} cm</span></div>}
                    </div>
                    {p.notes && <div style={{ fontSize:12, color:'#64748B', marginTop:8 }}>{p.notes}</div>}
                  </div>
                  <button onClick={() => deleteProgress(p.id)} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16 }}>🗑</button>
                </div>
              </div>
            ))
          }
        </>
      )}

      {/* ── FORÇA ── */}
      {subTab === 'forca' && (
        <div>
          {exNames.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#334155', fontSize:13 }}>
              Nenhuma carga registrada ainda. O aluno precisa registrar as cargas nos exercícios pelo link dele.
            </div>
          ) : (
            <>
              {/* Seletor de exercício */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                {exNames.map(name => (
                  <button key={name} onClick={() => setSelEx(name)}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                      background: (exSel===name) ? '#7C3AED' : 'rgba(255,255,255,0.05)',
                      color: (exSel===name) ? '#fff' : '#475569',
                      transition:'all 0.15s' }}>
                    {name}
                  </button>
                ))}
              </div>

              {/* Gráfico */}
              {exSel && (
                <div style={{ ...s.card, marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F0', marginBottom:12 }}>{exSel}</div>
                  <MiniChart data={exDataDedup} color="#A78BFA" />
                </div>
              )}

              {/* Histórico de cargas */}
              {exSel && exDataDedup.length > 0 && (
                <div style={{ ...s.card }}>
                  <div style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Histórico</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
                    {[...exDataDedup].reverse().map((d,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                        <span style={{ fontSize:12, color:'#475569' }}>{new Date(d.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>
                        <span style={{ fontSize:14, fontWeight:800, color:'#A78BFA' }}>{d.max} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}


// ── AnamneseTab — PAR-Q + Anamnese do Personal (ACSM) ───────────────────────

// ── Camada 1: PAR-Q ──────────────────────────────────────────────────────────
const PARQ_PERGUNTAS = [
  { id:'cardiaco',    texto:'Médico já disse que você tem algum problema no coração?' },
  { id:'dor_peito',  texto:'Você sente dor no peito ao realizar atividade física?' },
  { id:'tontura',    texto:'Já perdeu o equilíbrio ou a consciência por tontura recentemente?' },
  { id:'osseo',      texto:'Tem problema ósseo ou articular que piora com exercício?' },
  { id:'medicamento',texto:'Usa medicamento para pressão arterial ou problema cardíaco?' },
  { id:'gestante',   texto:'Está grávida ou deu à luz nos últimos 3 meses?' },
  { id:'outra_razao',texto:'Existe outra razão física pela qual não deveria praticar atividade física?' },
]

// ── Camada 2: Anamnese do Personal ───────────────────────────────────────────
const LIMITACOES_OPTS = [
  { id:'nenhuma',       label:'Nenhuma' },
  { id:'ombro_esq',     label:'Ombro Esq.' },
  { id:'ombro_dir',     label:'Ombro Dir.' },
  { id:'joelho_esq',    label:'Joelho Esq.' },
  { id:'joelho_dir',    label:'Joelho Dir.' },
  { id:'coluna_lom',    label:'Coluna Lombar' },
  { id:'coluna_cer',    label:'Coluna Cervical' },
  { id:'quadril',       label:'Quadril' },
  { id:'tornozelo_esq', label:'Tornozelo Esq.' },
  { id:'tornozelo_dir', label:'Tornozelo Dir.' },
  { id:'cotovelo_esq',  label:'Cotovelo Esq.' },
  { id:'cotovelo_dir',  label:'Cotovelo Dir.' },
  { id:'punho_esq',     label:'Punho Esq.' },
  { id:'punho_dir',     label:'Punho Dir.' },
  { id:'quadriceps',    label:'Quadríceps' },
  { id:'posterior',     label:'Posterior Coxa' },
]

const EXPERIENCIA_OPTS = [
  { id:'nunca',    label:'Nunca treinou' },
  { id:'menos1',   label:'Menos de 1 ano' },
  { id:'1a2',      label:'1–2 anos' },
  { id:'3a5',      label:'3–5 anos' },
  { id:'5mais',    label:'5+ anos' },
  { id:'voltando', label:'Voltando após pausa' },
]

const PAUSA_OPTS = [
  { id:'1a3m',     label:'1–3 meses' },
  { id:'3a6m',     label:'3–6 meses' },
  { id:'6a12m',    label:'6–12 meses' },
  { id:'mais1ano', label:'Mais de 1 ano' },
]

const PREFERENCIAS_OPTS = [
  { id:'nenhuma',       label:'Nenhuma preferência' },
  { id:'musculacao',    label:'Musculação' },
  { id:'cardio',        label:'Cardio' },
  { id:'aparelhos',     label:'Aparelhos/Máquinas' },
  { id:'pesos_livres',  label:'Pesos Livres' },
  { id:'funcional',     label:'Funcional' },
  { id:'hiit',          label:'HIIT' },
  { id:'alongamento',   label:'Alongamento/Mobilidade' },
  { id:'natacao',       label:'Natação' },
  { id:'outdoor',       label:'Ao ar livre' },
]

const SAUDE_OPTS = [
  { id:'nenhuma',      label:'Nenhuma' },
  { id:'hipertensao',  label:'Hipertensão' },
  { id:'diabetes',     label:'Diabetes' },
  { id:'cardiopatia',  label:'Cardiopatia' },
  { id:'asma',         label:'Asma/Respiratório' },
  { id:'osteoporose',  label:'Osteoporose' },
  { id:'artrite',      label:'Artrite/Artrose' },
  { id:'herniadisco',  label:'Hérnia de Disco' },
]

function Chip({ label, selected, onClick, color, warn }) {
  const cor = warn ? '#F87171' : (color || '#60A5FA')
  return (
    <button onClick={onClick} style={{
      padding:'6px 13px', borderRadius:20, fontSize:11, fontWeight:600,
      cursor:'pointer', fontFamily:'inherit',
      border:`1.5px solid ${selected ? cor : 'rgba(255,255,255,0.1)'}`,
      background: selected ? `${cor}22` : 'rgba(255,255,255,0.04)',
      color: selected ? cor : '#475569', transition:'all 0.15s',
    }}>{label}</button>
  )
}

function SecLabel({ title, sub }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F0' }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function AnamneseTab({ studentId, teacherId, s }) {
  const [data,    setData]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  const EMPTY = {
    // PAR-Q
    parq: {},
    // Anamnese
    limitacoes: [], limitacao_detalhe: '',
    experiencia: '', tempo_pausa: '',
    preferencias: [], condicoes_saude: [],
    historico: '',
  }

  useEffect(() => {
    supabase.from('anamnese').select('*').eq('student_id', studentId).single()
      .then(({ data: d }) => { setData(d ? { ...EMPTY, ...d } : EMPTY); setLoading(false) })
  }, [studentId])

  // Toggle array — se clicar em "nenhuma", limpa tudo e coloca só nenhuma
  const toggleArr = (field, val) => setData(p => {
    const arr = p[field] || []
    if (val === 'nenhuma') return { ...p, [field]: arr.includes('nenhuma') ? [] : ['nenhuma'] }
    const sem = arr.filter(x => x !== 'nenhuma')
    return { ...p, [field]: sem.includes(val) ? sem.filter(x=>x!==val) : [...sem, val] }
  })

  const toggleParq = (id) => setData(p => ({
    ...p, parq: { ...p.parq, [id]: !p.parq?.[id] }
  }))

  const set1 = (field, val) => setData(p => ({ ...p, [field]: p[field]===val ? '' : val }))

  const save = async () => {
    setSaving(true)
    await supabase.from('anamnese').upsert([{
      student_id: studentId, teacher_id: teacherId,
      ...data, updated_at: new Date().toISOString(),
    }], { onConflict: 'student_id' })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding:30, textAlign:'center', color:'#334155' }}>Carregando...</div>

  const parqPositivos = PARQ_PERGUNTAS.filter(q => data.parq?.[q.id])
  const alerta = parqPositivos.length > 0

  const inp = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ══ CAMADA 1: PAR-Q ══════════════════════════════════════════════════ */}
      <div style={{ ...s.card, borderColor: alerta ? 'rgba(248,113,113,0.35)' : undefined }}>
        <SecLabel
          title="PAR-Q — Prontidão para Atividade Física"
          sub="Instrumento validado pelo ACSM. Marque SIM nas perguntas que se aplicam ao aluno."
        />

        {alerta && (
          <div style={{ marginBottom:12, padding:'10px 14px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, fontSize:12, color:'#F87171', lineHeight:1.6 }}>
            ⚠ {parqPositivos.length} resposta(s) positiva(s). Recomendado encaminhamento médico antes do início do programa.
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {PARQ_PERGUNTAS.map(q => {
            const sim = !!data.parq?.[q.id]
            return (
              <div key={q.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background: sim ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.03)', border:`1px solid ${sim ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ flex:1, fontSize:12, color: sim ? '#F87171' : '#CBD5E1', lineHeight:1.5 }}>{q.texto}</div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => { if (sim) toggleParq(q.id) }}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${!sim ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`, background: !sim ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)', color: !sim ? '#34D399' : '#475569' }}>
                    Não
                  </button>
                  <button onClick={() => { if (!sim) toggleParq(q.id) }}
                    style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${sim ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`, background: sim ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.04)', color: sim ? '#F87171' : '#475569' }}>
                    Sim
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ CAMADA 2: ANAMNESE DO PERSONAL ══════════════════════════════════ */}

      {/* Limitações físicas */}
      <div style={s.card}>
        <SecLabel title="Limitações Físicas" sub="Regiões com dor, lesão ou restrição de movimento" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: (data.limitacoes||[]).some(l=>l!=='nenhuma') ? 10 : 0 }}>
          {LIMITACOES_OPTS.map(o => (
            <Chip key={o.id} label={o.label}
              color={o.id==='nenhuma' ? '#34D399' : '#F87171'}
              selected={(data.limitacoes||[]).includes(o.id)}
              onClick={() => toggleArr('limitacoes', o.id)} />
          ))}
        </div>
        {(data.limitacoes||[]).some(l => l!=='nenhuma') && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:10, color:'#64748B', marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>Descreva a limitação</div>
            <input style={inp} placeholder="Ex: dor no ombro esquerdo ao elevar acima da cabeça..."
              value={data.limitacao_detalhe||''} onChange={e=>setData(p=>({...p,limitacao_detalhe:e.target.value}))} />
          </div>
        )}
      </div>

      {/* Experiência */}
      <div style={s.card}>
        <SecLabel title="Experiência de Academia" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: data.experiencia==='voltando' ? 10 : 0 }}>
          {EXPERIENCIA_OPTS.map(o => (
            <Chip key={o.id} label={o.label} color="#60A5FA"
              selected={data.experiencia===o.id}
              onClick={() => set1('experiencia', o.id)} />
          ))}
        </div>
        {data.experiencia==='voltando' && (
          <>
            <div style={{ fontSize:11, color:'#475569', marginBottom:6 }}>Tempo afastado:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {PAUSA_OPTS.map(o => (
                <Chip key={o.id} label={o.label} color="#FBBF24"
                  selected={data.tempo_pausa===o.id}
                  onClick={() => set1('tempo_pausa', o.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preferências */}
      <div style={s.card}>
        <SecLabel title="Preferências de Treino" sub="O que o aluno prefere ou gosta de fazer" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {PREFERENCIAS_OPTS.map(o => (
            <Chip key={o.id} label={o.label}
              color={o.id==='nenhuma' ? '#94A3B8' : '#34D399'}
              selected={(data.preferencias||[]).includes(o.id)}
              onClick={() => toggleArr('preferencias', o.id)} />
          ))}
        </div>
      </div>

      {/* Condições de saúde */}
      <div style={s.card}>
        <SecLabel title="Condições de Saúde" sub="Marque o que for relevante" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {SAUDE_OPTS.map(o => (
            <Chip key={o.id} label={o.label}
              color={o.id==='nenhuma' ? '#34D399' : '#FBBF24'}
              selected={(data.condicoes_saude||[]).includes(o.id)}
              onClick={() => toggleArr('condicoes_saude', o.id)} />
          ))}
        </div>
      </div>

      {/* Histórico livre */}
      <div style={s.card}>
        <SecLabel title="Observações e Histórico Livre" />
        <textarea value={data.historico||''} onChange={e=>setData(p=>({...p,historico:e.target.value}))}
          placeholder="Cirurgias, medicamentos, metas específicas, comportamento, outras informações relevantes..."
          style={{ ...inp, minHeight:75, resize:'vertical', lineHeight:1.6 }} />
      </div>

      {/* Salvar */}
      <button onClick={save} disabled={saving}
        style={{ padding:'13px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:800, fontSize:14, fontFamily:'inherit', transition:'all 0.2s',
          background: saved ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
          color: saved ? '#34D399' : '#fff' }}>
        {saving ? 'Salvando...' : saved ? '✓ Anamnese Salva' : 'Salvar Anamnese'}
      </button>
    </div>
  )
}




export { EditFormFields, ProgressTab, AnamneseTab }
