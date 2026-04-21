import { executeKernel } from "../src/runtime/kernel";
import { createTrace } from "../src/runtime/trace";
import { registerToolPack } from "../src/tools/registry";
import { addTool } from "../src/tools/core/add";

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
      arguments: { a: "five", b: "2" },
    },
    trace,
  );

  console.dir(trace.events, { depth: null });
}

main();
