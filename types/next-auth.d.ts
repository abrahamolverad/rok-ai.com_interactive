// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt"; // Correct import for JWT and DefaultJWT

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string;
      // Add any other custom properties you expect on session.user here
      // For example:
      // role?: string;
    } & DefaultSession["user"]; // This merges your custom properties with the default ones
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   * Also, the 'user' object passed to the 'jwt' callback on initial sign-in.
   */
  interface User extends DefaultUser {
    // Add any other custom properties from your User model that you return from the 'authorize' callback
    // For example:
    // role?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** User ID */
    id?: string; 
    // Add any other custom properties you add to the token in the jwt callback
    // For example:
    // role?: string;
  }
}
