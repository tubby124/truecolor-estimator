"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { trackClickToCall, trackSelectItem, trackViewItemList } from "@/lib/analytics";

interface PaidProductLinkProps {
  href: string;
  productSlug: string;
  productName: string;
  className: string;
  children: ReactNode;
}

export function PaidProductLink({ href, productSlug, productName, className, children }: PaidProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackSelectItem({
        item_id: productSlug,
        item_name: productName,
        item_list_name: "Paid competitor product chooser",
      })}
    >
      {children}
    </Link>
  );
}

interface PaidProductListTrackerProps {
  products: Array<{ slug: string; name: string }>;
}

export function PaidProductListTracker({ products }: PaidProductListTrackerProps) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackViewItemList({
      item_list_name: "Paid competitor product chooser",
      items: products.map((product) => ({ item_id: product.slug, item_name: product.name })),
    });
  }, [products]);
  return null;
}

interface PaidPhoneLinkProps {
  placement: string;
  className: string;
  children: ReactNode;
}

export function PaidPhoneLink({ placement, className, children }: PaidPhoneLinkProps) {
  return (
    <a
      href="tel:+13069548688"
      className={className}
      onClick={() => trackClickToCall({ placement })}
    >
      {children}
    </a>
  );
}
