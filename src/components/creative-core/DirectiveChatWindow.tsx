import { useState, useRef, useEffect } from "react";
import { Send, X, BookmarkPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DirectiveEntry {
  id: string;
  text: string;
  timestamp: number;
}

interface DirectiveChatWindowProps {
  open: boolean;
  onClose: () => void;
  onAddDirective: (text: string) => void;
  isStreaming: boolean;
  blueprintContent: string;
}

export function DirectiveChatWindow({
  open,
  onClose,
  onAddDirective,
  isStreaming,
  blueprintContent,
}: DirectiveChatWindowProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<DirectiveEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setHistory((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: trimmed, timestamp: Date.now() },
    ]);
    onAddDirective(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Count existing directives from blueprint
  const directiveCount = (blueprintContent.match(/বিশেষ নির্দেশনা/g) || []).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-20 right-6 z-50 w-80 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(165deg, hsl(35 50% 98%), hsl(30 40% 96%), hsl(25 35% 97%))",
            border: "2px solid hsl(35 60% 78% / 0.6)",
            boxShadow:
              "0 20px 60px -15px hsl(35 60% 30% / 0.25), 0 8px 20px -8px hsl(35 50% 40% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              background: "linear-gradient(135deg, hsl(35 70% 52%), hsl(25 75% 48%))",
            }}
          >
            <div className="flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Add Directive
              </span>
              {directiveCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "hsl(0 0% 100% / 0.25)",
                    color: "hsl(0 0% 100%)",
                  }}
                >
                  {directiveCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="max-h-36 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1.5">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs leading-relaxed px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: "hsl(35 50% 92% / 0.7)",
                    border: "1px solid hsl(35 40% 85% / 0.5)",
                  }}
                >
                  <span
                    className="font-bold text-[10px] uppercase tracking-wider mr-1.5"
                    style={{ color: "hsl(35 70% 45%)" }}
                  >
                    ✓ Added:
                  </span>
                  <span className="text-foreground">{entry.text}</span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}

          {/* Input */}
          <div className="p-3" style={{ borderTop: "1px solid hsl(35 40% 88% / 0.5)" }}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "hsl(0 0% 100% / 0.8)",
                border: "1.5px solid hsl(35 50% 82% / 0.6)",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type directive to add..."
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-40"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 hover:scale-105 active:scale-95"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, hsl(35 85% 50%), hsl(25 80% 48%))"
                    : "hsl(35 30% 75%)",
                  color: "hsl(0 0% 100%)",
                  boxShadow: input.trim()
                    ? "0 4px 12px -3px hsl(35 80% 40% / 0.4)"
                    : "none",
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p
              className="text-[10px] mt-1.5 px-1"
              style={{ color: "hsl(35 40% 55%)" }}
            >
              Adds to Special Directives section in blueprint
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
