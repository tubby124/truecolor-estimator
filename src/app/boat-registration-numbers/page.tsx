import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Boat Registration Numbers SK | $39 a Pair | True Color" },
  description:
    "SK boat licence number decals cut to Transport Canada spec — 3\" block characters, $39 a pair, boat name decal $18. Printed in Saskatoon, 1–3 business days.",
  alternates: { canonical: "/boat-registration-numbers" },
  openGraph: {
    title: "Boat Registration Number Decals Saskatchewan | $39 a Pair | True Color",
    description:
      "Pleasure Craft Licence number decals for Saskatchewan boats. 3\" die-cut block characters, both sides of the bow, $39 a pair. Boat name decals $18. Saskatoon.",
    url: "https://truecolorprinting.ca/boat-registration-numbers",
    images: [{ url: "/images/industries/boat-registration-numbers/boat-registration-number-decal-aluminum-bow-1200x800.webp", width: 1200, height: 900 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boat Registration Numbers SK | $39 a Pair | True Color",
    description:
      "SK Pleasure Craft Licence decals cut to the 7.5 cm Transport Canada minimum. $39 a pair, name decal $18. Saskatoon.",
    images: ["/images/industries/boat-registration-numbers/boat-registration-number-decal-aluminum-bow-1200x800.webp"],
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      A set of boat registration number decals is <strong>$39 a pair</strong> — one for the port
      side of the bow, one for the starboard side — cut to the size Transport Canada requires.
      Every licensed pleasure craft in Saskatchewan has to carry its Pleasure Craft Licence
      number on the hull, and the rule is specific: block characters at least{" "}
      <strong>7.5 cm (3 inches) high</strong>, on <strong>both sides of the bow</strong>, above
      the waterline, in a colour that contrasts with the hull. Saskatchewan-issued licences
      start with the SK prefix — something like SK1234567 — and that whole string is what goes
      on the boat.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      You need a Pleasure Craft Licence if your boat has a motor of 10 hp (7.5 kW) or more.
      Transport Canada sets a $250 fine for operating a pleasure craft without a valid licence,
      and separate penalties apply under the Canada Shipping Act, 2001 when the number is
      missing, undersized, or too faint to read against the hull. The licence itself is free
      from Transport Canada — the decals are the only part you pay for, and at True Color that
      is $39.
    </p>
    <p className="text-gray-600 leading-relaxed mb-6">
      Four letter heights are priced online. The 3-inch set at <strong>$39 a pair</strong> runs
      across an 18-inch span, fits the SK licence format, and clears the legal minimum without
      crowding a small bow — it suits most runabouts and aluminum fishing boats. Going bigger is
      a readability choice rather than a legal one: <strong>3.5&quot; is $45</strong>,{" "}
      <strong>4&quot; is $52</strong>, and <strong>6&quot; is $65</strong> a pair, which is what
      pontoons and cruisers usually want since a 3-inch character looks lost on a tall hull. The
      characters are die-cut from 3 mil vinyl on our in-house Roland TrueVIS VG2 eco-solvent
      printer/cutter at 216 33rd St W in Saskatoon — there is no printing and no background,
      just the bare letters and numbers, so nothing shows on the hull except the characters
      themselves. Nine colours are available at no upcharge: black, white, red, blue, gold,
      silver, orange, green, and yellow. Black on bare aluminum or a light hull and white or
      silver on a dark hull cover most boats — and contrast is the legal requirement, not a
      style preference, so pick the colour that stands off your hull hardest. Type your number
      into the configurator and you will see it previewed in the exact colour and height before
      you pay. This is the same die-cut method used for{" "}
      <Link href="/vinyl-lettering-saskatoon" className="text-[#16C2F3] underline font-medium">
        vinyl lettering
      </Link>{" "}
      on storefronts and truck doors.
    </p>
    <p className="text-gray-600 leading-relaxed mb-6">
      Each set arrives on premask transfer tape, so applying it is a three-step job and takes
      about ten minutes. Wipe the hull clean and let it dry. Position the tape with the whole
      string aligned, then press it down firmly from the centre out. Peel the tape away and the
      characters stay behind, evenly spaced. Aluminum, fibreglass, and painted hulls all hold it
      fine as long as the surface is clean, dry, and above roughly 10°C when you apply it.
      Aluminum boats are the most common job we cut these for, because magnets will not hold on
      an aluminum hull at all.
    </p>
    <p className="text-gray-600 leading-relaxed mb-6">
      Add your boat&apos;s name for <strong>$18</strong> — most owners run the licence number on
      the bow and the name on the transom or along the side, which comes to $57 for a 3-inch
      pair plus the name. Fleets are straightforward too: set the quantity to the number of
      boats and the price scales per boat. For full-colour graphics or a logo alongside the
      number, send the details through the{" "}
      <Link href="/quote" className="text-[#16C2F3] underline font-medium">
        quote form
      </Link>{" "}
      instead. Northern Saskatchewan outfitters and fishing lodges order these six and eight at
      a time for aluminum fleet boats — a recent six-boat set of 18×4&quot; full-colour decals
      was quoted at $29 each.
    </p>
    <p className="text-gray-600 leading-relaxed mb-10">
      Not sure which height or colour your boat needs? Our{" "}
      <Link
        href="/print-resources/saskatchewan-boat-registration-number-rules"
        className="text-[#16C2F3] underline font-medium"
      >
        Saskatchewan boat registration number rules guide
      </Link>{" "}
      walks through the four things Transport Canada checks, how to pick a colour that actually
      contrasts with your hull, and how to apply the decals without lifting an edge.
    </p>
    <p className="text-gray-600 leading-relaxed mb-10">
      There is nothing for you to design: send the licence number and we set the characters from
      it. If you want a custom layout, a logo beside the name, or a matching set of{" "}
      <Link href="/sticker-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        vinyl stickers
      </Link>{" "}
      for the trailer, in-house design is $40 flat with a same-day proof. Standard turnaround is
      1–3 business days once we have your number. Same-day rush is +$40 flat on orders placed
      before 10 AM. Pickup at 216 33rd St W, Saskatoon.
    </p>
  </>
);

export default function BoatRegistrationNumbersPage() {
  return (
    <IndustryPage
      canonicalSlug="boat-registration-numbers"
      primaryProductSlug="boat-registration-numbers"
      title="Boat Registration Number Decals — Saskatchewan"
      subtitle="SK Pleasure Craft Licence numbers cut to Transport Canada spec. $39 a pair, both sides of the bow."
      heroImage="/images/industries/boat-registration-numbers/boat-registration-number-decal-aluminum-bow-1200x800.webp"
      heroAlt="Black die-cut SK boat registration number decal applied above the waterline on the bow of an aluminum fishing boat on a Saskatchewan lake"
      galleryImages={[
        {
          src: "/images/industries/boat-registration-numbers/boat-registration-number-decal-transfer-tape-1200x1200.webp",
          alt: "Die-cut black vinyl SK boat registration number lettering on clear premask transfer tape with a squeegee, ready to apply",
        },
        {
          src: "/images/industries/boat-registration-numbers/boat-registration-decal-application-squeegee-1200x800.webp",
          alt: "Applying a white SK boat registration number decal to a navy hull with a squeegee, premask transfer tape peeling back",
        },
        {
          src: "/images/industries/boat-registration-numbers/boat-registration-numbers-outfitter-fleet-1200x800.webp",
          alt: "Three aluminum outfitter fishing boats on a northern Saskatchewan lakeshore, each with matching black SK registration numbers on the bow",
        },
        {
          src: "/images/industries/boat-registration-numbers/boat-name-decal-transom-red-1200x800.webp",
          alt: "Red die-cut vinyl boat name decal applied across the transom of a white fibreglass boat on a trailer",
        },
        {
          src: "/images/gallery/gallery-boat-licence-number-lettering.webp",
          alt: "Matching port and starboard SK boat licence number decals plus a red boat name decal cut at True Color in Saskatoon",
        },
      ]}
      description="Boat registration number decals start at $39 a pair — one for the port side of the bow, one for the starboard side — cut to the size Transport Canada requires. Every licensed pleasure craft in Saskatchewan has to carry its Pleasure Craft Licence number on the hull: block characters at least 7.5 cm (3 inches) high, on both sides of the bow, above the waterline, in a colour that contrasts with the hull. Saskatchewan-issued licences start with the SK prefix and that whole string goes on the boat, closed up with no space. You need a Pleasure Craft Licence if your boat has a motor of 10 hp (7.5 kW) or more. Transport Canada sets a $250 fine for operating without a valid licence, and separate penalties apply under the Canada Shipping Act, 2001 when the number is missing or undersized. Four letter heights are priced online: 3 inches at $39 a pair clears the legal minimum and suits most runabouts and aluminum fishing boats, 3.5 inches is $45, 4 inches is $52, and 6 inches is $65 for pontoons and cruisers where a 3-inch character looks lost. Every set is die-cut from 3 mil vinyl on our in-house Roland TrueVIS VG2 eco-solvent printer/cutter at 216 33rd St W in Saskatoon — no printing and no background, just the characters. Nine colours are available at no upcharge: black, white, red, blue, gold, silver, orange, green, and yellow. Black on bare aluminum or a light hull and white or silver on a dark hull cover most boats, and contrast is a legal requirement rather than a style preference. Type your number into the configurator and you will see it previewed in the exact colour and height before you pay. Each set arrives on premask transfer tape, so applying it takes about ten minutes: wipe the hull clean, position the tape, press from the centre out, then peel the tape away. Aluminum, fibreglass, and painted hulls all hold it as long as the surface is clean, dry, and above roughly 10°C. Aluminum boats are the most common job, because magnets will not hold on an aluminum hull. Add your boat's name for $18. Fleets scale per boat straight from the cart; full-colour graphics and logos are quoted directly, and a recent six-boat set of 18×4-inch full-colour decals for a northern Saskatchewan outfitter was quoted at $29 each. In-house design is $40 flat with a same-day proof. Standard turnaround is 1–3 business days. Same-day rush is +$40 flat before 10 AM. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      productOffer={{
        name: "Boat Registration Number Decals",
        description:
          "Die-cut SK Pleasure Craft Licence number decals in 3 inch block characters, sold as a matched port and starboard pair. Boat name decals available separately.",
        lowPrice: 39,
        highPrice: 65,
        offerCount: 4,
        image: "/images/industries/boat-registration-numbers/boat-registration-number-decal-aluminum-bow-1200x800.webp",
      }}
      products={[
        { name: "Boat Registration Numbers", from: "$39 a pair", slug: "boat-registration-numbers" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Stickers", from: "from $25", slug: "stickers" },
      ]}
      whyPoints={[
        "$39 a matched pair — port and starboard, cut at the 3 inch (7.5 cm) Transport Canada minimum",
        "Die-cut from 3 mil vinyl — no printed background, so only the characters show on the hull",
        "Holds on aluminum where magnets cannot — plus fibreglass and painted hulls",
        "Premask transfer tape included — the whole number goes on aligned in one pass",
        "Boat name decal $18 — bow number and transom name for $57 together",
        "1–3 business days, or same-day rush +$40 flat before 10 AM. Saskatoon pickup.",
      ]}
      faqs={[
        {
          q: "How big do boat registration numbers have to be in Saskatchewan?",
          a: "At least 7.5 cm (3 inches) high, in block characters, in a colour that contrasts with your hull. The $39 pair is cut at exactly 3 inches, so it clears the minimum. Going bigger is a readability choice, not a legal one: 3.5\" is $45, 4\" is $52, and 6\" is $65 a pair — worth it on a pontoon or cruiser where a 3-inch character looks lost on the hull.",
        },
        {
          q: "What colour should I pick?",
          a: "Whatever contrasts hardest with your hull — that part is the law, not a style preference. Black on bare aluminum or a white hull; white or silver on dark blue, black, or green. All nine colours (black, white, red, blue, gold, silver, orange, green, yellow) cost the same, so choose for contrast rather than price. The configurator previews your number in the colour and height you pick before you pay.",
        },
        {
          q: "Is there a space after the SK?",
          a: "No. The licence number is cut closed up — SK straight into the digits, exactly as it appears on your Pleasure Craft Licence. Type it either way in the configurator and we close it up for you, and the live preview shows you the exact string that goes on the hull before you pay.",
        },
        {
          q: "Where on the boat does the licence number go?",
          a: "On both sides of the bow, above the waterline, as far forward as practical, and not blocked by rails or equipment. That is why the set is sold as a $39 pair — you need one on the port side and one on the starboard side.",
        },
        {
          q: "Does Saskatchewan have its own boat registration system?",
          a: "No. Boat licensing is federal, through Transport Canada's Pleasure Craft Licence programme. Saskatchewan-issued numbers simply carry the SK prefix, like SK1234567. We cut the $39 pair with whatever number is printed on your licence.",
        },
        {
          q: "Do I need a licence for my boat, and what is the fine?",
          a: "You need a Pleasure Craft Licence if your boat has a motor of 10 hp (7.5 kW) or more. Transport Canada sets a $250 fine for operating without a valid licence, and separate penalties apply under the Canada Shipping Act, 2001 if the number is not properly displayed. The licence is free to obtain — only the $39 decals cost anything.",
        },
        {
          q: "Will vinyl numbers stick to an aluminum boat?",
          a: "Yes. The 3 mil vinyl bonds to aluminum, fibreglass, and painted hulls as long as the surface is clean, dry, and above roughly 10°C when applied. Aluminum is the most common hull we cut $39 pairs for, since magnetic signage will not hold on aluminum at all.",
        },
        {
          q: "Can I get my boat's name as well as the number?",
          a: "Yes — a boat name decal is $18 on top of the $39 registration pair, so $57 for both. Most owners put the licence number on the bow and the name on the transom or along the side.",
        },
        {
          q: "I run an outfitting or lodge operation with several boats. Can you do a fleet?",
          a: "Yes, and fleets are worth quoting rather than ordering one at a time. Fleet sets, character heights above 3 inches, and full-colour decals are priced through the quote form. As a reference point, a recent six-boat set of 18×4\" full-colour decals was quoted at $29 each.",
        },
        {
          q: "How fast can I get boat numbers in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from the time we have your licence number — there is no artwork for you to supply. Same-day rush is +$40 flat if you order before 10 AM. Pickup is at 216 33rd St W, Saskatoon. In-house design, if you want a custom layout, is $40 flat with a same-day proof.",
        },
      ]}
    />
  );
}
