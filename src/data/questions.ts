import { Question } from "@/lib/types";

export const defaultQuestions: Question[] = [
  // === SANGUE NO OLHO ===
  {
    id: "v1_q1",
    title: "Reação diante de obstáculos",
    category: "Sangue no Olho",
    description:
      "Pense em uma situação recente em que essa pessoa enfrentou um problema difícil no trabalho. O que ela fez? Desistiu, pediu ajuda, ou foi atrás de resolver sozinha? Conte o que aconteceu.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Desiste diante do primeiro obstáculo. Não demonstra garra nem persistência para buscar soluções.",
        examples: [
          "Abandona tarefas quando encontra dificuldade",
          "Transfere responsabilidade ao encontrar bloqueios",
          "Não busca alternativas quando o caminho original falha",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Tenta resolver obstáculos, mas desanima rápido. Precisa de suporte constante para manter o foco.",
        examples: [
          "Faz uma tentativa e já pede ajuda",
          "Perde motivação com prazos apertados",
          "Entrega parcial quando encontra dificuldade",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Enfrenta obstáculos com resiliência adequada. Busca soluções e pede ajuda quando necessário.",
        examples: [
          "Persiste até resolver o problema",
          "Busca ajuda de forma estratégica quando trava",
          "Mantém a qualidade da entrega mesmo sob pressão",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Demonstra garra acima da média. Encontra caminhos alternativos e intensifica esforço diante de dificuldades.",
        examples: [
          "Propõe soluções criativas quando o caminho padrão falha",
          "Trabalha além do esperado para cumprir compromissos",
          "Motiva colegas a não desistirem em momentos difíceis",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Referência em determinação. Transforma obstáculos em oportunidades e nunca entrega menos do que prometeu.",
        examples: [
          "Histórico consistente de entregas em cenários adversos",
          "Inspira o time inteiro com sua postura diante de crises",
          "Busca e resolve problemas que outros evitam",
        ],
      },
    ],
  },
  {
    id: "v1_q2",
    title: "Comprometimento com metas",
    category: "Sangue no Olho",
    description:
      "Quando uma meta fica difícil de bater, o que essa pessoa faz? Ela desanima e reduz o ritmo, continua no mesmo passo, ou intensifica o esforço e busca alternativas? Me dê um exemplo concreto.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Não demonstra comprometimento com metas. Aceita o fracasso sem buscar alternativas.",
        examples: [
          "Não acompanha suas próprias metas",
          "Não comunica quando está fora do track",
          "Aceita não entregar sem propor alternativas",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Se esforça minimamente, mas não intensifica quando as metas ficam difíceis.",
        examples: [
          "Mantém o mesmo ritmo mesmo quando está atrasado",
          "Sinaliza risco mas não propõe ações",
          "Entrega parcial e justifica com dificuldades externas",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Ajusta seu esforço quando as metas ficam difíceis. Comunica riscos e busca soluções.",
        examples: [
          "Reorganiza prioridades para alcançar a meta",
          "Comunica proativamente quando está apertado",
          "Busca recursos adicionais quando necessário",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Intensifica significativamente o esforço diante de metas difíceis. Encontra maneiras criativas de alcançar resultados.",
        examples: [
          "Propõe planos de recuperação quando está fora do track",
          "Mobiliza colegas para superar desafios coletivos",
          "Supera metas mesmo em cenários adversos",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Referência em comprometimento. Consistentemente supera metas e eleva o padrão de entrega do time.",
        examples: [
          "Histórico de superar metas em ciclos consecutivos",
          "Redefine o que é possível para o time",
          "É o exemplo que gestores usam para motivar outros",
        ],
      },
    ],
  },

  // === FOCO EM FATOS E DADOS ===
  {
    id: "v2_q1",
    title: "Embasamento de decisões",
    category: "Foco em Fatos e Dados",
    description:
      "Quando essa pessoa propõe algo ou toma uma decisão, ela traz números e dados para justificar? Ou geralmente decide mais por opinião e intuição? Me dê um exemplo recente.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Toma decisões por achismo. Não busca dados nem evidências antes de concluir algo.",
        examples: [
          "Propõe mudanças sem nenhum dado de suporte",
          "Tira conclusões precipitadas sem investigar",
          "Ignora dados disponíveis ao tomar decisões",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Às vezes traz dados, mas de forma superficial ou incompleta. Ainda se apoia muito em intuição.",
        examples: [
          "Usa dados parciais para sustentar conclusões",
          "Cita números sem verificar a fonte",
          "Mistura dados com opiniões sem distinguir",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Embasa suas decisões com dados relevantes. Busca evidências antes de propor soluções.",
        examples: [
          "Traz métricas para sustentar propostas",
          "Valida hipóteses com dados antes de agir",
          "Documenta o racional por trás das decisões",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Referência em decisões baseadas em dados. Busca múltiplas fontes e questiona a qualidade dos dados.",
        examples: [
          "Cruza dados de diferentes fontes para validar conclusões",
          "Questiona dados apresentados por outros quando parecem inconsistentes",
          "Cria dashboards ou relatórios para facilitar decisões do time",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Transforma a cultura de dados da área. Cria processos e ferramentas que elevam o nível de decisão de todos.",
        examples: [
          "Implementou processos data-driven que viraram padrão",
          "É consultado por outras áreas para análises críticas",
          "Mudou uma decisão estratégica com análise de dados original",
        ],
      },
    ],
  },
  {
    id: "v2_q2",
    title: "Abertura a evidências contrárias",
    category: "Foco em Fatos e Dados",
    description:
      "Quando alguém discorda dessa pessoa e traz dados que mostram o contrário do que ela pensa, como ela reage? Fica na defensiva ou reconsidera? Me conte uma situação em que isso aconteceu.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Ignora dados que contradizem sua opinião. Se fecha quando questionado com evidências.",
        examples: [
          "Reage defensivamente a questionamentos com dados",
          "Mantém posição mesmo quando os dados mostram o contrário",
          "Desqualifica dados que não concordam com sua visão",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Aceita dados contrários com resistência. Demora para ajustar posição.",
        examples: [
          "Reconhece os dados mas adia a mudança",
          "Aceita parcialmente quando confrontado",
          "Busca exceções para invalidar dados contrários",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Aceita mudanças quando os dados sustentam. Reage de forma construtiva a questionamentos.",
        examples: [
          "Muda de opinião quando apresentam dados convincentes",
          "Agradece questionamentos e reavalia",
          "Não leva para o lado pessoal quando sua ideia é desafiada",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Busca ativamente dados que desafiem sua própria visão. Valoriza quando é corrigido com evidências.",
        examples: [
          "Pede para o time trazer dados contrários antes de decidir",
          "Já mudou de posição publicamente e agradeceu quem trouxe os dados",
          "Testa suas hipóteses antes de defendê-las",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Exemplo de humildade intelectual. Cria ambientes onde desafiar ideias com dados é celebrado.",
        examples: [
          "Implementou rituais de 'advogado do diabo' com dados",
          "É reconhecido como alguém que valoriza a verdade acima do ego",
          "Inspira outros a questionarem suas próprias certezas",
        ],
      },
    ],
  },

  // === PRIORIZE E SIMPLIFIQUE ===
  {
    id: "v3_q1",
    title: "Capacidade de priorização",
    category: "Priorize e Simplifique",
    description:
      "Quando essa pessoa tem várias coisas para fazer ao mesmo tempo, como ela se organiza? Ela consegue separar o que é mais importante do que pode esperar? Me dê um exemplo de como ela lidou com múltiplas demandas.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Não prioriza. Tenta fazer tudo ao mesmo tempo ou faz o que é mais fácil primeiro.",
        examples: [
          "Gasta tempo em tarefas de baixo impacto",
          "Não consegue dizer não para demandas irrelevantes",
          "Entregas importantes atrasam por falta de foco",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Tenta priorizar mas se perde com frequência. Confunde urgência com importância.",
        examples: [
          "Responde a tudo como urgente",
          "Muda de foco com cada nova demanda",
          "Precisa de ajuda constante para definir prioridades",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Organiza seu trabalho de forma adequada. Sabe separar urgente de importante na maioria das vezes.",
        examples: [
          "Mantém lista de prioridades atualizada",
          "Negocia prazos quando tem conflitos de demanda",
          "Entrega o mais importante primeiro",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Excelente em priorização. Ajuda o time a focar no que realmente importa.",
        examples: [
          "Questiona demandas que parecem de baixo impacto",
          "Propõe cortar escopo para entregar mais rápido o essencial",
          "Ajuda colegas a reorganizarem suas prioridades",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Referência em foco e priorização. Transforma a forma como a área decide o que fazer e o que não fazer.",
        examples: [
          "Criou frameworks de priorização usados pelo time",
          "Consistentemente elimina trabalho desnecessário",
          "É quem a liderança consulta para definir o que cortar",
        ],
      },
    ],
  },
  {
    id: "v3_q2",
    title: "Simplificação de processos",
    category: "Priorize e Simplifique",
    description:
      "Essa pessoa já simplificou algum processo ou removeu algo desnecessário? Ela tende a criar soluções simples e diretas, ou costuma complicar as coisas? Me conte um caso.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Adiciona complexidade desnecessária. Seus processos e soluções são mais complicados do que precisam ser.",
        examples: [
          "Cria processos burocráticos onde não precisa",
          "Soluções dele são difíceis de manter ou entender",
          "Não questiona complexidade existente",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Não adiciona complexidade mas também não simplifica. Aceita processos complicados sem questionar.",
        examples: [
          "Segue processos desnecessários sem propor mudanças",
          "Suas soluções funcionam mas poderiam ser mais simples",
          "Não identifica oportunidades de simplificação",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Busca simplicidade nas suas entregas. Questiona complexidade quando percebe.",
        examples: [
          "Propõe versões mais simples quando algo parece over-engineered",
          "Remove etapas desnecessárias de processos",
          "Entrega soluções funcionais sem excesso de abstração",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Proativamente simplifica processos e soluções. Outros reconhecem sua capacidade de fazer mais com menos.",
        examples: [
          "Simplificou processos que economizaram horas do time",
          "É conhecido por soluções elegantes e diretas",
          "Questiona 'sempre fizemos assim' e propõe alternativas mais simples",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Transforma a cultura de simplicidade. Elimina complexidade estrutural e eleva a eficiência da área.",
        examples: [
          "Eliminou processos inteiros que não geravam valor",
          "Criou padrões de simplicidade adotados pela empresa",
          "Reduziu significativamente custos/tempo com simplificações",
        ],
      },
    ],
  },

  // === PROATIVIDADE ===
  {
    id: "v4_q1",
    title: "Antecipação de problemas",
    category: "Proatividade",
    description:
      "Essa pessoa costuma perceber problemas antes deles acontecerem, ou só reage quando já virou urgência? Me dê um exemplo em que ela identificou algo com antecedência e agiu sem ninguém pedir.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Puramente reativo. Só age quando o problema explode e alguém pede para resolver.",
        examples: [
          "Problemas previsíveis viram crise na mão dele",
          "Espera ser cobrado para agir",
          "Não monitora riscos da sua área",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Identifica problemas mas não age espontaneamente. Precisa de um empurrão para tomar iniciativa.",
        examples: [
          "Comenta sobre riscos mas não propõe ações",
          "Age quando lembrado, não por iniciativa própria",
          "Sabe que algo vai dar errado mas espera acontecer",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Age proativamente na maioria das vezes. Identifica e resolve problemas antes que impactem resultados.",
        examples: [
          "Sinaliza riscos com antecedência e propõe soluções",
          "Resolve problemas pequenos sem esperar ser pedido",
          "Monitora indicadores da sua área regularmente",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Alta proatividade. Antecipa problemas com frequência e propõe melhorias espontaneamente.",
        examples: [
          "Preveniu crises com alertas antecipados",
          "Propõe melhorias regularmente, mesmo fora do seu escopo direto",
          "É reconhecido como alguém que 'não deixa a bola cair'",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Referência em proatividade. Antecipa problemas sistêmicos e cria processos preventivos para a área.",
        examples: [
          "Criou alertas/monitoramentos que previram problemas críticos",
          "Sua proatividade evitou perdas significativas para a empresa",
          "Inspira outros a serem mais proativos pelo exemplo",
        ],
      },
    ],
  },
  {
    id: "v4_q2",
    title: "Proposição de melhorias",
    category: "Proatividade",
    description:
      "Essa pessoa costuma sugerir melhorias por conta própria, ou só faz quando alguém pede? Na última vez que algo deu errado na área, qual foi a atitude dela — ficou quieta, ajudou a resolver, ou foi além e propôs como evitar no futuro?",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Nunca propõe melhorias. Quando algo dá errado, se omite ou espera que outros resolvam.",
        examples: [
          "Não contribui em retrospectivas ou post-mortems",
          "Reclama de problemas mas não propõe soluções",
          "Se posiciona como vítima quando algo dá errado",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Propõe melhorias raramente e apenas quando perguntado. Em crises, faz o mínimo.",
        examples: [
          "Só sugere melhorias quando diretamente questionado",
          "Em crises, faz sua parte mas não vai além",
          "Ideias de melhoria são vagas e sem plano de ação",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Propõe melhorias com regularidade. Em situações adversas, contribui ativamente para a solução.",
        examples: [
          "Traz sugestões concretas em rituais do time",
          "Quando algo dá errado, ajuda a resolver e propõe prevenção",
          "Implementa melhorias no seu escopo de trabalho",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Proativamente identifica oportunidades de melhoria e lidera implementação. É protagonista em momentos de crise.",
        examples: [
          "Lidera post-mortems e implementa ações corretivas",
          "Propõe melhorias que impactam além da sua área",
          "É o primeiro a se voluntariar quando algo dá errado",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Transforma problemas em melhorias estruturais. Cria cultura de melhoria contínua na área.",
        examples: [
          "Implementou mudanças que eliminaram categorias inteiras de problemas",
          "Criou rituais de melhoria contínua adotados pelo time",
          "É reconhecido como agente de transformação na empresa",
        ],
      },
    ],
  },

  // === AI FIRST ===
  {
    id: "v5_q1",
    title: "Uso de IA no trabalho",
    category: "AI First",
    description:
      "Essa pessoa usa inteligência artificial no dia a dia de trabalho? Quando recebe uma tarefa nova, ela pensa em usar IA antes de fazer manualmente? Me dê um exemplo de quando ela usou (ou não usou) IA para resolver algo.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Não usa IA. Não demonstra interesse nem abertura para incorporar IA no trabalho.",
        examples: [
          "Nunca experimentou ferramentas de IA",
          "Resiste ativamente a sugestões de usar IA",
          "Faz tudo manualmente mesmo quando IA poderia acelerar",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Usa IA esporadicamente, sem consistência. Não é seu reflexo natural ao iniciar tarefas.",
        examples: [
          "Já experimentou IA mas não incorporou na rotina",
          "Usa IA só quando alguém sugere",
          "Usa IA para coisas básicas mas não explora o potencial",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Usa IA regularmente como ferramenta de trabalho. Considera IA como opção ao iniciar tarefas.",
        examples: [
          "Usa IA para acelerar tarefas recorrentes",
          "Sabe quando IA ajuda e quando não ajuda",
          "Mantém prompts e workflows de IA organizados",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "IA é parte integral do seu fluxo de trabalho. Encontra aplicações criativas e compartilha com o time.",
        examples: [
          "Criou workflows com IA que aceleraram entregas significativamente",
          "Compartilha prompts e técnicas com colegas",
          "Usa IA para resolver problemas que antes eram manuais",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Referência em AI First. Transforma processos com IA e eleva o nível de adoção de toda a área.",
        examples: [
          "Implementou soluções com IA que viraram padrão na empresa",
          "Treina e capacita colegas no uso de IA",
          "Reduziu significativamente tempo/custo de processos com IA",
        ],
      },
    ],
  },
  {
    id: "v5_q2",
    title: "Disseminação de IA no time",
    category: "AI First",
    description:
      "Essa pessoa compartilha o que aprende sobre IA com o time, ou guarda só para ela? Ela ajuda colegas a usar IA? Me conte se ela já ensinou algo ou organizou algum momento para compartilhar conhecimento de IA.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description:
          "Não compartilha nem contribui para adoção de IA. Pode até desencorajar outros.",
        examples: [
          "Não participa de discussões sobre IA",
          "Não compartilha nenhum aprendizado",
          "Expressa ceticismo sem fundamento sobre IA",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description:
          "Compartilha pouco. Usa IA individualmente mas não contribui para o time.",
        examples: [
          "Guarda prompts e técnicas para si",
          "Comenta sobre IA superficialmente mas não ensina",
          "Não participa ativamente de iniciativas de IA do time",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description:
          "Compartilha aprendizados quando solicitado. Participa de iniciativas de IA do time.",
        examples: [
          "Compartilha prompts úteis quando perguntam",
          "Participa de rituais de IA do time",
          "Mostra interesse em aprender com colegas que usam IA",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description:
          "Proativamente compartilha e ensina. Ajuda colegas a adotarem IA no dia a dia.",
        examples: [
          "Organiza sessões informais de compartilhamento de IA",
          "Ajuda colegas a configurar e usar ferramentas de IA",
          "Documenta e compartilha workflows de IA do time",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description:
          "Líder de adoção de IA. Cria cultura AI First e capacita toda a área.",
        examples: [
          "Criou programa de capacitação em IA para o time",
          "É referência na empresa para adoção de IA",
          "Lidera transformação de processos com IA além da sua área",
        ],
      },
    ],
  },
];
