/**
 * Render the NickAI OG cover template (`nickai-og-cover`) to a 1200x630 PNG.
 *
 * Usage:
 *   bun scripts/render-og-cover.ts --theme <light|dark> \
 *     --headline "..." --subhead "..." --out <path.png>
 *
 * --headline / --subhead default to the reference getnick.ai/og.png text when
 * omitted. --theme defaults to "light", --out to out/cover-<theme>.png.
 *
 * Follows the generate-swarm-cards / render-nickai-social render path:
 * bundle → mirror public/ into the bundle root → selectComposition →
 * renderStill. Uses renderStill (output), NOT renderMedia (outputLocation).
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { enableTailwind } from "@remotion/tailwind-v4";
import { renderStill, selectComposition } from "@remotion/renderer";
import {
  nickaiOgCoverDefaultProps,
  type NickaiOgCoverProps,
  type NickaiOgCoverTheme,
} from "../remotion/compositions/nickai-og-cover/props";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const COMPOSITION_ID = "nickai-og-cover";

function parseFlags(argv: string[]) {
  const flags = {
    theme: "light" as NickaiOgCoverTheme,
    headline: nickaiOgCoverDefaultProps.headline,
    out: "",
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--theme") {
      const v = argv[++i];
      if (v !== "light" && v !== "dark") {
        console.error(`--theme must be "light" or "dark" (got "${v}").`);
        process.exit(1);
      }
      flags.theme = v;
    } else if (argv[i] === "--headline") flags.headline = argv[++i] ?? flags.headline;
    else if (argv[i] === "--out") flags.out = argv[++i] ?? "";
  }
  if (!flags.out) flags.out = `out/cover-${flags.theme}.png`;
  return flags;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const props: NickaiOgCoverProps = {
    theme: flags.theme,
    headline: flags.headline,
  };

  fs.mkdirSync(path.dirname(path.resolve(flags.out)), { recursive: true });

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  // Mirror public/ into the bundle so staticFile() asset paths resolve headlessly.
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: props,
  });

  await renderStill({
    composition,
    serveUrl,
    output: path.resolve(flags.out),
    inputProps: props,
    frame: 0,
    imageFormat: "png",
  });

  console.log(
    `✓ ${flags.out}  (${composition.width}×${composition.height}, theme=${flags.theme})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
