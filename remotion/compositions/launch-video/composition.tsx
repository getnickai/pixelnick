import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  Code,
  Cpu,
  Database,
  DollarSign,
  ChevronDown,
  Folder,
  GitBranch,
  Mail,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Plus,
  Send,
  SlidersVertical,
  TrendingUp,
  ArrowUp,
  Zap,
} from "lucide-react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import type { LaunchVideoProps } from "./props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";

const CANVAS = "#000510";
const TILE_SIZE = 88;
const DUPLET =
  'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif';
const MANROPE = "Manrope, ui-sans-serif, system-ui, sans-serif";

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
          aria-label={`${productHeadline} ${productHeadlineAccent}.`}
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
                {accent ? <span style={{ color: "#ffffff" }}>.</span> : null}
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

const ChatComposerSequence: React.FC<LaunchVideoProps> = ({ chatPrompt }) => {
  const frame = useCurrentFrame();
  const { shell, focus, placeholder, typing, send, outro } =
    LAUNCH_VIDEO_TIMELINE.chatComposer;

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
  const typedCharacterCount = Math.floor(chatPrompt.length * typingProgress);
  const typedPrompt = chatPrompt.slice(0, typedCharacterCount);
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
  const exit = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const caretVisible =
    frame >= focus.start &&
    frame < send.start + send.duration &&
    Math.floor((frame - focus.start) / 7) % 2 === 0;
  const sendBackground = `rgb(${Math.round(24 - sendActive * 23)}, ${Math.round(24 + sendActive * 96)}, ${Math.round(27 + sendActive * 228)})`;
  const sendForeground = Math.round(113 + sendActive * 142);

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
          opacity: shellOpacity * (1 - exit),
          filter: `blur(${(1 - shellSettle) * 5 + exit * 4}px)`,
          transform: `translateY(${(1 - shellSettle) * 42 + exit * 36}px) scale(${0.96 + shellSettle * 0.04})`,
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
            aria-hidden
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: 33,
              border: "3px solid #0178ff",
              boxShadow: "0 0 0 7px rgba(1, 120, 255, 0.14)",
              opacity: focusIn * (1 - exit),
            }}
          />

          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 28,
              border: "1px solid #27272a",
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
                  opacity: 1 - placeholderOut,
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
                  borderRadius: "50%",
                  color: `rgb(${sendForeground}, ${sendForeground}, ${sendForeground})`,
                  backgroundColor: sendBackground,
                  boxShadow: `inset 0 0 0 1px rgba(63, 63, 70, ${1 - sendActive})`,
                  transform: `scale(${1 - sendPress * 0.1})`,
                }}
              >
                <ArrowUp size={25} strokeWidth={2} />
              </div>
            </div>
          </div>

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

        <div
          style={{
            marginTop: 17,
            color: "rgba(212, 217, 228, 0.5)",
            fontFamily: MANROPE,
            fontSize: 18,
            textAlign: "center",
          }}
        >
          AI can make mistakes · please double-check
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Extensible Launch Video shell. Later scenes should be added as sibling
 * Sequences whose boundaries live in timeline.ts.
 */
export const LaunchVideoComposition: React.FC<LaunchVideoProps> = (props) => {
  const { opening, productStatement, chatComposer } = LAUNCH_VIDEO_TIMELINE;

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
        <ChatComposerSequence {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};
