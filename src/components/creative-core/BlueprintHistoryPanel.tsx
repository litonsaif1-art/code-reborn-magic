import { useState, useEffect } from "react";
import { History, RotateCcw, Trash2, X, Clock, ArrowLeftRight, Layers, CheckCircle2, XCircle, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlueprintSnapshot } from "@/hooks/useBlueprintHistory";
import { BlueprintCompareDialog } from "./BlueprintCompareDialog";

interface BlueprintHistoryPanelProps {
  history: BlueprintSnapshot[];
  loading: boolean;
  onRestore: (snapshot: BlueprintSnapshot) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string, currentPinned: boolean) => void;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘন্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} দিন আগে`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} মাস আগে`;
  const years = Math.floor(months / 12);
  return `${years} বছর আগে`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

type NotifType = "success" | "error";
interface InlineNotif {
  type: NotifType;
  message: string;
}

export function BlueprintHistoryPanel({ history, loading, onRestore, onDelete, onTogglePin, onClose }: BlueprintHistoryPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [notification, setNotification] = useState<InlineNotif | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  // Auto-clear notification after 3s
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(t);
  }, [notification]);

  // Auto-clear restored highlight after 3s
  useEffect(() => {
    if (!restoredId) return;
    const t = setTimeout(() => setRestoredId(null), 3000);
    return () => clearTimeout(t);
  }, [restoredId]);

  const totalCount = history.length;

  const handleRestore = (snapshot: BlueprintSnapshot) => {
    try {
      onRestore(snapshot);
      setRestoredId(snapshot.id);
      setNotification({ type: "success", message: `✅ সংস্করণ #${totalCount - history.indexOf(snapshot)} পুনরুদ্ধার সম্পন্ন হয়েছে` });
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: "❌ পুনরুদ্ধারে সমস্যা হয়েছে" });
    }
  };

  const handleDelete = (id: string) => {
    try {
      onDelete(id);
      setConfirmDelete(null);
      setNotification({ type: "success", message: "🗑️ স্ন্যাপশট মুছে ফেলা হয়েছে" });
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: "❌ মুছে ফেলা যায়নি" });
    }
  };

  return (
    <div data-blueprint-history-panel className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "hsl(0 0% 0% / 0.5)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(135deg, hsl(260 30% 97%), hsl(280 25% 95%))",
          border: "1px solid hsl(260 30% 88% / 0.5)",
          boxShadow: "0 25px 60px -15px hsl(260 40% 20% / 0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(260 20% 90% / 0.5)" }}>
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5" style={{ color: "hsl(260 60% 55%)" }} />
            <span className="font-bold text-sm" style={{ color: "hsl(260 30% 25%)" }}>
              ব্লুপ্রিন্ট ইতিহাস
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "hsl(260 40% 90%)", color: "hsl(260 50% 45%)" }}>
              {totalCount} টি সংস্করণ
            </span>
            {history.length >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold hover:scale-105 transition-all"
                style={{ background: "hsl(220 40% 90%)", color: "hsl(220 50% 45%)" }}
              >
                <ArrowLeftRight className="w-3 h-3" />
                তুলনা
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:scale-110 transition-all" style={{ color: "hsl(260 25% 50%)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Notification Banner */}
        {notification && (
          <div
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold animate-in slide-in-from-top-2 duration-300"
            style={{
              background: notification.type === "success"
                ? "linear-gradient(135deg, hsl(140 45% 92%), hsl(160 40% 90%))"
                : "linear-gradient(135deg, hsl(0 45% 95%), hsl(10 40% 92%))",
              color: notification.type === "success" ? "hsl(140 50% 30%)" : "hsl(0 60% 40%)",
              borderBottom: `1px solid ${notification.type === "success" ? "hsl(140 35% 80%)" : "hsl(0 40% 85%)"}`,
            }}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading && (
            <div className="text-center py-8 text-sm" style={{ color: "hsl(260 20% 55%)" }}>
              লোড হচ্ছে...
            </div>
          )}
          {!loading && history.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Clock className="w-8 h-8 mx-auto" style={{ color: "hsl(260 15% 75%)" }} />
              <p className="text-sm" style={{ color: "hsl(260 20% 55%)" }}>
                এখনো কোনো ইতিহাস নেই।
              </p>
              <p className="text-xs" style={{ color: "hsl(260 15% 65%)" }}>
                Blueprint পরিবর্তন করলে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।
              </p>
            </div>
          )}
          {history.map((snapshot, idx) => {
            if (!snapshot || !snapshot.id) return null;
            const serial = totalCount - idx;
            const isRestored = restoredId === snapshot.id;

            return (
              <div
                key={snapshot.id}
                className={cn(
                  "rounded-xl p-3 transition-all hover:scale-[1.01]",
                  isRestored && "ring-2 ring-offset-1"
                )}
                style={{
                  background: isRestored
                    ? "linear-gradient(135deg, hsl(220 50% 95%), hsl(240 45% 93%))"
                    : snapshot.pinned
                      ? "linear-gradient(135deg, hsl(35 60% 96%), hsl(40 50% 93%))"
                      : idx === 0
                        ? "linear-gradient(135deg, hsl(140 40% 95%), hsl(160 35% 93%))"
                        : "hsl(0 0% 100% / 0.7)",
                  border: `1px solid ${isRestored ? "hsl(220 50% 70%)" : snapshot.pinned ? "hsl(35 60% 75%)" : idx === 0 ? "hsl(140 35% 80%)" : "hsl(260 20% 90% / 0.5)"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* Serial badge */}
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black tabular-nums"
                        style={{ 
                          background: idx === 0 
                            ? "linear-gradient(135deg, hsl(250 65% 55%), hsl(270 60% 50%))" 
                            : "hsl(260 40% 90%)", 
                          color: idx === 0 ? "white" : "hsl(260 50% 45%)" 
                        }}>
                        #{serial}
                      </span>
                      {idx === 0 && !snapshot.pinned && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: "hsl(140 50% 85%)", color: "hsl(140 50% 30%)" }}>
                          সর্বশেষ
                        </span>
                      )}
                      {snapshot.pinned && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                          style={{ background: "hsl(35 80% 88%)", color: "hsl(35 70% 30%)" }}>
                          📌 পিন করা
                        </span>
                      )}
                      {isRestored && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold animate-in fade-in duration-300"
                          style={{ background: "hsl(220 55% 88%)", color: "hsl(220 60% 40%)" }}>
                          ✓ পুনরুদ্ধার হয়েছে
                        </span>
                      )}
                      {snapshot.snapshot_label && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: "hsl(210 50% 90%)", color: "hsl(210 50% 40%)" }}>
                          {snapshot.snapshot_label}
                        </span>
                      )}
                    </div>
                    {/* DateTime */}
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 shrink-0" style={{ color: "hsl(260 20% 60%)" }} />
                      <span className="text-[10px] font-mono font-medium" style={{ color: "hsl(260 25% 45%)" }}>
                        {formatDateTime(snapshot.created_at)}
                      </span>
                      <span className="text-[9px]" style={{ color: "hsl(260 15% 60%)" }}>
                        ({timeAgo(snapshot.created_at)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] truncate flex-1" style={{ color: "hsl(260 15% 55%)" }}>
                        {snapshot.blueprint_content
                          ? (snapshot.blueprint_content.substring(0, 80) + (snapshot.blueprint_content.length > 80 ? "..." : ""))
                          : `${Object.keys(snapshot.blueprint_params || {}).length} টি প্যারামিটার`}
                      </p>
                      {(snapshot.concept_count ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ background: "hsl(170 50% 92%)", color: "hsl(170 55% 35%)" }}>
                          <Layers className="w-2.5 h-2.5" />
                          {snapshot.concept_count} CC
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onTogglePin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(snapshot.id, !!snapshot.pinned); }}
                        className="p-1.5 rounded-lg hover:scale-110 active:scale-90 transition-all"
                        style={{
                          color: snapshot.pinned ? "hsl(35 70% 40%)" : "hsl(260 20% 60%)",
                          background: snapshot.pinned ? "hsl(35 70% 90%)" : "hsl(260 20% 95%)",
                        }}
                        title={snapshot.pinned ? "আনপিন করুন" : "পিন করুন"}
                      >
                        <Pin className="w-3.5 h-3.5" style={{ transform: snapshot.pinned ? "rotate(-45deg)" : "none" }} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(snapshot); }}
                      className="p-1.5 rounded-lg hover:scale-110 active:scale-90 transition-all"
                      style={{ color: "hsl(220 60% 50%)", background: "hsl(220 50% 95%)" }}
                      title="এই সংস্করণে ফিরে যান"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    {confirmDelete === snapshot.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(snapshot.id); }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold hover:scale-105 active:scale-95 transition-all"
                          style={{ color: "hsl(0 70% 45%)", background: "hsl(0 60% 93%)" }}
                        >
                          হ্যাঁ
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold hover:scale-105 active:scale-95 transition-all"
                          style={{ color: "hsl(260 30% 45%)", background: "hsl(260 20% 93%)" }}
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(snapshot.id); }}
                        className="p-1.5 rounded-lg hover:scale-110 active:scale-90 transition-all"
                        style={{ color: "hsl(0 40% 55%)", background: "hsl(0 30% 95%)" }}
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare Dialog */}
        <BlueprintCompareDialog
          open={showCompare}
          history={history}
          onClose={() => setShowCompare(false)}
        />
      </div>
    </div>
  );
}
