import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, X, Trash2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface BookmarkedConcept {
  id: string;
  concept_content: string;
  label: string | null;
  created_at: string;
  session_id: string;
}

export function BookmarkedConceptsList() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkedConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookmarked_concepts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setBookmarks(data as BookmarkedConcept[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchBookmarks();
  }, [open, user]);

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarked_concepts").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "🗑️ বুকমার্ক মুছে ফেলা হয়েছে" });
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-[1.08] hover:-translate-y-px active:scale-[0.92] group"
        style={{
          background: "linear-gradient(145deg, hsl(38 95% 54%), hsl(28 90% 48%))",
          border: "1.5px solid hsl(35 80% 58%)",
          boxShadow: "0 4px 18px -3px hsl(35 90% 45% / 0.5), inset 0 1px 0 hsl(45 100% 75% / 0.4)",
        }}
        title="বুকমার্ক করা কনসেপ্ট"
      >
        <Star className="w-4 h-4 transition-colors" style={{ color: "hsl(0 0% 100%)", filter: "drop-shadow(0 0 5px hsl(45 100% 70% / 0.6))" }} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "hsl(0 0% 0% / 0.5)" }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden flex flex-col bg-background border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-sm">বুকমার্ক করা কনসেপ্ট</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-500/10 text-yellow-600">
                  {bookmarks.length}
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {loading && <p className="text-sm text-muted-foreground text-center py-8">লোড হচ্ছে...</p>}
              {!loading && bookmarks.length === 0 && (
                <div className="text-center py-8">
                  <Star className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">কোনো বুকমার্ক নেই।</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">কনসেপ্ট আউটপুটে ⭐ বাটনে ক্লিক করুন।</p>
                </div>
              )}
              {bookmarks.map((b) => (
                <div key={b.id} className="rounded-xl border border-border p-3 hover:bg-secondary/30 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleString("bn-BD")}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(b.concept_content, b.id)}
                        className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      >
                        {copiedId === b.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground line-clamp-4 font-mono leading-relaxed">
                    {b.concept_content.substring(0, 300)}{b.concept_content.length > 300 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
