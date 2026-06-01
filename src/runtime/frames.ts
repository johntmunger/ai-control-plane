import type { TraceEvent } from "./trace";

export type FrameStatus =
  | "pending"
  | "executing"
  | "resolved"
  | "failed"
  | "committed";

export type ExecutionFrame = {
  id: string;
  step: number;
  status: FrameStatus;

  traceEvents?: TraceEvent[];

  plan?: {
    decision?: string;
  };

  enforcement?: {
    decision: "allow" | "deny";
    reason?: string | null;
  };

  tool?: {
    name: string;

    rawArgs?: unknown;
    normalizedArgs?: unknown;

    result?: unknown;
    error?: {
      type: string;
      message: string;
      details?: unknown;
    };

    durationMs?: number;
  };

  output?: {
    type: "tool" | "chat" | "refusal";
  };
};

export function buildFrames(events: TraceEvent[]): ExecutionFrame[] {
  const frames: ExecutionFrame[] = [];

  for (const event of events) {
    const current = frames[frames.length - 1];

    const attachEvent = (frame?: ExecutionFrame) => {
      if (!frame) return;
    
      if (!frame.traceEvents) {
        frame.traceEvents = [];
      }
    
      frame.traceEvents.push(event);
    };

    switch (event.type) {
      case "tool_invocation": {
        frames.push({
          id: crypto.randomUUID(),
          step: frames.length + 1,
          status: "pending",
        
          traceEvents: [event],
        
          plan: {
            decision: event.tool,
          },
        
          tool: {
            name: event.tool,
            rawArgs: event.rawArgs,
          },
        });
        break;
      }

      case "enforcement": {
        if (!current) break;

        attachEvent(current);

        if ("decision" in event) {
          current.enforcement = {
            decision: event.decision,
            reason: event.reason ?? null,
          };

          if (event.decision === "deny") {
            current.status = "failed";
          }
        }

        break;
      }

      case "tool_normalization": {
        if (!current?.tool) break;
      
        attachEvent(current);
      
        current.tool.normalizedArgs = event.normalizedArgs;
        break;
      }

      case "tool_result": {
        if (!current?.tool) break;
      
        attachEvent(current);

        if (event.status === "success") {
          current.status = "resolved";
          current.tool.result = event.result;
          current.tool.durationMs = event.duration;
        } else {
          current.status = "failed";
          current.tool.error = {
            type: event.error.type,
            message: event.error.message ?? "Unknown error",
            details: event.error.details,
          };
        }

        break;
      }

      case "kernel_output": {
        frames.push({
          id: crypto.randomUUID(),
          step: frames.length + 1,
          status: "committed",
      
          traceEvents: [event],
      
          output: {
            type: event.outputType,
          },
        });
      
        break;
      }
    }
  }

  return frames;
}
