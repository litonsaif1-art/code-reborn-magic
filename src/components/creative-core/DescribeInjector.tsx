import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface DescribeInjectorProps {
  onInject: (text: string) => void;
  isStreaming: boolean;
  blueprintApproved: boolean;
}

export function DescribeInjector({ onInject, isStreaming, blueprintApproved }: DescribeInjectorProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onInject(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 px-5 pt-3 pb-2">
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{
            background: "linear-gradient(135deg, hsl(260 60% 55% / 0.12), hsl(300 50% 55% / 0.08))",
            border: "1px solid hsl(260 50% 70% / 0.2)",
          }}
        >
          <Sparkles className="w-3 h-3" style={{ color: "hsl(260 70% 58%)" }} />
          <span
            className="text-[9px] font-extrabold uppercase tracking-widest"
            style={{ color: "hsl(260 55% 50%)" }}
          >
            Add Changes or Instructions
          </span>
        </div>
        {isStreaming && (
          <span className="w-2 h-2 rounded-full agent-pulse" style={{ background: "hsl(250 80% 60%)" }} />
        )}
      </div>

      {/* Input container */}
      <div
        className="relative flex items-start gap-2.5 rounded-2xl px-4 py-3 transition-all duration-300"
        style={{
          background: isFocused
            ? "linear-gradient(145deg, hsl(260 40% 98%), hsl(280 35% 96%), hsl(300 30% 98%))"
            : "linear-gradient(145deg, hsl(260 25% 97%), hsl(270 20% 96%))",
          border: isFocused
            ? "2px solid hsl(260 60% 72% / 0.6)"
            : "1.5px solid hsl(260 25% 88% / 0.5)",
          boxShadow: isFocused
            ? "0 8px 32px -8px hsl(260 60% 45% / 0.15), 0 2px 8px -2px hsl(280 50% 40% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.7)"
            : "0 2px 8px -3px hsl(260 30% 40% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
        }}
      >
        {/* Subtle shimmer line at top */}
        <div
          className="absolute top-0 left-4 right-4 h-[1px] rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(260 60% 70% / 0.3), hsl(300 50% 65% / 0.2), transparent)",
          }}
        />

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            blueprintApproved
              ? "Describe what you want to change — AI will update..."
              : "Enter a theme, concept, or blueprint instruction..."
          }
          disabled={isStreaming}
          rows={2}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-40 resize-none scrollbar-thin"
          style={{ lineHeight: "1.6" }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="flex items-center justify-center w-10 h-10 rounded-xl disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0 mt-0.5 hover:scale-105 active:scale-95"
          style={{
            background: input.trim()
              ? "linear-gradient(135deg, hsl(260 80% 58%), hsl(290 70% 52%), hsl(320 65% 55%))"
              : "linear-gradient(135deg, hsl(260 40% 72%), hsl(280 35% 68%))",
            color: "hsl(0 0% 100%)",
            boxShadow: input.trim()
              ? "0 6px 20px -4px hsl(270 70% 45% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)"
              : "0 2px 8px -3px hsl(260 40% 50% / 0.15)",
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
