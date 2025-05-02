// src/app/dashboard/page.tsx
'use client'; // Mark this as a Client Component

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import Plot from 'react-plotly.js'; // Import Plotly React component

// --- Helper function for SWR ---
const fetcher = async (url: string) => {
    const res = await fetch(url);
    // If the status code is not in the range 200-299,
    // we still try to parse and throw it.
    if (!res.ok) {
        const errorInfo = await res.json().catch(() => ({ error: 'Failed to parse error JSON' }));
        const error = new Error(errorInfo.error || `An error occurred while fetching the data: ${res.statusText}`);
        // Attach extra info to the error object.
        // error.info = errorInfo; // Removed to avoid potential non-serializable issues
        // error.status = res.status; // Removed to avoid potential non-serializable issues
        console.error("API Fetch Error:", errorInfo, res.status); // Log details
        throw error;
    }
    return res.json();
};

// --- Interfaces for expected data structure ---
// (Define these based on what your API route actually returns)
interface Position {
    Symbol: string;
    Side: string;
    Qty: number;
    'Avg Entry Price': number;
    'Current Price': number;
    'Market Value': number;
    'Unrealized P&L': number;
    'Unrealized P&L %': number;
}

interface PnlEntry {
    Symbol: string;
    Type: string;
    'Entry Time': string; // ISO String
    'Exit Time': string; // ISO String
    Qty: number;
    'Entry Price': number;
    'Exit Price': number;
    'P&L': number;
    'Exit Date'?: string; // Optional if added in API
}

interface DashboardMetrics {
    total_pnl?: number;
    num_trades?: number;
    win_rate?: number;
    profit_factor?: number;
    avg_pnl?: number;
    avg_win_pnl?: number;
    avg_loss_pnl?: number;
}

interface OpenPositionsResponse {
    data: Position[];
    total_upl: number;
    total_mv: number;
}

interface PnlHistoryResponse {
    data: PnlEntry[];
    metrics: DashboardMetrics;
    fetchErrors?: string[];
    // Include aggregated winners/losers if calculated in API
    top_winners_agg?: any[];
    top_losers_agg?: any[];
}

interface CombinedDashboardData {
    openPositions: OpenPositionsResponse;
    pnlHistory: PnlHistoryResponse;
}


// --- Dashboard Component ---
export default function DashboardPage() {
    // --- State for Filters ---
    // TODO: Implement state and UI for date range and symbol filters
    const [symbolFilter, setSymbolFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' }); // Store dates

    // --- Fetch Data using SWR ---
    // Adjust the API endpoint URL as needed
    const { data, error, isLoading, mutate } = useSWR<CombinedDashboardData>('/api/alpaca/dashboard', fetcher, {
        // Optional: Revalidate on focus or interval
        // revalidateOnFocus: true,
        // refreshInterval: 30000 // Refresh every 30 seconds
    });

    // --- Derived State / Memoized Calculations ---
    // Example: Filter PNL data based on state filters
    const filteredPnlHistory = useMemo(() => {
        if (!data?.pnlHistory?.data) return [];
        // Add filtering logic here based on symbolFilter and dateRange
        return data.pnlHistory.data.filter(trade =>
             (symbolFilter === 'All' || trade.Symbol === symbolFilter)
             // && Add date filtering logic here based on dateRange state
        );
    }, [data?.pnlHistory?.data, symbolFilter, dateRange]);

    // Example: Recalculate metrics based on filtered data
    const filteredMetrics = useMemo(() => {
        if (!filteredPnlHistory || filteredPnlHistory.length === 0) {
            return { total_pnl: 0, num_trades: 0, win_rate: 0, profit_factor: 0 }; // Default metrics
        }
        // Add logic here to recalculate metrics based on filteredPnlHistory
        const total_pnl = filteredPnlHistory.reduce((sum, trade) => sum + (trade['P&L'] || 0), 0);
        const num_trades = filteredPnlHistory.length;
        const winners = filteredPnlHistory.filter(t => (t['P&L'] || 0) > 0).length;
        const losers = filteredPnlHistory.filter(t => (t['P&L'] || 0) < 0).length;
        const win_rate = num_trades > 0 ? (winners / num_trades) * 100 : 0;
        // Add profit factor, avg win/loss etc. calculation
        return {
            total_pnl: total_pnl,
            num_trades: num_trades,
            win_rate: win_rate,
            profit_factor: 0, // Placeholder
        };
    }, [filteredPnlHistory]);

    // Example: Prepare data for cumulative P&L chart
    const cumulativePnlChartData = useMemo(() => {
        if (!filteredPnlHistory || filteredPnlHistory.length === 0) return [];
        let cumulative = 0;
        const sortedHistory = [...filteredPnlHistory].sort((a, b) => new Date(a['Exit Time']).getTime() - new Date(b['Exit Time']).getTime());
        const chartData = sortedHistory.map(trade => {
            cumulative += (trade['P&L'] || 0);
            return { x: trade['Exit Time'], y: cumulative };
        });
        return [{
            x: chartData.map(d => d.x),
            y: chartData.map(d => d.y),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Cumulative P&L'
        }];
    }, [filteredPnlHistory]);


    // --- Render Logic ---
    if (error) return <div className="p-6 text-red-400">❌ Failed to load dashboard data: {error.message}</div>;
    if (isLoading) return <div className="p-6 text-gray-400">⏳ Loading dashboard data...</div>;
    if (!data) return <div className="p-6 text-gray-400">🤷 No data available.</div>;

    // --- Helper function for formatting currency ---
    const formatCurrency = (value: number | null | undefined, decimals = 2) => {
        if (value === null || value === undefined) return 'N/A';
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value.toFixed(2)}%`;
    }
    const formatDate = (dateString: string | null | undefined) => {
         if (!dateString) return 'N/A';
         try {
             return new Date(dateString).toLocaleString(); // Adjust format as needed
         } catch {
             return 'Invalid Date';
         }
    }

    return (
        // Use Tailwind classes for layout and styling
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
            {/* Header can be part of your main layout */}
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-teal-400">RokAi Live Dashboard</h1>
                 {/* Add user info/logout button from your auth context/session */}
                 <button onClick={() => mutate()} className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Refresh Data</button>
            </div>

            {/* Display Fetch Errors from API */}
            {data?.pnlHistory?.fetchErrors && data.pnlHistory.fetchErrors.length > 0 && (
                <div className="bg-yellow-800 border border-yellow-600 text-yellow-100 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Data Fetch Warnings:</strong>
                    <ul className="list-disc list-inside">
                        {data.pnlHistory.fetchErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Open Positions Section */}
            <section className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-teal-300">💼 Open Positions & Unrealized P&L</h2>
                {data.openPositions && data.openPositions.data?.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Metrics */}
                            <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400">Total Market Value</div>
                                <div className="text-2xl font-bold">{formatCurrency(data.openPositions.total_mv)}</div>
                            </div>
                             <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400">Total Unrealized P&L</div>
                                <div className={`text-2xl font-bold ${data.openPositions.total_upl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(data.openPositions.total_upl)}
                                </div>
                            </div>
                        </div>
                         {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-750">
                                    <tr>
                                        {/* Adjust headers as needed */}
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Symbol</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Side</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Avg Entry</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Current</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Market Value</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">UPL</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">UPL %</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {data.openPositions.data.map((pos) => (
                                    <tr key={pos.Symbol}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{pos.Symbol}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">{pos.Side}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{pos.Qty?.toFixed(2)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrency(pos['Avg Entry Price'], 4)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrency(pos['Current Price'], 4)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrency(pos['Market Value'])}</td>
                                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${pos['Unrealized P&L'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(pos['Unrealized P&L'])}</td>
                                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${pos['Unrealized P&L %'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(pos['Unrealized P&L %'])}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-400">No open positions found.</p>
                )}
            </section>

            <hr className="border-gray-700 my-8" />

            {/* Closed Trades Section */}
            <section className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
                 <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-teal-300">📊 Closed Trades Performance</h2>
                 {/* TODO: Add Filter UI elements here (Dropdown for symbol, Date Pickers) */}
                 {/* <div className="flex gap-4 mb-4">
                    <select onChange={(e) => setSymbolFilter(e.target.value)} value={symbolFilter}>...</select>
                    <input type="date" ... />
                 </div> */}

                 {filteredPnlHistory.length > 0 ? (
                    <>
                        {/* Display Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                             <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400">Total Realized P&L</div>
                                <div className="text-xl font-bold">{formatCurrency(filteredMetrics.total_pnl)}</div>
                            </div>
                             <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400">Total Closed Trades</div>
                                <div className="text-xl font-bold">{filteredMetrics.num_trades}</div>
                            </div>
                             <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400">Win Rate</div>
                                <div className="text-xl font-bold">{formatPercent(filteredMetrics.win_rate)}</div>
                            </div>
                             <div className="bg-gray-700 p-4 rounded">
                                <div className="text-sm text-gray-400">Profit Factor</div>
                                <div className="text-xl font-bold">{filteredMetrics.profit_factor?.toFixed(2) ?? 'N/A'}</div>
                            </div>
                        </div>

                        {/* TODO: Add Top Winners/Losers Aggregated Tables */}

                        {/* Charts */}
                        <h3 className="text-lg font-semibold mb-3 text-teal-300">Visualizations</h3>
                        <div className="mb-6">
                             <Plot
                                data={cumulativePnlChartData as any}
                                layout={{ title: 'Cumulative P&L (Filtered)', paper_bgcolor: '#1f2937', plot_bgcolor: '#1f2937', font: { color: '#e5e7eb'} }}
                                useResizeHandler={true}
                                className="w-full h-72" // Adjust height as needed
                            />
                        </div>
                        {/* Add other charts (distribution, P&L by symbol) here using Plotly */}


                        {/* Closed Trade Log Table */}
                        <h3 className="text-lg font-semibold mb-3 text-teal-300">Closed Trade Log (Filtered)</h3>
                        <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-750">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Symbol</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Entry Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Exit Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Entry Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Exit Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">P&L</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredPnlHistory.map((trade, index) => (
                                        <tr key={`${trade.Symbol}-${trade['Exit Time']}-${index}`}> {/* Add index for potential duplicate exit times */}
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{trade.Symbol}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{trade.Type}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(trade['Entry Time'])}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(trade['Exit Time'])}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{trade.Qty?.toFixed(2)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrency(trade['Entry Price'], 4)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrency(trade['Exit Price'], 4)}</td>
                                            <td className={`px-4 py-2 whitespace-nowrap text-sm ${trade['P&L'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(trade['P&L'])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                         <p className="text-xs text-gray-500 mt-2">Displaying {filteredPnlHistory.length} closed trades matching filters.</p>
                    </>
                 ) : (
                    <p className="text-gray-400">No closed trade data matches the selected filters.</p>
                 )}
            </section>

        </div>
    );
}
