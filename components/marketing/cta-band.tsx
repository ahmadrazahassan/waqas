import Link from "next/link";
import { ctaBand } from "@/lib/content";

/**
 * The Cline band. Full width lime, ink text, one line mixing weight 400 and
 * 700 in the same sentence, plain underlined text links on the right.
 * No buttons live in this band.
 */
export function CtaBand() {
  return (
    <section className="bg-lime text-ink">
      <div className="container-site flex flex-col gap-10 py-18 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-40">
        <h2 className="text-display">
          <span className="font-normal">{ctaBand.lead} </span>
          <span className="font-bold">{ctaBand.strong}</span>
        </h2>

        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:gap-10">
          {ctaBand.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-h4 underline decoration-1 underline-offset-[6px] transition-opacity duration-200 hover:opacity-60"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
