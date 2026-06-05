/* eslint-disable @next/next/no-img-element */

const ASSET = "/figma";

/** Decorative bottom chart stroke (`line-graph.svg`). Flip to `true` to restore. */
const SHOW_DECORATIVE_LINE_GRAPH = false;

export default function AiReadyCard() {
  return (
    <article
      className="relative w-[650px] h-[1136px] overflow-clip rounded-2xl bg-primary-1000 font-sans"
      data-node-id="187:3"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_70%_38%,var(--color-primary-500)_0%,transparent_62%)] opacity-[0.14]"
        aria-hidden
      />

      {/* Background glow (blob SVG) */}
      <div className="pointer-events-none absolute left-[-314.95px] top-[195.5px] flex h-[1206px] w-[1191.312px] items-center justify-center">
        <div className="-scale-y-100">
          <div className="relative h-[1206px] w-[1191.312px]">
            <div className="absolute inset-[-41.01%_-41.51%]">
              <img
                alt=""
                src={`${ASSET}/background-glow.svg`}
                className="block size-full max-w-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agent illustration (organic wave blob) */}
      <div
        className="pointer-events-none absolute left-[-326px] top-[-222px] flex h-[865px] w-[1347px] items-center justify-center opacity-10"
        data-node-id="196:260"
      >
        <div className="-rotate-90 -scale-y-100">
          <div className="relative h-[1347px] w-[865px]">
            <img
              alt=""
              src={`${ASSET}/agent-illustration.svg`}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute left-16 top-[63px] h-[30px] w-[140.211px]">
        <div className="absolute inset-[0_-2.32%_0_0]">
          <img
            alt="NickAI"
            src={`${ASSET}/logo.svg`}
            className="block size-full max-w-none"
          />
        </div>
      </div>

      {/* Card content stack */}
      <div className="absolute left-16 top-1/2 flex w-[522px] -translate-y-[calc(50%+30.5px)] flex-col gap-[72px]">
        {/* Top: Type indicator + headline */}
        <div className="flex w-full flex-col gap-4">
          {/* Type indicator pill */}
          <div className="relative inline-flex shrink-0 items-center gap-[9px] self-start rounded-full bg-green-600 px-3 py-0.5 font-sans text-white">
            <svg
              className="size-6 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7.5 8C6.5 9 6 10.5 6 12C6 13.5 6.5 15 7.5 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 6C3 7.5 2 9.5 2 12C2 14.5 3 16.5 4.5 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 16C17.5 15 18 13.5 18 12C18 10.5 17.5 9 16.5 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.5 18C21 16.5 22 14.5 22 12C22 9.5 21 7.5 19.5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="whitespace-nowrap text-base font-semibold uppercase leading-6">
              Live Trading Agent
            </p>
          </div>

          {/* Headline */}
          <h1 className="w-full font-heading text-[54px] font-semibold leading-[1.2] text-white">
            Mag 7 Rotator V2 — Rotation 25% Cap
          </h1>
        </div>

        {/* Bottom: metrics + meta */}
        <div className="flex w-full flex-col gap-16">
          {/* Metrics row */}
          <div className="flex w-full flex-col items-start justify-center gap-14">
            {/* Total PNL */}
            <div className="relative flex w-full flex-col items-start gap-4">
              <p className="w-full font-heading text-2xl font-semibold leading-[1.2] text-white">
                Total PNL
              </p>
              <div className="relative flex items-center justify-center gap-6">
                {/* Decorative left-edge green bar aligned with PNL amount */}
                <div className="absolute -left-[87px] top-0 bottom-0 w-10 rounded-none rounded-r-3xl bg-green-600" />
                <div className="inline-flex items-center gap-1">
                  <span
                    className="grid size-[3.75rem] shrink-0 place-items-center rounded-4xl rounded-r-lg bg-green-600 text-white"
                    aria-hidden
                  >
                    <svg
                      className="size-7 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2.75C12.6904 2.75 13.25 3.30964 13.25 4V10.75H20C20.6904 10.75 21.25 11.3096 21.25 12C21.25 12.6904 20.6904 13.25 20 13.25H13.25V20C13.25 20.6904 12.6904 21.25 12 21.25C11.3096 21.25 10.75 20.6904 10.75 20V13.25H4C3.30964 13.25 2.75 12.6904 2.75 12C2.75 11.3096 3.30964 10.75 4 10.75H10.75V4C10.75 3.30964 11.3096 2.75 12 2.75Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="inline-flex h-[3.75rem] items-center whitespace-nowrap rounded-4xl rounded-l-lg bg-green-600 px-6 font-heading text-5xl font-medium leading-none text-white">
                    $4,012.95
                  </span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <div className="relative size-2 shrink-0">
                      <img
                        alt=""
                        src={`${ASSET}/dot-success.svg`}
                        className="absolute inset-0 block size-full max-w-none"
                      />
                    </div>
                    <p className="whitespace-nowrap font-sans text-base font-medium leading-[1.4] text-green-600">
                      12 Runs
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative size-2 shrink-0">
                      <img
                        alt=""
                        src={`${ASSET}/dot-success.svg`}
                        className="absolute inset-0 block size-full max-w-none"
                      />
                    </div>
                    <p className="whitespace-nowrap font-sans text-base font-medium leading-[1.4] text-green-600">
                      26 Trades
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit % */}
            <div className="flex w-[219px] flex-col items-start gap-3">
              <p className="w-full font-heading text-2xl font-semibold leading-[1.2] text-white">
                Profit %
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-8 w-[27.429px] shrink-0">
                  <div className="absolute inset-[-6.63%_-7.73%_-4.69%_-7.73%]">
                    <img
                      alt=""
                      src={`${ASSET}/arrow-up.svg`}
                      className="block size-full max-w-none"
                    />
                  </div>
                </div>
                <p className="whitespace-nowrap font-heading text-5xl font-medium leading-[1.4] text-white">
                  27.97%
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col items-start gap-6 font-sans">
            <div className="flex items-center gap-3">
              <div className="relative h-5 w-[18px] shrink-0">
                <div className="absolute inset-[-3.75%_-4.17%]">
                  <img
                    alt=""
                    src={`${ASSET}/icon-calendar.svg`}
                    className="block size-full max-w-none"
                  />
                </div>
              </div>
              <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                Active since 16 Mar 17,2026
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative h-[16.67px] w-[20.837px] shrink-0">
                  <div className="absolute inset-[-4.5%_-3.6%]">
                    <img
                      alt=""
                      src={`${ASSET}/icon-nodes.svg`}
                      className="block size-full max-w-none"
                    />
                  </div>
                </div>
                <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                  9 nodes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative size-5 shrink-0">
                  <img
                    alt=""
                    src={`${ASSET}/icon-clock.svg`}
                    className="absolute inset-0 block size-full max-w-none"
                  />
                </div>
                <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                  Next run in 6h 2m
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: author + CTA share one row so the pill stays beside Franklin */}
      <div
        className="absolute bottom-[45px] left-16 right-10 flex flex-col gap-[26px]"
        data-node-id="196:258"
      >
        <p className="pl-[68px] font-sans text-xl leading-4 text-zinc-400">
          Built By:
        </p>
        <div className="flex w-full items-center">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
              <img
                alt="Franklin"
                src={`${ASSET}/avatar-franklin.png`}
                width={48}
                height={48}
                className="absolute inset-0 block size-full max-w-none"
              />
            </div>
            <p className="w-[219px] shrink-0 font-heading text-2xl font-semibold leading-[1.2] text-white">
              Franklin
            </p>
          </div>
          <div className="ml-auto shrink-0" data-node-id="204:278">
            <div
              className="inline-flex items-center gap-[9px] rounded-full bg-primary-500 px-8 py-4 font-sans text-white"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">
                Try in NickAI
              </p>
              <svg
                className="size-6 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M13 18L19 12L13 6M18.5 12H5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {SHOW_DECORATIVE_LINE_GRAPH ? (
        /* LineGraph (top-most decorative layer) */
        <div
          className="pointer-events-none absolute -bottom-10 left-[-270px] h-[329.506px] w-[1389.202px]"
          data-node-id="199:271"
        >
          <div className="absolute inset-[-0.15%_0]">
            <img
              alt=""
              src={`${ASSET}/line-graph.svg`}
              className="block size-full max-w-none"
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
