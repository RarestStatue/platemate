import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import SessionProvider from "@/components/layout/SessionProvider";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif-loaded",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "platemate — cook what you already have",
  description:
    "For students who can't be bothered to shop. Snap your fridge, get a plate. No waste, no faff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${serif.variable} ${sans.variable}`}
    >
      <body className="min-h-full flex flex-col grain">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
