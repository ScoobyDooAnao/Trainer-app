// ── Constantes ────────────────────────────────────────────────────────────────
export const SPORTS = [
  { id: 'futebol', label: 'Futebol', icon: '⚽' },
  { id: 'futsal',  label: 'Futsal',  icon: '🥅' },
  { id: 'natacao', label: 'Natação', icon: '🏊' },
  { id: 'basquete',label: 'Basquete',icon: '🏀' },
  { id: 'volei',   label: 'Vôlei',   icon: '🏐' },
  { id: 'tenis',   label: 'Tênis',   icon: '🎾' },
  { id: 'judo',    label: 'Judô',    icon: '🥋' },
  { id: 'handebol',label: 'Handebol',icon: '🤾' },
  { id: 'atletismo',label:'Atletismo',icon:'🏃' },
  { id: 'outro',   label: 'Outro',   icon: '🏅' },
]

export const TIPO_FOCO = [
  { id: 'Físico',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 'Técnico',      color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'Lúdico',       color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  { id: 'Competitivo',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 'Progressão',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'Misto',        color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
]

export const TIPO_BLOCO_AULA = [
  { id: 'Aquecimento',    color: '#F97316' },
  { id: 'Físico',         color: '#EF4444' },
  { id: 'Técnico',        color: '#3B82F6' },
  { id: 'Lúdico',         color: '#A78BFA' },
  { id: 'Competitivo',    color: '#F59E0B' },
  { id: 'Progressão',     color: '#10B981' },
  { id: 'Volta à calma',  color: '#06B6D4' },
]

export const DIAS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

export const getFoco = (id) => TIPO_FOCO.find(t => t.id === id) || TIPO_FOCO[5]

export const getBloco = (id) => TIPO_BLOCO_AULA.find(t => t.id === id) || { color: '#64748B' }

export const getSport = (id) => SPORTS.find(s => s.id === id)

// ── Styles ────────────────────────────────────────────────────────────────────
export const S = {
  card:    { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, padding: 20 },
  label:   { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:   { width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 8, padding: '9px 12px', color: '#0D1B2A', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn:     (c = '#0C4A6E') => ({ background: c, border: 'none', borderRadius: 8, padding: '9px 18px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  ghost:   { background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 14px', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  tag:     (color, bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700 }),
  row:     { display: 'flex', gap: 10, alignItems: 'flex-start' },
  divider: { height: 1, background: 'rgba(0,0,0,0.07)', margin: '18px 0' },
}

// ── Constantes de Avaliação ───────────────────────────────────────────────────
export const TGMD3_LOCOMOCAO = [
  { id:'corrida',  label:'Corrida',          desc:'Braços em oposição, fase aérea visível, apoio no antepé' },
  { id:'galope',   label:'Galope',           desc:'Passo-toque rítmico lateral, corpo levemente inclinado' },
  { id:'passada',  label:'Passada (skip)',   desc:'Alternância passo+salto, coordenação braço-perna' },
  { id:'salto_h',  label:'Salto horizontal', desc:'Pré-balanço de braços, impulsão bilateral, aterrissagem amortecida' },
  { id:'salto_v',  label:'Salto vertical',   desc:'Extensão completa do corpo, alcance dos braços, aterrissagem suave' },
  { id:'lateral',  label:'Corrida lateral',  desc:'Passos cruzados, centro de gravidade baixo, mudança de direção' },
]

export const TGMD3_OBJETO = [
  { id:'chutar',   label:'Chute',             desc:'Passo de aproximação, balanço de braços, follow-through' },
  { id:'arremesso',label:'Arremesso (acima)', desc:'Rotação de tronco, transferência de peso, liberação acima do ombro' },
  { id:'receber',  label:'Recepção',          desc:'Preparação das mãos, olhos no alvo, absorção com dedos' },
  { id:'driblar',  label:'Drible',            desc:'Contato com os dedos, altura do quadril, olhos longe da bola' },
  { id:'rebater',  label:'Rebater',           desc:'Rotação de quadril, contato na zona de strike, follow-through' },
  { id:'rolar',    label:'Rolar (boliche)',   desc:'Abaixamento do corpo, liberação na altura do joelho' },
  { id:'underhand',label:'Arremesso (abaixo)',desc:'Balanço pendular, transferência de peso, liberação na altura do quadril' },
]

export const TGMD3_NIVEIS = [
  { val:0, label:'Inicial',   color:'#EF4444', short:'I' },
  { val:1, label:'Elementar', color:'#FBBF24', short:'E' },
  { val:2, label:'Maduro',    color:'#34D399', short:'M' },
]

// Testes técnicos por esporte
export const TESTES_ESPORTE = {
  futebol: [
    { id:'passe_curto',   label:'Passe Curto',       desc:'Precisão e força — alvo a 10m',        categoria:'Técnico' },
    { id:'passe_longo',   label:'Passe Longo',        desc:'Precisão e força — alvo a 20m+',       categoria:'Técnico' },
    { id:'dominio_pe',    label:'Domínio com o Pé',   desc:'Parar bola rolada, controle com planta',categoria:'Técnico' },
    { id:'dominio_peito', label:'Domínio com o Peito',desc:'Bola lançada, amortecimento no peito',  categoria:'Técnico' },
    { id:'conducao',      label:'Condução',           desc:'Velocidade com bola — slalom em cones', categoria:'Técnico' },
    { id:'chute_gol',     label:'Chute a Gol',        desc:'Potência e direção — distância padrão', categoria:'Técnico' },
    { id:'drible_1x1',    label:'Drible 1x1',         desc:'Capacidade de superar oponente',        categoria:'Técnico' },
    { id:'vel_20m',       label:'Velocidade 20m',     desc:'Sprint de 20m — cronometrado',          categoria:'Físico' },
    { id:'salto_vert',    label:'Salto Vertical',     desc:'Altura máxima — Sargent test',          categoria:'Físico' },
    { id:'shuttle_run',   label:'Shuttle Run 5x5m',   desc:'Agilidade e mudança de direção',        categoria:'Físico' },
  ],
  futsal: [
    { id:'passe_curto',   label:'Passe Curto',        desc:'Precisão — alvo a 8m',                 categoria:'Técnico' },
    { id:'dominio_pe',    label:'Domínio com o Pé',   desc:'Controle em espaço reduzido',          categoria:'Técnico' },
    { id:'conducao',      label:'Condução',           desc:'Velocidade com bola em espaço reduzido',categoria:'Técnico' },
    { id:'chute_gol',     label:'Chute a Gol',        desc:'Potência e direção',                   categoria:'Técnico' },
    { id:'vel_20m',       label:'Velocidade 20m',     desc:'Sprint de 20m',                        categoria:'Físico' },
    { id:'shuttle_run',   label:'Shuttle Run 5x5m',   desc:'Agilidade',                            categoria:'Físico' },
  ],
}

export const ESCALA_TECNICO = [
  { val:0, label:'Iniciante',        color:'#EF4444' },
  { val:1, label:'Em Desenvolv.',    color:'#F97316' },
  { val:2, label:'Proficiente',      color:'#FBBF24' },
  { val:3, label:'Avançado',         color:'#34D399' },
]

// ── Componente Principal ──────────────────────────────────────────────────────

// ── Banco de Atividades — sugestões baseadas no TGMD-3 ───────────────────────
export const CATEGORIA_COLORS = {
  'Locomoção':       { bg:'#DBEAFE', border:'#BFDBFE', text:'#1E40AF', dot:'#3B82F6' },
  'Controle de Objeto': { bg:'#D1FAE5', border:'#A7F3D0', text:'#065F46', dot:'#10B981' },
  'Lúdico':          { bg:'#EDE9FE', border:'#DDD6FE', text:'#5B21B6', dot:'#8B5CF6' },
  'Coordenação':     { bg:'#FEF3C7', border:'#FDE68A', text:'#92400E', dot:'#F59E0B' },
  'Cognitivo':       { bg:'#FEE2E2', border:'#FECACA', text:'#991B1B', dot:'#EF4444' },
  'Personalizada':   { bg:'#F1F5F9', border:'#E2E8F0', text:'#475569', dot:'#94A3B8' },
}

export const FAIXA_COLORS = {
  '6-8 anos':  { bg:'rgba(59,130,246,0.08)',  text:'#1E40AF'  },
  '9-12 anos': { bg:'rgba(16,185,129,0.08)', text:'#065F46'  },
  '13+ anos':  { bg:'rgba(124,58,237,0.08)', text:'#5B21B6'  },
  'Todas':     { bg:'rgba(100,116,139,0.08)', text:'#475569'  },
}

export const BANCO_SUGERIDO = [
  // ── Locomoção (TGMD-3) ──────────────────────────────────────────────────────
  { id:'s1',  titulo:'Corrida em Zigue-Zague',    categoria:'Locomoção',          faixa:'6-8 anos',  duracao:10, material:'Cones', habilidade:'corrida',   desc:'Monte cones em linha reta com 1,5m de distância. Criança corre em zigue-zague o mais rápido possível. Trabalha coordenação, mudança de direção e aceleração.', objetivo:'Padrão maduro de corrida, fase aérea visível, apoio no antepé.' },
  { id:'s2',  titulo:'Galope com Obstáculos',     categoria:'Locomoção',          faixa:'6-8 anos',  duracao:8,  material:'Bambolês', habilidade:'galope', desc:'Coloque bambolês no chão. A criança galopa dentro e fora dos bambolês em ritmo constante. Exagere o movimento de passo-toque.', objetivo:'Ritmo de galope, posição lateral do corpo, coordenação.' },
  { id:'s3',  titulo:'Skip Alfabeto',             categoria:'Locomoção',          faixa:'9-12 anos', duracao:12, material:'Escada de agilidade', habilidade:'passada', desc:'Usando escada de agilidade, realize skip (passo+salto alternado) em diferentes velocidades. Varie: lento-médio-rápido ao sinal do professor.', objetivo:'Alternância braço-perna, extensão do joelho, coordenação bilateral.' },
  { id:'s4',  titulo:'Estafeta de Salto Horizontal', categoria:'Locomoção',       faixa:'9-12 anos', duracao:15, material:'Fita métrica, giz', habilidade:'salto_h', desc:'Equipes competem medindo o salto horizontal de cada integrante. Somar as distâncias. Corrija: pré-balanço de braços, impulsão bilateral, aterrissagem amortecida.', objetivo:'Ativação de membros inferiores, potência, aterrissagem segura.' },
  { id:'s5',  titulo:'Salto Vertical com Marcação', categoria:'Locomoção',        faixa:'9-12 anos', duracao:10, material:'Parede, fita', habilidade:'salto_v', desc:'Criança marca a altura que alcança em pé. Depois salta e marca o ponto máximo. Meça a diferença. Trabalhe a extensão completa do corpo.', objetivo:'Geração de força vertical, coordenação braço-tronco, aterrissagem suave.' },
  { id:'s6',  titulo:'Corrida Lateral Espelho',   categoria:'Locomoção',          faixa:'6-8 anos',  duracao:10, material:'Sem material', habilidade:'lateral', desc:'Professor e criança frente a frente. Professor faz movimentos laterais, criança espelha. Trabalha reatividade, equilíbrio e deslocamento lateral.', objetivo:'Passos cruzados, centro de gravidade baixo, mudança de direção.' },
  // ── Controle de Objeto (TGMD-3) ────────────────────────────────────────────
  { id:'s7',  titulo:'Chute ao Alvo',             categoria:'Controle de Objeto', faixa:'6-8 anos',  duracao:10, material:'Bola, cones', habilidade:'chutar', desc:'Monte um gol com cones a 5m de distância. Criança chuta bola parada com pé dominante e não-dominante. Corrija: passo de aproximação, balanço de braço oposto, follow-through.', objetivo:'Passo de aproximação correto, transferência de peso, follow-through.' },
  { id:'s8',  titulo:'Boliche Humano',            categoria:'Controle de Objeto', faixa:'6-8 anos',  duracao:12, material:'Garrafas PET, bola pequena', habilidade:'rolar', desc:'Monte 6 garrafas em triângulo a 5m. Criança rola a bola tentando derrubar todas. Corrija: abaixamento do corpo, balanço pendular do braço, liberação na altura do joelho.', objetivo:'Padrão maduro de rolamento, mira, transferência de peso.' },
  { id:'s9',  titulo:'Arremesso Progressivo',     categoria:'Controle de Objeto', faixa:'9-12 anos', duracao:15, material:'Bola de tênis, alvos', habilidade:'arremesso', desc:'Marque alvos na parede em alturas diferentes (2m, 3m, 4m). Criança arremessa acima do ombro tentando acertar. Aumente a distância a cada rodada.', objetivo:'Rotação de tronco, transferência de peso, liberação acima do ombro.' },
  { id:'s10', titulo:'Recepção em Movimento',     categoria:'Controle de Objeto', faixa:'9-12 anos', duracao:12, material:'Bola, parceiro', habilidade:'receber', desc:'Em duplas, um jogador caminha e o outro arremessa. Receptor deve pegar sem parar. Varie altura e força. Corrija: preparação das mãos, olhos no alvo, absorção com dedos.', objetivo:'Tracking visual, preparação antecipatória, absorção do impacto.' },
  { id:'s11', titulo:'Drible com Obstáculos',     categoria:'Controle de Objeto', faixa:'9-12 anos', duracao:15, material:'Bola de basquete, cones', habilidade:'driblar', desc:'Percurso em zigue-zague com cones, driblando com mão dominante e depois não-dominante. Olhos devem ficar longe da bola ao final do percurso.', objetivo:'Contato nos dedos, altura do quadril, controle sem olhar para a bola.' },
  { id:'s12', titulo:'Rebater Balão',             categoria:'Controle de Objeto', faixa:'6-8 anos',  duracao:10, material:'Balões, raquete de isopor', habilidade:'rebater', desc:'Criança tenta manter o balão no ar usando raquete de isopor. Progrida: use bola de espuma e tee (suporte). Corrija: rotação de quadril, zona de contato, follow-through.', objetivo:'Timing de contato, rotação, acompanhamento do movimento.' },
  // ── Lúdico / Coordenação ────────────────────────────────────────────────────
  { id:'s13', titulo:'Pega-Rabo',                 categoria:'Lúdico',             faixa:'6-8 anos',  duracao:10, material:'Coletes ou fitas', habilidade:null, desc:'Cada criança coloca uma fita no shorts. O objetivo é pegar o rabo dos outros sem perder o seu. Desenvolve fuga, perseguição, consciência espacial e agilidade.', objetivo:'Agilidade, consciência corporal, tomada de decisão rápida.' },
  { id:'s14', titulo:'Bambolê Musical',           categoria:'Lúdico',             faixa:'6-8 anos',  duracao:8,  material:'Bambolês, música', habilidade:null, desc:'Bambolês no chão, um a menos que o número de crianças. Música toca: todos correm em volta. Música para: entrar em um bambolê. Quem ficar fora vai para fora.', objetivo:'Reação auditiva, corrida, lateralidade, convivência.' },
  { id:'s15', titulo:'Circuito Motor Completo',   categoria:'Coordenação',        faixa:'9-12 anos', duracao:20, material:'Cones, bambolês, escada, bola', habilidade:null, desc:'6 estações: 1-Salto horizontal, 2-Drible, 3-Skip na escada, 4-Recepção, 5-Corrida lateral, 6-Arremesso ao alvo. 2 min em cada. Rotação por sinal.', objetivo:'Integração de múltiplas habilidades motoras em sequência.' },
  { id:'s16', titulo:'Estátua Tática',            categoria:'Cognitivo',          faixa:'9-12 anos', duracao:12, material:'Cones coloridos', habilidade:null, desc:'Crianças correm livres. Quando professor gritar uma cor, todas correm para o cone daquela cor. Varie com "esquerda", "direita", "frente". Desenvolve atenção e percepção espacial.', objetivo:'Atenção, reação a estímulo auditivo, orientação espacial.' },
  { id:'s17', titulo:'4 Cantos + Bola',           categoria:'Lúdico',             faixa:'13+ anos',  duracao:15, material:'Cones, bola', habilidade:null, desc:'4 cones formam um quadrado. Uma criança no meio com bola. As outras nos cantos trocam de lugar enquanto o centro tenta acertar alguém com a bola (abaixo da cintura). Desenvolve arremesso, desvio e percepção espacial.', objetivo:'Arremesso com precisão, desvio de corpo, leitura espacial.' },
  { id:'s18', titulo:'Caçador e Presa',           categoria:'Lúdico',             faixa:'6-8 anos',  duracao:10, material:'Bolas de espuma', habilidade:null, desc:'2 caçadores com bolas de espuma tentam acertar as presas. Quem for acertado vira caçador. Desenvolve arremesso, desvio, corrida e consciência do espaço.', objetivo:'Reação, corrida, desvio, arremesso com intenção.' },
]
