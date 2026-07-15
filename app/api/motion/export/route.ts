import { randomUUID } from "node:crypto";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { getMotionEntryMeta } from "@/remotion/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_PROPS_BYTES = 1_000_000;

const createServeUrl = async (outDir: string) => {
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    outDir,
    webpackOverride: (config) => enableTailwind(config),
  });

  await cp(path.join(process.cwd(), "public"), serveUrl, {
    recursive: true,
  });

  return serveUrl;
};

export async function POST(request: Request) {
  let tempDirectory: string | null = null;

  try {
    const body = (await request.json()) as {
      id?: unknown;
      inputProps?: unknown;
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
    tempDirectory = await mkdtemp(
      path.join(tmpdir(), "pixelnick-motion-export-"),
    );
    const serveUrl = await createServeUrl(
      path.join(tempDirectory, "remotion-bundle"),
    );
    const composition = await selectComposition({
      serveUrl,
      id: body.id,
      inputProps,
    });

    const outputLocation = path.join(
      tempDirectory,
      `${body.id}-${randomUUID()}.mp4`,
    );

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps,
      // Product Cut is intentionally silent; avoid muxing an empty AAC track.
      muted: body.id === "launch-video-pr91",
      concurrency: 1,
    });

    const video = await readFile(outputLocation);

    return new Response(new Uint8Array(video), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${body.id}.mp4"`,
        "Content-Length": String(video.byteLength),
        "Content-Type": "video/mp4",
      },
    });
  } catch (error) {
    console.error("Motion export failed", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The motion video could not be rendered.",
      },
      { status: 500 },
    );
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
    }
  }
}
