// Example path: src/app/api/auth/[...nextauth]/route.ts
// Or for Pages Router: pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// Import other providers as needed, e.g., GoogleProvider, GitHubProvider
// import GoogleProvider from "next-auth/providers/google";

// Define your authentication options
export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        // This is just a placeholder. Replace with your actual user validation logic.
        // For example, query your database for a user with the provided email.
        // const user = await db.user.findUnique({ where: { email: credentials.email } });

        // Placeholder user object - replace with your actual user data structure
        const user = { id: "1", name: "J Smith", email: "jsmith@example.com" }; // Example

        if (user && credentials?.password === "password") { // Replace "password" with actual password check
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    }),
    // Example: Google Provider (uncomment and configure if needed)
    /*
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    */
    // Add more providers here
  ],
  // Configure session strategy (jwt is default)
  session: {
    strategy: "jwt",
  },
  // Add callbacks here if you need to customize JWT, session, etc.
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id and other custom properties to the token right after signin
      if (user) {
        token.id = user.id;
        // token.customProperty = user.customProperty; // Example
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from the token.
      if (session.user) {
        // @ts-ignore // NextAuth types might need adjustment for custom properties
        session.user.id = token.id as string;
        // session.user.customProperty = token.customProperty; // Example
      }
      return session;
    },
  },
  // Specify pages for custom sign-in, sign-out, error pages (optional)
  pages: {
    signIn: '/login', // Or your custom sign-in page
    // error: '/auth/error', // Error code passed in query string as ?error=
    // signOut: '/auth/signout',
  },
  // Secret for signing JWTs, etc. Should be set in your .env file
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug messages in the console if you are having problems
  debug: process.env.NODE_ENV === 'development',
};

// The NextAuth handler needs to be exported for both GET and POST
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
