import { z } from "zod";

export interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  schema: z.ZodSchema<TInput>;
  execute(args: TInput): Promise<TOutput>;
  normalize?: (args: unknown) => unknown;
  pack?: string;
}

export type ToolPack = {
  name: string;
  tools: Tool<any, any>[];
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

const registry = new Map<string, Tool<any, any>>();

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

export function getTool(name: string): Tool<any, any> | undefined {
  return registry.get(name);
}

export function listTools(): Tool<any, any>[] {
  return Array.from(registry.values());
}
