// @ts-nocheck
import untypedLogger from '../middleware/logging';
import {LoggerWithAudit} from "../types/migration";

const logger = untypedLogger as unknown as LoggerWithAudit;

/**
 * Utility for processing markdown content into HTML for display in the React frontend
 * This provides a more comprehensive markdown-to-HTML conversion than the basic 
 * processContentForPreview method in SubmissionService
 */
class MarkdownProcessor {
    
    /**
     * Convert markdown content to HTML for frontend display
     * @param content Raw markdown content
     * @returns HTML-formatted content ready for display
     */
    processMarkdownToHtml(content: string): string {
        if (!content || !content.trim()) {
            return '';
        }

        let html = content.trim();

        try {
            // Process markdown elements in order of precedence
            html = this.processHeadings(html);
            html = this.processTextFormatting(html);
            html = this.processList(html);
            html = this.processLinks(html);
            html = this.processParagraphs(html);
            html = this.processHeadings(html); // Second pass to catch any headings in paragraph tags
            html = this.cleanupHtml(html);

            logger.audit('Markdown processed to HTML', {
                originalLength: content.length,
                htmlLength: html.length,
                hasHeadings: html.includes('<h'),
                hasParagraphs: html.includes('<p>')
            });

            return html;

        } catch (error: any) {
            logger.error('Error processing markdown to HTML', {
                contentLength: content.length,
                error: error?.message
            });
            
            // Fallback: basic paragraph wrapping
            return this.basicFallbackProcessing(content);
        }
    }

    /**
     * Process markdown headings (## Header -> <h2>Header</h2>)
     */
    private processHeadings(content: string): string {
        return content
            .replace(/^### (.*)$/gim, '<h3>$1</h3>')
            .replace(/^## (.*)$/gim, '<h2>$1</h2>')
            .replace(/^# (.*)$/gim, '<h1>$1</h1>')
            // Also handle headings that might have spaces around them
            .replace(/^\s*### (.*)\s*$/gim, '<h3>$1</h3>')
            .replace(/^\s*## (.*)\s*$/gim, '<h2>$1</h2>')
            .replace(/^\s*# (.*)\s*$/gim, '<h1>$1</h1>');
    }

    /**
     * Process text formatting (bold, italic)
     */
    private processTextFormatting(content: string): string {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
            .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *italic*
    }

    /**
     * Process basic lists
     */
    private processList(content: string): string {
        // Simple bullet list processing
        return content.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
    }

    /**
     * Process links [text](url)
     */
    private processLinks(content: string): string {
        return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }

    /**
     * Process paragraphs - convert double line breaks to paragraph breaks
     */
    private processParagraphs(content: string): string {
        // Split content into paragraphs based on double line breaks
        const paragraphs = content.split(/\n\s*\n/);
        
        return paragraphs
            .filter(p => p.trim()) // Remove empty paragraphs
            .map(paragraph => {
                const trimmed = paragraph.trim();
                
                // Skip if already wrapped in HTML tags
                if (trimmed.startsWith('<h') || trimmed.startsWith('<li>') || trimmed.startsWith('<p>')) {
                    return trimmed;
                }
                
                // Don't wrap headings that weren't processed properly
                if (trimmed.match(/^\s*#{1,3}\s+/)) {
                    return trimmed; // Return as-is for reprocessing
                }
                
                // Convert single line breaks to <br> within paragraphs
                const withBreaks = trimmed.replace(/\n/g, '<br>');
                return `<p>${withBreaks}</p>`;
            })
            .join('\n\n');
    }

    /**
     * Clean up HTML formatting
     */
    private cleanupHtml(html: string): string {
        return html
            .replace(/<p>\s*(<h[1-6][^>]*>.*?<\/h[1-6]>)\s*<\/p>/g, '$1') // Remove p tags around headings
            .replace(/<p>\s*(#{1,3})\s+(.*?)\s*<\/p>/g, (match, hashes, text) => {
                const level = hashes.length;
                return `<h${level}>${text.trim()}</h${level}>`;
            }) // Convert paragraph-wrapped markdown headings
            .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
            .replace(/\s+/g, ' ') // Normalize whitespace within content
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            .trim();
    }

    /**
     * Basic fallback processing if main processing fails
     */
    private basicFallbackProcessing(content: string): string {
        return content
            .split('\n\n')
            .filter(p => p.trim())
            .map(paragraph => `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`)
            .join('\n');
    }

    /**
     * Validate that the generated HTML is reasonable
     */
    validateHtml(html: string): boolean {
        if (!html || !html.trim()) {
            return false;
        }

        // Basic checks
        const hasContent = html.length > 10;
        const hasProperTags = html.includes('<p>') || html.includes('<h');
        const noUnclosedTags = this.checkTagBalance(html);

        return hasContent && hasProperTags && noUnclosedTags;
    }

    /**
     * Basic check for balanced HTML tags
     */
    private checkTagBalance(html: string): boolean {
        const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
        const closeTags = (html.match(/<\/[^>]*>/g) || []).length;
        
        // Allow for self-closing tags like <br>
        const selfClosing = (html.match(/<br\s*\/?>/g) || []).length;
        
        return Math.abs(openTags - closeTags - selfClosing) <= 2; // Some tolerance
    }

    /**
     * Process content for database update - includes validation
     */
    processForDatabase(content: string): string | null {
        if (!content || !content.trim()) {
            return null;
        }

        const html = this.processMarkdownToHtml(content);
        
        if (!this.validateHtml(html)) {
            logger.warn('Generated HTML failed validation, using fallback', {
                originalLength: content.length,
                htmlLength: html.length
            });
            return this.basicFallbackProcessing(content);
        }

        return html;
    }
}

export default new MarkdownProcessor();