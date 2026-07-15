/**
 * Beat 8 — Workflow montage (STA-494). After the NVDA hero build, the composer
 * prompt swaps twice and two MORE workflows finalize fast (pop in already-built,
 * no slow node-by-node reveal), establishing "any strategy, in seconds".
 *
 * CP1 STUB: renders workflow #2 settled, full-frame. CP2 adds the swap + pop.
 */
import { AbsoluteFill, staticFile } from "remotion";
import { WorkflowGraph, fitCamera } from "../nick-launch-video/graph";
import { LAUNCH_WORKFLOWS } from "../nick-launch-video/props";

const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";
const VW = 1720;
const VH = 720;

export const WorkflowMontageSequence: React.FC = () => {
  const w = LAUNCH_WORKFLOWS[1];
  return (
    <AbsoluteFill style={{ backgroundColor: "#070b14", fontFamily: SANS }}>
      <img
        alt=""
        src={staticFile("figma/background-glow.svg")}
        style={{ position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)", width: "120%", opacity: 0.6 }}
      />
      <div style={{ position: "absolute", left: (1920 - VW) / 2, top: 200 }}>
        <WorkflowGraph template={w.template} vw={VW} vh={VH} camera={fitCamera(VW, VH, 2600, 1200)} />
      </div>
    </AbsoluteFill>
  );
};
