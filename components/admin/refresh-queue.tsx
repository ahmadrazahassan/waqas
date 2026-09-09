"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshQueue() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button variant="tertiary" size="sm" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Refreshing…" : "Refresh queue"}</Button>;
}
