import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroKheti - AI-Powered Agricultural Assistant",
  description:
    "Your intelligent farming companion that diagnoses crop diseases instantly, provides real-time market analysis, and navigates government schemes in your native language.",
  keywords:
    "agriculture, AI, farming, crop diagnosis, market analysis, government schemes, voice interface, farmers",
  authors: [{ name: "NeuroKheti Team" }],
  openGraph: {
    title: "NeuroKheti - AI-Powered Agricultural Assistant",
    description: "Empowering farmers with intelligent agricultural solutions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
