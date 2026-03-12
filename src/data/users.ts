import { User } from "@/lib/auth-types";

export const users: User[] = [
  // C-Level
  {
    id: "u_ceo",
    name: "Ricardo Tavares",
    email: "ricardo@seazone.com",
    role: "c_level",
    department: "Executivo",
    managerId: null,
  },

  // RH
  {
    id: "u_rh1",
    name: "Juliana Pereira",
    email: "juliana@seazone.com",
    role: "rh",
    department: "RH",
    managerId: "u_ceo",
  },

  // Diretores
  {
    id: "u_dir_tech",
    name: "Carlos Mendes",
    email: "carlos@seazone.com",
    role: "diretor",
    department: "Tecnologia",
    managerId: "u_ceo",
  },
  {
    id: "u_dir_prod",
    name: "Fernanda Lima",
    email: "fernanda@seazone.com",
    role: "diretor",
    department: "Produto",
    managerId: "u_ceo",
  },
  {
    id: "u_dir_ops",
    name: "Roberto Alves",
    email: "roberto@seazone.com",
    role: "diretor",
    department: "Operações",
    managerId: "u_ceo",
  },

  // Coordenadores
  {
    id: "u_coord_data",
    name: "Marcos Silva",
    email: "marcos@seazone.com",
    role: "coordenador",
    department: "Tecnologia",
    managerId: "u_dir_tech",
  },
  {
    id: "u_coord_eng",
    name: "Patrícia Nunes",
    email: "patricia@seazone.com",
    role: "coordenador",
    department: "Tecnologia",
    managerId: "u_dir_tech",
  },
  {
    id: "u_coord_design",
    name: "Lucas Ferreira",
    email: "lucas@seazone.com",
    role: "coordenador",
    department: "Produto",
    managerId: "u_dir_prod",
  },

  // Colaboradores - Tecnologia (Data)
  {
    id: "u_ana",
    name: "Ana Souza",
    email: "ana@seazone.com",
    role: "colaborador",
    department: "Tecnologia",
    managerId: "u_coord_data",
  },
  {
    id: "u_pedro",
    name: "Pedro Rocha",
    email: "pedro@seazone.com",
    role: "colaborador",
    department: "Tecnologia",
    managerId: "u_coord_data",
  },

  // Colaboradores - Tecnologia (Engenharia)
  {
    id: "u_bruno",
    name: "Bruno Oliveira",
    email: "bruno@seazone.com",
    role: "colaborador",
    department: "Tecnologia",
    managerId: "u_coord_eng",
  },
  {
    id: "u_mariana",
    name: "Mariana Costa",
    email: "mariana@seazone.com",
    role: "colaborador",
    department: "Tecnologia",
    managerId: "u_coord_eng",
  },

  // Colaboradores - Produto (Design)
  {
    id: "u_diego",
    name: "Diego Costa",
    email: "diego@seazone.com",
    role: "colaborador",
    department: "Produto",
    managerId: "u_coord_design",
  },
  {
    id: "u_camila",
    name: "Camila Santos",
    email: "camila@seazone.com",
    role: "colaborador",
    department: "Produto",
    managerId: "u_coord_design",
  },

  // Colaboradores - Operações (direto com diretor)
  {
    id: "u_elena",
    name: "Elena Ribeiro",
    email: "elena@seazone.com",
    role: "colaborador",
    department: "Operações",
    managerId: "u_dir_ops",
  },
  {
    id: "u_felipe",
    name: "Felipe Martins",
    email: "felipe@seazone.com",
    role: "colaborador",
    department: "Operações",
    managerId: "u_dir_ops",
  },
];
