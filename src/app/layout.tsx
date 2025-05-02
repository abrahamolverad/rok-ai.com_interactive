// src/app/layout.tsx
// Keep your existing imports (like Inter font, globals.css)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider"; // Adjust import path if needed

const inter = Inter({ subsets: ["latin"] });

// Keep your existing metadata export
export const metadata: Metadata = {
  title: "RokAi Interactive", // Or your site title
  description: "RokAi Interactive Website", // Or your site description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the main children with the AuthProvider */}
        <AuthProvider>
           {children}
           {/* Your existing layout structure (e.g., Header, Footer) can go here,
               outside or inside AuthProvider depending on whether they need session info */}
        </AuthProvider>
      </body>
    </html>
  );
}
