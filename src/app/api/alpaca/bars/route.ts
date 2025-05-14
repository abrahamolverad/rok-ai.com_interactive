// src/app/api/alpaca/bars/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed
import User from '@/models/User'; // Adjust path if needed
import { decrypt } from '@/lib/encryption'; // Adjust path if needed
import Alpaca from '@alpacahq/alpaca-trade-api';
import { AlpacaBarsV2RequestParams, AlpacaBar } from '@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2'; // Import types
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween'; // Needed for market hours check

dayjs.extend(utc);
dayjs.extend(isBetween);

// Basic cache for bar data (can be improved)
const barsCache = new Map<string, { data: AlpacaBar[], timestamp: number }>();
const BARS_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache for 5 minutes

export async function GET(request: Request) {
    console.log("--- ENTERING /api/alpaca/bars GET Handler ---");
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1Day'; // Default to daily bars
    const startDateParam = searchParams.get('startDate'); // For daily bars
    const endDateParam = searchParams.get('endDate'); // For daily bars
    const lookbackHoursParam = searchParams.get('lookbackHours'); // For intraday bars

    if (!symbol) {
        return NextResponse.json({ message: 'Symbol parameter is required' }, { status: 400 });
    }

    // Determine start/end based on timeframe
    let startDateISO: string;
    let endDateISO: string;
    const now = dayjs.utc();

    if (timeframe !== '1Day' && lookbackHoursParam) {
        // Intraday request (e.g., last 24 hours)
        const lookbackHours = parseInt(lookbackHoursParam, 10) || 24;
        startDateISO = now.subtract(lookbackHours, 'hour').toISOString();
        endDateISO = now.toISOString();
        console.log(`Intraday request: ${symbol}, ${timeframe}, Last ${lookbackHours} hours`);
    } else if (startDateParam && endDateParam) {
        // Daily request using provided dates
        startDateISO = dayjs.utc(startDateParam).startOf('day').toISOString();
        endDateISO = dayjs.utc(endDateParam).endOf('day').toISOString();
         console.log(`Daily request: ${symbol}, ${timeframe}, ${startDateParam} to ${endDateParam}`);
    } else {
        return NextResponse.json({ message: 'Either lookbackHours (for intraday) or startDate/endDate (for daily) parameters are required' }, { status: 400 });
    }


    // --- Cache Key ---
    const dateCachePart = timeframe === '1Day' ? `${startDateParam}_${endDateParam}` : `last${lookbackHoursParam}h`;
    const cacheKey = `bars_${userId}_${symbol}_${timeframe}_${dateCachePart}`;
    const currentTime = Date.now();

    // --- Check Cache ---
    const cachedEntry = barsCache.get(cacheKey);
    if (cachedEntry && (currentTime - cachedEntry.timestamp < BARS_CACHE_DURATION_MS)) {
        console.log(`Cache HIT for bars: ${cacheKey}`);
        return NextResponse.json({ bars: cachedEntry.data }, { status: 200 });
    }
    console.log(`Cache MISS for bars: ${cacheKey}`);

    try {
        // --- Get User Keys ---
        const user = await User.findById(userId).select('+alpacaApiKeyEncrypted +alpacaSecretKeyEncrypted +alpacaPaperTrading').lean();
        if (!user || !user.alpacaApiKeyEncrypted || !user.alpacaSecretKeyEncrypted) {
            return NextResponse.json({ message: 'Alpaca keys not configured or user not found' }, { status: 403 });
        }
        const apiKey = decrypt(user.alpacaApiKeyEncrypted);
        const secretKey = decrypt(user.alpacaSecretKeyEncrypted);
        const alpaca = new Alpaca({ keyId: apiKey, secretKey: secretKey, paper: false }); // Use live data source

        // --- Prepare Bar Request Params ---
        const params: AlpacaBarsV2RequestParams = {
            timeframe: timeframe as any,
            start: startDateISO,
            end: endDateISO,
            limit: 1000, // Fetch up to 1000 bars
        };
        console.log(`Fetching bars for ${symbol} with params:`, params);

        // --- Fetch Bars ---
        const bars: AlpacaBar[] = [];
        for await (const bar of alpaca.getBarsV2(symbol, params)) {
            bars.push(bar);
        }
        console.log(`Fetched ${bars.length} bars for ${symbol}`);

        // --- Store in Cache ---
         barsCache.set(cacheKey, { data: bars, timestamp: currentTime });
         console.log(`Cached bars data for key: ${cacheKey}`);

        return NextResponse.json({ bars }, { status: 200 });

    } catch (error: any) {
        console.error(`Error fetching bars for ${symbol} (User: ${userId}):`, error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch bar data';
        return NextResponse.json({ message: `Failed to fetch bar data: ${errorMessage}` }, { status: 500 });
    }
}
