"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Tags, SlidersHorizontal, Settings, Landmark } from "lucide-react";

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
          <Landmark size={20} strokeWidth={2.4} />
        </span>
        <span>Le mie spese</span>
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
