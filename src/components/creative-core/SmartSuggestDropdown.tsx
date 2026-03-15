import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, RefreshCw, Trash2, Pin, PinOff, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmartSuggest, type SuggestionItem } from "@/hooks/useSmartSuggest";

interface SmartSuggestDropdownProps {
  fieldLabel: string;
  sectionKey: "ka" | "kha" | "ga" | "gha";
  rowNumber?: string | number;
  currentValue: string;
  onSelectSuggestion: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  /** AI model override from blueprint selector */
  blueprintModel?: string;
}

const sectionNameMap: Record<string, string> = {
  ka: "ক", kha: "খ", ga: "গ", gha: "ঘ",
};

const sectionColors: Record<string, string> = {
  ka: "hsl(250 70% 50%)", kha: "hsl(320 65% 45%)",
  ga: "hsl(160 60% 35%)", gha: "hsl(35 70% 45%)",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, "0");
    const mon = (d.getMonth() + 1).toString().padStart(2, "0");
    const hr = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${day}/${mon} ${hr}:${min}`;
  } catch {
    return "";
  }
}

export function SmartSuggestDropdown({
  fieldLabel, sectionKey, rowNumber, currentValue,
  onSelectSuggestion, isOpen, onClose, triggerRef, blueprintModel,
}: SmartSuggestDropdownProps) {
  const {
    suggestions, isLoading, error, loadSuggestions,
    fetchNewSuggestions, deleteSuggestion, editSuggestion, togglePin, clearError,
  } = useSmartSuggest({ debounceMs: 300 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accentColor = sectionColors[sectionKey] || sectionColors.ka;
  const cleanLabel = fieldLabel.replace(/\*{1,3}/g, "").trim();

  const [editingSerial, setEditingSerial] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Load existing suggestions when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadSuggestions(cleanLabel, sectionKey);
      setEditingSerial(null);
    }
  }, [isOpen, cleanLabel, sectionKey, loadSuggestions]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, triggerRef]);

  const handleGenerate = () => {
    const modelToSend = blueprintModel
      ? (blueprintModel.includes("/") ? blueprintModel : `google/${blueprintModel}`)
      : undefined;
    fetchNewSuggestions(cleanLabel, sectionKey, currentValue, undefined, modelToSend);
  };

  const handleStartEdit = (item: SuggestionItem) => {
    setEditingSerial(item.serial);
    setEditValue(item.value);
  };

  const handleSaveEdit = () => {
    if (editingSerial !== null && editValue.trim()) {
      editSuggestion(cleanLabel, sectionKey, editingSerial, editValue);
      setEditingSerial(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSerial(null);
    setEditValue("");
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 rounded-lg border border-border/50 bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ borderTop: `2px solid ${accentColor}`, width: "min(460px, 90vw)", right: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-3 py-2 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" style={{ color: accentColor }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            স্মার্ট সাজেশন
          </span>
          <span className="text-[9px] text-muted-foreground/60 ml-1">
            ({suggestions.length}টি সংরক্ষিত)
          </span>
          <div className="ml-auto flex items-center gap-1">
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
        </div>
        <div className="text-[9px] text-muted-foreground/70 leading-tight truncate">
          📍 সারণী <span className="font-bold" style={{ color: accentColor }}>{sectionNameMap[sectionKey]}</span>
          {rowNumber && <> › <span className="font-semibold">{rowNumber} নং</span></>}
          {cleanLabel && <> › <span className="font-medium text-foreground/70">{cleanLabel}</span></>}
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-3 py-2 border-b border-border/20 bg-muted/10">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
            border: `1.5px solid ${accentColor}40`,
            color: accentColor,
          }}
        >
          {isLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> সাজেশন তৈরি হচ্ছে...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5" /> ✨ নতুন সাজেশন তৈরি করুন</>
          )}
        </button>
      </div>

      {/* Suggestions list */}
      <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
        {error && suggestions.length === 0 ? (
          <div className="py-4 px-3 text-xs text-destructive/90 text-center">
            <p>সাজেশন আনতে সমস্যা হয়েছে</p>
          </div>
        ) : suggestions.length === 0 && !isLoading ? (
          <div className="py-6 px-3 text-center">
            <p className="text-xs text-muted-foreground">কোনো সাজেশন নেই</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              উপরের বাটনে ক্লিক করে নতুন সাজেশন তৈরি করুন
            </p>
          </div>
        ) : (
          suggestions.map((item) => (
            <div
              key={item.serial}
              className={cn(
                "group flex items-start gap-2 px-3 py-2 border-b border-border/10 transition-all",
                item.pinned ? "bg-primary/5" : "hover:bg-accent/30",
              )}
            >
              {editingSerial === item.serial ? (
                /* Edit mode */
                <div className="flex-1 flex flex-col gap-1">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-border bg-background resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button onClick={handleSaveEdit} className="p-1 rounded bg-primary/20 hover:bg-primary/30 text-primary transition-colors">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  {/* Serial badge */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5"
                    style={{ background: `${accentColor}15`, color: accentColor }}
                  >
                    {item.serial}
                  </span>

                  {/* Content + date */}
                  <button
                    onClick={() => { onSelectSuggestion(item.value); onClose(); }}
                    className="flex-1 text-left min-w-0"
                  >
                    <span className="text-[11px] text-foreground/90 leading-relaxed break-words whitespace-pre-wrap block">
                      {item.value}
                    </span>
                    <span className="text-[8px] text-muted-foreground/50 mt-0.5 block">
                      {formatDate(item.created_at)}
                      {item.pinned && <span className="ml-1 text-primary">📌 পিন করা</span>}
                    </span>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                      title="সম্পাদনা"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteSuggestion(cleanLabel, sectionKey, item.serial)}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => togglePin(cleanLabel, sectionKey, item.serial)}
                      className={cn(
                        "p-1 rounded transition-colors",
                        item.pinned
                          ? "text-primary hover:bg-primary/20"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                      title={item.pinned ? "আনপিন" : "পিন করুন"}
                    >
                      {item.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20">
        <p className="text-[9px] text-muted-foreground">
          💡 সাজেশন স্থায়ীভাবে সংরক্ষিত • Export/Import এ ব্যাকআপ হবে
        </p>
      </div>
    </div>
  );
}
