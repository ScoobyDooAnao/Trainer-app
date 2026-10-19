import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GOAL, GLASS_CARD, CARDIO_TYPES, PSE_LABELS, PRESCRICAO, YELLOW, fmtDate, formatPace } from '../../lib/dashboardShared'
import { GoalBadge, CustomTooltip } from '../shared/DashboardUI'

// ── Small alert icons (module-level to avoid React error #62) ─────────────────
export const IcoWarnSm  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display:'inline', verticalAlign:'-2px', marginRight:4 }}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>

export const IcoBlockSm = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display:'inline', verticalAlign:'-2px', marginRight:4 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>

export const IcoInfoSm  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display:'inline', verticalAlign:'-2px', marginRight:4 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>

export const IcoBoneSm  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display:'inline', verticalAlign:'-2px', marginRight:4 }}><path d="M7.05 9.29l-4.24-4.24a2 2 0 112.83-2.83l.71.71.71-.71a2 2 0 012.83 2.83L7.76 6.47l1.41 1.41 8.49 8.49 1.41-1.41-1.41-1.41 1.41-1.41a2 2 0 11-2.83 2.83l-.71-.71-.71.71a2 2 0 01-2.83-2.83l1.41-1.41-1.41-1.41-4.94 4.94"/></svg>

// ── FaixaEtariaCardio — extraído de IIFE para evitar React error #62 ──────────
export function FaixaEtariaCardio({ age, isChild, isAdolesc, isAdultYoung, isAdult, isAdultMat, isElderly, fcmax, fcFormula }) {
  if (!age) return null
  const cfg = isChild      ? { color:'#7C3AED', bg:'rgba(124,58,237,0.08)', border:'#7C3AED20', title:'Criança (<12 anos) — Restrições Ativas' }
            : isAdolesc    ? { color:'#D97706', bg:'rgba(217,119,6,0.08)',   border:'#D9770620', title:'Adolescente (12–17 anos) — Observações' }
            : isAdultYoung ? { color:'#059669', bg:'rgba(5,150,105,0.06)',   border:'#05966918', title:'Adulto Jovem (18–29 anos) — Alta Performance' }
            : isAdult      ? { color:'#0891B2', bg:'rgba(8,145,178,0.06)',   border:'#0891B218', title:'Adulto (30–44 anos) — Atenção à Sarcopenia' }
            : isAdultMat   ? { color:'#7C3AED', bg:'rgba(124,58,237,0.07)',  border:'#7C3AED20', title:'Adulto Maduro (45–59 anos) — Prescrição Diferenciada' }
            : isElderly    ? { color:'#D97706', bg:'rgba(217,119,6,0.08)',   border:'#D9770620', title:'Idoso (60+ anos) — Prescrição Adaptada' }
            : null
  if (!cfg) return null

  const Row = ({ children, bg }) => (
    <div style={{ fontSize: 11, color: '#334155', background: bg || 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '6px 10px' }}>
      {children}
    </div>
  )
  // SVG icons as components (NOT as JSX consts — would cause React error #62)

  return (
    <div style={{ marginTop: 10, borderRadius: 12, padding: '14px 16px', background: cfg.bg, border: '1.5px solid ' + cfg.border }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: cfg.color, marginBottom: 8 }}>{cfg.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

        {fcmax && (
          <Row><strong>FCmáx estimada:</strong> {fcmax} bpm ({fcFormula})</Row>
        )}

        {isChild && (
          <>
            <Row bg="rgba(220,38,38,0.06)"><IcoBlockSm /><strong>HIIT bloqueado</strong> — não recomendado para menores de 12 anos.</Row>
            <Row bg="rgba(220,38,38,0.06)"><IcoBlockSm /><strong>1RM não aplicável</strong> — prescrição por PSE e peso corporal.</Row>
            <Row bg="rgba(124,58,237,0.06)"><strong>LTAD — FUNdamentals:</strong> foco em habilidades motoras multilaterais e ludicidade.</Row>
            <Row bg="rgba(124,58,237,0.06)"><IcoBoneSm /><strong>Atenção:</strong> placas epifisárias vulneráveis — evitar cargas axiais pesadas.</Row>
          </>
        )}

        {isAdolesc && (
          <>
            <Row bg="rgba(217,119,6,0.06)"><IcoWarnSm /><strong>Carga máxima:</strong> limitar a 70–75% do 1RM durante fase de crescimento ósseo.</Row>
            <Row bg="rgba(217,119,6,0.06)"><strong>LTAD — Learn/Train to Train:</strong> técnica em primeiro lugar, volume progressivo. (Faigenbaum et al., 2009)</Row>
            {age < 14 && <Row bg="rgba(220,38,38,0.06)"><IcoBlockSm /><strong>1RM:</strong> não recomendado abaixo de 14 anos — fórmula de Epley não validada.</Row>}
          </>
        )}

        {isAdultYoung && (
          <>
            <Row bg="rgba(5,150,105,0.07)"><strong>Capacidade máxima:</strong> pico de VO₂ máx e resposta hormonal. Tolerância alta a volume e intensidade.</Row>
            <Row bg="rgba(5,150,105,0.07)"><strong>Recuperação:</strong> 24–48h entre sessões do mesmo grupo muscular. Permite alta frequência.</Row>
            <Row bg="rgba(5,150,105,0.07)"><strong>Periodização:</strong> suporta bloco de alta densidade. Atenção à técnica para evitar lesões por excesso de confiança.</Row>
            <Row bg="rgba(8,145,178,0.07)"><IcoInfoSm /><strong>PSE alvo:</strong> 6–9/10 em sessões de alta intensidade. HIIT bem tolerado.</Row>
          </>
        )}

        {isAdult && (
          <>
            <Row bg="rgba(8,145,178,0.07)"><IcoWarnSm /><strong>Sarcopenia subclínica:</strong> perda de ~0,5–1% de massa muscular/ano após os 30. Treino de força 2–3x/semana é essencial.</Row>
            <Row bg="rgba(8,145,178,0.07)"><strong>Recuperação:</strong> 48h ideais entre sessões intensas. VO₂ máx declina ~1%/ano — compensar com consistência.</Row>
            <Row bg="rgba(8,145,178,0.07)"><IcoInfoSm /><strong>Periodização:</strong> ondulada diária (DUP) ou semanal. Manter volume moderado-alto com boa gestão de recuperação.</Row>
            <Row bg="rgba(8,145,178,0.07)"><IcoInfoSm /><strong>Mobilidade:</strong> incluir 1–2 sessões/semana de mobilidade articular para prevenção de lesões.</Row>
          </>
        )}

        {isAdultMat && (
          <>
            <Row bg="rgba(124,58,237,0.07)"><IcoWarnSm /><strong>Declínio hormonal:</strong> testosterona ↓ ~1–2%/ano (homens); menopausa em mulheres — impacta força, massa óssea e composição corporal.</Row>
            <Row bg="rgba(124,58,237,0.07)"><IcoBoneSm /><strong>Osteoporose:</strong> treino de força com impacto é a principal estratégia não farmacológica de prevenção. (Kohrt et al., 2004)</Row>
            <Row bg="rgba(124,58,237,0.07)"><strong>Risco cardiovascular:</strong> monitorar FC durante esforço. PSE máx recomendado 7/10 sem avaliação médica prévia.</Row>
            <Row bg="rgba(124,58,237,0.07)"><strong>Recuperação:</strong> 48–72h entre sessões intensas. Reduzir volume total em 10–15% vs. adulto jovem.</Row>
            <Row bg="rgba(124,58,237,0.07)"><IcoInfoSm /><strong>Mobilidade + equilíbrio:</strong> incluir obrigatoriamente — prevenção de quedas e manutenção funcional.</Row>
            {age >= 50 && <Row bg="rgba(220,38,38,0.06)"><IcoWarnSm /><strong>50+ anos:</strong> recomendável avaliação médica com ECG de esforço antes de iniciar treinos de alta intensidade.</Row>}
          </>
        )}

        {isElderly && (
          <>
            <Row bg="rgba(220,38,38,0.06)"><IcoWarnSm /><strong>HIIT:</strong> avaliar individualmente. Iniciar apenas com aprovação médica e histórico de atividade.</Row>
            <Row bg="rgba(217,119,6,0.07)"><IcoWarnSm /><strong>PSE máx recomendado:</strong> 6/10 — intensidades acima aumentam risco cardiovascular.</Row>
            <Row bg="rgba(217,119,6,0.07)"><strong>4º pilar:</strong> 1 sessão semanal de equilíbrio e mobilidade obrigatória. (Sherrington et al., 2019)</Row>
            <Row bg="rgba(217,119,6,0.07)"><IcoBoneSm /><strong>Sarcopenia:</strong> 2–3x/semana de força é a 1ª linha de prevenção e tratamento. (Hurst et al., 2022)</Row>
            <Row bg="rgba(217,119,6,0.07)"><IcoInfoSm /><strong>Progressão conservadora:</strong> aumentar carga máx 5% por semana. Priorizar funcionalidade sobre performance.</Row>
          </>
        )}

      </div>
    </div>
  )
}

export const IcoWarn = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>

export const IcoOk   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>

export const IcoFire = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>

// ── AlertasCarga — componente separado para evitar IIFE com JSX ──────────────
export function AlertasCarga({ sessions, overtraining, metabAlert, avgPse2w, thisWeekMin, thisWeekCount, volLabel, volSub, volColor, volBg }) {
  const pse2wBar   = avgPse2w ? Math.round((avgPse2w / 10) * 100) : 0
  const pse2wColor = !avgPse2w ? '#94A3B8' : avgPse2w <= 5 ? '#16A34A' : avgPse2w <= 7 ? '#D97706' : '#DC2626'



  return (
    <div style={{ ...GLASS_CARD, marginBottom: 0, border: '1.5px solid rgba(12,74,110,0.12)', boxShadow: '0 4px 20px rgba(12,74,110,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0C4A6E"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0C3251', letterSpacing: '-0.2px' }}>Alertas de Carga</div>
        <div style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:600 }}>Semana atual</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {sessions.length === 0 && (
          <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>
            Registre sessões de cárdio para ativar os alertas de carga.
          </div>
        )}

        {sessions.length > 0 && (
          <>
            {/* ── OVERTRAINING ── */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: overtraining ? '1.5px solid #FCA5A5' : '1.5px solid rgba(22,163,74,0.2)', background: overtraining ? 'rgba(220,38,38,0.04)' : 'rgba(22,163,74,0.03)' }}>
              <div style={{ height: 5, background: overtraining ? 'linear-gradient(90deg,#DC2626,#EF4444)' : 'linear-gradient(90deg,#16A34A,#4ADE80)', width: overtraining ? '100%' : pse2wBar + '%', transition: 'width 0.8s ease' }} />
              <div style={{ padding: '18px 18px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: overtraining ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.1)', color: overtraining ? '#DC2626' : '#16A34A' }}>
                  {overtraining ? (
                    <IcoFire />
                  ) : (
                    <IcoOk />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: overtraining ? '#DC2626' : '#16A34A' }}>
                      {overtraining ? 'Overtraining Detectado' : 'Carga de Intensidade — OK'}
                    </div>
                    {avgPse2w && (
                      <div style={{ fontSize: 20, fontWeight: 900, color: pse2wColor, lineHeight: 1 }}>
                        {avgPse2w.toFixed(1)}<span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8' }}>/10</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: avgPse2w ? 10 : 0 }}>
                    {avgPse2w
                      ? overtraining
                        ? 'PSE médio nas últimas 2 semanas acima de 7/10. Risco de acúmulo de fadiga e queda de performance.'
                        : 'PSE médio nas últimas 2 semanas dentro da faixa segura.'
                      : 'Registre pelo menos 5 sessões com PSE para ativar esta análise.'}
                  </div>
                  {avgPse2w && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8', marginBottom: 3 }}>
                        <span>PSE 1</span><span style={{ color: '#16A34A' }}>Zona ideal (≤7)</span><span>PSE 10</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, width: '70%', height: '100%', background: 'rgba(22,163,74,0.15)', borderRadius: 99 }} />
                        <div style={{ position: 'absolute', left: pse2wBar + '%', transform: 'translateX(-50%)', width: 10, height: 6, background: pse2wColor, borderRadius: 99, transition: 'left 0.8s ease' }} />
                      </div>
                    </div>
                  )}
                  {overtraining && (
                    <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', marginBottom: 3 }}>Recomendação</div>
                      <div style={{ fontSize: 10, color: '#7F1D1D', lineHeight: 1.5 }}>
                        Reduza para 1–2 sessões leves (PSE 3–4) nesta semana. Priorize recuperação ativa: caminhada, mobilidade ou descanso.
                        <span style={{ color: '#94A3B8', marginLeft: 4 }}>(Meeusen et al., 2013)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── COMPENSAÇÃO METABÓLICA ── */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: metabAlert ? '1.5px solid #FDE68A' : '1.5px solid rgba(148,163,184,0.2)', background: metabAlert ? 'rgba(217,119,6,0.04)' : 'rgba(148,163,184,0.03)' }}>
              <div style={{ height: 5, background: metabAlert ? 'linear-gradient(90deg,#D97706,#F59E0B)' : 'rgba(148,163,184,0.2)' }} />
              <div style={{ padding: '18px 18px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: metabAlert ? 'rgba(217,119,6,0.12)' : 'rgba(148,163,184,0.08)', color: metabAlert ? '#D97706' : '#94A3B8' }}>
                  {metabAlert ? (
                    <IcoWarn />
                  ) : (
                    <IcoOk />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: metabAlert ? '#D97706' : '#94A3B8' }}>
                      {metabAlert ? 'Risco de Compensação Metabólica' : 'Volume de Sessões Normal'}
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ width: 6, height: 20, borderRadius: 3, background: thisWeekCount >= i ? (metabAlert ? '#D97706' : '#16A34A') : 'rgba(0,0,0,0.08)' }} />
                      ))}
                      {thisWeekCount > 4 && (
                        <div style={{ width: 6, height: 20, borderRadius: 3, background: '#DC2626' }} />
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: metabAlert ? 10 : 0 }}>
                    {metabAlert
                      ? thisWeekCount + ' sessões esta semana. Acima de 4 sessões/semana o corpo pode compensar reduzindo NEAT e metabolismo basal.'
                      : thisWeekCount + ' sessão' + (thisWeekCount !== 1 ? 'ões' : '') + ' esta semana — dentro do limite recomendado (≤4).'}
                  </div>
                  {metabAlert && (
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginBottom: 3 }}>Recomendação</div>
                      <div style={{ fontSize: 10, color: '#92400E', lineHeight: 1.5 }}>
                        Mantenha até 4 sessões/semana e combine com treino de força. Cardio isolado em excesso ativa mecanismos de compensação.
                        <span style={{ color: '#94A3B8', marginLeft: 4 }}>(Pontzer et al., 2016)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── SEMÁFORO VOLUME ── */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid ' + volColor + '30', background: volBg }}>
              <div style={{ height: 5, background: volColor }} />
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: volColor + '18' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: volColor, boxShadow: '0 0 10px ' + volColor + '80' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: volColor, marginBottom: 3 }}>{volLabel}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{volSub}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: volColor, lineHeight: 1 }}>
                  {thisWeekMin}<span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', display:'block', textAlign:'right' }}>min</span>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// Modal de registro de sessão de cardio (pelo aluno)
export function CardioSessionModal({ studentId, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]           = useState(today)
  const [type, setType]           = useState('corrida')
  const [duration, setDuration]   = useState('')
  const [distance, setDistance]   = useState('')
  const [avgHr, setAvgHr]         = useState('')
  const [maxHr, setMaxHr]         = useState('')
  const [workSec, setWorkSec]     = useState('30')
  const [restSec, setRestSec]     = useState('15')
  const [rounds, setRounds]       = useState('8')
  const [pse, setPse]             = useState(5)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)

  const typeInfo = CARDIO_TYPES.find(t => t.id === type)

  const save = async () => {
    setSaving(true)
    const payload = {
      student_id: studentId,
      date,
      type,
      duration_minutes: +duration || null,
      distance_km:      typeInfo?.hasDistance ? (+distance || null) : null,
      avg_hr:           typeInfo?.hasHR       ? (+avgHr   || null) : null,
      max_hr:           typeInfo?.hasHR       ? (+maxHr   || null) : null,
      work_seconds:     typeInfo?.isHIIT      ? (+workSec || null) : null,
      rest_seconds:     typeInfo?.isHIIT      ? (+restSec || null) : null,
      rounds:           typeInfo?.isHIIT      ? (+rounds  || null) : null,
      pse:              +pse,
      notes,
    }
    await supabase.from('cardio_sessions').insert([payload])
    setSaving(false)
    onSave()
    onClose()
  }

  const inp = { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 8, padding: '9px 12px', color: '#0D1B2A', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: '#0C4A6E', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5, display: 'block', marginTop: 14 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(12,50,81,0.2)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0C3251', marginBottom: 18 }}>Registrar Sessão de Cárdio</div>

        <label style={lbl}>Data</label>
        <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />

        <label style={lbl}>Modalidade</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
          {CARDIO_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              style={{ padding: '7px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: type === t.id ? t.color : 'rgba(255,255,255,0.7)', color: type === t.id ? '#FFF' : '#0C4A6E', transition: 'all 0.15s', boxShadow: type === t.id ? `0 3px 10px ${t.color}55` : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          <div>
            <label style={lbl}>Duração (min)</label>
            <input type="number" placeholder="Ex: 30" style={inp} value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          {typeInfo?.hasDistance && (
            <div>
              <label style={lbl}>Distância (km)</label>
              <input type="number" step="0.1" placeholder="Ex: 5.2" style={inp} value={distance} onChange={e => setDistance(e.target.value)} />
            </div>
          )}
          {typeInfo?.hasHR && (
            <>
              <div>
                <label style={lbl}>FC Média (bpm)</label>
                <input type="number" placeholder="Ex: 145" style={inp} value={avgHr} onChange={e => setAvgHr(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>FC Máx (bpm)</label>
                <input type="number" placeholder="Ex: 172" style={inp} value={maxHr} onChange={e => setMaxHr(e.target.value)} />
              </div>
            </>
          )}
          {typeInfo?.isHIIT && (
            <>
              <div>
                <label style={lbl}>Esforço (seg)</label>
                <input type="number" placeholder="30" style={inp} value={workSec} onChange={e => setWorkSec(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Descanso (seg)</label>
                <input type="number" placeholder="15" style={inp} value={restSec} onChange={e => setRestSec(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Rodadas</label>
                <input type="number" placeholder="8" style={inp} value={rounds} onChange={e => setRounds(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* PSE */}
        <label style={{ ...lbl, marginTop: 18 }}>PSE — Esforço Percebido: <span style={{ color: '#EF4444', fontWeight: 800 }}>{pse} — {PSE_LABELS[pse]}</span></label>
        <input type="range" min="1" max="10" value={pse} onChange={e => setPse(+e.target.value)}
          style={{ width: '100%', accentColor: '#155E8E', marginBottom: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
          <span>1 Leve</span><span>5 Moderado</span><span>10 Máximo</span>
        </div>

        <label style={lbl}>Observações</label>
        <textarea style={{ ...inp, minHeight: 55, resize: 'vertical' }} placeholder="Como foi o treino?" value={notes} onChange={e => setNotes(e.target.value)} />

        <button onClick={save} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#F5C842,#D97706)', border: 'none', borderRadius: 10, padding: 13, color: '#431C00', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
          {saving ? 'Salvando...' : 'Salvar Sessão'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(12,74,110,0.2)', borderRadius: 10, padding: 12, color: '#0C4A6E', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>Cancelar</button>
      </div>
    </div>
  )
}

export function TabCardio({ students }) {
  const [selectedId, setSelectedId] = useState(null)
  const [sessions, setSessions]     = useState([])
  const [modal, setModal]           = useState(false)
  const [loading, setLoading]       = useState(false)
  const [filterType, setFilterType] = useState('todos')

  const student = students.find(s => s.id === selectedId)
  // Normaliza objetivo: mapeia aliases comuns para as chaves do PRESCRICAO
  const GOAL_ALIAS = {
    'Perda de Peso':      'Emagrecimento',
    'Emagrecer':          'Emagrecimento',
    'Perda de peso':      'Emagrecimento',
    'Emagrecimento':      'Emagrecimento',
    'Ganho de Massa':     'Ganho de Massa',
    'Hipertrofia':        'Ganho de Massa',
    'Força':              'Força e Performance',
    'Força e Performance':'Força e Performance',
    'Condicionamento':    'Condicionamento',
    'Condicionamento Físico': 'Condicionamento',
    'Saúde e Bem-Estar':  'Condicionamento',
    'Desenvolvimento Atlético': 'Condicionamento',
    'Treinamento Competitivo':  'Condicionamento',
    'Iniciação Esportiva':      'Condicionamento',
  }
  const goalKey = student?.goal ? (GOAL_ALIAS[student.goal] || null) : null
  const presc   = goalKey ? PRESCRICAO[goalKey] : null

  const fetchSessions = useCallback(async (sid) => {
    if (!sid) return
    setLoading(true)
    const { data } = await supabase
      .from('cardio_sessions')
      .select('*')
      .eq('student_id', sid)
      .order('date', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (selectedId) fetchSessions(selectedId) }, [selectedId])

  const filtered = filterType === 'todos' ? sessions : sessions.filter(s => s.type === filterType)

  // Dados gráfico pace (corrida/esteira/bike com distância)
  const paceData = sessions
    .filter(s => s.distance_km && s.duration_minutes && ['corrida','esteira','bike'].includes(s.type))
    .map(s => ({
      date:   fmtDate(s.date),
      Pace:   parseFloat((s.duration_minutes / s.distance_km).toFixed(2)),
      type:   s.type,
    }))

  // Dados gráfico volume semanal (minutos por semana)
  const volumeData = (() => {
    const byWeek = {}
    sessions.forEach(s => {
      const d   = new Date(s.date + 'T12:00:00')
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(5, 10) // MM-DD
      byWeek[key] = (byWeek[key] || 0) + (s.duration_minutes || 0)
    })
    return Object.entries(byWeek).sort().map(([week, min]) => ({ week, Min: min }))
  })()

  // Stats gerais
  const totalSessoes = sessions.length
  const totalMin     = sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0)
  const totalKm      = sessions.reduce((a, s) => a + (s.distance_km || 0), 0)
  const avgPse       = sessions.length ? (sessions.reduce((a, s) => a + (s.pse || 0), 0) / sessions.length).toFixed(1) : '—'

  // ── Métricas inteligentes ──────────────────────────────────────────
  const _now = new Date()
  const _monOffset = (_now.getDay() + 6) % 7
  const _startOfWeek = new Date(_now); _startOfWeek.setDate(_now.getDate() - _monOffset); _startOfWeek.setHours(0,0,0,0)
  const thisWeekSessions = sessions.filter(s => new Date(s.date + 'T12:00:00') >= _startOfWeek)
  const thisWeekMin   = thisWeekSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0)
  const thisWeekCount = thisWeekSessions.length
  const _twoWeeksAgo = new Date(_now); _twoWeeksAgo.setDate(_now.getDate() - 14)
  const recentPse    = sessions.filter(s => new Date(s.date + 'T12:00:00') >= _twoWeeksAgo && s.pse)
  const avgPse2w     = recentPse.length ? recentPse.reduce((a,s) => a + s.pse, 0) / recentPse.length : null
  const overtraining = avgPse2w && avgPse2w > 7
  const metabAlert   = thisWeekCount > 4
  const volColor     = thisWeekMin === 0 ? '#94A3B8' : thisWeekMin < 150 ? '#16A34A' : thisWeekMin <= 200 ? '#D97706' : '#DC2626'
  const volBg        = thisWeekMin === 0 ? 'rgba(148,163,184,0.06)' : thisWeekMin < 150 ? 'rgba(22,163,74,0.08)' : thisWeekMin <= 200 ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)'
  const volLabel     = thisWeekMin === 0 ? 'Sem sessões esta semana' : thisWeekMin < 150 ? 'Volume adequado' : thisWeekMin <= 200 ? 'Volume elevado' : 'Volume excessivo'
  const volSub       = thisWeekMin === 0 ? 'Nenhuma sessão registrada esta semana' : thisWeekMin < 150 ? `${thisWeekMin} min — dentro do ideal (< 150 min)` : thisWeekMin <= 200 ? `${thisWeekMin} min — monitore a recuperação` : `${thisWeekMin} min — risco de overreaching (> 200 min)`
  const pse2wBar     = avgPse2w ? Math.round((avgPse2w / 10) * 100) : 0
  const pse2wColor   = !avgPse2w ? '#94A3B8' : avgPse2w <= 5 ? '#16A34A' : avgPse2w <= 7 ? '#D97706' : '#DC2626'

  // ── Faixa etária ───────────────────────────────────────────────────
  const _age         = student?.age
  const isElderly    = _age && _age >= 60
  const isChild      = _age && _age < 12
  const isAdolesc    = _age && _age >= 12 && _age < 18
  const isAdultYoung = _age && _age >= 18 && _age < 30   // 18–29: adulto jovem
  const isAdult      = _age && _age >= 30 && _age < 45   // 30–44: adulto
  const isAdultMat   = _age && _age >= 45 && _age < 60   // 45–59: adulto maduro
  // FCmáx: Tanaka para 40+ e idosos, 220-idade para jovens
  const fcmax      = _age ? (_age >= 40 ? Math.round(208 - 0.7 * _age) : 220 - _age) : null
  const fcFormula  = _age >= 40 ? 'Tanaka (208 − 0,7 × idade)' : '220 − idade'

  return (
    <div>
      {modal && <CardioSessionModal studentId={selectedId} onSave={() => fetchSessions(selectedId)} onClose={() => setModal(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C3251', letterSpacing: '-0.5px', marginBottom: 4, textShadow: '0 1px 3px rgba(255,255,255,0.5)' }}>Cárdio</h1>
          <p style={{ fontSize: 13, color: '#0C4A6E', fontWeight: 600 }}>Monitoramento e prescrição cardiovascular</p>
        </div>
      </div>

      {/* Seletor de aluno */}
      <div style={{ ...GLASS_CARD, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Selecionar Aluno</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {students.map(s => {
            const sel = s.id === selectedId
            const g   = GOAL[s.goal]
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                style={{ padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: sel ? 'none' : '1px solid rgba(12,74,110,0.15)', background: sel ? `linear-gradient(135deg,${YELLOW},#F59E0B)` : 'rgba(255,255,255,0.7)', color: sel ? '#431C00' : '#0C4A6E', boxShadow: sel ? '0 3px 12px rgba(245,200,66,0.4)' : 'none', transition: 'all 0.15s' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>

      {!selectedId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#0C4A6E', opacity: 0.4 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Selecione um aluno para ver o cárdio</div>
        </div>
      )}

      {selectedId && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── ALERTAS INTELIGENTES ── */}
          <AlertasCarga
            sessions={sessions}
            overtraining={overtraining}
            metabAlert={metabAlert}
            avgPse2w={avgPse2w}
            thisWeekMin={thisWeekMin}
            thisWeekCount={thisWeekCount}
            volLabel={volLabel}
            volSub={volSub}
            volColor={volColor}
            volBg={volBg}
          />



          {/* ── PRESCRIÇÃO INTELIGENTE ── */}
          {presc && (
            <div style={GLASS_CARD}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Prescrição Inteligente</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${GOAL[student.goal]?.accent}20`, color: GOAL[student.goal]?.accent, border: `1px solid ${GOAL[student.goal]?.accent}40` }}>
                  <GoalBadge goal={student.goal} />
                </span>
              </div>

              {/* Cards de prescrição */}
              <div className="db-stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { icon: null, label: 'Frequência',  val: presc.sessoes  },
                  { icon: null, label: 'Duração',     val: presc.duracao  },
                  { icon: null, label: 'Volume/semana',val: presc.volume   },
                ].map(({ icon, label, val }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.85)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0C3251', lineHeight: 1.3 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* PSE alvo */}
              <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.85)', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>PSE Alvo — Esforço Percebido</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 10, borderRadius: 10, background: 'linear-gradient(90deg,#60A5FA,#34D399,#F5C842,#F59E0B,#EF4444)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: `${(presc.pse.min - 1) / 9 * 100}%`, width: `${(presc.pse.max - presc.pse.min) / 9 * 100}%`, height: '100%', background: 'rgba(12,50,81,0.35)', borderRadius: 10, border: '2px solid #0C3251' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0C3251', whiteSpace: 'nowrap' }}>{presc.pse.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{presc.pace}</div>
              </div>

              {/* Modalidades + barra de proporção */}
              <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.85)', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#0C4A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Modalidades Recomendadas</div>

                {/* Barra cardio vs musculação */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#0C4A6E' }}>Cárdio — {presc.mixCardio}%</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED' }}>Musculação — {100 - presc.mixCardio}%</span>
                  </div>
                  <div style={{ height: 14, borderRadius: 99, overflow: 'hidden', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{
                      height: '100%', width: `${presc.mixCardio}%`,
                      background: presc.mixCardio >= 60
                        ? 'linear-gradient(90deg,#F5C842,#F59E0B,#EF4444)'
                        : presc.mixCardio >= 40
                        ? 'linear-gradient(90deg,#34D399,#F5C842,#F59E0B)'
                        : 'linear-gradient(90deg,#60A5FA,#34D399,#F5C842)',
                      borderRadius: 99, transition: 'width 0.6s ease',
                      boxShadow: '0 0 8px rgba(245,200,66,0.4)',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>
                    Distribuição ideal de estímulos na semana para este objetivo
                  </div>
                </div>

                {/* Lista de modalidades com destaque */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {presc.tipo.map(t => {
                    const info = CARDIO_TYPES.find(x => x.id === t)
                    const isDestaque = t === presc.destaque
                    return (
                      <span key={t} style={{
                        fontSize: isDestaque ? 13 : 12,
                        fontWeight: 800,
                        padding: isDestaque ? '7px 16px' : '5px 13px',
                        borderRadius: 20,
                        background: isDestaque ? `${info?.color}` : `${info?.color}18`,
                        color: isDestaque ? '#FFF' : info?.color,
                        border: `1.5px solid ${info?.color}`,
                        boxShadow: isDestaque ? `0 3px 14px ${info?.color}55` : 'none',
                        position: 'relative',
                      }}>
                        {info?.label}
                        {isDestaque && <span style={{ fontSize: 9, marginLeft: 5, background: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: 10 }}>recomendado</span>}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Dica científica */}
              <div style={{ background: 'rgba(245,200,66,0.08)', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid #F5C842', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#431C00', lineHeight: 1.7 }}>{presc.dicaCientifica}</span>
              </div>

              {/* Observação clínica */}
              <div style={{ background: 'rgba(12,74,110,0.06)', borderRadius: 10, padding: '10px 14px', borderLeft: '3px solid #155E8E' }}>
                <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><IcoInfoSm />{presc.obs}</span>
              </div>

              {/* ── Alerta de faixa etária ── */}
              <FaixaEtariaCardio age={_age} isChild={isChild} isAdolesc={isAdolesc} isAdultYoung={isAdultYoung} isAdult={isAdult} isAdultMat={isAdultMat} isElderly={isElderly} fcmax={fcmax} fcFormula={fcFormula} />
            </div>
          )}

          {/* ── STATS GERAIS ── */}
          {sessions.length > 0 && (
            <div style={{ ...GLASS_CARD, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251', marginBottom: 14 }}>Resumo Geral</div>
              <div className="db-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[
                  { label: 'Sessões',      val: totalSessoes,              unit: '',    color: '#155E8E' },
                  { label: 'Total Tempo',  val: totalMin >= 60 ? `${Math.floor(totalMin/60)}h${totalMin%60}` : totalMin, unit: totalMin < 60 ? 'min' : '', color: '#7C3AED' },
                  { label: 'Total Km',     val: totalKm.toFixed(1),        unit: 'km',  color: '#059669' },
                  { label: 'PSE Médio',    val: avgPse,                    unit: '/10', color: '#D97706' },
                ].map(({ label, val, unit, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.8)' }}>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}<span style={{ fontSize: 11, color: '#94A3B8' }}>{unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GRÁFICOS ── */}
          {paceData.length >= 2 && (
            <div style={GLASS_CARD}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0C3251', marginBottom: 16 }}>Evolução do Pace</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={paceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="'/km" domain={['auto','auto']} reversed />
                  <Tooltip content={<CustomTooltip unit=" min/km" />} />
                  <Line type="monotone" dataKey="Pace" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 }}>Eixo Y invertido — pace menor = mais rápido</div>
            </div>
          )}

          {volumeData.length >= 2 && (
            <div style={GLASS_CARD}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0C3251', marginBottom: 16 }}>Volume Semanal (minutos)</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={volumeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,74,110,0.08)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="min" />
                  <Tooltip content={<CustomTooltip unit=" min" />} />
                  <Line type="monotone" dataKey="Min" name="Minutos" stroke="#155E8E" strokeWidth={2.5} dot={{ r: 4, fill: '#155E8E', stroke: '#FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          <div style={GLASS_CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0C3251' }}>Histórico de Sessões</div>
              <button onClick={() => setModal(true)}
                style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F5C842,#D97706)', color: '#431C00', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                + Registrar
              </button>
            </div>

            {/* Filtro por modalidade */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <button onClick={() => setFilterType('todos')}
                style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: filterType === 'todos' ? 'linear-gradient(135deg,#155E8E,#0C4A6E)' : 'rgba(255,255,255,0.7)', color: filterType === 'todos' ? '#FFF' : '#0C4A6E' }}>
                Todos
              </button>
              {CARDIO_TYPES.filter(t => sessions.some(s => s.type === t.id)).map(t => (
                <button key={t.id} onClick={() => setFilterType(t.id)}
                  style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: filterType === t.id ? t.color : 'rgba(255,255,255,0.7)', color: filterType === t.id ? '#FFF' : '#0C4A6E', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhuma sessão registrada ainda</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>O aluno pode registrar pelo link dele</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {[...filtered].reverse().map(s => {
                  const info = CARDIO_TYPES.find(t => t.id === s.type)
                  const pace = formatPace(s.distance_km, s.duration_minutes)
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.65)', borderRadius: 12, border: `1.5px solid ${info?.color}25` }}>
                      {/* Ícone modalidade */}
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${info?.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ width:14, height:14, borderRadius:"50%", background:info?.color, display:"block" }} /></div>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0C3251' }}>{info?.label}</span>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{String(s.date).slice(0,10).split('-').reverse().join('/')}</span>
                          {s.type === 'hiit' && s.work_seconds && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#F5C842', background: 'rgba(245,200,66,0.12)', padding: '1px 7px', borderRadius: 20 }}>
                              {s.work_seconds}s/{s.rest_seconds}s × {s.rounds}x
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {s.duration_minutes && <span style={{ fontSize: 11, color: '#64748B' }}>{s.duration_minutes}min</span>}
                          {s.distance_km      && <span style={{ fontSize: 11, color: '#64748B' }}>{s.distance_km}km</span>}
                          {pace !== '—'        && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>{pace}</span>}
                          {s.avg_hr           && <span style={{ fontSize: 11, color: '#64748B' }}>{s.avg_hr}bpm</span>}
                          {s.pse              && <span style={{ fontSize: 11, color: '#64748B' }}>PSE {s.pse}/10</span>}
                        </div>
                        {s.notes && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' }}>{s.notes}</div>}
                      </div>
                      {/* PSE badge */}
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${120 - (s.pse||5)*12},70%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#FFF', flexShrink: 0 }}>
                        {s.pse}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {selectedId && loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#0C4A6E', opacity: 0.5, fontWeight: 600 }}>Carregando...</div>
      )}
    </div>
  )
}
