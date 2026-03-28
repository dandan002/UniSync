import type { Metadata } from "next";
import { Geist_Mono, Fraunces, Newsreader, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "UniSync — One profile. Every resume.",
  description:
    "Import from LinkedIn, GitHub, and existing resumes. Edit with AI. Export pixel-perfect LaTeX PDFs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${geistMono.variable} ${fraunces.variable} ${newsreader.variable} ${inter.variable} antialiased`}
      >
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
