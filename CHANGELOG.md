# Changelog

> This project evolves an AI runtime from basic tool execution into a controlled, failure-aware system designed for production-grade reliability.

All notable changes to the AI Control Plane Runtime will be documented in this file.

## CHANGELOG

### 🚀 v0.2.0 — Failure Semantics & Adaptive Control

#### ✨ Added

- Structured error normalization layer to classify kernel errors into:
  - deterministic (input-driven, non-recoverable)
  - transient (execution/environment-driven, potentially recoverable)
- Error subtype system (validation, timeout, unknown_tool, execution) to preserve detailed failure context
- Optional per-tool input normalization hook for safe argument coercion (e.g., "5" → 5)
- Model escalation mechanism with tiered routing (e.g., fast → strong) triggered by parsing/validation failures
- Observability improvements in orchestrator loop, including step-aware error reporting

#### 🔄 Changed

- Replaced string-based error types (validation_error, timeout, etc.) with structured error semantics (type + subtype)
- Updated kernel to act as the source of truth for error classification via `normalizeError`
- Modified orchestrator loop to:
  - fail fast on deterministic errors
  - allow controlled retry for transient errors
  - escalate model tier on interpretation failures (single retry)
- Introduced optional normalization stage prior to schema validation without weakening kernel enforcement

#### 🧠 Key Improvements

- Established error semantics as control signals, enabling deterministic system behavior
- Eliminated non-productive retry loops caused by repeated invalid model outputs
- Enabled adaptive execution strategy:
  - terminate (invalid input)
  - retry (transient failure)
  - escalate (interpretation failure)
- Improved system reliability by decoupling:
  - error detection (kernel)
  - error interpretation (normalization layer)
  - response strategy (orchestrator)
- Introduced cost-aware execution patterns through selective model escalation

Reinforced principle:

> “The model is a non-deterministic planner; correctness is enforced by the system”

#### 🧪 Validated Through

- Failure scenario testing:
  - invalid argument handling ("5" vs 5)
  - repeated model misinterpretation loops
  - timeout and execution edge cases
- Verified deterministic termination for schema validation errors
- Demonstrated model escalation improving recovery from parsing failures

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
