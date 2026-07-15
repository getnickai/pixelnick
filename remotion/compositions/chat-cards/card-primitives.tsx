/**
 * Shared design atoms for the NickAI chat cards, mirroring the real product
 * primitives (card-primitives.tsx on nickai-app: WidgetCard, CardHeader,
 * SourceBadge, CardSegmented, the "Ask for latest" chip). Pure and inline-styled
 * so the Views render identically headless (no Tailwind / AlignUI runtime).
 *
 * AlignUI dark tokens are approximated as concrete hex, sampled from the 2x
 * reference captures so the render matches pixel-closely:
 *   bg-white-0  (page / active segment)  #09090b
 *   bg-weak-50  (card surface)           #18181b
 *   stroke-soft-200 (hairline border)    #27272a
 *   text-strong-950                      #fafafa
 *   text-sub-600                         #a1a1aa
 *   text-soft-400                        #71717a
 *   success-base / error-base            #1fc16b / #fb3748  (brand green / red)
 */
import type { CSSProperties, ReactNode } from "react";

export const TOKENS = {
  page: "#09090b",
  card: "#18181b",
  segmentActive: "#09090b",
  border: "#27272a",
  textStrong: "#fafafa",
  textSub: "#a1a1aa",
  textSoft: "#71717a",
  success: "#1fc16b",
  error: "#fb3748",
  mono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
} as const;

// ── Formatting (mirrors node-shared fmtMoney / fmtUsd / fmtSignedMoney) ────────
export function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  return n.toLocaleString("en-US", {
    maximumFractionDigits: abs >= 1000 ? 0 : abs >= 1 ? 2 : 6,
  });
}
export function fmtUsd(n: number): string {
  return `${n < 0 ? "-" : ""}$${fmtMoney(Math.abs(n))}`;
}
export function fmtSignedMoney(n: number): string {
  return `${n >= 0 ? "+" : "−"}$${fmtMoney(Math.abs(n))}`;
}
export function fmtChangePct(pct: number): string {
  const sign = pct >= 0 ? "+" : "−";
  return `${sign}${Math.abs(pct).toFixed(2)}%`;
}

// ── SourceBadge ───────────────────────────────────────────────────────────────
// Rounded provider-attribution chip ("Databento", "papernick2").
export function SourceBadge({ k, children }: { k: number; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: `${1 * k}px solid ${TOKENS.border}`,
        padding: `${2 * k}px ${7 * k}px`,
        fontSize: 11 * k,
        lineHeight: 1,
        color: TOKENS.textSub,
      }}
    >
      {children}
    </span>
  );
}

// ── Snapshot + "Ask for latest" line ──────────────────────────────────────────
function RefreshGlyph({ k, color }: { k: number; color: string }) {
  const s = 11 * k;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SnapshotLine({ k, snapshot }: { k: number; snapshot: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6 * k,
        fontSize: 12 * k,
        lineHeight: 1.3,
        color: TOKENS.textSoft,
        whiteSpace: "nowrap",
      }}
    >
      <span>{`Snapshot · ${snapshot}`}</span>
      <span aria-hidden>{"·"}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 * k }}>
        <RefreshGlyph k={k} color={TOKENS.textSoft} />
        Ask for latest
      </span>
    </span>
  );
}

// ── LockGlyph (locked segment, e.g. "1D") ─────────────────────────────────────
export function LockGlyph({ k, color }: { k: number; color: string }) {
  const s = 11 * k;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth={2} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// ── CardHeader ────────────────────────────────────────────────────────────────
export function CardHeader({
  k,
  title,
  badge,
  snapshot,
}: {
  k: number;
  title: string;
  badge?: ReactNode;
  snapshot: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 * k }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 * k }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: 16 * k,
            lineHeight: 1.2,
            color: TOKENS.textStrong,
            letterSpacing: -0.2 * k,
          }}
        >
          {title}
        </span>
        {badge}
      </div>
      <SnapshotLine k={k} snapshot={snapshot} />
    </div>
  );
}

// ── Segmented control (iOS-style) ─────────────────────────────────────────────
export type Segment = { value: string; label: string; locked?: boolean };

export function Segmented({
  k,
  options,
  value,
}: {
  k: number;
  options: Segment[];
  value: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2 * k,
        borderRadius: 10 * k,
        padding: 2 * k,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <span
            key={o.value}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4 * k,
              minHeight: 30 * k,
              borderRadius: 8 * k,
              padding: `${3 * k}px ${11 * k}px`,
              fontSize: 13 * k,
              fontWeight: active ? 600 : 500,
              color: active ? TOKENS.textStrong : o.locked ? TOKENS.textSoft : TOKENS.textSub,
              backgroundColor: active ? TOKENS.segmentActive : "transparent",
              boxShadow: active ? `0 ${1 * k}px ${3 * k}px rgba(0,0,0,0.5)` : "none",
              border: active ? `${1 * k}px solid ${TOKENS.border}` : `${1 * k}px solid transparent`,
            }}
          >
            {o.label}
            {o.locked && <LockGlyph k={k} color={TOKENS.textSoft} />}
          </span>
        );
      })}
    </div>
  );
}

// ── CardShell (WidgetCard: rounded-20 border bg-weak-50 p-4) ───────────────────
export function CardShell({
  k,
  width,
  style,
  children,
}: {
  k: number;
  width: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12 * k,
        borderRadius: 20 * k,
        border: `${1 * k}px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.card,
        padding: 16 * k,
        overflow: "hidden",
        fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
