import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // We only throw at connection time (not import time) so builds don't fail
  // before env vars are configured.
  console.warn(
    "MONGODB_URI is not set. Add it to .env.local before using database features."
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Reuse the connection across hot reloads in dev, and across serverless
// invocations where the module stays warm.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};
global._mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not set. Add it to your .env.local file."
      );
    }
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "blackpearl",
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
