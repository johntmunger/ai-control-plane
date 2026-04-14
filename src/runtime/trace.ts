export type TraceEvent =
  | { type: "planner"; decision: string }
  | { type: "tool_invocation"; tool: string; args: any }
  | { type: "tool_result"; tool: string; result: any; duration: number }
  | { type: "kernel_output"; outputType: "chat" | "refusal" }
  | { type: "enforcement"; action: "refuse" | "allow" };

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
