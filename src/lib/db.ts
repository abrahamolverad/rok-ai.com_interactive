// src/lib/db.ts
import mongoose from 'mongoose';

// Retrieve MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Extend the NodeJS Global type to include mongoose cache property
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    // console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      // Add other mongoose connection options if needed
      // useNewUrlParser: true, // No longer needed in Mongoose 6+
      // useUnifiedTopology: true, // No longer needed in Mongoose 6+
    };

    console.log('Attempting new MongoDB connection...');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully!');
      return mongooseInstance;
    }).catch(error => {
        console.error("MongoDB connection error:", error);
        cached.promise = null; // Reset promise on error
        throw error; // Re-throw error to indicate connection failure
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise if connection failed
    throw e; // Re-throw error
  }

  return cached.conn;
}

export { connectToDatabase };

// Optional: Export a promise for the MongoDB client directly if needed by other libraries (like next-auth adapter)
// import { MongoClient } from 'mongodb';
// const client = new MongoClient(MONGODB_URI!);
// export const clientPromise = client.connect();

