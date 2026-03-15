import { useState } from "react";
import { Pencil, Trash2, Save, Sparkles, Check, X } from "lucide-react";

const DIRECTIVE_TAG = "[USER DIRECTIVE — সর্বদা মেনে চলুন]";

export interface DirectiveItem {
  index: number;
  text: string;
  fullBlock: string;
}

export function parseDirectives(content: string): DirectiveItem[] {
  if (!content) return [];
  const items: DirectiveItem[] = [];
  const tag = DIRECTIVE_TAG;
  let searchFrom = 0;
  let idx = 0;

  while (true) {
    const pos = content.indexOf(tag, searchFrom);
    if (pos === -1) break;
    const afterTag = pos + tag.length;
    const nextPos = content.indexOf(tag, afterTag);
    const blockEnd = nextPos === -1 ? content.length : nextPos;
    const rawText = content.slice(afterTag, blockEnd).trim();
    let blockStart = pos;
    while (blockStart > 0 && (content[blockStart - 1] === '\n' || content[blockStart - 1] === '\r')) {
      blockStart--;
    }
    items.push({ index: idx++, text: rawText, fullBlock: content.slice(blockStart, blockEnd) });
    searchFrom = blockEnd;
  }
  return items;
}

export function removeDirective(content: string, directive: DirectiveItem): string {
  return content.replace(directive.fullBlock, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function updateDirectiveText(content: string, directive: DirectiveItem, newText: string): string {
  const newBlock = `\n\n${DIRECTIVE_TAG}\n${newText}`;
  return content.replace(directive.fullBlock, newBlock).trim();
}

interface DirectivesListProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onSaveAsTemplate?: (text: string) => void;
  isLocked?: boolean;
}

export function DirectivesList({ content, onContentChange, onSaveAsTemplate }: DirectivesListProps) {
  const directives = parseDirectives(content);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  if (directives.length === 0) return null;

  const handleEdit = (d: DirectiveItem) => { setEditingIndex(d.index); setEditText(d.text); };
  const handleEditConfirm = (d: DirectiveItem) => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== d.text) onContentChange(updateDirectiveText(content, d, trimmed));
    setEditingIndex(null);
  };
  const handleDelete = (d: DirectiveItem) => onContentChange(removeDirective(content, d));
  const handleSave = (d: DirectiveItem) => onSaveAsTemplate?.(d.text);

  return (
    <div className="mx-3 mb-2 rounded-xl overflow-hidden" style={{ border: "1.5px solid hsl(160 45% 78%)", background: "hsl(160 30% 97%)" }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "linear-gradient(135deg, hsl(160 50% 93%), hsl(140 45% 92%))", borderBottom: "1px solid hsl(160 40% 82%)" }}>
        <Pencil className="w-3 h-3" style={{ color: "hsl(160 60% 38%)" }} />
        <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(160 55% 35%)" }}>নির্দেশনা সমূহ ({directives.length})</span>
      </div>
      <div className="divide-y" style={{ borderColor: "hsl(160 30% 88%)" }}>
        {directives.map((d) => (
          <div key={d.index} className="px-3 py-2 group" style={{ background: "hsl(160 25% 98%)" }}>
            {editingIndex === d.index ? (
              <div className="flex items-start gap-2">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditConfirm(d); } if (e.key === "Escape") setEditingIndex(null); }}
                  rows={2} className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" autoFocus />
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => handleEditConfirm(d)} className="p-1 rounded hover:bg-primary/10"><Check className="w-3 h-3" style={{ color: "hsl(160 60% 40%)" }} /></button>
                  <button onClick={() => setEditingIndex(null)} className="p-1 rounded hover:bg-destructive/10"><X className="w-3 h-3" style={{ color: "hsl(0 60% 50%)" }} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs leading-relaxed flex-1" style={{ color: "hsl(160 30% 25%)" }}>{d.text}</p>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <button onClick={() => handleSave(d)} className="p-1 rounded transition-all opacity-60 hover:opacity-100 hover:bg-primary/10" title="AI সাজেশনে যোগ করুন"><Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(260 60% 55%)" }} /></button>
                  <button onClick={() => handleEdit(d)} className="p-1 rounded transition-all opacity-60 hover:opacity-100 hover:bg-primary/10" title="সম্পাদনা করুন"><Pencil className="w-3.5 h-3.5" style={{ color: "hsl(210 55% 45%)" }} /></button>
                  <button onClick={() => handleSave(d)} className="p-1 rounded transition-all opacity-60 hover:opacity-100 hover:bg-primary/10" title="টেমপ্লেটে সেভ করুন"><Save className="w-3.5 h-3.5" style={{ color: "hsl(160 55% 40%)" }} /></button>
                  <button onClick={() => handleDelete(d)} className="p-1 rounded transition-all opacity-60 hover:opacity-100 hover:bg-destructive/10" title="মুছে ফেলুন"><Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(0 55% 50%)" }} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
