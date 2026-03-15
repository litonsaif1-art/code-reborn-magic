import { useState, useEffect } from "react";
import { Film, Image, Loader2, RefreshCw, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStoryboard, StoryboardFrame } from "@/hooks/useStoryboard";

interface StoryboardPanelProps {
  conceptText: string;
  conceptId: string;
  sessionId: string;
  onClose: () => void;
}

export function StoryboardPanel({
  conceptText,
  conceptId,
  sessionId,
  onClose,
}: StoryboardPanelProps) {
  const { frames, isGenerating, generateStoryboard, fetchFrames } = useStoryboard(sessionId);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState(4);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Initial fetch or generate
  useEffect(() => {
    if (conceptId) {
      fetchFrames(conceptId).then((existingFrames) => {
        if (!existingFrames || existingFrames.length === 0) {
          // No existing frames, show generation options
        }
      });
    }
  }, [conceptId, fetchFrames]);

  // Poll for updates when frames are generating
  useEffect(() => {
    const hasGenerating = frames.some(f => f.status === "generating" || f.status === "pending");
    
    if (hasGenerating && !pollInterval) {
      const interval = setInterval(() => {
        fetchFrames(conceptId);
      }, 3000);
      setPollInterval(interval);
    } else if (!hasGenerating && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [frames, conceptId, fetchFrames, pollInterval]);

  const handleGenerate = async () => {
    await generateStoryboard(conceptText, conceptId, frameCount);
  };

  const completedFrames = frames.filter(f => f.status === "completed");
  const generatingFrames = frames.filter(f => f.status === "generating" || f.status === "pending");

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <span>🎬 স্টোরিবোর্ড জেনারেটর</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Generation Options */}
          {frames.length === 0 && !isGenerating && (
            <div className="bg-muted/30 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto">
                <Film className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">স্টোরিবোর্ড তৈরি করুন</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  এই কনসেপ্ট থেকে ভিজ্যুয়াল স্টোরিবোর্ড ফ্রেম তৈরি করুন
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <label className="text-sm text-muted-foreground">ফ্রেম সংখ্যা:</label>
                <select
                  value={frameCount}
                  onChange={(e) => setFrameCount(Number(e.target.value))}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  {[3, 4, 5, 6, 8].map(n => (
                    <option key={n} value={n}>{n}টি ফ্রেম</option>
                  ))}
                </select>
              </div>

              <Button onClick={handleGenerate} className="gap-2">
                <Image className="w-4 h-4" />
                স্টোরিবোর্ড তৈরি করুন
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                স্টোরিবোর্ড ফ্রেম তৈরি হচ্ছে...
              </p>
            </div>
          )}

          {/* Frames Grid */}
          {frames.length > 0 && (
            <div className="space-y-4">
              {/* Progress */}
              {generatingFrames.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{completedFrames.length}/{frames.length} ফ্রেম সম্পন্ন</span>
                </div>
              )}

              {/* Frames */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {frames.map((frame) => (
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    onClick={() => frame.status === "completed" && setSelectedFrame(frame.frameNumber)}
                  />
                ))}
              </div>

              {/* Regenerate Button */}
              {completedFrames.length === frames.length && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleGenerate} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    পুনরায় তৈরি করুন
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Frame Preview Modal */}
        {selectedFrame !== null && (
          <FramePreview
            frames={completedFrames}
            currentIndex={completedFrames.findIndex(f => f.frameNumber === selectedFrame)}
            onClose={() => setSelectedFrame(null)}
            onNavigate={(idx) => setSelectedFrame(completedFrames[idx]?.frameNumber ?? null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FrameCard({ frame, onClick }: { frame: StoryboardFrame; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative aspect-video rounded-xl overflow-hidden border border-border/50 transition-all",
        frame.status === "completed" && "cursor-pointer hover:ring-2 hover:ring-primary/50",
        frame.status === "generating" && "animate-pulse",
        frame.status === "failed" && "opacity-50"
      )}
    >
      {/* Frame Number Badge */}
      <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold">
        #{frame.frameNumber}
      </div>

      {/* Content */}
      {frame.status === "completed" && frame.imageUrl ? (
        <>
          <img
            src={frame.imageUrl}
            alt={`Frame ${frame.frameNumber}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </>
      ) : frame.status === "generating" || frame.status === "pending" ? (
        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
          <X className="w-6 h-6 text-destructive" />
        </div>
      )}

      {/* Scene Description */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
        <p className="text-[10px] text-foreground line-clamp-2">
          {frame.sceneDescription}
        </p>
      </div>
    </div>
  );
}

function FramePreview({
  frames,
  currentIndex,
  onClose,
  onNavigate,
}: {
  frames: StoryboardFrame[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) {
  const frame = frames[currentIndex];
  if (!frame) return null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>ফ্রেম #{frame.frameNumber}</span>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {frames.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {frame.imageUrl && (
            <img
              src={frame.imageUrl}
              alt={`Frame ${frame.frameNumber}`}
              className="w-full rounded-lg"
            />
          )}

          {/* Navigation */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="bg-background/50 backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(Math.min(frames.length - 1, currentIndex + 1))}
              disabled={currentIndex === frames.length - 1}
              className="bg-background/50 backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-sm">{frame.sceneDescription}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
