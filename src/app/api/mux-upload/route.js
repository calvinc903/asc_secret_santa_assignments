import { NextResponse } from 'next/server';
import mux from '@/lib/mux';

export async function POST(request) {
  try {
    const { userName } = await request.json();

    if (!userName) {
      return NextResponse.json(
        { error: 'userName is required' },
        { status: 400 }
      );
    }

    // Create a direct upload URL
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        passthrough: userName.toLowerCase(), // Store username as passthrough for tracking
      },
      cors_origin: '*', // Configure based on your domain in production
      timeout: 3600, // 1 hour timeout
    });

    return NextResponse.json({
      uploadId: upload.id,
      uploadUrl: upload.url,
    });
  } catch (error) {
    console.error('Mux upload creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}

// Check upload status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'uploadId is required' },
        { status: 400 }
      );
    }

    const upload = await mux.video.uploads.retrieve(uploadId);

    return NextResponse.json({
      status: upload.status,
      assetId: upload.asset_id,
      error: upload.error,
    });
  } catch (error) {
    console.error('Mux upload status error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload status' },
      { status: 500 }
    );
  }
}
