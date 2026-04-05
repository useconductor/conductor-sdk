# @useconductor/sdk

TypeScript SDK for [Conductor](https://useconductor.com) — build plugins and connect to Conductor programmatically.

```bash
npm install @useconductor/sdk
```

---

## Connect and call tools

```typescript
import { ConductorClient } from '@useconductor/sdk';

const client = new ConductorClient({ transport: 'stdio' });
await client.connect();

// List all available tools
const tools = await client.listTools();
console.log(`${tools.length} tools available`);

// Call a tool — returns full MCP result
const result = await client.call('calculator_evaluate', { expression: '2 + 2' });

// Or get just the text output
const text = await client.callText('github_list_repos', { owner: 'useconductor' });
console.log(text);

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
          // ... fetch weather
          return `Weather in ${city}: 72°F, sunny`;
        },
      },
    ];
  }
}

export default new WeatherPlugin();
```

Drop the compiled `.js` output into `~/.conductor/plugins/` and Conductor will pick it up automatically.

Scaffold with tests:

```bash
conductor plugin create my-plugin
```

---

## Plugin with secrets

Use `configSchema` to declare fields stored in the OS keychain:

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
  inputSchema: { ... },
  handler: async (args) => { ... },
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

| Method | Description |
|---|---|
| `connect()` | Connect to the Conductor server |
| `disconnect()` | Disconnect |
| `listTools()` | List all available tools |
| `call(name, args?)` | Call a tool, returns full MCP result |
| `callText(name, args?)` | Call a tool, returns text output (throws on error) |
| `isConnected()` | Returns true if connected |

### `ConductorClientOptions`

```typescript
// Local (stdio)
{ transport: 'stdio'; command?: string; args?: string[]; env?: Record<string, string> }

// Remote (HTTP/SSE)
{ transport: 'http'; url: string }
```

---

## Exported types

```typescript
import type {
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
} from '@useconductor/sdk';
```

---

## License

Apache 2.0 — see the [main repo](https://github.com/useconductor/conductor) for details.
