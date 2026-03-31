import { handleKernelRequest } from "../src/runtime/kernel";
import { listTools } from "../src/tools/registry";
import "../src/index";

async function runTest(name: string, payload: any) {
  console.log(`\n=== ${name} ===`);
  console.log(
    "Available tools:",
    listTools().map((t) => t.name),
  );
  const result = await handleKernelRequest(payload);

  if ("error" in result) {
    console.log("❌ ERROR");
    console.dir(result, { depth: null });
  } else {
    console.log("✅ SUCCESS");
    console.dir(result, { depth: null });
  }
}

async function main() {
  await runTest("String numbers (should normalize + pass)", {
    id: "test-1",
    tool: "core.add",
    arguments: { a: "2", b: "5" },
  });

  await runTest("Mixed valid + invalid (should fail)", {
    id: "test-2",
    tool: "core.add",
    arguments: { a: 2, b: "five" },
  });

  await runTest("Already valid (no normalization)", {
    id: "test-3",
    tool: "core.add",
    arguments: { a: 2, b: 3 },
  });
}

main();
