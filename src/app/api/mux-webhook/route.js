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

    // Process webhook synchronously to avoid race conditions
    try {
      switch (event.type) {
          case 'video.asset.ready':
            // Asset is processed and ready for playback
            const readyAssetId = event.object.id;  // Asset ID
            const playbackIds = event.data.playback_ids;
            const playbackId = playbackIds?.[0]?.id;
            const passthrough = event.data.passthrough;  // Contains user_id (recipient)
            
            console.log(`Asset ${readyAssetId} is ready with playback ID ${playbackId}`);
            console.log(`Passthrough user_id: ${passthrough}`);
            
            if (!playbackId) {
              console.error(`WARNING: No playbackId found in webhook event`);
              break;
            }

            if (!passthrough) {
              console.error(`WARNING: No passthrough user_id found in webhook event`);
              break;
            }

            // Check if user already has a video
            const { getDB } = await import('@/lib/mongodb');
            const client = await getDB();
            const db = client.db('2025');
            const collection = db.collection('videos');
            
            const existingVideo = await collection.findOne({ user_id: passthrough });
            let oldAssetId = null;

            if (existingVideo && existingVideo.videoURL) {
              oldAssetId = existingVideo.videoURL;
              console.log(`User ${passthrough} has existing video with assetId: ${oldAssetId}`);
            }

            // Update or create MongoDB entry with new video
            const timestamp = new Date().toISOString();
            await collection.updateOne(
              { user_id: passthrough },
              { 
                $set: { 
                  videoURL: readyAssetId,
                  playbackId: playbackId,
                  timestamp 
                } 
              },
              { upsert: true }
            );
            console.log(`Updated/created video entry for user ${passthrough}`);

            // Delete old Mux asset if it exists and is different from new one
            if (oldAssetId && oldAssetId !== readyAssetId) {
              try {
                console.log(`Deleting old Mux asset: ${oldAssetId}`);
                await mux.video.assets.delete(oldAssetId);
                console.log(`Successfully deleted old Mux asset: ${oldAssetId}`);
              } catch (deleteError) {
                console.error(`Failed to delete old Mux asset ${oldAssetId}:`, deleteError);
                // Don't fail the webhook if deletion fails
              }
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
    } catch (processingError) {
      console.error('Webhook processing error:', processingError);
      return Response.json({ error: processingError.message }, { status: 500 });
    }

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
