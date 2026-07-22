#!/usr/bin/env node

import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { GALLERY_PROJECTS } from "../src/lib/data/gallery-projects.ts";

const root = process.cwd();
const errors = [];
const warnings = [];
const ids = new Set();
const sources = new Set();
const contentHashes = new Map();

for (const [index, project] of GALLERY_PROJECTS.entries()) {
  const context = project.id || `entry ${index + 1}`;

  if (!project.id || ids.has(project.id)) errors.push(`${context}: missing or duplicate id`);
  ids.add(project.id);

  if (!project.src || sources.has(project.src)) errors.push(`${context}: missing or duplicate src`);
  sources.add(project.src);

  if (project.displayOrder !== index + 1) {
    errors.push(`${context}: displayOrder must be ${index + 1}`);
  }
  if (!/^\/images\/gallery\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(project.src)) {
    errors.push(`${context}: src must be a lowercase, hyphenated WebP gallery path`);
  }
  if (project.alt.length < 10 || project.alt.length > 125) {
    errors.push(`${context}: alt text must be 10–125 characters (received ${project.alt.length})`);
  }
  if (!project.title.trim() || !project.caption.trim()) {
    errors.push(`${context}: title and caption are required`);
  }
  if (!project.productHref.startsWith("/")) {
    errors.push(`${context}: productHref must be an internal absolute path`);
  }
  if (project.focalPoint.x < 0 || project.focalPoint.x > 100 || project.focalPoint.y < 0 || project.focalPoint.y > 100) {
    errors.push(`${context}: focalPoint coordinates must be between 0 and 100`);
  }
  if (project.published && project.rightsStatus === "hold") {
    errors.push(`${context}: an item on rights hold cannot be published`);
  }
  if (project.published && project.privacyStatus !== "reviewed") {
    errors.push(`${context}: a published item must pass privacy review`);
  }

  const publicFile = path.join(root, "public", project.src);
  if (!fs.existsSync(publicFile)) {
    errors.push(`${context}: missing file ${project.src}`);
    continue;
  }

  const metadata = await sharp(publicFile).metadata();
  if (metadata.format !== "webp") errors.push(`${context}: file format is not WebP`);
  if (metadata.width !== project.width || metadata.height !== project.height) {
    errors.push(
      `${context}: manifest dimensions ${project.width}x${project.height} do not match file ${metadata.width}x${metadata.height}`,
    );
  }

  const bytes = fs.statSync(publicFile).size;
  if (bytes > 150 * 1024) {
    warnings.push(`${context}: ${(bytes / 1024).toFixed(1)}KB exceeds the 150KB target`);
  }

  const hash = createHash("sha256").update(fs.readFileSync(publicFile)).digest("hex");
  const duplicate = contentHashes.get(hash);
  if (duplicate) {
    errors.push(`${context}: image content duplicates ${duplicate}`);
  } else {
    contentHashes.set(hash, context);
  }
}

const galleryDirectory = path.join(root, "public", "images", "gallery");
const untrackedFiles = fs
  .readdirSync(galleryDirectory)
  .filter((name) => name.endsWith(".webp"))
  .map((name) => `/images/gallery/${name}`)
  .filter((src) => !sources.has(src));

for (const src of untrackedFiles) warnings.push(`untracked gallery asset: ${src}`);

for (const warning of warnings) console.warn(`WARN ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  console.error(`Gallery validation failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(
  `Gallery validation passed: ${GALLERY_PROJECTS.length} projects, ${warnings.length} warning(s).`,
);
