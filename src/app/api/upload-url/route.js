import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export async function POST(request) {
  try {
    const { userId, fileName, fileSize, fileType } = await request.json();

    if (!userId || !fileName) {
      return NextResponse.json(
        { error: 'Missing userId or fileName' },
        { status: 400 }
      );
    }

    // Validate file type
    if (fileType !== 'video/mp4') {
      return NextResponse.json(
        { error: 'Only MP4 files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB' },
        { status: 400 }
      );
    }

    // Generate unique object key: user/{userId}/{timestamp}-{fileName}
    const timestamp = Date.now();
    const objectKey = `user/${userId}/${timestamp}-${fileName}`;

    // Generate pre-signed PUT URL (expires in 1 hour)
    const putCommand = new PutObjectCommand({
      Bucket: 'videos',
      Key: objectKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, { 
      expiresIn: 3600,
    });

    return NextResponse.json({
      uploadUrl,
      objectKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
