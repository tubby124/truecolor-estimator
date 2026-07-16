import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, FileCheck2 } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import {
  PRINT_RESOURCE_SLUGS,
  buildPrintResourceMetadata,
  buildPrintResourceSchemas,
  getPrintResource,
} from "@/lib/data/print-resources";

interface PrintResourcePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return PRINT_RESOURCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PrintResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = getPrintResource(slug);
  if (!resource) notFound();
  return buildPrintResourceMetadata(resource);
}

export default async function PrintResourcePage({ params }: PrintResourcePageProps) {
  const { slug } = await params;
  const resource = getPrintResource(slug);
  if (!resource) notFound();

  const schemas = buildPrintResourceSchemas(resource);

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#111111]">
      <SiteNav />
      {schemas.map((schema) => (
        <script
          key={String(schema["@id"])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main id="main-content">
        <header className="border-b border-[#e5e5e5] bg-white">
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-8 sm:pb-18 sm:pt-10">
            <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="transition-colors hover:text-[#e63020]">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/resources" className="transition-colors hover:text-[#e63020]">Resources</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-[#111111]">{resource.eyebrow}</span>
            </nav>

            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
              <div>
                <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#e63020]">
                  {resource.eyebrow}
                </p>
                <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl">
                  {resource.title}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600">{resource.intro}</p>
              </div>

              <aside aria-label="Order paths" className="border-l-4 border-[#e63020] bg-[#111111] p-6 text-white shadow-[8px_8px_0_#e5e5e5]">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/60">Start with a live product</p>
                <div className="mt-4 space-y-3">
                  {resource.productLinks.slice(0, 2).map((link) => (
                    <Link key={link.href} href={link.href} className="group flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-sm font-bold hover:text-[#ff6b5f]">
                      <span>{link.label}</span>
                      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:py-16">
          <article className="min-w-0">
            {resource.download && (
              <section className="mb-12 border border-[#111111] bg-[#fff7f5] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <FileCheck2 aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-[#e63020]" />
                    <div>
                      <h2 className="text-xl font-black">18×24 SVG artwork file</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                        Exact final dimensions with clearly labelled trim and configurable reference guides. Confirm production tolerances before using any guide as a safety boundary.
                      </p>
                    </div>
                  </div>
                  <a href={resource.download.href} download={resource.download.filename} aria-label={resource.download.label} className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#e63020] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#bd2519] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e63020]">
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Download SVG
                  </a>
                </div>
              </section>
            )}

            {resource.image && (
              <figure className="mb-12 overflow-hidden border border-[#e5e5e5] bg-white">
                <Image src={resource.image.src} alt={resource.image.alt} width={resource.image.width} height={resource.image.height} className="h-auto w-full object-cover" priority sizes="(max-width: 1024px) 100vw, 760px" />
                <figcaption className="border-t border-[#e5e5e5] px-5 py-3 text-sm text-gray-500">
                  Original completed-project image from True Color’s gallery.
                </figcaption>
              </figure>
            )}

            <div className="space-y-12">
              {resource.sections.map((section, index) => (
                <section key={section.heading} aria-labelledby={`section-${index}`}>
                  <div className="mb-5 flex items-start gap-4">
                    <span aria-hidden="true" className="mt-1 font-mono text-xs font-bold text-[#e63020]">{String(index + 1).padStart(2, "0")}</span>
                    <h2 id={`section-${index}`} className="text-2xl font-black tracking-[-0.02em] sm:text-3xl">{section.heading}</h2>
                  </div>
                  <div className="space-y-5 border-l border-[#d6d6d6] pl-8 text-[1.04rem] leading-8 text-gray-700">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets && (
                      <ul className="space-y-3" role="list">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3"><span aria-hidden="true" className="text-[#e63020]">—</span><span>{bullet}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside aria-label="Matching products" className="lg:sticky lg:top-6 lg:self-start">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Choose and order</p>
            <div className="mt-4 divide-y divide-[#e5e5e5] border-y border-[#e5e5e5] bg-white">
              {resource.productLinks.map((link) => (
                <Link key={link.href} href={link.href} className="group block p-5 transition-colors hover:bg-[#fff1ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e63020]">
                  <span className="flex items-start justify-between gap-3 font-bold leading-5 group-hover:text-[#e63020]">
                    {link.label}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-gray-500">{link.note}</span>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-gray-500">
              Updated <time dateTime={resource.updated}>July 15, 2026</time>. Exact price comes from the selected live configuration.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
