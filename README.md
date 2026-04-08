# @useconductor/sdk

TypeScript SDK for [Conductor](https://useconductor.com) — build plugins and connect to Conductor programmatically.

```bash
npm install @useconductor/sdk
```

---

## Quick start

```typescript
import { ConductorClient } from '@useconductor/sdk';

// Connect to a local Conductor process via stdio (default)
const client = new ConductorClient({ transport: 'stdio' });
await client.connect();

// List all available tools
const tools = await client.listTools();
console.log(`${tools.length} tools available`);

// Call a tool — returns full MCP result
const result = await client.call('calculator_evaluate', { expression: '2 + 2' });
console.log(result.content); // [{ type: 'text', text: '4' }]

// Or get just the text output directly (throws on tool error)
const text = await client.callText('calculator_evaluate', { expression: '2 + 2' });
console.log(text); // "4"

await client.disconnect();
```

### Remote (HTTP/SSE)

```typescript
const client = new ConductorClient({
  transport: 'http',
  url: 'http://localhost:3000',
});
```

### With npx (no global install)

```typescript
const client = new ConductorClient({
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@useconductor/conductor', 'mcp', 'start'],
});
```

---

## Build a plugin

Implement the `Plugin` interface and export a default instance. Conductor will load the compiled `.js` file from `~/.conductor/plugins/` automatically.

```typescript
import { Plugin, PluginTool, IConfig } from '@useconductor/sdk';

class WeatherPlugin implements Plugin {
  name = 'weather';
  description = 'Get current weather';
  version = '1.0.0';

  private apiKey?: string;

  async initialize(config: IConfig): Promise<void> {
    this.apiKey = config.get<string>('weather.apiKey');
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getTools(): PluginTool[] {
    return [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
          },
          required: ['city'],
        },
        handler: async (args) => {
          const city = args.city as string;
          // ... fetch weather using this.apiKey
          return `Weather in ${city}: 72°F, sunny`;
        },
      },
    ];
  }
}

export default new WeatherPlugin();
```

Scaffold a plugin with tests:

```bash
conductor plugin create my-plugin
```

---

## Plugin with secrets

Use `configSchema` to declare config fields stored in the OS keychain:

```typescript
import { Plugin, PluginTool, PluginConfigSchema, IConfig } from '@useconductor/sdk';

class MyPlugin implements Plugin {
  name = 'my-plugin';
  description = 'Needs an API key';
  version = '1.0.0';

  configSchema: PluginConfigSchema = {
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        description: 'Your service API key',
        type: 'string',
        secret: true,   // stored in OS keychain, not config.json
        required: true,
      },
    ],
  };

  async initialize(_config: IConfig): Promise<void> {}
  isConfigured(): boolean { return true; }
  getTools(): PluginTool[] { return []; }
}
```

---

## Dangerous tools

Mark tools that modify state as `requiresApproval: true` — Conductor will prompt for confirmation before calling them:

```typescript
{
  name: 'delete_record',
  description: 'Permanently delete a record',
  requiresApproval: true,
  inputSchema: { type: 'object', properties: {} },
  handler: async (args) => { /* ... */ },
}
```

---

## Proactive context

Implement `getContext()` to participate in Conductor's autonomous reasoning cycle:

```typescript
async getContext(): Promise<string | null> {
  const unread = await this.getUnreadCount();
  if (unread === 0) return null;
  return `${unread} unread notifications pending review.`;
}
```

---

## API reference

### `ConductorClient`

```typescript
new ConductorClient(options?: ConductorClientOptions)
```

| Method | Returns | Description |
|---|---|---|
| `connect()` | `Promise<void>` | Connect to the Conductor server. Must be called before other methods. |
| `disconnect()` | `Promise<void>` | Disconnect from the server. |
| `listTools()` | `Promise<MCPTool[]>` | List all tools exposed by the server. |
| `call(name, args?)` | `Promise<MCPCallResult>` | Call a tool, returns the full MCP result. |
| `callText(name, args?)` | `Promise<string>` | Call a tool and return the concatenated text output. Throws if the tool returns an error. |
| `isConnected()` | `boolean` | Returns `true` if currently connected. |

### `ConductorClientOptions`

```typescript
// Local process via stdio (default)
{ transport: 'stdio'; command?: string; args?: string[]; env?: Record<string, string> }

// Remote server via HTTP/SSE
{ transport: 'http'; url: string }
```

---

## Exported types

```typescript
import type {
  // Client
  ConductorClientOptions,
  StdioTransportOptions,
  HttpTransportOptions,
  MCPTool,
  MCPCallResult,

  // Plugin system
  Plugin,
  PluginTool,
  PluginConfigSchema,
  PluginConfigField,
  SchemaProperty,
  ToolContext,
  IConfig,
} from '@useconductor/sdk';
```

### `Plugin`

```typescript
interface Plugin {
  name: string;
  description: string;
  version: string;
  configSchema?: PluginConfigSchema;
  initialize(config: IConfig): Promise<void>;
  isConfigured(): boolean;
  getTools(): PluginTool[];
  getContext?(): Promise<string | null>;
}
```

### `PluginTool`

```typescript
interface PluginTool {
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
```

### `MCPCallResult`

```typescript
interface MCPCallResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}
```

---

## License

Apache 2.0 — see the [main repo](https://github.com/useconductor/conductor) for details.
