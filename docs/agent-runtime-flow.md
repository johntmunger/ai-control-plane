# Agent Runtime Execution Flow

This document describes the **end-to-end execution flow** of a prompt through the AI Control Plane runtime.

It explains how a user prompt moves through the transport layer, orchestrator, policy layer, kernel, tool system, and external services.

---

# Overview

The runtime implements a **ReAct-style agent loop** with **intent** and **enforcement**: the planner proposes; the orchestrator builds **`KernelInput`**; **`executeKernel`** emits user-visible output (no raw planner bypass for tool-required work).

High-level flow:

User Prompt  
→ Transport Layer  
→ Orchestrator (planner → intent if needed → enforcement)  
→ **KernelInput**  
→ **executeKernel** (policy and `handleKernelRequest` on tool paths)  
→ Tool Execution  
→ External Systems (RAG, APIs, etc.)  
→ Result / observation  
→ Orchestrator Continues Reasoning  
→ **executeKernel** → structured response

---

# Step-by-Step Execution

## 1. User Prompt

Example request:

```json
{ "prompt": "What is a JavaScript closure?" }
```
