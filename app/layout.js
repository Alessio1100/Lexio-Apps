import "./globals.css";
import NavBar from "../components/NavBar";
import SWRegister from "../components/SWRegister";
import SessionSync from "../components/SessionSync";

export const metadata = {
  title: "Quadra",
  description: "Le tue spese e i tuoi conti, sempre quadrati",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a0d0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap"
        />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
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
        <SessionSync />
      </body>
    </html>
  );
}
