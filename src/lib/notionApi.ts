import { Client, isFullBlock } from "@notionhq/client"
import { GetBlockResponse, GetPageResponse } from "@notionhq/client/build/src/api-endpoints.js"
import pMap from "p-map"
import type { NotionBlock, NotionBlockWithChildren } from "./types.js"
import "dotenv/config"

if (!process.env.NOTION_TOKEN) {
    throw new Error("NOTION_TOKEN is not set")
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const fetchChildBlocks = async (
    parentBlockId: string
): Promise<NotionBlock[]> => {
    let allBlocks: NotionBlock[] = [];
    let hasMoreToFetch = true;
    let startCursor: string | undefined = undefined;

    while (hasMoreToFetch) {
        const response = await notion.blocks.children.list({
            block_id: parentBlockId,
            start_cursor: startCursor,
        });

        allBlocks = [...allBlocks, ...response.results];
        hasMoreToFetch = response.has_more;
        startCursor = response.next_cursor ?? undefined;
    }

    return pMap(
        allBlocks,
        async (block) => {
            if (!isFullBlock(block)) {
                return block
            }
            
            if (block.has_children) {
                const childBlocks = await fetchChildBlocks(block.id);
                // Add children to the block while maintaining the original structure
                return {
                    ...block,
                    children: childBlocks
                } as NotionBlockWithChildren;
            }
            
            return block;
        },
        { concurrency: 3 } // Limit concurrent API requests
    );
}

export const fetchBlock = async (
    blockId: string
): Promise<GetBlockResponse> => {
    try {
        return await notion.blocks.retrieve({
            block_id: blockId,
        });
    } catch (error) {
        console.error(`Error fetching block ${blockId}:`, error);
        throw error;
    }
}

export const fetchPage = async (
    pageId: string
): Promise<GetPageResponse> => {
    try {
        return await notion.pages.retrieve({
            page_id: pageId,
        });
    } catch (error) {
        console.error(`Error fetching page ${pageId}:`, error);
        throw error;
    }
}

import { markdownToRichText } from './markdownToRichText.js';

export const addComment = async (
    blockId: string,
    commentContent: string
): Promise<any> => {
    try {
        // Convert markdown content to Notion's rich text format
        const richTextItems = markdownToRichText(commentContent);
        
        // If no rich text items were created (possibly empty content),
        // fall back to simple text content
        const richText = richTextItems.length > 0 ? richTextItems : [
            {
                type: 'text',
                text: {
                    content: commentContent || '',
                },
            },
        ];
        
        // According to Notion API documentation, comments can be created on pages or
        // as replies to existing comments in discussions
        const response = await notion.comments.create({
            parent: {
                page_id: blockId, // Using the block ID as the page ID
            },
            rich_text: richText,
        });
        
        return response;
    } catch (error) {
        console.error(`Error adding comment to block ${blockId}:`, error);
        throw error;
    }
}