import type { Metadata } from "next";
import { Bangers, Bungee, Comic_Neue, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const bangers = Bangers({
  variable: "--font-bangers",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BAM! — Beat Avoidance Mode | Anti-Procrastination Platform",
  description:
    "BAM! is a comic-book-style anti-procrastination platform that helps students and professionals beat avoidance, build focus habits, and track real progress over time. POW!",
  keywords: [
    "procrastination", "focus", "pomodoro", "productivity",
    "anti-procrastination", "comic UI", "BAM", "habit tracker",
  ],
  authors: [{ name: "BAM! Team" }],
  openGraph: {
    title: "BAM! — Beat Avoidance Mode",
    description: "Comic-style anti-procrastination platform with real AI coaching.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAM! — Beat Avoidance Mode",
    description: "Comic-style anti-procrastination platform with real AI coaching.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bangers.variable} ${bungee.variable} ${comicNeue.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
