import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Postcard Printing Saskatoon | 4×6, 5×7 | True Color",
  description:
    "Postcard printing in Saskatoon from $40 for 50. 4×6 and 5×7 on 14pt gloss, double-sided. Same-day rush +$40. Real estate mailers, promos, event invites. 216 33rd St W.",
  alternates: { canonical: "/postcard-printing-saskatoon" },
  openGraph: {
    title: "Postcard Printing Saskatoon | True Color Display Printing",
    description:
      "14pt gloss postcards from $40/50. 4×6 and 5×7, double-sided. Same-day rush available. Local Saskatoon pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/postcard-printing-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function PostcardPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="postcard-printing-saskatoon"
      primaryProductSlug="postcards"
      title="Postcard Printing Saskatoon"
      subtitle="Direct mail that lands in hands — not a spam folder."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Postcard printing Saskatoon — 4x6 and 5x7 gloss direct mail"
      description="True Color prints direct mail postcards in Saskatoon on 14pt gloss stock, double-sided, starting at $40 for 50 postcards (4×6\") or $85 for 250. We print 4×6, 5×7, and 3×4 sizes in-house on our Roland UV printer — colour is sharp, mailable, and Canada Post admail compliant. Same-day rush available for +$40 flat on orders placed before 10 AM. In-house designer $35 flat with same-day proof. Popular for real estate just-listed cards, restaurant promos, event invitations, and business announcements. Pickup at 216 33rd St W, Saskatoon or call (306) 954-8688."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Postcards printed in Saskatoon on 14pt gloss, double-sided — starting at $40 for
            50 (4×6&quot;) or $85 for 250. Saskatchewan businesses use direct mail postcards
            because they skip the inbox and land in hands. We print in-house on our Roland UV
            printer so colour is vibrant, sharp, and ready for Canada Post admail drops.
            Same-day rush available for +$40 flat on orders placed before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            The most popular use is{" "}
            <Link href="/real-estate-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              real estate just-listed and just-sold mailers
            </Link>
            {" "}— a 4×6&quot; card with listing photo, address, and agent contact dropped to
            100–500 surrounding neighbours. We do the layout for $35 flat and proof it the same
            day. Restaurant promos, grand opening announcements, event invitations, and business
            re-brand mailers are all common jobs too.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Sizing guide: 4×6&quot; is the standard Canada Post Lettermail size — most affordable
            to mail. 5×7&quot; stands out in the mailbox. 3×4&quot; works for appointment reminders
            and loyalty cards. All sizes are printed double-sided on 14pt gloss unless you request
            matte. Quantities run from 50 cards up to 5,000+. Need something to hand out at a
            tradeshow or event? Pair your postcards with{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              flyer printing
            </Link>
            {" "}for a complete leave-behind package.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Bring print-ready artwork or let our in-house designer build your layout from scratch
            — $35 flat, same-day proof. We&apos;re at 216 33rd St W, Saskatoon. Call
            (306) 954-8688 or use the instant quote tool to price your run.
          </p>
        </>
      }
      products={[
        { name: "Postcards 4×6\"", from: "from $40 / 50", slug: "postcards" },
        { name: "Postcards 5×7\"", from: "from $35 / 50", slug: "postcards" },
        { name: "Flyers", from: "from $45 / 100", slug: "flyers" },
        { name: "Business Cards", from: "from $40 / 250", slug: "business-cards" },
        { name: "Brochures (tri-fold)", from: "from $70 / 100", slug: "brochures" },
      ]}
      whyPoints={[
        "14pt gloss stock, double-sided — Canada Post admail compliant out of the box",
        "4×6\" from $40/50 | 250 for $85 | 500 for $140 — no hidden setup fees",
        "5×7\" from $35/50 | 100 for $45 | 250 for $85",
        "In-house Roland UV printing — sharp colour, mailable finish",
        "Same-day rush +$40 flat — mail drop tomorrow, order before 10 AM today",
        "In-house designer $35 flat — real estate layouts, promo cards, event invites",
        "3×4\" mini cards available — appointment reminders, loyalty punch cards, referral cards",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping wait",
      ]}
      faqs={[
        {
          q: "How much does postcard printing cost in Saskatoon?",
          a: "4×6\" postcards (14pt gloss, double-sided): 50 for $40, 100 for $45, 250 for $85, 500 for $140. 5×7\" postcards: 50 for $35, 100 for $45, 250 for $85. Design is $35 flat if you need a layout built. Same-day rush is +$40 on top of the print cost.",
        },
        {
          q: "Are your postcards Canada Post admail compliant?",
          a: "Yes — our standard 4×6\" (100×148mm) size meets Canada Post Lettermail dimensions. 5×7\" meets Oversize Lettermail specs. Both are printed on 14pt gloss with a mailable finish. We don't process the mailing list or postage, but the cards themselves are ready to stamp and send.",
        },
        {
          q: "Can I get postcards for real estate just-listed drops?",
          a: "Absolutely — it's one of our most common postcard jobs. A 4×6\" card with listing photo, address, price, and agent contact works well for neighbourhood drops. We do the layout for $35 flat and proof it the same day. 250 cards for $85 covers most neighbourhood mailers. Rush available if your listing goes live tomorrow.",
        },
        {
          q: "What's the turnaround time for postcard printing?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Same-day rush is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm availability for your quantity.",
        },
        {
          q: "Do you print double-sided postcards?",
          a: "Yes — all postcards are double-sided by default at no extra charge. Standard setup is a full-bleed image or design on the front and your message/address block on the back. Single-sided is available on request.",
        },
        {
          q: "What sizes do you print postcards in?",
          a: "We print 4×6\", 5×7\", and 3×4\" postcards. 4×6\" is the most popular and most affordable to mail. 5×7\" stands out in a mailbox and gives more design space. 3×4\" is ideal for appointment reminders, loyalty cards, and referral cards. All sizes on 14pt gloss, double-sided.",
        },
        {
          q: "Can I use postcards for restaurant promotions?",
          a: "Yes — restaurant promo postcards are a strong direct mail piece. A 4×6\" card with a coupon, seasonal menu item, or grand opening announcement mailed to 250–500 nearby addresses starts at $85 for the print run. Add design for $35 flat. Rush available if you need them before a weekend push.",
        },
        {
          q: "Where can I get postcards printed in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688. We print in-house on our Roland UV printer, offer same-day rush, and have an in-house designer for $35 flat. No minimums on design, no hidden fees on print.",
        },
      ]}
    />
  );
}
