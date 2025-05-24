// src/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; 
import { mongoConnect } from '@/lib/mongoConnect'; 
import { User } from '@/models/User';      
import bcrypt from 'bcryptjs';

// Helper function to conditionally add GoogleProvider
function getGoogleProvider(): any[] { 
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  // Only return GoogleProvider if both ID and Secret are set
  if (id && secret) {
    console.log("Google OAuth configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.");
    return [GoogleProvider({ clientId: id, clientSecret: secret })];
  }
  console.log("Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.");
  return []; // Return an empty array if not configured
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...getGoogleProvider(), // Spread the result here
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error('Authorize: Missing email or password');
          throw new Error('Please enter both email and password.');
        }

        await mongoConnect(); 
        
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).exec();
        
        if (!user) {
          console.error('Authorize: No user found with email:', credentials.email.toLowerCase());
          throw new Error('No user found with this email.');
        }
        
        if (!user.password) {
          console.error('Authorize: User has no password set for credentials login:', user.email);
          throw new Error('This account may not be set up for password login. Try another method or reset password if available.');
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.error('Authorize: Incorrect password for user:', user.email);
          throw new Error('Incorrect password.');
        }
        
        return { 
          id: String(user._id), 
          email: user.email, 
          name: user.name || null 
        };
      }
    })
  ],
  session: { 
    strategy: 'jwt', 
    maxAge: 30 * 24 * 60 * 60 
  },
  pages: { 
    signIn: '/login', 
    error: '/login'   
  },
  callbacks: {
    async jwt({ token, user, account, profile }) { // Added account and profile for OAuth user creation
      if (user) {
        token.id = user.id;
      }
      // If signing in with Google and user object has 'id' (from potential DB interaction)
      // Or if it's an OAuth sign in and we want to provision the user
      if (account?.provider === "google" && profile?.email) {
        try {
          await mongoConnect();
          let dbUser = await User.findOne({ email: profile.email });
          if (!dbUser) {
            console.log(`Google sign-in: New user, creating entry for ${profile.email}`);
            dbUser = new User({
              email: profile.email,
              name: profile.name,
              // googleId: profile.sub, // Store Google ID if needed
              // image: profile.picture, // Store image if needed
              // emailVerified: profile.email_verified ? new Date() : null, // Store verification status
              // Password will be undefined for OAuth users unless they set one later
            });
            await dbUser.save();
          }
          // Ensure the token.id is set to your internal DB user id
          token.id = String(dbUser._id);
          token.name = dbUser.name; // ensure name is in token
          token.email = dbUser.email; // ensure email is in token
          token.picture = (profile as any).picture || dbUser.get('image'); // ensure picture is in token

        } catch (error) {
          console.error("Error during Google sign-in user provisioning/linking in JWT callback:", error);
          // Decide if you want to prevent login if DB operation fails.
          // For now, we'll let it proceed if basic token can be formed.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id: string }).id = token.id as string;
         // Ensure name, email, image from token are passed to session
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET, 
  debug: process.env.NODE_ENV === 'development'
};

export default authOptions;