import type { CSSProperties } from "react";
import type { ExecutionFrame } from "../runtime/frames";
import { extractResult } from "../utils/extractResult";

const styles: Record<string, CSSProperties> = {
  root: {
    fontSize: 12,
    fontFamily: "system-ui, sans-serif",
    color: "#e0e0e0",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
  },
  empty: {
    opacity: 0.6,
    fontSize: 12,
  },
  commitNote: {
    marginTop: 8,
    opacity: 0.7,
    fontSize: 11,
  },
};

export function StepInspector({
  frame,
  previousFrame,
}: {
  frame: ExecutionFrame | null;
  /** Full-timeline predecessor (for commit outcome copy). */
  previousFrame?: ExecutionFrame;
}) {
  if (!frame) {
    return (
      <div style={styles.empty}>Select a step to inspect</div>
    );
  }

  const tool = frame.tool;

  return (
    <div style={styles.root}>
      <h3 style={styles.title}>Run {frame.step}</h3>

      <Row label="Status" value={String(frame.status)} />
      <Row label="Tool" value={tool?.name ?? "output"} />

      {tool?.durationMs != null && (
        <Row label="Duration" value={`${tool.durationMs} ms`} />
      )}

      {tool?.rawArgs != null && (
        <InspectorBlock label="rawArgs" value={tool.rawArgs} />
      )}

      {tool?.normalizedArgs != null && (
        <InspectorBlock label="normalizedArgs" value={tool.normalizedArgs} />
      )}

      {tool?.result !== undefined && (
        <InspectorBlock
          label="result"
          value={extractResult(tool.result)}
        />
      )}

      {tool?.error && (
        <InspectorBlock label="error" value={tool.error} error />
      )}

      {frame.enforcement && (
        <InspectorBlock label="enforcement" value={frame.enforcement} />
      )}

      {frame.status === "committed" && (
        <>
          <div style={{ ...styles.commitNote, opacity: 0.85 }}>
            Output (from Run {previousFrame?.step ?? "—"})
          </div>
          <div style={styles.commitNote}>
            Output committed to system boundary
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function InspectorBlock({
  label,
  value,
  error,
}: {
  label: string;
  value: unknown;
  error?: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ opacity: 0.6, marginBottom: 2 }}>{label}</div>
      <pre
        style={{
          margin: 0,
          background: "#000",
          padding: 6,
          borderRadius: 4,
          color: error ? "#ff7875" : "#ccc",
          fontSize: 11,
          overflow: "auto",
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
