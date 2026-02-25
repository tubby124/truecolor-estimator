"use client";

import type { Category } from "@/lib/data/types";

interface CategoryOption {
  id: Category;
  label: string;
  sublabel: string;
  icon: string;
  group: "wide_format" | "print" | "services";
}

const CATEGORIES: CategoryOption[] = [
  { id: "SIGN", label: "Coroplast Sign", sublabel: "4mm · Outdoor", icon: "🪧", group: "wide_format" },
  { id: "BANNER", label: "Vinyl Banner", sublabel: "13oz · Hemmed", icon: "🏳️", group: "wide_format" },
  { id: "RIGID", label: "ACP Sign", sublabel: "3mm Aluminum", icon: "🔲", group: "wide_format" },
  { id: "FOAMBOARD", label: "Foam Board", sublabel: "5mm · Indoor", icon: "⬜", group: "wide_format" },
  { id: "MAGNET", label: "Magnet", sublabel: "30mil · Vehicle / Calendar", icon: "🧲", group: "wide_format" },
  { id: "DECAL", label: "Window Decal", sublabel: "Arlon vinyl · Adhesive", icon: "🪟", group: "wide_format" },
  { id: "VINYL_LETTERING", label: "Vinyl Lettering", sublabel: "Cut vinyl · Custom", icon: "✂️", group: "wide_format" },
  { id: "DISPLAY", label: "Retractable Banner", sublabel: "Economy / Deluxe", icon: "🖼️", group: "wide_format" },
  { id: "PHOTO_POSTER", label: "Photo Poster", sublabel: "220gsm Matte", icon: "🎨", group: "wide_format" },
  { id: "FLYER", label: "Flyers", sublabel: "80lb Gloss · Konica", icon: "📄", group: "print" },
  { id: "BUSINESS_CARD", label: "Business Cards", sublabel: "14pt · Konica", icon: "💼", group: "print" },
  { id: "BROCHURE", label: "Brochures", sublabel: "100lb Gloss · Folded", icon: "📋", group: "print" },
  { id: "POSTCARD", label: "Postcards", sublabel: "Standard sizes", icon: "📮", group: "print" },
  { id: "STICKER", label: "Vinyl Stickers", sublabel: "Die-cut · 4×4\" lots", icon: "🔖", group: "print" },
  { id: "DESIGN", label: "Design Service", sublabel: "Artwork · Logo", icon: "✏️", group: "services" },
  { id: "INSTALLATION", label: "Installation", sublabel: "On-site · Mounting", icon: "🔧", group: "services" },
];

interface Props {
  selected: Category | null;
  onSelect: (cat: Category) => void;
}

export function CategoryPicker({ selected, onSelect }: Props) {
  const wideFormat = CATEGORIES.filter((c) => c.group === "wide_format");
  const print = CATEGORIES.filter((c) => c.group === "print");
  const services = CATEGORIES.filter((c) => c.group === "services");

  return (
    <div className="space-y-6">
      <CategoryGroup title="Wide Format (Roland)" items={wideFormat} selected={selected} onSelect={onSelect} />
      <CategoryGroup title="Digital Print (Konica)" items={print} selected={selected} onSelect={onSelect} />
      <CategoryGroup title="Services" items={services} selected={selected} onSelect={onSelect} />
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: CategoryOption[];
  selected: Category | null;
  onSelect: (cat: Category) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-3 px-1">
        {title}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border text-center
                transition-all duration-150 cursor-pointer select-none
                ${isSelected
                  ? "border-[var(--brand)] bg-[var(--brand-50)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--white)] hover:border-gray-300 hover:shadow-sm"
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-[var(--brand)]" : "text-[var(--foreground)]"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{item.sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
