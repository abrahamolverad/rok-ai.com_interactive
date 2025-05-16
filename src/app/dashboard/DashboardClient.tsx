'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
interface Summary {
  realized: number;
  unrealized: number;
  marketValue: number;
}

interface EquityPoint {
  date: string; // ISO date
  pnl: number;  // cumulative P&L
}

interface Position {
  symbol: string;
  qty: number;
  entry: number;
  last: number;
  unrealized: number;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
export default function DashboardClient() {
  const today     = dayjs().format('YYYY-MM-DD');
  const aMonthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const [from,     setFrom]     = useState<string>(aMonthAgo);
  const [to,       setTo]       = useState<string>(today);
  const [strategy, setStrategy] = useState<string>('Swing');
  const [symbol,   setSymbol]   = useState<string>('ALL');

  const [summary,      setSummary]      = useState<Summary | null>(null);
  const [equityCurve,  setEquityCurve]  = useState<EquityPoint[]>([]);
  const [positions,    setPositions]    = useState<Position[]>([]);
  const [loading,      setLoading]      = useState<boolean>(false);

  /* ------------------------- Fetch dashboard ----------------------------- */
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, strategy, symbol });
      const res    = await fetch(`/api/dashboard?${params.toString()}`);

      if (!res.ok) throw new Error('Failed to fetch dashboard data');

      const { summary: s, equityCurve: ec, positions: p } = await res.json();
      setSummary(s); setEquityCurve(ec); setPositions(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); /* eslint-disable-next-line */ }, []);

  /* --------------------------- helpers ----------------------------------- */
  const renderSummaryCard = (title: string, value: number) => (
    <Card className="flex-1 text-center shadow-md">
      <CardContent className="py-6">
        <p className="text-sm uppercase tracking-wide mb-2 text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-semibold">
          {value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
      </CardContent>
    </Card>
  );

  /* ------------------------------ UI ------------------------------------- */
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header ----------------------------------------------------------- */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <span className="text-xl font-mono">RokAi</span>
      </header>

      {/* Filters ---------------------------------------------------------- */}
      <section className="flex flex-wrap gap-4 items-end">
        {/* from */}
        <div>
          <label className="block text-xs mb-1">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>

        {/* to */}
        <div>
          <label className="block text-xs mb-1">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        {/* strategy (now native <select>) */}
        <div>
          <label className="block text-xs mb-1">Strategy</label>
          <select
            className="h-10 w-36 rounded-lg border border-rokGrayBorder bg-rokGrayInput px-3 text-sm"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            {['Swing', 'Day', 'Options'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* symbol */}
        <div>
          <label className="block text-xs mb-1">Symbol</label>
          <Input
            placeholder="ALL or e.g. AAPL"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </div>

        {/* buttons */}
        <Button onClick={fetchDashboard} disabled={loading} className="h-10">
          {loading ? 'Loading…' : 'Reload'}
        </Button>
        <Button
          variant="secondary"
          className="h-10 ml-auto"
          onClick={() =>
            window.location.assign(
              `/api/exportCsv?from=${from}&to=${to}&strategy=${strategy}&symbol=${symbol}`
            )
          }
        >
          Export CSV
        </Button>
      </section>

      {/* Summary ---------------------------------------------------------- */}
      {summary && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderSummaryCard('Realized P&L',  summary.realized)}
          {renderSummaryCard('Unrealized P&L', summary.unrealized)}
          {renderSummaryCard('Market Value',   summary.marketValue)}
        </section>
      )}

      {/* Equity Curve ----------------------------------------------------- */}
      {equityCurve.length > 0 && (
        <section className="w-full h-72 bg-white/5 p-4 rounded-2xl shadow-inner">
          <h2 className="text-lg mb-2">Equity Curve</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={equityCurve}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('MMM D')} />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                formatter={(val: number) =>
                  val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                }
              />
              <Line type="monotone" dataKey="pnl" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Positions -------------------------------------------------------- */}
      {positions.length > 0 && (
        <section>
          <h2 className="text-lg mb-2">Open Positions</h2>
          <div className="overflow-x-auto rounded-2xl shadow-inner">
            <table className="w-full text-sm bg-white/5">
              <thead className="uppercase text-muted-foreground text-xs bg-white/10">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Entry</th>
                  <th className="p-2 text-right">Last</th>
                  <th className="p-2 text-right">Unrealized</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.symbol} className="border-b border-white/10 hover:bg-white/10">
                    <td className="p-2 font-mono">{pos.symbol}</td>
                    <td className="p-2 text-right">{pos.qty}</td>
                    <td className="p-2 text-right">${pos.entry.toFixed(2)}</td>
                    <td className="p-2 text-right">${pos.last.toFixed(2)}</td>
                    <td
                      className={`p-2 text-right ${
                        pos.unrealized >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {pos.unrealized.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
