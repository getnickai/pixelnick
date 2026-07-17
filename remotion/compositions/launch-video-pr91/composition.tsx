import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import { LaunchVideoComposition } from "../launch-video/composition";
import { ExecutionSequence } from "./beat-execution";
import { WorkflowMontageSequence } from "./beat-montage";
import { ProductShellSequence } from "./beat-product-shell";
import { ProductCutFinaleSequence } from "./finale";
import type { LaunchVideoProductCutProps } from "./props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { OUTRO_EASE, progress } from "./motion";
import { ProductCutNvdaCandlestickChart } from "./nvda-candlestick-chart";
import {
  PRODUCT_CUT_INTERACTION_SCALE,
  PRODUCT_CUT_WORKFLOW_RESPONSE_GAP,
} from "./readability";

const CANVAS = "#09090b";

const ProductCutCoreSequence: React.FC<LaunchVideoProductCutProps> = (props) => {
  const frame = useCurrentFrame();
  const { freezeAt, outro } = LAUNCH_VIDEO_TIMELINE.core;
  const fadeOut = progress(frame, outro.start, outro.duration, OUTRO_EASE);

  return (
    <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
      <Freeze frame={Math.min(frame, freezeAt)}>
        <LaunchVideoComposition
          {...props}
          chatResponseChart={<ProductCutNvdaCandlestickChart />}
          interactionScale={PRODUCT_CUT_INTERACTION_SCALE}
          workflowResponseGap={PRODUCT_CUT_WORKFLOW_RESPONSE_GAP}
        />
      </Freeze>
    </AbsoluteFill>
  );
};

/**
 * Expanded launch film based on PR #91. The original Launch Video is nested
 * unchanged and cropped before its Execute finale; the product beats then take
 * over through a deterministic sequence of Remotion scenes.
 */
export const LaunchVideoProductCutComposition: React.FC<
  LaunchVideoProductCutProps
> = (props) => {
  const { core, workflowMontage, productShell, execution, finale } =
    LAUNCH_VIDEO_TIMELINE;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: CANVAS }}>
      <Sequence
        from={core.from}
        durationInFrames={core.durationInFrames}
        name="Original launch-video spine"
      >
        <ProductCutCoreSequence {...props} />
      </Sequence>
      <Sequence
        from={workflowMontage.from}
        durationInFrames={workflowMontage.durationInFrames}
        name="Workflow montage"
      >
        <WorkflowMontageSequence />
      </Sequence>
      <Sequence
        from={productShell.from}
        durationInFrames={productShell.durationInFrames}
        name="Product shell and cards"
      >
        <ProductShellSequence />
      </Sequence>
      <Sequence
        from={execution.from}
        durationInFrames={execution.durationInFrames}
        name="Execution logs and trade confirmation"
      >
        <ExecutionSequence />
      </Sequence>
      <Sequence
        from={finale.from}
        durationInFrames={finale.durationInFrames}
        name="Capability wall and NickAI finale"
      >
        <ProductCutFinaleSequence {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};
