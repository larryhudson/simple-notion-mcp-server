import * as formatter from "../lib/formatter.js";
import * as notionApi from "../lib/notionApi.js";

export const handler = async (
    pageId: string
): Promise<string> => {
    // Fetch page information to get title and other metadata
    const pageInfo = await notionApi.fetchPage(pageId);
    const frontmatter = formatter.renderPageInfoFrontmatter(pageInfo);
    
    // Fetch blocks for the page content
    const blocks = await notionApi.fetchChildBlocks(pageId);
    const blocksContent = formatter.renderBlocksAsMarkdown(blocks);

    return `${frontmatter}\n\n${blocksContent}`;
}