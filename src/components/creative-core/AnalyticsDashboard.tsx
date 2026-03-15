import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Brain, Film, Sparkles, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAnalytics, AnalyticsData, ScoreTrend } from "@/hooks/useAnalytics";

interface AnalyticsDashboardProps {
  open: boolean;
  onClose: () => void;
}

const chartConfig: ChartConfig = {
  creativity: {
    label: "সৃজনশীলতা",
    color: "hsl(var(--primary))",
  },
  coherence: {
    label: "সামঞ্জস্য",
    color: "hsl(var(--accent))",
  },
  virality: {
    label: "ভাইরালিটি",
    color: "hsl(280 100% 60%)",
  },
};

export function AnalyticsDashboard({ open, onClose }: AnalyticsDashboardProps) {
  const { data, isLoading, error, fetchAnalytics } = useAnalytics();
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (open) {
      fetchAnalytics(days);
    }
  }, [open, days, fetchAnalytics]);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>📊 অ্যানালিটিক্স ড্যাশবোর্ড</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">সময়কাল:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value={7}>৭ দিন</option>
              <option value={14}>১৪ দিন</option>
              <option value={30}>৩০ দিন</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(days)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            রিফ্রেশ
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>ত্রুটি: {error}</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  icon={<Sparkles className="w-5 h-5" />}
                  label="মোট কনসেপ্ট"
                  value={data.summary.totalConcepts}
                  color="primary"
                />
                <SummaryCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Evolution Chains"
                  value={data.summary.totalEvolutions}
                  color="accent"
                />
                <SummaryCard
                  icon={<Brain className="w-5 h-5" />}
                  label="AI Memories"
                  value={data.summary.totalMemories}
                  color="purple"
                />
                <SummaryCard
                  icon={<Film className="w-5 h-5" />}
                  label="স্টোরিবোর্ড ফ্রেম"
                  value={data.summary.storyboards.total}
                  color="orange"
                />
              </div>

              {/* Average Scores */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  গড় স্কোর
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <ScoreBar label="সৃজনশীলতা 🎨" value={data.summary.avgScores.creativity} color="bg-primary" />
                  <ScoreBar label="সামঞ্জস্য 🔗" value={data.summary.avgScores.coherence} color="bg-accent" />
                  <ScoreBar label="ভাইরালিটি 🔥" value={data.summary.avgScores.virality} color="bg-purple-500" />
                  <ScoreBar label="সামগ্রিক ⭐" value={data.summary.avgScores.overall} color="bg-yellow-500" />
                </div>
              </div>

              {/* Score Trends Chart */}
              {data.trends.scores.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    স্কোর ট্রেন্ড
                  </h3>
                  <div className="h-64">
                    <ChartContainer config={chartConfig}>
                      <LineChart data={data.trends.scores}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString("bn-BD", { month: "short", day: "numeric" })}
                          className="text-xs"
                        />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="creativity"
                          stroke="var(--color-creativity)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="coherence"
                          stroke="var(--color-coherence)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="virality"
                          stroke="var(--color-virality)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">সৃজনশীলতা</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-xs text-muted-foreground">সামঞ্জস্য</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-xs text-muted-foreground">ভাইরালিটি</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Storyboard Stats */}
              {data.summary.storyboards.total > 0 && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    স্টোরিবোর্ড স্ট্যাটাস
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-500">
                        {data.summary.storyboards.completed}
                      </div>
                      <div className="text-xs text-muted-foreground">সম্পন্ন</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-yellow-500">
                        {data.summary.storyboards.generating}
                      </div>
                      <div className="text-xs text-muted-foreground">চলমান</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-red-500">
                        {data.summary.storyboards.failed}
                      </div>
                      <div className="text-xs text-muted-foreground">ব্যর্থ</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>কোনো ডাটা পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "accent" | "purple" | "orange";
}) {
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 text-primary",
    accent: "from-accent/20 to-accent/5 text-accent",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-500",
    orange: "from-orange-500/20 to-orange-500/5 text-orange-500",
  };

  return (
    <div className={cn(
      "rounded-xl p-4 bg-gradient-to-br border border-border/30",
      colorClasses[color]
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
