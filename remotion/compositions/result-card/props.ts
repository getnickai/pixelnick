/**
 * Props for the animated Result ("won pick") card composition. `data` is a
 * settled-pick record (results.json shape); omit to render the built-in sample.
 */
import type { ResultCardData } from "../../../components/result-card-view";

export type ResultCardProps = {
  data?: ResultCardData;
  /** Slot-machine slide on the payout count-up (default true). */
  slide?: boolean;
};

export const resultCardDefaultProps: ResultCardProps = { slide: true };
