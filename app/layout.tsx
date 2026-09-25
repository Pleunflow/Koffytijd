import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { getBrand } from "@/lib/brand";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export function generateMetadata(): Metadata {
  const brand = getBrand();
  return {
    title: brand.appName,
    description: `Samen koffie bestellen met je collega's van ${brand.companyName}.`,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
