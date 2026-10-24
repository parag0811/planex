import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ReduxProvider from "../provider/ReduxProvider";
import AuthProvider from "../provider/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planex | System Architecture & Project Engine",
  description:
    "Intelligent system architecture planning, project decomposition, and task complexity management platform.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Planex | System Architecture & Project Engine",
    description:
      "Intelligent system architecture planning, project decomposition, and task complexity management platform.",
    siteName: "Planex Systems",
    type: "website",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ReduxProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
