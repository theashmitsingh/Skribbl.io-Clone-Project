
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skribbl.io Clone",
  description:
    "Draw, guess words, and play with friends in this real-time multiplayer game.",
  openGraph: {
    title: "Skribbl.io Clone",
    description:
      "Join a room, draw pictures, and guess what other players are drawing.",
    siteName: "Skribbl.io Clone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skribbl.io Clone",
    description:
      "Play with friends, draw pictures, and guess the words!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
