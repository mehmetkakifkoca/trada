"use client";

import { useEffect } from "react";
import { useDataStore } from "@/store/data-store";

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const { invoiceSettings } = useDataStore();

  useEffect(() => {
    const { primaryColor, secondaryColor, tertiaryColor } = invoiceSettings;
    
    // Update CSS variables globally
    const root = document.documentElement;
    if (primaryColor) root.style.setProperty("--primary", hexToOklch(primaryColor));
    if (secondaryColor) root.style.setProperty("--secondary", hexToOklch(secondaryColor));
    // You can add more mappings here if needed
    
    // Update Favicon
    if (invoiceSettings.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = invoiceSettings.favicon;
    }
  }, [invoiceSettings]);

  return <>{children}</>;
}

// Helper to convert Hex to Oklch (rough approximation for Tailwind variables)
// Since globals.css uses oklch, we should ideally use that or change globals.css to use hex/hsl
function hexToOklch(hex: string): string {
  // Simple pass-through if we change globals.css to use simple variables
  // For now, let's just return the hex and we will update globals.css to use standard variables
  return hex;
}
