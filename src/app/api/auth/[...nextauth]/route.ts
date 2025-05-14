// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs'; // For password comparison
import { connectToDatabase } from '@/lib/db'; // Your DB connection helper
import User from '@/models/User'; // Your Mongoose User model
import { MongoDBAdapter } from "@auth/mongodb-adapter"; // Import adapter if using database sessions
import clientPromise from "@/lib/mongodb"; // Your MongoDB client promise helper

export const authOptions: AuthOptions = {
  // --- Session Strategy ---
  // Using JWT for sessions by default. Database strategy is also an option.
  session: {
    strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // Optional: 30 days session expiry
  },

  // --- Providers ---
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      credentials: {
        // Define the fields your login form will ask for
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        if (!credentials?.email || !credentials.password) {
          console.error("Auth Error: Missing email or password");
          throw new Error('Please provide email and password.');
        }

        try {
          await connectToDatabase(); // Ensure DB connection

          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user) {
            console.log(`Auth Attempt Failed: No user found with email ${credentials.email}`);
            throw new Error('No user found with this email.');
          }

          // Check if password matches
          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValidPassword) {
            console.log(`Auth Attempt Failed: Invalid password for email ${credentials.email}`);
            throw new Error('Incorrect password.');
          }

          console.log(`Auth Success: User ${credentials.email} logged in.`);
          // Any object returned will be saved in `user` property of the JWT
          // Return only essential, non-sensitive user info
          return {
            id: user._id.toString(), // Must include id
            email: user.email,
            username: user.username, // Include username if you have it
            // Add other non-sensitive fields needed in the session/token
          };

        } catch (error: any) {
          console.error("Authorize Error:", error);
          // Re-throw specific errors or a generic one
          // Don't expose sensitive details like "database connection failed" to the client
          throw new Error(error.message || 'Authentication failed.');
        }
      }
    })
    // Add other providers like Google, GitHub etc. here if needed
  ],

  // --- Adapter (Optional - for Database Sessions) ---
  // If you prefer database sessions over JWTs, configure the MongoDB adapter:
  // adapter: MongoDBAdapter(clientPromise), // clientPromise should export promise from your mongodb connection lib

  // --- Callbacks ---
  // Callbacks are used to control what happens actions are performed.
  callbacks: {
    // jwt callback is called whenever a JWT is created or updated.
    // The returned value will be encrypted in the JWT.
    async jwt({ token, user, account, profile }) {
      // Persist the user id and other relevant info from the authorize function to the token
      if (user) {
        token.id = user.id;
        token.username = user.username; // Add username to token if available
        // Add any other properties from the 'user' object returned by 'authorize'
      }
      return token;
    },
    // session callback is called whenever a session is checked.
    // The returned value will be made available to the client via useSession() or getSession().
    async session({ session, token, user }) {
      // Send properties to the client, like user's ID and username from the token.
      // Make sure the session.user type includes these fields.
      if (token && session.user) {
        session.user.id = token.id as string; // Add id from token to session
        session.user.username = token.username as string; // Add username
        // Add other properties you want accessible client-side
      }
      return session;
    }
  },

  // --- Custom Pages (Optional) ---
  // pages: {
  //   signIn: '/auth/login', // Use your custom login page URL
  //   // signOut: '/auth/signout',
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  //   // verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
  //   // newUser: null // If set, new users will be directed here on first sign in
  // },

  // --- Other Options ---
  secret: process.env.NEXTAUTH_SECRET, // Crucial for JWT signing/encryption - MUST be set in .env.local
  debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

// Export the handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
