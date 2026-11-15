import type { Metadata } from "next";
import "./globals.css";
import "./cockpit.css";
import "./product.css";
import "./studio.css";
import "./auth.css";
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "EDGE / Cockpit de trading",
  applicationName: "EDGE Trading Journal",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
    <html lang="fr">
      <head>
        <link href="/fonts/edge.css" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
