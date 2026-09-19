import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabase'

const TOLERANCIA = 1 // cm (ou kg) — diferença máxima entre Teste e Reteste antes de exigir desempate

const BASICAS = [
  { key:'peso',             label:'Peso (kg)',           unit:'kg', umaVez:false },
  { key:'estatura',         label:'Estatura (cm)',       unit:'cm', umaVez:true },
  { key:'estatura_sentado', label:'Estatura Sentado (cm)', unit:'cm', umaVez:true },
  { key:'envergadura',      label:'Envergadura (cm)',    unit:'cm', umaVez:true },
]
const SEGMENTARES = [
  { key:'acromial_radial',   label:'Acromial-Radial' },
  { key:'radial_estiloidal', label:'Radial-Estiloidal' },
  { key:'trocanterica',      label:'Trocantérica' },
  { key:'tibial',            label:'Tibial' },
  { key:'maleolar',          label:'Maleolar' },
]
const PERIM_UNICOS = [
  { key:'ombro',   label:'Ombro' },
  { key:'cintura', label:'Cintura' },
  { key:'quadril', label:'Quadril' },
]
const PERIM_BILATERAIS = [
  { key:'braco_relaxado',  label:'Braço Relaxado' },
  { key:'braco_contraido', label:'Braço Contraído' },
  { key:'antebraco',       label:'Antebraço' },
  { key:'coxa',            label:'Coxa' },
  { key:'panturrilha',     label:'Panturrilha' },
]

function calcFinal(t1, t2, t3) {
  const n1 = parseFloat(t1), n2 = parseFloat(t2), n3 = parseFloat(t3)
  if (isNaN(n1) || isNaN(n2)) return null
  if (Math.abs(n1 - n2) <= TOLERANCIA) return +((n1 + n2) / 2).toFixed(1)
  if (isNaN(n3)) return null
  return [n1, n2, n3].sort((a, b) => a - b)[1] // mediana das 3
}
function precisaDesempate(t1, t2) {
  const n1 = parseFloat(t1), n2 = parseFloat(t2)
  if (isNaN(n1) || isNaN(n2)) return false
  return Math.abs(n1 - n2) > TOLERANCIA
}

const cellInp = { width:'100%', background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'6px 4px', color:'#E2E8F0', fontSize:12, textAlign:'center', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

function LinhaMedida({ label, val, onChange, readOnly, unit }) {
  const { t1='', t2='', t3='' } = val || {}
  const desempate = precisaDesempate(t1, t2)
  const final = calcFinal(t1, t2, t3)
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 52px 52px 52px 56px', gap:6, alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:12, color:'#94A3B8' }}>{label}</span>
      <input style={cellInp} value={t1} disabled={readOnly} onChange={e => onChange({ ...val, t1:e.target.value })} placeholder="T1" />
      <input style={cellInp} value={t2} disabled={readOnly} onChange={e => onChange({ ...val, t2:e.target.value })} placeholder="T2" />
      <input style={{ ...cellInp, opacity: desempate ? 1 : 0.3, borderColor: desempate && !t3 ? '#F87171' : cellInp.border }} disabled={readOnly || !desempate} value={t3} onChange={e => onChange({ ...val, t3:e.target.value })} placeholder={desempate ? '⚠' : '—'} />
      <span style={{ fontSize:13, fontWeight:800, color: final != null ? '#34D399' : '#334155', textAlign:'center' }}>{final != null ? final : '—'}</span>
    </div>
  )
}

function SecTitle({ children }) {
  return <div style={{ fontSize:10, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:0.6, margin:'18px 0 4px' }}>{children}</div>
}
function ColHeader() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 52px 52px 52px 56px', gap:6, padding:'0 0 4px' }}>
      <span/>
      {['Teste','Reteste','Desemp.','Final'].map(h => <span key={h} style={{ fontSize:9, color:'#475569', fontWeight:700, textAlign:'center' }}>{h}</span>)}
    </div>
  )
}

export default function FichaAvaliacao({ avaliacaoId, studentId, student, anamData, readOnly, onClose }) {
  const [av, setAv] = useState(null)
  const [medidas, setMedidas] = useState({})
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [sexo, setSexo] = useState(student?.sexo || '')
  const [primeiraRef, setPrimeiraRef] = useState(null) // avaliação de referência p/ segmentares/estatura em reavaliações
  const [loading, setLoading] = useState(true)
  const [sav, setSav] = useState(false)
  const lastSavedRef = useRef('')

  useEffect(() => { fetchAv() }, [avaliacaoId])

  const fetchAv = async () => {
    setLoading(true)
    const { data: row } = await supabase.from('measure_logs').select('*').eq('id', avaliacaoId).single()
    if (row) {
      setAv(row)
      setMedidas(row.medidas || {})
      setData(row.date || '')
      setHora(row.hora || '')
      if (!row.is_primeira) {
        const { data: prim } = await supabase.from('measure_logs').select('*').eq('student_id', studentId).eq('is_primeira', true).limit(1)
        if (prim?.[0]) setPrimeiraRef(prim[0])
      }
    }
    setLoading(false)
  }

  const setCampo = (key) => (val) => setMedidas(p => ({ ...p, [key]: val }))

  const idade = student?.age ?? (student?.birth_date ? Math.floor((Date.now() - new Date(student.birth_date)) / (365.25*24*3600*1000)) : null)
  const perfil = anamData?.perfil

  // IMC e RCQ calculados a partir dos finais atuais (ou herdados da 1ª avaliação, se reavaliação)
  const estaturaCm = av?.is_primeira
    ? calcFinal(medidas.estatura?.t1, medidas.estatura?.t2, medidas.estatura?.t3)
    : primeiraRef?.medidas?.estatura?.final ?? calcFinal(primeiraRef?.medidas?.estatura?.t1, primeiraRef?.medidas?.estatura?.t2, primeiraRef?.medidas?.estatura?.t3)
  const pesoKg = calcFinal(medidas.peso?.t1, medidas.peso?.t2, medidas.peso?.t3)
  const cinturaCm = calcFinal(medidas.cintura?.t1, medidas.cintura?.t2, medidas.cintura?.t3)
  const quadrilCm = calcFinal(medidas.quadril?.t1, medidas.quadril?.t2, medidas.quadril?.t3)
  const imc = (pesoKg && estaturaCm) ? +(pesoKg / ((estaturaCm/100) ** 2)).toFixed(1) : null
  const rcq = (cinturaCm && quadrilCm) ? +(cinturaCm / quadrilCm).toFixed(2) : null
  const rcqRisco = rcq == null ? null : sexo === 'F'
    ? (rcq >= 0.85 ? 'Risco elevado' : 'Risco baixo')
    : (rcq >= 0.90 ? 'Risco elevado' : 'Risco baixo')

  // Autosave
  useEffect(() => {
    if (readOnly || !av) return
    const snapshot = JSON.stringify({ medidas, data, hora, sexo })
    if (snapshot === lastSavedRef.current) return
    const t = setTimeout(async () => {
      setSav(true)
      await supabase.from('measure_logs').update({
        medidas, date: data, hora, imc, rcq,
        weight: pesoKg, waist: cinturaCm, hip: quadrilCm, // sincroniza colunas planas (usadas no card do Dashboard)
      }).eq('id', avaliacaoId)
      if (sexo && sexo !== student?.sexo) await supabase.from('students').update({ sexo }).eq('id', studentId)
      lastSavedRef.current = snapshot
      setSav(false)
    }, 900)
    return () => clearTimeout(t)
  }, [medidas, data, hora, sexo])

  if (loading || !av) return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', color:'#3B82F6' }}>Carregando...</div>
  )

  const bilateralKey = (base, lado) => `${base}_${lado}`

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:400, overflowY:'auto' }}>
      <div style={{ maxWidth:640, margin:'0 auto', padding:'20px 16px 60px' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:16, fontFamily:'inherit' }}>← Voltar</button>

        {/* Header */}
        <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:2 }}>{student?.name}</div>
          <div style={{ fontSize:12, color:'#64748B', marginBottom:10 }}>
            {idade != null ? `${idade} anos` : ''}{sexo ? ` · ${sexo === 'M' ? 'Masculino' : 'Feminino'}` : ''}
          </div>

          {!readOnly && !student?.sexo && (
            <div style={{ marginBottom:10 }}>
              <select value={sexo} onChange={e => setSexo(e.target.value)} style={{ ...cellInp, width:140, textAlign:'left' }}>
                <option value="">Sexo...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          )}

          {perfil && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {[perfil.nivel, perfil.experiencia, perfil.objetivo].filter(Boolean).map(v => (
                <span key={v} style={{ fontSize:10, fontWeight:700, color:'#60A5FA', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, padding:'2px 8px' }}>{v}</span>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <input type="date" disabled={readOnly} value={data} onChange={e => setData(e.target.value)} style={{ ...cellInp, flex:1, textAlign:'left' }} />
            <input type="time" disabled={readOnly} value={hora} onChange={e => setHora(e.target.value)} style={{ ...cellInp, flex:1, textAlign:'left' }} />
          </div>
        </div>

        {/* Indicadores calculados */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:9, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>IMC <span style={{fontWeight:400, opacity:0.7}}>(ref. iniciantes)</span></div>
            <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0' }}>{imc ?? '—'}</div>
          </div>
          <div style={{ background:'#0A0A0A', border:'1px solid rgba(59,130,246,0.25)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:9, color:'#60A5FA', fontWeight:700, textTransform:'uppercase' }}>RCQ (indicador principal)</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F0' }}>{rcq ?? '—'} {rcqRisco && <span style={{ fontSize:11, fontWeight:700, color: rcqRisco==='Risco elevado' ? '#F87171' : '#34D399' }}>· {rcqRisco}</span>}</div>
          </div>
        </div>

        {/* Básicas */}
        <SecTitle>Dados Básicos</SecTitle>
        <ColHeader />
        {BASICAS.filter(m => av.is_primeira || !m.umaVez).map(m => (
          <LinhaMedida key={m.key} label={m.label} val={medidas[m.key]} onChange={setCampo(m.key)} readOnly={readOnly} />
        ))}
        {!av.is_primeira && primeiraRef && (
          <div style={{ fontSize:11, color:'#475569', marginTop:4, fontStyle:'italic' }}>
            Estatura/Sentado/Envergadura: herdadas da 1ª avaliação ({primeiraRef.date}).
          </div>
        )}

        {/* Segmentares — só na 1ª avaliação */}
        {av.is_primeira ? (
          <>
            <SecTitle>Comprimentos / Alturas Segmentares</SecTitle>
            <ColHeader />
            {SEGMENTARES.map(m => (
              <LinhaMedida key={m.key} label={m.label} val={medidas[m.key]} onChange={setCampo(m.key)} readOnly={readOnly} />
            ))}
          </>
        ) : primeiraRef && (
          <div style={{ marginTop:14 }}>
            <SecTitle>Comprimentos / Alturas Segmentares (referência, 1ª avaliação)</SecTitle>
            <div style={{ fontSize:11, color:'#64748B', lineHeight:1.8 }}>
              {SEGMENTARES.map(m => primeiraRef.medidas?.[m.key]?.final != null && (
                <div key={m.key}>{m.label}: <strong style={{color:'#94A3B8'}}>{primeiraRef.medidas[m.key].final} cm</strong></div>
              ))}
            </div>
          </div>
        )}

        {/* Perímetros únicos */}
        <SecTitle>Perímetros — Únicos</SecTitle>
        <ColHeader />
        {PERIM_UNICOS.map(m => (
          <LinhaMedida key={m.key} label={m.label} val={medidas[m.key]} onChange={setCampo(m.key)} readOnly={readOnly} />
        ))}

        {/* Perímetros bilaterais */}
        <SecTitle>Perímetros — Bilaterais</SecTitle>
        <ColHeader />
        {PERIM_BILATERAIS.map(m => (
          <div key={m.key}>
            <LinhaMedida label={`${m.label} (D)`} val={medidas[bilateralKey(m.key,'d')]} onChange={setCampo(bilateralKey(m.key,'d'))} readOnly={readOnly} />
            <LinhaMedida label={`${m.label} (E)`} val={medidas[bilateralKey(m.key,'e')]} onChange={setCampo(bilateralKey(m.key,'e'))} readOnly={readOnly} />
          </div>
        ))}

        {!readOnly && (
          <div style={{ textAlign:'center', fontSize:11, color: sav ? '#64748B' : '#334155', marginTop:16 }}>
            {sav ? 'Salvando...' : 'Salvo automaticamente'}
          </div>
        )}
      </div>
    </div>
  )
}
