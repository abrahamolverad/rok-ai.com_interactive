// src/components/AlpacaSettingsForm.tsx
'use client'; // Mark as Client Component because it uses state and event handlers

import React, { useState } from 'react';

// Interface for the data sent to the API
interface AlpacaSettingsPayload {
    apiKeyId: string;
    secretKey: string;
    isPaper: boolean;
}

// Props could include initial values if user has already saved keys
interface AlpacaSettingsFormProps {
    // Example: Pass current setting if available
    // currentIsPaper?: boolean;
}

export default function AlpacaSettingsForm({ /* currentIsPaper = true */ }: AlpacaSettingsFormProps) {
    const [apiKeyId, setApiKeyId] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [isPaper, setIsPaper] = useState(true); // Default to paper trading
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const payload: AlpacaSettingsPayload = { apiKeyId, secretKey, isPaper };

        try {
            // Send data to your backend API route
            const response = await fetch('/api/user/settings/alpaca', { // Adjust API route if needed
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            setMessage({ type: 'success', text: 'Alpaca settings saved successfully!' });
            // Optionally clear the form or redirect
            // setApiKeyId(''); // Consider if you want to clear keys after save
            // setSecretKey('');

        } catch (error: any) {
            console.error("Error saving Alpaca settings:", error);
            setMessage({ type: 'error', text: `Failed to save settings: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-teal-300">Alpaca API Key Settings</h3>
            <form onSubmit={handleSubmit}>
                {/* Display Success/Error Messages */}
                {message && (
                    <div className={`p-3 mb-4 text-sm rounded-lg ${
                        message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                    }`} role="alert">
                        {message.text}
                    </div>
                )}

                {/* API Key ID Input */}
                <div className="mb-4">
                    <label htmlFor="apiKeyId" className="block text-gray-300 text-sm font-bold mb-2">
                        Alpaca API Key ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text" // Use text initially, consider password type if preferred
                        id="apiKeyId"
                        value={apiKeyId}
                        onChange={(e) => setApiKeyId(e.target.value)}
                        required
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="e.g., PK..."
                    />
                </div>

                {/* Secret Key Input */}
                <div className="mb-4">
                    <label htmlFor="secretKey" className="block text-gray-300 text-sm font-bold mb-2">
                        Alpaca Secret Key <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password" // Use password type to obscure input
                        id="secretKey"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        required
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="****************************************"
                    />
                </div>

                {/* Paper/Live Toggle */}
                <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                        Account Type
                    </label>
                    <div className="flex items-center space-x-4 bg-gray-700 p-2 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setIsPaper(true)}
                            className={`flex-1 py-2 px-4 rounded transition duration-150 ease-in-out ${
                                isPaper ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                        >
                            Paper Trading
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPaper(false)}
                            className={`flex-1 py-2 px-4 rounded transition duration-150 ease-in-out ${
                                !isPaper ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                        >
                            Live Trading
                        </button>
                    </div>
                     <p className="text-xs text-gray-400 mt-2">
                        Select whether these API keys are for your Paper or Live Alpaca account.
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-center">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                    >
                        {isLoading ? 'Saving...' : 'Save Alpaca Keys'}
                    </button>
                </div>
            </form>
        </div>
    );
}
