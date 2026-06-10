import AiReadyCard from "@/components/ai-ready-card";

/**
 * Chrome-free embed of the live performance-card template, for iframing into
 * the static Trading Cards preview kit (`/trading-cards`).
 *
 * Renders the card at its native 650×1136 with NO scaling and NO client JS:
 * the PARENT page scales the iframe element to fit (plain-HTML script, runs
 * immediately, no React hydration dependency → no flash of an unscaled,
 * overflowing card). A fixed full-viewport overlay covers the global app
 * sidebar that the root layout mounts in <body>. Renders the exact same
 * <AiReadyCard /> the Remotion pipeline uses, so the preview never drifts.
 */
export default function EmbedPerformanceCard() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html,body{margin:0;height:100%;overflow:hidden;background:#000510}
            [data-slot="sidebar"],[data-slot="sidebar-container"],[data-slot="sidebar-rail"],[data-slot="sidebar-trigger"],[data-slot="sidebar-gap"]{display:none !important}
            #embed-root{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#000510;overflow:hidden}
          `,
        }}
      />
      <div id="embed-root">
        <div style={{ width: 650, height: 1136, flex: "none" }}>
          <AiReadyCard />
        </div>
      </div>
    </>
  );
}
