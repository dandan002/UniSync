import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Source_Serif_4({
  variable: "--font-serif4",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: { default: "Unisync", template: "%s · Unisync" },
  description: "Build your first resume in one chat, then apply to internships at verified companies.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#4A55A8",
          colorForeground: "#1E2140",
          fontFamily: "var(--font-instrument), system-ui, sans-serif",
          borderRadius: "8px",
        },
      }}
    >
      <html lang="en" className={`${instrument.variable} ${serif.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
