
# OSRS Wiki MCP Server

This project is an MCP (Model Context Protocol) server for Old School RuneScape, providing tools to interact with the OSRS Wiki and RuneLite player data. It is designed to run on Cloudflare Workers and can be connected to LLM clients like Claude Desktop or the Cloudflare AI Playground.

## Features

- **Wiki Search**: Search the Old School RuneScape Wiki for articles and information.
- **Page Summarize**: Get readable summaries of any OSRS Wiki page.
- **Player Data**: Fetch RuneLite player data via the WikiSync plugin (RuneLite client required). Data is cached for one hour and can be refreshed on demand.
  - If no player data is found, users are prompted to check their username and install the WikiSync plugin.
- **Personalized Results**: Search and summarize tools can use player data to curate results if a username is provided.

## Usage

Deploy this MCP server to Cloudflare Workers, then connect from your preferred MCP client:

### Cloudflare AI Playground
1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (e.g. `osrs-wiki-mcp.<your-account>.workers.dev/sse`)
3. Use the tools directly from the playground.

### Claude Desktop
1. Install [mcp-remote](https://www.npmjs.com/package/mcp-remote) and follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user).
2. In Claude Desktop, go to Settings > Developer > Edit Config and add your MCP server URL.
3. Restart Claude to see the tools become available.

## Customization

Add or modify tools in `src/index.ts` using the MCP SDK. See the `init()` method for examples.

## Requirements
- Cloudflare Workers account
- Node.js and npm for local development
- RuneLite client with WikiSync plugin for player data features

## License
MIT
    "calculator": {
