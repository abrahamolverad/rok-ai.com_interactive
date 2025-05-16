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
        // Ensure credentials are provided
        if (!credentials?.email || !credentials.password) {
          console.log("Authorize: Missing email or password");
          throw new Error("Please enter an email and password.");
        }

        console.log("Authorize: Attempting DB connection...");
        await dbConnect(); // Ensure database connection is established
        console.log("Authorize: DB connected. Finding user by email:", credentials.email.toLowerCase());

        try {
          // Find the user by email in the database
          const user = await User.findOne({ email: credentials.email.toLowerCase() }).exec();

          if (!user) {
            console.log("Authorize: No user found with email:", credentials.email.toLowerCase());
            throw new Error("No user found with this email.");
          }
          
          // Ensure the user document has a password field
          if (!user.password) {
            console.error("Authorize: User found but has no password field:", user.email);
            throw new Error("Authentication setup error for this user."); // Avoid exposing details
          }
          
          // Compare the provided password with the stored hashed password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log("Authorize: Invalid password for user:", user.email);
            throw new Error("Incorrect password.");
          }

          console.log("Authorize: User authenticated successfully:", user.email);
          // Return an object that NextAuth will use to create the session/token.
          // It MUST include 'id'. You can also include other user properties.
          return {
            id: user._id.toString(), // Mongoose _id needs to be converted to string
            email: user.email,
            name: user.name || null, // Ensure name is string or null
            // Add any other properties you want in the JWT/session user object
          };

        } catch (error: any) {
          console.error("Authorize error during DB operations:", error.message);
          // Rethrow a generic error or the specific error message to be handled by NextAuth
          throw new Error(error.message || "Authentication failed due to a server error.");
        }
      }
    }),
  ],

  session: {
    strategy: "jwt", // Using JSON Web Tokens for session management
    maxAge: 30 * 24 * 60 * 60, // Session expiry: 30 days
  },
  pages: {
    signIn: "/login", // Your custom login page path
    error: "/login", // Redirect to login page on error (e.g., /login?error=CredentialsSignin)
  },
  callbacks: {
    async jwt({ token, user }) {
      // The 'user' object is available on initial sign-in (from the authorize callback).
      // Persist the user ID (and any other custom properties) to the JWT token.
      if (user) {
        token.id = user.id; // user.id is the string version of MongoDB _id
      }
      return token;
    },
    async session({ session, token }) {
      // The 'token' object is what was returned from the jwt callback.
      // Add properties from the token to the client-side session object.
      if (token.id && session.user) {
        (session.user as { id: string; name?: string | null; email?: string | null; image?: string | null }).id = token.id as string;
      }
      return session;
    },
  },
  // Secret for signing JWTs, etc. Should be set in your .env and Render environment variables
  secret: process.env.NEXTAUTH_SECRET, 
  // Enable debug messages in the console if you are having problems, especially in development
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
