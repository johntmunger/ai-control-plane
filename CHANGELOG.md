# Changelog

All notable changes to the AI Control Plane Runtime will be documented in this file.

## CHANGELOG (v0.1.0 — Initial Control Plane Runtime)

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
