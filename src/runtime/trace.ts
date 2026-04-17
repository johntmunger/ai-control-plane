export type TraceEvent =
  | { type: "planner"; decision: string }
  | { type: "tool_invocation"; tool: string; args: any }
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
      result?: any;
      duration?: number;
      error?: {
        type: string;
        message: unknown;
        details?: any;
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
