import { Container, Eyebrow } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Artwork } from "@/components/ui/artwork";

/**
 * Opening block for interior pages. These sit under a solid header rather than
 * a photographic hero, so the top padding carries the weight instead.
 */
export function PageHeader({
  eyebrow,
  heading,
  lead,
  children,
  className,
  artwork,
}: {
  eyebrow: string;
  heading: string;
  lead?: string;
  children?: React.ReactNode;
  className?: string;
  artwork?: string;
}) {
  return (
    <header className={cn("border-b border-line pt-16 pb-16 lg:pt-24 lg:pb-20", className)}>
      <Container className={artwork ? "grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16" : undefined}>
        <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-6 max-w-[20ch] text-h1">{heading}</h1>
        {lead ? (
          <p className="mt-6 max-w-[62ch] text-lead text-muted">{lead}</p>
        ) : null}
        {children ? <div className="mt-10">{children}</div> : null}
        </div>
        {artwork ? <Artwork name={artwork} preload /> : null}
      </Container>
    </header>
  );
}
