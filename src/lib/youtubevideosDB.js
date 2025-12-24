'use server'

import { getDB } from './mongodb.js';

export async function getYoutubeVideosDB(query = {}) {
    const client = await getDB();
    const db = client.db('2025');
    const data = await db.collection('videos').find(query).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postYoutubeVideoDB(user_id, videoURL) {
    const client = await getDB();
    const db = client.db('2025');
    const timestamp = new Date().toISOString();
    
    // First, get the old video URL if it exists
    const existingVideo = await db.collection('videos').findOne({ user_id });
    const oldVideoURL = existingVideo ? existingVideo.videoURL : null;
    
    // Use updateOne with upsert to replace existing video or insert new one
    const result = await db.collection('videos').updateOne(
        { user_id },
        { $set: { videoURL, timestamp } },
        { upsert: true }
    );
    
    return { 
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
        oldVideoURL: oldVideoURL
    };
}

// export async function patchYoutubeVideoDB(pairs) {
//     const client = await getDB();
//     const db = client.db('2025');
//     const timestamp = new Date().toISOString();
//     const documents = pairs.map(pair => ({ ...pair, timestamp }));
//     const result = await db.collection('youtue').insertMany(documents);
//     return { insertedCount: result.insertedCount };
// }