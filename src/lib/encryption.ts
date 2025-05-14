    // src/lib/encryption.ts
    import crypto from 'crypto';

    // --- Configuration ---
    const ALGORITHM = 'aes-256-gcm'; // Recommended algorithm
    const IV_LENGTH = 16; // Initialization Vector length for AES-GCM
    const AUTH_TAG_LENGTH = 16; // Authentication Tag length for AES-GCM

    // Function to get the key safely from environment variables
    function getKey(): Buffer | null {
        const keyHex = process.env.ENCRYPTION_KEY;
        if (!keyHex || typeof keyHex !== 'string' || keyHex.length !== 64) {
            console.error("FATAL: ENCRYPTION_KEY environment variable is missing or not a 64-character hex string (for 32 bytes).");
            // In production, you might want to throw an error here if the key is critical for startup
            // For development, returning null allows the app to load but encryption/decryption will fail later.
            return null;
        }
        try {
            return Buffer.from(keyHex, 'hex');
        } catch (e) {
            console.error("FATAL: Failed to parse ENCRYPTION_KEY hex string.", e);
            return null;
        }
    }


    /**
     * Encrypts plaintext using AES-256-GCM.
     * @param text The plaintext string to encrypt.
     * @returns A string containing iv, authTag, and encrypted data, separated by ':'. Returns null on error or if key is missing.
     */
    export function encrypt(text: string): string | null {
        const key = getKey(); // Get key when function is called
        if (!key) {
            console.error("Encryption failed: Encryption key is not available or invalid.");
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
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
        } catch (error) {
            console.error("Encryption error:", error);
            return null;
        }
    }

    /**
     * Decrypts data encrypted with the encrypt function (AES-256-GCM).
     * @param encryptedData The encrypted string (iv:authTag:encryptedText).
     * @returns The original plaintext string, or null if decryption fails or key is missing.
     */
    export function decrypt(encryptedData: string | null | undefined): string | null {
        const key = getKey(); // Get key when function is called
        if (!key) {
            console.error("Decryption failed: Encryption key is not available or invalid.");
            return null;
        }
        if (!encryptedData || typeof encryptedData !== 'string') {
            // Allow null/undefined input without logging an error, just return null
            if (encryptedData !== null && encryptedData !== undefined) {
                 console.error("Decryption failed: Invalid encrypted data input type.");
            }
            return null;
        }

        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                // Don't throw, just log and return null for bad format
                console.error("Decryption failed: Invalid encrypted data format.");
                return null;
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encryptedText = Buffer.from(parts[2], 'hex');

            // Basic length checks
            if (iv.length !== IV_LENGTH) { console.error("Decryption failed: Invalid IV length."); return null; }
            if (authTag.length !== AUTH_TAG_LENGTH) { console.error("Decryption failed: Invalid authTag length."); return null; }

            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(authTag); // Set the authentication tag for verification

            const decryptedBuffer = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

            return decryptedBuffer.toString('utf8');
        } catch (error) {
            // Catch errors like 'Unsupported state or unable to authenticate data' (wrong key/tampered data)
            console.error("Decryption error:", error);
            return null;
        }
    } // <-- This should be around line 98 - ensure no stray characters after this brace
    