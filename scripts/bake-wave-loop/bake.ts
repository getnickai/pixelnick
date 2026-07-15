/**
 * Bake the nicksitev2 hero silk shader into looping MP4s for the social card.
 *
 *   bun scripts/bake-wave-loop/bake.ts [--theme dark|light|both] [--seconds 5]
 *
 * Outputs (VP9 + alpha — PNG frames are keyed; MP4 would flatten to black):
 *   public/nickai-social/wave-loop-dark.webm
 *   public/nickai-social/wave-loop-light.webm
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import puppeteer from "puppeteer-core";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

const ROOT = path.join(import.meta.dir, "../..");
const BAKE_DIR = import.meta.dir;
const OUT_DIR = path.join(ROOT, "public/nickai-social");
const FRAMES_ROOT = path.join(ROOT, "out/wave-loop-frames");
const NICKSITE_BRAND = "/Users/badi/nicksitev2/public/brand";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const FPS = 30;
const SPEED_MULT = 2.5;

type Theme = "dark" | "light";

function parseFlags(argv: string[]) {
  let theme: "dark" | "light" | "both" = "both";
  let seconds = 5;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--theme") theme = (argv[++i] as typeof theme) ?? "both";
    else if (argv[i] === "--seconds") seconds = Number(argv[++i] ?? seconds);
  }
  return { theme, seconds };
}

function run(cmd: string, args: string[]) {
  const res = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (res.status !== 0) throw new Error(`${cmd} failed (${res.status})`);
}

function bundle() {
  console.log("Bundling bake entry…");
  run("bunx", [
    "esbuild",
    path.join(BAKE_DIR, "entry.ts"),
    "--bundle",
    "--outfile=" + path.join(BAKE_DIR, "bake.bundle.js"),
    "--format=iife",
    "--platform=browser",
    "--target=chrome120",
  ]);
}

function serve(dir: string, brandDir: string): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      let filePath: string;
      if (url.pathname.startsWith("/brand/")) {
        filePath = path.join(brandDir, url.pathname.slice("/brand/".length));
      } else if (url.pathname === "/" || url.pathname === "/index.html") {
        filePath = path.join(dir, "index.html");
      } else {
        filePath = path.join(dir, url.pathname.replace(/^\//, ""));
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(filePath);
      const type =
        ext === ".html"
          ? "text/html"
          : ext === ".js"
            ? "text/javascript"
            : ext === ".avif"
              ? "image/avif"
              : ext === ".png"
                ? "image/png"
                : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      resolve({ port: addr.port, close: () => server.close() });
    });
  });
}

async function bakeTheme(theme: Theme, seconds: number, port: number) {
  const frames = Math.round(seconds * FPS);
  const frameDir = path.join(FRAMES_ROOT, theme);
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });

  console.log(`\nBaking ${theme}: ${frames} frames @ ${FPS}fps (${seconds}s)…`);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"],
    defaultViewport: { width: 1400, height: 1000, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => Boolean((window as unknown as { __waveBake?: unknown }).__waveBake));
    await page.evaluate(async (t) => {
      const bake = (window as unknown as { __waveBake: {
        setTheme(m: string): void;
        ready: Promise<void>;
      } }).__waveBake;
      bake.setTheme(t);
      await bake.ready;
    }, theme);

    for (let i = 0; i < frames; i++) {
      const elapsedMs = (i / FPS) * 1000 * SPEED_MULT;
      const b64 = await page.evaluate(async (t) => {
        const bake = (window as unknown as { __waveBake: {
          setTime(ms: number): void;
          canvas: HTMLCanvasElement;
        } }).__waveBake;
        bake.setTime(t);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return bake.canvas.toDataURL("image/png").slice("data:image/png;base64,".length);
      }, elapsedMs);
      fs.writeFileSync(
        path.join(frameDir, `f${String(i).padStart(4, "0")}.png`),
        Buffer.from(b64, "base64"),
      );
      if (i % 30 === 0 || i === frames - 1) process.stdout.write(`  frame ${i + 1}/${frames}\n`);
    }
  } finally {
    await browser.close();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const webm = path.join(OUT_DIR, `wave-loop-${theme}.webm`);
  console.log(`Encoding ${path.relative(ROOT, webm)} (VP9 + alpha)…`);
  // Shader buffer is odd-width — scale to even 1284×900 (social-card wave size).
  // Keep alpha: H.264/yuv420p flattens transparent plate to black and breaks
  // light-theme compositing (screen-on-light washes the silk out).
  run(ffmpegPath.path, [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(frameDir, "f%04d.png"),
    "-vf",
    "scale=1284:900",
    "-c:v",
    "libvpx-vp9",
    "-pix_fmt",
    "yuva420p",
    "-auto-alt-ref",
    "0",
    "-b:v",
    "0",
    "-crf",
    "28",
    webm,
  ]);

  fs.copyFileSync(path.join(frameDir, "f0000.png"), path.join(OUT_DIR, `wave-loop-${theme}-preview.png`));
  fs.rmSync(frameDir, { recursive: true, force: true });
  console.log(`  ✓ ${path.relative(ROOT, webm)}`);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);
  if (!fs.existsSync(path.join(NICKSITE_BRAND, "hero-palette-dark2.avif"))) {
    throw new Error(`Missing palettes under ${NICKSITE_BRAND}`);
  }

  bundle();
  const { port, close } = await serve(BAKE_DIR, NICKSITE_BRAND);
  console.log(`Bake server on http://127.0.0.1:${port}`);

  try {
    const themes: Theme[] = flags.theme === "both" ? ["dark", "light"] : [flags.theme];
    for (const t of themes) await bakeTheme(t, flags.seconds, port);
  } finally {
    close();
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
