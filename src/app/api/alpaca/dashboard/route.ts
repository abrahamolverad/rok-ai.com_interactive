// src/app/api/alpaca/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Using path from NextAuth setup
// --- CORRECTED DB PATH ---
import { connectToDatabase } from '@/lib/db'; // Corrected path based on screenshot
// --- END CORRECTED DB PATH ---
import User from '@/models/User'; // Adjust path if needed
import { decrypt } from '@/lib/encryption'; // Adjust path if needed
import { getOpenPositions, fetchAndCalculatePnl } from '@/lib/alpacaService'; // Adjust path if needed
import Alpaca from '@alpacahq/alpaca-trade-api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export async function GET(request: Request) {
    console.log("--- ENTERING /api/alpaca/dashboard GET Handler ---");

    // --- Authentication Check ---
    let session;
    try {
        session = await getServerSession(authOptions);
    } catch (authError: any) {
         console.error("Error getting session (check authOptions export and path):", authError);
         return NextResponse.json({ message: `Authentication setup error: ${authError.message}` }, { status: 500 });
    }

    if (!session || !session.user || !session.user.id) {
        console.log("API request denied: No session or user ID found.");
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(`API request received for user: ${userId}`);

    let alpacaClient: Alpaca | null = null;

    try {
        // --- Database and User Check ---
        // Use the imported connectToDatabase function
        await connectToDatabase(); // This should now work
        console.log(`Fetching user data for ${userId} from DB...`);
        const user = await User.findById(userId).select('+alpacaApiKeyEncrypted +alpacaSecretKeyEncrypted +alpacaPaperTrading').lean();

        if (!user) {
            console.log(`User ${userId} not found in DB.`);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        console.log(`User data fetched from DB: Found`);

        // --- Alpaca Key Check ---
        if (!user.alpacaApiKeyEncrypted || !user.alpacaSecretKeyEncrypted) {
            console.log(`User ${userId} has not configured Alpaca keys.`);
            return NextResponse.json({
                message: "Alpaca API keys not configured.",
                openPositions: [], unrealizedPL: 0, totalMarketValue: 0, totalRealizedPL: 0,
                realizedTrades: [], topWinners: [], topLosers: [],
                fetchErrors: ['Keys not configured'], dataTimestamp: new Date().toISOString()
            }, { status: 200 });
        }

        // --- Initialize Alpaca Client ---
        const apiKey = decrypt(user.alpacaApiKeyEncrypted);
        const secretKey = decrypt(user.alpacaSecretKeyEncrypted);
        const paper = user.alpacaPaperTrading ?? true;
        console.log(`Keys decrypted for user ${userId}. Paper trading: ${paper}`);

        alpacaClient = new Alpaca({ keyId: apiKey, secretKey: secretKey, paper: paper });
        console.log(`Alpaca client initialized for user ${userId}`);

        // --- Get Date Range ---
        const { searchParams } = new URL(request.url);
        const endDateParam = searchParams.get('endDate') || dayjs().utc().format('YYYY-MM-DD');
        const startDateParam = searchParams.get('startDate') || dayjs(endDateParam).subtract(90, 'days').format('YYYY-MM-DD');
        const endDate = dayjs.utc(endDateParam).endOf('day').toDate();
        const startDate = dayjs.utc(startDateParam).startOf('day').toDate();
        console.log(`Fetching data for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`);

        // --- Fetch Data using Promise.allSettled ---
        const [openPositionsResult, pnlResult] = await Promise.allSettled([
            getOpenPositions(alpacaClient),
            fetchAndCalculatePnl(alpacaClient, startDate, endDate) // Using fetchAndCalculatePnl
        ]);

        // --- Process Results ---
        const openPositionsData = openPositionsResult.status === 'fulfilled'
            ? openPositionsResult.value
            : { data: [], total_upl: 0, total_mv: 0, error: openPositionsResult.reason?.message || 'Failed to fetch positions' };

        const pnlHistoryData = pnlResult.status === 'fulfilled'
            ? pnlResult.value
            : { data: [], fetchErrors: [pnlResult.reason?.message || 'Failed to fetch/calculate P&L'] };

        const allFetchErrors = [
             ...(openPositionsData.error ? [`Open Positions Error: ${openPositionsData.error}`] : []),
             ...(pnlHistoryData.fetchErrors || [])
        ];
        console.log(`Data fetch status: Positions=${openPositionsResult.status}, PnL=${pnlResult.status}. Errors: ${allFetchErrors.length}`);

        // --- Calculate Metrics ---
        const realizedTrades = pnlHistoryData.data || [];
        const totalRealizedPL = realizedTrades.reduce((sum, t) => sum + t.Pnl, 0);
        const sortedTrades = [...realizedTrades].sort((a, b) => b.Pnl - a.Pnl);
        const topWinners = sortedTrades.slice(0, 10);
        const topLosers = sortedTrades.slice(-10).reverse();

        // --- Construct Response ---
        const responsePayload = {
            openPositions: openPositionsData.data || [],
            unrealizedPL: openPositionsData.total_upl || 0,
            totalMarketValue: openPositionsData.total_mv || 0,
            totalRealizedPL: totalRealizedPL,
            realizedTrades: realizedTrades,
            topWinners: topWinners,
            topLosers: topLosers,
            fetchErrors: allFetchErrors,
            dataTimestamp: new Date().toISOString()
        };

        console.log("API route returning successful response.");
        return NextResponse.json(responsePayload, { status: 200 });

    } catch (error: any) {
        console.error(`API Route Error for user ${userId}:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.', error: error.message }, { status: 500 });
    }
}
