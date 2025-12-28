'use server'

import { getDB } from './mongodb.js';
const config = require('../../config.js');

export async function getYoutubeVideosDB(query = {}) {
    const client = await getDB();
    const db = client.db(config.currentYearDatabase);
    const data = await db.collection('videos').find(query).toArray();
    return JSON.parse(JSON.stringify(data));
}

export async function postYoutubeVideoDB(user_id, assetId, playbackId) {
    const client = await getDB();
    const db = client.db(config.currentYearDatabase);
    const timestamp = new Date().toISOString();
    
    // First, get the old video data if it exists
    const existingVideo = await db.collection('videos').findOne({ user_id });
    const oldVideoURL = existingVideo ? existingVideo.videoURL : null;
    
    // Use updateOne with upsert to replace existing video or insert new one
    // Store both assetId (in videoURL for backward compatibility) and playbackId
    const result = await db.collection('videos').updateOne(
        { user_id },
        { $set: { 
            videoURL: assetId,  // Store assetId in videoURL field
            playbackId: playbackId,  // Store playbackId separately
            timestamp 
        } },
        { upsert: true }
    );
    
    return { 
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
        oldVideoURL: oldVideoURL
    };
}

export async function updateYoutubeVideoByUploadId(uploadId, updates) {
    const client = await getDB();
    const db = client.db(config.currentYearDatabase);
    const timestamp = new Date().toISOString();
    
    const result = await db.collection('videos').updateOne(
        { videoURL: uploadId },
        { $set: { ...updates, timestamp } }
    );
    
    return result;
}

// export async function patchYoutubeVideoDB(pairs) {
//     const client = await getDB();
//     const db = client.db('2025');
//     const timestamp = new Date().toISOString();
//     const documents = pairs.map(pair => ({ ...pair, timestamp }));
//     const result = await db.collection('youtue').insertMany(documents);
//     return { insertedCount: result.insertedCount };
// }