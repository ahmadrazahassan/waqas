import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerNav, offices, site } from "@/lib/site";
import { Wordmark } from "@/components/marketing/wordmark";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
} from "@/components/marketing/social-icons";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/", Icon: LinkedInIcon },
  { label: "Instagram", href: "https://www.instagram.com/", Icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/", Icon: FacebookIcon },
  { label: "WhatsApp", href: "https://wa.me/", Icon: WhatsAppIcon },
];

export function SiteFooter() {
  return (
    <footer className="bg-bg">
      {/* Zone 1: links and newsletter */}
      <div className="container-site grid gap-12 border-t border-line py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-3">
          <Wordmark />
          <p className="mt-5 max-w-[34ch] text-small text-muted">
            {site.description}
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-6"
        >
          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="text-micro uppercase tracking-[0.08em] text-muted">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-small text-ink underline-offset-4 transition-opacity duration-200 hover:underline hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="lg:col-span-3">
          <h3 className="text-micro uppercase tracking-[0.08em] text-muted">
            Newsletter
          </h3>
          <p className="mt-4 max-w-[32ch] text-small text-muted">
            What we paid out, what changed, and which tasks are landing. Once a
            month, no more than that.
          </p>

          <form className="mt-5 flex" action="/api/newsletter" method="post">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 w-full rounded-l-sm border border-line border-r-0 bg-surface px-3 text-small text-ink placeholder:text-muted focus-visible:outline-offset-0"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-r-sm border border-ink bg-ink text-lime transition-colors duration-200 hover:bg-ink-soft"
            >
              <ArrowUpRight size={16} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>

      {/* Zone 2: legal and offices */}
      <div className="container-site grid gap-8 border-t border-line py-10 lg:grid-cols-12 lg:items-start">
        <div className="flex items-center gap-4 lg:col-span-3">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              rel="noreferrer noopener"
              target="_blank"
              className="text-ink transition-opacity duration-200 hover:opacity-60"
            >
              <Icon size={20} />
            </a>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 lg:col-span-5">
          <p className="text-small text-muted">
            © {site.founded} {site.legalName}
          </p>
          <Link
            href="/legal/terms"
            className="text-small font-medium underline-offset-4 hover:underline"
          >
            Terms of use
          </Link>
          <Link
            href="/legal/privacy"
            className="text-small font-medium underline-offset-4 hover:underline"
          >
            Privacy policy
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:col-span-4">
          {offices.map((office) => (
            <address key={office.city} className="not-italic">
              <p className="text-small font-semibold">{office.city}</p>
              {office.lines.map((line) => (
                <p key={line} className="text-small text-muted">
                  {line}
                </p>
              ))}
              <p className="text-small text-muted tabular">{office.phone}</p>
            </address>
          ))}
        </div>
      </div>

      {/* Zone 3: the oversized wordmark, clipped by the viewport edge */}
      <div
        aria-hidden="true"
        className="container-site overflow-hidden pt-6"
        style={{ height: "clamp(88px, 15vw, 232px)" }}
      >
        <span
          className="block leading-[0.75] font-bold tracking-[-0.05em] text-ink select-none"
          style={{ fontSize: "min(22vw, 320px)" }}
        >
          assignwork
        </span>
      </div>
    </footer>
  );
}
