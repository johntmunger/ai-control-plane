# Repository Map

This document explains the structure of the **AI Control Plane Runtime** repository and the responsibility of each directory.

The system is designed using a **layered runtime architecture** where each folder maps directly to a runtime responsibility.

---

# High Level Architecture

```
Transport
   ↓
Orchestrator
   ↓
Policy
   ↓
Kernel
   ↓
Tool Registry
   ↓
Tool Packs
   ↓
External Systems
```

Each layer has a single responsibility.

---

# Repository Structure

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

---

# Root Entry

## `src/index.ts`

This is the runtime entry point.

Responsibilities:

- initialize transport
- start runtime
- connect layers together

Example flow:

```
start runtime
   ↓
initialize stdio transport
   ↓
listen for JSON requests
```

---

# Transport Layer

## `src/transport/stdio.ts`

Handles communication between the runtime and external systems.

Responsibilities:

- receive JSON requests
- parse incoming messages
- detect request type
- route to orchestrator or policy layer
- return JSON responses

Example request types:

Prompt request:

```
{"prompt":"Explain JavaScript closures"}
```

Direct tool call:

```
{"tool":"searchDocuments","arguments":{"query":"closures"}}
```

---

# Runtime Layer

## `src/runtime/orchestrator.ts`

Implements the **agent reasoning loop**.

Responsibilities:

- interpret user prompt
- decide when to call tools
- track execution history
- produce final answers

Pseudo flow:

```
prompt
  ↓
planner
  ↓
tool call
  ↓
observation
  ↓
repeat
```

This enables **multi-step reasoning agents**.

---

## `src/runtime/policy.ts`

The **governance layer**.

Responsibilities:

- enforce tool allowlists
- enforce safe mode restrictions
- block unauthorized capabilities
- validate tool access

Example:

```
ALLOWED_TOOLS = [
  "echo",
  "add",
  "sleep",
  "searchDocuments"
]
```

Policy sits **between orchestration and execution**.

---

## `src/runtime/kernel.ts`

The kernel is the **secure execution engine**.

Responsibilities:

- validate requests
- resolve tools
- validate tool arguments
- execute tools
- enforce timeouts
- normalize errors
- log invocations

Example protections:

- Zod schema validation
- execution timeouts
- structured error responses

---

# Tool Registry

## `src/tools/index.ts`

Registers all available tools.

Responsibilities:

- map tool names to tool implementations
- provide registry for kernel lookup

Example registry:

```
echo
add
sleep
searchDocuments
```

The kernel uses this registry to locate tools.

---

# Tool Packs

Tool packs contain **capabilities available to the runtime**.

Tools are grouped by domain.

---

## Core Tools

Location:

```
src/tools/core
```

Basic demonstration tools:

### echo

Returns the input message.

### add

Adds two numbers.

### sleep

Waits for a specified number of milliseconds.

These are useful for:

- kernel testing
- orchestration testing
- debugging runtime behavior

---

## RAG Tools

Location:

```
src/tools/rag
```

### searchDocuments

Performs semantic search using the external RAG system.

Flow:

```
query
 ↓
generate embedding
 ↓
pgvector similarity search
 ↓
retrieve top-k chunks
 ↓
return context
```

The orchestrator can then use the retrieved context to produce answers.

---

# Utility Modules

## `src/utils/errors.ts`

Centralized error handling.

Normalizes runtime errors into structured responses.

Supported error types:

```
validation_error
unknown_tool
timeout
execution_error
policy_violation
```

---

## `src/utils/timeout.ts`

Provides timeout guards for tool execution.

Example:

```
withTimeout(toolExecution, 2000ms)
```

Prevents runaway tool execution.

---

# External System Integration

The runtime integrates with an external RAG repository.

Example:

```
rag-mdn
```

This repository provides:

- document crawling
- chunking
- embedding generation
- vector storage
- semantic search

Pipeline:

```
documentation
 ↓
chunking
 ↓
embeddings
 ↓
pgvector database
 ↓
semantic retrieval
```

The runtime interacts with it through:

```
searchDocuments tool
```

---

# Design Philosophy

This repository follows several architectural principles.

### Layer Separation

Each layer has a single responsibility.

### Capability Isolation

Tools are isolated from the kernel.

### Governance First

Policy sits between reasoning and execution.

### External Knowledge

Knowledge systems (RAG) live outside the runtime.

### Extensibility

New tools can be added without modifying the kernel.

---

# Future Repository Expansion

Planned additions include:

## Model Adapters

```
src/models
```

Adapters for:

- GPT
- Claude
- Gemini

---

## Agent Memory

```
src/state
```

Persistent state systems:

- conversation memory
- task history
- agent planning state

---

## Additional Tool Packs

Possible additions:

```
repo-tools
ci-tools
analysis-tools
external-api-tools
```

---

# Summary

This repository implements a minimal **AI Control Plane runtime**.

Key features:

- layered architecture
- safe tool execution
- agent reasoning loops
- retrieval augmented generation
- policy enforcement

This design allows the runtime to scale into a **full AI agent platform**.
