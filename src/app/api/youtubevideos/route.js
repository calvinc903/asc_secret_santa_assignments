import { getYoutubeVideosDB, postYoutubeVideoDB } from '../../../lib/youtubevideosDB';
import { NextResponse } from 'next/server';

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
        
        // Check if it's a YouTube URL or a Cloudflare filename
        let videoIdentifier;
        if (videoURL.includes('youtube.com') || videoURL.includes('youtu.be')) {
            // It's a YouTube URL, extract the video ID
            videoIdentifier = extractVideoId(videoURL);
        } else {
            // It's a Cloudflare filename, use it directly
            videoIdentifier = videoURL;
        }
        
        const result = await postYoutubeVideoDB(user_id, videoIdentifier);
        console.log(user_id, videoIdentifier);
        
        // If there was an old video and it's a Cloudflare file (not YouTube), delete it from R2
        if (result.oldVideoURL && !result.oldVideoURL.includes('youtube') && result.oldVideoURL !== videoIdentifier) {
            try {
                console.log('Deleting old video from Cloudflare:', result.oldVideoURL);
                const deleteResponse = await fetch(`https://video-worker.ascsecretsanta.workers.dev/delete/${result.oldVideoURL}`, {
                    method: 'DELETE'
                });
                if (deleteResponse.ok) {
                    console.log('Old video deleted successfully');
                } else {
                    console.error('Failed to delete old video:', await deleteResponse.text());
                }
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