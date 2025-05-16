// src/app/dashboard/DashboardClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isoWeek from "dayjs/plugin/isoWeek";
import { Config, Data, Layout } from "plotly.js";

dayjs.extend(utc);
dayjs.extend(isoWeek);

// ───────────────────────────────────────── Plotly helper
interface PlotParams {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  [key: string]: any;
}
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

// ───────────────────────────────────────── Fetch helper
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ───────────────────────────────────────── DTOs
interface Bar {
  t: string; o: number; h: number; l: number; c: number; v: number;
}
interface Position {
  symbol: string; qty: number; avg_entry_price: number; current_price: number; market_value: number; unrealized_pl: number;
}
interface Trade {
  symbol: string; qty: number; side: "buy" | "sell"; filled_at: string; filled_avg_price: number; realized_pl: number;
}

// ───────────────────────────────────────── Component
export default function DashboardClient() {
  // Local state
  const [symbolFilter, setSymbolFilter] = useState("ALL");
  const [strategy,     setStrategy]     = useState("day");
  const [start,        setStart]        = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"));
  const [end,          setEnd]          = useState(dayjs().format("YYYY-MM-DD"));
  const [timeFrame,    setTimeFrame]    = useState("1Day");

  // URLs
  const barsUrl = useMemo(() => {
    if (symbolFilter === "ALL") return null;
    const qs = new URLSearchParams({ symbol: symbolFilter, tf: timeFrame, start, end, strategy });
    return `/api/alpaca/bars?${qs.toString()}`;
  }, [symbolFilter, timeFrame, start, end, strategy]);

  const dashboardUrl = useMemo(() => {
    const qs = new URLSearchParams({ start, end });
    if (symbolFilter !== "ALL") qs.append("symbol", symbolFilter);
    return `/api/dashboard?${qs.toString()}`;
  }, [start, end, symbolFilter]);

  // Data
  const { data: bars }      = useSWR<Bar[]>(barsUrl, barsUrl ? fetcher : null);
  const { data: dashboard } = useSWR(dashboardUrl, fetcher);

  // Candlestick transform
  const candlestick = useMemo(() => {
    if (!bars?.length) return null;
    return {
      x: bars.map(b => b.t),
      open: bars.map(b => b.o),
      high: bars.map(b => b.h),
      low: bars.map(b => b.l),
      close: bars.map(b => b.c),
      type: "candlestick" as const,
      name: symbolFilter,
      increasing: { line: { width: 1 } },
      decreasing: { line: { width: 1 } },
    };
  }, [bars, symbolFilter]);

  // Helpers
  const money = (n:number)=>`$${n.toFixed(2)}`;

  // ------------------- Render functions
  const renderPositions = () => !dashboard?.openPositions?.length ? (
    <p>No open positions</p>
  ) : (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-600">
          <th className="px-2 py-1 text-left">Symbol</th>
          <th className="px-2 py-1 text-right">Qty</th>
          <th className="px-2 py-1 text-right">Avg Entry</th>
          <th className="px-2 py-1 text-right">Current</th>
          <th className="px-2 py-1 text-right">Mkt Value</th>
          <th className="px-2 py-1 text-right">Unrealized P&L</th>
        </tr>
      </thead>
      <tbody>
        {dashboard.openPositions.map((p:Position)=>(
          <tr key={p.symbol} className="border-b border-neutral-800">
            <td className="px-2 py-1">{p.symbol}</td>
            <td className="px-2 py-1 text-right">{p.qty.toLocaleString()}</td>
            <td className="px-2 py-1 text-right">{money(p.avg_entry_price)}</td>
            <td className="px-2 py-1 text-right">{money(p.current_price)}</td>
            <td className="px-2 py-1 text-right">{money(p.market_value)}</td>
            <td className={`px-2 py-1 text-right ${p.unrealized_pl>=0?"text-green-400":"text-red-400"}`}>{money(p.unrealized_pl)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderClosedTrades = () => !dashboard?.closedTrades?.length ? (
    <p>No closed trades</p>
  ) : (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-600">
          <th className="px-2 py-1 text-left">Symbol</th>
          <th className="px-2 py-1 text-right">Qty</th>
          <th className="px-2 py-1 text-right">Side</th>
          <th className="px-2 py-1 text-right">Avg Price</th>
          <th className="px-2 py-1 text-right">Realized P&L</th>
          <th className="px-2 py-1 text-right">Date</th>
        </tr>
      </thead>
      <tbody>
        {dashboard.closedTrades.map((t:Trade,idx:number)=>(
          <tr key={idx} className="border-b border-neutral-800">
            <td className="px-2 py-1">{t.symbol}</td>
            <td className="px-2 py-1 text-right">{t.qty}</td>
            <td className="px-2 py-1 text-right capitalize">{t.side}</td>
            <td className="px-2 py-1 text-right">{money(t.filled_avg_price)}</td>
            <td className={`px-2 py-1 text-right ${t.realized_pl>=0?"text-green-400":"text-red-400"}`}>{money(t.realized_pl)}</td>
            <td className="px-2 py-1 text-right">{dayjs(t.filled_at).format("YYYY-MM-DD")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // ───────────────────────────────────────── JSX
  return (
    <div className="mx-auto max-w-5xl p-4 text-neutral-50">
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>

      {/* Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 text-sm">
        {/* Start */}
        <label className="flex flex-col">
          <span className="mb-1">Start</span>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1" />
        </label>
        {/* End */}
        <label className="flex flex-col">
          <span className="mb-1">End</span>
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1" />
        </label>
        {/* Symbol */}
        <label className="flex flex-col col-span-2 sm:col-span-1">
          <span className="mb-1">Symbol</span>
          <input type="text" placeholder="ALL or AAPL" value={symbolFilter} onChange={e=>setSymbolFilter(e.target.value.toUpperCase())} className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1" />
        </label>
        {/* Strategy */}
        <label className="flex flex-col">
          <span className="mb-1">Strategy</span>
          <select value={strategy} onChange={e=>setStrategy(e.target.value)} className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1">
            <option value="day">Day</option>
            <option value="swing">Swing</option>
            <option value="options">Options</option>
          </select>
        </label>
        <div className="flex flex-col">
          <label className="text-sm mb-1">TF</label>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1"
          >
            <option value="1Hour">1H</option>
            <option value="1Day">1D</option>
            <option value="1Week">1W</option>
          </select>
        </div>
      </div>

      {/* Market summary */}
      {dashboard && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">P&L Summary</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <p>
              <span className="font-medium">Realized P&L:</span>
              <span className={dashboard.realized >= 0 ? "text-green-400" : "text-red-400"}>
                ${dashboard.realized.toFixed(2)}
              </span>
            </p>
            <p>
              <span className="font-medium">Unrealized P&L:</span>
              <span className={dashboard.unrealized >= 0 ? "text-green-400" : "text-red-400"}>
                ${dashboard.unrealized.toFixed(2)}
              </span>
            </p>
            <p>
              <span className="font-medium">Market Value:</span> ${dashboard.marketValue.toLocaleString()}
            </p>
          </div>
        </section>
      )}

      {/* Candlestick */}
      {candlestick && (
        <div className="rounded-lg border border-neutral-700">
          <Plot
            data={[candlestick]}
            layout={{
              autosize: true,
              paper_bgcolor: "#111",
              plot_bgcolor: "#111",
              font: { color: "#e5e5e5" },
              margin: { t: 30, r: 15, l: 40, b: 30 },
              title: `${symbolFilter} – ${timeFrame}`,
              xaxis: { rangeslider: { visible: false } },
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: 400 }}
            config={{ displayModeBar: false }}
          />
        </div>
      )}

      {/* Open positions */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Open Positions</h2>
        {renderPositions()}
      </section>

      {/* Closed trades */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Closed Trades</h2>
        {renderClosedTrades()}
      </section>
    </div>
  );
}
