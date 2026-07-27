/** @type {import('next').NextConfig} */
const nextConfig = {
  // Internal/demo deploys: don't fail production builds on existing lint debt.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
