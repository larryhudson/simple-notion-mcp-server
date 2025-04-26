import * as notionApi from "../lib/notionApi.js";
import { markdownToBlocks } from "../lib/markdownToBlocks.js";

/**
 * Replace a specific block with markdown content
 * @param blockId The ID of the block to replace
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
        const newBlocks = markdownToBlocks(markdownContent);
        
        if (newBlocks.length === 0) {
            throw new Error("Failed to convert markdown content to block format");
        }

        await notionApi.replaceBlock(blockId, newBlocks);

        return `Block ${blockId} replaced successfully with ${newBlocks.length} block(s)`;
    } catch (error: any) {
        console.error(`Error replacing block ${blockId}:`, error);
        throw new Error(`Failed to replace block: ${error.message || "Unknown error"}`);
    }
};
