/**
 * @useconductor/sdk
 *
 * TypeScript SDK for Conductor — build plugins and connect to Conductor programmatically.
 *
 * @example Connect and call a tool
 * ```typescript
 * import { ConductorClient } from '@useconductor/sdk';
 *
 * const client = new ConductorClient({ transport: 'stdio' });
 * await client.connect();
 *
 * const tools = await client.listTools();
 * console.log(`${tools.length} tools available`);
 *
 * const result = await client.callText('calculator_evaluate', { expression: '2 + 2' });
 * console.log(result); // "4"
 *
 * await client.disconnect();
 * ```
 *
 * @example Build a plugin
 * ```typescript
 * import { Plugin, PluginTool, IConfig } from '@useconductor/sdk';
 *
 * export class PingPlugin implements Plugin {
 *   name = 'ping';
 *   description = 'Simple ping tool';
 *   version = '1.0.0';
 *
 *   async initialize(_config: IConfig): Promise<void> {}
 *   isConfigured(): boolean { return true; }
 *
 *   getTools(): PluginTool[] {
 *     return [{
 *       name: 'ping',
 *       description: 'Returns pong',
 *       inputSchema: { type: 'object', properties: {} },
 *       handler: async () => 'pong',
 *     }];
 *   }
 * }
 *
 * export default new PingPlugin();
 * ```
 */

export { ConductorClient } from './client.js';

export type {
  Plugin,
  PluginTool,
  PluginConfigSchema,
  PluginConfigField,
  SchemaProperty,
  ToolContext,
  IConfig,
  MCPTool,
  MCPCallResult,
  ConductorClientOptions,
  StdioTransportOptions,
  HttpTransportOptions,
} from './types.js';
