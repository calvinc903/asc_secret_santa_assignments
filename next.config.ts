import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  
  // COOP/COEP headers required for ffmpeg.wasm multi-thread support
  // These headers enable SharedArrayBuffer for faster video transcoding
  // Safari works better with 'require-corp' than 'credentialless'
  async headers() {
    return [
      {
        source: '/submitvideo',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;