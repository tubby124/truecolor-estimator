import type { Metadata } from "next";
import { PaidIntentChooser } from "@/components/paid/PaidIntentChooser";

export const metadata: Metadata = {
  title: "Printing Prices Saskatoon — Choose a Product & Order Online",
  description: "Choose what you need printed, see live pricing, and order online from True Color Display Printing in Saskatoon.",
  robots: { index: false, follow: true },
};

export default function PrintingPricesOrderOnlinePage() {
  return (
    <PaidIntentChooser
      eyebrow="Printing prices Saskatoon · order online"
      title="Pick a print product. Price it online."
      description="Start with the product you need, configure the details, and see live pricing before checkout. Standard jobs can be ordered online; custom work gets a human quote."
      placement="paid_print_chooser"
      chooserTitle="What are you printing?"
      products={[
        { slug: "business-cards" },
        { slug: "stickers", label: "Stickers & Labels" },
        { slug: "flyers" },
        { slug: "photo-posters", label: "Photo Posters" },
        { slug: "vinyl-banners" },
        { slug: "coroplast-signs", label: "Signs" },
      ]}
      quoteCopy="Large-format, unusual sizes, design help, or a job that does not fit the configurator? Send the details and we will price it properly."
      showLocalShopProof
    />
  );
}
