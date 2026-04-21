import type { TraceEvent } from "./trace";
import type { ExecutionFrame } from "./frames";

export class FrameReducer {
  private frames: ExecutionFrame[] = [];

  getFrames() {
    return this.frames;
  }

  applyEvent(event: TraceEvent) {
    const current = this.frames[this.frames.length - 1];

    switch (event.type) {
      case "tool_invocation": {
        this.frames.push({
          id: crypto.randomUUID(),
          step: this.frames.length + 1,
          status: "pending",
          plan: { decision: event.tool },
          tool: {
            name: event.tool,
            rawArgs: event.rawArgs,
          },
        });
        break;
      }

      case "enforcement": {
        if (!current) break;

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

        current.tool.normalizedArgs = event.normalizedArgs;
        break;
      }

      case "tool_result": {
        if (!current?.tool) break;

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
          output: {
            type: event.outputType,
          },
        });
        break;
      }
    }
  }
}
