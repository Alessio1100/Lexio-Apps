// Icon pack reale (Lucide) al posto delle emoji da tastiera.
// Mappa categoria -> icona; con fallback su un tag generico.
import {
  Home, Zap, ShoppingCart, Car, HeartPulse, GraduationCap, UtensilsCrossed,
  ShoppingBag, Gamepad2, CreditCard, Coffee, Cigarette, Plane, Gift, Banknote,
  Receipt, CircleHelp, PiggyBank, TrendingUp, Wallet, Repeat, ArrowRightLeft,
  Briefcase, Undo2, CirclePlus, Tag,
} from "lucide-react";

const CAT_ICONS = {
  // entrate
  Stipendio: Briefcase,
  Rimborsi: Undo2,
  "Entrate extra": CirclePlus,
  // uscite
  "Casa / Affitto": Home,
  "Bollette / Utenze": Zap,
  Alimentari: ShoppingCart,
  Auto: Car,
  "Sport e Salute": HeartPulse,
  "Tasse e Istruzione": GraduationCap,
  Ristoranti: UtensilsCrossed,
  Shopping: ShoppingBag,
  "Svago / Tempo libero": Gamepad2,
  Abbonamenti: Repeat,
  Bar: Coffee,
  "Sigarette e Vizi": Cigarette,
  "Viaggi / Vacanze": Plane,
  "Regali / Donazioni": Gift,
  "Prelievi contanti": Banknote,
  Commissioni: Receipt,
  "Altro / Da rivedere": CircleHelp,
  "Carta di Credito": CreditCard,
  "Risparmio / Fondo emergenza": PiggyBank,
  Investimenti: TrendingUp,
  // trasferimenti
  Trasferimenti: ArrowRightLeft,
};

export function iconForCategory(name) {
  return CAT_ICONS[name] || Tag;
}

// <CatIcon name="Bar" size={18} color="#f59e0b" />
export function CatIcon({ name, size = 18, ...rest }) {
  const Ic = iconForCategory(name);
  return <Ic size={size} strokeWidth={2} {...rest} />;
}
