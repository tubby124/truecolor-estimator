import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import VehicleDecalsSaskatoonPage from "../page";

describe("vehicle decals schema", () => {
  it("mirrors the visible FAQ content and declares the service area", () => {
    const html = renderToStaticMarkup(VehicleDecalsSaskatoonPage());
    const visibleText = html
      .replaceAll("&quot;", '"')
      .replaceAll("&#x27;", "'")
      .replaceAll("&amp;", "&");
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]) as Record<string, unknown>);
    const service = schemas.find((schema) => schema["@type"] === "Service");
    const faq = schemas.find((schema) => schema["@type"] === "FAQPage");

    expect(service?.areaServed).toEqual([
      { "@type": "City", name: "Saskatoon" },
      { "@type": "AdministrativeArea", name: "Saskatchewan" },
    ]);
    expect(faq?.mainEntity).toHaveLength(6);
    for (const entity of faq?.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>) {
      expect(visibleText).toContain(entity.name);
      expect(visibleText).toContain(entity.acceptedAnswer.text);
    }
  });
});
