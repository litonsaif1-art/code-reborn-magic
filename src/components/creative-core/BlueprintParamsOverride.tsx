import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, HelpCircle, SlidersHorizontal, Check, X } from "lucide-react";

/** Helper: parse comma-separated multi-value string into array */
function parseMulti(val: string): string[] {
  if (!val) return [];
  return val.split(",").map(v => v.trim()).filter(Boolean);
}

/** Helper: toggle a value in a comma-separated string */
function toggleMulti(current: string, toggleVal: string): string {
  const arr = parseMulti(current);
  const idx = arr.indexOf(toggleVal);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(toggleVal);
  }
  return arr.join(",") || toggleVal;
}

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BlueprintParams {
  // === CORE SETTINGS ===
  voicePresence: "" | "yes" | "no";
  realismLevel: "" | "strict-realism" | "bio-authentic-mutation" | "stylized";
  episodeCount: "" | "1" | "2" | "3" | "series";
  
  // === 🎤 VOICE & NARRATION ===
  voiceLanguage: "" | "bengali" | "english" | "hindi" | "arabic" | "spanish" | "french" | "german" | "japanese" | "korean" | "chinese" | "portuguese" | "russian" | "turkish" | "italian" | "dutch";
  voiceGender: "" | "male" | "female" | "neutral" | "child";
  voiceAge: "" | "young" | "adult" | "mature" | "elderly";
  voiceEmotion: "" | "neutral" | "happy" | "sad" | "angry" | "excited" | "calm" | "fearful" | "surprised" | "loving" | "confident";
  voiceTone: "" | "formal" | "casual" | "dramatic" | "whispery" | "energetic" | "soothing";
  voiceAccent: "" | "native" | "british" | "american" | "australian" | "indian" | "middle-eastern" | "european";
  narratorStyle: "" | "storyteller" | "documentary" | "news-anchor" | "conversational" | "poetic" | "suspenseful";
  
  // === 🌍 LOCATION & SETTING ===
  country: "" | "bangladesh" | "india" | "usa" | "uk" | "uae" | "saudi" | "japan" | "china" | "korea" | "germany" | "france" | "italy" | "spain" | "russia" | "brazil" | "australia" | "canada" | "egypt" | "turkey" | "indonesia";
  locationType: "" | "city" | "village" | "forest" | "beach" | "mountain" | "desert" | "river" | "urban" | "suburban" | "rural";
  locationVibe: "" | "modern" | "traditional" | "futuristic" | "historical" | "natural" | "industrial" | "spiritual";
  weather: "" | "sunny" | "cloudy" | "rainy" | "stormy" | "snowy" | "foggy" | "windy" | "clear";
  season: "" | "spring" | "summer" | "autumn" | "winter" | "monsoon" | "dry";
  
  // === OUTPUT FORMAT ===
  aspectRatio: "" | "16:9" | "9:16" | "1:1" | "4:3" | "21:9";
  duration: "" | "5s" | "15s" | "30s" | "60s" | "custom";
  resolution: "" | "HD" | "FHD" | "4K" | "8K";
  frameRate: "" | "24fps" | "30fps" | "60fps" | "120fps";
  
  // === CAMERA & VISUAL ===
  colorGrade: "" | "neutral" | "warm" | "cool" | "cinematic" | "vintage";

  // === ENVIRONMENT & MOOD ===
  environment: "" | "indoor" | "outdoor" | "studio" | "mixed";
  timeOfDay: "" | "day" | "night" | "golden-hour" | "blue-hour" | "dawn";
  mood: "" | "happy" | "tense" | "peaceful" | "dramatic" | "mysterious";
  
  // === 🚀 VIRAL MASTERY PARAMETERS ===
  // Hook & Attention
  openingStyle: "" | "question" | "shock" | "mystery" | "action" | "emotion";
  curiosityGap: "" | "none" | "mild" | "intense" | "cliffhanger";
  
  // Storytelling Arc
  narrativeArc: "" | "linear" | "non-linear" | "circular" | "twist-ending";
  emotionalJourney: "" | "flat" | "build-up" | "roller-coaster" | "crescendo";
  twistIntensity: "" | "none" | "subtle" | "medium" | "mind-blowing";
  peakMoment: "" | "early" | "middle" | "climax" | "end-reveal";
  
  // Visual Impact
  
  speedDynamics: "" | "normal" | "slow-mo" | "speed-ramp" | "time-lapse";
  transitionStyle: "" | "cut" | "fade" | "creative" | "seamless";
  vfxIntensity: "" | "none" | "subtle" | "moderate" | "heavy";
  
  // Engagement Triggers
  relatability: "" | "niche" | "moderate" | "universal" | "deeply-personal";
  nostalgiaLevel: "" | "none" | "hint" | "strong" | "core-theme";
  shockValue: "" | "none" | "mild" | "moderate" | "high";
  shareability: "" | "low" | "medium" | "high" | "viral-bait";
  
  // Platform Optimization
  loopFriendly: "" | "no" | "soft-loop" | "perfect-loop";
  pacing: "" | "slow" | "moderate" | "fast" | "hyper";
  ctaPlacement: "" | "none" | "end" | "middle" | "throughout";
  soundTrend: "" | "original" | "trending" | "remix" | "iconic";
  
  // === ⚡ FUTURISTIC SYSTEMS ===
  futuristicSystems: "" | "none" | "temporal-engine" | "dimensional-mapping" | "ghost-protocol" | "quantum-density" | "network-dominance" | "reality-simulation";
  
  // === 🎯 NEW: ADVANCED CREATIVE PARAMETERS ===
  patternDisruption: "" | "none" | "subtle-twist" | "shocking-ending" | "full-perspective-shift";
  audiencePsychologyTrigger: "" | "deep-asmr" | "primal-fear" | "intense-curiosity" | "viral-attraction";
  lensAperture: "" | "ultra-wide-16mm" | "standard-35mm" | "portrait-85mm" | "macro-100mm";
  lightSourceDirection: "" | "moody-side-light" | "dramatic-backlit" | "soft-ambient" | "high-contrast-rim";
  
  // === 💎 SUPREME POWER PARAMETERS ===
  visualDramaLevel: "" | "subtle-realism" | "natural-contrast" | "high-key-cinematic" | "gritty-noir" | "ethereal-dreamy";
  informationDensity: "" | "minimalist" | "focused-detail" | "rich-environment" | "chaotic-detail";
  cameraEyeMovement: "" | "static-witness" | "slow-breathing" | "handheld-tremor" | "predator-chase" | "mechanical-slide";
  audioImmersionMode: "" | "isolated-asmr" | "spatial-surround" | "muffled-underwater" | "sharp-transient" | "high-octane-bass";
  viralHookArchetype: "" | "impossible-action" | "uncanny-appearance" | "satisfying-destruction" | "emotional-gut-punch" | "visual-loophole";

  // === 🔥 মহা-শক্তি (MEGA POWER) PARAMETERS ===
  backgroundPeople: string;
  visualElements: string;
  creativeCatalyst: string;
  fixedTheme: string;
  centralAttraction: string;
  fixedCharacter: string;
  forbiddenElements: string;

  // === 🆕 NEW POWERFUL PARAMETERS ===
  coreWorkflow: string;
  coreEventFlow: string;
  immutableMutableElements: string;
  mutableElements: string;
  variableCharacterList: string;
}

export const DEFAULT_PARAMS: BlueprintParams = {
  // Core
  voicePresence: "",
  realismLevel: "",
  episodeCount: "",
  // Voice & Narration
  voiceLanguage: "",
  voiceGender: "",
  voiceAge: "",
  voiceEmotion: "",
  voiceTone: "",
  voiceAccent: "",
  narratorStyle: "",
  // Location & Setting
  country: "",
  locationType: "",
  locationVibe: "",
  weather: "",
  season: "",
  // Output
  aspectRatio: "",
  duration: "",
  resolution: "",
  frameRate: "",
  // Camera
  colorGrade: "",
  // Environment
  environment: "",
  timeOfDay: "",
  mood: "",
  // Viral Mastery - Hook
  openingStyle: "",
  curiosityGap: "",
  // Viral Mastery - Story
  narrativeArc: "",
  emotionalJourney: "",
  twistIntensity: "",
  peakMoment: "",
  // Viral Mastery - Visual
  speedDynamics: "",
  transitionStyle: "",
  vfxIntensity: "",
  // Viral Mastery - Engagement
  relatability: "",
  nostalgiaLevel: "",
  shockValue: "",
  shareability: "",
  // Viral Mastery - Platform
  loopFriendly: "",
  pacing: "",
  ctaPlacement: "",
  soundTrend: "",
  // Futuristic Systems
  futuristicSystems: "",
  // Advanced Creative
  patternDisruption: "",
  audiencePsychologyTrigger: "",
  lensAperture: "",
  lightSourceDirection: "",
  // Supreme Power
  visualDramaLevel: "",
  informationDensity: "",
  cameraEyeMovement: "",
  audioImmersionMode: "",
  viralHookArchetype: "",
  // Mega Power
  backgroundPeople: "",
  visualElements: "",
  creativeCatalyst: "",
  fixedTheme: "",
  centralAttraction: "",
  fixedCharacter: "",
  forbiddenElements: "",
  // New Params
  coreWorkflow: "",
  coreEventFlow: "",
  immutableMutableElements: "",
  mutableElements: "",
  variableCharacterList: "",
};

interface ParamOption {
  value: string;
  label: string;
  labelBn?: string;
}

interface ParamConfig {
  key: keyof BlueprintParams;
  title: string;
  titleBn: string;
  dharaRef: string;
  dharaDesc: string;
  options: ParamOption[];
}

const PARAM_CONFIGS: ParamConfig[] = [
  // === CORE SETTINGS ===
  {
    key: "voicePresence",
    title: "Voice Presence",
    titleBn: "কথাবার্তার উপস্থিতি",
    dharaRef: "ধারা ৯(ক)",
    dharaDesc: "সারণী (ক)-এ ভয়েস/ডায়ালগের উপস্থিতি নির্ধারণ করে",
    options: [
      { value: "yes", label: "YES", labelBn: "হ্যাঁ" },
      { value: "no", label: "NO", labelBn: "না" },
    ],
  },
  {
    key: "realismLevel",
    title: "Realism Mode",
    titleBn: "রিয়েলিজম মোড",
    dharaRef: "ধারা ১২",
    dharaDesc: "ভিজুয়াল ফিডেলিটি ও মিউটেশন লেভেল নির্ধারণ করে",
    options: [
      { value: "strict-realism", label: "STRICT", labelBn: "কঠোর" },
      { value: "bio-authentic-mutation", label: "MUTATION", labelBn: "মিউটেশন" },
      { value: "stylized", label: "STYLIZED", labelBn: "স্টাইলাইজড" },
    ],
  },
  {
    key: "episodeCount",
    title: "Episode Count",
    titleBn: "পর্ব সংখ্যা",
    dharaRef: "ধারা ২০",
    dharaDesc: "আউটপুট কাঠামোতে পর্ব/সিরিজ বিভাজন নির্ধারণ করে",
    options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "series", label: "SERIES", labelBn: "সিরিজ" },
    ],
  },
  // === 🎤 VOICE & NARRATION ===
  {
    key: "voiceLanguage",
    title: "Voice Language",
    titleBn: "ভয়েস ভাষা",
    dharaRef: "ভয়েস ১(ক)",
    dharaDesc: "ন্যারেশন বা ডায়ালগের ভাষা নির্বাচন",
    options: [
      { value: "bengali", label: "বাংলা", labelBn: "Bengali" },
      { value: "english", label: "English", labelBn: "ইংরেজি" },
      { value: "hindi", label: "हिंदी", labelBn: "Hindi" },
      { value: "arabic", label: "العربية", labelBn: "Arabic" },
      { value: "spanish", label: "Español", labelBn: "Spanish" },
      { value: "french", label: "Français", labelBn: "French" },
      { value: "german", label: "Deutsch", labelBn: "German" },
      { value: "japanese", label: "日本語", labelBn: "Japanese" },
      { value: "korean", label: "한국어", labelBn: "Korean" },
      { value: "chinese", label: "中文", labelBn: "Chinese" },
      { value: "portuguese", label: "Português", labelBn: "Portuguese" },
      { value: "russian", label: "Русский", labelBn: "Russian" },
      { value: "turkish", label: "Türkçe", labelBn: "Turkish" },
      { value: "italian", label: "Italiano", labelBn: "Italian" },
      { value: "dutch", label: "Nederlands", labelBn: "Dutch" },
    ],
  },
  {
    key: "voiceGender",
    title: "Voice Gender",
    titleBn: "ভয়েস লিঙ্গ",
    dharaRef: "ভয়েস ১(খ)",
    dharaDesc: "বক্তার কণ্ঠস্বরের ধরন",
    options: [
      { value: "male", label: "MALE", labelBn: "পুরুষ" },
      { value: "female", label: "FEMALE", labelBn: "মহিলা" },
      { value: "neutral", label: "NEUTRAL", labelBn: "নিউট্রাল" },
      { value: "child", label: "CHILD", labelBn: "শিশু" },
    ],
  },
  {
    key: "voiceAge",
    title: "Voice Age",
    titleBn: "ভয়েস বয়স",
    dharaRef: "ভয়েস ১(গ)",
    dharaDesc: "বক্তার বয়সভিত্তিক কণ্ঠস্বর",
    options: [
      { value: "young", label: "YOUNG", labelBn: "তরুণ" },
      { value: "adult", label: "ADULT", labelBn: "প্রাপ্তবয়স্ক" },
      { value: "mature", label: "MATURE", labelBn: "পরিণত" },
      { value: "elderly", label: "ELDERLY", labelBn: "বৃদ্ধ" },
    ],
  },
  {
    key: "voiceEmotion",
    title: "Voice Emotion",
    titleBn: "ভয়েস আবেগ",
    dharaRef: "ভয়েস ২(ক)",
    dharaDesc: "কণ্ঠে প্রকাশিত আবেগের ধরন",
    options: [
      { value: "neutral", label: "NEUTRAL", labelBn: "স্বাভাবিক" },
      { value: "happy", label: "HAPPY", labelBn: "আনন্দিত" },
      { value: "sad", label: "SAD", labelBn: "দুঃখিত" },
      { value: "angry", label: "ANGRY", labelBn: "রাগান্বিত" },
      { value: "excited", label: "EXCITED", labelBn: "উত্তেজিত" },
      { value: "calm", label: "CALM", labelBn: "শান্ত" },
      { value: "fearful", label: "FEARFUL", labelBn: "ভীত" },
      { value: "surprised", label: "SURPRISED", labelBn: "বিস্মিত" },
      { value: "loving", label: "LOVING", labelBn: "স্নেহপূর্ণ" },
      { value: "confident", label: "CONFIDENT", labelBn: "আত্মবিশ্বাসী" },
    ],
  },
  {
    key: "voiceTone",
    title: "Voice Tone",
    titleBn: "ভয়েস টোন",
    dharaRef: "ভয়েস ২(খ)",
    dharaDesc: "কথা বলার ধরন ও স্টাইল",
    options: [
      { value: "formal", label: "FORMAL", labelBn: "ফর্মাল" },
      { value: "casual", label: "CASUAL", labelBn: "ক্যাজুয়াল" },
      { value: "dramatic", label: "DRAMATIC", labelBn: "নাটকীয়" },
      { value: "whispery", label: "WHISPERY", labelBn: "ফিসফিস" },
      { value: "energetic", label: "ENERGETIC", labelBn: "উদ্যমী" },
      { value: "soothing", label: "SOOTHING", labelBn: "প্রশান্তিদায়ক" },
    ],
  },
  {
    key: "voiceAccent",
    title: "Voice Accent",
    titleBn: "ভয়েস অ্যাক্সেন্ট",
    dharaRef: "ভয়েস ২(গ)",
    dharaDesc: "উচ্চারণের আঞ্চলিক ধরন",
    options: [
      { value: "native", label: "NATIVE", labelBn: "দেশীয়" },
      { value: "british", label: "BRITISH", labelBn: "ব্রিটিশ" },
      { value: "american", label: "AMERICAN", labelBn: "আমেরিকান" },
      { value: "australian", label: "AUSTRALIAN", labelBn: "অস্ট্রেলিয়ান" },
      { value: "indian", label: "INDIAN", labelBn: "ভারতীয়" },
      { value: "middle-eastern", label: "MIDDLE-EAST", labelBn: "মধ্যপ্রাচ্য" },
      { value: "european", label: "EUROPEAN", labelBn: "ইউরোপীয়" },
    ],
  },
  {
    key: "narratorStyle",
    title: "Narrator Style",
    titleBn: "ন্যারেটর স্টাইল",
    dharaRef: "ভয়েস ৩(ক)",
    dharaDesc: "গল্প বলার ধরন ও পদ্ধতি",
    options: [
      { value: "storyteller", label: "STORYTELLER", labelBn: "গল্পকার" },
      { value: "documentary", label: "DOCUMENTARY", labelBn: "ডকুমেন্টারি" },
      { value: "news-anchor", label: "NEWS", labelBn: "সংবাদ" },
      { value: "conversational", label: "CONVERSATIONAL", labelBn: "কথোপকথন" },
      { value: "poetic", label: "POETIC", labelBn: "কাব্যিক" },
      { value: "suspenseful", label: "SUSPENSEFUL", labelBn: "সাসপেন্স" },
    ],
  },
  // === 🌍 LOCATION & SETTING ===
  {
    key: "country",
    title: "Country",
    titleBn: "দেশ",
    dharaRef: "লোকেশন ১(ক)",
    dharaDesc: "দৃশ্যের দেশ/অঞ্চল নির্বাচন",
    options: [
      { value: "bangladesh", label: "🇧🇩 Bangladesh", labelBn: "বাংলাদেশ" },
      { value: "india", label: "🇮🇳 India", labelBn: "ভারত" },
      { value: "usa", label: "🇺🇸 USA", labelBn: "আমেরিকা" },
      { value: "uk", label: "🇬🇧 UK", labelBn: "যুক্তরাজ্য" },
      { value: "uae", label: "🇦🇪 UAE", labelBn: "সংযুক্ত আরব" },
      { value: "saudi", label: "🇸🇦 Saudi", labelBn: "সৌদি" },
      { value: "japan", label: "🇯🇵 Japan", labelBn: "জাপান" },
      { value: "china", label: "🇨🇳 China", labelBn: "চীন" },
      { value: "korea", label: "🇰🇷 Korea", labelBn: "কোরিয়া" },
      { value: "germany", label: "🇩🇪 Germany", labelBn: "জার্মানি" },
      { value: "france", label: "🇫🇷 France", labelBn: "ফ্রান্স" },
      { value: "italy", label: "🇮🇹 Italy", labelBn: "ইতালি" },
      { value: "spain", label: "🇪🇸 Spain", labelBn: "স্পেন" },
      { value: "russia", label: "🇷🇺 Russia", labelBn: "রাশিয়া" },
      { value: "brazil", label: "🇧🇷 Brazil", labelBn: "ব্রাজিল" },
      { value: "australia", label: "🇦🇺 Australia", labelBn: "অস্ট্রেলিয়া" },
      { value: "canada", label: "🇨🇦 Canada", labelBn: "কানাডা" },
      { value: "egypt", label: "🇪🇬 Egypt", labelBn: "মিশর" },
      { value: "turkey", label: "🇹🇷 Turkey", labelBn: "তুরস্ক" },
      { value: "indonesia", label: "🇮🇩 Indonesia", labelBn: "ইন্দোনেশিয়া" },
    ],
  },
  {
    key: "locationType",
    title: "Location Type",
    titleBn: "লোকেশন ধরন",
    dharaRef: "লোকেশন ১(খ)",
    dharaDesc: "দৃশ্যের স্থানের প্রকৃতি",
    options: [
      { value: "city", label: "CITY", labelBn: "শহর" },
      { value: "village", label: "VILLAGE", labelBn: "গ্রাম" },
      { value: "forest", label: "FOREST", labelBn: "বন" },
      { value: "beach", label: "BEACH", labelBn: "সমুদ্র সৈকত" },
      { value: "mountain", label: "MOUNTAIN", labelBn: "পাহাড়" },
      { value: "desert", label: "DESERT", labelBn: "মরুভূমি" },
      { value: "river", label: "RIVER", labelBn: "নদী" },
      { value: "urban", label: "URBAN", labelBn: "নগর" },
      { value: "suburban", label: "SUBURBAN", labelBn: "উপনগর" },
      { value: "rural", label: "RURAL", labelBn: "গ্রামীণ" },
    ],
  },
  {
    key: "locationVibe",
    title: "Location Vibe",
    titleBn: "লোকেশন ভাইব",
    dharaRef: "লোকেশন ১(গ)",
    dharaDesc: "স্থানের সামগ্রিক অনুভূতি",
    options: [
      { value: "modern", label: "MODERN", labelBn: "আধুনিক" },
      { value: "traditional", label: "TRADITIONAL", labelBn: "ঐতিহ্যবাহী" },
      { value: "futuristic", label: "FUTURISTIC", labelBn: "ভবিষ্যৎমুখী" },
      { value: "historical", label: "HISTORICAL", labelBn: "ঐতিহাসিক" },
      { value: "natural", label: "NATURAL", labelBn: "প্রাকৃতিক" },
      { value: "industrial", label: "INDUSTRIAL", labelBn: "শিল্প" },
      { value: "spiritual", label: "SPIRITUAL", labelBn: "আধ্যাত্মিক" },
    ],
  },
  {
    key: "weather",
    title: "Weather",
    titleBn: "আবহাওয়া",
    dharaRef: "লোকেশন ২(ক)",
    dharaDesc: "দৃশ্যের আবহাওয়া পরিস্থিতি",
    options: [
      { value: "sunny", label: "SUNNY", labelBn: "রৌদ্রোজ্জ্বল" },
      { value: "cloudy", label: "CLOUDY", labelBn: "মেঘলা" },
      { value: "rainy", label: "RAINY", labelBn: "বৃষ্টি" },
      { value: "stormy", label: "STORMY", labelBn: "ঝড়" },
      { value: "snowy", label: "SNOWY", labelBn: "তুষারপাত" },
      { value: "foggy", label: "FOGGY", labelBn: "কুয়াশা" },
      { value: "windy", label: "WINDY", labelBn: "ঝড়ো হাওয়া" },
      { value: "clear", label: "CLEAR", labelBn: "পরিষ্কার" },
    ],
  },
  {
    key: "season",
    title: "Season",
    titleBn: "ঋতু",
    dharaRef: "লোকেশন ২(খ)",
    dharaDesc: "দৃশ্যের ঋতু নির্বাচন",
    options: [
      { value: "spring", label: "SPRING", labelBn: "বসন্ত" },
      { value: "summer", label: "SUMMER", labelBn: "গ্রীষ্ম" },
      { value: "autumn", label: "AUTUMN", labelBn: "শরৎ" },
      { value: "winter", label: "WINTER", labelBn: "শীত" },
      { value: "monsoon", label: "MONSOON", labelBn: "বর্ষা" },
      { value: "dry", label: "DRY", labelBn: "শুষ্ক" },
    ],
  },
  // === OUTPUT FORMAT ===
  {
    key: "aspectRatio",
    title: "Aspect Ratio",
    titleBn: "অ্যাসপেক্ট রেশিও",
    dharaRef: "ধারা ৫(ক)",
    dharaDesc: "ভিডিও ফ্রেমের দৈর্ঘ্য-প্রস্থের অনুপাত নির্ধারণ করে",
    options: [
      { value: "16:9", label: "16:9", labelBn: "ওয়াইড" },
      { value: "9:16", label: "9:16", labelBn: "ভার্টিক্যাল" },
      { value: "1:1", label: "1:1", labelBn: "স্কয়ার" },
      { value: "4:3", label: "4:3", labelBn: "ক্লাসিক" },
    ],
  },
  {
    key: "duration",
    title: "Duration",
    titleBn: "ভিডিও দৈর্ঘ্য",
    dharaRef: "ধারা ৫(খ)",
    dharaDesc: "প্রতিটি ক্লিপ বা সিকোয়েন্সের সময়কাল",
    options: [
      { value: "5s", label: "5s", labelBn: "৫ সেকেন্ড" },
      { value: "15s", label: "15s", labelBn: "১৫ সেকেন্ড" },
      { value: "30s", label: "30s", labelBn: "৩০ সেকেন্ড" },
      { value: "60s", label: "60s", labelBn: "১ মিনিট" },
    ],
  },
  {
    key: "resolution",
    title: "Resolution",
    titleBn: "রেজোলিউশন",
    dharaRef: "ধারা ৫(গ)",
    dharaDesc: "আউটপুট ভিডিওর পিক্সেল কোয়ালিটি",
    options: [
      { value: "HD", label: "HD", labelBn: "৭২০p" },
      { value: "FHD", label: "FHD", labelBn: "১০৮০p" },
      { value: "4K", label: "4K", labelBn: "৪K" },
      { value: "8K", label: "8K", labelBn: "৮K" },
    ],
  },
  {
    key: "frameRate",
    title: "Frame Rate",
    titleBn: "ফ্রেম রেট",
    dharaRef: "ধারা ৫(ঘ)",
    dharaDesc: "প্রতি সেকেন্ডে ফ্রেম সংখ্যা (fps)",
    options: [
      { value: "24fps", label: "24", labelBn: "সিনেমা" },
      { value: "30fps", label: "30", labelBn: "স্ট্যান্ডার্ড" },
      { value: "60fps", label: "60", labelBn: "স্মুথ" },
      { value: "120fps", label: "120", labelBn: "স্লো-মো" },
    ],
  },
  // === CAMERA & VISUAL ===
  {
    key: "colorGrade",
    title: "Color Grade",
    titleBn: "কালার গ্রেড",
    dharaRef: "ধারা ১০(খ)",
    dharaDesc: "ভিডিওর সামগ্রিক রঙ ও টোন",
    options: [
      { value: "neutral", label: "NEUTRAL", labelBn: "নিউট্রাল" },
      { value: "warm", label: "WARM", labelBn: "উষ্ণ" },
      { value: "cool", label: "COOL", labelBn: "শীতল" },
      { value: "cinematic", label: "CINEMATIC", labelBn: "সিনেমাটিক" },
    ],
  },
  // === ENVIRONMENT & MOOD ===
  {
    key: "environment",
    title: "Environment",
    titleBn: "পরিবেশ",
    dharaRef: "ধারা ১১(ক)",
    dharaDesc: "শ্যুটিং লোকেশনের ধরন",
    options: [
      { value: "indoor", label: "INDOOR", labelBn: "ইনডোর" },
      { value: "outdoor", label: "OUTDOOR", labelBn: "আউটডোর" },
      { value: "studio", label: "STUDIO", labelBn: "স্টুডিও" },
      { value: "mixed", label: "MIXED", labelBn: "মিক্সড" },
    ],
  },
  {
    key: "timeOfDay",
    title: "Time of Day",
    titleBn: "দিনের সময়",
    dharaRef: "ধারা ১১(খ)",
    dharaDesc: "দৃশ্যের সময়কাল ও আলোর অবস্থা",
    options: [
      { value: "day", label: "DAY", labelBn: "দিন" },
      { value: "night", label: "NIGHT", labelBn: "রাত" },
      { value: "golden-hour", label: "GOLDEN", labelBn: "সোনালি" },
      { value: "blue-hour", label: "BLUE", labelBn: "নীল" },
    ],
  },
  {
    key: "mood",
    title: "Mood",
    titleBn: "মুড/আবেগ",
    dharaRef: "ধারা ১১(গ)",
    dharaDesc: "দৃশ্যের আবেগময় পরিবেশ ও অনুভূতি",
    options: [
      { value: "happy", label: "HAPPY", labelBn: "আনন্দময়" },
      { value: "tense", label: "TENSE", labelBn: "উত্তেজনাপূর্ণ" },
      { value: "peaceful", label: "PEACEFUL", labelBn: "শান্ত" },
      { value: "dramatic", label: "DRAMATIC", labelBn: "নাটকীয়" },
    ],
  },
  // === 🚀 VIRAL MASTERY: HOOK & ATTENTION ===
  {
    key: "openingStyle",
    title: "Opening Style",
    titleBn: "শুরুর ধরন",
    dharaRef: "ভাইরাল ১(খ)",
    dharaDesc: "ভিডিও কীভাবে শুরু হবে - দর্শকের মনোযোগ আকর্ষণ",
    options: [
      { value: "question", label: "QUESTION", labelBn: "প্রশ্ন" },
      { value: "shock", label: "SHOCK", labelBn: "শক" },
      { value: "mystery", label: "MYSTERY", labelBn: "রহস্য" },
      { value: "action", label: "ACTION", labelBn: "অ্যাকশন" },
    ],
  },
  {
    key: "curiosityGap",
    title: "Curiosity Gap",
    titleBn: "কৌতূহল তৈরি",
    dharaRef: "ভাইরাল ১(গ)",
    dharaDesc: "দর্শককে শেষ পর্যন্ত দেখতে বাধ্য করার কৌশল",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "mild", label: "MILD", labelBn: "হালকা" },
      { value: "intense", label: "INTENSE", labelBn: "তীব্র" },
      { value: "cliffhanger", label: "CLIFF", labelBn: "ক্লিফহ্যাঙ্গার" },
    ],
  },
  // === 🚀 VIRAL MASTERY: STORYTELLING ARC ===
  {
    key: "narrativeArc",
    title: "Narrative Arc",
    titleBn: "গল্পের কাঠামো",
    dharaRef: "ভাইরাল ২(ক)",
    dharaDesc: "গল্প কীভাবে এগিয়ে যাবে",
    options: [
      { value: "linear", label: "LINEAR", labelBn: "সোজা" },
      { value: "non-linear", label: "NON-LINEAR", labelBn: "জটিল" },
      { value: "circular", label: "CIRCULAR", labelBn: "বৃত্তাকার" },
      { value: "twist-ending", label: "TWIST", labelBn: "টুইস্ট" },
    ],
  },
  {
    key: "emotionalJourney",
    title: "Emotional Journey",
    titleBn: "আবেগের যাত্রা",
    dharaRef: "ভাইরাল ২(খ)",
    dharaDesc: "দর্শকের আবেগ কীভাবে পরিবর্তিত হবে",
    options: [
      { value: "flat", label: "FLAT", labelBn: "সমতল" },
      { value: "build-up", label: "BUILD-UP", labelBn: "ক্রমবর্ধমান" },
      { value: "roller-coaster", label: "ROLLER", labelBn: "রোলার" },
      { value: "crescendo", label: "CRESCENDO", labelBn: "ক্রিসেন্ডো" },
    ],
  },
  {
    key: "twistIntensity",
    title: "Twist Intensity",
    titleBn: "টুইস্ট তীব্রতা",
    dharaRef: "ভাইরাল ২(গ)",
    dharaDesc: "গল্পে অপ্রত্যাশিত মোড়ের শক্তি",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "subtle", label: "SUBTLE", labelBn: "সূক্ষ্ম" },
      { value: "medium", label: "MEDIUM", labelBn: "মাঝারি" },
      { value: "mind-blowing", label: "MINDBLOWN", labelBn: "মাইন্ডব্লো" },
    ],
  },
  {
    key: "peakMoment",
    title: "Peak Moment",
    titleBn: "চরম মুহূর্ত",
    dharaRef: "ভাইরাল ২(ঘ)",
    dharaDesc: "সবচেয়ে শক্তিশালী মুহূর্ত কোথায় আসবে",
    options: [
      { value: "early", label: "EARLY", labelBn: "শুরুতে" },
      { value: "middle", label: "MIDDLE", labelBn: "মাঝে" },
      { value: "climax", label: "CLIMAX", labelBn: "ক্লাইম্যাক্স" },
      { value: "end-reveal", label: "END", labelBn: "শেষে" },
    ],
  },
  // === 🚀 VIRAL MASTERY: VISUAL IMPACT ===
  {
    key: "speedDynamics",
    title: "Speed Dynamics",
    titleBn: "গতি ডায়নামিক্স",
    dharaRef: "ভাইরাল ৩(খ)",
    dharaDesc: "স্লো-মো, স্পীড র‍্যাম্প, টাইম-ল্যাপস",
    options: [
      { value: "normal", label: "NORMAL", labelBn: "স্বাভাবিক" },
      { value: "slow-mo", label: "SLOW-MO", labelBn: "স্লো-মো" },
      { value: "speed-ramp", label: "RAMP", labelBn: "র‍্যাম্প" },
      { value: "time-lapse", label: "TIMELAPSE", labelBn: "টাইমল্যাপস" },
    ],
  },
  {
    key: "transitionStyle",
    title: "Transition Style",
    titleBn: "ট্রানজিশন স্টাইল",
    dharaRef: "ভাইরাল ৩(গ)",
    dharaDesc: "দৃশ্য পরিবর্তনের ধরন",
    options: [
      { value: "cut", label: "CUT", labelBn: "কাট" },
      { value: "fade", label: "FADE", labelBn: "ফেড" },
      { value: "creative", label: "CREATIVE", labelBn: "ক্রিয়েটিভ" },
      { value: "seamless", label: "SEAMLESS", labelBn: "সিমলেস" },
    ],
  },
  {
    key: "vfxIntensity",
    title: "VFX Intensity",
    titleBn: "VFX তীব্রতা",
    dharaRef: "ভাইরাল ৩(ঘ)",
    dharaDesc: "ভিজুয়াল ইফেক্টের পরিমাণ",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "subtle", label: "SUBTLE", labelBn: "সূক্ষ্ম" },
      { value: "moderate", label: "MODERATE", labelBn: "মাঝারি" },
      { value: "heavy", label: "HEAVY", labelBn: "ভারী" },
    ],
  },
  // === 🚀 VIRAL MASTERY: ENGAGEMENT TRIGGERS ===
  {
    key: "relatability",
    title: "Relatability",
    titleBn: "সম্পর্কযোগ্যতা",
    dharaRef: "ভাইরাল ৪(ক)",
    dharaDesc: "দর্শক কতটা নিজেকে সংযুক্ত করতে পারবে",
    options: [
      { value: "niche", label: "NICHE", labelBn: "নিশ" },
      { value: "moderate", label: "MODERATE", labelBn: "মাঝারি" },
      { value: "universal", label: "UNIVERSAL", labelBn: "সার্বজনীন" },
      { value: "deeply-personal", label: "PERSONAL", labelBn: "ব্যক্তিগত" },
    ],
  },
  {
    key: "nostalgiaLevel",
    title: "Nostalgia Level",
    titleBn: "নস্টালজিয়া লেভেল",
    dharaRef: "ভাইরাল ৪(খ)",
    dharaDesc: "পুরনো স্মৃতি জাগানোর মাত্রা",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "hint", label: "HINT", labelBn: "ইঙ্গিত" },
      { value: "strong", label: "STRONG", labelBn: "শক্তিশালী" },
      { value: "core-theme", label: "CORE", labelBn: "মূল থিম" },
    ],
  },
  {
    key: "shockValue",
    title: "Shock Value",
    titleBn: "শক ভ্যালু",
    dharaRef: "ভাইরাল ৪(গ)",
    dharaDesc: "অপ্রত্যাশিত/চমকপ্রদ উপাদান",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "mild", label: "MILD", labelBn: "হালকা" },
      { value: "moderate", label: "MODERATE", labelBn: "মাঝারি" },
      { value: "high", label: "HIGH", labelBn: "উচ্চ" },
    ],
  },
  {
    key: "shareability",
    title: "Shareability",
    titleBn: "শেয়ারযোগ্যতা",
    dharaRef: "ভাইরাল ৪(ঘ)",
    dharaDesc: "মানুষ কতটা শেয়ার করতে চাইবে",
    options: [
      { value: "low", label: "LOW", labelBn: "কম" },
      { value: "medium", label: "MEDIUM", labelBn: "মাঝারি" },
      { value: "high", label: "HIGH", labelBn: "উচ্চ" },
      { value: "viral-bait", label: "VIRAL", labelBn: "ভাইরাল" },
    ],
  },
  // === 🚀 VIRAL MASTERY: PLATFORM OPTIMIZATION ===
  {
    key: "loopFriendly",
    title: "Loop Friendly",
    titleBn: "লুপ ফ্রেন্ডলি",
    dharaRef: "ভাইরাল ৫(ক)",
    dharaDesc: "ভিডিও বারবার দেখার উপযোগী কিনা",
    options: [
      { value: "no", label: "NO", labelBn: "না" },
      { value: "soft-loop", label: "SOFT", labelBn: "হালকা" },
      { value: "perfect-loop", label: "PERFECT", labelBn: "পারফেক্ট" },
    ],
  },
  {
    key: "pacing",
    title: "Pacing",
    titleBn: "গতি/পেসিং",
    dharaRef: "ভাইরাল ৫(খ)",
    dharaDesc: "কন্টেন্ট কত দ্রুত এগিয়ে যাবে",
    options: [
      { value: "slow", label: "SLOW", labelBn: "ধীর" },
      { value: "moderate", label: "MODERATE", labelBn: "মাঝারি" },
      { value: "fast", label: "FAST", labelBn: "দ্রুত" },
      { value: "hyper", label: "HYPER", labelBn: "হাইপার" },
    ],
  },
  {
    key: "ctaPlacement",
    title: "CTA Placement",
    titleBn: "CTA অবস্থান",
    dharaRef: "ভাইরাল ৫(গ)",
    dharaDesc: "Call-to-Action কোথায় রাখা হবে",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "end", label: "END", labelBn: "শেষে" },
      { value: "middle", label: "MIDDLE", labelBn: "মাঝে" },
      { value: "throughout", label: "ALL", labelBn: "সর্বত্র" },
    ],
  },
  {
    key: "soundTrend",
    title: "Sound Trend",
    titleBn: "সাউন্ড ট্রেন্ড",
    dharaRef: "ভাইরাল ৫(ঘ)",
    dharaDesc: "ট্রেন্ডিং সাউন্ড ব্যবহার করা হবে কিনা",
    options: [
      { value: "original", label: "ORIGINAL", labelBn: "অরিজিনাল" },
      { value: "trending", label: "TRENDING", labelBn: "ট্রেন্ডিং" },
      { value: "remix", label: "REMIX", labelBn: "রিমিক্স" },
      { value: "iconic", label: "ICONIC", labelBn: "আইকনিক" },
    ],
  },
  // === ⚡ FUTURISTIC SYSTEMS ===
  {
    key: "futuristicSystems",
    title: "Futuristic Systems",
    titleBn: "ফিউচারিস্টিক সিস্টেম",
    dharaRef: "ফিউচারিস্টিক ১(ক)",
    dharaDesc: "উন্নত প্রযুক্তি ও সিস্টেম কনসেপ্ট",
    options: [
      { value: "none", label: "NONE", labelBn: "নেই" },
      { value: "temporal-engine", label: "TEMPORAL ENGINE", labelBn: "টেম্পোরাল ইঞ্জিন" },
      { value: "dimensional-mapping", label: "DIMENSIONAL MAPPING", labelBn: "ডাইমেনশনাল ম্যাপিং" },
      { value: "ghost-protocol", label: "GHOST PROTOCOL", labelBn: "ঘোস্ট প্রোটোকল" },
      { value: "quantum-density", label: "QUANTUM DENSITY", labelBn: "কোয়ান্টাম ডেনসিটি" },
      { value: "network-dominance", label: "NETWORK DOMINANCE", labelBn: "নেটওয়ার্ক ডমিন্যান্স" },
      { value: "reality-simulation", label: "REALITY SIMULATION", labelBn: "রিয়ালিটি সিমুলেশন" },
    ],
  },
  // === 🎯 ADVANCED CREATIVE: PATTERN DISRUPTION (সারণী গ) ===
  {
    key: "patternDisruption",
    title: "Pattern Disruption",
    titleBn: "প্যাটার্ন ডিসরাপশন",
    dharaRef: "সারণী (গ)",
    dharaDesc: "দর্শকের প্রত্যাশা ভাঙার কৌশল — গল্পের মোড় ও সমাপ্তি নিয়ন্ত্রণ",
    options: [
      { value: "none", label: "NONE", labelBn: "কোনোটিই নয়" },
      { value: "subtle-twist", label: "SUBTLE TWIST", labelBn: "সূক্ষ্ম মোড়" },
      { value: "shocking-ending", label: "SHOCKING END", labelBn: "চমকে দেওয়া সমাপ্তি" },
      { value: "full-perspective-shift", label: "FULL SHIFT", labelBn: "সম্পূর্ণ দৃষ্টিভঙ্গি পরিবর্তন" },
    ],
  },
  // === 🎯 ADVANCED CREATIVE: AUDIENCE PSYCHOLOGY TRIGGER (সারণী গ) ===
  {
    key: "audiencePsychologyTrigger",
    title: "Audience Psychology Trigger",
    titleBn: "অডিয়েন্স সাইকোলজি ট্রিগার",
    dharaRef: "সারণী (গ)",
    dharaDesc: "দর্শকের মনস্তাত্ত্বিক প্রতিক্রিয়া নিয়ন্ত্রণ — কোন আদিম অনুভূতি জাগাবে",
    options: [
      { value: "deep-asmr", label: "DEEP ASMR", labelBn: "গভীর তৃপ্তি (ASMR)" },
      { value: "primal-fear", label: "PRIMAL FEAR", labelBn: "আদিম ভয়" },
      { value: "intense-curiosity", label: "CURIOSITY", labelBn: "তীব্র কৌতূহল" },
      { value: "viral-attraction", label: "VIRAL PULL", labelBn: "ভাইরাল আকর্ষণ" },
    ],
  },
  // === 🎯 ADVANCED CREATIVE: LENS & APERTURE (সারণী খ) ===
  {
    key: "lensAperture",
    title: "Lens & Aperture",
    titleBn: "লেন্স ও অ্যাপারচার",
    dharaRef: "সারণী (খ)",
    dharaDesc: "ক্যামেরা লেন্সের ফোকাল লেংথ ও ডেপথ অফ ফিল্ড নিয়ন্ত্রণ",
    options: [
      { value: "ultra-wide-16mm", label: "16mm ULTRA-WIDE", labelBn: "আল্ট্রা-ওয়াইড (১৬মিমি)" },
      { value: "standard-35mm", label: "35mm STANDARD", labelBn: "সাধারণ লেন্স (৩৫মিমি)" },
      { value: "portrait-85mm", label: "85mm PORTRAIT", labelBn: "পোর্টেট ডেপথ (৮৫মিমি)" },
      { value: "macro-100mm", label: "100mm MACRO", labelBn: "ম্যাক্রো ডিটেইল (১০০মিমি)" },
    ],
  },
  // === 🎯 ADVANCED CREATIVE: LIGHT SOURCE DIRECTION (সারণী খ) ===
  {
    key: "lightSourceDirection",
    title: "Light Source Direction",
    titleBn: "লাইট সোর্স ডিরেকশন",
    dharaRef: "সারণী (খ)",
    dharaDesc: "আলোর দিক ও ধরন — দৃশ্যের গভীরতা ও আবেগ নিয়ন্ত্রণ",
    options: [
      { value: "moody-side-light", label: "SIDE-LIGHT", labelBn: "মুডি সাইড-লাইট" },
      { value: "dramatic-backlit", label: "BACKLIT", labelBn: "ড্রামাটিক ব্যাকলিট" },
      { value: "soft-ambient", label: "AMBIENT", labelBn: "সফট অ্যাম্বিয়েন্ট" },
      { value: "high-contrast-rim", label: "RIM LIGHT", labelBn: "হাই-কনট্রাস্ট রিম লাইট" },
    ],
  },
  // === 🔥 মহা-শক্তি (MEGA POWER) PARAMETERS ===
  {
    key: "backgroundPeople",
    title: "Background People",
    titleBn: "পটভূমি মানুষ",
    dharaRef: "সারণী (খ)",
    dharaDesc: "দৃশ্যের পেছনে মানুষের উপস্থিতি ও আচরণ নিয়ন্ত্রণ",
    options: [
      { value: "none", label: "NONE", labelBn: "কেউ নেই" },
      { value: "blurry-pedestrians", label: "BLURRY", labelBn: "ঝাপসা পথচারী" },
      { value: "dynamic-crowd", label: "CROWD", labelBn: "গতিশীল ভিড়" },
      { value: "statue-still", label: "STILL", labelBn: "মূর্তির মতো স্থির মানুষ" },
      { value: "shadowy-figures", label: "SHADOW", labelBn: "ছায়াময় অবয়ব" },
      { value: "hostile-audience", label: "HOSTILE", labelBn: "শত্রুভাবাপন্ন দর্শক" },
      { value: "distant-observers", label: "DISTANT", labelBn: "দূরবর্তী পর্যবেক্ষক" },
    ],
  },
  {
    key: "visualElements",
    title: "Visual Elements",
    titleBn: "ভিজুয়াল উপাদান",
    dharaRef: "সারণী (খ)",
    dharaDesc: "দৃশ্যের ভিজুয়াল ইফেক্ট ও টেক্সচার নিয়ন্ত্রণ",
    options: [
      { value: "cinematic-particles", label: "PARTICLES", labelBn: "সিনেমাটিক কণা" },
      { value: "flying-dust", label: "DUST", labelBn: "উড়ন্ত ধূলিকণা" },
      { value: "neon-fog", label: "NEON FOG", labelBn: "নিয়ন কুয়াশা" },
      { value: "volumetric-lighting", label: "VOLUMETRIC", labelBn: "ভলিউমেট্রিক লাইটিং" },
      { value: "glitch-effect", label: "GLITCH", labelBn: "গ্লিচ ইফেক্ট" },
      { value: "natural-overlay", label: "NATURAL", labelBn: "প্রাকৃতিক ওভারলে (বৃষ্টি/ধোঁয়া)" },
      { value: "high-detail-texture", label: "TEXTURE", labelBn: "হাই-ডিটেইল টেক্সচার" },
      { value: "otherworldly-glow", label: "GLOW", labelBn: "অপার্থিব আভা" },
    ],
  },
  {
    key: "fixedTheme",
    title: "Fixed Theme",
    titleBn: "ফিক্সড থিম",
    dharaRef: "সারণী (ক)",
    dharaDesc: "সিরিজের স্থায়ী থিম — সমস্ত এপিসোডে একই থাকবে",
    options: [
      { value: "cyberpunk-dystopia", label: "CYBERPUNK", labelBn: "সাইবারপাঙ্ক ডিস্টোপিয়া" },
      { value: "ancient-mythology", label: "MYTHOLOGY", labelBn: "প্রাচীন মিথলজি" },
      { value: "surreal-dreamworld", label: "SURREAL", labelBn: "পরাবাস্তব স্বপ্নজগত" },
      { value: "hyper-realistic-noir", label: "NOIR", labelBn: "হাইপার-রিয়েলিস্টিক নোয়ার" },
      { value: "cosmic-horror", label: "COSMIC", labelBn: "কসমিক হরর" },
      { value: "minimalist-zen", label: "ZEN", labelBn: "মিনিমালিস্ট জেন" },
      { value: "futuristic-tech", label: "FUTURE", labelBn: "ফিউচারিস্টিক টেক" },
      { value: "survival-fight", label: "SURVIVAL", labelBn: "সারভাইভাল লড়াই" },
    ],
  },
  {
    key: "centralAttraction",
    title: "Central Attraction",
    titleBn: "কেন্দ্রীয় আকর্ষণ",
    dharaRef: "সারণী (ক)",
    dharaDesc: "দৃশ্যের প্রধান ফোকাস পয়েন্ট — দর্শকের চোখ কোথায় যাবে",
    options: [
      { value: "lone-hero", label: "HERO", labelBn: "একাকী নায়ক" },
      { value: "mysterious-artifact", label: "ARTIFACT", labelBn: "রহস্যময় নিদর্শন" },
      { value: "impossible-architecture", label: "ARCHITECTURE", labelBn: "অসম্ভব স্থাপত্য" },
      { value: "hidden-monster", label: "MONSTER", labelBn: "লুকানো দানব" },
      { value: "sacred-geometry", label: "GEOMETRY", labelBn: "পবিত্র জ্যামিতি" },
      { value: "floating-monolith", label: "MONOLITH", labelBn: "ভাসমান মনোলিথ" },
    ],
  },
  {
    key: "fixedCharacter",
    title: "Fixed Character",
    titleBn: "ফিক্সড ক্যারেক্টার",
    dharaRef: "সারণী (ক)",
    dharaDesc: "সিরিজের স্থায়ী চরিত্র — সমস্ত এপিসোডে একই থাকবে",
    options: [
      { value: "silent-hero", label: "SILENT", labelBn: "নির্বাক নায়ক" },
      { value: "mysterious-stranger", label: "STRANGER", labelBn: "রহস্যময় আগন্তুক" },
      { value: "divine-entity", label: "DIVINE", labelBn: "ঐশ্বরিক সত্তা" },
      { value: "cybernetic-outlook", label: "CYBER", labelBn: "সাইবারনেটিক আউটলক" },
      { value: "lost-child", label: "CHILD", labelBn: "হারিয়ে যাওয়া শিশু" },
      { value: "ancient-sage", label: "SAGE", labelBn: "প্রাচীন ঋষি" },
    ],
  },
  {
    key: "creativeCatalyst",
    title: "Creative Catalyst",
    titleBn: "সৃজনশীল অনুঘটক",
    dharaRef: "সারণী (গ)",
    dharaDesc: "কনসেপ্টে অপ্রত্যাশিত মোড় আনার জন্য সৃজনশীল উপাদান",
    options: [
      { value: "chaos-factor", label: "CHAOS", labelBn: "বিশৃঙ্খল ফ্যাক্টর" },
      { value: "sudden-silence", label: "SILENCE", labelBn: "আকস্মিক নীরবতা" },
      { value: "color-shift", label: "COLOR", labelBn: "রঙের পরিবর্তন" },
      { value: "zero-gravity", label: "ZERO-G", labelBn: "মাধ্যাকর্ষণহীনতা" },
      { value: "time-slow", label: "TIME", labelBn: "সময়ের ধীরগতি" },
      { value: "reality-crack", label: "CRACK", labelBn: "বাস্তবতায় ফাটল" },
      { value: "emotional-explosion", label: "EMOTION", labelBn: "আবেগীয় বিস্ফোরণ" },
      { value: "hidden-signal", label: "SIGNAL", labelBn: "লুকানো সংকেত" },
    ],
  },
  {
    key: "forbiddenElements",
    title: "Forbidden Elements",
    titleBn: "নিষিদ্ধ উপাদান",
    dharaRef: "সারণী (গ)",
    dharaDesc: "কনসেপ্টে কোন উপাদানগুলো কঠোরভাবে নিষিদ্ধ থাকবে",
    options: [
      { value: "no-human-face", label: "NO FACE", labelBn: "মানুষের মুখ নিষিদ্ধ" },
      { value: "no-bright-colors", label: "NO BRIGHT", labelBn: "উজ্জ্বল রং নিষিদ্ধ" },
      { value: "no-modern-tech", label: "NO TECH", labelBn: "আধুনিক প্রযুক্তি নিষিদ্ধ" },
      { value: "no-dialogue", label: "NO TALK", labelBn: "সংলাপ নিষিদ্ধ" },
      { value: "no-gravity", label: "NO GRAVITY", labelBn: "মাধ্যাকর্ষণ নিষিদ্ধ" },
      { value: "no-sound", label: "NO SOUND", labelBn: "শব্দ নিষিদ্ধ" },
      { value: "no-fast-motion", label: "NO FAST", labelBn: "দ্রুত গতি নিষিদ্ধ" },
    ],
  },
  // === 🆕 NEW POWERFUL PARAMETERS ===
  {
    key: "coreWorkflow",
    title: "Core Workflow",
    titleBn: "কোর ওয়ার্কফ্লো",
    dharaRef: "সারণী (ক)",
    dharaDesc: "কনটেন্টের মূল কর্মপ্রবাহ ও ন্যারেটিভ স্টাইল নির্ধারণ",
    options: [
      { value: "cinematic-narrative", label: "CINEMATIC", labelBn: "সিনেমাটিক ন্যারেটিভ" },
      { value: "documentary-style", label: "DOCUMENTARY", labelBn: "ডকুমেন্টারি স্টাইল" },
      { value: "high-action-pacing", label: "ACTION", labelBn: "হাই-অ্যাকশন পেসিং" },
      { value: "slow-burn-suspense", label: "SUSPENSE", labelBn: "স্লো বার্ন সাসপেন্স" },
      { value: "musical-rhythm", label: "MUSICAL", labelBn: "মিউজিক্যাল রিদম" },
      { value: "first-person-pov", label: "FP-POV", labelBn: "ফার্স্ট পারসন POV" },
      { value: "dramatic-storytelling", label: "DRAMATIC", labelBn: "ড্রামাটিক স্টোরিটেলিং" },
    ],
  },
  {
    key: "coreEventFlow",
    title: "Core Event Flow",
    titleBn: "কোর ইভেন্ট ফ্লো",
    dharaRef: "সারণী (খ)",
    dharaDesc: "ঘটনাপ্রবাহের সময়রেখা ও কাঠামো নির্ধারণ",
    options: [
      { value: "linear-timeline", label: "LINEAR", labelBn: "লিনিয়ার টাইমলাইন" },
      { value: "reverse-memory", label: "REVERSE", labelBn: "রিভার্স মেমরি" },
      { value: "looped-reality", label: "LOOPED", labelBn: "লুপড রিয়ালিটি" },
      { value: "multi-dimensional-jump", label: "MULTI-DIM", labelBn: "মাল্টি-ডাইমেনশনাল জাম্প" },
      { value: "fast-forward-evolution", label: "FF-EVOLVE", labelBn: "ফাস্ট ফরওয়ার্ড ইভোলিউশন" },
      { value: "slow-motion-detailing", label: "SLOW-DETAIL", labelBn: "স্লো মোশন ডিটেইলিং" },
    ],
  },
  {
    key: "immutableMutableElements",
    title: "Immutable/Mutable Elements",
    titleBn: "অপরিবর্তনীয়/পরিবর্তনযোগ্য উপাদান",
    dharaRef: "সারণী (গ)",
    dharaDesc: "দৃশ্যে কোন উপাদান স্থির ও কোনটি পরিবর্তনশীল হবে",
    options: [
      { value: "static-landscape", label: "STATIC", labelBn: "স্থির ল্যান্ডস্কেপ" },
      { value: "changing-time", label: "TIME", labelBn: "পরিবর্তনশীল সময়" },
      { value: "transforming-body", label: "BODY", labelBn: "রূপান্তরশীল শরীর" },
      { value: "decaying-weather", label: "WEATHER", labelBn: "ক্ষয়িষ্ণু আবহাওয়া" },
      { value: "eternal-light", label: "LIGHT", labelBn: "চিরস্থায়ী আলো" },
      { value: "transient-shadow", label: "SHADOW", labelBn: "অস্থায়ী ছায়া" },
    ],
  },
  {
    key: "variableCharacterList",
    title: "Variable Character List",
    titleBn: "ভেরিয়েবল চরিত্র তালিকা",
    dharaRef: "সারণী (গ)",
    dharaDesc: "দৃশ্যে পরিবর্তনশীল/অতিরিক্ত চরিত্রের ধরন",
    options: [
      { value: "helper-entity", label: "HELPER", labelBn: "সহায়ক সত্তা" },
      { value: "hidden-enemy", label: "ENEMY", labelBn: "গোপন শত্রু" },
      { value: "observer-creature", label: "OBSERVER", labelBn: "পর্যবেক্ষক প্রাণী" },
      { value: "mechanical-drone", label: "DRONE", labelBn: "যান্ত্রিক ড্রোন" },
      { value: "ancestral-spirit", label: "SPIRIT", labelBn: "পূর্বপুরুষের আত্মা" },
      { value: "illusion-creator", label: "ILLUSION", labelBn: "মায়া সৃষ্টিকারী অবয়ব" },
    ],
  },
];

interface BlueprintParamsOverrideProps {
  params: BlueprintParams;
  onParamChange: (key: keyof BlueprintParams, value: string) => void;
  isLocked: boolean;
  isVisible: boolean;
  isStreaming?: boolean;
  embedded?: boolean; // When true, renders inline without popover wrapper
}

export function BlueprintParamsOverride({
  params,
  onParamChange,
  isLocked,
  isVisible,
  isStreaming = false,
  embedded = false,
}: BlueprintParamsOverrideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isVisible) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  const activeOverrides = Object.entries(params).filter(
    ([key, val]) => val !== DEFAULT_PARAMS[key as keyof BlueprintParams]
  ).length;

  // Each param row gets its own unique color theme
  const ROW_THEMES: Record<string, { bg: string; border: string; activeBg: string; activeBorder: string; activeText: string; hoverBg: string; hoverBorder: string; summaryBg: string; summaryBorder: string; summaryText: string; summaryActiveBg: string; summaryActiveBorder: string; summaryActiveText: string; icon: string }> = {
    // Core Settings
    voicePresence: {
      bg: "hsl(340 60% 97%)", border: "hsl(340 50% 88%)",
      activeBg: "hsl(340 72% 52%)", activeBorder: "hsl(340 72% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(340 60% 95%)", hoverBorder: "hsl(340 55% 75%)",
      summaryBg: "hsl(340 50% 96%)", summaryBorder: "hsl(340 40% 85%)", summaryText: "hsl(340 30% 50%)",
      summaryActiveBg: "hsl(340 70% 94%)", summaryActiveBorder: "hsl(340 65% 70%)", summaryActiveText: "hsl(340 72% 42%)",
      icon: "hsl(340 72% 52%)",
    },
    realismLevel: {
      bg: "hsl(270 55% 97%)", border: "hsl(270 45% 89%)",
      activeBg: "hsl(270 72% 55%)", activeBorder: "hsl(270 72% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(270 55% 95%)", hoverBorder: "hsl(270 50% 76%)",
      summaryBg: "hsl(270 45% 96%)", summaryBorder: "hsl(270 35% 86%)", summaryText: "hsl(270 30% 50%)",
      summaryActiveBg: "hsl(270 65% 94%)", summaryActiveBorder: "hsl(270 55% 72%)", summaryActiveText: "hsl(270 72% 45%)",
      icon: "hsl(270 72% 55%)",
    },
    episodeCount: {
      bg: "hsl(35 70% 96%)", border: "hsl(35 55% 85%)",
      activeBg: "hsl(25 85% 52%)", activeBorder: "hsl(25 85% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(35 65% 94%)", hoverBorder: "hsl(35 55% 72%)",
      summaryBg: "hsl(35 55% 96%)", summaryBorder: "hsl(35 40% 84%)", summaryText: "hsl(35 35% 48%)",
      summaryActiveBg: "hsl(25 75% 93%)", summaryActiveBorder: "hsl(25 65% 68%)", summaryActiveText: "hsl(25 85% 40%)",
      icon: "hsl(25 85% 52%)",
    },
    // === 🎤 VOICE & NARRATION THEMES ===
    voiceLanguage: {
      bg: "hsl(250 60% 97%)", border: "hsl(250 50% 88%)",
      activeBg: "hsl(250 75% 55%)", activeBorder: "hsl(250 75% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(250 55% 94%)", hoverBorder: "hsl(250 50% 74%)",
      summaryBg: "hsl(250 50% 96%)", summaryBorder: "hsl(250 40% 85%)", summaryText: "hsl(250 30% 50%)",
      summaryActiveBg: "hsl(250 65% 93%)", summaryActiveBorder: "hsl(250 55% 70%)", summaryActiveText: "hsl(250 75% 45%)",
      icon: "hsl(250 75% 55%)",
    },
    voiceGender: {
      bg: "hsl(330 55% 97%)", border: "hsl(330 45% 88%)",
      activeBg: "hsl(330 70% 52%)", activeBorder: "hsl(330 70% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(330 50% 94%)", hoverBorder: "hsl(330 45% 74%)",
      summaryBg: "hsl(330 45% 96%)", summaryBorder: "hsl(330 35% 85%)", summaryText: "hsl(330 30% 50%)",
      summaryActiveBg: "hsl(330 60% 93%)", summaryActiveBorder: "hsl(330 50% 70%)", summaryActiveText: "hsl(330 70% 42%)",
      icon: "hsl(330 70% 52%)",
    },
    voiceAge: {
      bg: "hsl(185 55% 96%)", border: "hsl(185 45% 86%)",
      activeBg: "hsl(185 70% 42%)", activeBorder: "hsl(185 70% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(185 50% 94%)", hoverBorder: "hsl(185 45% 72%)",
      summaryBg: "hsl(185 45% 96%)", summaryBorder: "hsl(185 35% 84%)", summaryText: "hsl(185 30% 45%)",
      summaryActiveBg: "hsl(185 60% 93%)", summaryActiveBorder: "hsl(185 50% 68%)", summaryActiveText: "hsl(185 70% 32%)",
      icon: "hsl(185 70% 42%)",
    },
    voiceEmotion: {
      bg: "hsl(15 65% 97%)", border: "hsl(15 55% 88%)",
      activeBg: "hsl(15 80% 52%)", activeBorder: "hsl(15 80% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(15 60% 94%)", hoverBorder: "hsl(15 55% 74%)",
      summaryBg: "hsl(15 55% 96%)", summaryBorder: "hsl(15 45% 85%)", summaryText: "hsl(15 35% 50%)",
      summaryActiveBg: "hsl(15 70% 93%)", summaryActiveBorder: "hsl(15 60% 70%)", summaryActiveText: "hsl(15 80% 42%)",
      icon: "hsl(15 80% 52%)",
    },
    voiceTone: {
      bg: "hsl(275 55% 97%)", border: "hsl(275 45% 88%)",
      activeBg: "hsl(275 70% 55%)", activeBorder: "hsl(275 70% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(275 50% 94%)", hoverBorder: "hsl(275 45% 74%)",
      summaryBg: "hsl(275 45% 96%)", summaryBorder: "hsl(275 35% 85%)", summaryText: "hsl(275 30% 50%)",
      summaryActiveBg: "hsl(275 60% 93%)", summaryActiveBorder: "hsl(275 50% 70%)", summaryActiveText: "hsl(275 70% 45%)",
      icon: "hsl(275 70% 55%)",
    },
    voiceAccent: {
      bg: "hsl(95 50% 96%)", border: "hsl(95 40% 86%)",
      activeBg: "hsl(95 60% 42%)", activeBorder: "hsl(95 60% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(95 45% 94%)", hoverBorder: "hsl(95 40% 72%)",
      summaryBg: "hsl(95 40% 96%)", summaryBorder: "hsl(95 30% 84%)", summaryText: "hsl(95 25% 45%)",
      summaryActiveBg: "hsl(95 55% 93%)", summaryActiveBorder: "hsl(95 45% 68%)", summaryActiveText: "hsl(95 60% 32%)",
      icon: "hsl(95 60% 42%)",
    },
    narratorStyle: {
      bg: "hsl(205 60% 97%)", border: "hsl(205 50% 88%)",
      activeBg: "hsl(205 80% 48%)", activeBorder: "hsl(205 80% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(205 55% 94%)", hoverBorder: "hsl(205 50% 72%)",
      summaryBg: "hsl(205 50% 96%)", summaryBorder: "hsl(205 40% 85%)", summaryText: "hsl(205 30% 50%)",
      summaryActiveBg: "hsl(205 70% 93%)", summaryActiveBorder: "hsl(205 60% 68%)", summaryActiveText: "hsl(205 80% 38%)",
      icon: "hsl(205 80% 48%)",
    },
    // === 🌍 LOCATION THEMES ===
    country: {
      bg: "hsl(145 55% 96%)", border: "hsl(145 45% 86%)",
      activeBg: "hsl(145 65% 40%)", activeBorder: "hsl(145 65% 34%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(145 50% 94%)", hoverBorder: "hsl(145 45% 72%)",
      summaryBg: "hsl(145 45% 96%)", summaryBorder: "hsl(145 35% 84%)", summaryText: "hsl(145 30% 45%)",
      summaryActiveBg: "hsl(145 60% 93%)", summaryActiveBorder: "hsl(145 50% 68%)", summaryActiveText: "hsl(145 65% 32%)",
      icon: "hsl(145 65% 40%)",
    },
    locationType: {
      bg: "hsl(70 55% 96%)", border: "hsl(70 45% 85%)",
      activeBg: "hsl(70 70% 42%)", activeBorder: "hsl(70 70% 36%)", activeText: "hsl(70 100% 10%)",
      hoverBg: "hsl(70 50% 94%)", hoverBorder: "hsl(70 45% 72%)",
      summaryBg: "hsl(70 45% 96%)", summaryBorder: "hsl(70 35% 84%)", summaryText: "hsl(70 30% 42%)",
      summaryActiveBg: "hsl(70 60% 92%)", summaryActiveBorder: "hsl(70 50% 65%)", summaryActiveText: "hsl(70 70% 30%)",
      icon: "hsl(70 70% 42%)",
    },
    locationVibe: {
      bg: "hsl(190 55% 96%)", border: "hsl(190 45% 86%)",
      activeBg: "hsl(190 70% 42%)", activeBorder: "hsl(190 70% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(190 50% 94%)", hoverBorder: "hsl(190 45% 72%)",
      summaryBg: "hsl(190 45% 96%)", summaryBorder: "hsl(190 35% 84%)", summaryText: "hsl(190 30% 45%)",
      summaryActiveBg: "hsl(190 60% 93%)", summaryActiveBorder: "hsl(190 50% 68%)", summaryActiveText: "hsl(190 70% 32%)",
      icon: "hsl(190 70% 42%)",
    },
    weather: {
      bg: "hsl(210 55% 97%)", border: "hsl(210 45% 88%)",
      activeBg: "hsl(210 75% 50%)", activeBorder: "hsl(210 75% 44%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(210 50% 94%)", hoverBorder: "hsl(210 45% 74%)",
      summaryBg: "hsl(210 45% 96%)", summaryBorder: "hsl(210 35% 85%)", summaryText: "hsl(210 30% 50%)",
      summaryActiveBg: "hsl(210 65% 93%)", summaryActiveBorder: "hsl(210 55% 70%)", summaryActiveText: "hsl(210 75% 40%)",
      icon: "hsl(210 75% 50%)",
    },
    season: {
      bg: "hsl(30 65% 96%)", border: "hsl(30 55% 85%)",
      activeBg: "hsl(30 80% 50%)", activeBorder: "hsl(30 80% 44%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(30 60% 94%)", hoverBorder: "hsl(30 55% 72%)",
      summaryBg: "hsl(30 55% 96%)", summaryBorder: "hsl(30 45% 84%)", summaryText: "hsl(30 35% 45%)",
      summaryActiveBg: "hsl(30 70% 92%)", summaryActiveBorder: "hsl(30 60% 65%)", summaryActiveText: "hsl(30 80% 38%)",
      icon: "hsl(30 80% 50%)",
    },
    // Output Format
    aspectRatio: {
      bg: "hsl(200 60% 97%)", border: "hsl(200 50% 88%)",
      activeBg: "hsl(200 80% 48%)", activeBorder: "hsl(200 80% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(200 55% 94%)", hoverBorder: "hsl(200 50% 72%)",
      summaryBg: "hsl(200 50% 96%)", summaryBorder: "hsl(200 40% 85%)", summaryText: "hsl(200 30% 50%)",
      summaryActiveBg: "hsl(200 70% 93%)", summaryActiveBorder: "hsl(200 60% 68%)", summaryActiveText: "hsl(200 80% 38%)",
      icon: "hsl(200 80% 48%)",
    },
    duration: {
      bg: "hsl(280 55% 97%)", border: "hsl(280 45% 88%)",
      activeBg: "hsl(280 70% 55%)", activeBorder: "hsl(280 70% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(280 50% 94%)", hoverBorder: "hsl(280 45% 74%)",
      summaryBg: "hsl(280 45% 96%)", summaryBorder: "hsl(280 35% 85%)", summaryText: "hsl(280 30% 50%)",
      summaryActiveBg: "hsl(280 65% 93%)", summaryActiveBorder: "hsl(280 55% 70%)", summaryActiveText: "hsl(280 70% 45%)",
      icon: "hsl(280 70% 55%)",
    },
    resolution: {
      bg: "hsl(45 70% 96%)", border: "hsl(45 55% 85%)",
      activeBg: "hsl(45 90% 48%)", activeBorder: "hsl(45 90% 42%)", activeText: "hsl(45 100% 10%)",
      hoverBg: "hsl(45 65% 94%)", hoverBorder: "hsl(45 55% 72%)",
      summaryBg: "hsl(45 55% 96%)", summaryBorder: "hsl(45 40% 84%)", summaryText: "hsl(45 35% 45%)",
      summaryActiveBg: "hsl(45 80% 92%)", summaryActiveBorder: "hsl(45 70% 65%)", summaryActiveText: "hsl(45 90% 30%)",
      icon: "hsl(45 90% 48%)",
    },
    frameRate: {
      bg: "hsl(180 50% 96%)", border: "hsl(180 40% 86%)",
      activeBg: "hsl(180 65% 42%)", activeBorder: "hsl(180 65% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(180 45% 94%)", hoverBorder: "hsl(180 40% 72%)",
      summaryBg: "hsl(180 40% 96%)", summaryBorder: "hsl(180 30% 84%)", summaryText: "hsl(180 25% 45%)",
      summaryActiveBg: "hsl(180 55% 93%)", summaryActiveBorder: "hsl(180 50% 68%)", summaryActiveText: "hsl(180 65% 32%)",
      icon: "hsl(180 65% 42%)",
    },
    // Camera & Visual
    colorGrade: {
      bg: "hsl(320 55% 97%)", border: "hsl(320 45% 88%)",
      activeBg: "hsl(320 70% 52%)", activeBorder: "hsl(320 70% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(320 50% 94%)", hoverBorder: "hsl(320 45% 74%)",
      summaryBg: "hsl(320 45% 96%)", summaryBorder: "hsl(320 35% 85%)", summaryText: "hsl(320 30% 50%)",
      summaryActiveBg: "hsl(320 65% 93%)", summaryActiveBorder: "hsl(320 55% 70%)", summaryActiveText: "hsl(320 70% 42%)",
      icon: "hsl(320 70% 52%)",
    },
    // Environment & Mood
    environment: {
      bg: "hsl(140 50% 96%)", border: "hsl(140 40% 86%)",
      activeBg: "hsl(140 60% 42%)", activeBorder: "hsl(140 60% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(140 45% 94%)", hoverBorder: "hsl(140 40% 72%)",
      summaryBg: "hsl(140 40% 96%)", summaryBorder: "hsl(140 30% 84%)", summaryText: "hsl(140 25% 45%)",
      summaryActiveBg: "hsl(140 55% 93%)", summaryActiveBorder: "hsl(140 50% 68%)", summaryActiveText: "hsl(140 60% 32%)",
      icon: "hsl(140 60% 42%)",
    },
    timeOfDay: {
      bg: "hsl(220 55% 97%)", border: "hsl(220 45% 88%)",
      activeBg: "hsl(220 75% 50%)", activeBorder: "hsl(220 75% 44%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(220 50% 94%)", hoverBorder: "hsl(220 45% 74%)",
      summaryBg: "hsl(220 45% 96%)", summaryBorder: "hsl(220 35% 85%)", summaryText: "hsl(220 30% 50%)",
      summaryActiveBg: "hsl(220 65% 93%)", summaryActiveBorder: "hsl(220 55% 70%)", summaryActiveText: "hsl(220 75% 40%)",
      icon: "hsl(220 75% 50%)",
    },
    mood: {
      bg: "hsl(10 60% 97%)", border: "hsl(10 50% 88%)",
      activeBg: "hsl(10 75% 55%)", activeBorder: "hsl(10 75% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(10 55% 94%)", hoverBorder: "hsl(10 50% 74%)",
      summaryBg: "hsl(10 50% 96%)", summaryBorder: "hsl(10 40% 85%)", summaryText: "hsl(10 30% 50%)",
      summaryActiveBg: "hsl(10 65% 93%)", summaryActiveBorder: "hsl(10 55% 70%)", summaryActiveText: "hsl(10 75% 45%)",
      icon: "hsl(10 75% 55%)",
    },
    // === 🚀 VIRAL MASTERY: HOOK & ATTENTION ===
    openingStyle: {
      bg: "hsl(25 70% 96%)", border: "hsl(25 55% 86%)",
      activeBg: "hsl(25 85% 50%)", activeBorder: "hsl(25 85% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(25 65% 94%)", hoverBorder: "hsl(25 55% 72%)",
      summaryBg: "hsl(25 55% 96%)", summaryBorder: "hsl(25 45% 84%)", summaryText: "hsl(25 35% 48%)",
      summaryActiveBg: "hsl(25 75% 92%)", summaryActiveBorder: "hsl(25 65% 66%)", summaryActiveText: "hsl(25 85% 38%)",
      icon: "hsl(25 85% 50%)",
    },
    curiosityGap: {
      bg: "hsl(300 50% 97%)", border: "hsl(300 40% 88%)",
      activeBg: "hsl(300 65% 52%)", activeBorder: "hsl(300 65% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(300 45% 94%)", hoverBorder: "hsl(300 40% 74%)",
      summaryBg: "hsl(300 40% 96%)", summaryBorder: "hsl(300 30% 85%)", summaryText: "hsl(300 25% 50%)",
      summaryActiveBg: "hsl(300 55% 93%)", summaryActiveBorder: "hsl(300 50% 70%)", summaryActiveText: "hsl(300 65% 42%)",
      icon: "hsl(300 65% 52%)",
    },
    // === 🚀 VIRAL MASTERY: STORYTELLING ARC ===
    narrativeArc: {
      bg: "hsl(260 55% 97%)", border: "hsl(260 45% 88%)",
      activeBg: "hsl(260 70% 55%)", activeBorder: "hsl(260 70% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(260 50% 94%)", hoverBorder: "hsl(260 45% 74%)",
      summaryBg: "hsl(260 45% 96%)", summaryBorder: "hsl(260 35% 85%)", summaryText: "hsl(260 30% 50%)",
      summaryActiveBg: "hsl(260 60% 93%)", summaryActiveBorder: "hsl(260 55% 70%)", summaryActiveText: "hsl(260 70% 45%)",
      icon: "hsl(260 70% 55%)",
    },
    emotionalJourney: {
      bg: "hsl(350 60% 97%)", border: "hsl(350 50% 88%)",
      activeBg: "hsl(350 75% 52%)", activeBorder: "hsl(350 75% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(350 55% 94%)", hoverBorder: "hsl(350 50% 74%)",
      summaryBg: "hsl(350 50% 96%)", summaryBorder: "hsl(350 40% 85%)", summaryText: "hsl(350 30% 50%)",
      summaryActiveBg: "hsl(350 65% 93%)", summaryActiveBorder: "hsl(350 55% 70%)", summaryActiveText: "hsl(350 75% 42%)",
      icon: "hsl(350 75% 52%)",
    },
    twistIntensity: {
      bg: "hsl(285 55% 97%)", border: "hsl(285 45% 88%)",
      activeBg: "hsl(285 70% 52%)", activeBorder: "hsl(285 70% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(285 50% 94%)", hoverBorder: "hsl(285 45% 74%)",
      summaryBg: "hsl(285 45% 96%)", summaryBorder: "hsl(285 35% 85%)", summaryText: "hsl(285 30% 50%)",
      summaryActiveBg: "hsl(285 60% 93%)", summaryActiveBorder: "hsl(285 55% 70%)", summaryActiveText: "hsl(285 70% 42%)",
      icon: "hsl(285 70% 52%)",
    },
    peakMoment: {
      bg: "hsl(45 65% 96%)", border: "hsl(45 55% 85%)",
      activeBg: "hsl(45 90% 50%)", activeBorder: "hsl(45 90% 42%)", activeText: "hsl(45 100% 10%)",
      hoverBg: "hsl(45 60% 94%)", hoverBorder: "hsl(45 55% 72%)",
      summaryBg: "hsl(45 55% 96%)", summaryBorder: "hsl(45 45% 84%)", summaryText: "hsl(45 35% 45%)",
      summaryActiveBg: "hsl(45 80% 92%)", summaryActiveBorder: "hsl(45 70% 65%)", summaryActiveText: "hsl(45 90% 30%)",
      icon: "hsl(45 90% 50%)",
    },
    // === 🚀 VIRAL MASTERY: VISUAL IMPACT ===
    speedDynamics: {
      bg: "hsl(195 60% 96%)", border: "hsl(195 50% 86%)",
      activeBg: "hsl(195 80% 45%)", activeBorder: "hsl(195 80% 38%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(195 55% 94%)", hoverBorder: "hsl(195 50% 72%)",
      summaryBg: "hsl(195 50% 96%)", summaryBorder: "hsl(195 40% 84%)", summaryText: "hsl(195 30% 45%)",
      summaryActiveBg: "hsl(195 70% 92%)", summaryActiveBorder: "hsl(195 60% 65%)", summaryActiveText: "hsl(195 80% 35%)",
      icon: "hsl(195 80% 45%)",
    },
    transitionStyle: {
      bg: "hsl(170 55% 96%)", border: "hsl(170 45% 86%)",
      activeBg: "hsl(170 70% 40%)", activeBorder: "hsl(170 70% 34%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(170 50% 94%)", hoverBorder: "hsl(170 45% 72%)",
      summaryBg: "hsl(170 45% 96%)", summaryBorder: "hsl(170 35% 84%)", summaryText: "hsl(170 30% 45%)",
      summaryActiveBg: "hsl(170 60% 93%)", summaryActiveBorder: "hsl(170 55% 68%)", summaryActiveText: "hsl(170 70% 32%)",
      icon: "hsl(170 70% 40%)",
    },
    vfxIntensity: {
      bg: "hsl(290 55% 97%)", border: "hsl(290 45% 88%)",
      activeBg: "hsl(290 70% 55%)", activeBorder: "hsl(290 70% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(290 50% 94%)", hoverBorder: "hsl(290 45% 74%)",
      summaryBg: "hsl(290 45% 96%)", summaryBorder: "hsl(290 35% 85%)", summaryText: "hsl(290 30% 50%)",
      summaryActiveBg: "hsl(290 60% 93%)", summaryActiveBorder: "hsl(290 55% 70%)", summaryActiveText: "hsl(290 70% 45%)",
      icon: "hsl(290 70% 55%)",
    },
    // === 🚀 VIRAL MASTERY: ENGAGEMENT TRIGGERS ===
    relatability: {
      bg: "hsl(120 45% 96%)", border: "hsl(120 35% 86%)",
      activeBg: "hsl(120 55% 42%)", activeBorder: "hsl(120 55% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(120 40% 94%)", hoverBorder: "hsl(120 35% 72%)",
      summaryBg: "hsl(120 35% 96%)", summaryBorder: "hsl(120 25% 84%)", summaryText: "hsl(120 20% 45%)",
      summaryActiveBg: "hsl(120 50% 93%)", summaryActiveBorder: "hsl(120 45% 68%)", summaryActiveText: "hsl(120 55% 32%)",
      icon: "hsl(120 55% 42%)",
    },
    nostalgiaLevel: {
      bg: "hsl(35 65% 96%)", border: "hsl(35 50% 85%)",
      activeBg: "hsl(35 80% 48%)", activeBorder: "hsl(35 80% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(35 55% 94%)", hoverBorder: "hsl(35 50% 72%)",
      summaryBg: "hsl(35 50% 96%)", summaryBorder: "hsl(35 40% 84%)", summaryText: "hsl(35 30% 45%)",
      summaryActiveBg: "hsl(35 70% 92%)", summaryActiveBorder: "hsl(35 60% 65%)", summaryActiveText: "hsl(35 80% 38%)",
      icon: "hsl(35 80% 48%)",
    },
    shockValue: {
      bg: "hsl(355 60% 97%)", border: "hsl(355 50% 88%)",
      activeBg: "hsl(355 75% 50%)", activeBorder: "hsl(355 75% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(355 55% 94%)", hoverBorder: "hsl(355 50% 74%)",
      summaryBg: "hsl(355 50% 96%)", summaryBorder: "hsl(355 40% 85%)", summaryText: "hsl(355 30% 50%)",
      summaryActiveBg: "hsl(355 65% 93%)", summaryActiveBorder: "hsl(355 55% 70%)", summaryActiveText: "hsl(355 75% 40%)",
      icon: "hsl(355 75% 50%)",
    },
    shareability: {
      bg: "hsl(215 60% 97%)", border: "hsl(215 50% 88%)",
      activeBg: "hsl(215 80% 52%)", activeBorder: "hsl(215 80% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(215 55% 94%)", hoverBorder: "hsl(215 50% 74%)",
      summaryBg: "hsl(215 50% 96%)", summaryBorder: "hsl(215 40% 85%)", summaryText: "hsl(215 30% 50%)",
      summaryActiveBg: "hsl(215 70% 93%)", summaryActiveBorder: "hsl(215 60% 70%)", summaryActiveText: "hsl(215 80% 42%)",
      icon: "hsl(215 80% 52%)",
    },
    // === 🚀 VIRAL MASTERY: PLATFORM OPTIMIZATION ===
    loopFriendly: {
      bg: "hsl(150 50% 96%)", border: "hsl(150 40% 86%)",
      activeBg: "hsl(150 65% 42%)", activeBorder: "hsl(150 65% 36%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(150 45% 94%)", hoverBorder: "hsl(150 40% 72%)",
      summaryBg: "hsl(150 40% 96%)", summaryBorder: "hsl(150 30% 84%)", summaryText: "hsl(150 25% 45%)",
      summaryActiveBg: "hsl(150 55% 93%)", summaryActiveBorder: "hsl(150 50% 68%)", summaryActiveText: "hsl(150 65% 32%)",
      icon: "hsl(150 65% 42%)",
    },
    pacing: {
      bg: "hsl(240 50% 97%)", border: "hsl(240 40% 88%)",
      activeBg: "hsl(240 65% 55%)", activeBorder: "hsl(240 65% 48%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(240 45% 94%)", hoverBorder: "hsl(240 40% 74%)",
      summaryBg: "hsl(240 40% 96%)", summaryBorder: "hsl(240 30% 85%)", summaryText: "hsl(240 25% 50%)",
      summaryActiveBg: "hsl(240 55% 93%)", summaryActiveBorder: "hsl(240 50% 70%)", summaryActiveText: "hsl(240 65% 45%)",
      icon: "hsl(240 65% 55%)",
    },
    ctaPlacement: {
      bg: "hsl(60 55% 96%)", border: "hsl(60 45% 85%)",
      activeBg: "hsl(60 75% 45%)", activeBorder: "hsl(60 75% 38%)", activeText: "hsl(60 100% 10%)",
      hoverBg: "hsl(60 50% 94%)", hoverBorder: "hsl(60 45% 72%)",
      summaryBg: "hsl(60 45% 96%)", summaryBorder: "hsl(60 35% 84%)", summaryText: "hsl(60 30% 42%)",
      summaryActiveBg: "hsl(60 65% 92%)", summaryActiveBorder: "hsl(60 55% 65%)", summaryActiveText: "hsl(60 75% 32%)",
      icon: "hsl(60 75% 45%)",
    },
    soundTrend: {
      bg: "hsl(315 55% 97%)", border: "hsl(315 45% 88%)",
      activeBg: "hsl(315 70% 52%)", activeBorder: "hsl(315 70% 45%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(315 50% 94%)", hoverBorder: "hsl(315 45% 74%)",
      summaryBg: "hsl(315 45% 96%)", summaryBorder: "hsl(315 35% 85%)", summaryText: "hsl(315 30% 50%)",
      summaryActiveBg: "hsl(315 60% 93%)", summaryActiveBorder: "hsl(315 55% 70%)", summaryActiveText: "hsl(315 70% 42%)",
      icon: "hsl(315 70% 52%)",
    },
    // Advanced Creative Parameters
    patternDisruption: {
      bg: "hsl(25 60% 97%)", border: "hsl(25 50% 88%)",
      activeBg: "hsl(25 80% 50%)", activeBorder: "hsl(25 80% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(25 55% 94%)", hoverBorder: "hsl(25 50% 74%)",
      summaryBg: "hsl(25 50% 96%)", summaryBorder: "hsl(25 40% 85%)", summaryText: "hsl(25 35% 48%)",
      summaryActiveBg: "hsl(25 70% 93%)", summaryActiveBorder: "hsl(25 60% 68%)", summaryActiveText: "hsl(25 80% 40%)",
      icon: "hsl(25 80% 50%)",
    },
    audiencePsychologyTrigger: {
      bg: "hsl(290 55% 97%)", border: "hsl(290 45% 88%)",
      activeBg: "hsl(290 70% 52%)", activeBorder: "hsl(290 70% 44%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(290 50% 94%)", hoverBorder: "hsl(290 45% 74%)",
      summaryBg: "hsl(290 45% 96%)", summaryBorder: "hsl(290 35% 85%)", summaryText: "hsl(290 30% 48%)",
      summaryActiveBg: "hsl(290 65% 93%)", summaryActiveBorder: "hsl(290 55% 70%)", summaryActiveText: "hsl(290 70% 42%)",
      icon: "hsl(290 70% 52%)",
    },
    lensAperture: {
      bg: "hsl(185 55% 96%)", border: "hsl(185 45% 86%)",
      activeBg: "hsl(185 70% 40%)", activeBorder: "hsl(185 70% 34%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(185 50% 93%)", hoverBorder: "hsl(185 45% 72%)",
      summaryBg: "hsl(185 45% 96%)", summaryBorder: "hsl(185 35% 84%)", summaryText: "hsl(185 30% 45%)",
      summaryActiveBg: "hsl(185 65% 92%)", summaryActiveBorder: "hsl(185 55% 68%)", summaryActiveText: "hsl(185 70% 36%)",
      icon: "hsl(185 70% 40%)",
    },
    lightSourceDirection: {
      bg: "hsl(45 60% 96%)", border: "hsl(45 50% 86%)",
      activeBg: "hsl(45 80% 48%)", activeBorder: "hsl(45 80% 40%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(45 55% 93%)", hoverBorder: "hsl(45 50% 72%)",
      summaryBg: "hsl(45 50% 96%)", summaryBorder: "hsl(45 40% 84%)", summaryText: "hsl(45 35% 42%)",
      summaryActiveBg: "hsl(45 70% 92%)", summaryActiveBorder: "hsl(45 60% 65%)", summaryActiveText: "hsl(45 80% 35%)",
      icon: "hsl(45 80% 48%)",
    },
    // 🔥 Mega Power Themes
    backgroundPeople: {
      bg: "hsl(220 55% 97%)", border: "hsl(220 45% 88%)",
      activeBg: "hsl(220 75% 50%)", activeBorder: "hsl(220 75% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(220 50% 94%)", hoverBorder: "hsl(220 45% 74%)",
      summaryBg: "hsl(220 45% 96%)", summaryBorder: "hsl(220 35% 85%)", summaryText: "hsl(220 30% 50%)",
      summaryActiveBg: "hsl(220 65% 93%)", summaryActiveBorder: "hsl(220 55% 70%)", summaryActiveText: "hsl(220 75% 40%)",
      icon: "hsl(220 75% 50%)",
    },
    visualElements: {
      bg: "hsl(175 55% 96%)", border: "hsl(175 45% 86%)",
      activeBg: "hsl(175 70% 38%)", activeBorder: "hsl(175 70% 32%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(175 50% 94%)", hoverBorder: "hsl(175 45% 72%)",
      summaryBg: "hsl(175 45% 96%)", summaryBorder: "hsl(175 35% 84%)", summaryText: "hsl(175 30% 45%)",
      summaryActiveBg: "hsl(175 60% 93%)", summaryActiveBorder: "hsl(175 55% 68%)", summaryActiveText: "hsl(175 70% 30%)",
      icon: "hsl(175 70% 38%)",
    },
    fixedTheme: {
      bg: "hsl(310 55% 97%)", border: "hsl(310 45% 88%)",
      activeBg: "hsl(310 70% 50%)", activeBorder: "hsl(310 70% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(310 50% 94%)", hoverBorder: "hsl(310 45% 74%)",
      summaryBg: "hsl(310 45% 96%)", summaryBorder: "hsl(310 35% 85%)", summaryText: "hsl(310 30% 50%)",
      summaryActiveBg: "hsl(310 65% 93%)", summaryActiveBorder: "hsl(310 55% 70%)", summaryActiveText: "hsl(310 70% 40%)",
      icon: "hsl(310 70% 50%)",
    },
    centralAttraction: {
      bg: "hsl(50 65% 96%)", border: "hsl(50 55% 85%)",
      activeBg: "hsl(50 85% 45%)", activeBorder: "hsl(50 85% 38%)", activeText: "hsl(50 100% 10%)",
      hoverBg: "hsl(50 60% 94%)", hoverBorder: "hsl(50 55% 72%)",
      summaryBg: "hsl(50 55% 96%)", summaryBorder: "hsl(50 45% 84%)", summaryText: "hsl(50 35% 42%)",
      summaryActiveBg: "hsl(50 75% 92%)", summaryActiveBorder: "hsl(50 65% 65%)", summaryActiveText: "hsl(50 85% 32%)",
      icon: "hsl(50 85% 45%)",
    },
    fixedCharacter: {
      bg: "hsl(265 55% 97%)", border: "hsl(265 45% 88%)",
      activeBg: "hsl(265 70% 52%)", activeBorder: "hsl(265 70% 44%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(265 50% 94%)", hoverBorder: "hsl(265 45% 74%)",
      summaryBg: "hsl(265 45% 96%)", summaryBorder: "hsl(265 35% 85%)", summaryText: "hsl(265 30% 50%)",
      summaryActiveBg: "hsl(265 60% 93%)", summaryActiveBorder: "hsl(265 55% 70%)", summaryActiveText: "hsl(265 70% 42%)",
      icon: "hsl(265 70% 52%)",
    },
    creativeCatalyst: {
      bg: "hsl(5 60% 97%)", border: "hsl(5 50% 88%)",
      activeBg: "hsl(5 75% 50%)", activeBorder: "hsl(5 75% 42%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(5 55% 94%)", hoverBorder: "hsl(5 50% 74%)",
      summaryBg: "hsl(5 50% 96%)", summaryBorder: "hsl(5 40% 85%)", summaryText: "hsl(5 30% 50%)",
      summaryActiveBg: "hsl(5 65% 93%)", summaryActiveBorder: "hsl(5 55% 70%)", summaryActiveText: "hsl(5 75% 40%)",
      icon: "hsl(5 75% 50%)",
    },
    forbiddenElements: {
      bg: "hsl(0 55% 97%)", border: "hsl(0 45% 88%)",
      activeBg: "hsl(0 70% 48%)", activeBorder: "hsl(0 70% 40%)", activeText: "hsl(0 0% 100%)",
      hoverBg: "hsl(0 50% 94%)", hoverBorder: "hsl(0 45% 74%)",
      summaryBg: "hsl(0 45% 96%)", summaryBorder: "hsl(0 35% 85%)", summaryText: "hsl(0 30% 50%)",
      summaryActiveBg: "hsl(0 60% 93%)", summaryActiveBorder: "hsl(0 55% 70%)", summaryActiveText: "hsl(0 70% 38%)",
      icon: "hsl(0 70% 48%)",
    },
  };

  // EMBEDDED MODE - Render inline without popover wrapper
  if (embedded) {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ background: "linear-gradient(135deg, hsl(260 60% 60%), hsl(300 55% 58%))" }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          </div>
          <span
            className="text-[11px] font-extrabold uppercase tracking-[0.15em]"
            style={{
              background: "linear-gradient(135deg, hsl(260 50% 40%), hsl(300 45% 45%), hsl(340 40% 50%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🎛️ Parameter Override
          </span>
          {activeOverrides > 0 && (
            <span 
              className="px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: "hsl(160 60% 92%)",
                color: "hsl(160 65% 35%)",
                border: "1px solid hsl(160 50% 80%)",
              }}
            >
              {activeOverrides} active
            </span>
          )}
        </div>

        {/* Parameters Grid - embedded style */}
        <div className="space-y-2 px-1">
          <TooltipProvider delayDuration={200}>
            {PARAM_CONFIGS.map((config) => (
              <ParamRow
                key={config.key}
                config={config}
                currentValue={params[config.key]}
                onSelect={(value) => onParamChange(config.key, value)}
                onClear={() => onParamChange(config.key, DEFAULT_PARAMS[config.key])}
                theme={ROW_THEMES[config.key]}
              />
            ))}
          </TooltipProvider>
        </div>

        {/* Active Overrides Summary - horizontal scroll */}
        <div
          className="px-2 py-2.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, hsl(240 15% 96% / 0.8), hsl(260 12% 95% / 0.7))",
            border: "1px solid hsl(260 20% 90% / 0.5)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="shrink-0 p-1 rounded-lg transition-all hover:scale-105"
              style={{
                background: "hsl(260 30% 94%)",
                border: "1px solid hsl(260 25% 88%)",
                color: "hsl(260 40% 50%)",
              }}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-x-auto scrollbar-none scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex gap-1.5 py-0.5">
                {PARAM_CONFIGS.filter(config => params[config.key] !== DEFAULT_PARAMS[config.key]).map((config) => {
                  const val = params[config.key];
                  const opt = config.options.find((o) => o.value === val);
                  const theme = ROW_THEMES[config.key];
                  return (
                    <span
                      key={config.key}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0"
                      style={{
                        background: theme.summaryActiveBg,
                        border: `1px solid ${theme.summaryActiveBorder}`,
                        color: theme.summaryActiveText,
                      }}
                    >
                      {config.title.split(" ")[0]}:
                      <span className="font-extrabold">{opt?.label || val}</span>
                    </span>
                  );
                })}
                {activeOverrides === 0 && (
                  <span className="text-[9px] text-muted-foreground italic px-2">
                    কোনো parameter পরিবর্তন করা হয়নি
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={scrollRight}
              className="shrink-0 p-1 rounded-lg transition-all hover:scale-105"
              style={{
                background: "hsl(260 30% 94%)",
                border: "1px solid hsl(260 25% 88%)",
                color: "hsl(260 40% 50%)",
              }}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // POPOVER MODE - Original implementation
  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
             className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold transition-all",
              "text-[hsl(var(--btn-params-fg))]",
              isOpen
                ? "shadow-[0_0_24px_-4px_hsl(var(--btn-params)/0.5)]"
                : "shadow-[0_0_18px_-4px_hsl(var(--btn-params)/0.35)]"
            )}
            style={{
              background: "linear-gradient(135deg, hsl(165 75% 42%), hsl(155 70% 40%), hsl(145 65% 38%))",
              border: "1px solid hsl(165 75% 42% / 0.4)",
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Parameters</span>

            {activeOverrides > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold">
                {activeOverrides} override{activeOverrides > 1 ? "s" : ""}
              </span>
            )}

            {isLocked && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/25 text-white text-[9px] font-bold">🔒 LOCKED</span>
            )}

            <span className="ml-auto opacity-70">
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-[calc(100vw-4rem)] max-w-xl p-0 rounded-3xl overflow-hidden border-0"
          style={{
            background: "linear-gradient(160deg, hsl(240 20% 98%), hsl(280 15% 97%), hsl(220 18% 96%), hsl(200 15% 97%))",
            boxShadow: "0 25px 60px -12px hsl(240 40% 30% / 0.25), 0 8px 24px -8px hsl(260 50% 40% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            border: "1px solid hsl(260 30% 88% / 0.6)",
          }}
        >
          {/* Header — aurora gradient */}
          <div
            className="px-5 py-3.5"
            style={{
              background: "linear-gradient(135deg, hsl(260 45% 92% / 0.8), hsl(200 40% 92% / 0.6), hsl(320 35% 93% / 0.5))",
              borderBottom: "1px solid hsl(260 25% 88% / 0.5)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(260 60% 60%), hsl(300 55% 58%))" }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.25em]"
                style={{
                  background: "linear-gradient(135deg, hsl(260 50% 40%), hsl(300 45% 45%), hsl(340 40% 50%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Interactive Parameter Override
              </span>
            </div>
            <p className="text-[9px] mt-1.5 ml-8" style={{ color: "hsl(260 15% 55%)" }}>
              ড্রপডাউন থেকে সিলেক্ট করুন — স্বয়ংক্রিয়ভাবে ব্লুপ্রিন্টে সিঙ্ক হবে
            </p>
          </div>

          {/* Parameters Grid */}
          <div className="p-3.5 space-y-2.5 max-h-[50vh] overflow-y-auto scrollbar-thin">
            <TooltipProvider delayDuration={200}>
              {PARAM_CONFIGS.map((config) => (
                <ParamRow
                  key={config.key}
                  config={config}
                  currentValue={params[config.key]}
                  onSelect={(value) => onParamChange(config.key, value)}
                  onClear={() => onParamChange(config.key, DEFAULT_PARAMS[config.key])}
                  theme={ROW_THEMES[config.key]}
                />
              ))}
            </TooltipProvider>
          </div>

          {/* Active Overrides Summary — frosted glass with scroll */}
          <div
            className="px-4 py-3"
            style={{
              background: "linear-gradient(135deg, hsl(240 15% 96% / 0.8), hsl(260 12% 95% / 0.7))",
              borderTop: "1px solid hsl(260 20% 90% / 0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Scroll controls + Tags */}
            <div className="flex items-center gap-2">
              {/* Left Scroll Button */}
              <button
                onClick={scrollLeft}
                className="shrink-0 p-1.5 rounded-xl transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, hsl(260 40% 95%), hsl(280 35% 94%))",
                  border: "1px solid hsl(260 30% 88%)",
                  color: "hsl(260 40% 50%)",
                  boxShadow: "0 2px 6px -2px hsl(260 30% 70% / 0.3)",
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Scrollable Tags Container */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-x-auto scrollbar-none scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="flex gap-1.5 py-0.5">
                  {PARAM_CONFIGS.map((config) => {
                    const val = params[config.key];
                    const selectedVals = parseMulti(val);
                    const displayLabel = selectedVals.length > 1
                      ? `${selectedVals.length}টি`
                      : (config.options.find((o) => o.value === val)?.label || val);
                    const isDefault = val === DEFAULT_PARAMS[config.key];
                    const theme = ROW_THEMES[config.key];
                    return (
                      <span
                        key={config.key}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0"
                        style={{
                          background: isDefault ? theme.summaryBg : theme.summaryActiveBg,
                          border: `1px solid ${isDefault ? theme.summaryBorder : theme.summaryActiveBorder}`,
                          color: isDefault ? theme.summaryText : theme.summaryActiveText,
                          boxShadow: isDefault ? "none" : `0 2px 8px -2px ${theme.summaryActiveBorder}`,
                        }}
                      >
                        {config.title.split(" ")[0]}:
                        <span className="font-extrabold">
                          {displayLabel}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right Scroll Button */}
              <button
                onClick={scrollRight}
                className="shrink-0 p-1.5 rounded-xl transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, hsl(260 40% 95%), hsl(280 35% 94%))",
                  border: "1px solid hsl(260 30% 88%)",
                  color: "hsl(260 40% 50%)",
                  boxShadow: "0 2px 6px -2px hsl(260 30% 70% / 0.3)",
                }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ParamRow({
  config,
  currentValue,
  onSelect,
  onClear,
  theme,
}: {
  config: ParamConfig;
  currentValue: string;
  onSelect: (value: string) => void;
  onClear: () => void;
  theme: { bg: string; border: string; activeBg: string; activeBorder: string; activeText: string; hoverBg: string; hoverBorder: string; icon: string };
}) {
  const hasValue = currentValue !== "" && currentValue !== DEFAULT_PARAMS[config.key];
  return (
    <div
      className="rounded-2xl p-3.5 transition-all"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 2px 8px -3px ${theme.border}`,
      }}
    >
      {/* Label + Help */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: theme.activeBg }} />
        <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(230 25% 25%)" }}>
          {config.titleBn}
        </span>
        <span className="text-[9px] font-mono" style={{ color: "hsl(230 10% 55%)" }}>
          {config.title}
        </span>

        {hasValue && (
          <button
            onClick={onClear}
            className="ml-1 p-1 rounded-lg transition-all hover:scale-110"
            style={{
              background: "hsl(0 70% 95%)",
              border: "1px solid hsl(0 60% 85%)",
              color: "hsl(0 60% 50%)",
            }}
            title="রিসেট করুন"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="ml-auto p-1 rounded-lg transition-colors"
              style={{ color: theme.icon }}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="max-w-[220px] text-xs rounded-2xl shadow-2xl border-0 p-3"
            style={{
              background: "hsl(0 0% 100%)",
              boxShadow: `0 12px 32px -8px ${theme.activeBg}40`,
              border: `1px solid ${theme.border}`,
            }}
          >
            <p className="font-extrabold text-[10px] mb-1" style={{ color: theme.activeBg }}>{config.dharaRef}</p>
            <p className="text-[10px] leading-relaxed" style={{ color: "hsl(230 15% 45%)" }}>{config.dharaDesc}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Options — Multi-select enabled */}
      <div className="flex flex-wrap gap-2">
        {config.options.map((opt) => {
          const selectedVals = parseMulti(currentValue);
          const isActive = selectedVals.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(toggleMulti(currentValue, opt.value))}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: isActive ? theme.activeBg : "hsl(0 0% 100% / 0.85)",
                border: `1.5px solid ${isActive ? theme.activeBorder : theme.border}`,
                color: isActive ? theme.activeText : "hsl(230 15% 45%)",
                boxShadow: isActive
                  ? `0 4px 14px -3px ${theme.activeBg}50, inset 0 1px 0 hsl(0 0% 100% / 0.2)`
                  : "0 1px 3px -1px hsl(230 20% 70% / 0.2)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = theme.hoverBg;
                  e.currentTarget.style.borderColor = theme.hoverBorder;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "hsl(0 0% 100% / 0.85)";
                  e.currentTarget.style.borderColor = theme.border;
                }
              }}
            >
              {isActive && <Check className="w-3 h-3" />}
              {opt.label}
              {opt.labelBn && (
                <span className="ml-1 text-[8px] opacity-60">({opt.labelBn})</span>
              )}
            </button>
          );
        })}
      </div>
      {parseMulti(currentValue).length > 1 && (
        <div className="mt-1.5 text-[8px] font-bold" style={{ color: theme.activeBg }}>
          ✨ {parseMulti(currentValue).length}টি সিলেক্টেড — হাইব্রিড কম্বিনেশন
        </div>
      )}
    </div>
  );
}

export function detectParamOverrides(text: string): Partial<BlueprintParams> {
  const overrides: Partial<BlueprintParams> = {};
  const lower = text.toLowerCase();

  // Voice
  if (/কথা\s*(থাকবে\s*না|নেই|বাদ|রাখবেন?\s*না)/i.test(text) || /no\s*voice/i.test(text) || /silent\s*dialogue/i.test(text)) {
    overrides.voicePresence = "no";
  } else if (/কথা\s*(থাকবে|আছে|রাখ|দিন)/i.test(text) || /voice\s*yes/i.test(text) || /with\s*dialogue/i.test(text)) {
    overrides.voicePresence = "yes";
  }

  // Framing → lensAperture
  if (/macro/i.test(lower) || /ম্যাক্রো/i.test(text)) {
    overrides.lensAperture = "macro-100mm";
  } else if (/close[\s-]*up/i.test(lower) || /ক্লোজ[\s-]*আপ/i.test(text)) {
    overrides.lensAperture = "portrait-85mm";
  } else if (/full\s*shot/i.test(lower) || /ফুল\s*শট/i.test(text) || /wide/i.test(lower)) {
    overrides.lensAperture = "ultra-wide-16mm";
  } else if (/medium\s*shot/i.test(lower) || /মিডিয়াম/i.test(text)) {
    overrides.lensAperture = "standard-35mm";
  }

  // Audio → audioImmersionMode
  if (/asmr/i.test(lower) || /isolated/i.test(lower) || /ফলি/i.test(text)) {
    overrides.audioImmersionMode = "isolated-asmr";
  } else if (/surround/i.test(lower) || /spatial/i.test(lower) || /মিউজিক/i.test(text)) {
    overrides.audioImmersionMode = "spatial-surround";
  } else if (/silent/i.test(lower) || /নীরব/i.test(text) || /muffled/i.test(lower)) {
    overrides.audioImmersionMode = "muffled-underwater";
  } else if (/bass/i.test(lower) || /অ্যাম্বিয়েন্ট/i.test(text)) {
    overrides.audioImmersionMode = "high-octane-bass";
  }

  // Realism
  if (/strict\s*realism/i.test(lower) || /কঠোর/i.test(text)) {
    overrides.realismLevel = "strict-realism";
  } else if (/mutation/i.test(lower) || /মিউটেশন/i.test(text)) {
    overrides.realismLevel = "bio-authentic-mutation";
  } else if (/stylized/i.test(lower) || /স্টাইলাইজড/i.test(text)) {
    overrides.realismLevel = "stylized";
  }

  // Episode
  if (/series/i.test(lower) || /সিরিজ/i.test(text)) {
    overrides.episodeCount = "series";
  } else if (/(\d+)\s*(?:episode|পর্ব|ep)/i.test(text)) {
    const match = text.match(/(\d+)\s*(?:episode|পর্ব|ep)/i);
    if (match) {
      const num = match[1];
      if (["1", "2", "3"].includes(num)) overrides.episodeCount = num as "1" | "2" | "3";
    }
  }

  // Aspect Ratio
  if (/16[:x]9/i.test(lower) || /ওয়াইড/i.test(text)) overrides.aspectRatio = "16:9";
  else if (/9[:x]16/i.test(lower) || /ভার্টিক্যাল|রিলস/i.test(text)) overrides.aspectRatio = "9:16";
  else if (/1[:x]1/i.test(lower) || /স্কয়ার/i.test(text)) overrides.aspectRatio = "1:1";
  else if (/4[:x]3/i.test(lower) || /ক্লাসিক/i.test(text)) overrides.aspectRatio = "4:3";

  // Duration
  if (/5\s*s(ec)?/i.test(lower) || /৫\s*সেকেন্ড/i.test(text)) overrides.duration = "5s";
  else if (/15\s*s(ec)?/i.test(lower) || /১৫\s*সেকেন্ড/i.test(text)) overrides.duration = "15s";
  else if (/30\s*s(ec)?/i.test(lower) || /৩০\s*সেকেন্ড/i.test(text)) overrides.duration = "30s";
  else if (/60\s*s(ec)?|1\s*min/i.test(lower) || /১\s*মিনিট/i.test(text)) overrides.duration = "60s";

  // Resolution
  if (/8k/i.test(lower) || /৮k/i.test(text)) overrides.resolution = "8K";
  else if (/4k/i.test(lower) || /৪k/i.test(text)) overrides.resolution = "4K";
  else if (/fhd|1080p/i.test(lower)) overrides.resolution = "FHD";
  else if (/hd|720p/i.test(lower)) overrides.resolution = "HD";

  // Frame Rate
  if (/120\s*fps/i.test(lower) || /স্লো[\s-]*মো/i.test(text)) overrides.frameRate = "120fps";
  else if (/60\s*fps/i.test(lower) || /স্মুথ/i.test(text)) overrides.frameRate = "60fps";
  else if (/30\s*fps/i.test(lower) || /স্ট্যান্ডার্ড/i.test(text)) overrides.frameRate = "30fps";
  else if (/24\s*fps/i.test(lower) || /সিনেমা/i.test(text)) overrides.frameRate = "24fps";

  // Camera Movement → cameraEyeMovement
  if (/static/i.test(lower) || /স্থির/i.test(text)) overrides.cameraEyeMovement = "static-witness";
  else if (/handheld/i.test(lower) || /হ্যান্ডহেল্ড/i.test(text)) overrides.cameraEyeMovement = "handheld-tremor";
  else if (/dolly/i.test(lower) || /ডলি/i.test(text)) overrides.cameraEyeMovement = "mechanical-slide";
  else if (/drone/i.test(lower) || /ড্রোন/i.test(text)) overrides.cameraEyeMovement = "predator-chase";

  // Lighting → lightSourceDirection
  if (/natural\s*light/i.test(lower) || /প্রাকৃতিক/i.test(text)) overrides.lightSourceDirection = "soft-ambient";
  else if (/studio\s*light/i.test(lower) || /স্টুডিও\s*আলো/i.test(text)) overrides.lightSourceDirection = "high-contrast-rim";
  else if (/dramatic\s*light/i.test(lower) || /নাটকীয়\s*আলো/i.test(text)) overrides.lightSourceDirection = "dramatic-backlit";
  else if (/golden[\s-]*hour/i.test(lower) || /সোনালি/i.test(text)) overrides.lightSourceDirection = "moody-side-light";

  // Color Grade
  if (/neutral/i.test(lower) || /নিউট্রাল/i.test(text)) overrides.colorGrade = "neutral";
  else if (/warm\s*color/i.test(lower) || /উষ্ণ/i.test(text)) overrides.colorGrade = "warm";
  else if (/cool\s*color/i.test(lower) || /শীতল/i.test(text)) overrides.colorGrade = "cool";
  else if (/cinematic/i.test(lower) || /সিনেমাটিক/i.test(text)) overrides.colorGrade = "cinematic";

  // Environment
  if (/indoor/i.test(lower) || /ইনডোর/i.test(text)) overrides.environment = "indoor";
  else if (/outdoor/i.test(lower) || /আউটডোর/i.test(text)) overrides.environment = "outdoor";
  else if (/studio/i.test(lower) || /স্টুডিও/i.test(text)) overrides.environment = "studio";

  // Time of Day
  if (/day\s*time/i.test(lower) || /দিনের\s*বেলা/i.test(text)) overrides.timeOfDay = "day";
  else if (/night/i.test(lower) || /রাত/i.test(text)) overrides.timeOfDay = "night";
  else if (/blue[\s-]*hour/i.test(lower) || /নীল/i.test(text)) overrides.timeOfDay = "blue-hour";

  // Mood
  if (/happy/i.test(lower) || /আনন্দ/i.test(text)) overrides.mood = "happy";
  else if (/tense/i.test(lower) || /উত্তেজনা/i.test(text)) overrides.mood = "tense";
  else if (/peaceful/i.test(lower) || /শান্ত/i.test(text)) overrides.mood = "peaceful";
  else if (/dramatic/i.test(lower) || /নাটকীয়/i.test(text)) overrides.mood = "dramatic";

  // === VIRAL MASTERY DETECTION ===
  // Hook → viralHookArchetype
  if (/explosive\s*hook/i.test(lower) || /বিস্ফোরক/i.test(text)) overrides.viralHookArchetype = "impossible-action";
  else if (/strong\s*hook/i.test(lower) || /শক্তিশালী\s*হুক/i.test(text)) overrides.viralHookArchetype = "emotional-gut-punch";
  
  // Opening Style
  if (/question\s*open/i.test(lower) || /প্রশ্ন\s*দিয়ে/i.test(text)) overrides.openingStyle = "question";
  else if (/shock\s*open/i.test(lower) || /শক\s*দিয়ে/i.test(text)) overrides.openingStyle = "shock";
  else if (/mystery/i.test(lower) || /রহস্য/i.test(text)) overrides.openingStyle = "mystery";
  
  // Curiosity Gap
  if (/cliffhanger/i.test(lower) || /ক্লিফহ্যাঙ্গার/i.test(text)) overrides.curiosityGap = "cliffhanger";
  else if (/intense\s*curiosity/i.test(lower) || /তীব্র\s*কৌতূহল/i.test(text)) overrides.curiosityGap = "intense";
  
  // Narrative Arc
  if (/twist[\s-]*ending/i.test(lower) || /টুইস্ট\s*এন্ডিং/i.test(text)) overrides.narrativeArc = "twist-ending";
  else if (/circular/i.test(lower) || /বৃত্তাকার/i.test(text)) overrides.narrativeArc = "circular";
  else if (/non[\s-]*linear/i.test(lower) || /জটিল/i.test(text)) overrides.narrativeArc = "non-linear";
  
  // Emotional Journey
  if (/roller[\s-]*coaster/i.test(lower) || /রোলার/i.test(text)) overrides.emotionalJourney = "roller-coaster";
  else if (/crescendo/i.test(lower) || /ক্রিসেন্ডো/i.test(text)) overrides.emotionalJourney = "crescendo";
  else if (/build[\s-]*up/i.test(lower) || /ক্রমবর্ধমান/i.test(text)) overrides.emotionalJourney = "build-up";
  
  // Twist Intensity
  if (/mind[\s-]*blow/i.test(lower) || /মাইন্ডব্লো/i.test(text)) overrides.twistIntensity = "mind-blowing";
  
  // Speed Dynamics
  if (/slow[\s-]*mo/i.test(lower) || /স্লো[\s-]*মো/i.test(text)) overrides.speedDynamics = "slow-mo";
  else if (/speed[\s-]*ramp/i.test(lower) || /র‍্যাম্প/i.test(text)) overrides.speedDynamics = "speed-ramp";
  else if (/time[\s-]*lapse/i.test(lower) || /টাইমল্যাপস/i.test(text)) overrides.speedDynamics = "time-lapse";
  
  // Transition Style
  if (/seamless/i.test(lower) || /সিমলেস/i.test(text)) overrides.transitionStyle = "seamless";
  else if (/creative\s*transition/i.test(lower) || /ক্রিয়েটিভ/i.test(text)) overrides.transitionStyle = "creative";
  
  // Shareability
  if (/viral[\s-]*bait/i.test(lower) || /ভাইরাল/i.test(text)) overrides.shareability = "viral-bait";
  
  // Pacing
  if (/hyper[\s-]*pace/i.test(lower) || /হাইপার/i.test(text)) overrides.pacing = "hyper";
  else if (/fast[\s-]*pace/i.test(lower) || /দ্রুত\s*গতি/i.test(text)) overrides.pacing = "fast";
  
  // Loop Friendly
  if (/perfect[\s-]*loop/i.test(lower) || /পারফেক্ট\s*লুপ/i.test(text)) overrides.loopFriendly = "perfect-loop";
  
  // Sound Trend
  if (/trending\s*sound/i.test(lower) || /ট্রেন্ডিং/i.test(text)) overrides.soundTrend = "trending";

  return overrides;
}

/** Format a param value for prompt — handles comma-separated multi-values */
function fmtVal(val: string): string {
  if (val.includes(",")) {
    return val.split(",").map(v => v.trim()).join(" + ");
  }
  return val;
}

export function paramsToPromptString(params: BlueprintParams): string {
  const lines = [
    `═══ CORE SETTINGS ═══`,
    `কথাবার্তা (Voice): ${params.voicePresence === "yes" ? "হ্যাঁ" : "না"}`,
    `অডিও ইমার্সন মোড: ${fmtVal(params.audioImmersionMode)}`,
    `রিয়েলিজম: ${fmtVal(params.realismLevel)}`,
    `পর্ব সংখ্যা: ${params.episodeCount === "series" ? "Series" : params.episodeCount}`,
    ``,
    `═══ 🎤 VOICE & NARRATION ═══`,
    `ভয়েস ভাষা: ${fmtVal(params.voiceLanguage)}`,
    `ভয়েস লিঙ্গ: ${fmtVal(params.voiceGender)}`,
    `ভয়েস বয়স: ${fmtVal(params.voiceAge)}`,
    `ভয়েস আবেগ: ${fmtVal(params.voiceEmotion)}`,
    `ভয়েস টোন: ${fmtVal(params.voiceTone)}`,
    `ভয়েস অ্যাক্সেন্ট: ${fmtVal(params.voiceAccent)}`,
    `ন্যারেটর স্টাইল: ${fmtVal(params.narratorStyle)}`,
    ``,
    `═══ 🌍 LOCATION & SETTING ═══`,
    `দেশ: ${fmtVal(params.country)}`,
    `লোকেশন ধরন: ${fmtVal(params.locationType)}`,
    `লোকেশন ভাইব: ${fmtVal(params.locationVibe)}`,
    `আবহাওয়া: ${fmtVal(params.weather)}`,
    `ঋতু: ${fmtVal(params.season)}`,
    ``,
    `═══ OUTPUT FORMAT ═══`,
    `অ্যাসপেক্ট রেশিও: ${fmtVal(params.aspectRatio)}`,
    `ভিডিও দৈর্ঘ্য: ${fmtVal(params.duration)}`,
    `রেজোলিউশন: ${fmtVal(params.resolution)}`,
    `ফ্রেম রেট: ${fmtVal(params.frameRate)}`,
    ``,
    `═══ CAMERA & VISUAL ═══`,
    `লেন্স ও অ্যাপারচার: ${fmtVal(params.lensAperture)}`,
    `ক্যামেরা 'আই' মুভমেন্ট: ${fmtVal(params.cameraEyeMovement)}`,
    `লাইট সোর্স ডিরেকশন: ${fmtVal(params.lightSourceDirection)}`,
    `কালার গ্রেড: ${fmtVal(params.colorGrade)}`,
    ``,
    `═══ ENVIRONMENT & MOOD ═══`,
    `পরিবেশ: ${fmtVal(params.environment)}`,
    `দিনের সময়: ${fmtVal(params.timeOfDay)}`,
    `মুড/আবেগ: ${fmtVal(params.mood)}`,
    ``,
    `═══ 🚀 VIRAL MASTERY: HOOK & ATTENTION ═══`,
    `ভাইরাল হুক আর্কিটাইপ: ${fmtVal(params.viralHookArchetype)}`,
    `শুরুর ধরন: ${fmtVal(params.openingStyle)}`,
    `কৌতূহল তৈরি: ${fmtVal(params.curiosityGap)}`,
    ``,
    `═══ 🚀 VIRAL MASTERY: STORYTELLING ARC ═══`,
    `গল্পের কাঠামো: ${fmtVal(params.narrativeArc)}`,
    `আবেগের যাত্রা: ${fmtVal(params.emotionalJourney)}`,
    `টুইস্ট তীব্রতা: ${fmtVal(params.twistIntensity)}`,
    `চরম মুহূর্ত: ${fmtVal(params.peakMoment)}`,
    ``,
    `═══ 🚀 VIRAL MASTERY: VISUAL IMPACT ═══`,
    `ভিজ্যুয়াল ড্রামা লেভেল: ${fmtVal(params.visualDramaLevel)}`,
    `গতি ডায়নামিক্স: ${fmtVal(params.speedDynamics)}`,
    `ট্রানজিশন স্টাইল: ${fmtVal(params.transitionStyle)}`,
    `VFX তীব্রতা: ${fmtVal(params.vfxIntensity)}`,
    ``,
    `═══ 🚀 VIRAL MASTERY: ENGAGEMENT TRIGGERS ═══`,
    `সম্পর্কযোগ্যতা: ${fmtVal(params.relatability)}`,
    `নস্টালজিয়া লেভেল: ${fmtVal(params.nostalgiaLevel)}`,
    `শক ভ্যালু: ${fmtVal(params.shockValue)}`,
    `শেয়ারযোগ্যতা: ${fmtVal(params.shareability)}`,
    ``,
    `═══ 🚀 VIRAL MASTERY: PLATFORM OPTIMIZATION ═══`,
    `লুপ ফ্রেন্ডলি: ${fmtVal(params.loopFriendly)}`,
    `গতি/পেসিং: ${fmtVal(params.pacing)}`,
    `CTA অবস্থান: ${fmtVal(params.ctaPlacement)}`,
    `সাউন্ড ট্রেন্ড: ${fmtVal(params.soundTrend)}`,
    ``,
    `═══ 🎯 ADVANCED CREATIVE PARAMETERS ═══`,
    `প্যাটার্ন ডিসরাপশন: ${fmtVal(params.patternDisruption)}`,
    `অডিয়েন্স সাইকোলজি ট্রিগার: ${fmtVal(params.audiencePsychologyTrigger)}`,
    `লেন্স ও অ্যাপারচার: ${fmtVal(params.lensAperture)}`,
    `লাইট সোর্স ডিরেকশন: ${fmtVal(params.lightSourceDirection)}`,
    ``,
    `═══ 💎 SUPREME POWER PARAMETERS ═══`,
    `ভিজ্যুয়াল ড্রামা লেভেল: ${fmtVal(params.visualDramaLevel)}`,
    `ইনফরমেশন ডেনসিটি: ${fmtVal(params.informationDensity)}`,
    `ক্যামেরা 'আই' মুভমেন্ট: ${fmtVal(params.cameraEyeMovement)}`,
    `অডিও ইমার্সন মোড: ${fmtVal(params.audioImmersionMode)}`,
    `ভাইরাল হুক আর্কিটাইপ: ${fmtVal(params.viralHookArchetype)}`,
    ``,
    `═══ 🔥 মহা-শক্তি (MEGA POWER) PARAMETERS ═══`,
    `ফিক্সড থিম: ${fmtVal(params.fixedTheme)}`,
    `কোর ওয়ার্কফ্লো: ${fmtVal(params.coreWorkflow)}`,
    `কেন্দ্রীয় আকর্ষণ: ${fmtVal(params.centralAttraction)}`,
    `ফিক্সড ক্যারেক্টার: ${fmtVal(params.fixedCharacter)}`,
    `কোর ইভেন্ট ফ্লো: ${fmtVal(params.coreEventFlow)}`,
    `পটভূমি মানুষ: ${fmtVal(params.backgroundPeople)}`,
    `ভিজুয়াল উপাদান: ${fmtVal(params.visualElements)}`,
    `অপরিবর্তনীয় উপাদান: ${fmtVal(params.immutableMutableElements)}`,
    `পরিবর্তনযোগ্য উপাদান: ${fmtVal(params.mutableElements)}`,
    `ভেরিয়েবল চরিত্র তালিকা: ${fmtVal(params.variableCharacterList)}`,
    `নিষিদ্ধ উপাদান: ${fmtVal(params.forbiddenElements)}`,
    `সৃজনশীল অনুঘটক: ${fmtVal(params.creativeCatalyst)}`,
    ``,
    `[NOTE: When multiple values are selected (shown as "A + B"), create a HYBRID concept blending ALL selected elements. Final output MUST be in English only.]`,
  ];
  return lines.join("\n");
}
