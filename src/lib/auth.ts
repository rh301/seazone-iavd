import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getAllUsers } from "@/lib/org-tree";

const ALLOWED_DOMAINS = ["seazone.com.br", "seazone.com"];

// Normalize string for comparison (remove accents, lowercase)
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Try to find user by multiple strategies
function findOrgUser(allUsers: ReturnType<typeof getAllUsers>, email: string, displayName: string) {
  const emailLower = email.toLowerCase();

  // 1. Direct email match (most reliable)
  const emailMatch = allUsers.find((u) => (u as any).email === emailLower);
  if (emailMatch) return emailMatch;

  // 2. Exact name match (normalized)
  if (displayName) {
    const normalizedName = normalize(displayName);
    const exactMatch = allUsers.find((u) => normalize(u.name) === normalizedName);
    if (exactMatch) return exactMatch;
  }

  // 3. Email parts match: all parts of email prefix must exist in user name
  const emailPrefix = email.split("@")[0];
  const emailParts = emailPrefix.split(/[._]/).map(normalize).filter(p => p.length > 1);
  if (emailParts.length >= 2) {
    const partsMatch = allUsers.find((u) => {
      const nameParts = normalize(u.name).split(/\s+/);
      return emailParts.every(ep => nameParts.some(np => np === ep));
    });
    if (partsMatch) return partsMatch;
  }

  return null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const domain = user.email.split("@")[1]?.toLowerCase();
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return "/login?error=unauthorized";
      }
      return true;
    },
    async jwt({ token, user, profile }) {
      if (user?.email) {
        const allUsers = getAllUsers();
        const displayName = profile?.name || user.name || "";

        const found = findOrgUser(allUsers, user.email, displayName);

        if (found) {
          token.userId = found.id;
          token.role = found.role;
          token.department = found.department;
          token.sector = found.sector;
          token.userName = found.name;
        } else {
          // Usuário OAuth do domínio autorizado mas não encontrado no organograma
          token.userId = `oauth_${user.email!.split("@")[0]}`;
          token.role = "colaborador";
          token.department = "Geral";
          token.sector = "Geral";
          token.userName = displayName || user.email!.split("@")[0];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.userId = token.userId;
        user.role = token.role;
        user.department = token.department;
        user.sector = token.sector;
        user.userName = token.userName;
      }
      return session;
    },
  },
});
