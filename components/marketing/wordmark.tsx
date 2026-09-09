import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "white";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center transition-opacity duration-200 hover:opacity-70",
        className,
      )}
      aria-label="Assignwork, home"
    >
      {tone === "white" ? (
        <span className="inline-flex items-center gap-2">
          <Image
            src="/brand/assignwork-mark.png"
            alt=""
            width={96}
            height={96}
            priority
            className="size-9 object-contain"
          />
          <span className="text-h4 font-semibold tracking-[-0.03em] text-white">
            assignwork
          </span>
        </span>
      ) : (
        <Image
          src="/brand/assignwork-logo.png"
          alt="Assignwork"
          width={360}
          height={120}
          priority
          className="h-9 w-auto object-contain sm:h-10"
        />
      )}
    </Link>
  );
}
