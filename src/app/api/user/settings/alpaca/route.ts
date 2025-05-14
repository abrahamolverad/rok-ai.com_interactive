// src/app/api/user/settings/alpaca/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"; // Use getServerSession for server-side session access
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import your auth options
import { connectToDatabase } from '@/lib/db'; // Your DB connection helper
import User from '@/models/User'; // Your Mongoose User model
import { encrypt } from '@/lib/encryption'; // Your encryption helper
import traceback from 'traceback'; // Import traceback for detailed error logging

export async function POST(request: Request) {
    console.log("--- ENTERING /api/user/settings/alpaca POST Handler ---"); // <-- ADDED LOG

    // --- 1. Authentication & Get User ID ---
    let session;
    try {
        console.log("Attempting to get session server-side for POST..."); // <-- ADDED LOG
        session = await getServerSession(authOptions);
        console.log("getServerSession result for POST:", session); // <-- ADDED LOG (Check if null or has user)
    } catch (sessionError: any) {
        console.error("Error getting session in POST route:", sessionError);
        return new NextResponse(JSON.stringify({ error: 'Session error.' }), { status: 500 });
    }


    if (!session || !session.user?.id) { // Check for user and user ID in session
        console.warn("API access denied in POST: No session found or session missing user ID."); // <-- Modified Log
        return new NextResponse(JSON.stringify({ error: 'Unauthorized: User not logged in.' }), { status: 401 });
    }
    const userId = session.user.id; // Get user ID from session/token
    console.log(`API settings POST request received for user: ${userId}`); // <-- ADDED LOG


    // --- 2. Parse Request Body ---
    let payload;
    try {
        payload = await request.json();
        const { apiKeyId, secretKey, isPaper } = payload;

        // Basic validation
        if (!apiKeyId || typeof apiKeyId !== 'string' || !secretKey || typeof secretKey !== 'string' || typeof isPaper !== 'boolean') {
            console.warn(`Invalid input data received for user ${userId}`);
            return new NextResponse(JSON.stringify({ error: 'Invalid input data. Required fields: apiKeyId (string), secretKey (string), isPaper (boolean).' }), { status: 400 });
        }
         console.log(`Parsed payload for user ${userId}: isPaper=${isPaper}`); // <-- ADDED LOG
    } catch (error) {
        console.error(`Error parsing JSON body for user ${userId}:`, error);
        return new NextResponse(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 });
    }

    // --- 3. Encrypt Keys ---
    console.log(`Encrypting keys for user ${userId}...`); // <-- ADDED LOG
    const encryptedApiKey = encrypt(payload.apiKeyId);
    const encryptedSecretKey = encrypt(payload.secretKey);

    if (!encryptedApiKey || !encryptedSecretKey) {
        console.error(`Encryption failed for user ${userId}. Check ENCRYPTION_KEY environment variable.`);
        return new NextResponse(JSON.stringify({ error: 'Internal server error during key encryption.' }), { status: 500 });
    }
    console.log(`Keys encrypted successfully for user ${userId}`); // <-- ADDED LOG

    // --- 4. Save to Database ---
    try {
        console.log(`Connecting to DB to save keys for user ${userId}...`); // <-- ADDED LOG
        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: { // Use $set to update only specified fields
                    alpacaApiKeyEncrypted: encryptedApiKey,
                    alpacaSecretKeyEncrypted: encryptedSecretKey,
                    alpacaPaperTrading: payload.isPaper,
                }
            },
            { new: true, upsert: false } // Return updated doc, don't create if not found
        );

        if (!updatedUser) {
            console.error(`User not found in DB during settings save for ID: ${userId}`);
            return new NextResponse(JSON.stringify({ error: 'User not found.' }), { status: 404 });
        }

        console.log(`Successfully updated Alpaca keys for user ${userId}`); // <-- ADDED LOG
        return NextResponse.json({ message: 'Alpaca settings saved successfully!' });

    } catch (error: any) {
        console.error(`Database error saving Alpaca keys for user ${userId}:`, error);
        return new NextResponse(JSON.stringify({ error: 'Database error saving settings.' }), { status: 500 });
    }
}

// Optional: Add GET handler if you want to fetch current settings (e.g., just the isPaper value)
// export async function GET(request: Request) { ... }
