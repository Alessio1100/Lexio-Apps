"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: "📊" },
  { href: "/transazioni", label: "Spese", icon: "📃" },
  { href: "/categorie", label: "Categorie", icon: "🏷️" },
  { href: "/regole", label: "Regole", icon: "⚙️" },
  { href: "/impostazioni", label: "Impostazioni", icon: "👤" },
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
    <nav className="bottomnav">
      {ITEMS.map((it) => {
        const active =
          it.href === "/" ? pathname === "/" : pathname?.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`navitem ${active ? "active" : ""}`}
          >
            <span className="navicon">{it.icon}</span>
            <span className="navlabel">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
