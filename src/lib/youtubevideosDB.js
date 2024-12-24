'use server'

import { getDB } from './mongodb.js';

export async function getYoutubeVideosDB(query = {}) {
    const client = await getDB();
    const db = client.db('2024');
    const data = await db.collection('youtube').find(query).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postYoutubeVideoDB(user_id, videoURL) {
    const client = await getDB();
    const db = client.db('2024');
    const timestamp = new Date().toISOString();
    const result = await db.collection('youtube').insertOne({ user_id, videoURL, timestamp });
    return { insertedId: result.insertedId };
}

// export async function patchYoutubeVideoDB(pairs) {
//     const client = await getDB();
//     const db = client.db('2024');
//     const timestamp = new Date().toISOString();
//     const documents = pairs.map(pair => ({ ...pair, timestamp }));
//     const result = await db.collection('youtue').insertMany(documents);
//     return { insertedCount: result.insertedCount };
// }