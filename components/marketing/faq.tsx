"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function Faq({
  items,
}: {
  items: readonly { readonly q: string; readonly a: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto w-full max-w-[780px]">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="border-b border-line">
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="flex w-full items-start justify-between gap-6 py-6 text-start transition-opacity duration-200 hover:opacity-70"
              >
                <span className="text-h4">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 grid size-6 shrink-0 place-items-center rounded-xs border border-line"
                >
                  {open ? (
                    <Minus size={13} strokeWidth={1.25} />
                  ) : (
                    <Plus size={13} strokeWidth={1.25} />
                  )}
                </span>
              </button>
            </h3>

            {open ? (
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-trigger-${i}`}
                className="pb-7"
              >
                <p className="max-w-[62ch] text-body text-muted">{item.a}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
