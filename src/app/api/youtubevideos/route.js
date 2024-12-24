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
        
        const result = await postYoutubeVideoDB(user_id, extractVideoId(videoURL));
        console.log(user_id, videoURL);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to post youtube video' }, { status: 500 });
    }
}

function extractVideoId(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  }