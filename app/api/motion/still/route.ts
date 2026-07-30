import { randomUUID } from "node:crypto";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { getMotionEntryMeta } from "@/remotion/manifest";

/**
 * Server-side STILL export, the sibling of ../export (which returns mp4).
 *
 * Why this exists: the `/static` gallery rasterises cards in the browser with
 * html-to-image, which is fine for a human clicking download but unusable from
 * another service. This renders any composition in the motion manifest to a PNG
 * with Remotion, so an automated consumer (the organic content engine picking a
 * blog cover) can ask for the exact same artwork the design kit shows.
 *
 * `nickai-og-cover` is the intended default caller: it is declared with
 * durationInFrames = 1, i.e. already a still at 1200x630.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_PROPS_BYTES = 1_000_000;

const createServeUrl = async (outDir: string) => {
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    outDir,
    webpackOverride: (config) => enableTailwind(config),
  });

  await cp(path.join(process.cwd(), "public"), serveUrl, { recursive: true });

  return serveUrl;
};

export async function POST(request: Request) {
  let tempDirectory: string | null = null;

  try {
    const body = (await request.json()) as {
      id?: unknown;
      inputProps?: unknown;
      frame?: unknown;
    };

    if (typeof body.id !== "string" || !getMotionEntryMeta(body.id)) {
      return Response.json(
        { error: "Unknown motion composition." },
        { status: 400 },
      );
    }

    if (
      body.inputProps === null ||
      typeof body.inputProps !== "object" ||
      Array.isArray(body.inputProps)
    ) {
      return Response.json(
        { error: "Motion input props must be an object." },
        { status: 400 },
      );
    }

    if (JSON.stringify(body.inputProps).length > MAX_INPUT_PROPS_BYTES) {
      return Response.json(
        { error: "Motion input props are too large to export." },
        { status: 413 },
      );
    }

    const inputProps = body.inputProps as Record<string, unknown>;
    tempDirectory = await mkdtemp(path.join(tmpdir(), "pixelnick-still-export-"));
    const serveUrl = await createServeUrl(
      path.join(tempDirectory, "remotion-bundle"),
    );
    const composition = await selectComposition({
      serveUrl,
      id: body.id,
      inputProps,
    });

    // Animated compositions settle at the end, so default to the last frame
    // rather than frame 0 (which is mid-entrance for most of them).
    const lastFrame = Math.max(0, composition.durationInFrames - 1);
    const frame =
      typeof body.frame === "number" && Number.isFinite(body.frame)
        ? Math.min(Math.max(0, Math.trunc(body.frame)), lastFrame)
        : lastFrame;

    const outputLocation = path.join(
      tempDirectory,
      `${body.id}-${randomUUID()}.png`,
    );

    await renderStill({
      composition,
      serveUrl,
      output: outputLocation,
      imageFormat: "png",
      inputProps,
      frame,
    });

    const png = await readFile(outputLocation);

    return new Response(new Uint8Array(png), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${body.id}.png"`,
        "Content-Length": String(png.byteLength),
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Still export failed", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The still image could not be rendered.",
      },
      { status: 500 },
    );
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
    }
  }
}
