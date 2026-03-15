import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Save, X, Lightbulb, Syringe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplateNote {
  id: string;
  category: "নির্দেশনা" | "Idea" | "Injection";
  title: string;
  content: string;
  createdAt: number;
}

interface BlueprintTemplatesProps {
  sessionId: string | null;
  templates: TemplateNote[];
  onTemplatesChange: (templates: TemplateNote[]) => void;
}

const CATEGORY_CONFIG: Record<TemplateNote["category"], {
  icon: typeof Lightbulb;
  gradient: string;
  bg: string;
  border: string;
  text: string;
  chipBg: string;
}> = {
  "নির্দেশনা": {
    icon: FileText,
    gradient: "linear-gradient(135deg, hsl(250 70% 58%), hsl(280 60% 55%))",
    bg: "hsl(250 40% 97%)",
    border: "hsl(250 50% 85%)",
    text: "hsl(250 65% 45%)",
    chipBg: "hsl(250 60% 93%)",
  },
  "Idea": {
    icon: Lightbulb,
    gradient: "linear-gradient(135deg, hsl(35 85% 52%), hsl(25 90% 50%))",
    bg: "hsl(35 50% 97%)",
    border: "hsl(35 50% 82%)",
    text: "hsl(35 80% 38%)",
    chipBg: "hsl(35 65% 92%)",
  },
  "Injection": {
    icon: Syringe,
    gradient: "linear-gradient(135deg, hsl(160 60% 42%), hsl(140 55% 45%))",
    bg: "hsl(160 35% 97%)",
    border: "hsl(160 45% 80%)",
    text: "hsl(160 55% 32%)",
    chipBg: "hsl(160 50% 92%)",
  },
};

const CATEGORIES: TemplateNote["category"][] = ["নির্দেশনা", "Idea", "Injection"];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function BlueprintTemplates({
  sessionId,
  templates,
  onTemplatesChange,
}: BlueprintTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<TemplateNote["category"]>("নির্দেশনা");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [filterCategory, setFilterCategory] = useState<TemplateNote["category"] | "all">("all");

  const filteredTemplates = filterCategory === "all"
    ? templates
    : templates.filter((t) => t.category === filterCategory);

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const note: TemplateNote = {
      id: generateId(),
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      createdAt: Date.now(),
    };
    onTemplatesChange([...templates, note]);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId || !newTitle.trim() || !newContent.trim()) return;
    onTemplatesChange(
      templates.map((t) =>
        t.id === editingId
          ? { ...t, category: newCategory, title: newTitle.trim(), content: newContent.trim() }
          : t
      )
    );
    resetForm();
  };

  const handleDelete = (id: string) => {
    onTemplatesChange(templates.filter((t) => t.id !== id));
  };

  const startEdit = (note: TemplateNote) => {
    setEditingId(note.id);
    setNewCategory(note.category);
    setNewTitle(note.title);
    setNewContent(note.content);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewCategory("নির্দেশনা");
    setNewTitle("");
    setNewContent("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, hsl(280 55% 94%), hsl(300 45% 93%))",
          color: "hsl(280 50% 42%)",
          border: "1px solid hsl(280 40% 84%)",
          boxShadow: "0 2px 8px -2px hsl(280 50% 50% / 0.15)",
        }}
      >
        <BookOpen className="w-3 h-3" />
        Templates
      </button>
    );
  }

  return (
    <>
      {/* Trigger button (active state) */}
      <button
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all"
        style={{
          background: "linear-gradient(135deg, hsl(280 60% 55%), hsl(300 50% 52%))",
          color: "hsl(0 0% 100%)",
          border: "1px solid hsl(280 50% 65% / 0.5)",
          boxShadow: "0 4px 12px -3px hsl(280 60% 50% / 0.35)",
        }}
      >
        <BookOpen className="w-3 h-3" />
        Templates
      </button>

      {/* Templates Window — anchored at the top */}
      <div
        className="fixed inset-0 z-[60] flex items-start justify-center pt-14 px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        {/* Window */}
        <div
          className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] rounded-3xl overflow-hidden flex flex-col animate-in slide-in-from-top-2 fade-in-0 duration-200"
          style={{
            background: "linear-gradient(160deg, hsl(270 25% 98%), hsl(290 20% 97%), hsl(310 18% 98%))",
            boxShadow:
              "0 30px 70px -15px hsl(280 50% 25% / 0.25), 0 10px 30px -10px hsl(300 40% 35% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
            border: "1px solid hsl(280 35% 88% / 0.6)",
          }}
        >
          {/* Rainbow accent */}
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg, hsl(280 70% 58%), hsl(320 65% 55%), hsl(35 85% 55%), hsl(160 60% 45%), hsl(250 75% 58%))",
            }}
          />

          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(280 30% 94% / 0.7), hsl(300 25% 95% / 0.5))",
              borderBottom: "1px solid hsl(280 25% 88% / 0.5)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(280 60% 55%), hsl(310 55% 52%))" }}
              >
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.2em]"
                style={{
                  background: "linear-gradient(135deg, hsl(280 60% 45%), hsl(310 50% 48%), hsl(340 55% 50%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Template নির্দেশিকা
              </span>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: "hsl(280 50% 93%)",
                  color: "hsl(280 55% 45%)",
                  border: "1px solid hsl(280 40% 84%)",
                }}
              >
                {templates.length} টি নোট
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, hsl(280 60% 55%), hsl(310 50% 52%))",
                  color: "hsl(0 0% 100%)",
                  boxShadow: "0 3px 10px -3px hsl(280 60% 50% / 0.3)",
                }}
              >
                <Plus className="w-3 h-3" />
                নতুন নোট
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl transition-all"
                style={{ color: "hsl(280 20% 55%)", background: "hsl(280 20% 92% / 0.5)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 px-5 py-2.5 shrink-0"
            style={{ borderBottom: "1px solid hsl(280 20% 90% / 0.4)" }}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider mr-1" style={{ color: "hsl(280 20% 55%)" }}>
              ফিল্টার:
            </span>
            <button
              onClick={() => setFilterCategory("all")}
              className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all")}
              style={{
                background: filterCategory === "all" ? "hsl(280 50% 50%)" : "hsl(280 20% 94%)",
                color: filterCategory === "all" ? "white" : "hsl(280 30% 50%)",
                border: `1px solid ${filterCategory === "all" ? "hsl(280 50% 55%)" : "hsl(280 20% 86%)"}`,
              }}
            >
              সব
            </button>
            {CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isActive = filterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                  style={{
                    background: isActive ? cfg.text : cfg.chipBg,
                    color: isActive ? "white" : cfg.text,
                    border: `1px solid ${isActive ? cfg.text : cfg.border}`,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Content area with visible scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2.5 template-scroll"
            style={{
              scrollbarWidth: "auto",
              scrollbarColor: "hsl(280 45% 72%) hsl(280 20% 94%)",
            }}
          >
            {/* Add/Edit form */}
            {isAdding && (
              <div
                className="rounded-2xl overflow-hidden mb-3"
                style={{
                  background: "hsl(0 0% 100% / 0.8)",
                  border: "1.5px solid hsl(280 40% 82%)",
                  boxShadow: "0 4px 16px -4px hsl(280 50% 40% / 0.1)",
                }}
              >
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{
                    background: "linear-gradient(135deg, hsl(280 30% 95%), hsl(300 25% 94%))",
                    borderBottom: "1px solid hsl(280 25% 88% / 0.5)",
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: "hsl(280 50% 45%)" }}>
                    {editingId ? "✏️ নোট সম্পাদনা" : "➕ নতুন নোট যোগ করুন"}
                  </span>
                  <button onClick={resetForm} className="p-1 rounded-lg" style={{ color: "hsl(280 20% 55%)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {/* Category selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(280 20% 50%)" }}>
                      ক্যাটাগরি:
                    </span>
                    {CATEGORIES.map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const Icon = cfg.icon;
                      const isSelected = newCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                          style={{
                            background: isSelected ? cfg.gradient : cfg.chipBg,
                            color: isSelected ? "white" : cfg.text,
                            border: `1px solid ${isSelected ? "transparent" : cfg.border}`,
                            boxShadow: isSelected ? `0 3px 10px -3px ${cfg.text}40` : "none",
                          }}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  {/* Title */}
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="নোটের শিরোনাম..."
                    className="w-full px-3 py-2 rounded-xl text-sm bg-transparent focus:outline-none"
                    style={{
                      border: "1px solid hsl(280 25% 88%)",
                      color: "hsl(280 30% 25%)",
                    }}
                  />
                  {/* Content */}
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="বিস্তারিত নির্দেশনা, আইডিয়া, বা ইনজেকশন নোট লিখুন..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-transparent focus:outline-none resize-none scrollbar-thin"
                    style={{
                      border: "1px solid hsl(280 25% 88%)",
                      color: "hsl(280 30% 25%)",
                    }}
                  />
                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={editingId ? handleUpdate : handleAdd}
                      disabled={!newTitle.trim() || !newContent.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, hsl(280 60% 55%), hsl(310 50% 52%))",
                        color: "hsl(0 0% 100%)",
                        boxShadow: "0 4px 12px -3px hsl(280 60% 50% / 0.3)",
                      }}
                    >
                      <Save className="w-3 h-3" />
                      {editingId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Template notes list */}
            {filteredTemplates.length === 0 && !isAdding && (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg, hsl(280 40% 92%), hsl(300 35% 91%))",
                    border: "1px solid hsl(280 30% 86%)",
                  }}
                >
                  <BookOpen className="w-6 h-6" style={{ color: "hsl(280 40% 55%)" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "hsl(280 30% 40%)" }}>
                  কোনো টেমপ্লেট নেই
                </p>
                <p className="text-[10px]" style={{ color: "hsl(280 15% 55%)" }}>
                  নির্দেশনা, আইডিয়া বা ইনজেকশন নোট যোগ করুন
                </p>
              </div>
            )}

            {filteredTemplates.map((note) => {
              const cfg = CATEGORY_CONFIG[note.category];
              const Icon = cfg.icon;
              return (
                <div
                  key={note.id}
                  className="rounded-2xl overflow-hidden transition-all hover:scale-[1.005]"
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    boxShadow: `0 2px 10px -3px ${cfg.text}15`,
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-2"
                    style={{ borderBottom: `1px solid ${cfg.border}` }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: cfg.gradient }}
                      >
                        <Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                        style={{
                          background: cfg.chipBg,
                          color: cfg.text,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        {note.category}
                      </span>
                      <span className="text-xs font-bold" style={{ color: cfg.text }}>
                        {note.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: cfg.text, background: `${cfg.chipBg}` }}
                        title="সম্পাদনা"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: "hsl(0 60% 50%)", background: "hsl(0 50% 95%)" }}
                        title="মুছুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(0 0% 30%)" }}>
                      {note.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer info */}
          {templates.length > 0 && (
            <div className="shrink-0 px-5 py-2.5"
              style={{ borderTop: "1px solid hsl(280 20% 90% / 0.5)" }}
            >
              <p className="text-[9px] text-center" style={{ color: "hsl(280 20% 55%)" }}>
                💡 এই টেমপ্লেটগুলো প্রতিটি কনসেপ্ট তৈরির সময় ব্লুপ্রিন্টের সাথে নির্দেশিকা হিসেবে ব্যবহৃত হবে
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Utility: Convert templates to prompt string for AI context */
export function templatesToPromptString(templates: TemplateNote[]): string {
  if (!templates.length) return "";
  const grouped: Record<string, TemplateNote[]> = {};
  for (const t of templates) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }
  let result = "\n📝 Template নির্দেশিকা:\n";
  for (const [category, notes] of Object.entries(grouped)) {
    result += `\n【${category}】\n`;
    for (const n of notes) {
      result += `• ${n.title}: ${n.content}\n`;
    }
  }
  return result;
}
