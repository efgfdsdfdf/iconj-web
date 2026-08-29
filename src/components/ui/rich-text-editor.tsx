"use client";

import { useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ label, value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Set initial value only once to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="text-xs text-slate-500 mb-2">
        You can copy formatted text (tables, bold headers, bullet lists) directly from supplier websites and paste it below.
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="min-h-[250px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 prose prose-sm max-w-none overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />
    </div>
  );
}
