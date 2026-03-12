import type { Metadata } from "next";
import { Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "UniSync — One profile. Every resume.",
  description:
    "Import from LinkedIn, GitHub, and existing resumes. Edit with AI. Export pixel-perfect LaTeX PDFs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
