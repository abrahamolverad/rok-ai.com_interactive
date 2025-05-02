// src/app/dashboard/page.tsx (Conceptual Example using App Router & SWR)
'use client'; // Mark as Client Component

import React, { useState } from 'react';
import useSWR from 'swr';
import Plot from 'react-plotly.js'; // If using Plotly

// Define interfaces for the data structure expected from the API
interface Position {
    Symbol: string;
    // ... other position fields
    'Unrealized P&L': number;
}
interface PnlEntry {
    Symbol: string;
    // ... other PNL fields
    'P&L': number;
    'Exit Time': string; // ISO String
}
interface DashboardData {
    openPositions: { data: Position[], total_upl: number, total_mv: number };
    pnlHistory: PnlEntry[];
    metrics: { total_pnl: number, win_rate: number /* ... etc */ };
    fetchErrors: string[];
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
});

export default function DashboardPage() {
    // Fetch data from your API route
    const { data, error, isLoading } = useSWR<DashboardData>('/api/alpaca/dashboard', fetcher);

    // UI State (e.g., for filters - simplified here)
    const [symbolFilter, setSymbolFilter] = useState('All');
    // Add date range state etc.

    if (error) return <div className="text-red-500">Failed to load dashboard data: {error.message}</div>;
    if (isLoading) return <div className="p-6">Loading dashboard data...</div>;
    if (!data) return <div className="p-6">No data available.</div>;

    // --- Filtering Logic (apply filters to data.pnlHistory) ---
    const filteredPnlHistory = data.pnlHistory.filter(trade =>
        symbolFilter === 'All' || trade.Symbol === symbolFilter
        // Add date filtering here...
    );
    // Recalculate metrics and cumulative P&L based on filteredPnlHistory...

    // --- Prepare Chart Data ---
    const cumulativePnlChartData = [{
        x: filteredPnlHistory.map(t => t['Exit Time']),
        y: filteredPnlHistory.map(t => t['P&L']).reduce((acc, pnl, i) => { // Simple cumulative calc
             acc.push((acc[i-1] || 0) + pnl); return acc;
        }, [] as number[]),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Cumulative P&L'
    }];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">RokAi Dashboard</h1>

            {/* Display Fetch Errors */}
            {data.fetchErrors && data.fetchErrors.length > 0 && (
                <div className="bg-yellow-800 text-yellow-100 p-3 rounded mb-4">
                    <h3 className="font-bold">Data Fetch Warnings:</h3>
                    <ul>{data.fetchErrors.map((err, i) => <li key={i}>- {err}</li>)}</ul>
                </div>
            )}

            {/* Open Positions Section */}
            <section className="bg-gray-800 p-4 rounded mb-6">
                <h2 className="text-xl font-semibold mb-2">Open Positions</h2>
                {/* Display metrics and table using data.openPositions */}
                <p>Total UPL: ${data.openPositions.total_upl?.toFixed(2)}</p>
                {/* ... table rendering ... */}
            </section>

            {/* Closed Trades Section */}
            <section className="bg-gray-800 p-4 rounded">
                <h2 className="text-xl font-semibold mb-2">Closed Trades Performance</h2>
                {/* Add Filters UI */}
                {/* Display Metrics */}
                <p>Total Realized P&L: ${data.metrics.total_pnl?.toFixed(2)}</p>
                {/* Display Charts */}
                <Plot
                    data={cumulativePnlChartData as any} // Cast needed depending on Plotly types
                    layout={{ title: 'Cumulative P&L', paper_bgcolor: '#1f2937', plot_bgcolor: '#1f2937', font: { color: '#e5e7eb'} }}
                    useResizeHandler={true}
                    className="w-full h-64" // Example sizing
                />
                {/* Display Top Winners/Losers Tables */}
                {/* Display Full Log Table */}
            </section>
        </div>
    );
}
