"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const topics = [
  "Question about a plan",
  "Question about the referral programme",
  "Question about tasks",
  "Press or partnership",
  "Something else",
] as const;

type Errors = Partial<Record<"name" | "email" | "message", string>>;

/**
 * Phase 2 wires this to a Server Action writing into `support_tickets`, with
 * the same Zod schema validating on the server. Until then it validates
 * locally and tells the truth about not being connected yet, rather than
 * pretending to send.
 */
export function ContactForm() {
  const ids = {
    name: useId(),
    email: useId(),
    topic: useId(),
    message: useId(),
  };
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(form: HTMLFormElement): Errors {
    const data = new FormData(form);
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (name.length < 2) next.name = "Tell us what to call you.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = "That does not look like an email address.";
    if (message.length < 20)
      next.message = "A sentence or two more would help us answer properly.";

    return next;
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-md border border-line border-s-2 border-s-ink bg-surface p-8"
      >
        <h2 className="text-h4">Not connected yet</h2>
        <p className="mt-3 max-w-[56ch] text-body text-muted">
          Your message passed validation, but there is no inbox behind this form
          until the backend lands in phase 2. We would rather say that than show
          you a confirmation for a message nobody received. Email{" "}
          <a
            href="mailto:hello@assignwork.co.uk"
            className="text-violet underline underline-offset-2"
          >
            hello@assignwork.co.uk
          </a>{" "}
          in the meantime and it will reach a person.
        </p>
        <Button
          variant="tertiary"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          Back to the form
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const next = validate(e.currentTarget);
        setErrors(next);
        if (Object.keys(next).length === 0) setSubmitted(true);
      }}
      className="space-y-6"
    >
      <Field
        id={ids.name}
        name="name"
        label="Your name"
        autoComplete="name"
        error={errors.name}
      />
      <Field
        id={ids.email}
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        error={errors.email}
      />

      <div>
        <label
          htmlFor={ids.topic}
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          What is it about
        </label>
        <select
          id={ids.topic}
          name="topic"
          className="mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small"
        >
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={ids.message}
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Message
        </label>
        <textarea
          id={ids.message}
          name="message"
          rows={6}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${ids.message}-error` : undefined}
          className={cn(
            "mt-2 w-full rounded-sm border bg-surface p-3 text-small",
            errors.message ? "border-critical" : "border-line",
          )}
        />
        {errors.message ? (
          <p id={`${ids.message}-error`} className="mt-2 text-small text-critical">
            {errors.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" arrow>
        Send message
      </Button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-2 h-11 w-full rounded-sm border bg-surface px-3 text-small",
          error ? "border-critical" : "border-line",
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-small text-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}
