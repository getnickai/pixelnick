/**
 * Props for the animated Consensus Card composition. `data` is a consensus
 * record (consensus.json shape); omit to render the built-in sample.
 */
import type { ConsensusCardData } from "../../../components/consensus-card-view";

export type ConsensusCardProps = {
  data?: ConsensusCardData;
  /** Slot-machine slide on the count-ups (default true). */
  slide?: boolean;
};

export const consensusCardDefaultProps: ConsensusCardProps = { slide: true };
