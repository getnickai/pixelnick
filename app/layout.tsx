import type { Metadata } from "next";
import localFont from "next/font/local";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const duplet = localFont({
  src: [
    { path: "./fonts/Duplet-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/Duplet-Semibold.woff", weight: "500", style: "normal" },
    { path: "./fonts/Duplet-Semibold.woff", weight: "600", style: "normal" },
    { path: "./fonts/Duplet-Bold.woff", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-duplet",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "pixelnick",
  description: "NickAI social share card",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${duplet.variable} ${manrope.variable} antialiased`}
      style={
        {
          "--font-duplet": duplet.style.fontFamily,
          "--font-manrope": manrope.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <body className={`${manrope.className} font-sans`}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
