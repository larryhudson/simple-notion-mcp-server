import * as notionApi from "../lib/notionApi.js";

/**
 * Add a comment to a specific block in a Notion page
 * @param blockId The ID of the block to add the comment to
 * @param commentContent The markdown content to add as a comment
 * @returns A confirmation message with the comment ID
 */
export const handler = async (
    blockId: string,
    commentContent: string
): Promise<string> => {
    try {
        // Validate inputs
        if (!blockId) {
            throw new Error("Block ID is required");
        }
        if (!commentContent) {
            throw new Error("Comment content is required");
        }

        // Add comment to the block using the notionApi function
        const response = await notionApi.addComment(blockId, commentContent);

        return `Comment added successfully with ID: ${response.id}`;
    } catch (error: any) {
        console.error(`Error adding comment to block ${blockId}:`, error);
        throw new Error(`Failed to add comment: ${error.message || "Unknown error"}`);
    }
};
