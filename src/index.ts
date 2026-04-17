import "dotenv/config";
import "./transport/stdio";

import { initTools } from "./tools/init";
import { executeKernel } from "./runtime/kernel";
import { orchestrate } from "./runtime/orchestrator"; // make sure this is imported
import { createTrace } from "./runtime/trace";
import { listToolMetadata } from "./tools/registry";

initTools();

// TESTING POLICY LAYER
// FAIL: npm run dev -- "Use tool core.fakeTool with input 1"
// SUCCESS: npm run dev -- "Add 2 and 3"
async function main() {
  const prompt = process.argv.slice(2).join(" ") || "Add 2 and 3";

  const trace = createTrace();
  const kernelInput = await orchestrate(prompt, trace);
  const result = await executeKernel(kernelInput, trace);
  console.log(JSON.stringify(result, null, 2));
}

// Lists all registered tools
const tools = listToolMetadata();

console.log("\n🧰 REGISTERED TOOLS:");
tools.forEach((t) => {
  console.log(`- ${t.name}: ${t.description}`);
});
console.log("\n----------------------\n");

main();
