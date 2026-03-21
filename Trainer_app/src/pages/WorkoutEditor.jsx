import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ── Constants ─────────────────────────────────────────────────────────────────
const EXERCISE_TYPES = ['Peito','Costas','Bíceps','Tríceps','Ombro','Quadríceps','Posterior','Glúteo','Panturrilha','Core','Cardio','Full Body']
const STATUS_OPTIONS = ['draft','active','archived']
const STATUS_LABEL   = { draft:'Rascunho', active:'Ativo', archived:'Arquivado' }
const DAY_COLORS     = ['#00C9FF','#FF6B6B','#A78BFA','#FBBF24','#34D399','#F97316']

const getAgeGroup = (birthDate, age) => {
  const a = birthDate
    ? Math.floor((Date.now()-new Date(birthDate))/(365.25*24*3600*1000))
    : (age ? parseInt(age) : null)
  if(!a) return 'adulto_jovem'
  if(a<13) return 'crianca'
  if(a<18) return 'adolescente'
  if(a<40) return 'adulto_jovem'
  if(a<60) return 'adulto_maduro'
  return 'idoso'
}

const AGE_GROUP_LABEL = { crianca:'Criança', adolescente:'Adolescente', adulto_jovem:'Adulto', adulto_maduro:'Adulto Maduro', idoso:'Idoso 60+' }
const AGE_GROUP_COLOR = { crianca:'#34D399', adolescente:'#60A5FA', adulto_jovem:'#A78BFA', adulto_maduro:'#FBBF24', idoso:'#F97316' }

const AGE_RESTRICTIONS = {
  crianca:      { maxPct:60,  warning:'Criança: sem carga máxima. Prescrever por PSE e peso corporal.', blockedZones:['Força Máxima','Hipertrofia'] },
  adolescente:  { maxPct:70,  warning:'Adolescente: limitar a 70% 1RM durante fase de crescimento ósseo.', blockedZones:['Força Máxima'] },
  adulto_jovem: { maxPct:100, warning:null, blockedZones:[] },
  adulto_maduro:{ maxPct:100, warning:'Adulto maduro: aumentar descanso entre séries (48–72h por grupo).', blockedZones:[] },
  idoso:        { maxPct:75,  warning:'60+: iniciar com 40–50% 1RM. Avaliação médica recomendada.', blockedZones:['Força Máxima'] },
}

const ZONES = [
  { label:'Força Máxima',      pct:[85,100], reps:'1–5',   rest:'3–5min', color:'#EF4444' },
  { label:'Hipertrofia',       pct:[65,85],  reps:'6–12',  rest:'60–120s',color:'#A78BFA' },
  { label:'Resistência Musc.', pct:[40,65],  reps:'15–30', rest:'30–60s', color:'#34D399' },
]

// ── Exercise Bank ─────────────────────────────────────────────────────────────
// ── TGMD-3 pattern ids (mirror from StudentDetail) ────────────────────────────
const TGMD3_ALL = [
  {id:'corrida', label:'Corrida'},    {id:'galope',    label:'Galope'},
  {id:'passada', label:'Passada'},    {id:'salto_h',   label:'Salto Horiz.'},
  {id:'salto_v', label:'Salto Vert.'},{id:'lateral',   label:'Corrida Lateral'},
  {id:'chutar',  label:'Chute'},      {id:'arremesso', label:'Arremesso'},
  {id:'receber', label:'Recepção'},   {id:'driblar',   label:'Drible'},
  {id:'rebater', label:'Rebater'},    {id:'rolar',     label:'Rolar'},
  {id:'underhand',label:'Arremesso Abaixo'},
]

// ── Field Exercise Library — vinculada a padrões TGMD-3 ───────────────────────
// Cada exercício tem: nome, descrição, equipamento, duração/reps,
// PSE alvo, modalidades, posições, padrões TGMD-3 que desenvolve
const FIELD_EXERCISES = [
  // ── CORRIDA E VELOCIDADE ──────────────────────────────────────────────────
  {
    id:'f01', name:'Sprint Curto com Saída Parada',
    desc:'Saída explosiva de posição parada, sprint de 5–10m, desaceleração controlada. Repetir com variação de sinal.',
    equip:'Cones', duracao:'6–8 reps × 10m', pse:'6–7',
    modalidades:['futebol','futsal'],
    posicoes:['ala','atacante','goleiro'],
    tgmd:['corrida','lateral'],
    categoria:'Velocidade',
  },
  {
    id:'f02', name:'Corrida em Zigue-Zague (Slalom)',
    desc:'Correr entre cones em zigue-zague, mantendo centro de gravidade baixo. Cronometrar e progredir.',
    equip:'Cones (6–8)', duracao:'4–6 reps', pse:'5–6',
    modalidades:['futebol','futsal','atletismo'],
    posicoes:['ala','meia','zagueiro','fixo'],
    tgmd:['corrida','lateral','galope'],
    categoria:'Agilidade',
  },
  {
    id:'f03', name:'Corrida com Mudança de Direção (T-Test)',
    desc:'Percurso em T: frente, lateral esquerda, lateral direita, volta. Medir tempo e evolução.',
    equip:'Cones (4)', duracao:'4–6 reps', pse:'6–7',
    modalidades:['futebol','futsal','basquete'],
    posicoes:['todos'],
    tgmd:['corrida','lateral'],
    categoria:'Agilidade',
  },
  {
    id:'f04', name:'Skipping Alto',
    desc:'Corrida no lugar com elevação máxima de joelho. Foco em frequência e coordenação braço-perna.',
    equip:'Nenhum', duracao:'4 × 20s', pse:'5–6',
    modalidades:['futebol','futsal','atletismo'],
    posicoes:['todos'],
    tgmd:['corrida','passada'],
    categoria:'Velocidade',
  },
  {
    id:'f05', name:'Corrida Lateral com Passadas Cruzadas',
    desc:'Deslocamento lateral com passadas cruzadas (crossover). Manter olhar à frente, não cruzar os pés.',
    equip:'Cones', duracao:'5 × 10m cada lado', pse:'4–5',
    modalidades:['futebol','futsal','basquete'],
    posicoes:['ala','meia','goleiro','fixo'],
    tgmd:['lateral','galope'],
    categoria:'Agilidade',
  },
  // ── SALTO E ATERRISSAGEM ──────────────────────────────────────────────────
  {
    id:'f06', name:'Salto Bilateral sobre Obstáculo',
    desc:'Saltar sobre cone baixo ou corda, aterrissar com ambos os pés simultaneamente, absorver impacto com flexão.',
    equip:'Cones baixos ou corda', duracao:'3 × 8 reps', pse:'5–6',
    modalidades:['futebol','futsal','volei','basquete'],
    posicoes:['goleiro','atacante'],
    tgmd:['salto_h','salto_v'],
    categoria:'Potência',
  },
  {
    id:'f07', name:'Salto Unilateral com Aterrissagem Controlada',
    desc:'Impulsão em um pé, aterrissar no mesmo pé, manter equilíbrio 2s antes do próximo salto.',
    equip:'Nenhum', duracao:'3 × 6 reps cada perna', pse:'5–6',
    modalidades:['futebol','futsal'],
    posicoes:['atacante','ala'],
    tgmd:['salto_h','salto_v','lateral'],
    categoria:'Potência',
  },
  {
    id:'f08', name:'Salto com Rotação 90°',
    desc:'Salto vertical com giro de 90° no ar, aterrissagem estável. Progredir para 180°.',
    equip:'Nenhum', duracao:'3 × 6 reps', pse:'5–6',
    modalidades:['futebol','futsal','ginastica'],
    posicoes:['goleiro','pivô'],
    tgmd:['salto_v'],
    categoria:'Potência',
  },
  {
    id:'f09', name:'Pular Corda — Variações de Ritmo',
    desc:'Pular corda em ritmo constante, depois alternar pernas, depois duplo giro. Progressão por fase LTAD.',
    equip:'Corda de pular', duracao:'3 × 90s', pse:'4–5',
    modalidades:['futebol','futsal','atletismo'],
    posicoes:['todos'],
    tgmd:['salto_h','salto_v','corrida'],
    categoria:'Coordenação',
  },
  // ── REFLEXO E REAÇÃO ──────────────────────────────────────────────────────
  {
    id:'f10', name:'Reação à Queda de Bola',
    desc:'Professor segura bola na altura do ombro e solta sem aviso. Atleta reage e pega antes do segundo quique.',
    equip:'Bola', duracao:'10–15 repetições', pse:'4–5',
    modalidades:['futebol','futsal','tenis','basquete'],
    posicoes:['goleiro','ala'],
    tgmd:['receber','lateral'],
    categoria:'Reflexo',
  },
  {
    id:'f11', name:'Reação a Sinal Visual (Cores/Mãos)',
    desc:'Professor levanta mão direita = sprint direita, esquerda = sprint esquerda, ambas = agachar. Alternância rápida.',
    equip:'Nenhum', duracao:'4–5 séries de 30s', pse:'5–6',
    modalidades:['futebol','futsal'],
    posicoes:['goleiro','todos'],
    tgmd:['corrida','lateral'],
    categoria:'Reflexo',
  },
  {
    id:'f12', name:'Mergulho Lateral com Bola (Goleiro)',
    desc:'Professor arremessa bola lateral, goleiro mergulha para defesa, aterrissagem com rolamento controlado.',
    equip:'Bola, colchonete', duracao:'3 × 6 cada lado', pse:'5–6',
    modalidades:['futebol','futsal'],
    posicoes:['goleiro'],
    tgmd:['lateral','receber','salto_h'],
    categoria:'Reflexo',
  },
  {
    id:'f13', name:'Bola na Parede — Reação de Rebote',
    desc:'Lançar bola contra a parede e reagir ao rebote imprevisível. Aumentar distância e velocidade progressivamente.',
    equip:'Bola, parede', duracao:'3 × 1min', pse:'4–5',
    modalidades:['futebol','futsal','tenis'],
    posicoes:['goleiro','ala'],
    tgmd:['receber','arremesso','lateral'],
    categoria:'Reflexo',
  },
  // ── DRIBLE E CONTROLE ─────────────────────────────────────────────────────
  {
    id:'f14', name:'Drible em Escada de Agilidade',
    desc:'Condução de bola pela escada de agilidade com diferentes padrões de pisada. Um toque por quadrado.',
    equip:'Escada de agilidade, bola', duracao:'4–6 passes completos', pse:'4–5',
    modalidades:['futebol','futsal'],
    posicoes:['ala','meia','atacante'],
    tgmd:['driblar','corrida','lateral'],
    categoria:'Coordenação',
  },
  {
    id:'f15', name:'Drible com Mudança de Ritmo',
    desc:'Condução lenta → aceleração explosiva a cada sinal do professor. Treina variação de velocidade com bola.',
    equip:'Bola, cones', duracao:'6–8 repetições × 15m', pse:'5–6',
    modalidades:['futebol','futsal'],
    posicoes:['ala','atacante','meia'],
    tgmd:['driblar','corrida'],
    categoria:'Agilidade',
  },
  {
    id:'f16', name:'Finta e Aceleração (1×0)',
    desc:'Atleta executa finta sobre cone (simulando adversário) e acelera em espaço aberto. Alternar lado de finta.',
    equip:'Cones, bola', duracao:'5–6 reps cada lado', pse:'5–6',
    modalidades:['futebol','futsal'],
    posicoes:['ala','atacante'],
    tgmd:['driblar','lateral','corrida'],
    categoria:'Agilidade',
  },
  // ── CHUTE E FINALIZAÇÃO ───────────────────────────────────────────────────
  {
    id:'f17', name:'Chute Estático com Foco em Técnica',
    desc:'Chute parado, foco no padrão: passo de aproximação, apoio lateral, contato com peito do pé, follow-through completo.',
    equip:'Bola, gol ou alvo', duracao:'3 × 8 chutes cada perna', pse:'3–4',
    modalidades:['futebol','futsal'],
    posicoes:['atacante','ala','meia','zagueiro','fixo'],
    tgmd:['chutar'],
    categoria:'Técnica Motora',
  },
  {
    id:'f18', name:'Chute após Passe (Primeira Bola)',
    desc:'Parceiro passa, atleta chuta de primeira. Foco em posicionamento do corpo antes de receber a bola.',
    equip:'Bola, parceiro, gol', duracao:'3 × 8 reps', pse:'4–5',
    modalidades:['futebol','futsal'],
    posicoes:['atacante','ala','meia'],
    tgmd:['chutar','receber'],
    categoria:'Técnica Motora',
  },
  {
    id:'f19', name:'Chute em Movimento (Sprint + Finalização)',
    desc:'Sprint de 5–8m, recebe bola rolada pelo professor, finaliza ao gol. Treina chute sob fadiga e movimento.',
    equip:'Bola, gol, cones', duracao:'6–8 reps', pse:'6–7',
    modalidades:['futebol','futsal'],
    posicoes:['atacante','ala'],
    tgmd:['chutar','corrida'],
    categoria:'Técnica Motora',
  },
  // ── RECEPÇÃO E PASSE ──────────────────────────────────────────────────────
  {
    id:'f20', name:'Recepção com Amortecimento',
    desc:'Professor arremessa bola em diferentes alturas. Atleta amorte com pé, coxa ou peito conforme a trajetória.',
    equip:'Bola, parceiro', duracao:'3 × 10 reps', pse:'3–4',
    modalidades:['futebol','futsal'],
    posicoes:['todos'],
    tgmd:['receber','underhand'],
    categoria:'Técnica Motora',
  },
  {
    id:'f21', name:'Passe e Movimento (Joga e Corre)',
    desc:'Atleta passa para professor e corre para novo espaço. Professor devolve. Treina passe + reposicionamento.',
    equip:'Bola, parceiro', duracao:'4 × 45s', pse:'4–5',
    modalidades:['futebol','futsal'],
    posicoes:['meia','fixo','zagueiro'],
    tgmd:['receber','chutar','corrida'],
    categoria:'Técnica Motora',
  },
  // ── EQUILÍBRIO E PROPRIOCEPÇÃO ────────────────────────────────────────────
  {
    id:'f22', name:'Equilíbrio Unipodal com Bola',
    desc:'Manter equilíbrio em um pé enquanto conduz bola lentamente com o outro. Progredir com olhos fechados.',
    equip:'Bola', duracao:'3 × 30s cada pé', pse:'3–4',
    modalidades:['futebol','futsal'],
    posicoes:['goleiro','todos'],
    tgmd:['lateral','salto_h'],
    categoria:'Equilíbrio',
  },
  {
    id:'f23', name:'Giro 360° e Recuperação de Equilíbrio (Pivô)',
    desc:'Girar 360° com ou sem bola e aterrissar estável. Treina senso cinestésico e posicionamento corporal.',
    equip:'Bola (opcional)', duracao:'3 × 8 reps', pse:'4–5',
    modalidades:['futsal'],
    posicoes:['pivô','atacante'],
    tgmd:['salto_v','lateral'],
    categoria:'Equilíbrio',
  },
  // ── CONDICIONAMENTO ESPECÍFICO ────────────────────────────────────────────
  {
    id:'f24', name:'Shuttle Run (20–5m)',
    desc:'Correr 5m, tocar chão, voltar, correr 10m, tocar, voltar, 15m, tocar, voltar. Cronometrar.',
    equip:'Cones', duracao:'4–6 reps com 60s descanso', pse:'7–8',
    modalidades:['futebol','futsal','basquete'],
    posicoes:['todos'],
    tgmd:['corrida','lateral'],
    categoria:'Condicionamento',
  },
  {
    id:'f25', name:'Circuito de Estações com Bola',
    desc:'4 estações (drible, chute, recepção, sprint) de 30s cada, 15s de transição. 3 voltas completas.',
    equip:'Bola, cones, gol', duracao:'3 voltas (~12min)', pse:'6–7',
    modalidades:['futebol','futsal'],
    posicoes:['todos'],
    tgmd:['driblar','chutar','receber','corrida'],
    categoria:'Condicionamento',
  },
  {
    id:'f26', name:'Rebounder — Defesa Sequencial (Goleiro)',
    desc:'Professor chuta 5 bolas seguidas (curta recuperação), goleiro defende cada uma. Treina condicionamento de jogo.',
    equip:'Bolas (5+), gol', duracao:'4–5 séries', pse:'7–8',
    modalidades:['futebol','futsal'],
    posicoes:['goleiro'],
    tgmd:['receber','lateral','salto_h','salto_v'],
    categoria:'Condicionamento',
  },
  {
    id:'f27', name:'Corrida com Coletes — Resistência de Velocidade',
    desc:'Sprint de 20m com colete de resistência (elástico ou parceiro segurando). Desenvolve força específica de corrida.',
    equip:'Colete de resistência ou elástico', duracao:'5–6 × 20m', pse:'7–8',
    modalidades:['futebol','atletismo'],
    posicoes:['ala','atacante'],
    tgmd:['corrida'],
    categoria:'Condicionamento',
  },
]

// Categorias e posições para filtro
const FIELD_CATEGORIES = ['Todas','Velocidade','Agilidade','Potência','Reflexo','Coordenação','Técnica Motora','Equilíbrio','Condicionamento']
const FIELD_POSITIONS  = ['Todos','goleiro','ala','atacante','meia','pivô','zagueiro','fixo']

const EXERCISE_BANK = [
  // PEITO
  {name:'Supino Reto (Barra)',     type:'Peito',       sets:'4', reps:'8–10',  rest:'90s',  tip:'Escápulas retraídas, barra desce até o peito'},
  {name:'Supino Inclinado (Halter)',type:'Peito',      sets:'3', reps:'10–12', rest:'75s',  tip:'Ângulo de 30–45°, cotovelos a 45° do tronco'},
  {name:'Crucifixo (Halter)',      type:'Peito',       sets:'3', reps:'12–15', rest:'60s',  tip:'Leve flexão dos cotovelos, amplitude controlada'},
  {name:'Flexão de Braço',         type:'Peito',       sets:'3', reps:'10–15', rest:'60s',  tip:'Corpo rígido, peito toca o chão'},
  {name:'Peck Deck',               type:'Peito',       sets:'3', reps:'12–15', rest:'60s',  tip:'Adução horizontal controlada, sem hiperestender'},
  // COSTAS
  {name:'Barra Fixa',              type:'Costas',      sets:'4', reps:'6–10',  rest:'90s',  tip:'Escápulas deprimidas na fase excêntrica'},
  {name:'Remada Curvada (Barra)',   type:'Costas',     sets:'4', reps:'8–10',  rest:'90s',  tip:'Tronco a 45°, cotovelos próximos ao corpo'},
  {name:'Puxada Frontal (Polia)',   type:'Costas',     sets:'3', reps:'10–12', rest:'75s',  tip:'Puxar até a clavícula, não atrás da nuca'},
  {name:'Remada Baixa (Polia)',     type:'Costas',     sets:'3', reps:'10–12', rest:'75s',  tip:'Peito ereto, escápulas se aproximam no final'},
  {name:'Remada Unilateral (Halter)',type:'Costas',    sets:'3', reps:'10–12', rest:'60s',  tip:'Rotação mínima de quadril, cotovelo alto'},
  // BÍCEPS
  {name:'Rosca Direta (Barra)',     type:'Bíceps',     sets:'3', reps:'10–12', rest:'60s',  tip:'Cotovelos fixos ao lado do tronco'},
  {name:'Rosca Alternada (Halter)', type:'Bíceps',     sets:'3', reps:'10–12', rest:'60s',  tip:'Supinação completa no topo do movimento'},
  {name:'Rosca Martelo',           type:'Bíceps',      sets:'3', reps:'12–15', rest:'60s',  tip:'Neutro, treina braquial e braquiorradial'},
  {name:'Rosca Scott',             type:'Bíceps',      sets:'3', reps:'10–12', rest:'60s',  tip:'Isola o bíceps, evita compensação de ombro'},
  // TRÍCEPS
  {name:'Tríceps Pulley (Polia)',   type:'Tríceps',    sets:'3', reps:'12–15', rest:'60s',  tip:'Cotovelos fixos, extensão completa'},
  {name:'Tríceps Testa (Barra EZ)', type:'Tríceps',    sets:'3', reps:'10–12', rest:'60s',  tip:'Cotovelos apontados para o teto'},
  {name:'Tríceps Francês (Halter)', type:'Tríceps',    sets:'3', reps:'12–15', rest:'60s',  tip:'Controle na fase excêntrica'},
  {name:'Flexão Fechada',          type:'Tríceps',     sets:'3', reps:'10–15', rest:'60s',  tip:'Mãos na largura dos ombros, cotovelos ao corpo'},
  // OMBRO
  {name:'Desenvolvimento (Halter)', type:'Ombro',      sets:'4', reps:'10–12', rest:'75s',  tip:'Cotovelos a 90° na posição inicial'},
  {name:'Elevação Lateral',        type:'Ombro',       sets:'3', reps:'12–15', rest:'60s',  tip:'Leve flexão do cotovelo, evita trapézio'},
  {name:'Elevação Frontal',        type:'Ombro',       sets:'3', reps:'12–15', rest:'60s',  tip:'Até a altura dos ombros, movimento lento'},
  {name:'Desenvolvimento Arnold',   type:'Ombro',      sets:'3', reps:'10–12', rest:'75s',  tip:'Rotação completa, ativa todas as porções'},
  // QUADRÍCEPS
  {name:'Agachamento Livre',        type:'Quadríceps', sets:'4', reps:'8–12',  rest:'90s',  tip:'Joelhos na linha dos pés, tronco ereto'},
  {name:'Agachamento Goblet',       type:'Quadríceps', sets:'3', reps:'12–15', rest:'75s',  tip:'Ótimo para iniciantes e crianças'},
  {name:'Leg Press',                type:'Quadríceps', sets:'4', reps:'10–15', rest:'75s',  tip:'Não travar os joelhos na extensão'},
  {name:'Afundo (Lunge)',           type:'Quadríceps', sets:'3', reps:'10–12', rest:'60s',  tip:'Joelho traseiro próximo ao chão, tronco ereto'},
  {name:'Cadeira Extensora',        type:'Quadríceps', sets:'3', reps:'12–15', rest:'60s',  tip:'Extensão completa, fase excêntrica 3s'},
  {name:'Agachamento Unilateral',   type:'Quadríceps', sets:'3', reps:'8–10',  rest:'75s',  tip:'Pistol squat adaptado, excelente para futebol'},
  // POSTERIOR/GLÚTEO
  {name:'Levantamento Terra',       type:'Posterior',  sets:'4', reps:'6–8',   rest:'120s', tip:'Barra sobre os pés, empurre o chão'},
  {name:'Mesa Flexora',             type:'Posterior',  sets:'3', reps:'10–12', rest:'75s',  tip:'Quadril levemente inclinado, fase excêntrica lenta'},
  {name:'Stiff (Terra Romeno)',      type:'Posterior',  sets:'4', reps:'8–12',  rest:'90s',  tip:'Joelhos semiflexionados, barra próxima ao corpo'},
  {name:'Cadeira Flexora',          type:'Posterior',  sets:'3', reps:'12–15', rest:'60s',  tip:'Evitar compensação de quadril'},
  {name:'Glúteo 4 Apoios',          type:'Glúteo',     sets:'3', reps:'15–20', rest:'45s',  tip:'Joelho a 90°, empurra o calcanhar para o teto'},
  {name:'Hip Thrust (Barra)',        type:'Glúteo',     sets:'4', reps:'10–12', rest:'75s',  tip:'Queixo no peito, extensão completa de quadril'},
  {name:'Agachamento Sumô',         type:'Glúteo',     sets:'3', reps:'12–15', rest:'75s',  tip:'Pés mais abertos, joelhos seguem os pés'},
  {name:'Elevação Pélvica',         type:'Glúteo',     sets:'3', reps:'15–20', rest:'45s',  tip:'Versão sem peso, excelente para iniciantes'},
  // PANTURRILHA
  {name:'Panturrilha em Pé',        type:'Panturrilha',sets:'4', reps:'15–20', rest:'45s',  tip:'Amplitude total, pausa no topo'},
  {name:'Panturrilha Sentado',      type:'Panturrilha',sets:'3', reps:'15–20', rest:'45s',  tip:'Sóleo dominante, joelhos a 90°'},
  // CORE
  {name:'Prancha Frontal',          type:'Core',       sets:'3', reps:'30–60s',rest:'45s',  tip:'Quadril neutro, não elevar o quadril'},
  {name:'Prancha Lateral',          type:'Core',       sets:'3', reps:'20–40s',rest:'45s',  tip:'Corpo em linha reta, apoio no antebraço'},
  {name:'Abdominal Crunch',         type:'Core',       sets:'3', reps:'15–20', rest:'45s',  tip:'Cervical neutra, foco na contração'},
  {name:'Dead Bug',                 type:'Core',       sets:'3', reps:'8–10',  rest:'45s',  tip:'Lombar no chão, extensão contralateral'},
  {name:'Pallof Press',             type:'Core',       sets:'3', reps:'10–12', rest:'45s',  tip:'Resistência à rotação, excelente para esporte'},
  {name:'Rotação de Tronco',        type:'Core',       sets:'3', reps:'12–15', rest:'45s',  tip:'Movimento controlado, não usar impulso'},
  {name:'Abdominal Bicicleta',      type:'Core',       sets:'3', reps:'15–20', rest:'45s',  tip:'Ótimo para crianças e adolescentes'},
  {name:'Superman',                 type:'Core',       sets:'3', reps:'12–15', rest:'45s',  tip:'Extensão simultânea de braço e perna opostos'},
  // FULL BODY / FUNCIONAL
  {name:'Agachamento com Salto',    type:'Full Body',  sets:'3', reps:'8–10',  rest:'90s',  tip:'Aterrissar suavemente com joelhos levemente flexionados'},
  {name:'Burpee',                   type:'Full Body',  sets:'3', reps:'8–12',  rest:'90s',  tip:'Movimento completo, ritmo controlado'},
  {name:'Kettlebell Swing',         type:'Full Body',  sets:'4', reps:'12–15', rest:'60s',  tip:'Impulsão de quadril, não é um agachamento'},
  {name:'Pular Corda',              type:'Cardio',     sets:'3', reps:'2–3min',rest:'60s',  tip:'Pulos baixos, aterrissagem no antepé'},
  {name:'Corrida (Esteira)',        type:'Cardio',     sets:'1', reps:'20–40min',rest:'—',  tip:'PSE 3–5, conversa possível'},
  {name:'Bicicleta Ergométrica',    type:'Cardio',     sets:'1', reps:'20–40min',rest:'—',  tip:'RPM 70–90, resistência moderada'},
  {name:'Afundo com Rotação',       type:'Full Body',  sets:'3', reps:'10–12', rest:'60s',  tip:'Rotação de tronco no passo — futebol e esportes'},
  {name:'Step Up (Caixote)',        type:'Full Body',  sets:'3', reps:'10–12', rest:'60s',  tip:'Empurrar pelo calcanhar do pé apoiado'},
  {name:'Remada TRX',              type:'Costas',      sets:'3', reps:'10–15', rest:'60s',  tip:'Corpo em prancha, cotovelos passam o tronco'},
  // INFANTOJUVENIL / FUNCIONAL
  {name:'Agachamento com Peso Corporal', type:'Quadríceps', sets:'3', reps:'15–20', rest:'45s', tip:'Para crianças: foco em técnica, sem carga externa'},
  {name:'Flexão de Braço Adaptada', type:'Peito',      sets:'3', reps:'10–15', rest:'45s',  tip:'Apoio nos joelhos se necessário'},
  {name:'Salto Vertical',          type:'Full Body',   sets:'4', reps:'6–8',   rest:'90s',  tip:'LTAD: desenvolve potência e coordenação'},
  {name:'Corrida Lateral (Shuffle)',type:'Full Body',  sets:'4', reps:'10–15m',rest:'60s',  tip:'Futebol: agilidade e mudança de direção'},
  {name:'Passe e Recepção com Bola',type:'Full Body',  sets:'3', reps:'10–15', rest:'45s',  tip:'Coordenação olho-mão, padrão motor fundamental'},
  {name:'Equilíbrio Unipodal',     type:'Core',        sets:'3', reps:'20–30s',rest:'30s',  tip:'Olhos abertos → fechados para progredir'},
  {name:'Gato-Vaca (Mobilidade)',  type:'Core',        sets:'2', reps:'10–15', rest:'30s',  tip:'Mobilidade torácica e lombar'},
  {name:'Mobilidade de Quadril',   type:'Full Body',   sets:'2', reps:'8–10',  rest:'30s',  tip:'90/90, world greatest stretch'},
]

// ── Workout Templates ─────────────────────────────────────────────────────────
const WORKOUT_TEMPLATES = {
  // Futebol + Criança (FUNdamentals)
  futebol_crianca: {
    label: 'Futebol — FUNdamentals (6–12 anos)',
    color: '#34D399',
    days: [
      { name:'Treino A — Multilateral', focus:'Full Body + Coordenação', day_of_week:'Ter',
        exercises:[
          {name:'Agachamento com Peso Corporal', type:'Quadríceps', sets:'3', reps:'15',    rest:'45s', tip:'Foco em técnica'},
          {name:'Flexão de Braço Adaptada',      type:'Peito',       sets:'3', reps:'10',    rest:'45s', tip:'Apoio nos joelhos'},
          {name:'Salto Vertical',                type:'Full Body',   sets:'3', reps:'6',     rest:'60s', tip:'Aterrissagem suave'},
          {name:'Corrida Lateral (Shuffle)',     type:'Full Body',   sets:'4', reps:'10m',   rest:'45s', tip:'Agilidade'},
          {name:'Prancha Frontal',               type:'Core',        sets:'3', reps:'20s',   rest:'30s', tip:'Core estável'},
          {name:'Equilíbrio Unipodal',           type:'Core',        sets:'3', reps:'20s',   rest:'30s', tip:'Olhos abertos'},
        ]
      },
      { name:'Treino B — Coordenação', focus:'Habilidades Motoras + Core', day_of_week:'Qui',
        exercises:[
          {name:'Corrida Lateral (Shuffle)',     type:'Full Body',   sets:'4', reps:'15m',   rest:'45s', tip:'Mudança de direção'},
          {name:'Afundo (Lunge)',                type:'Quadríceps',  sets:'3', reps:'10',     rest:'45s', tip:'Sem carga extra'},
          {name:'Abdominal Bicicleta',           type:'Core',        sets:'3', reps:'15',     rest:'30s', tip:'Coordenação contralateral'},
          {name:'Step Up (Caixote)',             type:'Full Body',   sets:'3', reps:'10',     rest:'45s', tip:'Empurrar pelo calcanhar'},
          {name:'Superman',                      type:'Core',        sets:'3', reps:'12',     rest:'30s', tip:'Extensão controlada'},
          {name:'Pular Corda',                   type:'Cardio',      sets:'3', reps:'2min',   rest:'60s', tip:'Coordenação ritmo'},
        ]
      },
    ]
  },
  // Futebol + Adolescente (Learn to Train / Train to Train)
  futebol_adolescente: {
    label: 'Futebol — Train to Train (12–17 anos)',
    color: '#60A5FA',
    days: [
      { name:'Treino A — Membros Inferiores', focus:'Posterior + Glúteo + Core', day_of_week:'Seg',
        exercises:[
          {name:'Agachamento Livre',             type:'Quadríceps',  sets:'4', reps:'10–12', rest:'75s',  tip:'Foco em técnica, até 70% 1RM'},
          {name:'Stiff (Terra Romeno)',           type:'Posterior',   sets:'3', reps:'10–12', rest:'75s',  tip:'Cadeia posterior do futebol'},
          {name:'Afundo com Rotação',            type:'Full Body',   sets:'3', reps:'10',    rest:'60s',  tip:'Transferência esportiva'},
          {name:'Hip Thrust (Barra)',             type:'Glúteo',      sets:'3', reps:'12',    rest:'60s',  tip:'Potência de chute'},
          {name:'Prancha Frontal',               type:'Core',        sets:'3', reps:'40s',   rest:'30s',  tip:'Estabilizador central'},
          {name:'Pallof Press',                  type:'Core',        sets:'3', reps:'10',    rest:'45s',  tip:'Resistência à rotação'},
        ]
      },
      { name:'Treino B — Membros Superiores', focus:'Empurrão + Puxada Balanceados', day_of_week:'Qua',
        exercises:[
          {name:'Supino Reto (Barra)',            type:'Peito',       sets:'4', reps:'10–12', rest:'75s',  tip:'70% 1RM máx adolescente'},
          {name:'Puxada Frontal (Polia)',          type:'Costas',      sets:'4', reps:'10–12', rest:'75s',  tip:'Equilíbrio pull/push'},
          {name:'Desenvolvimento (Halter)',        type:'Ombro',       sets:'3', reps:'10–12', rest:'60s',  tip:'Estabilidade escapular'},
          {name:'Remada Curvada (Barra)',          type:'Costas',      sets:'3', reps:'10–12', rest:'75s',  tip:'Postura futebol'},
          {name:'Dead Bug',                       type:'Core',        sets:'3', reps:'8',     rest:'45s',  tip:'Coordenação contralateral'},
        ]
      },
      { name:'Treino C — Potência + Agilidade', focus:'Explosão + Velocidade', day_of_week:'Sex',
        exercises:[
          {name:'Agachamento com Salto',          type:'Full Body',   sets:'4', reps:'6–8',   rest:'90s',  tip:'Pliometria — base do futebol'},
          {name:'Corrida Lateral (Shuffle)',      type:'Full Body',   sets:'4', reps:'15m',   rest:'60s',  tip:'Agilidade e mudança de direção'},
          {name:'Step Up (Caixote)',              type:'Full Body',   sets:'3', reps:'10',    rest:'60s',  tip:'Unilateral — assimetria futebol'},
          {name:'Kettlebell Swing',               type:'Full Body',   sets:'3', reps:'12',    rest:'75s',  tip:'Potência de quadril'},
          {name:'Corrida (Esteira)',              type:'Cardio',      sets:'1', reps:'20min',  rest:'—',   tip:'PSE 5–6, resistência aeróbia'},
        ]
      },
    ]
  },
  // Saúde e Bem-Estar — qualquer adulto
  saude: {
    label: 'Saúde e Bem-Estar — Funcional',
    color: '#34D399',
    days: [
      { name:'Treino A — Funcional Inferior', focus:'Quadril + Core + Equilíbrio', day_of_week:'Seg',
        exercises:[
          {name:'Agachamento Goblet',             type:'Quadríceps',  sets:'3', reps:'12–15', rest:'60s',  tip:'Multiarticular, padrão funcional'},
          {name:'Stiff (Terra Romeno)',            type:'Posterior',   sets:'3', reps:'12–15', rest:'60s',  tip:'Mobilidade de quadril'},
          {name:'Elevação Pélvica',               type:'Glúteo',      sets:'3', reps:'15–20', rest:'45s',  tip:'Sem carga, foco em ativação'},
          {name:'Afundo (Lunge)',                 type:'Quadríceps',  sets:'3', reps:'12',    rest:'60s',  tip:'Equilíbrio e funcionalidade'},
          {name:'Panturrilha em Pé',              type:'Panturrilha', sets:'3', reps:'15–20', rest:'45s',  tip:'Amplitude total'},
          {name:'Prancha Frontal',                type:'Core',        sets:'3', reps:'30s',   rest:'30s',  tip:'Core estabilizador'},
        ]
      },
      { name:'Treino B — Funcional Superior', focus:'Puxada + Empurrão + Mobilidade', day_of_week:'Qua',
        exercises:[
          {name:'Flexão de Braço',               type:'Peito',       sets:'3', reps:'10–15', rest:'60s',  tip:'Peso corporal, funcional'},
          {name:'Remada Unilateral (Halter)',     type:'Costas',      sets:'3', reps:'12–15', rest:'60s',  tip:'Equilíbrio pull/push'},
          {name:'Desenvolvimento (Halter)',       type:'Ombro',       sets:'3', reps:'12–15', rest:'60s',  tip:'Carga leve, padrão funcional'},
          {name:'Gato-Vaca (Mobilidade)',         type:'Core',        sets:'2', reps:'12',    rest:'30s',  tip:'Mobilidade torácica'},
          {name:'Mobilidade de Quadril',          type:'Full Body',   sets:'2', reps:'8',     rest:'30s',  tip:'90/90, prevenção de lesão'},
          {name:'Dead Bug',                       type:'Core',        sets:'3', reps:'8',     rest:'45s',  tip:'Core funcional profundo'},
        ]
      },
      { name:'Cardio + Mobilidade', focus:'Saúde Cardiovascular + Flexibilidade', day_of_week:'Sex',
        exercises:[
          {name:'Bicicleta Ergométrica',          type:'Cardio',      sets:'1', reps:'30min',  rest:'—',   tip:'PSE 3–4, zona de saúde cardiovascular'},
          {name:'Corrida (Esteira)',              type:'Cardio',      sets:'1', reps:'20min',  rest:'—',   tip:'Alternativa: caminhada rápida PSE 3'},
          {name:'Prancha Lateral',               type:'Core',        sets:'3', reps:'25s',   rest:'30s',  tip:'Estabilidade lateral'},
          {name:'Equilíbrio Unipodal',            type:'Core',        sets:'3', reps:'25s',   rest:'30s',  tip:'Prevenção de quedas (idosos)'},
        ]
      },
    ]
  },
  // Ganho de Massa — adulto
  massa: {
    label: 'Ganho de Massa — Hipertrofia',
    color: '#A78BFA',
    days: [
      { name:'Treino A — Peito + Tríceps', focus:'Push', day_of_week:'Seg',
        exercises:[
          {name:'Supino Reto (Barra)',            type:'Peito',       sets:'4', reps:'6–10',  rest:'90s',  tip:'Tensão mecânica — hipertrofia'},
          {name:'Supino Inclinado (Halter)',       type:'Peito',       sets:'3', reps:'10–12', rest:'75s',  tip:'Porção clavicular'},
          {name:'Crucifixo (Halter)',             type:'Peito',       sets:'3', reps:'12–15', rest:'60s',  tip:'Estresse metabólico'},
          {name:'Tríceps Pulley (Polia)',          type:'Tríceps',     sets:'3', reps:'12–15', rest:'60s',  tip:'Isolamento final'},
          {name:'Tríceps Testa (Barra EZ)',        type:'Tríceps',     sets:'3', reps:'10–12', rest:'60s',  tip:'Cabeça longa do tríceps'},
        ]
      },
      { name:'Treino B — Costas + Bíceps', focus:'Pull', day_of_week:'Ter',
        exercises:[
          {name:'Barra Fixa',                    type:'Costas',      sets:'4', reps:'6–10',  rest:'90s',  tip:'Amplitude completa'},
          {name:'Remada Curvada (Barra)',          type:'Costas',      sets:'4', reps:'8–10',  rest:'90s',  tip:'Volume de costas'},
          {name:'Puxada Frontal (Polia)',          type:'Costas',      sets:'3', reps:'10–12', rest:'75s',  tip:'Pré-exaustão'},
          {name:'Rosca Direta (Barra)',            type:'Bíceps',      sets:'3', reps:'10–12', rest:'60s',  tip:'Curl clássico'},
          {name:'Rosca Martelo',                  type:'Bíceps',      sets:'3', reps:'12–15', rest:'60s',  tip:'Braquial + braquiorradial'},
        ]
      },
      { name:'Treino C — Membros Inferiores', focus:'Quadríceps + Posterior + Glúteo', day_of_week:'Qui',
        exercises:[
          {name:'Agachamento Livre',              type:'Quadríceps',  sets:'5', reps:'6–10',  rest:'120s', tip:'Rainha dos exercícios'},
          {name:'Leg Press',                      sets:'4', reps:'10–12', type:'Quadríceps',  rest:'90s',  tip:'Volume adicional'},
          {name:'Stiff (Terra Romeno)',            type:'Posterior',   sets:'4', reps:'8–12',  rest:'90s',  tip:'Cadeia posterior'},
          {name:'Mesa Flexora',                   type:'Posterior',   sets:'3', reps:'10–12', rest:'75s',  tip:'Isolamento isquiotibial'},
          {name:'Panturrilha em Pé',              type:'Panturrilha', sets:'4', reps:'15–20', rest:'45s',  tip:'Amplitude total'},
        ]
      },
      { name:'Treino D — Ombros + Core', focus:'Deltoide + Estabilidade', day_of_week:'Sex',
        exercises:[
          {name:'Desenvolvimento (Halter)',       type:'Ombro',       sets:'4', reps:'10–12', rest:'75s',  tip:'Volume de ombro'},
          {name:'Elevação Lateral',              type:'Ombro',       sets:'4', reps:'12–15', rest:'60s',  tip:'Porção medial'},
          {name:'Elevação Frontal',              type:'Ombro',       sets:'3', reps:'12–15', rest:'60s',  tip:'Porção anterior'},
          {name:'Prancha Frontal',               type:'Core',        sets:'3', reps:'45s',   rest:'30s',  tip:'Core forte = mais força'},
          {name:'Rotação de Tronco',             type:'Core',        sets:'3', reps:'15',    rest:'30s',  tip:'Oblíquos'},
        ]
      },
    ]
  },
  // Força e Performance
  forca: {
    label: 'Força e Performance',
    color: '#EF4444',
    days: [
      { name:'Treino A — Empurrão Horizontal', focus:'Força Máxima Peito', day_of_week:'Seg',
        exercises:[
          {name:'Supino Reto (Barra)',            type:'Peito',       sets:'5', reps:'3–5',   rest:'3min', tip:'85–90% 1RM, força máxima'},
          {name:'Supino Inclinado (Halter)',       type:'Peito',       sets:'3', reps:'6–8',   rest:'2min', tip:'Volume acessório'},
          {name:'Tríceps Testa (Barra EZ)',        type:'Tríceps',     sets:'3', reps:'6–8',   rest:'90s',  tip:'Acessório de força'},
          {name:'Prancha Frontal',               type:'Core',        sets:'3', reps:'45s',   rest:'30s',  tip:'Transferência de força'},
        ]
      },
      { name:'Treino B — Puxão + Posterior', focus:'Força Costas + Deadlift', day_of_week:'Qua',
        exercises:[
          {name:'Levantamento Terra',             type:'Posterior',   sets:'5', reps:'3–5',   rest:'3min', tip:'Rei dos exercícios compostos'},
          {name:'Barra Fixa',                    type:'Costas',      sets:'4', reps:'5–6',   rest:'2min', tip:'Adição de carga externa'},
          {name:'Remada Curvada (Barra)',          type:'Costas',      sets:'4', reps:'6–8',   rest:'2min', tip:'Volume posterior'},
          {name:'Rosca Direta (Barra)',            type:'Bíceps',      sets:'3', reps:'6–8',   rest:'90s',  tip:'Bíceps forte = pull mais forte'},
        ]
      },
      { name:'Treino C — Agachamento + Perna', focus:'Força Membros Inferiores', day_of_week:'Sex',
        exercises:[
          {name:'Agachamento Livre',              type:'Quadríceps',  sets:'5', reps:'3–5',   rest:'3min', tip:'85–90% 1RM, força máxima'},
          {name:'Leg Press',                      type:'Quadríceps',  sets:'3', reps:'6–8',   rest:'2min', tip:'Acessório'},
          {name:'Stiff (Terra Romeno)',            type:'Posterior',   sets:'4', reps:'6–8',   rest:'90s',  tip:'Força de cadeia posterior'},
          {name:'Panturrilha em Pé',              type:'Panturrilha', sets:'4', reps:'12–15', rest:'60s',  tip:'Força de panturrilha'},
        ]
      },
    ]
  },
  // Condicionamento
  condicionamento: {
    label: 'Condicionamento Físico',
    color: '#FBBF24',
    days: [
      { name:'Treino A — Circuito Full Body', focus:'Resistência Muscular + Cardio', day_of_week:'Seg',
        exercises:[
          {name:'Agachamento Goblet',             type:'Quadríceps',  sets:'3', reps:'15–20', rest:'30s',  tip:'Alta repetição, pouco descanso'},
          {name:'Flexão de Braço',               type:'Peito',       sets:'3', reps:'15–20', rest:'30s',  tip:'Circuito'},
          {name:'Hip Thrust (Barra)',             type:'Glúteo',      sets:'3', reps:'15–20', rest:'30s',  tip:'Cadeia posterior'},
          {name:'Remada TRX',                    type:'Costas',      sets:'3', reps:'15–20', rest:'30s',  tip:'Pull funcional'},
          {name:'Burpee',                        type:'Full Body',   sets:'3', reps:'10',    rest:'60s',  tip:'Condicionamento total'},
          {name:'Prancha Frontal',               type:'Core',        sets:'3', reps:'30s',   rest:'30s',  tip:'Estabilidade'},
        ]
      },
      { name:'Treino B — Intervalado + Força', focus:'HIIT + Resistência', day_of_week:'Qua',
        exercises:[
          {name:'Kettlebell Swing',              type:'Full Body',   sets:'4', reps:'15',    rest:'45s',  tip:'Potência e cardio'},
          {name:'Agachamento com Salto',         type:'Full Body',   sets:'4', reps:'10',    rest:'45s',  tip:'Pliometria'},
          {name:'Afundo (Lunge)',                type:'Quadríceps',  sets:'3', reps:'12',    rest:'45s',  tip:'Unilateral'},
          {name:'Corrida (Esteira)',             type:'Cardio',      sets:'1', reps:'20min',  rest:'—',   tip:'PSE 6–7, zona de condicionamento'},
        ]
      },
      { name:'Treino C — Cardio + Core', focus:'Aeróbio + Estabilidade', day_of_week:'Sex',
        exercises:[
          {name:'Bicicleta Ergométrica',         type:'Cardio',      sets:'1', reps:'30min',  rest:'—',   tip:'Zona 2 — 150 min OMS/semana'},
          {name:'Prancha Lateral',              type:'Core',        sets:'3', reps:'30s',   rest:'30s',  tip:'Estabilidade lateral'},
          {name:'Rotação de Tronco',            type:'Core',        sets:'3', reps:'15',    rest:'30s',  tip:'Força rotacional'},
          {name:'Step Up (Caixote)',            type:'Full Body',   sets:'3', reps:'12',    rest:'45s',  tip:'Funcional'},
        ]
      },
    ]
  },
}

// Detecta qual template usar baseado no aluno
const getTemplate = (goal, ageGroup, sport) => {
  if(sport==='futebol'||sport==='futsal') {
    if(ageGroup==='crianca') return WORKOUT_TEMPLATES.futebol_crianca
    if(ageGroup==='adolescente') return WORKOUT_TEMPLATES.futebol_adolescente
  }
  if(goal==='Saúde e Bem-Estar') return WORKOUT_TEMPLATES.saude
  if(goal==='Ganho de Massa') return WORKOUT_TEMPLATES.massa
  if(goal==='Força e Performance') return WORKOUT_TEMPLATES.forca
  if(goal==='Condicionamento') return WORKOUT_TEMPLATES.condicionamento
  if(goal==='Iniciação Esportiva'||goal==='Desenvolvimento Atlético') {
    if(ageGroup==='crianca') return WORKOUT_TEMPLATES.futebol_crianca
    return WORKOUT_TEMPLATES.futebol_adolescente
  }
  return WORKOUT_TEMPLATES.massa // fallback
}

// Sugestões de grupos por objetivo/esporte
const getSuggestedTypes = (goal, sport) => {
  if(sport==='futebol'||sport==='futsal') return ['Posterior','Glúteo','Quadríceps','Core','Full Body']
  if(sport==='natacao') return ['Costas','Ombro','Core','Full Body']
  if(sport==='basquete') return ['Quadríceps','Glúteo','Core','Full Body']
  if(goal==='Saúde e Bem-Estar') return ['Full Body','Core','Cardio','Quadríceps','Costas']
  if(goal==='Ganho de Massa') return ['Peito','Costas','Quadríceps','Ombro','Bíceps']
  if(goal==='Força e Performance') return ['Quadríceps','Posterior','Peito','Costas','Core']
  if(goal==='Condicionamento') return ['Full Body','Cardio','Core','Quadríceps','Glúteo']
  return EXERCISE_TYPES.slice(0,5)
}

// 1RM
const calc1RM = (carga, reps) => {
  if(!carga||!reps||reps<1||carga<=0) return null
  const r=Number(reps), c=Number(carga)
  if(r===1) return c
  if(r>15) return null
  const epley=c*(1+r/30), brzycki=r>10?null:c/(1.0278-0.0278*r), lombardi=c*Math.pow(r,0.10)
  const valid=[epley,brzycki,lombardi].filter(v=>v!==null&&v>0)
  return Math.round(valid.reduce((a,b)=>a+b,0)/valid.length)
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  wrap:        { minHeight:'100vh', background:'#080B12', padding:'24px 20px' },
  inner:       { maxWidth:860, margin:'0 auto' },
  back:        { background:'none', border:'none', color:'#475569', fontSize:14, cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', gap:6 },
  header:      { background:'#0D1117', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.07)', marginBottom:20, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' },
  input:       { background:'#161B27', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:14, outline:'none' },
  select:      { background:'#161B27', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'9px 12px', color:'#E2E8F0', fontSize:14, outline:'none' },
  btn:         (c='#34D399') => ({ background:`linear-gradient(135deg,${c},${c}bb)`, border:'none', borderRadius:8, padding:'9px 16px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }),
  outlineBtn:  { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 14px', color:'#94A3B8', fontWeight:600, fontSize:13, cursor:'pointer' },
  dayCard:     (c) => ({ background:'#0D1117', borderRadius:16, border:`1px solid ${c}35`, overflow:'hidden', marginBottom:14 }),
  dayHeader:   (c) => ({ background:`${c}12`, padding:'14px 20px', borderBottom:`1px solid ${c}25`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }),
  exRow:       { padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:8, alignItems:'flex-start' },
  addRow:      { padding:'16px 20px', background:'rgba(255,255,255,0.02)' },
  delBtn:      { background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:14, padding:'2px 6px', flexShrink:0 },
  smallInput:  { background:'#161B27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'7px 10px', color:'#E2E8F0', fontSize:12, outline:'none', width:'100%' },
  smallSelect: { background:'#161B27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'7px 10px', color:'#E2E8F0', fontSize:12, outline:'none', width:'100%' },
}

const emptyEx = { name:'', sets:'3', reps:'10–12', rest:'60s', tip:'', type:'Peito' }

// ── 1RM Calculator ────────────────────────────────────────────────────────────
function OneRMCalc({ exId, ageGroup, onApply, onClose }) {
  const [carga, setCarga] = useState('')
  const [reps,  setReps]  = useState('')
  const oneRM = calc1RM(carga, reps)
  const rest  = AGE_RESTRICTIONS[ageGroup]||AGE_RESTRICTIONS.adulto_jovem

  return (
    <div style={{ background:'#0A0F1E', border:'1px solid #1E293B', borderRadius:12, padding:16, margin:'8px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#E2E8F0' }}>Calculadora 1RM</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:16 }}>✕</button>
      </div>
      {rest.warning && <div style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#FBBF24', marginBottom:12 }}>{rest.warning}</div>}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        {[['Carga (kg)',carga,setCarga,'ex: 80'],['Reps (1–15)',reps,setReps,'ex: 8']].map(([lbl,val,set,ph])=>(
          <div key={lbl} style={{ flex:1, minWidth:100 }}>
            <div style={{ fontSize:9, color:'#475569', marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>{lbl}</div>
            <input type="number" style={{ ...s.smallInput, fontSize:15, fontWeight:700, textAlign:'center' }} value={val} onChange={e=>set(e.target.value)} placeholder={ph}/>
          </div>
        ))}
        <div style={{ flex:1, minWidth:100, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ fontSize:9, color:'#475569', marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>1RM Estimado</div>
          <div style={{ background:oneRM?'rgba(167,139,250,0.12)':'#161B27', border:`1px solid ${oneRM?'#A78BFA40':'rgba(255,255,255,0.07)'}`, borderRadius:6, padding:'7px', textAlign:'center', fontSize:18, fontWeight:900, color:oneRM?'#A78BFA':'#334155' }}>
            {oneRM?`${oneRM} kg`:'—'}
          </div>
        </div>
      </div>
      {oneRM && (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {ZONES.map(zone=>{
            const blocked=rest.blockedZones.includes(zone.label)
            const maxAllowed=Math.round(oneRM*rest.maxPct/100)
            const lo=Math.round(oneRM*zone.pct[0]/100)
            const hi=Math.round(Math.min(oneRM*zone.pct[1]/100,maxAllowed))
            const load=lo<=maxAllowed?{lo,hi}:null
            return(
              <div key={zone.label} style={{ display:'flex', alignItems:'center', gap:8, background:blocked?'rgba(255,255,255,0.02)':`${zone.color}10`, border:`1px solid ${blocked?'rgba(255,255,255,0.05)':zone.color+'30'}`, borderRadius:8, padding:'7px 10px', opacity:blocked?0.4:1 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:blocked?'#334155':zone.color }}>{blocked?'Restrito — ':''}{zone.label}</div>
                  <div style={{ fontSize:9, color:'#475569' }}>{zone.reps} reps · {zone.rest}</div>
                </div>
                {load&&!blocked?(
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:900, color:zone.color }}>{load.lo}–{load.hi}kg</div>
                    <button onClick={()=>onApply({reps:zone.reps,rest:zone.rest})} style={{ fontSize:9, background:`${zone.color}20`, border:`1px solid ${zone.color}40`, borderRadius:5, padding:'2px 7px', color:zone.color, cursor:'pointer', fontWeight:700 }}>Usar</button>
                  </div>
                ):<div style={{ fontSize:10, color:'#1E293B' }}>{blocked?'Restrito':'—'}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Exercise Search ───────────────────────────────────────────────────────────
function ExerciseSearch({ onSelect, suggestedTypes, ageGroup }) {
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const inputRef = useRef(null)

  const results = EXERCISE_BANK.filter(ex => {
    const matchQ = !query || ex.name.toLowerCase().includes(query.toLowerCase())
    const matchT = !filterType || ex.type === filterType
    // Block exercises inappropriate for age
    const rest = AGE_RESTRICTIONS[ageGroup]||AGE_RESTRICTIONS.adulto_jovem
    if(ageGroup==='crianca' && (ex.sets==='5'||ex.reps==='3–5'||ex.reps==='1–5')) return false
    return matchQ && matchT
  }).slice(0,8)

  return (
    <div style={{ position:'relative' }}>
      {/* Suggested type chips */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
        <span style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1, alignSelf:'center' }}>Sugerido:</span>
        {suggestedTypes.map(t=>(
          <button key={t} onClick={()=>setFilterType(filterType===t?'':t)}
            style={{ padding:'3px 10px', borderRadius:20, border:`1px solid ${filterType===t?'#34D399':'rgba(255,255,255,0.1)'}`, background:filterType===t?'rgba(52,211,153,0.12)':'transparent', color:filterType===t?'#34D399':'#475569', fontSize:11, cursor:'pointer', fontWeight:filterType===t?700:400 }}>
            {t}
          </button>
        ))}
        {filterType&&<button onClick={()=>setFilterType('')} style={{ padding:'3px 8px', borderRadius:20, border:'1px solid rgba(255,255,255,0.06)', background:'transparent', color:'#334155', fontSize:10, cursor:'pointer' }}>× Limpar</button>}
      </div>

      {/* Search input */}
      <input
        ref={inputRef}
        style={{ ...s.smallInput, marginBottom:4 }}
        value={query}
        onChange={e=>setQuery(e.target.value)}
        placeholder="Buscar exercício... (ex: agachamento, remada, prancha)"
      />

      {/* Results dropdown */}
      {(query||filterType) && results.length>0 && (
        <div style={{ background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
          {results.map((ex,i)=>(
            <div key={i} onClick={()=>{onSelect(ex);setQuery('');setFilterType('')}}
              style={{ padding:'9px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>{ex.name}</div>
                <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{ex.tip}</div>
              </div>
              <div style={{ flexShrink:0, display:'flex', gap:5, alignItems:'center' }}>
                <span style={{ fontSize:9, background:'rgba(255,255,255,0.06)', padding:'2px 7px', borderRadius:20, color:'#64748B' }}>{ex.type}</span>
                <span style={{ fontSize:9, color:'#334155' }}>{ex.sets}×{ex.reps}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {(query||filterType) && results.length===0 && (
        <div style={{ padding:'8px 12px', fontSize:12, color:'#334155', marginBottom:4 }}>Nenhum resultado — preencha manualmente abaixo</div>
      )}
    </div>
  )
}

// ── Template Modal ────────────────────────────────────────────────────────────
function TemplateModal({ student, ageGroup, onApply, onClose }) {
  const goal  = student?.goal||''
  const sport = student?.sport||''
  const suggested = getTemplate(goal, ageGroup, sport)
  const [selected, setSelected] = useState(suggested ? Object.keys(WORKOUT_TEMPLATES).find(k=>WORKOUT_TEMPLATES[k]===suggested)||'massa' : 'massa')

  const tpl = WORKOUT_TEMPLATES[selected]
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0D1117', borderRadius:20, padding:24, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#E2E8F0' }}>Gerar Estrutura do Treino</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>Selecione um template e personalize depois</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>

        {/* Template selector */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
          {Object.entries(WORKOUT_TEMPLATES).map(([key,t])=>(
            <div key={key} onClick={()=>setSelected(key)}
              style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${selected===key?t.color+'60':'rgba(255,255,255,0.06)'}`, background:selected===key?`${t.color}10`:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:t.color, flexShrink:0 }}/>
              <span style={{ fontSize:13, fontWeight:selected===key?700:400, color:selected===key?t.color:'#94A3B8' }}>{t.label}</span>
              {suggested===t&&<span style={{ fontSize:9, background:'rgba(52,211,153,0.12)', color:'#34D399', border:'1px solid rgba(52,211,153,0.2)', borderRadius:20, padding:'1px 7px', marginLeft:'auto' }}>Sugerido</span>}
            </div>
          ))}
        </div>

        {/* Preview */}
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:14, marginBottom:18 }}>
          <div style={{ fontSize:10, color:'#475569', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Preview — {tpl.days.length} dias</div>
          {tpl.days.map((day,i)=>(
            <div key={i} style={{ marginBottom:8, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#E2E8F0', marginBottom:2 }}>{day.name} <span style={{ color:'#475569', fontWeight:400 }}>— {day.day_of_week}</span></div>
              <div style={{ fontSize:10, color:'#64748B' }}>{day.exercises.length} exercícios · {day.focus}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>onApply(tpl)} style={{ flex:1, ...s.btn(tpl.color), padding:'12px' }}>Aplicar Template</button>
          <button onClick={onClose} style={{ ...s.outlineBtn }}>Cancelar</button>
        </div>
        <div style={{ fontSize:10, color:'#1E293B', textAlign:'center', marginTop:8 }}>
          Todos os exercícios podem ser editados após aplicar
        </div>
      </div>
    </div>
  )
}

// ── TGMD Alert Card ──────────────────────────────────────────────────────────
function TGMDAlertCard({ tgmdScores, onOpenLibrary }) {
  if (!tgmdScores) return null
  const weak = TGMD3_ALL.filter(p =>
    tgmdScores[p.id] !== undefined && tgmdScores[p.id] < 2
  )
  if (weak.length === 0) return null

  const initial   = weak.filter(p => tgmdScores[p.id] === 0)
  const elementar = weak.filter(p => tgmdScores[p.id] === 1)

  return (
    <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.22)', borderRadius:14, padding:'14px 18px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:'#6366F1', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>
            Desenvolvimento Motor — TGMD-3
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
            {initial.map(p => (
              <span key={p.id} style={{ fontSize:11, fontWeight:700, color:'#F87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:6, padding:'2px 9px' }}>
                {p.label} — Inicial
              </span>
            ))}
            {elementar.map(p => (
              <span key={p.id} style={{ fontSize:11, fontWeight:600, color:'#FBBF24', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:6, padding:'2px 9px' }}>
                {p.label} — Elementar
              </span>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#475569', lineHeight:1.5 }}>
            {initial.length > 0
              ? `${initial.length} padrão(ões) Inicial — priorizar exercícios de campo específicos antes de progressões de carga.`
              : `${elementar.length} padrão(ões) Elementar — incluir exercícios de campo para consolidar antes de progredir.`
            }
          </div>
        </div>
        <button onClick={onOpenLibrary}
          style={{ flexShrink:0, padding:'8px 14px', borderRadius:9, border:'1px solid rgba(99,102,241,0.35)', background:'rgba(99,102,241,0.12)', color:'#818CF8', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          Ver exercícios de campo
        </button>
      </div>
    </div>
  )
}

// ── Field Library Modal ───────────────────────────────────────────────────────
function FieldLibraryModal({ tgmdScores, sport, position, onSelectExercise, onClose }) {
  const [category,    setCategory]    = useState('Todas')
  const [posFilter,   setPosFilter]   = useState('Todos')
  const [tgmdFilter,  setTgmdFilter]  = useState('')   // id of TGMD pattern
  const [search,      setSearch]      = useState('')
  const [detail,      setDetail]      = useState(null) // exercise being previewed

  // Weak patterns from TGMD — highlighted
  const weakIds = tgmdScores
    ? TGMD3_ALL.filter(p => tgmdScores[p.id] !== undefined && tgmdScores[p.id] < 2).map(p => p.id)
    : []

  // Auto-apply TGMD filter if weak patterns exist
  const results = FIELD_EXERCISES.filter(ex => {
    const matchCat  = category === 'Todas'   || ex.categoria === category
    const matchPos  = posFilter === 'Todos'  || ex.posicoes.includes(posFilter) || ex.posicoes.includes('todos')
    const matchTgmd = !tgmdFilter            || ex.tgmd.includes(tgmdFilter)
    const matchSrch = !search                || ex.name.toLowerCase().includes(search.toLowerCase()) || ex.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchPos && matchTgmd && matchSrch
  })

  const prioritized = results.filter(ex => ex.tgmd.some(t => weakIds.includes(t)))
  const rest        = results.filter(ex => !ex.tgmd.some(t => weakIds.includes(t)))
  const sorted      = weakIds.length > 0 ? [...prioritized, ...rest] : results

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:300, padding:'16px', overflowY:'auto' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0A0F1A', borderRadius:20, padding:24, width:'100%', maxWidth:620, border:'1px solid rgba(255,255,255,0.08)', marginTop:20 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#E2E8F0', marginBottom:3 }}>Biblioteca de Exercícios de Campo</div>
            <div style={{ fontSize:11, color:'#475569' }}>Exercícios físico-motores fora da academia · {FIELD_EXERCISES.length} no banco</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>

        {/* TGMD priority banner */}
        {weakIds.length > 0 && (
          <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:11, color:'#818CF8' }}>
            <strong style={{ color:'#A5B4FC' }}>Prioridade para este atleta:</strong>{' '}
            {TGMD3_ALL.filter(p=>weakIds.includes(p.id)).map(p=>p.label).join(', ')} — exercícios vinculados aparecem primeiro
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            style={{ ...s.smallInput, fontSize:13 }} placeholder="Buscar por nome ou descrição..."/>

          {/* Category chips */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {FIELD_CATEGORIES.map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)}
                style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${category===cat?'#6366F1':'rgba(255,255,255,0.08)'}`, background:category===cat?'rgba(99,102,241,0.15)':'transparent', color:category===cat?'#818CF8':'#475569', fontSize:11, cursor:'pointer', fontWeight:category===cat?700:400 }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Position chips */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            <span style={{ fontSize:9, color:'#334155', alignSelf:'center', textTransform:'uppercase', letterSpacing:1 }}>Posição:</span>
            {FIELD_POSITIONS.map(pos => (
              <button key={pos} onClick={()=>setPosFilter(pos)}
                style={{ padding:'3px 10px', borderRadius:20, border:`1px solid ${posFilter===pos?'#FBBF24':'rgba(255,255,255,0.07)'}`, background:posFilter===pos?'rgba(251,191,36,0.1)':'transparent', color:posFilter===pos?'#FBBF24':'#475569', fontSize:11, cursor:'pointer', fontWeight:posFilter===pos?700:400 }}>
                {pos.charAt(0).toUpperCase()+pos.slice(1)}
              </button>
            ))}
          </div>

          {/* TGMD pattern filter */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1 }}>Padrão TGMD:</span>
            {TGMD3_ALL.map(p => {
              const isWeak = weakIds.includes(p.id)
              const active = tgmdFilter === p.id
              return (
                <button key={p.id} onClick={()=>setTgmdFilter(active?'':p.id)}
                  style={{ padding:'3px 9px', borderRadius:20, border:`1px solid ${active?'#A78BFA':isWeak?'rgba(248,113,113,0.3)':'rgba(255,255,255,0.06)'}`, background:active?'rgba(167,139,250,0.15)':isWeak?'rgba(248,113,113,0.07)':'transparent', color:active?'#C084FC':isWeak?'#F87171':'#334155', fontSize:10, cursor:'pointer', fontWeight:active||isWeak?700:400 }}>
                  {p.label}{isWeak?' ●':''}
                </button>
              )
            })}
            {tgmdFilter && <button onClick={()=>setTgmdFilter('')} style={{ fontSize:10, color:'#334155', background:'none', border:'none', cursor:'pointer' }}>× limpar</button>}
          </div>
        </div>

        {/* Count */}
        <div style={{ fontSize:10, color:'#334155', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
          {sorted.length} exercício{sorted.length!==1?'s':''} encontrado{sorted.length!==1?'s':''}
          {prioritized.length>0&&!tgmdFilter?` · ${prioritized.length} prioritário${prioritized.length!==1?'s':''}`:'' }
        </div>

        {/* Exercise list */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:400, overflowY:'auto' }}>
          {sorted.map((ex, idx) => {
            const isPriority = weakIds.length>0 && ex.tgmd.some(t=>weakIds.includes(t))
            const isDetail   = detail?.id === ex.id
            return (
              <div key={ex.id} style={{ background: isPriority?'rgba(99,102,241,0.06)':'rgba(255,255,255,0.03)', border:`1px solid ${isPriority?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:12, overflow:'hidden' }}>
                {/* Row */}
                <div style={{ padding:'11px 14px', display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer' }} onClick={()=>setDetail(isDetail?null:ex)}>
                  {/* Priority dot */}
                  <div style={{ width:8, height:8, borderRadius:'50%', background:isPriority?'#6366F1':'rgba(255,255,255,0.1)', flexShrink:0, marginTop:5 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>{ex.name}</span>
                      <span style={{ fontSize:9, color:'#475569', background:'rgba(255,255,255,0.05)', padding:'1px 7px', borderRadius:20 }}>{ex.categoria}</span>
                      {isPriority && <span style={{ fontSize:9, color:'#818CF8', fontWeight:700 }}>● Prioritário</span>}
                    </div>
                    {/* TGMD tags */}
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:3 }}>
                      {ex.tgmd.map(tid => {
                        const p = TGMD3_ALL.find(x=>x.id===tid)
                        const isW = weakIds.includes(tid)
                        return p ? (
                          <span key={tid} style={{ fontSize:9, fontWeight:isW?700:400, color:isW?'#F87171':'#334155', background:isW?'rgba(248,113,113,0.08)':'rgba(255,255,255,0.04)', borderRadius:4, padding:'1px 6px', border:`1px solid ${isW?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.06)'}` }}>
                            {p.label}
                          </span>
                        ) : null
                      })}
                    </div>
                    <div style={{ fontSize:10, color:'#475569' }}>{ex.equip} · {ex.duracao} · PSE {ex.pse}</div>
                  </div>
                  <span style={{ fontSize:11, color:'#334155', flexShrink:0 }}>{isDetail?'▲':'▼'}</span>
                </div>

                {/* Detail expand */}
                {isDetail && (
                  <div style={{ padding:'0 14px 14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.65, marginBottom:12, paddingTop:10 }}>{ex.desc}</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                      {[
                        ['Equipamento', ex.equip],
                        ['Volume', ex.duracao],
                        ['PSE alvo', ex.pse],
                        ['Posições', ex.posicoes.includes('todos')?'Todos':ex.posicoes.join(', ')],
                      ].map(([lbl,val])=>(
                        <div key={lbl} style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize:8, color:'#334155', textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>{lbl}</div>
                          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{ onSelectExercise(ex); onClose() }}
                      style={{ width:'100%', padding:'10px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#6366F1,#4F46E5)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      + Adicionar ao Treino
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {sorted.length===0 && (
            <div style={{ textAlign:'center', padding:'30px 20px', color:'#334155', fontSize:13 }}>
              Nenhum exercício encontrado com esses filtros
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main WorkoutEditor ────────────────────────────────────────────────────────
export default function WorkoutEditor({ navigate, studentId, planId }) {
  const [plan, setPlan]             = useState(null)
  const [days, setDays]             = useState([])
  const [student, setStudent]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [newExForms, setNewExForms] = useState({})
  const [openCalc, setOpenCalc]     = useState(null)
  const [showTemplate,  setShowTemplate]  = useState(false)
  const [showField,     setShowField]     = useState(false)
  const [fieldDayId,    setFieldDayId]    = useState(null)

  const ageGroup     = getAgeGroup(student?.birth_date, student?.age)
  const suggestedTypes = getSuggestedTypes(student?.goal||'', student?.sport||'')

  useEffect(() => { fetchAll() }, [planId])

  const fetchAll = async () => {
    setLoading(true)
    const [{data:planData},{data:daysData},{data:studentData}] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('id',planId).single(),
      supabase.from('workout_days').select('*, exercises(*)').eq('plan_id',planId).order('order_index'),
      supabase.from('students').select('id,name,birth_date,age,goal,sport,sport_position,tgmd_scores,tgmd_date').eq('id',studentId).single(),
    ])
    if(planData) setPlan(planData)
    if(daysData) setDays(daysData.map(d=>({...d, exercises:(d.exercises||[]).sort((a,b)=>a.order_index-b.order_index)})))
    if(studentData) setStudent(studentData)
    setLoading(false)
  }

  const savePlanTitle = async () => {
    setSaving(true)
    await supabase.from('workout_plans').update({title:plan.title, status:plan.status, updated_at:new Date().toISOString()}).eq('id',planId)
    setSaving(false)
  }

  const addDay = async () => {
    const name = `Treino ${String.fromCharCode(65+days.length)}`
    const {data} = await supabase.from('workout_days').insert([{plan_id:planId, name, focus:'', day_of_week:'', order_index:days.length}]).select().single()
    if(data) setDays(d=>[...d,{...data, exercises:[]}])
  }

  const updateDay = async (dayId, field, val) => {
    setDays(d=>d.map(day=>day.id===dayId?{...day,[field]:val}:day))
    await supabase.from('workout_days').update({[field]:val}).eq('id',dayId)
  }

  const deleteDay = async (dayId) => {
    if(!confirm('Excluir este dia de treino e todos os exercícios?')) return
    await supabase.from('workout_days').delete().eq('id',dayId)
    setDays(d=>d.filter(day=>day.id!==dayId))
  }

  const addExercise = async (dayId, exData) => {
    const form = exData || (newExForms[dayId]||{...emptyEx})
    if(!form.name?.trim()) return
    const {data} = await supabase.from('exercises').insert([{
      day_id:dayId, name:form.name, sets:form.sets, reps:form.reps,
      rest:form.rest, tip:form.tip||'', type:form.type,
      order_index:(days.find(d=>d.id===dayId)?.exercises?.length||0)
    }]).select().single()
    if(data){
      setDays(d=>d.map(day=>day.id===dayId?{...day,exercises:[...day.exercises,data]}:day))
      if(!exData) setNewExForms(f=>({...f,[dayId]:{...emptyEx}}))
    }
  }

  const updateExercise = async (dayId, exId, field, val) => {
    setDays(d=>d.map(day=>day.id===dayId?{...day,exercises:day.exercises.map(ex=>ex.id===exId?{...ex,[field]:val}:ex)}:day))
    await supabase.from('exercises').update({[field]:val}).eq('id',exId)
  }

  const deleteExercise = async (dayId, exId) => {
    await supabase.from('exercises').delete().eq('id',exId)
    setDays(d=>d.map(day=>day.id===dayId?{...day,exercises:day.exercises.filter(ex=>ex.id!==exId)}:day))
  }

  const applyTemplate = async (tpl) => {
    setShowTemplate(false)
    // Delete existing days first
    for(const day of days) {
      await supabase.from('workout_days').delete().eq('id',day.id)
    }
    setDays([])
    // Create new days from template
    for(let i=0; i<tpl.days.length; i++) {
      const td = tpl.days[i]
      const {data:newDay} = await supabase.from('workout_days').insert([{
        plan_id:planId, name:td.name, focus:td.focus, day_of_week:td.day_of_week, order_index:i
      }]).select().single()
      if(newDay) {
        const exInserts = td.exercises.map((ex,j)=>({ day_id:newDay.id, name:ex.name, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip||'', type:ex.type, order_index:j }))
        const {data:exData} = await supabase.from('exercises').insert(exInserts).select()
        setDays(d=>[...d,{...newDay, exercises:(exData||[]).sort((a,b)=>a.order_index-b.order_index)}])
      }
    }
  }

  const getNewExForm  = (dayId) => newExForms[dayId]||{...emptyEx}
  const setNewExField = (dayId,field,val) => setNewExForms(f=>({...f,[dayId]:{...getNewExForm(dayId),[field]:val}}))

  if(loading) return <div style={{padding:40,color:'#475569'}}>Carregando treino...</div>
  if(!plan) return null

  const ageColor = AGE_GROUP_COLOR[ageGroup]
  const ageRestr = AGE_RESTRICTIONS[ageGroup]

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <button style={s.back} onClick={()=>navigate('student-detail',{id:studentId})}>← Voltar ao Aluno</button>

        {/* Plan header */}
        <div style={s.header}>
          <input style={{...s.input,flex:2,fontSize:18,fontWeight:700}} value={plan.title} onChange={e=>setPlan(p=>({...p,title:e.target.value}))} onBlur={savePlanTitle} placeholder="Nome do plano..."/>
          <select style={s.select} value={plan.status} onChange={e=>{setPlan(p=>({...p,status:e.target.value}));setTimeout(savePlanTitle,100)}}>
            {STATUS_OPTIONS.map(o=><option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
          </select>
          {student && (
            <div style={{display:'flex',alignItems:'center',gap:6,background:`${ageColor}15`,border:`1px solid ${ageColor}30`,borderRadius:8,padding:'6px 12px'}}>
              <span style={{fontSize:11,color:ageColor,fontWeight:700}}>{student.name} · {AGE_GROUP_LABEL[ageGroup]}</span>
            </div>
          )}
          {/* Template button */}
          <button onClick={()=>setShowTemplate(true)} style={{...s.btn('#6366F1'),display:'flex',alignItems:'center',gap:6,fontSize:12}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
            Gerar Estrutura
          </button>
          {/* Field library button */}
          <button onClick={()=>{setFieldDayId(null);setShowField(true)}} style={{...s.btn('#0891B2'),display:'flex',alignItems:'center',gap:6,fontSize:12}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            Campo
          </button>
          <div style={{fontSize:11,color:'#334155'}}>{saving?<span style={{color:'#FBBF24'}}>Salvando...</span>:'Salvo automaticamente'}</div>
        </div>

        {/* Age warning */}
        {ageRestr?.warning && (
          <div style={{background:'rgba(251,191,36,0.07)',border:'1px solid rgba(251,191,36,0.18)',borderRadius:12,padding:'10px 16px',fontSize:13,color:'#FBBF24',marginBottom:16}}>
            {ageRestr.warning}
          </div>
        )}

        {/* TGMD-3 alert card */}
        <TGMDAlertCard
          tgmdScores={student?.tgmd_scores}
          onOpenLibrary={()=>{setFieldDayId(null);setShowField(true)}}
        />

        {/* Days */}
        {days.map((day,idx)=>{
          const color = DAY_COLORS[idx%DAY_COLORS.length]
          const newEx = getNewExForm(day.id)
          return(
            <div key={day.id} style={s.dayCard(color)}>
              {/* Day header */}
              <div style={s.dayHeader(color)}>
                <div style={{display:'flex',gap:8,alignItems:'center',flex:1,flexWrap:'wrap'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:color,boxShadow:`0 0 6px ${color}`}}/>
                  <input style={{...s.input,fontWeight:700,color,background:'transparent',border:'none',fontSize:15,minWidth:80}} value={day.name} onChange={e=>updateDay(day.id,'name',e.target.value)} placeholder="Nome do treino"/>
                  <span style={{color:'#334155'}}>—</span>
                  <input style={{...s.input,fontSize:13,flex:1,minWidth:100}} value={day.focus||''} onChange={e=>updateDay(day.id,'focus',e.target.value)} placeholder="Foco (ex: Posterior + Core)"/>
                  <select style={{...s.input,fontSize:12,maxWidth:90}} value={day.day_of_week||''} onChange={e=>updateDay(day.id,'day_of_week',e.target.value)}>
                    <option value="">Dia...</option>
                    {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <button style={s.delBtn} onClick={()=>deleteDay(day.id)} title="Excluir dia">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{opacity:0.4}}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>

              {/* Exercise list */}
              {day.exercises.length>0 && (
                <div style={{padding:'4px 0'}}>
                  {/* Column headers */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr auto auto auto auto',gap:8,padding:'6px 16px 2px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    {['Exercício','Grupo','Séries','Reps','Desc.'].map(h=>(
                      <div key={h} style={{fontSize:9,color:'#334155',textTransform:'uppercase',letterSpacing:1}}>{h}</div>
                    ))}
                  </div>
                  {day.exercises.map(ex=>(
                    <div key={ex.id}>
                      <div style={s.exRow}>
                        {/* Exercise name + tip */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:4}}>
                            <input style={{...s.smallInput,fontWeight:600,flex:1}} value={ex.name} onChange={e=>updateExercise(day.id,ex.id,'name',e.target.value)} placeholder="Nome"/>
                            <button title="Calcular 1RM" onClick={()=>setOpenCalc(openCalc===ex.id?null:ex.id)}
                              style={{background:openCalc===ex.id?'rgba(167,139,250,0.2)':'rgba(167,139,250,0.06)',border:`1px solid ${openCalc===ex.id?'#A78BFA60':'rgba(167,139,250,0.15)'}`,borderRadius:6,padding:'4px 8px',color:'#A78BFA',fontSize:10,cursor:'pointer',fontWeight:700,flexShrink:0}}>
                              1RM
                            </button>
                            <button style={s.delBtn} onClick={()=>deleteExercise(day.id,ex.id)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{opacity:0.35}}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                          </div>
                          <input style={{...s.smallInput,fontSize:11,color:'#475569'}} value={ex.tip||''} onChange={e=>updateExercise(day.id,ex.id,'tip',e.target.value)} placeholder="Dica de execução (opcional)"/>
                        </div>
                        {/* Type */}
                        <select style={{...s.smallSelect,width:100,flexShrink:0}} value={ex.type||''} onChange={e=>updateExercise(day.id,ex.id,'type',e.target.value)}>
                          {EXERCISE_TYPES.map(t=><option key={t}>{t}</option>)}
                        </select>
                        {/* Sets / Reps / Rest */}
                        {[['sets','3','Sér'],['reps','10–12','Reps'],['rest','60s','Desc']].map(([field,ph,lbl])=>(
                          <input key={field} style={{...s.smallSelect,width:58,flexShrink:0}} value={ex[field]||''} onChange={e=>updateExercise(day.id,ex.id,field,e.target.value)} placeholder={ph}/>
                        ))}
                      </div>
                      {openCalc===ex.id && (
                        <div style={{padding:'0 16px 4px'}}>
                          <OneRMCalc exId={ex.id} ageGroup={ageGroup} onApply={({reps,rest})=>{updateExercise(day.id,ex.id,'reps',reps);updateExercise(day.id,ex.id,'rest',rest);setOpenCalc(null)}} onClose={()=>setOpenCalc(null)}/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add exercise row */}
              <div style={s.addRow}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontSize:10,color:'#334155',textTransform:'uppercase',letterSpacing:1,fontWeight:600}}>Adicionar Exercício</div>
                <button onClick={()=>{setFieldDayId(day.id);setShowField(true)}}
                  style={{fontSize:10,fontWeight:700,color:'#22D3EE',background:'rgba(8,145,178,0.08)',border:'1px solid rgba(8,145,178,0.2)',borderRadius:7,padding:'4px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h-2v-5H5v-2h5V5h2v5h5v2z"/></svg>
                  Exercício de campo
                </button>
              </div>

                {/* Search */}
                <ExerciseSearch
                  onSelect={ex=>setNewExForms(f=>({...f,[day.id]:{name:ex.name,sets:ex.sets,reps:ex.reps,rest:ex.rest,tip:ex.tip,type:ex.type}}))}
                  suggestedTypes={suggestedTypes}
                  ageGroup={ageGroup}
                />

                {/* Manual form */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px 60px 60px 60px',gap:6,marginBottom:8}}>
                  <input style={s.smallInput} value={newEx.name} onChange={e=>setNewExField(day.id,'name',e.target.value)} placeholder="Nome do exercício *"/>
                  <select style={s.smallSelect} value={newEx.type} onChange={e=>setNewExField(day.id,'type',e.target.value)}>
                    {EXERCISE_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  <input style={s.smallInput} value={newEx.sets} onChange={e=>setNewExField(day.id,'sets',e.target.value)} placeholder="3"/>
                  <input style={s.smallInput} value={newEx.reps} onChange={e=>setNewExField(day.id,'reps',e.target.value)} placeholder="10–12"/>
                  <input style={s.smallInput} value={newEx.rest} onChange={e=>setNewExField(day.id,'rest',e.target.value)} placeholder="60s"/>
                </div>
                <input style={{...s.smallInput,marginBottom:8,fontSize:11}} value={newEx.tip} onChange={e=>setNewExField(day.id,'tip',e.target.value)} placeholder="Dica de execução (opcional)"/>
                <button style={s.btn(color)} onClick={()=>addExercise(day.id)}>+ Adicionar ao Treino</button>
              </div>
            </div>
          )
        })}

        <button style={{...s.outlineBtn,width:'100%',padding:'16px',fontSize:14,borderStyle:'dashed',borderRadius:12}} onClick={addDay}>
          + Adicionar Dia de Treino
        </button>

        <div style={{marginTop:12,textAlign:'center',fontSize:11,color:'#1E293B'}}>
          Alterações salvas automaticamente
        </div>
      </div>

      {showTemplate && <TemplateModal student={student} ageGroup={ageGroup} onApply={applyTemplate} onClose={()=>setShowTemplate(false)}/>}

      {showField && (
        <FieldLibraryModal
          tgmdScores={student?.tgmd_scores}
          sport={student?.sport}
          position={student?.sport_position}
          onSelectExercise={async (fieldEx) => {
            const targetDayId = fieldDayId || (days[0]?.id)
            if(!targetDayId) return
            await addExercise(targetDayId, {
              name: fieldEx.name,
              sets: fieldEx.duracao.split('×')[0]?.trim().match(/\d+/)?.[0] || '3',
              reps: fieldEx.duracao,
              rest: '60s',
              tip:  fieldEx.desc.slice(0,120),
              type: 'Full Body',
            })
            setFieldDayId(null)
          }}
          onClose={()=>{ setShowField(false); setFieldDayId(null) }}
        />
      )}
    </div>
  )
}
