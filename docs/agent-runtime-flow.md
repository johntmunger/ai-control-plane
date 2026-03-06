# Agent Runtime Execution Flow

This document describes the **end-to-end execution flow** of a prompt through the AI Control Plane runtime.

It explains how a user prompt moves through the transport layer, orchestrator, policy layer, kernel, tool system, and external services.

---

# Overview

The runtime implements a **ReAct-style agent loop** that allows models to reason, call tools, observe results, and continue reasoning until a final answer is produced.

High-level flow:

User Prompt  
→ Transport Layer  
→ Orchestrator  
→ Policy Layer  
→ Kernel  
→ Tool Execution  
→ External Systems (RAG, APIs, etc.)  
→ Result Returned  
→ Orchestrator Continues Reasoning  
→ Final Answer

---

# Step-by-Step Execution

## 1. User Prompt

Example request:

```json
{ "prompt": "What is a JavaScript closure?" }
```
