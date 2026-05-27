/**
 * Remotion CLI / Studio config. Programmatic renders in
 * `scripts/generate-cards.ts` apply the same Tailwind webpack override inline,
 * so this file mainly powers `bunx remotion studio` and `bunx remotion render`.
 */
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setEntryPoint("./remotion/index.ts");
Config.setVideoImageFormat("png");
Config.overrideWebpackConfig((currentConfig) => {
  return enableTailwind(currentConfig);
});
