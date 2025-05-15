// src/lib/authOptions.ts
//
// Centralised NextAuth configuration.
// Export **named** `authOptions` so it can be re‑used anywhere
// (e.g. API route handler, middleware, getServerSession, etc.)
//
// Add or remove providers as needed.  Replace dummy logic in the
// Credentials provider with your real user store.
//
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  /**
   * ─── AUTH PROVIDERS ──────────────────────────────────────────────────
   */
  providers: [
    // ▸ Google OAuth2
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ▸ Email / password (Credentials) – replace with your user lookup
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 🚩 Replace demo logic with DB/API call
        if (!credentials?.email || !credentials?.password) return null;

        // Example hard‑coded user for quick testing
        if (
          credentials.email === process.env.DEMO_USER_EMAIL &&
          credentials.password === process.env.DEMO_USER_PASSWORD
        ) {
          return { id: "1", email: credentials.email } as any;
        }
        return null;
      },
    }),
  ],

  /**
   * ─── SESSION SETTINGS ────────────────────────────────────────────────
   */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * ─── PAGES OVERRIDES ────────────────────────────────────────────────
   */
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },

  /**
   * ─── CALLBACKS ───────────────────────────────────────────────────────
   */
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },

  /**
   * ─── DEBUG ──────────────────────────────────────────────────────────
   */
  debug: process.env.NODE_ENV === "development",
};

// No default export – Route Handlers should `import { authOptions } from "@/lib/authOptions"`
