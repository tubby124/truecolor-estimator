"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  trackPaidEngagement,
  trackPaidLandingView,
  trackSelectItem,
  trackViewItemList,
} from "@/lib/analytics";
import type { AnalyticsPlacement } from "@/lib/analytics";

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

function trackSelectProduct(productSlug: string, productName: string, itemListName: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "select_product", {
    item_id: productSlug,
    item_name: productName,
    item_list_name: itemListName,
  });
}

interface PaidProductLinkProps {
  href: string;
  productSlug: string;
  productName: string;
  className: string;
  children: ReactNode;
  placement?: AnalyticsPlacement;
  itemListName?: string;
}

export function PaidProductLink({
  href,
  productSlug,
  productName,
  className,
  children,
  placement = "product_catalogue",
  itemListName = "Paid competitor product chooser",
}: PaidProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackSelectItem({
          item_id: productSlug,
          item_name: productName,
          item_list_name: itemListName,
          placement,
          destination: href,
        });
        trackSelectProduct(productSlug, productName, itemListName);
      }}
    >
      {children}
    </Link>
  );
}

interface PriceGuideProductLinkProps {
  href: string;
  productSlug: string;
  productName: string;
  placement: string;
  className: string;
  children: ReactNode;
}

/**
 * The price guide is a paid-search landing page, but it is server-rendered.
 * Keep the SEO article links intact and use this client link only for the
 * intentional handoff into an orderable product configurator.
 */
export function PriceGuideProductLink({
  href,
  productSlug,
  productName,
  placement,
  className,
  children,
}: PriceGuideProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackSelectItem({
          item_id: productSlug,
          item_name: productName,
          item_list_name: "Printing prices guide",
          placement: "product_catalogue",
          destination: href,
        });
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
          window.gtag("event", "price_guide_product_selected", {
            product_slug: productSlug,
            placement,
            destination: href,
          });
        }
      }}
    >
      {children}
    </Link>
  );
}

interface PaidProductListTrackerProps {
  products: Array<{ slug: string; name: string }>;
  itemListName?: string;
  trackLandingView?: boolean;
}

export function PaidProductListTracker({
  products,
  itemListName = "Paid competitor product chooser",
  trackLandingView = true,
}: PaidProductListTrackerProps) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    if (trackLandingView) trackPaidLandingView();
    trackViewItemList({
      item_list_name: itemListName,
      items: products.map((product) => ({ item_id: product.slug, item_name: product.name })),
    });
  }, [itemListName, products, trackLandingView]);
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
      data-call-placement={placement}
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
