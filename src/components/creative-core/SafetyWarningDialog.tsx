import { memo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, XCircle, Eye, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SafetyResult,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_BG,
  SafetySeverity,
} from "@/hooks/useContentSafety";

interface SafetyWarningDialogProps {
  open: boolean;
  result: SafetyResult | null;
  onProceed: () => void;
  onCancel: () => void;
  onFix?: () => void;
}

const SeverityIcon = ({ severity }: { severity: SafetySeverity }) => {
  switch (severity) {
    case "high":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "medium":
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case "low":
      return <Eye className="w-5 h-5 text-yellow-500" />;
    default:
      return <Shield className="w-5 h-5 text-green-500" />;
  }
};

function SafetyWarningDialogComponent({
  open,
  result,
  onProceed,
  onCancel,
  onFix,
}: SafetyWarningDialogProps) {
  if (!result) return null;

  const isHighSeverity = result.overallSeverity === "high";

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-lg glass border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              SEVERITY_BG[result.overallSeverity]
            )}>
              <SeverityIcon severity={result.overallSeverity} />
            </div>
            <span className={SEVERITY_COLORS[result.overallSeverity]}>
              🛡️ Content Safety Warning
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-4">
            {/* Summary */}
            <div className="text-sm text-muted-foreground">
              {result.summary}
            </div>

            {/* Flagged Categories */}
            {result.flaggedCategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  সনাক্তকৃত সমস্যা:
                </p>
                <div className="space-y-2">
                  {result.flaggedCategories.map((flagged, idx) => {
                    const categoryInfo = CATEGORY_LABELS[flagged.category];
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border",
                          SEVERITY_BG[flagged.severity]
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{categoryInfo.icon}</span>
                          <span className="text-xs font-bold">
                            {categoryInfo.labelBn}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                            SEVERITY_COLORS[flagged.severity]
                          )}>
                            {flagged.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {flagged.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Platform Warning */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
              <p className="text-xs text-muted-foreground">
                ⚠️ এই কন্টেন্ট Facebook, YouTube, বা TikTok এ পোস্ট করলে 
                Community Guidelines লঙ্ঘনের কারণে সরানো হতে পারে বা একাউন্ট 
                সাসপেন্ড হতে পারে।
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="text-xs">
            বাতিল করুন
          </AlertDialogCancel>
          
          {/* Fix Button */}
          {onFix && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFix}
              className="text-xs border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            >
              <Wrench className="w-3.5 h-3.5 mr-1.5" />
              ফিক্স করুন
            </Button>
          )}
          
          <AlertDialogAction
            onClick={onProceed}
            className={cn(
              "text-xs",
              isHighSeverity
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            {isHighSeverity ? "⚠️ ঝুঁকি বুঝে দেখুন" : "দেখুন"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const SafetyWarningDialog = memo(SafetyWarningDialogComponent);
