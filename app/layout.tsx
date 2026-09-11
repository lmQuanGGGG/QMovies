import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = { title: { default: "Movies", template: "%s — Movies" }, description: "A considered, cinematic home for films and series.", icons: { icon: "/brand/qmovies-icon.png", apple: "/brand/qmovies-icon.png" }, themeColor: "#000000" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body><Providers><Header />{children}<Footer /><BottomNav /></Providers></body></html>; }
