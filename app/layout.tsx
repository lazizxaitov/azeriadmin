import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Azeri Admin",
  description: "Admin panel for the Azeri confectionery cafe app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
