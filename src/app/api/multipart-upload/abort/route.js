import { NextResponse } from 'next/server';
import { S3Client, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';

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
    const { objectKey, uploadId } = await request.json();

    if (!objectKey || !uploadId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const command = new AbortMultipartUploadCommand({
      Bucket: 'videos',
      Key: objectKey,
      UploadId: uploadId,
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error aborting multipart upload:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
