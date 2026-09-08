import { Check, Minus } from "lucide-react";
import { plans } from "@/lib/site";
import { formatMoney } from "@/lib/utils";

type Cell = string | boolean;

const rows: { label: string; values: Cell[]; note?: string }[] = [
  {
    label: "Price",
    values: plans.map((p) => formatMoney(p.priceMinor)),
    note: "Paid once. No renewal, no monthly fee.",
  },
  {
    label: "Task claims a month",
    values: plans.map((p) => (p.claims === null ? "Unlimited" : String(p.claims))),
  },
  {
    label: "Entry and standard pools",
    values: [true, true, true],
  },
  {
    label: "Premium task pool",
    values: [false, false, true],
  },
  {
    label: "Priority claim window",
    values: [false, true, true],
    note: "Six hours ahead of everyone else, from rank 3",
  },
  {
    label: "Priority review",
    values: [false, false, true],
  },
  {
    label: "Vanity referral code",
    values: [false, false, true],
    note: "From rank 4",
  },
  {
    label: "Referral materials in Urdu",
    values: [false, true, true],
  },
  {
    label: "Referral programme",
    values: [true, true, true],
    note: "Included on every plan at the same headline rate",
  },
  {
    label: "Leaderboard eligible",
    values: [true, true, true],
  },
  {
    label: "Withdraw from",
    values: plans.map((p) => formatMoney(p.payoutThresholdMinor)),
  },
];

function CellValue({ value }: { value: Cell }) {
  if (typeof value === "boolean") {
    return value ? (
      <>
        <Check size={16} strokeWidth={1.25} aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <Minus size={16} strokeWidth={1.25} className="text-muted" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="tabular">{value}</span>;
}

/**
 * A real table above 768px, and one stacked definition list per plan below it.
 * Both render the same data; the hidden branch is removed from the DOM rather
 * than visually hidden, so a screen reader never meets a duplicate.
 */
export function PlanComparison() {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse">
          <caption className="sr-only">
            Feature comparison across the three Assignwork plans
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="w-[34%] py-4 text-start text-micro uppercase tracking-[0.08em] text-muted"
              >
                Feature
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.code}
                  scope="col"
                  className="py-4 text-start text-micro uppercase tracking-[0.08em] text-muted"
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line">
                <th scope="row" className="py-5 pe-6 text-start align-top font-normal">
                  <span className="text-small">{row.label}</span>
                  {row.note ? (
                    <span className="mt-1 block max-w-[38ch] text-micro font-normal text-muted">
                      {row.note}
                    </span>
                  ) : null}
                </th>
                {row.values.map((value, i) => (
                  <td key={plans[i]?.code ?? i} className="py-5 align-top text-small">
                    <CellValue value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-10 md:hidden">
        {plans.map((plan, planIndex) => (
          <div key={plan.code}>
            <h3 className="text-h4">{plan.name}</h3>
            <dl className="mt-4 border-t border-line">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-6 border-b border-line py-3.5"
                >
                  <dt className="text-small text-muted">{row.label}</dt>
                  <dd className="shrink-0 text-small">
                    <CellValue value={row.values[planIndex] ?? false} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
