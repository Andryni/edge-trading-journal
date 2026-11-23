import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import "./cockpit.css";
import "./product.css";
import "./studio.css";
import "./auth.css";
import "./design-system.css";
import "./terminal.css";
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest?v=candles2",
  title: "EDGE / Cockpit de trading",
  applicationName: "EDGE Trading Journal",
  icons: {
    icon: [{ url: "/icon.svg?v=candles2", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png?v=candles2", sizes: "180x180", type: "image/png" }],
  },
  description:
    "Observe tes décisions. Protège ton capital. Améliore ton exécution.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <head>
        <link href="/fonts/edge.css" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
