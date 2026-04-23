import type { CSSProperties } from "react";
import type { ExecutionFrame } from "../runtime/frames";
import { TraceEventCard } from "./TraceEventCard";

function getSummary(frames: ExecutionFrame[]) {
  if (!frames.length) return null;

  const last = frames[frames.length - 1];

  const step =
    last.status === "committed" ? frames[frames.length - 2] : last;

  if (!step) return null;

  const toolName = step.tool?.name ?? "output";

  if (step.tool?.result) {
    const result =
      typeof step.tool.result === "object" &&
      step.tool.result !== null &&
      "result" in step.tool.result
        ? (step.tool.result as { result: unknown }).result
        : step.tool.result;

    const resultStr =
      typeof result === "object" && result !== null
        ? JSON.stringify(result)
        : String(result);

    const duration = step.tool?.durationMs;

    return `${toolName} → ${resultStr}${duration != null ? ` (${duration}ms)` : ""}`;
  }

  if (step.tool?.error) {
    return `${toolName} ❌ ${step.tool.error.message}`;
  }

  return toolName;
}

const styles: Record<string, CSSProperties> = {
  panel: {
    padding: 12,
    overflowY: "auto",
    maxHeight: "100%",
    fontFamily: "system-ui, sans-serif",
    color: "#e0e0e0",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    opacity: 0.9,
  },
  summary: {
    fontSize: 12,
    marginBottom: 10,
    opacity: 0.8,
    color: "#aaa",
  },
};

export function TracePanel({ frames }: { frames: ExecutionFrame[] }) {
  const summary = getSummary(frames);

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Execution Timeline</div>

      {summary && (
        <div style={styles.summary}>
          Last: {summary}
        </div>
      )}

      {frames.length === 0 ? (
        <div style={{ opacity: 0.5, fontSize: 12 }}>No execution yet</div>
      ) : (
        [...frames]
          .reverse()
          .map((frame) => <TraceEventCard key={frame.id} frame={frame} />)
      )}
    </div>
  );
}
