// Server-only readers for the X engine feeds (uses node:fs). Import ONLY from
// server components. Client components import shapes/constants from ./x-engine.
//
// v1 reads a committed JSON snapshot under data/x-engine/. Prod can swap this
// for an R2 fetch without touching the views (the shapes are unchanged).

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { XSignal, XDraft, XPost, XDrop } from "./x-engine";

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), "data/x-engine", file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function readSignals(): { generated_at?: string; signals: XSignal[] } {
  return readJson("signals.json", { signals: [] });
}

export function readDrafts(): { generated_at?: string; drafts: XDraft[] } {
  return readJson("drafts.json", { drafts: [] });
}

export function readPosts(): { generated_at?: string; posts: XPost[] } {
  return readJson("posts.json", { posts: [] });
}

export function readDrop(): XDrop | null {
  return readJson<XDrop | null>("drop.json", null);
}

/** All archived daily drops, newest edition first. Each lives at
 *  data/x-engine/drops/<YYYY-MM-DD>.json (written by archive-drop.ts). */
export function readDropArchive(): XDrop[] {
  let files: string[];
  try {
    files = readdirSync(resolve(process.cwd(), "data/x-engine/drops")).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const drops: XDrop[] = [];
  for (const f of files) {
    const d = readJson<XDrop | null>(`drops/${f}`, null);
    if (d) {
      if (!d.date) d.date = f.replace(/\.json$/, ""); // fall back to filename
      drops.push(d);
    }
  }
  return drops.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
