import { readFile } from "./readFile";
import { listFiles } from "./listFiles";
import { searchCode } from "./searchCode";

export const repoToolsPack = {
  name: "repo",
  tools: [readFile, listFiles, searchCode],
};
