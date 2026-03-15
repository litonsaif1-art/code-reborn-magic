import { memo, useState } from "react";
import { FileText, ChevronDown, ChevronUp, Gavel, Shield, Zap, Eye, Target, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ConceptReport } from "@/hooks/useConceptRefinement";

interface ConceptReportDialogProps {
  report: ConceptReport;
  conceptIndex: number;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "hsl(150 60% 45%)" : score >= 50 ? "hsl(45 80% 50%)" : "hsl(0 65% 50%)";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children, color, defaultOpen = false }: {
  icon: any; title: string; children: React.ReactNode; color: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/30 overflow-hidden" style={{ background: `${color}08` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors hover:bg-muted/30"
        style={{ color }}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="px-3 pb-3 text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

function ConceptReportDialogComponent({ report, conceptIndex }: ConceptReportDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
            "hover:scale-105 active:scale-95"
          )}
          style={{
            color: "hsl(35 70% 45%)",
            background: "hsl(35 60% 94%)",
            border: "1px solid hsl(35 50% 80% / 0.5)",
          }}
          title="বিশ্লেষণ রিপোর্ট দেখুন"
        >
          <FileText className="w-3 h-3" />
          Report
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Gavel className="w-4 h-4 text-primary" />
            C{report.conceptNumber} — আদালতের বিশ্লেষণ রিপোর্ট
          </DialogTitle>
        </DialogHeader>

        {/* Score Overview */}
        <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/30">
          <ScoreBar score={report.originalScore} label="সামগ্রিক" />
          <ScoreBar score={report.hookStrength} label="হুক শক্তি" />
        </div>

        {/* Court-like two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* LEFT: Creation Mode (Prosecution — weaknesses found) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "hsl(0 60% 50%)", background: "hsl(0 50% 95%)", border: "1px solid hsl(0 40% 85%)" }}>
              <AlertTriangle className="w-3 h-3" />
              Creation Mode — সমস্যা চিহ্নিত
            </div>

            <Section icon={Shield} title="দুর্বলতা" color="hsl(0 60% 50%)" defaultOpen>
              {report.originalWeaknesses || "কোনো দুর্বলতা শনাক্ত হয়নি"}
            </Section>

            <Section icon={Eye} title="দর্শক ড্রপ পয়েন্ট" color="hsl(25 70% 50%)">
              {report.viewerDropPoint || "N/A"}
            </Section>

            <Section icon={Target} title="আত্মসমালোচনা" color="hsl(270 50% 55%)">
              {report.selfCritique || "N/A"}
            </Section>
          </div>

          {/* RIGHT: Refine Mode (Defense — fixes proposed) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "hsl(150 50% 40%)", background: "hsl(150 40% 95%)", border: "1px solid hsl(150 35% 85%)" }}>
              <Zap className="w-3 h-3" />
              Refine Mode — সমাধান প্রস্তাবিত
            </div>

            <Section icon={Zap} title="ভাইরাল ব্লকার ও সমাধান" color="hsl(150 50% 40%)" defaultOpen>
              <div className="space-y-2">
                <div className="text-destructive/80 font-semibold">🚫 ব্লকার:</div>
                <div>{report.viralBlockers || "N/A"}</div>
                <div className="text-green-600 font-semibold mt-2">✅ সমাধান:</div>
                <div>{report.refineFix || "N/A"}</div>
              </div>
            </Section>

            <Section icon={Target} title="অ্যালগরিদম ইস্যু" color="hsl(210 60% 50%)">
              {report.algorithmIssues || "N/A"}
            </Section>

            <Section icon={Shield} title="শক্তিশালী দিক (বজায় রাখা হয়েছে)" color="hsl(120 40% 45%)">
              {report.originalStrengths || "N/A"}
            </Section>
          </div>
        </div>

        {/* Verdict */}
        <div className="mt-3 p-3 rounded-xl text-center text-xs font-bold"
          style={{
            background: report.refinementSuccess 
              ? "linear-gradient(135deg, hsl(150 40% 95%), hsl(170 35% 93%))"
              : "linear-gradient(135deg, hsl(0 40% 95%), hsl(15 35% 93%))",
            border: report.refinementSuccess 
              ? "1px solid hsl(150 35% 80%)"
              : "1px solid hsl(0 35% 80%)",
            color: report.refinementSuccess ? "hsl(150 50% 35%)" : "hsl(0 50% 45%)",
          }}
        >
          {report.refinementSuccess 
            ? "✅ রায়: Refine Mode সফলভাবে সমস্ত গাট্টি ভরাট করেছে — উন্নত সংস্করণ তৈরি হয়েছে"
            : "⚠️ রায়: রিফাইনমেন্ট আংশিক সফল — আরও উন্নতি প্রয়োজন"
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ConceptReportDialog = memo(ConceptReportDialogComponent);
