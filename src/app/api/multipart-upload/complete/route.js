import { NextResponse } from 'next/server';
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

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
    const { objectKey, uploadId, parts } = await request.json();

    if (!objectKey || !uploadId || !parts) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: 'videos',
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    const response = await s3Client.send(command);

    return NextResponse.json({
      success: true,
      location: response.Location,
    });
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
