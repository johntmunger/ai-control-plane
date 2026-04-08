import "dotenv/config";
import { executeKernel } from "../src/runtime/kernel";
import { orchestrate } from "../src/runtime/orchestrator";
import { registerToolPack } from "../src/tools/registry";
import { repoToolsPack } from "../src/tools/repo";

// register tools (IMPORTANT)
registerToolPack(repoToolsPack);

async function run() {
  const prompts = [
    "What files are in src/tools?", // tool
    // "Add 2 and 3", // tool? or refusal?
    // "hello there", // chat
    // "compute something weird", // edge / refusal
  ];

  for (const prompt of prompts) {
    console.log("\n---");
    console.log("PROMPT:", prompt);

    const kernelInput = await orchestrate(prompt);
    const result = await executeKernel(kernelInput);

    // 🚨 CRITICAL: ensure no raw string ever leaks
    if (typeof result === "string") {
      throw new Error("❌ Kernel returned raw string");
    }

    console.log(result);

    // 🔒 HARD ASSERTS (orchestrator output)
    if (!kernelInput || typeof kernelInput !== "object") {
      throw new Error("❌ Orchestrator did not return an object");
    }

    if (!("type" in kernelInput)) {
      throw new Error("❌ Missing KernelInput.type");
    }

    if (!["chat", "tool", "refusal"].includes(kernelInput.type)) {
      throw new Error(`❌ Invalid kernelInput.type: ${kernelInput.type}`);
    }

    // 🔒 executeKernel return shape
    if (!result || typeof result !== "object") {
      throw new Error("❌ executeKernel did not return an object");
    }

    if (kernelInput.type === "tool") {
      if (!("error" in result) && !("result" in result)) {
        throw new Error("❌ Tool kernel result missing result/error");
      }
    } else if (kernelInput.type === "chat") {
      if ((result as { type?: string }).type !== "chat") {
        throw new Error("❌ Expected chat payload from executeKernel");
      }
    } else if (kernelInput.type === "refusal") {
      if ((result as { type?: string }).type !== "refusal") {
        throw new Error("❌ Expected refusal payload from executeKernel");
      }
    }
  }

  console.log("\n✅ All tests passed: kernel boundary enforced");
}

run();
