import { useState } from 'react'

// ── ProgressChart — gráfico SVG de evolução de peso/medidas ──────────────────
export function ProgressChart({ progress }) {
  const [metric, setMetric] = useState('weight')

  const METRICS = [
    { id:'weight', label:'Peso', unit:'kg', color:'#34D399' },
    { id:'waist',  label:'Cintura', unit:'cm', color:'#60A5FA' },
    { id:'chest',  label:'Peito', unit:'cm', color:'#F59E0B' },
    { id:'hip',    label:'Quadril', unit:'cm', color:'#A78BFA' },
    { id:'thigh',  label:'Coxa', unit:'cm', color:'#F87171' },
  ]

  // Build data series from progress entries (oldest first for chart)
  const sorted = [...progress].reverse()
  const cur = METRICS.find(m => m.id === metric)

  const getData = (p) => {
    if (metric === 'weight') return p.weight ? +p.weight : null
    const m = p.measurements || {}
    const v = m[metric] || p[metric]
    return v ? +v : null
  }

  const points = sorted.map(p => ({ date: p.date, val: getData(p) })).filter(p => p.val !== null)

  if (points.length < 2) return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 16px', marginBottom:14, textAlign:'center' }}>
      <div style={{ fontSize:12, color:'#334155' }}>Registre pelo menos 2 medições para ver o gráfico de evolução.</div>
    </div>
  )

  const W = 340, H = 120, PAD = { t:12, r:16, b:28, l:40 }
  const vals  = points.map(p => p.val)
  const minV  = Math.min(...vals), maxV = Math.max(...vals)
  const range = maxV - minV || 1
  const cx = (i) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const cy = (v) => PAD.t + (1 - (v - minV) / range) * (H - PAD.t - PAD.b)
  const pts = points.map((p, i) => cx(i) + ',' + cy(p.val)).join(' ')
  const area = 'M' + cx(0) + ',' + cy(points[0].val) + ' ' +
    points.slice(1).map((p, i) => 'L' + cx(i + 1) + ',' + cy(p.val)).join(' ') +
    ' L' + cx(points.length - 1) + ',' + (H - PAD.b) + ' L' + cx(0) + ',' + (H - PAD.b) + ' Z'

  const first = points[0].val, last = points[points.length - 1].val
  const delta = +(last - first).toFixed(1)
  const improving = metric === 'weight' ? delta <= 0 : delta >= 0
  const deltaColor = delta === 0 ? '#94A3B8' : improving ? '#34D399' : '#F87171'
  const fmtDate = (d) => { const [,m,day] = d.split('-'); return day + '/' + m }

  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
      {/* Metric selector */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {METRICS.map(m => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            style={{ padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', border:'1px solid ' + (metric===m.id ? m.color : 'rgba(255,255,255,0.08)'), background: metric===m.id ? m.color+'20' : 'transparent', color: metric===m.id ? m.color : '#475569', transition:'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Delta summary */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>{cur.label}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:18, fontWeight:900, color:cur.color }}>{last}{cur.unit}</span>
          <span style={{ fontSize:11, fontWeight:700, color:deltaColor, background:deltaColor+'18', padding:'2px 8px', borderRadius:20 }}>
            {delta > 0 ? '+' : ''}{delta} {cur.unit}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX:'auto' }}>
        <svg width={W} height={H} style={{ display:'block', minWidth:W }}>
          {[0, 0.5, 1].map(t => {
            const y = PAD.t + t * (H - PAD.t - PAD.b)
            const v = (maxV - t * range).toFixed(1)
            return (
              <g key={t}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.04)" />
                <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={8} fill="#334155">{v}</text>
              </g>
            )
          })}
          {points.map((p, i) => (
            (i === 0 || i === points.length - 1 || (points.length > 4 && i === Math.floor(points.length / 2)))
              ? <text key={i} x={cx(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize={8} fill="#334155">{fmtDate(p.date)}</text>
              : null
          ))}
          <path d={area} fill={cur.color + '12'} />
          <polyline points={pts} fill="none" stroke={cur.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={i} cx={cx(i)} cy={cy(p.val)} r={i === points.length - 1 ? 5 : 3.5}
              fill={cur.color} stroke="#02040F" strokeWidth={2} />
          ))}
        </svg>
      </div>
      <div style={{ fontSize:10, color:'#334155', marginTop:6 }}>
        {points.length} registros · {fmtDate(points[0].date)} → {fmtDate(points[points.length-1].date)}
      </div>
    </div>
  )
}
