/**
 * Props for the animated Result + Portfolio card composition. `data` is a
 * settled single-agent pick (SAMPLE_RESULT_PORTFOLIO_CARD shape); omit to
 * render the built-in sample.
 */
import type { ResultPortfolioCardData } from "../../../components/result-portfolio-card-view";

export type ResultPortfolioCardProps = {
  data?: ResultPortfolioCardData;
  /** Slot-machine slide on the count-ups (default true). */
  slide?: boolean;
};

export const resultPortfolioCardDefaultProps: ResultPortfolioCardProps = { slide: true };
