import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoverageAssistAI — Evaluation-to-Article Engine",
  description:
    "SportsPilotAI Suite — turn evaluator notes into articles via n8n webhook.",
  icons: {
    icon: "/logo-plain.png",
    apple: "/logo-plain.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* Google Fonts — same set as legacy CoverageAssistAI.html */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
