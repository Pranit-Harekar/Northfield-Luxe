import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ThemeProvider } from "./theme-provider";
import NavBar from "./nav-bar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AD_CLIENT } from "@/lib/ads";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Northfield Luxe",
  description: "Interactive QA training platform for frontend & backend testing",
  icons: {
    icon: [
      { url: "/logo-light.png", type: "image/png" },
      { url: "/logo.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* AdSense loader — this only loads the library; it renders nothing
            itself. Actual ad slots (<ins class="adsbygoogle">) are only
            rendered by components that explicitly include them, e.g. the
            hero ad carousel on the shop page, so ads never show up
            elsewhere in the app. Skipped entirely if no publisher id is
            configured (see NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env.example). */}
        {AD_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <ThemeProvider>
          <Providers>
            <TooltipProvider>
              <NavBar />
              <div className="flex flex-1 flex-col">{children}</div>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
