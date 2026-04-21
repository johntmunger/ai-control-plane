import { executeKernel } from "../src/runtime/kernel";
import { createTrace } from "../src/runtime/trace";
import { registerToolPack } from "../src/tools/registry";
import { addTool } from "../src/tools/core/add";

// -------------------------------------------------------------
// to run: npx ts-node scripts/test-trace-steps.ts
// -------------------------------------------------------------

async function main() {
  // 🔧 REGISTER TOOLS FIRST
  registerToolPack({
    name: "core",
    tools: [addTool],
  });

  const trace = createTrace();

  await executeKernel(
    {
      type: "tool",
      tool: "core.add",
      arguments: { a: "five", b: "2" }, // forced error by passing a string instead of a number
    },
    trace,
  );

  console.dir(trace.events, { depth: null });
}

main();
