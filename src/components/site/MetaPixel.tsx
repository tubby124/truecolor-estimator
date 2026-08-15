"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  getMarketingConsent,
  META_MARKETING_CONSENT_CHANGED_EVENT,
} from "@/lib/analytics/metaConsent";
import { META_PIXEL_ID } from "@/lib/analytics/metaPixel";

export function MetaPixel() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => setEnabled(getMarketingConsent() === "granted");
    syncConsent();
    window.addEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, syncConsent);
    return () => window.removeEventListener(META_MARKETING_CONSENT_CHANGED_EVENT, syncConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
