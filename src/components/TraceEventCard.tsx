import { useState } from "react";
import type { CSSProperties } from "react";
import type { ExecutionFrame } from "../runtime/frames";

const styles: Record<string, CSSProperties> = {
  card: {
    border: "1px solid #333",
    borderRadius: 8,
    marginBottom: 8,
    background: "#1a1a1a",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
  body: {
    padding: "8px 12px 12px",
    borderTop: "1px solid #333",
    fontSize: 12,
  },
};

export function TraceEventCard({ frame }: { frame: ExecutionFrame }) {
  const [open, setOpen] = useState(false);

  if (frame.status === "committed") {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          #{frame.step} — <strong>output</strong> 📦
        </div>

        <div style={styles.body}>
          <div style={{ opacity: 0.7 }}>
            Output committed to system boundary
          </div>
        </div>
      </div>
    );
  }

  const status = frame.status;
  const isError = status === "failed";
  const isSuccess = status === "resolved";

  return (
    <div
      style={{
        ...styles.card,
        borderColor: isError ? "#ff4d4f" : isSuccess ? "#52c41a" : "#333",
      }}
    >
      {/* HEADER */}
      <div style={styles.header} onClick={() => setOpen(!open)}>
        <div>
          #{frame.step} — <strong>{frame.tool?.name ?? "output"}</strong>
          {frame.tool?.durationMs != null &&
            ` (${frame.tool.durationMs}ms)`}
        </div>

        <div>
          {isError && "❌"}
          {isSuccess && "✅"}
          {!isError && !isSuccess && "⏳"}
        </div>
      </div>

      {/* BODY */}
      {open && (
        <div style={styles.body}>
          {frame.tool?.rawArgs != null && (
            <Block label="rawArgs" value={frame.tool.rawArgs} />
          )}

          {frame.tool?.normalizedArgs != null && (
            <Block label="normalized" value={frame.tool.normalizedArgs} />
          )}

          {frame.tool?.result !== undefined && (
            <Block label="result" value={frame.tool.result} />
          )}

          {frame.tool?.error && (
            <Block label="error" value={frame.tool.error} error />
          )}
        </div>
      )}
    </div>
  );
}

function Block({ label, value, error }: any) {
  return (
    <div style={{ marginBottom: 8, color: error ? "#ff6b6b" : "#ccc" }}>
      <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
