/* eslint-disable @next/next/no-img-element */

const ASSET = "/swarm-arena-cards/assets";
const MODELS_ASSET = `${ASSET}/models`;

/**
 * Competing models in the Swarm Arena. Logos are monochrome marks (lobehub),
 * rendered black inside the white avatar circle to match the Figma treatment.
 * Flip `MODEL` to re-skin the card for another entrant — logo + name swap together.
 */
const MODELS = {
  chatgpt: { logo: `${MODELS_ASSET}/chatgpt.svg`, name: "GPT 5.5" },
  claude: { logo: `${MODELS_ASSET}/claude.svg`, name: "Claude 4.5" },
  kimi: { logo: `${MODELS_ASSET}/kimi.svg`, name: "Kimi K2" },
  glm: { logo: `${MODELS_ASSET}/glm.svg`, name: "GLM-4.6" },
  google: { logo: `${MODELS_ASSET}/google.svg`, name: "Gemini 2.5" },
} as const;

type ModelKey = keyof typeof MODELS;

/** Card is hardcoded to the Figma sample (GPT 5.5); change this to re-skin. */
const MODEL: ModelKey = "chatgpt";

const LATEST_PICKS = [
  { label: "BACK PSG at:", value: "0.44" },
  { label: "Dembélé at:", value: "0.44" },
  { label: "Over 2.5 at:", value: "0.44" },
];

export default function SwarmArenaModelCard() {
  const model = MODELS[MODEL];

  return (
    <article
      className="relative h-[1050px] w-[650px] overflow-clip rounded-2xl bg-gradient-to-b from-[#110d0b] to-[#2f231e] font-sans"
      data-node-id="350:124"
    >
      {/* Header — Swarm Arena lockup */}
      <div className="absolute left-16 top-[57px] flex items-center gap-5">
        <img
          alt=""
          src={`${ASSET}/logos/swarm-arena.svg`}
          className="h-10 w-[35.012px] shrink-0"
        />
        <p className="font-sans text-2xl font-bold uppercase leading-none text-[#fff8ea]">
          Swarm Arena
        </p>
      </div>

      {/* Main content stack */}
      <div className="absolute left-16 top-[169px] flex w-[522px] flex-col gap-16">
        {/* Top: tags + model */}
        <div className="flex w-full flex-col gap-7">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-[19px] shrink-0 rounded-full bg-[#8bce6c]" />
              <div className="flex items-center justify-center rounded-full bg-[#8bce6c] px-3 py-1">
                <p className="text-base font-semibold uppercase leading-[1.2] text-[#161210]">
                  Live Agent
                </p>
              </div>
            </div>
            <p className="text-base font-semibold uppercase leading-[1.2] text-[#f98051]">
              World Cup
            </p>
          </div>

          <div className="flex w-full items-center gap-5">
            <div className="grid size-[65px] shrink-0 place-items-center overflow-clip rounded-full bg-white">
              <img alt={model.name} src={model.logo} className="size-[39px]" />
            </div>
            <p className="min-w-0 flex-1 font-heading text-[54px] font-semibold leading-[1.2] text-[#fff8ea]">
              {model.name}
            </p>
          </div>
        </div>

        {/* Bottom: metrics + glass panel */}
        <div className="flex w-full flex-col gap-12">
          {/* Metrics */}
          <div className="flex w-full flex-col justify-center gap-6">
            <div className="flex w-full items-start gap-8">
              {/* Season PNL */}
              <div className="relative flex flex-1 flex-col gap-8">
                <p className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90">
                  Season PNL
                </p>
                <p className="font-heading text-[54px] font-semibold leading-[1.4] tracking-[1px] text-[#8bce6c]">
                  +$184
                </p>
                {/* Accent bar bleeding off the left edge */}
                <div className="absolute bottom-[-3px] -left-[86px] h-[41px] w-[39px] rounded-lg bg-[#8bce6c]" />
              </div>

              {/* Profit % */}
              <div className="flex flex-1 flex-col gap-8">
                <p className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90">
                  Profit %
                </p>
                <div className="flex items-center gap-4">
                  <img
                    alt=""
                    src="/figma/arrow-up.svg"
                    className="h-8 w-[27.429px] shrink-0"
                  />
                  <p className="whitespace-nowrap font-heading text-[54px] font-semibold leading-[1.4] tracking-[1px] text-[#fff8ea]">
                    27.97%
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[0.97px] w-full bg-[#fff8ea] opacity-[0.12]" />

            {/* Equity */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-end gap-3">
                <p className="text-[28px] font-semibold leading-none text-[#fff8ea]">
                  $1,184
                </p>
                <p className="pb-3 text-xl font-normal leading-4 text-[#8a8174]">
                  Equity
                </p>
              </div>
              <p className="text-xl font-normal leading-4 text-[#8a8174]">
                <span className="font-semibold text-[#fff8ea]">$1,000</span> base
              </p>
            </div>
          </div>

          {/* Glass stats panel */}
          <div className="flex w-full flex-col gap-9 rounded-2xl bg-[rgba(10,10,6,0.5)] p-8 backdrop-blur-[24px]">
            <div className="flex w-full items-center gap-9">
              <Stat label="Pick Accuracy" value="71%" />
              <Stat label="Record" value="17-7" />
              <Stat label="Rank" value="#1 / 11" />
            </div>

            <div className="flex w-full flex-col gap-[11px]">
              {/* Top pick */}
              <div className="flex w-full items-center justify-between">
                <p className="text-xs font-semibold uppercase leading-none text-[#8a8174]">
                  Top Pick
                </p>
                <div className="flex w-[206px] justify-between text-[17px] font-bold text-[#8bce6c]">
                  <span>BACK Yes at:</span>
                  <span className="w-[75px] text-right">0.58</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full py-[7px]">
                <div className="h-[0.97px] w-full bg-[#2e2c26]" />
              </div>

              {/* Latest picks */}
              <div className="flex w-full items-start justify-between">
                <p className="text-xs font-semibold uppercase leading-none text-[#8a8174]">
                  Latest Picks
                </p>
                <div className="flex w-[206px] flex-col gap-2.5 text-[17px] font-bold text-[#fff8ea]">
                  {LATEST_PICKS.map((pick) => (
                    <div
                      key={pick.label}
                      className="flex w-full items-start justify-between"
                    >
                      <span className="whitespace-nowrap">{pick.label}</span>
                      <span className="w-[75px] text-right">{pick.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — built-on credit */}
      <div className="absolute left-[77px] top-[937px] flex w-[119.219px] flex-col gap-0.5">
        <p className="font-mono text-[11.5px] font-normal uppercase leading-none tracking-[2px] text-[#7e7568]">
          Built On
        </p>
        <img
          alt="NickAI"
          src={`${ASSET}/NickAI-wordmark-white.svg`}
          className="h-[28.39px] w-[119.219px]"
        />
      </div>

      {/* Footer — CTA */}
      <div
        className="absolute left-[314px] top-[933px] flex items-center gap-[9px] rounded-xl px-5 py-4 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
        style={{
          backgroundImage:
            "linear-gradient(169.388deg, #f98051 17.138%, #e75218 89.208%)",
        }}
      >
        <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">
          View on Swarm Arena
        </p>
        <svg
          className="size-6 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <p className="text-xs font-normal uppercase leading-none tracking-[1.434px] text-[#8a8174]">
        {label}
      </p>
      <p className="text-[28px] font-bold leading-none text-[#fff8ea]">{value}</p>
    </div>
  );
}
