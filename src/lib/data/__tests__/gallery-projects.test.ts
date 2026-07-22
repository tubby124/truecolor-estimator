import { describe, expect, it } from "vitest";
import {
  GALLERY_PROJECTS,
  PUBLISHED_GALLERY_PROJECTS,
} from "../gallery-projects";

describe("gallery project manifest", () => {
  it("preserves the existing 54-project order and appends reviewed work", () => {
    expect(GALLERY_PROJECTS).toHaveLength(60);
    expect(GALLERY_PROJECTS[0]).toMatchObject({
      id: "gallery-shop-roland-large-format",
      displayOrder: 1,
      productHref: "/coroplast-signs-saskatoon",
    });
    expect(GALLERY_PROJECTS[53]).toMatchObject({
      id: "gallery-magnet-calendar-lyndell-concrete",
      displayOrder: 54,
      productHref: "/products/magnet-calendars",
    });
    expect(GALLERY_PROJECTS.at(-1)).toMatchObject({
      id: "gallery-wide-format-print-production",
      displayOrder: 60,
      productHref: "/products",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
    });
  });

  it("publishes only privacy-reviewed projects that are not on rights hold", () => {
    expect(PUBLISHED_GALLERY_PROJECTS).toHaveLength(60);
    expect(
      PUBLISHED_GALLERY_PROJECTS.every(
        (project) => project.privacyStatus === "reviewed" && project.rightsStatus !== "hold",
      ),
    ).toBe(true);
  });

  it("provides valid image SEO fields and stable dimensions", () => {
    for (const [index, project] of GALLERY_PROJECTS.entries()) {
      expect(project.displayOrder).toBe(index + 1);
      expect(project.alt.length).toBeGreaterThanOrEqual(10);
      expect(project.alt.length).toBeLessThanOrEqual(125);
      expect(project.width).toBeGreaterThan(0);
      expect(project.height).toBeGreaterThan(0);
      expect(project.src).toMatch(/^\/images\/gallery\/[a-z0-9-]+\.webp$/);
    }
  });
});
