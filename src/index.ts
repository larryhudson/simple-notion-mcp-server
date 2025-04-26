import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handler as handleGetPage } from "./tools/getPage.js"

const server = new McpServer({
  name: "Simple Notion MCP server",
  version: "1.0.0"
});

server.tool("get_page",
    "Get a Notion page by ID, rendered as Markdown",
  { page_id: z.string() },
  async ({ page_id }) => {
    // TODO: consider making handleGetPage return the whole tool response object
    const markdown = await handleGetPage(page_id);
    return {
      content: [{
        type: "text",
        text: markdown
      }]
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);