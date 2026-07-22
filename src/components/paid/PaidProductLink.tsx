"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  trackClickToCall,
  trackPaidEngagement,
  trackPaidLandingView,
  trackSelectItem,
  trackViewItemList,
} from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPaidCta(params: { action: string; placement: string; destination: string }) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "paid_landing_cta", {
    cta_action: params.action,
    cta_placement: params.placement,
    link_url: params.destination,
  });
  if (params.action === "directions_click" || params.action === "reviews_click") {
    trackPaidEngagement({
      event_name: params.action,
      placement: params.placement,
      link_url: params.destination,
    });
  }
}

function trackSelectProduct(productSlug: string, productName: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "select_product", {
    item_id: productSlug,
    item_name: productName,
    item_list_name: "Paid competitor product chooser",
  });
}

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
      onClick={() => {
        trackSelectItem({
          item_id: productSlug,
          item_name: productName,
          item_list_name: "Paid competitor product chooser",
        });
        trackSelectProduct(productSlug, productName);
      }}
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
    trackPaidLandingView();
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

interface PaidCtaLinkProps {
  href: string;
  action: string;
  placement: string;
  className: string;
  children: ReactNode;
  target?: "_blank";
  rel?: string;
}

export function PaidCtaLink({ href, action, placement, className, children, target, rel }: PaidCtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => trackPaidCta({ action, placement, destination: href })}
    >
      {children}
    </Link>
  );
}
