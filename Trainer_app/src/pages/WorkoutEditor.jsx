import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

// ── Types ─────────────────────────────────────────────────────────────────
const MUSCLE_TYPES = [
  'Peito',
  'Costas',
  'Bíceps',
  'Tríceps',
  'Ombro',
  'Quadríceps',
  'Posterior',
  'Glúteo',
  'Panturrilha',
  'Core',
  'Cardio',
  'Full Body',
]
const NEW_TYPES = ['Funcional', 'Elástico', 'Peso Corporal', 'Mobilidade']
const EXERCISE_TYPES = [...MUSCLE_TYPES, ...NEW_TYPES]

const STATUS_OPTIONS = ['draft', 'active', 'archived']
const STATUS_LABEL = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' }
const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']

const TYPE_COLOR = {
  Funcional: '#34D399',
  Elástico: '#FBBF24',
  'Peso Corporal': '#60A5FA',
  Mobilidade: '#F472B6',
  Core: '#34D399',
  'Full Body': '#6EE7B7',
  Cardio: '#F87171',
  Peito: '#A78BFA',
  Costas: '#A78BFA',
  Bíceps: '#A78BFA',
  Tríceps: '#A78BFA',
  Ombro: '#A78BFA',
  Quadríceps: '#FBBF24',
  Posterior: '#34D399',
  Glúteo: '#34D399',
  Panturrilha: '#F97316',
}

const getTypeColor = (type) => TYPE_COLOR[type] || '#A78BFA'

// ── Age group ─────────────────────────────────────────────────────────────
const getAgeGroup = (birthDate, age) => {
  const a = birthDate
    ? Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000))
    : age ? parseInt(age) : null
  if (!a) return 'adulto_jovem'
  if (a < 13) return 'crianca'
  if (a < 18) return 'adolescente'
  if (a < 40) return 'adulto_jovem'
  if (a < 60) return 'adulto_maduro'
  return 'idoso'
}

const AGE_GROUP_COLOR = {
  crianca: '#34D399',
  adolescente: '#60A5FA',
  adulto_jovem: '#A78BFA',
  adulto_maduro: '#FBBF24',
  idoso: '#F97316',
}
const AGE_GROUP_LABEL = {
  crianca: 'Criança',
  adolescente: 'Adolescente',
  adulto_jovem: 'Adulto',
  adulto_maduro: 'Adulto Maduro',
  idoso: 'Idoso 60+',
}

// ── Quick add (sem equipamento) ───────────────────────────────────────────
const emptyEx = { name: '', sets: '3', reps: '10-12', rest: '60s', tip: '', type: 'Peito' }
const QUICK_NO_EQUIPMENT = [
  { name: 'Flexão de Braço', type: 'Funcional', sets: '3', reps: '10-15', rest: '60s', tip: 'Corpo rígido, peito toca o chão' },
  { name: 'Agachamento com Peso Corporal', type: 'Peso Corporal', sets: '3', reps: '20-25', rest: '45s', tip: 'Sem carga extra, foco em técnica' },
  { name: 'Burpee', type: 'Funcional', sets: '3', reps: '8-10', rest: '60s', tip: 'Movimento completo, ritmo controlado' },
  { name: 'Prancha Frontal', type: 'Core', sets: '3', reps: '30-60s', rest: '45s', tip: 'Quadril neutro, core ativo' },
  { name: 'Gato-Vaca', type: 'Mobilidade', sets: '2', reps: '10-15', rest: '20s', tip: 'Mobilidade torácica e lombar (respiração)' },
]

// ── Habilidades Motoras (embutidas no WorkoutEditor) ─────────────────────
const MOTOR_CATEGORIES = {
  locomocao: {
    id: 'locomocao',
    label: 'Locomoção',
    icon: '🏃',
    color: '#34D399',
    desc: 'Correr, saltar e padrões de deslocamento',
    fases: ['FUNdamentals', 'Learn to Train', 'Train to Train'],
  },
  manipulacao: {
    id: 'manipulacao',
    label: 'Manipulação',
    icon: '⚽',
    color: '#60A5FA',
    desc: 'Chutar, arremessar, receber e driblar',
    fases: ['FUNdamentals', 'Learn to Train', 'Train to Train'],
  },
  equilibrio: {
    id: 'equilibrio',
    label: 'Equilíbrio',
    icon: '🤸',
    color: '#F472B6',
    desc: 'Estabilidade unipodal e dinâmica',
    fases: ['FUNdamentals', 'Learn to Train', 'Train to Train'],
  },
  coordenacao: {
    id: 'coordenacao',
    label: 'Coordenação',
    icon: '🎯',
    color: '#FBBF24',
    desc: 'Ritmo, lateralidade e espaço-temporal',
    fases: ['FUNdamentals', 'Learn to Train'],
  },
  agilidade: {
    id: 'agilidade',
    label: 'Agilidade',
    icon: '⚡',
    color: '#F97316',
    desc: 'Mudança de direção, reação e velocidade',
    fases: ['Learn to Train', 'Train to Train', 'Train to Compete'],
  },
}

const MOTOR_BANK = [
  // Locomoção
  {
    name: 'Corrida com Mudança de Ritmo',
    cat: 'locomocao',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 14,
    tipo: 'exercício',
    duracao: '5-8min',
    material: 'Nenhum',
    sets: '3',
    reps: '30s cada ritmo',
    rest: '30s',
    tip: 'Alterne caminhada → trote → corrida a cada sinal do professor. Foco: fase aérea e apoio no antepé.',
    progressao: 'Adicionar saltos e esquivas entre as mudanças de ritmo.',
    ref: 'TGMD-3: padrão de corrida',
  },
  {
    name: 'Salto em Distância (Dois Pés)',
    cat: 'locomocao',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 14,
    tipo: 'exercício',
    duracao: '8min',
    material: 'Fita ou giz',
    sets: '4',
    reps: '5 saltos',
    rest: '45s',
    tip: 'Pré-balanço de braços, joelhos semiflexionados, aterrissagem amortecida com flexão de joelhos.',
    progressao: 'Saltos unilaterais ou sobre obstáculos baixos.',
    ref: 'TGMD-3: salto horizontal',
  },

  // Manipulação
  {
    name: 'Chute ao Alvo (Distâncias Variadas)',
    cat: 'manipulacao',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 14,
    tipo: 'exercício',
    duracao: '8min',
    material: 'Bola e cones como alvo',
    sets: '4',
    reps: '5 chutes',
    rest: '30s',
    tip: 'Passo de aproximação, braços em equilíbrio, contato com peito do pé, follow-through completo. Variar distâncias 3-8m.',
    progressao: 'Alvo menor ou bola em movimento (parceiro).',
    ref: 'TGMD-3: chute',
  },
  {
    name: 'Recepção com Duas Mãos',
    cat: 'manipulacao',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 12,
    tipo: 'exercício',
    duracao: '8min',
    material: 'Bola de borracha',
    sets: '4',
    reps: '10 recepções',
    rest: '30s',
    tip: 'Mãos em concha, olhos no objeto e absorver o impacto puxando as mãos para o corpo.',
    progressao: 'Aumentar distância ou usar bola menor.',
    ref: 'TGMD-3: recepção',
  },

  // Equilíbrio
  {
    name: 'Equilíbrio Unipodal Estático',
    cat: 'equilibrio',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 17,
    tipo: 'exercício',
    duracao: '5min',
    material: 'Nenhum',
    sets: '3',
    reps: '20-30s cada pé',
    rest: '20s',
    tip: 'Olhos abertos primeiro. Progredir: olhos fechados e/ou movimentos de braço.',
    progressao: 'Adicionar superfície instável (espuma).',
    ref: 'TGMD-3: equilíbrio estático',
  },
  {
    name: 'Caminhada sobre Linha Reta (Equilíbrio Dinâmico)',
    cat: 'equilibrio',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 12,
    tipo: 'exercício',
    duracao: '6min',
    material: 'Fita no chão',
    sets: '4',
    reps: '10m ida e volta',
    rest: '20s',
    tip: 'Braços abertos para equilíbrio, olhar para frente (não para os pés). Progredir: olhos fechados.',
    progressao: 'Carregar objeto leve (pode ser em duplas).',
    ref: 'LTAD: equilíbrio dinâmico',
  },

  // Coordenação
  {
    name: 'Pular Corda (Coordenação de Entrada)',
    cat: 'coordenacao',
    nivel: 2,
    idadeMin: 7,
    idadeMax: 15,
    tipo: 'exercício',
    duracao: '8min',
    material: 'Corda',
    sets: '4',
    reps: '1min de pulos',
    rest: '45s',
    tip: 'Sincronização olho-pé com a corda. Começa com corda individual; depois corda girada por 2.',
    progressao: 'Pular em deslocamento ou com padrões simples.',
    ref: 'Coordenação espaço-temporal',
  },
  {
    name: 'Bolinha na Parede (Coordenação Olho-Mão)',
    cat: 'coordenacao',
    nivel: 1,
    idadeMin: 6,
    idadeMax: 14,
    tipo: 'exercício',
    duracao: '6min',
    material: 'Bolinha de tênis e parede',
    sets: '3',
    reps: '20 toques',
    rest: '30s',
    tip: 'Jogar na parede e pegar com 2 mãos. Variar: 1 mão e trocas de mão.',
    progressao: 'Aumentar distância (parede mais longe) ou reduzir tamanho do alvo.',
    ref: 'TGMD-3: coordenação olho-mão',
  },

  // Agilidade
  {
    name: 'Cone Drill em T',
    cat: 'agilidade',
    nivel: 2,
    idadeMin: 9,
    idadeMax: 17,
    tipo: 'exercício',
    duracao: '10min',
    material: '4 cones',
    sets: '6',
    reps: '1 execução (cronometrada)',
    rest: '45s',
    tip: 'Sprint → shuffle → tocar cones → backpedal. Posição baixa na virada e braços em ritmo.',
    progressao: 'Registrar tempo e repetir até melhorar consistência.',
    ref: 'T-Cone Test (mudança de direção)',
  },
  {
    name: 'Shuttle Run (5-10-5)',
    cat: 'agilidade',
    nivel: 2,
    idadeMin: 9,
    idadeMax: 17,
    tipo: 'exercício',
    duracao: '8min',
    material: '3 cones',
    sets: '6',
    reps: '1 execução',
    rest: '60s',
    tip: 'Sprint 5m, toque cone, retorna 10m, toque e retorna 5m. Posição baixa na virada.',
    progressao: 'Responder a sinal visual em vez de partir por conta própria.',
    ref: '5-10-5 Shuttle',
  },
]

function parseMotorCategoryFromTip(tip) {
  const match = tip?.match(/\[Motor:\s*([^\]]+)\]/)
  return match ? match[1].trim() : null
}

function getCatByLabel(label) {
  return Object.values(MOTOR_CATEGORIES).find(c => c.label === label) || null
}

// Mantido aqui apenas por requisito (caso você queira usar também no futuro dentro do editor)
function MotorActivityCard({ ex, dayColor, isMobile, done, onToggleDone }) {
  const [open, setOpen] = useState(false)

  const catLabel = parseMotorCategoryFromTip(ex?.tip)
  const cat = catLabel ? getCatByLabel(catLabel) : null
  const cleanTip = ex?.tip?.replace(/\[Motor:[^\]]+\]\s*/, '') || ''

  const color = cat?.color || dayColor || '#60A5FA'

  return (
    <div style={{ padding: isMobile ? '14px 16px' : '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: done ? 'rgba(52,211,153,0.03)' : open ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: color + '18', border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {cat?.icon || '🧠'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: color + '18', color, border: `1px solid ${color}35` }}>
              🧠 {catLabel || 'Motor'}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 14, color: '#E2E8F0' }}>{ex?.name}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#64748B' }}>🔁 {ex?.sets}× · {ex?.reps}</span>
        <span style={{ fontSize: 12, color: '#64748B' }}>💤 {ex?.rest}</span>
      </div>

      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 11, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: open ? 8 : 0 }}>
        {open ? '▲' : '▼'} {open ? 'Ocultar dica' : 'Ver como realizar'}
      </button>

      {open && (
        <div style={{ background: color + '08', border: `1px solid ${color}20`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#94A3B8', lineHeight: 1.6, marginBottom: 8 }}>
          {cleanTip}
        </div>
      )}

      <button onClick={() => onToggleDone?.(ex?.id)} style={{ width: '100%', padding: isMobile ? '11px' : '9px', borderRadius: 10, border: `1px solid ${done ? '#34D39940' : color + '40'}`, background: done ? 'rgba(52,211,153,0.1)' : color + '10', color: done ? '#34D399' : color, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
        {done ? '✅ Atividade concluída!' : '🎯 Marcar como feito'}
      </button>
    </div>
  )
}

function MotorSkillsSection({ dayId, ageGroup, studentAge, onAddExercise }) {
  const [open, setOpen] = useState(false)
  const [catFilter, setCatFilter] = useState('')
  const [nivelFilter, setNivelFilter] = useState(0) // 0 = todos
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(null)

  // Só mostra para criança e adolescente
  if (ageGroup !== 'crianca' && ageGroup !== 'adolescente') return null

  const age = studentAge ?? (ageGroup === 'crianca' ? 9 : 14)

  const filtered = useMemo(() => {
    return MOTOR_BANK.filter(a => {
      const matchAge = age >= a.idadeMin && age <= a.idadeMax
      const matchCat = !catFilter || a.cat === catFilter
      const matchNivel = !nivelFilter || a.nivel === nivelFilter
      const matchQ = !query || a.name.toLowerCase().includes(query.toLowerCase())
      return matchAge && matchCat && matchNivel && matchQ
    })
  }, [age, catFilter, nivelFilter, query])

  const handleAdd = async (atividade) => {
    setAdding(atividade.name)
    const cat = MOTOR_CATEGORIES[atividade.cat]
    await onAddExercise({
      name: atividade.name,
      type: 'Funcional',
      sets: atividade.sets,
      reps: atividade.reps,
      rest: atividade.rest,
      tip: `[Motor: ${cat.label}] ${atividade.tip}`,
    })
    setTimeout(() => setAdding(null), 600)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(96,165,250,0.07)',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 10,
          padding: '10px 14px',
          cursor: 'pointer',
          color: '#60A5FA',
          fontSize: 11,
          fontWeight: 800,
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 800 }}>+ Adicionar habilidade motora</span>
            <span style={{ display: 'block', fontSize: 10, color: '#475569', marginTop: 1 }}>{filtered.length} atividades</span>
          </span>
        </span>
        <span style={{ fontSize: 10, color: '#334155' }}>▼</span>
      </button>
    )
  }

  return (
    <div style={{ marginTop: 10, background: 'rgba(8,14,32,0.95)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(96,165,250,0.12),rgba(96,165,250,0.04))', borderBottom: '1px solid rgba(96,165,250,0.15)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
            🧠 Habilidades Motoras
            <span style={{ fontSize: 9, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 20, padding: '1px 7px', color: '#7DD3FC', fontWeight: 700 }}>
              {ageGroup === 'crianca' ? 'FUNdamentals' : 'Learn to Train'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>Atividades adaptadas por faixa etária · {filtered.length} disponíveis</div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            onClick={() => setCatFilter('')}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: '1px solid rgba(96,165,250,0.5)',
              background: 'rgba(96,165,250,0.15)',
              color: '#60A5FA',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Todas
          </button>

          {Object.values(MOTOR_CATEGORIES).map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(catFilter === cat.id ? '' : cat.id)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: '1px solid ' + (catFilter === cat.id ? cat.color + '60' : 'rgba(255,255,255,0.08)'),
                background: catFilter === cat.id ? cat.color + '18' : 'transparent',
                color: catFilter === cat.id ? cat.color : '#475569',
                fontSize: 11,
                fontWeight: catFilter === cat.id ? 800 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 12 }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setNivelFilter(nivelFilter === n ? 0 : n)}
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                border: '1px solid ' + (nivelFilter === n ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'),
                background: nivelFilter === n ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: nivelFilter === n ? '#E2E8F0' : '#334155',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {n === 0 ? 'Todos os níveis' : n === 1 ? '🟢 Básico' : n === 2 ? '🟡 Médio' : '🔴 Avançado'}
            </button>
          ))}

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar atividade..."
            style={{ flex: 1, minWidth: 140, background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none' }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#334155', fontSize: 12 }}>
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map((a) => {
              const cat = MOTOR_CATEGORIES[a.cat]
              const isAdd = adding === a.name
              return (
                <div key={a.name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${cat.color}`, borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{a.name}</span>
                        <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 20, background: cat.color + '15', border: `1px solid ${cat.color}35`, color: cat.color, fontWeight: 700 }}>
                          {cat.icon} {cat.label}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: 6 }}>{a.tip}</div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#475569' }}>⏱ {a.duracao}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>🔁 {a.sets}x · {a.reps}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>💤 {a.rest}</span>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 10, color: '#334155', fontStyle: 'italic' }}>📈 Progressão: {a.progressao}</div>
                    </div>

                    <button
                      onClick={() => handleAdd(a)}
                      disabled={!!isAdd}
                      style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: `1px solid ${cat.color}50`, background: isAdd ? cat.color + '30' : cat.color + '15', color: cat.color, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    >
                      {isAdd ? '✓ Adicionado' : '+ Adicionar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ fontSize: 10, color: '#1E293B', marginTop: 10, textAlign: 'center', fontStyle: 'italic' }}>
          Ref: TGMD-3 · LTAD (exemplos) · NSCA Youth
        </div>
      </div>
    </div>
  )
}

function NoEquipmentSection({ onAddExercise }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(96,165,250,0.06)',
          border: '1px solid rgba(96,165,250,0.15)',
          borderRadius: 10,
          padding: '8px 12px',
          color: '#60A5FA',
          fontSize: 11,
          fontWeight: 800,
          cursor: 'pointer',
          marginTop: 10,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        🏠 + Adicionar exercício sem equipamento
      </button>
    )
  }

  return (
    <div style={{ marginTop: 8, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: 1 }}>
          🏠 Exercícios sem equipamento
        </span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16 }}>
          ×
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {QUICK_NO_EQUIPMENT.map((ex, i) => {
          const c = getTypeColor(ex.type)
          return (
            <button
              key={i}
              onClick={() => onAddExercise(ex)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: `1px solid ${c}35`,
                background: `${c}10`,
                color: c,
                fontSize: 11,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 9, background: c + '25', borderRadius: 10, padding: '1px 6px', color: c, border: `1px solid ${c}20` }}>
                {ex.type}
              </span>
              {ex.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main WorkoutEditor ─────────────────────────────────────────────────────
export default function WorkoutEditor({ navigate, studentId, planId }) {
  const [plan, setPlan] = useState(null)
  const [days, setDays] = useState([])
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newExForms, setNewExForms] = useState({})

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  const ageGroup = useMemo(() => getAgeGroup(student?.birth_date, student?.age), [student])

  const studentAge = useMemo(() => {
    if (!student) return null
    if (student.birth_date) return Math.floor((Date.now() - new Date(student.birth_date)) / (365.25 * 24 * 3600 * 1000))
    if (student.age) return parseInt(student.age)
    return null
  }, [student])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [{ data: planData }, { data: daysData }, { data: studentData }] = await Promise.all([
        supabase.from('workout_plans').select('*').eq('id', planId).single(),
        supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', planId).order('order_index'),
        supabase.from('students').select('id,name,birth_date,age,goal,sport').eq('id', studentId).single(),
      ])
      setPlan(planData || null)
      setStudent(studentData || null)
      setDays(
        (daysData || []).map(d => ({
          ...d,
          exercises: (d.exercises || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
        })),
      )
    } finally {
      setLoading(false)
    }
  }

  const savePlanTitle = async (nextPlan) => {
    if (!nextPlan) return
    setSaving(true)
    try {
      await supabase
        .from('workout_plans')
        .update({
          title: nextPlan.title,
          status: nextPlan.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
    } finally {
      setSaving(false)
    }
  }

  const updateDay = async (dayId, field, val) => {
    setDays(d => d.map(day => (day.id === dayId ? { ...day, [field]: val } : day)))
    await supabase.from('workout_days').update({ [field]: val }).eq('id', dayId)
  }

  const deleteDay = async (dayId) => {
    if (!confirm('Excluir este dia de treino e todos os exercícios?')) return
    await supabase.from('workout_days').delete().eq('id', dayId)
    setDays(d => d.filter(day => day.id !== dayId))
  }

  const addDay = async () => {
    const letter = String.fromCharCode(65 + days.length)
    const name = `Treino ${letter}`
    const order_index = days.length
    const { data } = await supabase
      .from('workout_days')
      .insert([{ plan_id: planId, name, focus: '', day_of_week: '', order_index }])
      .select()
      .single()
    if (data) {
      setDays(d => [...d, { ...data, exercises: [] }])
    }
  }

  const addExercise = async (dayId, exData) => {
    const form = exData || newExForms[dayId] || emptyEx
    if (!form?.name?.trim()) return
    const day = days.find(d => d.id === dayId)
    const order_index = (day?.exercises?.length || 0)
    const { data } = await supabase
      .from('exercises')
      .insert([
        {
          day_id: dayId,
          name: form.name,
          sets: form.sets,
          reps: form.reps,
          rest: form.rest,
          tip: form.tip || '',
          type: form.type,
          order_index,
        },
      ])
      .select()
      .single()

    if (!data) return

    setDays(d => d.map(dayItem => (dayItem.id === dayId ? { ...dayItem, exercises: [...dayItem.exercises, data] } : dayItem)))
    if (!exData) setNewExForms(f => ({ ...f, [dayId]: { ...emptyEx } }))
  }

  const updateExercise = async (dayId, exId, field, val) => {
    setDays(d =>
      d.map(day =>
        day.id === dayId
          ? { ...day, exercises: day.exercises.map(ex => (ex.id === exId ? { ...ex, [field]: val } : ex)) }
          : day,
      ),
    )
    await supabase.from('exercises').update({ [field]: val }).eq('id', exId)
  }

  const deleteExercise = async (dayId, exId) => {
    if (!confirm('Excluir este exercício?')) return
    await supabase.from('exercises').delete().eq('id', exId)
    setDays(d => d.map(day => (day.id === dayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exId) } : day)))
  }

  const getNewExForm = (dayId) => newExForms[dayId] || { ...emptyEx }
  const setNewExField = (dayId, field, val) => setNewExForms(f => ({ ...f, [dayId]: { ...getNewExForm(dayId), [field]: val } }))

  if (loading) return <div style={{ padding: 40, color: '#475569' }}>Carregando treino...</div>
  if (!plan) return null

  const ageColor = AGE_GROUP_COLOR[ageGroup] || '#60A5FA'

  return (
    <div style={{ minHeight: '100vh', background: '#080B12', padding: '24px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <button style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', marginBottom: 20, fontSize: 14 }} onClick={() => navigate('student-detail', { id: studentId })}>
          ← Voltar ao Aluno
        </button>

        <div
          style={{
            background: '#0D1117',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            value={plan.title || ''}
            onChange={e => setPlan(p => ({ ...p, title: e.target.value }))}
            onBlur={() => savePlanTitle(plan)}
            placeholder="Nome do plano..."
            style={{
              flex: 2,
              background: '#161B27',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '9px 12px',
              color: '#E2E8F0',
              fontSize: 18,
              fontWeight: 800,
              outline: 'none',
              minWidth: 220,
            }}
          />

          <select
            value={plan.status || 'draft'}
            onChange={e => {
              const next = { ...plan, status: e.target.value }
              setPlan(next)
              savePlanTitle(next)
            }}
            style={{
              background: '#161B27',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '9px 12px',
              color: '#E2E8F0',
              fontSize: 14,
              outline: 'none',
              minWidth: 160,
            }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o} value={o}>
                {STATUS_LABEL[o]}
              </option>
            ))}
          </select>

          {student && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: ageColor + '15', border: '1px solid ' + ageColor + '30', borderRadius: 10, padding: '6px 12px' }}>
              <span style={{ fontSize: 11, color: ageColor, fontWeight: 900 }}>
                {student.name} · {AGE_GROUP_LABEL[ageGroup]}
              </span>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#334155', marginLeft: 'auto' }}>{saving ? 'Salvando...' : 'Salvo automaticamente'}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {NEW_TYPES.map(t => {
            const c = getTypeColor(t)
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: c + '12', border: '1px solid ' + c + '30' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                <span style={{ fontSize: 10, color: c, fontWeight: 900 }}>{t}</span>
              </div>
            )
          })}
          <div style={{ fontSize: 10, color: '#334155', alignSelf: 'center', marginLeft: 4 }}>← Novos tipos disponíveis</div>
        </div>

        {days.map((day, idx) => {
          const color = DAY_COLORS[idx % DAY_COLORS.length]
          const newEx = getNewExForm(day.id)
          return (
            <div key={day.id} style={{ background: '#0D1117', borderRadius: 16, border: '1px solid ' + color + '35', overflow: 'hidden', marginBottom: 14 }}>
              {/* Day header */}
              <div style={{ background: color + '12', padding: '14px 20px', borderBottom: '1px solid ' + color + '25', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: '0 0 6px ' + color }} />
                  <input
                    value={day.name || ''}
                    onChange={e => updateDay(day.id, 'name', e.target.value)}
                    placeholder="Nome do treino"
                    style={{ background: 'transparent', border: 'none', color: '#E2E8F0', fontSize: 15, fontWeight: 900, minWidth: 140, outline: 'none' }}
                  />
                  <span style={{ color: '#334155' }}>-</span>
                  <input
                    value={day.focus || ''}
                    onChange={e => updateDay(day.id, 'focus', e.target.value)}
                    placeholder="Foco (ex: Funcional + Core)"
                    style={{ background: 'transparent', border: 'none', color: '#E2E8F0', fontSize: 13, flex: 1, minWidth: 140, outline: 'none' }}
                  />
                  <select
                    value={day.day_of_week || ''}
                    onChange={e => updateDay(day.id, 'day_of_week', e.target.value)}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '6px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none', minWidth: 80 }}
                  >
                    <option value="">Dia...</option>
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={() => deleteDay(day.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 18 }}>
                  ×
                </button>
              </div>

              {/* Exercises */}
              <div style={{ padding: '10px 16px' }}>
                {day.exercises.length > 0 && (
                  <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) 130px 70px 90px 70px auto', gap: 8, marginBottom: 8 }}>
                      {['Exercício', 'Tipo', 'Séries', 'Reps', 'Desc.', ''].map(h => (
                        <div key={h} style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>
                          {h}
                        </div>
                      ))}
                    </div>

                    {day.exercises.map(ex => {
                      const tc = getTypeColor(ex.type)
                      return (
                        <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) 130px 70px 90px 70px auto', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 9, background: tc + '18', color: tc, border: '1px solid ' + tc + '35', borderRadius: 10, padding: '1px 6px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                                {ex.type}
                              </span>
                              <input
                                value={ex.name || ''}
                                onChange={e => setDays(d => d.map(dayItem => (dayItem.id === day.id ? { ...dayItem, exercises: dayItem.exercises.map(e2 => (e2.id === ex.id ? { ...e2, name: e.target.value } : e2)) } : dayItem)))}
                                onBlur={e => updateExercise(day.id, ex.id, 'name', e.target.value)}
                                style={{ width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px', color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                              />
                            </div>
                            <input
                              value={ex.tip || ''}
                              onChange={e => setDays(d => d.map(dayItem => (dayItem.id === day.id ? { ...dayItem, exercises: dayItem.exercises.map(e2 => (e2.id === ex.id ? { ...e2, tip: e.target.value } : e2)) } : dayItem)))}
                              onBlur={e => updateExercise(day.id, ex.id, 'tip', e.target.value)}
                              placeholder="Dica (opcional)"
                              style={{ width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px', color: '#94A3B8', fontSize: 11, outline: 'none' }}
                            />
                          </div>

                          <select
                            value={ex.type || ''}
                            onChange={e => updateExercise(day.id, ex.id, 'type', e.target.value)}
                            style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px', color: '#E2E8F0', fontSize: 13, outline: 'none', width: '100%' }}
                          >
                            <optgroup label="— Musculação">
                              {MUSCLE_TYPES.map(t => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="— Funcional / Casa">
                              {NEW_TYPES.map(t => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </optgroup>
                          </select>

                          {['sets', 'reps', 'rest'].map(field => (
                            <input
                              key={field}
                              value={ex[field] || ''}
                              onChange={e =>
                                setDays(d =>
                                  d.map(dayItem =>
                                    dayItem.id === day.id
                                      ? { ...dayItem, exercises: dayItem.exercises.map(e2 => (e2.id === ex.id ? { ...e2, [field]: e.target.value } : e2)) }
                                      : dayItem,
                                  ),
                                )
                              }
                              onBlur={e => updateExercise(day.id, ex.id, field, e.target.value)}
                              style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px', color: '#E2E8F0', fontSize: 13, outline: 'none', width: '100%' }}
                              placeholder={field}
                            />
                          ))}

                          <button onClick={() => deleteExercise(day.id, ex.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16 }}>
                            🗑️
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add exercise */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 900, marginBottom: 8 }}>
                    Adicionar Exercício
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 76px 90px 90px', gap: 8, marginBottom: 8 }}>
                    <input
                      value={newEx.name}
                      onChange={e => setNewExField(day.id, 'name', e.target.value)}
                      placeholder="Nome do exercício *"
                      style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                    />

                    <select
                      value={newEx.type}
                      onChange={e => setNewExField(day.id, 'type', e.target.value)}
                      style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                    >
                      <optgroup label="— Musculação">
                        {MUSCLE_TYPES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="— Funcional / Casa">
                        {NEW_TYPES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <input
                      value={newEx.sets}
                      onChange={e => setNewExField(day.id, 'sets', e.target.value)}
                      placeholder="Séries"
                      style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                    />
                    <input
                      value={newEx.reps}
                      onChange={e => setNewExField(day.id, 'reps', e.target.value)}
                      placeholder="Reps"
                      style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                    />
                    <input
                      value={newEx.rest}
                      onChange={e => setNewExField(day.id, 'rest', e.target.value)}
                      placeholder="Descanso"
                      style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <input
                    value={newEx.tip}
                    onChange={e => setNewExField(day.id, 'tip', e.target.value)}
                    placeholder="Dica de execução (opcional)"
                    style={{ width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', color: '#94A3B8', fontSize: 12, outline: 'none', marginBottom: 10 }}
                  />

                  <button
                    onClick={() => addExercise(day.id)}
                    style={{
                      background: `linear-gradient(135deg,${getTypeColor(newEx.type)},${getTypeColor(newEx.type)}cc)`,
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    + Adicionar ao Treino
                  </button>
                </div>

                <NoEquipmentSection onAddExercise={(ex) => addExercise(day.id, ex)} />

                {/* ✅ Seção de Habilidades Motoras (criança/adolescente) */}
                <MotorSkillsSection dayId={day.id} ageGroup={ageGroup} studentAge={studentAge} onAddExercise={(ex) => addExercise(day.id, ex)} />
              </div>
            </div>
          )
        })}

        <button
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 14,
            borderStyle: 'dashed',
            borderRadius: 12,
            borderColor: 'rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.02)',
            color: '#94A3B8',
            fontWeight: 800,
            cursor: 'pointer',
          }}
          onClick={addDay}
        >
          + Adicionar Dia de Treino
        </button>

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#1E293B' }}>
          Alterações salvas automaticamente (quando você editar)
        </div>
      </div>
    </div>
  )
}

