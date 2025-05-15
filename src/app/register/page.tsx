'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-rokPurple mb-6 text-center">Register for ROK AI</h1>
        <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-rokGrayText mb-1">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-rokGrayText mb-1">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-rokGrayText mb-1">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Create a password"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-rokPurple text-white py-2 px-4 rounded hover:bg-purple-700 transition"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-rokGrayText">
              Already have an account? <a href="/login" className="text-rokPurple hover:underline">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
