import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
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
    apple: [{ url: "/logo.png", sizes: "192x192", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={montserrat.className}>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}


