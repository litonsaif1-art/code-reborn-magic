import { useState, useEffect, useRef } from "react";
import { BookmarkPlus, ChevronDown, Trash2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ValueTemplate {
  id: string;
  value: string;
  savedAt: number;
}

interface ValueTemplatePopoverProps {
  label: string;
  currentValue: string;
  onSelectTemplate: (value: string) => void;
  isLocked?: boolean;
  accentColor: string;
}

const STORAGE_KEY = "blueprint-value-templates";

function getTemplatesFromStorage(): Record<string, ValueTemplate[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTemplatesToStorage(data: Record<string, ValueTemplate[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function ValueTemplatePopover({
  label,
  currentValue,
  onSelectTemplate,
  isLocked,
  accentColor,
}: ValueTemplatePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<ValueTemplate[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load templates for this label
  useEffect(() => {
    const all = getTemplatesFromStorage();
    setTemplates(all[label] || []);
  }, [label, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleSave = () => {
    if (!currentValue || currentValue === "—") return;

    const all = getTemplatesFromStorage();
    const existing = all[label] || [];

    // Check for duplicate
    const isDuplicate = existing.some(
      (t) => t.value.trim().toLowerCase() === currentValue.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "⚠️ ডুপ্লিকেট টেমপ্লেট",
        description: `"${currentValue.slice(0, 40)}${currentValue.length > 40 ? "..." : ""}" ইতিমধ্যে সংরক্ষিত আছে।`,
        variant: "destructive",
      });
      return;
    }

    const newTemplate: ValueTemplate = {
      id: generateId(),
      value: currentValue.trim(),
      savedAt: Date.now(),
    };

    all[label] = [...existing, newTemplate];
    saveTemplatesToStorage(all);
    setTemplates(all[label]);

    toast({
      title: "✅ টেমপ্লেট সংরক্ষিত",
      description: `"${label}" এর জন্য টেমপ্লেট সেভ হয়েছে।`,
    });
  };

  const handleDelete = (id: string) => {
    const all = getTemplatesFromStorage();
    const existing = all[label] || [];
    all[label] = existing.filter((t) => t.id !== id);
    if (all[label].length === 0) delete all[label];
    saveTemplatesToStorage(all);
    setTemplates(all[label] || []);
  };

  const handleSelect = (value: string) => {
    onSelectTemplate(value);
    setIsOpen(false);
  };

  if (isLocked) return null;

  return (
    <div className="relative inline-flex" ref={popoverRef}>
      {/* Save Template Button */}
      <button
        onClick={handleSave}
        className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all shrink-0 mt-0.5"
        title="বর্তমান মান টেমপ্লেট হিসেবে সংরক্ষণ করুন"
      >
        <Save className="w-3 h-3" style={{ color: accentColor }} />
      </button>

      {/* Template Dropdown Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all shrink-0 mt-0.5"
        title="সংরক্ষিত টেমপ্লেট দেখুন"
      >
        <BookmarkPlus className="w-3 h-3" style={{ color: accentColor }} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-1 z-50 rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            minWidth: "300px",
            width: "max-content",
            maxWidth: "min(460px, 90vw)",
            background: `linear-gradient(145deg, hsl(30 100% 97%), hsl(25 95% 93%))`,
            border: `2px solid hsl(25 85% 65% / 0.5)`,
            boxShadow: `0 12px 36px -8px hsl(25 80% 50% / 0.25), 0 6px 16px -4px hsl(0 0% 0% / 0.08), inset 0 1px 0 hsl(30 100% 99% / 0.9)`,
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, hsl(25 90% 60%), hsl(30 95% 55%))`,
              borderBottom: `1.5px solid hsl(25 80% 50% / 0.3)`,
            }}
          >
            <span className="text-sm">📋</span>
            <span
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "hsl(0 0% 100%)" }}
            >
              Templates ({templates.length})
            </span>
          </div>

          {/* Template List */}
          <div className="max-h-[150px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(25 80% 70%) transparent" }}>
            {templates.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-[11px] italic" style={{ color: "hsl(0 0% 50%)" }}>
                  কোনো সংরক্ষিত টেমপ্লেট নেই
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: "hsl(0 0% 60%)" }}>
                  💾 বাটনে ক্লিক করে বর্তমান মান সেভ করুন
                </p>
              </div>
            ) : (
              templates.map((tpl, idx) => (
                <div
                  key={tpl.id}
                  className="flex items-start gap-2 px-4 py-2.5 transition-all duration-150 cursor-pointer group/tpl"
                  style={{
                    borderBottom: idx < templates.length - 1 ? `1px solid hsl(25 80% 70% / 0.2)` : "none",
                    background: idx % 2 === 0 ? "transparent" : `hsl(30 90% 95% / 0.5)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `hsl(25 85% 88% / 0.6)`;
                    e.currentTarget.style.paddingLeft = "18px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : `hsl(30 90% 95% / 0.5)`;
                    e.currentTarget.style.paddingLeft = "16px";
                  }}
                  onClick={() => handleSelect(tpl.value)}
                >
                  <span
                    className="flex-1 text-[11px] leading-relaxed break-words whitespace-pre-wrap"
                    style={{ color: "hsl(0 0% 20%)" }}
                  >
                    {tpl.value}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tpl.id);
                    }}
                    className="opacity-0 group-hover/tpl:opacity-70 hover:!opacity-100 p-1 rounded-lg transition-all shrink-0 mt-0.5"
                    style={{ background: "hsl(0 70% 95%)" }}
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3 h-3" style={{ color: "hsl(0 55% 50%)" }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
