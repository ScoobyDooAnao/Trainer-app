import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, YAxis, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { goalGroup, CIRC_OPTIONS, fetchEvolutionData, buildSeries } from '../../lib/evolutionMetrics'
import { qk } from '../../lib/queries'

const COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F472B6', '#A78BFA', '#F87171', '#38BDF8']
const fmtDate = (d) => d ? d.split('-').reverse().join('/') : ''
const fmtVal = (v) => (Number.isInteger(v) ? v : String(v).replace('.', ','))

// Tooltip: a data só aparece ao passar o mouse / tocar no ponto
function PointTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#E2E8F0' }}>
      <div style={{ fontWeight: 800 }}>{fmtVal(p.value)} {unit}</div>
      <div style={{ color: '#64748B', fontSize: 11 }}>{fmtDate(p.date)}</div>
    </div>
  )
}

/**
 * Gráficos de evolução do aluno, definidos pelo Objetivo Geral.
 * Mesmo componente nos 3 lugares: Dashboard (aba Evolução), Ficha do Aluno (página 1)
 * e Evolução do link do aluno (publicMode = leitura pelas views públicas).
 * onChangeMedida (opcional, só professor): habilita o seletor da circunferência priorizada.
 */
export default function EvolutionCharts({ studentId, goal, publicMode = false, medidaPrioritaria, onChangeMedida }) {
  const grp = goalGroup(goal)
  const { data: raw } = useQuery({
    queryKey: [...qk.evolution(studentId), publicMode, grp === 'hipertrofia'],
    queryFn: () => fetchEvolutionData(studentId, { publicMode, needLogs: grp === 'hipertrofia' }),
    enabled: !!studentId,
    staleTime: 5000,
  })

  const series = raw ? buildSeries(raw, goal, medidaPrioritaria) : []

  return (
    <div>
      {grp === 'hipertrofia' && onChangeMedida && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Circunferência priorizada</span>
          <select value={medidaPrioritaria || 'coxa'} onChange={e => onChangeMedida(e.target.value)}
            style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', color: '#E2E8F0', fontSize: 12 }}>
            {CIRC_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      )}

      {!raw ? (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 24 }}>Carregando...</div>
      ) : series.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 24, lineHeight: 1.6 }}>
          Ainda não há dados para os gráficos deste objetivo.<br />
          Eles aparecem conforme avaliações, testes e treinos forem registrados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 12 }}>
          {series.map((s, i) => {
            const color = COLORS[i % COLORS.length]
            const last = s.points[s.points.length - 1]
            return (
              <div key={s.key} style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px 6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                    {s.subtitle && <div style={{ fontSize: 10, color: '#475569' }}>{s.subtitle}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color, flexShrink: 0 }}>{fmtVal(last.value)} <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{s.unit}</span></div>
                </div>
                <div style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={s.points} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis width={34} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickCount={4} />
                      <Tooltip content={<PointTooltip unit={s.unit} />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
