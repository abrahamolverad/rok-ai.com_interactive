// src/components/RegisterForm.tsx
'use client'; // Needs to be a client component for state and handlers

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router's router

export default function RegisterForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter(); // Initialize router

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Use error message from API response if available
                throw new Error(result.error || `Registration failed: ${response.statusText}`);
            }

            // Registration successful! Redirect to login page.
            console.log('Registration successful:', result.message);
            router.push('/login?registered=true'); // Redirect to login with a success indicator

        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-teal-400 mb-8">Register for RokAi</h2>
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 mb-4 text-sm rounded-lg bg-red-800 text-red-100" role="alert">
                        {error}
                    </div>
                )}
                <div className="mb-4">
                    <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Choose a username (min 3 chars)"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="your@email.com"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-gray-100 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Create a password (min 8 chars)"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-150 ease-in-out"
                    >
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </div>
                 <p className="text-center text-sm text-gray-400 mt-6">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-teal-400 hover:text-teal-300">
                        Login here
                    </a>
                </p>
            </form>
        </div>
    );
}
