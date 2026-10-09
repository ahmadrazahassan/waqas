"use client";

import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-20">
      <h1 className="text-h2">This page could not load</h1>
      <p className="mt-5 text-body text-muted">
        Please try again. If the problem continues, contact support.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={retry}>Try again</Button>
        <ButtonLink href="/" variant="tertiary">Back to home</ButtonLink>
      </div>
    </main>
  );
}
