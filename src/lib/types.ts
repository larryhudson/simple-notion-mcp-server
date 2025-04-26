// filepath: /Users/larryhudson/github.com/larryhudson/simple-notion-mcp-server/src/lib/types.ts
import { BlockObjectResponse, PartialBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints.js";

/**
 * Extended type for Notion blocks that include children.
 * This represents the structure that results from our fetchChildBlocks function
 * which attaches children directly to parent blocks.
 */
export type NotionBlockWithChildren = BlockObjectResponse & {
  children?: NotionBlockWithChildren[];
};

/**
 * Union type representing either a full block with children or a partial block
 */
export type NotionBlock = NotionBlockWithChildren | PartialBlockObjectResponse;
