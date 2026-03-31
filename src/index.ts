import "dotenv/config";
import "./transport/stdio";

// 👇 ADD THIS
import { registerToolPack } from "./tools/registry";
import { coreToolsPack } from "./tools/core";
import { repoToolsPack } from "./tools/repo";
import { ragToolsPack } from "./tools/rag";

// 👇 REGISTER
registerToolPack(coreToolsPack);
registerToolPack(repoToolsPack);
registerToolPack(ragToolsPack);
