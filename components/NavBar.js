"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Tags, SlidersHorizontal, Settings } from "lucide-react";

// Logo Quadra: anello smeraldo→ciano con spicchio ambra e coda (Q).
function QMark({ size = 22 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="navq" gradientUnits="userSpaceOnUse" x1="24" y1="24" x2="80" y2="80">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="24" fill="none" stroke="url(#navq)" strokeWidth="11" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#fbbf24" strokeWidth="11" strokeDasharray="37 200" transform="rotate(180 50 50)" />
      <line x1="61" y1="61" x2="73" y2="73" stroke="url(#navq)" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS = [
  { href: "/", label: "Home", Icon: LayoutDashboard },
  { href: "/transazioni", label: "Spese", Icon: Wallet },
  { href: "/categorie", label: "Categorie", Icon: Tags },
  { href: "/regole", label: "Regole", Icon: SlidersHorizontal },
  { href: "/impostazioni", label: "Impostazioni", Icon: Settings },
];

export default function NavBar() {
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/privacy") ||
    pathname?.startsWith("/termini")
  )
    return null;

  return (
    <nav className="appnav">
      <div className="appnav-brand">
        <span className="logo">
          <QMark size={22} />
        </span>
        <span>Quadra</span>
      </div>
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link key={href} href={href} className={`navitem ${active ? "active" : ""}`}>
            <Icon strokeWidth={active ? 2.4 : 2} />
            <span className="navlabel">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
