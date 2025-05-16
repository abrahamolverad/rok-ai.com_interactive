import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from '@/lib/mongoConnect';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

function getGoogleProvider() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (id && secret) {
    return [GoogleProvider({ clientId: id, clientSecret: secret })];
  }
  return [];
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...getGoogleProvider(),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Please enter an email and password.");
        }
        await dbConnect();
        try {
          const user = await User.findOne({ email: credentials.email.toLowerCase() }).exec();
          if (!user) {
            throw new Error("No user found with this email.");
          }
          if (!user.password) {
            throw new Error("Authentication setup error for this user.");
          }
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            throw new Error("Incorrect password.");
          }
          return { id: user._id.toString(), email: user.email, name: user.name || null };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed due to a server error.");
        }
      }
    })
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
};

export default authOptions;
