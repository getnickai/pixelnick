/**
 * Beat 11 — Execution (STA-494). Zoom on the top-right "Run Now" control → it
 * presses → the Execution Logs panel opens and nodes light up → rows stream
 * upward (more and more executions) → the camera pulls back to the full UX.
 *
 * CP1 STUB: renders the settled running+logs ProductScreen. CP5 adds the
 * Run-Now zoom, log-open, row scroll, and pull-back.
 */
import { ProductScreen } from "../nick-launch-video/screens";

export const ExecutionSequence: React.FC = () => <ProductScreen running logs />;
