import { cn } from "@/lib/utils";
import Image from "next/image";

/**
 * Photographic panel with a flat dark scrim. Never a gradient overlay.
 *
 * Optimized responsive photography over an ink base, with a flat dark scrim.
 *
 * The photographs here are decorative: the heading over them carries the
 * meaning, so there is no alt text to lose.
 */
export function Media({
  src,
  className,
  scrim = true,
  position = "center",
  children,
  preload = false,
}: {
  src: string;
  className?: string;
  scrim?: boolean;
  position?: string;
  children?: React.ReactNode;
  preload?: boolean;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-ink", className)}>
      <Image src={src} alt="" fill sizes="100vw" preload={preload}
        className="object-cover" style={{ objectPosition: position }} />
      {scrim ? <div aria-hidden="true" className="scrim" /> : null}
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}
