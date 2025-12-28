import { NextResponse } from 'next/server';
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    const { objectKey, uploadId, partNumber } = await request.json();

    if (!objectKey || !uploadId || !partNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const command = new UploadPartCommand({
      Bucket: 'videos',
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error('Error generating part upload URL:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
