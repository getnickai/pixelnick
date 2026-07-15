import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  Check,
  Clock3,
  Code,
  Cpu,
  Database,
  DollarSign,
  ChevronDown,
  Folder,
  GitBranch,
  Mail,
  Maximize2,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Plus,
  Send,
  SlidersVertical,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ArrowUp,
  Zap,
} from "lucide-react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { LaunchVideoProps } from "./props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";

const CANVAS = "#09090b";
const TILE_SIZE = 88;
const DUPLET =
  'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif';
const MANROPE = "Manrope, ui-sans-serif, system-ui, sans-serif";
const NVDA_CHART_LINE =
  "M0 147C18 115 30 123 47 122C64 121 73 106 89 126C102 141 114 91 130 75C146 59 160 96 173 122C185 143 199 139 211 140C224 82 241 78 258 58C273 43 281 0 293 42C306 72 319 58 334 63C349 70 357 86 371 88C386 90 393 78 404 91C414 105 417 47 431 59C445 67 448 95 460 83C472 73 477 105 489 98C502 93 510 128 521 111C532 96 540 104 551 86C563 67 573 105 583 96C595 84 601 80 615 89C629 102 632 127 646 132C661 137 671 111 684 117C691 120 696 115 700 116";
const NVDA_CHART_FILL = `${NVDA_CHART_LINE}L700 170L0 170Z`;
const WORKFLOW_BOARD = { width: 1600, height: 850 } as const;
const WORKFLOW_NODE_HEIGHT = 142;

type WorkflowNodeKind = "start" | "price" | "condition" | "trade";

type WorkflowNode = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  kind: WorkflowNodeKind;
  x: number;
  y: number;
  width: number;
};

const WORKFLOW_NODES: readonly WorkflowNode[] = [
  {
    id: "start",
    title: "Start",
    subtitle: "Runs every 12 hours",
    badge: "START",
    kind: "start",
    x: 330,
    y: 30,
    width: 620,
  },
  {
    id: "price",
    title: "NVDA Price",
    subtitle: "Fetches the latest NVDA price",
    badge: "PRICE-DATA",
    kind: "price",
    x: 80,
    y: 360,
    width: 620,
  },
  {
    id: "condition",
    title: "Below $200?",
    subtitle: "price < 200",
    badge: "CONDITION",
    kind: "condition",
    x: 1010,
    y: 360,
    width: 520,
  },
  {
    id: "trade",
    title: "Buy $50 NVDA",
    subtitle: "Use the paper trading wallet",
    badge: "PAPER TRADE",
    kind: "trade",
    x: 480,
    y: 675,
    width: 660,
  },
] as const;

const [startNode, priceNode, conditionNode, tradeNode] = WORKFLOW_NODES;
const WORKFLOW_CONNECTORS = [
  {
    id: "start-to-price",
    path: [
      `M ${startNode.x + startNode.width / 2} ${startNode.y + WORKFLOW_NODE_HEIGHT}`,
      `C ${startNode.x + startNode.width / 2} ${startNode.y + WORKFLOW_NODE_HEIGHT + 92}`,
      `${priceNode.x + priceNode.width / 2} ${priceNode.y - 92}`,
      `${priceNode.x + priceNode.width / 2} ${priceNode.y}`,
    ].join(" "),
  },
  {
    id: "price-to-condition",
    path: [
      `M ${priceNode.x + priceNode.width} ${priceNode.y + WORKFLOW_NODE_HEIGHT / 2}`,
      `L ${conditionNode.x} ${conditionNode.y + WORKFLOW_NODE_HEIGHT / 2}`,
    ].join(" "),
  },
  {
    id: "condition-to-trade",
    path: [
      `M ${conditionNode.x + conditionNode.width / 2} ${conditionNode.y + WORKFLOW_NODE_HEIGHT}`,
      `C ${conditionNode.x + conditionNode.width / 2} ${conditionNode.y + WORKFLOW_NODE_HEIGHT + 96}`,
      `${tradeNode.x + tradeNode.width * 0.74} ${tradeNode.y - 92}`,
      `${tradeNode.x + tradeNode.width * 0.74} ${tradeNode.y}`,
    ].join(" "),
  },
] as const;

const WORKFLOW_CONNECTION_ORIGINS = [
  {
    id: "start-output",
    x: startNode.x + startNode.width / 2,
    y: startNode.y + WORKFLOW_NODE_HEIGHT,
  },
  {
    id: "price-output",
    x: priceNode.x + priceNode.width,
    y: priceNode.y + WORKFLOW_NODE_HEIGHT / 2,
  },
  {
    id: "condition-output",
    x: conditionNode.x + conditionNode.width / 2,
    y: conditionNode.y + WORKFLOW_NODE_HEIGHT,
  },
] as const;

const WORKFLOW_CONNECTION_TARGETS = [
  {
    id: "price-input",
    x: priceNode.x + priceNode.width / 2,
    y: priceNode.y,
  },
  {
    id: "condition-input",
    x: conditionNode.x,
    y: conditionNode.y + WORKFLOW_NODE_HEIGHT / 2,
  },
  {
    id: "trade-input",
    x: tradeNode.x + tradeNode.width * 0.74,
    y: tradeNode.y,
  },
] as const;

const WORKFLOW_EDGE_COUNT = WORKFLOW_CONNECTORS.length;

const WORKFLOW_BADGES: Record<
  WorkflowNodeKind,
  { color: string; backgroundColor: string }
> = {
  start: {
    color: "#20d69a",
    backgroundColor: "rgba(16, 185, 129, 0.14)",
  },
  price: {
    color: "#818cf8",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
  },
  condition: {
    color: "#d4d4d8",
    backgroundColor: "rgba(161, 161, 170, 0.13)",
  },
  trade: {
    color: "#c084fc",
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
};

/**
 * Product-film curves: a quick controlled overshoot for the entrance, then
 * a sharper accelerating exit. Opacity stays separately clamped.
 */
const POP_EASE = Easing.bezier(0.18, 1.18, 0.32, 1);
const FAST_FADE_EASE = Easing.out(Easing.cubic);
const OUTRO_EASE = Easing.in(Easing.cubic);

type IconTile = {
  Icon: LucideIcon;
  x: number;
  y: number;
  rgb: string;
};

/**
 * Positions are normalized from the supplied reference frame. The final Send
 * tile deliberately clips against the right edge, matching the composition.
 */
const ICON_TILES: readonly IconTile[] = [
  { Icon: Zap, x: 10.8, y: 26.1, rgb: "1, 120, 255" },
  { Icon: Cpu, x: 28.8, y: 16.7, rgb: "139, 92, 246" },
  { Icon: Database, x: 53.2, y: 20.4, rgb: "59, 130, 246" },
  { Icon: TrendingUp, x: 75.3, y: 21.4, rgb: "6, 182, 212" },
  { Icon: Code, x: 92.4, y: 33.6, rgb: "249, 115, 22" },
  { Icon: SlidersVertical, x: 7.6, y: 50.5, rgb: "16, 185, 129" },
  { Icon: Database, x: 35.2, y: 46.8, rgb: "100, 116, 139" },
  { Icon: Send, x: 97.6, y: 59.9, rgb: "14, 165, 233" },
  { Icon: GitBranch, x: 17.1, y: 69.5, rgb: "234, 179, 8" },
  { Icon: DollarSign, x: 41.5, y: 81.6, rgb: "34, 197, 94" },
  { Icon: Mail, x: 63.8, y: 75.2, rgb: "239, 68, 68" },
  { Icon: ChartNoAxesCombined, x: 86, y: 78.8, rgb: "139, 92, 246" },
];

const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (value: number) => number,
): number => {
  if (frame <= start) return 0;
  if (frame >= start + duration) return 1;

  return interpolate(frame, [start, start + duration], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const OpeningSequence: React.FC<LaunchVideoProps> = ({
  headline,
  showBackgroundIcons,
}) => {
  const frame = useCurrentFrame();
  const { icons, headline: headlineTiming } = LAUNCH_VIDEO_TIMELINE.opening;

  const characters = Array.from(headline);
  const visibleCharacterCount = characters.filter(
    (character) => !/\s/.test(character),
  ).length;
  let visibleCharacterIndex = 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        aria-hidden
        style={{ visibility: showBackgroundIcons ? "visible" : "hidden" }}
      >
        {ICON_TILES.map(({ Icon, x, y, rgb }, index) => {
          const start = icons.start + index * icons.stagger;
          const entranceOpacity = progress(
            frame,
            start,
            icons.duration,
            FAST_FADE_EASE,
          );
          const settle = progress(
            frame,
            start,
            icons.duration,
            POP_EASE,
          );
          const exit = progress(
            frame,
            icons.outroStart + index * icons.outroStagger,
            icons.outroDuration,
            OUTRO_EASE,
          );
          const opacity = entranceOpacity * (1 - exit);
          const scale = (0.96 + settle * 0.04) * (1 - exit * 0.025);
          const translateY = (1 - settle) * 8 - exit * 5;

          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: TILE_SIZE,
                height: TILE_SIZE,
                display: "grid",
                placeItems: "center",
                borderRadius: 19,
                border: `2px solid rgba(${rgb}, 0.2)`,
                backgroundColor: `rgba(${rgb}, 0.025)`,
                boxShadow: `inset 0 0 24px rgba(${rgb}, 0.025)`,
                color: `rgba(${rgb}, 0.24)`,
                opacity,
                transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
              }}
            >
              <Icon size={36} strokeWidth={1.8} />
            </div>
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          zIndex: 1,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          role="img"
          aria-label={headline}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            maxWidth: "90%",
            whiteSpace: "nowrap",
            color: "#ffffff",
            fontFamily: DUPLET,
            fontSize: 120,
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: 0.5,
          }}
        >
          {characters.map((character, index) => {
            if (/\s/.test(character)) {
              return (
                <span
                  key={index}
                  aria-hidden
                  style={{ display: "inline-block", width: "0.3em" }}
                />
              );
            }

            // Reveal order runs from the rightmost visible glyph back to the
            // left, while every glyph itself travels left into its final spot.
            const characterIndex = visibleCharacterIndex;
            const revealIndex = visibleCharacterCount - 1 - characterIndex;
            const characterStart =
              headlineTiming.start + revealIndex * headlineTiming.stagger;
            visibleCharacterIndex += 1;

            const opacity = progress(
              frame,
              characterStart,
              headlineTiming.duration,
              FAST_FADE_EASE,
            );
            const settle = progress(
              frame,
              characterStart,
              headlineTiming.duration,
              POP_EASE,
            );
            // The outro is intentionally quicker than the intro and sweeps
            // left-to-right while each glyph accelerates off to the left.
            const exit = progress(
              frame,
              headlineTiming.outroStart +
                characterIndex * headlineTiming.outroStagger,
              headlineTiming.outroDuration,
              OUTRO_EASE,
            );

            const glyphOpacity = opacity * (1 - exit);
            const focusBlur = (1 - settle) * 2 + exit * 2.5;
            const glyphScale = 0.96 + settle * 0.04 - exit * 0.02;
            const translateX = (1 - settle) * 32 - exit * 24;

            return (
              <span
                key={index}
                aria-hidden
                style={{
                  display: "inline-block",
                  opacity: glyphOpacity,
                  filter: `blur(${focusBlur}px)`,
                  transform: `translateX(${translateX}px) scale(${glyphScale})`,
                }}
              >
                {character}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProductStatementSequence: React.FC<LaunchVideoProps> = ({
  productHeadline,
  productHeadlineAccent,
  productSubline,
}) => {
  const frame = useCurrentFrame();
  const { title, subline, outro } =
    LAUNCH_VIDEO_TIMELINE.productStatement;
  const titleSegments = [
    ...productHeadline
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => ({ text, accent: false })),
    { text: productHeadlineAccent, accent: true },
  ];
  const sublineWords = productSubline.trim().split(/\s+/).filter(Boolean);
  const sublineExit = progress(
    frame,
    outro.start + 0.6,
    outro.duration,
    OUTRO_EASE,
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
          maxWidth: "92%",
        }}
      >
        <div
          role="img"
          aria-label={`${productHeadline} ${productHeadlineAccent}`}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            whiteSpace: "nowrap",
            color: "#ffffff",
            fontFamily: DUPLET,
            fontSize: 128,
            fontWeight: 600,
            lineHeight: 0.92,
            letterSpacing: 0.5,
            columnGap: 30,
          }}
        >
          {titleSegments.map(({ text, accent }, index) => {
            const start = title.start + index * title.stagger;
            const opacity = progress(
              frame,
              start,
              title.duration,
              FAST_FADE_EASE,
            );
            const settle = progress(frame, start, title.duration, POP_EASE);
            const exit = progress(
              frame,
              outro.start + index * 0.55,
              outro.duration,
              OUTRO_EASE,
            );

            return (
              <span
                key={`${text}-${index}`}
                aria-hidden
                style={{
                  display: "inline-block",
                  color: accent ? "#0178ff" : "#ffffff",
                  opacity: opacity * (1 - exit),
                  filter: `blur(${(1 - settle) * 3 + exit * 3}px)`,
                  transform: `translateX(${(1 - settle) * 52 - exit * 42}px) scale(${0.965 + settle * 0.035 - exit * 0.015})`,
                }}
              >
                {text}
              </span>
            );
          })}
        </div>

        <div
          role="img"
          aria-label={productSubline}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            columnGap: "0.24em",
            color: "rgba(230, 235, 245, 0.64)",
            fontFamily: MANROPE,
            fontSize: 43,
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: -1.35,
            whiteSpace: "nowrap",
            opacity: 1 - sublineExit,
            filter: `blur(${sublineExit * 2.5}px)`,
            transform: `translateX(${-sublineExit * 34}px)`,
          }}
        >
          {sublineWords.map((word, index) => {
            const start = subline.start + index * subline.stagger;
            const opacity = progress(
              frame,
              start,
              subline.duration,
              FAST_FADE_EASE,
            );
            const settle = progress(frame, start, subline.duration, POP_EASE);

            return (
              <span
                key={`${word}-${index}`}
                aria-hidden
                style={{
                  display: "inline-block",
                  opacity,
                  filter: `blur(${(1 - settle) * 2.5}px)`,
                  transform: `translateY(${(1 - settle) * 26}px) scale(${0.98 + settle * 0.02})`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type ComposerTiming = {
  shell: { start: number; duration: number };
  focus: { start: number; duration: number };
  placeholder: { start: number; duration: number };
  typing: { start: number; duration: number };
  send: { start: number; duration: number };
  outro: { start: number; duration: number };
};

type ChatComposerSequenceProps = {
  prompt: string;
  timing: ComposerTiming;
  showPlaceholder?: boolean;
};

const FakeCursor: React.FC<{
  move: number;
  press: number;
  opacity: number;
  origin?: { x: number; y: number };
  target?: { x: number; y: number };
  size?: number;
}> = ({
  move,
  press,
  opacity,
  origin = { x: 680, y: 300 },
  target = { x: 1004, y: 166 },
  size = 32,
}) => {
  // Coordinates are relative to the composer shell. The send control sits
  // in the compact action row above the footer strip.
  const cursorSize = size;
  const cursorHotspot = (3.5 / 20) * cursorSize;
  const x = interpolate(move, [0, 1], [origin.x, target.x]);
  const y = interpolate(move, [0, 1], [origin.y, target.y]);

  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: cursorSize,
        height: cursorSize,
        overflow: "visible",
        opacity,
        zIndex: 9,
        pointerEvents: "none",
        // The supplied cursor's hot spot is its upper-left arrow tip.
        transform: `translate3d(${x - cursorHotspot}px, ${y - cursorHotspot}px, 0) scale(${1 - press * 0.12})`,
        transformOrigin: `${cursorHotspot}px ${cursorHotspot}px`,
      }}
    >
      <path
        d="M3.52832 4.03809C3.40568 3.71915 3.71916 3.40568 4.03809 3.52832L16.2471 8.22461C16.5924 8.35745 16.5814 8.8498 16.2305 8.9668L11.0195 10.7031L10.7822 10.7822L10.7031 11.0195L8.9668 16.2305C8.8498 16.5814 8.35745 16.5924 8.22461 16.2471L3.52832 4.03809Z"
        fill="black"
        stroke="white"
      />
    </svg>
  );
};

const ChatComposerSequence: React.FC<ChatComposerSequenceProps> = ({
  prompt,
  timing,
  showPlaceholder = true,
}) => {
  const frame = useCurrentFrame();
  const { shell, focus, placeholder, typing, send, outro } = timing;

  const shellOpacity = progress(
    frame,
    shell.start,
    shell.duration,
    FAST_FADE_EASE,
  );
  const shellSettle = progress(frame, shell.start, shell.duration, POP_EASE);
  const focusIn = progress(
    frame,
    focus.start,
    focus.duration,
    FAST_FADE_EASE,
  );
  const placeholderOut = progress(
    frame,
    placeholder.start,
    placeholder.duration,
    FAST_FADE_EASE,
  );
  const typingProgress = progress(
    frame,
    typing.start,
    typing.duration,
    Easing.linear,
  );
  const typedCharacterCount = Math.floor(prompt.length * typingProgress);
  const typedPrompt = prompt.slice(0, typedCharacterCount);
  const typingEnd = typing.start + typing.duration;
  const sendActive = progress(
    frame,
    send.start,
    Math.max(1, send.duration * 0.35),
    FAST_FADE_EASE,
  );
  const sendPress = interpolate(
    frame,
    [send.start + 4, send.start + 7, send.start + send.duration],
    [0, 1, 0],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const cursorMove = progress(
    frame,
    typingEnd + 1,
    10,
    Easing.out(Easing.cubic),
  );
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const clickRipple = progress(
    frame,
    send.start + 4,
    6,
    FAST_FADE_EASE,
  );
  const clickRippleOpacity =
    frame >= send.start + 4 && frame < send.start + 10
      ? (1 - clickRipple) * (1 - exit)
      : 0;
  const cursorOpacity =
    progress(frame, typingEnd, 3, FAST_FADE_EASE) * (1 - exit);
  const caretVisible =
    frame >= focus.start &&
    frame < send.start + send.duration &&
    Math.floor((frame - focus.start) / 7) % 2 === 0;
  const sendBackground = `rgb(${Math.round(24 - sendActive * 23)}, ${Math.round(24 + sendActive * 96)}, ${Math.round(27 + sendActive * 228)})`;
  const sendForeground = Math.round(113 + sendActive * 142);
  const focusBorder = focusIn * (1 - exit);
  const focusBorderColor = `rgb(${Math.round(39 - focusBorder * 38)}, ${Math.round(39 + focusBorder * 81)}, ${Math.round(42 + focusBorder * 213)})`;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 1050,
          position: "relative",
          opacity: shellOpacity * (1 - exit),
          filter: `blur(${(1 - shellSettle) * 5 + exit * 4}px)`,
          transform: `translateY(${(1 - shellSettle) * 42 + exit * 36}px) scale(${0.96 + shellSettle * 0.04 - sendPress * 0.012})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: 4,
            borderRadius: 31,
            border: "1px solid #27272a",
            backgroundColor: "#18181b",
            boxShadow:
              "0 28px 80px rgba(0, 0, 0, 0.46), 0 2px 8px rgba(0, 0, 0, 0.28)",
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 28,
              border: `3px solid ${focusBorderColor}`,
              backgroundColor: "#09090b",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.24)",
            }}
          >
            <div
              style={{
                position: "relative",
                minHeight: 132,
                padding: "27px 32px 36px",
                color: "#fafafa",
                fontFamily: MANROPE,
                fontSize: 29,
                fontWeight: 500,
                lineHeight: 1.35,
                letterSpacing: -0.45,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 32,
                  top: 27,
                  color: "#71717a",
                  opacity: showPlaceholder ? 1 - placeholderOut : 0,
                }}
              >
                What do you want to build?
              </span>
              <span>{typedPrompt}</span>
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 26,
                  marginLeft: 3,
                  verticalAlign: -4,
                  backgroundColor: "#0178ff",
                  opacity: caretVisible ? 1 : 0,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 20px 19px",
                color: "#a1a1aa",
                fontFamily: MANROPE,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  border: "1px solid #3f3f46",
                  backgroundColor: "#18181b",
                }}
              >
                <Plus size={25} strokeWidth={1.8} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "0 10px",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                Opus 4.8 <ChevronDown size={19} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Mic size={25} strokeWidth={1.8} />
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                  borderRadius: "50%",
                  color: `rgb(${sendForeground}, ${sendForeground}, ${sendForeground})`,
                  backgroundColor: sendBackground,
                  boxShadow: `inset 0 0 0 1px rgba(63, 63, 70, ${1 - sendActive})`,
                  transform: `scale(${1 - sendPress * 0.1})`,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    border: "2px solid rgba(1, 120, 255, 0.84)",
                    opacity: clickRippleOpacity,
                    transform: `scale(${1 + clickRipple * 0.9})`,
                    pointerEvents: "none",
                  }}
                />
                <ArrowUp size={25} strokeWidth={2} />
              </div>
            </div>
          </div>

          <FakeCursor
            move={cursorMove}
            press={sendPress}
            opacity={cursorOpacity}
          />

          <div
            style={{
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px 0 10px",
              color: "#a1a1aa",
              fontFamily: MANROPE,
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: 4,
                borderRadius: 25,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 15px",
                }}
              >
                <MessageCircle size={22} strokeWidth={1.8} /> Chat
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 15px",
                  borderRadius: 23,
                  color: "#4da0ff",
                  backgroundColor: "rgba(1, 120, 255, 0.16)",
                }}
              >
                <Folder size={22} strokeWidth={1.8} /> Agent
              </div>
            </div>
            <MoreHorizontal size={24} strokeWidth={1.8} />
          </div>
        </div>

      </div>
    </AbsoluteFill>
  );
};

const ChatResponseSequence: React.FC<LaunchVideoProps> = ({ chatPrompt }) => {
  const frame = useCurrentFrame();
  const {
    shell,
    userMessage,
    reasoning,
    resultCard,
    chartFill,
    chartLine,
    outro,
  } = LAUNCH_VIDEO_TIMELINE.chatResponse;

  const shellOpacity = progress(
    frame,
    shell.start,
    shell.duration,
    FAST_FADE_EASE,
  );
  const shellSettle = progress(frame, shell.start, shell.duration, POP_EASE);
  const messageOpacity = progress(
    frame,
    userMessage.start,
    userMessage.duration,
    FAST_FADE_EASE,
  );
  const messageSettle = progress(
    frame,
    userMessage.start,
    userMessage.duration,
    POP_EASE,
  );
  const reasoningOpacity = progress(
    frame,
    reasoning.start,
    reasoning.duration,
    FAST_FADE_EASE,
  );
  const reasoningSettle = progress(
    frame,
    reasoning.start,
    reasoning.duration,
    POP_EASE,
  );
  const cardOpacity = progress(
    frame,
    resultCard.start,
    resultCard.duration,
    FAST_FADE_EASE,
  );
  const cardSettle = progress(
    frame,
    resultCard.start,
    resultCard.duration,
    POP_EASE,
  );
  const fillOpacity = progress(
    frame,
    chartFill.start,
    chartFill.duration,
    FAST_FADE_EASE,
  );
  const lineDraw = progress(
    frame,
    chartLine.start,
    chartLine.duration,
    Easing.inOut(Easing.quad),
  );
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 1180,
          padding: "0 28px",
          opacity: shellOpacity * (1 - exit),
          filter: `blur(${(1 - shellSettle) * 4 + exit * 4}px)`,
          transform: `translateY(${(1 - shellSettle) * 34 + exit * 32}px) scale(${0.985 + shellSettle * 0.015})`,
        }}
      >
        <div
          style={{
            width: "100%",
            fontFamily: MANROPE,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              gap: 16,
              opacity: messageOpacity,
              filter: `blur(${(1 - messageSettle) * 2}px)`,
              transform: `translateY(${(1 - messageSettle) * 12}px) scale(${0.98 + messageSettle * 0.02})`,
              transformOrigin: "right bottom",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "17px 25px",
                borderRadius: "30px 30px 7px 30px",
                backgroundColor: "#f4f4f5",
                color: "#18181b",
                fontSize: 23,
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              {chatPrompt}
            </div>
            <div
              style={{
                width: 62,
                height: 62,
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "50%",
                border: "2px solid #262d39",
                backgroundColor: "#090d15",
              }}
            >
              <Img
                src={staticFile("launch-video/user-avatar.png")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 30,
              color: "#71717a",
              fontSize: 18,
              fontWeight: 600,
              opacity: reasoningOpacity,
              transform: `translateY(${(1 - reasoningSettle) * 8}px)`,
            }}
          >
            <Sparkles size={21} strokeWidth={1.8} color="#4da0ff" />
            <span>Reasoning</span>
            <ChevronDown
              size={18}
              strokeWidth={1.8}
              style={{ transform: "rotate(-90deg)" }}
            />
          </div>

          <div
            style={{
              marginTop: 18,
              overflow: "hidden",
              padding: "27px 30px 24px",
              borderRadius: 24,
              border: "1px solid #272f3d",
              backgroundColor: "#090e17",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              opacity: cardOpacity,
              filter: `blur(${(1 - cardSettle) * 2.5}px)`,
              transform: `translateY(${(1 - cardSettle) * 16}px) scale(${0.985 + cardSettle * 0.015})`,
            }}
          >
            <div
              style={{
                color: "#a1a1aa",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              NVDA
            </div>
            <div
              style={{
                marginTop: 4,
                color: "#ffffff",
                fontFamily: DUPLET,
                fontSize: 57,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: 0.5,
              }}
            >
              $202.56
            </div>
            <div
              style={{
                marginTop: 13,
                color: "#22c55e",
                fontSize: 21,
                fontWeight: 600,
              }}
            >
              +$18.5 (+9.13%) Today
            </div>

            <svg
              viewBox="0 0 700 170"
              preserveAspectRatio="none"
              width="100%"
              height="190"
              fill="none"
              aria-label="NVDA daily price chart"
              style={{ display: "block", marginTop: 10, overflow: "visible" }}
            >
              <defs>
                <linearGradient
                  id="launch-video-nvda-fill"
                  x1="350"
                  y1="10"
                  x2="350"
                  y2="170"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#22c55e" stopOpacity="0.24" />
                  <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
                <clipPath id="launch-video-nvda-line-reveal">
                  <rect x="0" y="0" width={700 * lineDraw} height="170" />
                </clipPath>
              </defs>
              <path
                d={NVDA_CHART_FILL}
                fill="url(#launch-video-nvda-fill)"
                opacity={fillOpacity}
              />
              <path
                d={NVDA_CHART_LINE}
                stroke="#22c55e"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath="url(#launch-video-nvda-line-reveal)"
              />
            </svg>
            <div
              style={{
                color: "#71717a",
                fontSize: 17,
                fontWeight: 500,
              }}
            >
              1d · Apr 13 – Jul 9
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WorkflowResponseSequence: React.FC<LaunchVideoProps> = ({
  workflowPrompt,
}) => {
  const frame = useCurrentFrame();
  const {
    shell,
    userMessage,
    beforeCreationSteps,
    createdWorkflow,
    afterCreationSteps,
    outro,
  } = LAUNCH_VIDEO_TIMELINE.workflowResponse;

  const shellOpacity = progress(
    frame,
    shell.start,
    shell.duration,
    FAST_FADE_EASE,
  );
  const shellSettle = progress(frame, shell.start, shell.duration, POP_EASE);
  const messageOpacity = progress(
    frame,
    userMessage.start,
    userMessage.duration,
    FAST_FADE_EASE,
  );
  const messageSettle = progress(
    frame,
    userMessage.start,
    userMessage.duration,
    POP_EASE,
  );
  const createdOpacity = progress(
    frame,
    createdWorkflow.start,
    createdWorkflow.duration,
    FAST_FADE_EASE,
  );
  const createdSettle = progress(
    frame,
    createdWorkflow.start,
    createdWorkflow.duration,
    POP_EASE,
  );
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);

  const stepStyle = (start: number, duration: number) => {
    const opacity = progress(
      frame,
      start,
      duration,
      FAST_FADE_EASE,
    );
    const settle = progress(frame, start, duration, POP_EASE);

    return {
      opacity,
      filter: `blur(${(1 - settle) * 2}px)`,
      transform: `translateY(${(1 - settle) * 10}px)`,
    };
  };

  const beforeStepStyles = [0, 1].map((index) =>
    stepStyle(
      beforeCreationSteps.start + index * beforeCreationSteps.stagger,
      beforeCreationSteps.duration,
    ),
  );
  const afterStepStyles = Array.from({ length: 6 }, (_, index) =>
    stepStyle(
      afterCreationSteps.start + index * afterCreationSteps.stagger,
      afterCreationSteps.duration,
    ),
  );

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    minHeight: 32,
    color: "#a1a1aa",
    fontSize: 18,
    fontWeight: 500,
  } as const;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 1120,
          padding: "0 24px",
          color: "#f4f4f5",
          fontFamily: MANROPE,
          opacity: shellOpacity * (1 - exit),
          filter: `blur(${(1 - shellSettle) * 4 + exit * 4}px)`,
          transform: `translateY(${(1 - shellSettle) * 34 + exit * 32}px) scale(${0.985 + shellSettle * 0.015})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            gap: 16,
            opacity: messageOpacity,
            filter: `blur(${(1 - messageSettle) * 2}px)`,
            transform: `translateY(${(1 - messageSettle) * 12}px) scale(${0.98 + messageSettle * 0.02})`,
            transformOrigin: "right bottom",
          }}
        >
          <div
            style={{
              maxWidth: "88%",
              padding: "16px 23px",
              borderRadius: "30px 30px 7px 30px",
              backgroundColor: "#f4f4f5",
              color: "#18181b",
              fontSize: 21,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {workflowPrompt}
          </div>
          <div
            style={{
              width: 62,
              height: 62,
              flexShrink: 0,
              overflow: "hidden",
              borderRadius: "50%",
              border: "2px solid #262d39",
              backgroundColor: "#090d15",
            }}
          >
            <Img
              src={staticFile("launch-video/user-avatar.png")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 48,
          }}
        >
          <div
            style={{
              ...rowStyle,
              ...beforeStepStyles[0],
              gap: 10,
              color: "#71717a",
            }}
          >
            <Sparkles size={20} strokeWidth={1.8} color="#4da0ff" />
            <span>Reasoning</span>
            <ChevronDown
              size={17}
              strokeWidth={1.8}
              style={{ transform: "rotate(-90deg)" }}
            />
          </div>

          <div
            style={{
              ...rowStyle,
              ...beforeStepStyles[1],
              justifyContent: "space-between",
            }}
          >
            <span>1 tool call</span>
            <ChevronDown
              size={17}
              strokeWidth={1.8}
              style={{ transform: "rotate(-90deg)" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "13px 15px",
              borderRadius: 18,
              border: "1px solid #272f3d",
              backgroundColor: "#090e17",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
              opacity: createdOpacity,
              filter: `blur(${(1 - createdSettle) * 2.5}px)`,
              transform: `translateY(${(1 - createdSettle) * 14}px) scale(${0.985 + createdSettle * 0.015})`,
            }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                borderRadius: 12,
                color: "#4da0ff",
                backgroundColor: "rgba(1, 120, 255, 0.16)",
              }}
            >
              <Folder size={22} strokeWidth={1.8} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  color: "#f4f4f5",
                  fontSize: 19,
                  fontWeight: 700,
                }}
              >
                NVDA 12h buy below 200
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 3,
                  color: "#71717a",
                  fontSize: 16,
                }}
              >
                Created workflow &quot;NVDA 12h buy below 200&quot;.
              </span>
            </span>
            <ArrowRight size={20} strokeWidth={1.8} color="#71717a" />
          </div>

          <div
            style={{
              ...rowStyle,
              ...afterStepStyles[0],
              justifyContent: "space-between",
            }}
          >
            <span>8 tool calls</span>
            <ChevronDown
              size={17}
              strokeWidth={1.8}
              style={{ transform: "rotate(-90deg)" }}
            />
          </div>

          <div
            style={{ ...rowStyle, ...afterStepStyles[1], gap: 10 }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.14)",
              }}
            >
              <Check size={14} strokeWidth={2.5} />
            </span>
            <span>Validate workflow</span>
            <Check
              size={19}
              strokeWidth={2.4}
              color="#22c55e"
              style={{ marginLeft: "auto" }}
            />
          </div>

          <div
            style={{
              ...rowStyle,
              ...afterStepStyles[2],
              gap: 10,
              color: "#71717a",
            }}
          >
            <Sparkles size={20} strokeWidth={1.8} color="#4da0ff" />
            <span>Reasoning</span>
            <ChevronDown
              size={17}
              strokeWidth={1.8}
              style={{ transform: "rotate(-90deg)" }}
            />
          </div>

          <div
            style={{
              ...rowStyle,
              ...afterStepStyles[3],
              justifyContent: "space-between",
            }}
          >
            <span>4 tool calls</span>
            <ChevronDown
              size={17}
              strokeWidth={1.8}
              style={{ transform: "rotate(-90deg)" }}
            />
          </div>

          <div
            style={{ ...rowStyle, ...afterStepStyles[4], gap: 10 }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                color: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.14)",
              }}
            >
              <Check size={14} strokeWidth={2.5} />
            </span>
            <span>Validate workflow</span>
            <Check
              size={19}
              strokeWidth={2.4}
              color="#22c55e"
              style={{ marginLeft: "auto" }}
            />
          </div>

          <div
            style={{
              ...afterStepStyles[5],
              marginTop: 4,
              color: "#f4f4f5",
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            Done — I created and validated the workflow for buying $50 of NVDA
            on paper trading every 12 hours when NVDA is below $200.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WorkflowCanvasNode: React.FC<{
  node: WorkflowNode;
  opacity: number;
  settle: number;
  complete: boolean;
}> = ({ node, opacity, settle, complete }) => {
  const badgeStyle = WORKFLOW_BADGES[node.kind];
  const unsettledDistance = Math.max(0, 1 - settle);

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        left: node.x,
        top: node.y,
        width: node.width,
        height: WORKFLOW_NODE_HEIGHT,
        padding: "28px 36px 25px",
        borderRadius: 28,
        border: "2px solid #242832",
        backgroundColor: "#05070b",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.22)",
        opacity,
        filter: complete ? undefined : `blur(${unsettledDistance * 5}px)`,
        transform: complete
          ? undefined
          : `translateY(${(1 - settle) * 24}px) scale(${0.955 + settle * 0.045})`,
        transformOrigin: "center",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: -10,
          top: "50%",
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#626673",
          transform: "translateY(-50%)",
        }}
      />
      <span
        style={{
          position: "absolute",
          right: -10,
          top: "50%",
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#626673",
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {node.title}
        </span>
        <span
          style={{
            flexShrink: 0,
            padding: "9px 16px",
            borderRadius: 14,
            color: badgeStyle.color,
            backgroundColor: badgeStyle.backgroundColor,
            fontSize: 21,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: 0.3,
          }}
        >
          {node.badge}
        </span>
      </div>
      <div
        style={{
          marginTop: 22,
          color: "#777985",
          fontSize: 27,
          fontWeight: 500,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {node.subtitle}
      </div>
    </div>
  );
};

const WorkflowBuildSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { shell, header, nodes, edges, outro } =
    LAUNCH_VIDEO_TIMELINE.workflowBuild;
  const shellOpacity = progress(
    frame,
    shell.start,
    shell.duration,
    FAST_FADE_EASE,
  );
  const shellSettle = progress(frame, shell.start, shell.duration, POP_EASE);
  const headerOpacity = progress(
    frame,
    header.start,
    header.duration,
    FAST_FADE_EASE,
  );
  const headerSettle = progress(frame, header.start, header.duration, POP_EASE);
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const shellIsSettled = shellSettle >= 1 && exit === 0;
  const headerIsSettled = headerSettle >= 1;

  const nodeStyles = WORKFLOW_NODES.map((_, index) => {
    const start = nodes.start + index * nodes.stagger;

    return {
      opacity: progress(
        frame,
        start,
        Math.min(7, nodes.duration),
        FAST_FADE_EASE,
      ),
      settle: spring({
        frame: Math.max(0, frame - start),
        fps,
        durationInFrames: nodes.duration,
        config: {
          damping: 12,
          stiffness: 165,
          mass: 0.72,
        },
      }),
      complete: frame >= start + nodes.duration,
    };
  });
  const edgeDraws = Array.from(
    { length: WORKFLOW_EDGE_COUNT },
    (_, index) =>
      progress(
        frame,
        edges.start + index * edges.stagger,
        edges.duration,
        Easing.inOut(Easing.quad),
      ),
  );
  const originDotStyles = WORKFLOW_CONNECTION_ORIGINS.map((_, index) => {
    const start = edges.start + index * edges.stagger - 2;

    return {
      opacity: progress(frame, start, 4, FAST_FADE_EASE),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        durationInFrames: 7,
        config: {
          damping: 11,
          stiffness: 220,
          mass: 0.6,
        },
      }),
    };
  });
  const targetDotStyles = WORKFLOW_CONNECTION_TARGETS.map((_, index) => {
    const start =
      edges.start + index * edges.stagger + edges.duration - 2;

    return {
      opacity: progress(frame, start, 4, FAST_FADE_EASE),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        durationInFrames: 7,
        config: {
          damping: 11,
          stiffness: 220,
          mass: 0.6,
        },
      }),
    };
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: MANROPE,
      }}
    >
      <div
        style={{
          width: WORKFLOW_BOARD.width,
          height: 1040,
          opacity: shellOpacity * (1 - exit),
          filter: shellIsSettled
            ? undefined
            : `blur(${(1 - shellSettle) * 5 + exit * 4}px)`,
          transform: shellIsSettled
            ? undefined
            : `translateY(${(1 - shellSettle) * 28 + exit * 24}px) scale(${0.975 + shellSettle * 0.025 - exit * 0.01})`,
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            height: 170,
            opacity: headerOpacity,
            transform: headerIsSettled
              ? undefined
              : `translateY(${(1 - headerSettle) * 14}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <span
              style={{
                width: 72,
                height: 72,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                borderRadius: 24,
                border: "2px solid #252832",
                color: "#a1a1aa",
              }}
            >
              <Maximize2 size={29} strokeWidth={2} />
            </span>
            <span
              style={{
                color: "#fafafa",
                fontSize: 38,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: -0.6,
              }}
            >
              NVDA 12h buy below 200
            </span>
            <span
              style={{
                height: 58,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "0 23px",
                borderRadius: 999,
                border: "2px solid #252832",
                color: "#a1a1aa",
                fontSize: 27,
                fontWeight: 600,
              }}
            >
              <Clock3 size={27} strokeWidth={2} /> 4 nodes
            </span>
            <span
              style={{
                height: 58,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 26px",
                borderRadius: 999,
                border: "2px solid #252832",
                color: "#a1a1aa",
                fontSize: 27,
                fontWeight: 600,
              }}
            >
              Auto arrange
            </span>
          </div>
          <div
            style={{
              marginTop: 24,
              color: "#71717a",
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            Buy $50 of NVDA on paper trading when the price is below $200
          </div>
        </div>

        <div
          style={{
            position: "relative",
            isolation: "isolate",
            width: WORKFLOW_BOARD.width,
            height: WORKFLOW_BOARD.height,
            overflow: "hidden",
            backgroundImage:
              "radial-gradient(circle, rgba(255, 255, 255, 0.065) 2px, transparent 2px)",
            backgroundSize: "48px 48px",
          }}
        >
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${WORKFLOW_BOARD.width} ${WORKFLOW_BOARD.height}`}
            style={{
              position: "absolute",
              zIndex: 1,
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
            }}
          >
            {WORKFLOW_CONNECTORS.map((connector, index) => {
              const draw = edgeDraws[index];
              const isComplete = draw >= 1;

              return (
                <path
                  key={connector.id}
                  d={connector.path}
                  fill="none"
                  pathLength={1}
                  stroke="#626673"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isComplete ? undefined : 1}
                  strokeDashoffset={isComplete ? undefined : 1 - draw}
                  opacity={draw > 0 ? 1 : 0}
                />
              );
            })}
          </svg>
          <div
            style={{
              position: "absolute",
              zIndex: 2,
              left: conditionNode.x + conditionNode.width / 2 - 42,
              top: conditionNode.y + WORKFLOW_NODE_HEIGHT + 68,
              color: `rgba(119, 121, 133, ${edgeDraws[2]})`,
              fontSize: 28,
              fontWeight: 500,
            }}
          >
            true
          </div>

          {WORKFLOW_NODES.map((node, index) => (
            <WorkflowCanvasNode
              key={node.id}
              node={node}
              opacity={nodeStyles[index].opacity}
              settle={nodeStyles[index].settle}
              complete={nodeStyles[index].complete}
            />
          ))}

          {WORKFLOW_CONNECTION_ORIGINS.map((origin, index) => (
            <span
              key={origin.id}
              aria-hidden
              style={{
                position: "absolute",
                zIndex: 3,
                left: origin.x - 9,
                top: origin.y - 9,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#0178ff",
                boxShadow:
                  "0 0 0 4px rgba(1, 120, 255, 0.13), 0 0 18px rgba(1, 120, 255, 0.42)",
                opacity: originDotStyles[index].opacity,
                transform: `scale(${originDotStyles[index].scale})`,
              }}
            />
          ))}

          {WORKFLOW_CONNECTION_TARGETS.map((target, index) => (
            <span
              key={target.id}
              aria-hidden
              style={{
                position: "absolute",
                zIndex: 3,
                left: target.x - 9,
                top: target.y - 9,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#0178ff",
                boxShadow:
                  "0 0 0 4px rgba(1, 120, 255, 0.13), 0 0 18px rgba(1, 120, 255, 0.42)",
                opacity: targetDotStyles[index].opacity,
                transform: `scale(${targetDotStyles[index].scale})`,
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ExecuteFinaleSequence: React.FC<LaunchVideoProps> = ({
  ctaHeadline,
  ctaUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { button, cursor, click, logo, cta, url, outro } =
    LAUNCH_VIDEO_TIMELINE.executeFinale;

  const buttonOpacity = progress(
    frame,
    button.start,
    Math.min(7, button.duration),
    FAST_FADE_EASE,
  );
  const buttonSettle = spring({
    frame: Math.max(0, frame - button.start),
    fps,
    durationInFrames: button.duration,
    config: {
      damping: 12,
      stiffness: 170,
      mass: 0.7,
    },
  });
  const cursorMove = progress(
    frame,
    cursor.start,
    cursor.duration,
    Easing.out(Easing.cubic),
  );
  const cursorIn = progress(frame, cursor.start - 2, 4, FAST_FADE_EASE);
  const press = interpolate(
    frame,
    [click.start, click.start + 3, click.start + click.duration],
    [0, 1, 0],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const clickProgress = progress(
    frame,
    click.start,
    click.duration,
    FAST_FADE_EASE,
  );
  const cursorOut = progress(
    frame,
    click.start + 3,
    4,
    FAST_FADE_EASE,
  );
  const buttonCollapse = progress(
    frame,
    click.start + 2,
    9,
    Easing.inOut(Easing.cubic),
  );
  const logoReveal = progress(
    frame,
    logo.start,
    logo.duration,
    Easing.out(Easing.cubic),
  );
  const logoSpring = spring({
    frame: Math.max(0, frame - logo.start),
    fps,
    durationInFrames: logo.duration,
    config: {
      damping: 24,
      stiffness: 130,
      mass: 0.9,
    },
  });
  const seamIn = progress(
    frame,
    click.start + 3,
    8,
    Easing.out(Easing.cubic),
  );
  const seamOut = progress(
    frame,
    logo.start + 7,
    11,
    FAST_FADE_EASE,
  );
  const urlIn = progress(frame, url.start, url.duration, POP_EASE);
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const finaleLayout = progress(
    frame,
    cta.start - 8,
    18,
    Easing.inOut(Easing.cubic),
  );
  const finaleLift = finaleLayout * 130;

  const buttonTextOpacity = 1 - progress(
    frame,
    click.start + 2,
    6,
    FAST_FADE_EASE,
  );
  const seamOpacity = seamIn * (1 - seamOut);
  const seamWidth = interpolate(seamIn, [0, 1], [180, 680]);
  const sweepX = interpolate(clickProgress, [0, 1], [-160, 520]);
  const logoWords = ctaHeadline.split(" ");

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: MANROPE,
        opacity: 1 - exit,
        transform: `translateY(${exit * 24}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 430,
          height: 116,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          borderRadius: 58,
          color: "white",
          background:
            "linear-gradient(180deg, #0b84ff 0%, #0178ff 58%, #006eea 100%)",
          boxShadow: `0 18px 48px rgba(1, 120, 255, ${0.16 + press * 0.1}), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
          opacity:
            buttonOpacity *
            (1 - progress(frame, click.start + 6, 5, FAST_FADE_EASE)),
          overflow: "hidden",
          transform: `translate(-50%, calc(-50% + ${(1 - buttonSettle) * 34}px)) scaleX(${0.86 + buttonSettle * 0.14 + buttonCollapse * 0.34}) scaleY(${0.86 + buttonSettle * 0.14 - press * 0.035 - buttonCollapse * 0.985})`,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -30,
            bottom: -30,
            left: sweepX,
            width: 96,
            opacity:
              frame >= click.start && frame <= click.start + click.duration
                ? 0.7
                : 0,
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent)",
            filter: "blur(8px)",
            transform: "skewX(-18deg)",
          }}
        />
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: buttonTextOpacity,
            fontSize: 38,
            fontWeight: 650,
            letterSpacing: -0.5,
            whiteSpace: "nowrap",
          }}
        >
          Execute <ArrowRight size={36} strokeWidth={2.2} />
        </span>
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: seamWidth,
          height: 2,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, transparent, rgba(1, 120, 255, 0.72) 14%, white 50%, rgba(1, 120, 255, 0.72) 86%, transparent)",
          boxShadow:
            "0 0 12px rgba(255, 255, 255, 0.3), 0 0 38px rgba(1, 120, 255, 0.25)",
          opacity: seamOpacity,
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 760,
          height: 230,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(1, 120, 255, 0.16) 0%, rgba(1, 120, 255, 0.055) 44%, transparent 72%)",
          opacity: logoReveal * (1 - seamOut * 0.35),
          filter: "blur(22px)",
          transform: `translate(-50%, calc(-50% - ${finaleLift}px)) scale(${0.76 + logoReveal * 0.24})`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 574,
          height: 120,
          opacity: logoReveal,
          clipPath: `inset(0 ${50 - logoReveal * 50}% 0 ${50 - logoReveal * 50}%)`,
          filter: `blur(${(1 - logoReveal) * 13}px)`,
          transform: `translate(-50%, calc(-50% - ${finaleLift}px)) scale(${0.975 + logoSpring * 0.025})`,
        }}
      >
        <Img
          src={staticFile("figma/logo.svg")}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: `calc(64% - ${finaleLift}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          color: "#fafafa",
          fontFamily: DUPLET,
          fontSize: 68,
          fontWeight: 500,
          lineHeight: 1.08,
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        {logoWords.map((word, index) => {
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
                filter: wordIn >= 1 ? undefined : `blur(${(1 - wordIn) * 5}px)`,
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
          top: `calc(75% - ${finaleLift}px)`,
          color: "#4b9cff",
          fontSize: 32,
          fontWeight: 650,
          letterSpacing: 0.4,
          opacity: urlIn,
          transform: `translateY(${(1 - urlIn) * 20}px)`,
        }}
      >
        {ctaUrl}
      </div>

      <FakeCursor
        move={cursorMove}
        press={press}
        opacity={cursorIn * (1 - cursorOut) * (1 - exit)}
        origin={{ x: 1280, y: 830 }}
        target={{ x: 960, y: 600 }}
        size={44}
      />
    </AbsoluteFill>
  );
};

/**
 * Extensible Launch Video shell. Later scenes should be added as sibling
 * Sequences whose boundaries live in timeline.ts.
 */
export const LaunchVideoComposition: React.FC<LaunchVideoProps> = (props) => {
  const {
    opening,
    productStatement,
    chatComposer,
    chatResponse,
    workflowComposer,
    workflowResponse,
    workflowBuild,
    executeFinale,
  } = LAUNCH_VIDEO_TIMELINE;

  return (
    <AbsoluteFill style={{ backgroundColor: CANVAS, overflow: "hidden" }}>
      <Sequence
        from={opening.from}
        durationInFrames={opening.durationInFrames}
        name="Introducing Nick"
      >
        <OpeningSequence {...props} />
      </Sequence>
      <Sequence
        from={productStatement.from}
        durationInFrames={productStatement.durationInFrames}
        name="Nick trades anything"
      >
        <ProductStatementSequence {...props} />
      </Sequence>
      <Sequence
        from={chatComposer.from}
        durationInFrames={chatComposer.durationInFrames}
        name="Chat composer"
      >
        <ChatComposerSequence
          prompt={props.chatPrompt}
          timing={chatComposer}
        />
      </Sequence>
      <Sequence
        from={chatResponse.from}
        durationInFrames={chatResponse.durationInFrames}
        name="User message and AI response"
      >
        <ChatResponseSequence {...props} />
      </Sequence>
      <Sequence
        from={workflowComposer.from}
        durationInFrames={workflowComposer.durationInFrames}
        name="Workflow request composer"
      >
        <ChatComposerSequence
          prompt={props.workflowPrompt}
          timing={workflowComposer}
          showPlaceholder={false}
        />
      </Sequence>
      <Sequence
        from={workflowResponse.from}
        durationInFrames={workflowResponse.durationInFrames}
        name="Workflow creation responses"
      >
        <WorkflowResponseSequence {...props} />
      </Sequence>
      <Sequence
        from={workflowBuild.from}
        durationInFrames={workflowBuild.durationInFrames}
        name="Workflow nodes build"
      >
        <WorkflowBuildSequence />
      </Sequence>
      <Sequence
        from={executeFinale.from}
        durationInFrames={executeFinale.durationInFrames}
        name="Execute and NickAI finale"
      >
        <ExecuteFinaleSequence {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};
