# Client-Side Video Transcoding Implementation

## Overview
This implementation adds client-side video transcoding using ffmpeg.wasm to automatically convert user-uploaded videos to a Safari/Chrome/Firefox compatible MP4 format (H.264 + AAC + faststart) before uploading to storage.

## Architecture

### Components Added

1. **`src/lib/clientTranscode.ts`** - Core transcoding module
   - Singleton ffmpeg instance management
   - Multi-thread (MT) and single-thread (ST) support detection
   - H.264/AAC transcoding with web-optimized settings
   - Progress tracking callbacks

2. **`scripts/copy-ffmpeg-assets.js`** - Asset downloader
   - Downloads ffmpeg core files from CDN to `/public/ffmpeg/`
   - Runs automatically on `npm install` via postinstall hook
   - Manual run: `node scripts/copy-ffmpeg-assets.js`

3. **Updated `src/app/submitvideo/page.tsx`** - UI integration
   - Accepts any video format (not just MP4)
   - Shows transcoding progress before upload
   - Caches transcoded file to avoid re-transcoding on retry

4. **Updated `next.config.ts`** - Security headers
   - COOP/COEP headers for `/submitvideo` route
   - Enables SharedArrayBuffer for multi-thread ffmpeg

## How It Works

### Transcoding Flow
```
1. User selects video file
   ↓
2. File validation (any video format, size check)
   ↓
3. Click Submit → Start transcoding
   ↓
4. FFmpeg converts to H.264+AAC MP4
   ↓
5. Upload transcoded file to R2
   ↓
6. Save metadata to MongoDB
```

### FFmpeg Settings
```bash
ffmpeg -i input \
  -c:v libx264              # H.264 video codec
  -pix_fmt yuv420p          # Safari-compatible pixel format
  -profile:v main           # Main profile for compatibility
  -crf 23                   # Quality (18-28, 23 is balanced)
  -preset veryfast          # Speed optimization for client-side
  -c:a aac                  # AAC audio codec
  -b:a 128k                 # Audio bitrate
  -movflags +faststart      # Progressive playback (metadata at start)
  output.mp4
```

## Browser Compatibility

### Multi-Thread Mode (Fast)
**Requirements:**
- `crossOriginIsolated === true` (via COOP/COEP headers)
- `SharedArrayBuffer` support
- Modern browsers: Chrome 92+, Firefox 89+, Safari 15.2+

### Single-Thread Mode (Fallback)
**Works on:**
- All browsers supporting WebAssembly
- Older browsers without SharedArrayBuffer
- Environments without COOP/COEP headers
- **Slower but universally compatible**

### Automatic Fallback
The implementation automatically tries MT first, then falls back to ST if MT fails.

## Security Headers (COOP/COEP)

### Why Required?
- **SharedArrayBuffer** (needed for multi-thread) requires a secure cross-origin isolated context
- This prevents Spectre-like attacks by isolating the page from other origins
- Enforced via COOP and COEP headers

### Implementation
Applied in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/submitvideo',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ];
}
```

### Self-Hosting Core Assets
**Why?** COEP blocks cross-origin resources without proper CORS/CORP headers.

**Solution:** Core files are downloaded to `/public/ffmpeg/` during install and served from same origin.

## Usage

### For Developers

**Initial Setup:**
```bash
npm install
# Automatically downloads ffmpeg core assets via postinstall
```

**Manual Asset Download:**
```bash
node scripts/copy-ffmpeg-assets.js
```

**Development:**
```bash
npm run dev
# Navigate to /submitvideo
# Upload any video format - transcoding happens automatically
```

### For Users

1. Go to video submission page
2. Select any video format (MOV, AVI, MKV, MP4, etc.)
3. Click Submit
4. Watch transcoding progress ("Converting video for web playback: X%")
5. Upload happens automatically after transcoding

**Note:** Large videos (>200MB) may take several minutes to transcode on slower devices.

## Error Handling

### Common Errors

**"Failed to load ffmpeg"**
- Core assets missing from `/public/ffmpeg/`
- Run: `node scripts/copy-ffmpeg-assets.js`

**"Video conversion failed"**
- Corrupt video file
- Unsupported codec (rare with ffmpeg)
- Out of memory on device
- Solution: Try a different video or smaller file

**COEP Blocking Assets**
- Trying to load from CDN instead of self-hosted
- Verify files exist in `/public/ffmpeg/`

**"Out of memory"**
- Device has insufficient RAM for large video
- Happens on mobile with 500MB+ videos
- Solution: Use smaller video or desktop browser

## Performance

### Transcoding Speed (Approximate)
- **Multi-thread:** ~1-2 minutes per 100MB
- **Single-thread:** ~3-5 minutes per 100MB
- **Varies by:** Device CPU, video resolution, codec complexity

### File Size Changes
- Usually **reduces** file size (better compression)
- MOV/AVI often 30-50% smaller as MP4
- Already-optimized MP4s may increase slightly

### Memory Usage
- Loads entire video into browser memory
- Peak usage: ~2-3x video file size
- 500MB video → ~1-1.5GB RAM needed

## Technical Details

### Why Client-Side Transcoding?

**Pros:**
- No server load/cost for transcoding
- Works with any backend (already have R2 upload)
- User sees instant feedback
- Scales infinitely (users' devices do the work)

**Cons:**
- Slower than server-side (user devices vary)
- Drains mobile battery
- May fail on low-end devices

### FFmpeg.wasm Versions
- `@ffmpeg/ffmpeg`: ^0.12.15
- `@ffmpeg/util`: ^0.12.2
- Core: 0.12.6 (downloaded from unpkg)

### Caching Strategy
- Singleton ffmpeg instance (loaded once per page session)
- Transcoded file cached in state (re-use on upload retry)
- Core assets cached by browser (30MB WASM)

## Troubleshooting

### Check Multi-Thread Support
Open browser console on `/submitvideo`:
```javascript
console.log('MT supported:', globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined');
```

### Verify Core Assets
Check that these exist:
- `/public/ffmpeg/ffmpeg-core.js`
- `/public/ffmpeg/ffmpeg-core.wasm`

### Test Transcoding
```typescript
import { transcodeToMp4 } from '@/lib/clientTranscode';

const file = // ... get File from input
const converted = await transcodeToMp4(file, (pct) => {
  console.log(`Progress: ${pct}%`);
});
console.log('Done:', converted);
```

## Future Enhancements

1. **Smart Skip:** Detect already-optimal MP4s and skip transcoding
2. **Progressive Upload:** Start uploading while still transcoding
3. **Worker Pool:** Transcode multiple videos in parallel
4. **Preset Selection:** Let users choose quality vs speed
5. **Resume Support:** Resume failed transcodes from checkpoint

## Files Modified

- ✅ `src/lib/clientTranscode.ts` (new)
- ✅ `scripts/copy-ffmpeg-assets.js` (new)
- ✅ `src/app/submitvideo/page.tsx` (modified)
- ✅ `next.config.ts` (modified)
- ✅ `package.json` (modified - added postinstall script)
- ✅ `public/ffmpeg/` (new directory with core assets)

## Resources

- [ffmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- [SharedArrayBuffer Security](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [COOP/COEP Headers](https://web.dev/coop-coep/)
