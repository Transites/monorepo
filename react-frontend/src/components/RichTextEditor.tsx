import { useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link2,
  RemoveFormatting,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SANITIZE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'h2',
    'h3',
    'p',
    'div',
    'span',
    'strong',
    'em',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'br',
  ],
  ALLOWED_ATTR: ['href', 'class'],
};

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  minHeightClassName?: string;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Escreva aqui…',
  className,
  id,
  disabled = false,
  minHeightClassName = 'min-h-[200px]',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || skipSyncRef.current) return;

    const sanitized = sanitizeHtml(value);
    if (el.innerHTML !== sanitized) {
      el.innerHTML = sanitized || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    skipSyncRef.current = true;
    const sanitized = sanitizeHtml(el.innerHTML);
    if (el.innerHTML !== sanitized) {
      el.innerHTML = sanitized;
    }
    onChange?.(sanitized);
    requestAnimationFrame(() => {
      skipSyncRef.current = false;
    });
  }, [onChange]);

  const runCommand = (command: string, commandValue?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const handleLink = () => {
    if (disabled) return;
    const url = window.prompt('URL do link:', 'https://');
    if (url) {
      runCommand('createLink', url);
    }
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Negrito', action: () => runCommand('bold') },
    { icon: Italic, label: 'Itálico', action: () => runCommand('italic') },
    { icon: Underline, label: 'Sublinhado', action: () => runCommand('underline') },
    { icon: Heading2, label: 'Título 2', action: () => runCommand('formatBlock', 'h2') },
    { icon: Heading3, label: 'Título 3', action: () => runCommand('formatBlock', 'h3') },
    { icon: List, label: 'Lista', action: () => runCommand('insertUnorderedList') },
    { icon: ListOrdered, label: 'Lista numerada', action: () => runCommand('insertOrderedList') },
    { icon: Quote, label: 'Citação', action: () => runCommand('formatBlock', 'blockquote') },
    { icon: Link2, label: 'Link', action: handleLink },
    {
      icon: RemoveFormatting,
      label: 'Limpar formatação',
      action: () => runCommand('removeFormat'),
    },
  ] as const;

  return (
    <div className={cn('rounded-md border border-input bg-background', className)}>
      <div
        className="flex flex-wrap gap-1 border-b border-input p-2"
        role="toolbar"
        aria-label="Formatação de texto"
      >
        {toolbarButtons.map(({ icon: Icon, label, action }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={action}
            disabled={disabled}
            title={label}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className={cn(
          'prose prose-sm max-w-none px-4 py-3 focus:outline-none dark:prose-invert',
          minHeightClassName,
          'empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      />
    </div>
  );
}
