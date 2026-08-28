import { LinkButton } from "@/components/ui/Button";

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    body: [
      "Welcome to FUJRS. These Terms & Conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms. If you do not agree with any part of these terms, please refrain from using our services.",
      "FUJRS offers premium unstitched fabrics and bespoke tailoring services directly, curated and quality-checked in-house. We strive to maintain the highest standards of quality and craftsmanship in every interaction.",
    ],
  },
  {
    id: "product-quality",
    title: "Product Quality & Descriptions",
    body: [
      "All products listed on FUJRS are sourced, quality-checked, and fulfilled by FUJRS directly.",
      "We make every effort to ensure product descriptions, fabric compositions, and imagery are accurate. Minor variations in color may occur due to screen calibration.",
      "Stock levels are updated regularly; in the rare case an item becomes unavailable after ordering, we will offer a full refund or a comparable alternative.",
    ],
  },
  {
    id: "custom-stitching",
    title: "Use of Custom Stitching Services",
    body: null,
    list: [
      {
        label: "Measurement Accuracy",
        text: "It is the customer's responsibility to provide accurate measurements using our measurement tooltips. We are not liable for ill-fitting garments resulting from incorrect data provided.",
      },
      {
        label: "Design Variations",
        text: "Minor variations in embroidery placement or thread shade may occur due to the artisanal nature of the process.",
      },
      {
        label: "Lead Times",
        text: "Custom tailoring requires a minimum of 14-21 business days, excluding transit time.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    body: [
      "The content, layout, design, and graphics on this website are protected by intellectual property laws. FUJRS retains all rights to its designs and brand assets.",
      'You may not reproduce, distribute, or create derivative works from any part of this platform without express written consent. The "FUJRS" name and logo are registered trademarks.',
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    body: [
      "These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which FUJRS is headquartered. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the local courts.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="pt-16 pb-24 px-margin-mobile">
      <header className="max-w-3xl mx-auto mb-16 text-center">
        <span className="font-body text-label-sm uppercase tracking-[0.2em] text-marketplace-bronze mb-4 block">
          Legal Documentation
        </span>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-6">
          Terms &amp; Conditions
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant">Last updated: July 2026</p>
        <div className="w-12 h-px bg-marketplace-bronze mx-auto mt-8" />
      </header>

      <article className="max-w-2xl mx-auto font-body leading-relaxed space-y-16">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="font-display text-headline-sm mb-4">{section.title}</h2>
            {section.body?.map((p) => (
              <p key={p} className="text-on-surface-variant mb-4">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="space-y-3 list-disc pl-5 text-on-surface-variant">
                {section.list.map((item) => (
                  <li key={item.label}>
                    <strong className="text-primary">{item.label}:</strong> {item.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Atmospheric Visual */}
        <div className="my-16 relative overflow-hidden h-64 w-full">
          <div
            className="bg-cover bg-center w-full h-full opacity-20 grayscale"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBJYOhmoakVbXnTSbmEsKApikbxkhK-bkt1vUR_oyjuQIJSXyxg0n2iBEBv1t0isxS3pEqUClqmnoVrAMDptf6ohituUm_doVr2rMaF0St1C0Q7SqdbbtoohSZPoTEDoh2MJgCf8KOsD7w-6UsI1atxzLPDr0D2kpSwjnAT4vDUrgEG4igG-K-T8l8f-NNq1UVchPNNWITYZa7GJ-kHbMAe6YsGBRwSE3c74rH2F_5606zpj3JDAE_smAfvldL-arpdMLmCQoVNzd4')",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-display italic text-headline-sm text-primary max-w-sm text-center">
              &ldquo;Craftsmanship is the visible expression of invisible effort.&rdquo;
            </p>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-outline-variant text-center">
          <p className="mb-8 font-body text-body-md italic">
            Have questions regarding our legal policies?
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <LinkButton href="/contact" variant="primary" className="!px-10 !py-4">
              Contact Support
            </LinkButton>
          </div>
        </div>
      </article>
    </main>
  );
}
