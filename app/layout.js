import "./globals.css";
import NavBar from "../components/NavBar";
import SWRegister from "../components/SWRegister";

export const metadata = {
  title: "Spese",
  description: "Monitoraggio spese personali con OpenBanking",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body>
        {children}
        <NavBar />
        <SWRegister />
      </body>
    </html>
  );
}
