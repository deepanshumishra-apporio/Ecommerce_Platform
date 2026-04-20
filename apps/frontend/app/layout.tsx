import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import { CountsProvider } from "../contexts/CountsContext";
import Navbar from "../components/Navbar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SELLING SHIP® | Premium Streetwear",
  description:
    "Shop the latest streetwear — caps, tees, hoodies, sunglasses & more. Free shipping on orders above ₹999.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CountsProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </CountsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
