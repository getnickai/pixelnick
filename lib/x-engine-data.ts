// Server-only readers for the X engine feeds (uses node:fs). Import ONLY from
// server components. Client components import shapes/constants from ./x-engine.
//
// v1 reads a committed JSON snapshot under data/x-engine/. Prod can swap this
// for an R2 fetch without touching the views (the shapes are unchanged).

import { readFileSync } from "node:fs";
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
