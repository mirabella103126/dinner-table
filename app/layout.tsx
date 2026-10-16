import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Dinner Table",
  description: "A family dinner calendar, favorites, and room for everyone’s preferences.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
