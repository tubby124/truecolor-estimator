import type { Metadata } from "next";

export { PRINT_RESOURCE_SLUGS } from "@/lib/data/print-resource-slugs";

const BASE_URL = "https://truecolorprinting.ca";

export type PrintResourceType = "template" | "project" | "comparison" | "kit";

export interface PrintResourceSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
}

export interface PrintResourceProductLink {
  readonly slug: string;
  readonly href: `/products/${string}`;
  readonly label: string;
  readonly note: string;
}

export interface PrintResource {
  readonly slug: string;
  readonly type: PrintResourceType;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly intro: string;
  readonly canonical: `/print-resources/${string}`;
  readonly updated: "2026-07-15";
  readonly image?: {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
  };
  readonly download?: {
    readonly href: string;
    readonly filename: string;
    readonly label: string;
  };
  readonly sections: readonly PrintResourceSection[];
  readonly productLinks: readonly PrintResourceProductLink[];
}

export const PRINT_RESOURCES = [
  {
    slug: "coroplast-sign-template-18x24",
    type: "template",
    eyebrow: "Artwork template",
    title: "18×24 Coroplast Sign Artwork Template",
    description:
      "Download a dimensionally explicit 18×24 coroplast sign SVG and use the setup checklist to prepare clear, production-ready artwork before ordering.",
    intro:
      "Start with the exact 18×24-inch canvas, keep critical content away from any finishing path, and confirm production tolerances before submitting artwork.",
    canonical: "/print-resources/coroplast-sign-template-18x24",
    updated: "2026-07-15",
    download: {
      href: "/downloads/print-templates/coroplast-sign-18x24.svg",
      filename: "coroplast-sign-18x24.svg",
      label: "Download the 18 by 24 inch coroplast sign SVG template",
    },
    sections: [
      {
        heading: "What is inside the file",
        paragraphs: [
          "The downloadable file is an SVG with an 18-inch width, a 24-inch height, and a proportional 1800 by 2400 viewBox. That makes the document dimensionally explicit without locking you into one design application. SVG files can be opened by many vector editors and placed into a larger production document without losing the underlying paths and text guides.",
          "The outer rectangle identifies the 18×24 trim size. The inner dashed rectangle is deliberately labelled as a reference guide, not a promised safe area. True Color’s product data confirms 18×24 inches as a standard coroplast preset, but the repository does not publish a universal bleed or safety tolerance for this product. For that reason, the template does not invent one. Move or replace the reference guide to suit the finishing plan, and confirm the production tolerance before relying on it.",
        ],
      },
      {
        heading: "Build the artwork in the right order",
        paragraphs: [
          "Begin with the message hierarchy. Put the action a viewer needs to take first, then the supporting detail, then any secondary identifier. A directional sign may need an arrow and one destination. A yard sign may need a short headline and contact detail. Trying to fit a brochure onto an 18×24 panel usually makes every element weaker, even when the file itself is technically correct.",
          "Set the document to the final 18×24 size before laying out type or images. Keep the background separate from text and logos so revisions remain manageable. If the sign will use an H-stake, remember that the coroplast product is 4mm corrugated polypropylene and the product guidance says its flutes run vertically for stake insertion. Confirm orientation with the shop when the layout or cut shape makes flute direction important.",
        ],
        bullets: [
          "Use the red outer line as the final-size reference, not as printable artwork.",
          "Treat the dashed inner guide as configurable reference only.",
          "Keep logos and text as vector shapes where your workflow permits.",
          "Check that linked images remain available when the file is packaged or exported.",
          "Remove or hide instructional layers before exporting final print artwork.",
        ],
      },
      {
        heading: "Preflight before upload",
        paragraphs: [
          "Review the design at full size and at a distance. At full size, inspect edges, alignment, image quality, and unintended objects outside the trim. At a distance, check whether the primary message still wins. Thin type, long web addresses, low-contrast colour pairs, and crowded logo arrangements can all survive a file check while failing as signage.",
          "Confirm whether the order is single- or double-sided. The active coroplast configurator supports both choices, so artwork for a second face should be clearly named and oriented. If the two sides differ, label them rather than assuming production will infer the order. Also identify whether the panel remains rectangular or needs a custom cut, because cut paths require a separate production conversation.",
          "Do not bake the template notes into a flattened background. A clean submission contains the artwork the customer wants printed, plus clearly separated production notes when needed. When uncertainty remains, send the editable file or a proof PDF and ask the shop to confirm the trim, guide, finishing, and orientation before production.",
        ],
      },
      {
        heading: "Choose the matching order path",
        paragraphs: [
          "Use the coroplast sign configurator for a standard rectangular 18×24 panel. It exposes the supported size, side, quantity, and available finishing choices in one place, so the current order details come from the live product configuration rather than a copied claim on this guide.",
          "Use the custom-shape sign path when the artwork depends on an outline rather than a rectangle. The source product describes custom-shape signs as plotter-cut rigid signage and lists coroplast among the material choices. Prepare the visible design and the intended contour as separate, unambiguous elements, then confirm the cut path before placing the order.",
        ],
      },
    ],
    productLinks: [
      {
        slug: "coroplast-signs",
        href: "/products/coroplast-signs",
        label: "Configure an 18×24 coroplast sign",
        note: "Choose the live size, sides, quantity, and finishing options.",
      },
      {
        slug: "custom-shape-signs",
        href: "/products/custom-shape-signs",
        label: "Explore custom-shape rigid signs",
        note: "Use this route when the final edge is not rectangular.",
      },
    ],
  },
  {
    slug: "die-cut-coroplast-project",
    type: "project",
    eyebrow: "Completed project",
    title: "Die-Cut Coroplast Giveaway Sign Project",
    description:
      "See a completed key-shaped coroplast giveaway sign and the practical artwork decisions behind a custom rigid-sign outline, from artwork through ordering.",
    intro:
      "This finished project shows how a printed coroplast panel can become a recognizable giveaway prop when the artwork and cut contour are planned together.",
    canonical: "/print-resources/die-cut-coroplast-project",
    updated: "2026-07-15",
    image: {
      src: "/images/gallery/gallery-coroplast-diecut-sasknation-key.webp",
      alt: "Completed key-shaped die-cut coroplast giveaway sign",
      width: 1200,
      height: 900,
    },
    sections: [
      {
        heading: "What the completed piece demonstrates",
        paragraphs: [
          "The original project image documents a completed key-shaped coroplast sign. The repository’s public project schedule identifies it as a printed, CNC-cut giveaway sign. Those two facts are enough to explain the production idea without guessing at the order quantity, schedule, event result, or customer approval. The useful lesson is the relationship between the silhouette and the graphic: the object reads as a key before a viewer studies the smaller printed details.",
          "A custom outline changes the design problem. On a rectangular sign, the trim is usually a neutral boundary around the message. On a die-cut sign, the boundary becomes part of the message. The key head, shoulder, shaft, and teeth need to remain recognizable after printing and cutting, while the internal graphics still need enough uninterrupted space to read. That makes contour planning an early artwork decision rather than a finishing note added at the end.",
        ],
      },
      {
        heading: "Plan the contour and the printed face together",
        paragraphs: [
          "Start with a clean silhouette that can be understood at the intended viewing distance. Avoid tiny exterior notches or fragile projections unless the shop confirms they suit the chosen material and final size. The repository supports coroplast as 4mm corrugated polypropylene and describes the active custom-shape product as plotter-cut rigid signage. It does not publish a minimum corner radius or cut tolerance, so this article does not prescribe one. Ask for contour review when the shape depends on fine details.",
          "Keep the cut contour distinct from printed artwork. A production file is easier to interpret when one vector path clearly describes the outer shape and the artwork sits beneath it. Do not use a soft shadow, photo edge, or coloured background as the only indication of where the cut should happen. If there are internal holes, slots, or separate pieces, call them out explicitly and confirm feasibility before treating them as approved production details.",
          "The visible project uses the broad upper area of the key shape for the main graphic and leaves the narrow shaft comparatively simple. That is a practical pattern: allocate detailed content to the largest stable area of the silhouette, then use narrow extensions to reinforce the object rather than carry essential copy.",
        ],
      },
      {
        heading: "Choose material and handling around the use",
        paragraphs: [
          "Coroplast is lightweight, waterproof, and available as single- or double-sided print according to the active product specifications. Those properties make it a useful candidate for handheld props, event pieces, directional shapes, and short-term promotional signs. Lightweight does not mean every outline behaves the same way. Long narrow extensions, large unsupported areas, or complex handling can change what makes sense, so share the intended use instead of submitting only a contour with no context.",
          "If the piece needs greater rigidity or a longer-term mounted application, compare the active aluminum composite option. ACP is listed as a 3mm panel with aluminum faces and a polyethylene core, with indoor and outdoor use supported in the product data. The right choice depends on mounting, handling, exposure, and shape—not on a generic claim that one material is always better.",
        ],
      },
      {
        heading: "A practical submission checklist",
        paragraphs: [
          "Provide the intended finished dimensions, a vector contour, the print artwork, and a short note explaining how the piece will be used. Identify which face is front and whether the reverse is blank, repeated, or different. If the graphic contains a logo or small text near the edge, leave room for contour review rather than assuming an unpublished safety distance.",
          "Review a proof for both content and shape. Check spelling and contact details, but also trace the outer edge with your eye. Look for accidental spikes, flat spots, uneven symmetry, or artwork that becomes cramped where the silhouette narrows. A good custom-shape proof should make the finished object easy to imagine before material is cut.",
          "For a similar coroplast concept, start with the custom-shape sign configurator. For a standard rectangular panel that does not rely on a contour, use the coroplast sign configurator instead. Both paths lead to current product choices and exact live pricing without embedding a stale project price in this completed-work record.",
        ],
      },
    ],
    productLinks: [
      {
        slug: "custom-shape-signs",
        href: "/products/custom-shape-signs",
        label: "Configure a custom-shape rigid sign",
        note: "Start here when the silhouette is part of the concept.",
      },
      {
        slug: "coroplast-signs",
        href: "/products/coroplast-signs",
        label: "Configure a rectangular coroplast sign",
        note: "Use the standard route when no custom contour is needed.",
      },
    ],
  },
  {
    slug: "coroplast-vs-aluminum-composite",
    type: "comparison",
    eyebrow: "Material comparison",
    title: "Coroplast vs Aluminum Composite Signs",
    description:
      "Compare coroplast and aluminum composite by construction, weight, mounting, print sides, and practical sign use before ordering for your application.",
    intro:
      "Coroplast is a lightweight corrugated polypropylene panel; aluminum composite is a rigid layered panel. Match the material to handling, mounting, and service life.",
    canonical: "/print-resources/coroplast-vs-aluminum-composite",
    updated: "2026-07-15",
    sections: [
      {
        heading: "The short decision",
        paragraphs: [
          "Choose coroplast when low weight, easy handling, ground-stake compatibility, or temporary and frequently moved signage matters most. Choose aluminum composite when the sign will be mounted as a more rigid panel and the application benefits from a solid surface and greater long-term durability. Both are active True Color products with full-colour printing. Coroplast and ACP support one- or two-sided ordering using their active pricing rules.",
          "That summary is a starting point, not a substitute for the use case. A small panel carried between events has different demands from a property sign fixed to posts. A construction notice attached to temporary hoarding has different demands from a permanent parking sign. Decide where the sign goes, how it is supported, how often it moves, and which faces must be read before selecting material.",
        ],
      },
      {
        heading: "Construction and physical behaviour",
        paragraphs: [
          "The coroplast product is specified as 4mm corrugated polypropylene. Its internal flutes reduce weight and create channels that accept H-stakes when the flutes are oriented vertically. The product data describes it as waterproof, UV-resistant, and rated for outdoor use. Because it is lightweight, one person can usually handle common sign sizes more easily than a denser rigid panel.",
          "The aluminum composite product is specified as a 3mm panel made from two aluminum faces bonded to a polyethylene core. Its product content describes a smooth, non-porous print surface and indoor or outdoor use. It is presented for more permanent applications such as building signs, parking signs, property signs, menu boards, and directional systems. It is also heavier than coroplast, which matters for transport and mounting.",
          "Neither material choice determines installation by itself. Panel size, wind exposure, support spacing, fasteners, edge clearance, and the structure receiving the sign all matter. The product data lists drilled holes and rounded corners as available finishing for ACP, while coroplast offers H-stakes and grommets through its current order path. Confirm the final mounting plan rather than assuming every fastener or support suits every panel.",
        ],
      },
      {
        heading: "Print, sides, sizes, and shapes",
        paragraphs: [
          "Coroplast supports single- and double-sided ordering and lists 12×18, 18×24, 24×36, and 4×8 feet as standard presets, with custom sizing available. That range covers common yard, directional, event, and site-sign formats. The corrugated structure also makes flute direction relevant when a ground stake is part of the plan.",
          "ACP supports one- or two-sided ordering in the active configurator and lists 12×18, 18×24, 24×36, and 4×8 feet as standard presets, with custom sizing available. The ACP product notes that custom shapes require routing, while the custom-shape sign product describes an in-house plotter cut. Coroplast also appears in that custom-shape product, so both materials may be candidates for contoured work; the best choice still depends on the shape, handling, and mounting requirements.",
          "Both product pages describe full-colour direct UV printing. Avoid turning that shared capability into a claim that the finished pieces will look identical. Surface structure, edge appearance, rigidity, lighting, and viewing distance influence the result. If close-up finish is critical, ask to review the material choice with the artwork and intended placement in view.",
        ],
      },
      {
        heading: "Use-case comparison",
        paragraphs: [
          "For lawn signs, portable event direction, temporary notices, and lightweight promotional pieces, coroplast is usually the more direct starting point. Its stake compatibility and low weight solve real handling problems. For wall-mounted business identification, parking and property signs, menu panels, and other rigid installations, ACP is usually the more direct starting point.",
          "There are edge cases. A large coroplast panel may need more support than a small one. A small ACP panel may still be inappropriate for a mounting surface that cannot carry it. A custom silhouette might favour easy handling, or it might need the stiffness of a composite panel. Write down the constraints before ordering: finished size, viewing sides, indoor or outdoor placement, expected handling, mounting method, and whether the shape is rectangular or routed.",
          "Use the two live configurators to compare supported dimensions, sides, quantities, finishing, and exact current price. This article intentionally does not reproduce price claims because the configurators are the maintained source for an actual order. If the mounting or cut requirement is not represented, use the quote path with the same written constraints.",
        ],
      },
    ],
    productLinks: [
      {
        slug: "coroplast-signs",
        href: "/products/coroplast-signs",
        label: "See exact coroplast sign price",
        note: "Configure dimensions, sides, quantity, and available add-ons.",
      },
      {
        slug: "acp-signs",
        href: "/products/acp-signs",
        label: "See exact aluminum composite sign price",
        note: "Configure the rigid-panel size, sides, quantity, and finishing.",
      },
    ],
  },
  {
    slug: "construction-site-signage-kit",
    type: "kit",
    eyebrow: "Planning kit",
    title: "Construction Site Signage Kit Planner",
    description:
      "Plan a construction-site print set with coroplast, aluminum composite, vinyl banners, vehicle magnets, and business cards—without a fixed bundle.",
    intro:
      "Build a site-specific set from products True Color currently fulfills. Order only the pieces the project needs; this is a planning sequence, not a discounted bundle.",
    canonical: "/print-resources/construction-site-signage-kit",
    updated: "2026-07-15",
    sections: [
      {
        heading: "Start with the communication map",
        paragraphs: [
          "Walk through the site on paper before choosing products. List who needs information: deliveries, trades, visitors, inspectors, neighbours, and the public. Then list where each decision happens. The entrance may need project identification. A fork in the access route may need direction. A restricted area may need a notice. A fence line may need a larger message that remains visible from farther away.",
          "Separate operational information from promotion. A panel carrying an address, access instruction, or safety message should prioritize clarity. A banner presenting the contractor or project can use a broader brand layout. Combining every purpose on one sign often produces small type and weak hierarchy. A kit works better when each piece has one clear job and the set uses consistent colour, logo treatment, and contact information.",
        ],
      },
      {
        heading: "Choose rigid signs by placement",
        paragraphs: [
          "Use coroplast for lightweight panels that may move as the site changes. The active product is 4mm corrugated polypropylene, supports single- or double-sided printing, and includes common presets from small directional formats through full sheets. H-stakes and grommets are represented as available add-ons in the product data. That makes coroplast a practical starting point for temporary directions, short-term notices, and replaceable phase signage.",
          "Use aluminum composite when the sign needs a more rigid panel for a mounted application. The active ACP product is a 3mm construction with aluminum faces and a polyethylene core. Its product data supports indoor and outdoor use and lists drilled holes and rounded corners as finishing choices. It is a better starting point for site identification, parking, property, or directional panels intended to remain mounted.",
          "Do not select a substrate without a support plan. Record the panel size, attachment surface, wind exposure, viewing distance, and whether the sign must be read from both directions. The online configurators cover product choices; unusual installation conditions should be discussed separately before production.",
        ],
      },
      {
        heading: "Add fence and mobile visibility",
        paragraphs: [
          "A 13oz scrim vinyl banner can carry a larger project or contractor message on fencing or hoarding. The active banner product lists hemmed edges as standard and optional grommets, with custom dimensions available through its configurator. Plan the banner around the actual support location. Keep key copy away from folds, ties, visual clutter behind the fence, and any area that may be obscured by stored materials.",
          "Vehicle magnets extend identification to steel work vehicles without making the graphic permanent. The active product uses 30mil flexible magnetic sheeting with a white gloss print surface. It only adheres to steel, so test the exact vehicle panel before ordering. Choose a flat placement, measure the usable area, and avoid crossing trim, handles, or strong body contours.",
          "Business cards serve the close-range handoff that large signs cannot. The active product uses the standard 3.5×2-inch format on 14pt gloss card stock and supports single- or double-sided print. Keep project-specific details off a reusable company card unless that is intentional; a general contact card can move between sites while the large-format pieces carry location-specific information.",
        ],
      },
      {
        heading: "Order as coordinated pieces, not a fictional bundle",
        paragraphs: [
          "Create one simple content sheet before opening the configurators. Include the approved company name, logo file, phone and web details, project naming convention, colours, and the exact message assigned to each sign. That reduces contradictions across products and gives the artwork a repeatable hierarchy. Mark which pieces are single-sided, which require a different reverse, and which need a custom contour.",
          "Order coroplast, ACP, banners, magnets, and cards through their individual current product paths. There is no package discount or fixed kit price represented here. The purpose of the planner is to prevent missing pieces and mismatched artwork, not to imply a preconfigured offer. Use each live configurator for the exact current price and supported options, and use the quote route when the site or installation falls outside those choices.",
          "Before submitting, perform a consistency check. Compare the spelling of names, phone numbers, web addresses, colours, and logo versions across every file. Then perform a placement check: can each message be read where the decision occurs? That final question is more valuable than adding another product to the list.",
        ],
      },
    ],
    productLinks: [
      {
        slug: "coroplast-signs",
        href: "/products/coroplast-signs",
        label: "Configure temporary coroplast site signs",
        note: "Plan movable directions, notices, and short-term panels.",
      },
      {
        slug: "acp-signs",
        href: "/products/acp-signs",
        label: "Configure rigid aluminum composite signs",
        note: "Plan mounted identification, parking, and property panels.",
      },
      {
        slug: "vinyl-banners",
        href: "/products/vinyl-banners",
        label: "Configure a vinyl site banner",
        note: "Set the size and finishing for a fence or hoarding message.",
      },
      {
        slug: "vehicle-magnets",
        href: "/products/vehicle-magnets",
        label: "Configure removable vehicle magnets",
        note: "Measure and test the exact steel vehicle panel first.",
      },
      {
        slug: "business-cards",
        href: "/products/business-cards",
        label: "Configure business cards for site handoffs",
        note: "Use a compact, reusable contact piece for close-range exchanges.",
      },
    ],
  },
  {
    slug: "trade-show-print-kit",
    type: "kit",
    eyebrow: "Planning kit",
    title: "Trade Show Print Kit Planner",
    description:
      "Plan a coordinated trade-show print set with retractable banners, vinyl banners, flyers, and business cards using active order paths for one booth.",
    intro:
      "Design the booth as a sequence: attract attention, explain the offer, support a conversation, and give visitors a useful piece to take away.",
    canonical: "/print-resources/trade-show-print-kit",
    updated: "2026-07-15",
    sections: [
      {
        heading: "Assign one job to each printed piece",
        paragraphs: [
          "A trade-show booth is viewed at several distances. From the aisle, visitors need a quick reason to look. At the booth edge, they need enough context to decide whether to stop. During a conversation, they may need details, examples, or a way to compare options. After the conversation, they need a compact reminder that still makes sense away from the display.",
          "Map products to those moments. A retractable banner can carry the primary identity and one clear promise. A vinyl banner can define a wider backdrop, table front, or secondary message. A flyer can explain an offer, process, or product range. A business card can preserve the personal contact. Repeating the same dense paragraph on all four pieces wastes the strengths of each format.",
        ],
      },
      {
        heading: "Build the display layer",
        paragraphs: [
          "The active retractable-banner product includes the printed banner and stand, with Economy, Deluxe, and Premium stand choices represented in the product data. Its standard graphic size is listed as 33.5×80 inches. Design for a vertical reading path: identity near the top, core message through the centre, and secondary detail lower down. Keep essential information where it remains visible when people or furniture occupy the foreground.",
          "The active vinyl-banner product uses 13oz scrim vinyl, includes hemmed edges as standard, and offers optional grommets. Preset and custom sizes are available through its configurator. Before ordering, confirm how the venue permits banners to be attached. A banner designed for grommets does not solve a venue rule that prohibits tying to walls, and a table-front banner needs dimensions based on the actual table rather than a generic booth assumption.",
          "Choose between the two by function rather than treating them as duplicates. The retractable stand is self-contained and vertical. The vinyl banner depends on a support or attachment method but can span a wider area. Some booths need one; others use both with distinct messages.",
        ],
      },
      {
        heading: "Build the handout layer",
        paragraphs: [
          "The active flyer product supports letter and half-letter formats, single- or double-sided printing, and full-colour digital output. A flyer should answer the next questions created by the display, not copy the display word for word. Use headings, short sections, and a clear follow-up action. If staff will write notes on it, reserve a deliberately open area and consider how the selected paper surface works for that use.",
          "The active business-card product uses a standard 3.5×2-inch format and supports one or two printed sides. Assign the card a narrower job than the flyer: identify the person or business and preserve the best follow-up route. Small type and overloaded service lists are difficult to use in a noisy event environment. If a QR code is included, keep a readable text destination or contact method beside it so the card still works when scanning is inconvenient.",
          "Decide how many distinct handouts are actually necessary before designing variants. A single well-structured flyer and one consistent card are often easier for booth staff to explain and replenish than several nearly identical sheets. This planner does not prescribe quantities because attendance, staffing, distribution rules, and reuse plans are event-specific.",
        ],
      },
      {
        heading: "Coordinate artwork and place individual orders",
        paragraphs: [
          "Create a shared artwork brief containing the approved logo, colour references, key message, supporting points, image choices, and follow-up action. Then adapt the hierarchy to each format. Consistency should come from the same identity and message system, not from shrinking one master layout onto every product.",
          "Proof the set together. Place small previews of the banner stand, vinyl banner, flyer, and card on one page and ask whether they look like the same exhibitor. Then proof each at final dimensions for image quality, text size, edge treatment, and hidden content. Confirm the real stand, table, wall, or support dimensions before approving large-format files.",
          "Order each item through its active configurator. There is no invented package price, discount, or production schedule attached to this kit. The individual paths provide current supported choices and exact pricing for the selected configuration. If venue hardware, unusual finishing, or a nonstandard format is required, document it and use the quote path instead of assuming it is included.",
          "Pack the booth around the communication sequence: display hardware and large graphics, then handouts, then a simple restocking location for staff. The printed set is successful when a visitor can understand the booth from the aisle and leave with the right next step—not when every available surface contains copy.",
        ],
      },
    ],
    productLinks: [
      {
        slug: "retractable-banners",
        href: "/products/retractable-banners",
        label: "Configure a retractable banner stand",
        note: "Choose the current stand option and included printed graphic.",
      },
      {
        slug: "vinyl-banners",
        href: "/products/vinyl-banners",
        label: "Configure a vinyl booth banner",
        note: "Match dimensions and finishing to the approved venue support.",
      },
      {
        slug: "flyers",
        href: "/products/flyers",
        label: "Configure trade-show flyers",
        note: "Choose the live size, paper, sides, and quantity.",
      },
      {
        slug: "business-cards",
        href: "/products/business-cards",
        label: "Configure business cards",
        note: "Create the compact follow-up piece for booth conversations.",
      },
    ],
  },
] as const satisfies readonly PrintResource[];

export function getPrintResource(slug: string): PrintResource | undefined {
  return PRINT_RESOURCES.find((resource) => resource.slug === slug);
}

export function buildPrintResourceMetadata(resource: PrintResource): Metadata {
  const url = `${BASE_URL}${resource.canonical}`;
  const title = `${resource.title} | True Color`;
  const image = resource.image?.src ?? "/og-image.png";
  return {
    title: { absolute: title },
    description: resource.description,
    alternates: { canonical: resource.canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: resource.description,
      url,
      type: "article",
      locale: "en_CA",
      images: resource.image
        ? [
            {
              url: resource.image.src,
              width: resource.image.width,
              height: resource.image.height,
              alt: resource.image.alt,
            },
          ]
        : [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resource.description,
      images: [image],
    },
  };
}

type JsonLd = Readonly<Record<string, unknown>>;

export function buildPrintResourceSchemas(
  resource: PrintResource,
): readonly [JsonLd, JsonLd] {
  const url = `${BASE_URL}${resource.canonical}`;
  const breadcrumb: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumbs`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resources",
        item: `${BASE_URL}/resources`,
      },
      { "@type": "ListItem", position: 3, name: resource.title, item: url },
    ],
  };

  const common = {
    "@context": "https://schema.org",
    "@id": `${url}#resource`,
    name: resource.title,
    description: resource.description,
    url,
    datePublished: resource.updated,
    dateModified: resource.updated,
    publisher: {
      "@type": "Organization",
      name: "True Color Display Printing",
      url: BASE_URL,
    },
  };

  if (resource.type === "template") {
    return [
      breadcrumb,
      {
        ...common,
        "@type": "DigitalDocument",
        encoding: {
          "@type": "MediaObject",
          contentUrl: `${BASE_URL}${resource.download?.href}`,
          encodingFormat: "image/svg+xml",
        },
      },
    ];
  }

  if (resource.type === "kit") {
    return [
      breadcrumb,
      {
        ...common,
        "@type": "ItemList",
        numberOfItems: resource.productLinks.length,
        itemListElement: resource.productLinks.map((link, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: link.label,
          url: `${BASE_URL}${link.href}`,
        })),
      },
    ];
  }

  return [
    breadcrumb,
    {
      ...common,
      "@type": "Article",
      headline: resource.title,
      image: resource.image ? `${BASE_URL}${resource.image.src}` : undefined,
    },
  ];
}
