import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; // Keep if you plan to use it
import dbConnect from '@/lib/mongoConnect'; // Import your MongoDB connection utility
import { User } from '@/models/User';   // Import your Mongoose User model (from user_model_ts_v2)
import bcrypt from 'bcryptjs';

// Helper to conditionally include GoogleProvider
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
    ...getGoogleProvider(), // Conditionally add Google provider
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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          console.log("Authorize: Missing email or password");
          throw new Error("Please enter an email and password.");
        }

        console.log("Authorize: Attempting DB connection...");
        await dbConnect();
        console.log("Authorize: DB connected. Finding user by email:", credentials.email.toLowerCase());

        try {
          const user = await User.findOne({ email: credentials.email.toLowerCase() }).exec();

          if (!user) {
            console.log("Authorize: No user found with email:", credentials.email.toLowerCase());
            throw new Error("No user found with this email.");
          }

          if (!user.password) {
            console.error("Authorize: User found but has no password field:", user.email);
            throw new Error("Authentication setup error for this user.");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log("Authorize: Invalid password for user:", user.email);
            throw new Error("Incorrect password.");
          }

          console.log("Authorize: User authenticated successfully:", user.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || null,
          };

        } catch (error: any) {
          console.error("Authorize error during DB operations:", error.message);
          throw new Error(error.message || "Authentication failed due to a server error.");
        }
      }
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id: string; name?: string | null; email?: string | null; image?: string | null }).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, 
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
