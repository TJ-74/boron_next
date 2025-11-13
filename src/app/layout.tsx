import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from './context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Boron Atom",
  description: "A powerful AI powered application built with Next.js",
  keywords: ["web app", "next.js", "react"],
  authors: [{ name: "Tarun Janapati" }],
  creator: "Tarun Janapati",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
