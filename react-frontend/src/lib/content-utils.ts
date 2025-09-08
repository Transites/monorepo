export interface HeadingInfo {
  id: string;
  text: string;
  level: number;
}

export function extractHeadingsFromHtml(html: string): HeadingInfo[] {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  return Array.from(headings).map((heading, index) => {
    const text = heading.textContent?.trim() || '';
    const level = parseInt(heading.tagName.substring(1));
    let id = heading.id;
    
    if (!id) {
      id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
      heading.id = id;
    }
    
    return { id, text, level };
  });
}

export function addHeadingIds(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  headings.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent?.trim() || '';
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
      heading.id = id;
    }
  });
  
  return doc.body.innerHTML;
}

/**
 * Fix invalid HTML structure with h2 tags inside p tags and add paragraph spacing
 */
export function enhanceContentParagraphs(html: string): string {
  if (!html) return '';
  
  console.log('BEFORE enhanceContentParagraphs:', html.substring(0, 300));
  
  let fixedHtml = html;
  
  // Very direct approach - match the exact patterns from Chateaubriand
  fixedHtml = fixedHtml.replace(/<p>(.*?)<br><h2>(.*?)<\/h2><br>(.*?)<\/p>/g, '<p>$1</p><h2>$2</h2><p>$3</p>');
  fixedHtml = fixedHtml.replace(/<p>(.*?)<br><h3>(.*?)<\/h3><br>(.*?)<\/p>/g, '<p>$1</p><h3>$2</h3><p>$3</p>');
  fixedHtml = fixedHtml.replace(/<p>(.*?)<br><h4>(.*?)<\/h4><br>(.*?)<\/p>/g, '<p>$1</p><h4>$2</h4><p>$3</p>');
  
  // Clean up empty paragraphs
  fixedHtml = fixedHtml.replace(/<p><\/p>/g, '');
  fixedHtml = fixedHtml.replace(/<p>\s*<\/p>/g, '');
  
  // Add <br> after each </p> tag for visual spacing
  fixedHtml = fixedHtml.replace(/<\/p>/g, '</p><br>');
  
  console.log('AFTER enhanceContentParagraphs:', fixedHtml.substring(0, 300));
  
  return fixedHtml;
}