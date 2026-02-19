import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SplashScreen } from "@/components/splash/splash-screen";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MeatBags Companion | DEGEN NFT Tracker",
  description:
    "The ultimate companion app for the MeatBags NFT collection on Solana. Track Prep Points, Loserboard rankings, transaction history, and more across split wallets.",
  keywords: ["MeatBags", "NFT", "Solana", "Prep Points", "Loserboard", "Dead Bruv", "DEGEN"],
  icons: {
    icon: "/toxic-t-bone_transparent.png",
    apple: "/toxic-t-bone_transparent.png",
  },
  openGraph: {
    title: "MeatBags Companion",
    description: "Track your MeatBags NFT empire across the wasteland",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`} suppressHydrationWarning>
        <Providers>
          <SplashScreen />
          {children}
        </Providers>
      </body>
    </html>
  );
}
