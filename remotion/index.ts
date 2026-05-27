/**
 * Remotion entry point. `registerRoot` is what the bundler and Studio look for.
 * Referenced by `remotion.config.ts` (entry) and `scripts/generate-cards.ts`
 * (passed to `bundle()`).
 */
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
