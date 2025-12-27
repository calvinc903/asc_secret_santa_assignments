import Mux from '@mux/mux-node';
import { updateYoutubeVideoByUploadId } from '@/lib/youtubevideosDB';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('mux-signature');
    
    // Verify webhook signature (optional but recommended for production)
    // const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
    // if (webhookSecret && signature) {
    //   const isValid = Mux.Webhooks.verifyHeader(body, signature, webhookSecret);
    //   if (!isValid) {
    //     return Response.json({ error: 'Invalid signature' }, { status: 401 });
    //   }
    // }

    const event = JSON.parse(body);
    console.log('Received Mux webhook:', event.type, 'Event ID:', event.id);

    // Respond immediately with 200 to avoid timeout
    // Process async operations after response
    setImmediate(async () => {
      try {
        switch (event.type) {
          case 'video.upload.asset_created':
            // Upload completed and asset created
            const uploadId = event.object.id;  // Upload ID from object.id
            const assetId = event.data.asset_id;  // Asset ID from data.asset_id
            
            console.log(`Upload ${uploadId} created asset ${assetId}`);
            
            // Update database: replace uploadId with assetId in videoURL field
            const updateResult1 = await updateYoutubeVideoByUploadId(uploadId, {
              videoURL: assetId,
            });
            console.log(`Updated videoURL from uploadId to assetId:`, updateResult1);
            break;

          case 'video.asset.ready':
            // Asset is processed and ready for playback
            const readyAssetId = event.object.id;  // Asset ID from object.id
            const playbackIds = event.data.playback_ids;
            const playbackId = playbackIds?.[0]?.id;
            
            console.log(`Asset ${readyAssetId} is ready with playback ID ${playbackId}`);
            
            if (playbackId) {
              // Find the video record by assetId (stored in videoURL) and add playbackId
              const updateResult2 = await updateYoutubeVideoByUploadId(readyAssetId, {
                playbackId: playbackId,
              });
              console.log(`Added playbackId to asset ${readyAssetId}:`, updateResult2);
            }
            break;

          case 'video.asset.errored':
            // Asset processing failed
            const errorAssetId = event.object.id;
            const errors = event.data.errors;
            console.error(`Asset ${errorAssetId} failed:`, errors);
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
      } catch (asyncError) {
        console.error('Async webhook processing error:', asyncError);
      }
    });

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to update by assetId
async function updateYoutubeVideoByAssetId(assetId, updates) {
  const { getDB } = await import('@/lib/mongodb');
  const client = await getDB();
  const db = client.db('2025');
  const collection = db.collection('videos');
  
  await collection.updateOne(
    { videoURL: assetId },
    { $set: updates }
  );
}
