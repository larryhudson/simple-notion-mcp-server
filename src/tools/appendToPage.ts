// filepath: /Users/larryhudson/github.com/larryhudson/simple-notion-mcp-server/src/tools/appendToPage.ts
import * as notionApi from "../lib/notionApi.js";
import { markdownToBlocks } from "../lib/markdownToBlocks.js";

/**
 * Append markdown content to an existing Notion page
 * @param pageId The ID of the page to append content to
 * @param markdownContent The markdown content to append
 * @returns A confirmation message
 */
export const handler = async (
    pageId: string,
    markdownContent: string
): Promise<string> => {
    try {
        // Validate inputs
        if (!pageId) {
            throw new Error("Page ID is required");
        }
        if (!markdownContent) {
            throw new Error("Markdown content is required");
        }

        // Convert markdown content to Notion blocks
        const blocks = markdownToBlocks(markdownContent);

        // Append blocks to the page using the notionApi function
        await notionApi.appendBlocksToPage(pageId, blocks);

        return `Content successfully appended to page ${pageId}`;
    } catch (error: any) {
        console.error(`Error appending content to page ${pageId}:`, error);
        throw new Error(`Failed to append content: ${error.message || "Unknown error"}`);
    }
};
