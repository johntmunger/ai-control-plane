import type { TraceEvent } from "./trace";
import type { ExecutionFrame } from "./frames";

export class FrameReducer {
  private frames: ExecutionFrame[] = [];

  getFrames() {
    return this.frames;
  }

  applyEvent(event: TraceEvent) {
    const current = this.frames[this.frames.length - 1];

    const attachEvent = (frame?: ExecutionFrame) => {
      if (!frame) return;

      if (!frame.traceEvents) {
        frame.traceEvents = [];
      }

      frame.traceEvents.push(event);
    };

    switch (event.type) {
      case "tool_invocation": {
        this.frames.push({
          id: crypto.randomUUID(),
          step: this.frames.length + 1,
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
            message: event.error.message,
            details: event.error.details,
          };
        }

        break;
      }

      case "kernel_output": {
        this.frames.push({
          id: crypto.randomUUID(),
          step: this.frames.length + 1,
          status: "committed",

          traceEvents: [event],

          output: {
            type: event.outputType,
          },
        });

        break;
      }

      case "planner": {
        // planner exists in telemetry
        // we'll decide later how to visualize it
        break;
      }
    }
  }
}