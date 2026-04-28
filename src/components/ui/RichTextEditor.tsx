'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Quote, Code, Link, Minus
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: number;
}

type FormatCommand = 'bold' | 'italic' | 'underline' | 'strikethrough';

export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Start writing...',
  minHeight = 200,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertText', '  ');
    }
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const insertHeading = useCallback((level: 1 | 2) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  const insertBlockquote = useCallback(() => {
    execCommand('formatBlock', 'blockquote');
  }, [execCommand]);

  const insertCode = useCallback(() => {
    execCommand('formatBlock', 'pre');
  }, [execCommand]);

  const insertDivider = useCallback(() => {
    execCommand('insertHorizontalRule');
  }, [execCommand]);

  const toolbarButtons = [
    { icon: Bold, command: () => execCommand('bold'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: () => execCommand('italic'), title: 'Italic (Ctrl+I)' },
    { icon: Underline, command: () => execCommand('underline'), title: 'Underline (Ctrl+U)' },
    { type: 'divider' },
    { icon: Heading1, command: () => insertHeading(1), title: 'Heading 1' },
    { icon: Heading2, command: () => insertHeading(2), title: 'Heading 2' },
    { icon: Quote, command: insertBlockquote, title: 'Quote' },
    { icon: Code, command: insertCode, title: 'Code Block' },
    { type: 'divider' },
    { icon: List, command: () => execCommand('insertUnorderedList'), title: 'Bullet List' },
    { icon: ListOrdered, command: () => execCommand('insertOrderedList'), title: 'Numbered List' },
    { icon: Minus, command: insertDivider, title: 'Divider' },
    { icon: Link, command: insertLink, title: 'Insert Link' },
  ];

  return (
    <div className="rte-container">
      {label && <label className="rte-label">{label}</label>}

      <div className="rte-toolbar">
        {toolbarButtons.map((btn, i) => {
          if (btn.type === 'divider') {
            return <div key={`divider-${i}`} className="rte-toolbar-divider" />;
          }
          const Icon = btn.icon;
          return (
            <button
              key={btn.title}
              type="button"
              className="rte-toolbar-btn"
              onClick={btn.command}
              title={btn.title}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
