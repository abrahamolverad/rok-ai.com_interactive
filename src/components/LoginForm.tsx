// src/components/LoginForm.tsx
'use client'; // Client component for state and event handling

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react'; // Import next-auth signin function
import { useRouter, useSearchParams } from 'next/navigation'; // Use App Router hooks

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook to read query parameters

    // Check for registration success message on component mount
    useEffect(() => {
        if (searchParams?.get('registered') === 'true') {
            setSuccessMessage('Registration successful! Please log in.');
            // Optional: remove the query param from URL without reload
            // router.replace('/login', { scroll: false }); // Use replace to avoid history entry
        }
    }, [searchParams, router]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null); // Clear success message on new attempt

        try {
            // Use next-auth signIn function
            const result = await signIn('credentials', {
                redirect: false, // Prevent next-auth from automatically redirecting
                email: email,
                password: password,
            });

            if (result?.error) {
                // Handle errors returned from the authorize function or next-auth itself
                console.error("Login Error:", result.error);
                setError(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : result.error);
            } else if (result?.ok) {
                // Login successful, redirect to the dashboard
                console.log('Login successful, redirecting...');
                // Use router.push for client-side navigation
                // Optionally redirect to where the user came from if using callbackUrl
                router.push('/dashboard'); // Or use result.url if provided and valid
            } else {
                // Handle other unexpected cases
                setError('Login failed. Please try again.');
            }
        } catch (err: any) {
            // Catch unexpected errors during the signIn process
            console.error("Unexpected Login Error:", err);
            setError(err.message || 'An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-teal-400 mb-8">Login to RokAi</h2>
            <form onSubmit={handleSubmit}>
                {/* Display Login Error Messages */}
                {error && (
                    <div className="p-3 mb-4 text-sm rounded-lg bg-red-800 text-red-100" role="alert">
                        {error}
                    </div>
                )}
                {/* Display Registration Success Message */}
                {successMessage && (
                     <div className="p-3 mb-4 text-sm rounded-lg bg-green-800 text-green-100" role="alert">
                        {successMessage}
                    </div>
                )}
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
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-gray-100 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="******************"
                    />
                     {/* TODO: Add "Forgot Password?" link later */}
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-150 ease-in-out"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </div>
                 <p className="text-center text-sm text-gray-400 mt-6">
                    Don't have an account?{' '}
                    <a href="/register" className="font-medium text-teal-400 hover:text-teal-300">
                        Register here
                    </a>
                </p>
            </form>
        </div>
    );
}
