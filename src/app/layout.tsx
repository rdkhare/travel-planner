import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import GoogleMapsScript from "@/components/GoogleMapsScript";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "Plan your trips with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleMapsScript />
      </head>
      <body>
        <ClientLayout>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </ClientLayout>
      </body>
    </html>
  );
}
