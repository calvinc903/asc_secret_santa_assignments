export default {
  async fetch(req, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Upload video
    if (req.method === 'POST') {
      try {
        const form = await req.formData();
        const file = form.get('file');

        if (!file) {
          return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validate file type (MP4 only)
        if (file.type !== 'video/mp4') {
          return new Response(JSON.stringify({ error: 'Only MP4 files are allowed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validate file size (200MB max ~10 min video)
        const maxSize = 200 * 1024 * 1024; // 200MB in bytes
        if (file.size > maxSize) {
          return new Response(JSON.stringify({ error: 'File too large. Maximum size is 200MB (~10 minutes)' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;

        await env.VIDEOS.put(fileName, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        return new Response(JSON.stringify({ success: true, fileName }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Retrieve video
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const fileName = url.pathname.slice(1);

      if (!fileName) {
        return new Response('Not found', { status: 404, headers: corsHeaders });
      }

      // Check if file exists first
      const object = await env.VIDEOS.head(fileName);
      if (!object) {
        return new Response('Video not found', { status: 404, headers: corsHeaders });
      }

      const range = req.headers.get('Range');
      
      if (range) {
        // Handle range request for streaming
        const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
        if (!rangeMatch) {
          return new Response('Invalid range', { status: 416, headers: corsHeaders });
        }

        const start = parseInt(rangeMatch[1]);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : object.size - 1;
        
        const rangedObject = await env.VIDEOS.get(fileName, {
          range: { offset: start, length: end - start + 1 }
        });

        if (!rangedObject) {
          return new Response('Video not found', { status: 404, headers: corsHeaders });
        }

        return new Response(rangedObject.body, {
          status: 206,
          headers: {
            ...corsHeaders,
            'Content-Type': object.httpMetadata?.contentType || 'video/mp4',
            'Content-Range': `bytes ${start}-${end}/${object.size}`,
            'Content-Length': (end - start + 1).toString(),
            'Accept-Ranges': 'bytes',
          },
        });
      } else {
        // Full file request
        const fullObject = await env.VIDEOS.get(fileName);
        
        return new Response(fullObject.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': object.httpMetadata?.contentType || 'video/mp4',
            'Content-Length': object.size.toString(),
            'Accept-Ranges': 'bytes',
          },
        });
      }
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  },
};
