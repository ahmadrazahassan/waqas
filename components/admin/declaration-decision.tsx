"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { decideDeclaration, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function DeclarationDecision({ declarationId }: { declarationId: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    decideDeclaration,
    {},
  );
  const [rejecting, setRejecting] = useState(false);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col items-end gap-3">
      <input type="hidden" name="declaration_id" value={declarationId} />
      {!rejecting ? <label className="flex items-start gap-3 text-small text-muted">
        <input type="checkbox" name="verified" required className="mt-1 size-4 shrink-0 accent-ink" />
        <span>I checked the receipt against the actual transaction history. The recipient, reference and amount match, and the payment succeeded.</span>
      </label> : null}

      {rejecting ? (
        <div className="w-full">
          <label
            htmlFor={`reason-${declarationId}`}
            className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
          >
            Why it could not be matched
          </label>
          <textarea
            id={`reason-${declarationId}`}
            name="reject_reason"
            rows={2}
            required
            minLength={5}
            maxLength={500}
            placeholder="No transfer found with that reference. Check it and declare again."
            className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {rejecting ? (
          <>
            <Button
              type="submit"
              name="decision"
              value="rejected"
              size="sm"
              variant="violet"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                "Send rejection"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRejecting(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              type="submit"
              name="decision"
              value="confirmed"
              size="sm"
              variant="primary"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                "Verify payment and activate"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="tertiary"
              onClick={() => setRejecting(true)}
            >
              Cannot match
            </Button>
          </>
        )}
      </div>

      {state.error ? (
        <p role="alert" className="text-end text-micro text-critical">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-end text-micro text-positive">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
