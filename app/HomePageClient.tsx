"use client";

import dynamic from "next/dynamic";

/**
 * Client-only shell: avoids hydration mismatches when extensions inject
 * attributes (e.g. fdprocessedid) on forms that are not in SSR HTML.
 */
const CoverageAssistApp = dynamic(
  () =>
    import("@/components/CoverageAssistApp").then((mod) => mod.CoverageAssistApp),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Loading…
      </div>
    ),
  }
);

export function HomePageClient() {
  return <CoverageAssistApp />;
}
