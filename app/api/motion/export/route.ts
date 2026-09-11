import { validSocialStory } from "@/remotion/compositions/nickai-social-story/props";
import { randomUUID } from "node:crypto";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { getMotionEntryMeta } from "@/remotion/manifest";
import { TEMPLATES } from "@/remotion/compositions/workflow-template-card/data/templates.generated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Shared-secret gate. Rendering is minutes of CPU per call, so on any
 * internet-facing deployment this endpoint is a free resource-exhaustion
 * button. When MOTION_RENDER_KEY is set the caller must send it as
 * `x-render-key`; when it is unset (local dev) the check is skipped.
 */
const renderKeyRejection = (request: Request): Response | null => {
  const expected = process.env.MOTION_RENDER_KEY;
  if (!expected) return null;
  if (request.headers.get("x-render-key") === expected) return null;
  return Response.json({ error: "Unauthorized." }, { status: 401 });
};


/**
 * `workflow-template-card` needs a whole TemplateGraph (nodes, edges, prompt),
 * not a slug. Callers should not have to ship a 200-line graph over the wire
 * when this repo already owns the registry, so accept `templateSlug` and
 * resolve it here.
 */
const withResolvedTemplate = (
  id: string,
  inputProps: Record<string, unknown>,
  templateSlug: unknown,
): Record<string, unknown> | { error: string } => {
  if (id !== "workflow-template-card" || typeof templateSlug !== "string") {
    return inputProps;
  }
  const template = TEMPLATES[templateSlug];
  if (!template) {
    return { error: `Unknown template slug "${templateSlug}".` };
  }
  return { ...inputProps, template };
};

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
  const rejected = renderKeyRejection(request);
  if (rejected) return rejected;

  let tempDirectory: string | null = null;

  try {
    const body = (await request.json()) as {
      id?: unknown;
      inputProps?: unknown;
      templateSlug?: unknown;
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

    if (body.id === "nickai-social-story" && !validSocialStory(body.inputProps)) {
      return Response.json({ error: "A complete, valid video storyboard is required." }, { status: 400 });
    }
    if (body.id === "nickai-trading-desk" && !validTradingDesk(body.inputProps)) {
      return Response.json({ error: "A complete, valid trading-desk storyboard is required." }, { status: 400 });
    }

    const resolved = withResolvedTemplate(
      body.id,
      body.inputProps as Record<string, unknown>,
      body.templateSlug,
    );
    if ("error" in resolved && typeof resolved.error === "string") {
      return Response.json({ error: resolved.error }, { status: 400 });
    }
    const inputProps = resolved as Record<string, unknown>;
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
      imageFormat: "png",
      pixelFormat: "yuv420p",
      crf: body.id === "nickai-social-story" || body.id === "nickai-trading-desk" ? 18 : 14,
      x264Preset: body.id === "nickai-social-story" || body.id === "nickai-trading-desk" ? "fast" : "slow",
      colorSpace: "bt709",
      outputLocation,
      inputProps,
      // These compositions are intentionally silent; avoid an empty AAC track.
      muted:
        body.id === "launch-video-pr91" ||
        body.id === "nick-intro" ||
        body.id === "nick-outro",
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
import { validTradingDesk } from "@/remotion/compositions/nickai-trading-desk/props";
