import Image from "next/image";

const destinations = [
  { image: "umrah-makkah", title: "Umrah journey", location: "Makkah, Saudi Arabia", description: "A meaningful journey to the sacred mosque." },
  { image: "naran-valley", title: "Northern Areas escape", location: "Naran and Kaghan, Pakistan", description: "Mountain air, green valleys and time together." },
  { image: "laptop-prize", title: "Room to do more", location: "Equipment awards", description: "Tools for your next chapter of work." },
  { image: "saif-ul-malook", title: "Lake Saif ul Malook", location: "Kaghan Valley, Pakistan", description: "Alpine water framed by snow covered peaks." },
  { image: "umrah-madinah", title: "Time in Madinah", location: "Madinah, Saudi Arabia", description: "A quiet moment at Al Masjid an Nabawi." },
  { image: "phone-prize", title: "Stay connected", location: "Equipment awards", description: "A practical companion for work and everyday life." },
];

export function PrizeGallery({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mt-10">
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {(compact ? destinations.slice(0, 3) : destinations).map((item) => (
          <figure key={item.image} className="min-w-0">
            <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-surface-alt">
              <Image src={`/images/assignwork/${item.image}.webp`} alt={item.title === "Umrah journey" ? "Generated view of the Kaaba and mosque courtyard in Makkah" : item.description}
                fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
            </div>
            <figcaption className="pt-5">
              <p className="text-micro uppercase tracking-[0.08em] text-muted">{item.location}</p>
              <h3 className="mt-2 text-h4">{item.title}</h3>
              <p className="mt-2 text-small text-muted">{item.description}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-6 text-micro text-muted">AI generated destination and product imagery for illustration. Confirmed itineraries and equipment models will be published with each season.</p>
    </div>
  );
}
