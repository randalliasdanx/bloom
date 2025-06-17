import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "bloom",
  description: "Personalized AI-powered learning for everyone",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          .bloom-green {
            color: #3cb371;
          }
          .bloom-header {
            color: #2e8b57;
          }
        `}</style>
      </head>
      <body className="min-h-screen bg-gradient-to-br from-[#e6e6fa] to-[#b7eacb]">
        <header className="w-full flex items-center h-20 px-8 py-2 bg-fuchsia-50/95 backdrop-blur-md shadow-sm">
          <Link href="/" className="flex items-center">
            <Image
              src="/bloomlogo.png"
              alt="bloom logo"
              width={48}
              height={48}
              priority
              className="mr-3"
            />
            <span
              className="text-2xl font-extrabold font-serif bloom-header tracking-tight"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              bloom
            </span>
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
