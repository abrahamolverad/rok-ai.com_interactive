// src/lib/authOptions.ts
//
// Centralised NextAuth configuration.
// NOTE: Google provider is loaded **only if** both env vars exist so
// the app won’t crash on free Render plans when they’re missing.
// You can safely deploy without GOOGLE_CLIENT_ID / SECRET and still
// use the demo Credentials login.
//
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Helper ──────────────────────────────────────────────────────────────
function maybeGoogle() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return []; // skip → prevents runtime crash
  return [
    GoogleProvider({ clientId: id, clientSecret: secret }),
  ];
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...maybeGoogle(),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
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

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) (session.user as any).id = token.id as string;
      return session;
    },
  },
  debug: process.env.NODE_ENV !== "production", // prints helpful logs locally
};

// No default export
