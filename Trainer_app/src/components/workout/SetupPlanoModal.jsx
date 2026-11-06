import { useState } from 'react'
import { MUSCLE_TYPES } from '../../lib/workoutShared'

// ── Popup obrigatório de configuração — abre ao criar um plano novo ───────────
// Só fecha ao salvar ou ao voltar pra Ficha do Aluno (nunca com X/backdrop).
export function SetupPlanoModal({ plan, student, anamData, mesoAtual, onSave, onVoltar }) {
  const perfil = anamData?.perfil || null
  const freqSugerida = perfil?.frequencia ? parseInt(perfil.frequencia) : null

  const [diasSemana, setDiasSemana]   = useState(freqSugerida || 3)
  const [gruposFoco, setGruposFoco]   = useState([])
  const [intensidade, setIntensidade] = useState('Moderada')
  const [saving, setSaving] = useState(false)

  const toggleGrupo = (g) => setGruposFoco(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g])

  const salvar = async () => {
    setSaving(true)
    await onSave({ dias_semana: diasSemana, grupos_foco: gruposFoco, intensidade })
    setSaving(false)
  }

  const infoRow = (label, val) => val ? (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase' }}>{label}: </span>
      <span style={{ fontSize:13, color:'#E2E8F0', fontWeight:700 }}>{val}</span>
    </div>
  ) : null

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:500, overflowY:'auto', display:'flex', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:520 }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>Antes de montar o treino</div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:24 }}>Essas informações guiam a prescrição — preencha antes de continuar.</div>

        {(mesoAtual || perfil) && (
          <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#3B82F6', textTransform:'uppercase', letterSpacing:0.6, marginBottom:10 }}>Contexto do Aluno</div>
            {mesoAtual && infoRow('Mesociclo Ativo', `${mesoAtual.nome} (semana ${mesoAtual.semanaAtual - mesoAtual.semana_inicio + 1} de ${mesoAtual.semana_fim - mesoAtual.semana_inicio + 1})`)}
            {perfil?.nivel && infoRow('Nível de Atividade', perfil.nivel)}
            {perfil?.experiencia && infoRow('Experiência', perfil.experiencia)}
            {perfil?.objetivo && infoRow('Objetivo', perfil.objetivo)}
            {perfil?.local && infoRow('Local de Treino', perfil.local)}
            {perfil?.horario && infoRow('Horário Preferido', perfil.horario)}
            {perfil?.restricoes?.length > 0 && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:10, color:'#64748B', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Limitações do Aluno</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {perfil.restricoes.map(r => (
                    <span key={r} style={{ fontSize:11, fontWeight:700, color:'#F87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'2px 8px' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
            {!mesoAtual && <div style={{ fontSize:12, color:'#475569', fontStyle:'italic' }}>Nenhum mesociclo ativo no Planejamento.</div>}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Dias por semana</label>
          <div style={{ display:'flex', gap:8 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setDiasSemana(n)} style={{ width:38, height:38, borderRadius:10, border: diasSemana===n ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: diasSemana===n ? '#3B82F6' : '#0A0A0A', color: diasSemana===n ? '#fff' : '#94A3B8', fontWeight:800, fontSize:14, cursor:'pointer' }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Grupo Muscular Focado</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {MUSCLE_TYPES.map(g => (
              <button key={g} onClick={() => toggleGrupo(g)} style={{ padding:'7px 12px', borderRadius:20, border: gruposFoco.includes(g) ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: gruposFoco.includes(g) ? 'rgba(59,130,246,0.15)' : '#0A0A0A', color: gruposFoco.includes(g) ? '#60A5FA' : '#94A3B8', fontSize:12, fontWeight:700, cursor:'pointer' }}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 26 }}>
          <label style={{ fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Intensidade</label>
          <div style={{ display:'flex', gap:8 }}>
            {['Leve','Moderada','Intensa'].map(i => (
              <button key={i} onClick={() => setIntensidade(i)} style={{ flex:1, padding:'10px', borderRadius:10, border: intensidade===i ? '1.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: intensidade===i ? '#3B82F6' : '#0A0A0A', color: intensidade===i ? '#fff' : '#94A3B8', fontWeight:700, fontSize:13, cursor:'pointer' }}>{i}</button>
            ))}
          </div>
        </div>

        <button onClick={salvar} disabled={saving || !diasSemana}
          style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#3B82F6', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', marginBottom:10 }}>
          {saving ? 'Salvando...' : 'Salvar e Montar Treino'}
        </button>
        <button onClick={onVoltar} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          ← Voltar à Ficha do Aluno
        </button>
      </div>
    </div>
  )
}
