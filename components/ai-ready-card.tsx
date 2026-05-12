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

      {/* Top-right notch */}
      <div className="absolute right-[-2px] top-[195.55px] flex h-[27.619px] w-[141.619px] items-center justify-center">
        <div className="-scale-y-100 rotate-180">
          <div className="relative h-[27.619px] w-[141.619px]">
            <div className="absolute inset-[-1.81%_-0.35%]">
              <img
                alt=""
                src={`${ASSET}/notch.svg`}
                className="block size-full max-w-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute left-[64px] top-[63px] h-[30px] w-[140.211px]">
        <div className="absolute inset-[0_-2.32%_0_0]">
          <img
            alt="NickAI"
            src={`${ASSET}/logo.svg`}
            className="block size-full max-w-none"
          />
        </div>
      </div>

      {/* Card content stack */}
      <div className="absolute left-[64px] top-1/2 flex w-[522px] -translate-y-[calc(50%+30.5px)] flex-col gap-[72px]">
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
            <div className="relative flex w-full flex-col items-start gap-8">
              <p className="w-full text-2xl font-semibold leading-[1.2] text-white">
                Total PNL
              </p>
              <div className="flex items-center justify-center gap-6">
                <p className="whitespace-nowrap text-5xl font-medium leading-[1.4] text-green-400">
                  +$4,012.95
                </p>
                <div className="flex flex-col items-start gap-3">
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
              {/* Decorative left-edge green bar */}
              <div className="absolute -bottom-[5.02px] -left-[86px] h-[41px] w-[39px] rounded-lg bg-[#5be59c]" />
            </div>

            {/* Profit % */}
            <div className="flex w-[219px] flex-col items-start gap-8">
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

      {/* Author footer */}
      <div className="absolute bottom-[45px] left-[64px] flex items-center gap-5">
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
    </article>
  );
}
