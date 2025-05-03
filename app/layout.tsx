import type { Metadata } from "next";
import "./globals.css";
import { Container } from "@/components/Container";
import { Titan_One } from "next/font/google";

export const metadata: Metadata = {
  title: "Abstract 3D Game Boilerplate",
  description: "A boilerplate for building a 3D game on Abstract",
};

const font = Titan_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-titan",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${font.className} antialiased`}>
        <Container>{children}</Container>
      </body>
    </html>
  );
}
