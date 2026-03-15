import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Lock, Save, X, Copy, Check, Plus, RefreshCw, RotateCcw, Star, FileText, Undo2, Redo2, ClipboardPaste, History, ChevronDown, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { BlueprintTemplates, type TemplateNote } from "./BlueprintTemplates";
import { BlueprintTableRenderer, type ExtraParamRow } from "./BlueprintTableRenderer";
import { type BlueprintParams, DEFAULT_PARAMS } from "./BlueprintParamsOverride";
import { SECTION_PARAMS, PARAM_CONFIGS_MAP } from "./SectionParamPopover";
import { DEFAULT_LABELS_MAP } from "@/utils/defaultBlueprintLabels";
import { BlueprintLibraryPopover } from "./BlueprintLibraryPopover";
import { useBlueprintLibrary } from "@/hooks/useBlueprintLibrary";
import { useDefaultBlueprint } from "@/hooks/useDefaultBlueprint";
import { toast } from "@/hooks/use-toast";
import { useCustomParamOptions } from "@/hooks/useCustomParamOptions";
import { usePinnedParamDefaults } from "@/hooks/usePinnedParamDefaults";
import { useBlueprintHistory } from "@/hooks/useBlueprintHistory";
import { BlueprintHistoryPanel } from "./BlueprintHistoryPanel";

interface BlueprintDisplayProps {
  content: string;
  isStreaming: boolean;
  isLocked: boolean;
  onDirectEdit: (content: string) => void;
  onUpdateAndLock: (content: string) => void;
  onAddAndLock: (content: string) => void;
  onUnlock: () => void;
  onLock: () => void;
  sessionId: string | null;
  templates: TemplateNote[];
  onTemplatesChange: (templates: TemplateNote[]) => void;
  blueprintParams: BlueprintParams;
  onParamChange?: (key: keyof BlueprintParams, value: string) => void;
  /** Called to load saved default blueprint content on new session */
  onLoadDefault?: (content: string) => void;
  /** Total concepts created across sessions — for history tracking */
  totalConcepts?: number;
  /** Reactive scene params override for blueprint table sync */
  sceneParamsOverride?: Record<string, string>;
  /** Blueprint AI model for suggestions */
  blueprintModel?: string;
  /** Blueprint AI provider for suggestions */
  blueprintProvider?: "gemini" | "lovable";
}

type SectionKey = "ka" | "kha" | "ga" | "gha";

interface BlueprintSection {
  title: string;
  shortLabel: string;
  content: string;
}

function parseSections(raw: string): Record<SectionKey, BlueprintSection> {
  const sections: Record<SectionKey, BlueprintSection> = {
    ka: { title: "সারণী (ক)", shortLabel: "ক", content: "" },
    kha: { title: "সারণী (খ)", shortLabel: "খ", content: "" },
    ga: { title: "সারণী (গ)", shortLabel: "গ", content: "" },
    gha: { title: "সারণী (ঘ) — বিশেষ নির্দেশনা", shortLabel: "ঘ", content: "" },
  };

  if (!raw.trim()) return sections;

  const markers = [
    { key: "ka" as SectionKey, patterns: [/সারণী\s*\(ক\)/i, /table\s*\(ক\)/i, /##\s*সারণী\s*\(ক\)/i, /##\s*\(ক\)/i] },
    { key: "kha" as SectionKey, patterns: [/সারণী\s*\(খ\)/i, /table\s*\(খ\)/i, /##\s*সারণী\s*\(খ\)/i, /##\s*\(খ\)/i] },
    { key: "ga" as SectionKey, patterns: [/সারণী\s*\(গ\)/i, /table\s*\(গ\)/i, /##\s*সারণী\s*\(গ\)/i, /##\s*\(গ\)/i] },
    { key: "gha" as SectionKey, patterns: [/সারণী\s*\(ঘ\)/i, /table\s*\(ঘ\)/i, /##\s*সারণী\s*\(ঘ\)/i, /##\s*\(ঘ\)/i] },
  ];

  const positions: { key: SectionKey; index: number }[] = [];
  for (const marker of markers) {
    for (const pattern of marker.patterns) {
      const match = raw.match(pattern);
      if (match && match.index !== undefined) {
        positions.push({ key: marker.key, index: match.index });
        break;
      }
    }
  }

  positions.sort((a, b) => a.index - b.index);

  if (positions.length >= 2) {
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i + 1 < positions.length ? positions[i + 1].index : raw.length;
      sections[positions[i].key].content = raw.slice(start, end).trim();
    }
    if (positions[0].index > 0) {
      sections[positions[0].key].content = raw.slice(0, positions[0].index).trim() + "\n\n" + sections[positions[0].key].content;
    }
  } else {
    sections.ka.content = raw;
  }

  return sections;
}

const sectionAccents: Record<SectionKey, {
  borderColor: string; headerBg: string; headerText: string; bg: string; labelBg: string;
  glowColor: string; iconEmoji: string;
}> = {
  ka: {
    borderColor: "hsl(250 55% 80% / 0.5)",
    headerBg: "linear-gradient(135deg, hsl(250 65% 95%), hsl(270 55% 93%), hsl(260 60% 92%))",
    headerText: "hsl(250 70% 42%)",
    bg: "linear-gradient(180deg, hsl(250 45% 97%), hsl(260 40% 95%), hsl(270 35% 94%))",
    labelBg: "linear-gradient(135deg, hsl(250 70% 55%), hsl(270 65% 50%))",
    glowColor: "hsl(250 65% 55% / 0.18)",
    iconEmoji: "🎯",
  },
  kha: {
    borderColor: "hsl(320 50% 80% / 0.5)",
    headerBg: "linear-gradient(135deg, hsl(320 60% 95%), hsl(340 55% 93%), hsl(330 58% 92%))",
    headerText: "hsl(320 65% 40%)",
    bg: "linear-gradient(180deg, hsl(320 40% 97%), hsl(330 35% 95%), hsl(340 30% 94%))",
    labelBg: "linear-gradient(135deg, hsl(320 65% 52%), hsl(340 60% 48%))",
    glowColor: "hsl(320 60% 52% / 0.18)",
    iconEmoji: "🎬",
  },
  ga: {
    borderColor: "hsl(160 45% 78% / 0.5)",
    headerBg: "linear-gradient(135deg, hsl(160 55% 94%), hsl(140 50% 92%), hsl(150 52% 91%))",
    headerText: "hsl(160 60% 30%)",
    bg: "linear-gradient(180deg, hsl(160 40% 96%), hsl(150 35% 94%), hsl(140 30% 93%))",
    labelBg: "linear-gradient(135deg, hsl(160 60% 42%), hsl(140 55% 38%))",
    glowColor: "hsl(160 55% 42% / 0.18)",
    iconEmoji: "⚡",
  },
  gha: {
    borderColor: "hsl(35 55% 78% / 0.5)",
    headerBg: "linear-gradient(135deg, hsl(35 65% 94%), hsl(45 58% 92%), hsl(40 60% 91%))",
    headerText: "hsl(35 70% 32%)",
    bg: "linear-gradient(180deg, hsl(35 45% 97%), hsl(40 40% 95%), hsl(45 35% 93%))",
    labelBg: "linear-gradient(135deg, hsl(35 70% 48%), hsl(25 65% 42%))",
    glowColor: "hsl(35 65% 48% / 0.18)",
    iconEmoji: "📌",
  },
};

const SECTION_HEADER_MAP: Record<SectionKey, string> = {
  ka: "## সারণী (ক) — সিরিজ-স্থির ডাটা (Series-Static)",
  kha: "## সারণী (খ) — সিনেমাটিক ও টেকনিক্যাল (Episode-Variable)",
  ga: "## সারণী (গ) — ভাইরাল ও সাইকোলজি (Viral & Psychology)",
  gha: "## সারণী (ঘ) — বিশেষ নির্দেশনা (Override Power)",
};

const SECTION_MARKER_RE: Record<SectionKey, RegExp> = {
  ka: /সারণী\s*\(ক\)/i,
  kha: /সারণী\s*\(খ\)/i,
  ga: /সারণী\s*\(গ\)/i,
  gha: /সারণী\s*\(ঘ\)/i,
};

function ensureSectionHeader(sectionKey: SectionKey, sectionContent: string): string {
  const trimmed = sectionContent.trim();
  if (!trimmed) return "";
  if (SECTION_MARKER_RE[sectionKey].test(trimmed)) return trimmed;
  return `${SECTION_HEADER_MAP[sectionKey]}\n${trimmed}`;
}

/**
 * Param → section mapping with Bengali labels.
 * 
 * IMPORTANT: Params that appear in DEFAULT_LABELS_KA (items 1-34)
 * are mapped to section "ka" to avoid duplicates across sections.
 * Only params NOT in any DEFAULT_LABELS go to kha/ga.
 */
const PARAM_SECTION_MAP: Record<keyof BlueprintParams, { label: string; section: SectionKey }> = {
  // === সারণী (ক) — Series-Static (including all scene params) ===
  voicePresence:   { label: "কথাবার্তার উপস্থিতি", section: "ka" },
  realismLevel:    { label: "রিয়েলিজম মোড",       section: "ka" },
  episodeCount:    { label: "পর্ব সংখ্যা",         section: "ka" },
  voiceLanguage:   { label: "ভয়েস ভাষা",          section: "ka" },
  voiceGender:     { label: "ভয়েস লিঙ্গ",         section: "ka" },
  voiceAge:        { label: "ভয়েস বয়স",           section: "ka" },
  voiceEmotion:    { label: "ভয়েস আবেগ",          section: "ka" },
  voiceTone:       { label: "ভয়েস টোন",           section: "ka" },
  voiceAccent:     { label: "ভয়েস অ্যাক্সেন্ট",    section: "ka" },
  narratorStyle:   { label: "ন্যারেটর স্টাইল",     section: "ka" },
  fixedTheme:      { label: "ফিক্সড থিম",          section: "ka" },
  centralAttraction: { label: "কেন্দ্রীয় আকর্ষণ",  section: "ka" },
  fixedCharacter:  { label: "ফিক্সড ক্যারেক্টার",   section: "ka" },
  coreWorkflow:    { label: "কোর ওয়ার্কফ্লো",      section: "ka" },
  // Scene params also in ক (series-static)
  country:         { label: "দেশ",                 section: "ka" },
  locationType:    { label: "লোকেশন ধরন",          section: "ka" },
  weather:         { label: "আবহাওয়া",             section: "ka" },
  season:          { label: "ঋতু",                 section: "ka" },
  timeOfDay:       { label: "দিনের সময়",           section: "ka" },
  mood:            { label: "মুড/আবেগ",            section: "ka" },
  colorGrade:      { label: "কালার গ্রেড",          section: "ka" },
  aspectRatio:     { label: "অ্যাসপেক্ট রেশিও",    section: "ka" },
  duration:        { label: "ভিডিও দৈর্ঘ্য",        section: "ka" },
  resolution:      { label: "রেজোলিউশন",           section: "ka" },
  frameRate:       { label: "ফ্রেম রেট",            section: "ka" },
  transitionStyle: { label: "ট্রানজিশন স্টাইল",     section: "ka" },
  lensAperture:    { label: "লেন্স ও অ্যাপারচার",   section: "ka" },

  // === সারণী (খ) — Episode-Variable ===
  locationVibe:    { label: "লোকেশন ভাইব",         section: "kha" },
  environment:     { label: "পরিবেশ",              section: "kha" },
  soundTrend:      { label: "সাউন্ড ট্রেন্ড",       section: "kha" },
  vfxIntensity:    { label: "VFX তীব্রতা",          section: "kha" },
  lightSourceDirection: { label: "লাইট সোর্স ডিরেকশন", section: "kha" },
  visualDramaLevel: { label: "ভিজ্যুয়াল ড্রামা লেভেল", section: "kha" },
  cameraEyeMovement: { label: "ক্যামেরা 'আই' মুভমেন্ট", section: "kha" },
  audioImmersionMode: { label: "অডিও ইমার্সন মোড", section: "kha" },
  backgroundPeople: { label: "পটভূমি মানুষ",        section: "kha" },
  visualElements:  { label: "ভিজুয়াল উপাদান",      section: "kha" },
  coreEventFlow:   { label: "কোর ইভেন্ট ফ্লো",     section: "kha" },

  // === সারণী (গ) — List-Based, Viral & Psychology ===
  openingStyle:    { label: "শুরুর ধরন",            section: "ga" },
  curiosityGap:    { label: "কৌতূহল তৈরি",          section: "ga" },
  narrativeArc:    { label: "গল্পের কাঠামো",        section: "ga" },
  emotionalJourney:{ label: "আবেগের যাত্রা",        section: "ga" },
  twistIntensity:  { label: "টুইস্ট তীব্রতা",       section: "ga" },
  peakMoment:      { label: "চরম মুহূর্ত",          section: "ga" },
  speedDynamics:   { label: "গতি ডায়নামিক্স",       section: "ga" },
  relatability:    { label: "সম্পর্কযোগ্যতা",       section: "ga" },
  nostalgiaLevel:  { label: "নস্টালজিয়া লেভেল",     section: "ga" },
  shockValue:      { label: "শক ভ্যালু",            section: "ga" },
  shareability:    { label: "শেয়ারযোগ্যতা",         section: "ga" },
  loopFriendly:    { label: "লুপ ফ্রেন্ডলি",        section: "ga" },
  pacing:          { label: "গতি/পেসিং",            section: "ga" },
  ctaPlacement:    { label: "CTA অবস্থান",          section: "ga" },
  futuristicSystems: { label: "ফিউচারিস্টিক সিস্টেম", section: "ga" },
  patternDisruption: { label: "প্যাটার্ন ডিসরাপশন",  section: "ga" },
  audiencePsychologyTrigger: { label: "অডিয়েন্স সাইকোলজি ট্রিগার", section: "ga" },
  informationDensity: { label: "ইনফরমেশন ডেনসিটি",  section: "ga" },
  viralHookArchetype: { label: "ভাইরাল হুক আর্কিটাইপ", section: "ga" },
  creativeCatalyst: { label: "সৃজনশীল অনুঘটক",      section: "ga" },
  forbiddenElements: { label: "নিষিদ্ধ উপাদান",     section: "ga" },
  immutableMutableElements: { label: "অপরিবর্তনীয় উপাদান", section: "ga" },
  mutableElements: { label: "পরিবর্তনযোগ্য উপাদান", section: "ga" },
  variableCharacterList: { label: "ভেরিয়েবল চরিত্র তালিকা", section: "ga" },
};

const PARAM_VALUE_DISPLAY: Record<string, string> = {
  "yes": "হ্যাঁ", "no": "না", "macro": "ম্যাক্রো", "full-shot": "ফুল শট", "medium-shot": "মিডিয়াম",
  "close-up": "ক্লোজ-আপ", "wide-shot": "ওয়াইড", "foley": "ফলি", "music": "মিউজিক",
  "silent-focus": "নীরব", "ambient": "অ্যাম্বিয়েন্ট", "strict-realism": "কঠোর",
  "bio-authentic-mutation": "মিউটেশন", "stylized": "স্টাইলাইজড", "series": "সিরিজ",
  "bengali": "বাংলা", "english": "English", "hindi": "हिंदी", "arabic": "العربية",
  "male": "পুরুষ", "female": "মহিলা", "neutral": "নিউট্রাল", "child": "শিশু",
  "young": "তরুণ", "adult": "প্রাপ্তবয়স্ক", "mature": "পরিণত", "elderly": "বৃদ্ধ",
  "happy": "আনন্দিত", "sad": "দুঃখিত", "angry": "রাগান্বিত", "excited": "উত্তেজিত",
  "calm": "শান্ত", "fearful": "ভীত", "surprised": "বিস্মিত", "loving": "স্নেহপূর্ণ",
  "confident": "আত্মবিশ্বাসী", "formal": "ফর্মাল", "casual": "ক্যাজুয়াল", "dramatic": "নাটকীয়",
  "whispery": "ফিসফিস", "energetic": "উদ্যমী", "soothing": "প্রশান্তিদায়ক",
  "native": "দেশীয়", "british": "ব্রিটিশ", "american": "আমেরিকান",
  "storyteller": "গল্পকার", "documentary": "ডকুমেন্টারি", "news-anchor": "সংবাদ",
  "conversational": "কথোপকথন", "poetic": "কাব্যিক", "suspenseful": "সাসপেন্স",
  "bangladesh": "বাংলাদেশ", "india": "ভারত", "usa": "আমেরিকা", "uk": "যুক্তরাজ্য",
  "city": "শহর", "village": "গ্রাম", "forest": "বন", "beach": "সমুদ্র সৈকত", "mountain": "পাহাড়",
  "desert": "মরুভূমি", "modern": "আধুনিক", "traditional": "ঐতিহ্যবাহী", "futuristic": "ভবিষ্যৎমুখী",
  "natural": "প্রাকৃতিক", "sunny": "রৌদ্রোজ্জ্বল", "cloudy": "মেঘলা", "rainy": "বৃষ্টি",
  "stormy": "ঝড়", "snowy": "তুষারপাত", "foggy": "কুয়াশা", "spring": "বসন্ত", "summer": "গ্রীষ্ম",
  "autumn": "শরৎ", "winter": "শীত", "monsoon": "বর্ষা", "indoor": "ইনডোর", "outdoor": "আউটডোর",
  "studio": "স্টুডিও", "mixed": "মিক্সড", "day": "দিন", "night": "রাত", "golden-hour": "সোনালি",
  "blue-hour": "নীল", "dawn": "ভোর", "tense": "উত্তেজনাপূর্ণ", "peaceful": "শান্ত",
  "mysterious": "রহস্যময়", "warm": "উষ্ণ", "cool": "শীতল", "cinematic": "সিনেমাটিক",
  "vintage": "ভিন্টেজ", "static": "স্থির", "handheld": "হ্যান্ডহেল্ড", "dolly": "ডলি",
  "drone": "ড্রোন", "tracking": "ট্র্যাকিং", "soft": "হালকা", "medium": "মাঝারি",
  "strong": "শক্তিশালী", "explosive": "বিস্ফোরক", "question": "প্রশ্ন", "shock": "শক",
  "mystery": "রহস্য", "action": "অ্যাকশন", "emotion": "আবেগ", "none": "নেই", "mild": "হালকা",
  "intense": "তীব্র", "cliffhanger": "ক্লিফহ্যাঙ্গার", "linear": "সোজা", "non-linear": "জটিল",
  "circular": "বৃত্তাকার", "twist-ending": "টুইস্ট", "flat": "সমতল", "build-up": "ক্রমবর্ধমান",
  "roller-coaster": "রোলার", "crescendo": "ক্রিসেন্ডো", "subtle": "সূক্ষ্ম", "mind-blowing": "মাইন্ডব্লো",
  "early": "শুরুতে", "middle": "মাঝে", "climax": "ক্লাইম্যাক্স", "end-reveal": "শেষে",
  "low": "কম", "balanced": "সুষম", "high": "উচ্চ", "extreme": "চরম",
  "normal": "স্বাভাবিক", "slow-mo": "স্লো-মো", "speed-ramp": "র‍্যাম্প", "time-lapse": "টাইমল্যাপস",
  "cut": "কাট", "fade": "ফেড", "creative": "ক্রিয়েটিভ", "seamless": "সিমলেস",
  "moderate": "মাঝারি", "heavy": "ভারী", "niche": "নিশ", "universal": "সার্বজনীন",
  "deeply-personal": "ব্যক্তিগত", "hint": "ইঙ্গিত", "core-theme": "মূল থিম",
  "viral-bait": "ভাইরাল", "soft-loop": "হালকা লুপ", "perfect-loop": "পারফেক্ট লুপ",
  "slow": "ধীর", "fast": "দ্রুত", "hyper": "হাইপার", "end": "শেষে", "throughout": "সর্বত্র",
  "original": "অরিজিনাল", "trending": "ট্রেন্ডিং", "remix": "রিমিক্স", "iconic": "আইকনিক",
  // Futuristic Systems
  "temporal-engine": "টেম্পোরাল ইঞ্জিন", "dimensional-mapping": "ডাইমেনশনাল ম্যাপিং",
  "ghost-protocol": "ঘোস্ট প্রোটোকল", "quantum-density": "কোয়ান্টাম ডেনসিটি",
  "network-dominance": "নেটওয়ার্ক ডমিন্যান্স", "reality-simulation": "রিয়ালিটি সিমুলেশন",
  // Advanced Creative
  "subtle-twist": "সূক্ষ্ম মোড়", "shocking-ending": "চমকে দেওয়া সমাপ্তি",
  "full-perspective-shift": "সম্পূর্ণ দৃষ্টিভঙ্গি পরিবর্তন",
  "deep-asmr": "গভীর তৃপ্তি (ASMR)", "primal-fear": "আদিম ভয়",
  "intense-curiosity": "তীব্র কৌতূহল", "viral-attraction": "ভাইরাল আকর্ষণ",
  "ultra-wide-16mm": "আল্ট্রা-ওয়াইড (১৬মিমি)", "standard-35mm": "সাধারণ লেন্স (৩৫মিমি)",
  "portrait-85mm": "পোর্টেট ডেপথ (৮৫মিমি)", "macro-100mm": "ম্যাক্রো ডিটেইল (১০০মিমি)",
  "moody-side-light": "মুডি সাইড-লাইট", "dramatic-backlit": "ড্রামাটিক ব্যাকলিট",
  "soft-ambient": "সফট অ্যাম্বিয়েন্ট", "high-contrast-rim": "হাই-কনট্রাস্ট রিম লাইট",
  // Supreme Power
  "subtle-realism": "সাটল রিয়ালিজম", "natural-contrast": "ন্যাচারাল কনট্রাস্ট",
  "high-key-cinematic": "হাই-কি সিনেমাটিক", "gritty-noir": "গ্রিটি নোয়ার", "ethereal-dreamy": "ইথেরিয়াল/স্বপ্নিল",
  "minimalist": "মিনিমালিস্ট", "focused-detail": "ফোকাসড ডিটেইল",
  "rich-environment": "সমৃদ্ধ পরিবেশ", "chaotic-detail": "বিশৃঙ্খল ডিটেইল",
  "static-witness": "স্থির সাক্ষী", "slow-breathing": "ধীর শ্বাস",
  "handheld-tremor": "হ্যান্ডহেল্ড কম্পন", "predator-chase": "প্রিডেটর চেজ", "mechanical-slide": "মেকানিক্যাল স্লাইড",
  "isolated-asmr": "আইসোলেটেড ASMR", "spatial-surround": "স্পেশাল সারাউন্ড",
  "muffled-underwater": "মাফল্ড আন্ডারওয়াটার", "sharp-transient": "শার্প ট্রানজিয়েন্ট", "high-octane-bass": "হাই-অক্টেন বেজ",
  "impossible-action": "অসম্ভব কাজ", "uncanny-appearance": "অদ্ভুত আবির্ভাব",
  "satisfying-destruction": "তৃপ্তিকর ধ্বংস", "emotional-gut-punch": "আবেগের ঘা", "visual-loophole": "ভিজুয়াল ফাঁকি",
  // New expanded options
  "mystic-spirituality": "মরমী আধ্যাত্মিকতা", "cosmic-apocalypse": "মহাজাগতিক ধ্বংসযজ্ঞ",
  "primal-fight": "আদিম লড়াই", "evolutionary-turn": "বিবর্তনীয় মোড়",
  "transformed-creature": "রূপান্তরিত প্রাণী", "shadow-hunter": "ছায়াময় শিকারি",
  "evolved-entities": "বিবর্তিত সত্তা", "fire-sparks": "আগুনের স্ফুলিঙ্গ",
  "evolutionary-trigger": "বিবর্তনীয় ট্রিগার",
  // New params
  "cinematic-narrative": "সিনেমাটিক ন্যারেটিভ", "documentary-style": "ডকুমেন্টারি স্টাইল",
  "high-action-pacing": "হাই-অ্যাকশন পেসিং", "slow-burn-suspense": "স্লো বার্ন সাসপেন্স",
  "musical-rhythm": "মিউজিক্যাল রিদম", "first-person-pov": "ফার্স্ট পারসন POV",
  "dramatic-storytelling": "ড্রামাটিক স্টোরিটেলিং",
  "linear-timeline": "লিনিয়ার টাইমলাইন", "reverse-memory": "রিভার্স মেমরি",
  "looped-reality": "লুপড রিয়ালিটি", "multi-dimensional-jump": "মাল্টি-ডাইমেনশনাল জাম্প",
  "fast-forward-evolution": "ফাস্ট ফরওয়ার্ড ইভোলিউশন", "slow-motion-detailing": "স্লো মোশন ডিটেইলিং",
  "static-landscape": "স্থির ল্যান্ডস্কেপ", "changing-time": "পরিবর্তনশীল সময়",
  "transforming-body": "রূপান্তরশীল শরীর", "decaying-weather": "ক্ষয়িষ্ণু আবহাওয়া",
  "eternal-light": "চিরস্থায়ী আলো", "transient-shadow": "অস্থায়ী ছায়া",
  "unchanging-sky": "অপরিবর্তনীয় আকাশ", "fixed-horizon": "স্থির দিগন্ত",
  "permanent-structure": "স্থায়ী স্থাপনা", "frozen-ocean": "হিমায়িত মহাসাগর",
  "petrified-forest": "প্রস্তরীভূত বন", "eternal-flame": "চিরন্তন শিখা",
  "unchanging-monument": "অচল স্মৃতিসৌধ", "fixed-constellation": "স্থির নক্ষত্রমণ্ডল",
  "permanent-ruin": "স্থায়ী ধ্বংসাবশেষ", "immovable-mountain": "অটল পর্বত",
  "eternal-river": "চিরপ্রবাহমান নদী", "fixed-portal": "স্থির পোর্টাল",
  "unchanging-symbol": "অপরিবর্তনীয় প্রতীক",
  // mutableElements
  "shifting-colors": "পরিবর্তনশীল রং", "morphing-terrain": "রূপান্তরিত ভূখণ্ড",
  "evolving-creature": "বিবর্তিত প্রাণী", "dissolving-structure": "বিলীয়মান কাঠামো",
  "flickering-reality": "কম্পমান বাস্তবতা", "aging-character": "বয়স্ক হওয়া চরিত্র",
  "growing-vegetation": "বর্ধনশীল উদ্ভিদ", "shifting-gravity": "পরিবর্তনশীল মাধ্যাকর্ষণ",
  "melting-ice": "গলন্ত বরফ", "spreading-darkness": "বিস্তৃত অন্ধকার",
  "transforming-sky": "রূপান্তরশীল আকাশ",
  // variableCharacterList expanded
  "helper-entity": "সহায়ক সত্তা", "hidden-enemy": "গোপন শত্রু",
  "observer-creature": "পর্যবেক্ষক প্রাণী", "mechanical-drone": "যান্ত্রিক ড্রোন",
  "ancestral-spirit": "পূর্বপুরুষের আত্মা", "illusion-creator": "মায়া সৃষ্টিকারী অবয়ব",
  "shape-shifter": "রূপ পরিবর্তনকারী", "time-guardian": "সময়ের প্রহরী",
  "dream-walker": "স্বপ্ন পরিভ্রমণকারী", "shadow-twin": "ছায়া যমজ",
  "cosmic-messenger": "মহাজাগতিক দূত", "nature-spirit": "প্রকৃতির আত্মা",
  "forgotten-deity": "বিস্মৃত দেবতা", "quantum-echo": "কোয়ান্টাম প্রতিধ্বনি",
  "parasitic-entity": "পরজীবী সত্তা",
  // Expanded fixedTheme
  "steampunk-revolution": "স্টিমপাঙ্ক বিপ্লব", "post-apocalyptic": "পোস্ট-অ্যাপোক্যালিপটিক",
  "dark-fantasy": "ডার্ক ফ্যান্টাসি", "biopunk-evolution": "বায়োপাঙ্ক বিবর্তন",
  "abstract-expressionism": "বিমূর্ত এক্সপ্রেশনিজম", "tribal-primordial": "আদিবাসী আদিম",
  // Expanded coreWorkflow
  "experimental-montage": "এক্সপেরিমেন্টাল মন্তাজ", "found-footage": "ফাউন্ড ফুটেজ",
  "parallel-timeline": "প্যারালেল টাইমলাইন", "stream-of-consciousness": "চেতনা প্রবাহ",
  "visual-poetry": "ভিজুয়াল কবিতা", "mockumentary": "মকুমেন্টারি",
  "non-linear-puzzle": "নন-লিনিয়ার পাজল", "episodic-vignettes": "এপিসোডিক ভিনেট",
  // Expanded centralAttraction
  "cosmic-portal": "মহাজাগতিক পোর্টাল", "ancient-machine": "প্রাচীন যন্ত্র",
  "living-landscape": "জীবন্ত ভূদৃশ্য", "forbidden-knowledge": "নিষিদ্ধ জ্ঞান",
  "time-anomaly": "সময়ের অসঙ্গতি", "sentient-shadow": "সচেতন ছায়া",
  "celestial-event": "মহাজাগতিক ঘটনা",
  // Expanded fixedCharacter
  "fallen-angel": "পতিত দেবদূত", "last-survivor": "শেষ জীবিত",
  "dream-architect": "স্বপ্নের স্থপতি", "time-traveler": "সময় পরিব্রাজক",
  "nature-guardian": "প্রকৃতির অভিভাবক", "cosmic-wanderer": "মহাজাগতিক পরিব্রাজক",
  "machine-consciousness": "যন্ত্র চেতনা",
  // Expanded forbiddenElements
  "no-symmetry": "সমতা নিষিদ্ধ", "no-text-overlay": "টেক্সট ওভারলে নিষিদ্ধ",
  "no-camera-cut": "ক্যামেরা কাট নিষিদ্ধ", "no-warm-tones": "উষ্ণ টোন নিষিদ্ধ",
  "no-straight-lines": "সরলরেখা নিষিদ্ধ", "no-natural-light": "প্রাকৃতিক আলো নিষিদ্ধ",
  "no-living-creatures": "জীবন্ত প্রাণী নিষিদ্ধ", "no-repetition": "পুনরাবৃত্তি নিষিদ্ধ",
  // Expanded coreEventFlow
  "parallel-convergence": "সমান্তরাল সংমিশ্রণ", "recursive-flashback": "পুনরাবৃত্ত ফ্ল্যাশব্যাক",
  "dream-within-dream": "স্বপ্নের মধ্যে স্বপ্ন", "cause-effect-chain": "কারণ-প্রভাব শৃঙ্খল",
  "countdown-urgency": "কাউন্টডাউন জরুরিতা", "butterfly-effect": "প্রজাপতি প্রভাব",
  "spiral-descent": "সর্পিল অবতরণ", "fragmented-memory": "খণ্ডিত স্মৃতি",
  "simultaneous-events": "একযোগে ঘটনাবলী",
  // Expanded backgroundPeople
  "masked-strangers": "মুখোশধারী আগন্তুক", "dancing-silhouettes": "নৃত্যরত ছায়ামূর্তি",
  "mourning-crowd": "শোকার্ত জনতা", "ghostly-echoes": "ভৌতিক প্রতিধ্বনি",
  "robotic-workers": "যান্ত্রিক কর্মী", "tribal-gathering": "গোষ্ঠীগত সমাবেশ",
  "cloned-multitude": "ক্লোনকৃত বহুজন",
  // Expanded visualElements
  "holographic-overlay": "হলোগ্রাফিক ওভারলে", "fractal-patterns": "ফ্র্যাক্টাল প্যাটার্ন",
  "aurora-borealis": "অরোরা বোরিয়ালিস", "ink-diffusion": "কালি বিস্তার",
  "crystalline-shards": "স্ফটিক খণ্ড", "electromagnetic-pulse": "তড়িৎচৌম্বক তরঙ্গ",
  // Expanded creativeCatalyst
  "dimension-bleed": "মাত্রা রক্তক্ষরণ", "consciousness-split": "চেতনা বিভাজন",
  "temporal-glitch": "সময়ের ত্রুটি", "memory-surge": "স্মৃতির ঢেউ",
  "identity-crisis": "পরিচয় সংকট", "prophetic-vision": "ভবিষ্যদ্বাণীমূলক দৃষ্টি",
};

// Auto-build complete value→Bengali map from PARAM_CONFIGS_MAP
const FULL_VALUE_DISPLAY: Record<string, string> = (() => {
  const map: Record<string, string> = { ...PARAM_VALUE_DISPLAY };
  // Add all options from PARAM_CONFIGS_MAP that aren't already in the manual map
  for (const config of Object.values(PARAM_CONFIGS_MAP)) {
    for (const opt of config.options) {
      if (!map[opt.value]) {
        map[opt.value] = opt.label;
      }
      // Also map label→label for cases where label is used as key
      if (!map[opt.label]) {
        map[opt.label] = opt.label;
      }
    }
  }
  return map;
})();

export function getParamDisplayValue(v: string | undefined): string {
  if (!v) return "—";
  // Handle multi-select comma-separated values
  if (v.includes(",")) {
    return v.split(",").map(part => FULL_VALUE_DISPLAY[part.trim()] || part.trim()).join(" + ");
  }
  return FULL_VALUE_DISPLAY[v] || v;
}

export { PARAM_VALUE_DISPLAY };

/** Get ALL params for a section as ExtraParamRow[] with their options.
 *  Includes params mapped to default labels so they appear in extraParamMap for dropdown rendering.
 */
function getExtraParamRows(params: BlueprintParams, sectionKey: SectionKey, touchedParams: Set<string>): ExtraParamRow[] {
  const result: ExtraParamRow[] = [];
  const addedKeys = new Set<string>();

  // Helper to add a param key
  const addParam = (key: keyof BlueprintParams) => {
    if (addedKeys.has(key)) return;
    addedKeys.add(key);
    const meta = PARAM_SECTION_MAP[key];
    if (!meta) return;
    const config = PARAM_CONFIGS_MAP[key];
    const currentValue = params[key];
    const isDefault = currentValue === DEFAULT_PARAMS[key];
    const wasTouched = touchedParams.has(key);
    result.push({
      label: meta.label,
      value: (isDefault && !wasTouched) ? "—" : getParamDisplayValue(currentValue),
      paramKey: key,
      options: config?.options?.map(o => ({ value: o.value, label: o.label })),
      isDefault: isDefault && !wasTouched,
    });
  };

  // 1. Add params from default labels (these will be rendered inline in the default rows)
  const defaultLabels = DEFAULT_LABELS_MAP[sectionKey];
  if (defaultLabels) {
    for (const dl of defaultLabels) {
      if (dl.paramKey) {
        addParam(dl.paramKey as keyof BlueprintParams);
      }
    }
  }

  // 2. Add remaining SECTION_PARAMS (these render as extra rows below default labels)
  const sectionParamKeys = SECTION_PARAMS[sectionKey] || [];
  for (const key of sectionParamKeys) {
    addParam(key);
  }

  return result;
}

export function BlueprintDisplay({
  content,
  isStreaming,
  isLocked,
  onDirectEdit,
  onUpdateAndLock,
  onAddAndLock,
  onUnlock,
  onLock,
  sessionId,
  templates,
  onTemplatesChange,
  blueprintParams,
  onParamChange,
  onLoadDefault,
  totalConcepts = 0,
  sceneParamsOverride,
  blueprintModel,
  blueprintProvider,
}: BlueprintDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);
  /** Track which library blueprint is currently loaded */
  const [loadedBlueprintId, setLoadedBlueprintId] = useState<string | null>(null);
  /** Track which params the user has explicitly changed */
  const [touchedParams, setTouchedParams] = useState<Set<string>>(new Set());
  /** Track which rows are hidden */
  const [hiddenRows, setHiddenRows] = useState<Set<string>>(new Set());
  const { blueprints, saveBlueprint, removeBlueprint, updateBlueprint, getNextSerial } = useBlueprintLibrary();
  const { savedDefault, saveAsDefault, clearDefault } = useDefaultBlueprint();
  const { customOptions, addOption: addCustomOption, removeOption: removeCustomOption, editOption: editCustomOption } = useCustomParamOptions();
  const { pinned, pinDefault, unpinDefault, isPinned: isPinnedOption } = usePinnedParamDefaults();
  const { history: blueprintHistory, loading: historyLoading, saveSnapshot, deleteSnapshot, togglePin } = useBlueprintHistory(sessionId);
  const [showHistory, setShowHistory] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionKey>>(new Set());
  const [isBulkFilling, setIsBulkFilling] = useState(false);

  // ─── Batch AI Suggest: fetch suggestions for ALL fields in ONE call, inject into SmartSuggest cache ───
  const handleBulkAutoFill = useCallback(async () => {
    if (!content || isBulkFilling) return;
    setIsBulkFilling(true);

    try {
      const { injectBulkSuggestions } = await import("@/hooks/useSmartSuggest");
      const currentSections = parseSections(content);
      const sectionKeys: SectionKey[] = ["ka", "kha", "ga"];

      interface FieldInfo { sectionKey: SectionKey; rowNumber: string; label: string; }
      const allFields: FieldInfo[] = [];

      for (const sk of sectionKeys) {
        const sectionContent = currentSections[sk].content;
        if (!sectionContent.trim()) continue;
        const labels = DEFAULT_LABELS_MAP[sk] || [];
        for (const def of labels) {
          allFields.push({ sectionKey: sk, rowNumber: def.number, label: def.label });
        }
      }

      if (allFields.length === 0) {
        toast({ title: "⚠️ কোনো ফিল্ড পাওয়া যায়নি" });
        setIsBulkFilling(false);
        return;
      }

      // Map model name to API format
      const modelToSend = blueprintModel
        ? (blueprintModel.includes("/") ? blueprintModel : `google/${blueprintModel}`)
        : undefined;

      toast({ title: `✨ ${allFields.length}টি ফিল্ডের জন্য AI সাজেশন আনা হচ্ছে...`, description: `মডেল: ${blueprintModel || "gemini-2.5-flash"}` });

      const { data, error: fnError } = await supabase.functions.invoke("bulk-smart-suggest", {
        body: {
          fields: allFields.map(f => ({ fieldLabel: f.label, sectionKey: f.sectionKey, rowNumber: f.rowNumber })),
          model: modelToSend,
        },
      });

      if (fnError || !data?.results) {
        toast({ title: "❌ সাজেশন আনতে সমস্যা", description: fnError?.message || "অজানা ত্রুটি", variant: "destructive" });
        setIsBulkFilling(false);
        return;
      }

      // Inject results into SmartSuggest shared cache
      const cacheEntries: { fieldLabel: string; sectionKey: string; suggestions: string[] }[] = [];
      let successCount = 0;

      for (let i = 0; i < allFields.length; i++) {
        const suggestions = data.results[i];
        if (!suggestions || (Array.isArray(suggestions) && suggestions.length === 0)) continue;
        const sugArray = Array.isArray(suggestions) ? suggestions : [suggestions];
        const cleanLabel = allFields[i].label.replace(/\*{1,3}/g, "").trim();
        cacheEntries.push({
          fieldLabel: cleanLabel,
          sectionKey: allFields[i].sectionKey,
          suggestions: sugArray,
        });
        successCount++;
      }

      if (cacheEntries.length > 0) {
        injectBulkSuggestions(cacheEntries);
      }

      toast({
        title: `✨ ${successCount}টি ফিল্ডের সাজেশন প্রস্তুত!`,
        description: "এবার প্রতিটি ফিল্ডের ✨ বাটনে ক্লিক করে সিলেক্ট করুন।",
      });
    } catch (err) {
      console.error("[BulkSuggest] Error:", err);
      toast({ title: "❌ ত্রুটি", description: String(err), variant: "destructive" });
    } finally {
      setIsBulkFilling(false);
    }
  }, [content, isBulkFilling, blueprintModel]);

  const toggleCollapse = useCallback((key: SectionKey) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Apply pinned defaults on mount (new session)
  const pinnedAppliedRef = useRef(false);
  useEffect(() => {
    if (pinnedAppliedRef.current) return;
    const pinnedKeys = Object.keys(pinned);
    if (pinnedKeys.length === 0) return;
    pinnedAppliedRef.current = true;
    if (onParamChange) {
      const newTouched = new Set<string>();
      for (const key of pinnedKeys) {
        const pk = key as keyof BlueprintParams;
        const p = pinned[key];
        if (p) {
          onParamChange(pk, p.value);
          newTouched.add(key);
        }
      }
      setTouchedParams(prev => new Set([...prev, ...newTouched]));
    }
  }, [pinned, onParamChange]);

  // Undo/Redo history — tracks both content AND params as snapshots
  type Snapshot = { content: string; params: Record<string, string> };
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);
  const prevSnapshotRef = useRef<Snapshot>({ content: content || "", params: { ...(blueprintParams || {}) } });
  const isUndoRedoRef = useRef(0); // counter: skip N effect fires after undo/redo

  // Build current snapshot string for comparison
  const currentSnapshotKey = JSON.stringify({ c: content || "", p: blueprintParams || {} });
  const prevSnapshotKey = useRef(currentSnapshotKey);

  // Auto-save to persistent history on every meaningful change (debounced 2s)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotKeyRef = useRef<string>("");
  useEffect(() => {
    if (!content?.trim() || !sessionId) return;
    // Don't auto-save while history panel is open — prevents re-render crashes
    if (showHistory) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      // Deduplicate: skip if same content+params as last save
      if (currentSnapshotKey === lastSavedSnapshotKeyRef.current) return;
      lastSavedSnapshotKeyRef.current = currentSnapshotKey;
      saveSnapshot(content, blueprintParams as unknown as Record<string, string>, undefined, totalConcepts);
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSnapshotKey, sessionId, totalConcepts, showHistory]);

  useEffect(() => {
    if (isUndoRedoRef.current > 0) {
      isUndoRedoRef.current--;
      prevSnapshotKey.current = currentSnapshotKey;
      prevSnapshotRef.current = { content: content || "", params: { ...(blueprintParams || {}) } };
      return;
    }
    if (currentSnapshotKey !== prevSnapshotKey.current) {
      setUndoStack(s => [...s.slice(-49), prevSnapshotRef.current]);
      setRedoStack([]);
    }
    prevSnapshotKey.current = currentSnapshotKey;
    prevSnapshotRef.current = { content: content || "", params: { ...(blueprintParams || {}) } };
  }, [currentSnapshotKey]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    const current: Snapshot = { content: content || "", params: { ...(blueprintParams || {}) } };
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, current]);
    isUndoRedoRef.current = 2;
    onDirectEdit(prev.content);
    if (onParamChange) {
      Object.entries(prev.params).forEach(([k, v]) => onParamChange(k as keyof typeof blueprintParams, v));
    }
  }, [undoStack, content, blueprintParams, onDirectEdit, onParamChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const current: Snapshot = { content: content || "", params: { ...(blueprintParams || {}) } };
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, current]);
    isUndoRedoRef.current = 2;
    onDirectEdit(next.content);
    if (onParamChange) {
      Object.entries(next.params).forEach(([k, v]) => onParamChange(k as keyof typeof blueprintParams, v));
    }
  }, [redoStack, content, blueprintParams, onDirectEdit, onParamChange]);

  const handleQuickSave = () => {
    const fullContent = buildCopyText();

    // If this blueprint was loaded from library, update the existing entry
    if (loadedBlueprintId) {
      const existing = blueprints.find(bp => bp.id === loadedBlueprintId);
      if (existing) {
        updateBlueprint(loadedBlueprintId, fullContent);
        toast({
          title: "✅ আপডেট হয়েছে",
          description: `"${existing.name}" লাইব্রেরিতে আপডেট করা হয়েছে।`,
        });
        return;
      }
    }

    // Duplicate check — compare normalized content
    const normalized = fullContent.trim().replace(/\s+/g, " ").toLowerCase();
    const duplicate = blueprints.find(
      (bp) => bp.content.trim().replace(/\s+/g, " ").toLowerCase() === normalized
    );
    if (duplicate) {
      toast({
        title: "⚠️ ডুপ্লিকেট ব্লুপ্রিন্ট",
        description: `এই ব্লুপ্রিন্টটি ইতিমধ্যে "${duplicate.name}" হিসেবে লাইব্রেরিতে আছে।`,
        variant: "destructive",
      });
      return;
    }
    const serial = getNextSerial();
    const name = `Blueprint ${serial}`;
    const entry = saveBlueprint(name, fullContent);
    // Track this newly saved blueprint for auto-sync
    setLoadedBlueprintId(entry.id);
    toast({
      title: "✅ সেভ হয়েছে",
      description: `"${name}" লাইব্রেরিতে সংরক্ষিত হয়েছে।`,
    });
  };

  /** Set current blueprint as default */
  const handleSetDefault = () => {
    const fullContent = buildCopyText();
    if (!fullContent.trim()) {
      toast({
        title: "⚠️ খালি ব্লুপ্রিন্ট",
        description: "ডিফল্ট সেট করতে ব্লুপ্রিন্টে কিছু content থাকতে হবে।",
        variant: "destructive",
      });
      return;
    }
    saveAsDefault(fullContent);
    toast({
      title: "⭐ ডিফল্ট সেট হয়েছে",
      description: "এই ব্লুপ্রিন্ট এখন নতুন সেশনে ডিফল্ট হিসেবে লোড হবে।",
    });
  };

  const handleClearDefault = () => {
    clearDefault();
    toast({
      title: "🔄 ডিফল্ট সরানো হয়েছে",
      description: "নতুন সেশনে খালি ব্লুপ্রিন্ট দিয়ে শুরু হবে।",
    });
  };

  useEffect(() => {
    if (content) setEditContent(content);
  }, [content]);

  const handleReset = () => {
    // Reset should NEVER delete structure/custom rows.
    // It only clears the value part after the separator (—/–/-/→/:).

    const clearValuesOnly = (raw: string): string => {
      return raw
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith("##")) return line;

          // Match numbered rows like: "১. লেবেল — মান" or "1. label - value"
          const m = line.match(/^([\t ]*[০-৯\d]+[.।][\t ]+.+?[\t ]*[—–\-→:])[\t ]*.*$/);
          if (!m) return line;
          return `${m[1]} `;
        })
        .join("\n");
    };

    const hasAnyContent = !!content.trim();

    // Helper: reset params to defaults, but keep pinned values
    const applyPinnedOrDefault = () => {
      if (!onParamChange) { setTouchedParams(new Set()); return; }
      const paramKeys = Object.keys(DEFAULT_PARAMS) as (keyof BlueprintParams)[];
      const pinnedTouched = new Set<string>();
      for (const key of paramKeys) {
        const pinnedVal = pinned[key];
        if (pinnedVal) {
          onParamChange(key, pinnedVal.value);
          pinnedTouched.add(key);
        } else {
          onParamChange(key, DEFAULT_PARAMS[key]);
        }
      }
      setTouchedParams(pinnedTouched);
    };

    if (!hasAnyContent) {
      applyPinnedOrDefault();
      setLoadedBlueprintId(null);
      toast({ title: "🔄 রিসেট সম্পন্ন", description: "কোনো ব্লুপ্রিন্ট কনটেন্ট ছিল না—ক্লিয়ার করার মতো Value নেই।" });
      return;
    }

    onDirectEdit(clearValuesOnly(content));
    applyPinnedOrDefault();
    setLoadedBlueprintId(null);

    const hasPinned = Object.keys(pinned).length > 0;
    toast({
      title: "🔄 রিসেট সম্পন্ন",
      description: hasPinned
        ? "Structure অক্ষুণ্ণ রেখে Value ফাঁকা হয়েছে। 📌 পিন করা ডিফল্ট বহাল আছে।"
        : "Structure/Custom points অক্ষুণ্ণ রেখে শুধু Value ফাঁকা করা হয়েছে।",
    });
  };

  const sections = useMemo(() => parseSections(content), [content]);
  const hasSections = !!(sections.kha.content || sections.ga.content);
  const sectionOrder: SectionKey[] = sections.gha.content ? ["ka", "kha", "ga", "gha"] : ["ka", "kha", "ga"];

  // Build full copy text including param rows appended to each section (excluding hidden rows)
  const buildCopyText = useCallback(() => {
    const BN = ["১","২","৩","৪","৫","৬","৭","৮","৯","১০","১১","১২","১৩","১৪","১৫","১৬","১৭","১৮","১৯","২০"];
    let result = "";
    const allSections: SectionKey[] = ["ka", "kha", "ga", "gha"];
    for (const key of allSections) {
      const sec = sections[key];
      let sectionLines: string[] = [];

      // Process existing content lines — skip rows with empty values and duplicate headers
      if (sec.content.trim()) {
        const lines = sec.content.split("\n");
        const defaultLabels = DEFAULT_LABELS_MAP[key] || [];
        // Collect all section header texts for dedup (with and without ##)
        const allHeaderTexts = Object.values(SECTION_HEADER_MAP).flatMap(h => [
          h.trim(),
          h.replace(/^##\s*/, "").trim(),
        ]);
        let headerAdded = false;
        sectionLines = lines.filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          // Check if this line is a section header (with or without ##)
          const isHeader = allHeaderTexts.some(ht => trimmed === ht || trimmed === `## ${ht}` || ht === trimmed.replace(/^##\s*/, ""));
          if (isHeader) {
            if (headerAdded) return false; // skip duplicate headers
            headerAdded = true;
            return true;
          }
          // Skip standalone "##" lines
          if (trimmed === "##") return false;
          // Skip hidden rows
          const rowMatch = line.match(/^([০-৯১-৯\d]+)[.।]\s*([^→\-—–:]+?)[\s]*[—–\-→:]/);
          if (rowMatch) {
            const label = rowMatch[2].trim();
            const number = rowMatch[1];
            const rowKey = `${key}-${number}-${label}`;
            if (hiddenRows.has(rowKey)) return false;
            for (const dl of defaultLabels) {
              const dlKey = `${key}-${dl.number}-${dl.label}`;
              if (hiddenRows.has(dlKey) && dl.label.replace(/\*+/g, "").trim() === label.replace(/\*+/g, "").trim()) return false;
            }
            // Extract the value part after the separator
            const valueMatch = line.match(/[—–\-→:]\s*(.*)$/);
            if (valueMatch) {
              let val = valueMatch[1].trim();
              val = val.replace(/—/g, "").replace(/\s*\+\s*/g, "+").trim();
              val = val.replace(/^\++/, "").replace(/\++$/, "").trim();
              if (!val || val === "-") return false;
            } else {
              return false;
            }
          }
          return true;
        });
      }

      // Get extra param rows — only include params whose value ACTUALLY differs from default ("")
      const extras = getExtraParamRows(blueprintParams, key, touchedParams);
      const visibleExtras = extras.filter(e => {
        const paramKey = `${key}-param-${e.paramKey || e.label}`;
        return !hiddenRows.has(paramKey);
      }).filter(e => {
        const val = e.value?.trim();
        if (!val || val === "—" || val === "-") return false;
        if (e.paramKey) {
          const pk = e.paramKey as keyof BlueprintParams;
          const rawValue = blueprintParams[pk];
          const defaultValue = DEFAULT_PARAMS[pk];
          if (rawValue === defaultValue) return false;
          if (!rawValue || rawValue === "—") return false;
        }
        return true;
      });

      // Build section output
      const contentLines = sectionLines.filter(l => {
        const t = l.trim();
        return !t.startsWith("##") && !Object.values(SECTION_HEADER_MAP).some(h => h.replace(/^##\s*/, "").trim() === t) && t.length > 0;
      });
      const hasContent = contentLines.length > 0 || visibleExtras.length > 0;
      if (!hasContent) continue;

      // Ensure exactly one header line
      const headerLine = SECTION_HEADER_MAP[key];
      // Remove all existing header-like lines and prepend one clean header
      sectionLines = sectionLines.filter(l => {
        const t = l.trim();
        if (t.startsWith("##")) return false;
        if (Object.values(SECTION_HEADER_MAP).some(h => h.replace(/^##\s*/, "").trim() === t)) return false;
        return true;
      });
      sectionLines.unshift(headerLine);

      result += (result ? "\n\n" : "") + sectionLines.join("\n");

      if (visibleExtras.length > 0) {
        const existingCount = (sectionLines.join("\n").match(/^[০-৯১-৯\d]+[.।]/gm) || []).length;
        const paramLines = visibleExtras.map((e, i) => {
          const serial = BN[existingCount + i] || String(existingCount + i + 1);
          // Clean value: remove "—" placeholders from display value
          let cleanVal = e.value.replace(/—/g, "").trim();
          cleanVal = cleanVal.replace(/^\s*\+\s*/, "").trim();
          return `${serial}. ${e.label} — ${cleanVal}`;
        });
        result += "\n" + paramLines.join("\n");
      }
    }
    return result || content || "";
  }, [sections, blueprintParams, content, hiddenRows, touchedParams]);

  /** Handle toggling hide/show for a row */
  const handleToggleHide = useCallback((rowKey: string) => {
    setHiddenRows(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        // Unhiding — remove from hidden set, then auto-lock
        next.delete(rowKey);
        setTimeout(() => onUpdateAndLock(content), 200);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  }, [content, onUpdateAndLock]);

  /** Mark blueprint as dirty after any edit — no auto-lock */
  const handleAutoLock = useCallback(() => {
    setIsDirty(true);
  }, []);

  /** Manual Update button: lock + save to history */
  const handleManualUpdate = useCallback(() => {
    onLock();
    lastSavedSnapshotKeyRef.current = currentSnapshotKey;
    saveSnapshot(content || "", blueprintParams as unknown as Record<string, string>, "আপডেট", totalConcepts);
    setIsDirty(false);
    toast({ title: "✅ আপডেট ও লক হয়েছে", description: "ব্লুপ্রিন্ট সংরক্ষিত ও লক করা হয়েছে।" });
  }, [onLock, content, blueprintParams, saveSnapshot, totalConcepts, currentSnapshotKey]);

  /** Add a custom row (new label/point) to a section */
  const handleAddCustomRow = useCallback((sectionKey: SectionKey, label: string) => {
    const sec = sections[sectionKey];
    const BN = ["১","২","৩","৪","৫","৬","৭","৮","৯","১০","১১","১২","১৩","১৪","১৫","১৬","১৭","১৮","১৯","২০"];
    // Count existing rows to get next serial — include default labels, extra param rows, AND existing custom rows
    const existingCount = (sec.content.match(/^[০-৯১-৯\d]+[.।]/gm) || []).length;
    const defaultCount = DEFAULT_LABELS_MAP[sectionKey]?.length || 0;
    const extraParamCount = (SECTION_PARAMS[sectionKey] || []).length;
    const totalCount = Math.max(existingCount, defaultCount) + extraParamCount;
    const serial = BN[totalCount] || String(totalCount + 1);
    const newLine = `${serial}. ${label} — `;

    const updatedSections = { ...sections };

    const base = sec.content ? sec.content.trimEnd() : "";
    const nextSectionContent = base
      ? `${base}\n${newLine}`
      : `${SECTION_HEADER_MAP[sectionKey]}\n${newLine}`;

    updatedSections[sectionKey] = {
      ...updatedSections[sectionKey],
      content: nextSectionContent,
    };

    const contentKeys: SectionKey[] = ["ka", "kha", "ga", "gha"];
    const fullContent = contentKeys
      .map((k) => ensureSectionHeader(k, updatedSections[k].content))
      .filter(Boolean)
      .join("\n\n");

    onDirectEdit(fullContent);
    toast({
      title: "✅ নতুন পয়েন্ট যোগ হয়েছে",
      description: `"${label}" সারণীতে যোগ করা হয়েছে।`,
    });
  }, [sections, onDirectEdit]);

  // Auto-sync: when content OR params change and a library blueprint is loaded, auto-update library
  useEffect(() => {
    if (!loadedBlueprintId) return;
    const existing = blueprints.find(bp => bp.id === loadedBlueprintId);
    if (!existing) return;
    const fullContent = buildCopyText();
    if (!fullContent.trim()) return;
    // Only update if content actually differs (even a single character)
    const currentNorm = fullContent.trim().replace(/\s+/g, " ").toLowerCase();
    const savedNorm = existing.content.trim().replace(/\s+/g, " ").toLowerCase();
    if (currentNorm !== savedNorm) {
      updateBlueprint(loadedBlueprintId, fullContent);
    }
  }, [content, blueprintParams, loadedBlueprintId, blueprints, updateBlueprint, buildCopyText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handlePasteBlueprint = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast({ title: "⚠️ খালি ক্লিপবোর্ড", description: "Clipboard-এ কোনো টেক্সট নেই।" });
        return;
      }

      // Build reverse maps: Bengali label → paramKey, Bengali value → raw value
      const labelToParamKey: Record<string, keyof BlueprintParams> = {};
      // From PARAM_SECTION_MAP
      for (const [pk, meta] of Object.entries(PARAM_SECTION_MAP)) {
        const cleanLabel = meta.label.replace(/\*+/g, "").trim();
        labelToParamKey[cleanLabel] = pk as keyof BlueprintParams;
      }
      // From DEFAULT_LABELS_MAP (these labels may differ from PARAM_SECTION_MAP)
      for (const labels of Object.values(DEFAULT_LABELS_MAP)) {
        for (const dl of labels) {
          if (dl.paramKey) {
            const cleanLabel = dl.label.replace(/\*+/g, "").trim();
            if (!labelToParamKey[cleanLabel]) {
              labelToParamKey[cleanLabel] = dl.paramKey as keyof BlueprintParams;
            }
          }
        }
      }

      const bnValueToRaw: Record<string, string> = {};
      for (const [raw, bn] of Object.entries(FULL_VALUE_DISPLAY)) {
        if (!bnValueToRaw[bn]) bnValueToRaw[bn] = raw;
      }

      // Parse each line for param rows: "N. label — value"
      const lines = text.split("\n");
      const parsedParams: Record<string, string> = {};
      const newTouched = new Set<string>();
      const nonParamLines: string[] = []; // Lines that are NOT param rows (headers, custom rows, etc.)

      for (const line of lines) {
        const trimmed = line.trim();

        // Keep empty lines and section headers as structural content
        if (!trimmed || trimmed.startsWith("##")) {
          nonParamLines.push(line);
          continue;
        }

        // Match: Bengali/ASCII number + dot + label + separator + value
        const match = trimmed.match(/^[০-৯\d]+[.।]\s*(.+?)\s*[—–\-→:]\s*(.*)$/);
        if (match) {
          const label = match[1].replace(/\*+/g, "").trim();
          const valueStr = match[2].trim();
          const paramKey = labelToParamKey[label];

          if (paramKey && valueStr && valueStr !== "—" && valueStr !== "-") {
            // This is a param row — extract value, don't put in content
            const parts = valueStr.split(/\s*\+\s*/).map(part => bnValueToRaw[part.trim()] || part.trim());
            parsedParams[paramKey] = parts.join(",");
            newTouched.add(paramKey);
          } else if (!paramKey) {
            // Custom row (not a known param) — keep in content
            nonParamLines.push(line);
          }
          // If paramKey but empty value, skip entirely
          continue;
        }

        // Non-numbered line that's not a header — keep as structural
        nonParamLines.push(line);
      }

      console.log("[Paste] Parsed params:", Object.keys(parsedParams).length, parsedParams);

      // Apply parsed params to dropdowns
      if (onParamChange) {
        // First reset all to defaults so old values don't linger
        const allParamKeys = Object.keys(DEFAULT_PARAMS) as (keyof BlueprintParams)[];
        for (const pk of allParamKeys) {
          if (parsedParams[pk]) {
            onParamChange(pk, parsedParams[pk]);
          } else {
            onParamChange(pk, DEFAULT_PARAMS[pk]);
          }
        }
        setTouchedParams(newTouched);
      }

      // Set only structural content (headers + custom rows), NOT param rows
      // This avoids duplication since params are rendered from blueprintParams state
      const structuralContent = nonParamLines.join("\n").trim();
      if (structuralContent) {
        onDirectEdit(structuralContent);
      }

      onLock();
      saveSnapshot(
        structuralContent || "",
        parsedParams as Record<string, string>,
        "পেস্ট রিস্টোর"
      );
      setIsDirty(false);
      toast({
        title: "📋 পেস্ট সফল!",
        description: `${Object.keys(parsedParams).length}টি প্যারামিটার সফলভাবে রিস্টোর হয়েছে।`,
      });
    } catch {
      toast({ title: "❌ পেস্ট ব্যর্থ", description: "Clipboard access denied। ব্রাউজার permission চেক করুন।" });
    }
  };

  const handleUpdate = () => {
    if (editContent.trim()) {
      onUpdateAndLock(editContent.trim());
      saveSnapshot(editContent.trim(), blueprintParams as unknown as Record<string, string>, "ম্যানুয়াল আপডেট");
      setIsEditing(false);
      setIsDirty(false);
    }
  };

  const handleAdd = () => {
    if (editContent.trim()) {
      onAddAndLock(editContent.trim());
      saveSnapshot(editContent.trim(), blueprintParams as unknown as Record<string, string>, "নতুন যোগ");
      setIsEditing(false);
      setIsDirty(false);
    }
  };

  const startEditing = () => {
    if (isLocked) onUnlock();
    setEditContent(content);
    setIsEditing(true);
  };

  // No more empty state — always show the fixed-label table structure
  // The table skeleton is always visible with default labels

  // Editing mode
  if (isEditing) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-secondary/30">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">✏️ ব্লুপ্রিন্ট এডিট</span>
          <button onClick={() => setIsEditing(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="আপনার ব্লুপ্রিন্ট এখানে লিখুন বা পেস্ট করুন..."
          className="w-full resize-none border-0 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none scrollbar-thin"
          rows={10}
        />
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-border/30">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors">বাতিল</button>
          {content ? (
            <button
              onClick={handleUpdate}
              disabled={!editContent.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Update
            </button>
          ) : null}
          <button
            onClick={handleAdd}
            disabled={!editContent.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    );
  }

  // Portal target for action buttons in Control Center header
  const portalTarget = typeof document !== "undefined" ? document.getElementById("blueprint-control-center-actions") : null;

  const actionButtons = (
    <>
      {/* Blueprint Library */}
      <BlueprintLibraryPopover
        currentContent={content}
        onLoadBlueprint={(loadedContent, loadedId) => {
          onDirectEdit(loadedContent);
          setLoadedBlueprintId(loadedId || null);
        }}
        isStreaming={isStreaming}
        blueprints={blueprints}
        onSave={(name, libContent) => {
          const entry = saveBlueprint(name, libContent);
          setLoadedBlueprintId(entry.id);
        }}
        onRemove={removeBlueprint}
        onSetDefault={(blueprintContent) => {
          saveAsDefault(blueprintContent);
          toast({
            title: "⭐ ডিফল্ট সেট হয়েছে",
            description: "এই ব্লুপ্রিন্ট এখন নতুন সেশনে ডিফল্ট হিসেবে লোড হবে।",
          });
        }}
        defaultBlueprintContent={savedDefault?.content || null}
      />
      {/* Quick Save */}
      {!isStreaming && (
        <button
          onClick={handleQuickSave}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, hsl(210 75% 55%), hsl(220 70% 50%))",
            color: "hsl(0 0% 100%)",
            border: "1px solid hsl(210 60% 58% / 0.4)",
            boxShadow: "0 3px 12px -3px hsl(210 70% 40% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
          }}
          title="বর্তমান ব্লুপ্রিন্ট লাইব্রেরিতে সেভ করুন"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>
      )}
      {/* Default */}
      {!isStreaming && (
        <button
          onClick={savedDefault ? handleClearDefault : handleSetDefault}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: savedDefault
              ? "linear-gradient(135deg, hsl(40 85% 52%), hsl(30 80% 48%))"
              : "linear-gradient(135deg, hsl(45 70% 55%), hsl(35 65% 50%))",
            color: "hsl(0 0% 100%)",
            border: savedDefault
              ? "1px solid hsl(40 70% 55% / 0.4)"
              : "1px solid hsl(45 55% 55% / 0.4)",
            boxShadow: savedDefault
              ? "0 3px 12px -3px hsl(40 80% 40% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.2)"
              : "0 3px 12px -3px hsl(45 65% 40% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
          }}
          title={savedDefault ? "ডিফল্ট ব্লুপ্রিন্ট সরান" : "বর্তমান ব্লুপ্রিন্ট ডিফল্ট হিসেবে সেট করুন"}
        >
          <Star className={cn("w-3.5 h-3.5", savedDefault && "fill-current")} />
          <span className="hidden sm:inline">Default</span>
        </button>
      )}
      {/* Reset */}
      {!isStreaming && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, hsl(0 65% 55%), hsl(350 60% 50%))",
            color: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 55% 55% / 0.4)",
            boxShadow: "0 3px 12px -3px hsl(0 60% 40% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
          }}
          title="সব Value মুছে ফেলুন — Serial ও Label অক্ষুণ্ণ থাকবে"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}
      {/* Auto-Fill removed from here — moved to Blueprint Board header */}
    </>
  );

  // Display mode — THREE-COLUMN GRID
  return (
    <>
    {portalTarget && createPortal(actionButtons, portalTarget)}
    <div className={cn("rounded-3xl overflow-hidden", isLocked && "blueprint-locked")}
      style={{
        background: "linear-gradient(160deg, hsl(0 0% 100% / 0.92), hsl(250 30% 99% / 0.88), hsl(280 25% 98% / 0.85))",
        border: isLocked ? "1.5px solid hsl(250 55% 78% / 0.4)" : "1px solid hsl(260 30% 90% / 0.5)",
        boxShadow: "0 8px 40px -8px hsl(250 40% 30% / 0.1), 0 2px 12px -2px hsl(280 35% 35% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Premium top accent line */}
      <div className="h-[2px] w-full" style={{
        background: "linear-gradient(90deg, hsl(250 80% 60%), hsl(280 70% 55%), hsl(320 72% 60%), hsl(35 85% 55%), hsl(160 60% 45%))",
      }} />

      {/* Header — sticky */}
      <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-20"
        style={{
          background: "linear-gradient(135deg, hsl(245 25% 97% / 0.95), hsl(265 20% 96% / 0.9))",
          borderBottom: "1px solid hsl(260 25% 88% / 0.3)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl" style={{
            background: "linear-gradient(135deg, hsl(250 70% 58%), hsl(280 60% 55%), hsl(300 55% 55%))",
            boxShadow: "0 4px 14px -3px hsl(260 60% 50% / 0.4)",
          }}>
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-[0.2em]"
              style={{
                background: "linear-gradient(135deg, hsl(250 65% 42%), hsl(280 55% 48%), hsl(310 50% 50%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Blueprint Board
            </span>
            <span className="text-[8px] font-medium tracking-wider" style={{ color: "hsl(260 30% 60%)" }}>
              CREATIVE CONTROL CENTER
            </span>
          </div>
          {/* Update button — between title and action buttons */}
          {isDirty && !isStreaming && (
            <button
              onClick={handleManualUpdate}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.04] active:scale-[0.96] animate-pulse ml-2"
              style={{
                background: "linear-gradient(135deg, hsl(145 70% 42%), hsl(160 65% 38%))",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(150 60% 50% / 0.5)",
                boxShadow: "0 4px 16px -4px hsl(150 65% 35% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
              }}
              title="পরিবর্তন সংরক্ষণ ও লক করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              আপডেট
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Undo (in-memory) */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 active:scale-90 relative"
            style={{ color: "hsl(250 50% 45%)" }}
            title={`Undo (${undoStack.length})`}
          >
            <Undo2 className="w-4 h-4" />
            {undoStack.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] font-bold flex items-center justify-center text-white" style={{ background: "hsl(250 55% 50%)" }}>
                {undoStack.length > 9 ? "9+" : undoStack.length}
              </span>
            )}
          </button>
          {/* Redo (in-memory) */}
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:scale-110 active:scale-90 relative"
            style={{ color: "hsl(250 50% 45%)" }}
            title={`Redo (${redoStack.length})`}
          >
            <Redo2 className="w-4 h-4" />
            {redoStack.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] font-bold flex items-center justify-center text-white" style={{ background: "hsl(170 55% 40%)" }}>
                {redoStack.length > 9 ? "9+" : redoStack.length}
              </span>
            )}
          </button>
          {/* Persistent History */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:scale-110 active:scale-90 relative"
            style={{
              color: "hsl(260 55% 50%)",
              background: "linear-gradient(135deg, hsl(260 40% 95%), hsl(280 35% 93%))",
              border: "1px solid hsl(260 30% 88% / 0.4)",
            }}
            title="ব্লুপ্রিন্ট ইতিহাস"
          >
            <History className="w-4 h-4" />
            {blueprintHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center text-white"
                style={{ background: "hsl(260 60% 55%)" }}>
                {blueprintHistory.length > 9 ? "9+" : blueprintHistory.length}
              </span>
            )}
          </button>
          {/* Batch AI Suggest — pre-fetch suggestions for all fields */}
          {!isStreaming && content && (
            <button
              onClick={handleBulkAutoFill}
              disabled={isBulkFilling}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 disabled:cursor-wait"
              style={{
                background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(290 65% 50%), hsl(310 60% 52%))",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(280 60% 58% / 0.5)",
                boxShadow: "0 3px 14px -3px hsl(280 65% 45% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
              }}
              title="সব ফিল্ডের জন্য একসাথে AI সাজেশন আনুন — তারপর ✨ বাটনে সিলেক্ট করুন"
            >
              <Wand2 className={cn("w-3.5 h-3.5", isBulkFilling && "animate-spin")} />
              <span>{isBulkFilling ? "আনা হচ্ছে..." : "✨ সব সাজেশন"}</span>
            </button>
          )}
          <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, hsl(210 70% 55%), hsl(230 65% 52%))",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(210 55% 58% / 0.4)",
                boxShadow: "0 3px 12px -3px hsl(210 65% 45% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
              }}
              title="Copy as plaintext"
            >
              {copied ? <Check className="w-3 h-3" style={{ color: "hsl(160 60% 40%)" }} /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          <button
            onClick={handlePasteBlueprint}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, hsl(160 60% 45%), hsl(180 55% 42%))",
              color: "white",
              border: "1px solid hsl(160 50% 55% / 0.4)",
              boxShadow: "0 2px 10px -2px hsl(160 60% 45% / 0.35)",
            }}
            title="Paste blueprint from clipboard"
          >
            <ClipboardPaste className="w-3 h-3" />
            Paste
          </button>
        </div>
      </div>

      {/* Streaming indicator */}
      {isStreaming && !content && (
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="w-2 h-2 rounded-full agent-pulse" style={{ background: "hsl(250 80% 60%)" }} />
          <span className="text-xs font-medium" style={{ color: "hsl(250 60% 50%)" }}>ব্লুপ্রিন্ট তৈরি হচ্ছে...</span>
        </div>
      )}

      {/* VERTICAL STACKED LAYOUT - ক → খ → গ — Always visible with fixed structure */}
      <div className="flex flex-col gap-2 p-3">
        {sectionOrder.map((key) => {
          const section = sections[key];
          const accent = sectionAccents[key];
          const hasContent = !!section.content.trim();
          const isGha = key === "gha";
          const extraRows = isGha ? [] : getExtraParamRows(blueprintParams, key, touchedParams);
          const defaultLabels = isGha ? undefined : DEFAULT_LABELS_MAP[key];
          const isCollapsed = collapsedSections.has(key);
          
          return (
            <div key={key} className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: accent.bg,
                border: `1px solid ${accent.borderColor}`,
                boxShadow: `0 4px 20px -6px ${accent.glowColor}, 0 1px 4px -1px hsl(0 0% 0% / 0.04)`,
              }}
            >
              {/* Section Header — clickable to collapse/expand */}
              <div 
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-colors hover:brightness-[0.97]"
                style={{ 
                  background: accent.headerBg, 
                  borderBottom: isCollapsed ? "none" : `1px solid ${accent.borderColor}`,
                }}
                onClick={() => toggleCollapse(key)}
              >
                <div className="flex items-center gap-2.5">
                  <span 
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{
                      background: accent.labelBg,
                      boxShadow: `0 3px 10px -3px ${accent.glowColor}`,
                    }}
                  >
                    {section.shortLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{accent.iconEmoji}</span>
                    <span 
                      className="text-[11px] font-bold tracking-wide"
                      style={{ color: accent.headerText }}
                    >
                      {section.title}
                    </span>
                  </div>
                  {isGha && (
                    <span className="text-[8px] px-2.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: "linear-gradient(135deg, hsl(0 65% 94%), hsl(15 55% 93%))",
                        color: "hsl(0 55% 42%)",
                        border: "1px solid hsl(0 40% 85% / 0.5)",
                        boxShadow: "0 2px 6px -2px hsl(0 50% 50% / 0.15)",
                      }}>
                      ⚠️ সংঘর্ষে অগ্রাধিকার পাবে
                    </span>
                  )}
              </div>
              {/* Collapse chevron */}
              <ChevronDown
                className="w-4 h-4 shrink-0 transition-transform duration-300"
                style={{
                  color: accent.headerText,
                  opacity: 0.6,
                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                }}
              />
              </div>
              
              {/* Content Area — collapsible */}
              <div
                className="transition-all duration-300 ease-in-out overflow-hidden"
                style={{
                  maxHeight: isCollapsed ? "0px" : "2000px",
                  opacity: isCollapsed ? 0 : 1,
                }}
              >
              <div className="px-3 py-2.5">
                <BlueprintTableRenderer
                  content={hasContent ? section.content : ""}
                  sectionKey={key}
                  onContentChange={(newSectionContent) => {
                    const updatedSections = { ...sections };
                    updatedSections[key] = {
                      ...updatedSections[key],
                      content: ensureSectionHeader(key, newSectionContent),
                    };
                    const allKeys: SectionKey[] = ["ka", "kha", "ga", "gha"];
                    const fullContent = allKeys
                      .map((k) => ensureSectionHeader(k, updatedSections[k].content))
                      .filter(Boolean)
                      .join("\n\n");
                    onDirectEdit(fullContent);
                  }}
                  isLocked={false}
                  extraParamRows={extraRows}
                  defaultLabels={defaultLabels}
                  hiddenRows={hiddenRows}
                  onToggleHide={handleToggleHide}
                  onAutoLock={handleAutoLock}
                  onAddCustomRow={isGha ? undefined : (label) => handleAddCustomRow(key as "ka" | "kha" | "ga", label)}
                  customParamOptions={isGha ? undefined : customOptions}
                  onAddCustomOption={isGha ? undefined : addCustomOption}
                  onExtraParamValueChange={isGha ? undefined : (paramKey, newValue) => {
                    if (!onParamChange) return;
                    const pk = paramKey as keyof BlueprintParams;
                    setTouchedParams(prev => new Set(prev).add(pk));
                    const config = PARAM_CONFIGS_MAP[pk];
                    // Multi-select: newValue may be comma-separated labels
                    const parts = newValue.split(",").map(v => v.trim()).filter(Boolean);
                    const resolvedParts = parts.map(part => {
                      if (config) {
                        const optMatch = config.options?.find(o => o.label === part);
                        if (optMatch) return optMatch.value;
                      }
                      const rawKey = Object.entries(PARAM_VALUE_DISPLAY).find(
                        ([, v]) => v === part
                      )?.[0];
                      return rawKey || part;
                    });
                    onParamChange(pk, resolvedParts.join(","));
                    setIsDirty(true);
                  }}
                  onExtraParamDelete={isGha ? undefined : (paramKey) => {
                    if (!onParamChange) return;
                    const pk = paramKey as keyof BlueprintParams;
                    setTouchedParams(prev => { const next = new Set(prev); next.delete(pk); return next; });
                    onParamChange(pk, DEFAULT_PARAMS[pk]);
                  }}
                  onEditCustomOption={isGha ? undefined : (paramKey, oldValue, newLabel) => {
                    editCustomOption(paramKey, oldValue, newLabel);
                  }}
                  onDeleteCustomOption={isGha ? undefined : (paramKey, value) => {
                    removeCustomOption(paramKey, value);
                  }}
                  onPinOption={isGha ? undefined : (paramKey, label, value) => {
                    pinDefault(paramKey, label, value);
                    // Also apply the pinned value immediately
                    if (onParamChange) {
                      const pk = paramKey as keyof BlueprintParams;
                      setTouchedParams(prev => new Set(prev).add(pk));
                      const config = PARAM_CONFIGS_MAP[pk];
                      if (config) {
                        const optMatch = config.options?.find(o => o.label === label);
                        if (optMatch) { onParamChange(pk, optMatch.value); return; }
                      }
                      onParamChange(pk, value || label);
                    }
                    toast({ title: "📌 ডিফল্ট পিন করা হয়েছে", description: `"${label}" এখন ${paramKey} এর স্থায়ী ডিফল্ট।` });
                  }}
                  onUnpinOption={isGha ? undefined : (paramKey) => {
                    unpinDefault(paramKey);
                    toast({ title: "📌 আনপিন করা হয়েছে", description: `${paramKey} এর পিন করা ডিফল্ট সরানো হয়েছে।` });
                  }}
                  isPinnedOption={isGha ? undefined : (paramKey, value) => isPinnedOption(paramKey, value)}
                  sceneParamsOverrideProp={isGha ? undefined : sceneParamsOverride}
                  blueprintModel={blueprintModel}
                />
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    {/* Persistent History Panel */}
    {showHistory && createPortal(
      <BlueprintHistoryPanel
        history={blueprintHistory}
        loading={historyLoading}
        onRestore={(snapshot) => {
          try {
            const restoredContent = snapshot.blueprint_content || "";
            const rawParams = snapshot.blueprint_params || {};
            const safeParams: Record<string, string> = {};
            if (rawParams && typeof rawParams === "object" && !Array.isArray(rawParams)) {
              Object.entries(rawParams).forEach(([k, v]) => {
                if (typeof v === "string") safeParams[k] = v;
                else if (v !== null && v !== undefined) safeParams[k] = String(v);
              });
            }
            isUndoRedoRef.current = 2;
            onDirectEdit(restoredContent);
            if (onParamChange && Object.keys(safeParams).length > 0) {
              Object.entries(safeParams).forEach(([k, v]) => {
                onParamChange(k as keyof BlueprintParams, v);
              });
            }
            // Don't close panel — notification shown inside the panel
          } catch (err) {
            console.error("[BlueprintRestore] Error:", err);
          }
        }}
        onDelete={deleteSnapshot}
        onTogglePin={togglePin}
        onClose={() => setShowHistory(false)}
      />,
      document.body
    )}
    </>
  );
}
