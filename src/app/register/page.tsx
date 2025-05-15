// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage('Registered! Redirecting to login...');
      router.push('/login');
    } else {
      setMessage(data.error || 'Registration failed');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-rokPurple mb-6 text-center">Create Account</h1>
        <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-rokGrayText mb-1">Email</label>
              <input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-rokGrayText mb-1">Password</label>
              <input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Create a password"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-rokPurple text-white py-2 px-4 rounded hover:bg-purple-700 transition"
            >
              Register
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-rokGrayText">
              Already have an account? <a href="/login" className="text-rokPurple hover:underline">Login</a>
            </p>
            {message && <p className="mt-2 text-sm text-red-400">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
