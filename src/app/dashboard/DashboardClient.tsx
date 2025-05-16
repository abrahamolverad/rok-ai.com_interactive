'use client'; // Required for useEffect, useState, useSWR

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Papa from 'papaparse';
// Import AlpacaBar type if needed for strict typing, otherwise remove if causing issues
// Note: Sometimes direct type imports from SDK dist folders can be problematic in frontend builds
// If you encounter build issues related to this import, you might need to define a simpler local type
// or use 'any' temporarily.
// import { AlpacaBar } from '@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2';

dayjs.extend(utc);

// --- Dynamically import Plotly component ---
const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false, // Disable server-side rendering for this component
    loading: () => <div className="text-center py-10 text-gray-400">Loading Chart...</div>
}) as any;

// --- Local simplified type for Bar Data (if SDK import causes issues) ---
interface SimpleAlpacaBar {
    Timestamp: string | Date;
    OpenPrice: number;
    HighPrice: number;
    LowPrice: number;
    ClosePrice: number;
    Volume?: number; // Optional
    // Add other fields if you use them
}


// --- Interfaces ---
interface RealizedTradeOutput {
    Symbol: string;
    Type: 'Long' | 'Short';
    EntryTime: string; // ISO String
    ExitTime: string; // ISO String
    Qty: number;
    EntryPrice: number;
    ExitPrice: number;
    Pnl: number;
    ExitDate?: string;
}

interface PositionInfo {
    Symbol: string;
    Qty: number;
    'Avg Entry Price': number;
    'Current Price': number;
    'Market Value': number;
    'Unrealized P&L': number;
    'Unrealized P&L %': number;
    Side: 'long' | 'short';
}

interface DashboardData {
    openPositions: PositionInfo[];
    unrealizedPL: number;
    totalMarketValue: number;
    totalRealizedPL: number;
    realizedTrades: RealizedTradeOutput[];
    topWinners: RealizedTradeOutput[]; // Should be aggregated by symbol on backend
    topLosers: RealizedTradeOutput[];  // Should be aggregated by symbol on backend
    fetchErrors: string[];
    dataTimestamp?: string;
    message?: string; // To handle "Keys not configured" message
}

// --- Fetcher Functions ---
const dashboardFetcher = async (url: string): Promise<DashboardData> => {
    const res = await fetch(url);
    if (!res.ok) { const errorData = await res.json().catch(() => ({ message: res.statusText })); console.error("API Fetch Error Response (Dashboard):", errorData); throw new Error(errorData.message || `API Error: ${res.status}`); }
    return res.json();
};

// Fetcher for Bar data - expects an object { bars: SimpleAlpacaBar[] }
const barsFetcher = async (url: string): Promise<{ bars: SimpleAlpacaBar[] }> => {
    const res = await fetch(url);
    if (!res.ok) { const errorData = await res.json().catch(() => ({ message: res.statusText })); console.error("API Fetch Error Response (Bars):", errorData); throw new Error(errorData.message || `API Error: ${res.status}`); }
    return res.json();
};


// --- Helper Function to Format Currency ---
const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || typeof value === 'undefined') return '$0.00'; if (isNaN(value)) { console.warn("formatCurrency received NaN, returning $0.00"); return '$0.00'; } return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', });
};


export default function DashboardPage() {
    // --- State ---
    const [startDate, setStartDate] = useState<string>(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL'); // State for symbol filter dropdown
    const [candlestickSymbol, setCandlestickSymbol] = useState<string | null>(null); // State for the candlestick chart symbol

    // --- API URLs ---
    const dashboardApiUrl = (startDate && endDate)
        ? `/api/alpaca/dashboard?startDate=${startDate}&endDate=${endDate}`
        : null;

    // API URL for bars - only fetch if a symbol is selected for the candlestick
    // We decided to use daily bars.
    const barsApiUrl = (candlestickSymbol) // Removed date range dependency for simplicity, get recent daily data
        ? `/api/alpaca/bars?symbol=${candlestickSymbol}&timeframe=1Day`
        : null;

    // --- Data Fetching ---
    // Fetch main dashboard data
    const { data: dashboardData, error: dashboardError, isLoading: dashboardIsLoading, mutate: mutateDashboard } = useSWR<DashboardData>(
        dashboardApiUrl,
        dashboardFetcher,
        { revalidateOnFocus: false, shouldRetryOnError: false }
    );
    // Fetch bar data - will only run when barsApiUrl is not null
    const { data: barsData, error: barsError, isLoading: barsIsLoading } = useSWR<{ bars: SimpleAlpacaBar[] }>(
        barsApiUrl,
        barsFetcher,
        { revalidateOnFocus: false, shouldRetryOnError: true } // Enable retries for bars
    );

    // --- Memoized Calculations ---
    // Get unique symbols for the filter dropdown
    const uniqueSymbols = useMemo(() => {
        if (!dashboardData) return ['ALL'];
        const symbols = new Set<string>();
        dashboardData.openPositions?.forEach(p => symbols.add(p.Symbol));
        dashboardData.realizedTrades?.forEach(t => symbols.add(t.Symbol));
        return ['ALL', ...Array.from(symbols).sort()];
    }, [dashboardData]);

    // Filter realized trades based on selectedSymbol
    const filteredRealizedTrades = useMemo(() => {
        if (!dashboardData?.realizedTrades) return [];
        if (selectedSymbol === 'ALL') return dashboardData.realizedTrades;
        return dashboardData.realizedTrades.filter(trade => trade.Symbol === selectedSymbol);
    }, [dashboardData?.realizedTrades, selectedSymbol]);

    // Recalculate metrics based on filtered trades
    const filteredTotalRealizedPL = useMemo(() => {
        return filteredRealizedTrades.reduce((sum, t) => sum + t.Pnl, 0);
    }, [filteredRealizedTrades]);

    // Top winners/losers from realized trades (can be refined to be by symbol if API sends it pre-aggregated)
    const filteredSortedTrades = useMemo(() => [...filteredRealizedTrades].sort((a, b) => b.Pnl - a.Pnl), [filteredRealizedTrades]);
    const filteredTopWinners = useMemo(() => filteredSortedTrades.slice(0, 10), [filteredSortedTrades]);
    const filteredTopLosers = useMemo(() => filteredSortedTrades.filter(t => t.Pnl < 0).slice(-10).reverse(), [filteredSortedTrades]);


    // Calculate Daily P&L Bar chart data based on filtered trades
    const dailyPnlChartData = useMemo(() => {
        if (!filteredRealizedTrades || filteredRealizedTrades.length === 0) return [];
        const dailyPnl: { [key: string]: number } = {};
        filteredRealizedTrades.forEach(trade => {
            const exitDate = dayjs(trade.ExitTime).format('YYYY-MM-DD');
            dailyPnl[exitDate] = (dailyPnl[exitDate] || 0) + trade.Pnl;
        });
        const sortedDates = Object.keys(dailyPnl).sort((a,b) => dayjs(a).diff(dayjs(b)));
        return [{
            x: sortedDates,
            y: sortedDates.map(date => dailyPnl[date]),
            type: 'bar',
            name: `Daily P&L (${selectedSymbol})`,
            marker: { color: sortedDates.map(date => (dailyPnl[date] >= 0 ? '#8b5cf6' : '#ec4899')) }, // Purple for profit, pink for loss
             text: sortedDates.map(date => formatCurrency(dailyPnl[date])),
             textposition: 'auto', // Show labels on bars
        }];
    }, [filteredRealizedTrades, selectedSymbol]);

    // Prepare data for Candlestick chart
    const candlestickChartData = useMemo(() => {
        if (!barsData?.bars || barsData.bars.length === 0) return [];
        const bars = barsData.bars;
        const timestamps = bars.map(b => typeof b.Timestamp === 'string' ? b.Timestamp : dayjs(b.Timestamp).toISOString());

        return [{
            x: timestamps,
            open: bars.map(b => b.OpenPrice),
            high: bars.map(b => b.HighPrice),
            low: bars.map(b => b.LowPrice),
            close: bars.map(b => b.ClosePrice),
            type: 'candlestick',
            name: candlestickSymbol || 'Candlestick',
            xaxis: 'x',
            yaxis: 'y',
            increasing: { line: { color: '#8b5cf6' } }, // Purple
            decreasing: { line: { color: '#ec4899' } }  // Pink/Red
        }];
    }, [barsData, candlestickSymbol]);

    // --- Event Handlers ---
    const handleSymbolFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSymbol(event.target.value);
    };

    const handleSymbolClick = (symbol: string) => {
        setCandlestickSymbol(symbol);
    };

    const handleExportCsv = () => {
        if (!filteredRealizedTrades || filteredRealizedTrades.length === 0) { alert("No closed trade data to export for the selected filter."); return; }
        const csvData = filteredRealizedTrades.map(trade => ({ Symbol: trade.Symbol, Type: trade.Type, Quantity: trade.Qty, EntryPrice: trade.EntryPrice.toFixed(2), ExitPrice: trade.ExitPrice.toFixed(2), EntryTime: dayjs(trade.EntryTime).format('YYYY-MM-DD HH:mm:ss'), ExitTime: dayjs(trade.ExitTime).format('YYYY-MM-DD HH:mm:ss'), PnL: trade.Pnl.toFixed(2), }));
        const csvString = Papa.unparse(csvData, { header: true });
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `closed_trades_${selectedSymbol}_${startDate}_to_${endDate}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } else { alert("CSV download is not supported in your browser."); }
    };

    // --- Loading/Error/Message States ---
    if (dashboardIsLoading && dashboardApiUrl) { return <div className="flex justify-center items-center h-screen bg-black text-rokIvory"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rokPurple"></div><span className="ml-4 text-lg">Loading Dashboard Data...</span></div>; }
    if (dashboardError) { return <div className="p-4 md:p-6 bg-black min-h-screen text-rokIvory"><h1 className="text-2xl font-semibold mb-4 text-red-400">Error Loading Dashboard</h1><div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded"><p>Failed to load dashboard data:</p><pre className="mt-2 text-sm whitespace-pre-wrap">{dashboardError.message}</pre></div><button onClick={() => mutateDashboard()} className="px-4 py-2 bg-rokPurple text-white rounded hover:bg-purple-700">Retry</button></div>; }
    if (dashboardData?.message === "Alpaca API keys not configured.") { return <div className="p-4 md:p-6 bg-black min-h-screen text-rokIvory"><h1 className="text-2xl font-semibold mb-4">Alpaca Dashboard</h1><div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 text-yellow-300 rounded"><strong>Configuration Needed:</strong> {dashboardData.message}<p className="mt-1 text-sm">Please configure your Alpaca API keys in the settings page.</p></div></div>; }
    if (!dashboardData) { return <div className="p-4 bg-black min-h-screen text-gray-400">Initializing dashboard...</div>; }

    // --- Helper Functions ---
    const formatPnl = (pnl: number | null | undefined) => { const fc = formatCurrency(pnl); if (pnl === null || typeof pnl === 'undefined' || isNaN(pnl)) return <span className="text-gray-500">{fc}</span>; return (<span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>{fc}</span>); }; // Adjusted colors for dark theme
    const renderFetchErrors = () => ( dashboardData.fetchErrors && dashboardData.fetchErrors.length > 0 && (<div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 text-yellow-300 rounded"><strong>Data Fetching Warnings/Errors:</strong><ul className="list-disc pl-5 text-sm">{dashboardData.fetchErrors.map((err, index) => <li key={index}>{err}</li>)}</ul></div>) );

    // --- Main Return ---
    // Base colors: bg-black, text-rokIvory (nearly white), accent-rokPurple
    return (
        <div className="p-4 md:p-6 space-y-6 bg-black text-rokIvory min-h-screen">
            {/* Header with Logo */}
            <div className="flex items-center justify-between mb-6">
                 <img src="/rok-ai-logo.png" alt="RokAi Logo" className="h-10" /> {/* Adjust path and size */}
                 <h1 className="text-3xl font-bold text-rokIvory">Trading Dashboard</h1>
            </div>


            {/* --- Filters --- */}
            <div className="mb-6 p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* Date Range Filter */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Date Range:</label>
                        <div className="flex flex-wrap items-center gap-2">
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-700 bg-gray-800 text-rokIvory p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple" max={endDate || dayjs().format('YYYY-MM-DD')} />
                            <span className="text-gray-500">to</span>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-700 bg-gray-800 text-rokIvory p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple" min={startDate || undefined} max={dayjs().format('YYYY-MM-DD')} />
                        </div>
                    </div>
                    {/* Symbol Filter */}
                    <div>
                        <label htmlFor="symbolFilter" className="block text-sm font-medium text-gray-400 mb-1">Filter by Symbol:</label>
                        <select
                            id="symbolFilter"
                            value={selectedSymbol}
                            onChange={handleSymbolFilterChange}
                            className="border border-gray-700 bg-gray-800 text-rokIvory p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple w-full md:w-auto"
                        >
                            {uniqueSymbols.map(symbol => (
                                <option key={symbol} value={symbol}>{symbol}</option>
                            ))}
                        </select>
                    </div>
                     <button onClick={() => mutateDashboard()} disabled={dashboardIsLoading} className="px-4 py-2 bg-rokPurple text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed h-10" title="Load data for selected range"> {dashboardIsLoading ? 'Loading...' : 'Load Data'} </button>
                </div>
            </div>

            {renderFetchErrors()}

            {/* --- Daily P&L Bar Chart --- */}
            <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700 mb-6">
                <h2 className="text-xl font-semibold text-rokIvory mb-3">Daily Realized P&L ({selectedSymbol})</h2>
                {dailyPnlChartData.length > 0 && dailyPnlChartData[0].x.length > 0 ? (
                    <Plot data={dailyPnlChartData as any} layout={{
                        autosize: true, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: '#D1D5DB' }, // Lighter gray for text
                        xaxis: { title: 'Date', type: 'date', tickformat: '%Y-%m-%d', automargin: true, gridcolor: '#374151', linecolor: '#4B5563', zerolinecolor: '#4B5563' }, // Darker grid lines
                        yaxis: { title: 'Daily P&L ($)', automargin: true, tickprefix: '$', gridcolor: '#374151', linecolor: '#4B5563', zerolinecolor: '#4B5563' },
                        margin: { l: 70, r: 50, t: 50, b: 50 }, // Adjusted margins
                        hovermode: 'x unified'
                    }} useResizeHandler={true} className="w-full h-[350px] md:h-[450px]" config={{ responsive: true }} />
                ) : ( <p className="text-gray-500 text-center py-10">No realized P&L data to display for {selectedSymbol === 'ALL' ? 'all symbols' : selectedSymbol} in the selected period.</p> )}
            </div>


            {/* --- Summary Statistics --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700 text-center">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Realized P&L ({selectedSymbol})</div>
                    <div className={`text-2xl font-semibold mt-1 ${filteredTotalRealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(filteredTotalRealizedPL)}
                    </div>
                </div>
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700 text-center">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Unrealized P&L</div>
                    <div className={`text-2xl font-semibold mt-1 ${dashboardData.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(dashboardData.unrealizedPL)}
                    </div>
                </div>
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700 text-center">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Market Value</div>
                    <div className="text-2xl font-semibold text-rokIvory mt-1">
                        {formatCurrency(dashboardData.totalMarketValue)}
                    </div>
                </div>
            </div>

            {/* --- Candlestick Chart (conditionally rendered)--- */}
            {candlestickSymbol && (
              <div className={`p-4 bg-gray-900 shadow-lg rounded border border-gray-700 mb-6`}>
                  <div className="flex justify-between items-center mb-3">
                      <h2 className="text-xl font-semibold text-rokIvory">Candlestick: {candlestickSymbol} (Daily - Last ~90 days)</h2>
                      <button onClick={() => setCandlestickSymbol(null)} className="text-xs text-gray-400 hover:text-rokIvory">&times; Close</button>
                  </div>
                  {barsIsLoading && <p className="text-center py-10 text-gray-400">Loading Candlestick Data...</p>}
                  {barsError && !barsIsLoading && <p className="text-center py-10 text-red-400">Error loading candlestick data: {barsError.message}</p>}
                  {candlestickChartData.length > 0 && candlestickChartData[0].x.length > 0 && !barsIsLoading ? (
                      <Plot data={candlestickChartData as any} layout={{
                          autosize: true, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#D1D5DB' },
                          xaxis: { title: 'Date', type: 'date', tickformat: '%Y-%m-%d', automargin: true, gridcolor: '#374151', linecolor: '#4B5563', zerolinecolor: '#4B5563', rangeslider: { visible: false } },
                          yaxis: { title: 'Price ($)', automargin: true, tickprefix: '$', gridcolor: '#374151', linecolor: '#4B5563', zerolinecolor: '#4B5563' },
                          margin: { l: 70, r: 50, t: 50, b: 50 }, // Adjusted margins
                          hovermode: 'x unified'
                      }} useResizeHandler={true} className="w-full h-[400px] md:h-[500px]" config={{ responsive: true }} />
                  ) : (
                      !barsIsLoading && !barsError && <p className="text-gray-500 text-center py-10">No candlestick data available for {candlestickSymbol}.</p>
                  )}
              </div>
            )}


            {/* --- Open & Closed Positions --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Open Positions Table */}
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
                    <h2 className="text-xl font-semibold text-rokIvory mb-3">Open Positions ({dashboardData.openPositions?.length ?? 0})</h2>
                    <div className="overflow-x-auto"> {dashboardData.openPositions?.length > 0 ? ( <table className="min-w-full divide-y divide-gray-700 text-sm"> <thead className="bg-gray-800"> <tr> <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Symbol</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Qty</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Avg Entry</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Current</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Market Value</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Unrealized P&L</th> </tr> </thead> <tbody className="bg-gray-900 divide-y divide-gray-700"> {dashboardData.openPositions.map((pos, index) => ( <tr key={`${pos.Symbol}-${index}`} className="hover:bg-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap font-medium text-rokPurple hover:text-purple-300 cursor-pointer" onClick={() => handleSymbolClick(pos.Symbol)}>{pos.Symbol}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{pos.Qty}</td> <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{formatCurrency(pos['Avg Entry Price'])}</td> <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{formatCurrency(pos['Current Price'])}</td> <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{formatCurrency(pos['Market Value'])}</td> <td className="px-4 py-2 whitespace-nowrap text-right">{formatPnl(pos['Unrealized P&L'])}</td> </tr> ))} </tbody> </table> ) : ( <p className="text-gray-500 text-center py-5">No open positions.</p> )} </div>
                </div>

                {/* Closed Trades Table */}
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold text-rokIvory">Closed Trades ({filteredRealizedTrades.length})</h2>
                        <button onClick={handleExportCsv} disabled={filteredRealizedTrades.length === 0 || dashboardIsLoading} className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"> Export CSV </button>
                    </div>
                    <div className="overflow-x-auto max-h-[400px]"> {filteredRealizedTrades.length > 0 ? ( <table className="min-w-full divide-y divide-gray-700 text-sm"> <thead className="bg-gray-800 sticky top-0 z-10"> <tr> <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Symbol</th> <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Type</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Qty</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Entry Price</th> <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Entry Time</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">Exit Price</th> <th className="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Exit Time</th> <th className="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">P&L</th> </tr> </thead> <tbody className="bg-gray-900 divide-y divide-gray-700"> {filteredRealizedTrades .sort((a, b) => new Date(b.ExitTime).getTime() - new Date(a.ExitTime).getTime()) .map((trade, index) => ( <tr key={`${trade.Symbol}-${trade.ExitTime}-${index}`} className="hover:bg-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap font-medium text-rokPurple hover:text-purple-300 cursor-pointer" onClick={() => handleSymbolClick(trade.Symbol)}>{trade.Symbol}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-rokIvory">{trade.Type}</td> <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{trade.Qty.toFixed(4)}</td> <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{formatCurrency(trade.EntryPrice)}</td> <td className="px-4 py-2 whitespace-nowrap text-rokIvory">{dayjs(trade.EntryTime).format('YYYY-MM-DD HH:mm:ss')}</td> <td className="px-4 py-2 whitespace-nowrap text-right text-rokIvory">{formatCurrency(trade.ExitPrice)}</td> <td className="px-4 py-2 whitespace-nowrap text-rokIvory">{dayjs(trade.ExitTime).format('YYYY-MM-DD HH:mm:ss')}</td> <td className="px-4 py-2 whitespace-nowrap text-right">{formatPnl(trade.Pnl)}</td> </tr> ))} </tbody> </table> ) : ( <p className="text-gray-500 text-center py-10">No closed trades found for {selectedSymbol === 'ALL' ? 'all symbols' : selectedSymbol} in the selected period.</p> )} </div>
                </div>
            </div>

            {/* --- Top Winners/Losers (Individual Trades) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Winners Card */}
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
                    <h2 className="text-xl font-semibold text-green-400 mb-3">Top 10 Winners ({selectedSymbol})</h2>
                    {filteredTopWinners.length > 0 ? ( <ul className="space-y-2 text-sm"> {filteredTopWinners.map((t, i) => ( <li key={`win-${t.Symbol}-${i}`} className="flex justify-between items-center border-b border-gray-700 pb-1"> <span className="text-rokIvory">
                        <span className="font-medium text-rokPurple hover:text-purple-300 cursor-pointer" onClick={() => handleSymbolClick(t.Symbol)}>{t.Symbol}</span>
                        ({t.Type}) <span className="text-xs text-gray-500">{dayjs(t.ExitTime).format('YYYY-MM-DD')}</span> </span> <span className="font-medium text-green-400">{formatCurrency(t.Pnl)}</span> </li> ))} </ul> ) : ( <p className="text-gray-500 text-center py-5">No winning trades found for {selectedSymbol === 'ALL' ? 'all symbols' : selectedSymbol}.</p> )}
                </div>
                {/* Top Losers Card */}
                <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
                    <h2 className="text-xl font-semibold text-red-400 mb-3">Top 10 Losers ({selectedSymbol})</h2>
                    {filteredTopLosers.length > 0 ? ( <ul className="space-y-2 text-sm"> {filteredTopLosers.map((t, i) => ( <li key={`loss-${t.Symbol}-${i}`} className="flex justify-between items-center border-b border-gray-700 pb-1"> <span className="text-rokIvory">
                        <span className="font-medium text-rokPurple hover:text-purple-300 cursor-pointer" onClick={() => handleSymbolClick(t.Symbol)}>{t.Symbol}</span>
                        ({t.Type}) <span className="text-xs text-gray-500">{dayjs(t.ExitTime).format('YYYY-MM-DD')}</span> </span> <span className="font-medium text-red-400">{formatCurrency(t.Pnl)}</span> </li> ))} </ul> ) : ( <p className="text-gray-500 text-center py-5">No losing trades found for {selectedSymbol === 'ALL' ? 'all symbols' : selectedSymbol}.</p> )}
                </div>
            </div>

            {/* --- Data Timestamp --- */}
            {dashboardData.dataTimestamp && ( <p className="text-xs text-gray-500 text-center mt-6 pb-4"> Dashboard data generated at: {dayjs(dashboardData.dataTimestamp).format('YYYY-MM-DD HH:mm:ss Z')} </p> )}
        </div>
    );
}