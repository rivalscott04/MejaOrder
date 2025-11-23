import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Remove all console logs in production build for security
    // This prevents API payloads and errors from being visible in browser console
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
