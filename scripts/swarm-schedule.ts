/**
 * World Cup schedule feed — every fixture, grouped by match day.
 *
 * Reads ALL fixtures from the swarm-arena mirror `matches` table (past +
 * future) and writes a per-day schedule the engine-history page uses to:
 *   - populate the match-day timeline dropdown (every day that has games), and
 *   - list each day's fixtures in the Games tab (consensus/preview if upcoming,
 *     final-score card once settled).
 *
 *   public/swarm-arena-cards/fixtures.json
 *
 * Shape:
 *   { generatedAt, source, count, days: ["YYYY-MM-DD", …],
 *     fixtures: [{ matchUid, day, kickoffISO, kickoff, competition, stage,
 *       venue, home:{name,code}, away:{name,code}, status, settled,
 *       homeScore, awayScore, winner }] }
 *
 * NOTE: distinct from scripts/swarm-fixtures.ts (which emits offline *sample*
 * agent data). This one is the live fixture schedule.
 *
 * Env: SWARM_DB_URL.  Run: bun scripts/swarm-schedule.ts
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "fixtures.json");

// Full team name → code (matches the card engine's TEAM_MARKS keys / flagSlug).
const CODE: Record<string, string> = {
  Mexico: "MX", "South Africa": "ZA", "South Korea": "KR", "Czech Republic": "CZ",
  Canada: "CA", "Bosnia-Herzegovina": "BA", USA: "US", "United States": "US",
  Paraguay: "PY", Qatar: "QA", Switzerland: "CH", Brazil: "BR", France: "FR",
  Argentina: "AR", England: "GB", Spain: "ES", Germany: "DE", Portugal: "PT",
  Netherlands: "NL", Belgium: "BE", Croatia: "HR", Morocco: "MA", Japan: "JP",
  Uruguay: "UY", Colombia: "CO", Senegal: "SN", Denmark: "DK", Australia: "AU",
  Ecuador: "EC", Ghana: "GH", Norway: "NO", Iran: "IR", "New Zealand": "NZ",
  "Saudi Arabia": "SA", "Cape Verde": "CV", Iraq: "IQ", Algeria: "DZ", Jordan: "JO",
  Austria: "AT", Uzbekistan: "UZ", "Congo DR": "CD", Panama: "PA", Haiti: "HT",
  Scotland: "GB-SCT", Tunisia: "TN", Sweden: "SE", Turkey: "TR", "Ivory Coast": "CI",
  "Curaçao": "CW", Curacao: "CW", Egypt: "EG", Poland: "PL", Bahrain: "BH",
};
const codeFor = (name: string) => CODE[name] ?? name.slice(0, 3).toUpperCase();

// US Eastern time — the canonical "US time" for the schedule (day bucketing +
// kickoff display), so games land on the day a US viewer expects.
const TZ = "America/New_York";
/** ET calendar day, YYYY-MM-DD (en-CA gives ISO order). */
const etDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ, timeZoneName: "short" });
  return `${date} · ${time}`;
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.SWARM_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    statement_timeout: 15000,
  });
  const { rows } = await pool.query(
    `SELECT match_uid, tournament, stage, home_team, away_team, scheduled_at,
            venue, status, home_score, away_score, winner
     FROM matches ORDER BY scheduled_at ASC`,
  );
  await pool.end();

  const fixtures = rows.map((r) => {
    const kickoffISO = new Date(r.scheduled_at).toISOString();
    const settled = String(r.status ?? "").toUpperCase() === "FT";
    return {
      matchUid: r.match_uid,
      day: etDay(kickoffISO), // YYYY-MM-DD in US Eastern time
      kickoffISO,
      kickoff: fmtKickoff(kickoffISO),
      competition: r.tournament ?? "FIFA World Cup 2026",
      stage: String(r.stage ?? "").replace(/\s*-\s*/g, " · "),
      venue: r.venue ?? null,
      home: { name: r.home_team, code: codeFor(r.home_team) },
      away: { name: r.away_team, code: codeFor(r.away_team) },
      status: r.status ?? null,
      settled,
      homeScore: settled ? Number(r.home_score) : null,
      awayScore: settled ? Number(r.away_score) : null,
      winner: settled ? (r.winner ?? null) : null,
    };
  });

  const days = [...new Set(fixtures.map((f) => f.day))].sort();

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), source: "matches mirror (all fixtures)", count: fixtures.length, days, fixtures },
      null,
      2,
    ) + "\n",
  );
  console.log(`Wrote ${fixtures.length} fixture(s) across ${days.length} day(s) → ${path.relative(process.cwd(), OUT)}`);
  for (const d of days) {
    const fs_ = fixtures.filter((f) => f.day === d);
    const ft = fs_.filter((f) => f.settled).length;
    console.log(`  ${d}  ${fs_.length} game(s)${ft ? ` · ${ft} settled` : ""}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
