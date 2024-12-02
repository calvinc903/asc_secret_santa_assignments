'use server';

import { MongoClient } from 'mongodb';

let client = null;

export async function getDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  if (!client) {
    client = new MongoClient(uri);

    // Initialize the client connection promise
    await client.connect()
      .then(() => {
        console.log('Successfully connected to MongoDB Atlas');
        return client;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  return client;
}