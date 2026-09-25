import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Collega's openen de dev-server via het IP-adres van de laptop.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
