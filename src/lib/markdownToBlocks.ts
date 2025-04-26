import { marked } from 'marked';
import { markdownToRichText } from './markdownToRichText.js';
import type { Tokens, TokensList } from 'marked';

// Type guards for marked token types
function isHeadingToken(token: any): token is Tokens.Heading {
    return token.type === 'heading' && 'depth' in token && 'text' in token;
}

function isParagraphToken(token: any): token is Tokens.Paragraph {
    return token.type === 'paragraph' && 'text' in token;
}

function isListToken(token: any): token is Tokens.List {
    return token.type === 'list' && 'items' in token && 'ordered' in token;
}

function isBlockquoteToken(token: any): token is Tokens.Blockquote {
    return token.type === 'blockquote' && 'tokens' in token;
}

function isCodeToken(token: any): token is Tokens.Code {
    return token.type === 'code' && 'text' in token;
}

/**
 * Convert markdown string to an array of Notion blocks
 * @param markdown - The markdown string to convert
 * @returns Array of Notion block objects ready for the API
 */
export function markdownToBlocks(markdown: string): any[] {
    if (!markdown || !markdown.trim()) {
        return [];
    }

    // Parse the markdown into tokens
    const tokens = marked.lexer(markdown);
    
    // Convert tokens to Notion blocks
    return tokensToBlocks(tokens);
}

/**
 * Convert marked tokens to Notion blocks
 * @param tokens - The tokens from marked lexer
 * @returns Array of Notion block objects
 */
function tokensToBlocks(tokens: TokensList): any[] {
    const blocks: any[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        switch (token.type) {
            case 'heading':
                if (isHeadingToken(token)) {
                    blocks.push(createHeadingBlock(token));
                }
                break;
                
            case 'paragraph':
                if (isParagraphToken(token)) {
                    blocks.push(createParagraphBlock(token));
                }
                break;
                
            case 'list':
                if (isListToken(token)) {
                    blocks.push(...createListBlocks(token));
                }
                break;
                
            case 'blockquote':
                if (isBlockquoteToken(token)) {
                    blocks.push(createQuoteBlock(token));
                }
                break;
                
            case 'code':
                if (isCodeToken(token)) {
                    blocks.push(createCodeBlock(token));
                }
                break;
                
            case 'hr':
                blocks.push(createDividerBlock());
                break;
                
            // Add more cases as needed for other markdown elements
        }
    }
    
    return blocks;
}

/**
 * Create a heading block from a marked heading token
 */
function createHeadingBlock(token: Tokens.Heading): any {
    const headingType = `heading_${token.depth}` as const;
    
    return {
        object: 'block',
        type: headingType,
        [headingType]: {
            rich_text: markdownToRichText(token.text),
            color: 'default'
        }
    };
}

/**
 * Create a paragraph block from a marked paragraph token
 */
function createParagraphBlock(token: Tokens.Paragraph): any {
    return {
        object: 'block',
        type: 'paragraph',
        paragraph: {
            rich_text: markdownToRichText(token.text),
            color: 'default'
        }
    };
}

/**
 * Create list blocks from a marked list token
 */
function createListBlocks(token: Tokens.List): any[] {
    const blocks: any[] = [];
    const listType = token.ordered ? 'numbered_list_item' : 'bulleted_list_item';
    
    for (const item of token.items) {
        blocks.push({
            object: 'block',
            type: listType,
            [listType]: {
                rich_text: markdownToRichText(item.text),
                color: 'default'
            }
        });
    }
    
    return blocks;
}

/**
 * Create a quote block from a marked blockquote token
 */
function createQuoteBlock(token: Tokens.Blockquote): any {
    // Join the blockquote items into a single string
    const text = token.tokens
        .map(t => {
            if (t.type === 'paragraph') {
                return (t as Tokens.Paragraph).text;
            }
            return '';
        })
        .join('\n');
    
    return {
        object: 'block',
        type: 'quote',
        quote: {
            rich_text: markdownToRichText(text),
            color: 'default'
        }
    };
}

/**
 * Create a code block from a marked code token
 */
function createCodeBlock(token: Tokens.Code): any {
    return {
        object: 'block',
        type: 'code',
        code: {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: token.text
                    }
                }
            ],
            language: token.lang || 'plain text'
        }
    };
}

/**
 * Create a divider block
 */
function createDividerBlock(): any {
    return {
        object: 'block',
        type: 'divider',
        divider: {}
    };
}
