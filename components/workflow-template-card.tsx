import {
  workflowTemplateCardDefaultProps,
  type WorkflowTemplateCardProps,
} from "@/remotion/compositions/workflow-template-card/props";
import { WorkflowTemplateCardView } from "./workflow-template-card-view";

/**
 * Static Workflow Template Card — the settled still of the single design source.
 *
 * Renders `WorkflowTemplateCardView` fully revealed as PLAIN HTML so
 * html-to-image can rasterise it to a PNG (gallery download, `/static`). The
 * animated version (`<Player>` + MP4) is the same view driven per frame by the
 * composition, so the still and the animation can never drift.
 */
export default function WorkflowTemplateCard(
  props: Partial<WorkflowTemplateCardProps> = {},
) {
  const merged: WorkflowTemplateCardProps = {
    ...workflowTemplateCardDefaultProps,
    ...props,
  };

  return (
    <article
      className="relative h-[1136px] w-[650px] overflow-clip rounded-2xl bg-primary-1000 font-sans"
    >
      <WorkflowTemplateCardView props={merged} />
    </article>
  );
}
