// src/app/login/page.tsx
import React from 'react';
import LoginForm from '@/components/LoginForm'; // Adjust import path if needed
import { Suspense } from 'react'; // Import Suspense

// Optional: Add Metadata for the page
export const metadata = {
  title: 'Login - RokAi Trading',
  description: 'Login to your RokAi Trading account.',
};

// Wrap the component that uses useSearchParams in Suspense
function LoginPageContent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <LoginForm />
    </div>
  );
}


export default function LoginPage() {
  return (
    // Suspense is required because LoginForm uses useSearchParams
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
