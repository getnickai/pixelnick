import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PortfolioCardView } from "../chat-cards/portfolio-card-view";
import { PriceCardView } from "../chat-cards/price-card-view";
import { TradeConfirmationCardView } from "../chat-cards/trade-confirmation-card-view";
import {
  SAMPLE_PORTFOLIO,
  SAMPLE_PRICE_SPACEX,
  SAMPLE_TRADE_AAPL,
} from "../chat-cards/props";
import { fitCamera, WorkflowGraph } from "../nick-launch-video/graph";
import {
  GRID_WORKFLOWS,
  GRID_WORKFLOWS_2,
  wfName,
} from "../nick-launch-video/props";
import type { LaunchVideoProductCutProps } from "./props";
import { FAST_FADE_EASE, OUTRO_EASE, POP_EASE, progress } from "./motion";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";

const CANVAS = "#09090b";
const MANROPE = "Manrope, ui-sans-serif, system-ui, sans-serif";
const DUPLET =
  'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif';
const BENTO_SETTLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const WORKFLOW_TILE_WIDTH = 400;
const WORKFLOW_TILE_HEIGHT = 240;
const BENTO_RADIUS = 24;
const BENTO_BORDER = "#2b2b31";
const BENTO_SURFACE = "#18181b";
const BENTO_SHELL_STYLE = {
  borderRadius: BENTO_RADIUS,
  border: `1px solid ${BENTO_BORDER}`,
  backgroundColor: BENTO_SURFACE,
} as const;

const VENUES: Array<{ file?: string; name?: string }> = [
  { file: "coinbase.svg" },
  { file: "hyperliquid.svg" },
  { file: "okx.svg" },
  { file: "revolut.svg", name: "Revolut" },
  { file: "alpaca.svg", name: "Alpaca" },
  { name: "Polymarket" },
  { file: "kalshi.svg" },
  { file: "tradexyz.svg" },
];

const VenuesBand: React.FC<{
  frame: number;
  timing: (typeof LAUNCH_VIDEO_TIMELINE.finale)["venues"];
}> = ({ frame, timing }) => {
  const titleReveal = progress(
    frame,
    timing.start,
    timing.duration,
    BENTO_SETTLE_EASE,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 62,
      }}
    >
      <span
        style={{
          color: "rgba(255,255,255,0.62)",
          fontFamily: MANROPE,
          fontSize: 43,
          fontWeight: 500,
          letterSpacing: -1.35,
          opacity: titleReveal,
          filter: `blur(${(1 - titleReveal) * 4}px)`,
          transform: `translateY(${(1 - titleReveal) * 14}px)`,
        }}
      >
        Nick trades on the venues you already use
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 190px)",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 112,
          rowGap: 64,
        }}
      >
        {VENUES.map((venue, index) => {
          const reveal = progress(
            frame,
            timing.logos.start + index * timing.logos.stagger,
            timing.logos.duration,
            BENTO_SETTLE_EASE,
          );

          return (
            <div
              key={`${venue.file ?? venue.name}-${index}`}
              style={{
                width: 190,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 11,
                opacity: reveal,
                filter: `blur(${(1 - reveal) * 4}px)`,
                transform: `translateY(${(1 - reveal) * 16}px) scale(${0.92 + reveal * 0.08})`,
              }}
            >
              {venue.file ? (
                <Img
                  src={staticFile(`brand/exchanges/${venue.file}`)}
                  style={{
                    width: venue.name ? 44 : 160,
                    height: 48,
                    objectFit: "contain",
                    filter: "invert(1)",
                    opacity: 0.92,
                  }}
                />
              ) : null}
              {venue.name ? (
                <span
                  style={{
                    color: "#fff",
                    fontFamily: MANROPE,
                    fontSize: 27,
                    fontWeight: 650,
                    opacity: 0.92,
                    whiteSpace: "nowrap",
                  }}
                >
                  {venue.name}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WorkflowTile: React.FC<{
  workflow: (typeof GRID_WORKFLOWS)[number];
  x: number;
  y: number;
  reveal: number;
}> = ({ workflow, x, y, reveal }) => {
  const width = WORKFLOW_TILE_WIDTH;
  const height = WORKFLOW_TILE_HEIGHT;
  const graphHeight = height - 54;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        overflow: "hidden",
        border: `1px solid ${BENTO_BORDER}`,
        borderRadius: BENTO_RADIUS,
        backgroundColor: BENTO_SURFACE,
        boxShadow: "0 30px 70px -40px rgba(0,0,0,0.8)",
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 20}px) scale(${0.95 + reveal * 0.05})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          right: 10,
          height: graphHeight,
          filter: "brightness(1.7) saturate(1.45) contrast(1.08)",
        }}
      >
        <WorkflowGraph
          template={workflow.template}
          vw={width - 20}
          vh={graphHeight}
          cw={3600}
          ch={1700}
          camera={fitCamera(width - 20, graphHeight, 3600, 1700)}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          left: 12,
          overflow: "hidden",
          color: "#fff",
          fontFamily: MANROPE,
          fontSize: 19,
          fontWeight: 600,
          textAlign: "center",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {wfName(workflow)}
      </div>
    </div>
  );
};

export const ProductCutFinaleSequence: React.FC<
  LaunchVideoProductCutProps
> = ({ ctaHeadline, ctaUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { grid, soften, venues, statement, logo, cta, url, outro } =
    LAUNCH_VIDEO_TIMELINE.finale;

  const workflowWidth = WORKFLOW_TILE_WIDTH;
  const workflowGap = 22;
  const workflowRowWidth = workflowWidth * 4 + workflowGap * 3;
  const workflowStartX = (1920 - workflowRowWidth) / 2;
  const workflowX = (index: number) =>
    workflowStartX + index * (workflowWidth + workflowGap);
  const workflowTopY = 78;
  const workflowBottomY = 839;
  const middleRowTop = workflowTopY + WORKFLOW_TILE_HEIGHT + workflowGap;
  const middleRowHeight = workflowBottomY - middleRowTop - workflowGap;
  const middleRowCenterY = middleRowTop + middleRowHeight / 2;
  const middleSideWidth = workflowWidth;
  const middleCenterWidth = workflowWidth * 2 + workflowGap;
  const middleLeftCenterX = workflowStartX + middleSideWidth / 2;
  const middleRightCenterX = 1920 - middleLeftCenterX;

  const settled = progress(frame, 2, 26, BENTO_SETTLE_EASE);
  const aaplCenterY = interpolate(settled, [0, 1], [630, middleRowCenterY]);
  const aaplWidth = interpolate(settled, [0, 1], [560, middleCenterWidth]);
  const aaplHeight = interpolate(settled, [0, 1], [284, middleRowHeight]);
  const softenProgress = progress(
    frame,
    soften.start,
    soften.duration,
    FAST_FADE_EASE,
  );
  const arrangementFade = progress(
    frame,
    soften.start + soften.duration,
    14,
    FAST_FADE_EASE,
  );
  const statementIn = progress(
    frame,
    statement.start,
    statement.duration,
    POP_EASE,
  );
  const statementOut = progress(
    frame,
    logo.start - 24,
    14,
    FAST_FADE_EASE,
  );
  const markReveal = progress(
    frame,
    logo.start,
    9,
    Easing.out(Easing.cubic),
  );
  const wordmarkReveal = progress(
    frame,
    logo.start + 9,
    14,
    Easing.out(Easing.cubic),
  );
  const logoSpring = spring({
    frame: Math.max(0, frame - logo.start),
    fps,
    durationInFrames: logo.duration,
    config: { damping: 24, stiffness: 130, mass: 0.9 },
  });
  const urlIn = progress(frame, url.start, url.duration, POP_EASE);
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const bandOut = progress(
    frame,
    venues.outro.start,
    venues.outro.duration,
    FAST_FADE_EASE,
  );
  const ctaWords = ctaHeadline.split(" ");

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: CANVAS,
        fontFamily: MANROPE,
        opacity: 1 - exit,
        transform: `translateY(${exit * 24}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: (1 - arrangementFade) * (1 - softenProgress * 0.45),
          filter: `saturate(${1 - softenProgress * 0.4}) brightness(${1 - softenProgress * 0.18})`,
        }}
      >
        {GRID_WORKFLOWS.map((workflow, index) => {
          const reveal = progress(
            frame,
            grid.start + index * grid.stagger,
            grid.duration,
            POP_EASE,
          );
          return (
            <WorkflowTile
              key={`top-${wfName(workflow)}`}
              workflow={workflow}
              x={workflowX(index)}
              y={workflowTopY}
              reveal={reveal}
            />
          );
        })}
        {GRID_WORKFLOWS_2.map((workflow, index) => {
          const reveal = progress(
            frame,
            grid.start + (index + 4) * grid.stagger,
            grid.duration,
            POP_EASE,
          );
          return (
            <WorkflowTile
              key={`bottom-${wfName(workflow)}`}
              workflow={workflow}
              x={workflowX(index)}
              y={workflowBottomY}
              reveal={reveal}
            />
          );
        })}

        <div
          style={{
            position: "absolute",
            left: middleLeftCenterX,
            top: middleRowCenterY,
            width: middleSideWidth,
            height: middleRowHeight,
            opacity: progress(
              frame,
              grid.start + 8 * grid.stagger,
              grid.duration,
              POP_EASE,
            ),
            transform: "translate(-50%, -50%)",
          }}
        >
          <PortfolioCardView
            data={SAMPLE_PORTFOLIO}
            width={middleSideWidth}
            anim={1}
            shellStyle={BENTO_SHELL_STYLE}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: middleRightCenterX,
            top: middleRowCenterY,
            width: middleSideWidth,
            height: middleRowHeight,
            opacity: progress(
              frame,
              grid.start + 9 * grid.stagger,
              grid.duration,
              POP_EASE,
            ),
            transform: "translate(-50%, -50%)",
          }}
        >
          <PriceCardView
            data={SAMPLE_PRICE_SPACEX}
            width={middleSideWidth}
            anim={1}
            shellStyle={BENTO_SHELL_STYLE}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: aaplCenterY,
            zIndex: 4,
            width: aaplWidth,
            height: aaplHeight,
            transform: "translate(-50%, -50%)",
          }}
        >
          <TradeConfirmationCardView
            data={SAMPLE_TRADE_AAPL}
            width={aaplWidth}
            anim={1}
            shellStyle={BENTO_SHELL_STYLE}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - bandOut,
          filter: `blur(${bandOut * 4}px)`,
          transform: `translateY(${-bandOut * 18}px)`,
        }}
      >
        <VenuesBand frame={frame} timing={venues} />
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 120,
          left: 120,
          color: "#fafafa",
          fontFamily: DUPLET,
          fontSize: 62,
          fontWeight: 500,
          lineHeight: 1.28,
          letterSpacing: 0.3,
          textAlign: "center",
          opacity: statementIn * (1 - statementOut),
          filter: `blur(${(1 - statementIn) * 5}px)`,
          transform: `translateY(calc(-50% + ${(1 - statementIn) * 26}px))`,
        }}
      >
        Describe any strategy you want,
        <br />
        Nick builds, tests and runs it for you
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 760,
          height: 230,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(1,120,255,0.16) 0%, rgba(1,120,255,0.055) 44%, transparent 72%)",
          opacity: markReveal * 0.72 + wordmarkReveal * 0.28,
          filter: "blur(22px)",
          transform: `translate(-50%, -50%) scale(${0.82 + wordmarkReveal * 0.18})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          display: "flex",
          alignItems: "center",
          gap: 28,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 104,
            height: 104,
            overflow: "hidden",
            opacity: markReveal,
            filter: `blur(${(1 - markReveal) * 5}px)`,
            transform: `scale(${0.78 + logoSpring * 0.22})`,
          }}
        >
          <Img
            src={staticFile("figma/logo.svg")}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 497.36,
              height: 104,
              maxWidth: "none",
            }}
          />
        </div>
        <div
          style={{
            position: "relative",
            width: 350,
            height: 104,
            overflow: "hidden",
            opacity: wordmarkReveal,
            clipPath: `inset(0 ${100 - wordmarkReveal * 100}% 0 0)`,
            filter: `blur(${(1 - wordmarkReveal) * 8}px)`,
            transform: `translateX(${(1 - wordmarkReveal) * -18}px)`,
          }}
        >
          <Img
            src={staticFile("figma/logo.svg")}
            style={{
              position: "absolute",
              top: 0,
              left: -148,
              width: 497.36,
              height: 104,
              maxWidth: "none",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "64%",
          right: 100,
          left: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          color: "#fafafa",
          fontFamily: DUPLET,
          fontSize: 68,
          fontWeight: 500,
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        {ctaWords.map((word, index) => {
          const wordIn = progress(
            frame,
            cta.start + index * cta.stagger,
            cta.duration,
            POP_EASE,
          );
          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: "inline-block",
                opacity: wordIn,
                filter: `blur(${(1 - wordIn) * 5}px)`,
                transform: `translateY(${(1 - wordIn) * 30}px) scale(${0.97 + wordIn * 0.03})`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: "75%",
          right: 0,
          left: 0,
          color: "#4b9cff",
          fontSize: 32,
          fontWeight: 650,
          letterSpacing: 0.4,
          textAlign: "center",
          opacity: urlIn,
          transform: `translateY(${(1 - urlIn) * 20}px)`,
        }}
      >
        {ctaUrl}
      </div>
    </AbsoluteFill>
  );
};
