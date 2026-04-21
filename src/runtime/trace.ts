export type TraceEvent =
  | { type: "planner"; decision: string }
  | { type: "tool_invocation"; tool: string; rawArgs: unknown }
  | {
      type: "tool_normalization";
      tool: string;
      rawArgs: unknown;
      normalizedArgs: unknown;
      normalizationApplied: boolean;
    }
  | {
      type: "enforcement";
      action: "refuse" | "allow";
    }
  | {
      type: "enforcement";
      tool: string;
      decision: "allow" | "deny";
      reason: string | null;
    }
  | {
      type: "tool_result";
      tool: string;
      status: "success";
      result: unknown;
      duration: number;
    }
  | {
      type: "tool_result";
      tool: string;
      status: "error";
      duration?: number;
      error: {
        type: string;
        message: string;
        details?: unknown;
        normalizedArgs?: unknown;
      };
    }
  | { type: "kernel_output"; outputType: "chat" | "refusal" | "tool" };

export type TraceContext = {
  events: TraceEvent[];
  push: (event: TraceEvent) => void;
};

export function createTrace(): TraceContext {
  const events: TraceEvent[] = [];

  return {
    events,
    push: (event) => events.push(event),
  };
}
