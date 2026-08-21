import type { Metadata } from "next";
import { PaidIntentChooser } from "@/components/paid/PaidIntentChooser";

export const metadata: Metadata = {
  title: "Saskatoon Sign Shop — Choose a Sign & Order Online",
  description: "Choose an orderable sign product, see live pricing, and order online from True Color Display Printing in Saskatoon.",
  robots: { index: false, follow: true },
};

export default function SignShopOrderOnlinePage() {
  return (
    <PaidIntentChooser
      eyebrow="Saskatoon sign shop · order online"
      title="Pick a sign. Price it online."
      description="Pick the closest sign product to open its live configurator. You will see the price before checkout; use a custom quote for installation, vehicle graphics, or work outside the standard options."
      placement="paid_sign_chooser"
      chooserTitle="What type of sign do you need?"
      products={[
        { slug: "coroplast-signs", label: "Coroplast & Yard Signs" },
        { slug: "acp-signs", label: "Aluminum & ACP Signs" },
        { slug: "vinyl-banners", label: "Vinyl Banners" },
        { slug: "window-decals", label: "Window Decals" },
        { slug: "vehicle-magnets", label: "Vehicle Magnets" },
        { slug: "stickers", label: "Stickers & Labels" },
      ]}
      quoteCopy="Need vehicle graphics, installation, a custom material, or a sign that is not listed? Send the details for a human quote."
    />
  );
}
