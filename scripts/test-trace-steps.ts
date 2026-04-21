import { executeKernel } from "../src/runtime/kernel";
import { createTrace } from "../src/runtime/trace";
import { registerToolPack } from "../src/tools/registry";
import { addTool } from "../src/tools/core/add";
import { FrameReducer } from "../src/runtime/frameReducer";

// -------------------------------------------------------------
// to run: npx ts-node scripts/test-trace-steps.ts
// -------------------------------------------------------------

async function runCase(label: string, args: any) {
  const trace = createTrace();

  await executeKernel(
    {
      type: "tool",
      tool: "core.add",
      arguments: args,
    },
    trace,
  );

  console.log(`\n=== ${label} — TRACE EVENTS ===`);
  console.dir(trace.events, { depth: null });

  const reducer = new FrameReducer();

  console.log("\n=== STREAMING FRAME UPDATES ===");

  for (const event of trace.events) {
    reducer.applyEvent(event);

    console.log(`\n[EVENT] ${event.type}`);
    console.dir(event, { depth: null });

    const frames = reducer.getFrames();

    console.log(
      frames.map((f) => ({
        step: f.step,
        status: f.status,
        tool: f.tool?.name,
      })),
    );
  }
}

async function main() {
  // 🔧 REGISTER TOOLS FIRST
  registerToolPack({
    name: "core",
    tools: [addTool],
  });

  // ❌ Failure case
  await runCase("FAILURE CASE", { a: "five", b: "2" });

  // ✅ Success case
  await runCase("SUCCESS CASE", { a: "5", b: "2" });
}

main();
