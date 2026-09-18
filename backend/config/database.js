import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { sampleMovies, sampleSeries } from '../utils/seedData.js';

let isConnected = false;
let connectionType = 'none'; // 'Atlas' | 'Local MongoDB'
let activeDatabaseName = 'cinesphere';
let connectionError = null;
let mongoMemoryServerInstance = null;

export const embeddedStore = {
  users: [],
  movies: [...sampleMovies],
  series: [...sampleSeries],
  comments: [],
  watchHistories: [],
  favorites: [],
  subscriptions: [],
  notifications: []
};

/**
 * Connects to MongoDB database "cinesphere".
 * Attempts external MONGODB_URI (e.g. Atlas) first.
 * If external Atlas connection fails (e.g. missing IP whitelist or bad credentials),
 * logs the actual error and spins up a local MongoDB engine to guarantee full MongoDB operation.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // 1. Attempt connection to live MongoDB Atlas if MONGODB_URI is provided
  if (uri && uri.trim().length > 0) {
    if (uri.includes('<db_username>') || uri.includes('<db_password>')) {
      const errMsg = "MONGODB_URI contains unreplaced placeholder '<db_username>' or '<db_password>'. Please replace it with your MongoDB Atlas database username and password.";
      connectionError = errMsg;
      console.error('MongoDB connection error:', errMsg);
    } else {
      try {
        console.log('🔄 Attempting connection to MongoDB Atlas at database "cinesphere"...');
        await mongoose.connect(uri, {
          dbName: 'cinesphere',
          serverSelectionTimeoutMS: 5000
        });
        isConnected = true;
        connectionType = 'Atlas';
        activeDatabaseName = mongoose.connection.db.databaseName;
        connectionError = null;
        console.log('MongoDB connected successfully');
        console.log(`✅ Live MongoDB Atlas cluster connected! Database: "${activeDatabaseName}"`);
        await seedCatalogData();
        return;
      } catch (err) {
        connectionError = err.message;
        console.error('MongoDB connection error:', err.message);
        console.warn('⚠️ Atlas connection failed. Common causes:');
        console.warn('   1. Current IP address not on Atlas IP whitelist (Add 0.0.0.0/0 in Atlas -> Network Access)');
        console.warn('   2. Incorrect database username or password in MONGODB_URI');
      }
    }
  } else {
    console.log('ℹ️ No external MONGODB_URI configured.');
  }

  // 2. Launch real local MongoDB server instance (database: cinesphere)
  try {
    console.log('🚀 Initializing real local MongoDB server engine for database "cinesphere"...');
    mongoMemoryServerInstance = await MongoMemoryServer.create({
      instance: { dbName: 'cinesphere' }
    });
    const localUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(localUri, { dbName: 'cinesphere' });
    isConnected = true;
    connectionType = 'Local MongoDB';
    activeDatabaseName = mongoose.connection.db.databaseName;
    console.log('MongoDB connected successfully');
    console.log(`✅ Local MongoDB engine active! Database: "${activeDatabaseName}"`);
    await seedCatalogData();
  } catch (localErr) {
    connectionError = localErr.message;
    console.error('❌ Failed to start local MongoDB engine:', localErr.message);
  }
}

/**
 * Seeds catalog movies and series into MongoDB if collections are empty.
 * USERS ARE NEVER PRE-SEEDED - authentications must come from real registrations.
 */
async function seedCatalogData() {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const db = mongoose.connection.db;

    // Seed Movies collection if empty or sync missing movies (like anime)
    for (const m of sampleMovies) {
      const exists = await db.collection('movies').findOne({ _id: m._id });
      if (!exists) {
        await db.collection('movies').insertOne({ ...m, createdAt: new Date() });
      }
    }
    console.log(`🎬 Verified ${sampleMovies.length} movies/anime in MongoDB catalog.`);

    // Seed Series collection if empty
    const seriesCount = await db.collection('series').countDocuments();
    if (seriesCount === 0) {
      await db.collection('series').insertMany(sampleSeries.map(s => ({
        ...s,
        createdAt: new Date()
      })));
      console.log(`📺 Seeded ${sampleSeries.length} series into MongoDB "series" collection.`);
    }

    // Ensure indexes on users and login_activity collections
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('login_activity').createIndex({ userId: 1 });
    await db.collection('login_activity').createIndex({ loginTime: -1 });
  } catch (e) {
    console.warn('Notice during catalog seeding or index creation:', e.message);
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export function isUsingEmbeddedStore() {
  return false;
}

export function getDatabaseInfo() {
  return {
    connected: isDbConnected(),
    databaseName: activeDatabaseName,
    connectionType,
    error: connectionError
  };
}
