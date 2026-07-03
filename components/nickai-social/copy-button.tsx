"use client";

import { useState } from "react";

/** One-click copy for post text — the whole point of the /nickai section. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:border-primary-500 hover:text-white"
    >
      {copied ? "Copied" : "Copy text"}
    </button>
  );
}
