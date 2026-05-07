import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { SwRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SERVLO — Trade Business Management Software",
  description: "Jobs, clients, invoices, quotes and employees — all in one place. Built for Australian tradies.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SERVLO",
    statusBarStyle: "black-translucent"
  },
  icons: {
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: "#3B82F6"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
      </head>
      <body className={montserrat.className}>
        <ThemeScript />
        {children}
        <SwRegister />
      </body>
    </html>
  );
}


