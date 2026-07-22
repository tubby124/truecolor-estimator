#!/usr/bin/env node

import fs from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

function hasFlag(name) {
  return args.includes(name);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function usage(message) {
  if (message) console.error(message);
  console.error(
    "Usage: node scripts/import-gallery-images.mjs --source-dir <dir> --metadata <json> [--output-dir <dir>] [--contact-sheet <html>] [--apply]",
  );
  process.exit(1);
}

const sourceDirectory = option("--source-dir");
const metadataFile = option("--metadata");
const outputDirectory = option("--output-dir", path.join(process.cwd(), "public", "images", "gallery"));
const apply = hasFlag("--apply");
const contactSheet = option(
  "--contact-sheet",
  path.join(os.tmpdir(), "truecolor-gallery-import", "contact-sheet.html"),
);

if (!sourceDirectory || !metadataFile) usage();
if (!fs.existsSync(sourceDirectory)) usage(`Source directory does not exist: ${sourceDirectory}`);
if (!fs.existsSync(metadataFile)) usage(`Metadata file does not exist: ${metadataFile}`);

const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
const projects = Array.isArray(metadata) ? metadata : metadata.projects;
if (!Array.isArray(projects) || projects.length === 0) {
  usage("Metadata must be a non-empty array or an object with a non-empty projects array.");
}

const REQUIRED_TEXT = [
  "source",
  "id",
  "outputFilename",
  "title",
  "caption",
  "alt",
  "kind",
  "category",
  "productSlug",
  "productHref",
  "priceLabel",
  "rightsStatus",
  "privacyStatus",
];
const VALID_KINDS = new Set(["real-client", "shop-process", "concept"]);
const VALID_RIGHTS = new Set(["approved", "legacy-public", "hold"]);
const VALID_PRIVACY = new Set(["reviewed", "review-required"]);
const outputNames = new Set();
const resolvedSourceDirectory = path.resolve(sourceDirectory);

function validateProject(project, index) {
  const context = project.id || `project ${index + 1}`;
  for (const field of REQUIRED_TEXT) {
    if (typeof project[field] !== "string" || !project[field].trim()) {
      throw new Error(`${context}: ${field} is required and must be human-verified`);
    }
  }
  if (typeof project.published !== "boolean" || typeof project.homepageFeatured !== "boolean") {
    throw new Error(`${context}: published and homepageFeatured must be explicit booleans`);
  }
  if (!VALID_KINDS.has(project.kind)) throw new Error(`${context}: invalid kind`);
  if (!VALID_RIGHTS.has(project.rightsStatus)) throw new Error(`${context}: invalid rightsStatus`);
  if (!VALID_PRIVACY.has(project.privacyStatus)) throw new Error(`${context}: invalid privacyStatus`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id)) {
    throw new Error(`${context}: id must be lowercase and hyphenated`);
  }
  if (project.published && project.rightsStatus === "hold") {
    throw new Error(`${context}: rightsStatus=hold cannot be published`);
  }
  if (project.published && project.privacyStatus !== "reviewed") {
    throw new Error(`${context}: published work must pass privacy review`);
  }
  if (project.alt.length < 10 || project.alt.length > 125) {
    throw new Error(`${context}: alt must be 10–125 characters`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(project.outputFilename)) {
    throw new Error(`${context}: outputFilename must be lowercase, hyphenated, and end in .webp`);
  }
  if (outputNames.has(project.outputFilename)) throw new Error(`${context}: duplicate outputFilename`);
  outputNames.add(project.outputFilename);
  if (!project.productHref.startsWith("/")) throw new Error(`${context}: productHref must be internal`);
  if (
    !project.focalPoint ||
    typeof project.focalPoint.x !== "number" ||
    typeof project.focalPoint.y !== "number" ||
    project.focalPoint.x < 0 ||
    project.focalPoint.x > 100 ||
    project.focalPoint.y < 0 ||
    project.focalPoint.y > 100
  ) {
    throw new Error(`${context}: a reviewed focalPoint with x/y values from 0–100 is required`);
  }

  const input = path.resolve(resolvedSourceDirectory, project.source);
  if (!input.startsWith(`${resolvedSourceDirectory}${path.sep}`)) {
    throw new Error(`${context}: source must remain inside --source-dir`);
  }
  if (!fs.existsSync(input)) throw new Error(`${context}: missing source file ${project.source}`);

  if (project.crop) {
    for (const key of ["left", "top", "width", "height"]) {
      if (!Number.isInteger(project.crop[key]) || project.crop[key] < 0) {
        throw new Error(`${context}: crop.${key} must be a non-negative integer`);
      }
    }
    if (project.crop.width === 0 || project.crop.height === 0) {
      throw new Error(`${context}: crop width and height must be greater than zero`);
    }
  }

  if (project.adjustments) {
    for (const key of ["brightness", "saturation"]) {
      const value = project.adjustments[key];
      if (value !== undefined && (typeof value !== "number" || value < 0.5 || value > 1.5)) {
        throw new Error(`${context}: adjustments.${key} must be between 0.5 and 1.5`);
      }
    }
  }

  for (const [redactionIndex, redaction] of (project.redactions ?? []).entries()) {
    for (const key of ["x", "y", "width", "height"]) {
      if (typeof redaction[key] !== "number" || redaction[key] < 0 || redaction[key] > 1) {
        throw new Error(`${context}: redactions[${redactionIndex}].${key} must be between 0 and 1`);
      }
    }
    if (redaction.x + redaction.width > 1 || redaction.y + redaction.height > 1) {
      throw new Error(`${context}: redactions[${redactionIndex}] extends outside the image`);
    }
  }

  return input;
}

function redactionOverlay(width, height, redactions) {
  const rectangles = redactions
    .map((item) => {
      const x = Math.round(item.x * width);
      const y = Math.round(item.y * height);
      const rectWidth = Math.max(1, Math.round(item.width * width));
      const rectHeight = Math.max(1, Math.round(item.height * height));
      return `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="#161616"/>`;
    })
    .join("");
  return Buffer.from(`<svg width="${width}" height="${height}">${rectangles}</svg>`);
}

async function renderProject(project, input) {
  let renderInput = input;
  let temporaryDirectory;

  if (/\.hei[cf]$/i.test(input)) {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "truecolor-gallery-heic-"));
    renderInput = path.join(temporaryDirectory, "source.jpg");
    const conversion = spawnSync(
      "sips",
      ["-s", "format", "jpeg", input, "--out", renderInput],
      { encoding: "utf8" },
    );
    if (conversion.status !== 0 || !fs.existsSync(renderInput)) {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
      throw new Error(
        `${project.id}: HEIC conversion failed. macOS sips is required when the installed Sharp build cannot decode HEIC.`,
      );
    }
  }

  try {
    let pipeline = sharp(renderInput, { failOn: "error" }).rotate();
    if (project.crop) pipeline = pipeline.extract(project.crop);
    if (project.adjustments) {
      const { brightness = 1, saturation = 1 } = project.adjustments;
      pipeline = pipeline.modulate({ brightness, saturation });
    }
    pipeline = pipeline.resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true });

    const normalized = await pipeline.toBuffer({ resolveWithObject: true });
    let normalizedPipeline = sharp(normalized.data);
    if ((project.redactions ?? []).length > 0) {
      normalizedPipeline = normalizedPipeline.composite([
        {
          input: redactionOverlay(normalized.info.width, normalized.info.height, project.redactions),
          top: 0,
          left: 0,
        },
      ]);
    }

    let result;
    for (const quality of [82, 78, 74, 70, 66]) {
      const data = await normalizedPipeline.clone().webp({ quality, effort: 6 }).toBuffer();
      result = { data, quality, width: normalized.info.width, height: normalized.info.height };
      if (data.length <= 150 * 1024) break;
    }
    if (result.data.length > 150 * 1024) {
      throw new Error(`${project.id}: could not reach the 150KB target without exceeding the quality floor`);
    }
    return result;
  } finally {
    if (temporaryDirectory) {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }
}

const results = [];
for (const [index, project] of projects.entries()) {
  const input = validateProject(project, index);
  let rendered;
  try {
    rendered = await renderProject(project, input);
  } catch (error) {
    throw new Error(
      `${project.id}: image conversion failed. Confirm this Sharp build supports the source format (including HEIC). ${error.message}`,
    );
  }
  results.push({ project, rendered });
}

const renderedHashes = new Map();
for (const { project, rendered } of results) {
  const hash = createHash("sha256").update(rendered.data).digest("hex");
  const duplicate = renderedHashes.get(hash);
  if (duplicate) {
    throw new Error(`${project.id}: rendered output duplicates ${duplicate}`);
  }
  renderedHashes.set(hash, project.id);
}

fs.mkdirSync(path.dirname(contactSheet), { recursive: true });
const cards = results
  .map(
    ({ project, rendered }) => `
      <figure>
        <img src="data:image/webp;base64,${rendered.data.toString("base64")}" alt="${escapeHtml(project.alt)}">
        <figcaption><strong>${escapeHtml(project.title)}</strong><br>${escapeHtml(project.caption)}<br>${rendered.width}×${rendered.height} · ${(rendered.data.length / 1024).toFixed(1)}KB · q${rendered.quality}<br>${escapeHtml(project.rightsStatus)} · ${escapeHtml(project.privacyStatus)} · published=${project.published}</figcaption>
      </figure>`,
  )
  .join("\n");
fs.writeFileSync(
  contactSheet,
  `<!doctype html><meta charset="utf-8"><title>True Color gallery import review</title><style>body{font:14px system-ui;margin:24px;background:#f5f5f5}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}figure{margin:0;background:white;padding:12px;border-radius:12px}img{width:100%;height:auto}figcaption{line-height:1.45;margin-top:10px}</style><h1>Gallery import review</h1><p>${apply ? "Apply run" : "Dry run — no public images were written"}</p><main>${cards}</main>`,
);

if (apply) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const { project } of results) {
    const destination = path.join(outputDirectory, project.outputFilename);
    if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite existing file: ${destination}`);
  }
  for (const { project, rendered } of results) {
    const destination = path.join(outputDirectory, project.outputFilename);
    fs.writeFileSync(destination, rendered.data, { flag: "wx" });
  }
}

for (const { project, rendered } of results) {
  console.log(
    `${apply ? "WROTE" : "DRY RUN"} ${project.outputFilename} ${rendered.width}x${rendered.height} ${(rendered.data.length / 1024).toFixed(1)}KB`,
  );
  const overrides = {
    id: project.id,
    focalPoint: project.focalPoint,
    caption: project.caption,
    alt: project.alt,
    kind: project.kind,
    productHref: project.productHref,
    rightsStatus: project.rightsStatus,
    privacyStatus: project.privacyStatus,
    published: project.published,
    homepageFeatured: project.homepageFeatured,
    ...(project.clientDisplayName ? { clientDisplayName: project.clientDisplayName } : {}),
  };
  console.log(
    `MANIFEST ${JSON.stringify([
      `/images/gallery/${project.outputFilename}`,
      project.title,
      project.priceLabel,
      project.productSlug,
      project.category,
      rendered.width,
      rendered.height,
      overrides,
    ])}`,
  );
}
console.log(`Contact sheet: ${contactSheet}`);
if (!apply) console.log("Review the contact sheet, then repeat with --apply to write approved images.");
