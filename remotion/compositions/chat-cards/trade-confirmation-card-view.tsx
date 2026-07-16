/**
 * TradeConfirmationCardView — the in-chat trade-fill confirmation Nick renders
 * when an order executes, faithful to the real product widget family
 * (execution-widgets.tsx / the "buy-filled" card on nickai-app, PR #92).
 *
 * Pure and inline-styled so it renders identically headless. `anim` (0..1)
 * optionally drives the check-mark draw + a total count-up; it defaults to 1
 * (fully settled) so a still renders complete.
 */
import { CardShell, fmtUsd, TOKENS } from "./card-primitives";
import type { TradeConfirmationCardData } from "./props";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function CheckBadge({ k, draw }: { k: number; draw: number }) {
  const s = 34 * k;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s,
        height: s,
        borderRadius: 999,
        backgroundColor: "rgba(31,193,107,0.16)",
        flexShrink: 0,
      }}
    >
      <svg width={s * 0.56} height={s * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12.5l5 5 11-11"
          stroke={TOKENS.success}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.max(0, Math.min(1, draw))}
        />
      </svg>
    </span>
  );
}

function Row({ k, label, value, strong }: { k: number; label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
      <span style={{ fontSize: 14 * k, color: TOKENS.textSub }}>{label}</span>
      <span
        style={{
          fontFamily: TOKENS.mono,
          fontVariantNumeric: "tabular-nums",
          fontSize: (strong ? 17 : 14) * k,
          fontWeight: strong ? 700 : 600,
          color: TOKENS.textStrong,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function TradeConfirmationCardView({
  data,
  width = 440,
  anim = 1,
}: {
  data: TradeConfirmationCardData;
  width?: number;
  anim?: number;
}) {
  const k = width / 440;
  const a = Math.max(0, Math.min(1, anim));
  const shownTotal = data.total * easeOutCubic(a);
  const sideColor = data.side === "Buy" ? TOKENS.success : TOKENS.error;

  return (
    <CardShell k={k} width={width} style={{ height: "100%" }}>
      {/* Header: check + symbol + filled pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 * k }}>
        <CheckBadge k={k} draw={a} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 * k, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
            <span style={{ fontWeight: 700, fontSize: 17 * k, color: TOKENS.textStrong, letterSpacing: -0.2 * k }}>
              {data.symbol}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                padding: `${2 * k}px ${9 * k}px`,
                fontSize: 12 * k,
                fontWeight: 600,
                lineHeight: 1,
                color: sideColor,
                backgroundColor: data.side === "Buy" ? "rgba(31,193,107,0.14)" : "rgba(251,55,72,0.14)",
              }}
            >
              {`${data.side} · ${data.status}`}
            </span>
          </div>
          <span style={{ fontSize: 12.5 * k, color: TOKENS.textSoft, whiteSpace: "nowrap" }}>
            {data.name}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1 * k, backgroundColor: TOKENS.border }} />

      {/* Order details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 * k }}>
        <Row k={k} label="Shares" value={`${data.shares}`} />
        <Row k={k} label="Avg fill" value={fmtUsd(data.avgPrice)} />
        <Row k={k} label="Order total" value={fmtUsd(shownTotal)} strong />
      </div>

      {/* Footer: account + time */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          fontSize: 11.5 * k,
          color: TOKENS.textSoft,
        }}
      >
        <span>{data.account}</span>
        <span>{data.filledAt}</span>
      </div>
    </CardShell>
  );
}

export default TradeConfirmationCardView;
