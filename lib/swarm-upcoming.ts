/**
 * Upcoming-fixture feed for the Swarm Arena match-preview cards.
 *
 * Reads the read-only Swarm Arena Supabase mirror (matches + elo_ratings) and
 * returns one match-preview record per upcoming World Cup fixture. Shared by
 * the /api/swarm-upcoming route (live render in the browser gallery). Mirrors
 * the swarm-arena app's fetchLiveMatches() (lib/supabase-server.ts).
 *
 * Records carry only data that is REAL and FRESH: teams, kickoff, venue, and
 * Elo-model win probabilities. There is no per-fixture agent council feed yet
 * (see STA-405), so the preview card shows Elo only rather than stale
 * placeholder picks.
 *
 * Server-side only (uses the read-only mirror credential from env). Never
 * imported into a client bundle. Connection: SWARM_DB_URL (see swarm-arena
 * docs/data-access.md).
 */
import { Pool } from "pg";

let _pool: Pool | null = null;
function pool(): Pool {
  if (!_pool) {
    if (!process.env.SWARM_DB_URL) {
      throw new Error(
        "SWARM_DB_URL is not set (read-only Swarm Arena mirror). See swarm-arena docs/data-access.md.",
      );
    }
    _pool = new Pool({
      connectionString: process.env.SWARM_DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      statement_timeout: 8_000,
    });
  }
  return _pool;
}

// Full team name → ISO-ish code (matches the card engine's TEAM_MARKS keys and
// the swarm-arena CODE map). Anything unmapped falls back to a 3-letter slice +
// the engine's neutral crest.
const CODE: Record<string, string> = {
  Mexico: "MX", "South Africa": "ZA", "South Korea": "KR", "Czech Republic": "CZ",
  Canada: "CA", "Bosnia-Herzegovina": "BA", "Bosnia & Herzegovina": "BA",
  USA: "US", "United States": "US",
  Paraguay: "PY", Qatar: "QA", Switzerland: "CH", Brazil: "BR", France: "FR",
  Argentina: "AR", England: "GB", Spain: "ES", Germany: "DE", Portugal: "PT",
  Netherlands: "NL", Belgium: "BE", Croatia: "HR", Morocco: "MA", Japan: "JP",
  Uruguay: "UY", Colombia: "CO", Senegal: "SN", Denmark: "DK", Australia: "AU",
  Ecuador: "EC", Ghana: "GH", Norway: "NO", Iran: "IR", "New Zealand": "NZ",
  "Saudi Arabia": "SA", "Cape Verde": "CV", Iraq: "IQ", Algeria: "DZ", Jordan: "JO",
  Austria: "AT", Uzbekistan: "UZ", "Congo DR": "CD", Panama: "PA", Haiti: "HT",
  Scotland: "GB-SCT", Tunisia: "TN", Sweden: "SE", Turkey: "TR", Turkiye: "TR",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "Curaçao": "CW", Curacao: "CW",
  Egypt: "EG", "DR Congo": "CD", Poland: "PL", Bahrain: "BH",
};
function codeFor(team: string): string {
  return CODE[team] ?? team.slice(0, 3).toUpperCase();
}

// elo_ratings keys teams by ISO-ish code; England is "EN" there, not "GB".
function eloCodeFor(team: string): string {
  switch (team) {
    case "England": return "EN";
    case "Wales": return "WA";
    case "Northern Ireland": return "NI";
  }
  const c = codeFor(team);
  if (c === "GB") return "EN";
  return c;
}
// The dataset's "SC" is Seychelles, not Scotland — curate the few it mismaps.
const ELO_OVERRIDE: Record<string, number> = { Scotland: 1680 };
function lookupElo(team: string, eloByCode: Map<string, number>): number | null {
  if (team in ELO_OVERRIDE) return ELO_OVERRIDE[team];
  return eloByCode.get(eloCodeFor(team).toUpperCase()) ?? null;
}

// Elo → 3-way probabilities. Neutral-site (no home advantage) for WC fixtures.
function eloProbs(homeElo: number | null, awayElo: number | null) {
  if (homeElo == null || awayElo == null) {
    return { homePct: 0, drawPct: 0, awayPct: 0, hasElo: false };
  }
  const d = homeElo - awayElo;
  const e = 1 / (1 + Math.pow(10, -d / 400));
  const drawPct = 0.28 * (1 - Math.abs(2 * e - 1));
  const homePct = e * (1 - drawPct);
  const awayPct = (1 - e) * (1 - drawPct);
  const total = homePct + drawPct + awayPct;
  return {
    homePct: Math.round((homePct / total) * 100),
    drawPct: Math.round((drawPct / total) * 100),
    awayPct: Math.round((awayPct / total) * 100),
    hasElo: true,
  };
}

// ISO-2 → flag emoji (regional indicators). Special-cases the home-nation flags.
function flagFor(code: string): string {
  if (code === "GB" || code === "EN") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (code === "GB-SCT") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (!/^[A-Z]{2}$/.test(code)) return "⚽";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)));
}

function team(name: string) {
  const code = codeFor(name);
  return { name, code, flag: flagFor(code) };
}

// "Thu, Jun 11 · 19:00 UTC" — stable display string.
function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  return `${date} · ${time} UTC`;
}

export type UpcomingGame = {
  id: string;
  preview: true;
  competition: string;
  stage: string;
  short: string;
  venue: string;
  kickoff: string;
  kickoffISO: string;
  home: { name: string; code: string; flag: string };
  away: { name: string; code: string; flag: string };
  odds: { homePct: number; drawPct: number; awayPct: number; hasElo: boolean };
  elo: { home: number | null; away: number | null };
};

export type UpcomingFeed = { generatedAt: string; source: string; games: UpcomingGame[] };

/** Next N upcoming WC fixtures with Elo-derived win probabilities. */
export async function buildUpcoming(opts: { limit?: number } = {}): Promise<UpcomingFeed> {
  const limit = opts.limit ?? 10;
  const p = pool();

  const eloRows = await p.query(
    `SELECT DISTINCT ON (team) team, rating FROM elo_ratings ORDER BY team, scraped_at DESC`,
  );
  const eloByCode = new Map<string, number>();
  for (const e of eloRows.rows) eloByCode.set(String(e.team).toUpperCase(), Math.round(Number(e.rating)));

  const { rows } = await p.query(
    `SELECT match_uid, home_team, away_team, scheduled_at, venue
     FROM matches
     WHERE scheduled_at >= now() - interval '1 day'
     ORDER BY scheduled_at ASC
     LIMIT $1`,
    [limit],
  );

  const games: UpcomingGame[] = rows.map((r) => {
    const eloHome = lookupElo(r.home_team, eloByCode);
    const eloAway = lookupElo(r.away_team, eloByCode);
    const prob = eloProbs(eloHome, eloAway);
    const kickoffISO = new Date(r.scheduled_at).toISOString();
    return {
      id: r.match_uid,
      preview: true,
      competition: "FIFA World Cup 2026",
      stage: "Group Stage",
      short: "WC26",
      venue: r.venue ?? "TBD",
      kickoff: fmtKickoff(kickoffISO),
      kickoffISO,
      home: team(r.home_team),
      away: team(r.away_team),
      odds: { homePct: prob.homePct, drawPct: prob.drawPct, awayPct: prob.awayPct, hasElo: prob.hasElo },
      elo: { home: eloHome, away: eloAway },
    };
  });

  return { generatedAt: new Date().toISOString(), source: "swarm-arena mirror (matches + elo_ratings)", games };
}
