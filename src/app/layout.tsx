import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GSC Outsourcing - Client Portal",
  description: "View your available team members",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
