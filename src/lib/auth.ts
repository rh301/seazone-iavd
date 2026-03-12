import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { users } from "@/data/users";

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
      const found = users.find(
        (u) => u.email.toLowerCase() === user.email!.toLowerCase()
      );
      if (!found) {
        return "/login?error=unauthorized";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const found = users.find(
          (u) => u.email.toLowerCase() === user.email!.toLowerCase()
        );
        if (found) {
          token.userId = found.id;
          token.role = found.role;
          token.department = found.department;
          token.userName = found.name;
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
        user.userName = token.userName;
      }
      return session;
    },
  },
});
