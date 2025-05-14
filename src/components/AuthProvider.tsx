// src/components/AuthProvider.tsx
'use client'; // This component needs to be a Client Component

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Define props if needed, SessionProvider takes session optionally but usually handles it
interface AuthProviderProps {
  children: React.ReactNode;
  // session?: any; // Optional: You can pass the session from server components if needed
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // The SessionProvider component makes the session available via the useSession hook
  return <SessionProvider>{children}</SessionProvider>;
}

