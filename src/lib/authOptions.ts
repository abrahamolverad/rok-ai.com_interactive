// src/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// Ensure this path is correct for your MongoDB connection utility
import { mongoConnect } from '@/lib/mongoConnect'; // Or connectDb from '@/lib/mongoose' if that's preferred
import { User } from '@/models/User'; // Your Mongoose User model
import bcrypt from 'bcryptjs';

// Helper function to conditionally add GoogleProvider
function getGoogleProvider(): any[] { // Using any[] to simplify type for conditional provider
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
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          // It's better to throw specific error messages that NextAuth can pick up
          // or return null and let NextAuth handle it based on pages.error
          console.error('Authorize: Missing email or password');
          throw new Error('Please enter both email and password.');
        }

        // Use the imported mongoConnect (or connectDb)
        await mongoConnect(); 
        
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).exec();
        
        if (!user) {
          console.error('Authorize: No user found with email:', credentials.email.toLowerCase());
          throw new Error('No user found with this email.');
        }
        
        if (!user.password) {
          // This case implies a user record exists (e.g. from OAuth) but has no password set for credentials login
          console.error('Authorize: User has no password set for credentials login:', user.email);
          throw new Error('This account may not be set up for password login. Try another method or reset password if available.');
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.error('Authorize: Incorrect password for user:', user.email);
          throw new Error('Incorrect password.');
        }
        
        // Return the user object expected by NextAuth.js
        // Ensure this matches the 'User' interface in your next-auth.d.ts for type safety in callbacks
        return { 
          id: String(user._id), 
          email: user.email, 
          name: user.name || null 
          // Do not return the password hash or other sensitive fields
        };
      }
    })
  ],
  session: { 
    strategy: 'jwt', 
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: { 
    signIn: '/login', // Redirect users to /login if they need to sign in
    error: '/login'   // Redirect users to /login on error (e.g., failed credential sign in)
                      // NextAuth.js appends ?error=... to the URL
  },
  callbacks: {
    async jwt({ token, user }) {
      // The 'user' object is available on initial sign-in
      if (user) {
        token.id = user.id; // Add custom 'id' property from your DB user to the JWT
        // You can add other properties like role here if needed: token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // The 'token' object is the JWT. Add properties from it to the session.user object
      // to make them available on the client via useSession() or getServerSession()
      if (token.id && session.user) {
        (session.user as { id: string }).id = token.id as string;
        // If you added other properties to the token (e.g., role), add them to session.user here too
        // (session.user as any).role = token.role; // Example
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET, // Essential for JWT signing
  debug: process.env.NODE_ENV === 'development' // Enable debug logs in development
};

// Note: If you want Google sign-ins to also create/update users in your MongoDB,
// you would typically add a `signIn` callback here or use a NextAuth.js Adapter.
// For now, this setup primarily focuses on Credentials-based auth with your DB.

export default authOptions;