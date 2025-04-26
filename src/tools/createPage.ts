// filepath: /Users/larryhudson/github.com/larryhudson/simple-notion-mcp-server/src/tools/createPage.ts
import * as notionApi from "../lib/notionApi.js";
import { markdownToBlocks } from "../lib/markdownToBlocks.js";

/**
 * Create a new Notion page with supplied markdown content
 * @param parentPageId The ID of the parent page where the new page will be created
 * @param title The title of the new page
 * @param markdownContent The markdown content for the new page
 * @returns A confirmation message with the new page ID
 */
export const handler = async (
    parentPageId: string,
    title: string,
    markdownContent: string
): Promise<string> => {
    try {
        // Validate inputs
        if (!parentPageId) {
            throw new Error("Parent page ID is required");
        }
        if (!title) {
            throw new Error("Title is required");
        }

        // Convert markdown content to Notion blocks
        const blocks = markdownToBlocks(markdownContent);

        // Create the page using the notionApi function
        const response = await notionApi.createPage(parentPageId, title, blocks);

        return `Page created successfully with ID: ${response.id}`;
    } catch (error: any) {
        console.error(`Error creating page:`, error);
        throw new Error(`Failed to create page: ${error.message || "Unknown error"}`);
    }
};
