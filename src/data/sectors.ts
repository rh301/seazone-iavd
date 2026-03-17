// Auto-generated from organograma.csv — DO NOT EDIT
export interface Sector {
  name: string;
  parentSector: string | null;
  responsavelName: string;
}

export const sectors: Sector[] = [
  {
    "name": "Seazone",
    "parentSector": null,
    "responsavelName": "Fernando Silva Pereira"
  },
  {
    "name": "Holding",
    "parentSector": "Seazone",
    "responsavelName": "Fernando Silva Pereira"
  },
  {
    "name": "CFO",
    "parentSector": "Holding",
    "responsavelName": "Gustavo Cargnin Kremer"
  },
  {
    "name": "COO",
    "parentSector": "Holding",
    "responsavelName": "Bruno Eduardo Benetti"
  },
  {
    "name": "Transformação",
    "parentSector": "Holding",
    "responsavelName": "João Pedro Sabino Coutinho"
  },
  {
    "name": "Comercial",
    "parentSector": "Holding",
    "responsavelName": "João Pedro Sabino Coutinho"
  },
  {
    "name": "Expansão",
    "parentSector": "Holding",
    "responsavelName": "Caio Pereira Panissi"
  },
  {
    "name": "CCO",
    "parentSector": "Holding",
    "responsavelName": "Mônica Medeiros Gaspar de Souza"
  },
  {
    "name": "Tecnologia",
    "parentSector": "Holding",
    "responsavelName": "Arilo Claudio Dias Neto"
  },
  {
    "name": "CRO",
    "parentSector": "Holding",
    "responsavelName": "Priscila Borem Sfredo"
  },
  {
    "name": "Investimentos",
    "parentSector": "Holding",
    "responsavelName": "Matheus Alberto Ambrosi"
  },
  {
    "name": "Finanças",
    "parentSector": "CFO",
    "responsavelName": "Alan Diego Pontizelli"
  },
  {
    "name": "People",
    "parentSector": "CFO",
    "responsavelName": "Mario Lopes de Andrade"
  },
  {
    "name": "Informação e Inteligência",
    "parentSector": "COO",
    "responsavelName": "Cesar Augusto Ramos de Carvalho"
  },
  {
    "name": "Marketplace",
    "parentSector": "Comercial",
    "responsavelName": "Roberto Amaral Marcondes de Souza"
  },
  {
    "name": "Expansão Construtoras",
    "parentSector": "Expansão",
    "responsavelName": "Caio Pereira Panissi"
  },
  {
    "name": "Decor Expansão",
    "parentSector": "Comercial",
    "responsavelName": "Gabriela de Oliveira Costa"
  },
  {
    "name": "Marketing",
    "parentSector": "CRO",
    "responsavelName": "Priscila Borem Sfredo"
  },
  {
    "name": "Parcerias",
    "parentSector": "COO",
    "responsavelName": "Débora Ariel Brodt da Silva"
  },
  {
    "name": "Operação",
    "parentSector": "COO",
    "responsavelName": "Iara Araujo de Moraes"
  },
  {
    "name": "Estruturação",
    "parentSector": "Investimentos",
    "responsavelName": "Tatiana Barros de Andrade Mello Gonçalves de Souza"
  },
  {
    "name": "Obra",
    "parentSector": "Investimentos",
    "responsavelName": "Francisco Eduardo Quilice"
  },
  {
    "name": "Gestão de Projetos",
    "parentSector": "Investimentos",
    "responsavelName": "Cristiane Araújo Figueira"
  },
  {
    "name": "Jurídico",
    "parentSector": "CFO",
    "responsavelName": "Victória Bonatto Hofmeister"
  },
  {
    "name": "Dados",
    "parentSector": "Tecnologia",
    "responsavelName": "Anderson Pimentel dos Santos"
  },
  {
    "name": "Comercial SZS",
    "parentSector": "Comercial",
    "responsavelName": "Gabriel Zonatto"
  },
  {
    "name": "Comercial SZI",
    "parentSector": "Comercial",
    "responsavelName": "Pamella Brayner Rodrigues"
  },
  {
    "name": "Desenvolvimento Web",
    "parentSector": "Tecnologia",
    "responsavelName": "Roberto Cavalcanti Campos Neto"
  },
  {
    "name": "Produto",
    "parentSector": "Tecnologia",
    "responsavelName": "Liniquer Kavrokov Vieira"
  },
  {
    "name": "Tesouraria",
    "parentSector": "Finanças",
    "responsavelName": "Jhonata Vinicius Tridapalli"
  },
  {
    "name": "Contabilidade",
    "parentSector": "Finanças",
    "responsavelName": "Ana Carolina Silva Benevenuto"
  },
  {
    "name": "Planejamento Financeiro",
    "parentSector": "Finanças",
    "responsavelName": "Alan Diego Pontizelli"
  },
  {
    "name": "Estagiários",
    "parentSector": "People",
    "responsavelName": "Mario Lopes de Andrade"
  },
  {
    "name": "Business Operations",
    "parentSector": "Informação e Inteligência",
    "responsavelName": "Cesar Augusto Ramos de Carvalho"
  },
  {
    "name": "Marketing de Ativação",
    "parentSector": "Marketing",
    "responsavelName": "Mateus Volpato Abu Jamra"
  },
  {
    "name": "Criação",
    "parentSector": "Marketing",
    "responsavelName": "Anna Beatriz de Paiva Targino"
  },
  {
    "name": "Product Marketing",
    "parentSector": "Marketing",
    "responsavelName": "Mariane Costa Resende"
  },
  {
    "name": "Growth",
    "parentSector": "Marketing",
    "responsavelName": "Priscila Borem Sfredo"
  },
  {
    "name": "Parcerias Prospecção e Pool",
    "parentSector": "Parcerias",
    "responsavelName": "Crislaine Alves de Oliveira Vieira"
  },
  {
    "name": "Parcerias Farmers",
    "parentSector": "Parcerias",
    "responsavelName": "Débora Ariel Brodt da Silva"
  },
  {
    "name": "Proprietários",
    "parentSector": "Operação",
    "responsavelName": "Luiza Cechelero"
  },
  {
    "name": "Terrenos",
    "parentSector": "Estruturação",
    "responsavelName": "Vinícius Andrade de Melo"
  },
  {
    "name": "Compra de Terrenos",
    "parentSector": "Estruturação",
    "responsavelName": "Tatiana Barros de Andrade Mello Gonçalves de Souza"
  },
  {
    "name": "Lançamentos",
    "parentSector": "Estruturação",
    "responsavelName": "Caroline Vieira Montedo"
  },
  {
    "name": "Decor",
    "parentSector": "Estruturação",
    "responsavelName": "Amanda Bracht Malagutti"
  },
  {
    "name": "Engenharia",
    "parentSector": "Obra",
    "responsavelName": "Guilherme Nuernberg de Freitas"
  },
  {
    "name": "Entrega e Execução",
    "parentSector": "Obra",
    "responsavelName": "Sabrina Martinho"
  },
  {
    "name": "Financeiro Obra",
    "parentSector": "Gestão de Projetos",
    "responsavelName": "Celsiane Gomes da Costa"
  },
  {
    "name": "Financeiro SPE",
    "parentSector": "Gestão de Projetos",
    "responsavelName": "Rafaela Gonçalves Cardoso"
  },
  {
    "name": "Orçamento Obras",
    "parentSector": "Obra",
    "responsavelName": "Francisco Eduardo Quilice"
  },
  {
    "name": "PMO",
    "parentSector": "Gestão de Projetos",
    "responsavelName": "Cristiane Araújo Figueira"
  },
  {
    "name": "Suprimentos",
    "parentSector": "Obra",
    "responsavelName": "Francisco Eduardo Quilice"
  },
  {
    "name": "Franquias",
    "parentSector": "Operação",
    "responsavelName": "Vivianny Aguilera Ramalho"
  },
  {
    "name": "Implantação",
    "parentSector": "Operação",
    "responsavelName": "Larissa Rodrigues Constantino"
  },
  {
    "name": "Hóspede",
    "parentSector": "Operação",
    "responsavelName": "Carolina Espindola de Brito"
  },
  {
    "name": "Revenue Management",
    "parentSector": "COO",
    "responsavelName": "Fábio de Biasi Garcia"
  },
  {
    "name": "Fechamento",
    "parentSector": "COO",
    "responsavelName": "Maria Alice dos Santos Duz"
  },
  {
    "name": "Jovens Talentos",
    "parentSector": "People",
    "responsavelName": "Mario Lopes de Andrade"
  },
  {
    "name": "Cross Sell e Up Sell",
    "parentSector": "Operação",
    "responsavelName": "Nathalia Cristina Carvalho"
  },
  {
    "name": "Jurídico SZS",
    "parentSector": "Jurídico",
    "responsavelName": "Victória Bonatto Hofmeister"
  },
  {
    "name": "Jurídico SZI",
    "parentSector": "Jurídico",
    "responsavelName": "Luana de Fátima Koguta"
  },
  {
    "name": "Cedente",
    "parentSector": "Marketplace",
    "responsavelName": "Roberto Amaral Marcondes de Souza"
  },
  {
    "name": "Pré-Vendas Marketplace",
    "parentSector": "Marketplace",
    "responsavelName": "Roberto Amaral Marcondes de Souza"
  },
  {
    "name": "Vendas Marketplace",
    "parentSector": "Marketplace",
    "responsavelName": "Roberto Amaral Marcondes de Souza"
  },
  {
    "name": "Pré-Vendas Expansão Construtoras",
    "parentSector": "Expansão Construtoras",
    "responsavelName": "Caio Pereira Panissi"
  },
  {
    "name": "Vendas Expansão Construtoras",
    "parentSector": "Expansão Construtoras",
    "responsavelName": "Caio Pereira Panissi"
  },
  {
    "name": "Farmer Expansão Construtoras",
    "parentSector": "Expansão Construtoras",
    "responsavelName": "Caio Pereira Panissi"
  },
  {
    "name": "Pré-Vendas Decor Expansão",
    "parentSector": "Decor Expansão",
    "responsavelName": "Gabriela de Oliveira Costa"
  },
  {
    "name": "Vendas Decor Expansão",
    "parentSector": "Decor Expansão",
    "responsavelName": "Gabriela de Oliveira Costa"
  },
  {
    "name": "Cultura e Analytics",
    "parentSector": "People",
    "responsavelName": "Mario Lopes de Andrade"
  },
  {
    "name": "Departamento Pessoal",
    "parentSector": "People",
    "responsavelName": "Mario Lopes de Andrade"
  },
  {
    "name": "Recrutamento e Seleção",
    "parentSector": "People",
    "responsavelName": "Mario Lopes de Andrade"
  },
  {
    "name": "Governança e Automação",
    "parentSector": "Dados",
    "responsavelName": "Anderson Pimentel dos Santos"
  },
  {
    "name": "IA",
    "parentSector": "COO",
    "responsavelName": "Kelly Robert-Svendsen Rassier"
  },
  {
    "name": "Comercial Tech",
    "parentSector": "Desenvolvimento Web",
    "responsavelName": "Francisco Oliveira da Silva Filho"
  },
  {
    "name": "Design",
    "parentSector": "Produto",
    "responsavelName": "Arilo Claudio Dias Neto"
  },
  {
    "name": "Hosting",
    "parentSector": "Desenvolvimento Web",
    "responsavelName": "Roberto Cavalcanti Campos Neto"
  },
  {
    "name": "IA Tech",
    "parentSector": "Dados",
    "responsavelName": "Anderson Pimentel dos Santos"
  },
  {
    "name": "PM Tech",
    "parentSector": "Produto",
    "responsavelName": "Arilo Claudio Dias Neto"
  },
  {
    "name": "Quality Assurance",
    "parentSector": "Desenvolvimento Web",
    "responsavelName": "Roberto Cavalcanti Campos Neto"
  },
  {
    "name": "Booking",
    "parentSector": "Desenvolvimento Web",
    "responsavelName": "Roberto Cavalcanti Campos Neto"
  },
  {
    "name": "Solutions e Ops",
    "parentSector": "Dados",
    "responsavelName": "Lucas Machado Azevedo"
  },
  {
    "name": "Spot",
    "parentSector": "Desenvolvimento Web",
    "responsavelName": "Roberto Cavalcanti Campos Neto"
  },
  {
    "name": "Pré-Vendas SZS",
    "parentSector": "Comercial SZS",
    "responsavelName": "Kamille Santos Gomes Silva"
  },
  {
    "name": "Vendas SZI",
    "parentSector": "Comercial SZI",
    "responsavelName": "Pamella Brayner Rodrigues"
  },
  {
    "name": "Pré-Vendas SZI",
    "parentSector": "Comercial SZI",
    "responsavelName": "Jeniffer Aparecida Lourenço Corrêa"
  },
  {
    "name": "Vendas SZS",
    "parentSector": "Comercial SZS",
    "responsavelName": "Mayara Marques Leite da Silva"
  },
  {
    "name": "Administrativo e Compras",
    "parentSector": "Tesouraria",
    "responsavelName": "Jhonata Vinicius Tridapalli"
  },
  {
    "name": "Contas a Pagar",
    "parentSector": "Tesouraria",
    "responsavelName": "Aline da Silva Lima"
  },
  {
    "name": "Contas a Receber",
    "parentSector": "Tesouraria",
    "responsavelName": "Aline da Silva Lima"
  },
  {
    "name": "Private",
    "parentSector": "Terrenos",
    "responsavelName": "Maria Santos Guimarães"
  },
  {
    "name": "Projetos Lançamentos",
    "parentSector": "Lançamentos",
    "responsavelName": "Rachel Souto Hudson"
  },
  {
    "name": "Gestão de Lançamentos",
    "parentSector": "Lançamentos",
    "responsavelName": "Caroline Vieira Montedo"
  },
  {
    "name": "Orçamento Lançamentos",
    "parentSector": "Lançamentos",
    "responsavelName": "Caroline Vieira Montedo"
  },
  {
    "name": "Execução",
    "parentSector": "Entrega e Execução",
    "responsavelName": "Sabrina Martinho"
  },
  {
    "name": "Análise de Terrenos",
    "parentSector": "Terrenos",
    "responsavelName": "Maria Santos Guimarães"
  },
  {
    "name": "Fornecedores Lançamentos",
    "parentSector": "Lançamentos",
    "responsavelName": "Caroline Vieira Montedo"
  },
  {
    "name": "Prospecção de Terrenos",
    "parentSector": "Terrenos",
    "responsavelName": "Mailson Silveira Melo"
  },
  {
    "name": "Inteligência de Mercado",
    "parentSector": "Terrenos",
    "responsavelName": "Vinícius Andrade de Melo"
  },
  {
    "name": "Franquias Backoffice",
    "parentSector": "Franquias",
    "responsavelName": "Rayanne Raiza Alves Leite de Oliveira"
  },
  {
    "name": "Franquias Relacionamento",
    "parentSector": "Franquias",
    "responsavelName": "Vivianny Aguilera Ramalho"
  },
  {
    "name": "Anúncios",
    "parentSector": "Hóspede",
    "responsavelName": "Renato Espindola de Brito"
  },
  {
    "name": "Atendimento Operacional I",
    "parentSector": "Hóspede",
    "responsavelName": "Vanessa da Silva Benigno"
  },
  {
    "name": "Atendimento Operacional II",
    "parentSector": "Hóspede",
    "responsavelName": "Nathalia Ferreira Beltramello Silva"
  },
  {
    "name": "Atendimento Comercial",
    "parentSector": "Hóspede",
    "responsavelName": "Jaqueline Souza Santana"
  },
  {
    "name": "CS Proprietários",
    "parentSector": "Proprietários",
    "responsavelName": "Raquel Magnaguagno"
  },
  {
    "name": "Atendimento Pós Reserva II",
    "parentSector": "Hóspede",
    "responsavelName": "Nathalia Ferreira Beltramello Silva"
  },
  {
    "name": "Atendimento Pós Reserva I",
    "parentSector": "Hóspede",
    "responsavelName": "Vanessa da Silva Benigno"
  },
  {
    "name": "Franquias Suporte",
    "parentSector": "Franquias Relacionamento",
    "responsavelName": "Paula Guedes Sacramento"
  },
  {
    "name": "Vistas, Pool e Gestão de Contas",
    "parentSector": "Operação",
    "responsavelName": "Mayara da Silva Cabral"
  },
  {
    "name": "Suporte Precificação e Canais",
    "parentSector": "Revenue Management",
    "responsavelName": "Isabella Zaffari Ely Guerreiro"
  },
  {
    "name": "Precificação",
    "parentSector": "Revenue Management",
    "responsavelName": "Victor Hugo da Costa Guindani"
  },
  {
    "name": "Reservas - Fechamento",
    "parentSector": "Fechamento",
    "responsavelName": "Débora Ramos Bernardes Franzoni"
  },
  {
    "name": "Parceiros",
    "parentSector": "Fechamento",
    "responsavelName": "Débora Ramos Bernardes Franzoni"
  },
  {
    "name": "Comentários",
    "parentSector": "Hóspede",
    "responsavelName": "Carolina Espindola de Brito"
  },
  {
    "name": "Comissão Comercial",
    "parentSector": "Fechamento",
    "responsavelName": "Débora Ramos Bernardes Franzoni"
  },
  {
    "name": "Entrega de Obras",
    "parentSector": "Entrega e Execução",
    "responsavelName": "Sabrina Martinho"
  },
  {
    "name": "Projetos Internos",
    "parentSector": "Business Operations",
    "responsavelName": "Viviane Naomi Kohatsu"
  },
  {
    "name": "Prototipagem Rápida",
    "parentSector": "Business Operations",
    "responsavelName": "Alexandre Heckert Lentz"
  },
  {
    "name": "Sales Ops",
    "parentSector": "Business Operations",
    "responsavelName": "Luiz Otavio dos Santos Lopes"
  },
  {
    "name": "Automação",
    "parentSector": "Governança e Automação",
    "responsavelName": "Adama Sene Sall"
  },
  {
    "name": "CS SZI",
    "parentSector": "Proprietários",
    "responsavelName": "Cinthia Solem Ramos"
  },
  {
    "name": "BP Ops",
    "parentSector": "Business Operations",
    "responsavelName": "Francisco Duclou Rito"
  },
  {
    "name": "Dados Internos",
    "parentSector": "Business Operations",
    "responsavelName": "Fulvio Vilas Boas"
  },
  {
    "name": "Adequação e Enxoval",
    "parentSector": "Implantação",
    "responsavelName": "Caroline da Silva Seixas Leite"
  },
  {
    "name": "Fotografia",
    "parentSector": "Implantação",
    "responsavelName": "Larissa Rodrigues Constantino"
  },
  {
    "name": "Grandes Operações",
    "parentSector": "Implantação",
    "responsavelName": "Larissa Rodrigues Constantino"
  },
  {
    "name": "Implantação Proprietário",
    "parentSector": "Implantação",
    "responsavelName": "Jessica Winny Passos Ferreira"
  },
  {
    "name": "Vistorias",
    "parentSector": "Implantação",
    "responsavelName": "Andreza Zeneide Romana da Silva"
  },
  {
    "name": "Implantação Imóvel Franquia",
    "parentSector": "Implantação",
    "responsavelName": "Caroline da Silva Seixas Leite"
  },
  {
    "name": "Proprietários Ops",
    "parentSector": "Proprietários",
    "responsavelName": "Luiza Cechelero"
  },
  {
    "name": "Suporte Proprietários",
    "parentSector": "Proprietários",
    "responsavelName": "Melina Barbosa Marambaia"
  },
  {
    "name": "Ops RM",
    "parentSector": "Revenue Management",
    "responsavelName": "Fábio de Biasi Garcia"
  },
  {
    "name": "Governança",
    "parentSector": "Governança e Automação",
    "responsavelName": "Adama Sene Sall"
  },
  {
    "name": "Data Ops",
    "parentSector": "Solutions e Ops",
    "responsavelName": "Lucas Machado Azevedo"
  },
  {
    "name": "Data Solutions",
    "parentSector": "Solutions e Ops",
    "responsavelName": "Lucas Machado Azevedo"
  },
  {
    "name": "Jurídico SZI (Gestão de Obras)",
    "parentSector": "Jurídico SZI",
    "responsavelName": "Luana de Fátima Koguta"
  },
  {
    "name": "Arquitetura",
    "parentSector": "Projetos Lançamentos",
    "responsavelName": "Rachel Souto Hudson"
  },
  {
    "name": "Interiores",
    "parentSector": "Projetos Lançamentos",
    "responsavelName": "Rachel Souto Hudson"
  },
  {
    "name": "Fornecedores e Compras Franquias",
    "parentSector": "Franquias Backoffice",
    "responsavelName": "Rayanne Raiza Alves Leite de Oliveira"
  },
  {
    "name": "Administrativo e Financeiro Franquias",
    "parentSector": "Franquias Backoffice",
    "responsavelName": "Rayanne Raiza Alves Leite de Oliveira"
  },
  {
    "name": "Consultoria Regional",
    "parentSector": "Franquias Relacionamento",
    "responsavelName": "Ariana Paula da Silva Martins"
  },
  {
    "name": "Alteração de Anúncios",
    "parentSector": "Anúncios",
    "responsavelName": "Renato Espindola de Brito"
  },
  {
    "name": "Criação de Anúncios",
    "parentSector": "Anúncios",
    "responsavelName": "Renato Espindola de Brito"
  },
  {
    "name": "Comercial Franquias",
    "parentSector": "Franquias Relacionamento",
    "responsavelName": "Vivianny Aguilera Ramalho"
  },
  {
    "name": "Manutenção Franquias",
    "parentSector": "Franquias Backoffice",
    "responsavelName": "Rayanne Raiza Alves Leite de Oliveira"
  },
  {
    "name": "Qualidade Franquias",
    "parentSector": "Franquias",
    "responsavelName": "Vivianny Aguilera Ramalho"
  },
  {
    "name": "Treinamento Franquias",
    "parentSector": "Franquias Relacionamento",
    "responsavelName": "Vivianny Aguilera Ramalho"
  },
  {
    "name": "Ferramentas/TI",
    "parentSector": "Business Operations",
    "responsavelName": "Cesar Augusto Ramos de Carvalho"
  }
];
