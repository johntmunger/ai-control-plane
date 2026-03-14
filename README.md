# AI Control Plane Runtime

A modular runtime for building tool-enabled AI agents with safe execution boundaries, extensible tool systems, and external knowledge integration.

This repository implements the core control plane runtime architecture used to orchestrate agent reasoning, enforce policy, safely execute tools, and interact with external knowledge systems.

The system is designed to separate reasoning, safety, execution, and capabilities into independent layers.

# What This Repository Demonstrates

This project demonstrates how to build a **modular AI agent runtime** using a control plane architecture.

The system separates reasoning, execution, governance, and knowledge retrieval into independent layers, allowing AI agents to safely interact with external tools and data systems.

Key concepts demonstrated in this repository:

• **Agent Orchestration**  
A runtime orchestrator manages a ReAct-style reasoning loop where the model can decide when to call tools and when to return a final answer.

• **Safe Tool Execution**  
All tool calls pass through a kernel execution boundary that validates inputs, enforces timeouts, and normalizes errors.

• **Policy Enforcement**  
A policy layer governs which tools the agent is allowed to execute, preventing unauthorized capabilities.

• **Modular Tool Architecture**  
Tools are registered dynamically through a tool registry and grouped into tool packs, enabling capability expansion without modifying the runtime core.

• **External Knowledge Systems (RAG)**  
The runtime retrieves context from external retrieval systems (such as a pgvector-backed RAG service) instead of storing knowledge internally.

• **Layered Runtime Design**  
Each system component has a single responsibility:

## Architecture Overview

                     USER
                      │
                      ▼
                ┌─────────────┐
                │  runtime-ui │
                │ React Chat  │
                └─────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   ai-runtime-server   │
           │   RAG Runtime API     │
           └──────────────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  control-plane  │
             │ Agent Runtime   │
             └─────────────────┘
                      │
                      ▼
               ┌──────────────┐
               │   rag-mdn     │
               │ Knowledge     │
               │ Ingestion     │
               └──────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Postgres +      │
             │ pgvector        │
             │ Vector Database │
             └─────────────────┘

## Runtime Execution Flow

The system implements a ReAct-style agent loop.

```
prompt
   ↓
planner
   ↓
tool call
   ↓
observation
   ↓
repeat until final answer
```

Execution pipeline:

```
User Prompt
      │
      ▼
Transport
      │
      ▼
Orchestrator
      │
      ▼
Policy Validation
      │
      ▼
Kernel Execution
      │
      ▼
Tool Invocation
      │
      ▼
External System
(RAG / APIs)
      │
      ▼
Result Returned
      │
      ▼
Orchestrator Continues Reasoning
      │
      ▼
Final Answer
```

## Repository Structure

The repository mirrors the runtime architecture.

```
src
├─ index.ts
│
├─ transport
│   └─ stdio.ts
│
├─ runtime
│   ├─ orchestrator.ts
│   ├─ policy.ts
│   └─ kernel.ts
│
├─ tools
│   ├─ index.ts
│   │
│   ├─ core
│   │   ├─ echo.ts
│   │   ├─ add.ts
│   │   └─ sleep.ts
│   │
│   └─ rag
│       └─ searchDocuments.ts
│
└─ utils
    ├─ errors.ts
    └─ timeout.ts
```

Each directory maps directly to a runtime responsibility.

| Layer            | Responsibility                        |
| ---------------- | ------------------------------------- |
| Transport        | Receives and routes incoming requests |
| Orchestrator     | Runs the agent reasoning loop         |
| Policy           | Enforces capability governance        |
| Kernel           | Safe tool execution boundary          |
| Tool Registry    | Maps tool names to implementations    |
| Tool Packs       | Modular capability implementations    |
| External Systems | Knowledge systems and APIs            |

## Key Architectural Concepts

### Layered Runtime

The runtime uses a layered architecture to isolate responsibilities:

```
Transport
   ↓
Orchestrator
   ↓
Policy
   ↓
Kernel
   ↓
Tools
   ↓
External Systems
```

This design improves:

- **safety**
- **observability**
- **extensibility**
- **debugging**

### Kernel Execution Boundary

The kernel acts as the secure execution boundary.

All tool calls pass through the kernel where:

- requests are validated
- arguments are validated
- timeouts are enforced
- errors are normalized
- execution is logged

This prevents unsafe tool execution.

### Policy Enforcement

The policy layer enforces runtime governance.

Examples:

```javascript
ALLOWED_TOOLS = ["echo", "add", "sleep", "searchDocuments"];
```

Policy ensures:

- restricted tool usage
- operational safety
- capability governance

### Tool Packs

Capabilities are implemented as modular tools.

Example tool packs:

- **core-tools**
- **rag-tools**
- **repo-tools** (future)
- **ci-tools** (future)
- **api-tools** (future)

This prevents the runtime from becoming a monolithic capability system.

### External Knowledge Systems

Knowledge systems live outside the runtime.

Example:

- **rag-mdn**

Pipeline:

```
documents
   ↓
chunking
   ↓
embeddings
   ↓
pgvector database
   ↓
semantic retrieval
```

Runtime tools query these systems to retrieve context.

## Related Repositories

This project is part of a larger modular system.

| Repository        | Role                                             |
| ----------------- | ------------------------------------------------ |
| runtime-ui        | Chat interface for interacting with the runtime  |
| ai-runtime-server | RAG runtime server and retrieval pipeline        |
| rag-mdn           | documentation ingestion and embedding generation |
| control-plane     | runtime architecture and agent execution         |

System architecture:

```
runtime-ui
     │
     ▼
ai-runtime-server
     │
     ▼
AI Control Plane Runtime
     │
     ▼
RAG Systems
(pgvector + embeddings)
```

## Design Goals

The runtime was designed to solve common issues in AI systems.

| Problem                           | Solution                   |
| --------------------------------- | -------------------------- |
| unsafe tool execution             | kernel execution boundary  |
| uncontrolled capabilities         | policy enforcement         |
| monolithic AI applications        | modular runtime layers     |
| tightly coupled knowledge systems | external RAG repositories  |
| difficult agent extension         | tool registry architecture |

## Documentation

Detailed documentation is available in the `/docs` directory.

| Document                | Description                   |
| ----------------------- | ----------------------------- |
| architecture-diagram.md | visual system architecture    |
| agent-runtime-flow.md   | end-to-end execution flow     |
| ai-control-plane.md     | runtime architecture overview |
| design-decisions.md     | architectural reasoning       |
| repository-map.md       | codebase structure            |

## Future Extensions

Potential runtime improvements:

- **Model Integration**
  - Claude
  - GPT
  - Gemini
- **Agent Memory**
  - conversation state
  - task tracking
  - persistent context
- **Tool Ecosystem**
  - repository analysis
  - CI automation
  - external APIs
  - data pipelines

## Summary

The AI Control Plane runtime provides a foundation for building safe, extensible AI agents.

Key principles:

- layered architecture
- safe execution boundaries
- modular tool systems
- external knowledge integration
- extensible agent runtime

This design allows the system to evolve into a full AI agent platform.
