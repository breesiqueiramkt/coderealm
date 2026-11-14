/* =====================================================================
   CodeRealm — conquistas
   test() olha o estado do jogo e diz se a conquista foi alcançada.
   Rewards.check() roda os testes e paga as moedas uma única vez.
   ===================================================================== */

// Conquistas: test() olha o estado do jogo e diz se já foi alcançada.
const ACHIEVEMENTS = [
  { id: 'primeiro-passo', icon: '🥾', name: 'Primeiro passo', desc: 'Conclua a primeira fase.', coins: 20, test: () => !!state.done.vale },
  {
    id: 'trio-web',
    icon: '🌐',
    name: 'Trio da web',
    desc: 'Conclua as fases de HTML, CSS e JavaScript.',
    coins: 30,
    test: () => state.done.vale && state.done.rio && state.done.portao,
  },
  {
    id: 'capitao-docker',
    icon: '🐳',
    name: 'Capitão Docker',
    desc: 'Conclua as 5 fases de Docker.',
    coins: 50,
    test: () =>
      Object.keys(PHASES)
        .filter(p => PHASES[p].tag === 'Docker')
        .every(p => state.done[p]),
  },
  {
    id: 'jornada',
    icon: '🏆',
    name: 'Jornada completa',
    desc: 'Conclua todas as fases.',
    coins: 60,
    test: () => Object.keys(PHASES).every(p => state.done[p]),
  },
  {
    id: 'tres-estrelas',
    icon: '⭐',
    name: 'De primeira',
    desc: 'Ganhe 3 estrelas em uma fase (sem erros e sem dicas).',
    coins: 30,
    test: () => Object.values(state.stars).some(s => s >= 3),
  },
  {
    id: 'constelacao',
    icon: '🌟',
    name: 'Constelação',
    desc: 'Ganhe 3 estrelas em todas as fases.',
    coins: 100,
    test: () => Object.keys(PHASES).every(p => state.stars[p] >= 3),
  },
  {
    id: 'colecionador',
    icon: '🪙',
    name: 'Colecionador',
    desc: 'Pegue 20 moedas espalhadas pelos mapas.',
    coins: 30,
    test: () => state.stats.coinsPicked >= 20,
  },
  {
    id: 'cacador',
    icon: '🧰',
    name: 'Caçador de tesouros',
    desc: 'Abra 4 baús.',
    coins: 40,
    test: () => Object.keys(state.chests).length >= 4,
  },
  {
    id: 'bug-hunter',
    icon: '🐛',
    name: 'Caçador de bugs',
    desc: 'Acerte 10 minidesafios.',
    coins: 40,
    test: () => state.stats.minis >= 10,
  },
  {
    id: 'construtor',
    icon: '🧱',
    name: 'Construtor',
    desc: 'Conclua um projeto real na Arena.',
    coins: 30,
    test: () => Object.keys(state.projects).length >= 1,
  },
  {
    id: 'arquiteto',
    icon: '🏗️',
    name: 'Arquiteto',
    desc: 'Conclua todos os projetos reais.',
    coins: 100,
    test: () => PROJECTS.every(p => state.projects[p.id]),
  },
  {
    id: 'leitor',
    icon: '📖',
    name: 'Leitor',
    desc: 'Leia 5 artigos da Biblioteca.',
    coins: 20,
    test: () => Object.keys(state.read).length >= 5,
  },
  {
    id: 'bibliotecario',
    icon: '📚',
    name: 'Bibliotecário',
    desc: 'Leia todos os artigos.',
    coins: 60,
    test: () => LIBRARY.every(a => state.read[a.id]),
  },
  {
    id: 'estiloso',
    icon: '🎩',
    name: 'Estiloso',
    desc: 'Compre um item na loja do personagem.',
    coins: 10,
    test: () => Object.keys(state.owned).length >= 1,
  },
  { id: 'companheiro', icon: '🐾', name: 'Companheiro', desc: 'Ande com um mascote.', coins: 20, test: () => state.look.pet !== 'nenhum' },
  { id: 'constante', icon: '🔥', name: 'Constante', desc: 'Jogue 3 dias seguidos.', coins: 30, test: () => state.daily.streak >= 3 },
  { id: 'diplomado', icon: '🎓', name: 'Diplomado', desc: 'Seja aprovado no Exame Final.', coins: 100, test: () => !!state.exam },
  {
    id: 'turista',
    icon: '🧭',
    name: 'Turista',
    desc: 'Visite todas as áreas do mundo.',
    coins: 30,
    test: () => Object.keys(MAPS).every(m => state.stats.visited && state.stats.visited[m]),
  },
  { id: 'dedicado', icon: '💎', name: 'Dedicado', desc: 'Jogue 7 dias seguidos.', coins: 80, test: () => state.daily.streak >= 7 },
];
