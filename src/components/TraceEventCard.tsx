import { useState } from "react";

export function TraceEventCard({ event, index }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.card}>
      <div style={styles.header} onClick={() => setOpen(!open)}>
        <div>
          #{index + 1} — <strong>{getLabel(event)}</strong>
        </div>
        <div>{open ? "−" : "+"}</div>
      </div>

      {open && (
        <div style={styles.body}>
          <pre>{formatEvent(event)}</pre>
        </div>
      )}
    </div>
  );
}

function getLabel(event: any) {
  switch (event.type) {
    case "planner":
      return "Planner";

    case "enforcement": {
      if (typeof event.action === "string") {
        return `Enforcement (${event.action})`;
      }
      if (typeof event.decision === "string" && typeof event.tool === "string") {
        return `Enforcement (${event.tool}: ${event.decision})`;
      }
      return "Enforcement";
    }

    case "tool_invocation":
      return `Tool: ${event.tool}`;

    case "tool_normalization":
      return `Normalize: ${event.tool}`;

    case "tool_result":
      if (event.status === "success" && typeof event.duration === "number") {
        return `Result (${event.duration}ms)`;
      }
      if (event.status === "error") {
        return "Result (error)";
      }
      return "Result";

    case "kernel_output":
      return `Output: ${event.outputType}`;

    default:
      return event.type;
  }
}

function formatEvent(event: any) {
  return JSON.stringify(event, null, 2);
}

const styles = {
  panel: {
    marginTop: 20,
    padding: 16,
    border: "1px solid #333",
    borderRadius: 8,
    background: "#111",
    color: "#eee",
  },

  title: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 10,
  },

  card: {
    border: "1px solid #333",
    borderRadius: 6,
    marginBottom: 10,
  },

  header: {
    padding: 10,
    cursor: "pointer",
    background: "#222",
    display: "flex",
    justifyContent: "space-between",
  },

  body: {
    padding: 10,
    background: "#000",
    fontSize: 12,
  },
};
