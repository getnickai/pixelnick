/* eslint-disable @next/next/no-img-element */
/**
 * Swarm Arena fixture card — the neutral "what's on / final score" card for the
 * Games tab. Used for a day's fixtures that aren't a full Market-vs-Agents
 * consensus card: settled games (show the final score + FT) and upcoming games
 * with no agent coverage yet (show the kickoff). Same shell/crests/footer as the
 * consensus + result cards (shared primitives from consensus-card-view).
 */
import {
  Crest,
  CREAM,
  DIM,
  FAINT,
} from "./consensus-card-view";

const ASSET = "/swarm-arena-cards/assets";

export type FixtureCardData = {
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  competition?: string;
  stage?: string;
  venue?: string;
  kickoff?: string;
  settled: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Team name, "Draw", or null. */
  winner?: string | null;
};

export function FixtureCardView({
  data,
  assetBase = ASSET,
}: {
  data: FixtureCardData;
  assetBase?: string;
}) {
  const homeWon = data.settled && (data.homeScore ?? 0) > (data.awayScore ?? 0);
  const awayWon = data.settled && (data.awayScore ?? 0) > (data.homeScore ?? 0);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />
      <div className="pointer-events-none absolute left-[-120px] top-[770px] h-[471px] w-[412px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-bottom.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>

      <div className="absolute inset-x-0 top-0 flex h-full flex-col gap-7 px-14 pt-14 pb-10 font-sans">
        {/* Header: wordmark + status pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img alt="" src={`${assetBase}/logos/swarm-arena.svg`} className="h-9 w-[31.5px] shrink-0" />
            <p className="text-xl font-bold uppercase leading-none text-[#fff8ea]">Swarm Arena</p>
          </div>
          <div
            className="rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide"
            style={
              data.settled
                ? { background: "rgba(255,248,234,0.14)", color: CREAM }
                : { background: "#8bce6c", color: "#161210" }
            }
          >
            {data.settled ? "Full Time" : "Upcoming"}
          </div>
        </div>

        {/* Eyebrow */}
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: DIM }}>
            {data.competition ?? "FIFA World Cup 2026"}
            {data.stage ? ` · ${data.stage}` : ""}
          </div>
          <div className="mt-1.5 font-mono text-[13px]" style={{ color: FAINT }}>
            {data.venue ?? ""}
            {data.kickoff ? ` · ${data.kickoff}` : ""}
          </div>
        </div>

        {/* Teams + score (or VS for upcoming) */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex w-full items-start justify-center gap-7">
            <div className="flex flex-1 flex-col items-center gap-2">
              <Crest code={data.homeCode} assetBase={assetBase} />
              <span className="text-center text-2xl font-semibold leading-tight" style={{ color: awayWon ? DIM : CREAM }}>
                {data.home}
              </span>
            </div>
            <div className="mt-[8px] flex shrink-0 flex-col items-center gap-2">
              {data.settled ? (
                <div className="flex items-center font-mono text-[46px] font-extrabold leading-none">
                  <span style={{ color: homeWon ? CREAM : DIM }}>{data.homeScore}</span>
                  <span className="px-2.5 text-[#7e7568]">–</span>
                  <span style={{ color: awayWon ? CREAM : DIM }}>{data.awayScore}</span>
                </div>
              ) : (
                <span className="mt-[10px] font-mono text-base font-bold" style={{ color: FAINT }}>VS</span>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <Crest code={data.awayCode} assetBase={assetBase} />
              <span className="text-center text-2xl font-semibold leading-tight" style={{ color: homeWon ? DIM : CREAM }}>
                {data.away}
              </span>
            </div>
          </div>
          <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: DIM }}>
            {data.settled
              ? data.winner && data.winner !== "Draw"
                ? `${data.winner} won`
                : "Full time · draw"
              : data.kickoff ?? "Kicks off soon"}
          </p>
        </div>

        {/* Footer */}
        <div>
          <p className="mb-3 font-mono text-[12px]" style={{ color: FAINT }}>
            {data.settled ? "Final score · " : "Scheduled · "}swarmarena.ai
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>
                Built On
              </span>
              <img alt="NickAI" src={`${assetBase}/NickAI-wordmark-white.svg`} className="h-[24px]" />
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
              style={{ backgroundImage: "linear-gradient(169deg, #f98051 17%, #e75218 89%)" }}
            >
              <span className="whitespace-nowrap text-lg font-semibold leading-none">View on Swarm Arena</span>
              <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Static still — wraps the View in the 650×1110 card box. */
export default function FixtureCard({
  data,
  assetBase,
}: {
  data: FixtureCardData;
  assetBase?: string;
}) {
  return (
    <article className="relative h-[1110px] w-[650px] overflow-clip rounded-2xl font-sans" data-card="fixture">
      <FixtureCardView data={data} assetBase={assetBase} />
    </article>
  );
}
