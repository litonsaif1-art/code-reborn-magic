import { memo, useState, useEffect } from "react";
import { Brain, Trash2, Sliders, RefreshCw, X, Search, Star, Heart, Palette, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIMemory, type MemoryItem, type MemoryStats } from "@/hooks/useAIMemory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoryBadge } from "./MemoryBadge";

const MEMORY_TYPE_LABELS = {
  preference: { label: "Preference", icon: Heart, color: "text-pink-500" },
  pattern: { label: "Pattern", icon: Repeat, color: "text-blue-500" },
  feedback: { label: "Feedback", icon: Star, color: "text-yellow-500" },
  style: { label: "Style", icon: Palette, color: "text-purple-500" },
} as const;

function MemoryPanelComponent() {
  const {
    memories,
    stats,
    isLoading,
    fetchMemories,
    fetchStats,
    updateWeight,
    deleteMemory,
  } = useAIMemory();

  const [isOpen, setIsOpen] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [editingWeight, setEditingWeight] = useState<string | null>(null);

  // প্যানেল খুললে মেমোরি লোড করো
  useEffect(() => {
    if (isOpen) {
      fetchMemories({
        memory_type: filterType === "all" ? undefined : filterType,
        key: searchKey || undefined,
      });
    }
  }, [isOpen, filterType, searchKey, fetchMemories]);

  const handleWeightChange = async (id: string, newWeight: number) => {
    await updateWeight(id, newWeight);
    setEditingWeight(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this memory?")) {
      await deleteMemory(id);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (filterType !== "all" && m.memory_type !== filterType) return false;
    if (searchKey && !m.key.toLowerCase().includes(searchKey.toLowerCase())) return false;
    return true;
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div>
          <MemoryBadge stats={stats} isActive={isOpen} />
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="px-4 py-3 border-b border-border/50 glass-subtle">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-primary" />
              <span>AI Memory</span>
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                fetchMemories();
                fetchStats();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </SheetHeader>

        {/* Stats Summary */}
        {stats && stats.total > 0 && (
          <div className="px-4 py-3 border-b border-border/30 bg-muted/30">
            <div className="grid grid-cols-4 gap-2 text-center">
              {(Object.keys(MEMORY_TYPE_LABELS) as Array<keyof typeof MEMORY_TYPE_LABELS>).map((type) => {
                const config = MEMORY_TYPE_LABELS[type];
                const Icon = config.icon;
                return (
                  <div key={type} className="flex flex-col items-center gap-1">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-lg font-bold">{stats.byType[type]}</span>
                    <span className="text-[10px] text-muted-foreground">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-4 py-3 border-b border-border/30 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search keyword..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="preference">Preference</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="style">Style</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Memory List */}
        <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {memories.length === 0 
                    ? "No memories yet. Use 👍/👎 on concepts to create memories."
                    : "No memories found."
                  }
                </p>
              </div>
            ) : (
              filteredMemories.map((memory) => {
                const config = MEMORY_TYPE_LABELS[memory.memory_type];
                const Icon = config.icon;
                const isEditing = editingWeight === memory.id;

                return (
                  <div
                    key={memory.id}
                    className="glass-card rounded-xl p-3 space-y-2 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          "bg-gradient-to-br from-primary/20 to-accent/20"
                        )}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{memory.key}</p>
                          <span className={cn("text-[10px] font-medium", config.color)}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(memory.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Value */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {memory.value}
                    </p>

                    {/* Weight */}
                    <div className="flex items-center gap-2 pt-1">
                      <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Weight:</span>
                      
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Slider
                            value={[memory.weight]}
                            onValueChange={([v]) => {
                              // লোকাল আপডেট
                            }}
                            onValueCommit={([v]) => handleWeightChange(memory.id, v)}
                            min={0}
                            max={1}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-xs font-mono w-8">
                            {memory.weight.toFixed(1)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingWeight(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingWeight(memory.id)}
                          className="flex items-center gap-1 text-xs font-mono hover:text-primary transition-colors"
                        >
                          <div 
                            className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"
                          >
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${memory.weight * 100}%` }}
                            />
                          </div>
                          <span>{memory.weight.toFixed(1)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export const MemoryPanel = memo(MemoryPanelComponent);
