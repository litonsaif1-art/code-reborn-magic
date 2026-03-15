import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function ProjectBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.rpc("export_all_data");
      if (error) throw error;

      const exportData = data as Record<string, any>;

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creative-core-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const sessions = exportData?.chat_sessions?.length || 0;
      const blueprints = exportData?.saved_blueprints?.length || 0;
      toast({
        title: "✅ Export সম্পন্ন",
        description: `${sessions}টি সেশন, ${blueprints}টি ব্লুপ্রিন্ট সহ সম্পূর্ণ ব্যাকআপ ডাউনলোড হয়েছে।`,
      });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({
        title: "Export ত্রুটি",
        description: err?.message || "ব্যাকআপ তৈরি করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setImporting(true);
      try {
        const raw = event.target?.result as string;
        const payload = JSON.parse(raw);

        // Validate structure
        if (!payload.chat_sessions && !payload.saved_blueprints && !payload.version) {
          throw new Error("Invalid backup file format");
        }

        const { data, error } = await supabase.rpc("import_all_data", {
          payload,
        });
        if (error) throw error;

        const result = data as Record<string, any>;
        const imported = result?.imported || {};
        const totalItems = Object.values(imported as Record<string, number>).reduce(
          (sum: number, val: number) => sum + val,
          0
        );

        toast({
          title: "✅ Import সম্পন্ন",
          description: `${totalItems}টি আইটেম সফলভাবে রিস্টোর হয়েছে। পেজ রিলোড হচ্ছে...`,
        });

        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        console.error("Import error:", err);
        toast({
          title: "Import ত্রুটি",
          description: err?.message || "ব্যাকআপ ফাইল পড়তে সমস্যা হয়েছে।",
          variant: "destructive",
        });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex gap-1.5 w-full">
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all
          bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400
          hover:from-emerald-500/30 hover:to-teal-500/30 hover:text-emerald-300
          border border-emerald-500/20 hover:border-emerald-500/40
          shadow-sm hover:shadow-emerald-500/10
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span>{exporting ? "Exporting..." : "Export All"}</span>
      </button>

      {/* Import Button */}
      <label
        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all
          bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400
          hover:from-blue-500/30 hover:to-indigo-500/30 hover:text-blue-300
          border border-blue-500/20 hover:border-blue-500/40
          shadow-sm hover:shadow-blue-500/10
          ${importing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span>{importing ? "Importing..." : "Import All"}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
        />
      </label>
    </div>
  );
}
