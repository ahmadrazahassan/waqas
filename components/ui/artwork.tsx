import Image from "next/image";
import { cn } from "@/lib/utils";

/** Shared framing keeps the illustration collection consistent at every width. */
export function Artwork({ name, alt = "", className, preload = false }: {
  name: string;
  alt?: string;
  className?: string;
  preload?: boolean;
}) {
  return (
    <div className={cn("relative aspect-[3/2] overflow-hidden rounded-md bg-bg", className)}>
      <Image src={`/images/assignwork/${name}.webp`} alt={alt} fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
        className="object-contain" preload={preload} />
    </div>
  );
}
