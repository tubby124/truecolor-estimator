# Content Formats — True Color Display Printing

## Email Content Rules
- Subject line: under 50 characters
- Preview text: 85–100 characters
- Body: 200–300 words, 600px max width, Brevo-compatible HTML
- Use `MIMEMultipart('alternative')` — always include plain text fallback
- CTA: always link to `https://truecolorprinting.ca/[slug]?utm_source=brevo&utm_medium=email&utm_campaign=[name]`
- NEVER use Vercel URL in email links

## Social Caption Rules
- Always provide 3 variants: short (under 100 chars) | medium (150–200 chars) | long (250–300 chars)
- Include price anchor in at least one variant
- UTM tag all links: `?utm_source=social&utm_medium=[platform]&utm_campaign=[topic]`

## E-E-A-T Checklist (verify before publishing any page)
- [ ] Real price mentioned (not "competitive")
- [ ] Physical address or phone number present (or linked to contact page)
- [ ] Specific material names (13oz scrim vinyl, 4mm coroplast, aluminum composite, etc.)
- [ ] Real turnaround time ("1–3 business days after artwork approval" — not just "fast")
- [ ] Specific service details ("$35 flat, same-day proof, in-house Photoshop" — not "we offer design")
