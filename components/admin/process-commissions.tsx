"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  processDueCommissions,
  type AdminState,
} from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function ProcessCommissions() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    processDueCommissions,
    {},
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" size="sm" variant="tertiary" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle size={14} className="animate-spin" /> Processing
          </>
        ) : (
          "Process due commissions"
        )}
      </Button>
      {state.error ? (
        <p role="alert" className="text-micro text-critical">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-micro text-positive">{state.ok}</p>
      ) : null}
    </form>
  );
}
