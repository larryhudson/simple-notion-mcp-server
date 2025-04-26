# Simple Notion MCP Server

## Overview

This project implements a Model Context Protocol (MCP) server that acts as a bridge between AI assistants and the Notion API. Unlike the [official Notion MCP server](https://github.com/makenotion/notion-mcp-server) which returns large JSON blobs, this server renders Notion pages as Markdown, making them much more efficient for LLMs to process and understand.

## Features

- **Markdown Rendering**: Converts Notion pages to clean, readable Markdown format
- **Rich Text Support**: Preserves formatting for bold, italic, strikethrough, and code elements

## Setup

1. Create a Notion integration and get an API token from [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Set the token as an environment variable:

```bash
export NOTION_TOKEN=your-notion-api-token
```

Alternatively, you can create a `.env` file in your project with:
```
NOTION_TOKEN=your-notion-api-token
```

3. Make sure to share any Notion pages you want to access with your integration

## Usage

### Using with VS Code

Add this to your settings JSON file:

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "notion_token",
        "description": "Notion API Token",
        "password": true
      }
    ],
    "servers": {
      "notion": {
        "command": "npx",
        "args": [
          "-y",
          "@larryhudson/simple-notion-mcp-server"
        ],
        "env": {
          "NOTION_TOKEN": "${input:notion_token}"
        }
      }
    }
  }
}
```

### Using with Claude or other MCP-compatible applications

Add this to your MCP configuration JSON file:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@larryhudson/simple-notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "<YOUR_NOTION_API_TOKEN>"
      }
    }
  }
}
```

## Available Tools

### get_page

Retrieves a Notion page by ID and renders it as Markdown.

**Parameters**:
- `page_id`: The ID of the Notion page to retrieve

**Example**:
```json
{
  "page_id": "83c75a5b7a324be29d454536f2345678"
}
```

## How It Works

The server processes Notion pages through these steps:

1. Fetches page metadata using the Notion API
2. Retrieves all blocks from the page (with recursive fetching of child blocks)
3. Formats blocks into Markdown, maintaining structure and formatting
4. Returns a clean Markdown representation of the page

## Technical Details

Built with:
- **Model Context Protocol (MCP)**: Framework for allowing AI assistants to interact with external tools
- **Notion API Client**: Official client for communicating with Notion
- **TypeScript**: For type safety and better developer experience

## Development

You can use the Model Context Protocol inspector to try out the server:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```


## Limitations and Future Improvements

- Currently only supports retrieving pages (not updating or creating)
- Image handling could be improved in future updates (e.g. rendering images as base64 image blocks)

## License

MIT