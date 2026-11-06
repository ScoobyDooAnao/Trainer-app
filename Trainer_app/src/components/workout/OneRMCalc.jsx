import { useState } from 'react'
import { V, AGE_RESTRICTIONS, ZONES, calc1RM, ss } from '../../lib/workoutShared'

// ── 1RM Calculator ─────────────────────────────────────────────────────────────
export function OneRMCalc({ ageGroup, onApply, onClose }) {
  const [carga, setCarga] = useState('')
  const [reps,  setReps]  = useState('')
  const oneRM = calc1RM(carga, reps)
  const rest  = AGE_RESTRICTIONS[ageGroup] || AGE_RESTRICTIONS.adulto_jovem

  return (
    <div style={{ background:'rgba(14,9,0,0.95)', border:`1px solid ${V.border}`, borderRadius:12, padding:16, margin:'8px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:V.accentBr }}>Calculadora 1RM</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:V.textSub, cursor:'pointer', fontSize:16 }}>×</button>
      </div>
      {rest.warning && (
        <div style={{ background:'rgba(217,119,6,0.08)', border:`1px solid rgba(217,119,6,0.2)`, borderRadius:8, padding:'8px 12px', fontSize:11, color:V.accentBr, marginBottom:12 }}>
          {rest.warning}
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:9, color:V.textMuted, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>Carga (kg)</div>
          <input type="number" style={{ ...ss.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={carga} onChange={e => setCarga(e.target.value)} placeholder="ex: 80" />
        </div>
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:9, color:V.textMuted, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>Reps (1-15)</div>
          <input type="number" style={{ ...ss.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={reps} onChange={e => setReps(e.target.value)} placeholder="ex: 8" />
        </div>
        <div style={{ flex:1, minWidth:100, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ fontSize:9, color:V.textMuted, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>1RM Estimado</div>
          <div style={{ background: oneRM ? 'rgba(217,119,6,0.15)' : V.bgInput, border:`1px solid ${oneRM ? V.borderStrong : V.borderLight}`, borderRadius:6, padding:'7px', textAlign:'center', fontSize:18, fontWeight:900, color: oneRM ? V.accentBr : V.textDim }}>
            {oneRM ? oneRM + ' kg' : '-'}
          </div>
        </div>
      </div>
      {oneRM && (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {ZONES.map(zone => {
            const blocked    = rest.blockedZones.includes(zone.label)
            const maxAllowed = Math.round(oneRM * rest.maxPct / 100)
            const lo         = Math.round(oneRM * zone.pct[0] / 100)
            const hi         = Math.round(Math.min(oneRM * zone.pct[1] / 100, maxAllowed))
            const load       = lo <= maxAllowed ? { lo, hi } : null
            return (
              <div key={zone.label} style={{ display:'flex', alignItems:'center', gap:8, background: blocked ? 'rgba(255,255,255,0.01)' : zone.color + '10', border:`1px solid ${blocked ? 'rgba(255,255,255,0.04)' : zone.color + '30'}`, borderRadius:8, padding:'7px 10px', opacity: blocked ? 0.4 : 1 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color: blocked ? V.textDim : zone.color }}>{blocked ? 'Restrito — ':''}{zone.label}</div>
                  <div style={{ fontSize:9, color:V.textMuted }}>{zone.reps} reps · {zone.rest}</div>
                </div>
                {load && !blocked ? (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:900, color:zone.color }}>{load.lo}-{load.hi}kg</div>
                    <button onClick={() => onApply({ reps:zone.reps, rest:zone.rest })} style={{ fontSize:9, background:zone.color+'20', border:`1px solid ${zone.color}40`, borderRadius:5, padding:'2px 7px', color:zone.color, cursor:'pointer', fontWeight:700 }}>Usar</button>
                  </div>
                ) : (
                  <div style={{ fontSize:10, color:V.textDim }}>{blocked ? 'Restrito':'-'}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
