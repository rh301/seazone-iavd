import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getAllUsers } from "@/lib/org-tree";

const ALLOWED_DOMAINS = ["seazone.com.br", "seazone.com"];

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

        // Try to match by name (Google profile name vs org data)
        const found = displayName
          ? allUsers.find(
              (u) => u.name.toLowerCase() === displayName.toLowerCase()
            )
          : null;

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
