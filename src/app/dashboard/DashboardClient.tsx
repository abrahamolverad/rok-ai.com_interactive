'use client'; // Required for useEffect, useState, useSWR

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Papa from 'papaparse';

dayjs.extend(utc);

// --- Dynamically import Plotly component ---
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-10 text-gray-400">Loading Chart...</div>
  ),
});

// --- Local simplified type for Bar Data ---
interface SimpleAlpacaBar {
  Timestamp: string | Date;
  OpenPrice: number;
  HighPrice: number;
  LowPrice: number;
  ClosePrice: number;
  Volume?: number;
}

// --- Interfaces ---
interface RealizedTradeOutput {
  Symbol: string;
  Type: 'Long' | 'Short';
  EntryTime: string;
  ExitTime: string;
  Qty: number;
  EntryPrice: number;
  ExitPrice: number;
  Pnl: number;
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
  topWinners: RealizedTradeOutput[];
  topLosers: RealizedTradeOutput[];
  fetchErrors: string[];
  dataTimestamp?: string;
  message?: string;
}

// --- Fetchers ---
const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(message || `API Error: ${res.status}`);
  }
  return res.json();
};

// --- Helper ---
const formatCurrency = (v: number | null | undefined) =>
  v == null || isNaN(v)
    ? '$0.00'
    : v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function DashboardClient() {
  // --- State ---
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate]   = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [candlestickSymbol, setCandlestickSymbol] = useState<string | null>(null);

  // --- API URLs ---
  const dashboardApiUrl =
    startDate && endDate
      ? `/api/alpaca/dashboard?startDate=${startDate}&endDate=${endDate}`
      : null;
  const barsApiUrl = candlestickSymbol
    ? `/api/alpaca/bars?symbol=${candlestickSymbol}&timeframe=1Day`
    : null;

  // --- Data Fetching ---
  const {
    data: dashboardData,
    error: dashboardError,
    isLoading: dashboardIsLoading,
    mutate: mutateDashboard,
  } = useSWR<DashboardData>(dashboardApiUrl, fetchJson, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const {
    data: barsData,
    error: barsError,
    isLoading: barsIsLoading,
  } = useSWR<{ bars: SimpleAlpacaBar[] }>(barsApiUrl, fetchJson, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
  });

  // --- Memoised calculations ---
  const uniqueSymbols = useMemo(() => {
    if (!dashboardData) return ['ALL'];
    const symbols = new Set<string>();
    dashboardData.openPositions?.forEach((p) => symbols.add(p.Symbol));
    dashboardData.realizedTrades?.forEach((t) => symbols.add(t.Symbol));
    return ['ALL', ...Array.from(symbols).sort()];
  }, [dashboardData]);

  const filteredRealizedTrades = useMemo(() => {
    if (!dashboardData?.realizedTrades) return [];
    return selectedSymbol === 'ALL'
      ? dashboardData.realizedTrades
      : dashboardData.realizedTrades.filter((t) => t.Symbol === selectedSymbol);
  }, [dashboardData?.realizedTrades, selectedSymbol]);

  const filteredTotalRealizedPL = useMemo(
    () => filteredRealizedTrades.reduce((s, t) => s + t.Pnl, 0),
    [filteredRealizedTrades]
  );

  const filteredSortedTrades = useMemo(
    () => [...filteredRealizedTrades].sort((a, b) => b.Pnl - a.Pnl),
    [filteredRealizedTrades]
  );
  const filteredTopWinners = useMemo(
    () => filteredSortedTrades.slice(0, 10),
    [filteredSortedTrades]
  );
  const filteredTopLosers = useMemo(
    () => filteredSortedTrades.filter((t) => t.Pnl < 0).slice(-10).reverse(),
    [filteredSortedTrades]
  );

  const dailyPnlChartData = useMemo(() => {
    if (!filteredRealizedTrades.length) return [];
    const daily: Record<string, number> = {};
    filteredRealizedTrades.forEach((t) => {
      const d = dayjs(t.ExitTime).format('YYYY-MM-DD');
      daily[d] = (daily[d] || 0) + t.Pnl;
    });
    const dates = Object.keys(daily).sort((a, b) => dayjs(a).diff(dayjs(b)));
    return [
      {
        x: dates,
        y: dates.map((d) => daily[d]),
        type: 'bar',
        name: `Daily P&L (${selectedSymbol})`,
        marker: {
          color: dates.map((d) => (daily[d] >= 0 ? '#8b5cf6' : '#ec4899')),
        },
        text: dates.map((d) => formatCurrency(daily[d])),
        textposition: 'auto',
      },
    ];
  }, [filteredRealizedTrades, selectedSymbol]);

  const candlestickChartData = useMemo(() => {
    if (!barsData?.bars?.length) return [];
    const bars = barsData.bars;
    const ts = bars.map((b) =>
      typeof b.Timestamp === 'string'
        ? b.Timestamp
        : dayjs(b.Timestamp).toISOString()
    );
    return [
      {
        x: ts,
        open: bars.map((b) => b.OpenPrice),
        high: bars.map((b) => b.HighPrice),
        low: bars.map((b) => b.LowPrice),
        close: bars.map((b) => b.ClosePrice),
        type: 'candlestick',
        name: candlestickSymbol ?? 'Candlestick',
        increasing: { line: { color: '#8b5cf6' } },
        decreasing: { line: { color: '#ec4899' } },
      },
    ];
  }, [barsData, candlestickSymbol]);

  // --- Handlers ---
  const exportCsv = () => {
    if (!filteredRealizedTrades.length) {
      alert('No closed trade data to export.');
      return;
    }
    const csvData = filteredRealizedTrades.map((t) => ({
      Symbol: t.Symbol,
      Type: t.Type,
      Quantity: t.Qty,
      EntryPrice: t.EntryPrice.toFixed(2),
      ExitPrice: t.ExitPrice.toFixed(2),
      EntryTime: dayjs(t.EntryTime).format('YYYY-MM-DD HH:mm:ss'),
      ExitTime: dayjs(t.ExitTime).format('YYYY-MM-DD HH:mm:ss'),
      PnL: t.Pnl.toFixed(2),
    }));
    const blob = new Blob([Papa.unparse(csvData, { header: true })], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `closed_trades_${selectedSymbol}_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Loading & error UI ---
  if (dashboardIsLoading)
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        Loading Dashboard...
      </div>
    );
  if (dashboardError)
    return (
      <div className="p-6 bg-black text-red-400">
        Dashboard error: {dashboardError.message}
      </div>
    );
  if (!dashboardData)
    return <div className="p-6 bg-black text-gray-400">Initializing...</div>;

  const pnlColor = (v: number) => (v >= 0 ? 'text-green-400' : 'text-red-400');

  // --- Render ---
  return (
    <div className="p-4 md:p-6 space-y-6 bg-black text-rokIvory min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <img src="/rok-ai-logo.png" alt="RokAi Logo" className="h-10" />
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
      </div>

      {/* FILTERS */}
      <div className="mb-6 p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* date range */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date Range:</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border bg-gray-800 p-2 rounded text-sm"
                max={endDate || dayjs().format('YYYY-MM-DD')}
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border bg-gray-800 p-2 rounded text-sm"
                min={startDate}
                max={dayjs().format('YYYY-MM-DD')}
              />
            </div>
          </div>
          {/* symbol filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Filter by Symbol:</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="border bg-gray-800 p-2 rounded text-sm w-full"
            >
              {uniqueSymbols.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => mutateDashboard()}
            disabled={dashboardIsLoading}
            className="px-4 py-2 bg-rokPurple rounded text-sm disabled:opacity-50"
          >
            {dashboardIsLoading ? 'Loading...' : 'Load Data'}
          </button>
        </div>
      </div>

      {/* DAILY P&L CHART */}
      <div className="p-4 bg-gray-900 shadow-lg rounded border border-gray-700">
        <h2 className="text-xl font-semibold mb-3">
          Daily Realized P&L ({selectedSymbol})
        </h2>
        {dailyPnlChartData.length ? (
          <Plot
            data={dailyPnlChartData as any}
            layout={{
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: '#D1D5DB' },
              xaxis: {
                title: 'Date',
                type: 'date',
                tickformat: '%Y-%m-%d',
                gridcolor: '#374151',
                linecolor: '#4B5563',
                zerolinecolor: '#4B5563',
              },
              yaxis: {
                title: 'Daily P&L ($)',
                tickprefix: '$',
                gridcolor: '#374151',
                linecolor: '#4B5563',
                zerolinecolor: '#4B5563',
              },
              margin: { l: 70, r: 50, t: 50, b: 50 },
              hovermode: 'x unified',
            }}
            useResizeHandler
            className="w-full h-[350px] md:h-[450px]"
            config={{ responsive: true }}
          />
        ) : (
          <p className="text-gray-500 text-center py-10">
            No realized P&L data to display.
          </p>
        )}
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-center">
          <div className="text-sm text-gray-400">Realized P&L</div>
          <div className={`text-2xl font-semibold ${pnlColor(filteredTotalRealizedPL)}`}>
            {formatCurrency(filteredTotalRealizedPL)}
          </div>
        </div>
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-center">
          <div className="text-sm text-gray-400">Unrealized P&L</div>
          <div className={`text-2xl font-semibold ${pnlColor(dashboardData.unrealizedPL)}`}>
            {formatCurrency(dashboardData.unrealizedPL)}
          </div>
        </div>
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-center">
          <div className="text-sm text-gray-400">Total Market Value</div>
          <div className="text-2xl font-semibold">
            {formatCurrency(dashboardData.totalMarketValue)}
          </div>
        </div>
      </div>

      {/* CANDLESTICK */}
      {candlestickSymbol && (
        <div className="p-4 bg-gray-900 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">
              Candlestick: {candlestickSymbol}
            </h2>
            <button
              onClick={() => setCandlestickSymbol(null)}
              className="text-xs hover:text-rokIvory"
            >
              &times; Close
            </button>
          </div>
          {barsIsLoading ? (
            <p className="text-center py-10 text-gray-400">Loading...</p>
          ) : barsError ? (
            <p className="text-center py-10 text-red-400">
              Error: {barsError.message}
            </p>
          ) : candlestickChartData.length ? (
            <Plot
              data={candlestickChartData as any}
              layout={{
                autosize: true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#D1D5DB' },
                xaxis: {
                  title: 'Date',
                  type: 'date',
                  tickformat: '%Y-%m-%d',
                  rangeslider: { visible: false },
                  gridcolor: '#374151',
                  linecolor: '#4B5563',
                  zerolinecolor: '#4B5563',
                },
                yaxis: {
                  title: 'Price ($)',
                  tickprefix: '$',
                  gridcolor: '#374151',
                  linecolor: '#4B5563',
                  zerolinecolor: '#4B5563',
                },
                margin: { l: 70, r: 50, t: 50, b: 50 },
                hovermode: 'x unified',
              }}
              useResizeHandler
              className="w-full h-[400px] md:h-[500px]"
              config={{ responsive: true }}
            />
          ) : (
            <p className="text-gray-500 text-center py-10">No data.</p>
          )}
        </div>
      )}

      {/* ...open positions, closed trades, winners/losers cards... */}
      {/* (kept exactly as in your original code) */}
    </div>
  );
}
