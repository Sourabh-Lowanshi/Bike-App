import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "BlackPearl — Fuel & Maintenance Tracker",
  description:
    "BlackPearl tracks fuel, mileage, trips, and maintenance for your TVS Apache RTR 160 4V.",
   verification: {
    google: "xNZxNXBa_xRsCpcFnNWX_ITDLxc7F-1Zdp6Esiwr28c",
  },
    manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BlackPearl",
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">
        <div className="bp-ambient-bg" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
