import type { Metadata } from "next";
import { Inter, Baloo_2 } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Kreş Yönetimi temasında başlıklar için kullanılan oyunbaz yazı tipi
// (bkz. globals.css [data-app-theme="kres"] --font-heading).
const baloo2 = Baloo_2({
  variable: "--font-playful",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kreş & Etüt Muhasebe",
  description:
    "Kreş ve etüt merkezleri için gelir/gider ve veli/öğrenci yönetim sistemi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${baloo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
