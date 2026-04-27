import { useEffect, useRef, useState } from "react";
import { TracePanel } from "../src/components/TracePanel";
import type { ExecutionFrame } from "../src/runtime/frames";
import { FrameReducer } from "../src/runtime/frameReducer";
import { executeKernel } from "../src/runtime/kernel";
import { createTrace } from "../src/runtime/trace";
import { registerToolPack } from "../src/tools/registry";
import { addTool } from "../src/tools/core/add";

function registerCorePackOnce() {
  try {
    registerToolPack({
      name: "core",
      tools: [addTool],
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("already registered")
    ) {
      return;
    }
    throw err;
  }
}

export function TestRuntime() {
  const [frames, setFrames] = useState<ExecutionFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    (async () => {
      try {
        registerCorePackOnce();

        const trace = createTrace();

        const runs = [
          { label: "Validation Error", args: { a: "five", b: "2" } },
          { label: "Success", args: { a: "5", b: "2" } },
        ] as const;

        for (const run of runs) {
          await executeKernel(
            {
              type: "tool",
              tool: "core.add",
              arguments: run.args,
            },
            trace,
          );
        }

        if (cancelled) return;

        const reducer = new FrameReducer();
        for (const event of trace.events) {
          reducer.applyEvent(event);
        }
        setFrames(reducer.getFrames());
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        minHeight: "100vh",
        background: "#111",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {error != null && error !== "" && (
        <div style={{ color: "#ff6b6b", padding: 12, fontSize: 13 }}>
          {error}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <TracePanel frames={frames} />
      </div>
    </div>
  );
}
