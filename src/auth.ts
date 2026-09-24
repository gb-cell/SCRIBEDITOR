import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedEmail, isAuthDisabled } from "@/lib/auth-access";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          // Préférence Google Workspace JDG (filtre côté Google + allowlist app)
          hd: "jourdegalop.com",
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (isAuthDisabled()) return true;
      if (!isAllowedEmail(user.email)) {
        return "/login?error=Domain";
      }
      return true;
    },
  },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 h — journée de rédaction
  },
});
