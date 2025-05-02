// src/app/api/alpaca/dashboard/route.ts (Conceptual Example using App Router)
import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';
import { getSession } from 'next-auth/react'; // Or your auth method
import { connectToDatabase, findUserById } from '@/lib/db'; // Your DB functions
import { decrypt } from '@/lib/encryption'; // Your decryption function
import { calculatePnlFromFills, getOpenPositions } from '@/lib/alpacaService'; // Your Alpaca logic functions

export async function GET(request: Request) {
    // --- 1. Authentication ---
    const session = await getSession({ req: request }); // Adjust based on your auth
    if (!session || !session.user?.id) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const userId = session.user.id;

    try {
        // --- 2. Get User Keys from DB ---
        await connectToDatabase();
        const user = await findUserById(userId);
        if (!user || !user.alpacaApiKeyEncrypted || !user.alpacaSecretKeyEncrypted) {
            return new NextResponse(JSON.stringify({ error: 'Alpaca keys not configured' }), { status: 400 });
        }

        // --- 3. Decrypt Keys ---
        const apiKey = decrypt(user.alpacaApiKeyEncrypted);
        const secretKey = decrypt(user.alpacaSecretKeyEncrypted);
        const paper = user.alpacaPaperTrading ?? true; // Default to paper if not set

        // --- 4. Initialize Alpaca Client ---
        const alpaca = new Alpaca({
            keyId: apiKey,
            secretKey: secretKey,
            paper: paper,
            // version: 'v2' // v2 is default
        });

        // --- 5. Fetch Data (Using helper functions) ---
        // These functions would contain the logic adapted from Python
        const openPositionsData = await getOpenPositions(alpaca); // Fetches positions
        const { pnlHistoryData, fetchErrors } = await calculatePnlFromFills(alpaca, /* date range params */); // Fetches fills & calculates PnL

        // --- 6. Prepare Response ---
        const responseData = {
            openPositions: openPositionsData,
            pnlHistory: pnlHistoryData,
            metrics: { /* Calculate metrics based on pnlHistoryData */ },
            fetchErrors: fetchErrors,
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("API Route Error:", error);
        // Distinguish between Alpaca API errors and other errors if possible
        const errorMessage = error.message || 'Internal Server Error';
        const statusCode = error.statusCode || 500; // Use Alpaca error code if available
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: statusCode });
    }
}
