import type { NextConfig } from "next";

// Collega's openen de dev-server via het IP-adres van de laptop. Next.js blokkeert
// dev-bestanden voor onbekende hostnames, dus sta de gangbare privé-netwerken toe.
// Wijkt jullie netwerk af? Zet dan DEV_ORIGINS=1.2.3.4,andere-host in .env.
const privateNetworks = ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"];
const extra = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: [...privateNetworks, ...extra],
};

export default nextConfig;
