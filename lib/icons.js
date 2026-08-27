// Icon pack reale (Lucide) al posto delle emoji da tastiera.
// L'icona di una categoria è determinata dal campo `icon`:
//   - chiave del pack Lucide (es. "Coffee")  → mostra quell'icona del pack
//   - "emoji:☕"                              → mostra quell'emoji
//   - vuoto / legacy                          → fallback per nome, poi emoji grezza, poi Tag
import {
  Home, Zap, ShoppingCart, Car, HeartPulse, GraduationCap, UtensilsCrossed,
  ShoppingBag, Gamepad2, CreditCard, Coffee, Cigarette, Plane, Gift, Banknote,
  Receipt, CircleHelp, PiggyBank, TrendingUp, Wallet, Repeat, ArrowRightLeft,
  Briefcase, Undo2, CirclePlus, Tag,
  Building2, Store, Landmark, Hotel, Bed, Lightbulb, Wifi, Phone, Smartphone,
  Laptop, Tv, Package, Shirt, Gem, Bus, Train, Bike, Fuel, Truck, MapPin, Globe,
  Beer, Wine, Pizza, IceCream, Apple, Carrot, Stethoscope, Pill, Dumbbell,
  BookOpen, Book, Newspaper, Music, Film, Camera, Ticket, Palette, Trophy,
  Scissors, Sparkles, Flower, Dog, Cat, PawPrint, Baby, Coins, DollarSign,
  Euro, HandCoins, Calculator, ShieldCheck, Scale, Wrench, Hammer, Paintbrush,
  Umbrella, Sun, TreePine, Star, Heart,
} from "lucide-react";

// Libreria selezionabile dal picker (chiave = nome Lucide, valore = componente).
// L'ordine è quello mostrato nella griglia.
export const ICON_LIBRARY = {
  Home, Building2, Store, Landmark, Hotel, Bed,
  Zap, Lightbulb, Wifi, Phone, Smartphone, Laptop, Tv,
  ShoppingCart, ShoppingBag, Package, Shirt, Gift, Gem,
  Car, Bus, Train, Bike, Fuel, Plane, Truck, MapPin, Globe,
  UtensilsCrossed, Coffee, Beer, Wine, Pizza, IceCream, Apple, Carrot,
  HeartPulse, Stethoscope, Pill, Dumbbell,
  GraduationCap, BookOpen, Book, Newspaper,
  Gamepad2, Music, Film, Camera, Ticket, Palette, Trophy,
  Scissors, Sparkles, Flower, Dog, Cat, PawPrint, Baby,
  Repeat, CreditCard, Wallet, Banknote, Coins, PiggyBank, TrendingUp,
  DollarSign, Euro, HandCoins, Receipt, Calculator, ShieldCheck, Scale,
  Wrench, Hammer, Paintbrush,
  Briefcase, Undo2, CirclePlus, ArrowRightLeft,
  Cigarette, Umbrella, Sun, TreePine, Star, Heart, Tag, CircleHelp,
};

// Fallback per nome per le categorie di default (che salvano un'emoji legacy).
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
  Trasporti: Car,
  "Sport e Salute": HeartPulse,
  Salute: HeartPulse,
  "Assicurazioni / Tasse": ShieldCheck,
  "Tasse e Istruzione": GraduationCap,
  Ristoranti: UtensilsCrossed,
  "Ristoranti / Bar": UtensilsCrossed,
  Shopping: ShoppingBag,
  "Svago / Tempo libero": Gamepad2,
  Abbonamenti: Repeat,
  Bar: Coffee,
  "Cura personale": Scissors,
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

const EMOJI_PREFIX = "emoji:";

// Risolve l'icona: { Comp } (componente Lucide) oppure { glyph } (stringa emoji).
export function resolveIcon(icon, name) {
  if (icon && icon.startsWith(EMOJI_PREFIX)) return { glyph: icon.slice(EMOJI_PREFIX.length) };
  if (icon && ICON_LIBRARY[icon]) return { Comp: ICON_LIBRARY[icon] };
  if (name && CAT_ICONS[name]) return { Comp: CAT_ICONS[name] };
  if (icon && icon.trim()) return { glyph: icon.trim() };
  return { Comp: Tag };
}

// Restituisce l'emoji da mostrare come testo (per <option> ecc.), altrimenti "".
export function iconGlyph(icon, name) {
  return resolveIcon(icon, name).glyph || "";
}

// Valore da salvare quando si sceglie l'emoji dal form.
export function emojiIconValue(emoji) {
  return EMOJI_PREFIX + emoji;
}

// <CatIcon name="Bar" icon={cat.icon} size={18} color="#f59e0b" />
export function CatIcon({ name, icon, size = 18, color, style, ...rest }) {
  const r = resolveIcon(icon, name);
  if (r.glyph) {
    return (
      <span
        style={{
          fontSize: Math.round(size * 0.95),
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
        {...rest}
      >
        {r.glyph}
      </span>
    );
  }
  const Ic = r.Comp;
  return <Ic size={size} strokeWidth={2} color={color} style={style} {...rest} />;
}
