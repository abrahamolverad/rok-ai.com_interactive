// src/lib/mongoConnect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local or your deployment environment'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
// Extend the NodeJS.Global interface to include mongoose
declare global {
  // eslint-disable-next-line no-var
  var mongooseDB: { // Renamed to avoid conflict with mongoose import
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseDB;

if (!cached) {
  cached = global.mongooseDB = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('MongoDB: Using cached connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
    };

    console.log('MongoDB: Creating new connection...');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('MongoDB: Connection successful!');
      return mongooseInstance;
    }).catch(error => {
      console.error('MongoDB: Connection error:', error);
      cached.promise = null; // Reset promise on error
      throw error; 
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; 
    throw e; 
  }
  
  if (!cached.conn) {
    // This case should ideally not be reached if connect throws on failure.
    // But as a safeguard:
    throw new Error("MongoDB connection failed and was not established.");
  }
  return cached.conn;
}

export default dbConnect;
