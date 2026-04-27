import { useEffect, useRef, useState, type ReactElement } from "react";
import type { CSSProperties } from "react";
import type { ExecutionFrame } from "../runtime/frames";
import { extractResult } from "../utils/extractResult";
import { stableStringify } from "../utils/stableStringify";

const mono: CSSProperties = { fontFamily: "ui-monospace, monospace" };

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
    cursor: "default",
    fontSize: 13,
  },
  headerTitle: {
    flex: 1,
    cursor: "pointer",
    minWidth: 0,
  },
  expandBtn: {
    flexShrink: 0,
    background: "transparent",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    padding: "2px 6px",
    fontSize: 12,
    lineHeight: 1,
  },
  body: {
    padding: "8px 12px 12px",
    borderTop: "1px solid #333",
    fontSize: 12,
  },
  detailsToggle: {
    fontSize: 11,
    opacity: 0.75,
    cursor: "pointer",
    userSelect: "none",
    marginBottom: 8,
    padding: "4px 0",
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeString(v: unknown): string {
  return v === undefined ? "undefined" : JSON.stringify(v);
}

const diffRowStyle: CSSProperties = {
  opacity: 1,
  background: "#1f3d1f",
  padding: "2px 4px",
  borderRadius: 4,
  marginBottom: 4,
  fontSize: 11,
};

/**
 * Keys that differ or exist on only one side (added / removed).
 * Unchanged keys in both objects are omitted.
 */
function buildDiffRows(
  raw: Record<string, unknown>,
  normalized: Record<string, unknown>,
): ReactElement[] {
  return Object.keys({ ...raw, ...normalized })
    .map((key) => {
      const hasBefore = key in raw;
      const hasAfter = key in normalized;
      const before = raw[key];
      const after = normalized[key];

      const equal = stableStringify(before) === stableStringify(after);

      let type: "changed" | "added" | "removed";
      if (hasBefore && hasAfter) {
        if (equal) return null;
        type = "changed";
      } else if (!hasBefore && hasAfter) {
        type = "added";
      } else {
        type = "removed";
      }

      return (
        <div key={key} style={diffRowStyle}>
          <strong style={{ color: "#ddd" }}>{key}:</strong>{" "}
          {type === "added" && (
            <>
              <span style={{ color: "#52c41a", fontWeight: 500, ...mono }}>
                + {safeString(after)}
              </span>
              <span style={{ opacity: 0.6 }}> (added)</span>
            </>
          )}
          {type === "removed" && (
            <>
              <span style={{ color: "#ff7875", fontWeight: 500, ...mono }}>
                − {safeString(before)}
              </span>
              <span style={{ opacity: 0.6 }}> (removed)</span>
            </>
          )}
          {type === "changed" && (
            <>
              <span style={{ color: "#999", ...mono }}>{safeString(before)}</span>
              {" → "}
              <span style={{ color: "#52c41a", ...mono }}>{safeString(after)}</span>
            </>
          )}
        </div>
      );
    })
    .filter((node): node is ReactElement => node != null);
}

export function TraceEventCard({
  frame,
  previousFrame,
  selected,
  onSelect,
}: {
  frame: ExecutionFrame;
  /** Previous frame in the full execution timeline (unfiltered order). */
  previousFrame?: ExecutionFrame;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [flash, setFlash] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) {
      cardRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setFlash(false);
      return;
    }
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 400);
    return () => clearTimeout(t);
  }, [selected]);

  useEffect(() => {
    if (!selected || frame.status === "committed") return;

    function onToggleDetails() {
      setOpen((v) => !v);
    }

    window.addEventListener("trace:toggleDetails", onToggleDetails);
    return () =>
      window.removeEventListener("trace:toggleDetails", onToggleDetails);
  }, [selected, frame.status]);

  const headerSelectedBg = selected ? "#1f2a3a" : undefined;
  const flashOutline: CSSProperties = flash
    ? { boxShadow: "0 0 0 1px #3b82f6 inset" }
    : {};

  if (frame.status === "committed") {
    return (
      <div
        ref={cardRef}
        style={{
          ...styles.card,
          ...flashOutline,
          opacity: 0.7,
          border: "1px dashed #555",
          fontSize: 12,
        }}
      >
        <div
          style={{
            ...styles.header,
            cursor: onSelect ? "pointer" : "default",
            background: headerSelectedBg,
          }}
          onClick={() => onSelect?.()}
          onKeyDown={(e) => {
            if (!onSelect) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
        >
          Run {frame.step} — <strong>output</strong> 📦
        </div>

        <div style={styles.body}>
          <div style={{ opacity: 0.85 }}>
            Output (from Run {previousFrame?.step ?? "—"})
          </div>
        </div>
      </div>
    );
  }

  const status = frame.status;
  const isError = status === "failed";
  const isSuccess = status === "resolved";

  const rawArgs = frame.tool?.rawArgs;
  const normalizedArgs = frame.tool?.normalizedArgs;

  const rawRecord = isPlainObject(rawArgs) ? rawArgs : null;
  const normalizedRecord = isPlainObject(normalizedArgs) ? normalizedArgs : null;
  const canKeyDiff = rawRecord !== null && normalizedRecord !== null;

  const diffRows =
    canKeyDiff && rawRecord && normalizedRecord
      ? buildDiffRows(rawRecord, normalizedRecord)
      : [];
  const diffEmpty = canKeyDiff && diffRows.length === 0;

  const hasJsonDetails =
    frame.tool?.rawArgs != null || frame.tool?.normalizedArgs != null;

  return (
    <div
      ref={cardRef}
      style={{
        ...styles.card,
        ...flashOutline,
        borderColor: isError ? "#ff4d4f" : isSuccess ? "#52c41a" : "#333",
      }}
    >
      {/* HEADER: title selects step; chevron expands/collapses only */}
      <div
        style={{
          ...styles.header,
          background: headerSelectedBg,
        }}
      >
        <div
          style={{
            ...styles.headerTitle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect?.();
            }
          }}
        >
          <div>
            Run {frame.step} — <strong>{frame.tool?.name ?? "output"}</strong>
            {frame.tool?.durationMs != null &&
              ` (${frame.tool.durationMs}ms)`}
          </div>

          <div>
            {isError && "❌"}
            {isSuccess && "✅"}
            {!isError && !isSuccess && "⏳"}
          </div>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Collapse step details" : "Expand step details"}
          style={styles.expandBtn}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {open ? "▼" : "▶"}
        </button>
      </div>

      {/* BODY: diff signal → optional details (raw / normalized JSON) → result / error */}
      {open && (
        <div style={styles.body}>
          {canKeyDiff && rawRecord && normalizedRecord && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4 }}>
                Normalization (diff)
                {diffEmpty ? (
                  <span style={{ opacity: 0.6 }}> — No changes</span>
                ) : null}
              </div>
              {!diffEmpty ? diffRows : null}
            </div>
          )}

          {hasJsonDetails && (
            <>
              <div
                role="button"
                tabIndex={0}
                style={styles.detailsToggle}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails((v) => !v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDetails((v) => !v);
                  }
                }}
              >
                {showDetails ? "▼" : "▶"} details{" "}
                <span style={{ opacity: 0.6 }}>(Enter)</span>
              </div>

              {showDetails && (
                <>
                  {frame.tool?.rawArgs != null && (
                    <Block label="rawArgs" value={frame.tool.rawArgs} />
                  )}

                  {canKeyDiff && frame.tool?.normalizedArgs != null && (
                    <Block
                      label="normalizedArgs"
                      value={frame.tool.normalizedArgs}
                    />
                  )}

                  {frame.tool?.normalizedArgs != null && !canKeyDiff && (
                    <Block
                      label="Normalization (diff)"
                      value={frame.tool.normalizedArgs}
                    />
                  )}
                </>
              )}
            </>
          )}

          {frame.tool?.result !== undefined && (
            <Block label="result" value={extractResult(frame.tool.result)} />
          )}

          {frame.tool?.error && (
            <Block label="error" value={frame.tool.error} error />
          )}
        </div>
      )}
    </div>
  );
}

function Block({
  label,
  value,
  error,
}: {
  label: string;
  value: unknown;
  error?: boolean;
}) {
  return (
    <div style={{ marginBottom: 8, color: error ? "#ff6b6b" : "#ccc" }}>
      <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
