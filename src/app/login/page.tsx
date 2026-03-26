"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { users } from "@/data/users";
import { roleLabels, roleColors } from "@/lib/auth-types";
import { searchUsers, toUser } from "@/lib/org-tree";
import {
  LogIn,
  Shield,
  Users,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowDown,
  Target,
  MessageSquare,
  TrendingUp,
  ClipboardCheck,
  MessagesSquare,
  Compass,
  PenTool,
  ShieldCheck,
  CalendarSync,
  BarChart3,
  Heart,
} from "lucide-react";

// removed roleOrder - now using search

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

const faqItems = [
  {
    question: "Quem participa da Avaliação de Desempenho?",
    answer:
      "Todos os colaboradores da Seazone participam do processo de AVD. Gestores avaliam seus liderados com apoio de inteligência artificial, garantindo uma avaliação justa e consistente entre áreas.",
  },
  {
    question: "Com que frequência a AVD acontece?",
    answer:
      "A AVD acontece semestralmente, com ciclos bem definidos de início e fim. Cada ciclo contempla autoavaliação, feedback 360°, reunião de alinhamento e plano de desenvolvimento.",
  },
  {
    question: "O que acontece com os resultados da minha avaliação?",
    answer:
      "Os resultados são revisados pelo RH, garantindo consistência e justiça. Depois, são utilizados para guiar planos de desenvolvimento individual, promoções e movimentações.",
  },
  {
    question: "E se eu discordar do feedback recebido?",
    answer:
      "A AVD é um processo de diálogo. Na reunião de alinhamento, você tem a oportunidade de discutir os resultados com seu gestor, apresentar sua perspectiva e construir juntos um plano de evolução.",
  },
  {
    question: "Como posso me preparar melhor?",
    answer:
      "Reserve 30 minutos sem interrupções, revise suas metas do ciclo anterior e traga exemplos concretos de entregas. Quanto mais específico, mais produtivo será o processo.",
  },
];

const steps = [
  {
    icon: ClipboardCheck,
    label: "AUTOAVALIAÇÃO",
    title: "Autoavaliação",
    subtitle: "Reflexão individual",
    description:
      "Você avalia o seu próprio desempenho com base em competências e metas definidas. É o momento de olhar para dentro com honestidade e reconhecer conquistas e pontos de evolução.",
    tips: [
      "Reserve 30 minutos sem interrupções",
      "Revise suas metas do ciclo anterior",
      "Traga exemplos concretos de entregas",
    ],
  },
  {
    icon: MessagesSquare,
    label: "FEEDBACK 360°",
    title: "Feedback 360°",
    subtitle: "Múltiplas perspectivas",
    description:
      "Receba perspectivas de colegas, líderes e liderados para uma visão completa do seu desempenho. Diversidade de pontos de vista fortalece o autoconhecimento.",
    tips: [
      "Seja honesto e construtivo",
      "Foque em comportamentos observáveis",
      "Reconheça pontos fortes também",
    ],
  },
  {
    icon: Compass,
    label: "REUNIÃO DE ALINHAMENTO",
    title: "Reunião de Alinhamento",
    subtitle: "Diálogo com gestor",
    description:
      "Momento de conversa franca com seu gestor para alinhar percepções, discutir resultados e construir um caminho de evolução juntos.",
    tips: [
      "Prepare perguntas sobre seu desenvolvimento",
      "Esteja aberto ao diálogo",
      "Anote os principais combinados",
    ],
  },
  {
    icon: PenTool,
    label: "PLANO DE DESENVOLVIMENTO",
    title: "Plano de Desenvolvimento",
    subtitle: "Próximos passos",
    description:
      "Construa um plano de desenvolvimento baseado em dados, não em suposições. Defina metas claras e acompanhe seu progresso ao longo do próximo ciclo.",
    tips: [
      "Defina metas SMART",
      "Alinhe com objetivos da empresa",
      "Revise mensalmente seu progresso",
    ],
  },
];

function LoginContent() {
  const { user, login, loginWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [showLogin, setShowLogin] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const filteredUsers = userSearch.length >= 2
    ? searchUsers(userSearch).slice(0, 10)
    : [];

  function handleLogin(userId: string) {
    login(userId);
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1A45] via-[#111E4A] to-[#0A1538] text-white overflow-hidden">
        {/* Entrar button */}
        <button
          onClick={() => setShowLogin(true)}
          className="absolute top-6 right-8 flex items-center gap-2 px-5 py-2.5 border border-white/30 rounded-full text-sm font-medium text-white hover:bg-white/10 transition z-10"
        >
          <LogIn className="w-4 h-4" />
          Entrar
        </button>

        <div className="text-center px-4 max-w-4xl mx-auto">
          <p className="text-sm tracking-[0.25em] uppercase text-white/70 mb-6">
            Seazone · Pessoas & Cultura
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Avaliação de{" "}
            <span className="text-[#F9605A]">Desempenho</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            A AVD é a ferramenta que conecta o seu crescimento profissional aos
            objetivos da Seazone. Entenda o processo, prepare-se e transforme
            feedback em evolução.
          </p>
          <a
            href="#etapas"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F9605A]/20 text-[#F9605A] border border-[#F9605A]/30 rounded-full text-sm font-medium hover:bg-[#F9605A]/30 transition"
          >
            Conheça as etapas
            <ArrowDown className="w-4 h-4" />
          </a>
        </div>

        {/* Auto-open login modal on error */}
        {error === "unauthorized" && !showLogin && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-red-500/90 backdrop-blur rounded-xl px-5 py-3 flex items-center gap-3 text-white hover:bg-red-500 transition"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Email não autorizado — clique para tentar novamente</span>
            </button>
          </div>
        )}
      </section>

      {/* Por que a AVD importa */}
      <section className="py-24 px-4 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-[#F9605A] font-semibold mb-4">
            Por que a AVD importa
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Mais do que uma avaliação.
            <br />
            Um mapa para o seu crescimento.
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-16">
            A Avaliação de Desempenho não é um julgamento. É um diálogo
            estruturado que revela onde você está, para onde pode ir e como
            chegar lá.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Target className="w-6 h-6 text-[#0D1A45]" />}
              title="Clareza de Objetivos"
              description="Alinhe suas metas pessoais com a direção estratégica da empresa."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6 text-[#0D1A45]" />}
              title="Feedback Contínuo"
              description="Receba perspectivas de colegas, líderes e liderados para uma visão completa."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-[#0D1A45]" />}
              title="Crescimento Real"
              description="Construa um plano de desenvolvimento baseado em dados, não em suposições."
            />
          </div>
        </div>
      </section>

      {/* As Etapas da AVD */}
      <section id="etapas" className="py-24 px-4 bg-gradient-to-br from-[#0D1A45] via-[#111E4A] to-[#0A1538] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-[#F9605A] font-semibold mb-4">
              O Processo
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              As Etapas da AVD
            </h2>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-0 mb-16 max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center flex-1">
                <button
                  onClick={() => setActiveStep(i)}
                  className="flex flex-col items-center gap-3 w-full group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      activeStep === i
                        ? "bg-[#F9605A] text-[#0D1A45]"
                        : "bg-white/10 text-white/50 group-hover:bg-white/20"
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] md:text-xs tracking-wide uppercase font-medium text-center transition ${
                      activeStep === i ? "text-white" : "text-white/40"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className="h-px bg-white/20 flex-1 mx-2 mt-[-20px]" />
                )}
              </div>
            ))}
          </div>

          {/* Active step detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-6xl font-bold text-[#F9605A]/20">
                {String(activeStep + 1).padStart(2, "0")}
              </span>
              <h3 className="text-2xl font-bold mt-2">
                {steps[activeStep].title}
              </h3>
              <p className="text-[#F9605A] font-medium text-sm mt-1 mb-4">
                {steps[activeStep].subtitle}
              </p>
              <p className="text-white/70 leading-relaxed">
                {steps[activeStep].description}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h4 className="text-sm font-bold tracking-wide uppercase mb-6">
                Dicas Práticas
              </h4>
              <ul className="space-y-4">
                {steps[activeStep].tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#F9605A] mt-2 shrink-0" />
                    <span className="text-white/80">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Princípios */}
      <section className="py-24 px-4 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-[#F9605A] font-semibold mb-4">
            Princípios
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">
            No que acreditamos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrincipleCard
              icon={<ShieldCheck className="w-6 h-6 text-[#F9605A]" />}
              title="Transparência"
              description="Critérios claros e objetivos que todos conhecem antes do processo começar."
            />
            <PrincipleCard
              icon={<CalendarSync className="w-6 h-6 text-[#F9605A]" />}
              title="Regularidade"
              description="Ciclos semestrais para que o feedback nunca fique desatualizado."
            />
            <PrincipleCard
              icon={<BarChart3 className="w-6 h-6 text-[#F9605A]" />}
              title="Dados Concretos"
              description="Decisões de promoção e desenvolvimento baseadas em evidências, não impressões."
            />
            <PrincipleCard
              icon={<Heart className="w-6 h-6 text-[#F9605A]" />}
              title="Cultura de Cuidado"
              description="O processo foi desenhado para apoiar, não para punir. Seu crescimento é o objetivo."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-[#F9605A] font-semibold mb-4">
            Dúvidas Frequentes
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Perguntas & Respostas
          </h2>

          <div className="space-y-3 text-left">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
                >
                  <span className="text-gray-800 font-medium">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ml-4 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#0D1A45] via-[#111E4A] to-[#0A1538] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para o próximo ciclo?
          </h2>
          <p className="text-white/60 mb-10">
            A AVD é uma oportunidade, não uma obrigação. Prepare-se, participe
            com autenticidade e use o processo a seu favor.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F9605A] text-[#0D1A45] rounded-full text-sm font-bold hover:bg-[#F9605A]/90 transition"
          >
            Entrar na plataforma
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#0D1A45] text-white/40 text-center text-sm border-t border-white/10">
        © 2026 Seazone · Pessoas & Cultura · Avaliação de Desempenho
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Entrar na plataforma
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Escolha como deseja acessar
                </p>
              </div>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Google OAuth */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Conta corporativa
                </p>
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-[#F9605A]/30 hover:bg-[#F9605A]/5 transition font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Entrar com Google
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Use seu email @seazone.com.br
                </p>
              </div>

              {/* Error message */}
              {error === "unauthorized" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Acesso não autorizado
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Seu email não está cadastrado na plataforma. Entre em contato com o RH.
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou acesse como teste</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* User search */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Buscar colaborador
                </p>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Digite o nome (mín. 2 letras)..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F9605A]/50 focus:ring-2 focus:ring-[#F9605A]/10"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  {users.length} colaboradores cadastrados
                </p>
              </div>

              {/* User list */}
              {filteredUsers.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Entrar como
                  </p>
                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleLogin(u.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-[#F9605A]/30 hover:bg-[#F9605A]/5 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#0D1A45]/10 rounded-full flex items-center justify-center text-[#0D1A45] font-bold text-xs overflow-hidden">
                            {u.photoUrl ? (
                              <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">
                              {u.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Building2 className="w-3 h-3" />
                              {u.sector}
                              <span className="text-gray-300">·</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${roleColors[u.role]}`}>
                                {roleLabels[u.role]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <LogIn className="w-4 h-4 text-gray-300 group-hover:text-[#F9605A] transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-left">
      <div className="w-12 h-12 bg-[#F9605A]/10 rounded-xl flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PrincipleCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 text-left">
      <div className="w-12 h-12 bg-[#0D1A45] rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
