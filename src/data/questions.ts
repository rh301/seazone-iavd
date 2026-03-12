import { Question } from "@/lib/types";

export const defaultQuestions: Question[] = [
  {
    id: "q1",
    title: "Colaboração entre áreas",
    category: "Valores",
    description:
      "Avalia a capacidade do colaborador de trabalhar de forma integrada com outras áreas, promovendo alinhamento e resultados conjuntos.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Raramente colabora com outras áreas. Trabalha de forma isolada e resistente a interações cross-funcionais.",
        examples: [
          "Não participa de reuniões com outras áreas quando convidado",
          "Recusa pedidos de ajuda de outros times",
          "Não compartilha informações relevantes com stakeholders",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Colabora minimamente, apenas quando há pressão direta ou cobrança formal.",
        examples: [
          "Responde a solicitações com atraso significativo",
          "Participa de alinhamentos mas sem engajamento real",
          "Compartilha informações de forma incompleta",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Colabora quando solicitado, de forma adequada e no prazo esperado.",
        examples: [
          "Responde prontamente a pedidos de outras áreas",
          "Participa ativamente de reuniões cross-funcionais",
          "Compartilha informações de forma clara e completa",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Frequentemente busca colaboração proativa, identificando oportunidades de sinergia entre áreas.",
        examples: [
          "Propõe melhorias que envolvem múltiplas áreas",
          "Busca feedback de outros times antes de entregar projetos",
          "Facilita comunicação entre áreas que não se conversavam",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Puxa iniciativas entre áreas e facilita alinhamentos complexos. É referência em colaboração cross-funcional.",
        examples: [
          "Lidera projetos multi-área com resultados expressivos",
          "Cria processos que melhoram a colaboração da empresa como um todo",
          "É procurado por diferentes áreas como facilitador de alinhamentos",
        ],
      },
    ],
  },
  {
    id: "q2",
    title: "Orientação a resultados",
    category: "Performance",
    description:
      "Avalia o foco do colaborador em entregar resultados de alto impacto, com senso de urgência e ownership.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não demonstra foco em resultados. Entregas são frequentemente atrasadas ou abaixo do padrão.",
        examples: [
          "Não cumpre prazos acordados repetidamente",
          "Entregas precisam de retrabalho significativo",
          "Não acompanha métricas da sua área",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Entrega resultados básicos, mas sem consistência ou senso de urgência.",
        examples: [
          "Cumpre prazos com atraso frequente",
          "Entregas atendem parcialmente os requisitos",
          "Precisa de acompanhamento constante para entregar",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Entrega resultados consistentes dentro do prazo e padrão esperado.",
        examples: [
          "Cumpre metas e prazos da sua área",
          "Entregas são completas e no padrão de qualidade",
          "Acompanha suas métricas e reporta proativamente",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Supera metas frequentemente e busca ir além do escopo original com iniciativa própria.",
        examples: [
          "Entrega acima da meta em ciclos consecutivos",
          "Identifica e resolve gargalos antes de impactar resultados",
          "Propõe otimizações que melhoram a eficiência da área",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em entrega de resultados. Transforma desafios em oportunidades com impacto significativo no negócio.",
        examples: [
          "Resultados acima da meta com impacto mensurável no negócio",
          "Cria novos processos ou soluções que viram referência",
          "Inspira e eleva o nível de entrega do time inteiro",
        ],
      },
    ],
  },
  {
    id: "q3",
    title: "Comunicação e transparência",
    category: "Valores",
    description:
      "Avalia a clareza, frequência e honestidade na comunicação do colaborador com pares, líderes e stakeholders.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Comunicação é rara, confusa ou omissa. Não compartilha informações importantes.",
        examples: [
          "Colegas frequentemente não sabem no que está trabalhando",
          "Omite problemas até que se tornem críticos",
          "Não responde a mensagens em tempo razoável",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Comunica de forma inconsistente. Às vezes omite contexto importante.",
        examples: [
          "Atualizações de status são vagas ou incompletas",
          "Informa sobre riscos com atraso",
          "Comunicação escrita tem gaps frequentes",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Comunica de forma clara e no tempo esperado. Mantém stakeholders informados.",
        examples: [
          "Envia updates regulares sobre seus projetos",
          "Sinaliza riscos e bloqueios proativamente",
          "Documenta decisões e alinhamentos importantes",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Comunicação é clara, proativa e adaptada ao público. Facilita o alinhamento.",
        examples: [
          "Adapta a mensagem para diferentes audiências (técnico vs negócio)",
          "Cria documentações que viram referência",
          "Antecipa dúvidas e já traz contexto nas comunicações",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em comunicação. Promove cultura de transparência e alinhamento na organização.",
        examples: [
          "Lidera rituais de comunicação que melhoram toda a área",
          "É buscado como referência para comunicar temas difíceis",
          "Criou processos de comunicação adotados por toda empresa",
        ],
      },
    ],
  },
  {
    id: "q4",
    title: "Desenvolvimento e aprendizado contínuo",
    category: "Comportamento",
    description:
      "Avalia a busca do colaborador por aprendizado, capacidade de receber feedback e evolução profissional.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não demonstra interesse em aprender ou evoluir. Resistente a feedback.",
        examples: [
          "Reage negativamente a feedbacks",
          "Não busca aprender novas habilidades",
          "Repete os mesmos erros sem evolução",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Aceita feedback mas demora a implementar mudanças. Aprendizado é reativo.",
        examples: [
          "Aceita feedback mas não muda comportamento",
          "Só aprende quando é obrigado",
          "Evolução é lenta e precisa de reforço constante",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Busca aprendizado e recebe feedback de forma construtiva. Evolução consistente.",
        examples: [
          "Implementa mudanças após receber feedback",
          "Busca cursos e conteúdos relevantes para sua área",
          "Mostra evolução visível entre ciclos de avaliação",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Proativo no aprendizado. Busca feedback ativamente e aplica rapidamente.",
        examples: [
          "Pede feedback regularmente sem esperar avaliações formais",
          "Compartilha aprendizados com o time",
          "Aplica novos conhecimentos para melhorar seu trabalho",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Referência em desenvolvimento. Impulsiona o aprendizado do time e cria cultura de melhoria contínua.",
        examples: [
          "Mentora outros colaboradores ativamente",
          "Cria conteúdos e treinamentos para o time",
          "É reconhecido como referência técnica ou comportamental",
        ],
      },
    ],
  },
  {
    id: "q5",
    title: "Liderança e influência",
    category: "Performance",
    description:
      "Avalia a capacidade de influenciar positivamente, liderar pelo exemplo e mobilizar pessoas.",
    scale: [
      {
        score: 1,
        label: "Insuficiente",
        description: "Não exerce influência positiva. Pode impactar negativamente a motivação do time.",
        examples: [
          "Desanima colegas com atitude negativa",
          "Não assume responsabilidade por resultados do grupo",
          "Gera conflitos sem buscar resolução",
        ],
      },
      {
        score: 2,
        label: "Abaixo do esperado",
        description: "Influência limitada. Lidera apenas por demanda, sem iniciativa própria.",
        examples: [
          "Assume liderança apenas quando designado formalmente",
          "Não inspira engajamento nos pares",
          "Evita situações de conflito ao invés de resolvê-las",
        ],
      },
      {
        score: 3,
        label: "Dentro do esperado",
        description: "Influencia positivamente seu círculo próximo. Lidera pelo exemplo no dia a dia.",
        examples: [
          "Demonstra comprometimento que inspira os colegas",
          "Ajuda a resolver conflitos quando envolvido",
          "Assume responsabilidade pelo resultado do grupo",
        ],
      },
      {
        score: 4,
        label: "Acima do esperado",
        description: "Influencia além do seu time direto. É buscado como referência de liderança.",
        examples: [
          "Mobiliza pessoas para projetos e iniciativas",
          "Medeia conflitos entre pares de forma eficaz",
          "É referência comportamental para novos colaboradores",
        ],
      },
      {
        score: 5,
        label: "Excepcional",
        description: "Líder natural reconhecido por toda organização. Transforma cultura e eleva o nível coletivo.",
        examples: [
          "Inspira mudanças culturais positivas na empresa",
          "Desenvolve outros líderes ativamente",
          "É procurado pela alta liderança para contribuir em decisões estratégicas",
        ],
      },
    ],
  },
];
