"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root bounces to the static dashboard.
 *
 * Uses a client-side `router.replace` rather than the server `redirect()`
 * helper on purpose: `redirect()` always responds 307 (even from a Client
 * Component during SSR — see Next 16 docs), and preview / health-check tools
 * probe `/` and only mark the server "ready" on a 200. Rendering a 200 here and
 * navigating after hydration keeps `/` → `/static` behaviour while letting the
 * dev-server preview come up on its own.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/static");
  }, [router]);

  return null;
}
