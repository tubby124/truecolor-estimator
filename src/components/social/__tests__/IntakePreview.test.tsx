import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntakePreview, type IntakePreviewProps } from "../IntakePreview";

const props: IntakePreviewProps = {
  businessName: "Example Print Shop", imageUrl: "https://example.com/prepared.jpg",
  originalUrl: "https://example.com/original.jpg",
  captions: { instagram: "First line\n<script>alert('x')</script>", facebook: "A full caption " + "with detail. ".repeat(60) },
  scheduleTime: "2026-09-09T15:00:00Z", status: "needs_approval", revision: 2,
  mediaTreatment: "Cropped and exposure adjusted",
};

describe("IntakePreview", () => {
  it("shows exact complete escaped captions and Regina time without publishing controls", () => {
    const html = renderToStaticMarkup(<IntakePreview {...props} />);
    expect(html).toContain(props.captions.facebook);
    expect(html).toContain("First line\n&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("9:00");
    expect(html).toContain("Regina (UTC−6)");
    expect(html).toContain("does not approve or publish anything");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Prepared post image for Example Print Shop");
    expect(html).toContain("Approximate preview");
  });

  it("supports drafts without a schedule or original", () => {
    const html = renderToStaticMarkup(<IntakePreview {...props} originalUrl={undefined} scheduleTime="" />);
    expect(html).toContain("Not scheduled yet");
    expect(html).not.toContain("Compare photo versions");
  });
});
