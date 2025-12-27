import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { playbackId } = await request.json();

    if (!playbackId) {
      return NextResponse.json(
        { error: 'Missing playbackId' },
        { status: 400 }
      );
    }

    // Mux playback URLs are public and don't expire (if using public playback policy)
    // Format: https://stream.mux.com/{PLAYBACK_ID}.m3u8
    const viewUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    return NextResponse.json({
      viewUrl,
      playbackId, // Return playbackId for Mux Player component
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
