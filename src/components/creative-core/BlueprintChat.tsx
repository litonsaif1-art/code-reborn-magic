import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BlueprintChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface BlueprintChatProps {
  messages: BlueprintChatMsg[];
  onSend: (message: string) => void;
  isStreaming: boolean;
  isLocked: boolean;
}

export function BlueprintChat({
  messages,
  onSend,
  isStreaming,
  isLocked,
}: BlueprintChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLocked) return null;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/20">
        <MessageSquare className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          ব্লুপ্রিন্ট চ্যাট
        </span>
        {isStreaming && (
          <span className="w-1.5 h-1.5 bg-primary rounded-full agent-pulse ml-auto" />
        )}
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-32 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "text-xs leading-relaxed",
                msg.role === "user"
                  ? "text-foreground"
                  : "text-primary"
              )}
            >
              <span className="font-semibold text-[10px] uppercase tracking-wider mr-1.5">
                {msg.role === "user" ? "আপনি:" : "AI:"}
              </span>
              {msg.content}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 p-2.5 border-t border-border/30">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            messages.length === 0
              ? "থিম, ধারণা, বা ব্লুপ্রিন্ট নির্দেশনা লিখুন..."
              : "পরিবর্তন বা নতুন নির্দেশনা দিন..."
          }
          disabled={isStreaming}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
