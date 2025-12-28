import { NextResponse } from 'next/server';
import mux from '@/lib/mux';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId is required' },
        { status: 400 }
      );
    }

    const asset = await mux.video.assets.retrieve(assetId);

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Mux asset retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve asset' },
      { status: 500 }
    );
  }
}
