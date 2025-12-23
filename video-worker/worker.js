export default {
  async fetch(req, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);

    // Generate presigned URL for upload
    if (req.method === 'POST' && url.pathname === '/presign') {
      try {
        const body = await req.json();
        const { fileName, fileType, fileSize } = body;

        if (!fileName || !fileType) {
          return new Response(JSON.stringify({ error: 'Missing fileName or fileType' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validate file type
        if (fileType !== 'video/mp4') {
          return new Response(JSON.stringify({ error: 'Only MP4 files are allowed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validate file size (200MB max)
        const maxSize = 200 * 1024 * 1024;
        if (fileSize && fileSize > maxSize) {
          return new Response(JSON.stringify({ error: 'File too large. Maximum size is 200MB' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}-${fileName}`;

        // Return upload URL (no presigning needed - we'll handle it in the PUT endpoint)
        return new Response(JSON.stringify({ 
          success: true, 
          fileName: uniqueFileName,
          uploadUrl: `${url.origin}/upload/${uniqueFileName}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Direct upload endpoint
    if (req.method === 'PUT' && url.pathname.startsWith('/upload/')) {
      try {
        const fileName = url.pathname.replace('/upload/', '');
        
        if (!fileName) {
          return new Response(JSON.stringify({ error: 'No filename provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Starting upload for file:', fileName);
        console.log('Content-Type:', req.headers.get('Content-Type'));
        console.log('Content-Length:', req.headers.get('Content-Length'));

        // Upload directly to R2
        await env.VIDEOS.put(fileName, req.body, {
          httpMetadata: { contentType: 'video/mp4' },
        });

        console.log('Upload successful for file:', fileName);

        return new Response(JSON.stringify({ success: true, fileName }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Upload error:', error);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({ 
          error: error.message,
          details: error.stack 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Legacy upload via FormData (kept for backward compatibility, but limited to 100MB)
    if (req.method === 'POST' && url.pathname === '/') {
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

        // Validate file size (100MB max for FormData uploads)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
          return new Response(JSON.stringify({ error: 'File too large. Use presigned upload for files over 100MB' }), {
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

    // Delete video endpoint
    if (req.method === 'DELETE' && url.pathname.startsWith('/delete/')) {
      try {
        const fileName = url.pathname.replace('/delete/', '');
        
        if (!fileName) {
          return new Response(JSON.stringify({ error: 'No filename provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Deleting file from R2:', fileName);

        // Delete from R2
        await env.VIDEOS.delete(fileName);

        console.log('File deleted successfully:', fileName);

        return new Response(JSON.stringify({ success: true, fileName }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Delete error:', error);
        return new Response(JSON.stringify({ 
          error: error.message,
          details: error.stack 
        }), {
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
