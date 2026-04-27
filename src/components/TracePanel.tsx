import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { ExecutionFrame } from "../runtime/frames";
import { extractResult } from "../utils/extractResult";
import { StepInspector } from "./StepInspector";
import { TraceEventCard } from "./TraceEventCard";

/** Last execution step — skips trailing commit-only frame for targeting selection/summary. */
function getLastActionableFrame(frames: ExecutionFrame[]) {
  if (!frames.length) return null;

  const last = frames[frames.length - 1];

  if (last.status === "committed") {
    return frames[frames.length - 2] ?? null;
  }

  return last;
}

function getSummary(frames: ExecutionFrame[]) {
  if (!frames.length) return null;

  const step = getLastActionableFrame(frames);

  if (!step) return null;

  const toolName = step.tool?.name ?? "output";

  if (step.tool?.result) {
    const result = extractResult(step.tool.result);

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

type StatusFilter = "all" | "success" | "error";

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "error", label: "Errors" },
];

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    height: "100%",
    minHeight: 0,
    fontFamily: "system-ui, sans-serif",
    color: "#e0e0e0",
  },
  timeline: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto",
    padding: 12,
    paddingRight: 8,
    outline: "none",
  },
  inspector: {
    width: 320,
    flexShrink: 0,
    borderLeft: "1px solid #333",
    padding: 12,
    background: "#111",
    overflowY: "auto",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    opacity: 0.9,
  },
  summaryInteractive: {
    fontSize: 12,
    marginBottom: 10,
    opacity: 0.8,
    color: "#aaa",
    cursor: "pointer",
    userSelect: "none",
  },
  filters: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  filterBtn: {
    background: "#222",
    color: "#ccc",
    border: "1px solid #333",
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
};

export function TracePanel({ frames }: { frames: ExecutionFrame[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timelineFocused, setTimelineFocused] = useState(false);
  const summary = getSummary(frames);
  const lastActionableFrame = getLastActionableFrame(frames);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const selectableIds = frames.map((f) => f.id);
  const currentIndex =
    selectedId != null ? selectableIds.indexOf(selectedId) : -1;

  function selectByIndex(idx: number) {
    if (idx < 0 || idx >= selectableIds.length) return;
    setSelectedId(selectableIds[idx]);
  }

  function selectNext() {
    if (currentIndex === -1) return;
    selectByIndex(Math.min(currentIndex + 1, selectableIds.length - 1));
  }

  function selectPrev() {
    if (currentIndex === -1) return;
    selectByIndex(Math.max(currentIndex - 1, 0));
  }

  function selectFirst() {
    selectByIndex(0);
  }

  function selectLast() {
    const last = getLastActionableFrame(frames);
    if (last) setSelectedId(last.id);
    else selectByIndex(selectableIds.length - 1);
  }

  function onTimelineKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectNext();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectPrev();
    } else if (e.key === "Home") {
      e.preventDefault();
      selectFirst();
    } else if (e.key === "End") {
      e.preventDefault();
      selectLast();
    } else if (e.key === "Enter") {
      const el = e.target as HTMLElement;
      if (el.closest("button") || el.closest('[role="button"]')) return;
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("trace:toggleDetails"));
    }
  }

  useEffect(() => {
    if (selectedId) return;

    const target = getLastActionableFrame(frames);
    const fallback = frames[frames.length - 1]?.id ?? null;

    if (target?.id) setSelectedId(target.id);
    else if (fallback) setSelectedId(fallback);
  }, [frames, selectedId]);

  /** Full-timeline index by id — never use filtered order for causal links. */
  const frameIndexById = new Map(
    frames.map((f, i) => [f.id, i] as const),
  );

  const selectedFrame =
    selectedId != null
      ? (frames.find((f) => f.id === selectedId) ?? null)
      : null;

  const selectedIdx =
    selectedId != null ? frameIndexById.get(selectedId) : undefined;
  const inspectorPreviousFrame =
    selectedIdx !== undefined && selectedIdx > 0
      ? frames[selectedIdx - 1]
      : undefined;

  const counts = {
    all: frames.length,
    success: frames.filter((f) => f.status === "resolved").length,
    error: frames.filter((f) => f.status === "failed").length,
  };

  const filteredFrames = frames.filter((frame, i) => {
    if (filter === "all") return true;

    if (filter === "success") {
      if (frame.status === "resolved") return true;
      if (
        frame.status === "committed" &&
        frames[i - 1]?.status === "resolved"
      ) {
        return true;
      }
      return false;
    }

    if (filter === "error") {
      return frame.status === "failed";
    }

    return true;
  });

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.timeline,
          boxShadow: timelineFocused
            ? "inset 0 0 0 1px #3b82f6"
            : undefined,
        }}
        tabIndex={0}
        onFocusCapture={() => setTimelineFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setTimelineFocused(false);
          }
        }}
        onKeyDown={onTimelineKeyDown}
      >
        <div style={styles.title}>Execution Timeline</div>

        {summary && lastActionableFrame && (
          <div
            role="button"
            tabIndex={0}
            style={styles.summaryInteractive}
            onClick={() => setSelectedId(lastActionableFrame.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setSelectedId(lastActionableFrame.id);
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
          >
            Last Run: {summary}
            <span style={{ opacity: 0.6, marginLeft: 6 }}>(jump)</span>
          </div>
        )}

        {frames.length > 0 && (
          <div style={styles.filters}>
            {FILTER_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                style={{
                  ...styles.filterBtn,
                  opacity: filter === key ? 1 : 0.5,
                }}
              >
                {label} ({counts[key]})
              </button>
            ))}
          </div>
        )}

        {frames.length === 0 ? (
          <div style={{ opacity: 0.5, fontSize: 12 }}>No execution yet</div>
        ) : filteredFrames.length === 0 ? (
          <div style={{ opacity: 0.5, fontSize: 12 }}>
            No frames match this filter
          </div>
        ) : (
          filteredFrames.map((frame) => {
            const idx = frameIndexById.get(frame.id);
            const previousFrame =
              idx !== undefined && idx > 0 ? frames[idx - 1] : undefined;

            return (
              <TraceEventCard
                key={frame.id}
                frame={frame}
                previousFrame={previousFrame}
                selected={selectedId === frame.id}
                onSelect={() => setSelectedId(frame.id)}
              />
            );
          })
        )}
      </div>

      <div style={styles.inspector}>
        <StepInspector
          frame={selectedFrame}
          previousFrame={inspectorPreviousFrame}
        />
      </div>
    </div>
  );
}
