"use client";

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";
import Navbar from "./components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            closeSidebar={() => setIsSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col w-full overflow-auto">
            <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 p-4">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
