import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { PipelineIndicator } from "./PipelineIndicator";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="glass-subtle border-t border-border/30">
      {/* Pipeline Indicator */}
      <div className="px-5 pt-3 pb-1">
        <PipelineIndicator inputValue={input} />
      </div>

      <div className="flex items-end gap-3 p-4 px-5">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter theme or describe a scene..."
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full resize-none rounded-2xl border border-border bg-card px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 scrollbar-thin disabled:opacity-50 transition-all shadow-sm"
            style={{ minHeight: "48px", maxHeight: "160px" }}
          />
        </div>

        {/* Send / Stop */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="p-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all shrink-0 hover-glow"
            title="Stop generating"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 shadow-md shadow-primary/20 hover-glow"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
