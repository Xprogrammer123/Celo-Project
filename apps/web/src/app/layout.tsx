import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { WalletProvider } from "@/components/wallet-provider";
import { WrongNetworkBanner } from "@/components/wrong-network-banner";
import { RetroTooltipProvider } from "@/components/retroui/tooltip";

const fontHead = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROVA | Pay. Scratch. Win an NFT. On-chain. Provably fair",
  description: "Pay. Scratch. Win an NFT. On-chain. Provably fair.",

  icons: {
    icon: "/logo.png",
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
        className={`${fontHead.variable} ${fontSans.variable} font-sans min-h-screen antialiased`}
      >
        <WalletProvider>
          <RetroTooltipProvider>
            <WrongNetworkBanner />
            <SiteHeader />
            {children}
          </RetroTooltipProvider>
        </WalletProvider>
      </body>
    </html>
  );
}