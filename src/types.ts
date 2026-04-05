/**
 * Core types for building Conductor plugins and integrations.
 */

// ── Plugin System ─────────────────────────────────────────────────────────────

export interface ToolContext {
  userId: string;
  channel: string;
}

export interface PluginTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, SchemaProperty>;
    required?: string[];
  };
  requiresApproval?: boolean;
  handler: (args: Record<string, unknown>, context?: ToolContext) => Promise<string>;
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  default?: unknown;
}

export interface PluginConfigField {
  name: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean';
  secret?: boolean;
  required?: boolean;
  default?: unknown;
}

export interface PluginConfigSchema {
  fields: PluginConfigField[];
}

export interface IConfig {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): Promise<void>;
  getConfigDir(): string;
  getConfig(): Record<string, unknown>;
}

/**
 * The Plugin interface — implement this to build a Conductor plugin.
 *
 * @example
 * ```typescript
 * import { Plugin, PluginTool, IConfig } from '@useconductor/sdk';
 *
 * export class MyPlugin implements Plugin {
 *   name = 'my-plugin';
 *   description = 'Does something useful';
 *   version = '1.0.0';
 *
 *   private config?: IConfig;
 *
 *   async initialize(config: IConfig): Promise<void> {
 *     this.config = config;
 *   }
 *
 *   isConfigured(): boolean {
 *     return true;
 *   }
 *
 *   getTools(): PluginTool[] {
 *     return [{
 *       name: 'my_tool',
 *       description: 'Does the thing',
 *       inputSchema: {
 *         type: 'object',
 *         properties: {
 *           input: { type: 'string', description: 'Input value' }
 *         },
 *         required: ['input'],
 *       },
 *       handler: async (args) => {
 *         return `Result: ${args.input}`;
 *       },
 *     }];
 *   }
 * }
 *
 * export default new MyPlugin();
 * ```
 */
export interface Plugin {
  name: string;
  description: string;
  version: string;
  initialize(config: IConfig): Promise<void>;
  isConfigured(): boolean;
  getTools(): PluginTool[];
  configSchema?: PluginConfigSchema;
  getContext?(): Promise<string | null>;
}

// ── MCP Tool types ────────────────────────────────────────────────────────────

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPCallResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

// ── Client Options ────────────────────────────────────────────────────────────

export interface StdioTransportOptions {
  transport: 'stdio';
  /** Command to spawn. Defaults to 'conductor' if installed globally. */
  command?: string;
  /** Args to pass to the command. Defaults to ['mcp', 'start']. */
  args?: string[];
  /** Environment variables for the spawned process */
  env?: Record<string, string>;
}

export interface HttpTransportOptions {
  transport: 'http';
  /** Base URL of the Conductor HTTP/SSE server, e.g. 'http://localhost:3000' */
  url: string;
}

export type ConductorClientOptions = StdioTransportOptions | HttpTransportOptions;
