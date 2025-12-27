/**
 * Download ffmpeg.wasm core assets from official CDN and save to public folder
 * This ensures same-origin access for COEP compliance and multi-thread support
 * 
 * Run automatically via postinstall hook or manually: node scripts/copy-ffmpeg-assets.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
const DEST_DIR = path.join(__dirname, '..', 'public', 'ffmpeg');

const FILES_TO_DOWNLOAD = [
  'ffmpeg-core.js',
  'ffmpeg-core.wasm',
  // Note: worker.js is generated dynamically by ffmpeg.js, not a separate file
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function copyAssets() {
  console.log('📦 Downloading ffmpeg.wasm core assets from CDN...');
  console.log(`   Version: ${CORE_VERSION}`);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`✅ Created directory: ${DEST_DIR}`);
  }

  let successCount = 0;
  for (const file of FILES_TO_DOWNLOAD) {
    const url = `${BASE_URL}/${file}`;
    const destPath = path.join(DEST_DIR, file);

    try {
      console.log(`⬇️  Downloading: ${file}...`);
      await downloadFile(url, destPath);
      
      const stats = fs.statSync(destPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ Downloaded: ${file} (${sizeMB} MB)`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to download ${file}:`, error.message);
    }
  }

  if (successCount === FILES_TO_DOWNLOAD.length) {
    console.log(`\n✨ Successfully downloaded all ${successCount} ffmpeg core assets to /public/ffmpeg/`);
    console.log('🚀 Your app is ready to use client-side video transcoding!');
  } else {
    console.error(`\n⚠️  Only downloaded ${successCount}/${FILES_TO_DOWNLOAD.length} files. Check for errors above.`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  copyAssets().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { copyAssets };
