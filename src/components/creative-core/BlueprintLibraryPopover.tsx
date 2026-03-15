import { useState, useEffect, useRef, useMemo } from "react";
import { HardDrive, Trash2, BookOpen, Plus, X, Sparkles, FileText, Star, Search } from "lucide-react";
import type { SavedBlueprint } from "@/hooks/useBlueprintLibrary";
import { toast } from "@/hooks/use-toast";

interface BlueprintLibraryPopoverProps {
  currentContent: string;
  onLoadBlueprint: (content: string, id?: string) => void;
  isStreaming: boolean;
  blueprints: SavedBlueprint[];
  onSave: (name: string, content: string) => void;
  onRemove: (id: string) => void;
  onSetDefault?: (content: string) => void;
  defaultBlueprintContent?: string | null;
}

/** Normalize content for duplicate comparison — trim, collapse whitespace */
function normalizeContent(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function BlueprintLibraryPopover({
  currentContent,
  onLoadBlueprint,
  isStreaming,
  blueprints,
  onSave,
  onRemove,
  onSetDefault,
  defaultBlueprintContent,
}: BlueprintLibraryPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [searchSerial, setSearchSerial] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeBnDigits = (str: string) =>
    str.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

  const filteredBlueprints = useMemo(() => {
    const q = normalizeBnDigits(searchSerial.trim());
    if (!q) return blueprints;
    return blueprints.filter((_, idx) => {
      const serial = String(idx + 1);
      return serial.includes(q);
    });
  }, [blueprints, searchSerial]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSaving(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (isSaving && inputRef.current) inputRef.current.focus();
  }, [isSaving]);

  /** Check if content already exists in library */
  const findDuplicate = (content: string): SavedBlueprint | undefined => {
    const norm = normalizeContent(content);
    return blueprints.find((bp) => normalizeContent(bp.content) === norm);
  };

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;

    const dup = findDuplicate(currentContent);
    if (dup) {
      toast({
        title: "⚠️ ডুপ্লিকেট ব্লুপ্রিন্ট",
        description: `এই ব্লুপ্রিন্টটি ইতিমধ্যে "${dup.name}" হিসেবে লাইব্রেরিতে সংরক্ষিত আছে।`,
        variant: "destructive",
      });
      return;
    }

    onSave(trimmed, currentContent);
    toast({
      title: "✅ ব্লুপ্রিন্ট সেভ হয়েছে",
      description: `"${trimmed}" সফলভাবে লাইব্রেরিতে সংরক্ষিত হয়েছে।`,
    });
    setSaveName("");
    setIsSaving(false);
  };

  const handleLoad = (content: string, name: string, id: string) => {
    onLoadBlueprint(content, id);
    setIsOpen(false);
    toast({
      title: "📋 ব্লুপ্রিন্ট লোড হয়েছে",
      description: `"${name}" লোড করা হয়েছে।`,
    });
  };

  /** Check if a blueprint is the current default */
  const isDefault = (bp: SavedBlueprint): boolean => {
    if (!defaultBlueprintContent) return false;
    return normalizeContent(bp.content) === normalizeContent(defaultBlueprintContent);
  };

  const handleSetDefault = (bp: SavedBlueprint, e: React.MouseEvent) => {
    e.stopPropagation();
    onSetDefault?.(bp.content);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(id);
    toast({
      title: "🗑️ মুছে ফেলা হয়েছে",
      description: `"${name}" লাইব্রেরি থেকে সরানো হয়েছে।`,
    });
  };

  if (isStreaming) return null;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
        style={{
          background: blueprints.length > 0
            ? "linear-gradient(135deg, hsl(270 65% 58%), hsl(250 70% 52%))"
            : "linear-gradient(135deg, hsl(270 55% 62%), hsl(250 50% 58%))",
          color: "hsl(0 0% 100%)",
          border: "1px solid hsl(270 50% 65% / 0.4)",
          boxShadow: "0 3px 12px -3px hsl(270 60% 45% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
        }}
        title="ব্লুপ্রিন্ট লাইব্রেরি — সেভ, লোড ও ডিলিট করুন"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          Library {blueprints.length > 0 ? `(${blueprints.length})` : ""}
        </span>
      </button>

      {/* Premium Popover */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 rounded-3xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
          style={{
            minWidth: "340px",
            width: "max-content",
            maxWidth: "min(440px, 92vw)",
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(260 30% 90%)",
            boxShadow:
              "0 25px 60px -12px hsl(260 50% 30% / 0.2), 0 12px 24px -8px hsl(280 40% 40% / 0.1), 0 0 0 1px hsl(260 25% 92% / 0.5)",
          }}
        >
          {/* Top gradient accent bar */}
          <div
            className="h-[3px] w-full"
            style={{
              background: "linear-gradient(90deg, hsl(280 70% 60%), hsl(250 80% 62%), hsl(210 85% 58%), hsl(170 70% 50%), hsl(45 90% 55%))",
            }}
          />

          {/* Header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              background: "linear-gradient(180deg, hsl(260 25% 97%), hsl(0 0% 100%))",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(270 65% 58%), hsl(250 75% 55%))",
                  boxShadow: "0 4px 12px -3px hsl(260 60% 50% / 0.35)",
                }}
              >
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span
                  className="text-[11px] font-extrabold uppercase tracking-[0.15em] block"
                  style={{
                    background: "linear-gradient(135deg, hsl(270 60% 40%), hsl(250 70% 45%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Blueprint Library
                </span>
                <span className="text-[9px]" style={{ color: "hsl(260 15% 60%)" }}>
                  {blueprints.length > 0
                    ? `${blueprints.length}টি সংরক্ষিত`
                    : "কোনো ব্লুপ্রিন্ট নেই"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: "hsl(260 20% 95%)",
                color: "hsl(260 20% 55%)",
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4" style={{ height: "1px", background: "linear-gradient(90deg, transparent, hsl(260 30% 88%), transparent)" }} />

          {/* Save Section */}
          <div className="px-4 py-3">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                      setIsSaving(false);
                      setSaveName("");
                    }
                  }}
                  placeholder="ব্লুপ্রিন্টের নাম দিন..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs border-0 focus:outline-none focus:ring-2 focus:ring-[hsl(260_60%_60%)] transition-all"
                  style={{
                    background: "hsl(260 25% 96%)",
                    color: "hsl(260 30% 25%)",
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-3.5 py-2 rounded-xl text-[10px] font-bold text-white disabled:opacity-30 transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, hsl(270 65% 58%), hsl(250 75% 55%))",
                    boxShadow: "0 3px 10px -3px hsl(260 60% 50% / 0.3)",
                  }}
                >
                  সেভ
                </button>
                <button
                  onClick={() => { setIsSaving(false); setSaveName(""); }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "hsl(0 45% 55%)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSaving(true)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-2xl text-[11px] font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, hsl(270 50% 97%), hsl(250 40% 96%))",
                  color: "hsl(270 55% 45%)",
                  border: "1.5px dashed hsl(270 40% 80%)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(270 55% 65% / 0.2), hsl(250 50% 60% / 0.15))",
                  }}
                >
                  <Plus className="w-3 h-3" />
                </div>
                কাস্টম নামে সেভ করুন
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4" style={{ height: "1px", background: "linear-gradient(90deg, transparent, hsl(260 30% 88%), transparent)" }} />

          {/* Blueprint List */}
          {/* Search by serial */}
          {blueprints.length > 3 && (
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "hsl(260 20% 65%)" }} />
                <input
                  type="text"
                  value={searchSerial}
                  onChange={(e) => setSearchSerial(e.target.value)}
                  placeholder="সিরিয়াল নম্বর দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(260_50%_60%)] transition-all"
                  style={{
                    background: "hsl(260 25% 96%)",
                    color: "hsl(260 30% 25%)",
                    border: "1px solid hsl(260 20% 90%)",
                  }}
                />
                {searchSerial && (
                  <button
                    onClick={() => setSearchSerial("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "hsl(260 20% 60%)" }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div
            className="max-h-[45vh] overflow-y-auto py-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "hsl(260 30% 82%) transparent",
            }}
          >
            {filteredBlueprints.length === 0 && blueprints.length > 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-[11px] font-medium" style={{ color: "hsl(260 20% 55%)" }}>
                  এই নম্বরের কোনো ব্লুপ্রিন্ট নেই
                </p>
              </div>
            ) : blueprints.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "linear-gradient(135deg, hsl(260 30% 95%), hsl(270 25% 93%))",
                  }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "hsl(260 40% 70%)" }} />
                </div>
                <p className="text-[11px] font-medium" style={{ color: "hsl(260 20% 50%)" }}>
                  কোনো সংরক্ষিত ব্লুপ্রিন্ট নেই
                </p>
                <p className="text-[10px] mt-1" style={{ color: "hsl(260 15% 65%)" }}>
                  💾 Save বাটনে ক্লিক করে সংরক্ষণ শুরু করুন
                </p>
              </div>
            ) : (
              filteredBlueprints.map((bp) => {
                const originalIdx = blueprints.indexOf(bp);
                return (
                <div
                  key={bp.id}
                  className="flex items-center gap-3 mx-2 px-3 py-3 cursor-pointer group/bp rounded-2xl transition-all duration-200 mb-0.5"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsl(260 30% 96%)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                  onClick={() => handleLoad(bp.content, bp.name, bp.id)}
                >
                  {/* Serial badge */}
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${260 + originalIdx * 15} 50% 94%), hsl(${270 + originalIdx * 15} 45% 91%))`,
                      color: `hsl(${260 + originalIdx * 15} 55% 45%)`,
                      border: `1px solid hsl(${260 + originalIdx * 15} 35% 85%)`,
                    }}
                  >
                    {originalIdx + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-[12px] font-bold truncate"
                        style={{ color: "hsl(260 30% 25%)" }}
                      >
                        {bp.name}
                      </p>
                      {isDefault(bp) && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0"
                          style={{
                            background: "linear-gradient(135deg, hsl(45 90% 90%), hsl(35 85% 88%))",
                            color: "hsl(35 80% 35%)",
                            border: "1px solid hsl(40 60% 78%)",
                          }}
                        >
                          ⭐ Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FileText className="w-2.5 h-2.5 shrink-0" style={{ color: "hsl(260 20% 70%)" }} />
                      <p className="text-[9px] truncate" style={{ color: "hsl(260 15% 60%)" }}>
                        {new Date(bp.savedAt).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}
                        {bp.content.length > 50
                          ? bp.content.slice(0, 50) + "…"
                          : bp.content.slice(0, 50)}
                      </p>
                    </div>
                  </div>

                  {/* Set Default */}
                  <button
                    onClick={(e) => handleSetDefault(bp, e)}
                    className="opacity-0 group-hover/bp:opacity-60 hover:!opacity-100 w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 hover:scale-110"
                    style={{
                      background: isDefault(bp) ? "hsl(45 90% 90%)" : "hsl(45 60% 96%)",
                      border: isDefault(bp) ? "1px solid hsl(40 60% 72%)" : "1px solid hsl(45 40% 88%)",
                    }}
                    title={isDefault(bp) ? "ডিফল্ট হিসেবে সেট আছে" : "ডিফল্ট হিসেবে সেট করুন"}
                  >
                    <Star className={`w-3 h-3 ${isDefault(bp) ? "fill-current" : ""}`} style={{ color: isDefault(bp) ? "hsl(35 80% 40%)" : "hsl(45 40% 55%)" }} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(bp.id, bp.name, e)}
                    className="opacity-0 group-hover/bp:opacity-60 hover:!opacity-100 w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 hover:scale-110"
                    style={{
                      background: "hsl(0 60% 96%)",
                      border: "1px solid hsl(0 40% 90%)",
                    }}
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3 h-3" style={{ color: "hsl(0 50% 50%)" }} />
                  </button>
                </div>
                );
              })
            )}
          </div>

          {/* Bottom accent */}
          {blueprints.length > 0 && (
            <div className="px-5 py-2 text-center" style={{ background: "hsl(260 20% 97%)" }}>
              <span className="text-[8px] font-medium uppercase tracking-wider" style={{ color: "hsl(260 15% 70%)" }}>
                ক্লিক করে লোড করুন · হোভার করে ডিলিট করুন
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
