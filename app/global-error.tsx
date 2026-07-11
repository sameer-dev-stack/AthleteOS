"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0A0A0B" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "384px", textAlign: "center" }}>
            <h1 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#88888A", fontSize: "14px", marginTop: "8px" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "24px",
                padding: "8px 16px",
                backgroundColor: "#C6FF3D",
                color: "#0A0A0B",
                fontWeight: 600,
                fontSize: "14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
