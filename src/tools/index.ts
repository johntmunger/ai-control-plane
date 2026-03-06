import { addToolDef } from "./demo/add";
import { echoToolDef } from "./demo/echo";
import { sleepToolDef } from "./demo/sleep";
import { searchDocumentsTool } from "./rag/searchDocuments";

export const tools = {
  add: addToolDef,
  echo: echoToolDef,
  sleep: sleepToolDef,
  searchDocuments: searchDocumentsTool,
} as const;

export type ToolName = keyof typeof tools;
