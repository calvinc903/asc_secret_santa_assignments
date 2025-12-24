import { getYoutubeVideosDB, postYoutubeVideoDB } from '../../../lib/youtubevideosDB';
import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = {};
        if (searchParams.has('user_id')) {
            query.user_id = searchParams.get('user_id');
        }
        const data = await getYoutubeVideosDB(query);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch youtube video' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { user_id, videoURL } = await request.json();
        
        // videoURL is now the objectKey (e.g., "user/John/1234567890-video.mp4")
        const result = await postYoutubeVideoDB(user_id, videoURL);
        console.log('Saved video for user:', user_id, 'objectKey:', videoURL);
        
        // If there was an old video, delete it from R2
        if (result.oldVideoURL && result.oldVideoURL !== videoURL) {
            try {
                console.log('Deleting old video from R2:', result.oldVideoURL);
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: 'videos',
                    Key: result.oldVideoURL,
                });
                await s3Client.send(deleteCommand);
                console.log('Old video deleted successfully');
            } catch (deleteError) {
                console.error('Error deleting old video:', deleteError);
                // Don't fail the whole request if deletion fails
            }
        }
        
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