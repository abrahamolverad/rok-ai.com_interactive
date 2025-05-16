'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Papa from 'papaparse';

dayjs.extend(utc);

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false, loading: () => <div className="text-center py-10 text-gray-400">Loading Chart...</div> });

interface SimpleAlpacaBar { Timestamp: string | Date; OpenPrice: number; HighPrice: number; LowPrice: number; ClosePrice: number; Volume?: number; }
interface RealizedTradeOutput { Symbol: string; Type: 'Long' | 'Short'; EntryTime: string; ExitTime: string; Qty: number; EntryPrice: number; ExitPrice: number; Pnl: number; }
interface PositionInfo { Symbol: string; Qty: number; 'Avg Entry Price': number; 'Current Price': number; 'Market Value': number; 'Unrealized P&L': number; Side: 'long' | 'short'; }
interface DashboardData { openPositions: PositionInfo[]; unrealizedPL: number; totalMarketValue: number; totalRealizedPL: number; realizedTrades: RealizedTradeOutput[]; topWinners: RealizedTradeOutput[]; topLosers: RealizedTradeOutput[]; fetchErrors: string[]; dataTimestamp?: string; message?: string; }

const dashboardFetcher = async (url: string): Promise<DashboardData> => { const res = await fetch(url); if (!res.ok) throw new Error(`API Error: ${res.status}`); return res.json(); };
const barsFetcher = async (url: string): Promise<{ bars: SimpleAlpacaBar[] }> => { const res = await fetch(url); if (!res.ok) throw new Error(`API Error: ${res.status}`); return res.json(); };
const formatCurrency = (v: number|undefined|null) => (v===null||v===undefined||isNaN(v))?'$0.00':v.toLocaleString('en-US',{style:'currency',currency:'USD'});

export default function DashboardClient() {
  const [startDate,setStart]=useState(dayjs().subtract(30,'days').format('YYYY-MM-DD'));
  const [endDate,setEnd]=useState(dayjs().format('YYYY-MM-DD'));
  const [symbol,setSymbol]=useState('ALL');
  const [candleSym,setCandleSym]=useState<string|null>(null);

  const dashUrl=`/api/alpaca/dashboard?startDate=${startDate}&endDate=${endDate}`;
  const barsUrl=candleSym?`/api/alpaca/bars?symbol=${candleSym}&timeframe=1Day`:null;

  const {data:d,error:de,isLoading:dl,mutate}=useSWR<DashboardData>(dashUrl,dashboardFetcher,{revalidateOnFocus:false});
  const {data:bd,error:be,isLoading:bl}=useSWR<{bars:SimpleAlpacaBar[]}>(barsUrl??'',barsFetcher,{revalidateOnFocus:false,shouldRetryOnError:true});

  const uniqueSymbols=useMemo(()=>{ if(!d) return ['ALL']; const s=new Set<string>(); d.openPositions?.forEach(p=>s.add(p.Symbol)); d.realizedTrades?.forEach(t=>s.add(t.Symbol)); return ['ALL',...Array.from(s).sort()]; },[d]);
  const filtTrades=useMemo(()=>symbol==='ALL'?d?.realizedTrades??[]:(d?.realizedTrades??[]).filter(t=>t.Symbol===symbol),[d, symbol]);
  const filtRealPL=filtTrades.reduce((s,t)=>s+t.Pnl,0);

  /* --- UI omitted for brevity. keep your full JSX tables, charts, handlers here exactly as in your original component --- */

  return <div className="p-4 text-white">{/* your full dashboard JSX here */}</div>;
}