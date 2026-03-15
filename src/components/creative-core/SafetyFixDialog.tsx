import { memo, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench, Sparkles, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SafetyResult,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_BG,
} from "@/hooks/useContentSafety";
import { Checkbox } from "@/components/ui/checkbox";

interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  selected: boolean;
}

interface SafetyFixDialogProps {
  open: boolean;
  result: SafetyResult | null;
  onClose: () => void;
  onApplyFixes: (selectedFixes: string[]) => void;
  isApplying?: boolean;
}

// Generate fix suggestions based on flagged categories
const generateFixSuggestions = (result: SafetyResult): FixSuggestion[] => {
  const suggestions: FixSuggestion[] = [];

  result.flaggedCategories.forEach((flagged) => {
    switch (flagged.category) {
      case "violence_gore":
        suggestions.push(
          { id: "v1", title: "দৃশ্য নরম করুন", description: "সহিংস দৃশ্যগুলো implied/off-screen করুন, সরাসরি না দেখিয়ে", selected: false },
          { id: "v2", title: "প্রাকৃতিক প্রেক্ষাপট", description: "শিকারের দৃশ্যকে প্রকৃতির স্বাভাবিক চক্র হিসেবে উপস্থাপন করুন", selected: false }
        );
        break;
      case "adult_sexual":
        suggestions.push(
          { id: "a1", title: "ইঙ্গিতমূলক করুন", description: "প্রত্যক্ষ দৃশ্যের বদলে সূক্ষ্ম ইঙ্গিত ব্যবহার করুন", selected: false },
          { id: "a2", title: "শিল্পসম্মত উপস্থাপনা", description: "শৈল্পিক ও রুচিশীল উপায়ে বিষয়বস্তু তুলে ধরুন", selected: false }
        );
        break;
      case "hate_discrimination":
        suggestions.push(
          { id: "h1", title: "সমালোচনামূলক দৃষ্টিভঙ্গি", description: "বৈষম্যকে সমস্যা হিসেবে দেখান, সমর্থন নয়", selected: false },
          { id: "h2", title: "শিক্ষামূলক প্রেক্ষাপট", description: "ঐতিহাসিক/শিক্ষামূলক কাঠামোতে উপস্থাপন করুন", selected: false }
        );
        break;
      case "misinformation_scams":
        suggestions.push(
          { id: "m1", title: "কাল্পনিক ট্যাগ", description: "স্পষ্টভাবে 'কাল্পনিক' বা 'রূপক' হিসেবে চিহ্নিত করুন", selected: false },
          { id: "m2", title: "তথ্যসূত্র যোগ করুন", description: "বিশ্বাসযোগ্য তথ্যসূত্র বা দাবি-পরিত্যাগ যোগ করুন", selected: false }
        );
        break;
    }
  });

  // Add universal suggestions
  suggestions.push(
    { id: "u1", title: "টোন পরিবর্তন", description: "আক্রমণাত্মক টোনের বদলে নিরপেক্ষ/শিক্ষামূলক টোন ব্যবহার করুন", selected: false }
  );

  // Return max 5 unique suggestions
  const uniqueSuggestions = suggestions.filter((s, i, arr) =>
    arr.findIndex(x => x.id === s.id) === i
  );

  return uniqueSuggestions.slice(0, 5);
};

function SafetyFixDialogComponent({
  open,
  result,
  onClose,
  onApplyFixes,
  isApplying = false,
}: SafetyFixDialogProps) {
  const [suggestions, setSuggestions] = useState<FixSuggestion[]>([]);

  // Generate suggestions when dialog opens / result changes
  useEffect(() => {
    if (!open || !result) return;
    setSuggestions(generateFixSuggestions(result));
  }, [open, result]);

  const toggleSuggestion = (id: string) => {
    setSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    );
  };

  const handleApply = () => {
    const selected = suggestions.filter(s => s.selected).map(s => s.title);
    if (selected.length > 0) {
      onApplyFixes(selected);
    }
  };

  const selectedCount = suggestions.filter(s => s.selected).length;

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg glass border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <span className="text-primary">🔧 কন্টেন্ট ফিক্স করুন</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            নিচের সমাধানগুলো ব্যবহার করে কন্টেন্ট Community Guidelines মেনে চলবে
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Problem Summary */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              সমস্যার কারণ:
            </p>
            <div className="space-y-2">
              {result.flaggedCategories.map((flagged, idx) => {
                const categoryInfo = CATEGORY_LABELS[flagged.category];
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs",
                      SEVERITY_BG[flagged.severity]
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{categoryInfo.icon}</span>
                      <span className="font-semibold">{categoryInfo.labelBn}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded uppercase font-bold", SEVERITY_COLORS[flagged.severity])}>
                        {flagged.severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fix Suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              সমাধান নির্বাচন করুন:
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => toggleSuggestion(suggestion.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                    "hover:border-primary/50",
                    suggestion.selected 
                      ? "bg-primary/10 border-primary/40" 
                      : "bg-secondary/30 border-border/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={suggestion.selected}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">
                        {suggestion.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {suggestion.description}
                      </p>
                    </div>
                    {suggestion.selected && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-[11px] text-muted-foreground">
              ✨ নির্বাচিত সমাধান অনুযায়ী Blueprint স্বয়ংক্রিয়ভাবে আপডেট হবে, 
              থিম ও গুণমান অক্ষুণ্ন রেখে।
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            বাতিল
          </Button>
          <Button 
            size="sm" 
            onClick={handleApply}
            disabled={selectedCount === 0 || isApplying}
            className="text-xs bg-primary hover:bg-primary/90"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                আপডেট হচ্ছে...
              </>
            ) : (
              <>
                <Wrench className="w-3.5 h-3.5 mr-1.5" />
                ফিক্স করুন ({selectedCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const SafetyFixDialog = memo(SafetyFixDialogComponent);
