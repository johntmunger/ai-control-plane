# Agent Runtime Flow

This document explains how a user request moves through the AI Control Plane runtime.

The runtime implements a **tool-enabled agent architecture** that separates reasoning, safety, and execution.

---

# End-to-End Execution Flow

```
User Prompt
     │
     ▼
Transport Layer
     │
     ▼
Orchestrator
     │
     ▼
Policy Layer
     │
     ▼
Kernel
     │
     ▼
Tool Execution
     │
     ▼
External Systems
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

# Step 1 — User Prompt

Example request sent to the runtime:

```
{"prompt":"What is a JavaScript closure?"}
```

The request enters the runtime through the **transport layer**.

---

# Step 2 — Transport Layer

Location:

```
src/transport/stdio.ts
```

Responsibilities:

- receive incoming JSON
- parse the message
- determine request type
- route to orchestrator or kernel
- return structured responses

Two types of requests can arrive:

Prompt request:

```
{"prompt":"Explain closures"}
```

Direct tool call:

```
{"tool":"searchDocuments","arguments":{"query":"closures"}}
```

Prompt requests are sent to the **orchestrator**.

---

# Step 3 — Orchestrator

Location:

```
src/runtime/orchestrator.ts
```

The orchestrator runs the **agent reasoning loop**.

It repeatedly decides:

- whether to call a tool
- whether to return a final answer

Pseudo logic:

```
history = []

while true:

  decision = planner(prompt, history)

  if decision is final answer:
      return response

  if decision is tool call:
      execute tool
      append result to history
```

This pattern is often called the **ReAct loop**.

---

# Step 4 — Tool Planning

The planner determines whether a tool is needed.

Example planner output:

```
{
  "tool": "searchDocuments",
  "arguments": {
    "query": "JavaScript closures"
  }
}
```

The orchestrator then forwards this request to the **policy layer**.

---

# Step 5 — Policy Layer

Location:

```
src/runtime/policy.ts
```

Responsibilities:

- enforce tool allowlists
- enforce system restrictions
- prevent unauthorized tool usage

Example rule:

```
ALLOWED_TOOLS = [
  "echo",
  "add",
  "sleep",
  "searchDocuments"
]
```

If a tool is not allowed, execution stops.

Example response:

```
{
  "error": {
    "type": "policy_violation",
    "message": "Tool not allowed"
  }
}
```

If the policy passes, the request continues to the kernel.

---

# Step 6 — Kernel Execution

Location:

```
src/runtime/kernel.ts
```

The kernel is the **safe execution engine**.

Responsibilities:

- validate request envelope
- validate tool arguments
- resolve tool from registry
- enforce timeouts
- execute tool
- normalize errors
- log invocation

Example log:

```
{
  "type": "invocation",
  "tool": "searchDocuments",
  "id": "uuid",
  "timestamp": 123456
}
```

---

# Step 7 — Tool Registry

Location:

```
src/tools/index.ts
```

The registry maps tool names to implementations.

Example registry:

```
echo
add
sleep
searchDocuments
```

Each tool includes:

- a validation schema
- an execute function

Example:

```
export const searchDocumentsTool = {
  schema: SearchSchema,
  execute: searchDocuments
}
```

---

# Step 8 — Tool Execution

Example tool:

```
searchDocuments
```

Location:

```
src/tools/rag/searchDocuments.ts
```

The tool performs semantic search through the RAG system.

Process:

```
query
   ↓
embedding generation
   ↓
vector similarity search
   ↓
retrieve top-k document chunks
   ↓
return context
```

Example result:

```
{
  "context": "...retrieved documentation...",
  "sources": [...]
}
```

---

# Step 9 — External System (RAG)

The RAG system lives in a separate repository.

Example:

```
rag-mdn
```

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
semantic similarity search
```

The runtime retrieves relevant document chunks as context.

---

# Step 10 — Observation

The orchestrator records the tool result.

Example:

```
history.push({
  tool: "searchDocuments",
  result: toolResult
})
```

The planner now has new information to reason over.

---

# Step 11 — Continued Reasoning

The orchestrator asks the planner again:

```
decision = planner(prompt, history)
```

Possible outcomes:

- call another tool
- generate final response

Example reasoning output:

```
Using retrieved context...

A JavaScript closure is a function that retains access
to variables from its outer lexical scope.
```

---

# Step 12 — Final Response

The runtime returns the final result.

Example:

```
{
  "type": "final",
  "message": "A JavaScript closure is...",
  "history": [...]
}
```

---

# Example Full Execution

Prompt:

```
What is a JavaScript closure?
```

Runtime execution:

```
prompt received
   ↓
orchestrator decides search is required
   ↓
searchDocuments tool invoked
   ↓
RAG system retrieves relevant docs
   ↓
context returned to orchestrator
   ↓
final answer generated
```

---

# Architectural Benefits

This architecture provides:

- safe tool execution
- modular capability expansion
- deterministic runtime behavior
- separation of reasoning and execution

Each layer has a single responsibility.

---

# Conceptual Layer Model

```
LLM / Planner
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

This layered structure forms the foundation of a scalable **AI Control Plane runtime**.

---

# Future Extensions

Potential improvements include:

Model planners:

```
Claude
GPT
Gemini
```

Agent memory:

```
conversation state
task tracking
persistent context
```

Tool expansion:

```
repo analysis tools
CI automation tools
external API integrations
```
