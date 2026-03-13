import Image from "next/image";

export interface DesignDirectionItem {
  src: string;
  alt: string;
  label: string;
  caption: string;
}

export interface DesignDirectionSection {
  title: string;
  subtitle: string;
  aspect: "3/1" | "3/4" | "4/3" | "3/8";
  maxCols?: 2 | 3;
  items: DesignDirectionItem[];
}

export interface DesignDirectionGridProps {
  sections: DesignDirectionSection[];
}

export function DesignDirectionGrid({
  sections,
}: DesignDirectionGridProps) {
  return (
    <>
      {sections.map((section, sectionIndex) => {
        const cols = section.maxCols ?? 3;
        const isLast = sectionIndex === sections.length - 1;
        const sizes =
          cols === 3
            ? "(max-width:640px) 100vw, 33vw"
            : "(max-width:640px) 50vw, 25vw";
        const gridClass =
          cols === 2
            ? "grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md"
            : "grid grid-cols-1 sm:grid-cols-3 gap-4";

        return (
          <div key={sectionIndex} className={isLast ? undefined : "mb-10"}>
            <h3 className="text-xl font-bold text-[#1c1712] mb-1">
              {section.title}
            </h3>
            <p className="text-sm text-gray-500 mb-5">{section.subtitle}</p>
            <div className={gridClass}>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <div
                    className="relative w-full rounded-lg overflow-hidden mb-3"
                    style={{ aspectRatio: section.aspect }}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes={sizes}
                      loading="lazy"
                    />
                  </div>
                  <p className="font-semibold text-sm text-[#1c1712]">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
