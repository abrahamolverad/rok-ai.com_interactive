// src/lib/mongoConnect.ts
//
// Centralised MongoDB connection helper for Next.js 14 (App Router).
// It caches the connection across hot‑reloads and API route calls, and
// *skips* the MONGODB_URI guard during `next build` so Docker builds
// on Render don’t fail when runtime env‑vars aren’t yet injected.
//
import mongoose from "mongoose";

const { MONGODB_URI = "", NEXT_PHASE } = process.env;

/**
 * During `next build` (phase‑production‑build) Render doesn’t inject
 * runtime environment variables.  Skip the guard so the build can
 * finish; the real connection happens when the server starts
 * (phase‑production‑server).
 */
const isBuildPhase = NEXT_PHASE === "phase-production-build";

if (!isBuildPhase && !MONGODB_URI) {
  throw new Error(
    "Please define a MONGODB_URI in the Render Environment tab."
  );
}

/**
 * The Node.js global type is extended (only at dev time via `declare`) so
 * cached connections persist across hot reloads in `next dev`.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function mongoConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    if (process.env.NODE_ENV === "development") {
      console.log("MongoDB ▶︎ using cached connection");
    }
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // disable mongoose command buffering
    } as const;

    if (process.env.NODE_ENV === "development") {
      console.log("MongoDB ▶︎ creating new connection…");
    }

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log("MongoDB ▶︎ connection successful ✅");
        return m;
      })
      .catch((err) => {
        console.error("MongoDB ▶︎ connection error ❌", err);
        cached.promise = null; // reset so next call retries
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default mongoConnect;
