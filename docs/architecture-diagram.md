# AI Control Plane Architecture Diagram

This document visualizes how the runtime, tools, and external systems connect.

---

# High Level Architecture

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
                │  Agent Loop      │
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
                │ Execution Engine │
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
                     FINAL ANSWER
```

---

# Tool Execution Flow

```
User Prompt
      │
      ▼
Orchestrator
      │
      ▼
Planner Decision
      │
      ▼
Tool Invocation
      │
      ▼
Kernel Execution
      │
      ▼
Tool Implementation
      │
      ▼
External System
      │
      ▼
Result Returned
      │
      ▼
Orchestrator Continues
      │
      ▼
Final Response
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
LLM / Planner
      │
      ▼
Orchestrator
      │
      ▼
Policy
      │
      ▼
Kernel
      │
      ▼
Tools
      │
      ▼
External Systems
```

Each layer has a single responsibility.

This layered architecture forms the basis of a scalable **AI control plane runtime**.
