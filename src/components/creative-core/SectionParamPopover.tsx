import { useState } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type BlueprintParams, DEFAULT_PARAMS } from "./BlueprintParamsOverride";

/** Helper: parse comma-separated multi-value string into array */
function parseMultiValue(val: string): string[] {
  if (!val) return [];
  return val.split(",").map(v => v.trim()).filter(Boolean);
}

/** Helper: toggle a value in a comma-separated string */
function toggleMultiValue(current: string, toggleVal: string): string {
  const arr = parseMultiValue(current);
  const idx = arr.indexOf(toggleVal);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(toggleVal);
  }
  return arr.join(",") || toggleVal; // never empty — fallback to clicked value
}

type SectionKey = "ka" | "kha" | "ga";

interface ParamOptionItem {
  value: string;
  label: string;
  labelBn?: string;
}

interface ParamConfigItem {
  key: keyof BlueprintParams;
  titleBn: string;
  options: ParamOptionItem[];
}

/**
 * Which params belong to which section — reorganized by logical grouping & priority.
 *
 * সারণী (ক) — Series-Static: সিরিজজুড়ে স্থির থাকে (ভয়েস আইডেন্টিটি, টেকনিক্যাল স্পেক, সিরিজ-লেভেল সিদ্ধান্ত)
 * সারণী (খ) — Episode-Variable: প্রতি এপিসোডে বদলায় (লোকেশন, ক্যামেরা, মুড, লাইটিং, সাউন্ড)
 * সারণী (গ) — Storytelling & Virality: গল্পের কাঠামো, ভাইরালিটি, পেসিং, ইফেক্ট
 */
/**
 * Params shown as EXTRA rows (below default labels).
 * Params that are mapped to defaultLabels via `paramKey` are NOT listed here
 * to avoid duplicate rows.
 */
/**
 * Params shown as EXTRA rows (below default labels).
 * IMPORTANT: Params already in DEFAULT_LABELS_KA (via paramKey or sceneParamKey)
 * are NOT listed here to avoid duplicate rows across sections.
 * 
 * Excluded from kha (already in ক via DEFAULT_LABELS):
 *   country, locationType, timeOfDay, season, weather, mood,
 *   cameraMovement, lighting, colorGrade, transitionStyle, lensAperture/lensType,
 *   aspectRatio, resolution, frameRate, duration
 */
export const SECTION_PARAMS: Record<SectionKey, (keyof BlueprintParams)[]> = {
  ka: [
    // --- সিরিজ-লেভেল সিদ্ধান্ত (not in default labels) ---
    "realismLevel",
    "episodeCount",
    // --- ভয়েস আইডেন্টিটি (not in default labels) ---
    "voiceGender",
    "voiceAge",
    "voiceAccent",
  ],
  kha: [
    // --- লোকেশন ভাইব (not in ক default labels) ---
    "locationVibe",
    "environment",
    // --- সাউন্ড ---
    "voiceTone",
    "soundTrend",
    // --- টেকনিক্যাল ভিজুয়াল (not in ক default labels) ---
    "lightSourceDirection",
    "vfxIntensity",
    // --- Supreme Power (খ) ---
    "visualDramaLevel",
    "cameraEyeMovement",
    "audioImmersionMode",
  ],
  ga: [
    // --- গল্পের কাঠামো ও ভাইরাল সাইকোলজি ---
    "openingStyle",
    "narrativeArc",
    "emotionalJourney",
    "peakMoment",
    "twistIntensity",
    "curiosityGap",
    // --- পেসিং ও এনগেজমেন্ট ---
    "pacing",
    "speedDynamics",
    "relatability",
    "shockValue",
    "shareability",
    "nostalgiaLevel",
    "loopFriendly",
    "ctaPlacement",
    "futuristicSystems",
    "patternDisruption",
    "audiencePsychologyTrigger",
    // --- Supreme Power (গ) ---
    "informationDensity",
    "viralHookArchetype",
  ],
};

// Compact param configs with Bengali labels and comprehensive value options
export const PARAM_CONFIGS_MAP: Record<keyof BlueprintParams, ParamConfigItem> = {
  voicePresence: { key: "voicePresence", titleBn: "কথাবার্তার উপস্থিতি", options: [{ value: "yes", label: "হ্যাঁ" }, { value: "no", label: "না" }] },
  realismLevel: { key: "realismLevel", titleBn: "রিয়েলিজম মোড", options: [{ value: "strict-realism", label: "কঠোর" }, { value: "bio-authentic-mutation", label: "মিউটেশন" }, { value: "stylized", label: "স্টাইলাইজড" }] },
  episodeCount: { key: "episodeCount", titleBn: "পর্ব সংখ্যা", options: [{ value: "1", label: "১" }, { value: "2", label: "২" }, { value: "3", label: "৩" }, { value: "series", label: "সিরিজ" }] },
  voiceLanguage: { key: "voiceLanguage", titleBn: "ভয়েস ভাষা", options: [{ value: "bengali", label: "🇧🇩 বাংলা" }, { value: "english", label: "🇬🇧 English" }, { value: "hindi", label: "🇮🇳 हिंदी" }, { value: "arabic", label: "🇸🇦 العربية" }, { value: "spanish", label: "🇪🇸 Español" }, { value: "french", label: "🇫🇷 Français" }, { value: "german", label: "🇩🇪 Deutsch" }, { value: "japanese", label: "🇯🇵 日本語" }, { value: "korean", label: "🇰🇷 한국어" }, { value: "chinese", label: "🇨🇳 中文" }, { value: "portuguese", label: "🇧🇷 Português" }, { value: "russian", label: "🇷🇺 Русский" }, { value: "turkish", label: "🇹🇷 Türkçe" }, { value: "italian", label: "🇮🇹 Italiano" }, { value: "dutch", label: "🇳🇱 Nederlands" }] },
  voiceGender: { key: "voiceGender", titleBn: "ভয়েস লিঙ্গ", options: [{ value: "male", label: "পুরুষ" }, { value: "female", label: "মহিলা" }, { value: "neutral", label: "নিউট্রাল" }, { value: "child", label: "শিশু" }] },
  voiceAge: { key: "voiceAge", titleBn: "ভয়েস বয়স", options: [{ value: "young", label: "তরুণ" }, { value: "adult", label: "প্রাপ্তবয়স্ক" }, { value: "mature", label: "পরিণত" }, { value: "elderly", label: "বৃদ্ধ" }] },
  voiceEmotion: { key: "voiceEmotion", titleBn: "ভয়েস আবেগ", options: [{ value: "neutral", label: "স্বাভাবিক" }, { value: "happy", label: "আনন্দিত" }, { value: "sad", label: "দুঃখিত" }, { value: "angry", label: "রাগান্বিত" }, { value: "excited", label: "উত্তেজিত" }, { value: "calm", label: "শান্ত" }, { value: "fearful", label: "ভীত" }, { value: "surprised", label: "বিস্মিত" }, { value: "loving", label: "স্নেহপূর্ণ" }, { value: "confident", label: "আত্মবিশ্বাসী" }] },
  voiceTone: { key: "voiceTone", titleBn: "ভয়েস টোন", options: [{ value: "formal", label: "ফর্মাল" }, { value: "casual", label: "ক্যাজুয়াল" }, { value: "dramatic", label: "নাটকীয়" }, { value: "whispery", label: "ফিসফিস" }, { value: "energetic", label: "উদ্যমী" }, { value: "soothing", label: "প্রশান্তিদায়ক" }] },
  voiceAccent: { key: "voiceAccent", titleBn: "ভয়েস অ্যাক্সেন্ট", options: [{ value: "native", label: "দেশীয়" }, { value: "british", label: "ব্রিটিশ" }, { value: "american", label: "আমেরিকান" }, { value: "australian", label: "অস্ট্রেলিয়ান" }, { value: "indian", label: "ভারতীয়" }, { value: "middle-eastern", label: "মধ্যপ্রাচ্য" }, { value: "european", label: "ইউরোপীয়" }] },
  narratorStyle: { key: "narratorStyle", titleBn: "ন্যারেটর স্টাইল", options: [{ value: "storyteller", label: "গল্পকার" }, { value: "documentary", label: "ডকুমেন্টারি" }, { value: "news-anchor", label: "সংবাদ" }, { value: "conversational", label: "কথোপকথন" }, { value: "poetic", label: "কাব্যিক" }, { value: "suspenseful", label: "সাসপেন্স" }] },
  country: { key: "country", titleBn: "দেশ", options: [{ value: "bangladesh", label: "🇧🇩 বাংলাদেশ" }, { value: "india", label: "🇮🇳 ভারত" }, { value: "usa", label: "🇺🇸 আমেরিকা" }, { value: "uk", label: "🇬🇧 যুক্তরাজ্য" }, { value: "uae", label: "🇦🇪 সংযুক্ত আরব" }, { value: "saudi", label: "🇸🇦 সৌদি" }, { value: "japan", label: "🇯🇵 জাপান" }, { value: "china", label: "🇨🇳 চীন" }, { value: "korea", label: "🇰🇷 কোরিয়া" }, { value: "germany", label: "🇩🇪 জার্মানি" }, { value: "france", label: "🇫🇷 ফ্রান্স" }, { value: "italy", label: "🇮🇹 ইতালি" }, { value: "spain", label: "🇪🇸 স্পেন" }, { value: "russia", label: "🇷🇺 রাশিয়া" }, { value: "brazil", label: "🇧🇷 ব্রাজিল" }, { value: "australia", label: "🇦🇺 অস্ট্রেলিয়া" }, { value: "canada", label: "🇨🇦 কানাডা" }, { value: "egypt", label: "🇪🇬 মিশর" }, { value: "turkey", label: "🇹🇷 তুরস্ক" }, { value: "indonesia", label: "🇮🇩 ইন্দোনেশিয়া" }] },
  locationType: { key: "locationType", titleBn: "লোকেশন ধরন", options: [{ value: "city", label: "শহর" }, { value: "village", label: "গ্রাম" }, { value: "forest", label: "বন" }, { value: "beach", label: "সমুদ্র সৈকত" }, { value: "mountain", label: "পাহাড়" }, { value: "desert", label: "মরুভূমি" }, { value: "river", label: "নদী" }, { value: "urban", label: "নগর" }, { value: "suburban", label: "উপনগর" }, { value: "rural", label: "গ্রামীণ" }] },
  locationVibe: { key: "locationVibe", titleBn: "লোকেশন ভাইব", options: [{ value: "modern", label: "আধুনিক" }, { value: "traditional", label: "ঐতিহ্যবাহী" }, { value: "futuristic", label: "ভবিষ্যৎমুখী" }, { value: "historical", label: "ঐতিহাসিক" }, { value: "natural", label: "প্রাকৃতিক" }, { value: "industrial", label: "শিল্প" }, { value: "spiritual", label: "আধ্যাত্মিক" }] },
  weather: { key: "weather", titleBn: "আবহাওয়া", options: [{ value: "sunny", label: "রৌদ্রোজ্জ্বল" }, { value: "cloudy", label: "মেঘলা" }, { value: "rainy", label: "বৃষ্টি" }, { value: "stormy", label: "ঝড়" }, { value: "snowy", label: "তুষারপাত" }, { value: "foggy", label: "কুয়াশা" }, { value: "windy", label: "ঝড়ো হাওয়া" }, { value: "clear", label: "পরিষ্কার" }] },
  season: { key: "season", titleBn: "ঋতু", options: [{ value: "spring", label: "বসন্ত" }, { value: "summer", label: "গ্রীষ্ম" }, { value: "autumn", label: "শরৎ" }, { value: "winter", label: "শীত" }, { value: "monsoon", label: "বর্ষা" }, { value: "dry", label: "শুষ্ক" }] },
  environment: { key: "environment", titleBn: "পরিবেশ", options: [{ value: "indoor", label: "ইনডোর" }, { value: "outdoor", label: "আউটডোর" }, { value: "studio", label: "স্টুডিও" }, { value: "mixed", label: "মিক্সড" }] },
  timeOfDay: { key: "timeOfDay", titleBn: "দিনের সময়", options: [{ value: "day", label: "দিন" }, { value: "night", label: "রাত" }, { value: "golden-hour", label: "সোনালি ঘণ্টা" }, { value: "blue-hour", label: "নীল ঘণ্টা" }, { value: "dawn", label: "ভোর" }] },
  mood: { key: "mood", titleBn: "মুড/আবেগ", options: [{ value: "happy", label: "আনন্দময়" }, { value: "tense", label: "উত্তেজনাপূর্ণ" }, { value: "peaceful", label: "শান্ত" }, { value: "dramatic", label: "নাটকীয়" }, { value: "mysterious", label: "রহস্যময়" }] },
  colorGrade: { key: "colorGrade", titleBn: "কালার গ্রেড", options: [{ value: "neutral", label: "নিউট্রাল" }, { value: "warm", label: "উষ্ণ" }, { value: "cool", label: "শীতল" }, { value: "cinematic", label: "সিনেমাটিক" }, { value: "vintage", label: "ভিন্টেজ" }] },
  aspectRatio: { key: "aspectRatio", titleBn: "অ্যাসপেক্ট রেশিও", options: [{ value: "16:9", label: "16:9 ওয়াইড" }, { value: "9:16", label: "9:16 ভার্টিক্যাল" }, { value: "1:1", label: "1:1 স্কয়ার" }, { value: "4:3", label: "4:3 ক্লাসিক" }, { value: "21:9", label: "21:9 আল্ট্রাওয়াইড" }] },
  duration: { key: "duration", titleBn: "ভিডিও দৈর্ঘ্য", options: [{ value: "5s", label: "৫ সেকেন্ড" }, { value: "15s", label: "১৫ সেকেন্ড" }, { value: "30s", label: "৩০ সেকেন্ড" }, { value: "60s", label: "১ মিনিট" }, { value: "custom", label: "কাস্টম" }] },
  resolution: { key: "resolution", titleBn: "রেজোলিউশন", options: [{ value: "HD", label: "HD ৭২০p" }, { value: "FHD", label: "FHD ১০৮০p" }, { value: "4K", label: "4K" }, { value: "8K", label: "8K" }] },
  frameRate: { key: "frameRate", titleBn: "ফ্রেম রেট", options: [{ value: "24fps", label: "24 সিনেমা" }, { value: "30fps", label: "30 স্ট্যান্ডার্ড" }, { value: "60fps", label: "60 স্মুথ" }, { value: "120fps", label: "120 স্লো-মো" }] },
  openingStyle: { key: "openingStyle", titleBn: "শুরুর ধরন", options: [{ value: "question", label: "প্রশ্ন" }, { value: "shock", label: "শক" }, { value: "mystery", label: "রহস্য" }, { value: "action", label: "অ্যাকশন" }, { value: "emotion", label: "আবেগ" }] },
  curiosityGap: { key: "curiosityGap", titleBn: "কৌতূহল তৈরি", options: [{ value: "none", label: "নেই" }, { value: "mild", label: "হালকা" }, { value: "intense", label: "তীব্র" }, { value: "cliffhanger", label: "ক্লিফহ্যাঙ্গার" }] },
  speedDynamics: { key: "speedDynamics", titleBn: "গতি ডায়নামিক্স", options: [{ value: "normal", label: "স্বাভাবিক" }, { value: "slow-mo", label: "স্লো-মো" }, { value: "speed-ramp", label: "স্পীড র‍্যাম্প" }, { value: "time-lapse", label: "টাইমল্যাপস" }] },
  transitionStyle: { key: "transitionStyle", titleBn: "ট্রানজিশন স্টাইল", options: [{ value: "cut", label: "কাট" }, { value: "fade", label: "ফেড" }, { value: "creative", label: "ক্রিয়েটিভ" }, { value: "seamless", label: "সিমলেস" }] },
  vfxIntensity: { key: "vfxIntensity", titleBn: "VFX তীব্রতা", options: [{ value: "none", label: "নেই" }, { value: "subtle", label: "সূক্ষ্ম" }, { value: "moderate", label: "মাঝারি" }, { value: "heavy", label: "ভারী" }] },
  relatability: { key: "relatability", titleBn: "সম্পর্কযোগ্যতা", options: [{ value: "niche", label: "নিশ" }, { value: "moderate", label: "মাঝারি" }, { value: "universal", label: "সার্বজনীন" }, { value: "deeply-personal", label: "গভীর ব্যক্তিগত" }] },
  nostalgiaLevel: { key: "nostalgiaLevel", titleBn: "নস্টালজিয়া", options: [{ value: "none", label: "নেই" }, { value: "hint", label: "ইঙ্গিত" }, { value: "strong", label: "শক্তিশালী" }, { value: "core-theme", label: "মূল থিম" }] },
  narrativeArc: { key: "narrativeArc", titleBn: "গল্পের কাঠামো", options: [{ value: "linear", label: "সোজা" }, { value: "non-linear", label: "জটিল" }, { value: "circular", label: "বৃত্তাকার" }, { value: "twist-ending", label: "টুইস্ট" }] },
  emotionalJourney: { key: "emotionalJourney", titleBn: "আবেগের যাত্রা", options: [{ value: "flat", label: "সমতল" }, { value: "build-up", label: "ক্রমবর্ধমান" }, { value: "roller-coaster", label: "রোলার কোস্টার" }, { value: "crescendo", label: "ক্রিসেন্ডো" }] },
  twistIntensity: { key: "twistIntensity", titleBn: "টুইস্ট তীব্রতা", options: [{ value: "none", label: "নেই" }, { value: "subtle", label: "সূক্ষ্ম" }, { value: "medium", label: "মাঝারি" }, { value: "mind-blowing", label: "মাইন্ডব্লো" }] },
  peakMoment: { key: "peakMoment", titleBn: "চরম মুহূর্ত", options: [{ value: "early", label: "শুরুতে" }, { value: "middle", label: "মাঝে" }, { value: "climax", label: "ক্লাইম্যাক্স" }, { value: "end-reveal", label: "শেষে প্রকাশ" }] },
  shockValue: { key: "shockValue", titleBn: "শক ভ্যালু", options: [{ value: "none", label: "নেই" }, { value: "mild", label: "হালকা" }, { value: "moderate", label: "মাঝারি" }, { value: "high", label: "উচ্চ" }] },
  shareability: { key: "shareability", titleBn: "শেয়ারযোগ্যতা", options: [{ value: "low", label: "কম" }, { value: "medium", label: "মাঝারি" }, { value: "high", label: "উচ্চ" }, { value: "viral-bait", label: "ভাইরাল বেইট" }] },
  loopFriendly: { key: "loopFriendly", titleBn: "লুপ ফ্রেন্ডলি", options: [{ value: "no", label: "না" }, { value: "soft-loop", label: "হালকা লুপ" }, { value: "perfect-loop", label: "পারফেক্ট লুপ" }] },
  pacing: { key: "pacing", titleBn: "গতি/পেসিং", options: [{ value: "slow", label: "ধীর" }, { value: "moderate", label: "মাঝারি" }, { value: "fast", label: "দ্রুত" }, { value: "hyper", label: "হাইপার" }] },
  ctaPlacement: { key: "ctaPlacement", titleBn: "CTA অবস্থান", options: [{ value: "none", label: "নেই" }, { value: "end", label: "শেষে" }, { value: "middle", label: "মাঝে" }, { value: "throughout", label: "সর্বত্র" }] },
  soundTrend: { key: "soundTrend", titleBn: "সাউন্ড ট্রেন্ড", options: [{ value: "original", label: "অরিজিনাল" }, { value: "trending", label: "ট্রেন্ডিং" }, { value: "remix", label: "রিমিক্স" }, { value: "iconic", label: "আইকনিক" }] },
  futuristicSystems: { key: "futuristicSystems", titleBn: "ফিউচারিস্টিক সিস্টেম", options: [{ value: "none", label: "নেই" }, { value: "temporal-engine", label: "টেম্পোরাল ইঞ্জিন" }, { value: "dimensional-mapping", label: "ডাইমেনশনাল ম্যাপিং" }, { value: "ghost-protocol", label: "ঘোস্ট প্রোটোকল" }, { value: "quantum-density", label: "কোয়ান্টাম ডেনসিটি" }, { value: "network-dominance", label: "নেটওয়ার্ক ডমিন্যান্স" }, { value: "reality-simulation", label: "রিয়ালিটি সিমুলেশন" }] },
  patternDisruption: { key: "patternDisruption", titleBn: "প্যাটার্ন ডিসরাপশন", options: [{ value: "none", label: "কোনোটিই নয়" }, { value: "subtle-twist", label: "সূক্ষ্ম মোড়" }, { value: "shocking-ending", label: "চমকে দেওয়া সমাপ্তি" }, { value: "full-perspective-shift", label: "সম্পূর্ণ দৃষ্টিভঙ্গি পরিবর্তন" }] },
  audiencePsychologyTrigger: { key: "audiencePsychologyTrigger", titleBn: "অডিয়েন্স সাইকোলজি ট্রিগার", options: [{ value: "deep-asmr", label: "গভীর তৃপ্তি (ASMR)" }, { value: "primal-fear", label: "আদিম ভয়" }, { value: "intense-curiosity", label: "তীব্র কৌতূহল" }, { value: "viral-attraction", label: "ভাইরাল আকর্ষণ" }] },
  lensAperture: { key: "lensAperture", titleBn: "লেন্স ও অ্যাপারচার", options: [{ value: "ultra-wide-16mm", label: "আল্ট্রা-ওয়াইড (১৬মিমি)" }, { value: "standard-35mm", label: "সাধারণ লেন্স (৩৫মিমি)" }, { value: "portrait-85mm", label: "পোর্টেট ডেপথ (৮৫মিমি)" }, { value: "macro-100mm", label: "ম্যাক্রো ডিটেইল (১০০মিমি)" }] },
  lightSourceDirection: { key: "lightSourceDirection", titleBn: "লাইট সোর্স ডিরেকশন", options: [{ value: "moody-side-light", label: "মুডি সাইড-লাইট" }, { value: "dramatic-backlit", label: "ড্রামাটিক ব্যাকলিট" }, { value: "soft-ambient", label: "সফট অ্যাম্বিয়েন্ট" }, { value: "high-contrast-rim", label: "হাই-কনট্রাস্ট রিম লাইট" }] },
  // Supreme Power
  visualDramaLevel: { key: "visualDramaLevel", titleBn: "ভিজ্যুয়াল ড্রামা লেভেল", options: [{ value: "subtle-realism", label: "সাটল রিয়ালিজম" }, { value: "natural-contrast", label: "ন্যাচারাল কনট্রাস্ট" }, { value: "high-key-cinematic", label: "হাই-কি সিনেমাটিক" }, { value: "gritty-noir", label: "গ্রিটি নোয়ার" }, { value: "ethereal-dreamy", label: "ইথেরিয়াল/স্বপ্নিল" }] },
  informationDensity: { key: "informationDensity", titleBn: "ইনফরমেশন ডেনসিটি", options: [{ value: "minimalist", label: "মিনিমালিস্ট" }, { value: "focused-detail", label: "ফোকাসড ডিটেইল" }, { value: "rich-environment", label: "সমৃদ্ধ পরিবেশ" }, { value: "chaotic-detail", label: "বিশৃঙ্খল ডিটেইল" }] },
  cameraEyeMovement: { key: "cameraEyeMovement", titleBn: "ক্যামেরা 'আই' মুভমেন্ট", options: [{ value: "static-witness", label: "স্থির সাক্ষী" }, { value: "slow-breathing", label: "ধীর শ্বাস" }, { value: "handheld-tremor", label: "হ্যান্ডহেল্ড কম্পন" }, { value: "predator-chase", label: "প্রিডেটর চেজ" }, { value: "mechanical-slide", label: "মেকানিক্যাল স্লাইড" }] },
  audioImmersionMode: { key: "audioImmersionMode", titleBn: "অডিও ইমার্সন মোড", options: [{ value: "isolated-asmr", label: "আইসোলেটেড ASMR" }, { value: "spatial-surround", label: "স্পেশাল সারাউন্ড" }, { value: "muffled-underwater", label: "মাফল্ড আন্ডারওয়াটার" }, { value: "sharp-transient", label: "শার্প ট্রানজিয়েন্ট" }, { value: "high-octane-bass", label: "হাই-অক্টেন বেজ" }] },
  viralHookArchetype: { key: "viralHookArchetype", titleBn: "ভাইরাল হুক আর্কিটাইপ", options: [{ value: "impossible-action", label: "অসম্ভব কাজ" }, { value: "uncanny-appearance", label: "অদ্ভুত আবির্ভাব" }, { value: "satisfying-destruction", label: "তৃপ্তিকর ধ্বংস" }, { value: "emotional-gut-punch", label: "আবেগের ঘা" }, { value: "visual-loophole", label: "ভিজুয়াল ফাঁকি" }] },
  // 🔥 মহা-শক্তি + NEW (updated with expanded options below)
  fixedTheme: { key: "fixedTheme", titleBn: "ফিক্সড থিম", options: [{ value: "cyberpunk-dystopia", label: "সাইবারপাঙ্ক ডিস্টোপিয়া" }, { value: "ancient-mythology", label: "প্রাচীন মিথলজি" }, { value: "surreal-dreamworld", label: "পরাবাস্তব স্বপ্নজগত" }, { value: "hyper-realistic-noir", label: "হাইপার-রিয়েলিস্টিক নোয়ার" }, { value: "cosmic-horror", label: "কসমিক হরর" }, { value: "minimalist-zen", label: "মিনিমালিস্ট জেন" }, { value: "futuristic-tech", label: "ফিউচারিস্টিক টেক" }, { value: "survival-fight", label: "সারভাইভাল লড়াই" }, { value: "mystic-spirituality", label: "মরমী আধ্যাত্মিকতা" }, { value: "cosmic-apocalypse", label: "মহাজাগতিক ধ্বংসযজ্ঞ" }, { value: "steampunk-revolution", label: "স্টিমপাঙ্ক বিপ্লব" }, { value: "post-apocalyptic", label: "পোস্ট-অ্যাপোক্যালিপটিক" }, { value: "dark-fantasy", label: "ডার্ক ফ্যান্টাসি" }, { value: "biopunk-evolution", label: "বায়োপাঙ্ক বিবর্তন" }, { value: "abstract-expressionism", label: "বিমূর্ত এক্সপ্রেশনিজম" }, { value: "tribal-primordial", label: "আদিবাসী আদিম" }] },
  coreWorkflow: { key: "coreWorkflow", titleBn: "কোর ওয়ার্কফ্লো", options: [{ value: "cinematic-narrative", label: "সিনেমাটিক ন্যারেটিভ" }, { value: "documentary-style", label: "ডকুমেন্টারি স্টাইল" }, { value: "high-action-pacing", label: "হাই-অ্যাকশন পেসিং" }, { value: "slow-burn-suspense", label: "স্লো বার্ন সাসপেন্স" }, { value: "musical-rhythm", label: "মিউজিক্যাল রিদম" }, { value: "first-person-pov", label: "ফার্স্ট পারসন POV" }, { value: "dramatic-storytelling", label: "ড্রামাটিক স্টোরিটেলিং" }, { value: "experimental-montage", label: "এক্সপেরিমেন্টাল মন্তাজ" }, { value: "found-footage", label: "ফাউন্ড ফুটেজ" }, { value: "parallel-timeline", label: "প্যারালেল টাইমলাইন" }, { value: "stream-of-consciousness", label: "চেতনা প্রবাহ" }, { value: "visual-poetry", label: "ভিজুয়াল কবিতা" }, { value: "mockumentary", label: "মকুমেন্টারি" }, { value: "non-linear-puzzle", label: "নন-লিনিয়ার পাজল" }, { value: "episodic-vignettes", label: "এপিসোডিক ভিনেট" }] },
  centralAttraction: { key: "centralAttraction", titleBn: "কেন্দ্রীয় আকর্ষণ", options: [{ value: "lone-hero", label: "একাকী নায়ক" }, { value: "mysterious-artifact", label: "রহস্যময় নিদর্শন" }, { value: "impossible-architecture", label: "অসম্ভব স্থাপত্য" }, { value: "hidden-monster", label: "লুকানো দানব" }, { value: "sacred-geometry", label: "পবিত্র জ্যামিতি" }, { value: "floating-monolith", label: "ভাসমান মনোলিথ" }, { value: "primal-fight", label: "আদিম লড়াই" }, { value: "evolutionary-turn", label: "বিবর্তনীয় মোড়" }, { value: "cosmic-portal", label: "মহাজাগতিক পোর্টাল" }, { value: "ancient-machine", label: "প্রাচীন যন্ত্র" }, { value: "living-landscape", label: "জীবন্ত ভূদৃশ্য" }, { value: "forbidden-knowledge", label: "নিষিদ্ধ জ্ঞান" }, { value: "time-anomaly", label: "সময়ের অসঙ্গতি" }, { value: "sentient-shadow", label: "সচেতন ছায়া" }, { value: "celestial-event", label: "মহাজাগতিক ঘটনা" }] },
  fixedCharacter: { key: "fixedCharacter", titleBn: "ফিক্সড ক্যারেক্টার", options: [{ value: "silent-hero", label: "নির্বাক নায়ক" }, { value: "mysterious-stranger", label: "রহস্যময় আগন্তুক" }, { value: "divine-entity", label: "ঐশ্বরিক সত্তা" }, { value: "cybernetic-outlook", label: "সাইবারনেটিক আউটলক" }, { value: "lost-child", label: "হারিয়ে যাওয়া শিশু" }, { value: "ancient-sage", label: "প্রাচীন ঋষি" }, { value: "transformed-creature", label: "রূপান্তরিত প্রাণী" }, { value: "shadow-hunter", label: "ছায়াময় শিকারি" }, { value: "fallen-angel", label: "পতিত দেবদূত" }, { value: "last-survivor", label: "শেষ জীবিত" }, { value: "dream-architect", label: "স্বপ্নের স্থপতি" }, { value: "time-traveler", label: "সময় পরিব্রাজক" }, { value: "nature-guardian", label: "প্রকৃতির অভিভাবক" }, { value: "cosmic-wanderer", label: "মহাজাগতিক পরিব্রাজক" }, { value: "machine-consciousness", label: "যন্ত্র চেতনা" }] },
  forbiddenElements: { key: "forbiddenElements", titleBn: "নিষিদ্ধ উপাদান", options: [{ value: "no-human-face", label: "মানুষের মুখ নিষিদ্ধ" }, { value: "no-bright-colors", label: "উজ্জ্বল রং নিষিদ্ধ" }, { value: "no-modern-tech", label: "আধুনিক প্রযুক্তি নিষিদ্ধ" }, { value: "no-dialogue", label: "সংলাপ নিষিদ্ধ" }, { value: "no-gravity", label: "মাধ্যাকর্ষণ নিষিদ্ধ" }, { value: "no-sound", label: "শব্দ নিষিদ্ধ" }, { value: "no-fast-motion", label: "দ্রুত গতি নিষিদ্ধ" }, { value: "no-symmetry", label: "সমতা নিষিদ্ধ" }, { value: "no-text-overlay", label: "টেক্সট ওভারলে নিষিদ্ধ" }, { value: "no-camera-cut", label: "ক্যামেরা কাট নিষিদ্ধ" }, { value: "no-warm-tones", label: "উষ্ণ টোন নিষিদ্ধ" }, { value: "no-straight-lines", label: "সরলরেখা নিষিদ্ধ" }, { value: "no-natural-light", label: "প্রাকৃতিক আলো নিষিদ্ধ" }, { value: "no-living-creatures", label: "জীবন্ত প্রাণী নিষিদ্ধ" }, { value: "no-repetition", label: "পুনরাবৃত্তি নিষিদ্ধ" }] },
  coreEventFlow: { key: "coreEventFlow", titleBn: "কোর ইভেন্ট ফ্লো", options: [{ value: "linear-timeline", label: "লিনিয়ার টাইমলাইন" }, { value: "reverse-memory", label: "রিভার্স মেমরি" }, { value: "looped-reality", label: "লুপড রিয়ালিটি" }, { value: "multi-dimensional-jump", label: "মাল্টি-ডাইমেনশনাল জাম্প" }, { value: "fast-forward-evolution", label: "ফাস্ট ফরওয়ার্ড ইভোলিউশন" }, { value: "slow-motion-detailing", label: "স্লো মোশন ডিটেইলিং" }, { value: "parallel-convergence", label: "সমান্তরাল সংমিশ্রণ" }, { value: "recursive-flashback", label: "পুনরাবৃত্ত ফ্ল্যাশব্যাক" }, { value: "dream-within-dream", label: "স্বপ্নের মধ্যে স্বপ্ন" }, { value: "cause-effect-chain", label: "কারণ-প্রভাব শৃঙ্খল" }, { value: "countdown-urgency", label: "কাউন্টডাউন জরুরিতা" }, { value: "butterfly-effect", label: "প্রজাপতি প্রভাব" }, { value: "spiral-descent", label: "সর্পিল অবতরণ" }, { value: "fragmented-memory", label: "খণ্ডিত স্মৃতি" }, { value: "simultaneous-events", label: "একযোগে ঘটনাবলী" }] },
  backgroundPeople: { key: "backgroundPeople", titleBn: "পটভূমি মানুষ", options: [{ value: "none", label: "কেউ নেই" }, { value: "blurry-pedestrians", label: "ঝাপসা পথচারী" }, { value: "dynamic-crowd", label: "গতিশীল ভিড়" }, { value: "statue-still", label: "মূর্তির মতো স্থির মানুষ" }, { value: "shadowy-figures", label: "ছায়াময় অবয়ব" }, { value: "hostile-audience", label: "শত্রুভাবাপন্ন দর্শক" }, { value: "distant-observers", label: "দূরবর্তী পর্যবেক্ষক" }, { value: "evolved-entities", label: "বিবর্তিত সত্তা" }, { value: "masked-strangers", label: "মুখোশধারী আগন্তুক" }, { value: "dancing-silhouettes", label: "নৃত্যরত ছায়ামূর্তি" }, { value: "mourning-crowd", label: "শোকার্ত জনতা" }, { value: "ghostly-echoes", label: "ভৌতিক প্রতিধ্বনি" }, { value: "robotic-workers", label: "যান্ত্রিক কর্মী" }, { value: "tribal-gathering", label: "গোষ্ঠীগত সমাবেশ" }, { value: "cloned-multitude", label: "ক্লোনকৃত বহুজন" }] },
  visualElements: { key: "visualElements", titleBn: "ভিজুয়াল উপাদান", options: [{ value: "cinematic-particles", label: "সিনেমাটিক কণা" }, { value: "flying-dust", label: "উড়ন্ত ধূলিকণা" }, { value: "neon-fog", label: "নিয়ন কুয়াশা" }, { value: "volumetric-lighting", label: "ভলিউমেট্রিক লাইটিং" }, { value: "glitch-effect", label: "গ্লিচ ইফেক্ট" }, { value: "natural-overlay", label: "প্রাকৃতিক ওভারলে (বৃষ্টি/ধোঁয়া)" }, { value: "high-detail-texture", label: "হাই-ডিটেইল টেক্সচার" }, { value: "otherworldly-glow", label: "অপার্থিব আভা" }, { value: "fire-sparks", label: "আগুনের স্ফুলিঙ্গ" }, { value: "holographic-overlay", label: "হলোগ্রাফিক ওভারলে" }, { value: "fractal-patterns", label: "ফ্র্যাক্টাল প্যাটার্ন" }, { value: "aurora-borealis", label: "অরোরা বোরিয়ালিস" }, { value: "ink-diffusion", label: "কালি বিস্তার" }, { value: "crystalline-shards", label: "স্ফটিক খণ্ড" }, { value: "electromagnetic-pulse", label: "তড়িৎচৌম্বক তরঙ্গ" }] },
  creativeCatalyst: { key: "creativeCatalyst", titleBn: "সৃজনশীল অনুঘটক", options: [{ value: "chaos-factor", label: "বিশৃঙ্খল ফ্যাক্টর" }, { value: "sudden-silence", label: "আকস্মিক নীরবতা" }, { value: "color-shift", label: "রঙের পরিবর্তন" }, { value: "zero-gravity", label: "মাধ্যাকর্ষণহীনতা" }, { value: "time-slow", label: "সময়ের ধীরগতি" }, { value: "reality-crack", label: "বাস্তবতায় ফাটল" }, { value: "emotional-explosion", label: "আবেগীয় বিস্ফোরণ" }, { value: "hidden-signal", label: "লুকানো সংকেত" }, { value: "evolutionary-trigger", label: "বিবর্তনীয় ট্রিগার" }, { value: "dimension-bleed", label: "মাত্রা রক্তক্ষরণ" }, { value: "consciousness-split", label: "চেতনা বিভাজন" }, { value: "temporal-glitch", label: "সময়ের ত্রুটি" }, { value: "memory-surge", label: "স্মৃতির ঢেউ" }, { value: "identity-crisis", label: "পরিচয় সংকট" }, { value: "prophetic-vision", label: "ভবিষ্যদ্বাণীমূলক দৃষ্টি" }] },
  immutableMutableElements: { key: "immutableMutableElements", titleBn: "অপরিবর্তনীয় উপাদান", options: [{ value: "static-landscape", label: "স্থির ল্যান্ডস্কেপ" }, { value: "eternal-light", label: "চিরস্থায়ী আলো" }, { value: "unchanging-sky", label: "অপরিবর্তনীয় আকাশ" }, { value: "fixed-horizon", label: "স্থির দিগন্ত" }, { value: "permanent-structure", label: "স্থায়ী স্থাপনা" }, { value: "frozen-ocean", label: "হিমায়িত মহাসাগর" }, { value: "petrified-forest", label: "প্রস্তরীভূত বন" }, { value: "eternal-flame", label: "চিরন্তন শিখা" }, { value: "unchanging-monument", label: "অচল স্মৃতিসৌধ" }, { value: "fixed-constellation", label: "স্থির নক্ষত্রমণ্ডল" }, { value: "permanent-ruin", label: "স্থায়ী ধ্বংসাবশেষ" }, { value: "immovable-mountain", label: "অটল পর্বত" }, { value: "eternal-river", label: "চিরপ্রবাহমান নদী" }, { value: "fixed-portal", label: "স্থির পোর্টাল" }, { value: "unchanging-symbol", label: "অপরিবর্তনীয় প্রতীক" }] },
  mutableElements: { key: "mutableElements", titleBn: "পরিবর্তনযোগ্য উপাদান", options: [{ value: "changing-time", label: "পরিবর্তনশীল সময়" }, { value: "transforming-body", label: "রূপান্তরশীল শরীর" }, { value: "decaying-weather", label: "ক্ষয়িষ্ণু আবহাওয়া" }, { value: "transient-shadow", label: "অস্থায়ী ছায়া" }, { value: "shifting-colors", label: "পরিবর্তনশীল রং" }, { value: "morphing-terrain", label: "রূপান্তরিত ভূখণ্ড" }, { value: "evolving-creature", label: "বিবর্তিত প্রাণী" }, { value: "dissolving-structure", label: "বিলীয়মান কাঠামো" }, { value: "flickering-reality", label: "কম্পমান বাস্তবতা" }, { value: "aging-character", label: "বয়স্ক হওয়া চরিত্র" }, { value: "growing-vegetation", label: "বর্ধনশীল উদ্ভিদ" }, { value: "shifting-gravity", label: "পরিবর্তনশীল মাধ্যাকর্ষণ" }, { value: "melting-ice", label: "গলন্ত বরফ" }, { value: "spreading-darkness", label: "বিস্তৃত অন্ধকার" }, { value: "transforming-sky", label: "রূপান্তরশীল আকাশ" }] },
  variableCharacterList: { key: "variableCharacterList", titleBn: "ভেরিয়েবল চরিত্র তালিকা", options: [{ value: "helper-entity", label: "সহায়ক সত্তা" }, { value: "hidden-enemy", label: "গোপন শত্রু" }, { value: "observer-creature", label: "পর্যবেক্ষক প্রাণী" }, { value: "mechanical-drone", label: "যান্ত্রিক ড্রোন" }, { value: "ancestral-spirit", label: "পূর্বপুরুষের আত্মা" }, { value: "illusion-creator", label: "মায়া সৃষ্টিকারী অবয়ব" }, { value: "shape-shifter", label: "রূপ পরিবর্তনকারী" }, { value: "time-guardian", label: "সময়ের প্রহরী" }, { value: "dream-walker", label: "স্বপ্ন পরিভ্রমণকারী" }, { value: "shadow-twin", label: "ছায়া যমজ" }, { value: "cosmic-messenger", label: "মহাজাগতিক দূত" }, { value: "nature-spirit", label: "প্রকৃতির আত্মা" }, { value: "forgotten-deity", label: "বিস্মৃত দেবতা" }, { value: "quantum-echo", label: "কোয়ান্টাম প্রতিধ্বনি" }, { value: "parasitic-entity", label: "পরজীবী সত্তা" }] },
};

const sectionAccentColors: Record<SectionKey, {
  bg: string; text: string; activeBg: string; border: string;
}> = {
  ka: { bg: "hsl(250 50% 96%)", text: "hsl(250 70% 45%)", activeBg: "hsl(250 60% 55%)", border: "hsl(250 50% 82%)" },
  kha: { bg: "hsl(320 45% 96%)", text: "hsl(320 65% 42%)", activeBg: "hsl(320 60% 52%)", border: "hsl(320 45% 82%)" },
  ga: { bg: "hsl(160 45% 95%)", text: "hsl(160 60% 32%)", activeBg: "hsl(160 55% 42%)", border: "hsl(160 40% 78%)" },
};

interface SectionParamPopoverProps {
  sectionKey: SectionKey;
  params: BlueprintParams;
  onParamChange: (key: keyof BlueprintParams, value: string) => void;
  accentColor: string;
}

export function SectionParamPopover({ sectionKey, params, onParamChange, accentColor }: SectionParamPopoverProps) {
  const [open, setOpen] = useState(false);
  const paramKeys = SECTION_PARAMS[sectionKey];
  const accent = sectionAccentColors[sectionKey];

  // Count how many params are changed from default
  const changedCount = paramKeys.filter(k => {
    const cur = params[k];
    const def = DEFAULT_PARAMS[k];
    return cur !== def;
  }).length;

  // Count total multi-selected options
  const totalSelections = paramKeys.reduce((sum, k) => {
    return sum + parseMultiValue(params[k]).length;
  }, 0);
  const multiCount = totalSelections - paramKeys.length; // extra selections beyond 1 per param

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all"
          style={{
            background: changedCount > 0 ? accent.activeBg : "hsl(0 0% 100% / 0.7)",
            color: changedCount > 0 ? "hsl(0 0% 100%)" : accentColor,
            border: `1px solid ${changedCount > 0 ? accent.activeBg : accent.border}`,
          }}
          title="Parameter সেটিংস"
        >
          <SlidersHorizontal className="w-3 h-3" />
          Parameter
          {changedCount > 0 && (
            <span className="ml-0.5 px-1 py-0 rounded-full text-[8px] font-extrabold"
              style={{ background: "hsl(0 0% 100% / 0.3)" }}>
              {changedCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="p-0 border-0 shadow-2xl"
        style={{
          width: "320px",
          maxHeight: "400px",
          borderRadius: "12px",
          background: "hsl(0 0% 100%)",
          border: `1.5px solid ${accent.border}`,
          boxShadow: `0 16px 48px -8px ${accent.activeBg}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
          style={{ background: accent.bg, borderBottom: `1px solid ${accent.border}` }}>
          <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: accent.text }} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: accent.text }}>
            🎛️ Parameter — সারণী ({sectionKey === "ka" ? "ক" : sectionKey === "kha" ? "খ" : "গ"})
          </span>
          {changedCount > 0 && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: accent.activeBg }}>
              {changedCount}টি পরিবর্তিত
            </span>
          )}
        </div>

        {/* Param list — Multi-select enabled */}
        <div className="overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: "350px" }}>
          {paramKeys.map((paramKey) => {
            const config = PARAM_CONFIGS_MAP[paramKey];
            if (!config) return null;
            const currentValue = params[paramKey];
            const selectedValues = parseMultiValue(currentValue);
            const isChanged = currentValue !== DEFAULT_PARAMS[paramKey];
            const isMulti = selectedValues.length > 1;

            return (
              <div key={paramKey} className="rounded-lg px-2.5 py-1.5"
                style={{
                  background: isChanged ? `${accent.bg}` : "transparent",
                  border: isChanged ? `1px solid ${accent.border}80` : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-1 text-[9px] font-bold mb-1" style={{ color: accent.text }}>
                  {config.titleBn}
                  {isMulti && (
                    <span className="text-[7px] font-extrabold px-1 rounded"
                      style={{ background: "hsl(45 90% 50%)", color: "hsl(45 100% 10%)" }}>
                      {selectedValues.length}টি
                    </span>
                  )}
                  {isChanged && !isMulti && (
                    <span className="text-[7px] font-extrabold px-1 rounded"
                      style={{ background: accent.activeBg, color: "white" }}>
                      পরিবর্তিত
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {config.options.map((opt) => {
                    const isActive = selectedValues.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onParamChange(paramKey, toggleMultiValue(currentValue, opt.value))}
                        className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-semibold transition-all"
                        style={{
                          background: isActive ? accent.activeBg : "hsl(0 0% 100%)",
                          color: isActive ? "hsl(0 0% 100%)" : "hsl(230 15% 45%)",
                          border: `1px solid ${isActive ? accent.activeBg : "hsl(230 20% 85%)"}`,
                        }}
                      >
                        {isActive && <Check className="w-2.5 h-2.5" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
