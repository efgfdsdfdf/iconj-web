import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ICONJ - Premium Blinds, Curtains & Window Treatments",
  description: "Custom-fitted blinds, elegant curtains, and smart window treatments tailored for your home and office in Nigeria.",
  appleWebApp: {
    capable: true,
    title: "ICONJ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <PwaInstallBanner />
        <Navbar />
        <main className="flex-1">
          {children}
        <Toaster position="top-center" />
        
        </main>
        <Footer />
      </body>
    </html>
  );
}
