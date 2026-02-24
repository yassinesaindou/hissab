import { Inter } from "next/font/google";
import "./globals.css";
 
import { Metadata, Viewport } from "next";
import OnlineStatus from "@/components/pwa/OnlineStatus";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPromt";
 
import OfflineRedirect from "@/components/pwa/OfflineRedirect";
import { SWCacheWarmer } from "@/components/pwa/SwCacheWarmer";

// const roboto = Inter({
//   weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
//   subsets: ["latin"],
// });
const jakartaSans = Inter({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hissab - Point de Vente Intelligent",
  description:
    "Système de Point de Vente intelligent pour la gestion de votre commerce",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Hissab",
    statusBarStyle: "black-translucent",
  },
  applicationName: "Hissab POS",
  keywords: ["POS", "point de vente", "commerce", "gestion", "inventaire"],
  authors: [{ name: "Hissab" }],
  openGraph: {
    type: "website",
    title: "Hissab - Point de Vente",
    description: "Système de Point de Vente intelligent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Hissab POS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hissab POS" />
        <meta name="description" content="Point of Sale avec suivi de stock" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${jakartaSans.className} overflow-y-scroll antialiased font-normal `} >
       
        {children}

        <SWCacheWarmer />
        <OfflineRedirect />
        <OnlineStatus />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
