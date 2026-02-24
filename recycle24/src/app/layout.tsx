import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic, Cairo, Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";

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
    <html lang="ar" dir="rtl" className="dark">
      <head>
        {/* Material Symbols - using display=block for better loading */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className={`${notoSansArabic.variable} ${cairo.variable} ${inter.variable} bg-bg-dark text-white font-display overflow-x-hidden antialiased`}>
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-bg-dark shadow-xl overflow-hidden">
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
// Build: Sun, Feb 22, 2026  3:07:03 AM
