import { echoTool } from "./echo";
import { addTool } from "./add";
import { sleepTool } from "./sleep";

export const coreToolsPack = {
  name: "core",
  tools: [echoTool, addTool, sleepTool],
};
