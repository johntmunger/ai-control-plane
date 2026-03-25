import { z } from "zod";

export type Tool = {
  name: string;
  description: string;
  schema: z.ZodSchema<any>;
  execute: (args: any) => Promise<any>;
  pack?: string;
};

export type ToolPack = {
  name: string;
  tools: Tool[];
};

export type ToolMetadata = {
  name: string;
  description: string;
  schema: z.ZodSchema<any>;
};

export function listToolMetadata(): ToolMetadata[] {
  return Array.from(registry.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    schema: tool.schema,
  }));
}

const registry = new Map<string, Tool>();

export function registerToolPack(pack: ToolPack) {
  for (const tool of pack.tools) {
    const namespaced = `${pack.name}.${tool.name}`;

    if (registry.has(namespaced)) {
      throw new Error(`Tool already registered: ${namespaced}`);
    }

    registry.set(namespaced, {
      ...tool,
      name: namespaced,
      pack: pack.name,
    });
  }
}

export function getTool(name: string): Tool | undefined {
  return registry.get(name);
}

export function listTools(): Tool[] {
  return Array.from(registry.values());
}
