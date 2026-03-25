import "dotenv/config";
import { orchestrate } from "../src/runtime/orchestrator";
import { registerToolPack } from "../src/tools/registry";
import { repoToolsPack } from "../src/tools/repo";

// register tools (IMPORTANT)
registerToolPack(repoToolsPack);

async function run() {
  const result = await orchestrate("What files are in src/tools?");

  console.log(JSON.stringify(result, null, 2));
}

run();
