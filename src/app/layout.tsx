import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic, Cairo, Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { VerificationProvider } from "@/contexts/VerificationContext";
import ResponsiveWrapper from "@/components/ResponsiveWrapper";
import AuctionChatPopup from "@/components/auctions/AuctionChatPopup";

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-arabic",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});



export const metadata: Metadata = {
  title: "Metalix24 — منصة تجارة الخردة",
  description: "منصة Metalix24 الرقمية المتكاملة لتجارة الخردة والمعادن في السوق السوري",
  keywords: ["خردة", "معادن", "تدوير", "سوريا", "حديد", "نحاس", "بلاستيك"],
  icons: {
    icon: "/branding/icon.png",
    shortcut: "/branding/icon.png",
    apple: "/branding/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#101922",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body suppressHydrationWarning className={`${notoSansArabic.variable} ${cairo.variable} ${inter.variable} bg-bg-dark text-white font-display overflow-x-hidden antialiased`}>
          <AuthProvider>
            <ToastProvider>
              <VerificationProvider>
                <ErrorBoundary>
                  <ResponsiveWrapper>
                    {children}
                    <AuctionChatPopup />
                  </ResponsiveWrapper>
                </ErrorBoundary>
              </VerificationProvider>
            </ToastProvider>
          </AuthProvider>
      </body>
    </html>
  );
}
// Build: Sun, Feb 28, 2026  11:05:09 PM
