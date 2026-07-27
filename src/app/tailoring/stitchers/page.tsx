"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { stitchers } from "@/data/stitchers";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

export default function StitchersDirectoryPage() {
  const [query, setQuery] = useState("");
  const [expertise, setExpertise] = useState<string | null>(null);

  const specialties = useMemo(() => Array.from(new Set(stitchers.map((s) => s.specialty))), []);

  const filtered = useMemo(() => {
    return stitchers.filter((s) => {
      const matchesQuery =
        !query.trim() ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.specialty.toLowerCase().includes(query.toLowerCase());
      const matchesExpertise = !expertise || s.specialty === expertise;
      return matchesQuery && matchesExpertise;
    });
  }, [query, expertise]);

  return (
    <main>
      {/* Hero */}
      <section className="relative py-32 flex items-center justify-center overflow-hidden bg-primary/5">
        <div className="z-10 text-center max-w-3xl px-margin-mobile">
          <span className="font-label-md text-label-md uppercase tracking-[0.3em] text-marketplace-bronze block mb-4">
            The Atelier
          </span>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-6">
            Master Stitchers &amp; Artisans
          </h1>
          <p className="font-body-lg text-body-lg text-text-muted">
            A curated directory of FUJRS&apos;s in-house tailoring masters and zardozi artisans.
            Precision, heritage, and the perfect fit, delivered to your doorstep.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-20 z-40 bg-surface border-b border-black/10 py-6">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setExpertise(null)}
              className={`font-label-md text-label-md uppercase border px-6 py-2 transition-all ${
                expertise === null
                  ? "bg-black text-white border-black"
                  : "border-black hover:bg-black hover:text-white"
              }`}
            >
              All Expertise
            </button>
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setExpertise(spec)}
                className={`font-label-md text-label-md uppercase border px-6 py-2 transition-all whitespace-nowrap ${
                  expertise === spec
                    ? "bg-black text-white border-black"
                    : "border-black hover:bg-black hover:text-white"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-b border-black py-2 pr-10 focus:outline-none focus:border-marketplace-bronze transition-colors font-label-md uppercase placeholder:text-text-muted/50"
                placeholder="Search by name or specialty..."
              />
              <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2">
                search
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Artisan Grid */}
      <section className="py-20 px-margin-desktop max-w-container-max mx-auto">
        {filtered.length === 0 ? (
          <p className="text-center py-24 text-text-muted font-body-md">
            No stitchers match that search.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-20">
            {filtered.map((stitcher, i) => (
              <Reveal key={stitcher.id} delay={i * 80} className="group">
                <Link href={`/tailoring/stitchers/${stitcher.slug}`} className="block">
                  <div className="relative aspect-[4/5] mb-6 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${stitcher.image}')` }}
                    />
                    {stitcher.badge && (
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span
                          className={`font-label-sm text-label-sm px-3 py-1 uppercase flex items-center gap-1 ${
                            stitcher.badge === "In-House Master"
                              ? "bg-marketplace-bronze text-white"
                              : "bg-black text-white"
                          }`}
                        >
                          {stitcher.badge}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black py-4 flex justify-center">
                      <span className="text-white font-label-md text-label-md uppercase tracking-widest">
                        View Profile
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-headline-sm text-headline-sm">{stitcher.name}</h3>
                        <p className="font-label-sm text-label-sm uppercase tracking-widest text-marketplace-bronze">
                          {stitcher.specialty}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="font-label-md text-label-md">{stitcher.rating}</span>
                      </div>
                    </div>
                    <p className="font-body-md text-body-md text-text-muted line-clamp-2">
                      {stitcher.bio}
                    </p>
                    <div className="pt-4 border-t border-black/5 flex justify-between items-center text-label-sm uppercase tracking-wider">
                      <span>Lead Time: {stitcher.leadTime}</span>
                      <span className="text-primary font-bold">{stitcher.tier}</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Measurement Philosophy CTA */}
      <section className="bg-surface-bright py-20">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
          <Reveal className="space-y-8">
            <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md max-w-md">
              Our Measurement Philosophy
            </h2>
            <p className="font-body-lg text-body-lg text-text-muted">
              Achieving the perfect fit from afar is an art form. Use our precision measurement tool
              or work directly with your chosen master artisan.
            </p>
            <div className="space-y-4">
              {[
                {
                  n: "01",
                  title: "Select an Artisan",
                  body: "Choose based on their specialty and lead times.",
                },
                {
                  n: "02",
                  title: "Digital Mapping",
                  body: "Enter your measurements using our guided interface.",
                },
                {
                  n: "03",
                  title: "Craft & Delivery",
                  body: "Your garment is hand-stitched and shipped to your door.",
                },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-4">
                  <span className="font-headline-sm text-marketplace-bronze">{step.n}</span>
                  <div>
                    <p className="font-label-md uppercase tracking-widest mb-1">{step.title}</p>
                    <p className="font-body-md text-text-muted">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <LinkButton href="/tailoring/configure" variant="primary" className="!px-10 !py-5">
              How It Works
            </LinkButton>
          </Reveal>
          <Reveal delay={150} className="relative h-[500px] lg:h-[600px]">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDPOtCuM_cHDUN65GCYrjQROBj4gXI2pKR3oagn0iEssnnDAu3TqYmWrWOF2ZZwRhbCB3dPr4Tbkyq-LX6ofygh3_5N8I1yi6Rc6DLPDJ0uwKSKpnAXFlW3JdcJvkQxa2Ttz8Z-6tfIGGDR5RDwz5_yvRIwDrPhKAARe05G_klPACXau-pAO_QcLDBKyi6J9VUuXK5RZ3eQktVkHK9z9KR65JOfT5a7CX6Qy1W6zDScN3BaR_IxvwTD5ROVwAMfGkUSq5ndnNHChHk')",
              }}
            />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
