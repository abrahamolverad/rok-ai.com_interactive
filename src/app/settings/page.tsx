// src/app/settings/page.tsx
import React from 'react';
import AlpacaSettingsForm from '@/components/AlpacaSettingsForm'; // Adjust import path if needed
import { getServerSession } from "next-auth/next"; // To potentially check session server-side
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Your auth options
import { redirect } from 'next/navigation'; // To redirect if not logged in

// Optional: Add Metadata for the page
export const metadata = {
  title: 'Settings - RokAi Trading',
  description: 'Manage your RokAi Trading account settings.',
};

// This page component runs on the server by default in App Router
export default async function SettingsPage() {
  // --- Server-side Authentication Check ---
  // Protect the page server-side
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    // Redirect to login page if not authenticated
    redirect('/login?callbackUrl=/settings'); // Redirect back to settings after login
  }
  // --- End Authentication Check ---

  // Fetch current user settings if needed to pass as props (e.g., current paper/live status)
  // const userSettings = await getUserSettings(session.user.id); // Example function

  return (
    // Using Tailwind classes for layout and background
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
       <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-teal-400 border-b border-gray-700 pb-2">Account Settings</h1>

            <div className="mb-10">
                {/* Render the Alpaca settings form component */}
                {/* Pass any fetched settings as props if needed */}
                <AlpacaSettingsForm /* currentIsPaper={userSettings?.alpacaPaperTrading} */ />
            </div>

            {/* --- Placeholder for 2FA Settings --- */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                 <h3 className="text-xl font-semibold mb-4 text-teal-300">Two-Factor Authentication (2FA)</h3>
                 <p className="text-gray-400">
                    (2FA setup component will go here)
                 </p>
                 {/* TODO: Add component for enabling/disabling 2FA and showing QR code */}
            </div>
            {/* --- End Placeholder --- */}

             {/* Add other settings sections as needed */}

       </div>
    </div>
  );
}
