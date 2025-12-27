# Testing Client-Side Video Transcoding

## Pre-Test Checklist

✅ FFmpeg core assets downloaded:
```bash
ls -lh public/ffmpeg/
# Should show:
# - ffmpeg-core.js (~110KB)
# - ffmpeg-core.wasm (~30MB)
```

✅ Dev server running:
```bash
npm run dev
# Should be running on http://localhost:3000
```

✅ COOP/COEP headers applied:
```bash
# Open browser DevTools → Network tab → Navigate to /submitvideo
# Check Response Headers should include:
# - cross-origin-opener-policy: same-origin
# - cross-origin-embedder-policy: require-corp
```

## Test Cases

### 1. Check Multi-Thread Support

**Browser Console (on /submitvideo page):**
```javascript
console.log('Cross-Origin Isolated:', globalThis.crossOriginIsolated);
console.log('SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');
console.log('Multi-thread supported:', globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined');
```

**Expected:**
- Chrome/Firefox (modern): All `true`
- Safari 15.2+: All `true`
- Without headers: `false, true, false`

### 2. Upload Small Video (Happy Path)

1. Navigate to `/submitvideo`
2. Select your name from dropdown
3. Click "Select Video"
4. Choose a small video file (10-50MB, any format)
5. Click "Submit Video"

**Expected:**
- Progress bar appears: "Converting video for web playback: X%"
- Progress increases from 0-100%
- Then switches to: "Uploading: X%"
- Redirects to success page

**Console Logs:**
```
Loading ffmpeg in multi-thread mode (or single-thread mode)
FFmpeg loaded successfully
[ffmpeg] ... (processing logs)
Transcode complete in X.XXs
Size: XXX.XXMB → YYY.YYMB
```

### 3. Upload Large Video (Performance Test)

1. Use a 200-300MB video
2. Watch for warning: "Large file (XXXmb) - transcoding may take..."
3. Monitor progress and timing

**Expected:**
- MT: ~3-6 minutes
- ST: ~6-12 minutes
- Memory usage stays reasonable (check Task Manager)

### 4. Upload Unsupported Format (Error Handling)

1. Try uploading a non-video file (e.g., .txt, .jpg)

**Expected:**
- Error: "Please select a video file"
- No transcoding attempted

### 5. Retry After Failure

1. Start upload
2. Disconnect internet mid-upload (after transcoding)
3. Reconnect and click Submit again

**Expected:**
- Uses cached transcoded file (fast, no re-transcode)
- Console: "Using cached transcoded file"

### 6. Multiple Video Formats

Test with various formats:
- [x] MP4 (already optimal)
- [x] MOV (iPhone format)
- [x] AVI
- [x] MKV
- [x] WebM

**Expected:**
- All should transcode successfully
- Output is always H.264+AAC MP4

### 7. Browser Compatibility

Test on different browsers:
- [x] Chrome (latest)
- [x] Firefox (latest)
- [x] Safari (15.2+)
- [x] Mobile Safari (iOS 15.2+)
- [x] Chrome Mobile

**Expected:**
- MT mode on modern browsers
- ST fallback on older browsers
- All should complete successfully (slower on mobile)

## Performance Benchmarks

Record transcoding times for consistent video:

| Browser | Mode | Video Size | Duration | Result |
|---------|------|------------|----------|--------|
| Chrome | MT | 100MB | ? min | ✅/❌ |
| Firefox | MT | 100MB | ? min | ✅/❌ |
| Safari | MT | 100MB | ? min | ✅/❌ |
| Chrome | ST | 100MB | ? min | ✅/❌ |

## Debugging

### FFmpeg Won't Load

**Check:**
```bash
# Assets exist?
ls public/ffmpeg/

# Correct MIME types served?
curl -I http://localhost:3000/ffmpeg/ffmpeg-core.wasm
# Should show: Content-Type: application/wasm

curl -I http://localhost:3000/ffmpeg/ffmpeg-core.js
# Should show: Content-Type: application/javascript
```

**Fix:**
```bash
node scripts/copy-ffmpeg-assets.js
```

### COEP Blocks Resources

**Symptom:** "Failed to load ffmpeg" with CORS errors in console

**Check:**
- Assets loaded from same origin? (http://localhost:3000/ffmpeg/...)
- Not from CDN? (https://unpkg.com/...)

### Out of Memory

**Symptom:** Browser tab crashes or error: "Out of memory"

**Solutions:**
- Use smaller video (<200MB)
- Close other tabs
- Use desktop instead of mobile
- Increase Chrome's memory limit (chrome://flags)

### Transcoding Hangs at 0%

**Symptom:** Progress stays at 0% forever

**Check:**
1. Browser console for errors
2. Network tab - are assets loading?
3. Try incognito mode (disable extensions)

## Success Criteria

✅ All video formats transcode successfully
✅ MT mode works on modern browsers
✅ ST fallback works on older browsers
✅ Transcoded videos play in all browsers
✅ File sizes are reasonable (not inflated)
✅ No memory leaks (test multiple uploads)
✅ Error handling works (corrupt files, network issues)
✅ UI stays responsive during transcoding

## Known Issues

- **Safari:** First transcode may be slow (cache warming)
- **Mobile:** Very slow for large files (warn users)
- **Firefox:** May show "Unresponsive script" warning (click Continue)
- **iOS Safari:** SharedArrayBuffer not supported in WKWebView (ST fallback)
