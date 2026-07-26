import Link from "next/link";

const clientCare = [
  { label: "Contact Us", href: "/contact" },
  { label: "Tailoring Appointments", href: "/tailoring" },
  { label: "Shipping & Returns", href: "/shipping-policy" },
  { label: "Returns & Exchanges", href: "/returns-exchanges" },
  { label: "FAQs", href: "/faqs" },
  { label: "Size Guide", href: "/size-guide" },
];

const collections = [
  { label: "Women's Lawn", href: "/women" },
  { label: "Men's Premium", href: "/men" },
  { label: "The Noir Collection", href: "/new-arrivals" },
  { label: "About Us", href: "/about" },
];

const socials = [
  { icon: "share", label: "Share", href: "#" },
  { icon: "camera_alt", label: "Instagram", href: "#" },
  { icon: "movie", label: "TikTok", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant mt-margin-desktop">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-gutter py-20 max-w-container-max mx-auto">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="font-display-lg text-headline-md text-primary mb-8 block uppercase">
            FUJRS
          </Link>
          <p className="text-on-surface-variant font-body-md mb-6">
            Threads of Heritage. Redefining luxury retail for the modern
            global South. Tradition, stitched for the future.
          </p>
          <div className="flex gap-4">
            {socials.map((social) => (
              <a
                key={social.icon}
                aria-label={social.label}
                className="material-symbols-outlined text-primary hover:text-marketplace-bronze"
                href={social.href}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-headline-sm text-headline-sm mb-6 uppercase tracking-wider">
            Client Care
          </h4>
          <ul className="space-y-4">
            {clientCare.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-sm uppercase"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-headline-sm text-headline-sm mb-6 uppercase tracking-wider">
            Collections
          </h4>
          <ul className="space-y-4">
            {collections.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-sm uppercase"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-headline-sm text-headline-sm mb-6 uppercase tracking-wider">
            Contact
          </h4>
          <address className="not-italic text-on-surface-variant space-y-4 font-body-md">
            <p>
              Park Towers, Block 5,
              <br />
              Clifton, Karachi, PK
            </p>
            <p>Phone: +92 (0) 21 3456 7890</p>
            <p>Email: concierge@fujrs.com</p>
          </address>
        </div>
      </div>

      <div className="border-t border-outline-variant py-8 px-gutter">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-on-surface-variant font-label-sm uppercase tracking-widest">
            © {new Date().getFullYear()} FUJRS LUXURY RETAIL. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="text-on-surface-variant hover:text-primary font-label-sm uppercase tracking-widest transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="text-on-surface-variant hover:text-primary font-label-sm uppercase tracking-widest transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
