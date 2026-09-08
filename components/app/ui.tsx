import Link from "next/link";
import { cn } from "@/lib/utils";
import { route } from "@/lib/routes";

/** Page heading inside the dashboard. Denser than the marketing PageHeader. */
export function PageTitle({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-h2">{title}</h1>
        {lead ? (
          <p className="mt-2 max-w-[64ch] text-small text-muted">{lead}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Stat tile. Value is always tabular so a column of them lines up. */
export function StatTile({
  label,
  value,
  sub,
  tone = "light",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "light" | "ink" | "lime";
  href?: string;
}) {
  const tones = {
    light: "border-line bg-surface text-ink",
    ink: "border-ink bg-ink text-white",
    lime: "border-ink bg-lime text-ink",
  } as const;

  const body = (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-md border p-6 transition-colors duration-200",
        tones[tone],
        href && "hover:border-ink",
      )}
    >
      <p
        className={cn(
          "text-micro uppercase tracking-[0.08em]",
          tone === "ink" ? "text-white/60" : "text-muted",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-6 text-h1 leading-none tabular",
          tone === "ink" && "text-lime",
        )}
      >
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            "mt-3 text-small",
            tone === "ink" ? "text-white/60" : "text-muted",
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );

  return href ? (
    <Link href={route(href)} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Progress bar. Never the only carrier of meaning: pair it with the numbers. */
export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-micro text-muted">{label}</span>
          <span className="text-micro tabular">
            {value} of {max}
          </span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-xs bg-surface-alt"
      >
        <div
          className="h-full bg-ink transition-[width] duration-500 ease-[var(--ease-entrance)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Status pill. Rectangular, and always paired with its own text. */
export function Status({
  status,
}: {
  status: string;
}) {
  const map: Record<string, { tone: string; label: string }> = {
    pending:   { tone: "bg-warning/12 text-warning",   label: "Pending" },
    review:    { tone: "bg-warning/12 text-warning",   label: "Under review" },
    available: { tone: "bg-positive/12 text-positive", label: "Available" },
    paid:      { tone: "bg-positive/12 text-positive", label: "Paid" },
    reversed:  { tone: "bg-critical/12 text-critical", label: "Reversed" },
    void:      { tone: "bg-surface-alt text-muted",    label: "Void" },
    active:    { tone: "bg-positive/12 text-positive", label: "Active" },
    submitted: { tone: "bg-info/12 text-info",         label: "Submitted" },
    in_review: { tone: "bg-warning/12 text-warning",   label: "In review" },
    revision:  { tone: "bg-warning/12 text-warning",   label: "Needs changes" },
    approved:  { tone: "bg-positive/12 text-positive", label: "Approved" },
    rejected:  { tone: "bg-critical/12 text-critical", label: "Rejected" },
    expired:   { tone: "bg-surface-alt text-muted",    label: "Expired" },
    requested: { tone: "bg-info/12 text-info",         label: "Requested" },
    approved_payout: { tone: "bg-info/12 text-info",   label: "Approved" },
    processing:{ tone: "bg-info/12 text-info",         label: "Processing" },
    failed:    { tone: "bg-critical/12 text-critical", label: "Failed" },
    cancelled: { tone: "bg-surface-alt text-muted",    label: "Cancelled" },
    open:      { tone: "bg-positive/12 text-positive", label: "Open" },
    full:      { tone: "bg-surface-alt text-muted",    label: "Full" },
    draft:     { tone: "bg-surface-alt text-muted",    label: "Draft" },
    completed: { tone: "bg-positive/12 text-positive", label: "Completed" },
    suspended: { tone: "bg-critical/12 text-critical", label: "Suspended" },
    restricted:{ tone: "bg-warning/12 text-warning",   label: "Restricted" },
  };

  const meta = map[status] ?? { tone: "bg-surface-alt text-muted", label: status };

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-xs px-2 text-micro font-medium",
        meta.tone,
      )}
    >
      {meta.label}
    </span>
  );
}

/** Empty state inside the app. */
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-10 text-center">
      <p className="text-h4">{title}</p>
      <p className="mx-auto mt-2 max-w-[52ch] text-small text-muted">{body}</p>
      {action ? (
        <Link
          href={route(action.href)}
          className="mt-6 inline-flex h-10 items-center rounded-sm border border-line px-5 text-small font-medium transition-colors duration-200 hover:border-ink"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Table that collapses into stacked definition cards below md. Both branches
 * render the same data; the hidden one is removed from the DOM, not just
 * visually hidden, so screen readers never meet a duplicate.
 */
export function DataTable<T>({
  columns,
  rows,
  keyOf,
  empty,
}: {
  columns: {
    key: string;
    header: string;
    align?: "start" | "end";
    render: (row: T) => React.ReactNode;
  }[];
  rows: T[];
  keyOf: (row: T) => string;
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "py-3 text-micro uppercase tracking-[0.08em] text-muted",
                    c.align === "end" ? "text-end" : "text-start",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyOf(row)}
                className="border-b border-line transition-colors duration-200 hover:bg-bg"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "py-4 pe-4 text-small",
                      c.align === "end" && "text-end tabular",
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <dl
            key={keyOf(row)}
            className="rounded-md border border-line bg-surface p-4"
          >
            {columns.map((c) => (
              <div
                key={c.key}
                className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0"
              >
                <dt className="text-micro text-muted">{c.header}</dt>
                <dd className="text-small">{c.render(row)}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </>
  );
}
