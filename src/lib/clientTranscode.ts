/**
 * Client-side video transcoding using ffmpeg.wasm
 * Standard implementation following official documentation
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton ffmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;

/**
 * Check if browser supports multi-threaded ffmpeg
 */
export function canUseMultiThread(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    globalThis.crossOriginIsolated === true &&
    typeof SharedArrayBuffer !== 'undefined'
  );
}

/**
 * Load and initialize ffmpeg instance
 * Standard approach from official docs: https://github.com/ffmpegwasm/ffmpeg.wasm
 */
async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }

  if (isLoading) {
    // Wait for current load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpegInstance?.loaded) {
      return ffmpegInstance;
    }
  }

  isLoading = true;

  try {
    const ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
    });

    // Standard CDN approach with toBlobURL
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    
    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    console.log('FFmpeg loaded successfully');
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } finally {
    isLoading = false;
  }
}

/**
 * Transcode video to web-compatible MP4
 * H.264 + AAC + faststart for broad browser support
 */
export async function transcodeToMp4(
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> {
  console.log(`Starting transcode: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`File type: ${file.type}`);
  const startTime = Date.now();

  const ffmpeg = await loadFFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.min(Math.round(progress * 100), 100));
    });
  }

  try {
    // Always use .mp4 extension for input to help ffmpeg detect format
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';
    
    console.log(`Fetching file data...`);
    const fileData = await fetchFile(file);
    const fileDataSize = fileData instanceof Uint8Array ? fileData.byteLength : 0;
    console.log(`File data fetched: ${fileDataSize} bytes`);
    
    console.log(`Writing to ffmpeg FS: ${inputName}`);
    await ffmpeg.writeFile(inputName, fileData);
    
    console.log('Verifying file was written...');
    const writtenFiles = await ffmpeg.listDir('/');
    console.log('Files in ffmpeg FS:', writtenFiles);

    console.log('Starting ffmpeg conversion...');
    // Balanced: Good quality + reasonable speed for client-side
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'fast',              // Good balance of speed vs quality
      '-crf', '23',                   // Standard quality (18=high, 23=good, 28=low)
      '-pix_fmt', 'yuv420p',          // Safari compatibility
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-movflags', '+faststart',
      '-max_muxing_queue_size', '1024', // Handle large files
      outputName
    ]);

    console.log('Reading output file...');
    const data = await ffmpeg.readFile(outputName);
    const dataSize = data instanceof Uint8Array ? data.byteLength : 0;
    console.log(`Output file size: ${dataSize} bytes`);
    
    if (!data || dataSize === 0) {
      throw new Error('Output file is empty - ffmpeg conversion produced no output');
    }
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Convert to regular Uint8Array to avoid SharedArrayBuffer type issues
    const outputData = data instanceof Uint8Array ? new Uint8Array(data) : data;
    
    const transcodedFile = new File(
      [outputData],
      `${file.name.replace(/\.[^/.]+$/, '')}.mp4`,
      { type: 'video/mp4' }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Transcode complete in ${duration}s`);
    console.log(`Size: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(transcodedFile.size / 1024 / 1024).toFixed(2)}MB`);

    return transcodedFile;
  } catch (error) {
    console.error('❌ Transcode error:', error);
    // Try to cleanup on error
    try {
      await ffmpeg.deleteFile('input.mp4').catch(() => {});
      await ffmpeg.deleteFile('output.mp4').catch(() => {});
    } catch {}
    throw new Error(`Video conversion failed: ${(error as Error).message}. The video format may not be supported. Try a different video file.`);
  }
}

/**
 * Check if a video file needs transcoding
 * For simplicity, we always transcode to ensure consistent output format
 * You could add heuristics here to skip if already optimal MP4
 */
export function needsTranscoding(file: File): boolean {
  // For now, always transcode to ensure consistent H.264+AAC+faststart format
  // Even MP4s may have incompatible codecs (e.g., H.265, VP9)
  return true;
}

/**
 * Get file extension including the dot
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : '.mp4';
}

/**
 * Estimate transcode time based on file size
 * Very rough heuristic: ~1-3 minutes per 100MB on average hardware
 */
export function estimateTranscodeTime(fileSizeMB: number): string {
  const minutes = Math.ceil((fileSizeMB / 100) * 2);
  if (minutes < 1) return 'less than a minute';
  if (minutes === 1) return 'about 1 minute';
  return `about ${minutes} minutes`;
}
