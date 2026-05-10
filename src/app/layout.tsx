import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { SwRegister } from "@/components/pwa/sw-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
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
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SERVLO" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      </head>
      <body className={montserrat.className}>
        <ThemeScript />
        {children}
        <SwRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}


