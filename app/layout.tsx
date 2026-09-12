import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: { default: "Movies", template: "%s — Movies" },
  description: "A considered, cinematic home for films and series.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/qmovies-icon.png", apple: "/brand/qmovies-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Movies" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" suppressHydrationWarning><body><Providers><PwaRegister /><Header />{children}<Footer /><BottomNav /></Providers></body></html>;
}
