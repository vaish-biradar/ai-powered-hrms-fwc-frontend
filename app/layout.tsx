import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/core/theme/theme-provider";
import NavbarWrapper from "@/components/core/layout/navbar-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { Chatbot } from "@/components/shared/chatbot";
import SessionProviderWrapper from "@/contexts/session-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/core/error/error-boundary";
import { NetworkAlertProvider } from '@/components/core/network/networkalert-provider';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FWC India Private Limited",
  description: "Leading technology solutions provider in India",
  
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
      <NetworkAlertProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <SessionProviderWrapper>
            {/* Navbar always stays at the top */}
            <NavbarWrapper />
            <TooltipProvider>
              {/* Main content starts below Navbar */}
              <div className="flex-1">
                {children}
              </div>
            </TooltipProvider>
            {/* Toast notifications and Chatbot */}
            <Toaster position="top-right" />
            <Chatbot />
          </SessionProviderWrapper>
        </ThemeProvider>
       </ErrorBoundary>
       </NetworkAlertProvider>
      </body>
    </html>
  );
}