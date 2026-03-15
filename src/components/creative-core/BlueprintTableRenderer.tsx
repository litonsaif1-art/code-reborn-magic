import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, X, Trash2, Sparkles, ChevronDown, Eye, EyeOff, Plus, Pencil, Pin, PinOff, Square, CheckSquare, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ValueTemplatePopover } from "./ValueTemplatePopover";
import { SmartSuggestDropdown } from "./SmartSuggestDropdown";
import { type DefaultLabel, matchLabelToDefault } from "@/utils/defaultBlueprintLabels";
import { getParamDisplayValue } from "./BlueprintDisplay";

export interface ParamOptionItem {
  value: string;
  label: string;
}

export interface ExtraParamRow {
  label: string;
  value: string;
  paramKey?: string;
  options?: ParamOptionItem[];
  isDefault?: boolean; // true if value equals default
}

interface BlueprintTableRendererProps {
  content: string;
  sectionKey: "ka" | "kha" | "ga" | "gha";
  onContentChange?: (newContent: string) => void;
  isLocked?: boolean;
  extraParamRows?: ExtraParamRow[];
  /** Fixed default labels — always shown, values filled from parsed content */
  defaultLabels?: DefaultLabel[];
  /** Called when a param row value is edited inline */
  onExtraParamValueChange?: (paramKey: string, newValue: string) => void;
  /** Called when a param row is deleted (reset to default) */
  onExtraParamDelete?: (paramKey: string) => void;
  /** Set of row keys that are hidden */
  hiddenRows?: Set<string>;
  /** Toggle hide/show for a row */
  onToggleHide?: (rowKey: string) => void;
  /** Called after a value is saved to auto-lock blueprint */
  onAutoLock?: () => void;
  /** Called when user adds a custom row to this section */
  onAddCustomRow?: (label: string) => void;
  /** Custom options added by user for param dropdowns */
  customParamOptions?: Record<string, { value: string; label: string }[]>;
  /** Called when user adds a custom option to a param dropdown */
  onAddCustomOption?: (paramKey: string, label: string) => void;
  /** Called when user edits a custom option */
  onEditCustomOption?: (paramKey: string, oldValue: string, newLabel: string) => void;
  /** Called when user deletes a custom option */
  onDeleteCustomOption?: (paramKey: string, value: string) => void;
  /** Called when user pins an option as default */
  onPinOption?: (paramKey: string, label: string, value: string) => void;
  /** Called when user unpins a default option */
  onUnpinOption?: (paramKey: string) => void;
  /** Check if option is pinned */
  isPinnedOption?: (paramKey: string, value: string) => boolean;
  /** Scene params override — reactive prop for sync */
  sceneParamsOverrideProp?: Record<string, string>;
  /** Blueprint AI model for suggestions */
  blueprintModel?: string;
}

interface ParsedRow {
  number: string;
  label: string;
  value: string;
  originalMatch: string;
}

/**
 * Parse blueprint content that follows multiple formats:
 * 
 * Format 1 (Numbered list with dash/arrow):
 * ১. Label - Value
 * ২. Label→ Value
 * 
 * Format 2 (Markdown table):
 * | ১. Label | S | Value |
 * 
 * Format 3 (Pipe-separated inline):
 * ১. Label | S | Value | ২. Label | S | Value
 */
/**
 * Strip markdown bold/italic markers from a string: **text** → text, *text* → text
 */
function stripMarkdown(s: string): string {
  return s.replace(/\*{1,3}/g, "").trim();
}

function parseNumberedRows(text: string): { rows: ParsedRow[]; unparsedContent: string } {
  const rows: ParsedRow[] = [];
  const unparsedLines: string[] = [];

  // Pre-process: strip ** from the whole text for more reliable parsing
  // But keep original for originalMatch
  const cleanText = text.replace(/\*{1,3}/g, "");
  
  // First, try to detect if content is pipe-separated inline format
  const pipeInlinePattern = /([০-৯১-৯\d]+)\.\s*([^|]+)\s*\|\s*[SVL]\s*\|\s*([^|]+)/gi;
  let pipeMatches = [...cleanText.matchAll(pipeInlinePattern)];
  
  if (pipeMatches.length > 0) {
    for (const match of pipeMatches) {
      rows.push({
        number: match[1],
        label: stripMarkdown(match[2]),
        value: stripMarkdown(match[3]) || "—",
        originalMatch: match[0],
      });
    }
    return { rows, unparsedContent: "" };
  }
  
  // Try markdown table format: | ১. Label | S/V/L | Value |
  const tableRowPattern = /\|\s*([০-৯১-৯\d]+)\.\s*([^|]+)\s*\|\s*[SVL]\s*\|\s*([^|]+)\s*\|/gi;
  let tableMatches = [...cleanText.matchAll(tableRowPattern)];
  
  if (tableMatches.length > 0) {
    for (const match of tableMatches) {
      rows.push({
        number: match[1],
        label: stripMarkdown(match[2]),
        value: stripMarkdown(match[3]) || "—",
        originalMatch: match[0],
      });
    }
    return { rows, unparsedContent: "" };
  }

  // Try inline numbered format (all items on same line, no pipes):
  const inlinePattern = /([০-৯১-৯\d]+)[.।]\s*([^—\-→:]+?)\s*[—\-→:]\s*(.*?)(?=\s*[০-৯১-৯\d]+[.।]\s|$)/g;
  const inlineMatches = [...cleanText.matchAll(inlinePattern)];
  
  if (inlineMatches.length > 1) {
    for (const match of inlineMatches) {
      rows.push({
        number: match[1],
        label: stripMarkdown(match[2]),
        value: stripMarkdown(match[3]) || "—",
        originalMatch: match[0].trim(),
      });
    }
    return { rows, unparsedContent: "" };
  }
  
  // Fall back to line-by-line parsing for numbered list format
  const lines = text.split('\n');
  // Updated pattern: handles optional markdown bold markers (**) around labels
  // Also handles em-dash (—), en-dash (–), hyphen (-), arrow (→), colon (:)
  const rowPattern = /^\*{0,3}([০-৯১-৯\d]+)[.।]\s*\*{0,3}([^→\-—–:*]+?)\*{0,3}[\s]*[—–\-→:]\s*(.*)$/;
  
  let inSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (/^#|^[কখগ]\)|সারণী|table|^\|[\s:|-]+\|$/i.test(trimmed)) {
      unparsedLines.push(line);
      inSection = true;
      continue;
    }
    
    const match = trimmed.match(rowPattern);
    if (match) {
      rows.push({
        number: match[1],
        label: stripMarkdown(match[2]),
        value: stripMarkdown(match[3]) || "—",
        originalMatch: trimmed,
      });
      inSection = true;
    } else if (trimmed && inSection) {
      unparsedLines.push(line);
    } else if (trimmed) {
      unparsedLines.push(line);
    }
  }
  
  // DEBUG: Log parsing results to help diagnose empty value issues
  if (rows.length > 0) {
    console.log(`[BlueprintParser] Parsed ${rows.length} rows from section. Sample:`, 
      rows.slice(0, 3).map(r => `${r.number}. ${r.label} → "${r.value.slice(0, 40)}"`));
  } else if (text.trim().length > 20) {
    console.warn(`[BlueprintParser] FAILED to parse rows from content (${text.length} chars). First 200:`, text.slice(0, 200));
  }

  return {
    rows,
    unparsedContent: unparsedLines.join('\n').trim(),
  };
}

// Section-specific accent colors — premium vibrant palette
const sectionStyles: Record<string, { labelBg: string; labelText: string; rowHover: string; headerGradient: string; borderAccent: string; rowAlt: string; rowBase: string }> = {
  ka: {
    labelBg: "hsl(250 55% 94%)",
    labelText: "hsl(250 70% 45%)",
    rowHover: "hsl(250 55% 94%)",
    rowBase: "hsl(250 40% 98%)",
    rowAlt: "hsl(250 50% 95%)",
    headerGradient: "linear-gradient(135deg, hsl(250 65% 92%), hsl(270 55% 90%))",
    borderAccent: "hsl(250 55% 78% / 0.35)",
  },
  kha: {
    labelBg: "hsl(320 50% 94%)",
    labelText: "hsl(320 65% 42%)",
    rowHover: "hsl(320 50% 94%)",
    rowBase: "hsl(320 35% 98%)",
    rowAlt: "hsl(320 45% 95%)",
    headerGradient: "linear-gradient(135deg, hsl(320 58% 92%), hsl(340 52% 90%))",
    borderAccent: "hsl(320 50% 78% / 0.35)",
  },
  ga: {
    labelBg: "hsl(160 45% 93%)",
    labelText: "hsl(160 60% 32%)",
    rowHover: "hsl(160 45% 93%)",
    rowBase: "hsl(160 30% 97%)",
    rowAlt: "hsl(160 40% 94%)",
    headerGradient: "linear-gradient(135deg, hsl(160 52% 91%), hsl(140 48% 89%))",
    borderAccent: "hsl(160 45% 75% / 0.35)",
  },
  gha: {
    labelBg: "hsl(35 50% 93%)",
    labelText: "hsl(35 70% 38%)",
    rowHover: "hsl(35 50% 93%)",
    rowBase: "hsl(35 35% 97%)",
    rowAlt: "hsl(35 45% 94%)",
    headerGradient: "linear-gradient(135deg, hsl(35 58% 91%), hsl(45 50% 89%))",
    borderAccent: "hsl(35 55% 75% / 0.35)",
  },
};

/** Inline editable value cell with smart suggest */
function EditableValueCell({
  value,
  label,
  rowIndex,
  rowNumber,
  onSave,
  onDelete,
  styles,
  isLocked,
  sectionKey,
  onAutoLock,
  isSceneValue,
  isManuallyOverridden,
  onResetToSP,
  blueprintModel,
}: {
  value: string;
  label: string;
  rowIndex: number;
  rowNumber?: string | number;
  onSave: (rowIndex: number, newValue: string) => void;
  onDelete?: () => void;
  styles: { labelText: string };
  isLocked?: boolean;
  sectionKey: "ka" | "kha" | "ga" | "gha";
  onAutoLock?: () => void;
  isSceneValue?: boolean;
  isManuallyOverridden?: boolean;
  onResetToSP?: () => void;
  blueprintModel?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (isLocked) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(rowIndex, trimmed);
      // Auto-lock after save
      setTimeout(() => onAutoLock?.(), 150);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if focus moved to confirm/cancel buttons within the same cell
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && cellRef.current?.contains(relatedTarget)) return;
    handleConfirm();
  };

  if (isEditing) {
    return (
      <td className="py-1 px-2" style={{ fontSize: "11px" }}>
        <div ref={cellRef} className="flex items-start gap-1">
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            rows={2}
            className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            style={{ minHeight: "28px" }}
          />
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={handleConfirm}
              className="p-1 rounded hover:bg-primary/10 transition-colors"
              title="সংরক্ষণ (Enter)"
            >
              <Check className="w-3 h-3" style={{ color: "hsl(160 60% 40%)" }} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 rounded hover:bg-destructive/10 transition-colors"
              title="বাতিল (Esc)"
            >
              <X className="w-3 h-3" style={{ color: "hsl(0 60% 50%)" }} />
            </button>
          </div>
        </div>
      </td>
    );
  }

  const isEmpty = !value || value === "—" || value === "";
  const displayValue = isEmpty ? "—" : getParamDisplayValue(value);

  return (
    <td
      className="py-1.5 px-3 leading-relaxed group/cell relative cursor-pointer"
      style={{
        color: isEmpty ? "hsl(0 0% 50% / 0.4)" : isManuallyOverridden ? "hsl(30 75% 40%)" : isSceneValue ? "hsl(165 65% 32%)" : "hsl(220 15% 25%)",
        fontSize: "11px",
        fontStyle: isEmpty ? "italic" : "normal",
        background: isManuallyOverridden ? "hsl(35 80% 95% / 0.6)" : isSceneValue ? "hsl(165 60% 95% / 0.5)" : undefined,
      }}
      onDoubleClick={handleStartEdit}
    >
      <div ref={cellRef} className="flex items-start justify-between gap-1">
        <span className="flex-1">
          {isManuallyOverridden && !isEmpty && (
            <span className="inline-flex items-center gap-0.5 mr-1 align-middle">
              <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "linear-gradient(135deg, hsl(35 70% 88%), hsl(40 65% 82%))",
                  color: "hsl(30 70% 35%)",
                  border: "1px solid hsl(35 55% 72%)",
                }}
                title="Scene Params থেকে এসেছিল — আপনি নিজে পরিবর্তন করেছেন"
              >✏️ edited</span>
              {onResetToSP && (
                <button
                  onClick={(e) => { e.stopPropagation(); onResetToSP(); }}
                  className="inline-flex items-center gap-0.5 text-[7px] font-bold px-1.5 py-0.5 rounded-full transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, hsl(165 55% 88%), hsl(180 50% 85%))",
                    color: "hsl(165 60% 30%)",
                    border: "1px solid hsl(165 45% 78%)",
                  }}
                  title="Scene Parameters এর মূল মানে ফিরে যান"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  SP ফেরত
                </button>
              )}
            </span>
          )}
          {isSceneValue && !isManuallyOverridden && !isEmpty && (
            <span className="inline-block mr-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full align-middle"
              style={{
                background: "linear-gradient(135deg, hsl(165 55% 88%), hsl(180 50% 85%))",
                color: "hsl(165 60% 30%)",
                border: "1px solid hsl(165 45% 78%)",
              }}
              title="Scene Parameters থেকে auto-synced"
            >⚡ SP</span>
          )}
          {displayValue}
        </span>
        {!isLocked && (
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            {/* Smart Suggest button */}
            <button
              onClick={() => setShowSuggest(!showSuggest)}
              className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all hover:bg-primary/10"
              title="AI সাজেশন দেখুন"
            >
              <Sparkles className="w-3 h-3" style={{ color: styles.labelText }} />
            </button>
            <ValueTemplatePopover
              label={label}
              currentValue={value}
              onSelectTemplate={(tplValue) => {
                onSave(rowIndex, tplValue);
                setTimeout(() => onAutoLock?.(), 150);
              }}
              isLocked={isLocked}
              accentColor={styles.labelText}
            />
            {onDelete && (
              <button
                onClick={onDelete}
                className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all hover:bg-destructive/10"
                title="এই প্যারামিটার মুছে ডিফল্টে ফেরত দিন"
              >
                <Trash2 className="w-3 h-3" style={{ color: "hsl(0 55% 50%)" }} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Smart Suggest Dropdown */}
      <SmartSuggestDropdown
        fieldLabel={label}
        sectionKey={sectionKey}
        rowNumber={rowNumber}
        currentValue={value}
        onSelectSuggestion={(suggestion) => {
          onSave(rowIndex, suggestion);
          setShowSuggest(false);
          setTimeout(() => onAutoLock?.(), 150);
        }}
        isOpen={showSuggest}
        onClose={() => setShowSuggest(false)}
        triggerRef={cellRef as React.RefObject<HTMLElement>}
        blueprintModel={blueprintModel}
      />
    </td>
  );
}

// Section-specific dropdown accent palettes
const dropdownAccents: Record<string, { bg: string; border: string; chipBg: string; chipSelectedBg: string; chipSelectedText: string; chipText: string; chipBorder: string; chipSelectedBorder: string; shadow: string; titleColor: string }> = {
  ka: {
    bg: "linear-gradient(160deg, hsl(250 45% 98%), hsl(260 55% 94%), hsl(270 40% 97%))",
    border: "hsl(250 60% 76%)",
    chipBg: "linear-gradient(135deg, hsl(250 50% 96%), hsl(260 45% 93%))",
    chipSelectedBg: "linear-gradient(135deg, hsl(250 80% 55%), hsl(270 75% 48%), hsl(290 60% 52%))",
    chipSelectedText: "hsl(0 0% 100%)",
    chipText: "hsl(250 60% 38%)",
    chipBorder: "hsl(250 45% 85%)",
    chipSelectedBorder: "hsl(260 70% 50%)",
    shadow: "0 20px 60px -12px hsl(250 60% 25% / 0.28), 0 8px 24px -6px hsl(260 50% 20% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
    titleColor: "hsl(250 70% 45%)",
  },
  kha: {
    bg: "linear-gradient(160deg, hsl(320 40% 98%), hsl(330 50% 94%), hsl(340 35% 97%))",
    border: "hsl(320 55% 76%)",
    chipBg: "linear-gradient(135deg, hsl(320 45% 96%), hsl(330 40% 93%))",
    chipSelectedBg: "linear-gradient(135deg, hsl(320 75% 50%), hsl(340 70% 45%), hsl(350 60% 50%))",
    chipSelectedText: "hsl(0 0% 100%)",
    chipText: "hsl(320 55% 36%)",
    chipBorder: "hsl(320 40% 85%)",
    chipSelectedBorder: "hsl(330 65% 48%)",
    shadow: "0 20px 60px -12px hsl(320 55% 25% / 0.28), 0 8px 24px -6px hsl(330 45% 20% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
    titleColor: "hsl(320 65% 42%)",
  },
  ga: {
    bg: "linear-gradient(160deg, hsl(160 40% 98%), hsl(150 50% 94%), hsl(140 35% 97%))",
    border: "hsl(160 55% 72%)",
    chipBg: "linear-gradient(135deg, hsl(160 45% 95%), hsl(150 40% 92%))",
    chipSelectedBg: "linear-gradient(135deg, hsl(160 70% 36%), hsl(140 65% 32%), hsl(130 55% 38%))",
    chipSelectedText: "hsl(0 0% 100%)",
    chipText: "hsl(160 55% 28%)",
    chipBorder: "hsl(160 38% 82%)",
    chipSelectedBorder: "hsl(155 60% 38%)",
    shadow: "0 20px 60px -12px hsl(160 55% 20% / 0.28), 0 8px 24px -6px hsl(150 45% 15% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
    titleColor: "hsl(160 60% 32%)",
  },
  gha: {
    bg: "linear-gradient(160deg, hsl(35 45% 98%), hsl(40 55% 94%), hsl(30 40% 97%))",
    border: "hsl(35 60% 72%)",
    chipBg: "linear-gradient(135deg, hsl(35 45% 95%), hsl(40 40% 92%))",
    chipSelectedBg: "linear-gradient(135deg, hsl(35 75% 46%), hsl(25 70% 40%), hsl(20 60% 45%))",
    chipSelectedText: "hsl(0 0% 100%)",
    chipText: "hsl(35 60% 30%)",
    chipBorder: "hsl(35 38% 82%)",
    chipSelectedBorder: "hsl(30 65% 42%)",
    shadow: "0 20px 60px -12px hsl(35 55% 20% / 0.28), 0 8px 24px -6px hsl(40 45% 15% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
    titleColor: "hsl(35 65% 35%)",
  },
};

/** Helper: parse comma-separated multi-value string into array */
function parseMultiVal(val: string): string[] {
  if (!val) return [];
  return val.split(",").map(v => v.trim()).filter(Boolean);
}

/** Helper: toggle a value in a comma-separated string */
function toggleMultiVal(current: string, toggleVal: string): string {
  const arr = parseMultiVal(current);
  const idx = arr.indexOf(toggleVal);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(toggleVal);
  }
  return arr.join(",");
}

/** Inline chip selector for param rows — renders dropdown via portal to avoid overflow clipping. Supports MULTI-SELECT. */
function ParamChipSelector({
  options,
  currentValue,
  onSelect,
  styles,
  sectionKey,
  paramLabel,
  onAddCustomOption,
  onEditCustomOption,
  onDeleteCustomOption,
  onPinOption,
  onUnpinOption,
  isPinnedFn,
  customOptionValues,
}: {
  options: ParamOptionItem[];
  currentValue: string;
  onSelect: (value: string) => void;
  styles: { labelText: string };
  sectionKey?: string;
  paramLabel?: string;
  onAddCustomOption?: (label: string) => void;
  onEditCustomOption?: (oldValue: string, newLabel: string) => void;
  onDeleteCustomOption?: (value: string) => void;
  onPinOption?: (label: string, value: string) => void;
  onUnpinOption?: () => void;
  isPinnedFn?: (value: string) => boolean;
  /** Set of custom option values (to distinguish from built-in) */
  customOptionValues?: Set<string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropdownWidth = 320;
    let left = rect.right - dropdownWidth;
    if (left < 8) left = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(options.length * 36 + 100, 400);
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    setPos({
      top: openUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
      left,
    });
  }, [options.length]);

  useEffect(() => {
    if (!isOpen) return;
    updatePos();
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
      setEditingValue(null);
    };
    const handleScroll = () => updatePos();
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updatePos]);

  const accent = dropdownAccents[sectionKey || "ka"] || dropdownAccents.ka;

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onAddCustomOption?.(trimmed);
    onSelect(trimmed);
    setCustomInput("");
    setIsOpen(false);
  };

  const handleEditSave = (oldValue: string) => {
    const trimmed = editInput.trim();
    if (!trimmed) return;
    onEditCustomOption?.(oldValue, trimmed);
    setEditingValue(null);
    setEditInput("");
  };

  const isCustom = (opt: ParamOptionItem) => customOptionValues?.has(opt.value) ?? false;

  // Multi-select: parse current value as comma-separated array
  const selectedArr = useMemo(() => parseMultiVal(currentValue), [currentValue]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (!isOpen) updatePos(); setIsOpen(!isOpen); }}
        className="p-1 rounded-md transition-all hover:scale-110"
        title="অপশন দেখুন"
        style={{
          color: styles.labelText,
          opacity: isOpen ? 1 : 0.55,
          background: isOpen ? `${styles.labelText}15` : "transparent",
        }}
      >
        <ChevronDown className="w-3.5 h-3.5" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[9999] rounded-2xl p-3.5 animate-in fade-in-0 zoom-in-95 duration-200"
          data-param-chip-dropdown="true"
          style={{
            top: pos.top,
            left: pos.left,
            width: 330,
            maxHeight: 420,
            overflowY: "auto",
            background: accent.bg,
            border: `2px solid ${accent.border}`,
            boxShadow: accent.shadow,
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          }}
        >
          {/* Title + selection count */}
          {paramLabel && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest"
                style={{ color: accent.titleColor }}
              >
                {paramLabel}
              </span>
              {selectedArr.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${accent.chipSelectedBorder}20`, color: accent.titleColor }}
                  >
                    {selectedArr.length}টি সিলেক্টেড
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(""); }}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105"
                    style={{ background: "hsl(0 70% 95%)", color: "hsl(0 55% 45%)", border: "1px solid hsl(0 50% 85%)" }}
                    title="সব সিলেকশন মুছুন"
                  >
                    ✕ খালি করুন
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-start">
            {options.map((opt) => {
              const isSelected = selectedArr.includes(opt.label) || selectedArr.includes(opt.value);
              const optPinned = isPinnedFn?.(opt.label) || isPinnedFn?.(opt.value) || false;
              const isCustomOpt = isCustom(opt);
              const hasActions = onPinOption || onEditCustomOption || onDeleteCustomOption;

              if (editingValue === opt.value) {
                return (
                  <div key={opt.value} className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleEditSave(opt.value); } if (e.key === "Escape") setEditingValue(null); }}
                      className="flex-1 px-2 py-1 rounded-lg text-[11px] focus:outline-none focus:ring-1"
                      style={{ background: accent.chipBg, border: `1px solid ${accent.chipBorder}`, color: accent.chipText }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleEditSave(opt.value); }} className="p-1 rounded-lg" style={{ background: accent.chipSelectedBg, color: accent.chipSelectedText }}>
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingValue(null); }} className="p-1 rounded-lg" style={{ background: "hsl(0 70% 95%)", color: "hsl(0 55% 50%)" }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div key={opt.value} className="group/chip inline-flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      // Multi-select toggle: don't close dropdown
                      const newVal = toggleMultiVal(currentValue, opt.label);
                      onSelect(newVal);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all hover:scale-105 hover:brightness-105"
                    style={{
                      background: isSelected ? accent.chipSelectedBg : accent.chipBg,
                      color: isSelected ? accent.chipSelectedText : accent.chipText,
                      border: `1.5px solid ${isSelected ? accent.chipSelectedBorder : accent.chipBorder}`,
                      boxShadow: isSelected ? `0 4px 16px -3px ${accent.chipSelectedBorder}70, inset 0 1px 0 hsl(0 0% 100% / 0.2)` : "0 2px 6px -2px hsl(0 0% 0% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
                    }}
                  >
                    {isSelected ? <CheckSquare className="w-3 h-3 shrink-0" /> : <Square className="w-3 h-3 shrink-0 opacity-40" />}
                    {optPinned && <Pin className="w-2.5 h-2.5 inline -mt-0.5" />}
                    {opt.label}
                  </button>
                  {/* Inline action icons — visible on hover */}
                  {hasActions && (
                    <div className="hidden group-hover/chip:flex items-center gap-0 -ml-0.5">
                      {onPinOption && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (optPinned) { onUnpinOption?.(); } else { onPinOption(opt.label, opt.value); }
                          }}
                          className="p-0.5 rounded transition-colors"
                          style={{ color: optPinned ? "hsl(25 80% 50%)" : accent.titleColor }}
                          title={optPinned ? "আনপিন (Unpin)" : "ডিফল্ট পিন (Pin)"}
                        >
                          {optPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                      )}
                      {onEditCustomOption && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingValue(opt.value);
                            setEditInput(opt.label);
                          }}
                          className="p-0.5 rounded transition-colors"
                          style={{ color: accent.titleColor }}
                          title="এডিট"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteCustomOption && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomOption(opt.value);
                          }}
                          className="p-0.5 rounded transition-colors"
                          style={{ color: "hsl(0 55% 50%)" }}
                          title="মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Custom option add */}
          {onAddCustomOption && (
            <div className="mt-3 pt-2.5" style={{ borderTop: `1px solid ${accent.chipBorder}` }}>
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5 px-0.5"
                style={{ color: accent.titleColor, opacity: 0.7 }}
              >
                ➕ নতুন অপশন যোগ করুন
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
                  placeholder="নতুন অপশন লিখুন..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] focus:outline-none focus:ring-1"
                  style={{
                    background: accent.chipBg,
                    border: `1px solid ${accent.chipBorder}`,
                    color: accent.chipText,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddCustom(); }}
                  disabled={!customInput.trim()}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-30 transition-all"
                  style={{
                    background: accent.chipSelectedBg,
                    color: accent.chipSelectedText,
                    border: `1px solid ${accent.chipSelectedBorder}`,
                  }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

// Bengali serial numbers for continuing numbering
const BN_SERIALS = [
  "১","২","৩","৪","৫","৬","৭","৮","৯","১০",
  "১১","১২","১৩","১৪","১৫","১৬","১৭","১৮","১৯","২০",
  "২১","২২","২৩","২৪","২৫","২৬","২৭","২৮","২৯","৩০",
  "৩১","৩২","৩৩","৩৪","৩৫","৩৬","৩৭","৩৮","৩৯","৪০",
];

/**
 * Build the final display rows using defaultLabels as skeleton.
 * AI-parsed values are matched into fixed label slots.
 * Unmatched labels keep blank values.
 */
function buildFixedRows(
  parsedRows: ParsedRow[],
  defaultLabels: DefaultLabel[],
  extraParamRows?: ExtraParamRow[],
  /** All extra param rows keyed by paramKey for lookup */
  extraParamMap?: Map<string, ExtraParamRow>,
  /** Scene params for labels with sceneParamKey but no paramKey */
  sceneParamsOverride?: Record<string, string>
): { number: string; label: string; value: string; originalMatch: string; isParam: boolean; isCustom: boolean; defaultIndex: number; options?: ParamOptionItem[]; paramKey?: string; isSceneValue?: boolean }[] {
  // Start with default labels — if a label has a paramKey, render as dropdown (isParam=true)
  const result = defaultLabels.map((def, idx) => {
    const paramRow = def.paramKey ? extraParamMap?.get(def.paramKey) : undefined;
    // Only use paramRow value if it's a REAL value (not "—" placeholder)
    const paramHasRealValue = paramRow && paramRow.value && paramRow.value !== "—" && paramRow.value !== "";
    
    // Check if scene params have a value for this label (regardless of paramRow)
    const hasSceneOverride = !!(def.sceneParamKey && sceneParamsOverride && sceneParamsOverride[def.sceneParamKey]);
    
    // For labels with sceneParamKey, get value from scene params as fallback
    let sceneValue = "";
    if (!paramHasRealValue && def.sceneParamKey && sceneParamsOverride) {
      sceneValue = sceneParamsOverride[def.sceneParamKey] || "";
    }
    
    // Mark as scene value if scene params have a value for this field,
    // even if the display value came from BlueprintParams dropdown (which was synced from scene params)
    const isSceneOrigin = hasSceneOverride;
    
    return {
      number: def.number,
      label: def.label,
      value: paramHasRealValue ? paramRow.value : (sceneValue || ""),
      originalMatch: "",
      isParam: !!def.paramKey,
      isCustom: false,
      defaultIndex: idx,
      options: paramRow?.options as ParamOptionItem[] | undefined,
      paramKey: def.paramKey,
      isSceneValue: isSceneOrigin,
    };
  });

  // Track which labels have scene param values so we don't overwrite them with empty parsed rows
  const sceneFilledIndices = new Set<number>();
  for (let i = 0; i < result.length; i++) {
    if (result[i].value && result[i].value !== "" && result[i].value !== "—" && defaultLabels[i]?.sceneParamKey) {
      sceneFilledIndices.add(i);
    }
  }

  // Match parsed rows to default labels and fill values; track unmatched
  const unmatchedParsed: ParsedRow[] = [];
  const matchedDefaultIndices = new Set<number>(); // Track which default labels already matched
  
  for (const row of parsedRows) {
    const matchIdx = matchLabelToDefault(row.label, defaultLabels);
    // Only match if this default label hasn't been matched already (avoid duplicates)
    if (matchIdx >= 0 && !matchedDefaultIndices.has(matchIdx)) {
      matchedDefaultIndices.add(matchIdx);
      // If this default label is a param row AND already has a REAL value from extraParamMap
      // (not just "—" placeholder or empty), don't override with parsed text.
      const paramKey = defaultLabels[matchIdx].paramKey;
      const paramValue = paramKey ? extraParamMap?.get(paramKey)?.value : undefined;
      const hasRealParamValue = paramValue && paramValue !== "" && paramValue !== "—";
      
      if (!hasRealParamValue) {
        // Only overwrite scene value if parsed row has a REAL value
        const parsedValReal = row.value && row.value !== "—" && row.value.trim() !== "";
        if (parsedValReal || !sceneFilledIndices.has(matchIdx)) {
          result[matchIdx].value = row.value;
        }
      }
      result[matchIdx].originalMatch = row.originalMatch;
    } else {
      unmatchedParsed.push(row);
    }
  }

  // FALLBACK: For any default rows that are STILL empty, fill them from
  // parsed rows by index position. This handles both "all empty" and 
  // "partial match" cases (e.g., some labels matched, some didn't).
  // BUT: never overwrite rows that already have scene param values.
  const emptyIndices = result
    .map((r, i) => (!r.value || r.value === "" || r.value === "—") ? i : -1)
    .filter(i => i >= 0);
  
  if (emptyIndices.length > 0 && parsedRows.length > 0) {
    // Build a set of parsed row values already used by matched labels
    const usedParsedValues = new Set<number>();
    for (const r of result) {
      if (r.value && r.value !== "" && r.value !== "—" && r.originalMatch) {
        const idx = parsedRows.findIndex(p => p.originalMatch === r.originalMatch);
        if (idx >= 0) usedParsedValues.add(idx);
      }
    }
    
    // For each empty result row, try to fill from corresponding parsed row by index
    for (const emptyIdx of emptyIndices) {
      // First try: same index position in parsedRows
      if (emptyIdx < parsedRows.length && !usedParsedValues.has(emptyIdx)) {
        const pVal = parsedRows[emptyIdx].value;
        if (pVal && pVal !== "—") {
          result[emptyIdx].value = pVal;
          result[emptyIdx].originalMatch = parsedRows[emptyIdx].originalMatch;
          usedParsedValues.add(emptyIdx);
          continue;
        }
      }
      // Second try: next unused parsed row
      for (let p = 0; p < parsedRows.length; p++) {
        if (!usedParsedValues.has(p) && parsedRows[p].value && parsedRows[p].value !== "—") {
          result[emptyIdx].value = parsedRows[p].value;
          result[emptyIdx].originalMatch = parsedRows[p].originalMatch;
          usedParsedValues.add(p);
          break;
        }
      }
    }
  }

  // FINAL PASS: Ensure ALL rows with sceneParamKey get isSceneValue=true
  // AND fill empty rows with scene param values
  if (sceneParamsOverride) {
    for (let i = 0; i < result.length; i++) {
      if (defaultLabels[i]?.sceneParamKey) {
        const sv = sceneParamsOverride[defaultLabels[i].sceneParamKey!];
        if (sv) {
          // Always mark as scene value when override exists
          result[i].isSceneValue = true;
          // Fill value if still empty
          if (!result[i].value || result[i].value === "" || result[i].value === "—") {
            result[i].value = sv;
          }
        }
      }
    }
  }

  // Append extra param rows after default labels (before custom rows)
  // BUT skip any paramKey that is already rendered via a default label
  const defaultLabelParamKeys = new Set(
    defaultLabels.filter(dl => dl.paramKey).map(dl => dl.paramKey!)
  );
  if (extraParamRows && extraParamRows.length > 0) {
    const filteredExtras = extraParamRows.filter(ep => !ep.paramKey || !defaultLabelParamKeys.has(ep.paramKey));
    const startSerial = result.length;
    for (let i = 0; i < filteredExtras.length; i++) {
      result.push({
        number: BN_SERIALS[startSerial + i] || String(startSerial + i + 1),
        label: filteredExtras[i].label,
        value: filteredExtras[i].value,
        originalMatch: "",
        isParam: true,
        isCustom: false,
        defaultIndex: -1,
        options: filteredExtras[i].options,
        paramKey: filteredExtras[i].paramKey,
        isSceneValue: false,
      });
    }
  }

  // Build a set of extra param row labels (normalized) to skip duplicates from parsed content
  const extraParamLabels = new Set(
    (extraParamRows || []).map(ep => ep.label.replace(/\*+/g, "").trim().toLowerCase())
  );

  // Append user-added custom rows (unmatched parsed rows) after param rows
  // Skip any that duplicate an extra param row (e.g., from copy/paste)
  const customStartSerial = result.length;
  let customIdx = 0;
  for (let i = 0; i < unmatchedParsed.length; i++) {
    const normalizedLabel = unmatchedParsed[i].label.replace(/\*+/g, "").trim().toLowerCase();
    // Skip if this label already exists as an extra param row
    if (extraParamLabels.has(normalizedLabel)) {
      // Transfer the parsed value to the matching param row if it has a non-empty value
      const parsedValue = unmatchedParsed[i].value;
      if (parsedValue && parsedValue !== "—" && parsedValue.trim()) {
        const matchingParamIdx = result.findIndex(
          r => r.isParam && r.label.replace(/\*+/g, "").trim().toLowerCase() === normalizedLabel
        );
        if (matchingParamIdx >= 0 && (!result[matchingParamIdx].value || result[matchingParamIdx].value === "—")) {
          result[matchingParamIdx].value = parsedValue;
        }
      }
      continue;
    }
    const customParamKey = `custom-${unmatchedParsed[i].label.replace(/\*+/g, "").trim()}`;
    result.push({
      number: BN_SERIALS[customStartSerial + customIdx] || String(customStartSerial + customIdx + 1),
      label: unmatchedParsed[i].label,
      value: unmatchedParsed[i].value,
      originalMatch: unmatchedParsed[i].originalMatch,
      isParam: false,
      isCustom: true,
      defaultIndex: -1,
      options: [],
      paramKey: customParamKey,
      isSceneValue: false,
    });
    customIdx++;
  }

  return result;
}

export function BlueprintTableRenderer({ content, sectionKey, onContentChange, isLocked, extraParamRows, defaultLabels, onExtraParamValueChange, onExtraParamDelete, hiddenRows, onToggleHide, onAutoLock, onAddCustomRow, customParamOptions, onAddCustomOption, onEditCustomOption, onDeleteCustomOption, onPinOption, onUnpinOption, isPinnedOption, sceneParamsOverrideProp, blueprintModel }: BlueprintTableRendererProps) {
  const { rows, unparsedContent } = useMemo(() => parseNumberedRows(content), [content]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowLabel, setNewRowLabel] = useState("");
  const addRowInputRef = useRef<HTMLInputElement>(null);
  const [editingLabelIdx, setEditingLabelIdx] = useState<number | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");
  const styles = sectionStyles[sectionKey] || sectionStyles.ka;
  const [manuallyOverridden, setManuallyOverridden] = useState<Set<string>>(new Set());

  // Reset manual overrides when scene params change (re-sync)
  const prevSceneRef = useRef(sceneParamsOverrideProp);
  useEffect(() => {
    if (sceneParamsOverrideProp && prevSceneRef.current !== sceneParamsOverrideProp) {
      prevSceneRef.current = sceneParamsOverrideProp;
      setManuallyOverridden(new Set());
    }
  }, [sceneParamsOverrideProp]);

  /** Delete a custom row by removing its line from the content */
  const handleDeleteCustomRow = useCallback((originalMatch: string) => {
    if (!onContentChange || !originalMatch) return;
    const lines = content.split('\n');
    const filtered = lines.filter(line => line.trim() !== originalMatch.trim());
    onContentChange(filtered.join('\n'));
  }, [content, onContentChange]);

  // If defaultLabels provided, use fixed structure; otherwise fall back to legacy behavior
  const allRows = useMemo(() => {
    if (defaultLabels && defaultLabels.length > 0) {
      const extraParamMap = new Map<string, ExtraParamRow>();
      if (extraParamRows) {
        for (const ep of extraParamRows) {
          if (ep.paramKey) extraParamMap.set(ep.paramKey, ep);
        }
      }
      // Use reactive prop if available, otherwise fall back to localStorage
      let sceneParamsOverride: Record<string, string> | undefined = sceneParamsOverrideProp;
      if (!sceneParamsOverride) {
        try {
          const raw = localStorage.getItem("scene-params-global");
          if (raw) {
            const parsed = JSON.parse(raw);
            sceneParamsOverride = {};
            for (const [k, v] of Object.entries(parsed)) {
              if (typeof v === "string" && v) sceneParamsOverride[k] = v;
              else if (typeof v === "boolean" && v) sceneParamsOverride[k] = "হ্যাঁ";
              else if (typeof v === "number" && v > 0) sceneParamsOverride[k] = String(v);
            }
          }
        } catch { /* ignore */ }
      }
      return buildFixedRows(rows, defaultLabels, extraParamRows, extraParamMap, sceneParamsOverride);
    }

    const base = rows.map(r => {
      const customParamKey = `custom-${r.label.replace(/\*+/g, "").trim()}`;
      return { ...r, isParam: false, isCustom: true, defaultIndex: -1, options: [] as ParamOptionItem[], paramKey: customParamKey, isSceneValue: false };
    });
    if (!extraParamRows || extraParamRows.length === 0) return base;
    const startSerial = rows.length;
    const extra = extraParamRows.map((pr, i) => ({
      number: BN_SERIALS[startSerial + i] || String(startSerial + i + 1),
      label: pr.label,
      value: pr.value,
      originalMatch: "",
      isParam: true,
      isCustom: false,
      defaultIndex: -1,
      options: pr.options,
      paramKey: pr.paramKey,
      isSceneValue: false,
    }));
    return [...base, ...extra];
  }, [rows, extraParamRows, defaultLabels, sceneParamsOverrideProp]);

  /** Rename a label in the content */
  const handleRenameLabel = useCallback((idx: number, newLabel: string) => {
    const row = allRows?.[idx];
    if (!row || !newLabel.trim()) return;
    const trimmed = newLabel.trim();
    // For param rows without originalMatch, skip rename
    if (row.originalMatch && onContentChange) {
      const lines = content.split('\n');
      const updated = lines.map(line => {
        if (line.trim() === row.originalMatch.trim()) {
          return line.replace(row.label, trimmed);
        }
        return line;
      });
      onContentChange(updated.join('\n'));
    }
    setEditingLabelIdx(null);
  }, [allRows, content, onContentChange]);

  /** Clear/reset a row's value */
  const handleClearRowValue = useCallback((idx: number) => {
    const row = allRows?.[idx];
    if (!row) return;
    if (row.isParam && row.paramKey) {
      onExtraParamDelete?.(row.paramKey);
      return;
    }
    if (row.originalMatch && onContentChange) {
      const lines = content.split('\n');
      const updated = lines.map(line => {
        if (line.trim() === row.originalMatch.trim()) {
          const serial = row.number;
          const label = row.label;
          return `${serial}. ${label} — `;
        }
        return line;
      });
      onContentChange(updated.join('\n'));
    }
  }, [allRows, content, onContentChange, onExtraParamDelete]);


  const handleValueSave = (rowIndex: number, newValue: string) => {
    if (!onContentChange) return;
    
    const row = rows[rowIndex];
    if (!row) return;

    let newContent = content;
    const oldMatch = row.originalMatch;
    
    if (!row.value || row.value === "—" || row.value.trim() === "") {
      // Value was empty — rebuild the line with new value
      const serial = row.number;
      const label = row.label;
      const newLine = `${serial}. ${label} — ${newValue}`;
      newContent = newContent.replace(oldMatch, newLine);
    } else {
      const newMatch = oldMatch.replace(row.value, newValue);
      newContent = newContent.replace(oldMatch, newMatch);
    }
    
    onContentChange(newContent);
  };

  /** For fixed-label mode: save maps to the parsed row that matches default label */
  const handleFixedValueSave = (displayRowIndex: number, newValue: string) => {
    if (!onContentChange || !defaultLabels) return;

    const displayRow = allRows[displayRowIndex];
    if (!displayRow || displayRow.isParam) return;

    // Find the parsed row that matches this default label
    const matchIdx = matchLabelToDefault(displayRow.label, defaultLabels);

    // If it's a custom (unmatched) row, find it directly in parsed rows by originalMatch
    if (matchIdx < 0) {
      // Custom row — find by originalMatch
      if (displayRow.originalMatch) {
        let newContent = content;
        const oldMatch = displayRow.originalMatch;
        if (!displayRow.value || displayRow.value === "—" || displayRow.value.trim() === "") {
          const newLine = `${displayRow.number}. ${displayRow.label} — ${newValue}`;
          newContent = newContent.replace(oldMatch, newLine);
        } else {
          const newMatch = oldMatch.replace(displayRow.value, newValue);
          newContent = newContent.replace(oldMatch, newMatch);
        }
        onContentChange(newContent);
      }
      return;
    }

    // Find the original parsed row
    for (let i = 0; i < rows.length; i++) {
      const parsedMatchIdx = matchLabelToDefault(rows[i].label, defaultLabels);
      if (parsedMatchIdx === matchIdx) {
        let newContent = content;
        const oldMatch = rows[i].originalMatch;
        
        if (!rows[i].value || rows[i].value === "—" || rows[i].value.trim() === "") {
          // Value was empty — rebuild the line with the new value
          const serial = rows[i].number;
          const label = rows[i].label;
          const newLine = `${serial}. ${label} — ${newValue}`;
          newContent = newContent.replace(oldMatch, newLine);
        } else {
          // Replace existing value
          const newMatch = oldMatch.replace(rows[i].value, newValue);
          newContent = newContent.replace(oldMatch, newMatch);
        }
        onContentChange(newContent);
        return;
      }
    }

    // No existing parsed row found — append a new line to the content
    const serial = displayRow.number;
    const label = displayRow.label.replace(/\*+/g, "").trim();
    const newLine = `${serial}. ${label} — ${newValue}`;
    const updatedContent = content ? `${content}\n${newLine}` : newLine;
    onContentChange(updatedContent);
  };
  
  // Always show the table when defaultLabels are provided (even with no content)
  if (allRows.length === 0 && rows.length === 0 && !defaultLabels) {
    return (
      <div className="concept-prose text-xs leading-relaxed blueprint-table">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }
  
  const useFixedMode = !!(defaultLabels && defaultLabels.length > 0);

  /** Get a unique key for a row to track hide state */
  const getRowKey = (row: typeof allRows[0]) => {
    if (row.paramKey) return `${sectionKey}-param-${row.paramKey}`;
    return `${sectionKey}-${row.number}-${row.label}`;
  };

  return (
    <div className="space-y-0">
      <table
        className="w-full border-collapse text-xs"
        style={{
          border: `1px solid ${styles.borderAccent}`,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: `0 2px 12px -4px ${styles.labelText}15`,
        }}
      >
        <thead>
          <tr
            style={{
              background: styles.headerGradient,
              borderBottom: `1px solid ${styles.borderAccent}`,
            }}
          >
            <th
              className="py-2 px-2.5 text-center font-black uppercase tracking-widest"
              style={{
                color: `${styles.labelText}`,
                borderRight: `1px solid ${styles.borderAccent}`,
                width: "36px",
                fontSize: "8px",
                letterSpacing: "0.15em",
              }}
            >
              #
            </th>
            <th
              className="py-2 px-3 text-left font-black uppercase tracking-widest"
              style={{
                color: `${styles.labelText}`,
                borderRight: `1px solid ${styles.borderAccent}`,
                width: "35%",
                fontSize: "8px",
                letterSpacing: "0.15em",
              }}
            >
              Label
            </th>
            <th
              className="py-2 px-3 text-left font-black uppercase tracking-widest"
              style={{
                color: `${styles.labelText}`,
                fontSize: "8px",
                letterSpacing: "0.15em",
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span>Value</span>
                {manuallyOverridden.size > 0 && !isLocked && (
                  <button
                    onClick={() => {
                      // Reset all overridden fields back to SP values
                      manuallyOverridden.forEach(label => {
                        const defLabel = defaultLabels?.find(d => d.label === label);
                        const spKey = defLabel?.sceneParamKey;
                        const spVal = spKey && sceneParamsOverrideProp ? sceneParamsOverrideProp[spKey] : undefined;
                        if (spVal) {
                          const rowIdx = allRows.findIndex(r => r.label === label);
                          const row = allRows[rowIdx];
                          if (row) {
                            if (row.isParam) {
                              onExtraParamValueChange?.(row.paramKey || row.label, spVal);
                            } else if (useFixedMode) {
                              handleFixedValueSave(rowIdx, spVal);
                            } else {
                              handleValueSave(rowIdx, spVal);
                            }
                          }
                        }
                      });
                      setManuallyOverridden(new Set());
                    }}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[7px] font-bold normal-case tracking-normal transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, hsl(165 55% 88%), hsl(180 50% 85%))",
                      color: "hsl(165 60% 30%)",
                      border: "1px solid hsl(165 45% 78%)",
                    }}
                    title="সব manually edited field কে Scene Parameters এর মূল মানে ফেরত দিন"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset All to SP ({manuallyOverridden.size})
                  </button>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, idx) => {
            const rowKey = getRowKey(row);
            const isHidden = hiddenRows?.has(rowKey) ?? false;

            return (
              <tr
                key={idx}
                className="transition-all duration-150 group/row"
                style={{
                  borderBottomWidth: idx < allRows.length - 1 ? '1px' : '0px',
                  borderBottomStyle: 'solid' as const,
                  borderBottomColor: idx < allRows.length - 1 ? `${styles.borderAccent}` : 'transparent',
                  background: isHidden
                    ? "hsl(0 0% 96% / 0.6)"
                    : idx % 2 === 0 ? styles.rowBase : styles.rowAlt,
                  opacity: isHidden ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { if (!isHidden) { e.currentTarget.style.background = styles.rowHover; e.currentTarget.style.boxShadow = `inset 3px 0 0 ${styles.labelText}`; } }}
                onMouseLeave={(e) => { if (!isHidden) { e.currentTarget.style.background = idx % 2 === 0 ? styles.rowBase : styles.rowAlt; e.currentTarget.style.boxShadow = "none"; } }}
              >
                {/* Serial No */}
                <td
                  className="py-2 px-2 text-center font-black"
                  style={{
                    color: `${styles.labelText}`,
                    borderRight: `1px solid ${styles.borderAccent}`,
                    fontSize: "13px",
                    opacity: 1,
                  }}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[12px] font-bold"
                    style={{
                      background: `${styles.labelText}18`,
                      color: styles.labelText,
                    }}
                  >
                    {row.number}
                  </span>
                </td>
                {/* Label + hide toggle + inline option selector for param rows */}
                <td
                  className="py-2 px-3 font-bold"
                  style={{
                    color: isHidden ? "hsl(var(--foreground) / 0.3)" : styles.labelText,
                    borderRight: `1px solid ${styles.borderAccent}`,
                    fontSize: "13px",
                    textDecoration: isHidden ? "line-through" : "none",
                    letterSpacing: "0.01em",
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {/* Hide/Show toggle */}
                      {onToggleHide && (
                        <button
                          onClick={() => onToggleHide(rowKey)}
                          className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all shrink-0"
                          title={isHidden ? "এই রো দেখান (Unhide)" : "এই রো লুকান (Hide)"}
                        >
                          {isHidden
                            ? <EyeOff className="w-3 h-3" style={{ color: "hsl(0 50% 50%)" }} />
                            : <Eye className="w-3 h-3" style={{ color: styles.labelText }} />
                          }
                        </button>
                      )}
                      {/* Inline label editing */}
                      {editingLabelIdx === idx ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editLabelValue}
                            onChange={(e) => setEditLabelValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); handleRenameLabel(idx, editLabelValue); }
                              if (e.key === "Escape") setEditingLabelIdx(null);
                            }}
                            className="flex-1 px-1.5 py-0.5 rounded text-[11px] bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                          <button onClick={() => handleRenameLabel(idx, editLabelValue)} className="p-0.5 rounded hover:bg-primary/10">
                            <Check className="w-3 h-3" style={{ color: "hsl(160 60% 40%)" }} />
                          </button>
                          <button onClick={() => setEditingLabelIdx(null)} className="p-0.5 rounded hover:bg-destructive/10">
                            <X className="w-3 h-3" style={{ color: "hsl(0 60% 50%)" }} />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate">{row.label}</span>
                      )}
                      {/* Edit & Delete buttons — visible on hover */}
                      {!isLocked && !isHidden && editingLabelIdx !== idx && (
                        <div className="hidden group-hover/row:flex items-center gap-0 shrink-0 ml-1">
                          {/* Rename label */}
                          <button
                            onClick={() => { setEditingLabelIdx(idx); setEditLabelValue(row.label); }}
                            className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all hover:bg-primary/10"
                            title="লেবেল রিনেম করুন"
                          >
                            <Pencil className="w-3 h-3" style={{ color: styles.labelText }} />
                          </button>
                          {/* Clear/Delete row value */}
                          <button
                            onClick={() => handleClearRowValue(idx)}
                            className="opacity-40 hover:opacity-100 p-0.5 rounded transition-all hover:bg-destructive/10"
                            title="এই ঘরের ভ্যালু মুছুন"
                          >
                            <Trash2 className="w-3 h-3" style={{ color: "hsl(0 55% 50%)" }} />
                          </button>
                        </div>
                      )}
                    </div>
                    {!isHidden && row.isParam && row.options && row.options.length > 0 && (
                      <ParamChipSelector
                        options={[
                          ...row.options,
                          ...(customParamOptions?.[row.paramKey || ""] || []),
                        ]}
                        currentValue={row.value}
                        onSelect={(selectedLabel) => onExtraParamValueChange?.(row.paramKey || row.label, selectedLabel)}
                        styles={styles}
                        sectionKey={sectionKey}
                        paramLabel={row.label}
                        onAddCustomOption={onAddCustomOption ? (label) => onAddCustomOption(row.paramKey || row.label, label) : undefined}
                        onEditCustomOption={onEditCustomOption ? (oldVal, newLabel) => onEditCustomOption(row.paramKey || row.label, oldVal, newLabel) : undefined}
                        onDeleteCustomOption={onDeleteCustomOption ? (val) => onDeleteCustomOption(row.paramKey || row.label, val) : undefined}
                        onPinOption={onPinOption ? (label, value) => onPinOption(row.paramKey || row.label, label, value) : undefined}
                        onUnpinOption={onUnpinOption ? () => onUnpinOption(row.paramKey || row.label) : undefined}
                        isPinnedFn={isPinnedOption ? (val) => isPinnedOption(row.paramKey || row.label, val) : undefined}
                        customOptionValues={new Set((customParamOptions?.[row.paramKey || ""] || []).map(o => o.value))}
                      />
                    )}
                    {/* Custom rows — show dropdown with user-added options */}
                    {!isHidden && row.isCustom && row.paramKey && (
                      <ParamChipSelector
                        options={customParamOptions?.[row.paramKey] || []}
                        currentValue={row.value}
                        onSelect={(selectedValue) => {
                          const displayIdx = idx;
                          if (useFixedMode) {
                            handleFixedValueSave(displayIdx, selectedValue);
                          } else {
                            handleValueSave(displayIdx, selectedValue);
                          }
                          setTimeout(() => onAutoLock?.(), 150);
                        }}
                        styles={styles}
                        sectionKey={sectionKey}
                        paramLabel={row.label}
                        onAddCustomOption={onAddCustomOption ? (label) => onAddCustomOption(row.paramKey || row.label, label) : undefined}
                        onEditCustomOption={onEditCustomOption ? (oldVal, newLabel) => onEditCustomOption(row.paramKey || row.label, oldVal, newLabel) : undefined}
                        onDeleteCustomOption={onDeleteCustomOption ? (val) => onDeleteCustomOption(row.paramKey || row.label, val) : undefined}
                        onPinOption={onPinOption ? (label, value) => onPinOption(row.paramKey || row.label, label, value) : undefined}
                        onUnpinOption={onUnpinOption ? () => onUnpinOption(row.paramKey || row.label) : undefined}
                        isPinnedFn={isPinnedOption ? (val) => isPinnedOption(row.paramKey || row.label, val) : undefined}
                        customOptionValues={new Set((customParamOptions?.[row.paramKey] || []).map(o => o.value))}
                      />
                    )}
                  </div>
                </td>
                {/* Value — hidden rows show empty */}
                {isHidden ? (
                  <td className="py-1.5 px-3 text-[10px] italic" style={{ color: "hsl(var(--foreground) / 0.25)" }}>
                    (hidden)
                  </td>
                ) : (
                  <EditableValueCell
                    value={row.value}
                    label={row.label}
                    rowIndex={idx}
                    rowNumber={row.number}
                    onSave={(i: number, newVal: string) => {
                      // Track manual override of scene-synced values
                      if (row.isSceneValue) {
                        setManuallyOverridden(prev => new Set(prev).add(row.label));
                      }
                      if (row.isParam) {
                        onExtraParamValueChange?.(row.paramKey || row.label, newVal);
                      } else if (useFixedMode) {
                        handleFixedValueSave(i, newVal);
                      } else {
                        handleValueSave(i, newVal);
                      }
                    }}
                    onDelete={
                      row.isParam
                        ? () => onExtraParamDelete?.(row.paramKey || row.label)
                        : row.isCustom
                          ? () => handleDeleteCustomRow(row.originalMatch)
                          : undefined
                    }
                    styles={styles}
                    isLocked={isLocked}
                    sectionKey={sectionKey}
                    onAutoLock={onAutoLock}
                    isSceneValue={row.isSceneValue && !manuallyOverridden.has(row.label)}
                    isManuallyOverridden={row.isSceneValue === true && manuallyOverridden.has(row.label)}
                    onResetToSP={
                      row.isSceneValue && manuallyOverridden.has(row.label)
                        ? () => {
                            // Find the original SP value
                            const defLabel = defaultLabels?.find(d => d.label === row.label);
                            const spKey = defLabel?.sceneParamKey;
                            const spVal = spKey && sceneParamsOverrideProp ? sceneParamsOverrideProp[spKey] : undefined;
                            if (spVal) {
                              // Reset value
                              if (row.isParam) {
                                onExtraParamValueChange?.(row.paramKey || row.label, spVal);
                              } else if (useFixedMode) {
                                handleFixedValueSave(idx, spVal);
                              } else {
                                handleValueSave(idx, spVal);
                              }
                              // Remove from overridden set
                              setManuallyOverridden(prev => {
                                const next = new Set(prev);
                                next.delete(row.label);
                                return next;
                              });
                            }
                          }
                        : undefined
                    }
                    blueprintModel={blueprintModel}
                  />
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Add Custom Row */}
      {onAddCustomRow && !isLocked && (
        <div className="mt-1.5">
          {showAddRow ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
              style={{ background: `${styles.labelBg}`, border: `1px solid ${styles.labelText}25` }}
            >
              <input
                ref={addRowInputRef}
                type="text"
                value={newRowLabel}
                onChange={(e) => setNewRowLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRowLabel.trim()) {
                    onAddCustomRow(newRowLabel.trim());
                    setNewRowLabel("");
                    setShowAddRow(false);
                  } else if (e.key === "Escape") {
                    setNewRowLabel("");
                    setShowAddRow(false);
                  }
                }}
                placeholder="নতুন পয়েন্টের নাম লিখুন..."
                className="flex-1 px-2 py-1 rounded text-[11px] bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={() => {
                  if (newRowLabel.trim()) {
                    onAddCustomRow(newRowLabel.trim());
                    setNewRowLabel("");
                    setShowAddRow(false);
                  }
                }}
                disabled={!newRowLabel.trim()}
                className="p-1 rounded hover:bg-primary/10 disabled:opacity-30 transition-colors"
              >
                <Check className="w-3.5 h-3.5" style={{ color: "hsl(160 60% 40%)" }} />
              </button>
              <button
                onClick={() => { setNewRowLabel(""); setShowAddRow(false); }}
                className="p-1 rounded hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" style={{ color: "hsl(0 60% 50%)" }} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowAddRow(true); setTimeout(() => addRowInputRef.current?.focus(), 50); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02]"
              style={{
                color: styles.labelText,
                background: `${styles.labelBg}`,
                border: `1px dashed ${styles.labelText}40`,
              }}
            >
              <Plus className="w-3 h-3" />
              নতুন পয়েন্ট যোগ করুন
            </button>
          )}
        </div>
      )}

      {unparsedContent && sectionKey !== "gha" && (
        <div className="concept-prose text-xs leading-relaxed blueprint-table mt-3 pt-3 border-t border-border/30">
          <ReactMarkdown>{unparsedContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
