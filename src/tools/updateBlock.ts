// filepath: /Users/larryhudson/github.com/larryhudson/simple-notion-mcp-server/src/tools/updateBlock.ts
import * as notionApi from "../lib/notionApi.js";
import { markdownToBlocks } from "../lib/markdownToBlocks.js";

/**
 * Update a specific block with markdown content
 * @param blockId The ID of the block to update
 * @param markdownContent The new markdown content for the block
 * @returns A confirmation message
 */
export const handler = async (
    blockId: string,
    markdownContent: string
): Promise<string> => {
    try {
        // Validate inputs
        if (!blockId) {
            throw new Error("Block ID is required");
        }
        if (!markdownContent) {
            throw new Error("Markdown content is required");
        }

        // Convert markdown to Notion block format
        // For updating, we only need the first block from the conversion
        const blocks = markdownToBlocks(markdownContent);
        
        if (blocks.length === 0) {
            throw new Error("Failed to convert markdown content to block format");
        }
        
        // Take only the content of the first block for updating
        const blockContent = blocks[0];

        // Update the block using the notionApi function
        await notionApi.updateBlock(blockId, blockContent);

        return `Block ${blockId} updated successfully`;
    } catch (error: any) {
        console.error(`Error updating block ${blockId}:`, error);
        throw new Error(`Failed to update block: ${error.message || "Unknown error"}`);
    }
};
