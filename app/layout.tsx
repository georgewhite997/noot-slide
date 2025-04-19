import type { Metadata } from "next";
import "./globals.css";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Abstract 3D Game Boilerplate",
  description: "A boilerplate for building a 3D game on Abstract",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Container>{children}</Container>
      </body>
    </html>
  );
}
