/**
 * ConductorClient — programmatic access to a Conductor MCP server.
 *
 * Supports both stdio (local) and HTTP/SSE (remote) transports.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { ConductorClientOptions, MCPTool, MCPCallResult } from './types.js';

export class ConductorClient {
  private client: Client;
  private options: ConductorClientOptions;
  private connected = false;

  constructor(options: ConductorClientOptions = { transport: 'stdio' }) {
    this.options = options;
    this.client = new Client({ name: '@useconductor/sdk', version: '1.0.0' });
  }

  /**
   * Connect to the Conductor server.
   * Must be called before any other methods.
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    let transport;

    if (this.options.transport === 'stdio') {
      const cmd = this.options.command ?? 'conductor';
      const args = this.options.args ?? ['mcp', 'start'];
      transport = new StdioClientTransport({
        command: cmd,
        args,
        env: this.options.env,
      });
    } else {
      const url = new URL(this.options.url);
      transport = new SSEClientTransport(url);
    }

    await this.client.connect(transport);
    this.connected = true;
  }

  /**
   * Disconnect from the Conductor server.
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.client.close();
    this.connected = false;
  }

  /**
   * List all tools exposed by the connected Conductor server.
   */
  async listTools(): Promise<MCPTool[]> {
    this.assertConnected();
    const result = await this.client.listTools();
    return result.tools as MCPTool[];
  }

  /**
   * Call a tool by name with the given arguments.
   *
   * @example
   * ```typescript
   * const result = await client.call('github_list_repos', { owner: 'useconductor' });
   * console.log(result.text);
   * ```
   */
  async call(toolName: string, args: Record<string, unknown> = {}): Promise<MCPCallResult> {
    this.assertConnected();
    const result = await this.client.callTool({ name: toolName, arguments: args });
    return result as MCPCallResult;
  }

  /**
   * Call a tool and return the text output directly.
   * Throws if the tool call returns an error.
   */
  async callText(toolName: string, args: Record<string, unknown> = {}): Promise<string> {
    const result = await this.call(toolName, args);
    if (result.isError) {
      const msg = result.content.find((c) => c.type === 'text')?.text ?? 'Tool call failed';
      throw new Error(msg);
    }
    return result.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n');
  }

  /**
   * Returns true if the client is connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error('ConductorClient is not connected. Call connect() first.');
    }
  }
}
