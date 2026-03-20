import { Question } from "@/lib/types";

export const defaultQuestions: Question[] = [
  // === SANGUE NO OLHO ===
  {
    id: "c1_sangue",
    title: "Sangue no Olho",
    category: "Sangue no Olho",
    description:
      "Considerando o nível e o escopo atual da função, com que frequência essa pessoa demonstra Sangue no Olho ao enfrentar obstáculos e sustentar esforço até a conclusão dos desafios?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Desiste diante do primeiro obstáculo. Não demonstra garra nem persistência.",
        examples: ["Abandona tarefas com dificuldade", "Transfere responsabilidade", "Não busca alternativas"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Tenta resolver, mas desanima rápido. Precisa de suporte constante.",
        examples: ["Faz uma tentativa e já pede ajuda", "Perde motivação sob pressão", "Entrega parcial"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Enfrenta obstáculos com resiliência adequada. Busca soluções e pede ajuda quando necessário.",
        examples: ["Persiste até resolver", "Busca ajuda estratégica", "Mantém qualidade sob pressão"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Demonstra garra acima da média. Encontra caminhos alternativos e intensifica esforço.",
        examples: ["Soluções criativas", "Trabalha além do esperado", "Motiva colegas"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em determinação. Transforma obstáculos em oportunidades.",
        examples: ["Entregas consistentes em cenários adversos", "Inspira o time", "Resolve problemas que outros evitam"],
      },
    ],
  },

  // === ATITUDE DE DONO ===
  {
    id: "c2_atitude_dono",
    title: "Atitude de Dono",
    category: "Atitude de Dono",
    description:
      "Considerando o nível da função, com que frequência essa pessoa demonstra Atitude de Dono nas decisões e responsabilidades que lhe cabem?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não assume responsabilidade. Espera que outros decidam e resolvam.",
        examples: ["Evita tomar decisões", "Não se posiciona", "Transfere problemas"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Assume responsabilidade parcialmente. Precisa ser cobrado para agir.",
        examples: ["Age quando lembrado", "Decisões superficiais", "Pouca iniciativa"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Assume suas responsabilidades e toma decisões adequadas ao seu nível.",
        examples: ["Cuida do que é seu", "Decide com autonomia", "Comunica impactos"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Vai além do escopo. Trata problemas da empresa como se fossem seus.",
        examples: ["Resolve fora do escopo", "Antecipa consequências", "Propõe melhorias estruturais"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em ownership. Cuida da empresa como dono, influencia cultura.",
        examples: ["Lidera mudanças organizacionais", "É exemplo para outros", "Impacto além da área"],
      },
    ],
  },

  // === FOCO EM FATOS E DADOS ===
  {
    id: "c3_fatos_dados",
    title: "Foco em Fatos e Dados",
    category: "Foco em Fatos e Dados",
    description:
      "Considerando o escopo da função, com que frequência essa pessoa utiliza Foco em Fatos e Dados para fundamentar decisões e argumentos?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Decide por achismo. Não busca dados antes de concluir.",
        examples: ["Propõe sem dados", "Conclusões precipitadas", "Ignora dados disponíveis"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Usa dados superficialmente. Ainda se apoia muito em intuição.",
        examples: ["Dados parciais", "Não verifica fontes", "Mistura dados com opinião"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Embasa decisões com dados relevantes. Busca evidências antes de propor.",
        examples: ["Traz métricas", "Valida hipóteses", "Documenta racional"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Referência em decisões baseadas em dados. Cruza fontes e questiona qualidade.",
        examples: ["Cruza múltiplas fontes", "Questiona inconsistências", "Cria dashboards"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Transforma a cultura de dados da área. Cria processos data-driven.",
        examples: ["Processos data-driven viraram padrão", "Consultado por outras áreas", "Mudou decisão estratégica com análise"],
      },
    ],
  },

  // === PRIORIZE E SIMPLIFIQUE ===
  {
    id: "c4_priorize",
    title: "Priorize e Simplifique",
    category: "Priorize e Simplifique",
    description:
      "Considerando o nível de responsabilidade da função, com que frequência essa pessoa demonstra capacidade de Priorizar e Simplificar?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não prioriza. Faz tudo ao mesmo tempo ou foca no que é mais fácil.",
        examples: ["Gasta tempo em baixo impacto", "Não diz não", "Entregas atrasam por falta de foco"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Tenta priorizar mas se perde. Confunde urgência com importância.",
        examples: ["Tudo é urgente", "Muda de foco a cada demanda", "Precisa de ajuda para priorizar"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Organiza trabalho adequadamente. Separa urgente de importante.",
        examples: ["Prioridades atualizadas", "Negocia prazos", "Entrega o importante primeiro"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Excelente em priorização. Ajuda o time a focar no que importa.",
        examples: ["Questiona demandas de baixo impacto", "Corta escopo", "Ajuda colegas a priorizar"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em foco. Transforma como a área decide o que fazer.",
        examples: ["Criou frameworks de priorização", "Elimina trabalho desnecessário", "Consultado para definir cortes"],
      },
    ],
  },

  // === ESCOPO DA FUNÇÃO ===
  {
    id: "c5_escopo",
    title: "Escopo da Função",
    category: "Escopo da Função",
    description:
      "Considerando o nível da função, com que frequência essa pessoa atua de forma madura e adequada ao Escopo da Função?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não cumpre as responsabilidades básicas do cargo.",
        examples: ["Entregas abaixo do mínimo", "Não entende o escopo", "Precisa supervisão constante"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Cumpre parcialmente. Precisa de direcionamento frequente.",
        examples: ["Entregas incompletas", "Escopo limitado", "Depende de ajuda"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Atua de forma madura e adequada ao nível da função.",
        examples: ["Entregas completas", "Autonomia adequada", "Entende e cumpre o escopo"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Vai além do escopo. Contribui acima do esperado para o nível.",
        examples: ["Assume responsabilidades extras", "Entrega acima do nível", "Mentora colegas"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Atua consistentemente no nível acima. Pronto para promoção.",
        examples: ["Opera no nível acima", "Referência no cargo", "Impacto desproporcional ao nível"],
      },
    ],
  },

  // === ENTREGAS DE VALOR ===
  {
    id: "c6_entregas",
    title: "Entregas de Valor",
    category: "Entregas de Valor",
    description:
      "Considerando o impacto esperado para o nível da função, com que frequência essa pessoa realiza Entregas de Valor relevantes?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Entregas não geram valor. Trabalho sem impacto perceptível.",
        examples: ["Tarefas sem resultado", "Retrabalho frequente", "Não entrega no prazo"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Entregas de valor baixo ou inconsistente.",
        examples: ["Entrega mas sem impacto", "Qualidade irregular", "Valor abaixo do esperado"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Realiza entregas de valor relevantes e consistentes para o nível.",
        examples: ["Entregas no prazo", "Impacto adequado", "Qualidade consistente"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Entregas de alto valor. Resultados acima do esperado para o nível.",
        examples: ["Impacto mensurável", "Qualidade superior", "Entregas que surpreendem"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Entregas transformadoras. Gera valor desproporcional ao nível.",
        examples: ["Resultados que mudam a área", "Entregas reconhecidas pela empresa", "Impacto estratégico"],
      },
    ],
  },

  // === CONSISTÊNCIA ===
  {
    id: "c7_consistencia",
    title: "Consistência",
    category: "Consistência",
    description:
      "Considerando o nível da função, com que frequência essa pessoa mantém Consistência no desempenho ao longo do tempo?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Desempenho muito irregular. Altos e baixos constantes.",
        examples: ["Semanas boas e ruins", "Imprevisível", "Não se pode contar com entregas"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Oscila no desempenho. Bons momentos mas não sustenta.",
        examples: ["Começa bem e perde ritmo", "Inconsistente sob pressão", "Precisa de cobrança"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Mantém desempenho consistente. Confiável nas entregas.",
        examples: ["Ritmo estável", "Entregas previsíveis", "Mantém qualidade"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Altamente consistente. Referência de confiabilidade no time.",
        examples: ["Nunca deixa a bola cair", "Consistente mesmo em crise", "Time conta com ele"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Consistência inabalável. Eleva o padrão de todo o time.",
        examples: ["Histórico impecável", "Define o padrão de entrega", "Consistência inspira outros"],
      },
    ],
  },

  // === PENSAR FORA DA CAIXA ===
  {
    id: "c8_fora_caixa",
    title: "Pensar Fora da Caixa",
    category: "Pensar Fora da Caixa",
    description:
      "Considerando o escopo da função, com que frequência essa pessoa demonstra capacidade de Pensar Fora da Caixa ao lidar com desafios?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Preso a padrões. Não propõe nada diferente.",
        examples: ["Sempre faz igual", "Não questiona processos", "Resiste a mudanças"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Raramente propõe algo novo. Segue o padrão na maioria das vezes.",
        examples: ["Ocasionalmente sugere", "Ideias superficiais", "Não sai da zona de conforto"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Propõe soluções criativas quando necessário. Questiona o status quo.",
        examples: ["Traz ideias em reuniões", "Sugere alternativas", "Aberto a experimentar"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Criativo consistentemente. Traz soluções inovadoras que geram resultado.",
        examples: ["Soluções que ninguém pensou", "Inova no dia a dia", "Implementa ideias criativas"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em inovação. Transforma a forma como a área trabalha.",
        examples: ["Criou processos inovadores", "Reconhecido pela criatividade", "Inspira inovação no time"],
      },
    ],
  },

  // === ORGANIZAÇÃO ===
  {
    id: "c9_organizacao",
    title: "Organização",
    category: "Organização",
    description:
      "Considerando o nível de responsabilidade da função, com que frequência essa pessoa demonstra Organização na gestão das suas atividades?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Desorganizado. Perde prazos e informações com frequência.",
        examples: ["Esquece compromissos", "Informações perdidas", "Caos no trabalho"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Organização irregular. Funciona em momentos calmos mas perde controle sob demanda.",
        examples: ["Se perde com múltiplas tarefas", "Desorganiza sob pressão", "Precisa de lembretes"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Organizado e confiável. Gerencia atividades de forma adequada.",
        examples: ["Prazos cumpridos", "Informações acessíveis", "Rotina organizada"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Muito organizado. Ajuda a organizar o time e processos.",
        examples: ["Cria sistemas de organização", "Ajuda colegas", "Processos documentados"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em organização. Cria estruturas que beneficiam toda a área.",
        examples: ["Processos que viraram padrão", "Organização que escalou", "Reduz caos do time"],
      },
    ],
  },

  // === ADAPTABILIDADE ===
  {
    id: "c10_adaptabilidade",
    title: "Adaptabilidade",
    category: "Adaptabilidade",
    description:
      "Considerando o contexto e o nível da função, com que frequência essa pessoa demonstra Adaptabilidade diante de mudanças?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Resiste a mudanças. Fica paralisado ou reclama quando algo muda.",
        examples: ["Reclama de mudanças", "Não se adapta", "Quer sempre fazer do mesmo jeito"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Aceita mudanças com resistência. Demora para se adaptar.",
        examples: ["Adaptação lenta", "Precisa de empurrão", "Fica desconfortável"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Se adapta bem a mudanças. Reage de forma construtiva.",
        examples: ["Aceita mudanças", "Ajusta rápido", "Mantém produtividade"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Abraça mudanças. Ajuda outros a se adaptarem.",
        examples: ["Primeiro a se adaptar", "Ajuda o time", "Vê mudança como oportunidade"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Líder em adaptação. Antecipa mudanças e prepara o time.",
        examples: ["Antecipa tendências", "Prepara o time para mudanças", "Transforma crises em oportunidades"],
      },
    ],
  },

  // === COMUNICAÇÃO ===
  {
    id: "c11_comunicacao",
    title: "Comunicação",
    category: "Comunicação",
    description:
      "Considerando o nível da função, com que frequência essa pessoa demonstra Comunicação clara e adequada ao seu contexto de atuação?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Comunicação confusa ou ausente. Informações não chegam.",
        examples: ["Mensagens confusas", "Não comunica", "Mal-entendidos frequentes"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Comunica mas de forma incompleta ou no momento errado.",
        examples: ["Informação parcial", "Timing ruim", "Falta clareza"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Comunicação clara e adequada. Mantém stakeholders informados.",
        examples: ["Mensagens claras", "Comunica no momento certo", "Alinha expectativas"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Excelente comunicador. Adapta a mensagem ao público e influencia positivamente.",
        examples: ["Comunica com impacto", "Adapta ao público", "Facilita entendimento"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em comunicação. Transforma a forma como a área se comunica.",
        examples: ["Cria padrões de comunicação", "Influencia pela comunicação", "Resolvi conflitos pela comunicação"],
      },
    ],
  },

  // === COLABORAÇÃO ===
  {
    id: "c12_colaboracao",
    title: "Colaboração",
    category: "Colaboração",
    description:
      "Considerando o escopo e a senioridade da função, com que frequência essa pessoa demonstra Colaboração positiva?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não colabora. Trabalha isolado e dificulta o trabalho dos outros.",
        examples: ["Não ajuda colegas", "Guarda informação", "Gera conflitos"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Colabora quando pedido, mas não toma iniciativa.",
        examples: ["Ajuda quando cobrado", "Colaboração mínima", "Prioriza só o seu"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Colabora positivamente. Trabalha bem em equipe e contribui.",
        examples: ["Ajuda espontaneamente", "Trabalha bem em grupo", "Compartilha conhecimento"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Colaboração ativa. Busca sinergia e potencializa o trabalho dos outros.",
        examples: ["Conecta áreas", "Multiplica resultados", "Referência de trabalho em equipe"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Líder em colaboração. Cria cultura colaborativa na área.",
        examples: ["Cria rituais de colaboração", "Elimina silos", "Transforma a dinâmica do time"],
      },
    ],
  },

  // === IA (NOVO) ===
  {
    id: "c13_ia",
    title: "Uso de IA",
    category: "IA",
    description:
      "Considerando o contexto e nível da função, com que frequência essa pessoa utiliza Inteligência Artificial para potencializar seu trabalho e resultados?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não usa IA. Não demonstra interesse nem abertura para incorporar.",
        examples: ["Nunca experimentou IA", "Resiste a sugestões", "Tudo manual"],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Usa IA esporadicamente. Não faz parte da rotina.",
        examples: ["Já experimentou mas não incorporou", "Usa só quando sugerem", "Uso básico"],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Usa IA regularmente como ferramenta de trabalho.",
        examples: ["Usa para acelerar tarefas", "Sabe quando IA ajuda", "Faz parte do fluxo"],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "IA é parte integral do trabalho. Encontra aplicações criativas e compartilha.",
        examples: ["Workflows com IA", "Compartilha técnicas", "Resolve problemas novos com IA"],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em IA. Transforma processos e eleva adoção de toda a área.",
        examples: ["Soluções com IA viraram padrão", "Treina colegas", "Reduziu tempo/custo com IA"],
      },
    ],
  },
];
