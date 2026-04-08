# AI Control Plane Architecture Diagram

This document visualizes how the runtime, tools, and external systems connect.

---

# High Level Architecture

Intent classification and orchestrator enforcement sit **inside** the agent loop (`src/runtime/orchestrator.ts`, `src/runtime/intent.ts`). **KernelInput** flows to **`executeKernel`** (`src/runtime/kernel.ts`); user-visible output is produced there, not by returning raw planner strings from the orchestrator.

```
                        USER
                         │
                         ▼
                ┌─────────────────┐
                │   Prompt Input   │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   TRANSPORT      │
                │  (STDIO / HTTP)  │
                │  src/transport   │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  ORCHESTRATOR    │
                │  Planner → Intent│
                │  → enforcement   │
                │  → KernelInput   │
                │ src/runtime      │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  POLICY LAYER    │
                │  Safety Rules    │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │     KERNEL       │
                │ executeKernel +  │
                │ tool execution   │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   TOOL REGISTRY  │
                └─────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │             TOOL PACKS          │
        │                                 │
        │  echo            add            │
        │  sleep           searchDocs     │
        │                                 │
        │  (future)                       │
        │  repo tools                     │
        │  CI tools                       │
        │  state tools                    │
        └─────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   RAG SYSTEM     │
                │  rag-mdn repo    │
                │  pgvector        │
                │  embeddings      │
                └─────────────────┘
                         │
                         ▼
                     CONTEXT
                         │
                         ▼
              KernelInput → executeKernel
                         │
                         ▼
                 USER-VISIBLE RESPONSE
```

---

# Tool Execution Flow

```
User Prompt
      │
      ▼
Orchestrator (planner proposal)
      │
      ▼
Planner Decision (tool call or text)
      │
      ▼
Tool path: Policy → Kernel → Tool
      │
      ▼
Tool Implementation
      │
      ▼
External System
      │
      ▼
Result / observation
      │
      ▼
Orchestrator builds KernelInput
      │
      ▼
executeKernel(KernelInput)
      │
      ▼
User-visible response
```

---

# RAG Retrieval Flow

```
User Question
      │
      ▼
searchDocuments Tool
      │
      ▼
Generate Embedding
(Voyage AI)
      │
      ▼
Vector Similarity Search
(pgvector)
      │
      ▼
Top-K Document Chunks
      │
      ▼
Context Injection
      │
      ▼
Agent Response
```

---

# Runtime Responsibility Model

```
LLM / Planner (proposes)
      │
      ▼
Intent (control signal when outcome is text)
      │
      ▼
Orchestrator (enforces → KernelInput)
      │
      ▼
Policy
      │
      ▼
Kernel (executeKernel — execution + output authority)
      │
      ▼
Tools
      │
      ▼
External Systems
```

Each layer has a single responsibility.

This layered architecture forms the basis of a scalable **AI control plane runtime**.
