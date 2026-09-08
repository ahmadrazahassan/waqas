import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Rectangles. Maximum radius 4px.
 * No pill buttons anywhere in this product, at any size, in any state.
 */
const button = cva(
  [
    "group relative inline-flex select-none items-center justify-center gap-3",
    "rounded-sm font-medium whitespace-nowrap",
    "transition-colors duration-200 ease-[var(--ease-state)]",
    "disabled:pointer-events-none disabled:opacity-40",
  ],
  {
    variants: {
      variant: {
        primary: "border border-ink bg-lime text-ink hover:bg-lime-press",
        secondary: "border border-ink bg-ink text-white hover:bg-ink-soft",
        tertiary:
          "border border-line bg-transparent text-ink hover:border-ink",
        inverse:
          "border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10",
        violet:
          "border border-violet bg-violet text-white hover:border-violet-press hover:bg-violet-press",
        ghost:
          "bg-transparent text-ink underline-offset-4 hover:underline px-0",
      },
      size: {
        lg: "h-12 px-6 text-small",
        md: "h-10 px-5 text-small",
        sm: "h-8 px-3 text-micro",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/** The arrow square inverts against its button so lime stays in play. */
const arrowTone: Record<string, string> = {
  primary: "bg-ink text-lime",
  secondary: "bg-lime text-ink",
  tertiary: "bg-ink text-lime",
  inverse: "bg-white text-ink",
  violet: "bg-white text-violet",
  ghost: "bg-ink text-lime",
};

type BaseProps = VariantProps<typeof button> & {
  /** The 20px arrow affordance from the reference. On for marketing CTAs. */
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

function Inner({
  variant,
  arrow,
  children,
}: Pick<BaseProps, "variant" | "arrow" | "children">) {
  return (
    <>
      <span>{children}</span>
      {arrow ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-xs",
            arrowTone[variant ?? "primary"],
          )}
        >
          <ArrowUpRight
            size={12}
            strokeWidth={1.75}
            className="transition-transform duration-200 ease-[var(--ease-state)] group-hover:-translate-y-px group-hover:translate-x-px"
          />
        </span>
      ) : null}
    </>
  );
}

type ButtonProps = BaseProps &
  Omit<React.ComponentProps<"button">, "children" | "className">;

export function Button({
  variant,
  size,
  arrow,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(button({ variant, size }), className)} {...props}>
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    </button>
  );
}

/**
 * Generic over Link's own route parameter so `typedRoutes` can still check
 * literal hrefs through this wrapper. Widening href to `string` here would
 * silently switch route checking off for every button on the site.
 */
type LinkPropsOf<T extends string> = React.ComponentProps<typeof Link<T>>;

type ButtonLinkProps<T extends string> = BaseProps &
  Omit<LinkPropsOf<T>, "children" | "className">;

export function ButtonLink<T extends string>({
  variant,
  size,
  arrow,
  className,
  children,
  href,
  ...props
}: ButtonLinkProps<T>) {
  return (
    <Link
      href={href}
      className={cn(button({ variant, size }), className)}
      {...props}
    >
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    </Link>
  );
}

export { button as buttonVariants };
