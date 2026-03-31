import { registerToolPack } from "./registry";
import { coreToolsPack } from "./core";
import { repoToolsPack } from "./repo";
import { ragToolsPack } from "./rag";

export function initTools() {
  registerToolPack(coreToolsPack);
  registerToolPack(repoToolsPack);
  registerToolPack(ragToolsPack);
}
