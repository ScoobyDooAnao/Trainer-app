import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Paleta Vestiário Pré-Jogo ─────────────────────────────────────────────────
const V = {
  bg:          '#08050000',   // transparente — o SVG de fundo cobre
  bgSolid:     '#080500',
  bgCard:      'rgba(14,9,0,0.82)',
  bgCardHov:   'rgba(20,13,0,0.9)',
  bgInput:     'rgba(25,16,0,0.7)',
  bgRow:       'rgba(255,255,255,0.015)',
  border:      'rgba(217,119,6,0.18)',
  borderLight: 'rgba(217,119,6,0.1)',
  borderStrong:'rgba(217,119,6,0.35)',
  accent:      '#D97706',
  accentBr:    '#FBBF24',
  accentDim:   '#92400E',
  accentFaint: 'rgba(217,119,6,0.08)',
  text:        '#FEF3C7',
  textSub:     '#92400E',
  textMuted:   '#44220A',
  textDim:     '#2A1200',
  white:       '#FFF8EC',
}

// ── Fundo SVG — vestiário minimalista (apenas linhas/contornos) ───────────────
// Inline como string para não criar nenhuma dependência extra
const LOCKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none">
  <rect width="1200" height="700" fill="#080500"/>
  <!-- Piso -->
  <line x1="0" y1="580" x2="1200" y2="580" stroke="#2A1400" stroke-width="1"/>
  <!-- Linhas de perspectiva do piso -->
  <line x1="600" y1="580" x2="0"    y2="700" stroke="#1A0C00" stroke-width="0.5"/>
  <line x1="600" y1="580" x2="300"  y2="700" stroke="#1A0C00" stroke-width="0.5"/>
  <line x1="600" y1="580" x2="600"  y2="700" stroke="#1A0C00" stroke-width="0.5"/>
  <line x1="600" y1="580" x2="900"  y2="700" stroke="#1A0C00" stroke-width="0.5"/>
  <line x1="600" y1="580" x2="1200" y2="700" stroke="#1A0C00" stroke-width="0.5"/>
  <!-- Teto -->
  <line x1="0" y1="60" x2="1200" y2="60" stroke="#1F1000" stroke-width="0.5"/>
  <!-- Luminária esquerda -->
  <rect x="80"  y="60" width="120" height="10" fill="none" stroke="#3D2000" stroke-width="0.8"/>
  <rect x="90"  y="70" width="100" height="4"  fill="none" stroke="#3D2000" stroke-width="0.5"/>
  <!-- Luminária centro -->
  <rect x="540" y="60" width="120" height="10" fill="none" stroke="#3D2000" stroke-width="0.8"/>
  <rect x="550" y="70" width="100" height="4"  fill="none" stroke="#3D2000" stroke-width="0.5"/>
  <!-- Luminária direita -->
  <rect x="1000" y="60" width="120" height="10" fill="none" stroke="#3D2000" stroke-width="0.8"/>
  <rect x="1010" y="70" width="100" height="4"  fill="none" stroke="#3D2000" stroke-width="0.5"/>

  <!-- === FILEIRA ESQUERDA DE ARMÁRIOS === -->
  <!-- Armário E1 -->
  <rect x="20"  y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="25"  y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="25"  y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="55" y1="200" x2="65" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="55" y1="452" x2="65" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <!-- ventilação -->
  <line x1="32" y1="95"  x2="88" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="32" y1="100" x2="88" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <line x1="32" y1="105" x2="88" y2="105" stroke="#160D00" stroke-width="0.5"/>
  <!-- Camisa pendurada E1 -->
  <line x1="60"  y1="92"  x2="60"  y2="110" stroke="#3D2200" stroke-width="1"/>
  <path d="M48 110 L60 107 L72 110" fill="none" stroke="#3D2200" stroke-width="1"/>
  <rect x="51"  y="110" width="18" height="28" rx="2" fill="none" stroke="#B45309" stroke-width="0.8"/>
  <line x1="51" y1="118" x2="69"  y2="118" stroke="#B45309" stroke-width="0.4"/>

  <!-- Armário E2 -->
  <rect x="105" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="110" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="110" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="140" y1="200" x2="150" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="140" y1="452" x2="150" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="117" y1="95"  x2="173" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="117" y1="100" x2="173" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <line x1="117" y1="105" x2="173" y2="105" stroke="#160D00" stroke-width="0.5"/>
  <!-- Camisa E2 - número -->
  <line x1="145" y1="92"  x2="145" y2="110" stroke="#3D2200" stroke-width="1"/>
  <path d="M133 110 L145 107 L157 110" fill="none" stroke="#3D2200" stroke-width="1"/>
  <rect x="136" y="110" width="18" height="28" rx="2" fill="none" stroke="#92400E" stroke-width="0.8"/>
  <text x="145" y="128" text-anchor="middle" font-size="8" fill="#92400E" font-family="monospace">10</text>

  <!-- Armário E3 -->
  <rect x="190" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="195" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="195" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="225" y1="200" x2="235" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="225" y1="452" x2="235" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="202" y1="95"  x2="258" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="202" y1="100" x2="258" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <line x1="202" y1="105" x2="258" y2="105" stroke="#160D00" stroke-width="0.5"/>

  <!-- Armário E4 -->
  <rect x="275" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="280" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="280" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="310" y1="200" x2="320" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="310" y1="452" x2="320" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="287" y1="95"  x2="343" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="287" y1="100" x2="343" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <!-- Camisa E4 -->
  <line x1="315" y1="92"  x2="315" y2="110" stroke="#3D2200" stroke-width="1"/>
  <path d="M303 110 L315 107 L327 110" fill="none" stroke="#3D2200" stroke-width="1"/>
  <rect x="306" y="110" width="18" height="28" rx="2" fill="none" stroke="#B45309" stroke-width="0.8"/>
  <text x="315" y="128" text-anchor="middle" font-size="8" fill="#B45309" font-family="monospace">25</text>

  <!-- Banco esquerdo -->
  <rect x="20" y="580" width="340" height="12" rx="2" fill="none" stroke="#2A1600" stroke-width="1"/>
  <line x1="50"  y1="592" x2="50"  y2="620" stroke="#1E1000" stroke-width="1"/>
  <line x1="180" y1="592" x2="180" y2="620" stroke="#1E1000" stroke-width="1"/>
  <line x1="330" y1="592" x2="330" y2="620" stroke="#1E1000" stroke-width="1"/>

  <!-- === FILEIRA DIREITA DE ARMÁRIOS === -->
  <!-- Armário D1 -->
  <rect x="1100" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="1105" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="1105" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="1135" y1="200" x2="1145" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="1135" y1="452" x2="1145" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="1112" y1="95"  x2="1168" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="1112" y1="100" x2="1168" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <line x1="1112" y1="105" x2="1168" y2="105" stroke="#160D00" stroke-width="0.5"/>
  <!-- Camisa D1 -->
  <line x1="1140" y1="92"  x2="1140" y2="110" stroke="#3D2200" stroke-width="1"/>
  <path d="M1128 110 L1140 107 L1152 110" fill="none" stroke="#3D2200" stroke-width="1"/>
  <rect x="1131" y="110" width="18" height="28" rx="2" fill="none" stroke="#B45309" stroke-width="0.8"/>
  <text x="1140" y="128" text-anchor="middle" font-size="8" fill="#B45309" font-family="monospace">7</text>

  <!-- Armário D2 -->
  <rect x="1015" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="1020" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="1020" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="1050" y1="200" x2="1060" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="1050" y1="452" x2="1060" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="1027" y1="95"  x2="1083" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="1027" y1="100" x2="1083" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <!-- Camisa D2 -->
  <line x1="1055" y1="92"  x2="1055" y2="110" stroke="#3D2200" stroke-width="1"/>
  <path d="M1043 110 L1055 107 L1067 110" fill="none" stroke="#3D2200" stroke-width="1"/>
  <rect x="1046" y="110" width="18" height="28" rx="2" fill="none" stroke="#92400E" stroke-width="0.8"/>
  <text x="1055" y="128" text-anchor="middle" font-size="8" fill="#92400E" font-family="monospace">11</text>

  <!-- Armário D3 -->
  <rect x="930" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="935" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="935" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="965" y1="200" x2="975" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="965" y1="452" x2="975" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="942" y1="95"  x2="998" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="942" y1="100" x2="998" y2="100" stroke="#160D00" stroke-width="0.5"/>

  <!-- Armário D4 -->
  <rect x="845" y="80" width="80" height="500" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="850" y="85" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <rect x="850" y="335" width="70" height="240" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="880" y1="200" x2="890" y2="200" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="880" y1="452" x2="890" y2="452" stroke="#3D2200" stroke-width="1.5"/>
  <line x1="857" y1="95"  x2="913" y2="95"  stroke="#160D00" stroke-width="0.5"/>
  <line x1="857" y1="100" x2="913" y2="100" stroke="#160D00" stroke-width="0.5"/>
  <!-- Camisa D4 -->
  <line x1="885" y1="92"  x2="885" y2="110" stroke="#3D2200" stroke-width="1"/>
  <path d="M873 110 L885 107 L897 110" fill="none" stroke="#3D2200" stroke-width="1"/>
  <rect x="876" y="110" width="18" height="28" rx="2" fill="none" stroke="#B45309" stroke-width="0.8"/>
  <text x="885" y="128" text-anchor="middle" font-size="8" fill="#B45309" font-family="monospace">9</text>

  <!-- Banco direito -->
  <rect x="840" y="580" width="340" height="12" rx="2" fill="none" stroke="#2A1600" stroke-width="1"/>
  <line x1="870"  y1="592" x2="870"  y2="620" stroke="#1E1000" stroke-width="1"/>
  <line x1="1000" y1="592" x2="1000" y2="620" stroke="#1E1000" stroke-width="1"/>
  <line x1="1150" y1="592" x2="1150" y2="620" stroke="#1E1000" stroke-width="1"/>

  <!-- Quadro tático ao fundo (centro) -->
  <rect x="490" y="90" width="220" height="160" rx="3" fill="none" stroke="#2A1600" stroke-width="1"/>
  <rect x="498" y="98" width="204" height="144" fill="none" stroke="#1A1000" stroke-width="0.5"/>
  <!-- campo estilizado no quadro -->
  <rect x="506" y="106" width="188" height="128" fill="none" stroke="#1E1000" stroke-width="0.5"/>
  <line x1="600" y1="106" x2="600" y2="234" stroke="#1A0E00" stroke-width="0.4"/>
  <ellipse cx="600" cy="170" rx="22" ry="16" fill="none" stroke="#1A0E00" stroke-width="0.4"/>
  <!-- setas táticas âmbar tênue -->
  <path d="M540 130 Q560 120 575 135" fill="none" stroke="#3D2000" stroke-width="0.8" stroke-dasharray="3,2"/>
  <path d="M660 140 Q640 155 620 148" fill="none" stroke="#3D2000" stroke-width="0.8" stroke-dasharray="3,2"/>
  <path d="M545 195 Q565 210 585 198" fill="none" stroke="#3D2000" stroke-width="0.8" stroke-dasharray="3,2"/>
  <!-- pontos jogadores -->
  <circle cx="538" cy="128" r="3" fill="none" stroke="#3D2200" stroke-width="0.8"/>
  <circle cx="660" cy="138" r="3" fill="none" stroke="#3D2200" stroke-width="0.8"/>
  <circle cx="600" cy="170" r="3" fill="none" stroke="#3D2200" stroke-width="0.8"/>
  <circle cx="543" cy="193" r="3" fill="none" stroke="#3D2200" stroke-width="0.8"/>
  <circle cx="658" cy="195" r="3" fill="none" stroke="#3D2200" stroke-width="0.8"/>
</svg>`

// ── Constants ──────────────────────────────────────────────────────────────────
const MUSCLE_TYPES = [
  'Peito','Costas','Bíceps','Tríceps','Ombro',
  'Quadríceps','Posterior','Glúteo','Panturrilha','Core','Cardio','Full Body',
]
const NEW_TYPES = ['Funcional','Elástico','Peso Corporal','Mobilidade']
const EXERCISE_TYPES = [...MUSCLE_TYPES, ...NEW_TYPES]

const MODALITY_MAP = {
  'Musculação': MUSCLE_TYPES,
  'Funcional':  ['Funcional','Full Body','Core','Cardio'],
  'Elástico':   ['Elástico'],
  'Corpo':      ['Peso Corporal','Mobilidade'],
}
const MODALITY_COLORS = {
  'Musculação': '#A78BFA',
  'Funcional':  '#34D399',
  'Elástico':   '#FBBF24',
  'Corpo':      '#60A5FA',
}

const STATUS_OPTIONS = ['draft','active','archived']
const STATUS_LABEL   = { draft:'Rascunho', active:'Ativo', archived:'Arquivado' }
const DAY_COLORS     = ['#D97706','#F97316','#FBBF24','#B45309','#D97706','#F59E0B']
const emptyEx        = { name:'', sets:'3', reps:'10-12', rest:'60s', tip:'', type:'Peito' }

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

const AGE_GROUP_LABEL = {
  crianca:'Criança', adolescente:'Adolescente',
  adulto_jovem:'Adulto', adulto_maduro:'Adulto Maduro', idoso:'Idoso 60+',
}
const AGE_GROUP_COLOR = {
  crianca:'#34D399', adolescente:'#60A5FA',
  adulto_jovem:'#FBBF24', adulto_maduro:'#F97316', idoso:'#F87171',
}
const AGE_RESTRICTIONS = {
  crianca:       { maxPct:60,  warning:'Criança: sem carga máxima. Prescrever por PSE e peso corporal.',     blockedZones:['Força Máxima','Hipertrofia'] },
  adolescente:   { maxPct:70,  warning:'Adolescente: limitar a 70% 1RM durante fase de crescimento ósseo.', blockedZones:['Força Máxima'] },
  adulto_jovem:  { maxPct:100, warning:null,                                                                 blockedZones:[] },
  adulto_maduro: { maxPct:100, warning:'Adulto maduro: aumentar descanso entre séries (48-72h por grupo).', blockedZones:[] },
  idoso:         { maxPct:75,  warning:'60+: iniciar com 40-50% 1RM. Avaliação médica recomendada.',        blockedZones:['Força Máxima'] },
}
const ZONES = [
  { label:'Força Máxima',      pct:[85,100], reps:'1-5',   rest:'3-5min',  color:'#EF4444' },
  { label:'Hipertrofia',       pct:[65,85],  reps:'6-12',  rest:'60-120s', color:'#A78BFA' },
  { label:'Resistência Musc.', pct:[40,65],  reps:'15-30', rest:'30-60s',  color:'#34D399' },
]

// ── Exercise Bank ──────────────────────────────────────────────────────────────
const EXERCISE_BANK = [
  { name:'Supino Reto (Barra)',           type:'Peito',        sets:'4', reps:'8-10',    rest:'90s',  tip:'Escápulas retraídas, barra desce até o peito' },
  { name:'Supino Inclinado (Halter)',     type:'Peito',        sets:'3', reps:'10-12',   rest:'75s',  tip:'Ângulo de 30-45°, cotovelos a 45° do tronco' },
  { name:'Crucifixo (Halter)',            type:'Peito',        sets:'3', reps:'12-15',   rest:'60s',  tip:'Leve flexão dos cotovelos, amplitude controlada' },
  { name:'Peck Deck',                    type:'Peito',        sets:'3', reps:'12-15',   rest:'60s',  tip:'Adução horizontal controlada, sem hiperestender' },
  { name:'Barra Fixa',                   type:'Costas',       sets:'4', reps:'6-10',    rest:'90s',  tip:'Escápulas deprimidas na fase excêntrica' },
  { name:'Remada Curvada (Barra)',       type:'Costas',       sets:'4', reps:'8-10',    rest:'90s',  tip:'Tronco a 45°, cotovelos próximos ao corpo' },
  { name:'Puxada Frontal (Polia)',       type:'Costas',       sets:'3', reps:'10-12',   rest:'75s',  tip:'Puxar até a clavícula, não atrás da nuca' },
  { name:'Remada Baixa (Polia)',         type:'Costas',       sets:'3', reps:'10-12',   rest:'75s',  tip:'Peito ereto, escápulas se aproximam no final' },
  { name:'Remada Unilateral (Halter)',   type:'Costas',       sets:'3', reps:'10-12',   rest:'60s',  tip:'Rotação mínima de quadril, cotovelo alto' },
  { name:'Remada TRX',                  type:'Costas',       sets:'3', reps:'10-15',   rest:'60s',  tip:'Corpo em prancha, cotovelos passam o tronco' },
  { name:'Rosca Direta (Barra)',         type:'Bíceps',       sets:'3', reps:'10-12',   rest:'60s',  tip:'Cotovelos fixos ao lado do tronco' },
  { name:'Rosca Alternada (Halter)',     type:'Bíceps',       sets:'3', reps:'10-12',   rest:'60s',  tip:'Supinação completa no topo do movimento' },
  { name:'Rosca Martelo',               type:'Bíceps',       sets:'3', reps:'12-15',   rest:'60s',  tip:'Neutro, treina braquial e braquiorradial' },
  { name:'Rosca Scott',                 type:'Bíceps',       sets:'3', reps:'10-12',   rest:'60s',  tip:'Isola o bíceps, evita compensação de ombro' },
  { name:'Tríceps Pulley (Polia)',       type:'Tríceps',      sets:'3', reps:'12-15',   rest:'60s',  tip:'Cotovelos fixos, extensão completa' },
  { name:'Tríceps Testa (Barra EZ)',     type:'Tríceps',      sets:'3', reps:'10-12',   rest:'60s',  tip:'Cotovelos apontados para o teto' },
  { name:'Tríceps Francês (Halter)',     type:'Tríceps',      sets:'3', reps:'12-15',   rest:'60s',  tip:'Controle na fase excêntrica' },
  { name:'Desenvolvimento (Halter)',     type:'Ombro',        sets:'4', reps:'10-12',   rest:'75s',  tip:'Cotovelos a 90° na posição inicial' },
  { name:'Elevação Lateral',            type:'Ombro',        sets:'3', reps:'12-15',   rest:'60s',  tip:'Leve flexão do cotovelo, evita trapézio' },
  { name:'Elevação Frontal',            type:'Ombro',        sets:'3', reps:'12-15',   rest:'60s',  tip:'Até a altura dos ombros, movimento lento' },
  { name:'Desenvolvimento Arnold',      type:'Ombro',        sets:'3', reps:'10-12',   rest:'75s',  tip:'Rotação completa, ativa todas as porções' },
  { name:'Agachamento Livre',           type:'Quadríceps',   sets:'4', reps:'8-12',    rest:'90s',  tip:'Joelhos na linha dos pés, tronco ereto' },
  { name:'Agachamento Goblet',          type:'Quadríceps',   sets:'3', reps:'12-15',   rest:'75s',  tip:'Ótimo para iniciantes e crianças' },
  { name:'Leg Press',                   type:'Quadríceps',   sets:'4', reps:'10-15',   rest:'75s',  tip:'Não travar os joelhos na extensão' },
  { name:'Afundo (Lunge)',              type:'Quadríceps',   sets:'3', reps:'10-12',   rest:'60s',  tip:'Joelho traseiro próximo ao chão, tronco ereto' },
  { name:'Cadeira Extensora',           type:'Quadríceps',   sets:'3', reps:'12-15',   rest:'60s',  tip:'Extensão completa, fase excêntrica 3s' },
  { name:'Levantamento Terra',          type:'Posterior',    sets:'4', reps:'6-8',     rest:'120s', tip:'Barra sobre os pés, empurre o chão' },
  { name:'Mesa Flexora',                type:'Posterior',    sets:'3', reps:'10-12',   rest:'75s',  tip:'Quadril levemente inclinado, fase excêntrica lenta' },
  { name:'Stiff (Terra Romeno)',         type:'Posterior',    sets:'4', reps:'8-12',    rest:'90s',  tip:'Joelhos semiflexionados, barra próxima ao corpo' },
  { name:'Cadeira Flexora',             type:'Posterior',    sets:'3', reps:'12-15',   rest:'60s',  tip:'Evitar compensação de quadril' },
  { name:'Hip Thrust (Barra)',           type:'Glúteo',       sets:'4', reps:'10-12',   rest:'75s',  tip:'Queixo no peito, extensão completa de quadril' },
  { name:'Agachamento Sumô',            type:'Glúteo',       sets:'3', reps:'12-15',   rest:'75s',  tip:'Pés mais abertos, joelhos seguem os pés' },
  { name:'Panturrilha em Pé',           type:'Panturrilha',  sets:'4', reps:'15-20',   rest:'45s',  tip:'Amplitude total, pausa no topo' },
  { name:'Panturrilha Sentado',         type:'Panturrilha',  sets:'3', reps:'15-20',   rest:'45s',  tip:'Sóleo dominante, joelhos a 90°' },
  { name:'Prancha Frontal',             type:'Core',         sets:'3', reps:'30-60s',  rest:'45s',  tip:'Quadril neutro, não elevar o quadril' },
  { name:'Prancha Lateral',             type:'Core',         sets:'3', reps:'20-40s',  rest:'45s',  tip:'Corpo em linha reta, apoio no antebraço' },
  { name:'Abdominal Crunch',            type:'Core',         sets:'3', reps:'15-20',   rest:'45s',  tip:'Cervical neutra, foco na contração' },
  { name:'Dead Bug',                    type:'Core',         sets:'3', reps:'8-10',    rest:'45s',  tip:'Lombar no chão, extensão contralateral' },
  { name:'Pallof Press',                type:'Core',         sets:'3', reps:'10-12',   rest:'45s',  tip:'Resistência à rotação, excelente para esporte' },
  { name:'Rotação de Tronco',           type:'Core',         sets:'3', reps:'12-15',   rest:'45s',  tip:'Movimento controlado, não usar impulso' },
  { name:'Kettlebell Swing',            type:'Full Body',    sets:'4', reps:'12-15',   rest:'60s',  tip:'Impulsão de quadril, não é um agachamento' },
  { name:'Pular Corda',                 type:'Cardio',       sets:'3', reps:'2-3min',  rest:'60s',  tip:'Pulos baixos, aterrissagem no antepé' },
  { name:'Corrida (Esteira)',           type:'Cardio',       sets:'1', reps:'20-40min',rest:'-',    tip:'PSE 3-5, conversa possível' },
  { name:'Bicicleta Ergométrica',       type:'Cardio',       sets:'1', reps:'20-40min',rest:'-',    tip:'RPM 70-90, resistência moderada' },
  { name:'Flexão de Braço',             type:'Funcional',    sets:'3', reps:'10-15',   rest:'60s',  tip:'Corpo rígido, peito toca o chão' },
  { name:'Flexão de Braço Declinada',   type:'Funcional',    sets:'3', reps:'10-12',   rest:'60s',  tip:'Pés elevados, ativa porção superior do peito' },
  { name:'Flexão de Braço Diamante',    type:'Funcional',    sets:'3', reps:'8-12',    rest:'60s',  tip:'Mãos formam diamante, foco no tríceps' },
  { name:'Flexão de Braço Arqueiro',    type:'Funcional',    sets:'3', reps:'6-8',     rest:'75s',  tip:'Progride para o unilateral — pistol de braço' },
  { name:'Burpee',                      type:'Funcional',    sets:'3', reps:'8-12',    rest:'90s',  tip:'Movimento completo, ritmo controlado' },
  { name:'Burpee com Salto',            type:'Funcional',    sets:'3', reps:'6-10',    rest:'90s',  tip:'Salto explosivo no topo, aterrissagem suave' },
  { name:'Mountain Climber',            type:'Funcional',    sets:'3', reps:'20-30',   rest:'45s',  tip:'Quadril estável, não rodar o tronco' },
  { name:'Abdominal Bicicleta',         type:'Funcional',    sets:'3', reps:'15-20',   rest:'45s',  tip:'Cotovelo toca o joelho oposto' },
  { name:'Abdominal V-Sit',             type:'Funcional',    sets:'3', reps:'10-15',   rest:'45s',  tip:'Suba simultâneo de tronco e pernas' },
  { name:'Agachamento com Salto',       type:'Funcional',    sets:'3', reps:'8-10',    rest:'90s',  tip:'Aterrissagem suave com joelhos levemente flexionados' },
  { name:'Afundo com Salto (Lunge Jump)',type:'Funcional',   sets:'3', reps:'8-10',    rest:'90s',  tip:'Troca de perna no ar, explosão de quadríceps' },
  { name:'Step Up (Caixote/Escada)',    type:'Funcional',    sets:'3', reps:'10-12',   rest:'60s',  tip:'Empurrar pelo calcanhar do pé apoiado' },
  { name:'Corrida Lateral (Shuffle)',   type:'Funcional',    sets:'4', reps:'10-15m',  rest:'60s',  tip:'Futebol: agilidade e mudança de direção' },
  { name:'Salto Vertical',             type:'Funcional',    sets:'4', reps:'6-8',     rest:'90s',  tip:'LTAD: desenvolve potência e coordenação' },
  { name:'Box Jump',                   type:'Funcional',    sets:'4', reps:'5-8',     rest:'90s',  tip:'Aterrissagem em flexão, absorção do impacto' },
  { name:'Bear Crawl',                 type:'Funcional',    sets:'3', reps:'20m',     rest:'60s',  tip:'Joelhos a 2cm do chão, core ativado' },
  { name:'Crab Walk',                  type:'Funcional',    sets:'3', reps:'15m',     rest:'60s',  tip:'Quadril elevado, ativa ombro e glúteo' },
  { name:'Polichinelo',                type:'Funcional',    sets:'3', reps:'30-45s',  rest:'30s',  tip:'Ritmo constante, ótimo para aquecimento' },
  { name:'Corrida no Lugar (High Knee)',type:'Funcional',   sets:'3', reps:'30s',     rest:'30s',  tip:'Joelhos na altura do quadril, braços em ritmo' },
  { name:'Remada com Elástico',         type:'Elástico',    sets:'3', reps:'12-15',   rest:'60s',  tip:'Elástico preso à frente, cotovelos passam o tronco' },
  { name:'Puxada com Elástico',         type:'Elástico',    sets:'3', reps:'12-15',   rest:'60s',  tip:'Elástico preso acima, puxar para o peito' },
  { name:'Rosca Bíceps com Elástico',   type:'Elástico',    sets:'3', reps:'12-15',   rest:'45s',  tip:'Pisar no elástico, supinação completa' },
  { name:'Extensão Tríceps c/ Elástico',type:'Elástico',   sets:'3', reps:'12-15',   rest:'45s',  tip:'Elástico preso acima, extensão completa' },
  { name:'Elevação Lateral c/ Elástico',type:'Elástico',   sets:'3', reps:'15-20',   rest:'45s',  tip:'Elástico sob os pés, cotovelos levemente flexionados' },
  { name:'Agachamento com Elástico',    type:'Elástico',    sets:'3', reps:'15-20',   rest:'60s',  tip:'Elástico sobre os ombros ou sob os pés' },
  { name:'Hip Thrust com Elástico',     type:'Elástico',    sets:'3', reps:'15-20',   rest:'45s',  tip:'Elástico sobre os quadris, extensão completa' },
  { name:'Abdução de Quadril (Elástico)',type:'Elástico',   sets:'3', reps:'15-20',   rest:'45s',  tip:'Elástico nos joelhos, abre e fecha controlado' },
  { name:'Afundo com Elástico',         type:'Elástico',    sets:'3', reps:'12',      rest:'60s',  tip:'Elástico sobre os ombros, postura ereta' },
  { name:'Pallof Press (Elástico)',     type:'Elástico',    sets:'3', reps:'10-12',   rest:'45s',  tip:'Resistência à rotação, core antirotacional' },
  { name:'Agachamento com Peso Corporal',type:'Peso Corporal',sets:'3',reps:'15-20',  rest:'45s',  tip:'Sem carga, foco em técnica perfeita' },
  { name:'Afundo (Peso Corporal)',       type:'Peso Corporal',sets:'3',reps:'12',      rest:'45s',  tip:'Tronco ereto, joelho traseiro quase no chão' },
  { name:'Elevação Pélvica (Glúteo Bridge)',type:'Peso Corporal',sets:'3',reps:'20-25',rest:'30s', tip:'Extensão completa de quadril, glúteo contraído' },
  { name:'Glúteo 4 Apoios',             type:'Peso Corporal',sets:'3',reps:'15-20',   rest:'30s',  tip:'Joelho a 90°, empurra o calcanhar para o teto' },
  { name:'Superman',                    type:'Peso Corporal',sets:'3',reps:'12-15',   rest:'30s',  tip:'Extensão simultânea de braço e perna opostos' },
  { name:'Equilíbrio Unipodal',         type:'Peso Corporal',sets:'3',reps:'20-30s',  rest:'30s',  tip:'Olhos abertos depois fechados para progredir' },
  { name:'Prancha com Elevação de Braço',type:'Peso Corporal',sets:'3',reps:'8-10',   rest:'45s',  tip:'Anti-rotação, core profundo' },
  { name:'Puxada Inverted Row',          type:'Peso Corporal',sets:'3',reps:'10-15',  rest:'60s',  tip:'Barra baixa, corpo inclinado — remada corporal' },
  { name:'Tríceps Banco (Dip)',          type:'Peso Corporal',sets:'3',reps:'10-15',  rest:'60s',  tip:'Apoio em cadeira ou banco, cotovelos atrás' },
  { name:'Gato-Vaca',                   type:'Mobilidade',   sets:'2',reps:'10-15',   rest:'30s',  tip:'Mobilidade torácica e lombar, ritmo respiratório' },
  { name:'Mobilidade de Quadril 90/90', type:'Mobilidade',   sets:'2',reps:'8-10',    rest:'30s',  tip:'Rotação interna e externa de quadril sentado' },
  { name:'World\'s Greatest Stretch',   type:'Mobilidade',   sets:'2',reps:'6-8',     rest:'30s',  tip:'Combinação de lunge, rotação e extensão torácica' },
  { name:'Alongamento de Isquiotibial', type:'Mobilidade',   sets:'2',reps:'30-45s',  rest:'20s',  tip:'Perna estendida, flexão do tronco sem arredondar lombar' },
  { name:'Rotação Torácica em 4 Apoios',type:'Mobilidade',   sets:'2',reps:'8-10',    rest:'30s',  tip:'Mão atrás da cabeça, cotovelo sobe ao teto' },
  { name:'Mobilidade de Tornozelo',     type:'Mobilidade',   sets:'2',reps:'10-12',   rest:'20s',  tip:'Joelho ultrapassa o pé, mantém calcanhar no chão' },
]

// ── Templates ──────────────────────────────────────────────────────────────────
const T = {
  futebol_crianca: {
    label:'Futebol - FUNdamentals (6-12 anos)', color:'#34D399', semAcademia:false,
    days:[
      { name:'Treino A - Multilateral', focus:'Full Body + Coordenação', day_of_week:'Ter', exercises:[
        { name:'Agachamento com Peso Corporal', type:'Peso Corporal', sets:'3', reps:'15',   rest:'45s', tip:'Foco em técnica' },
        { name:'Flexão de Braço',               type:'Funcional',     sets:'3', reps:'10',   rest:'45s', tip:'Apoio nos joelhos se necessário' },
        { name:'Salto Vertical',                type:'Funcional',     sets:'3', reps:'6',    rest:'60s', tip:'Aterrissagem suave' },
        { name:'Corrida Lateral (Shuffle)',     type:'Funcional',     sets:'4', reps:'10m',  rest:'45s', tip:'Agilidade' },
        { name:'Prancha Frontal',               type:'Core',          sets:'3', reps:'20s',  rest:'30s', tip:'Core estável' },
        { name:'Equilíbrio Unipodal',           type:'Peso Corporal', sets:'3', reps:'20s',  rest:'30s', tip:'Olhos abertos' },
      ]},
      { name:'Treino B - Coordenação', focus:'Habilidades Motoras + Core', day_of_week:'Qui', exercises:[
        { name:'Corrida Lateral (Shuffle)', type:'Funcional',    sets:'4', reps:'15m',  rest:'45s', tip:'Mudança de direção' },
        { name:'Afundo (Peso Corporal)',    type:'Peso Corporal',sets:'3', reps:'10',   rest:'45s', tip:'Sem carga extra' },
        { name:'Abdominal Bicicleta',       type:'Funcional',    sets:'3', reps:'15',   rest:'30s', tip:'Coordenação contralateral' },
        { name:'Step Up (Caixote/Escada)',  type:'Funcional',    sets:'3', reps:'10',   rest:'45s', tip:'Empurrar pelo calcanhar' },
        { name:'Superman',                  type:'Peso Corporal',sets:'3', reps:'12',   rest:'30s', tip:'Extensão controlada' },
        { name:'Pular Corda',               type:'Cardio',       sets:'3', reps:'2min', rest:'60s', tip:'Coordenação ritmo' },
      ]},
    ],
  },
  futebol_adolescente: {
    label:'Futebol - Train to Train (12-17 anos)', color:'#60A5FA', semAcademia:false,
    days:[
      { name:'Treino A - Membros Inferiores', focus:'Posterior + Glúteo + Core', day_of_week:'Seg', exercises:[
        { name:'Agachamento Livre',             type:'Quadríceps', sets:'4', reps:'10-12', rest:'75s', tip:'Foco em técnica, até 70% 1RM' },
        { name:'Stiff (Terra Romeno)',           type:'Posterior',  sets:'3', reps:'10-12', rest:'75s', tip:'Cadeia posterior do futebol' },
        { name:'Afundo com Salto (Lunge Jump)', type:'Funcional',  sets:'3', reps:'10',   rest:'60s', tip:'Transferência esportiva' },
        { name:'Hip Thrust (Barra)',             type:'Glúteo',     sets:'3', reps:'12',   rest:'60s', tip:'Potência de chute' },
        { name:'Prancha Frontal',                type:'Core',       sets:'3', reps:'40s',  rest:'30s', tip:'Estabilizador central' },
        { name:'Pallof Press',                  type:'Core',       sets:'3', reps:'10',   rest:'45s', tip:'Resistência à rotação' },
      ]},
      { name:'Treino B - Membros Superiores', focus:'Empurrão + Puxada', day_of_week:'Qua', exercises:[
        { name:'Supino Reto (Barra)',       type:'Peito',  sets:'4', reps:'10-12', rest:'75s', tip:'70% 1RM máx adolescente' },
        { name:'Puxada Frontal (Polia)',    type:'Costas', sets:'4', reps:'10-12', rest:'75s', tip:'Equilíbrio pull/push' },
        { name:'Desenvolvimento (Halter)', type:'Ombro',  sets:'3', reps:'10-12', rest:'60s', tip:'Estabilidade escapular' },
        { name:'Remada Curvada (Barra)',    type:'Costas', sets:'3', reps:'10-12', rest:'75s', tip:'Postura futebol' },
        { name:'Dead Bug',                 type:'Core',   sets:'3', reps:'8',     rest:'45s', tip:'Coordenação contralateral' },
      ]},
      { name:'Treino C - Potência + Agilidade', focus:'Explosão + Velocidade', day_of_week:'Sex', exercises:[
        { name:'Agachamento com Salto',     type:'Funcional', sets:'4', reps:'6-8',  rest:'90s', tip:'Pliometria - base do futebol' },
        { name:'Corrida Lateral (Shuffle)', type:'Funcional', sets:'4', reps:'15m',  rest:'60s', tip:'Agilidade e mudança de direção' },
        { name:'Box Jump',                  type:'Funcional', sets:'3', reps:'5-8',  rest:'90s', tip:'Potência de membros inferiores' },
        { name:'Kettlebell Swing',          type:'Full Body', sets:'3', reps:'12',   rest:'75s', tip:'Potência de quadril' },
        { name:'Corrida (Esteira)',         type:'Cardio',   sets:'1', reps:'20min', rest:'-',   tip:'PSE 5-6, resistência aeróbia' },
      ]},
    ],
  },
  saude: {
    label:'Saúde e Bem-Estar - Funcional', color:'#34D399', semAcademia:false,
    days:[
      { name:'Treino A - Funcional Inferior', focus:'Quadril + Core + Equilíbrio', day_of_week:'Seg', exercises:[
        { name:'Agachamento Goblet',              type:'Quadríceps',   sets:'3', reps:'12-15', rest:'60s', tip:'Multiarticular, padrão funcional' },
        { name:'Stiff (Terra Romeno)',             type:'Posterior',    sets:'3', reps:'12-15', rest:'60s', tip:'Mobilidade de quadril' },
        { name:'Elevação Pélvica (Glúteo Bridge)', type:'Peso Corporal',sets:'3', reps:'15-20', rest:'45s', tip:'Sem carga, foco em ativação' },
        { name:'Afundo (Peso Corporal)',           type:'Peso Corporal',sets:'3', reps:'12',    rest:'60s', tip:'Equilíbrio e funcionalidade' },
        { name:'Panturrilha em Pé',               type:'Panturrilha',  sets:'3', reps:'15-20', rest:'45s', tip:'Amplitude total' },
        { name:'Prancha Frontal',                 type:'Core',         sets:'3', reps:'30s',   rest:'30s', tip:'Core estabilizador' },
      ]},
      { name:'Treino B - Funcional Superior', focus:'Puxada + Empurrão + Mobilidade', day_of_week:'Qua', exercises:[
        { name:'Flexão de Braço',             type:'Funcional',  sets:'3', reps:'10-15', rest:'60s', tip:'Peso corporal, funcional' },
        { name:'Remada Unilateral (Halter)',   type:'Costas',     sets:'3', reps:'12-15', rest:'60s', tip:'Equilíbrio pull/push' },
        { name:'Desenvolvimento (Halter)',     type:'Ombro',      sets:'3', reps:'12-15', rest:'60s', tip:'Carga leve, padrão funcional' },
        { name:'Gato-Vaca',                   type:'Mobilidade', sets:'2', reps:'12',    rest:'30s', tip:'Mobilidade torácica' },
        { name:'Mobilidade de Quadril 90/90', type:'Mobilidade', sets:'2', reps:'8',     rest:'30s', tip:'Prevenção de lesão' },
        { name:'Dead Bug',                    type:'Core',       sets:'3', reps:'8',     rest:'45s', tip:'Core funcional profundo' },
      ]},
    ],
  },
  massa: {
    label:'Ganho de Massa - Hipertrofia', color:'#A78BFA', semAcademia:false,
    days:[
      { name:'Treino A - Peito + Tríceps', focus:'Push', day_of_week:'Seg', exercises:[
        { name:'Supino Reto (Barra)',       type:'Peito',   sets:'4', reps:'6-10',  rest:'90s', tip:'Tensão mecânica - hipertrofia' },
        { name:'Supino Inclinado (Halter)', type:'Peito',   sets:'3', reps:'10-12', rest:'75s', tip:'Porção clavicular' },
        { name:'Crucifixo (Halter)',        type:'Peito',   sets:'3', reps:'12-15', rest:'60s', tip:'Estresse metabólico' },
        { name:'Tríceps Pulley (Polia)',    type:'Tríceps', sets:'3', reps:'12-15', rest:'60s', tip:'Isolamento final' },
        { name:'Tríceps Testa (Barra EZ)', type:'Tríceps', sets:'3', reps:'10-12', rest:'60s', tip:'Cabeça longa do tríceps' },
      ]},
      { name:'Treino B - Costas + Bíceps', focus:'Pull', day_of_week:'Ter', exercises:[
        { name:'Barra Fixa',             type:'Costas', sets:'4', reps:'6-10',  rest:'90s', tip:'Amplitude completa' },
        { name:'Remada Curvada (Barra)', type:'Costas', sets:'4', reps:'8-10',  rest:'90s', tip:'Volume de costas' },
        { name:'Puxada Frontal (Polia)', type:'Costas', sets:'3', reps:'10-12', rest:'75s', tip:'Pre-exaustão' },
        { name:'Rosca Direta (Barra)',   type:'Bíceps', sets:'3', reps:'10-12', rest:'60s', tip:'Curl clássico' },
        { name:'Rosca Martelo',          type:'Bíceps', sets:'3', reps:'12-15', rest:'60s', tip:'Braquial + braquiorradial' },
      ]},
      { name:'Treino C - Membros Inferiores', focus:'Quadríceps + Posterior + Glúteo', day_of_week:'Qui', exercises:[
        { name:'Agachamento Livre',    type:'Quadríceps',  sets:'5', reps:'6-10',  rest:'120s', tip:'Rainha dos exercícios' },
        { name:'Leg Press',            type:'Quadríceps',  sets:'4', reps:'10-12', rest:'90s',  tip:'Volume adicional' },
        { name:'Stiff (Terra Romeno)', type:'Posterior',   sets:'4', reps:'8-12',  rest:'90s',  tip:'Cadeia posterior' },
        { name:'Mesa Flexora',         type:'Posterior',   sets:'3', reps:'10-12', rest:'75s',  tip:'Isolamento isquiotibial' },
        { name:'Panturrilha em Pé',   type:'Panturrilha', sets:'4', reps:'15-20', rest:'45s',  tip:'Amplitude total' },
      ]},
      { name:'Treino D - Ombros + Core', focus:'Deltoide + Estabilidade', day_of_week:'Sex', exercises:[
        { name:'Desenvolvimento (Halter)', type:'Ombro', sets:'4', reps:'10-12', rest:'75s', tip:'Volume de ombro' },
        { name:'Elevação Lateral',        type:'Ombro', sets:'4', reps:'12-15', rest:'60s', tip:'Porção medial' },
        { name:'Elevação Frontal',        type:'Ombro', sets:'3', reps:'12-15', rest:'60s', tip:'Porção anterior' },
        { name:'Prancha Frontal',         type:'Core',  sets:'3', reps:'45s',   rest:'30s', tip:'Core forte = mais força' },
        { name:'Rotação de Tronco',       type:'Core',  sets:'3', reps:'15',    rest:'30s', tip:'Oblíquos' },
      ]},
    ],
  },
  forca: {
    label:'Força e Performance', color:'#EF4444', semAcademia:false,
    days:[
      { name:'Treino A - Empurrão', focus:'Força Máxima Peito', day_of_week:'Seg', exercises:[
        { name:'Supino Reto (Barra)',       type:'Peito',        sets:'5', reps:'3-5', rest:'3min', tip:'85-90% 1RM, força máxima' },
        { name:'Supino Inclinado (Halter)', type:'Peito',        sets:'3', reps:'6-8', rest:'2min', tip:'Volume acessório' },
        { name:'Tríceps Testa (Barra EZ)', type:'Tríceps',      sets:'3', reps:'6-8', rest:'90s',  tip:'Acessório de força' },
        { name:'Prancha Frontal',           type:'Peso Corporal',sets:'3', reps:'45s', rest:'30s',  tip:'Transferência de força' },
      ]},
      { name:'Treino B - Puxão + Posterior', focus:'Costas + Deadlift', day_of_week:'Qua', exercises:[
        { name:'Levantamento Terra',     type:'Posterior', sets:'5', reps:'3-5', rest:'3min', tip:'Rei dos exercícios compostos' },
        { name:'Barra Fixa',             type:'Costas',    sets:'4', reps:'5-6', rest:'2min', tip:'Adição de carga externa' },
        { name:'Remada Curvada (Barra)', type:'Costas',    sets:'4', reps:'6-8', rest:'2min', tip:'Volume posterior' },
        { name:'Rosca Direta (Barra)',   type:'Bíceps',    sets:'3', reps:'6-8', rest:'90s',  tip:'Bíceps forte = pull mais forte' },
      ]},
      { name:'Treino C - Agachamento', focus:'Força Membros Inferiores', day_of_week:'Sex', exercises:[
        { name:'Agachamento Livre',    type:'Quadríceps',  sets:'5', reps:'3-5',  rest:'3min', tip:'85-90% 1RM, força máxima' },
        { name:'Leg Press',            type:'Quadríceps',  sets:'3', reps:'6-8',  rest:'2min', tip:'Acessório' },
        { name:'Stiff (Terra Romeno)', type:'Posterior',   sets:'4', reps:'6-8',  rest:'90s',  tip:'Força de cadeia posterior' },
        { name:'Panturrilha em Pé',   type:'Panturrilha', sets:'4', reps:'12-15', rest:'60s',  tip:'Força de panturrilha' },
      ]},
    ],
  },
  condicionamento: {
    label:'Condicionamento Físico', color:'#FBBF24', semAcademia:false,
    days:[
      { name:'Treino A - Circuito Full Body', focus:'Resistência Muscular + Cardio', day_of_week:'Seg', exercises:[
        { name:'Agachamento Goblet', type:'Quadríceps',   sets:'3', reps:'15-20', rest:'30s', tip:'Alta repetição, pouco descanso' },
        { name:'Flexão de Braço',    type:'Funcional',    sets:'3', reps:'15-20', rest:'30s', tip:'Circuito' },
        { name:'Hip Thrust (Barra)', type:'Glúteo',       sets:'3', reps:'15-20', rest:'30s', tip:'Cadeia posterior' },
        { name:'Remada TRX',         type:'Costas',       sets:'3', reps:'15-20', rest:'30s', tip:'Pull funcional' },
        { name:'Burpee',             type:'Funcional',    sets:'3', reps:'10',    rest:'60s', tip:'Condicionamento total' },
        { name:'Prancha Frontal',    type:'Peso Corporal',sets:'3', reps:'30s',   rest:'30s', tip:'Estabilidade' },
      ]},
      { name:'Treino B - Intervalado', focus:'HIIT + Resistência', day_of_week:'Qua', exercises:[
        { name:'Kettlebell Swing',      type:'Full Body', sets:'4', reps:'15',   rest:'45s', tip:'Potência e cardio' },
        { name:'Agachamento com Salto', type:'Funcional', sets:'4', reps:'10',   rest:'45s', tip:'Pliometria' },
        { name:'Mountain Climber',      type:'Funcional', sets:'3', reps:'25',   rest:'45s', tip:'Core + cardio' },
        { name:'Corrida (Esteira)',     type:'Cardio',   sets:'1', reps:'20min', rest:'-',   tip:'PSE 6-7, zona de condicionamento' },
      ]},
    ],
  },
  funcional_casa: {
    label:'Funcional em Casa - Sem Equipamento', color:'#34D399', semAcademia:true,
    days:[
      { name:'Treino A - Superior', focus:'Peito + Costas + Ombro', day_of_week:'Seg', exercises:[
        { name:'Flexão de Braço',           type:'Funcional',    sets:'4', reps:'10-15', rest:'60s', tip:'Base de empurrão' },
        { name:'Flexão de Braço Diamante',  type:'Funcional',    sets:'3', reps:'8-12',  rest:'60s', tip:'Ativa tríceps e porção interna do peito' },
        { name:'Flexão de Braço Declinada', type:'Funcional',    sets:'3', reps:'8-12',  rest:'60s', tip:'Pés elevados ativam porção clavicular' },
        { name:'Puxada Inverted Row',        type:'Peso Corporal',sets:'3', reps:'10-15', rest:'60s', tip:'Barra ou mesa — puxada em casa' },
        { name:'Tríceps Banco (Dip)',        type:'Peso Corporal',sets:'3', reps:'10-15', rest:'60s', tip:'Apoio em cadeira ou banco' },
      ]},
      { name:'Treino B - Inferior + Core', focus:'Membros Inferiores + Abdômen', day_of_week:'Qua', exercises:[
        { name:'Agachamento com Peso Corporal',    type:'Peso Corporal',sets:'4',reps:'20-25', rest:'45s', tip:'Volume alto para hipertrofia' },
        { name:'Afundo (Peso Corporal)',            type:'Peso Corporal',sets:'3',reps:'12-15', rest:'45s', tip:'Tronco ereto, joelho traseiro quase no chão' },
        { name:'Elevação Pélvica (Glúteo Bridge)', type:'Peso Corporal',sets:'4',reps:'20-25', rest:'30s', tip:'Extensão completa de quadril' },
        { name:'Abdominal V-Sit',                  type:'Funcional',    sets:'3',reps:'12-15', rest:'45s', tip:'Tronco e pernas sobem simultâneos' },
        { name:'Mountain Climber',                 type:'Funcional',    sets:'3',reps:'25-30', rest:'45s', tip:'Core e cardio combinados' },
      ]},
    ],
  },
  elastico_casa: {
    label:'Elástico em Casa - Treino Completo', color:'#FBBF24', semAcademia:true,
    days:[
      { name:'Treino A - Superior (Elástico)', focus:'Peito + Costas + Ombro', day_of_week:'Seg', exercises:[
        { name:'Remada com Elástico',          type:'Elástico', sets:'4', reps:'12-15', rest:'60s', tip:'Elástico preso à frente, cotovelos passam o tronco' },
        { name:'Puxada com Elástico',          type:'Elástico', sets:'3', reps:'12-15', rest:'60s', tip:'Elástico preso acima, puxar para o peito' },
        { name:'Elevação Lateral c/ Elástico', type:'Elástico', sets:'3', reps:'15-20', rest:'45s', tip:'Elástico sob os pés' },
      ]},
      { name:'Treino B - Inferior (Elástico)', focus:'Pernas + Glúteo', day_of_week:'Qui', exercises:[
        { name:'Agachamento com Elástico',       type:'Elástico', sets:'4', reps:'15-20', rest:'60s', tip:'Elástico sobre os ombros ou sob os pés' },
        { name:'Hip Thrust com Elástico',        type:'Elástico', sets:'4', reps:'15-20', rest:'45s', tip:'Elástico sobre os quadris' },
        { name:'Abdução de Quadril (Elástico)',  type:'Elástico', sets:'3', reps:'15-20', rest:'45s', tip:'Elástico nos joelhos, abre e fecha' },
        { name:'Afundo com Elástico',            type:'Elástico', sets:'3', reps:'12',    rest:'60s', tip:'Elástico sobre os ombros, postura ereta' },
      ]},
    ],
  },
}

const getTemplate = (goal, ageGroup, sport, semAcademia) => {
  if (semAcademia) return T.funcional_casa
  const s = sport || ''
  if (s === 'futebol' || s === 'futsal') {
    if (ageGroup === 'crianca')     return T.futebol_crianca
    if (ageGroup === 'adolescente') return T.futebol_adolescente
  }
  if (goal === 'Saúde e Bem-Estar')  return T.saude
  if (goal === 'Ganho de Massa')      return T.massa
  if (goal === 'Força e Performance') return T.forca
  if (goal === 'Condicionamento')     return T.condicionamento
  if (goal === 'Iniciação Esportiva' || goal === 'Desenvolvimento Atlético')
    return ageGroup === 'crianca' ? T.futebol_crianca : T.futebol_adolescente
  return T.massa
}

const getSuggestedTypes = (goal, sport) => {
  const s = sport || ''
  if (s === 'futebol' || s === 'futsal') return ['Posterior','Glúteo','Quadríceps','Core','Funcional']
  if (s === 'natacao')   return ['Costas','Ombro','Core','Funcional']
  if (s === 'basquete')  return ['Quadríceps','Glúteo','Core','Funcional']
  if (goal === 'Saúde e Bem-Estar')  return ['Funcional','Peso Corporal','Mobilidade','Core','Cardio']
  if (goal === 'Ganho de Massa')      return ['Peito','Costas','Quadríceps','Ombro','Bíceps']
  if (goal === 'Força e Performance') return ['Quadríceps','Posterior','Peito','Costas','Core']
  if (goal === 'Condicionamento')     return ['Funcional','Cardio','Core','Elástico','Peso Corporal']
  return EXERCISE_TYPES.slice(0, 5)
}

const calc1RM = (carga, reps) => {
  if (!carga || !reps || reps < 1 || carga <= 0) return null
  const r = Number(reps), c = Number(carga)
  if (r === 1) return c
  if (r > 15)  return null
  const epley    = c * (1 + r / 30)
  const brzycki  = r > 10 ? null : c / (1.0278 - 0.0278 * r)
  const lombardi = c * Math.pow(r, 0.10)
  const valid    = [epley, brzycki, lombardi].filter(v => v !== null && v > 0)
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

// ── TYPE COLORS ────────────────────────────────────────────────────────────────
const TYPE_COLOR = {
  'Funcional':     '#34D399',
  'Elástico':      '#FBBF24',
  'Peso Corporal': '#60A5FA',
  'Mobilidade':    '#F472B6',
  'Core':          '#34D399',
  'Full Body':     '#6EE7B7',
  'Cardio':        '#F87171',
}
const getTypeColor = (type) => TYPE_COLOR[type] || V.accentBr

// ── Styles base (Vestiário Pré-Jogo) ──────────────────────────────────────────
const ss = {
  input: {
    background:  V.bgInput,
    border:      `1px solid ${V.border}`,
    borderRadius: 8,
    padding:     '9px 12px',
    color:        V.text,
    fontSize:    14,
    outline:     'none',
    fontFamily:  'inherit',
  },
  smallInput: {
    background:  V.bgInput,
    border:      `1px solid ${V.borderLight}`,
    borderRadius: 6,
    padding:     '7px 10px',
    color:        V.text,
    fontSize:    12,
    outline:     'none',
    width:       '100%',
    fontFamily:  'inherit',
  },
  btn: (c) => ({
    background:   c || V.accent,
    border:       'none',
    borderRadius:  8,
    padding:      '9px 16px',
    color:         '#431C00',
    fontWeight:    700,
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   'inherit',
  }),
  outlineBtn: {
    background:   V.accentFaint,
    border:       `1px solid ${V.border}`,
    borderRadius:  8,
    padding:      '9px 14px',
    color:         V.accentDim,
    fontWeight:    600,
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   'inherit',
  },
  delBtn: {
    background: 'none',
    border:     'none',
    color:      V.textDim,
    cursor:     'pointer',
    fontSize:   14,
    padding:    '2px 6px',
    flexShrink:  0,
  },
}

// ── 1RM Calculator ─────────────────────────────────────────────────────────────
function OneRMCalc({ ageGroup, onApply, onClose }) {
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

// ── Exercise Search ────────────────────────────────────────────────────────────
function ExerciseSearch({ onSelect, suggestedTypes, ageGroup }) {
  const [query,      setQuery]      = useState('')
  const [filterType, setFilterType] = useState('')
  const [modality,   setModality]   = useState('')

  const allowedTypes = modality ? MODALITY_MAP[modality] : null

  const results = EXERCISE_BANK.filter(ex => {
    const matchQ = !query       || ex.name.toLowerCase().includes(query.toLowerCase())
    const matchT = !filterType  || ex.type === filterType
    const matchM = !allowedTypes || allowedTypes.includes(ex.type)
    if (ageGroup === 'crianca' && (ex.sets === '5' || ex.reps === '3-5' || ex.reps === '1-5')) return false
    return matchQ && matchT && matchM
  }).slice(0, 10)

  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
        {Object.keys(MODALITY_MAP).map(mod => (
          <button key={mod} onClick={() => { setModality(modality === mod ? '' : mod); setFilterType('') }}
            style={{ padding:'4px 12px', borderRadius:20, border:`1px solid ${modality===mod ? MODALITY_COLORS[mod] : V.border}`, background: modality===mod ? MODALITY_COLORS[mod]+'18' : 'transparent', color: modality===mod ? MODALITY_COLORS[mod] : V.textSub, fontSize:11, cursor:'pointer', fontWeight: modality===mod ? 700 : 400, fontFamily:'inherit' }}>
            {mod}
          </button>
        ))}
        {(modality || filterType) && (
          <button onClick={() => { setModality(''); setFilterType('') }} style={{ padding:'4px 8px', borderRadius:20, border:`1px solid ${V.borderLight}`, background:'transparent', color:V.textDim, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
            × Limpar
          </button>
        )}
      </div>
      {suggestedTypes.length > 0 && (
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
          <span style={{ fontSize:9, color:V.textDim, textTransform:'uppercase', letterSpacing:1, alignSelf:'center' }}>Sugerido:</span>
          {suggestedTypes.filter(t => !allowedTypes || allowedTypes.includes(t)).map(t => (
            <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
              style={{ padding:'3px 10px', borderRadius:20, border:`1px solid ${filterType===t ? getTypeColor(t) : V.border}`, background: filterType===t ? getTypeColor(t)+'18' : 'transparent', color: filterType===t ? getTypeColor(t) : V.textSub, fontSize:11, cursor:'pointer', fontWeight: filterType===t ? 700 : 400, fontFamily:'inherit' }}>
              {t}
            </button>
          ))}
        </div>
      )}
      <input style={ss.smallInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar exercício... (ex: agachamento, elástico, mobilidade)" />
      {(query || filterType || modality) && results.length > 0 && (
        <div style={{ background:'rgba(14,9,0,0.95)', border:`1px solid ${V.border}`, borderRadius:10, overflow:'hidden', marginTop:4 }}>
          {results.map((ex, i) => {
            const tc = getTypeColor(ex.type)
            return (
              <div key={i} onClick={() => { onSelect(ex); setQuery(''); setFilterType(''); setModality('') }}
                style={{ padding:'9px 14px', borderBottom:`1px solid ${V.borderLight}`, cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(217,119,6,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:V.text }}>{ex.name}</div>
                  <div style={{ fontSize:10, color:V.textSub, marginTop:2 }}>{ex.tip}</div>
                </div>
                <div style={{ flexShrink:0, display:'flex', gap:5, alignItems:'center' }}>
                  <span style={{ fontSize:9, background:tc+'18', padding:'2px 7px', borderRadius:20, color:tc, border:`1px solid ${tc}35`, fontWeight:700 }}>{ex.type}</span>
                  <span style={{ fontSize:9, color:V.textDim }}>{ex.sets}×{ex.reps}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {(query || filterType || modality) && results.length === 0 && (
        <div style={{ padding:'8px 12px', fontSize:12, color:V.textDim, marginTop:4 }}>Nenhum resultado — preencha manualmente abaixo</div>
      )}
    </div>
  )
}

// ── Template Modal ─────────────────────────────────────────────────────────────
function TemplateModal({ student, ageGroup, semAcademia, onApply, onClose }) {
  const [dias,     setDias]     = useState(3)
  const [academia, setAcademia] = useState(!semAcademia)
  const [anamnese, setAnamnese] = useState(null)
  const [fundSem,  setFundSem]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [preview,  setPreview]  = useState(null)

  useEffect(() => {
    const load = async () => {
      // Fetch anamnese + mesociclo ativo em paralelo
      const [{ data: an }, macRes] = await Promise.all([
        supabase.from('anamnese').select('*').eq('student_id', student?.id).single(),
        supabase.from('macrociclos').select('id,data_inicio,semanas_total').eq('student_id', student?.id).order('created_at', { ascending: false }).limit(1),
      ])
      setAnamnese(an || null)

      // Descobrir mesociclo atual pelo macrociclo mais recente
      const mac = macRes.data?.[0]
      if (mac?.data_inicio) {
        const semAtual = Math.max(1, Math.min(
          Math.floor((new Date() - new Date(mac.data_inicio)) / (7*24*3600*1000)) + 1,
          mac.semanas_total
        ))
        const { data: mesos } = await supabase.from('mesociclos')
          .select('*').eq('macrociclo_id', mac.id)
          .lte('semana_inicio', semAtual).gte('semana_fim', semAtual).limit(1)
        setFundSem(mesos?.[0] || null)
      }
      setLoading(false)
    }
    if (student?.id) load()
    else setLoading(false)
  }, [student?.id])

  // ── Gerador inteligente de estrutura ────────────────────────────────────────
  const gerar = () => {
    const goal    = student?.goal  || 'Saúde e Bem-Estar'
    const nivel   = student?.level || 'Iniciante'
    const age     = parseInt(student?.age) || 25
    const lims    = anamnese?.limitacoes || []
    const prefs   = anamnese?.preferencias || []
    const voltando = anamnese?.experiencia === 'voltando'

    // Parâmetros: usa mesociclo ativo se disponível, senão usa defaults por objetivo
    const PARAMS = {
      'Ganho de Massa':       { sets:[3,4], reps:'8–12',  rest:'1min30s', intensidade:'70–80% 1RM' },
      'Força e Performance':  { sets:[4,5], reps:'4–6',   rest:'3min',    intensidade:'82–90% 1RM' },
      'Emagrecimento':        { sets:[3,4], reps:'12–15', rest:'45s',     intensidade:'60–70% 1RM' },
      'Condicionamento':      { sets:[3,4], reps:'12–15', rest:'1min',    intensidade:'65–75% 1RM' },
      'Saúde e Bem-Estar':    { sets:[2,3], reps:'12–15', rest:'1min',    intensidade:'60–70% 1RM' },
      'Iniciação Esportiva':  { sets:[2,3], reps:'12–15', rest:'1min',    intensidade:'Peso corporal/leve' },
    }
    const base = PARAMS[goal] || PARAMS['Saúde e Bem-Estar']
    // Sobrescreve com dados do mesociclo se existirem
    const p = {
      sets: fundSem?.ref_sets_min && fundSem?.ref_sets_max
        ? [fundSem.ref_sets_min, fundSem.ref_sets_max]
        : base.sets,
      reps: fundSem?.ref_reps_min && fundSem?.ref_reps_max
        ? `${fundSem.ref_reps_min}–${fundSem.ref_reps_max}`
        : base.reps,
      rest: fundSem?.ref_descanso || base.rest,
      intensidade: fundSem?.ref_intensidade || base.intensidade,
    }
    if (voltando) { p.sets = [Math.max(1,p.sets[0]-1), p.sets[0]]; p.intensidade = '60–65% 1RM (readaptação)' }

    // Filtro de exercícios por limitações
    const hasLim = (parts) => parts.some(pt => lims.some(l => l.includes(pt)))
    const skipOmbro   = hasLim(['ombro'])
    const skipJoelho  = hasLim(['joelho'])
    const skipColuna  = hasLim(['coluna'])
    const skipPunho   = hasLim(['punho'])

    // Exercícios base por grupo (academia vs sem academia)
    const EX = {
      Peito:    academia ? [
        !skipOmbro && !skipPunho ? { name:'Supino Reto',        type:'Musculação', sets:p.sets[1], reps:p.reps, rest:p.rest } : null,
        !skipOmbro ? { name:'Supino Inclinado Halteres', type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest } : null,
        !skipOmbro ? { name:'Crucifixo',                 type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest } : null,
      ] : [
        !skipOmbro ? { name:'Flexão de Braço',  type:'Funcional', sets:p.sets[0], reps:p.reps, rest:p.rest } : null,
        !skipOmbro ? { name:'Flexão Inclinada', type:'Funcional', sets:p.sets[0], reps:p.reps, rest:p.rest } : null,
      ],
      Costas:   academia ? [
        !skipPunho ? { name:'Remada Curvada',      type:'Musculação', sets:p.sets[1], reps:p.reps, rest:p.rest } : null,
        !skipPunho ? { name:'Puxada Frente',        type:'Musculação', sets:p.sets[1], reps:p.reps, rest:p.rest } : null,
        !skipColuna ? { name:'Hiperextensão',       type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest } : null,
      ] : [
        { name:'Remada com Elástico', type:'Funcional', sets:p.sets[0], reps:p.reps, rest:p.rest },
        { name:'Superman',            type:'Funcional', sets:p.sets[0], reps:'15',   rest:'45s' },
      ],
      Ombro:    !skipOmbro ? (academia ? [
        { name:'Desenvolvimento Máquina', type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
        { name:'Elevação Lateral',        type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ] : [
        { name:'Elevação Lateral Halteres', type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ]) : [],
      Quadríceps: !skipJoelho ? (academia ? [
        !skipColuna ? { name:'Agachamento Livre', type:'Musculação', sets:p.sets[1], reps:p.reps, rest:p.rest } : null,
        { name:'Leg Press 45°',      type:'Musculação', sets:p.sets[1], reps:p.reps, rest:p.rest },
        { name:'Cadeira Extensora',  type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ] : [
        !skipColuna ? { name:'Agachamento Livre', type:'Funcional', sets:p.sets[1], reps:p.reps, rest:p.rest } : null,
        { name:'Avanço',            type:'Funcional', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ]) : [],
      Posterior: academia ? [
        !skipColuna ? { name:'Stiff',         type:'Musculação', sets:p.sets[1], reps:p.reps, rest:p.rest } : null,
        { name:'Mesa Flexora',  type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ] : [
        !skipColuna ? { name:'Stiff Halteres', type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest } : null,
        { name:'Elevação Pélvica', type:'Funcional', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ],
      Bíceps:   !skipPunho ? [
        { name:'Rosca Direta',    type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
        { name:'Rosca Martelo',   type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ] : [],
      Tríceps:  !skipPunho ? [
        { name:'Tríceps Polia',   type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
        { name:'Tríceps Testa',   type:'Musculação', sets:p.sets[0], reps:p.reps, rest:p.rest },
      ] : [],
      Core: [
        { name:'Abdominal Crunch', type:'Funcional', sets:p.sets[0], reps:'15–20', rest:'45s' },
        { name:'Prancha',          type:'Funcional', sets:3,         reps:'30–45s', rest:'45s' },
      ],
    }

    // Filtra nulls
    Object.keys(EX).forEach(k => { EX[k] = (EX[k]||[]).filter(Boolean) })

    // Monta divisão por dias
    let splits = []
    if (dias <= 2) {
      splits = [
        { name:'Treino A', dow:'Seg', focus:'Full Body', exs: [...(EX.Peito||[]).slice(0,1), ...(EX.Costas||[]).slice(0,1), ...(EX.Quadríceps||[]).slice(0,1), ...(EX.Core||[]).slice(0,1)] },
        { name:'Treino B', dow:'Qui', focus:'Full Body', exs: [...(EX.Ombro||[]).slice(0,1), ...(EX.Posterior||[]).slice(0,1), ...(EX.Bíceps||[]).slice(0,1), ...(EX.Tríceps||[]).slice(0,1), ...(EX.Core||[]).slice(0,1)] },
      ]
    } else if (dias === 3) {
      splits = [
        { name:'Treino A', dow:'Seg', focus:'Peito + Tríceps + Core',    exs: [...(EX.Peito||[]), ...(EX.Tríceps||[]), ...(EX.Core||[]).slice(0,1)] },
        { name:'Treino B', dow:'Qua', focus:'Costas + Bíceps',           exs: [...(EX.Costas||[]), ...(EX.Bíceps||[])] },
        { name:'Treino C', dow:'Sex', focus:'Pernas + Ombro + Core',     exs: [...(EX.Quadríceps||[]), ...(EX.Posterior||[]), ...(EX.Ombro||[]).slice(0,1), ...(EX.Core||[]).slice(0,1)] },
      ]
    } else if (dias === 4) {
      splits = [
        { name:'Treino A', dow:'Seg', focus:'Upper A — Peito + Bíceps',  exs: [...(EX.Peito||[]), ...(EX.Bíceps||[])] },
        { name:'Treino B', dow:'Ter', focus:'Lower A — Quadríceps',      exs: [...(EX.Quadríceps||[]), ...(EX.Core||[]).slice(0,1)] },
        { name:'Treino C', dow:'Qui', focus:'Upper B — Costas + Tríceps',exs: [...(EX.Costas||[]), ...(EX.Ombro||[]).slice(0,1), ...(EX.Tríceps||[])] },
        { name:'Treino D', dow:'Sex', focus:'Lower B — Posterior',       exs: [...(EX.Posterior||[]), ...(EX.Core||[])] },
      ]
    } else {
      splits = [
        { name:'Treino A', dow:'Seg', focus:'Peito + Tríceps',           exs: [...(EX.Peito||[]), ...(EX.Tríceps||[])] },
        { name:'Treino B', dow:'Ter', focus:'Costas + Bíceps',           exs: [...(EX.Costas||[]), ...(EX.Bíceps||[])] },
        { name:'Treino C', dow:'Qua', focus:'Pernas — Quadríceps',       exs: [...(EX.Quadríceps||[]), ...(EX.Core||[]).slice(0,1)] },
        { name:'Treino D', dow:'Qui', focus:'Ombro + Core',              exs: [...(EX.Ombro||[]), ...(EX.Core||[])] },
        { name:'Treino E', dow:'Sex', focus:'Pernas — Posterior',        exs: [...(EX.Posterior||[]), ...(EX.Core||[]).slice(0,1)] },
      ].slice(0, dias)
    }

    // Limpa exercícios vazios
    splits = splits.map(sp => ({ ...sp, exs: (sp.exs||[]).filter(Boolean) })).filter(sp => sp.exs.length > 0)

    setPreview({ splits, params: p })
  }

  useEffect(() => { if (!loading) gerar() }, [loading, dias, academia])

  const apply = () => {
    if (!preview) return
    onApply({
      days: preview.splits.map(sp => ({
        name: sp.name, focus: sp.focus, day_of_week: sp.dow,
        exercises: sp.exs.map((ex, i) => ({
          name: ex.name, sets: ex.sets, reps: ex.reps,
          rest: ex.rest, type: ex.type || 'Musculação',
          tip: '', order_index: i,
        })),
      }))
    })
    onClose()
  }

  const goal = student?.goal || ''
  const lims = anamnese?.limitacoes || []

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:V.bgBase, borderRadius:18, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', border:`1px solid ${V.border}`, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:V.text }}>Gerar Estrutura de Treino</div>
            <div style={{ fontSize:11, color:V.textSub, marginTop:2 }}>
              {goal} · {student?.level} · {student?.age ? `${student.age} anos` : ''}
              {anamnese?.experiencia === 'voltando' && <span style={{ color:'#FBBF24', marginLeft:6 }}>· Voltando após pausa</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:V.accentFaint, border:'none', borderRadius:8, padding:'5px 10px', color:V.textSub, cursor:'pointer', fontSize:13 }}>✕</button>
        </div>

        <div style={{ padding:'18px 20px' }}>
          {/* Limitações ativas */}
          {lims.length > 0 && (
            <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, fontSize:11, color:'#F87171' }}>
              ⚠ Limitações detectadas na anamnese: {lims.map(l => l.replace(/_/g,' ')).join(', ')} — exercícios ajustados automaticamente.
            </div>
          )}

          {/* Configurações */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11, color:V.textSub, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Dias por semana</div>
              <div style={{ display:'flex', gap:5 }}>
                {[2,3,4,5].map(d => (
                  <button key={d} onClick={() => setDias(d)}
                    style={{ flex:1, padding:'8px 0', borderRadius:8, border:`1.5px solid ${dias===d ? V.accent : V.border}`, background: dias===d ? `${V.accent}18` : V.accentFaint, color: dias===d ? V.accent : V.textSub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    {d}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:V.textSub, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>Equipamento</div>
              <div style={{ display:'flex', gap:5 }}>
                {[{v:true,l:'Com Academia'},{v:false,l:'Sem Academia'}].map(({v,l}) => (
                  <button key={String(v)} onClick={() => setAcademia(v)}
                    style={{ flex:1, padding:'8px 6px', borderRadius:8, border:`1.5px solid ${academia===v ? V.accent : V.border}`, background: academia===v ? `${V.accent}18` : V.accentFaint, color: academia===v ? V.accent : V.textSub, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parâmetros calculados */}
          {preview && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:18 }}>
              {[
                { label:'Séries',      val:`${preview.params.sets[0]}–${preview.params.sets[1]}` },
                { label:'Reps',        val:preview.params.reps },
                { label:'Descanso',    val:preview.params.rest },
                { label:'Intensidade', val:preview.params.intensidade },
              ].map(({label,val}) => (
                <div key={label} style={{ background:V.accentFaint, borderRadius:8, padding:'8px 10px', border:`1px solid ${V.border}`, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:V.textDim, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:V.accent }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Preview da divisão */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'30px', color:V.textSub }}>Carregando dados do aluno...</div>
          ) : preview ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
              <div style={{ fontSize:11, color:V.textSub, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Divisão gerada</div>
              {preview.splits.map((sp,i) => (
                <div key={i} style={{ background:V.accentFaint, border:`1px solid ${V.border}`, borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:10, background:`${V.accent}18`, color:V.accent, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{sp.dow}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:V.text }}>{sp.name}</span>
                    <span style={{ fontSize:10, color:V.textSub }}>— {sp.focus}</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {sp.exs.map((ex,j) => (
                      <span key={j} style={{ fontSize:10, color:V.textSub, background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:20, border:`1px solid ${V.borderLight}` }}>
                        {ex.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={apply} style={{ flex:1, padding:'13px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${V.accent},${V.accentDark||V.accent})`, color:'#fff', fontWeight:800, fontSize:14, fontFamily:'inherit' }}>
              Aplicar Estrutura
            </button>
            <button onClick={gerar} style={{ padding:'13px 16px', borderRadius:12, border:`1px solid ${V.border}`, background:V.accentFaint, color:V.textSub, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              ↺
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function NoEquipmentSection({ onAddExercise }) {
  const [open, setOpen] = useState(false)
  const QUICK = [
    { label:'Flexão de Braço',     type:'Funcional',    sets:'3', reps:'10-15', rest:'60s', tip:'Corpo rígido, peito toca o chão' },
    { label:'Agachamento Corpo',   type:'Peso Corporal',sets:'3', reps:'20',    rest:'45s', tip:'Sem carga, foco em técnica' },
    { label:'Burpee',              type:'Funcional',    sets:'3', reps:'8-10',  rest:'90s', tip:'Movimento completo' },
    { label:'Prancha Frontal',     type:'Peso Corporal',sets:'3', reps:'40s',   rest:'30s', tip:'Quadril neutro' },
    { label:'Abdominal Bicicleta', type:'Funcional',    sets:'3', reps:'15-20', rest:'45s', tip:'Cotovelo toca joelho oposto' },
    { label:'Mountain Climber',    type:'Funcional',    sets:'3', reps:'25-30', rest:'45s', tip:'Core ativado, quadril estável' },
    { label:'Elevação Pélvica',    type:'Peso Corporal',sets:'3', reps:'20',    rest:'30s', tip:'Extensão completa de quadril' },
    { label:'Gato-Vaca',           type:'Mobilidade',   sets:'2', reps:'12',    rest:'20s', tip:'Mobilidade torácica e lombar' },
    { label:'Equilíbrio Unipodal', type:'Peso Corporal',sets:'2', reps:'30s',   rest:'20s', tip:'Propriocepção' },
    { label:'Superman',            type:'Peso Corporal',sets:'3', reps:'12',    rest:'30s', tip:'Extensão bilateral' },
  ]

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(96,165,250,0.05)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:8, padding:'7px 12px', color:'#60A5FA', fontSize:11, fontWeight:700, cursor:'pointer', marginTop:6, fontFamily:'inherit' }}>
      🏠 + Exercício sem equipamento
    </button>
  )

  return (
    <div style={{ marginTop:8, background:'rgba(96,165,250,0.03)', border:'1px solid rgba(96,165,250,0.1)', borderRadius:10, padding:'12px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#60A5FA', textTransform:'uppercase', letterSpacing:1 }}>🏠 Sem equipamento</span>
        <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:V.textMuted, cursor:'pointer', fontSize:14 }}>×</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {QUICK.map((ex, i) => {
          const tc = getTypeColor(ex.type)
          return (
            <button key={i} onClick={() => onAddExercise({ name:ex.label, type:ex.type, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip })}
              style={{ padding:'5px 11px', borderRadius:20, border:`1px solid ${tc}35`, background:`${tc}10`, color:tc, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {ex.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── WorkoutEditor Principal ────────────────────────────────────────────────────
export default function WorkoutEditor({ navigate, studentId, planId }) {
  const [plan,         setPlan]         = useState(null)
  const [days,         setDays]         = useState([])
  const [student,      setStudent]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [newExForms,   setNewExForms]   = useState({})
  const [openCalc,     setOpenCalc]     = useState(null)
  const [showTemplate, setShowTemplate] = useState(false)
  const [semAcademia,  setSemAcademia]  = useState(false)
  const [showAval,     setShowAval]     = useState(false)

  const ageGroup   = getAgeGroup(student?.birth_date, student?.age)
  const studentAge = student?.birth_date
    ? Math.floor((Date.now() - new Date(student.birth_date)) / (365.25 * 24 * 3600 * 1000))
    : student?.age ? parseInt(student.age) : null
  const suggestedTypes = getSuggestedTypes(student?.goal || '', student?.sport || '')

  useEffect(() => { fetchAll() }, [planId])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data:planData }, { data:daysData }, { data:studentData }] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('id', planId).single(),
      supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', planId).order('order_index'),
      supabase.from('students').select('id,name,birth_date,age,goal,sport').eq('id', studentId).single(),
    ])
    if (planData)    setPlan(planData)
    if (daysData)    setDays(daysData.map(d => ({ ...d, exercises:(d.exercises||[]).sort((a,b) => a.order_index - b.order_index) })))
    if (studentData) setStudent(studentData)
    setLoading(false)
  }

  const savePlanTitle = async () => {
    setSaving(true)
    await supabase.from('workout_plans').update({ title:plan.title, status:plan.status, updated_at:new Date().toISOString() }).eq('id', planId)
    setSaving(false)
  }

  const saveStatus = async (newStatus) => {
    setSaving(true)
    await supabase.from('workout_plans').update({ status:newStatus, updated_at:new Date().toISOString() }).eq('id', planId)
    setSaving(false)
  }

  // ── Análise de avaliação — calculada em tempo real a partir dos days ────────
  const avalAnalysis = (() => {
    if (!days.length) return {}

    const goal  = student?.goal  || ''
    const nivel = student?.level || 'Iniciante'
    const age   = parseInt(student?.age) || null

    // ── Classificações de exercícios ─────────────────────────────────────────
    const MUSCLE_MAP = {
      supino:'Peito','supino reto':'Peito','supino inclinado':'Peito','supino declinado':'Peito',
      crucifixo:'Peito',voador:'Peito',crossover:'Peito','peck deck':'Peito','flexão':'Peito','push up':'Peito',
      remada:'Costas',puxada:'Costas','barra fixa':'Costas','levantamento terra':'Costas',
      pulldown:'Costas',serrote:'Costas',cavalinho:'Costas',hiperextensão:'Costas',
      desenvolvimento:'Ombro','elevação lateral':'Ombro','elevação frontal':'Ombro',
      arnold:'Ombro','face pull':'Ombro',encolhimento:'Ombro',
      'rosca direta':'Bíceps','rosca alternada':'Bíceps','rosca martelo':'Bíceps',
      'rosca concentrada':'Bíceps','rosca scott':'Bíceps',curl:'Bíceps',
      tríceps:'Tríceps',triceps:'Tríceps',mergulho:'Tríceps',extensão:'Tríceps',
      testa:'Tríceps',corda:'Tríceps',paralelas:'Tríceps',
      agachamento:'Quadríceps','leg press':'Quadríceps',hack:'Quadríceps',
      'cadeira extensora':'Quadríceps',avanço:'Quadríceps',afundo:'Quadríceps',búlgaro:'Quadríceps',
      stiff:'Posterior','mesa flexora':'Posterior',flexora:'Posterior','leg curl':'Posterior',
      glúteo:'Glúteo',gluteo:'Glúteo','hip thrust':'Glúteo','elevação pélvica':'Glúteo',
      panturrilha:'Panturrilha',gêmeos:'Panturrilha',calf:'Panturrilha',
      abdominal:'Abdômen',prancha:'Abdômen',crunch:'Abdômen',plank:'Abdômen',
    }
    // Padrões de movimento
    const EMPURRAR  = ['supino','flexão','push','desenvolvimento','arnold','tríceps','triceps','paralelas','mergulho','crossover','crucifixo','voador','peck','extensão de tríceps']
    const PUXAR     = ['remada','pulldown','puxada','barra fixa','pull','serrote','rosca','curl','bíceps','biceps']
    const JOELHO    = ['agachamento','leg press','hack','cadeira','avanço','afundo','búlgaro','passada']
    const QUADRIL   = ['stiff','mesa','flexora','leg curl','hip thrust','glúteo','elevação pélvica','levantamento terra']
    const LIVRE     = ['agachamento','barra','halteres','kettlebell','terra','stiff']
    const MAQUINA   = ['leg press','cadeira','mesa','voador','peck','crossover','pulldown','hack']
    const MULTI_EX  = ['agachamento','supino','levantamento','terra','remada','barra','desenvolvimento','leg press','hack','stiff','avanço','afundo','paralelas','mergulho']
    const ISOL_EX   = ['curl','rosca','extensão','crucifixo','voador','pulldown','puxada','tríceps','bíceps','panturrilha','elevação lateral','elevação frontal','face pull']

    const chk   = (name, list) => list.some(k => (name||'').toLowerCase().includes(k))
    const group = (name) => { const n=(name||'').toLowerCase(); for(const[k,g] of Object.entries(MUSCLE_MAP)){if(n.includes(k))return g}; return null }

    // ── Faixas de referência por objetivo e nível ────────────────────────────
    const REF_REPS = {
      'Força e Performance':  { min:1,  max:6,  label:'1–6 reps (força máxima)' },
      'Ganho de Massa':       { min:6,  max:15, label:'6–15 reps (hipertrofia)' },
      'Emagrecimento':        { min:12, max:20, label:'12–20 reps (resistência metabólica)' },
      'Condicionamento':      { min:12, max:20, label:'12–20 reps (resistência)' },
      'Saúde e Bem-Estar':    { min:10, max:15, label:'10–15 reps (saúde geral)' },
    }
    const REF_SETS = {
      'Força e Performance':  [3,6],
      'Ganho de Massa':       [3,5],
      'Emagrecimento':        [2,4],
      'Condicionamento':      [2,4],
      'Saúde e Bem-Estar':    [2,4],
    }
    const REF_REST = {
      'Força e Performance':  { min:120, max:300, label:'2min–5min' },
      'Ganho de Massa':       { min:60,  max:120, label:'1min–2min' },
      'Emagrecimento':        { min:30,  max:60,  label:'30s–1min'  },
      'Condicionamento':      { min:30,  max:90,  label:'30s–1min30s' },
      'Saúde e Bem-Estar':    { min:45,  max:90,  label:'45s–1min30s' },
    }
    const refReps = REF_REPS[goal] || { min:8, max:15, label:'8–15 reps' }
    const refSets = REF_SETS[goal] || [2,5]
    const refRest = REF_REST[goal] || { min:45, max:120, label:'45s–2min' }

    const parseRest = (r) => {
      if (!r) return null
      const s = String(r).trim().toLowerCase()
      const minSec = s.match(/^(\d+(?:\.\d+)?)\s*min\s*(\d+)\s*s?$/)
      if (minSec) return Math.round(+minSec[1]*60 + +minSec[2])
      const col = s.match(/^(\d+):(\d{2})$/)
      if (col) return +col[1]*60 + +col[2]
      const minOnly = s.match(/^(\d+(?:\.\d+)?)\s*min$/)
      if (minOnly) return Math.round(+minOnly[1]*60)
      const secOnly = s.match(/^(\d+)\s*s?$/)
      if (secOnly) return +secOnly[1]
      return null
    }
    const fmtSec = (s) => s >= 60 ? Math.floor(s/60)+'min'+(s%60?s%60+'s':'') : s+'s'
    const parseRepsRange = (r) => {
      if (!r) return null
      const m = String(r).match(/^(\d+)(?:[–-](\d+))?/)
      if (!m) return null
      return m[2] ? { min:+m[1], max:+m[2] } : { min:+m[1], max:+m[1] }
    }

    // ── Volume por grupo muscular (semana inteira) ────────────────────────────
    const setsByGroup = {}
    days.forEach(d => {
      ;(d.exercises||[]).forEach(ex => {
        const g = group(ex.name)
        if (g) setsByGroup[g] = (setsByGroup[g]||0) + (+(ex.sets)||0)
      })
    })
    const REF_VOL = { 'Iniciante':{min:10,max:15},'Intermediário':{min:12,max:18},'Avançado':{min:16,max:22},'Atleta Jovem':{min:12,max:20},'Atleta Competitivo':{min:18,max:25} }
    const refVol = REF_VOL[nivel] || REF_VOL['Iniciante']

    // ── Overlap muscular entre dias consecutivos ──────────────────────────────
    const DIA_JS = {Dom:0,Seg:1,Ter:2,Qua:3,Qui:4,Sex:5,Sáb:6}
    const daysSorted = [...days].sort((a,b) => (DIA_JS[a.day_of_week]||0) - (DIA_JS[b.day_of_week]||0))

    const overlapMap = {} // { dayId: [overlapping muscle groups] }
    for (let i=1; i<daysSorted.length; i++) {
      const prev = daysSorted[i-1], curr = daysSorted[i]
      const prevDayJs = DIA_JS[prev.day_of_week], currDayJs = DIA_JS[curr.day_of_week]
      if (currDayJs - prevDayJs === 1) { // dias consecutivos
        const prevGroups = new Set((prev.exercises||[]).map(e=>group(e.name)).filter(Boolean))
        const currGroups = (curr.exercises||[]).map(e=>group(e.name)).filter(Boolean)
        const overlap = currGroups.filter(g => prevGroups.has(g))
        if (overlap.length) overlapMap[curr.id] = overlap
      }
    }

    // ── Análise global de empurrar/puxar ─────────────────────────────────────
    let totalEmpurrar = 0, totalPuxar = 0
    days.forEach(d => {
      ;(d.exercises||[]).forEach(ex => {
        if (chk(ex.name, EMPURRAR)) totalEmpurrar += +(ex.sets||0)
        if (chk(ex.name, PUXAR))    totalPuxar    += +(ex.sets||0)
      })
    })
    const razaoPP = totalPuxar && totalEmpurrar ? totalPuxar/totalEmpurrar : null

    // ── Análise por dia ───────────────────────────────────────────────────────
    const dayResults = {}
    days.forEach(d => {
      const exs    = d.exercises || []
      const issues = []
      const exFields = {}

      if (!exs.length) {
        dayResults[d.id] = { status:'atencao', issues:[{ type:'atencao', msg:'Nenhum exercício cadastrado neste dia.' }], exFields:{} }
        return
      }

      // ── 1. ORDEM: multiarticulares antes de isolados ─────────────────────
      const firstMulti = exs.findIndex(e => chk(e.name, MULTI_EX))
      const firstIsol  = exs.findIndex(e => chk(e.name, ISOL_EX))
      const ordemErrada = firstIsol !== -1 && firstMulti !== -1 && firstIsol < firstMulti
      if (ordemErrada) {
        issues.push({ type:'critico', msg:`Ordem incorreta: exercícios isolados aparecem antes dos multiarticulares. Comece sempre por agachamento, supino, terra e similares — eles recrutam mais fibras e exigem maior foco neural.` })
      }

      // ── 2. PESOS LIVRES antes de máquinas (quando possível) ─────────────
      const firstLivre   = exs.findIndex(e => chk(e.name, LIVRE))
      const firstMaquina = exs.findIndex(e => chk(e.name, MAQUINA))
      if (firstLivre !== -1 && firstMaquina !== -1 && firstLivre > firstMaquina) {
        issues.push({ type:'atencao', msg:`Pesos livres aparecem depois das máquinas. O ideal é usar pesos livres (barra, halteres) primeiro — eles exigem mais estabilização e devem ser feitos quando há mais energia.` })
      }

      // ── 3. EMPURRAR × PUXAR no dia (para dias de corpo inteiro) ─────────
      const empDia = exs.filter(e => chk(e.name, EMPURRAR)).length
      const puxDia = exs.filter(e => chk(e.name, PUXAR)).length
      if (empDia >= 2 && puxDia === 0) {
        issues.push({ type:'atencao', msg:`Desequilíbrio muscular: ${empDia} exercícios de empurrar e nenhum de puxar. Inclua uma remada ou puxada para equilibrar ombros e prevenir lesões posturais.` })
      }
      if (puxDia >= 2 && empDia === 0) {
        issues.push({ type:'atencao', msg:`Desequilíbrio muscular: ${puxDia} exercícios de puxar e nenhum de empurrar. Inclua um supino ou desenvolvimento para equilibrar.` })
      }

      // ── 4. JOELHO × QUADRIL (dias de lower) ─────────────────────────────
      const joelhoDia = exs.filter(e => chk(e.name, JOELHO)).length
      const quadrilDia = exs.filter(e => chk(e.name, QUADRIL)).length
      if (joelhoDia >= 2 && quadrilDia === 0) {
        issues.push({ type:'atencao', msg:`Muitos exercícios dominantes de joelho (agachamento, leg press) sem nenhum dominante de quadril (stiff, terra, flexora). Inclua 1–2 exercícios para posterior de coxa e glúteo.` })
      }

      // ── 5. OVERLAP MUSCULAR com dia anterior ────────────────────────────
      if (overlapMap[d.id]) {
        const g = overlapMap[d.id].join(', ')
        issues.push({ type:'atencao', msg:`Recuperação insuficiente: ${g} também foi treinado ontem. Músculo precisa de 48h para se recuperar — considere reorganizar os dias.` })
      }

      // ── 6. ADEQUAÇÃO AO NÍVEL ────────────────────────────────────────────
      const livresNoDia = exs.filter(e => chk(e.name, LIVRE))
      if ((nivel === 'Iniciante') && livresNoDia.length >= 3) {
        issues.push({ type:'atencao', msg:`Iniciante com ${livresNoDia.length} exercícios com pesos livres num mesmo dia. Para iniciantes, priorize máquinas e movimentos guiados nos primeiros meses — reduz risco de lesão por técnica incorreta.` })
      }
      if (age && age < 16 && exs.some(e => chk(e.name,['terra','agachamento livre','barra']))) {
        issues.push({ type:'atencao', msg:`Adolescente em desenvolvimento: exercícios com carga axial pesada (terra, agachamento com barra) devem ser supervisionados com atenção. Priorize técnica e cargas submáximas.` })
      }

      // ── Por exercício ────────────────────────────────────────────────────
      exs.forEach((ex, i) => {
        const s       = +(ex.sets||0)
        const restSec = parseRest(ex.rest)
        const repsR   = parseRepsRange(ex.reps)
        const grp     = group(ex.name)
        const fields  = {}

        // Sets
        if (!ex.sets || s===0) {
          fields.sets = { status:'atencao', msg:`Defina o número de séries. Para ${goal||'este objetivo'}: ${refSets[0]}–${refSets[1]} séries.` }
          issues.push({ type:'atencao', msg:`${ex.name||'Exercício'}: séries não definidas.` })
        } else if (s < refSets[0]) {
          fields.sets = { status:'atencao', msg:`${s} série${s>1?'s':''} — abaixo do ideal. Para ${goal||'este objetivo'}, use ${refSets[0]}–${refSets[1]} séries.` }
          issues.push({ type:'atencao', msg:`${ex.name}: ${s} séries — abaixo do ideal para ${goal||'o objetivo'}.` })
        } else if (s > refSets[1]) {
          fields.sets = { status:'atencao', msg:`${s} séries — acima do ideal. Reduza para ${refSets[1]} séries e prefira aumentar a intensidade (carga).` }
        } else {
          fields.sets = { status:'ok', msg:`${s} séries — correto para ${goal||'o objetivo'}.` }
        }

        // Reps × objetivo
        if (!ex.reps) {
          fields.reps = { status:'atencao', msg:`Reps não definidas. Recomendado: ${refReps.label}.` }
          issues.push({ type:'atencao', msg:`${ex.name||'Exercício'}: repetições não definidas.` })
        } else if (repsR) {
          const repMid = (repsR.min + repsR.max) / 2
          if (repMid < refReps.min - 2) {
            fields.reps = { status:'atencao', msg:`${ex.reps} reps — baixo para ${goal}. Carga muito pesada pode ser força pura, não ${goal}. Ideal: ${refReps.label}.` }
            issues.push({ type:'atencao', msg:`${ex.name}: ${ex.reps} reps — fora da faixa ideal para ${goal} (${refReps.label}).` })
          } else if (repMid > refReps.max + 2) {
            fields.reps = { status:'atencao', msg:`${ex.reps} reps — alto para ${goal}. Carga muito leve gera pouca tensão mecânica. Ideal: ${refReps.label}.` }
            issues.push({ type:'atencao', msg:`${ex.name}: ${ex.reps} reps — acima da faixa ideal para ${goal} (${refReps.label}).` })
          } else {
            fields.reps = { status:'ok', msg:`${ex.reps} reps — dentro da faixa para ${goal}.` }
          }
        } else {
          fields.reps = { status:'ok', msg:'Preenchido.' }
        }

        // Descanso
        if (!restSec) {
          fields.rest = { status:'atencao', msg:`Descanso não definido. Para ${goal||'este objetivo'}: ${refRest.label}.` }
          issues.push({ type:'atencao', msg:`${ex.name||'Exercício'}: descanso não definido.` })
        } else if (restSec < refRest.min) {
          fields.rest = { status:'atencao', msg:`${fmtSec(restSec)} de descanso — curto demais para ${goal}. Aumente para ${refRest.label} para garantir recuperação entre séries.` }
          issues.push({ type:'atencao', msg:`${ex.name}: descanso de ${fmtSec(restSec)} — curto para ${goal} (ideal: ${refRest.label}).` })
        } else if (restSec > refRest.max) {
          fields.rest = { status:'atencao', msg:`${fmtSec(restSec)} — descanso longo. Para ${goal}, o ideal é ${refRest.label}. Descanso longo demais reduz o estímulo metabólico.` }
          issues.push({ type:'atencao', msg:`${ex.name}: descanso de ${fmtSec(restSec)} — longo para ${goal} (ideal: ${refRest.label}).` })
        } else {
          fields.rest = { status:'ok', msg:`${fmtSec(restSec)} — adequado para ${goal}.` }
        }

        // Ordem
        if (ordemErrada && chk(ex.name, ISOL_EX) && (firstMulti===-1 || i<firstMulti)) {
          fields.order = { status:'critico', msg:`Este exercício isolado está antes dos multiarticulares. Mova-o para depois de agachamento, supino ou terra.` }
        }

        // Volume do grupo muscular (semanal)
        if (grp && setsByGroup[grp]) {
          const vs = setsByGroup[grp]
          if (vs < refVol.min) {
            if (!fields.volume) fields.volume = { status:'atencao', msg:`${grp} com ${vs} sets/semana — abaixo do mínimo (${refVol.min}–${refVol.max} sets). Adicione mais volume para este grupo.` }
          } else if (vs > refVol.max) {
            if (!fields.volume) fields.volume = { status:'atencao', msg:`${grp} com ${vs} sets/semana — alto (máx recomendado: ${refVol.max} sets). Risco de overreaching — redistribua em mais dias ou reduza séries.` }
          } else {
            if (!fields.volume) fields.volume = { status:'ok', msg:`${grp}: ${vs} sets/semana — volume adequado.` }
          }
        }

        const hasC = Object.values(fields).some(f=>f.status==='critico')
        const hasA = Object.values(fields).some(f=>f.status==='atencao')
        fields.overall = hasC ? 'critico' : hasA ? 'atencao' : 'ok'
        exFields[ex.id] = fields
      })

      // ── 7. COERÊNCIA COM OBJETIVO (nível de plano) ───────────────────────
      if (goal === 'Emagrecimento') {
        const avgSets = exs.reduce((a,e)=>a+(+(e.sets)||0),0) / exs.length
        if (avgSets > 5) issues.push({ type:'atencao', msg:`Para Emagrecimento, muitas séries por exercício reduzem a densidade do treino. Prefira mais exercícios com menos séries (circuito ou supersets).` })
      }
      if (goal === 'Força e Performance') {
        const temIsol = exs.some(e => chk(e.name, ISOL_EX))
        const temMulti = exs.some(e => chk(e.name, MULTI_EX))
        if (temIsol && !temMulti) issues.push({ type:'atencao', msg:`Dia com apenas exercícios isolados — para Força e Performance, multiarticulares são essenciais (agachamento, terra, supino, remada).` })
      }

      // ── 8. BALANÇO EMPURRAR/PUXAR semanal ───────────────────────────────
      if (d.id === days[0].id && razaoPP !== null) {
        if (razaoPP < 0.7) {
          issues.push({ type:'atencao', msg:`No plano inteiro: muito mais volume de empurrar (${totalEmpurrar} sets) do que puxar (${totalPuxar} sets). Desequilíbrio crônico causa postura cifótica e lesão de ombro. Adicione mais remadas e puxadas.` })
        } else if (razaoPP > 1.5) {
          issues.push({ type:'atencao', msg:`No plano inteiro: muito mais volume de puxar (${totalPuxar} sets) do que empurrar (${totalEmpurrar} sets). Adicione supino, desenvolvimento ou flexões para equilibrar.` })
        }
      }

      const hasC = issues.some(i=>i.type==='critico')
      const hasA = issues.some(i=>i.type==='atencao')
      dayResults[d.id] = {
        status: hasC ? 'critico' : hasA ? 'atencao' : 'ok',
        issues,
        exFields,
      }
    })

    return dayResults
  })()

    const deletePlan = async () => {
    if (!window.confirm('Excluir este plano de treino? Todos os dias e exercícios serão removidos permanentemente.')) return
    setSaving(true)
    // Delete exercises first, then days, then plan
    const dayIds = days.map(d => d.id)
    if (dayIds.length > 0) {
      await supabase.from('exercises').delete().in('workout_day_id', dayIds)
      await supabase.from('workout_days').delete().in('id', dayIds)
    }
    await supabase.from('workout_plans').delete().eq('id', planId)
    navigate('student-detail', { id: studentId })
  }

  const addDay = async () => {
    const name = 'Treino ' + String.fromCharCode(65 + days.length)
    const { data } = await supabase.from('workout_days').insert([{ plan_id:planId, name, focus:'', day_of_week:'', order_index:days.length }]).select().single()
    if (data) setDays(d => [...d, { ...data, exercises:[] }])
  }

  const updateDay = async (dayId, field, val) => {
    setDays(d => d.map(day => day.id === dayId ? { ...day, [field]:val } : day))
    await supabase.from('workout_days').update({ [field]:val }).eq('id', dayId)
  }

  const deleteDay = async (dayId) => {
    if (!confirm('Excluir este dia de treino e todos os exercícios?')) return
    await supabase.from('workout_days').delete().eq('id', dayId)
    setDays(d => d.filter(day => day.id !== dayId))
  }

  const addExercise = async (dayId, exData) => {
    const form = exData || (newExForms[dayId] || { ...emptyEx })
    if (!form.name?.trim()) return
    const { data } = await supabase.from('exercises').insert([{
      day_id:dayId, name:form.name, sets:form.sets, reps:form.reps,
      rest:form.rest, tip:form.tip||'', type:form.type,
      order_index:(days.find(d => d.id === dayId)?.exercises?.length || 0),
    }]).select().single()
    if (data) {
      setDays(d => d.map(day => day.id === dayId ? { ...day, exercises:[...day.exercises, data] } : day))
      if (!exData) setNewExForms(f => ({ ...f, [dayId]:{ ...emptyEx } }))
    }
  }

  const updateExercise = async (dayId, exId, field, val) => {
    setDays(d => d.map(day => day.id === dayId
      ? { ...day, exercises:day.exercises.map(ex => ex.id === exId ? { ...ex, [field]:val } : ex) }
      : day))
    await supabase.from('exercises').update({ [field]:val }).eq('id', exId)
  }

  const deleteExercise = async (dayId, exId) => {
    await supabase.from('exercises').delete().eq('id', exId)
    setDays(d => d.map(day => day.id === dayId ? { ...day, exercises:day.exercises.filter(ex => ex.id !== exId) } : day))
  }

  const applyTemplate = async (tpl) => {
    setShowTemplate(false)
    for (const day of days) await supabase.from('workout_days').delete().eq('id', day.id)
    setDays([])
    for (let i = 0; i < tpl.days.length; i++) {
      const td = tpl.days[i]
      const { data:newDay } = await supabase.from('workout_days').insert([{
        plan_id:planId, name:td.name, focus:td.focus, day_of_week:td.day_of_week, order_index:i,
      }]).select().single()
      if (newDay) {
        const exInserts = td.exercises.map((ex, j) => ({ day_id:newDay.id, name:ex.name, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip||'', type:ex.type, order_index:j }))
        const { data:exData } = await supabase.from('exercises').insert(exInserts).select()
        setDays(d => [...d, { ...newDay, exercises:(exData||[]).sort((a,b) => a.order_index - b.order_index) }])
      }
    }
  }

  const getNewExForm  = (dayId) => newExForms[dayId] || { ...emptyEx }
  const setNewExField = (dayId, field, val) => setNewExForms(f => ({ ...f, [dayId]:{ ...getNewExForm(dayId), [field]:val } }))

  if (loading) return (
    <div style={{ minHeight:'100vh', background:V.bgSolid, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:14, color:V.accent, fontWeight:700, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        Carregando treino...
      </div>
    </div>
  )
  if (!plan) return null

  const ageColor = AGE_GROUP_COLOR[ageGroup]
  const ageRestr = AGE_RESTRICTIONS[ageGroup]

  return (
    <div style={{ minHeight:'100vh', background:V.bgSolid, position:'relative', fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── Fundo SVG vestiário — inline, zero requisição de rede ── */}
      <div
        style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}
        dangerouslySetInnerHTML={{ __html: LOCKER_SVG }}
      />

      {/* ── Overlay âmbar sutil para legibilidade ── */}
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', background:'rgba(6,4,0,0.68)' }} />

      {/* ── Conteúdo ── */}
      <div style={{ position:'relative', zIndex:2, padding:'24px 20px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          {/* Voltar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <button
              style={{ background:'none', border:'none', color:V.accentDim, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', fontWeight:600 }}
              onClick={() => navigate('student-detail', { id:studentId })}>
              ← Voltar ao Aluno
            </button>
            <button onClick={deletePlan} disabled={saving}
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'6px 14px', color:'#F87171', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
              🗑 Excluir Plano
            </button>
          </div>

          {/* ── Header do plano ── */}
          <div style={{ background:V.bgCard, borderRadius:16, padding:20, border:`1px solid ${V.border}`, marginBottom:20, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', backdropFilter:'blur(8px)' }}>
            <input
              style={{ ...ss.input, flex:2, fontSize:18, fontWeight:700, minWidth:180 }}
              value={plan.title}
              onChange={e => setPlan(p => ({ ...p, title:e.target.value }))}
              onBlur={savePlanTitle}
              placeholder="Nome do plano..."
            />
            <select style={{ ...ss.input, fontSize:13 }} value={plan.status} onChange={e => { const v=e.target.value; setPlan(p => ({ ...p, status:v })); saveStatus(v) }}>
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
            </select>
            {student && (
              <div style={{ display:'flex', alignItems:'center', gap:6, background:`${ageColor}15`, border:`1px solid ${ageColor}30`, borderRadius:8, padding:'6px 12px' }}>
                <span style={{ fontSize:11, color:ageColor, fontWeight:700 }}>
                  {student.name} · {AGE_GROUP_LABEL[ageGroup]}
                </span>
              </div>
            )}
            <button onClick={() => setSemAcademia(v => !v)}
              style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${semAcademia ? '#34D39940' : V.border}`, background: semAcademia ? 'rgba(52,211,153,0.1)' : V.accentFaint, color: semAcademia ? '#34D399' : V.textSub, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {semAcademia ? '🏠 Sem academia' : '🏋️ Com academia'}
            </button>
            <button onClick={() => setShowTemplate(true)} style={{ ...ss.btn(V.accent), display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              ⚡ Gerar Estrutura
            </button>
            <button onClick={() => setShowAval(v => !v)}
              style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, border: showAval ? '1.5px solid #34D399' : `1px solid ${V.border}`, background: showAval ? 'rgba(52,211,153,0.12)' : V.accentFaint, color: showAval ? '#34D399' : V.textSub, transition:'all 0.2s' }}>
              {showAval ? '✓ Avaliando' : '🔍 Avaliar Plano'}
            </button>
            <div style={{ fontSize:11, color:V.textMuted }}>
              {saving ? <span style={{ color:V.accentBr }}>Salvando...</span> : 'Salvo automaticamente'}
            </div>
          </div>

          {/* Warning de faixa etária */}
          {ageRestr?.warning && (
            <div style={{ background:'rgba(217,119,6,0.07)', border:`1px solid rgba(217,119,6,0.2)`, borderRadius:12, padding:'10px 16px', fontSize:13, color:V.accentBr, marginBottom:16, backdropFilter:'blur(4px)' }}>
              ⚠️ {ageRestr.warning}
            </div>
          )}

          {/* Legenda tipos */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {NEW_TYPES.map(t => {
              const c = getTypeColor(t)
              return (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:c+'12', border:`1px solid ${c}30` }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:c }} />
                  <span style={{ fontSize:10, color:c, fontWeight:700 }}>{t}</span>
                </div>
              )
            })}
          </div>

          {/* ── Dias de treino ── */}
          {days.map((day, idx) => {
            const color  = DAY_COLORS[idx % DAY_COLORS.length]
            const newEx  = getNewExForm(day.id)
            return (
              <div key={day.id} style={{ background:V.bgCard, borderRadius:16, border:`1px solid ${color}30`, overflow:'hidden', marginBottom:14, backdropFilter:'blur(8px)' }}>

                {/* Header do dia */}
                <div style={{ background:`${color}10`, padding:'14px 20px', borderBottom:`1px solid ${color}22`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flex:1, flexWrap:'wrap' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }} />
                    <input
                      style={{ ...ss.input, fontWeight:700, color, background:'transparent', border:'none', fontSize:15, minWidth:80, padding:'4px 0' }}
                      value={day.name}
                      onChange={e => updateDay(day.id, 'name', e.target.value)}
                      placeholder="Nome do treino"
                    />
                    <span style={{ color:V.textDim }}>—</span>
                    <input
                      style={{ ...ss.input, fontSize:13, flex:1, minWidth:100 }}
                      value={day.focus||''}
                      onChange={e => updateDay(day.id, 'focus', e.target.value)}
                      placeholder="Foco (ex: Inferior + Core)"
                    />
                    <select style={{ ...ss.input, fontSize:12, maxWidth:90 }} value={day.day_of_week||''} onChange={e => updateDay(day.id, 'day_of_week', e.target.value)}>
                      <option value="">Dia...</option>
                      {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  {showAval && avalAnalysis[day.id] && (
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {avalAnalysis[day.id].status === 'ok' && (
                        <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:20, background:'rgba(52,211,153,0.15)', color:'#34D399', border:'1px solid rgba(52,211,153,0.3)' }}>✓ OK</span>
                      )}
                      {avalAnalysis[day.id].status === 'atencao' && (
                        <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:20, background:'rgba(251,191,36,0.15)', color:'#FBBF24', border:'1px solid rgba(251,191,36,0.3)' }}>⚠ Atenção</span>
                      )}
                      {avalAnalysis[day.id].status === 'critico' && (
                        <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:20, background:'rgba(248,113,113,0.15)', color:'#F87171', border:'1px solid rgba(248,113,113,0.3)' }}>✕ Crítico</span>
                      )}
                    </div>
                  )}
                  <button style={ss.delBtn} onClick={() => deleteDay(day.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity:0.35 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>

                {/* Lista de exercícios */}
                {day.exercises.length > 0 && (
                  <div style={{ padding:'4px 0' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:8, padding:'6px 16px 2px', borderBottom:`1px solid rgba(255,255,255,0.03)` }}>
                      {['Exercício','Tipo','Séries','Reps','Desc.'].map(h => (
                        <div key={h} style={{ fontSize:9, color:V.textDim, textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
                      ))}
                    </div>
                    {day.exercises.map(ex => {
                      const tc = getTypeColor(ex.type)
                      const exFields  = showAval ? (avalAnalysis[day.id]?.exFields?.[ex.id]) : null
                      const exOverall = exFields?.overall
                      const SEM = {
                        ok:      { bg:'rgba(52,211,153,0.13)',  color:'#34D399', border:'1px solid rgba(52,211,153,0.35)',  dot:'#34D399' },
                        atencao: { bg:'rgba(251,191,36,0.13)',  color:'#FBBF24', border:'1px solid rgba(251,191,36,0.35)',  dot:'#FBBF24' },
                        critico: { bg:'rgba(248,113,113,0.13)', color:'#F87171', border:'1px solid rgba(248,113,113,0.35)', dot:'#F87171' },
                      }
                      const fieldTag = (field) => {
                        if (!exFields || !exFields[field]) return null
                        const f = exFields[field]
                        const st = SEM[f.status]
                        return (
                          <span title={f.msg} style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:8, background:st.bg, color:st.color, border:st.border, cursor:'help', flexShrink:0, whiteSpace:'nowrap' }}>
                            {f.status==='ok' ? '✓' : f.status==='atencao' ? '⚠' : '✕'}
                          </span>
                        )
                      }
                      // Collect active warnings for this exercise
                      const exAlerts = !showAval || !exFields ? [] : [
                        exFields.order && exFields.order.status !== 'ok' ? { field:'Ordem', ...exFields.order } : null,
                        exFields.sets  && exFields.sets.status  !== 'ok' ? { field:'Séries', ...exFields.sets   } : null,
                        exFields.rest  && exFields.rest.status  !== 'ok' ? { field:'Descanso', ...exFields.rest } : null,
                        exFields.reps  && exFields.reps.status  !== 'ok' ? { field:'Reps', ...exFields.reps     } : null,
                      ].filter(Boolean)

                      return (
                        <div key={ex.id} style={{ borderLeft: exOverall && exOverall!=='ok' ? `3px solid ${SEM[exOverall]?.dot}` : '3px solid transparent' }}>
                          <div style={{ padding:'10px 16px', borderBottom:`1px solid rgba(255,255,255,0.03)`, display:'flex', gap:8, alignItems:'flex-start' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:4 }}>
                                <span style={{ fontSize:9, background:`${tc}18`, color:tc, border:`1px solid ${tc}35`, borderRadius:10, padding:'1px 6px', fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>{ex.type}</span>
                                <input style={{ ...ss.smallInput, fontWeight:600, flex:1 }} value={ex.name} onChange={e => updateExercise(day.id, ex.id, 'name', e.target.value)} placeholder="Nome" />
                                <button
                                  onClick={() => setOpenCalc(openCalc === ex.id ? null : ex.id)}
                                  style={{ background: openCalc===ex.id ? 'rgba(217,119,6,0.2)' : V.accentFaint, border:`1px solid ${openCalc===ex.id ? V.borderStrong : V.borderLight}`, borderRadius:6, padding:'4px 8px', color:V.accent, fontSize:10, cursor:'pointer', fontWeight:700, flexShrink:0, fontFamily:'inherit' }}>
                                  1RM
                                </button>
                                <button style={ss.delBtn} onClick={() => deleteExercise(day.id, ex.id)}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity:0.35 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                </button>
                              </div>
                              <input style={{ ...ss.smallInput, fontSize:11, color:V.textSub }} value={ex.tip||''} onChange={e => updateExercise(day.id, ex.id, 'tip', e.target.value)} placeholder="Dica de execução (opcional)" />
                              {/* ── Alert tags inline, below the name ── */}
                              {exAlerts.length > 0 && (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
                                  {exAlerts.map((al, ai) => {
                                    const col = al.status==='critico' ? '#F87171' : '#FBBF24'
                                    const bg  = al.status==='critico' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)'
                                    const brd = al.status==='critico' ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'
                                    return (
                                      <span key={ai} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:8, background:bg, color:col, border:`1px solid ${brd}`, whiteSpace:'nowrap' }}>
                                        <span>{al.status==='critico' ? '✕' : '⚠'}</span>
                                        <span>{al.field}: {al.msg}</span>
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <select style={{ ...ss.smallInput, width:110, flexShrink:0 }} value={ex.type||''} onChange={e => updateExercise(day.id, ex.id, 'type', e.target.value)}>
                              <optgroup label="— Musculação">
                                {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
                              </optgroup>
                              <optgroup label="— Funcional / Casa">
                                {NEW_TYPES.map(t => <option key={t}>{t}</option>)}
                              </optgroup>
                            </select>
                            {[['sets','3'],['reps','10-12'],['rest','60s']].map(([field, ph]) => {
                              const fData = exFields?.[field]
                              const fcol = fData?.status==='critico' ? '#F87171' : fData?.status==='atencao' ? '#FBBF24' : 'transparent'
                              return (
                                <div key={field} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
                                  <input style={{ ...ss.smallInput, width:58, outline: fData && fData.status!=='ok' ? `1.5px solid ${fcol}` : 'none' }} value={ex[field]||''} onChange={e => updateExercise(day.id, ex.id, field, e.target.value)} placeholder={ph} />
                                </div>
                              )
                            })}
                          </div>
                          {openCalc === ex.id && (
                            <div style={{ padding:'0 16px 4px' }}>
                              <OneRMCalc
                                ageGroup={ageGroup}
                                onApply={({ reps, rest }) => { updateExercise(day.id, ex.id, 'reps', reps); updateExercise(day.id, ex.id, 'rest', rest); setOpenCalc(null) }}
                                onClose={() => setOpenCalc(null)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              {showAval && avalAnalysis[day.id]?.issues?.length > 0 && (
                <div style={{ padding:'10px 16px', background:'rgba(0,0,0,0.2)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  {avalAnalysis[day.id].issues.map((issue, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', fontSize:11, color: issue.type==='critico' ? '#F87171' : '#FBBF24' }}>
                      <span>{issue.type==='critico' ? '✕' : '⚠'}</span>
                      <span>{issue.msg}</span>
                    </div>
                  ))}
                </div>
              )}

                {/* Adicionar exercício */}
                <div style={{ padding:'16px 20px', background:'rgba(217,119,6,0.02)' }}>
                  <div style={{ fontSize:10, color:V.textDim, marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>Adicionar Exercício</div>

                  <ExerciseSearch
                    onSelect={ex => setNewExForms(f => ({ ...f, [day.id]:{ name:ex.name, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip, type:ex.type } }))}
                    suggestedTypes={suggestedTypes}
                    ageGroup={ageGroup}
                  />

                  <NoEquipmentSection onAddExercise={(ex) => addExercise(day.id, ex)} />

                  {/* Formulário manual */}
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:9, color:V.textDim, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Ou adicionar manualmente</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 58px 58px 58px', gap:6, marginBottom:8 }}>
                      <input style={ss.smallInput} value={newEx.name} onChange={e => setNewExField(day.id, 'name', e.target.value)} placeholder="Nome do exercício *" />
                      <select style={ss.smallInput} value={newEx.type} onChange={e => setNewExField(day.id, 'type', e.target.value)}>
                        <optgroup label="— Musculação">
                          {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </optgroup>
                        <optgroup label="— Funcional / Casa">
                          {NEW_TYPES.map(t => <option key={t}>{t}</option>)}
                        </optgroup>
                      </select>
                      <input style={ss.smallInput} value={newEx.sets} onChange={e => setNewExField(day.id, 'sets', e.target.value)} placeholder="3" />
                      <input style={ss.smallInput} value={newEx.reps} onChange={e => setNewExField(day.id, 'reps', e.target.value)} placeholder="10-12" />
                      <input style={ss.smallInput} value={newEx.rest} onChange={e => setNewExField(day.id, 'rest', e.target.value)} placeholder="60s" />
                    </div>
                    <input style={{ ...ss.smallInput, marginBottom:8, fontSize:11 }} value={newEx.tip} onChange={e => setNewExField(day.id, 'tip', e.target.value)} placeholder="Dica de execução (opcional)" />
                    <button style={{ ...ss.btn(color), fontFamily:'inherit' }} onClick={() => addExercise(day.id)}>+ Adicionar ao Treino</button>
                  </div>
                </div>

              </div>
            )
          })}

          <button
            style={{ ...ss.outlineBtn, width:'100%', padding:'16px', fontSize:14, borderStyle:'dashed', borderRadius:12, fontFamily:'inherit' }}
            onClick={addDay}>
            + Adicionar Dia de Treino
          </button>

          <div style={{ marginTop:12, textAlign:'center', fontSize:11, color:V.textDim }}>
            Alterações salvas automaticamente
          </div>

        </div>
      </div>

      {showTemplate && (
        <TemplateModal
          student={student}
          ageGroup={ageGroup}
          semAcademia={semAcademia}
          onApply={applyTemplate}
          onClose={() => setShowTemplate(false)}
        />
      )}

    </div>
  )
}
