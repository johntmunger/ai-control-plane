# Changelog

> This project evolves an AI runtime from basic tool execution into a controlled, failure-aware system designed for production-grade reliability.

All notable changes to the AI Control Plane Runtime will be documented in this file.

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
- orchestrator → decides

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
