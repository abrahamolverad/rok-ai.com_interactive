import mongoose from 'mongoose';

/**
 * Re-usable server-side helper that keeps a single MongoDB connection
 * across hot-reloads (Next.js) and serverless invocations (Render).
 */

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('❌  Missing MONGODB_URI environment variable');
}

// Global is used here to maintain a cached connection in dev / hot-reload
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = (global as any).mongooseCache;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as any).mongooseCache = cached;
}

export async function connectDb() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
