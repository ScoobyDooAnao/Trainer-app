// ═══════════════════════════════════════════════════════════════
// MotorSkillsSection.jsx
// Módulo de habilidades motoras para o WorkoutEditor.
// Aparece apenas para alunos criança/adolescente (age < 18).
// Integra-se ao dia de treino existente como uma seção colapsável.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { supabase } from '../supabase'

// ── Paleta por categoria motora ───────────────────────────────
export const MOTOR_CATEGORIES = {
  locomocao: {
    id: 'locomocao',
    label: 'Locomoção',
    icon: '🏃',
    color: '#34D399',
    desc: 'Correr, saltar, galopar, esquivar — padrões de deslocamento',
    fases: ['FUNdamentals', 'Learn to Train', 'Train to Train'],
  },
  manipulacao: {
    id: 'manipulacao',
    label: 'Manipulação',
    icon: '⚽',
    color: '#60A5FA',
    desc: 'Chutar, arremessar, receber, driblar — controle de objetos',
    fases: ['FUNdamentals', 'Learn to Train', 'Train to Train'],
  },
  equilibrio: {
    id: 'equilibrio',
    label: 'Equilíbrio',
    icon: '🤸',
    color: '#F472B6',
    desc: 'Unipodal, dinâmico, giroscópico — estabilidade corporal',
    fases: ['FUNdamentals', 'Learn to Train', 'Train to Train'],
  },
  coordenacao: {
    id: 'coordenacao',
    label: 'Coordenação',
    icon: '🎯',
    color: '#FBBF24',
    desc: 'Ritmo, lateralidade, espaço-temporal — sincronização motora',
    fases: ['FUNdamentals', 'Learn to Train'],
  },
  agilidade: {
    id: 'agilidade',
    label: 'Agilidade',
    icon: '⚡',
    color: '#F97316',
    desc: 'Mudança de direção, reação, velocidade de movimento',
    fases: ['Learn to Train', 'Train to Train', 'Train to Compete'],
  },
}

// ── Banco de atividades motoras ───────────────────────────────
// Cada atividade tem: nome, categoria, nível (1=fácil, 2=médio, 3=avançado),
// faixa etária ideal, tipo (jogo/exercício/brincadeira), duração, material, dica pedagógica
export const MOTOR_BANK = [
  // ── Locomoção ──────────────────────────────────────────────
  {
    name: 'Corrida com Mudança de Ritmo',
    cat: 'locomocao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '5-8min', material: 'Nenhum',
    sets: '3', reps: '30s cada ritmo', rest: '30s',
    tip: 'Alterne caminhada → trote → corrida a cada sinal do professor. Foco: fase aérea e apoio no antepé.',
    progressao: 'Adicionar saltos e esquivas entre as mudanças de ritmo.',
    ref: 'TGMD-3: padrão de corrida',
  },
  {
    name: 'Galope Lateral',
    cat: 'locomocao', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'brincadeira', duracao: '5min', material: 'Cones',
    sets: '4', reps: '15m ida e volta', rest: '30s',
    tip: 'Passo-toque rítmico lateral. Pé de chumbo sempre à frente. Não cruzar os pés.',
    progressao: 'Aumentar velocidade e adicionar obstáculos laterais.',
    ref: 'TGMD-3: galope',
  },
  {
    name: 'Salto em Distância (Dois Pés)',
    cat: 'locomocao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '8min', material: 'Fita ou giz',
    sets: '4', reps: '5 saltos', rest: '45s',
    tip: 'Pré-balanço de braços, joelhos semiflexionados, aterrissagem amortecida com flexão de joelhos.',
    progressao: 'Saltos unilaterais ou sobre obstáculos baixos.',
    ref: 'TGMD-3: salto horizontal',
  },
  {
    name: 'Circuito de Locomoção (Obstáculos)',
    cat: 'locomocao', nivel: 2, idadeMin: 8, idadeMax: 16,
    tipo: 'circuito', duracao: '12min', material: 'Cones, arcos, colchão',
    sets: '3', reps: '1 volta', rest: '60s',
    tip: 'Sequência: correr → saltar arco → galope → rolar no colchão → sprint final. Professor demonstra primeiro.',
    progressao: 'Aumentar distâncias e adicionar desvios.',
    ref: 'LTAD FUNdamentals: diversidade motora',
  },
  {
    name: 'Salto com Giro (180°)',
    cat: 'locomocao', nivel: 2, idadeMin: 9, idadeMax: 16,
    tipo: 'exercício', duracao: '6min', material: 'Nenhum',
    sets: '3', reps: '8 saltos', rest: '45s',
    tip: 'Impulsão bilateral, giro no ar, aterrissar no mesmo ponto de saída. Começa com 90°.',
    progressao: 'Giro 360° ou salto com giro + agachamento.',
    ref: 'TGMD-3: salto vertical + rotação',
  },
  {
    name: 'Corrida com Esquiva (Pega-pega Dinâmico)',
    cat: 'locomocao', nivel: 2, idadeMin: 7, idadeMax: 14,
    tipo: 'jogo', duracao: '10min', material: 'Coletes coloridos',
    sets: '2', reps: '5min por rodada', rest: '60s',
    tip: 'Variação: pega-pega com 2 pegadores e colete. Foco na mudança de direção com desaceleração antes da esquiva.',
    progressao: 'Reduzir o espaço ou aumentar pegadores.',
    ref: 'LTAD FUNdamentals: esquiva e reação',
  },
  {
    name: 'Skip (Passada Alternada)',
    cat: 'locomocao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '6min', material: 'Nenhum',
    sets: '4', reps: '20m', rest: '30s',
    tip: 'Alternância passo+salto com coordenação braço-perna oposta. Joelho sobe na altura do quadril.',
    progressao: 'Adicionar bola ou objeto seguro na mão.',
    ref: 'TGMD-3: passada (skip)',
  },
  {
    name: 'Salto Unipodal em Sequência',
    cat: 'locomocao', nivel: 3, idadeMin: 10, idadeMax: 17,
    tipo: 'exercício', duracao: '8min', material: 'Fita no chão',
    sets: '4', reps: '5 saltos cada pé', rest: '60s',
    tip: 'Saltos consecutivos no mesmo pé com aterrissagem controlada. Fase excêntrica lenta.',
    progressao: 'Salto lateral unipodal ou sobre obstáculos.',
    ref: 'NSCA Youth: pliometria unilateral básica',
  },

  // ── Manipulação ────────────────────────────────────────────
  {
    name: 'Chute ao Alvo (Distâncias Variadas)',
    cat: 'manipulacao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '8min', material: 'Bola, cones como alvo',
    sets: '4', reps: '5 chutes', rest: '30s',
    tip: 'Passo de aproximação, braços em equilíbrio, contato com peito do pé, follow-through completo. Variar distâncias 3-8m.',
    progressao: 'Bola em movimento ou alvo menor.',
    ref: 'TGMD-3: chute',
  },
  {
    name: 'Arremesso por Cima (Alvo na Parede)',
    cat: 'manipulacao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '8min', material: 'Bola pequena, fita na parede',
    sets: '3', reps: '8 arremessos', rest: '30s',
    tip: 'Rotação do tronco, transferência de peso, liberação acima do ombro. Braço oposto aponta o alvo.',
    progressao: 'Alvo menor, distância maior ou bola mais pesada.',
    ref: 'TGMD-3: arremesso por cima',
  },
  {
    name: 'Recepção com Duas Mãos',
    cat: 'manipulacao', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'exercício', duracao: '8min', material: 'Bola de borracha',
    sets: '4', reps: '10 recepções', rest: '30s',
    tip: 'Preparar as mãos em concha antes, olhos no objeto, absorver o impacto puxando as mãos para o corpo.',
    progressao: 'Aumentar distância, velocidade ou usar bola menor.',
    ref: 'TGMD-3: recepção',
  },
  {
    name: 'Drible Estacionário (Mão Dominante + Não Dominante)',
    cat: 'manipulacao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '6min', material: 'Bola de basquete ou borracha',
    sets: '3', reps: '30s cada mão', rest: '20s',
    tip: 'Contato com os dedos (não palma), altura do quadril, olhos para frente. Começa devagar.',
    progressao: 'Drible em deslocamento ou com obstáculos.',
    ref: 'TGMD-3: drible',
  },
  {
    name: 'Rebater (Bola Pendurada)',
    cat: 'manipulacao', nivel: 2, idadeMin: 8, idadeMax: 15,
    tipo: 'exercício', duracao: '8min', material: 'Bola pendurada, bastão ou raquete',
    sets: '3', reps: '10 rebatidas', rest: '45s',
    tip: 'Rotação de quadril, contato na altura da cintura, follow-through completo. Bola pendurada facilita o timing.',
    progressao: 'Bola lançada por parceiro ou velocidade variada.',
    ref: 'TGMD-3: rebater',
  },
  {
    name: 'Jogo de Bola 3x3 Adaptado',
    cat: 'manipulacao', nivel: 2, idadeMin: 9, idadeMax: 16,
    tipo: 'jogo', duracao: '15min', material: 'Bola, cones para gol',
    sets: '2', reps: '7min por jogo', rest: '90s',
    tip: 'Espaço reduzido, regra de 3 toques para forçar recepção e passe. Foco em manipulação, não em resultado.',
    progressao: 'Reduzir espaço, adicionar regra de drible obrigatório.',
    ref: 'LTAD Learn to Train: jogo reduzido',
  },
  {
    name: 'Arremesso por Baixo (Bolinha)',
    cat: 'manipulacao', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'exercício', duracao: '6min', material: 'Bolinha de tênis, alvo no chão',
    sets: '3', reps: '8 arremessos', rest: '30s',
    tip: 'Balanço pendular, transferência de peso, liberação na altura do joelho. Parece "boliche de pé".',
    progressao: 'Alvo menor ou distância maior.',
    ref: 'TGMD-3: arremesso por baixo',
  },
  {
    name: 'Caçador (Jogo de Esquiva e Recepção)',
    cat: 'manipulacao', nivel: 2, idadeMin: 8, idadeMax: 15,
    tipo: 'jogo', duracao: '12min', material: 'Bolas macias',
    sets: '2', reps: '6min por rodada', rest: '60s',
    tip: 'Time arremessa, outro esquiva. Combina arremesso, recepção e esquiva. Bola macia obrigatória.',
    progressao: 'Área menor ou mais bolas simultaneamente.',
    ref: 'LTAD FUNdamentals: manipulação em contexto',
  },

  // ── Equilíbrio e Estabilidade ──────────────────────────────
  {
    name: 'Equilíbrio Unipodal Estático',
    cat: 'equilibrio', nivel: 1, idadeMin: 6, idadeMax: 17,
    tipo: 'exercício', duracao: '5min', material: 'Nenhum',
    sets: '3', reps: '20-30s cada pé', rest: '20s',
    tip: 'Olhos abertos primeiro. Joelho levemente flexionado, quadril estável. Progredir: olhos fechados.',
    progressao: 'Superfície instável (espuma) ou movimentos de braço.',
    ref: 'TGMD-3: equilíbrio estático',
  },
  {
    name: 'Caminhada sobre Linha Reta (Equilíbrio Dinâmico)',
    cat: 'equilibrio', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'exercício', duracao: '6min', material: 'Fita no chão',
    sets: '4', reps: '10m ida e volta', rest: '20s',
    tip: 'Braços abertos para equilíbrio, olhar para frente (não para os pés). Progride: olhos fechados.',
    progressao: 'Carregar objeto na cabeça ou fechar os olhos.',
    ref: 'LTAD FUNdamentals: equilíbrio dinâmico',
  },
  {
    name: 'Estátua em Movimento (Jogo)',
    cat: 'equilibrio', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'jogo', duracao: '8min', material: 'Música',
    sets: '3', reps: '2min por rodada', rest: '30s',
    tip: 'Dança livre → música para → todos ficam estáticos em qualquer posição. Avalia equilíbrio em posições inesperadas.',
    progressao: 'Parar em posição de 1 pé ou com olhos fechados.',
    ref: 'LTAD FUNdamentals: equilíbrio estático imprevisível',
  },
  {
    name: 'Equilíbrio na Trave Baixa',
    cat: 'equilibrio', nivel: 2, idadeMin: 7, idadeMax: 14,
    tipo: 'exercício', duracao: '8min', material: 'Trave de ginástica ou banco',
    sets: '4', reps: '1 travessia', rest: '30s',
    tip: 'Braços abertos, passos lentos, olhar para frente. Varie: agachar na metade, girar 180°.',
    progressao: 'Carregar bola ou fechar os olhos brevemente.',
    ref: 'LTAD FUNdamentals: equilíbrio dinâmico elevado',
  },
  {
    name: 'Rolamento e Levantada (Ginástica Solo)',
    cat: 'equilibrio', nivel: 2, idadeMin: 7, idadeMax: 15,
    tipo: 'exercício', duracao: '10min', material: 'Colchão',
    sets: '3', reps: '6 rolamentos', rest: '45s',
    tip: 'Queixo no peito, rolar na coluna vertebral, levantar sem usar as mãos. Maturação giroscópica.',
    progressao: 'Rolamento lateral, rolamento com salto.',
    ref: 'LTAD FUNdamentals: controle giroscópico',
  },
  {
    name: 'Pular em Cima de 1 Pé (Hopscotch — Amarelinha)',
    cat: 'equilibrio', nivel: 2, idadeMin: 6, idadeMax: 14,
    tipo: 'brincadeira', duracao: '8min', material: 'Giz ou fita no chão',
    sets: '4', reps: '1 travessia', rest: '20s',
    tip: 'Sequência de casas: 2 pés → 1 pé → 2 pés. Aterrissagem controlada em 1 pé.',
    progressao: 'Sequência mais longa ou saltos maiores.',
    ref: 'TGMD-3: equilíbrio dinâmico unilateral',
  },
  {
    name: 'Equilíbrio com Perturbação (Par)',
    cat: 'equilibrio', nivel: 3, idadeMin: 10, idadeMax: 17,
    tipo: 'exercício', duracao: '6min', material: 'Nenhum',
    sets: '3', reps: '30s cada', rest: '30s',
    tip: 'Em duplas: 1 fica em equilíbrio unipodal, outro aplica leves empurrões nos ombros. Resposta de equilíbrio reativa.',
    progressao: 'Olhos fechados ou superfície instável.',
    ref: 'Propriocepção avançada: equilíbrio reativo',
  },

  // ── Coordenação ────────────────────────────────────────────
  {
    name: 'Palmas Rítmicas em Espelho (Par)',
    cat: 'coordenacao', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'brincadeira', duracao: '5min', material: 'Nenhum',
    sets: '3', reps: '1min por sequência', rest: '30s',
    tip: 'Em duplas frente a frente: sequências de palmas (cima, meio, lado, cruzado). Começa lento, aumenta velocidade.',
    progressao: 'Sequências mais longas ou em trio.',
    ref: 'Coordenação espaço-temporal: ritmo e lateralidade',
  },
  {
    name: 'Pular Corda (Coordenação de Entrada)',
    cat: 'coordenacao', nivel: 2, idadeMin: 7, idadeMax: 15,
    tipo: 'exercício', duracao: '8min', material: 'Corda',
    sets: '4', reps: '1min de pulos', rest: '45s',
    tip: 'Sincronização olho-pé com a corda. Começa com corda individual, depois corda girada por 2.',
    progressao: 'Pula corda dupla ou entrar em corda em movimento.',
    ref: 'Coordenação espaço-temporal: timing',
  },
  {
    name: 'Escada de Agilidade — Padrão Lateral',
    cat: 'coordenacao', nivel: 2, idadeMin: 8, idadeMax: 17,
    tipo: 'exercício', duracao: '10min', material: 'Escada de agilidade ou fita',
    sets: '5', reps: '1 travessia', rest: '30s',
    tip: 'Padrão: 2 dentro 2 fora lateral. Braços em ritmo oposto. Começa devagar até automatizar.',
    progressao: 'Aumentar velocidade, variar padrões (cruzado, ipsilateral).',
    ref: 'Coordenação: padrões de movimento ipsi e contralateral',
  },
  {
    name: 'Bolinha na Parede (Coordenação Olho-Mão)',
    cat: 'coordenacao', nivel: 1, idadeMin: 6, idadeMax: 14,
    tipo: 'exercício', duracao: '6min', material: 'Bolinha de tênis, parede',
    sets: '3', reps: '20 toques', rest: '30s',
    tip: 'Jogar bolinha na parede e pegar com 2 mãos. Variar: 1 mão, com palma, com as costas da mão.',
    progressao: 'Aumentar distância, pegar com 1 mão ou com troca de mãos.',
    ref: 'TGMD-3: coordenação olho-mão',
  },
  {
    name: 'Atividade de Lateralidade (Circuito Esquerda/Direita)',
    cat: 'coordenacao', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'circuito', duracao: '8min', material: 'Cones coloridos',
    sets: '3', reps: '1 volta', rest: '45s',
    tip: 'Professor grita "direita" ou "esquerda" → aluno toca o cone na direção correta. Depois: adicionar salto ou agachamento.',
    progressao: 'Aumentar velocidade das instruções ou adicionar distratores.',
    ref: 'Coordenação: lateralidade e dominância lateral',
  },
  {
    name: 'Jogo dos 10 Toques (Passe em Grupo)',
    cat: 'coordenacao', nivel: 2, idadeMin: 8, idadeMax: 16,
    tipo: 'jogo', duracao: '12min', material: 'Bola',
    sets: '2', reps: '6min por jogo', rest: '60s',
    tip: 'Time de 4-6 tenta dar 10 passes consecutivos. Outro time tenta interceptar. Combina coordenação espaço-temporal e antecipação.',
    progressao: 'Proibir passes para quem passou antes, reduzir o espaço.',
    ref: 'Coordenação espaço-temporal: antecipação de trajetória',
  },
  {
    name: 'Malabares com Lenço',
    cat: 'coordenacao', nivel: 1, idadeMin: 6, idadeMax: 12,
    tipo: 'brincadeira', duracao: '8min', material: 'Lenços coloridos (3)',
    sets: '4', reps: '2min de tentativas', rest: '30s',
    tip: 'Lenço cai devagar — facilita o timing. Começa com 1, depois 2. Ótimo para coordenação bilateral.',
    progressao: 'Bolas de malabarismo quando dominado.',
    ref: 'Coordenação bilateral e timing visual',
  },

  // ── Agilidade e Mudança de Direção ─────────────────────────
  {
    name: 'Cone Drill em T',
    cat: 'agilidade', nivel: 2, idadeMin: 9, idadeMax: 17,
    tipo: 'exercício', duracao: '10min', material: '4 cones',
    sets: '6', reps: '1 execução (cronometrada)', rest: '45s',
    tip: 'Disposição em T: sprint 10m, shuffle 5m esq, shuffle 10m dir, shuffle 5m centro, backpedal. Toque em cada cone.',
    progressao: 'Cronometrar e registrar evolução.',
    ref: 'T-Cone Test — mudança de direção multi-plano',
  },
  {
    name: 'Jogo de Reação (Sombra)',
    cat: 'agilidade', nivel: 1, idadeMin: 7, idadeMax: 16,
    tipo: 'jogo', duracao: '8min', material: 'Nenhum',
    sets: '4', reps: '45s por par', rest: '30s',
    tip: 'Em duplas: um lidera movimentos aleatórios, outro espelha como sombra. Desenvolve reação e antecipação.',
    progressao: 'Aumentar velocidade ou adicionar bola.',
    ref: 'Agilidade reativa: tempo de reação + mudança de direção',
  },
  {
    name: 'Shuttle Run (5-10-5)',
    cat: 'agilidade', nivel: 2, idadeMin: 9, idadeMax: 17,
    tipo: 'exercício', duracao: '8min', material: '3 cones',
    sets: '6', reps: '1 execução', rest: '60s',
    tip: 'Sprint 5m, toque cone, retorna 10m, toque cone, retorna 5m. Posição baixa na virada. Cronometrar.',
    progressao: 'Reagir a sinal visual em vez de partir por conta própria.',
    ref: '5-10-5 Shuttle — desaceleração e reaceleração',
  },
  {
    name: 'Pique-Bandeira (Jogo de Agilidade)',
    cat: 'agilidade', nivel: 1, idadeMin: 7, idadeMax: 14,
    tipo: 'jogo', duracao: '15min', material: 'Coletes ou panos coloridos',
    sets: '2', reps: '7min por jogo', rest: '90s',
    tip: 'Times tentam roubar o "colete-bandeira" do adversário. Foco em esquiva, sprint e mudança de direção situacional.',
    progressao: 'Reduzir campo, adicionar posições fixas.',
    ref: 'LTAD FUNdamentals: agilidade em contexto lúdico',
  },
  {
    name: 'Escada de Agilidade — Sprint e Backpedal',
    cat: 'agilidade', nivel: 2, idadeMin: 9, idadeMax: 17,
    tipo: 'exercício', duracao: '10min', material: 'Escada de agilidade',
    sets: '6', reps: '1 travessia', rest: '30s',
    tip: 'Ida: 1 pé por quadrado, rápido. Volta: backpedal (corrida de costas) lento. Braços em ritmo.',
    progressao: 'Padrões 2 dentro 1 fora ou com mudança de direção no final.',
    ref: 'Agilidade: coordenação de pés em alta velocidade',
  },
  {
    name: 'Reação a Estímulo Visual (Bolinha Caindo)',
    cat: 'agilidade', nivel: 2, idadeMin: 8, idadeMax: 16,
    tipo: 'exercício', duracao: '8min', material: 'Bolinha de tênis',
    sets: '4', reps: '8 tentativas', rest: '30s',
    tip: 'Professor solta a bolinha de altura variável — aluno deve pegar antes do 2º quique. Treina tempo de reação.',
    progressao: 'Distância maior, soltar sem avisar, 2 bolinhas.',
    ref: 'Agilidade reativa: tempo de reação visual',
  },
  {
    name: 'Circuito de Agilidade com Bola',
    cat: 'agilidade', nivel: 3, idadeMin: 11, idadeMax: 17,
    tipo: 'circuito', duracao: '12min', material: 'Cones, bola',
    sets: '4', reps: '1 volta', rest: '60s',
    tip: 'Slalom entre cones com bola no pé (ou nas mãos). Combina agilidade + manipulação. Cronometrar.',
    progressao: 'Reduzir espaço entre cones ou adicionar defensor.',
    ref: 'LTAD Train to Train: agilidade esportiva específica',
  },
]

// ── Tags de tipo de atividade ─────────────────────────────────
const TIPO_COLOR = {
  exercício:   { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#A78BFA' },
  brincadeira: { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#34D399' },
  jogo:        { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#FBBF24' },
  circuito:    { bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  text: '#F97316' },
}
const NIVEL_LABEL = { 1: '🟢 Básico', 2: '🟡 Médio', 3: '🔴 Avançado' }

// ── Componente principal ──────────────────────────────────────
export default function MotorSkillsSection({ dayId, ageGroup, studentAge, onAddExercise }) {
  const [open,       setOpen]       = useState(false)
  const [catFilter,  setCatFilter]  = useState('')
  const [nivelFilter,setNivelFilter]= useState(0)
  const [query,      setQuery]      = useState('')
  const [adding,     setAdding]     = useState(null) // id da atividade sendo adicionada

  // Só mostra para criança e adolescente
  if (ageGroup !== 'crianca' && ageGroup !== 'adolescente') return null

  const age = studentAge || (ageGroup === 'crianca' ? 9 : 14)

  const filtered = MOTOR_BANK.filter(a => {
    const matchAge  = age >= a.idadeMin && age <= a.idadeMax
    const matchCat  = !catFilter   || a.cat === catFilter
    const matchNiv  = !nivelFilter || a.nivel === nivelFilter
    const matchQ    = !query       || a.name.toLowerCase().includes(query.toLowerCase())
    return matchAge && matchCat && matchNiv && matchQ
  })

  const handleAdd = async (atividade) => {
    setAdding(atividade.name)
    const cat = MOTOR_CATEGORIES[atividade.cat]
    await onAddExercise({
      name: atividade.name,
      type: 'Funcional',
      sets: atividade.sets,
      reps: atividade.reps,
      rest: atividade.rest,
      tip:  `[Motor: ${cat.label}] ${atividade.tip}`,
    })
    setTimeout(() => setAdding(null), 800)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(96,165,250,0.07)',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 10, padding: '9px 14px', cursor: 'pointer',
          marginTop: 8, width: '100%', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.07)'}
      >
        <span style={{ fontSize: 18 }}>🧠</span>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#60A5FA' }}>
            + Adicionar Atividade de Habilidade Motora
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
            {filtered.length} atividades disponíveis para {ageGroup === 'crianca' ? 'crianças' : 'adolescentes'} · Locomoção · Manipulação · Equilíbrio · Coordenação · Agilidade
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#334155' }}>▼</span>
      </button>
    )
  }

  return (
    <div style={{
      marginTop: 10,
      background: 'rgba(8,14,32,0.95)',
      border: '1px solid rgba(96,165,250,0.18)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(96,165,250,0.12),rgba(96,165,250,0.04))',
        borderBottom: '1px solid rgba(96,165,250,0.15)',
        padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
            🧠 Habilidades Motoras
            <span style={{ fontSize: 9, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 20, padding: '1px 7px', color: '#7DD3FC', fontWeight: 700 }}>
              {ageGroup === 'crianca' ? 'FUNdamentals' : 'Learn to Train'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
            Atividades motoras adaptadas por faixa etária · {filtered.length} disponíveis
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '14px 18px' }}>
        {/* Filtro por categoria */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            onClick={() => setCatFilter('')}
            style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid ' + (!catFilter ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'), background: !catFilter ? 'rgba(96,165,250,0.15)' : 'transparent', color: !catFilter ? '#60A5FA' : '#475569', fontSize: 11, fontWeight: !catFilter ? 800 : 400, cursor: 'pointer' }}>
            Todas
          </button>
          {Object.values(MOTOR_CATEGORIES).map(cat => (
            <button key={cat.id} onClick={() => setCatFilter(catFilter === cat.id ? '' : cat.id)}
              style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid ' + (catFilter === cat.id ? cat.color + '60' : 'rgba(255,255,255,0.08)'), background: catFilter === cat.id ? cat.color + '18' : 'transparent', color: catFilter === cat.id ? cat.color : '#475569', fontSize: 11, fontWeight: catFilter === cat.id ? 800 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Filtro por nível + busca */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3].map(n => (
            <button key={n} onClick={() => setNivelFilter(nivelFilter === n ? 0 : n)}
              style={{ padding: '3px 10px', borderRadius: 20, border: '1px solid ' + (nivelFilter === n ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'), background: nivelFilter === n ? 'rgba(255,255,255,0.08)' : 'transparent', color: nivelFilter === n ? '#E2E8F0' : '#334155', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              {n === 0 ? 'Todos os níveis' : NIVEL_LABEL[n]}
            </button>
          ))}
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar atividade..."
            style={{ flex: 1, minWidth: 140, background: '#161B27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 10px', color: '#E2E8F0', fontSize: 12, outline: 'none' }}
          />
        </div>

        {/* Lista de atividades */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#334155', fontSize: 12 }}>
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map((a, i) => {
              const cat   = MOTOR_CATEGORIES[a.cat]
              const tc    = TIPO_COLOR[a.tipo] || TIPO_COLOR.exercício
              const isAdd = adding === a.name
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${cat.color}`,
                  borderRadius: '0 10px 10px 0',
                  padding: '10px 14px',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      {/* Nome + tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{a.name}</span>
                        <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 20, background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text, fontWeight: 700 }}>{a.tipo}</span>
                        <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 20, background: cat.color + '15', border: `1px solid ${cat.color}35`, color: cat.color, fontWeight: 700 }}>{cat.icon} {cat.label}</span>
                        <span style={{ fontSize: 9, color: '#334155' }}>{NIVEL_LABEL[a.nivel]}</span>
                      </div>

                      {/* Dica pedagógica */}
                      <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: 6 }}>{a.tip}</div>

                      {/* Parâmetros */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                          ['⏱', a.duracao],
                          ['🔁', `${a.sets}x · ${a.reps}`],
                          ['💤', a.rest],
                          ['🎒', a.material],
                        ].map(([icon, val]) => (
                          <span key={icon} style={{ fontSize: 10, color: '#475569' }}>
                            {icon} {val}
                          </span>
                        ))}
                      </div>

                      {/* Progressão */}
                      <div style={{ marginTop: 5, fontSize: 10, color: '#334155', fontStyle: 'italic' }}>
                        📈 Progressão: {a.progressao}
                      </div>
                    </div>

                    {/* Botão adicionar */}
                    <button
                      onClick={() => handleAdd(a)}
                      disabled={!!isAdd}
                      style={{
                        flexShrink: 0,
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: `1px solid ${cat.color}50`,
                        background: isAdd ? cat.color + '30' : cat.color + '15',
                        color: cat.color,
                        fontSize: 11, fontWeight: 800, cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}>
                      {isAdd ? '✓ Adicionado' : '+ Adicionar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ fontSize: 10, color: '#1E293B', marginTop: 10, textAlign: 'center', fontStyle: 'italic' }}>
          Ref: TGMD-3 (Ulrich 2019) · LTAD (Balyi 2013) · NSCA Youth Resistance Training
        </div>
      </div>
    </div>
  )
}

