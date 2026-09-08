/**
 * Social glyphs drawn as line art at the same 1.25 stroke weight as the Lucide
 * set, because lucide-react 1.x dropped its brand icons. Outline only, no fill,
 * currentColor, on the same 24px grid as everything else.
 */

type IconProps = { size?: number; className?: string };

function Frame({
  size = 20,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7.5 10.5v6" />
      <path d="M7.5 7.6v.01" />
      <path d="M11.5 16.5v-6" />
      <path d="M11.5 13a2.5 2.5 0 0 1 5 0v3.5" />
    </Frame>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M17 7v.01" />
    </Frame>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 8.25h-1.5a2 2 0 0 0-2 2V21" />
      <path d="M9.25 13.25h5" />
    </Frame>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M20.5 11.75a8.5 8.5 0 0 1-12.6 7.45L3.5 20.5l1.35-4.3A8.5 8.5 0 1 1 20.5 11.75Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.7-.9.9a5.7 5.7 0 0 1-2.4-2.4l.9-.9L11 9.5c0-.5-.4-1-1-1s-1 .5-1 1Z" />
    </Frame>
  );
}
