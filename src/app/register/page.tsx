// src/app/register/page.tsx
import React from 'react';
import RegisterForm from '@/components/RegisterForm'; // Adjust import path if needed

// Optional: Add Metadata for the page
export const metadata = {
  title: 'Register - RokAi Trading',
  description: 'Create your RokAi Trading account.',
};

export default function RegisterPage() {
  return (
    // Using Tailwind classes for centering and background
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {/* Render the form component */}
      <RegisterForm />
    </div>
  );
}
