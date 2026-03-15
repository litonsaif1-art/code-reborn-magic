import { memo, useState, useRef, useEffect, useMemo } from "react";
import { Plus, Trash2, Sparkles, Search, Pencil, Check, X, Lock, Pin, PinOff, Copy, ChevronDown, GitBranch } from "lucide-react";
import type { ChatSession } from "@/hooks/useChat";
import type { SessionVariant } from "@/hooks/useSessionVariants";
import { cn } from "@/lib/utils";
import { ProjectBackup } from "./ProjectBackup";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const GRADIENT_PALETTES = [
  { from: "hsl(280 85% 60%)", to: "hsl(320 90% 55%)", glow: "hsl(300 80% 50% / 0.4)" },
  { from: "hsl(200 90% 50%)", to: "hsl(170 85% 45%)", glow: "hsl(185 80% 45% / 0.4)" },
  { from: "hsl(340 85% 55%)", to: "hsl(20 90% 55%)", glow: "hsl(0 80% 50% / 0.4)" },
  { from: "hsl(45 95% 55%)", to: "hsl(25 90% 50%)", glow: "hsl(35 90% 50% / 0.4)" },
  { from: "hsl(150 80% 45%)", to: "hsl(190 85% 50%)", glow: "hsl(170 75% 45% / 0.4)" },
  { from: "hsl(260 80% 65%)", to: "hsl(220 85% 55%)", glow: "hsl(240 75% 55% / 0.4)" },
  { from: "hsl(10 90% 60%)", to: "hsl(45 95% 55%)", glow: "hsl(28 85% 55% / 0.4)" },
  { from: "hsl(170 85% 42%)", to: "hsl(130 75% 48%)", glow: "hsl(150 80% 42% / 0.4)" },
];

function hashPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onRenameSerialLabel?: (id: string, newLabel: string) => void;
  onTogglePin?: (id: string) => void;
  onDuplicateSession?: (id: string) => void;
  isCollapsed: boolean;
  // Variant support
  variantsMap?: Record<string, SessionVariant[]>;
  onCreateVariant?: (sessionId: string) => void;
  onSwitchVariant?: (sessionId: string, variantId: string | null) => void;
  onDeleteVariant?: (sessionId: string, variantId: string) => void;
  onToggleVariantPin?: (sessionId: string, variantId: string) => void;
}

function ChatSidebarComponent({
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onRenameSerialLabel,
  onTogglePin,
  onDuplicateSession,
  isCollapsed,
  variantsMap = {},
  onCreateVariant,
  onSwitchVariant,
  onDeleteVariant,
  onToggleVariantPin,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingSerialId, setEditingSerialId] = useState<string | null>(null);
  const [serialEditValue, setSerialEditValue] = useState("");
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);

  // Auto-expand variants for active session if it has an active variant
  useEffect(() => {
    if (activeSessionId) {
      const variants = variantsMap[activeSessionId] || [];
      if (variants.some(v => v.isActive)) {
        setExpandedVariantId(activeSessionId);
      }
    }
  }, [activeSessionId, variantsMap]);
  const editRef = useRef<HTMLInputElement>(null);
  const serialEditRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (editingSerialId && serialEditRef.current) {
      serialEditRef.current.focus();
      serialEditRef.current.select();
    }
  }, [editingSerialId]);

  const normalizeBnDigits = (str: string) =>
    str.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

  const filteredSessionsBase = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    return sessions.filter((s) => {
      const query = normalizeBnDigits(searchQuery.toLowerCase());
      const title = normalizeBnDigits((s.title || "").toLowerCase());
      const serial = normalizeBnDigits((s.serialLabel || "").toLowerCase());
      return title.includes(query) || serial.includes(query);
    });
  }, [sessions, searchQuery]);

  // Sort: pinned first, then active session, then rest
  const filteredSessions = useMemo(() => {
    const pinned = filteredSessionsBase.filter(s => s.pinned);
    const unpinned = filteredSessionsBase.filter(s => !s.pinned);
    const activeUnpinned = activeSessionId ? unpinned.filter(s => s.id === activeSessionId) : [];
    const restUnpinned = activeSessionId ? unpinned.filter(s => s.id !== activeSessionId) : unpinned;
    return [...pinned, ...activeUnpinned, ...restUnpinned];
  }, [filteredSessionsBase, activeSessionId]);

  if (isCollapsed) return null;

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle || "Untitled");
  };

  const confirmRename = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed && onRenameSession) {
      onRenameSession(id, trimmed);
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -280, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-[280px] h-full flex flex-col overflow-hidden relative"
      style={{
        background: "hsl(var(--sidebar-background) / 0.7)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        borderRight: "1px solid hsl(var(--sidebar-border) / 0.5)",
      }}
    >
      {/* Subtle mesh gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(ellipse at 30% 20%, hsl(var(--glow-primary) / 0.08), transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="p-5 relative z-10">
        <div className="flex items-center gap-2.5 mb-4">
          <motion.div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(135deg, hsl(45 95% 55%), hsl(35 90% 50%), hsl(25 85% 48%))",
              boxShadow: "0 6px 20px -4px hsl(40 90% 45% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
              border: "1.5px solid hsl(40 80% 60% / 0.4)",
            }}
          >
            <Sparkles className="w-4.5 h-4.5 text-white" style={{ filter: "drop-shadow(0 0 4px hsl(0 0% 100% / 0.6))" }} />
          </motion.div>
          <h1 className="text-sm font-black tracking-wider uppercase"
            style={{
              background: "linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 50%), hsl(350 80% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 1px 2px hsl(40 80% 40% / 0.2))",
            }}
          >
            Creative Core
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onNewSession}
          className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm font-extrabold text-white transition-all relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(170 75% 42%), hsl(190 80% 40%), hsl(210 75% 48%))",
            boxShadow: "0 8px 28px -6px hsl(180 70% 35% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2), inset 0 -1px 0 hsl(0 0% 0% / 0.1)",
            border: "1.5px solid hsl(180 60% 50% / 0.3)",
          }}
        >
          <Plus className="w-4 h-4" style={{ filter: "drop-shadow(0 0 3px hsl(0 0% 100% / 0.5))" }} />
          New Session
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </motion.button>
      </div>
      {/* Search */}
      <div className="px-4 pb-2 relative z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            style={{
              background: "hsl(var(--secondary) / 0.5)",
              border: "1px solid hsl(var(--border) / 0.3)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1 space-y-1 relative z-10">
        {filteredSessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-10 px-4 opacity-60">
            {searchQuery ? "No sessions found." : "No sessions yet. Start a new one to begin creating concepts."}
          </p>
        )}
        <TooltipProvider delayDuration={120}>
          <AnimatePresence>
            {filteredSessions.map((session) => {
              const isActive = activeSessionId === session.id;
              const hasBlueprint = session.blueprintApproved && session.blueprintContent;
              const showGradient = isActive;
              const palette = showGradient ? hashPalette(session.serialLabel || session.id) : null;

              return (
                <div key={session.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0, duration: 0.3 }}
                    className={cn(
                      "group relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-300 text-sm overflow-hidden",
                      showGradient ? "text-white" : "",
                      isActive && !showGradient ? "text-primary" : "",
                      !isActive && !showGradient ? "text-muted-foreground hover:text-foreground" : ""
                    )}
                    style={showGradient ? {
                      background: `linear-gradient(135deg, ${palette!.from}, ${palette!.to})`,
                      border: "1.5px solid hsl(0 0% 100% / 0.2)",
                      boxShadow: `0 6px 24px -6px ${palette!.glow}, inset 0 1px 0 hsl(0 0% 100% / 0.2)`,
                    } : isActive ? {
                      background: "hsl(var(--primary) / 0.08)",
                      border: "1px solid hsl(var(--primary) / 0.15)",
                      boxShadow: "0 4px 16px -6px hsl(var(--primary) / 0.2)",
                    } : {
                      border: "1px solid transparent",
                    }}
                    onClick={() => editingId !== session.id && onSelectSession(session.id)}
                  >
                    {/* Shimmer for active session */}
                    {showGradient && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / 0.1) 50%, transparent 60%)" }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                      />
                    )}
                    {hasBlueprint && (
                      <Lock className="w-2.5 h-2.5 shrink-0 text-white/70 absolute top-1.5 right-1.5" />
                    )}
                    {/* Variant count badge */}
                    {(variantsMap[session.id]?.length || 0) > 0 && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-[11px] font-black rounded-full px-2 py-0.5 leading-tight shadow-md"
                        style={{ background: "hsl(var(--foreground) / 0.85)", color: "hsl(var(--background))", border: "1.5px solid hsl(var(--foreground) / 0.6)", boxShadow: "0 2px 8px hsl(var(--foreground) / 0.2)" }}>
                        {variantsMap[session.id]?.length}V
                      </span>
                    )}
                    {/* Pin indicator */}
                    {session.pinned && !showGradient && (
                      <Pin className="w-2.5 h-2.5 shrink-0 absolute top-1.5 left-1.5 text-amber-500 rotate-45" />
                    )}
                    {editingId === session.id ? (
                      <div className="flex-1 flex items-center gap-1 min-w-0">
                        <input
                          ref={editRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmRename(session.id);
                            if (e.key === "Escape") cancelRename();
                          }}
                          className="flex-1 text-xs font-medium bg-background border border-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); confirmRename(session.id); }}
                          className="p-1 text-primary hover:text-primary/80"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Serial label — premium styled, editable on click */}
                        {editingSerialId === session.id ? (
                          <input
                            ref={serialEditRef}
                            value={serialEditValue}
                            onChange={(e) => setSerialEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onRenameSerialLabel?.(session.id, serialEditValue.trim());
                                setEditingSerialId(null);
                              }
                              if (e.key === "Escape") setEditingSerialId(null);
                            }}
                            onBlur={() => {
                              onRenameSerialLabel?.(session.id, serialEditValue.trim());
                              setEditingSerialId(null);
                            }}
                            className="w-9 bg-background border border-primary/30 rounded px-1 py-0.5 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary/50 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="shrink-0 min-w-[22px] h-[22px] flex items-center justify-center rounded-md text-[11px] font-black font-mono cursor-pointer transition-all hover:scale-110"
                            style={showGradient ? {
                              background: "hsl(0 0% 100% / 0.25)",
                              color: "hsl(0 0% 100%)",
                              backdropFilter: "blur(4px)",
                              border: "1px solid hsl(0 0% 100% / 0.3)",
                              textShadow: "0 1px 2px hsl(0 0% 0% / 0.3)",
                              boxShadow: "none",
                            } : {
                              background: "linear-gradient(135deg, hsl(45 95% 55%), hsl(35 88% 48%))",
                              color: "hsl(30 20% 10%)",
                              boxShadow: "0 2px 8px -2px hsl(40 90% 45% / 0.5)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSerialId(session.id);
                              setSerialEditValue(session.serialLabel || "");
                            }}
                            title="Click to edit serial"
                          >
                            {session.serialLabel || "—"}
                          </span>
                        )}
                        {/* Session title + fixedTheme value */}
                        {(() => {
                          const sanitizeThemeValue = (rawValue: string) => {
                            return rawValue
                              .replace(/^সারণী\s*\(ক\)\s*[—–:-]\s*/u, "")
                              .replace(/^১[.।)]\s*/u, "")
                              .replace(/^(সিরিজ-স্থির|fixed\s*theme)\s*[—–:-]\s*/iu, "")
                              .trim();
                          };

                          // Extract row-1 value from সারণী (ক)
                          let label1Value = "";
                          if (session.blueprintApproved && session.blueprintContent) {
                            const content = session.blueprintContent;
                            const kaBlockMatch = content.match(/সারণী\s*\(ক\)([\s\S]*?)(?:\n\s*সারণী\s*\([খগঘ]\)|$)/u);
                            const kaBlock = kaBlockMatch?.[1] ?? "";
                            const firstRow = kaBlock
                              .split("\n")
                              .map((line) => line.trim())
                              .find((line) => /^১[.।)]\s*/u.test(line));

                            if (firstRow) {
                              const rowText = firstRow.replace(/^১[.।)]\s*/u, "").trim();
                              const parts = rowText.split(/[—–-]/).map((part) => part.trim()).filter(Boolean);
                              label1Value = sanitizeThemeValue(parts.length > 1 ? parts[parts.length - 1] : rowText);
                            }
                          }

                          // Fallback: blueprintParams.fixedTheme
                          const ftParam = (session.blueprintParams as any)?.fixedTheme;
                          const fallbackThemeValue =
                            typeof ftParam === "string" && ftParam !== "default" && ftParam.trim() !== ""
                              ? sanitizeThemeValue(ftParam)
                              : "";

                          const themeValue = label1Value || fallbackThemeValue;

                          const displayText = themeValue || session.title || "Untitled";

                          return (
                            <div className="flex-1 min-w-0 pr-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="block truncate text-[14px] font-extrabold tracking-tight leading-snug"
                                    style={showGradient ? { color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(0 0% 0% / 0.3)" } : { color: "hsl(var(--foreground))", fontWeight: 800 }}
                                  >
                                    {displayText}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" sideOffset={6} className="max-w-[360px] break-words text-[11px] leading-relaxed">
                                  {displayText}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })()}
                        {/* Hover action buttons — absolute overlay so they never get clipped */}
                        <div
                          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-10 rounded-lg px-1.5 py-1"
                          style={{
                            background: showGradient
                              ? "hsl(0 0% 0% / 0.45)"
                              : "hsl(var(--background) / 0.92)",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 2px 8px hsl(0 0% 0% / 0.15)",
                            border: showGradient
                              ? "1px solid hsl(0 0% 100% / 0.15)"
                              : "1px solid hsl(var(--border) / 0.5)",
                          }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(session.id, session.title); }}
                            className="p-1 rounded hover:bg-primary/20 text-foreground/70 hover:text-primary transition-colors"
                            style={showGradient ? { color: "hsl(0 0% 100% / 0.8)" } : {}}
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onTogglePin?.(session.id); }}
                            className={cn(
                              "p-1 rounded transition-colors",
                              session.pinned
                                ? "text-amber-500 hover:bg-amber-500/20"
                                : "text-foreground/70 hover:text-amber-500 hover:bg-amber-500/10"
                            )}
                            style={showGradient && !session.pinned ? { color: "hsl(0 0% 100% / 0.8)" } : {}}
                            title={session.pinned ? "Unpin" : "Pin to top"}
                          >
                            {session.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                          </button>
                          {(variantsMap[session.id]?.length || 0) > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedVariantId(prev => prev === session.id ? null : session.id); }}
                              className="p-1 rounded hover:bg-primary/20 text-foreground/70 hover:text-primary transition-colors"
                              style={showGradient ? { color: "hsl(0 0% 100% / 0.8)" } : {}}
                              title="Variants"
                            >
                              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedVariantId === session.id && "rotate-180")} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onCreateVariant?.(session.id); }}
                            className="p-1 rounded hover:bg-primary/20 text-foreground/70 hover:text-primary transition-colors"
                            style={showGradient ? { color: "hsl(0 0% 100% / 0.8)" } : {}}
                            title="Variant তৈরি করুন"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                          {onDuplicateSession && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDuplicateSession(session.id); }}
                              className="p-1 rounded hover:bg-primary/20 text-foreground/70 hover:text-primary transition-colors"
                              style={showGradient ? { color: "hsl(0 0% 100% / 0.8)" } : {}}
                              title="Duplicate Session"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="p-1 rounded hover:bg-destructive/20 text-foreground/70 hover:text-destructive transition-colors"
                            style={showGradient ? { color: "hsl(0 80% 70% / 0.9)" } : {}}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>

                  {/* Variant dropdown list */}
                  <AnimatePresence>
                    {expandedVariantId === session.id && (variantsMap[session.id]?.length || 0) > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-6 mb-1"
                      >
                        {/* Main session option */}
                        <button
                          onClick={() => onSwitchVariant?.(session.id, null)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all mb-0.5",
                            !variantsMap[session.id]?.some(v => v.isActive)
                              ? "bg-primary/15 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black"
                            style={{ background: "hsl(var(--primary) / 0.15)" }}>
                            M
                          </span>
                          মূল সেশন
                        </button>

                        {/* Variant items */}
                        {variantsMap[session.id]?.map(variant => (
                          <div
                            key={variant.id}
                            className={cn(
                              "group/variant flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all mb-0.5 cursor-pointer",
                              variant.isActive
                                ? "bg-accent/20 text-accent-foreground border border-accent/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                            onClick={() => onSwitchVariant?.(session.id, variant.id)}
                          >
                            <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black"
                              style={{ background: variant.isActive ? "hsl(var(--accent) / 0.2)" : "hsl(var(--muted) / 0.5)" }}>
                              {variant.variantLabel}
                            </span>
                            <span className="flex-1 truncate">
                              {session.serialLabel || "—"}{variant.variantLabel}
                            </span>
                            {variant.pinned && <Pin className="w-2.5 h-2.5 text-amber-500 rotate-45" />}
                            {/* Variant actions */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/variant:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); onToggleVariantPin?.(session.id, variant.id); }}
                                className="p-0.5 hover:text-amber-500 transition-colors"
                              >
                                {variant.pinned ? <PinOff className="w-2.5 h-2.5" /> : <Pin className="w-2.5 h-2.5" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onCreateVariant?.(variant.id); }}
                                className="p-0.5 hover:text-primary transition-colors"
                                title="এই variant থেকে নতুন variant"
                              >
                                <GitBranch className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteVariant?.(session.id, variant.id); }}
                                className="p-0.5 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </AnimatePresence>
        </TooltipProvider>
      </div>

      {/* Backup/Restore */}
      <div className="px-4 py-3 relative z-10" style={{ borderTop: "1px solid hsl(var(--border) / 0.3)" }}>
        <ProjectBackup />
      </div>

      {/* Footer — Loser neon brand */}
      <div className="px-2 py-3 relative z-10" style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}>
        <div className="loser-neon-container w-full flex items-center justify-center select-none">
          <span className="loser-neon-text text-base font-black tracking-[0.35em] uppercase w-full text-center">
            Loser
          </span>
        </div>
      </div>
    </motion.aside>
  );
}

export const ChatSidebar = memo(ChatSidebarComponent);
