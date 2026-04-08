import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mutable state for the mock instance so tests can override per-test behaviour
const mockClientInstance = {
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  listTools: vi.fn().mockResolvedValue({
    tools: [{ name: 'calc_math', description: 'Math', inputSchema: {} }],
  }),
  callTool: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '4' }],
    isError: false,
  }),
};

// Mock the MCP Client
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(function () {
    return mockClientInstance;
  }),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

import { ConductorClient } from '../src/client.js';

describe('ConductorClient', () => {
  let client: ConductorClient;

  beforeEach(() => {
    // Reset all mock function call counts and restore default return values
    mockClientInstance.connect.mockReset().mockResolvedValue(undefined);
    mockClientInstance.close.mockReset().mockResolvedValue(undefined);
    mockClientInstance.listTools.mockReset().mockResolvedValue({
      tools: [{ name: 'calc_math', description: 'Math', inputSchema: {} }],
    });
    mockClientInstance.callTool.mockReset().mockResolvedValue({
      content: [{ type: 'text', text: '4' }],
      isError: false,
    });
    client = new ConductorClient({ transport: 'stdio' });
  });

  // ── connect() ────────────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('connects successfully via stdio transport', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
      expect(mockClientInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('connects successfully via http transport', async () => {
      const httpClient = new ConductorClient({
        transport: 'http',
        url: 'http://localhost:3000',
      });
      await httpClient.connect();
      expect(httpClient.isConnected()).toBe(true);
    });

    it('does not reconnect if already connected', async () => {
      await client.connect();
      await client.connect(); // second call should be a no-op
      expect(mockClientInstance.connect).toHaveBeenCalledTimes(1);
    });
  });

  // ── listTools() ───────────────────────────────────────────────────────────────

  describe('listTools()', () => {
    it('returns the list of tools from the server', async () => {
      await client.connect();
      const tools = await client.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('calc_math');
      expect(tools[0].description).toBe('Math');
    });

    it('throws if not connected', async () => {
      await expect(client.listTools()).rejects.toThrow(
        'ConductorClient is not connected. Call connect() first.'
      );
    });
  });

  // ── call() ────────────────────────────────────────────────────────────────────

  describe('call()', () => {
    it('calls a tool and returns the full MCP result', async () => {
      await client.connect();
      const result = await client.call('calc_math', { expression: '2 + 2' });
      expect(mockClientInstance.callTool).toHaveBeenCalledWith({
        name: 'calc_math',
        arguments: { expression: '2 + 2' },
      });
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('4');
    });

    it('throws if not connected', async () => {
      await expect(client.call('calc_math', {})).rejects.toThrow(
        'ConductorClient is not connected. Call connect() first.'
      );
    });
  });

  // ── callText() ────────────────────────────────────────────────────────────────

  describe('callText()', () => {
    it('extracts and returns the text content from a tool result', async () => {
      await client.connect();
      const text = await client.callText('calc_math', { expression: '2 + 2' });
      expect(text).toBe('4');
    });

    it('joins multiple text content items with newlines', async () => {
      mockClientInstance.callTool.mockResolvedValue({
        content: [
          { type: 'text', text: 'line one' },
          { type: 'text', text: 'line two' },
        ],
        isError: false,
      });
      await client.connect();
      const text = await client.callText('multi_tool');
      expect(text).toBe('line one\nline two');
    });

    it('throws when the tool call returns an error', async () => {
      mockClientInstance.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'something went wrong' }],
        isError: true,
      });
      await client.connect();
      await expect(client.callText('bad_tool')).rejects.toThrow('something went wrong');
    });

    it('throws with fallback message when error has no text content', async () => {
      mockClientInstance.callTool.mockResolvedValue({
        content: [],
        isError: true,
      });
      await client.connect();
      await expect(client.callText('bad_tool')).rejects.toThrow('Tool call failed');
    });

    it('throws if not connected', async () => {
      await expect(client.callText('calc_math')).rejects.toThrow(
        'ConductorClient is not connected. Call connect() first.'
      );
    });
  });

  // ── disconnect() ─────────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('disconnects after being connected', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
      expect(mockClientInstance.close).toHaveBeenCalledTimes(1);
    });

    it('does nothing if already disconnected', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
      expect(client.isConnected()).toBe(false);
      expect(mockClientInstance.close).not.toHaveBeenCalled();
    });
  });

  // ── isConnected() ────────────────────────────────────────────────────────────

  describe('isConnected()', () => {
    it('returns false before connect', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('returns true after connect', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it('returns false after disconnect', async () => {
      await client.connect();
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });
});
