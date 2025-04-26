import { isFullBlock } from "@notionhq/client";
import { 
  BlockObjectResponse,
  GetBlockResponse, 
  RichTextItemResponse 
} from "@notionhq/client/build/src/api-endpoints.js";
import { type NotionBlockWithChildren } from "./types.js";

const renderRichText = (richTextArray: Array<RichTextItemResponse> = []): string => {
    return richTextArray.map(text => {
        let content = text.plain_text;
        
        // Apply formatting based on annotations
        if (text.annotations.bold) content = `**${content}**`;
        if (text.annotations.italic) content = `*${content}*`;
        if (text.annotations.strikethrough) content = `~~${content}~~`;
        if (text.annotations.code) content = `\`${content}\``;
        
        // Add link if present
        if (text.href) content = `[${content}](${text.href})`;
        
        return content;
    }).join('');
};

const renderChildren = (children: NotionBlockWithChildren[], withBlockIds: boolean = false): string => {
    if (!children || !children.length) {
        return '';
    }
    
    return children.map(block => renderBlockAsMarkdown(block, withBlockIds)).join('');
};

type BlockFormatterMap = {
  [Type in BlockObjectResponse['type']]?: (
    block: Extract<NotionBlockWithChildren, { type: Type }>,
    withBlockIds?: boolean
  ) => string;
};

const blockFormatters: BlockFormatterMap = {
    paragraph: (block) => {
        const content = renderRichText(block.paragraph.rich_text);
        return content ? `${content}\n\n` : '\n';
    },
    
    heading_1: (block) => {
        const content = renderRichText(block.heading_1.rich_text);
        return `# ${content}\n\n`;
    },
    
    heading_2: (block) => {
        const content = renderRichText(block.heading_2.rich_text);
        return `## ${content}\n\n`;
    },
    
    heading_3: (block) => {
        const content = renderRichText(block.heading_3.rich_text);
        return `### ${content}\n\n`;
    },
    
    bulleted_list_item: (block, withBlockIds = false) => {
        const content = renderRichText(block.bulleted_list_item.rich_text);
        let bulletedContent = `- ${content}`;
        
        if (block.children && block.children.length > 0) {
            bulletedContent += '\n' + renderChildren(block.children, withBlockIds);
        }
        
        return `${bulletedContent}\n`;
    },
    
    numbered_list_item: (block, withBlockIds = false) => {
        const content = renderRichText(block.numbered_list_item.rich_text);
        let numberedContent = `1. ${content}`;
        
        if (block.children && block.children.length > 0) {
            numberedContent += '\n' + renderChildren(block.children, withBlockIds);
        }
        
        return `${numberedContent}\n`;
    },
    
    to_do: (block, withBlockIds = false) => {
        const checked = block.to_do.checked ? 'x' : ' ';
        const content = renderRichText(block.to_do.rich_text);
        
        let todoContent = `- [${checked}] ${content}`;
        
        if (block.children && block.children.length > 0) {
            todoContent += '\n' + renderChildren(block.children, withBlockIds);
        }
        
        return `${todoContent}\n`;
    },
    
    toggle: (block, withBlockIds = false) => {
        const content = renderRichText(block.toggle.rich_text);
        const childContent = block.children && block.children.length > 0 
            ? renderChildren(block.children, withBlockIds) 
            : '';
            
        return `<details>\n<summary>${content}</summary>\n${childContent}</details>\n\n`;
    },
    
    code: (block) => {
        const language = block.code.language || '';
        const content = renderRichText(block.code.rich_text);
        return `\`\`\`${language}\n${content}\n\`\`\`\n\n`;
    },
    
    quote: (block, withBlockIds = false) => {
        const content = renderRichText(block.quote.rich_text);
        
        let quoteContent = `> ${content}`;
        
        if (block.children && block.children.length > 0) {
            quoteContent += '\n' + renderChildren(block.children, withBlockIds);
        }
        
        return `${quoteContent}\n\n`;
    },
    
    divider: () => '---\n\n',
    
    callout: (block, withBlockIds = false) => {
        const emoji = block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : '';
        const content = renderRichText(block.callout.rich_text);
        
        let calloutContent = `> ${emoji} ${content}`;
        
        if (block.children && block.children.length > 0) {
            calloutContent += '\n' + renderChildren(block.children, withBlockIds);
        }
        
        return `${calloutContent}\n\n`;
    },
    
    image: (block) => {
        const caption = block.image.caption ? renderRichText(block.image.caption) : '';
        let url = '';
        
        if (block.image.type === 'external') {
            url = block.image.external.url;
        } else if (block.image.type === 'file') {
            url = block.image.file.url;
        }
        
        return `![${caption}](${url})\n\n`;
    },
};

const renderBlockAsMarkdown = (
    block: GetBlockResponse | NotionBlockWithChildren,
    withBlockIds: boolean = false
): string => {
    // Handle partial block objects
    if (!isFullBlock(block)) {
        return '';
    }

    // Cast to our custom type that includes children
    // TODO: use a type guard instead of casting
    const blockWithChildren = block as NotionBlockWithChildren;

    let renderedContent = '';
    
    // Use the type-safe formatter if available
    const formatter = blockFormatters[blockWithChildren.type];
    if (formatter) {
        // Type assertion is still needed because TypeScript can't narrow union types perfectly
        // TODO: find a way to avoid this casting
        renderedContent = formatter(blockWithChildren as any);
    }
    
    // Default handler for unknown block types with children
    if (!renderedContent && blockWithChildren.children && blockWithChildren.children.length > 0) {
        renderedContent = renderChildren(blockWithChildren.children, withBlockIds);
    }
    
    // If withBlockIds is true, add the block ID as an HTML comment at the beginning
    if (withBlockIds && renderedContent && block.id) {
        return `<!-- block_id: ${block.id} -->\n${renderedContent}`;
    }
    
    return renderedContent;
};

export const renderBlocksAsMarkdown = (
    blocks: Array<GetBlockResponse | NotionBlockWithChildren>,
    withBlockIds: boolean = false
): string => blocks.map(block => renderBlockAsMarkdown(block, withBlockIds)).join('');

export const renderBlockInfoFrontmatter = (
    blockInfo: GetBlockResponse | NotionBlockWithChildren
): string => {
    if (!isFullBlock(blockInfo)) {
        throw new Error("Block info is not a full block object");
    }

    const frontmatter = {
        createdTime: blockInfo.created_time,
        lastEditedTime: blockInfo.last_edited_time,
        // TODO: consider adding other properties here
    };
    
    // Format as YAML frontmatter
    const frontmatterStr = Object.entries(frontmatter)
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n');
    
    return `---\n${frontmatterStr}\n---\n\n`;
}

export const renderPageInfoFrontmatter = (
    pageInfo: any
): string => {
    // Extract page title from properties
    let title = "";
    if (pageInfo.properties && pageInfo.properties.title) {
        const titleProperty = pageInfo.properties.title;
        if (titleProperty.type === "title" && Array.isArray(titleProperty.title)) {
            title = titleProperty.title
                .map((richText: any) => richText.plain_text)
                .join("");
        }
    }
    
    const frontmatter = {
        title,
        createdTime: new Date(pageInfo.created_time).toLocaleString(),
        lastEditedTime: new Date(pageInfo.last_edited_time).toLocaleString(),
        // We could add more page properties here if needed
    };
    
    // Format as YAML frontmatter
    const frontmatterStr = Object.entries(frontmatter)
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n');
    
    return `---\n${frontmatterStr}\n---\n\n`;
}
