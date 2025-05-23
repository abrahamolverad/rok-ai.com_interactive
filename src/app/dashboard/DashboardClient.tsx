'use client'; // Required for useEffect, useState, useSWR
console.log("DASHBOARD CLIENT VERSION 20240523_01");


import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Papa from 'papaparse'; // Needed for CSV export

dayjs.extend(utc);

// --- Dynamically import Plotly component ---
const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false, // Disable server-side rendering for this component
    loading: () => <div className="text-center py-10 text-rokGraySubtle">Loading Chart...</div>
});

// --- Local simplified type for Bar Data ---
interface SimpleAlpacaBar {
  Timestamp: string | Date;
  OpenPrice: number;
  HighPrice: number;
  LowPrice: number;
  ClosePrice: number;
  Volume?: number; // Optional
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
    ExitOrderId?: string; // <<< Kept from previous version
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

// --- Aggregated P&L Type ---
interface AggregatedPnl {
    Symbol: string;
    TotalPnl: number;
    TradeCount: number;
}

interface DashboardData {
    openPositions: PositionInfo[];
    unrealizedPL: number;
    totalMarketValue: number;
    totalRealizedPL: number; // Overall total P&L for the period
    realizedTrades: RealizedTradeOutput[];
    fetchErrors: string[];
    dataTimestamp?: string;
    message?: string; // For API messages like "keys not configured"
    // Potentially add account details if multiple Alpaca keys are used
    currentAccountName?: string; // Example if API returns which account's data this is
}

// --- Helper Function to safely format numbers ---
const safeToFixed = (value: any, digits: number = 2, fallback: string = '0.00') => {
    if (typeof value === 'number' && !isNaN(value)) return value.toFixed(digits);
    const num = Number(value);
    return !isNaN(num) ? num.toFixed(digits) : fallback;
};

// --- Fetcher Functions ---
const dashboardFetcher = async (url: string): Promise<DashboardData> => {
    const res = await fetch(url);
    if (!res.ok) { const errorData = await res.json().catch(() => ({ message: res.statusText })); console.error("API Fetch Error Response (Dashboard):", errorData); throw new Error(errorData.message || `API Error: ${res.status}`); }
    return res.json();
};

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
    const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL'); // Filter for Daily P&L chart and Closed Trades table
    const [openPositionChartSymbol, setOpenPositionChartSymbol] = useState<string | null>(null); // Symbol for the 24h candlestick
    const [selectedStrategyKey, setSelectedStrategyKey] = useState<string>('default_strategy'); // Placeholder for Alpaca Key/Strategy selection

    // --- API URLs ---
    // Append selectedStrategyKey to the dashboard API URL
    const dashboardApiUrl = (startDate && endDate && selectedStrategyKey) ? `/api/alpaca/dashboard?startDate=${startDate}&endDate=${endDate}&strategyKey=${selectedStrategyKey}` : null;
    const barsApiUrl = (openPositionChartSymbol) ? `/api/alpaca/bars?symbol=${openPositionChartSymbol}&timeframe=15Min&lookbackHours=24` : null;

    // --- Data Fetching ---
    const { data: dashboardData, error: dashboardError, isLoading: dashboardIsLoading, mutate: mutateDashboard } = useSWR<DashboardData>(dashboardApiUrl, dashboardFetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
    const { data: barsData, error: barsError, isLoading: barsIsLoading } = useSWR<{ bars: SimpleAlpacaBar[] }>(barsApiUrl, barsFetcher, { revalidateOnFocus: false, shouldRetryOnError: true, refreshInterval: 15000 });

    // --- Memoized Calculations ---
    const uniqueSymbols = useMemo(() => {
        if (!dashboardData) return ['ALL'];
        const symbols = new Set<string>();
        dashboardData.openPositions?.forEach(p => symbols.add(p.Symbol));
        dashboardData.realizedTrades?.forEach(t => symbols.add(t.Symbol));
        return ['ALL', ...Array.from(symbols).sort()];
     }, [dashboardData]);

    const filteredRealizedTrades = useMemo(() => {
        if (!dashboardData?.realizedTrades) return [];
        if (selectedSymbol === 'ALL') return dashboardData.realizedTrades;
        return dashboardData.realizedTrades.filter(trade => trade.Symbol === selectedSymbol);
     }, [dashboardData?.realizedTrades, selectedSymbol]);

    // Calculate total P&L based on the FILTERED trades for display consistency in header card
    const filteredTotalRealizedPL = useMemo(() => {
        return filteredRealizedTrades.reduce((sum, t) => sum + t.Pnl, 0);
     }, [filteredRealizedTrades]);

    const aggregatedPnlBySymbol = useMemo((): AggregatedPnl[] => {
        const tradesToAggregate = dashboardData?.realizedTrades || [];
        if (!tradesToAggregate || tradesToAggregate.length === 0) return [];
        const pnlMap: { [key: string]: { total: number; count: number } } = {};
        tradesToAggregate.forEach(trade => {
            if (!pnlMap[trade.Symbol]) pnlMap[trade.Symbol] = { total: 0, count: 0 };
            pnlMap[trade.Symbol].total += trade.Pnl;
            pnlMap[trade.Symbol].count += 1;
        });
        return Object.entries(pnlMap).map(([symbol, data]) => ({ Symbol: symbol, TotalPnl: data.total, TradeCount: data.count, }));
    }, [dashboardData?.realizedTrades]);

    const aggregatedSorted = useMemo(() => [...aggregatedPnlBySymbol].sort((a, b) => b.TotalPnl - a.TotalPnl), [aggregatedPnlBySymbol]);
    const aggregatedTopWinners = useMemo(() => aggregatedSorted.slice(0, 10), [aggregatedSorted]);
    const aggregatedTopLosers = useMemo(() => aggregatedSorted.slice(-10).reverse(), [aggregatedSorted]);

    const dailyPnlChartData = useMemo(() => {
        if (!filteredRealizedTrades || filteredRealizedTrades.length === 0) return [];
        const pnlByDate: { [key: string]: number } = {};
        filteredRealizedTrades.forEach(trade => {
            const exitDate = dayjs(trade.ExitTime).format('YYYY-MM-DD');
            if (!pnlByDate[exitDate]) pnlByDate[exitDate] = 0;
            pnlByDate[exitDate] += trade.Pnl;
        });
        const sortedDates = Object.keys(pnlByDate).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());
        return [{
            x: sortedDates,
            y: sortedDates.map(date => pnlByDate[date]),
            type: 'bar',
            text: sortedDates.map(d => formatCurrency(pnlByDate[d])),
            textposition: 'outside',
            textfont: { size: 10, color: '#f8f8f5' }, // rokIvory
            name: `Daily P&L (${selectedSymbol})`,
            marker: { color: '#a855f7' } // rokPurple
        }];
    }, [filteredRealizedTrades, selectedSymbol]);

    const openPosCandlestickChartData = useMemo(() => {
        if (!barsData?.bars || barsData.bars.length === 0 || !openPositionChartSymbol) return [];
        const bars = barsData.bars;
        const timestamps = bars.map(b => typeof b.Timestamp === 'string' ? b.Timestamp : b.Timestamp.toISOString());
        return [{
            x: timestamps,
            open: bars.map(b => b.OpenPrice), high: bars.map(b => b.HighPrice),
            low: bars.map(b => b.LowPrice), close: bars.map(b => b.ClosePrice),
            type: 'candlestick', name: openPositionChartSymbol, xaxis: 'x', yaxis: 'y',
            increasing: { line: { color: '#FFFFFF' } }, // White candles
            decreasing: { line: { color: '#a855f7' } }  // rokPurple candles
        }];
    }, [barsData, openPositionChartSymbol]);

    // --- Event Handlers ---
    const handleSymbolFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => { setSelectedSymbol(event.target.value); };
    const handleOpenPositionSymbolClick = (symbol: string) => { setOpenPositionChartSymbol(symbol); };
    const handleStrategyKeyChange = (event: React.ChangeEvent<HTMLSelectElement>) => { setSelectedStrategyKey(event.target.value); };

    const handleExportCsv = () => {
        if (!filteredRealizedTrades || filteredRealizedTrades.length === 0) { alert("No closed trade data to export for the selected filter."); return; }
        const csvData = filteredRealizedTrades.map(trade => ({
            Symbol: trade.Symbol,
            Type: trade.Type,
            Quantity: safeToFixed(trade.Qty, 4, '0.0000'),
            EntryPrice: safeToFixed(trade.EntryPrice, 2, '0.00'),
            ExitPrice: safeToFixed(trade.ExitPrice, 2, '0.00'),
            EntryTime: dayjs(trade.EntryTime).format('YYYY-MM-DD HH:mm:ss'),
            ExitTime: dayjs(trade.ExitTime).format('YYYY-MM-DD HH:mm:ss'),
            PnL: safeToFixed(trade.Pnl, 2, '0.00'),
            ExitOrderId: trade.ExitOrderId || 'N/A'
        }));
        const csvString = Papa.unparse(csvData, { header: true });
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `closed_trades_${selectedSymbol}_${startDate}_to_${endDate}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } else { alert("CSV download is not supported in your browser."); }
     };

    // --- Loading/Error/Message States ---
    if (dashboardIsLoading && dashboardApiUrl) { return <div className="flex justify-center items-center h-screen bg-black text-rokIvory"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rokPurple"></div><span className="ml-4 text-lg">Loading Dashboard Data...</span></div>; }
    if (dashboardError) { return <div className="p-4 md:p-6 bg-black min-h-screen text-rokIvory"><h1 className="text-2xl font-semibold mb-4 text-red-400">Error Loading Dashboard</h1><div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded"><p>Failed to load dashboard data:</p><pre className="mt-2 text-sm whitespace-pre-wrap">{dashboardError.message}</pre></div><button onClick={() => mutateDashboard()} className="px-4 py-2 bg-rokPurple text-white rounded hover:bg-rokPurple/80">Retry</button></div>; }
    if (dashboardData?.message === "Alpaca API keys not configured.") { return <div className="p-4 md:p-6 bg-black min-h-screen text-rokIvory"><h1 className="text-2xl font-semibold mb-4">RokAi Trading Dashboard</h1><div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 text-yellow-300 rounded"><strong>Configuration Needed:</strong> {dashboardData.message}<p className="mt-1 text-sm">Please configure your Alpaca API keys in the settings page.</p></div></div>; }
    if (!dashboardData) { return <div className="p-4 bg-black min-h-screen text-rokGraySubtle">Initializing dashboard...</div>; }

    // --- Helper Functions ---
    const formatPnl = (pnl: number | null | undefined) => { const fc = formatCurrency(pnl); if (pnl === null || typeof pnl === 'undefined' || isNaN(pnl)) return <span className="text-rokGrayText">{fc}</span>; return (<span className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>{fc}</span>); };
    const renderFetchErrors = () => ( dashboardData.fetchErrors && dashboardData.fetchErrors.length > 0 && (<div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 text-yellow-300 rounded"><strong>Data Fetching Warnings/Errors:</strong><ul className="list-disc pl-5 text-sm">{dashboardData.fetchErrors.map((err, index) => <li key={index}>{err}</li>)}</ul></div>) );

    // --- Main Return (Full Layout with Corrected Styles/Charts) ---
    return (
        <div className="p-4 md:p-6 space-y-6 bg-black text-rokIvory min-h-screen font-sans">
            {/* Header with Logo */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <img src="/RokAi_Logo_Full_White_TransparentBG.png" alt="RokAi Logo" className="h-12 md:h-16 w-auto" /> {/* Replace with your logo path */}
                </div>
            </div>

            {/* --- Filters --- */}
            <div className="mb-6 p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="strategyKey" className="block text-sm font-medium text-rokGraySubtle mb-1">Strategy/Account:</label>
<select 
    id="strategyKey" 
    value={selectedStrategyKey} 
    onChange={handleStrategyKeyChange} 
    className="w-full border border-rokGrayBorder bg-rokGrayInput text-rokGrayText p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple"
>
    <option value="default_strategy">Default Strategy</option>
    <option value="unholy_v1">Unholy V1</option>
    <option value="scalpingsniper_v0">ScalpingSniper V0</option>
    <option value="stock_genie_v0">Stock Genie V0</option>
</select>

                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-rokGraySubtle mb-1">Date Range:</label>
                        <div className="flex items-center gap-2">
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 border border-rokGrayBorder bg-rokGrayInput text-rokGrayText p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple" max={endDate || dayjs().format('YYYY-MM-DD')} />
                            <span className="text-rokGraySubtle">to</span>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 border border-rokGrayBorder bg-rokGrayInput text-rokGrayText p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple" min={startDate || undefined} max={dayjs().format('YYYY-MM-DD')} />
                        </div>
                    </div>
                    <div>
                         <button onClick={() => mutateDashboard()} disabled={dashboardIsLoading || !dashboardApiUrl} className="w-full px-4 py-2 bg-rokPurple text-white rounded hover:bg-rokPurple/80 text-sm disabled:opacity-50 disabled:cursor-not-allowed" title="Load data for selected range"> {dashboardIsLoading ? 'Loading...' : 'Load Data'} </button>
                    </div>
                </div>
            </div>

            {renderFetchErrors()}

            {/* --- Summary Statistics Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="p-5 bg-rokGrayDark shadow-xl rounded-lg border border-rokGrayBorder text-center">
                    <div className="text-sm font-medium text-rokGraySubtle uppercase tracking-wider">Total Realized P&L</div>
                    <div className={`text-3xl font-bold mt-1 ${dashboardData.totalRealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(dashboardData.totalRealizedPL)}
                    </div>
                </div>
                <div className="p-5 bg-rokGrayDark shadow-xl rounded-lg border border-rokGrayBorder text-center">
                    <div className="text-sm font-medium text-rokGraySubtle uppercase tracking-wider">Unrealized P&L</div>
                    <div className={`text-3xl font-bold mt-1 ${dashboardData.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(dashboardData.unrealizedPL)}
                    </div>
                </div>
                <div className="p-5 bg-rokGrayDark shadow-xl rounded-lg border border-rokGrayBorder text-center">
                    <div className="text-sm font-medium text-rokGraySubtle uppercase tracking-wider">Total Market Value</div>
                    <div className="text-3xl font-bold text-rokIvory mt-1">
                        {formatCurrency(dashboardData.totalMarketValue)}
                    </div>
                </div>
            </div>

            {/* --- Daily P&L Bar Chart --- */}
            <div className="p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-rokIvory">Daily Realized P&L ({selectedSymbol})</h2>
                    <select id="symbolFilterChart" value={selectedSymbol} onChange={handleSymbolFilterChange} className="border border-rokGrayBorder bg-rokGrayInput text-rokGrayText p-2 rounded text-sm focus:ring-rokPurple focus:border-rokPurple">
                        {uniqueSymbols.map(symbol => (<option key={symbol} value={symbol}>{symbol}</option>))}
                    </select>
                </div>
                {dailyPnlChartData.length > 0 && dailyPnlChartData[0].x.length > 0 ? (
                    <Plot {...{
                        data={dailyPnlChartData as any}
                        layout: {
                            autosize: true,
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            font: { color: '#f8f8f5' }, // rokIvory
                            xaxis: { title: { text: 'Date', font: { color: '#9ca3af'} }, type: 'date', tickformat: '%Y-%m-%d', automargin: true, gridcolor: '#374151', linecolor: '#4b5563', zerolinecolor: '#4b5563', tickfont: { color: '#9ca3af'} },
                            yaxis: { title: { text: 'Daily P&L ($)', font: { color: '#9ca3af'} }, automargin: true, tickprefix: '$', gridcolor: '#374151', linecolor: '#4b5563', zerolinecolor: '#4b5563', tickfont: { color: '#9ca3af'} },
                            bargap: 0.2,
                            uniformtext: { minsize: 9, mode: 'show' },
                            margin: { l: 60, r: 30, t: 50, b: 50 },
                            hovermode: 'x unified'
                        },
                        useResizeHandler: true,
                        className: "w-full h-[350px] md:h-[450px]",
                        config: { responsive: true, displayModeBar: false }
                    }} />
                ) : ( <p className="text-rokGraySubtle text-center py-10">No realized P&L data to display for {selectedSymbol === 'ALL' ? 'all symbols' : selectedSymbol} in the selected period.</p> )}
            </div>

             {/* --- Open Positions & Candlestick Chart Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Open Positions Table */}
                <div className="p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder">
                    <h2 className="text-xl font-semibold text-rokIvory mb-3">Open Positions ({dashboardData.openPositions?.length ?? 0})</h2>
                    <div className="overflow-x-auto max-h-[400px]"> {/* Added max height for scroll */}
                        {dashboardData.openPositions?.length > 0 ? (
                            <table className="min-w-full divide-y divide-rokGrayBorder text-sm">
                                <thead className="bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-rokGrayText uppercase tracking-wider">Symbol</th>
                                        <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Qty</th>
                                        <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Avg Entry</th>
                                        <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Current</th>
                                        <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Mkt Value</th>
                                        <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">UPL</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-rokGrayDark divide-y divide-rokGrayBorder">
                                    {dashboardData.openPositions.map((pos, index) => (
                                        <tr key={`${pos.Symbol}-${index}`} className="hover:bg-gray-800">
                                            <td className="px-4 py-2 whitespace-nowrap font-medium text-rokPurple hover:text-rokPurple/80 cursor-pointer" onClick={() => handleOpenPositionSymbolClick(pos.Symbol)}>{pos.Symbol}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(pos.Qty, 4, '0.0000')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(pos['Avg Entry Price'], 2, '0.00')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(pos['Current Price'], 2, '0.00')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(pos['Market Value'], 2, '0.00')}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{formatPnl(pos['Unrealized P&L'])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : ( <p className="text-rokGraySubtle text-center py-5">No open positions.</p> )}
                    </div>
                </div>

                 {/* Open Position Candlestick Chart (Last 24h) */}
                <div className={`p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder ${!openPositionChartSymbol ? 'flex items-center justify-center text-rokGraySubtle' : ''}`}>
                    {!openPositionChartSymbol && <p>Click an open position symbol to view its chart.</p>}
                    {openPositionChartSymbol && (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-semibold text-rokIvory">Intraday Chart: {openPositionChartSymbol} (15Min)</h2>
                                <button onClick={() => setOpenPositionChartSymbol(null)} className="text-xs text-rokGraySubtle hover:text-rokIvory">&times; Close Chart</button>
                            </div>
                            {barsIsLoading && <p className="text-center py-10 text-rokGraySubtle">Loading Intraday Data for {openPositionChartSymbol}...</p>}
                            {barsError && !barsIsLoading && <p className="text-center py-10 text-red-400">Error loading intraday data: {barsError.message}</p>}
                            {!barsIsLoading && !barsError && (
                                openPosCandlestickChartData.length > 0 ? (
                                    <Plot data={openPosCandlestickChartData as any} layout={{ autosize: true, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#f8f8f5' }, xaxis: { title: { text: 'Time (UTC)', font: { color: '#9ca3af'} }, type: 'date', tickformat: '%H:%M', automargin: true, gridcolor: '#374151', linecolor: '#4b5563', zerolinecolor: '#4b5563', rangeslider: { visible: false }, tickfont: { color: '#9ca3af'} }, yaxis: { title: { text: 'Price ($)', font: { color: '#9ca3af'} }, automargin: true, tickprefix: '$', gridcolor: '#374151', linecolor: '#4b5563', zerolinecolor: '#4b5563', tickfont: { color: '#9ca3af'} }, margin: { l: 60, r: 30, t: 10, b: 40 }, hovermode: 'x unified' }} useResizeHandler={true} className="w-full h-[350px]" config={{ responsive: true, displayModeBar: false }} />
                                ) : ( <p className="text-rokGraySubtle text-center py-10">No intraday data available for {openPositionChartSymbol} in the last 24 hours.</p> )
                            )}
                        </>
                    )}
                </div>
            </div>


            {/* Closed Trades Table */}
            <div className="p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-rokIvory">Closed Trades ({filteredRealizedTrades.length}) for {selectedSymbol}</h2>
                    <button onClick={handleExportCsv} disabled={filteredRealizedTrades.length === 0 || dashboardIsLoading} className="px-3 py-1 bg-rokPurple text-white rounded hover:bg-rokPurple/80 text-sm disabled:opacity-50 disabled:cursor-not-allowed"> Export CSV </button>
                </div>
                <div className="overflow-x-auto max-h-[400px]"> {/* Added max height for scroll */}
                    {filteredRealizedTrades.length > 0 ? (
                        <table className="min-w-full divide-y divide-rokGrayBorder text-sm">
                            <thead className="bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-rokGrayText uppercase tracking-wider">Symbol</th>
                                    <th className="px-4 py-2 text-left font-medium text-rokGrayText uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Qty</th>
                                    <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Entry Price</th>
                                    <th className="px-4 py-2 text-left font-medium text-rokGrayText uppercase tracking-wider">Entry Time</th>
                                    <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">Exit Price</th>
                                    <th className="px-4 py-2 text-left font-medium text-rokGrayText uppercase tracking-wider">Exit Time</th>
                                    <th className="px-4 py-2 text-right font-medium text-rokGrayText uppercase tracking-wider">P&L</th>
                                    <th className="px-4 py-2 text-left font-medium text-rokGrayText uppercase tracking-wider">Exit Order ID</th> {/* <<< Added Column Header >>> */}
                                </tr>
                            </thead>
                            <tbody className="bg-rokGrayDark divide-y divide-rokGrayBorder">
                                {filteredRealizedTrades
                                    .sort((a, b) => new Date(b.ExitTime).getTime() - new Date(a.ExitTime).getTime())
                                    .map((trade, index) => (
                                    <tr key={`${trade.Symbol}-${trade.ExitTime}-${index}`} className="hover:bg-gray-800">
                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-rokIvory">{trade.Symbol}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-rokGrayText">{trade.Type}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(trade.Qty, 4, '0.0000')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(trade.EntryPrice, 2, '0.00')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-rokGrayText">{dayjs(trade.EntryTime).format('YYYY-MM-DD HH:mm:ss')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-rokGrayText">{safeToFixed(trade.ExitPrice, 2, '0.00')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-rokGrayText">{dayjs(trade.ExitTime).format('YYYY-MM-DD HH:mm:ss')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right">{safeToFixed(trade.Pnl, 2, '0.00')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-rokGrayText text-xs">{trade.ExitOrderId || 'N/A'}</td> {/* <<< Display Exit Order ID >>> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : ( <p className="text-rokGraySubtle text-center py-10">No closed trades found for {selectedSymbol === 'ALL' ? 'all symbols' : selectedSymbol} in the selected period.</p> )}
                </div>
            </div>

            {/* --- Top Winners/Losers (Aggregated by Symbol) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Winners Card */}
                <div className="p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder">
                    <h2 className="text-xl font-semibold text-green-400 mb-3">Top 10 Winning Symbols (Overall Period)</h2>
                    {aggregatedTopWinners.length > 0 ? ( <ul className="space-y-2 text-sm"> {aggregatedTopWinners.map((agg, i) => ( <li key={`win-agg-${agg.Symbol}-${i}`} className="flex justify-between items-center border-b border-rokGrayBorder pb-1"> <span className="text-rokGrayText"> <span className="font-medium text-rokIvory">{agg.Symbol}</span> <span className="text-xs text-rokGraySubtle ml-1">({agg.TradeCount} trade{agg.TradeCount !== 1 ? 's' : ''})</span> </span> <span className="font-medium text-green-400">{formatCurrency(agg.TotalPnl)}</span> </li> ))} </ul> ) : ( <p className="text-rokGraySubtle text-center py-5">No winning trades found in the selected period.</p> )}
                </div>
                {/* Top Losers Card */}
                <div className="p-4 bg-rokGrayDark shadow-lg rounded-lg border border-rokGrayBorder">
                    <h2 className="text-xl font-semibold text-red-400 mb-3">Top 10 Losing Symbols (Overall Period)</h2>
                   {aggregatedTopLosers.length > 0 ? ( <ul className="space-y-2 text-sm"> {aggregatedTopLosers.map((agg, i) => ( <li key={`loss-agg-${agg.Symbol}-${i}`} className="flex justify-between items-center border-b border-rokGrayBorder pb-1"> <span className="text-rokGrayText"> <span className="font-medium text-rokIvory">{agg.Symbol}</span> <span className="text-xs text-rokGraySubtle ml-1">({agg.TradeCount} trade{agg.TradeCount !== 1 ? 's' : ''})</span> </span> <span className="font-medium text-red-400">{formatCurrency(agg.TotalPnl)}</span> </li> ))} </ul> ) : <p className="text-rokGraySubtle text-center py-5">No losing trades found in the selected period.</p>}
                </div>
            </div>

            {/* --- Data Timestamp --- */}
            {dashboardData.dataTimestamp && ( <p className="text-xs text-rokGraySubtle text-center mt-6 pb-4"> Dashboard data generated at: {dayjs(dashboardData.dataTimestamp).format('YYYY-MM-DD HH:mm:ss Z')} </p> )}
        </div>
    );
}

