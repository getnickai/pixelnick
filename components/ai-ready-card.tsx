/* eslint-disable @next/next/no-img-element */

const ASSET = "/figma";

export default function AiReadyCard() {
  return (
    <article
      className="relative w-[650px] h-[1136px] overflow-clip rounded-2xl bg-grey-950"
      data-node-id="187:3"
    >
      {/* Background glow */}
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

      {/* Agent illustration (decorative, sits above the glow) */}
      <div
        className="pointer-events-none opacity-25 absolute left-[-326px] top-[-222px] flex h-[865px] w-[1347px] items-center justify-center"
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
          <div className="relative inline-flex shrink-0 items-center gap-[9px] self-start rounded-full bg-green-400 px-3 py-0.5">
            <div className="relative size-6 shrink-0">
              <img
                alt=""
                src={`${ASSET}/icon-wave.svg`}
                className="absolute inset-0 block size-full max-w-none"
              />
            </div>
            <p className="whitespace-nowrap text-base font-semibold uppercase leading-6 text-[#010406]">
              Live Trading Agent
            </p>
          </div>

          {/* Headline */}
          <h1 className="w-full text-[54px] font-semibold leading-[1.2] text-white">
            Mag 7 Rotator V2 — Rotation 25% Cap
          </h1>
        </div>

        {/* Bottom: metrics + meta */}
        <div className="flex w-full flex-col gap-16">
          {/* Metrics row */}
          <div className="flex w-full flex-col items-start justify-center gap-14">
            {/* Total PNL */}
            <div className="relative flex w-full flex-col items-start gap-4">
              <p className="w-full text-2xl font-semibold leading-[1.2] text-white">
                Total PNL
              </p>
              <div className="relative flex items-center justify-center gap-6">
                {/* Decorative left-edge green bar aligned with PNL amount */}
                <div className="absolute -left-[87px] top-1/2 size-10 -translate-y-1/2 rounded-lg bg-green-400" />
                <p className="whitespace-nowrap text-5xl font-medium leading-[1.4] text-green-400">
                  +$4,012.95
                </p>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <div className="relative size-2 shrink-0">
                      <img
                        alt=""
                        src={`${ASSET}/dot-success.svg`}
                        className="absolute inset-0 block size-full max-w-none"
                      />
                    </div>
                    <p className="whitespace-nowrap text-base font-medium leading-[1.4] text-green-400">
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
                    <p className="whitespace-nowrap text-base font-medium leading-[1.4] text-green-400">
                      26 Trades
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit % */}
            <div className="flex w-[219px] flex-col items-start gap-3">
              <p className="w-full text-2xl font-semibold leading-[1.2] text-white">
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
                <p className="whitespace-nowrap text-5xl font-medium leading-[1.4] text-white">
                  27.97%
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col items-start gap-6">
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
              <p className="whitespace-nowrap text-xl leading-4 text-grey-400">
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
                <p className="whitespace-nowrap text-xl leading-4 text-grey-400">
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
                <p className="whitespace-nowrap text-xl leading-4 text-grey-400">
                  Next run in 6h 2m
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Author block: "Built By:" label snaps to author-name column */}
      <div className="absolute bottom-[45px] left-16 flex flex-col gap-[26px]">
        <p
          className="pl-[68px] text-xl leading-4 text-grey-400"
          data-node-id="196:258"
        >
          Built By:
        </p>
        <div className="flex items-center gap-5">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
            <img
              alt="Franklin"
              src={`${ASSET}/avatar-franklin.png`}
              width={48}
              height={48}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
          <p className="w-[219px] text-2xl font-semibold leading-[1.2] text-white">
            Franklin
          </p>
        </div>
      </div>

      {/* Remix CTA — "Try in NickAI" */}
      <div
        className="absolute bottom-8 left-[404px] flex items-start"
        data-node-id="204:278"
      >
        {/* Left decorative tab (rotated 180°) */}
        <div className="relative h-[56px] w-[46px] shrink-0 rotate-180">
          <img
            alt=""
            src={`${ASSET}/cta-tab.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>

        {/* Button body with gradient + backdrop blur */}
        <div
          className="relative flex shrink-0 items-center gap-[9px] rounded-r-[12px] py-4 pr-5 backdrop-blur-[16px]"
          style={{
            backgroundImage:
              "linear-gradient(162.836deg, rgba(74, 222, 128, 0.5) 17.138%, rgba(48, 197, 255, 0.5) 89.208%), linear-gradient(90deg, rgb(48, 197, 255) 0%, rgb(48, 197, 255) 100%)",
          }}
        >
          <p className="whitespace-nowrap text-xl font-semibold leading-[1.2] text-grey-950">
            Try in NickAI
          </p>
          <div className="relative size-6 shrink-0">
            <img
              alt=""
              src={`${ASSET}/arrow-right.svg`}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
        </div>

        {/* Color-dodge overlay across the full CTA */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-[56px] w-[211px] rotate-180"
          style={{ mixBlendMode: "color-dodge" }}
        >
          <img
            alt=""
            src={`${ASSET}/cta-overlay.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>
      </div>

      {/* LineGraph (top-most decorative layer) */}
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
    </article>
  );
}
