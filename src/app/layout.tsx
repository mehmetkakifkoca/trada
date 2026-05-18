import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { BrandThemeProvider } from "@/components/providers/BrandThemeProvider";
import { CloudSyncProvider } from "@/components/providers/CloudSyncProvider";
import { Toaster } from "sonner";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Trada Media | Dashboard",
  description: "Trada Media Agency Dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trada Space",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${poppins.variable} h-full antialiased max-w-full overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans max-w-full overflow-x-hidden">
        <QueryProvider>
          <AuthProvider>
            <CloudSyncProvider>
              <BrandThemeProvider>
                {children}
              </BrandThemeProvider>
            </CloudSyncProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
