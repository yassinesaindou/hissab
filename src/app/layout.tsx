import {  Inter} from "next/font/google";

import "./globals.css";
 

// const roboto = Inter({
//   weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
//   subsets: ["latin"],
// });
const jakartaSans = Inter({
  weight: [  "200", "300", "400", "500", "600", "700", "800", ],
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/favicon.ico" as="image" />
      </head>
      <body className={`${jakartaSans.className} antialiased font-normal`}>{children}</body>
    </html>
  );
}
