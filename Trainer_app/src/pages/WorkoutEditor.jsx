import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── Constants ─────────────────────────────────────────────────────────────────
const MUSCLE_TYPES = [
  'Peito','Costas','Bíceps','Tríceps','Ombro',
  'Quadríceps','Posterior','Glúteo','Panturrilha','Core','Cardio','Full Body',
]
const NEW_TYPES = ['Funcional','Elástico','Peso Corporal','Mobilidade']
const EXERCISE_TYPES = [...MUSCLE_TYPES, ...NEW_TYPES]

// Modalidade → quais tipos pertencem a ela
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
const DAY_COLORS     = ['#00C9FF','#FF6B6B','#A78BFA','#FBBF24','#34D399','#F97316']
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
  adulto_jovem:'#A78BFA', adulto_maduro:'#FBBF24', idoso:'#F97316',
}
const AGE_RESTRICTIONS = {
  crianca:      { maxPct:60,  warning:'Criança: sem carga máxima. Prescrever por PSE e peso corporal.',     blockedZones:['Força Máxima','Hipertrofia'] },
  adolescente:  { maxPct:70,  warning:'Adolescente: limitar a 70% 1RM durante fase de crescimento ósseo.', blockedZones:['Força Máxima'] },
  adulto_jovem: { maxPct:100, warning:null,                                                                 blockedZones:[] },
  adulto_maduro:{ maxPct:100, warning:'Adulto maduro: aumentar descanso entre séries (48-72h por grupo).', blockedZones:[] },
  idoso:        { maxPct:75,  warning:'60+: iniciar com 40-50% 1RM. Avaliação médica recomendada.',        blockedZones:['Força Máxima'] },
}
const ZONES = [
  { label:'Força Máxima',      pct:[85,100], reps:'1-5',   rest:'3-5min',  color:'#EF4444' },
  { label:'Hipertrofia',       pct:[65,85],  reps:'6-12',  rest:'60-120s', color:'#A78BFA' },
  { label:'Resistência Musc.', pct:[40,65],  reps:'15-30', rest:'30-60s',  color:'#34D399' },
]

// ── Exercise Bank ─────────────────────────────────────────────────────────────
const EXERCISE_BANK = [
  // ── Musculação ──────────────────────────────────────────────────────────────
  { name:'Supino Reto (Barra)',         type:'Peito',      sets:'4', reps:'8-10',    rest:'90s',  tip:'Escápulas retraídas, barra desce até o peito' },
  { name:'Supino Inclinado (Halter)',   type:'Peito',      sets:'3', reps:'10-12',   rest:'75s',  tip:'Ângulo de 30-45°, cotovelos a 45° do tronco' },
  { name:'Crucifixo (Halter)',          type:'Peito',      sets:'3', reps:'12-15',   rest:'60s',  tip:'Leve flexão dos cotovelos, amplitude controlada' },
  { name:'Peck Deck',                  type:'Peito',      sets:'3', reps:'12-15',   rest:'60s',  tip:'Adução horizontal controlada, sem hiperestender' },
  { name:'Barra Fixa',                 type:'Costas',     sets:'4', reps:'6-10',    rest:'90s',  tip:'Escápulas deprimidas na fase excêntrica' },
  { name:'Remada Curvada (Barra)',     type:'Costas',     sets:'4', reps:'8-10',    rest:'90s',  tip:'Tronco a 45°, cotovelos próximos ao corpo' },
  { name:'Puxada Frontal (Polia)',     type:'Costas',     sets:'3', reps:'10-12',   rest:'75s',  tip:'Puxar até a clavícula, não atrás da nuca' },
  { name:'Remada Baixa (Polia)',       type:'Costas',     sets:'3', reps:'10-12',   rest:'75s',  tip:'Peito ereto, escápulas se aproximam no final' },
  { name:'Remada Unilateral (Halter)', type:'Costas',     sets:'3', reps:'10-12',   rest:'60s',  tip:'Rotação mínima de quadril, cotovelo alto' },
  { name:'Remada TRX',                type:'Costas',     sets:'3', reps:'10-15',   rest:'60s',  tip:'Corpo em prancha, cotovelos passam o tronco' },
  { name:'Rosca Direta (Barra)',       type:'Bíceps',     sets:'3', reps:'10-12',   rest:'60s',  tip:'Cotovelos fixos ao lado do tronco' },
  { name:'Rosca Alternada (Halter)',   type:'Bíceps',     sets:'3', reps:'10-12',   rest:'60s',  tip:'Supinação completa no topo do movimento' },
  { name:'Rosca Martelo',             type:'Bíceps',     sets:'3', reps:'12-15',   rest:'60s',  tip:'Neutro, treina braquial e braquiorradial' },
  { name:'Rosca Scott',               type:'Bíceps',     sets:'3', reps:'10-12',   rest:'60s',  tip:'Isola o bíceps, evita compensação de ombro' },
  { name:'Tríceps Pulley (Polia)',     type:'Tríceps',    sets:'3', reps:'12-15',   rest:'60s',  tip:'Cotovelos fixos, extensão completa' },
  { name:'Tríceps Testa (Barra EZ)',   type:'Tríceps',    sets:'3', reps:'10-12',   rest:'60s',  tip:'Cotovelos apontados para o teto' },
  { name:'Tríceps Francês (Halter)',   type:'Tríceps',    sets:'3', reps:'12-15',   rest:'60s',  tip:'Controle na fase excêntrica' },
  { name:'Desenvolvimento (Halter)',   type:'Ombro',      sets:'4', reps:'10-12',   rest:'75s',  tip:'Cotovelos a 90° na posição inicial' },
  { name:'Elevação Lateral',          type:'Ombro',      sets:'3', reps:'12-15',   rest:'60s',  tip:'Leve flexão do cotovelo, evita trapézio' },
  { name:'Elevação Frontal',          type:'Ombro',      sets:'3', reps:'12-15',   rest:'60s',  tip:'Até a altura dos ombros, movimento lento' },
  { name:'Desenvolvimento Arnold',    type:'Ombro',      sets:'3', reps:'10-12',   rest:'75s',  tip:'Rotação completa, ativa todas as porções' },
  { name:'Agachamento Livre',         type:'Quadríceps', sets:'4', reps:'8-12',    rest:'90s',  tip:'Joelhos na linha dos pés, tronco ereto' },
  { name:'Agachamento Goblet',        type:'Quadríceps', sets:'3', reps:'12-15',   rest:'75s',  tip:'Ótimo para iniciantes e crianças' },
  { name:'Leg Press',                 type:'Quadríceps', sets:'4', reps:'10-15',   rest:'75s',  tip:'Não travar os joelhos na extensão' },
  { name:'Afundo (Lunge)',            type:'Quadríceps', sets:'3', reps:'10-12',   rest:'60s',  tip:'Joelho traseiro próximo ao chão, tronco ereto' },
  { name:'Cadeira Extensora',         type:'Quadríceps', sets:'3', reps:'12-15',   rest:'60s',  tip:'Extensão completa, fase excêntrica 3s' },
  { name:'Levantamento Terra',        type:'Posterior',  sets:'4', reps:'6-8',     rest:'120s', tip:'Barra sobre os pés, empurre o chão' },
  { name:'Mesa Flexora',              type:'Posterior',  sets:'3', reps:'10-12',   rest:'75s',  tip:'Quadril levemente inclinado, fase excêntrica lenta' },
  { name:'Stiff (Terra Romeno)',       type:'Posterior',  sets:'4', reps:'8-12',    rest:'90s',  tip:'Joelhos semiflexionados, barra próxima ao corpo' },
  { name:'Cadeira Flexora',           type:'Posterior',  sets:'3', reps:'12-15',   rest:'60s',  tip:'Evitar compensação de quadril' },
  { name:'Hip Thrust (Barra)',         type:'Glúteo',     sets:'4', reps:'10-12',   rest:'75s',  tip:'Queixo no peito, extensão completa de quadril' },
  { name:'Agachamento Sumô',          type:'Glúteo',     sets:'3', reps:'12-15',   rest:'75s',  tip:'Pés mais abertos, joelhos seguem os pés' },
  { name:'Panturrilha em Pé',         type:'Panturrilha',sets:'4', reps:'15-20',   rest:'45s',  tip:'Amplitude total, pausa no topo' },
  { name:'Panturrilha Sentado',       type:'Panturrilha',sets:'3', reps:'15-20',   rest:'45s',  tip:'Sóleo dominante, joelhos a 90°' },
  { name:'Prancha Frontal',           type:'Core',       sets:'3', reps:'30-60s',  rest:'45s',  tip:'Quadril neutro, não elevar o quadril' },
  { name:'Prancha Lateral',           type:'Core',       sets:'3', reps:'20-40s',  rest:'45s',  tip:'Corpo em linha reta, apoio no antebraço' },
  { name:'Abdominal Crunch',          type:'Core',       sets:'3', reps:'15-20',   rest:'45s',  tip:'Cervical neutra, foco na contração' },
  { name:'Dead Bug',                  type:'Core',       sets:'3', reps:'8-10',    rest:'45s',  tip:'Lombar no chão, extensão contralateral' },
  { name:'Pallof Press',              type:'Core',       sets:'3', reps:'10-12',   rest:'45s',  tip:'Resistência à rotação, excelente para esporte' },
  { name:'Rotação de Tronco',         type:'Core',       sets:'3', reps:'12-15',   rest:'45s',  tip:'Movimento controlado, não usar impulso' },
  { name:'Kettlebell Swing',          type:'Full Body',  sets:'4', reps:'12-15',   rest:'60s',  tip:'Impulsão de quadril, não é um agachamento' },
  { name:'Pular Corda',               type:'Cardio',     sets:'3', reps:'2-3min',  rest:'60s',  tip:'Pulos baixos, aterrissagem no antepé' },
  { name:'Corrida (Esteira)',         type:'Cardio',     sets:'1', reps:'20-40min',rest:'-',    tip:'PSE 3-5, conversa possível' },
  { name:'Bicicleta Ergométrica',     type:'Cardio',     sets:'1', reps:'20-40min',rest:'-',    tip:'RPM 70-90, resistência moderada' },

  // ── Funcional ───────────────────────────────────────────────────────────────
  { name:'Flexão de Braço',              type:'Funcional',    sets:'3', reps:'10-15',  rest:'60s',  tip:'Corpo rígido, peito toca o chão' },
  { name:'Flexão de Braço Declinada',    type:'Funcional',    sets:'3', reps:'10-12',  rest:'60s',  tip:'Pés elevados, ativa porção superior do peito' },
  { name:'Flexão de Braço Diamante',     type:'Funcional',    sets:'3', reps:'8-12',   rest:'60s',  tip:'Mãos formam diamante, foco no tríceps' },
  { name:'Flexão de Braço Arqueiro',     type:'Funcional',    sets:'3', reps:'6-8',    rest:'75s',  tip:'Progride para o unilateral — pistol de braço' },
  { name:'Burpee',                       type:'Funcional',    sets:'3', reps:'8-12',   rest:'90s',  tip:'Movimento completo, ritmo controlado' },
  { name:'Burpee com Salto',             type:'Funcional',    sets:'3', reps:'6-10',   rest:'90s',  tip:'Salto explosivo no topo, aterrissagem suave' },
  { name:'Mountain Climber',             type:'Funcional',    sets:'3', reps:'20-30',  rest:'45s',  tip:'Quadril estável, não rodar o tronco' },
  { name:'Abdominal Crunch',             type:'Funcional',    sets:'3', reps:'15-20',  rest:'45s',  tip:'Cervical neutra, foco na contração' },
  { name:'Abdominal Bicicleta',          type:'Funcional',    sets:'3', reps:'15-20',  rest:'45s',  tip:'Cotovelo toca o joelho oposto' },
  { name:'Abdominal V-Sit',              type:'Funcional',    sets:'3', reps:'10-15',  rest:'45s',  tip:'Suba simultâneo de tronco e pernas' },
  { name:'Abdominal Infra (Pernas)',     type:'Funcional',    sets:'3', reps:'15-20',  rest:'45s',  tip:'Lombar no chão, pernas sobem e descem' },
  { name:'Agachamento com Salto',        type:'Funcional',    sets:'3', reps:'8-10',   rest:'90s',  tip:'Aterrissagem suave com joelhos levemente flexionados' },
  { name:'Afundo com Salto (Lunge Jump)',type:'Funcional',    sets:'3', reps:'8-10',   rest:'90s',  tip:'Troca de perna no ar, explosão de quadríceps' },
  { name:'Step Up (Caixote/Escada)',     type:'Funcional',    sets:'3', reps:'10-12',  rest:'60s',  tip:'Empurrar pelo calcanhar do pé apoiado' },
  { name:'Corrida Lateral (Shuffle)',    type:'Funcional',    sets:'4', reps:'10-15m', rest:'60s',  tip:'Futebol: agilidade e mudança de direção' },
  { name:'Salto Vertical',              type:'Funcional',    sets:'4', reps:'6-8',    rest:'90s',  tip:'LTAD: desenvolve potência e coordenação' },
  { name:'Box Jump',                    type:'Funcional',    sets:'4', reps:'5-8',    rest:'90s',  tip:'Aterrissagem em flexão, absorção do impacto' },
  { name:'Bear Crawl',                  type:'Funcional',    sets:'3', reps:'20m',    rest:'60s',  tip:'Joelhos a 2cm do chão, core ativado' },
  { name:'Crab Walk',                   type:'Funcional',    sets:'3', reps:'15m',    rest:'60s',  tip:'Quadril elevado, ativa ombro e glúteo' },
  { name:'Inchworm',                    type:'Funcional',    sets:'3', reps:'8-10',   rest:'45s',  tip:'Caminhada de mãos, mantém pernas estendidas' },
  { name:'Polichinelo',                 type:'Funcional',    sets:'3', reps:'30-45s', rest:'30s',  tip:'Ritmo constante, ótimo para aquecimento' },
  { name:'Corrida no Lugar (High Knee)',  type:'Funcional',  sets:'3', reps:'30s',    rest:'30s',  tip:'Joelhos na altura do quadril, braços em ritmo' },
  { name:'Chute Alto (Kick)',            type:'Funcional',   sets:'3', reps:'12-15',  rest:'45s',  tip:'Alternado, mobilidade de quadril + equilíbrio' },

  // ── Elástico / Resistência ──────────────────────────────────────────────────
  { name:'Remada com Elástico',               type:'Elástico', sets:'3', reps:'12-15',  rest:'60s',  tip:'Elástico preso à frente, cotovelos passam o tronco' },
  { name:'Puxada com Elástico',               type:'Elástico', sets:'3', reps:'12-15',  rest:'60s',  tip:'Elástico preso acima, puxar para o peito' },
  { name:'Rosca Bíceps com Elástico',         type:'Elástico', sets:'3', reps:'12-15',  rest:'45s',  tip:'Pisar no elástico, supinação completa' },
  { name:'Extensão Tríceps com Elástico',     type:'Elástico', sets:'3', reps:'12-15',  rest:'45s',  tip:'Elástico preso acima, extensão completa' },
  { name:'Elevação Lateral com Elástico',     type:'Elástico', sets:'3', reps:'15-20',  rest:'45s',  tip:'Elástico sob os pés, cotovelos levemente flexionados' },
  { name:'Desenvolvimento Ombro (Elástico)',  type:'Elástico', sets:'3', reps:'12-15',  rest:'60s',  tip:'Pisar no elástico, empurrar acima da cabeça' },
  { name:'Agachamento com Elástico',          type:'Elástico', sets:'3', reps:'15-20',  rest:'60s',  tip:'Elástico sobre os ombros ou sob os pés' },
  { name:'Hip Thrust com Elástico',           type:'Elástico', sets:'3', reps:'15-20',  rest:'45s',  tip:'Elástico sobre os quadris, extensão completa' },
  { name:'Abdução de Quadril (Elástico)',     type:'Elástico', sets:'3', reps:'15-20',  rest:'45s',  tip:'Elástico nos joelhos, abre e fecha controlado' },
  { name:'Afundo com Elástico',               type:'Elástico', sets:'3', reps:'12',     rest:'60s',  tip:'Elástico sobre os ombros, postura ereta' },
  { name:'Flexão de Perna (Elástico)',        type:'Elástico', sets:'3', reps:'12-15',  rest:'45s',  tip:'Elástico preso atrás, flexão de joelho' },
  { name:'Glúteo 4 Apoios (Elástico)',        type:'Elástico', sets:'3', reps:'15-20',  rest:'45s',  tip:'Elástico no tornozelo, extensão controlada' },
  { name:'Rotação de Ombro (Elástico)',       type:'Elástico', sets:'3', reps:'15-20',  rest:'30s',  tip:'Reabilitação e prevenção — manguito rotador' },
  { name:'Chest Press com Elástico',          type:'Elástico', sets:'3', reps:'12-15',  rest:'60s',  tip:'Elástico preso atrás, extensão de cotovelos' },
  { name:'Crucifixo com Elástico',            type:'Elástico', sets:'3', reps:'12-15',  rest:'60s',  tip:'Elástico preso atrás, adução horizontal' },
  { name:'Pallof Press (Elástico)',           type:'Elástico', sets:'3', reps:'10-12',  rest:'45s',  tip:'Resistência à rotação, core antirotacional' },
  { name:'Agachamento Lateral (Elástico)',    type:'Elástico', sets:'3', reps:'12-15',  rest:'45s',  tip:'Elástico nos joelhos, passo lateral controlado' },

  // ── Peso Corporal ───────────────────────────────────────────────────────────
  { name:'Flexão de Braço Adaptada (Joelhos)',type:'Peso Corporal', sets:'3', reps:'10-15',  rest:'45s',  tip:'Apoio nos joelhos, progride para a completa' },
  { name:'Agachamento com Peso Corporal',     type:'Peso Corporal', sets:'3', reps:'15-20',  rest:'45s',  tip:'Sem carga, foco em técnica perfeita' },
  { name:'Agachamento Unilateral (Pistol)',   type:'Peso Corporal', sets:'3', reps:'5-8',    rest:'75s',  tip:'Nível avançado, mantém perna livre estendida' },
  { name:'Afundo (Peso Corporal)',            type:'Peso Corporal', sets:'3', reps:'12',     rest:'45s',  tip:'Tronco ereto, joelho traseiro quase no chão' },
  { name:'Elevação Pélvica (Glúteo Bridge)',  type:'Peso Corporal', sets:'3', reps:'20-25',  rest:'30s',  tip:'Extensão completa de quadril, glúteo contraído' },
  { name:'Glúteo 4 Apoios',                  type:'Peso Corporal', sets:'3', reps:'15-20',  rest:'30s',  tip:'Joelho a 90°, empurra o calcanhar para o teto' },
  { name:'Superman',                         type:'Peso Corporal', sets:'3', reps:'12-15',  rest:'30s',  tip:'Extensão simultânea de braço e perna opostos' },
  { name:'Equilíbrio Unipodal',              type:'Peso Corporal', sets:'3', reps:'20-30s', rest:'30s',  tip:'Olhos abertos depois fechados para progredir' },
  { name:'Prancha Frontal',                  type:'Peso Corporal', sets:'3', reps:'30-60s', rest:'45s',  tip:'Quadril neutro, respira normalmente' },
  { name:'Prancha Lateral',                  type:'Peso Corporal', sets:'3', reps:'20-40s', rest:'45s',  tip:'Corpo em linha reta, apoio no antebraço' },
  { name:'Prancha com Elevação de Braço',    type:'Peso Corporal', sets:'3', reps:'8-10',   rest:'45s',  tip:'Anti-rotação, core profundo' },
  { name:'Panturrilha em Pé (Corpo)',         type:'Peso Corporal', sets:'4', reps:'20-30',  rest:'30s',  tip:'Apoio em degrau para amplitude total' },
  { name:'Puxada Inverted Row',              type:'Peso Corporal', sets:'3', reps:'10-15',  rest:'60s',  tip:'Barra baixa, corpo inclinado — remada corporal' },
  { name:'Tríceps Banco (Dip)',              type:'Peso Corporal', sets:'3', reps:'10-15',  rest:'60s',  tip:'Apoio em cadeira ou banco, cotovelos atrás' },
  { name:'Abdominal com Elevação de Pernas', type:'Peso Corporal', sets:'3', reps:'15-20',  rest:'45s',  tip:'Lombar colada ao chão, pernas descem lento' },

  // ── Mobilidade / Alongamento ────────────────────────────────────────────────
  { name:'Gato-Vaca',                        type:'Mobilidade', sets:'2', reps:'10-15',  rest:'30s',  tip:'Mobilidade torácica e lombar, ritmo respiratório' },
  { name:'Mobilidade de Quadril 90/90',      type:'Mobilidade', sets:'2', reps:'8-10',   rest:'30s',  tip:'Rotação interna e externa de quadril sentado' },
  { name:'World's Greatest Stretch',         type:'Mobilidade', sets:'2', reps:'6-8',    rest:'30s',  tip:'Combinação de lunge, rotação e extensão torácica' },
  { name:'Hip Circle (Círculo de Quadril)',  type:'Mobilidade', sets:'2', reps:'10 cada',rest:'30s',  tip:'Circundução completa, mantém tronco estável' },
  { name:'Abertura Torácica (Thread Needle)',type:'Mobilidade', sets:'2', reps:'8-10',   rest:'30s',  tip:'Mão desliza pelo chão sob o tronco' },
  { name:'Alongamento de Isquiotibial',      type:'Mobilidade', sets:'2', reps:'30-45s', rest:'20s',  tip:'Perna estendida, flexão do tronco sem arredondar lombar' },
  { name:'Alongamento de Quadríceps',        type:'Mobilidade', sets:'2', reps:'30s',    rest:'20s',  tip:'Em pé ou deitado, joelho flexionado' },
  { name:'Pigeon Pose (Glúteo)',             type:'Mobilidade', sets:'2', reps:'45-60s', rest:'20s',  tip:'Perna dobrada à frente, tronco inclinado' },
  { name:'Rotação Torácica em 4 Apoios',    type:'Mobilidade', sets:'2', reps:'8-10',   rest:'30s',  tip:'Mão atrás da cabeça, cotovelo sobe ao teto' },
  { name:'Mobilidade de Tornozelo',          type:'Mobilidade', sets:'2', reps:'10-12',  rest:'20s',  tip:'Joelho ultrapassa o pé, mantém calcanhar no chão' },
  { name:'Rotação de Ombros',               type:'Mobilidade', sets:'2', reps:'10-15',  rest:'20s',  tip:'Circundução completa, braços relaxados' },
  { name:'Flexão Lateral de Tronco',        type:'Mobilidade', sets:'2', reps:'8-10',   rest:'20s',  tip:'Em pé, braço desce pela lateral sem inclinar à frente' },
  { name:'Mobilidade Cervical',             type:'Mobilidade', sets:'2', reps:'5-8',    rest:'20s',  tip:'Movimentos lentos, sem forçar amplitude' },
]

// ── Templates ─────────────────────────────────────────────────────────────────
const T = {
  futebol_crianca: {
    label:'Futebol - FUNdamentals (6-12 anos)', color:'#34D399', semAcademia: false,
    days:[
      { name:'Treino A - Multilateral', focus:'Full Body + Coordenação', day_of_week:'Ter', exercises:[
        { name:'Agachamento com Peso Corporal',type:'Peso Corporal',sets:'3',reps:'15',  rest:'45s',tip:'Foco em técnica' },
        { name:'Flexão de Braço Adaptada (Joelhos)',type:'Peso Corporal',sets:'3',reps:'10',rest:'45s',tip:'Apoio nos joelhos' },
        { name:'Salto Vertical',             type:'Funcional',   sets:'3',reps:'6',    rest:'60s',tip:'Aterrissagem suave' },
        { name:'Corrida Lateral (Shuffle)',  type:'Funcional',   sets:'4',reps:'10m',  rest:'45s',tip:'Agilidade' },
        { name:'Prancha Frontal',            type:'Peso Corporal',sets:'3',reps:'20s', rest:'30s',tip:'Core estável' },
        { name:'Equilíbrio Unipodal',        type:'Peso Corporal',sets:'3',reps:'20s', rest:'30s',tip:'Olhos abertos' },
      ]},
      { name:'Treino B - Coordenação', focus:'Habilidades Motoras + Core', day_of_week:'Qui', exercises:[
        { name:'Corrida Lateral (Shuffle)',  type:'Funcional',   sets:'4',reps:'15m',  rest:'45s',tip:'Mudança de direção' },
        { name:'Afundo (Peso Corporal)',     type:'Peso Corporal',sets:'3',reps:'10',  rest:'45s',tip:'Sem carga extra' },
        { name:'Abdominal Bicicleta',        type:'Funcional',   sets:'3',reps:'15',   rest:'30s',tip:'Coordenação contralateral' },
        { name:'Step Up (Caixote/Escada)',   type:'Funcional',   sets:'3',reps:'10',   rest:'45s',tip:'Empurrar pelo calcanhar' },
        { name:'Superman',                   type:'Peso Corporal',sets:'3',reps:'12',  rest:'30s',tip:'Extensão controlada' },
        { name:'Pular Corda',                type:'Cardio',      sets:'3',reps:'2min', rest:'60s',tip:'Coordenação ritmo' },
      ]},
    ],
  },

  futebol_adolescente: {
    label:'Futebol - Train to Train (12-17 anos)', color:'#60A5FA', semAcademia: false,
    days:[
      { name:'Treino A - Membros Inferiores', focus:'Posterior + Glúteo + Core', day_of_week:'Seg', exercises:[
        { name:'Agachamento Livre',         type:'Quadríceps',sets:'4',reps:'10-12',rest:'75s',tip:'Foco em técnica, até 70% 1RM' },
        { name:'Stiff (Terra Romeno)',       type:'Posterior', sets:'3',reps:'10-12',rest:'75s',tip:'Cadeia posterior do futebol' },
        { name:'Afundo com Rotação',        type:'Funcional', sets:'3',reps:'10',   rest:'60s',tip:'Transferência esportiva' },
        { name:'Hip Thrust (Barra)',         type:'Glúteo',    sets:'3',reps:'12',   rest:'60s',tip:'Potência de chute' },
        { name:'Prancha Frontal',            type:'Peso Corporal',sets:'3',reps:'40s',rest:'30s',tip:'Estabilizador central' },
        { name:'Pallof Press',              type:'Core',      sets:'3',reps:'10',   rest:'45s',tip:'Resistência à rotação' },
      ]},
      { name:'Treino B - Membros Superiores', focus:'Empurrão + Puxada', day_of_week:'Qua', exercises:[
        { name:'Supino Reto (Barra)',       type:'Peito',  sets:'4',reps:'10-12',rest:'75s',tip:'70% 1RM máx adolescente' },
        { name:'Puxada Frontal (Polia)',    type:'Costas', sets:'4',reps:'10-12',rest:'75s',tip:'Equilíbrio pull/push' },
        { name:'Desenvolvimento (Halter)', type:'Ombro',  sets:'3',reps:'10-12',rest:'60s',tip:'Estabilidade escapular' },
        { name:'Remada Curvada (Barra)',    type:'Costas', sets:'3',reps:'10-12',rest:'75s',tip:'Postura futebol' },
        { name:'Dead Bug',                 type:'Core',   sets:'3',reps:'8',    rest:'45s',tip:'Coordenação contralateral' },
      ]},
      { name:'Treino C - Potência + Agilidade', focus:'Explosão + Velocidade', day_of_week:'Sex', exercises:[
        { name:'Agachamento com Salto',     type:'Funcional',sets:'4',reps:'6-8', rest:'90s',tip:'Pliometria - base do futebol' },
        { name:'Corrida Lateral (Shuffle)', type:'Funcional',sets:'4',reps:'15m', rest:'60s',tip:'Agilidade e mudança de direção' },
        { name:'Box Jump',                  type:'Funcional',sets:'3',reps:'5-8', rest:'90s',tip:'Potência de membros inferiores' },
        { name:'Kettlebell Swing',          type:'Full Body',sets:'3',reps:'12',  rest:'75s',tip:'Potência de quadril' },
        { name:'Corrida (Esteira)',         type:'Cardio',  sets:'1',reps:'20min',rest:'-',  tip:'PSE 5-6, resistência aeróbia' },
      ]},
    ],
  },

  saude: {
    label:'Saúde e Bem-Estar - Funcional', color:'#34D399', semAcademia: false,
    days:[
      { name:'Treino A - Funcional Inferior', focus:'Quadril + Core + Equilíbrio', day_of_week:'Seg', exercises:[
        { name:'Agachamento Goblet',       type:'Quadríceps', sets:'3',reps:'12-15',rest:'60s',tip:'Multiarticular, padrão funcional' },
        { name:'Stiff (Terra Romeno)',     type:'Posterior',  sets:'3',reps:'12-15',rest:'60s',tip:'Mobilidade de quadril' },
        { name:'Elevação Pélvica (Glúteo Bridge)',type:'Peso Corporal',sets:'3',reps:'15-20',rest:'45s',tip:'Sem carga, foco em ativação' },
        { name:'Afundo (Peso Corporal)',   type:'Peso Corporal',sets:'3',reps:'12', rest:'60s',tip:'Equilíbrio e funcionalidade' },
        { name:'Panturrilha em Pé',       type:'Panturrilha',sets:'3',reps:'15-20',rest:'45s',tip:'Amplitude total' },
        { name:'Prancha Frontal',         type:'Peso Corporal',sets:'3',reps:'30s',rest:'30s',tip:'Core estabilizador' },
      ]},
      { name:'Treino B - Funcional Superior', focus:'Puxada + Empurrão + Mobilidade', day_of_week:'Qua', exercises:[
        { name:'Flexão de Braço',                type:'Funcional',    sets:'3',reps:'10-15',rest:'60s',tip:'Peso corporal, funcional' },
        { name:'Remada Unilateral (Halter)',      type:'Costas',       sets:'3',reps:'12-15',rest:'60s',tip:'Equilíbrio pull/push' },
        { name:'Desenvolvimento (Halter)',        type:'Ombro',        sets:'3',reps:'12-15',rest:'60s',tip:'Carga leve, padrão funcional' },
        { name:'Gato-Vaca',                      type:'Mobilidade',   sets:'2',reps:'12',   rest:'30s',tip:'Mobilidade torácica' },
        { name:'Mobilidade de Quadril 90/90',    type:'Mobilidade',   sets:'2',reps:'8',    rest:'30s',tip:'Prevenção de lesão' },
        { name:'Dead Bug',                       type:'Core',         sets:'3',reps:'8',    rest:'45s',tip:'Core funcional profundo' },
      ]},
      { name:'Cardio + Mobilidade', focus:'Saúde Cardiovascular', day_of_week:'Sex', exercises:[
        { name:'Bicicleta Ergométrica',          type:'Cardio',       sets:'1',reps:'30min',rest:'-',  tip:'PSE 3-4, zona de saúde cardiovascular' },
        { name:'Corrida (Esteira)',              type:'Cardio',       sets:'1',reps:'20min',rest:'-',  tip:'Alternativa: caminhada rápida PSE 3' },
        { name:'Prancha Lateral',               type:'Peso Corporal',sets:'3',reps:'25s',  rest:'30s',tip:'Estabilidade lateral' },
        { name:'Equilíbrio Unipodal',           type:'Peso Corporal',sets:'3',reps:'25s',  rest:'30s',tip:'Prevenção de quedas' },
      ]},
    ],
  },

  massa: {
    label:'Ganho de Massa - Hipertrofia', color:'#A78BFA', semAcademia: false,
    days:[
      { name:'Treino A - Peito + Tríceps', focus:'Push', day_of_week:'Seg', exercises:[
        { name:'Supino Reto (Barra)',       type:'Peito',   sets:'4',reps:'6-10',  rest:'90s',tip:'Tensão mecânica - hipertrofia' },
        { name:'Supino Inclinado (Halter)', type:'Peito',   sets:'3',reps:'10-12', rest:'75s',tip:'Porção clavicular' },
        { name:'Crucifixo (Halter)',        type:'Peito',   sets:'3',reps:'12-15', rest:'60s',tip:'Estresse metabólico' },
        { name:'Tríceps Pulley (Polia)',    type:'Tríceps', sets:'3',reps:'12-15', rest:'60s',tip:'Isolamento final' },
        { name:'Tríceps Testa (Barra EZ)', type:'Tríceps', sets:'3',reps:'10-12', rest:'60s',tip:'Cabeça longa do tríceps' },
      ]},
      { name:'Treino B - Costas + Bíceps', focus:'Pull', day_of_week:'Ter', exercises:[
        { name:'Barra Fixa',             type:'Costas',sets:'4',reps:'6-10',  rest:'90s',tip:'Amplitude completa' },
        { name:'Remada Curvada (Barra)', type:'Costas',sets:'4',reps:'8-10',  rest:'90s',tip:'Volume de costas' },
        { name:'Puxada Frontal (Polia)', type:'Costas',sets:'3',reps:'10-12', rest:'75s',tip:'Pre-exaustão' },
        { name:'Rosca Direta (Barra)',   type:'Bíceps',sets:'3',reps:'10-12', rest:'60s',tip:'Curl clássico' },
        { name:'Rosca Martelo',          type:'Bíceps',sets:'3',reps:'12-15', rest:'60s',tip:'Braquial + braquiorradial' },
      ]},
      { name:'Treino C - Membros Inferiores', focus:'Quadríceps + Posterior + Glúteo', day_of_week:'Qui', exercises:[
        { name:'Agachamento Livre',     type:'Quadríceps', sets:'5',reps:'6-10',  rest:'120s',tip:'Rainha dos exercícios' },
        { name:'Leg Press',             type:'Quadríceps', sets:'4',reps:'10-12', rest:'90s', tip:'Volume adicional' },
        { name:'Stiff (Terra Romeno)',  type:'Posterior',  sets:'4',reps:'8-12',  rest:'90s', tip:'Cadeia posterior' },
        { name:'Mesa Flexora',          type:'Posterior',  sets:'3',reps:'10-12', rest:'75s', tip:'Isolamento isquiotibial' },
        { name:'Panturrilha em Pé',    type:'Panturrilha',sets:'4',reps:'15-20', rest:'45s', tip:'Amplitude total' },
      ]},
      { name:'Treino D - Ombros + Core', focus:'Deltoide + Estabilidade', day_of_week:'Sex', exercises:[
        { name:'Desenvolvimento (Halter)', type:'Ombro',sets:'4',reps:'10-12',rest:'75s',tip:'Volume de ombro' },
        { name:'Elevação Lateral',        type:'Ombro',sets:'4',reps:'12-15',rest:'60s',tip:'Porção medial' },
        { name:'Elevação Frontal',        type:'Ombro',sets:'3',reps:'12-15',rest:'60s',tip:'Porção anterior' },
        { name:'Prancha Frontal',         type:'Peso Corporal',sets:'3',reps:'45s',rest:'30s',tip:'Core forte = mais força' },
        { name:'Rotação de Tronco',       type:'Core',  sets:'3',reps:'15',   rest:'30s',tip:'Oblíquos' },
      ]},
    ],
  },

  forca: {
    label:'Força e Performance', color:'#EF4444', semAcademia: false,
    days:[
      { name:'Treino A - Empurrão', focus:'Força Máxima Peito', day_of_week:'Seg', exercises:[
        { name:'Supino Reto (Barra)',       type:'Peito',  sets:'5',reps:'3-5', rest:'3min',tip:'85-90% 1RM, força máxima' },
        { name:'Supino Inclinado (Halter)', type:'Peito',  sets:'3',reps:'6-8', rest:'2min',tip:'Volume acessório' },
        { name:'Tríceps Testa (Barra EZ)', type:'Tríceps',sets:'3',reps:'6-8', rest:'90s', tip:'Acessório de força' },
        { name:'Prancha Frontal',           type:'Peso Corporal',sets:'3',reps:'45s',rest:'30s',tip:'Transferência de força' },
      ]},
      { name:'Treino B - Puxão + Posterior', focus:'Costas + Deadlift', day_of_week:'Qua', exercises:[
        { name:'Levantamento Terra',     type:'Posterior',sets:'5',reps:'3-5',rest:'3min',tip:'Rei dos exercícios compostos' },
        { name:'Barra Fixa',             type:'Costas',   sets:'4',reps:'5-6',rest:'2min',tip:'Adição de carga externa' },
        { name:'Remada Curvada (Barra)', type:'Costas',   sets:'4',reps:'6-8',rest:'2min',tip:'Volume posterior' },
        { name:'Rosca Direta (Barra)',   type:'Bíceps',   sets:'3',reps:'6-8',rest:'90s', tip:'Bíceps forte = pull mais forte' },
      ]},
      { name:'Treino C - Agachamento', focus:'Força Membros Inferiores', day_of_week:'Sex', exercises:[
        { name:'Agachamento Livre',    type:'Quadríceps',  sets:'5',reps:'3-5',  rest:'3min',tip:'85-90% 1RM, força máxima' },
        { name:'Leg Press',            type:'Quadríceps',  sets:'3',reps:'6-8',  rest:'2min',tip:'Acessório' },
        { name:'Stiff (Terra Romeno)', type:'Posterior',   sets:'4',reps:'6-8',  rest:'90s', tip:'Força de cadeia posterior' },
        { name:'Panturrilha em Pé',   type:'Panturrilha', sets:'4',reps:'12-15',rest:'60s', tip:'Força de panturrilha' },
      ]},
    ],
  },

  condicionamento: {
    label:'Condicionamento Físico', color:'#FBBF24', semAcademia: false,
    days:[
      { name:'Treino A - Circuito Full Body', focus:'Resistência Muscular + Cardio', day_of_week:'Seg', exercises:[
        { name:'Agachamento Goblet',  type:'Quadríceps',sets:'3',reps:'15-20',rest:'30s',tip:'Alta repetição, pouco descanso' },
        { name:'Flexão de Braço',     type:'Funcional', sets:'3',reps:'15-20',rest:'30s',tip:'Circuito' },
        { name:'Hip Thrust (Barra)',  type:'Glúteo',    sets:'3',reps:'15-20',rest:'30s',tip:'Cadeia posterior' },
        { name:'Remada TRX',          type:'Costas',    sets:'3',reps:'15-20',rest:'30s',tip:'Pull funcional' },
        { name:'Burpee',              type:'Funcional', sets:'3',reps:'10',   rest:'60s',tip:'Condicionamento total' },
        { name:'Prancha Frontal',     type:'Peso Corporal',sets:'3',reps:'30s',rest:'30s',tip:'Estabilidade' },
      ]},
      { name:'Treino B - Intervalado', focus:'HIIT + Resistência', day_of_week:'Qua', exercises:[
        { name:'Kettlebell Swing',      type:'Full Body',  sets:'4',reps:'15',  rest:'45s',tip:'Potência e cardio' },
        { name:'Agachamento com Salto', type:'Funcional',  sets:'4',reps:'10',  rest:'45s',tip:'Pliometria' },
        { name:'Mountain Climber',      type:'Funcional',  sets:'3',reps:'25',  rest:'45s',tip:'Core + cardio' },
        { name:'Corrida (Esteira)',     type:'Cardio',     sets:'1',reps:'20min',rest:'-',tip:'PSE 6-7, zona de condicionamento' },
      ]},
      { name:'Treino C - Cardio + Core', focus:'Aeróbio + Estabilidade', day_of_week:'Sex', exercises:[
        { name:'Bicicleta Ergométrica', type:'Cardio',       sets:'1',reps:'30min',rest:'-',  tip:'Zona 2 - 150 min OMS/semana' },
        { name:'Prancha Lateral',       type:'Peso Corporal',sets:'3',reps:'30s', rest:'30s',tip:'Estabilidade lateral' },
        { name:'Rotação de Tronco',     type:'Core',         sets:'3',reps:'15',  rest:'30s',tip:'Força rotacional' },
        { name:'Step Up (Caixote/Escada)',type:'Funcional',  sets:'3',reps:'12',  rest:'45s',tip:'Funcional' },
      ]},
    ],
  },

  // ── Novos templates sem academia ───────────────────────────────────────────
  funcional_casa: {
    label:'Funcional em Casa - Sem Equipamento', color:'#34D399', semAcademia: true,
    days:[
      { name:'Treino A - Superior', focus:'Peito + Costas + Ombro', day_of_week:'Seg', exercises:[
        { name:'Flexão de Braço',              type:'Funcional',    sets:'4',reps:'10-15',  rest:'60s',tip:'Base de empurrão — progresso pela carga do corpo' },
        { name:'Flexão de Braço Diamante',     type:'Funcional',    sets:'3',reps:'8-12',   rest:'60s',tip:'Ativa tríceps e porção interna do peito' },
        { name:'Flexão de Braço Declinada',    type:'Funcional',    sets:'3',reps:'8-12',   rest:'60s',tip:'Pés elevados ativam porção clavicular' },
        { name:'Puxada Inverted Row',          type:'Peso Corporal',sets:'3',reps:'10-15',  rest:'60s',tip:'Barra ou mesa — principal exercício de puxada em casa' },
        { name:'Pike Push Up (Pico)',          type:'Funcional',    sets:'3',reps:'8-12',   rest:'60s',tip:'Quadril elevado em V, simula desenvolvimento de ombros' },
        { name:'Tríceps Banco (Dip)',          type:'Peso Corporal',sets:'3',reps:'10-15',  rest:'60s',tip:'Apoio em cadeira ou banco' },
      ]},
      { name:'Treino B - Inferior + Core', focus:'Membros Inferiores + Abdômen', day_of_week:'Qua', exercises:[
        { name:'Agachamento com Peso Corporal',  type:'Peso Corporal',sets:'4',reps:'20-25',  rest:'45s',tip:'Volume alto com peso corporal para hypertrofia' },
        { name:'Afundo (Peso Corporal)',          type:'Peso Corporal',sets:'3',reps:'12-15',  rest:'45s',tip:'Tronco ereto, joelho traseiro quase no chão' },
        { name:'Elevação Pélvica (Glúteo Bridge)',type:'Peso Corporal',sets:'4',reps:'20-25',  rest:'30s',tip:'Extensão completa de quadril' },
        { name:'Glúteo 4 Apoios',                type:'Peso Corporal',sets:'3',reps:'15-20',  rest:'30s',tip:'Extensão de quadril no solo' },
        { name:'Abdominal V-Sit',                type:'Funcional',    sets:'3',reps:'12-15',  rest:'45s',tip:'Tronco e pernas sobem simultâneos' },
        { name:'Mountain Climber',               type:'Funcional',    sets:'3',reps:'25-30',  rest:'45s',tip:'Core e cardio combinados' },
        { name:'Prancha com Elevação de Braço',  type:'Peso Corporal',sets:'3',reps:'8-10',   rest:'45s',tip:'Anti-rotação — core profundo' },
      ]},
      { name:'Treino C - Full Body + Cardio', focus:'Circuito Sem Pausa', day_of_week:'Sex', exercises:[
        { name:'Burpee',                  type:'Funcional',    sets:'4',reps:'8-10',  rest:'60s',tip:'Condicionamento total, ativa todo o corpo' },
        { name:'Agachamento com Salto',   type:'Funcional',    sets:'3',reps:'10',    rest:'60s',tip:'Potência de membros inferiores' },
        { name:'Mountain Climber',        type:'Funcional',    sets:'3',reps:'30',    rest:'45s',tip:'Core + cardio' },
        { name:'Flexão de Braço',         type:'Funcional',    sets:'3',reps:'12',    rest:'45s',tip:'Manter no circuito' },
        { name:'Corrida no Lugar (High Knee)', type:'Funcional',sets:'3',reps:'40s', rest:'30s',tip:'Joelhos na altura do quadril' },
        { name:'Polichinelo',             type:'Funcional',    sets:'3',reps:'40s',  rest:'30s',tip:'Manter ritmo constante' },
      ]},
      { name:'Mobilidade + Recuperação', focus:'Mobilidade Ativa', day_of_week:'Dom', exercises:[
        { name:'Gato-Vaca',                      type:'Mobilidade',sets:'2',reps:'12',   rest:'20s',tip:'Mobilidade lombar e torácica' },
        { name:'Mobilidade de Quadril 90/90',    type:'Mobilidade',sets:'2',reps:'8-10', rest:'20s',tip:'Rotação interna e externa' },
        { name:'World\'s Greatest Stretch',      type:'Mobilidade',sets:'2',reps:'6-8',  rest:'20s',tip:'Combinação lunge + rotação' },
        { name:'Alongamento de Isquiotibial',    type:'Mobilidade',sets:'2',reps:'40s',  rest:'15s',tip:'Perna estendida, flexão do tronco' },
        { name:'Rotação Torácica em 4 Apoios',  type:'Mobilidade',sets:'2',reps:'8-10', rest:'20s',tip:'Mobilidade torácica' },
        { name:'Equilíbrio Unipodal',           type:'Peso Corporal',sets:'2',reps:'30s',rest:'15s',tip:'Treino proprioceptivo' },
      ]},
    ],
  },

  elastico_casa: {
    label:'Elástico em Casa - Treino Completo', color:'#FBBF24', semAcademia: true,
    days:[
      { name:'Treino A - Superior (Elástico)', focus:'Peito + Costas + Ombro', day_of_week:'Seg', exercises:[
        { name:'Chest Press com Elástico',         type:'Elástico',sets:'3',reps:'12-15',rest:'60s',tip:'Elástico preso atrás, extensão de cotovelos' },
        { name:'Crucifixo com Elástico',           type:'Elástico',sets:'3',reps:'12-15',rest:'60s',tip:'Adução horizontal — simula crucifixo na academia' },
        { name:'Remada com Elástico',              type:'Elástico',sets:'4',reps:'12-15',rest:'60s',tip:'Elástico preso à frente, cotovelos passam o tronco' },
        { name:'Puxada com Elástico',              type:'Elástico',sets:'3',reps:'12-15',rest:'60s',tip:'Elástico preso acima, puxar para o peito' },
        { name:'Desenvolvimento Ombro (Elástico)', type:'Elástico',sets:'3',reps:'12-15',rest:'60s',tip:'Pisar no elástico, empurrar acima da cabeça' },
        { name:'Elevação Lateral com Elástico',    type:'Elástico',sets:'3',reps:'15-20',rest:'45s',tip:'Elástico sob os pés, cotovelos levemente flexionados' },
        { name:'Rotação de Ombro (Elástico)',      type:'Elástico',sets:'3',reps:'15-20',rest:'30s',tip:'Manguito rotador — prevenção de lesão' },
      ]},
      { name:'Treino B - Braços (Elástico)', focus:'Bíceps + Tríceps', day_of_week:'Ter', exercises:[
        { name:'Rosca Bíceps com Elástico',     type:'Elástico',sets:'3',reps:'12-15',rest:'45s',tip:'Pisar no elástico, supinação completa' },
        { name:'Extensão Tríceps com Elástico', type:'Elástico',sets:'3',reps:'12-15',rest:'45s',tip:'Elástico preso acima, extensão completa' },
        { name:'Rosca Martelo',                type:'Bíceps',   sets:'3',reps:'12-15',rest:'45s',tip:'Usar elástico de resistência média' },
        { name:'Tríceps Banco (Dip)',           type:'Peso Corporal',sets:'3',reps:'10-15',rest:'60s',tip:'Apoio em cadeira, tríceps em carga' },
        { name:'Pallof Press (Elástico)',       type:'Elástico',sets:'3',reps:'10-12',rest:'45s',tip:'Core antirotacional com elástico' },
      ]},
      { name:'Treino C - Inferior (Elástico)', focus:'Pernas + Glúteo', day_of_week:'Qui', exercises:[
        { name:'Agachamento com Elástico',       type:'Elástico',    sets:'4',reps:'15-20',rest:'60s',tip:'Elástico sobre os ombros ou sob os pés' },
        { name:'Hip Thrust com Elástico',        type:'Elástico',    sets:'4',reps:'15-20',rest:'45s',tip:'Elástico sobre os quadris — simula máquina' },
        { name:'Afundo com Elástico',            type:'Elástico',    sets:'3',reps:'12',   rest:'60s',tip:'Elástico sobre os ombros, postura ereta' },
        { name:'Abdução de Quadril (Elástico)',  type:'Elástico',    sets:'3',reps:'15-20',rest:'45s',tip:'Elástico nos joelhos, abre e fecha' },
        { name:'Glúteo 4 Apoios (Elástico)',     type:'Elástico',    sets:'3',reps:'15-20',rest:'30s',tip:'Elástico no tornozelo, extensão controlada' },
        { name:'Agachamento Lateral (Elástico)', type:'Elástico',    sets:'3',reps:'12-15',rest:'45s',tip:'Passo lateral com elástico nos joelhos' },
        { name:'Panturrilha em Pé (Corpo)',       type:'Peso Corporal',sets:'3',reps:'20-25',rest:'30s',tip:'Apoio em degrau para amplitude total' },
      ]},
      { name:'Treino D - Full Body + Mobilidade', focus:'Circuito + Recuperação', day_of_week:'Sáb', exercises:[
        { name:'Burpee',                      type:'Funcional', sets:'3',reps:'8-10',  rest:'60s',tip:'Condicionamento sem equipamento' },
        { name:'Agachamento com Elástico',    type:'Elástico',  sets:'3',reps:'15',    rest:'45s',tip:'Manter tensão no elástico' },
        { name:'Remada com Elástico',         type:'Elástico',  sets:'3',reps:'15',    rest:'45s',tip:'Circuito — pouco descanso' },
        { name:'Mountain Climber',            type:'Funcional', sets:'3',reps:'25',    rest:'30s',tip:'Core + cardio' },
        { name:'Mobilidade de Quadril 90/90', type:'Mobilidade',sets:'2',reps:'8',    rest:'20s',tip:'Recuperação ativa' },
        { name:'Gato-Vaca',                   type:'Mobilidade',sets:'2',reps:'10',   rest:'20s',tip:'Descompressão lombar' },
        { name:'Alongamento de Isquiotibial', type:'Mobilidade',sets:'2',reps:'40s',  rest:'15s',tip:'Finalização' },
      ]},
    ],
  },
}

const getTemplate = (goal, ageGroup, sport, semAcademia) => {
  const s = sport || ''
  // Se sem academia, prioriza templates de casa
  if (semAcademia) return T.funcional_casa
  if (s === 'futebol' || s === 'futsal') {
    if (ageGroup === 'crianca')     return T.futebol_crianca
    if (ageGroup === 'adolescente') return T.futebol_adolescente
  }
  if (goal === 'Saúde e Bem-Estar')  return T.saude
  if (goal === 'Ganho de Massa')      return T.massa
  if (goal === 'Força e Performance') return T.forca
  if (goal === 'Condicionamento')     return T.condicionamento
  if (goal === 'Iniciação Esportiva' || goal === 'Desenvolvimento Atlético') {
    return ageGroup === 'crianca' ? T.futebol_crianca : T.futebol_adolescente
  }
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
  if (r === 1)  return c
  if (r > 15)   return null
  const epley    = c * (1 + r / 30)
  const brzycki  = r > 10 ? null : c / (1.0278 - 0.0278 * r)
  const lombardi = c * Math.pow(r, 0.10)
  const valid    = [epley, brzycki, lombardi].filter(v => v !== null && v > 0)
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  wrap:       { minHeight:'100vh', background:'#080B12', padding:'24px 20px' },
  inner:      { maxWidth:860, margin:'0 auto' },
  back:       { background:'none', border:'none', color:'#475569', fontSize:14, cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', gap:6 },
  header:     { background:'#0D1117', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.07)', marginBottom:20, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' },
  input:      { background:'#161B27', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:14, outline:'none' },
  select:     { background:'#161B27', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:14, outline:'none' },
  btn:        (c) => ({ background:'linear-gradient(135deg,'+(c||'#34D399')+','+(c||'#34D399')+'bb)', border:'none', borderRadius:8, padding:'9px 16px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }),
  outlineBtn: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 14px', color:'#94A3B8', fontWeight:600, fontSize:13, cursor:'pointer' },
  dayCard:    (c) => ({ background:'#0D1117', borderRadius:16, border:'1px solid '+c+'35', overflow:'hidden', marginBottom:14 }),
  dayHeader:  (c) => ({ background:c+'12', padding:'14px 20px', borderBottom:'1px solid '+c+'25', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }),
  addRow:     { padding:'16px 20px', background:'rgba(255,255,255,0.02)' },
  exRow:      { padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:8, alignItems:'flex-start' },
  delBtn:     { background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:14, padding:'2px 6px', flexShrink:0 },
  smallInput: { background:'#161B27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'7px 10px', color:'#E2E8F0', fontSize:12, outline:'none', width:'100%' },
  smallSel:   { background:'#161B27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'7px 10px', color:'#E2E8F0', fontSize:12, outline:'none', width:'100%' },
}

// Cor por tipo de exercício
const TYPE_COLOR = {
  'Funcional':    '#34D399',
  'Elástico':     '#FBBF24',
  'Peso Corporal':'#60A5FA',
  'Mobilidade':   '#F472B6',
  'Core':         '#34D399',
  'Full Body':    '#6EE7B7',
  'Cardio':       '#F87171',
}
const getTypeColor = (type) => TYPE_COLOR[type] || '#A78BFA'

// ── 1RM Calculator ────────────────────────────────────────────────────────────
function OneRMCalc({ ageGroup, onApply, onClose }) {
  const [carga, setCarga] = useState('')
  const [reps,  setReps]  = useState('')
  const oneRM = calc1RM(carga, reps)
  const rest  = AGE_RESTRICTIONS[ageGroup] || AGE_RESTRICTIONS.adulto_jovem

  return (
    <div style={{ background:'#0A0F1E', border:'1px solid #1E293B', borderRadius:12, padding:16, margin:'8px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>Calculadora 1RM</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:16 }}>x</button>
      </div>
      {rest.warning && (
        <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#FBBF24', marginBottom:12 }}>
          {rest.warning}
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:9, color:'#475569', marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>Carga (kg)</div>
          <input type="number" style={{ ...s.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={carga} onChange={e => setCarga(e.target.value)} placeholder="ex: 80" />
        </div>
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:9, color:'#475569', marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>Reps (1-15)</div>
          <input type="number" style={{ ...s.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={reps} onChange={e => setReps(e.target.value)} placeholder="ex: 8" />
        </div>
        <div style={{ flex:1, minWidth:100, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ fontSize:9, color:'#475569', marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>1RM Estimado</div>
          <div style={{ background: oneRM ? 'rgba(167,139,250,0.12)' : '#161B27', border:'1px solid '+(oneRM ? '#A78BFA40':'rgba(255,255,255,0.07)'), borderRadius:6, padding:'7px', textAlign:'center', fontSize:18, fontWeight:900, color: oneRM ? '#A78BFA':'#334155' }}>
            {oneRM ? oneRM+' kg' : '-'}
          </div>
        </div>
      </div>
      {oneRM && (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {ZONES.map(zone => {
            const blocked = rest.blockedZones.includes(zone.label)
            const maxAllowed = Math.round(oneRM * rest.maxPct / 100)
            const lo = Math.round(oneRM * zone.pct[0] / 100)
            const hi = Math.round(Math.min(oneRM * zone.pct[1] / 100, maxAllowed))
            const load = lo <= maxAllowed ? { lo, hi } : null
            return (
              <div key={zone.label} style={{ display:'flex', alignItems:'center', gap:8, background: blocked ? 'rgba(255,255,255,0.02)' : zone.color+'10', border:'1px solid '+(blocked ? 'rgba(255,255,255,0.05)':zone.color+'30'), borderRadius:8, padding:'7px 10px', opacity: blocked ? 0.4 : 1 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color: blocked ? '#334155':zone.color }}>{blocked ? 'Restrito - ':''}{zone.label}</div>
                  <div style={{ fontSize:9, color:'#475569' }}>{zone.reps} reps · {zone.rest}</div>
                </div>
                {load && !blocked ? (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:900, color:zone.color }}>{load.lo}-{load.hi}kg</div>
                    <button onClick={() => onApply({ reps:zone.reps, rest:zone.rest })} style={{ fontSize:9, background:zone.color+'20', border:'1px solid '+zone.color+'40', borderRadius:5, padding:'2px 7px', color:zone.color, cursor:'pointer', fontWeight:700 }}>Usar</button>
                  </div>
                ) : (
                  <div style={{ fontSize:10, color:'#1E293B' }}>{blocked ? 'Restrito':'-'}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Exercise Search com filtro por modalidade ─────────────────────────────────
function ExerciseSearch({ onSelect, suggestedTypes, ageGroup }) {
  const [query,       setQuery]       = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [modality,    setModality]    = useState('')  // filtro de modalidade

  // Resolve tipos permitidos pela modalidade selecionada
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
      {/* Filtro por modalidade */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
        {Object.keys(MODALITY_MAP).map(mod => (
          <button key={mod} onClick={() => { setModality(modality === mod ? '' : mod); setFilterType('') }}
            style={{ padding:'4px 12px', borderRadius:20, border:'1px solid '+(modality === mod ? MODALITY_COLORS[mod] : 'rgba(255,255,255,0.1)'), background: modality === mod ? MODALITY_COLORS[mod]+'18' : 'transparent', color: modality === mod ? MODALITY_COLORS[mod] : '#475569', fontSize:11, cursor:'pointer', fontWeight: modality === mod ? 700 : 400, transition:'all 0.15s' }}>
            {mod}
          </button>
        ))}
        {(modality || filterType) && (
          <button onClick={() => { setModality(''); setFilterType('') }} style={{ padding:'4px 8px', borderRadius:20, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'#334155', fontSize:10, cursor:'pointer' }}>
            x Limpar
          </button>
        )}
      </div>

      {/* Chips de tipo sugerido (filtra dentro da modalidade) */}
      {suggestedTypes.length > 0 && (
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
          <span style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1, alignSelf:'center' }}>Sugerido:</span>
          {suggestedTypes
            .filter(t => !allowedTypes || allowedTypes.includes(t))
            .map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
                style={{ padding:'3px 10px', borderRadius:20, border:'1px solid '+(filterType === t ? getTypeColor(t) : 'rgba(255,255,255,0.1)'), background: filterType === t ? getTypeColor(t)+'18' : 'transparent', color: filterType === t ? getTypeColor(t) : '#475569', fontSize:11, cursor:'pointer', fontWeight: filterType === t ? 700 : 400 }}>
                {t}
              </button>
            ))}
        </div>
      )}

      <input style={s.smallInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar exercício... (ex: flexão, elástico, mobilidade)" />

      {(query || filterType || modality) && results.length > 0 && (
        <div style={{ background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, overflow:'hidden', marginTop:4 }}>
          {results.map((ex, i) => {
            const tc = getTypeColor(ex.type)
            return (
              <div key={i} onClick={() => { onSelect(ex); setQuery(''); setFilterType(''); setModality('') }}
                style={{ padding:'9px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>{ex.name}</div>
                  <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{ex.tip}</div>
                </div>
                <div style={{ flexShrink:0, display:'flex', gap:5, alignItems:'center' }}>
                  <span style={{ fontSize:9, background:tc+'18', padding:'2px 7px', borderRadius:20, color:tc, border:'1px solid '+tc+'35', fontWeight:700 }}>{ex.type}</span>
                  <span style={{ fontSize:9, color:'#334155' }}>{ex.sets}x{ex.reps}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(query || filterType || modality) && results.length === 0 && (
        <div style={{ padding:'8px 12px', fontSize:12, color:'#334155', marginTop:4 }}>Nenhum resultado — preencha manualmente abaixo</div>
      )}
    </div>
  )
}

// ── Template Modal ────────────────────────────────────────────────────────────
function TemplateModal({ student, ageGroup, semAcademia, onApply, onClose }) {
  const goal      = student?.goal  || ''
  const sport     = student?.sport || ''
  const suggested = getTemplate(goal, ageGroup, sport, semAcademia)
  const keys      = Object.keys(T)
  const initKey   = keys.find(k => T[k] === suggested) || 'massa'
  const [selected,      setSelected]      = useState(initKey)
  const [showSemAcad,   setShowSemAcad]   = useState(semAcademia)
  const tpl = T[selected]

  const visibleKeys = keys.filter(k => showSemAcad ? T[k].semAcademia : !T[k].semAcademia)

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, padding:24, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#E2E8F0' }}>Gerar Estrutura do Treino</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>Selecione um template e personalize depois</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18 }}>x</button>
        </div>

        {/* Toggle academia / sem academia */}
        <div style={{ display:'flex', gap:6, marginBottom:18, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
          <button onClick={() => { setShowSemAcad(false); setSelected('massa') }}
            style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background: !showSemAcad ? 'linear-gradient(135deg,#A78BFA,#7C3AED)' : 'transparent', color: !showSemAcad ? '#fff':'#475569', fontWeight:700, fontSize:12, cursor:'pointer', transition:'all 0.2s' }}>
            🏋️ Com Academia
          </button>
          <button onClick={() => { setShowSemAcad(true); setSelected('funcional_casa') }}
            style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background: showSemAcad ? 'linear-gradient(135deg,#34D399,#059669)' : 'transparent', color: showSemAcad ? '#fff':'#475569', fontWeight:700, fontSize:12, cursor:'pointer', transition:'all 0.2s' }}>
            🏠 Sem Academia
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
          {visibleKeys.map(key => (
            <div key={key} onClick={() => setSelected(key)}
              style={{ padding:'10px 14px', borderRadius:10, border:'1px solid '+(selected === key ? T[key].color+'60':'rgba(255,255,255,0.06)'), background: selected === key ? T[key].color+'10':'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:T[key].color, flexShrink:0 }} />
              <span style={{ fontSize:13, fontWeight: selected === key ? 700:400, color: selected === key ? T[key].color:'#94A3B8' }}>
                {T[key].label}
              </span>
              {T[key] === suggested && (
                <span style={{ fontSize:9, background:'rgba(52,211,153,0.12)', color:'#34D399', border:'1px solid rgba(52,211,153,0.2)', borderRadius:20, padding:'1px 7px', marginLeft:'auto' }}>
                  Sugerido
                </span>
              )}
              {T[key].semAcademia && (
                <span style={{ fontSize:9, background:'rgba(96,165,250,0.12)', color:'#60A5FA', border:'1px solid rgba(96,165,250,0.2)', borderRadius:20, padding:'1px 7px', marginLeft: T[key] === suggested ? 4 : 'auto' }}>
                  🏠 Sem academia
                </span>
              )}
            </div>
          ))}
        </div>

        {tpl && (
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:14, marginBottom:18 }}>
            <div style={{ fontSize:10, color:'#475569', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>
              Preview — {tpl.days.length} dias
            </div>
            {tpl.days.map((day, i) => (
              <div key={i} style={{ marginBottom:8, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#E2E8F0', marginBottom:2 }}>
                  {day.name} <span style={{ color:'#475569', fontWeight:400 }}>- {day.day_of_week}</span>
                </div>
                <div style={{ fontSize:10, color:'#64748B' }}>{day.exercises.length} exercícios · {day.focus}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => onApply(tpl)} style={{ ...s.btn(tpl?.color), flex:1, padding:'12px' }}>Aplicar Template</button>
          <button onClick={onClose} style={s.outlineBtn}>Cancelar</button>
        </div>
        <div style={{ fontSize:10, color:'#1E293B', textAlign:'center', marginTop:8 }}>
          Todos os exercícios podem ser editados após aplicar
        </div>
      </div>
    </div>
  )
}

// ── Seção de exercícios sem equipamento (adicionada no dia) ───────────────────
function NoEquipmentSection({ dayId, dayColor, onAddExercise }) {
  const [open, setOpen] = useState(false)
  const QUICK = [
    { label:'Flexão de Braço',    type:'Funcional',     sets:'3',reps:'10-15',rest:'60s',tip:'Corpo rígido, peito toca o chão' },
    { label:'Agachamento Corpo',  type:'Peso Corporal', sets:'3',reps:'20',   rest:'45s',tip:'Sem carga, foco em técnica' },
    { label:'Burpee',             type:'Funcional',     sets:'3',reps:'8-10', rest:'90s',tip:'Movimento completo' },
    { label:'Prancha Frontal',    type:'Peso Corporal', sets:'3',reps:'40s',  rest:'30s',tip:'Quadril neutro' },
    { label:'Abdominal Bicicleta',type:'Funcional',     sets:'3',reps:'15-20',rest:'45s',tip:'Cotovelo toca joelho oposto' },
    { label:'Mountain Climber',   type:'Funcional',     sets:'3',reps:'25-30',rest:'45s',tip:'Core ativado, quadril estável' },
    { label:'Elevação Pélvica',   type:'Peso Corporal', sets:'3',reps:'20',   rest:'30s',tip:'Extensão completa de quadril' },
    { label:'Gato-Vaca',          type:'Mobilidade',    sets:'2',reps:'12',   rest:'20s',tip:'Mobilidade torácica e lombar' },
    { label:'Equilíbrio Unipodal',type:'Peso Corporal', sets:'2',reps:'30s',  rest:'20s',tip:'Propriocepção' },
    { label:'Superman',           type:'Peso Corporal', sets:'3',reps:'12',   rest:'30s',tip:'Extensão bilateral' },
  ]

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:8, padding:'7px 12px', color:'#60A5FA', fontSize:11, fontWeight:700, cursor:'pointer', marginTop:6 }}>
        🏠 + Adicionar exercício sem equipamento
      </button>
    )
  }

  return (
    <div style={{ marginTop:8, background:'rgba(96,165,250,0.04)', border:'1px solid rgba(96,165,250,0.12)', borderRadius:10, padding:'12px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#60A5FA', textTransform:'uppercase', letterSpacing:1 }}>🏠 Exercícios sem equipamento</span>
        <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:14 }}>x</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {QUICK.map((ex, i) => {
          const tc = getTypeColor(ex.type)
          return (
            <button key={i} onClick={() => onAddExercise({ name:ex.label, type:ex.type, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip })}
              style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${tc}35`, background:`${tc}10`, color:tc, fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all 0.15s' }}>
              <span style={{ fontSize:9, background:tc+'25', borderRadius:10, padding:'1px 5px' }}>{ex.type}</span>
              {ex.label}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize:10, color:'#334155', marginTop:8, fontStyle:'italic' }}>
        Clique para adicionar ao treino. Edite séries/reps depois.
      </div>
    </div>
  )
}

// ── Main WorkoutEditor ────────────────────────────────────────────────────────
export default function WorkoutEditor({ navigate, studentId, planId }) {
  const [plan,        setPlan]        = useState(null)
  const [days,        setDays]        = useState([])
  const [student,     setStudent]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [newExForms,  setNewExForms]  = useState({})
  const [openCalc,    setOpenCalc]    = useState(null)
  const [showTemplate,setShowTemplate]= useState(false)
  const [semAcademia, setSemAcademia] = useState(false)

  const ageGroup       = getAgeGroup(student?.birth_date, student?.age)
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
    if (daysData)    setDays(daysData.map(d => ({ ...d, exercises:(d.exercises||[]).sort((a,b)=>a.order_index-b.order_index) })))
    if (studentData) setStudent(studentData)
    setLoading(false)
  }

  const savePlanTitle = async () => {
    setSaving(true)
    await supabase.from('workout_plans').update({ title:plan.title, status:plan.status, updated_at:new Date().toISOString() }).eq('id', planId)
    setSaving(false)
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
        setDays(d => [...d, { ...newDay, exercises:(exData||[]).sort((a,b)=>a.order_index-b.order_index) }])
      }
    }
  }

  const getNewExForm  = (dayId) => newExForms[dayId] || { ...emptyEx }
  const setNewExField = (dayId, field, val) => setNewExForms(f => ({ ...f, [dayId]:{ ...getNewExForm(dayId), [field]:val } }))

  if (loading) return <div style={{ padding:40, color:'#475569' }}>Carregando treino...</div>
  if (!plan)   return null

  const ageColor = AGE_GROUP_COLOR[ageGroup]
  const ageRestr = AGE_RESTRICTIONS[ageGroup]

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        <button style={s.back} onClick={() => navigate('student-detail', { id:studentId })}>
          ← Voltar ao Aluno
        </button>

        {/* Plan header */}
        <div style={s.header}>
          <input
            style={{ ...s.input, flex:2, fontSize:18, fontWeight:700 }}
            value={plan.title}
            onChange={e => setPlan(p => ({ ...p, title:e.target.value }))}
            onBlur={savePlanTitle}
            placeholder="Nome do plano..."
          />
          <select style={s.select} value={plan.status} onChange={e => { setPlan(p => ({ ...p, status:e.target.value })); setTimeout(savePlanTitle, 100) }}>
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
          </select>
          {student && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:ageColor+'15', border:'1px solid '+ageColor+'30', borderRadius:8, padding:'6px 12px' }}>
              <span style={{ fontSize:11, color:ageColor, fontWeight:700 }}>
                {student.name} · {AGE_GROUP_LABEL[ageGroup]}
              </span>
            </div>
          )}
          {/* Toggle sem academia */}
          <button onClick={() => setSemAcademia(v => !v)}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid '+(semAcademia ? '#34D39940':'rgba(255,255,255,0.1)'), background: semAcademia ? 'rgba(52,211,153,0.12)':'rgba(255,255,255,0.04)', color: semAcademia ? '#34D399':'#64748B', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {semAcademia ? '🏠 Sem academia' : '🏋️ Com academia'}
          </button>
          <button onClick={() => setShowTemplate(true)} style={{ ...s.btn('#6366F1'), display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            Gerar Estrutura
          </button>
          <div style={{ fontSize:11, color:'#334155' }}>
            {saving ? <span style={{ color:'#FBBF24' }}>Salvando...</span> : 'Salvo automaticamente'}
          </div>
        </div>

        {/* Age warning */}
        {ageRestr?.warning && (
          <div style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:12, padding:'10px 16px', fontSize:13, color:'#FBBF24', marginBottom:16 }}>
            {ageRestr.warning}
          </div>
        )}

        {/* Legenda de tipos novos */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
          {NEW_TYPES.map(t => {
            const c = getTypeColor(t)
            return (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:c+'12', border:'1px solid '+c+'30' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:c }} />
                <span style={{ fontSize:10, color:c, fontWeight:700 }}>{t}</span>
              </div>
            )
          })}
          <div style={{ fontSize:10, color:'#334155', alignSelf:'center', marginLeft:4 }}>← Novos tipos disponíveis</div>
        </div>

        {/* Days */}
        {days.map((day, idx) => {
          const color  = DAY_COLORS[idx % DAY_COLORS.length]
          const newEx  = getNewExForm(day.id)
          return (
            <div key={day.id} style={s.dayCard(color)}>

              {/* Day header */}
              <div style={s.dayHeader(color)}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flex:1, flexWrap:'wrap' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:'0 0 6px '+color }} />
                  <input style={{ ...s.input, fontWeight:700, color, background:'transparent', border:'none', fontSize:15, minWidth:80 }} value={day.name} onChange={e => updateDay(day.id, 'name', e.target.value)} placeholder="Nome do treino" />
                  <span style={{ color:'#334155' }}>-</span>
                  <input style={{ ...s.input, fontSize:13, flex:1, minWidth:100 }} value={day.focus||''} onChange={e => updateDay(day.id, 'focus', e.target.value)} placeholder="Foco (ex: Funcional + Core)" />
                  <select style={{ ...s.input, fontSize:12, maxWidth:90 }} value={day.day_of_week||''} onChange={e => updateDay(day.id, 'day_of_week', e.target.value)}>
                    <option value="">Dia...</option>
                    {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <button style={s.delBtn} onClick={() => deleteDay(day.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity:0.4 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>

              {/* Exercise list */}
              {day.exercises.length > 0 && (
                <div style={{ padding:'4px 0' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:8, padding:'6px 16px 2px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    {['Exercício','Tipo','Séries','Reps','Desc.'].map(h => (
                      <div key={h} style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
                    ))}
                  </div>
                  {day.exercises.map(ex => {
                    const tc = getTypeColor(ex.type)
                    return (
                      <div key={ex.id}>
                        <div style={s.exRow}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:4 }}>
                              {/* Badge de tipo colorido */}
                              <span style={{ fontSize:9, background:tc+'18', color:tc, border:'1px solid '+tc+'35', borderRadius:10, padding:'1px 6px', fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>{ex.type}</span>
                              <input style={{ ...s.smallInput, fontWeight:600, flex:1 }} value={ex.name} onChange={e => updateExercise(day.id, ex.id, 'name', e.target.value)} placeholder="Nome" />
                              <button onClick={() => setOpenCalc(openCalc === ex.id ? null : ex.id)}
                                style={{ background: openCalc===ex.id ? 'rgba(167,139,250,0.2)':'rgba(167,139,250,0.06)', border:'1px solid '+(openCalc===ex.id ? '#A78BFA60':'rgba(167,139,250,0.15)'), borderRadius:6, padding:'4px 8px', color:'#A78BFA', fontSize:10, cursor:'pointer', fontWeight:700, flexShrink:0 }}>
                                1RM
                              </button>
                              <button style={s.delBtn} onClick={() => deleteExercise(day.id, ex.id)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity:0.35 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                              </button>
                            </div>
                            <input style={{ ...s.smallInput, fontSize:11, color:'#475569' }} value={ex.tip||''} onChange={e => updateExercise(day.id, ex.id, 'tip', e.target.value)} placeholder="Dica de execução (opcional)" />
                          </div>
                          <select style={{ ...s.smallSel, width:110, flexShrink:0 }} value={ex.type||''} onChange={e => updateExercise(day.id, ex.id, 'type', e.target.value)}>
                            <optgroup label="— Musculação">
                              {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
                            </optgroup>
                            <optgroup label="— Funcional / Casa">
                              {NEW_TYPES.map(t => <option key={t}>{t}</option>)}
                            </optgroup>
                          </select>
                          {[['sets','3'],['reps','10-12'],['rest','60s']].map(([field, ph]) => (
                            <input key={field} style={{ ...s.smallSel, width:58, flexShrink:0 }} value={ex[field]||''} onChange={e => updateExercise(day.id, ex.id, field, e.target.value)} placeholder={ph} />
                          ))}
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

              {/* Add exercise */}
              <div style={s.addRow}>
                <div style={{ fontSize:10, color:'#334155', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>Adicionar Exercício</div>

                {/* Busca com filtro por modalidade */}
                <ExerciseSearch
                  onSelect={ex => setNewExForms(f => ({ ...f, [day.id]:{ name:ex.name, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip, type:ex.type } }))}
                  suggestedTypes={suggestedTypes}
                  ageGroup={ageGroup}
                />

                {/* Seção rápida sem equipamento */}
                <NoEquipmentSection
                  dayId={day.id}
                  dayColor={color}
                  onAddExercise={(ex) => addExercise(day.id, ex)}
                />

                {/* Formulário manual */}
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Ou adicionar manualmente</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 58px 58px 58px', gap:6, marginBottom:8 }}>
                    <input style={s.smallInput} value={newEx.name} onChange={e => setNewExField(day.id, 'name', e.target.value)} placeholder="Nome do exercício *" />
                    <select style={s.smallSel} value={newEx.type} onChange={e => setNewExField(day.id, 'type', e.target.value)}>
                      <optgroup label="— Musculação">
                        {MUSCLE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </optgroup>
                      <optgroup label="— Funcional / Casa">
                        {NEW_TYPES.map(t => <option key={t}>{t}</option>)}
                      </optgroup>
                    </select>
                    <input style={s.smallInput} value={newEx.sets} onChange={e => setNewExField(day.id, 'sets', e.target.value)} placeholder="3" />
                    <input style={s.smallInput} value={newEx.reps} onChange={e => setNewExField(day.id, 'reps', e.target.value)} placeholder="10-12" />
                    <input style={s.smallInput} value={newEx.rest} onChange={e => setNewExField(day.id, 'rest', e.target.value)} placeholder="60s" />
                  </div>
                  <input style={{ ...s.smallInput, marginBottom:8, fontSize:11 }} value={newEx.tip} onChange={e => setNewExField(day.id, 'tip', e.target.value)} placeholder="Dica de execução (opcional)" />
                  <button style={s.btn(color)} onClick={() => addExercise(day.id)}>+ Adicionar ao Treino</button>
                </div>
              </div>

            </div>
          )
        })}

        <button style={{ ...s.outlineBtn, width:'100%', padding:'16px', fontSize:14, borderStyle:'dashed', borderRadius:12 }} onClick={addDay}>
          + Adicionar Dia de Treino
        </button>

        <div style={{ marginTop:12, textAlign:'center', fontSize:11, color:'#1E293B' }}>
          Alterações salvas automaticamente
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
    </div>
  )
}
