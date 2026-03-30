// ═══════════════════════════════════════════════════════════════════
// MotorActivityCard.jsx
// Componente para o StudentView — exibe atividades motoras
// junto ao treino normal do aluno (criança/adolescente).
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { MOTOR_CATEGORIES } from './MotorSkillsSection'

// Extrai atividades motoras dos exercícios do dia
// (identificadas pelo prefixo "[Motor: ...]" no campo tip)
export function extractMotorActivities(exercises) {
  return exercises.filter(ex => ex.tip?.startsWith('[Motor:'))
}

export function extractRegularExercises(exercises) {
  return exercises.filter(ex => !ex.tip?.startsWith('[Motor:'))
}

// Parse do prefixo para obter a categoria
function parseMotorCategory(tip) {
  const match = tip?.match(/\[Motor:\s*([^\]]+)\]/)
  return match ? match[1].trim() : null
}

// Encontra a categoria pelo label
function getCatByLabel(label) {
  return Object.values(MOTOR_CATEGORIES).find(c => c.label === label) || null
}

// ── Card de atividade motora no StudentView ───────────────────────
export function MotorActivityCard({ ex, studentId, dayColor, isMobile }) {
  const [done,   setDone]   = useState(false)
  const [open,   setOpen]   = useState(false)

  const catLabel = parseMotorCategory(ex.tip)
  const cat      = catLabel ? getCatByLabel(catLabel) : null
  const cleanTip = ex.tip?.replace(/\[Motor:[^\]]+\]\s*/, '') || ''

  const color = cat?.color || dayColor || '#60A5FA'

  return (
    <div style={{
      padding: isMobile ? '14px 16px' : '14px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: done ? 'rgba(52,211,153,0.03)' : open ? 'rgba(255,255,255,0.02)' : 'transparent',
      transition: 'background 0.2s',
    }}>
      {/* Header da atividade */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        {/* Ícone da categoria */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: color + '18', border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {cat?.icon || '🧠'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge motor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 800,
              background: color + '18', color, border: `1px solid ${color}35`,
            }}>
              🧠 {catLabel || 'Motor'}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 14, color: '#E2E8F0' }}>{ex.name}</div>
        </div>
      </div>

      {/* Parâmetros */}
      {isMobile ? (
        <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Séries', val: ex.sets + '×' },
            { label: 'Duração/Reps', val: ex.reps },
            { label: 'Descanso', val: ex.rest },
          ].filter(x => x.val).map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>🔁 {ex.sets}× · {ex.reps}</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>💤 {ex.rest}</span>
        </div>
      )}

      {/* Dica pedagógica colapsável */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', color: '#475569', fontSize: 11, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, marginBottom: open ? 8 : 0 }}>
        {open ? '▲' : '▼'} {open ? 'Ocultar dica' : 'Ver como realizar'}
      </button>

      {open && (
        <div style={{
          background: color + '08',
          border: `1px solid ${color}20`,
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: '#94A3B8', lineHeight: 1.6,
          marginBottom: 8,
        }}>
          {cleanTip}
        </div>
      )}

      {/* Botão confirmar */}
      <button
        onClick={() => setDone(d => !d)}
        style={{
          width: '100%', padding: isMobile ? '11px' : '9px',
          borderRadius: 10,
          border: `1px solid ${done ? '#34D39940' : color + '40'}`,
          background: done ? 'rgba(52,211,153,0.1)' : color + '10',
          color: done ? '#34D399' : color,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
        {done ? '✅ Atividade concluída!' : `🎯 Marcar como feito`}
      </button>
    </div>
  )
}

// ── Seção separadora no StudentView ──────────────────────────────
// Inserida entre os exercícios regulares e as atividades motoras
export function MotorSectionDivider({ count, dayColor }) {
  if (!count) return null
  return (
    <div style={{
      padding: '10px 16px',
      background: 'rgba(96,165,250,0.05)',
      borderTop: '1px solid rgba(96,165,250,0.12)',
      borderBottom: '1px solid rgba(96,165,250,0.08)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 14 }}>🧠</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#60A5FA', letterSpacing: 0.5 }}>
          Habilidades Motoras — {count} atividade{count !== 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>
          Atividades de desenvolvimento motor — conclua após o treino principal
        </div>
      </div>
    </div>
  )
}
