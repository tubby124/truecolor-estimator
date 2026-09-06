import type { Metadata } from "next";
import { AssetLibrary } from "@/components/social/AssetLibrary";
export const metadata: Metadata = { title: "Asset Library — Social Studio — True Color", robots: { index: false } };
export default function LibraryPage() { return <AssetLibrary />; }
