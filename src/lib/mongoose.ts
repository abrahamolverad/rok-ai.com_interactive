import mongoose from 'mongoose';

/**
 * Re-usable helper that keeps a single MongoDB connection across
 * hot-reloads (Next.js dev) and serverless invocations (Render).
 *
 * Key change: we only check MONGODB_URI *when connectDb() is called*,
 * so next build can import the file even if the env var isn’t set yet.
 */

let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = (global as any).mongooseCache ?? { conn: null, promise: null };

(global as any).mongooseCache = cached;

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('❌  Missing MONGODB_URI environment variable');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
