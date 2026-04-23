# Changelog

> This project evolves an AI runtime from basic tool execution into a controlled, failure-aware system designed for production-grade reliability.

All notable changes to the AI Control Plane Runtime will be documented in this file.

## v0.8 — Execution Frames + Runtime Devtools

### Added

- Introduced **ExecutionFrames** as a first-class runtime abstraction
- Added **FrameReducer** for deterministic state reconstruction from trace events
- Built **TracePanel v2** (devtools-style timeline UI)
- Added **TestRuntime** for browser-based execution and inspection
- Introduced Vite-powered UI runtime for control-plane visualization

### Changed

- Refactored UI from **event-based → frame-based rendering**
- Kernel now owns **argument normalization and validation boundaries**
- Error contract standardized (validation, deterministic, transient)

### Improved

- Real-time streaming execution via `onEvent` → reducer → React state
- Clear execution lifecycle visualization:
  - pending → resolved/failed → committed
- Execution summary header for quick inspection of latest result

### Architecture

- Established pattern:
  Kernel → emit(event) → FrameReducer → ExecutionFrames → UI
- Removed reliance on trace replay for UI state
- Separated runtime lifecycle from React lifecycle (Strict Mode safe)

### Notes

- TracePanel now represents **execution state**, not raw events
- Commit frames (`kernel_output`) represent system boundary transitions
- UI acts as a **runtime debugger**, not just a log viewer

## 🚀 v0.7.0 — Deterministic Execution + Observable State Foundation

### ✨ Summary

This release establishes the control-plane as a **deterministic, observable execution system**, with the kernel as the single authority for transformation, validation, and execution.

### 🔧 Core Changes

#### 🔒 Kernel Authority Restored

- Moved all normalization inside the kernel
- Eliminated pre-kernel mutation paths
- Ensures all execution behavior passes through a single controlled boundary

#### 🔄 Explicit Normalization Stage

- Introduced `tool_normalization` trace event
- Captures `rawArgs → normalizedArgs` transformations
- Supports both transforming and no-op normalization (`normalizationApplied`)

#### 🧱 Structured Error Contract

- Centralized error handling via `normalizeError`
- Enforced consistent error shape:
  - `type`
  - `message`
  - optional `details`

- Removed raw/ambiguous error propagation from runtime

#### 🧭 Trace as System Invariant

- Trace now reflects **actual execution only**
- Eliminated synthetic or inferred responses
- Full lifecycle visibility:
  - invocation → enforcement → normalization → result → output

#### 🧩 Execution Frames Introduced

- Added `ExecutionFrame` as state representation of execution steps
- Frames model system state instead of reconstructing from logs

#### ⚙️ FrameReducer (Streaming-Ready)

- Implemented event-driven reducer:
  - `TraceEvent → Frame state`

- Enables incremental state updates (foundation for real-time UI)

---

### ✅ Guarantees Established

- No execution without validation
- No output without successful execution
- All transformations are observable
- All errors are structured and deterministic
- State is derived from events, not inferred

---

### 🧠 Architectural Impact

- Elevates trace from debugging tool → **system invariant**
- Establishes kernel as:
  - execution authority
  - transformation boundary
  - validation gate

- Separates:
  - raw input (`rawArgs`)
  - transformed input (`normalizedArgs`)
  - validated execution

---

### 🔥 Why This Matters

The system now:

> **Does not just execute — it explains its behavior with complete fidelity**

This forms the foundation for:

- streaming execution
- devtools-style inspection
- multi-step agent orchestration
- deterministic replay and debugging

🚀 Next
Wire FrameReducer directly into kernel
Enable real-time frame streaming (no replay loop)
Introduce devtools-style execution timeline

---

#### feat(control-plane): enforce validation-gated execution, explicit normalization stage, and namespaced tool registry

This release strengthens the control-plane runtime by making execution correctness, observability, and tool resolution fully deterministic and auditable.

---

#### ✨ Added

- **Explicit normalization stage in kernel execution**
  - Introduced `tool_normalization` trace event
  - Captures transformation from `rawArgs` → `normalizedArgs`
  - Preserves immutable planner input via argument snapshotting

- **Structured validation error surface**
  - Replaced raw error stacks with deterministic, serializable error objects
  - Includes:
    - `type`, `message`
    - structured `details` (path, code, message)
    - `normalizedArgs` context for debugging

- **Namespaced tool registry (`registerToolPack`)**
  - Tools are registered under domain namespaces (e.g. `core.add`)
  - Aligns runtime with multi-domain and MCP-compatible architecture

---

#### 🔄 Changed

- **Kernel execution model**
  - Validation now enforced via `safeParse` (no exception-driven flow)
  - Execution is strictly gated:
    - invalid input → no tool execution
    - no `kernel_output` emitted on failure

  - `tool_result` standardized to:
    - `{ status: "success" | "error" }`

- **Trace model upgraded to execution narrative**
  - Trace now reflects actual lifecycle stages:
    - `tool_invocation → enforcement → tool_normalization → tool_result → kernel_output`

  - Removed ambiguity between raw and transformed inputs
  - Eliminated stack traces and non-deterministic error output

- **Test harness alignment**
  - Test execution now routed through `executeKernel`
  - Eliminates simulated trace paths in favor of real runtime behavior

---

#### 🔒 Guarantees Established

- No execution without validation
- No output without successful execution
- All argument transformations are observable
- All failures are explicit, structured, and replayable
- Trace reflects **actual execution**, not inferred or simulated behavior

---

#### 🧠 Architectural Impact

- Elevates trace from debugging artifact → **system invariant**
- Establishes kernel as:
  - execution authority
  - validation gate
  - source of truth for all runtime behavior

- Introduces clear separation between:
  - planner intent (`rawArgs`)
  - kernel transformation (`normalizedArgs`)
  - validated execution (`parsedArgs`)

---

#### 🔥 Why This Matters

This release ensures the system does not merely execute—it **explains itself with complete fidelity**.

Failures are no longer ambiguous, transformations are no longer hidden, and execution boundaries are strictly enforced.

> The runtime is now not only observable, but _trustworthy by construction_.

---

#### 🚀 Next

- Introduce **ExecutionFrames** as a first-class runtime structure
  - replacing event reconstruction with direct state representation
  - enabling devtools-style inspection and streaming execution visibility

### 🚀 v0.6.0 — Flexible Argument Extraction + Planner/Kernel Alignment

#### feat(runtime): enable partial argument extraction while preserving strict planner guarantees

This release resolves a key mismatch between planner strictness and kernel normalization, allowing the system to handle natural language inputs (e.g. `"Add 3 and four"`) without weakening control-plane guarantees.

---

#### ✨ Added

- **`extractPartial(prompt)`**
  - Extends `extractNumbers` to support:
    - digit inputs (`3`, `11`)
    - word-based numbers (`one`–`twenty`)
    - mixed inputs (`3 and four`)
  - Falls back to string tokens to allow kernel normalization or validation failure

- **`hasTwoResolvableAddends(prompt)`**
  - Ensures intent heuristics remain conservative while enabling flexible parsing

---

#### 🔄 Changed

- **Orchestrator**
  - Always routes `core.add` when `intent.tool === "core.add"`
  - No longer blocks tool execution based on digit-only parsing

- **Intent layer**
  - Supports optional `tool` field
  - Preserves structured tool outputs from model responses
  - Infers `core.add` from mixed-format prompts

---

#### 🧠 Architectural Impact

- Shifts system from:
  - **strict planner + strict parsing**
    → to:
  - **strict planner + flexible argument extraction + strict kernel enforcement**

- Ensures normalization is applied in real runtime paths (not only in isolated tests)

- Maintains guarantees:
  - no tool execution without planner approval
  - no output without kernel validation

---

#### 🔥 Why This Matters

Previously, valid user inputs could be rejected before reaching the kernel:

### 🚀 v0.5.0 — End-to-End Control Plane Execution + Trace Integrity

#### feat(runtime): complete orchestrator → kernel → tool → chat loop with verifiable trace

This release marks the first **fully operational control-plane runtime loop**, where planner intent, kernel execution, enforcement, and user-visible output are unified under a single deterministic flow.

#### ✨ Added

- End-to-end `/agent` runtime integrating:
  - `orchestrate` (planner)
  - `executeKernel` (execution boundary)
  - double-pass execution (tool → chat)
- Structured `TraceContext` capturing:
  - planner decision
  - tool invocation
  - enforcement decision
  - tool result
  - kernel output
- Kernel-level enforcement layer with explicit allow/deny decisions emitted into trace
- Invariant guard ensuring all tool executions produce:
  - `tool_invocation`
  - `tool_result`

#### 🔄 Changed

- Refactored orchestrator to be strictly **planner-only**:
  - removed all execution and result fabrication
- Unified `/agent` GET + POST behavior to follow:
  - `orchestrate → executeKernel → (optional chat pass) → response`
- Centralized answer extraction logic for tool + chat outputs
- Ensured all user-visible output originates exclusively from kernel execution

#### 🔒 Guarantees Established

- No tool execution without trace visibility
- No output without passing through kernel
- Enforcement decisions are observable and auditable
- Trace reflects **actual execution**, not synthetic events

#### 🧠 Architectural Impact

- Transitions system from “component architecture” → **working control-plane runtime**
- Establishes trace as a **first-class system artifact**
- Makes execution behavior:
  - deterministic
  - inspectable
  - debuggable without guesswork

#### 🔥 Why This Matters

This is the point where:

- the model no longer “feels like” it’s doing work
- the system **proves** what actually happened

> The runtime is now governed, observable, and verifiable end-to-end.

### 🚀 v0.4.0 — Intent, Enforcement, and Diagram / Transport Alignment

#### feat(control-plane): document and align intent layer with kernel output authority

This release captures the **intent → enforcement → `KernelInput` → `executeKernel`** story in `ARCHITECTURE.md` and `/docs`, fixes the **execution diagram** so “final response” is not shown as originating from the orchestrator, and aligns **STDIO** (and the dev `main` path) with **`orchestrate` → `executeKernel`** so user-visible output matches the unified contract.

#### ✨ Documentation & assets

- Added `docs/diagrams/runtime-execute.mmd` as the source for `mermaid-diagram-execute.png` (regenerate with `@mermaid-js/mermaid-cli`).
- Updated `docs/architecture-diagram.md`, `docs/design-decisions.md` (sections 13–15), `docs/ai-control-plane.md`, and `docs/agent-runtime-flow.md` for intent, orchestrator enforcement, and kernel as execution + output authority.
- Recorded **runtime evolution** in `ARCHITECTURE.md`: failure semantics (v0.2), intent detection, orchestrator enforcement (structured refusal when a tool was required but the planner returned only text, e.g. `tool_required_but_not_used`), and kernel-only emission via `executeKernel`.

#### 🔄 Changed

- **Transport (`src/transport/stdio.ts`)**: prompt handling now runs `executeKernel` on the orchestrator’s `KernelInput` before writing stdout.
- **Dev entry (`src/index.ts`)**: same `orchestrate` → `executeKernel` sequence for local runs.

#### 🧠 Architectural intent (summary)

| Concern                                       | Mechanism                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| What kind of request is this?                 | `classifyIntent` (`requiresTool`, `type`)                                |
| Prevent planner bypass for tool-required work | Orchestrator emits refusal `KernelInput` instead of accepting plain text |
| Single output authority                       | `executeKernel`                                                          |

---

### 🚀 v0.3.0 — Kernel Authority & Unified Execution Boundary

#### feat(control-plane): enforce kernel as single execution + output authority

This change introduces a strict kernel boundary, eliminating all non-kernel output paths and unifying execution semantics across the runtime.

#### ✨ Key Changes

- Introduced `KernelInput` as the sole execution contract for orchestrator → kernel communication
- Refactored orchestrator to return structured intents only (no direct output)
- Removed all string and `type: "final"` return paths (previous bypass vector)
- Added `executeKernel` as the single entry point for:
  - tool execution (delegated)
  - chat emission (structured)
  - refusal emission (structured)
- Updated runtime flow to: `orchestrate → executeKernel → response`

#### 🔒 Guarantees Established

- No output without validation
- Kernel is the only component capable of emitting user-visible responses
- All execution paths are observable and structured
- LLM and orchestrator no longer hold output authority

#### 🧠 Architectural Impact

- Collapses dual-authority system into a single controlled boundary
- Converts observability from best-effort to invariant
- Eliminates invisible failure paths caused by direct LLM output
- Enables deterministic debugging and traceability across all flows

---

This change transitions the system from a model-driven application to a governed control-plane runtime with enforceable execution semantics.

### 🚀 v0.2.0 — Failure Semantics & Adaptive Control

#### ✨ Added

- Structured error normalization layer to classify kernel errors into:
  - deterministic (input-driven, non-recoverable)
  - transient (execution/environment-driven, potentially recoverable)
- Error subtype system (validation, timeout, unknown_tool, execution) to preserve detailed failure context
- Outcome-based input normalization (per-tool) that only applies when coercion results in schema-valid arguments
- Signal-based model escalation triggered specifically by validation failures where normalization does not resolve the input
- Bounded retry mechanism (single retry) to guarantee deterministic termination and prevent infinite loops
- Observability improvements in orchestrator loop, including:
  - normalization outcome logging
  - retry attempt visibility
  - escalation decision tracing

#### 🔄 Changed

- Replaced naive retry logic (“retry on failure”) with explicit escalation conditions:
  - only retry on deterministic validation errors
  - only when normalization did not successfully resolve input
- Updated normalization semantics from:
  - “did normalization run?” → ❌
  - to “did normalization produce a valid result?” → ✅
- Strengthened planner constraints to prevent argument value invention (e.g., disallow `"banana" → 3`)
- Modified orchestrator loop to:
  - terminate immediately on successful execution
  - perform at most one controlled retry
  - fail cleanly when input cannot be safely resolved
- Ensured kernel metadata (`normalization_applied`) is propagated as a control signal, not just logging

#### 🧠 Key Improvements

- Eliminated silent correctness failures caused by model-generated argument substitution
- Established normalization as a safe, structural correction layer, not a semantic interpreter
- Introduced bounded, signal-driven recovery instead of open-ended retries
- Prevented non-converging retry loops through deterministic termination guarantees

**Enforced system-level principle:**

> correctness > completion

**Clarified separation of responsibilities:**

- model → proposes
- kernel → validates
- orchestrator → decides escalation and loop control (later refined in v0.3+ to **enforcement** + `KernelInput`; see v0.4.0)

#### 🧪 Validated Through

- End-to-end runtime testing (not isolated unit tests), ensuring correct interaction between model, kernel, and orchestrator
- Failure scenario validation:
  - `"5"` vs `5` → normalization success path
  - `"five"` → escalation recovery path
  - `"banana"` → safe failure (no guessing)
- Detection and resolution of:
  - model masking of system behavior (pre-normalization)
  - incorrect normalization signaling (reference vs semantic change)
  - variable shadowing affecting control flow
- Verified:
  - escalation triggers only when appropriate
  - retry occurs exactly once
  - all execution paths terminate deterministically

#### 🔥 Why This Is Strong

This communicates:

- you didn’t just “fix bugs”
- you introduced execution semantics
- you understand:
  - failure modes
  - system boundaries
  - control flow design

### 🚀 v0.1.0 — Control Plane Foundation

#### ✨ Added

- Initial AI control plane runtime architecture
- Kernel execution layer with basic tools (`echo`, `add`, `sleep`) to validate execution flow
- Schema validation for tool inputs, establishing the kernel as the execution enforcement boundary
- Policy layer to separate permission checks from execution logic
- Orchestrator loop to manage reasoning, tool usage, and response flow
- Integration of Claude as planner, replacing hardcoded decision logic
- Tool registry and tool packs for modular capability management
- Dynamic tool injection into model context for runtime discovery

#### 🔄 Changed

- Replaced hardcoded tool invocation with model-driven planning
- Transitioned from static execution flow to a ReAct-style orchestration loop
- Enforced structured tool → observation → answer lifecycle

#### 🧠 Key Improvements

- Clear separation of:
  - reasoning (model)
  - orchestration (loop)
  - governance (policy)
  - execution (kernel)
- Introduced schema-as-contract model for tool interaction
- Enabled safe, extensible tool usage through registry pattern
- Established foundation for future integration (`RAG`, `MCP`, external systems)
