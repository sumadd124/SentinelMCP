import { z } from "zod";
import type { ToolDefinition } from "./types.js";

export interface IToolRegistry {
  register<T extends z.ZodObject<z.ZodRawShape>>(tool: ToolDefinition<T>): void;
  get(name: string): ToolDefinition | undefined;
  getAll(): ToolDefinition[];
  has(name: string): boolean;
  clear(): void;
}

export class ToolRegistry implements IToolRegistry {
  private static instance: ToolRegistry | null = null;
  private tools = new Map<string, ToolDefinition>();

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  // Static proxy delegates allowing ToolRegistry.register(...) and ToolRegistry.get(...) directly
  public static register<T extends z.ZodObject<z.ZodRawShape>>(tool: ToolDefinition<T>): void {
    ToolRegistry.getInstance().register(tool);
  }

  public static get(name: string): ToolDefinition | undefined {
    return ToolRegistry.getInstance().get(name);
  }

  public static getAll(): ToolDefinition[] {
    return ToolRegistry.getInstance().getAll();
  }

  public static has(name: string): boolean {
    return ToolRegistry.getInstance().has(name);
  }

  public static clear(): void {
    ToolRegistry.getInstance().clear();
  }

  register<T extends z.ZodObject<z.ZodRawShape>>(tool: ToolDefinition<T>): void {
    this.tools.set(tool.name, tool as unknown as ToolDefinition);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  clear(): void {
    this.tools.clear();
  }
}