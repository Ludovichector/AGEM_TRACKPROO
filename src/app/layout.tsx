import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGEM TrackPro - Suivi Chantier Orange BF",
  description:
    "Plateforme de suivi AMOA du chantier du nouveau siège social d'Orange Burkina Faso S.A - Maîtrise d'œuvre AMOA : AGEM-Développement",
  keywords: ["AGEM", "Orange Burkina Faso", "BTP", "AMOA", "EVM", "Loi 022-2025"],
  manifest: "/manifest.json",
  themeColor: "#D4AF37",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full`}>
      <body className="h-full antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-outfit)",
            },
          }}
        />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
