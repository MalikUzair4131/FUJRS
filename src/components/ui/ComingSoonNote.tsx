import Link from "next/link";

export function ComingSoonNote({ title, note }: { title: string; note: string }) {
  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-32 text-center">
      <h1 className="font-headline-md text-headline-md text-primary">{title}</h1>
      <p className="mt-4 max-w-md mx-auto text-body-md text-text-muted">{note}</p>
      <Link
        href="/tailoring"
        className="mt-8 inline-block border border-primary px-10 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
      >
        Back to The Atelier
      </Link>
    </div>
  );
}
