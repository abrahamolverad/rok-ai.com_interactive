// src/lib/encryption.ts
import crypto from 'crypto';

// --- Configuration ---
// IMPORTANT: Store your *actual* encryption key securely as an environment variable.
//            DO NOT hardcode it here or commit it to Git.
//            Generate a strong, random key (e.g., 32 bytes for AES-256).
//            Example generation in Node: crypto.randomBytes(32).toString('hex')
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY; // Must be set in .env.local / Render Env Vars
const ALGORITHM = 'aes-256-gcm'; // Recommended algorithm
const IV_LENGTH = 16; // Initialization Vector length for AES-GCM
const AUTH_TAG_LENGTH = 16; // Authentication Tag length for AES-GCM

if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64) {
    // Throw an error during server startup if the key is missing or invalid
    // In development, you might want a less strict check or a default dev key,
    // but ensure production always requires a valid key.
    console.error("FATAL: ENCRYPTION_KEY environment variable is missing or not a 64-character hex string (for 32 bytes).");
    // Optionally throw an error to prevent startup without a key in production:
    // throw new Error("Encryption key is not configured correctly.");
}

// Convert hex key to Buffer only once
const key = ENCRYPTION_KEY_HEX ? Buffer.from(ENCRYPTION_KEY_HEX, 'hex') : Buffer.alloc(32); // Use alloc as fallback only if error isn't thrown

/**
 * Encrypts plaintext using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns A string containing iv, authTag, and encrypted data, separated by ':'. Returns null on error.
 */
export function encrypt(text: string): string | null {
    if (!ENCRYPTION_KEY_HEX) {
        console.error("Encryption failed: ENCRYPTION_KEY is not set.");
        return null;
    }
    if (text === null || text === undefined) {
        console.error("Encryption failed: Input text is null or undefined.");
        return null;
    }

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encryptedBuffer = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Combine IV, authTag, and encrypted data into a single string for storage
        // Using hex encoding is common and safe for storing in DB
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
    } catch (error) {
        console.error("Encryption error:", error);
        return null;
    }
}

/**
 * Decrypts data encrypted with the encrypt function (AES-256-GCM).
 * @param encryptedData The encrypted string (iv:authTag:encryptedText).
 * @returns The original plaintext string, or null if decryption fails.
 */
export function decrypt(encryptedData: string): string | null {
     if (!ENCRYPTION_KEY_HEX) {
        console.error("Decryption failed: ENCRYPTION_KEY is not set.");
        return null;
    }
    if (!encryptedData || typeof encryptedData !== 'string') {
        console.error("Decryption failed: Invalid encrypted data input.");
        return null;
    }

    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error("Invalid encrypted data format. Expected iv:authTag:encryptedText");
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = Buffer.from(parts[2], 'hex');

        // Basic length checks
        if (iv.length !== IV_LENGTH) throw new Error("Invalid IV length");
        if (authTag.length !== AUTH_TAG_LENGTH) throw new Error("Invalid authTag length");

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag); // Set the authentication tag for verification

        const decryptedBuffer = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

        return decryptedBuffer.toString('utf8');
    } catch (error) {
        console.error("Decryption error:", error);
        // Return null specifically on decryption errors (like wrong key or tampered data)
        // to avoid exposing details or returning partial data.
        return null;
    }
}
s
