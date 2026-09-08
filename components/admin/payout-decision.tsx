"use client";

import { useActionState } from "react";
import { decidePayout, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function PayoutDecision({
  payoutId,
  status,
}: {
  payoutId: string;
  status: string;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    decidePayout,
    {},
  );

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="payout_id" value={payoutId} />

      <div className="flex gap-2">
        {status === "requested" ? (
          <Button
            type="submit"
            name="decision"
            value="approved"
            size="sm"
            variant="tertiary"
            disabled={pending}
          >
            Approve
          </Button>
        ) : null}

        <Button
          type="submit"
          name="decision"
          value="paid"
          size="sm"
          variant="primary"
          disabled={pending}
        >
          Mark paid
        </Button>

        <Button
          type="submit"
          name="decision"
          value="failed"
          size="sm"
          variant="tertiary"
          disabled={pending}
        >
          Failed
        </Button>
      </div>

      {state.error ? (
        <p role="alert" className="max-w-[40ch] text-end text-micro text-critical">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-micro text-positive">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
