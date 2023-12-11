import { marked } from 'marked';

export function useMarkdown(markdown) {
  return marked.parse(markdown);
}
