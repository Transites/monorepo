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