import { marked } from 'marked';
import type { Tokens } from 'marked';

// Define the types based on Notion API documentation
interface NotionRichText {
  type: 'text';
  text: {
    content: string;
    link?: { url: string };
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

/**
 * Converts Markdown text to Notion's rich text format.
 * This function handles basic Markdown formatting: bold, italic, links, code.
 * 
 * @param markdownContent The markdown content to convert
 * @returns An array of rich text objects for Notion API
 */
export function markdownToRichText(markdownContent: string): any[] {
  if (!markdownContent || !markdownContent.trim()) {
    return [];
  }

  // Initialize rich text items array
  const richTextItems: NotionRichText[] = [];

  // Use a custom renderer to convert markdown to rich text objects
  const renderer = new marked.Renderer();

  // Track active annotations during parsing
  const activeAnnotations = {
    bold: false,
    italic: false,
    code: false,
    strikethrough: false,
  };

  // Create a simple segment of text with current annotations
  const createSegment = (text: string, override: Partial<typeof activeAnnotations> = {}, link?: string) => {
    if (!text) return;

    const annotations: NotionRichText['annotations'] = {};
    
    if (activeAnnotations.bold || override.bold) annotations.bold = true;
    if (activeAnnotations.italic || override.italic) annotations.italic = true;
    if (activeAnnotations.code || override.code) annotations.code = true;
    if (activeAnnotations.strikethrough || override.strikethrough) annotations.strikethrough = true;

    const textObj: NotionRichText = {
      type: 'text',
      text: { content: text }
    };

    if (link) {
      textObj.text.link = { url: link };
    }

    if (Object.keys(annotations).length > 0) {
      textObj.annotations = annotations;
    }

    richTextItems.push(textObj);
  };

  // Override necessary renderer functions
  renderer.strong = (token: Tokens.Strong) => {
    activeAnnotations.bold = true;
    createSegment(token.text);
    activeAnnotations.bold = false;
    return '';
  };

  renderer.em = (token: Tokens.Em) => {
    activeAnnotations.italic = true;
    createSegment(token.text);
    activeAnnotations.italic = false;
    return '';
  };

  renderer.codespan = (token: Tokens.Codespan) => {
    activeAnnotations.code = true;
    createSegment(token.text);
    activeAnnotations.code = false;
    return '';
  };

  renderer.del = (token: Tokens.Del) => {
    activeAnnotations.strikethrough = true;
    createSegment(token.text);
    activeAnnotations.strikethrough = false;
    return '';
  };

  renderer.link = (token: Tokens.Link) => {
    createSegment(token.text, {}, token.href);
    return '';
  };

  renderer.text = (token: Tokens.Text) => {
    createSegment(token.text);
    return '';
  };

  // Parse markdown with custom renderer
  marked(markdownContent, { renderer });

  return richTextItems;
}
