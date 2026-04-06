"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          maxWidth: 480,
          margin: "10vh auto",
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          {error.digest ? `Error ID: ${error.digest}` : error.message}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "8px 16px",
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
