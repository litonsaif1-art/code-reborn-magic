import { useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Copy, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Scene {
  scene_number: number;
  time_code: string;
  duration_seconds: number;
  visual_direction: string;
  voiceover_text: string;
  on_screen_text?: string | null;
  sound_design: string;
  transition: string;
}

interface VideoScript {
  title: string;
  hook: string;
  total_duration: string;
  scenes: Scene[];
  music_notes: string;
  target_platform: string;
  production_notes: string;
  raw_text?: string;
  parse_error?: boolean;
}

type NarrationStyle = "documentary" | "dramatic" | "casual";
type Platform = "youtube_shorts" | "instagram_reels" | "tiktok";
type MusicIntensity = "low" | "medium" | "high";

interface SoundLayers {
  primary: boolean;
  ambient: boolean;
  sfx: boolean;
  texture: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  conceptContent: string;
  audience?: string;
}

const NARRATION_STYLES: { value: NarrationStyle; label: string; desc: string }[] = [
  { value: "documentary", label: "🎬 Documentary", desc: "শান্ত, তথ্যমূলক বর্ণনা" },
  { value: "dramatic", label: "🎭 Dramatic", desc: "আবেগপূর্ণ, সিনেমাটিক টোন" },
  { value: "casual", label: "💬 Casual", desc: "বন্ধুত্বপূর্ণ, কথোপকথন স্টাইল" },
];

const PLATFORMS: { value: Platform; label: string; desc: string; duration: string }[] = [
  { value: "youtube_shorts", label: "📺 YouTube Shorts", desc: "≤60s, 9:16, CTA-heavy", duration: "15-60s" },
  { value: "instagram_reels", label: "📸 Instagram Reels", desc: "≤90s, 9:16, aesthetic", duration: "15-30s" },
  { value: "tiktok", label: "🎵 TikTok", desc: "≤60s, 9:16, trend-driven", duration: "15-30s" },
];

const MUSIC_INTENSITIES: { value: MusicIntensity; label: string; desc: string }[] = [
  { value: "low", label: "🔈 Low", desc: "হালকা ব্যাকগ্রাউন্ড" },
  { value: "medium", label: "🔉 Medium", desc: "ব্যালেন্সড মিউজিক" },
  { value: "high", label: "🔊 High", desc: "প্রভাবশালী মিউজিক" },
];

const SOUND_LAYER_OPTIONS: { key: keyof SoundLayers; label: string; emoji: string; desc: string }[] = [
  { key: "primary", label: "Primary", emoji: "🎯", desc: "মূল অ্যাকশন সাউন্ড" },
  { key: "ambient", label: "Ambient", emoji: "🌿", desc: "পরিবেশের ব্যাকগ্রাউন্ড" },
  { key: "sfx", label: "SFX", emoji: "💥", desc: "অ্যাকসেন্ট ইফেক্ট" },
  { key: "texture", label: "Texture", emoji: "🎭", desc: "মুড/ইমোশনাল লেয়ার" },
];

export function VideoScriptDialog({ open, onClose, conceptContent, audience }: Props) {
  const [script, setScript] = useState<VideoScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio controls
  const [narratorEnabled, setNarratorEnabled] = useState(false);
  const [sceneSoundEnabled, setSceneSoundEnabled] = useState(true);
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>("documentary");
  const [platform, setPlatform] = useState<Platform>("youtube_shorts");
  const [musicIntensity, setMusicIntensity] = useState<MusicIntensity>("medium");
  const [soundLayers, setSoundLayers] = useState<SoundLayers>({
    primary: true,
    ambient: true,
    sfx: true,
    texture: true,
  });

  const handleNarratorToggle = (checked: boolean) => {
    setNarratorEnabled(checked);
    if (!checked && !sceneSoundEnabled) {
      setSceneSoundEnabled(true);
      toast({ title: "🔊 Scene Sound auto-enabled", description: "সম্পূর্ণ শব্দহীন স্ক্রিপ্ট তৈরি করা যায় না" });
    }
  };

  const handleSceneSoundToggle = (checked: boolean) => {
    setSceneSoundEnabled(checked);
    if (!checked && !narratorEnabled) {
      setSceneSoundEnabled(true);
      toast({ title: "🔊 Scene Sound auto-enabled", description: "সম্পূর্ণ শব্দহীন স্ক্রিপ্ট তৈরি করা যায় না" });
    }
  };

  const toggleSoundLayer = (key: keyof SoundLayers) => {
    setSoundLayers((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // At least one layer must be ON when scene sound is enabled
      const anyOn = Object.values(updated).some(Boolean);
      if (!anyOn) {
        toast({ title: "⚠️ কমপক্ষে একটি লেয়ার ON থাকতে হবে" });
        return prev;
      }
      return updated;
    });
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("concept-to-script", {
        body: {
          concept: conceptContent,
          audience: audience || "general",
          narratorEnabled,
          sceneSoundEnabled,
          narrationStyle,
          platform,
          musicIntensity,
          soundLayers,
        },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error(data?.error || "Failed");
      setScript(data.script);
    } catch (e: any) {
      setError(e?.message || "Script generation failed");
      toast({ title: "❌ Script Error", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyScript = () => {
    if (!script) return;
    const text = script.raw_text || formatScriptText(script);
    navigator.clipboard.writeText(text);
    toast({ title: "📋 Copied!", description: "Script copied to clipboard" });
  };

  const downloadScript = () => {
    if (!script) return;
    const text = script.raw_text || formatScriptText(script);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-script-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "✅ Downloaded!" });
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 24px 48px -12px hsl(0 0% 0% / 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">🎬 Video Script</h3>
          </div>
          <div className="flex items-center gap-2">
            {script && (
              <>
                <button onClick={copyScript} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Copy">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={downloadScript} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Download">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!script && !loading && (
            <div className="space-y-5">
              {/* Audio Controls */}
              <div className="rounded-xl border border-border/40 p-4 space-y-4" style={{ background: "hsl(var(--muted) / 0.2)" }}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🎛️ Audio Settings</p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-sm font-semibold text-foreground">🎤 Narrator (Voiceover)</Label>
                    <span className="text-[11px] text-muted-foreground">বাইরের কণ্ঠে বর্ণনা</span>
                  </div>
                  <Switch checked={narratorEnabled} onCheckedChange={handleNarratorToggle} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-sm font-semibold text-foreground">🔊 Scene Sound</Label>
                    <span className="text-[11px] text-muted-foreground">ভিডিওর নিজস্ব শব্দ (ambient, SFX)</span>
                  </div>
                  <Switch checked={sceneSoundEnabled} onCheckedChange={handleSceneSoundToggle} />
                </div>

                {/* Narration Style - only when narrator is ON */}
                {narratorEnabled && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🎙️ Narration Style</p>
                    <div className="grid grid-cols-3 gap-2">
                      {NARRATION_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setNarrationStyle(style.value)}
                          className="p-2.5 rounded-xl text-center transition-all border"
                          style={{
                            background: narrationStyle === style.value
                              ? "hsl(var(--primary) / 0.12)"
                              : "hsl(var(--muted) / 0.3)",
                            borderColor: narrationStyle === style.value
                              ? "hsl(var(--primary) / 0.4)"
                              : "hsl(var(--border) / 0.3)",
                          }}
                        >
                          <span className="text-xs font-bold text-foreground block">{style.label}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">{style.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sound Layer Toggles - only when scene sound is ON */}
                {sceneSoundEnabled && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🎚️ Sound Layers (ON/OFF)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SOUND_LAYER_OPTIONS.map((layer) => (
                        <div
                          key={layer.key}
                          className="flex items-center justify-between p-2.5 rounded-xl border transition-all"
                          style={{
                            background: soundLayers[layer.key]
                              ? "hsl(var(--primary) / 0.08)"
                              : "hsl(var(--muted) / 0.2)",
                            borderColor: soundLayers[layer.key]
                              ? "hsl(var(--primary) / 0.3)"
                              : "hsl(var(--border) / 0.2)",
                          }}
                        >
                          <div className="flex flex-col gap-0">
                            <span className="text-xs font-bold text-foreground">{layer.emoji} {layer.label}</span>
                            <span className="text-[10px] text-muted-foreground">{layer.desc}</span>
                          </div>
                          <Switch
                            checked={soundLayers[layer.key]}
                            onCheckedChange={() => toggleSoundLayer(layer.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Music Intensity */}
              <div className="rounded-xl border border-border/40 p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.2)" }}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🎵 Music Intensity</p>
                <div className="grid grid-cols-3 gap-2">
                  {MUSIC_INTENSITIES.map((mi) => (
                    <button
                      key={mi.value}
                      onClick={() => setMusicIntensity(mi.value)}
                      className="p-2.5 rounded-xl text-center transition-all border"
                      style={{
                        background: musicIntensity === mi.value
                          ? "hsl(var(--primary) / 0.12)"
                          : "hsl(var(--muted) / 0.3)",
                        borderColor: musicIntensity === mi.value
                          ? "hsl(var(--primary) / 0.4)"
                          : "hsl(var(--border) / 0.3)",
                      }}
                    >
                      <span className="text-xs font-bold text-foreground block">{mi.label}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{mi.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selector */}
              <div className="rounded-xl border border-border/40 p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.2)" }}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">📱 Target Platform</p>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className="p-2.5 rounded-xl text-center transition-all border"
                      style={{
                        background: platform === p.value
                          ? "hsl(var(--primary) / 0.12)"
                          : "hsl(var(--muted) / 0.3)",
                        borderColor: platform === p.value
                          ? "hsl(var(--primary) / 0.4)"
                          : "hsl(var(--border) / 0.3)",
                      }}
                    >
                      <span className="text-xs font-bold text-foreground block">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{p.desc}</span>
                      <span className="text-[9px] text-primary/70 block mt-0.5">{p.duration}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  এই concept থেকে production-ready video script তৈরি করবে — hook, scene breakdown, voiceover, timing সহ।
                </p>
                <button
                  onClick={generate}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, hsl(280 70% 55%), hsl(320 65% 55%))",
                    boxShadow: "0 8px 24px -6px hsl(280 70% 50% / 0.4)",
                  }}
                >
                  🎬 Generate Video Script
                </button>
                {error && <p className="text-xs text-destructive mt-3">{error}</p>}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Script generating...</p>
            </div>
          )}

          {script && !script.parse_error && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-black text-foreground">{script.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">Duration: {script.total_duration} • Platform: {script.target_platform}</p>
              </div>

              <div className="p-3 rounded-xl" style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">🎣 HOOK (0-3s)</p>
                <p className="text-sm font-semibold text-foreground">{script.hook}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">📋 Scenes</p>
                {script.scenes?.map((scene) => (
                  <div key={scene.scene_number} className="p-3 rounded-xl border border-border/30" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-primary">Scene {scene.scene_number}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{scene.time_code} ({scene.duration_seconds}s)</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <p><span className="font-bold text-muted-foreground">🎥 Visual:</span> <span className="text-foreground">{scene.visual_direction}</span></p>
                      <p><span className="font-bold text-muted-foreground">🎤 VO:</span> <span className="text-foreground">{scene.voiceover_text}</span></p>
                      {scene.on_screen_text && <p><span className="font-bold text-muted-foreground">📝 Text:</span> <span className="text-foreground">{scene.on_screen_text}</span></p>}
                      <p><span className="font-bold text-muted-foreground">🔊 Sound:</span> <span className="text-foreground">{scene.sound_design}</span></p>
                      <p><span className="font-bold text-muted-foreground">↪ Transition:</span> <span className="text-foreground">{scene.transition}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              {script.music_notes && (
                <div className="text-xs"><span className="font-bold text-muted-foreground">🎵 Music:</span> <span className="text-foreground">{script.music_notes}</span></div>
              )}
              {script.production_notes && (
                <div className="text-xs"><span className="font-bold text-muted-foreground">📌 Notes:</span> <span className="text-foreground">{script.production_notes}</span></div>
              )}
            </div>
          )}

          {script?.parse_error && script?.raw_text && (
            <pre className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-xl">{script.raw_text}</pre>
          )}
        </div>
      </div>
    </div>
  , document.body);
}

function formatScriptText(script: VideoScript): string {
  let text = `📹 VIDEO SCRIPT: ${script.title}\n`;
  text += `Duration: ${script.total_duration} | Platform: ${script.target_platform}\n\n`;
  text += `🎣 HOOK: ${script.hook}\n\n`;
  text += `--- SCENES ---\n\n`;
  for (const s of script.scenes || []) {
    text += `[Scene ${s.scene_number}] ${s.time_code} (${s.duration_seconds}s)\n`;
    text += `Visual: ${s.visual_direction}\n`;
    text += `Voiceover: ${s.voiceover_text}\n`;
    if (s.on_screen_text) text += `On-Screen: ${s.on_screen_text}\n`;
    text += `Sound: ${s.sound_design}\n`;
    text += `Transition: ${s.transition}\n\n`;
  }
  if (script.music_notes) text += `🎵 Music: ${script.music_notes}\n`;
  if (script.production_notes) text += `📌 Notes: ${script.production_notes}\n`;
  return text;
}
