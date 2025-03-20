"use client";

import { GeistSans } from 'geist/font';
import { GeistMono } from 'geist/font';
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import CustomCursor from "@/components/CustomCursor";

const fontSans = GeistSans;
const fontMono = GeistMono;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${fontSans.variable} ${fontMono.variable} min-h-screen font-sans antialiased`}>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomCursor />
          {children}
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </div>
  );
} 