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

/**
 * Create a new Notion page with the specified title and content blocks
 * @param parentPageId Parent page ID where the new page will be created
 * @param title Title for the new page
 * @param blocks Array of Notion block objects for page content
 * @returns The created page object
 */
export const createPage = async (
    parentPageId: string,
    title: string,
    blocks: any[]
): Promise<any> => {
    try {
        // Create a new page with the title
        const newPage = await notion.pages.create({
            parent: {
                page_id: parentPageId,
            },
            properties: {
                title: {
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
            },
            // We can't add children blocks directly when creating a page
            // We'll append them after the page is created
        });

        // If there are content blocks, append them to the newly created page
        if (blocks && blocks.length > 0) {
            await appendBlocksToPage(newPage.id, blocks);
        }

        return newPage;
    } catch (error) {
        console.error('Error creating new page:', error);
        throw error;
    }
}

/**
 * Append blocks to an existing Notion page
 * @param pageId ID of the page to append blocks to
 * @param blocks Array of Notion block objects to append
 * @returns The API response
 */
export const appendBlocksToPage = async (
    pageId: string,
    blocks: any[]
): Promise<any> => {
    try {
        if (!blocks || blocks.length === 0) {
            return { message: 'No blocks to append' };
        }

        const response = await notion.blocks.children.append({
            block_id: pageId,
            children: blocks,
        });

        return response;
    } catch (error) {
        console.error(`Error appending blocks to page ${pageId}:`, error);
        throw error;
    }
}


/**
 * Replace a block with multiple blocks
 * @param blockId ID of the block to replace
 * @param newBlocks Array of new blocks to insert at the same position
 * @returns A success message
 */
export const replaceBlock = async (
    blockId: string,
    newBlocks: any[]
): Promise<any> => {
    try {
        // First, get the current block to find its parent
        const currentBlock = await fetchBlock(blockId);
        
        if (!isFullBlock(currentBlock)) {
            throw new Error('Block cannot be replaced: not a full block');
        }
        
        // Get the parent block ID
        const parentId = currentBlock.parent.type === 'block_id' 
            ? currentBlock.parent.block_id 
            : currentBlock.parent.type === 'page_id'
                ? currentBlock.parent.page_id
                : null;
        
        if (!parentId) {
            throw new Error('Could not determine parent ID for block');
        }
        
        // Insert the new blocks after the current block
        // This ensures they'll be in the exact position we want
        const appendResponse = await notion.blocks.children.append({
            block_id: parentId,
            children: newBlocks,
            after: blockId
        });
        
        // Now that the new blocks are inserted, delete the original block
        await notion.blocks.delete({
            block_id: blockId,
        });
        
        return appendResponse;
    } catch (error) {
        console.error(`Error replacing block ${blockId}:`, error);
        throw error;
    }
}