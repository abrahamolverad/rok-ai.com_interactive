// src/models/User.ts (Example)
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Define an interface representing a document in MongoDB.
export interface IUser extends Document {
  // --- Your existing user fields ---
  username: string;
  email: string;
  passwordHash: string; // Assuming you store hashed passwords
  createdAt: Date;
  updatedAt: Date;
  // --- End Existing Fields ---

  // --- NEW Fields for Alpaca Integration ---
  alpacaApiKeyEncrypted?: string; // Store encrypted key ID
  alpacaSecretKeyEncrypted?: string; // Store encrypted secret key
  alpacaPaperTrading: boolean; // Default to paper trading

  // --- NEW Fields for 2FA ---
  twoFactorSecretEncrypted?: string; // Store encrypted 2FA secret (e.g., base32)
  twoFactorEnabled: boolean; // Flag if 2FA is active for the user
}

// Define the schema corresponding to the document interface.
const UserSchema: Schema<IUser> = new Schema(
  {
    // --- Your existing schema definitions ---
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    // --- End Existing Definitions ---

    // --- NEW Schema Definitions ---
    alpacaApiKeyEncrypted: { type: String, required: false }, // Optional initially
    alpacaSecretKeyEncrypted: { type: String, required: false }, // Optional initially
    alpacaPaperTrading: { type: Boolean, default: true }, // Default to paper

    twoFactorSecretEncrypted: { type: String, required: false }, // Only present if 2FA is set up
    twoFactorEnabled: { type: Boolean, default: false }, // Default to disabled
  },
  {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true,
  }
);

// --- Mongoose Model ---
// Prevent model overwrite during Next.js hot reloading in development
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

// --- IMPORTANT NOTES ---
// 1. Encryption/Decryption:
//    - This schema ONLY defines the fields to store the *encrypted* data.
//    - You MUST implement encryption logic (e.g., using Node.js `crypto` or `crypto-js`)
//      in your API routes or service layer *before* saving data to MongoDB.
//    - Similarly, you MUST implement decryption logic *after* fetching the user document
//      and *before* using the API keys or 2FA secret.
//    - Use a strong, authenticated encryption algorithm like AES-GCM.
//    - Store your main encryption key SECURELY (e.g., in environment variables managed by Render).
//
// 2. Existing Fields:
//    - Replace the placeholder "Your existing user fields" and definitions with
//      the actual fields and types from your current User model.
//
// 3. Usage Example (Conceptual API Route):
//    import User from '@/models/User';
//    import { encrypt, decrypt } from '@/lib/encryption'; // Your helper functions
//
//    async function saveApiKeys(userId, apiKey, secretKey, isPaper) {
//      const encryptedApiKey = encrypt(apiKey);
//      const encryptedSecretKey = encrypt(secretKey);
//      await User.findByIdAndUpdate(userId, {
//        alpacaApiKeyEncrypted: encryptedApiKey,
//        alpacaSecretKeyEncrypted: encryptedSecretKey,
//        alpacaPaperTrading: isPaper,
//      });
//    }
//
//    async function getDecryptedKeys(userId) {
//      const user = await User.findById(userId);
//      if (!user || !user.alpacaApiKeyEncrypted || !user.alpacaSecretKeyEncrypted) {
//        throw new Error('Keys not found');
//      }
//      const apiKey = decrypt(user.alpacaApiKeyEncrypted);
//      const secretKey = decrypt(user.alpacaSecretKeyEncrypted);
//      return { apiKey, secretKey, isPaper: user.alpacaPaperTrading };
//    }
