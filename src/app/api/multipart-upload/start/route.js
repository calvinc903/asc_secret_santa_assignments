import { NextResponse } from 'next/server';
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';

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
    const { userId, fileName, fileType } = await request.json();

    if (!userId || !fileName) {
      return NextResponse.json(
        { error: 'Missing userId or fileName' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const objectKey = `user/${userId}/${timestamp}-${fileName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: 'videos',
      Key: objectKey,
      ContentType: fileType,
    });

    const response = await s3Client.send(command);

    return NextResponse.json({
      uploadId: response.UploadId,
      objectKey,
    });
  } catch (error) {
    console.error('Error starting multipart upload:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
