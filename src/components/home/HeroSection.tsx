import { LinkButton } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBIMBodkt92piwNiG88QKe2_g_vQw2mndK16xuA-6beTkS7_AixThzGg2saIh_XKP2asjOwhuK0UbsxG0QOC_kNkXZ925RGD4EFRjQR7MmTmOuR11HLzMpfzRfzj-e7CmuFy89K9oI_SfVZXoDF0W8rJ31DD2-o4QY5lGflyuFR9dJK55fA486o71-bMY-h3CebrTqKReXgnvip-1KuaY-7okcOsVTEViGWPKE5XT11qyMM-0XaYY1fYw1Wyl854jRZiH4tQ7raaAE')",
          }}
          role="img"
          aria-label="A cinematic, high-fashion editorial shot of a woman in an exquisite Noir Unstitched Pakistani suit made of heavy black velvet and silk, featuring intricate silver and gold embroidery."
        />
      </div>
      <div className="relative z-10 text-center text-on-primary px-gutter">
        <span className="font-label-md text-label-md tracking-[0.3em] uppercase mb-4 block">
          This Season
        </span>
        <h1 className="font-display-lg text-[80px] md:text-[120px] leading-none mb-8 tracking-tighter">
          FUJRS UNSTITCHED
        </h1>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <LinkButton href="/new-arrivals" variant="primary" className="!px-12 !py-5">
            Shop Collection
          </LinkButton>
          <LinkButton href="/new-arrivals" variant="inverse" className="!px-12 !py-5">
            View Lookbook
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
