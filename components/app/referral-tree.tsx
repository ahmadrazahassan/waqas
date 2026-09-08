"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Table2, Network } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Status, DataTable, Empty } from "@/components/app/ui";
import { CountryChip } from "@/components/ui/flag";

export type TreeNode = {
  id: string;
  name: string;
  depth: number;
  rank: string;
  status: string;
  joinedAt: string;
  country: string;
};

const DEPTH_LABEL = ["", "Level 1", "Level 2", "Level 3"];

/**
 * The network, as columns on desktop and a nested accordion below 1024.
 *
 * Connectors are 1px orthogonal rules, never curves. There is a visible
 * "view as table" toggle rather than a hidden screen reader alternative,
 * because a keyboard user should get the same choice as everyone else.
 */
export function ReferralTree({
  rootName,
  rootRank,
  nodes,
}: {
  rootName: string;
  rootRank: string;
  nodes: TreeNode[];
}) {
  const [view, setView] = useState<"tree" | "table">("tree");
  const [openDepth1, setOpenDepth1] = useState<string | null>(null);

  const byDepth = useMemo(
    () => ({
      1: nodes.filter((n) => n.depth === 1),
      2: nodes.filter((n) => n.depth === 2),
      3: nodes.filter((n) => n.depth === 3),
    }),
    [nodes],
  );

  if (nodes.length === 0) {
    return (
      <Empty
        title="Your network is empty"
        body="Nobody has joined through your link yet. When they do, they appear here with their rank and whether they are paying."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-sm border border-line bg-surface p-1">
        <button
          type="button"
          onClick={() => setView("tree")}
          aria-pressed={view === "tree"}
          className={cn(
            "inline-flex items-center gap-2 rounded-xs px-3 py-1.5 text-small font-medium transition-colors duration-200",
            view === "tree" ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          <Network size={15} strokeWidth={1.25} />
          Chain
        </button>
        <button
          type="button"
          onClick={() => setView("table")}
          aria-pressed={view === "table"}
          className={cn(
            "inline-flex items-center gap-2 rounded-xs px-3 py-1.5 text-small font-medium transition-colors duration-200",
            view === "table" ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          <Table2 size={15} strokeWidth={1.25} />
          Table
        </button>
      </div>

      {view === "table" ? (
        <DataTable
          rows={nodes}
          keyOf={(n) => n.id}
          columns={[
            {
              key: "name",
              header: "Member",
              render: (n) => <span className="font-medium">{n.name}</span>,
            },
            { key: "depth", header: "Level", render: (n) => DEPTH_LABEL[n.depth] },
            { key: "rank", header: "Rank", render: (n) => n.rank },
            {
              key: "country",
              header: "Country",
              render: (n) => <CountryChip code={n.country} size="sm" />,
            },
            { key: "joined", header: "Joined", render: (n) => formatDate(n.joinedAt) },
            {
              key: "status",
              header: "Status",
              render: (n) => <Status status={n.status} />,
            },
          ]}
        />
      ) : (
        <>
          {/* Desktop: three columns, orthogonal rules between them */}
          <div className="hidden gap-px lg:grid lg:grid-cols-3">
            {[1, 2, 3].map((depth) => {
              const list = byDepth[depth as 1 | 2 | 3];
              return (
                <div
                  key={depth}
                  className="rounded-md border border-line bg-surface"
                >
                  <div className="sticky top-18 flex items-baseline justify-between gap-2 border-b border-line bg-surface px-4 py-3">
                    <span className="text-micro uppercase tracking-[0.08em] text-muted">
                      {DEPTH_LABEL[depth]}
                    </span>
                    <span className="text-micro tabular">
                      {list.length} {list.length === 1 ? "member" : "members"}
                    </span>
                  </div>

                  <ul className="max-h-[520px] overflow-y-auto p-2">
                    {list.length === 0 ? (
                      <li className="px-2 py-6 text-small text-muted">
                        {depth === 1
                          ? "Nobody at this level yet."
                          : "This fills up when the level above starts referring."}
                      </li>
                    ) : (
                      list.map((node) => <NodeCard key={node.id} node={node} />)
                    )}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Mobile: nested accordion, no horizontal scroll, no pinch zoom */}
          <div className="lg:hidden">
            <div className="rounded-md border border-line bg-surface p-4">
              <p className="text-small font-medium">{rootName}</p>
              <p className="text-micro text-muted">You · {rootRank}</p>
            </div>

            <ul className="mt-2 space-y-2 ps-4">
              {byDepth[1].map((node) => {
                const open = openDepth1 === node.id;
                return (
                  <li key={node.id} className="border-s border-line ps-4">
                    <button
                      type="button"
                      onClick={() => setOpenDepth1(open ? null : node.id)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-surface p-4 text-start"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-small font-medium">
                          {node.name}
                        </span>
                        <span className="block text-micro text-muted">
                          {node.rank} · joined {formatDate(node.joinedAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Status status={node.status} />
                        <ChevronRight
                          size={16}
                          strokeWidth={1.25}
                          className={cn(
                            "transition-transform duration-200",
                            open && "rotate-90",
                          )}
                        />
                      </span>
                    </button>

                    {open ? (
                      <ul className="mt-2 space-y-2 ps-4">
                        {byDepth[2].length === 0 ? (
                          <li className="border-s border-line py-3 ps-4 text-small text-muted">
                            Nobody at level 2 yet.
                          </li>
                        ) : (
                          byDepth[2].map((child) => (
                            <li key={child.id} className="border-s border-line ps-4">
                              <div className="rounded-md border border-line bg-bg p-3">
                                <p className="truncate text-small">{child.name}</p>
                                <p className="text-micro text-muted">
                                  Level 2 · {child.rank}
                                </p>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function NodeCard({ node }: { node: TreeNode }) {
  return (
    <li className="mb-1 rounded-sm border border-line bg-bg p-3 transition-colors duration-200 hover:border-ink">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-small font-medium">{node.name}</p>
          <p className="text-micro text-muted">
            {node.rank} · <CountryChip code={node.country} size="sm" showName={false} />
          </p>
        </div>
        <Status status={node.status} />
      </div>
      <p className="mt-2 text-micro text-muted">
        Joined {formatDate(node.joinedAt)}
      </p>
    </li>
  );
}
