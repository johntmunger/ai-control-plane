# Design Decisions

This document explains the architectural decisions behind the AI Control Plane runtime.

Rather than focusing only on implementation, it describes **why the system is structured the way it is**.

The design prioritizes:

- safety
- modularity
- extensibility
- clear separation of responsibilities

---

# 1. Layered Runtime Architecture

The runtime uses a layered architecture:

```
Transport
   ↓
Orchestrator (planner + intent + enforcement → KernelInput)
   ↓
Policy
   ↓
Kernel (executeKernel)
   ↓
Tools
   ↓
External Systems
```

Each layer performs **one specific responsibility**.

Benefits:

- easier debugging
- clearer mental model
- safe execution boundaries
- independent extensibility

---

# 2. Kernel as the Execution and Output Boundary

The **kernel acts as the execution firewall** and, via **`executeKernel`**, as the **single output authority** for the unified `KernelInput` contract.

All tool calls must pass through the kernel (`handleKernelRequest`). Chat and refusal paths also pass through **`executeKernel`**, so transports do not return raw planner strings as the final payload.

Responsibilities of the kernel:

- request validation
- tool resolution
- argument validation
- execution timeout protection
- error normalization
- invocation logging
- structured emission of chat / refusal / tool results

Example protections implemented:

- Zod schema validation
- tool execution timeouts
- structured error responses

This ensures that **no unsafe code path can execute outside the kernel**, and **no user-visible response is finalized without passing through this boundary**.

---

# 3. Policy Layer for Governance

Policy is separated from execution.

```
Orchestrator → Policy → Kernel
```

The policy layer exists to enforce:

- tool allowlists
- system safety rules
- capability restrictions
- operational modes (safe mode)

Example rule:

```
ALLOWED_TOOLS = [
  "echo",
  "add",
  "sleep",
  "searchDocuments"
]
```

Separating policy allows the system to enforce governance **without modifying the kernel**.

---

# 4. Tool Registry for Extensibility

Tools are registered dynamically through a central registry.

Location:

```
src/tools/index.ts
```

Example registry:

```
echo
add
sleep
searchDocuments
```

Benefits:

- new tools can be added without modifying the kernel
- tools remain modular
- tool packs can evolve independently

This design mirrors capability systems used in:

- Claude MCP
- plugin architectures
- microservice capability registries

---

# 5. Tool Packs Instead of Monolithic Capabilities

Tools are grouped into **tool packs** by domain.

Example:

```
src/tools
├─ core
│   ├─ echo
│   ├─ add
│   └─ sleep
│
└─ rag
    └─ searchDocuments
```

Future tool packs may include:

```
repo-tools
ci-tools
analysis-tools
external-api-tools
```

This prevents the runtime from becoming a **monolithic capability system**.

---

# 6. External Knowledge Systems

The runtime does not store knowledge internally.

Instead, knowledge systems live in separate repositories.

Example:

```
rag-mdn
```

Responsibilities of the RAG system:

- crawl documentation
- chunk documents
- generate embeddings
- store vectors
- perform similarity search

Runtime tools simply call into these systems.

Benefits:

- decoupled architecture
- independent scaling
- independent iteration

---

# 7. Agent Loop for Reasoning

The runtime uses a simplified **ReAct agent loop**, with **enforcement**: the planner proposes; the orchestrator may classify **intent** when the planner returns text and must not allow “final answers” that bypass required tool work.

```
prompt
   ↓
planner (proposal only)
   ↓
intent / enforcement (when outcome is text)
   ↓
KernelInput
   ↓
executeKernel
   ↓
tool call (when applicable) / structured response
   ↓
observation
   ↓
repeat
```

This allows the system to:

- perform multi-step reasoning
- gather information through tools
- refine responses iteratively
- reject planner bypass when a tool was required

The orchestrator manages this loop and builds **`KernelInput`** for each turn.

---

# 8. Zod for Runtime Validation

TypeScript provides compile-time safety.

However, runtime inputs still require validation.

Zod provides:

- runtime schema validation
- structured error reporting
- consistent input contracts

Example:

```
const SearchSchema = z.object({
  query: z.string().min(3),
  limit: z.number().optional()
})
```

Benefits:

- prevents malformed tool requests
- prevents runtime crashes
- ensures strict tool contracts

---

# 9. STDIO Transport for Simplicity

The runtime currently uses STDIO.

Location:

```
src/transport/stdio.ts
```

Reasons:

- minimal infrastructure
- easy local testing
- compatible with MCP-style runtimes
- avoids HTTP overhead

Future transports may include:

```
HTTP API
WebSocket transport
gRPC transport
```

---

# 10. Structured Error Handling

All runtime errors are normalized.

Location:

```
src/utils/errors.ts
```

Supported error types:

```
validation_error
unknown_tool
timeout
execution_error
policy_violation
```

Example error response:

```
{
  "error": {
    "type": "validation_error",
    "message": "query must be >= 3 characters"
  }
}
```

Structured errors allow:

- predictable client behavior
- easier debugging
- consistent logging

---

# 11. Logging for Observability

The runtime logs tool invocations.

Example:

```
{
  "type": "invocation",
  "tool": "searchDocuments",
  "timestamp": 123456
}
```

This enables future observability features:

- tracing
- debugging
- audit trails
- usage analytics

---

# 12. Why This Architecture

The architecture was designed to solve common problems in AI systems:

| Problem                   | Solution             |
| ------------------------- | -------------------- |
| unsafe tool execution     | kernel boundary      |
| uncontrolled capabilities | policy layer         |
| monolithic systems        | modular tool packs   |
| tightly coupled knowledge | external RAG systems |
| hard to extend agents     | tool registry        |
| planner bypass / dual output authority | intent + orchestrator enforcement + `executeKernel` |

The result is a **minimal AI control plane runtime** that can scale into a full agent platform.

---

# 13. Intent as a Control Signal

**Intent** answers: *what kind of request is this?* (for example, whether **tool execution is required**), instead of assuming that whatever string the model returns is acceptable.

`classifyIntent` produces a small structured signal (`requiresTool`, `type`). That signal is used when the planner returns **plain text** so the runtime can refuse or route consistently rather than leaking an unvalidated “final answer.”

---

# 14. Orchestrator as the Enforcement Layer

The orchestrator **does not** treat arbitrary model text as a successful completion when intent says a tool was required. In that case it produces a structured **`KernelInput`** of type refusal (for example `tool_required_but_not_used`) instead of returning the model string.

This removes **dual authority** (model vs system) for tool-required tasks: the model proposes; the system enforces.

---

# 15. Kernel as Execution + Output Authority

**`KernelInput`** is the only contract between the orchestrator and the emission layer. **`executeKernel`** turns that contract into user-visible structured results (tool execution envelope, chat payload, or refusal payload).

Design consequence: transports and CLIs should use **`orchestrate` → `executeKernel`**, not `orchestrate` alone, when emitting responses to users.

---

# Future Improvements

## Model Integration

Replace mock planner with real models:

```
Claude
GPT
Gemini
```

---

## Agent Memory

Persistent memory systems:

```
conversation history
task state
context persistence
```

---

## Tool Ecosystem

Additional tool packs:

```
repository analysis
CI automation
external APIs
data pipelines
```

---

# Summary

The AI Control Plane runtime follows several guiding principles:

- layered architecture
- safe execution boundaries
- modular capability design
- external knowledge systems
- extensible agent tooling

These design decisions make the system suitable as the foundation for a **scalable AI agent platform**.
