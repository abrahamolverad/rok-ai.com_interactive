'use client'; // Required for useEffect, useState, useSWR

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Papa from 'papaparse';

dayjs.extend(utc);

/* ────────────────────────────────────────────────────────── */
/* Dynamically import Plotly (cast as any to silence TS)      */
const Plot = dynamic<any>(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-10 text-gray-400">Loading Chart...</div>
  ),
}) as any;
/* ────────────────────────────────────────────────────────── */

/* ---------- Local types ---------- */
interface SimpleAlpacaBar {
  Timestamp: string | Date;
  OpenPrice: number;
  HighPrice: number;
  LowPrice: number;
  ClosePrice: number;
  Volume?: number;
}

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

/* ---------- Fetch helpers ---------- */
const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(message || `API error ${res.status}`);
  }
  return res.json();
};

const fmt$ = (v: number | null | undefined) =>
  v == null || isNaN(v)
    ? '$0.00'
    : v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/* ===================================================================== */
/*                                COMPONENT                              */
/* ===================================================================== */
export default function DashboardClient() {
  /* ----- State ----- */
  const [startDate, setStart]   = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEnd]       = useState(dayjs().format('YYYY-MM-DD'));
  const [symbol, setSymbol]     = useState('ALL');
  const [candleSym, setCandle]  = useState<string | null>(null);

  /* ----- URLs ----- */
  const dashURL = `/api/alpaca/dashboard?startDate=${startDate}&endDate=${endDate}`;
  const barURL  = candleSym
    ? `/api/alpaca/bars?symbol=${candleSym}&timeframe=1Day`
    : null;

  /* ----- SWR ----- */
  const { data: d, error: de, isLoading: dl, mutate } =
    useSWR<DashboardData>(dashURL, fetchJson, { revalidateOnFocus: false });

  const { data: bd, error: be, isLoading: bl } =
    useSWR<{ bars: SimpleAlpacaBar[] }>(barURL ?? '', fetchJson, {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
    });

  /* ---------- Derived lists ---------- */
  const symbols = useMemo(() => {
    if (!d) return ['ALL'];
    const set = new Set<string>();
    d.openPositions?.forEach((p) => set.add(p.Symbol));
    d.realizedTrades?.forEach((t) => set.add(t.Symbol));
    return ['ALL', ...Array.from(set).sort()];
  }, [d]);

  const trades = useMemo(
    () =>
      symbol === 'ALL'
        ? d?.realizedTrades ?? []
        : (d?.realizedTrades ?? []).filter((t) => t.Symbol === symbol),
    [d, symbol],
  );

  const realizedPL = trades.reduce((s, t) => s + t.Pnl, 0);

  const dailyBars = useMemo(() => {
    if (!trades.length) return [];
    const byDate: Record<string, number> = {};
    trades.forEach((t) => {
      const key = dayjs(t.ExitTime).format('YYYY-MM-DD');
      byDate[key] = (byDate[key] || 0) + t.Pnl;
    });
    const dates = Object.keys(byDate).sort();
    return [
      {
        x: dates,
        y: dates.map((d) => byDate[d]),
        type: 'bar',
        marker: { color: dates.map((d) => (byDate[d] >= 0 ? '#8b5cf6' : '#ec4899')) },
        text: dates.map((d) => fmt$(byDate[d])),
        textposition: 'auto',
      },
    ];
  }, [trades]);

  /* ---------- UI helpers ---------- */
  const colorPL = (v: number) => (v >= 0 ? 'text-green-400' : 'text-red-400');

  const downloadCsv = () => {
    if (!trades.length) {
      alert('No trades to export.');
      return;
    }
    const csv = Papa.unparse(
      trades.map((t) => ({
        ...t,
        EntryTime: dayjs(t.EntryTime).format('YYYY-MM-DD HH:mm:ss'),
        ExitTime:  dayjs(t.ExitTime).format('YYYY-MM-DD HH:mm:ss'),
      })),
      { header: true },
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `trades_${symbol}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Loading/error ---------- */
  if (dl) return <div className="text-white p-6">Loading…</div>;
  if (de) return <div className="text-red-400 p-6">Error: {de.message}</div>;

  if (!d) return null; // safety

  /* ---------- Render ---------- */
  return (
    <div className="p-4 md:p-6 space-y-6 bg-black text-rokIvory min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <img src="/rok-ai-logo.png" alt="Logo" className="h-10" />
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-900 rounded border border-gray-700 mb-6">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          {/* Date range */}
          <div>
            <label className="text-sm text-gray-400">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStart(e.target.value)}
              className="bg-gray-800 p-2 rounded text-sm w-full"
              max={endDate}
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-gray-800 p-2 rounded text-sm w-full"
              min={startDate}
              max={dayjs().format('YYYY-MM-DD')}
            />
          </div>
          {/* Symbol */}
          <div>
            <label className="text-sm text-gray-400">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-gray-800 p-2 rounded text-sm w-full"
            >
              {symbols.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          className="mt-4 px-4 py-2 bg-rokPurple rounded"
        >
          Reload
        </button>
      </div>

      {/* Daily P&L */}
      <div className="p-4 bg-gray-900 rounded border border-gray-700">
        <h2 className="text-xl font-semibold mb-3">
          Daily Realized P&L ({symbol})
        </h2>
        {dailyBars.length ? (
          <Plot
            data={dailyBars as any}
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
                title: 'P&L ($)',
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
            No data for this period.
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-center">
          <div className="text-sm text-gray-400 uppercase">Realized P&L</div>
          <div className={`text-2xl font-semibold ${colorPL(realizedPL)}`}>
            {fmt$(realizedPL)}
          </div>
        </div>
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-center">
          <div className="text-sm text-gray-400 uppercase">Unrealized P&L</div>
          <div className={`text-2xl font-semibold ${colorPL(d.unrealizedPL)}`}>
            {fmt$(d.unrealizedPL)}
          </div>
        </div>
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-center">
          <div className="text-sm text-gray-400 uppercase">Market Value</div>
          <div className="text-2xl font-semibold">
            {fmt$(d.totalMarketValue)}
          </div>
        </div>
      </div>

      {/* Closed trades CSV */}
      <button
        onClick={downloadCsv}
        className="px-4 py-2 bg-teal-500 rounded hover:bg-teal-600"
      >
        Export CSV
      </button>

      {/* ...open positions, closed trades, candlestick, winners/losers... */}
      {/* You can keep adding your tables/charts here exactly as before */}
    </div>
  );
}
