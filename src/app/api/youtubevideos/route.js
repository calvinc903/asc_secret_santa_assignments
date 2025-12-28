import { getYoutubeVideosDB, postYoutubeVideoDB } from '../../../lib/youtubevideosDB';
import { NextResponse } from 'next/server';
import mux from '@/lib/mux';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = {};
        if (searchParams.has('user_id')) {
            query.user_id = searchParams.get('user_id');
        }
        console.log('GET /api/youtubevideos - Query:', query);
        const data = await getYoutubeVideosDB(query);
        console.log('GET /api/youtubevideos - Found:', data.length, 'videos');
        return NextResponse.json(data);
    } catch (error) {
        console.error('GET /api/youtubevideos - Error:', error);
        return NextResponse.json({ error: 'Failed to fetch youtube video', details: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { user_id, assetId, playbackId } = await request.json();
        
        // Get the old video data BEFORE updating database
        const { getDB } = await import('../../../lib/mongodb');
        const client = await getDB();
        const db = client.db('2025');
        const existingVideo = await db.collection('videos').findOne({ user_id });
        const oldVideoURL = existingVideo ? existingVideo.videoURL : null;
        
        // Delete old Mux asset BEFORE saving new one
        if (oldVideoURL && oldVideoURL !== assetId) {
            // Check if it looks like a Mux ID (not an R2 path)
            const isMuxId = !oldVideoURL.includes('/') && !oldVideoURL.includes('.');
            
            if (isMuxId) {
                console.log('Attempting to delete old Mux resource:', oldVideoURL);
                
                // Try to delete as asset first (most common case after webhook updates)
                try {
                    await mux.video.assets.delete(oldVideoURL);
                    console.log('✅ Old Mux asset deleted successfully:', oldVideoURL);
                } catch (assetError) {
                    // If it fails, it might be an uploadId, try canceling as upload
                    console.log('Not an asset, trying to cancel as upload...');
                    try {
                        await mux.video.uploads.cancel(oldVideoURL);
                        console.log('✅ Old Mux upload cancelled successfully:', oldVideoURL);
                    } catch (uploadError) {
                        console.error('❌ Failed to delete/cancel old Mux resource:', oldVideoURL, uploadError.message);
                        // Don't fail the whole request if deletion fails
                    }
                }
            } else {
                console.log('⏭️  Skipping deletion of old R2 object (not a Mux resource):', oldVideoURL);
            }
        } else if (oldVideoURL === assetId) {
            console.log('ℹ️  Old videoURL matches new uploadId, skipping deletion');
        }
        
        // Now save the new video to database
        const result = await postYoutubeVideoDB(user_id, assetId, playbackId);
        console.log('Saved Mux video for user:', user_id, 'uploadId/assetId:', assetId, 'playbackId:', playbackId);
        
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error posting video:', error);
        return NextResponse.json({ error: 'Failed to post video', details: error.message }, { status: 500 });
    }
}

function extractVideoId(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
    } catch {
        // If URL parsing fails, return the original string
        return url;
    }
}