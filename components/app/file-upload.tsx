"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Uploaded = { path: string; name: string; size: number };

/**
 * Uploads straight from the browser to Supabase Storage.
 *
 * The path is always <user_id>/<random>-<filename>, which is what the storage
 * policies check: a member can only write inside their own folder and can only
 * read back out of it. The file never passes through our server, so a 25MB
 * submission does not occupy a serverless function for the duration.
 *
 * The random prefix stops a second upload of "final.docx" silently overwriting
 * the first, and stops anyone guessing another member's object name.
 */
export function FileUpload({
  bucket,
  label,
  hint,
  accept,
  multiple = false,
  onUploaded,
}: {
  bucket: "submissions" | "avatars" | "kyc";
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onUploaded: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(selected: FileList | null) {
    if (!selected || selected.length === 0) return;

    setBusy(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired. Reload the page and log in again.");
      setBusy(false);
      return;
    }

    const done: Uploaded[] = [];

    for (const file of Array.from(selected)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
      const path = `${user.id}/${crypto.randomUUID().slice(0, 8)}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError(
          uploadError.message.includes("exceeded")
            ? "That file is too large for this bucket."
            : `Could not upload ${file.name}. ${uploadError.message}`,
        );
        setBusy(false);
        return;
      }

      done.push({ path, name: file.name, size: file.size });
      onUploaded(path);
    }

    setFiles((prev) => (multiple ? [...prev, ...done] : done));
    setBusy(false);
  }

  function remove(path: string) {
    setFiles((prev) => prev.filter((f) => f.path !== path));
    onUploaded("");
  }

  return (
    <div>
      <p className="text-micro font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </p>

      <div className="mt-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handle(e.target.files)}
          className="sr-only"
          id={`upload-${bucket}-${label.replace(/\s+/g, "-")}`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-sm border border-line bg-surface px-4 text-small font-medium transition-colors duration-200",
            busy ? "opacity-60" : "hover:border-ink",
          )}
        >
          {busy ? (
            <LoaderCircle size={15} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Paperclip size={15} strokeWidth={1.5} />
          )}
          {busy ? "Uploading" : files.length > 0 && !multiple ? "Replace file" : "Choose a file"}
        </button>
      </div>

      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li
              key={f.path}
              className="flex items-center justify-between gap-3 rounded-sm border border-line bg-bg px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-small">{f.name}</span>
                <span className="block text-micro text-muted tabular">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(f.path)}
                aria-label={`Remove ${f.name}`}
                className="shrink-0 text-muted transition-colors duration-200 hover:text-critical"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {hint && !error ? (
        <p className="mt-2 text-micro text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-small text-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}
