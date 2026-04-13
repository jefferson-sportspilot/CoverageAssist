import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Keep jsPDF out of the RSC / server graph (browser-only dependency). */
  serverExternalPackages: ["jspdf"],
};

export default nextConfig;
