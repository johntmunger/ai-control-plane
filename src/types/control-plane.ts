// for kernel and orchestrator
export type KernelInput =
  | { type: "tool"; tool: string; arguments: any }
  | { type: "chat"; message: string }
  | { type: "refusal"; reason?: string };
