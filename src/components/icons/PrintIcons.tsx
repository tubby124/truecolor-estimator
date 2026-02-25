import {
  Signpost,
  Flag,
  Frame,
  PanelTop,
  Magnet,
  Sticker,
  Grid3x3,
  Type,
  Scroll,
  Image as ImageIcon,
  FileText,
  CreditCard,
  BookOpen,
  Mail,
  Tag,
  CalendarDays,
  Pen,
  Wrench,
  Printer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Map product slug → Lucide icon (quote page, product pages) */
export const SLUG_ICON_MAP: Record<string, LucideIcon> = {
  "coroplast-signs": Signpost,
  "vinyl-banners": Flag,
  "acp-signs": Frame,
  "foamboard-displays": PanelTop,
  "vehicle-magnets": Magnet,
  "window-decals": Sticker,
  "window-perf": Grid3x3,
  "vinyl-lettering": Type,
  "retractable-banners": Scroll,
  "photo-posters": ImageIcon,
  "flyers": FileText,
  "business-cards": CreditCard,
  "brochures": BookOpen,
  "postcards": Mail,
  "stickers": Tag,
  "magnet-calendars": CalendarDays,
};

/** Map category ID → Lucide icon (staff CategoryPicker) */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  SIGN: Signpost,
  BANNER: Flag,
  RIGID: Frame,
  FOAMBOARD: PanelTop,
  MAGNET: Magnet,
  DECAL: Sticker,
  VINYL_LETTERING: Type,
  DISPLAY: Scroll,
  PHOTO_POSTER: ImageIcon,
  FLYER: FileText,
  BUSINESS_CARD: CreditCard,
  BROCHURE: BookOpen,
  POSTCARD: Mail,
  STICKER: Tag,
  DESIGN: Pen,
  INSTALLATION: Wrench,
};

interface PrintIconProps {
  slug?: string;
  categoryId?: string;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

/** Renders the Lucide icon for a product slug or category ID. Falls back to Printer. */
export function PrintIcon({
  slug,
  categoryId,
  size = 32,
  className,
  "aria-hidden": ariaHidden,
}: PrintIconProps) {
  const key = slug ?? categoryId ?? "";
  const Icon = (slug ? SLUG_ICON_MAP[key] : CATEGORY_ICON_MAP[key]) ?? Printer;
  return (
    <Icon
      size={size}
      strokeWidth={1.5}
      className={className}
      aria-hidden={ariaHidden}
    />
  );
}
