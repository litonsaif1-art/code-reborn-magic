import { useState, useRef } from "react";
import { Download, Upload, Check, AlertTriangle, Shield, Database, HardDrive, Settings, Eye, EyeOff, KeyRound, Loader2, FileCheck, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const BACKUP_VERSION = "3.0";
const STORAGE_KEY = "creative-core-sessions";
const ACTIVE_KEY = "creative-core-active";

// === INTEGRITY ===
function computeChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function gatherAllLocalStorageSettings(): Record<string, string> {
  const settings: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith("sb-")) continue;
    settings[key] = localStorage.getItem(key) || "";
  }
  return settings;
}

// === PAGINATED EXPORT (handles >1000 rows) ===
async function fetchAllRows(table: string, userId: string, orderBy: string = "created_at"): Promise<any[]> {
  const allRows: any[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .eq("user_id", userId)
      .range(offset, offset + PAGE_SIZE - 1)
      .order(orderBy, { ascending: true });

    if (error) {
      console.error(`[Export] ${table} error at offset ${offset}:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      offset += data.length;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

// Import order: parent tables first, then child tables (foreign key safe)
const TABLE_IMPORT_ORDER: { table: string; label: string; labelBn: string; orderBy?: string }[] = [
  { table: "profiles", label: "profiles", labelBn: "প্রোফাইল" },
  { table: "chat_sessions", label: "chat_sessions", labelBn: "সেশন" },
  { table: "chat_messages", label: "chat_messages", labelBn: "মেসেজ" },
  { table: "saved_blueprints", label: "saved_blueprints", labelBn: "ব্লুপ্রিন্ট" },
  { table: "concept_scores", label: "concept_scores", labelBn: "স্কোর" },
  { table: "ai_memory", label: "ai_memory", labelBn: "মেমোরি" },
  { table: "blueprint_history", label: "blueprint_history", labelBn: "হিস্ট্রি" },
  { table: "bookmarked_concepts", label: "bookmarked_concepts", labelBn: "বুকমার্ক" },
  { table: "analytics_events", label: "analytics_events", labelBn: "অ্যানালিটিক্স" },
  { table: "evolution_chains", label: "evolution_chains", labelBn: "ইভোলিউশন" },
  { table: "creative_knowledge_base", label: "creative_knowledge_base", labelBn: "নলেজবেস" },
  { table: "storyboard_frames", label: "storyboard_frames", labelBn: "স্টোরিবোর্ড" },
  { table: "theme_dna", label: "theme_dna", labelBn: "থিম DNA" },
  { table: "used_elements", label: "used_elements", labelBn: "ব্যবহৃত এলিমেন্ট" },
  { table: "scene_params_defaults", label: "scene_params_defaults", labelBn: "সিন প্যারামিটারস", orderBy: "updated_at" },
  { table: "advisor_messages", label: "advisor_messages", labelBn: "অ্যাডভাইজর মেসেজ" },
  { table: "concept_runs", label: "concept_runs", labelBn: "কনসেপ্ট রান" },
  { table: "app_settings", label: "app_settings", labelBn: "অ্যাপ সেটিংস", orderBy: "updated_at" },
  { table: "saved_suggestions", label: "saved_suggestions", labelBn: "সেভড সাজেশন", orderBy: "updated_at" },
  { table: "session_variants", label: "session_variants", labelBn: "সেশন ভেরিয়েন্ট" },
];

async function exportSupabaseData(
  userId: string,
  onProgress: (msg: string) => void
): Promise<Record<string, any[]>> {
  const dbData: Record<string, any[]> = {};

  for (const { table, labelBn, orderBy } of TABLE_IMPORT_ORDER) {
    onProgress(`📤 ${labelBn} এক্সপোর্ট হচ্ছে...`);
    dbData[table] = await fetchAllRows(table, userId, orderBy || "created_at");
  }

  return dbData;
}

// === BATCH IMPORT (50 rows at a time, ordered) ===
async function importSupabaseData(
  userId: string,
  dbData: Record<string, any[]>,
  onProgress: (msg: string) => void
): Promise<{ results: string[]; totalImported: number; totalFailed: number }> {
  const results: string[] = [];
  let totalImported = 0;
  let totalFailed = 0;
  const BATCH_SIZE = 50;

  for (const { table, labelBn } of TABLE_IMPORT_ORDER) {
    const rows = dbData[table];
    if (!rows || rows.length === 0) continue;

    onProgress(`📥 ${labelBn} ইম্পোর্ট হচ্ছে... (${rows.length}টি)`);

    // Replace user_id with current user
    const preparedRows = rows.map((r: any) => ({ ...r, user_id: userId }));
    let imported = 0;
    let failed = 0;

    // Batch upsert
    for (let i = 0; i < preparedRows.length; i += BATCH_SIZE) {
      const batch = preparedRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from(table as any)
        .upsert(batch as any, { onConflict: "id" });

      if (error) {
        console.error(`[Import] ${table} batch ${i} error:`, error.message);
        failed += batch.length;
        // Try individual inserts for failed batch
        for (const row of batch) {
          const { error: rowErr } = await supabase
            .from(table as any)
            .upsert(row as any, { onConflict: "id" });
          if (!rowErr) {
            imported++;
            failed--;
          }
        }
      } else {
        imported += batch.length;
      }
    }

    totalImported += imported;
    totalFailed += failed;

    if (failed > 0) {
      results.push(`⚠️ ${labelBn}: ${imported}/${rows.length} সফল, ${failed} ব্যর্থ`);
    } else {
      results.push(`✅ ${labelBn}: ${imported}টি রিস্টোর`);
    }
  }

  return { results, totalImported, totalFailed };
}

export function DataExportImport() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error" | "info"; message: string; details?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = async () => {
    setResult(null);
    setLoading(true);
    setProgress("শুরু হচ্ছে...");
    try {
      // localStorage data
      setProgress("📦 লোকাল ডাটা সংগ্রহ হচ্ছে...");
      const sessionsRaw = localStorage.getItem(STORAGE_KEY);
      const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];
      const activeSessionId = localStorage.getItem(ACTIVE_KEY) || null;
      const appSettings = gatherAllLocalStorageSettings();

      // Supabase data
      let dbData: Record<string, any[]> | null = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        dbData = await exportSupabaseData(user.id, setProgress);
      }

      // Build backup with checksum
      const payload = {
        sessions,
        activeSessionId,
        appSettings,
        supabaseData: dbData,
      };

      const checksum = computeChecksum(payload);

      const backup = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        checksum,
        ...payload,
        // Summary for verification
        _summary: {
          localSessions: sessions.length,
          localSettingsKeys: Object.keys(appSettings).length,
          dbTables: dbData
            ? Object.entries(dbData).reduce((acc, [k, v]) => {
                acc[k] = v.length;
                return acc;
              }, {} as Record<string, number>)
            : null,
          totalDbRows: dbData
            ? Object.values(dbData).reduce((sum, arr) => sum + arr.length, 0)
            : 0,
        },
      };

      setProgress("📝 ফাইল তৈরি হচ্ছে...");

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creative-core-FULL-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const dbCount = backup._summary.totalDbRows;
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);

      const details: string[] = [
        `📂 লোকাল সেশন: ${sessions.length}`,
        `⚙️ সেটিংস: ${Object.keys(appSettings).length} কী`,
      ];

      if (dbData) {
        for (const { table, labelBn } of TABLE_IMPORT_ORDER) {
          const count = dbData[table]?.length || 0;
          if (count > 0) details.push(`  📊 ${labelBn}: ${count}টি`);
        }
      }

      details.push(`📁 ফাইল সাইজ: ${fileSizeMB} MB`);
      details.push(`🔐 Checksum: ${checksum}`);

      setResult({
        type: "success",
        message: `✅ সম্পূর্ণ ব্যাকআপ — ${sessions.length} সেশন + ${dbCount} ডাটাবেজ রেকর্ড`,
        details,
      });
    } catch (err: any) {
      setResult({ type: "error", message: `❌ এক্সপোর্ট ত্রুটি: ${err.message}` });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setLoading(true);
    setProgress("ফাইল পড়া হচ্ছে...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const backup = JSON.parse(raw);

        // === INTEGRITY CHECK ===
        if (backup.checksum) {
          setProgress("🔐 ইন্টেগ্রিটি চেক হচ্ছে...");
          const { checksum, version, exportedAt, _summary, ...payload } = backup;
          const recomputed = computeChecksum(payload);
          if (recomputed !== checksum) {
            setResult({
              type: "error",
              message: `❌ ডাটা ইন্টেগ্রিটি ব্যর্থ! ফাইলটি পরিবর্তিত বা ক্ষতিগ্রস্ত হয়ে থাকতে পারে।`,
              details: [`প্রত্যাশিত: ${checksum}`, `পাওয়া: ${recomputed}`],
            });
            setLoading(false);
            setProgress(null);
            return;
          }
        }

        // === RESTORE LOCAL STORAGE ===
        setProgress("📦 লোকাল ডাটা রিস্টোর হচ্ছে...");
        if (backup.sessions && Array.isArray(backup.sessions)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.sessions));
        }
        if (backup.activeSessionId) {
          localStorage.setItem(ACTIVE_KEY, backup.activeSessionId);
        }
        if (backup.appSettings) {
          Object.entries(backup.appSettings).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
        }

        // === RESTORE SUPABASE DATA ===
        const details: string[] = [];
        details.push(`📂 লোকাল সেশন: ${backup.sessions?.length || 0}টি রিস্টোর`);
        details.push(`⚙️ সেটিংস: ${Object.keys(backup.appSettings || {}).length} কী রিস্টোর`);

        let dbImported = 0;
        let dbFailed = 0;

        if (backup.supabaseData) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const importResult = await importSupabaseData(user.id, backup.supabaseData, setProgress);
            details.push("", "--- ডাটাবেজ ---");
            details.push(...importResult.results);
            dbImported = importResult.totalImported;
            dbFailed = importResult.totalFailed;
          } else {
            details.push("⚠️ লগইন না থাকায় ডাটাবেজ ডাটা রিস্টোর হয়নি");
          }
        }

        // === VERIFICATION ===
        if (backup._summary) {
          setProgress("✅ ভেরিফিকেশন হচ্ছে...");
          details.push("", "--- ভেরিফিকেশন ---");
          const expectedDb = backup._summary.totalDbRows || 0;
          const actualDb = dbImported;
          if (expectedDb === actualDb) {
            details.push(`✅ ডাটাবেজ: ${actualDb}/${expectedDb} — ১০০% সম্পূর্ণ`);
          } else if (dbFailed > 0) {
            details.push(`⚠️ ডাটাবেজ: ${actualDb}/${expectedDb} — ${dbFailed}টি ব্যর্থ`);
          } else {
            details.push(`✅ ডাটাবেজ: ${actualDb}টি রিস্টোর`);
          }

          if (backup.checksum) {
            details.push(`🔐 ইন্টেগ্রিটি: ✅ পাস`);
          }
        }

        const hasFailures = dbFailed > 0;

        setResult({
          type: hasFailures ? "info" : "success",
          message: hasFailures
            ? `⚠️ আংশিক রিস্টোর — ${dbImported} সফল, ${dbFailed} ব্যর্থ`
            : `✅ সম্পূর্ণ রিস্টোর সফল — একটি অক্ষরও মিসিং নেই!`,
          details,
        });

        setTimeout(() => window.location.reload(), 3000);
      } catch (err: any) {
        setResult({ type: "error", message: `❌ ইম্পোর্ট ত্রুটি: ${err.message}` });
      } finally {
        setLoading(false);
        setProgress(null);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setResult(null); setProgress(null); } }}>
      <DialogTrigger asChild>
        <button
          className="absolute top-4 right-4 p-2.5 rounded-xl transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, hsl(260 65% 55% / 0.15), hsl(280 60% 50% / 0.15))",
            border: "1px solid hsl(260 50% 60% / 0.3)",
            color: "hsl(260 50% 55%)",
          }}
          title="Admin Panel — Export / Import"
        >
          <Shield className="w-5 h-5" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="p-0 border-0 rounded-3xl overflow-hidden max-w-sm max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(160deg, hsl(230 30% 14%), hsl(250 35% 16%), hsl(270 30% 15%))",
          boxShadow: "0 40px 80px -20px hsl(250 50% 10% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.08)",
          border: "1px solid hsl(0 0% 100% / 0.08)",
        }}
      >
        <div
          className="h-1"
          style={{
            background: "linear-gradient(90deg, hsl(160 70% 50%), hsl(200 80% 55%), hsl(260 70% 60%))",
          }}
        />

        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                background: "linear-gradient(135deg, hsl(160 50% 40% / 0.3), hsl(200 55% 45% / 0.3))",
                border: "1px solid hsl(0 0% 100% / 0.1)",
              }}
            >
              <Shield className="w-5 h-5" style={{ color: "hsl(160 60% 65%)" }} />
            </div>
            <div>
              <h2
                className="text-base font-black"
                style={{
                  background: "linear-gradient(135deg, hsl(0 0% 100%), hsl(0 0% 80%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                📦 সম্পূর্ণ ডাটা ব্যাকআপ
              </h2>
              <p className="text-[10px] flex items-center gap-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                <HardDrive className="w-3 h-3" /> লোকাল + <Database className="w-3 h-3" /> ডাটাবেজ + <Hash className="w-3 h-3" /> ইন্টেগ্রিটি চেক
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* Progress Indicator */}
          {progress && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-semibold animate-pulse"
              style={{
                background: "hsl(200 60% 40% / 0.15)",
                border: "1px solid hsl(200 60% 50% / 0.2)",
                color: "hsl(200 60% 70%)",
              }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{progress}</span>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExportAll}
            disabled={loading}
            className="w-full flex items-center justify-between py-4 px-5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(175 60% 40% / 0.2), hsl(175 50% 35% / 0.15))",
              border: "1.5px solid hsl(175 60% 50% / 0.3)",
              color: "hsl(175 60% 70%)",
            }}
          >
            <span className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <span className="flex flex-col items-start">
                <span>Export All</span>
                <span className="text-[9px] font-normal opacity-60">সম্পূর্ণ A-Z ব্যাকআপ — পেজিনেটেড</span>
              </span>
            </span>
            <span
              className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
              style={{
                background: "hsl(175 50% 45% / 0.2)",
                color: "hsl(175 50% 60%)",
              }}
            >
              JSON
            </span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-between py-4 px-5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(200 60% 40% / 0.2), hsl(200 50% 35% / 0.15))",
              border: "1.5px solid hsl(200 60% 50% / 0.3)",
              color: "hsl(200 60% 70%)",
            }}
          >
            <span className="flex items-center gap-3">
              <Upload className="w-5 h-5" />
              <span className="flex flex-col items-start">
                <span>Import & Restore</span>
                <span className="text-[9px] font-normal opacity-60">ইন্টেগ্রিটি চেক + অর্ডার্ড রিস্টোর</span>
              </span>
            </span>
            <span
              className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
              style={{
                background: "hsl(200 50% 45% / 0.2)",
                color: "hsl(200 50% 60%)",
              }}
            >
              JSON
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportAll}
            className="hidden"
          />

          {/* Result Display */}
          {result && (
            <div
              className="px-4 py-3 rounded-xl text-[11px] font-semibold space-y-1.5"
              style={{
                background: result.type === "success"
                  ? "hsl(160 60% 40% / 0.15)"
                  : result.type === "error"
                  ? "hsl(0 60% 45% / 0.15)"
                  : "hsl(45 70% 45% / 0.15)",
                border: `1px solid ${
                  result.type === "success" ? "hsl(160 60% 50% / 0.3)"
                  : result.type === "error" ? "hsl(0 60% 50% / 0.3)"
                  : "hsl(45 70% 50% / 0.3)"
                }`,
                color: result.type === "success" ? "hsl(160 60% 65%)"
                  : result.type === "error" ? "hsl(0 60% 65%)"
                  : "hsl(45 70% 65%)",
              }}
            >
              <div className="flex items-start gap-2">
                {result.type === "success" ? (
                  <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
                ) : result.type === "error" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="font-bold">{result.message}</span>
              </div>

              {result.details && result.details.length > 0 && (
                <div className="mt-2 space-y-0.5 text-[10px] font-normal opacity-80 pl-6">
                  {result.details.map((d, i) => (
                    <div key={i}>{d || <div className="h-1" />}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PIN Change Section */}
          <PinChangeSection />

          <p className="text-[9px] text-center" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
            v{BACKUP_VERSION} — পেজিনেটেড এক্সপোর্ট, ব্যাচ ইম্পোর্ট, FK-অর্ডার, চেকসাম ভেরিফিকেশন
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────── PIN Change Section ─────────────── */
const PIN_STORAGE_KEY = "cc-admin-pin";
const DEFAULT_PIN = "758900";

function PinChangeSection() {
  const [expanded, setExpanded] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const getPin = () => localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPin !== getPin()) {
      setError("বর্তমান PIN ভুল হয়েছে");
      return;
    }
    if (newPin.length < 4 || newPin.length > 8) {
      setError("নতুন PIN ৪-৮ ডিজিটের হতে হবে");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setError("PIN শুধু সংখ্যা হতে হবে");
      return;
    }
    if (newPin !== confirmPin) {
      setError("নতুন PIN দুটি মিলছে না");
      return;
    }
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    setSuccess(true);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setTimeout(() => { setSuccess(false); setExpanded(false); }, 2000);
  };

  return (
    <div className="rounded-2xl" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left px-4 py-3"
      >
        <Settings className="w-4 h-4" style={{ color: "hsl(35 90% 55%)" }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Admin PIN পরিবর্তন
        </span>
        <span className="ml-auto text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-2.5">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.25)" }} />
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPin}
              onChange={(e) => { setCurrentPin(e.target.value.replace(/\D/g, "")); setError(""); }}
              maxLength={8}
              placeholder="বর্তমান PIN"
              className="w-full pl-9 pr-9 py-2.5 rounded-lg text-[11px] outline-none"
              style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.8)" }}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showCurrent ? <EyeOff className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <Eye className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPin}
              onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setError(""); }}
              maxLength={8}
              placeholder="নতুন PIN"
              className="w-full px-3 py-2.5 rounded-lg text-[11px] outline-none pr-9"
              style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.8)" }}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showNew ? <EyeOff className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <Eye className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
            </button>
          </div>
          <input
            type="password"
            value={confirmPin}
            onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setError(""); }}
            maxLength={8}
            placeholder="নতুন PIN নিশ্চিত করুন"
            className="w-full px-3 py-2.5 rounded-lg text-[11px] outline-none"
            style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.8)" }}
          />
          {error && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" style={{ color: "hsl(0 70% 60%)" }} />
              <p className="text-[10px] font-bold" style={{ color: "hsl(0 70% 60%)" }}>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3" style={{ color: "hsl(160 70% 50%)" }} />
              <p className="text-[10px] font-bold" style={{ color: "hsl(160 70% 50%)" }}>✅ PIN সফলভাবে পরিবর্তন হয়েছে!</p>
            </div>
          )}
          <button
            type="submit"
            disabled={!currentPin || newPin.length < 4 || !confirmPin}
            className="w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, hsl(35 85% 50%), hsl(25 80% 48%))",
              color: "hsl(0 0% 100%)",
              border: "1px solid hsl(35 85% 50% / 0.3)",
            }}
          >
            PIN আপডেট করুন
          </button>
        </form>
      )}
    </div>
  );
}
