#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handler as handleGetPage } from "./tools/getPage.js"
import { handler as handleAddComment } from "./tools/addComment.js"

const server = new McpServer({
  name: "Simple Notion MCP server",
  version: "1.0.0"
});

server.tool("get_page",
    "Get a Notion page by ID, rendered as Markdown. Set with_block_ids to true if you want to add comments to specific blocks later.",
  { 
    page_id: z.string(),
    with_block_ids: z.boolean().optional().default(false)
  },
  async ({ page_id, with_block_ids }) => {
    // TODO: consider making handleGetPage return the whole tool response object
    const markdown = await handleGetPage(page_id, with_block_ids);
    return {
      content: [{
        type: "text",
        text: markdown
      }]
    }
  }
);

server.tool("add_comment",
    "Add a comment to a specific block in a Notion page. The block_id can be obtained from get_page with with_block_ids=true.",
  { 
    block_id: z.string(),
    comment_content: z.string()
  },
  async ({ block_id, comment_content }) => {
    const result = await handleAddComment(block_id, comment_content);
    return {
      content: [{
        type: "text",
        text: result
      }]
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);