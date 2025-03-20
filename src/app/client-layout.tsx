"use client";

import { GeistSans } from 'geist/font';
import { GeistMono } from 'geist/font';
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import AnimatedCursor from "react-animated-cursor";

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
          <AnimatedCursor
            innerSize={8}
            outerSize={35}
            innerScale={1}
            outerScale={1.5}
            outerAlpha={0}
            innerStyle={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #000000'
            }}
            outerStyle={{
              border: '2px solid #000000',
              mixBlendMode: 'normal'
            }}
            clickables={[
              'a',
              'input[type="text"]',
              'input[type="email"]',
              'input[type="number"]',
              'input[type="submit"]',
              'input[type="image"]',
              'label[for]',
              'select',
              'textarea',
              'button',
              '.link',
              '.cursor-pointer'
            ]}
          />
          {children}
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </div>
  );
} 