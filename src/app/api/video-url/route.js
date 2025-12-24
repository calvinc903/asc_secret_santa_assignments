import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { objectKey } = await request.json();

    if (!objectKey) {
      return NextResponse.json(
        { error: 'Missing objectKey' },
        { status: 400 }
      );
    }

    // Generate pre-signed GET URL (expires in 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: 'videos',
      Key: objectKey,
    });

    const viewUrl = await getSignedUrl(s3Client, getCommand, { 
      expiresIn: 7 * 24 * 3600, // 7 days
    });

    return NextResponse.json({
      viewUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
