// src/app/api/user/settings/alpaca/route.ts
import { NextResponse } from 'next/server';
import { getSession } from 'next-auth/react'; // --- Replace with your actual session/auth logic ---
import { connectToDatabase } from '@/lib/db'; // Your DB connection helper
import User from '@/models/User'; // Your Mongoose User model
import { encrypt } from '@/lib/encryption'; // Your encryption helper

// --- IMPORTANT: Protect this route! Ensure only authenticated users can call it ---
// You might use middleware or check the session directly.

export async function POST(request: Request) {
    // --- 1. Authentication & Get User ID ---
    // Implement your actual authentication check here
    const session = await getSession({ req: request }); // Example using next-auth
    if (!session || !session.user?.id) { // Adjust based on your session structure
        return new NextResponse(JSON.stringify({ error: 'Unauthorized: User not logged in.' }), { status: 401 });
    }
    const userId = session.user.id; // Get user ID from session/token

    // --- 2. Parse Request Body ---
    let payload;
    try {
        payload = await request.json();
        const { apiKeyId, secretKey, isPaper } = payload;

        // Basic validation
        if (!apiKeyId || typeof apiKeyId !== 'string' || !secretKey || typeof secretKey !== 'string' || typeof isPaper !== 'boolean') {
            return new NextResponse(JSON.stringify({ error: 'Invalid input data. Required fields: apiKeyId (string), secretKey (string), isPaper (boolean).' }), { status: 400 });
        }
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 });
    }

    // --- 3. Encrypt Keys ---
    const encryptedApiKey = encrypt(payload.apiKeyId);
    const encryptedSecretKey = encrypt(payload.secretKey);

    if (!encryptedApiKey || !encryptedSecretKey) {
        console.error(`Encryption failed for user ${userId}. Check ENCRYPTION_KEY.`);
        return new NextResponse(JSON.stringify({ error: 'Internal server error during key encryption.' }), { status: 500 });
    }

    // --- 4. Save to Database ---
    try {
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
            { new: true } // Return the updated document (optional)
        );

        if (!updatedUser) {
            return new NextResponse(JSON.stringify({ error: 'User not found.' }), { status: 404 });
        }

        console.log(`Successfully updated Alpaca keys for user ${userId}`);
        return NextResponse.json({ message: 'Alpaca settings saved successfully!' });

    } catch (error: any) {
        console.error(`Database error saving Alpaca keys for user ${userId}:`, error);
        return new NextResponse(JSON.stringify({ error: 'Database error saving settings.' }), { status: 500 });
    }
}

// Optional: Add GET handler if you want to fetch current settings (e.g., just the isPaper value)
// export async function GET(request: Request) { ... }
