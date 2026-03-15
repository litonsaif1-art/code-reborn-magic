/**
 * Default fixed labels for Blueprint sections (ক, খ, গ).
 * These labels are always visible in the table — only VALUE changes per session.
 * 
 * Labels with a `paramKey` are rendered as multi-select dropdowns
 * using the PARAM_CONFIGS_MAP system. Labels without `paramKey` are free-text.
 */

export interface DefaultLabel {
  number: string;       // Bengali serial number
  label: string;        // Fixed label text
  matchPatterns: string[]; // Lowercase patterns to match AI-generated label text
  paramKey?: string;    // If set, renders as dropdown using PARAM_CONFIGS_MAP
  sceneParamKey?: string; // If set, auto-filled from Scene Parameters
}

/** সারণী (ক) — Series-Static Data */
export const DEFAULT_LABELS_KA: DefaultLabel[] = [
  {
    number: "১",
    label: "ফিক্সড থিম**",
    matchPatterns: ["fixed theme", "ফিক্সড থিম", "থিম"],
    paramKey: "fixedTheme",
  },
  {
    number: "২",
    label: "কোর ওয়ার্কফ্লো**",
    matchPatterns: ["core workflow", "কোর ওয়ার্কফ্লো", "ওয়ার্কফ্লো"],
    paramKey: "coreWorkflow",
  },
  {
    number: "৩",
    label: "কেন্দ্রীয় আকর্ষণ**",
    matchPatterns: ["central attraction", "সেন্ট্রাল অ্যাট্রাকশন", "কেন্দ্রীয়"],
    paramKey: "centralAttraction",
  },
  {
    number: "৪",
    label: "ফিক্সড ক্যারেক্টার**",
    matchPatterns: ["fixed character", "ফিক্সড ক্যারেক্টার", "চরিত্র"],
    paramKey: "fixedCharacter",
  },
  {
    number: "৫",
    label: "লোকেশন ধরন**",
    matchPatterns: ["location type", "লোকেশন ধরন", "লোকেশন", "location"],
    paramKey: "locationType",
    sceneParamKey: "locationType",
  },
  {
    number: "৬",
    label: "ক্যামেরা দূরত্ব**",
    matchPatterns: ["camera distance", "ক্যামেরা দূরত্ব", "ক্যামেরা দূরত্ব"],
    paramKey: "framing",
    sceneParamKey: "cameraDistance",
  },
  {
    number: "৭",
    label: "স্পিচ ভাষা**",
    matchPatterns: ["speech language", "স্পিচ ভাষা", "ভাষা"],
    paramKey: "voiceLanguage",
  },
  {
    number: "৮",
    label: "স্পিচ উপস্থিতি**",
    matchPatterns: ["speech presence", "স্পিচ উপস্থিতি", "স্পিচ", "human voice"],
    paramKey: "voicePresence",
    sceneParamKey: "humanVoice",
  },
  {
    number: "৯",
    label: "ভয়েস ও স্টাইল**",
    matchPatterns: ["voice and style", "ভয়েস ও স্টাইল", "ভয়েস"],
    paramKey: "narratorStyle",
  },
  {
    number: "১০",
    label: "চূড়ান্ত আবেগ**",
    matchPatterns: ["final emotion", "চূড়ান্ত আবেগ", "আবেগ"],
    paramKey: "voiceEmotion",
  },
  {
    number: "১১",
    label: "দেশ / Country**",
    matchPatterns: ["country", "দেশ", "কান্ট্রি"],
    paramKey: "country",
    sceneParamKey: "country",
  },
  {
    number: "১২",
    label: "শহর / City**",
    matchPatterns: ["city", "শহর", "সিটি"],
    sceneParamKey: "city",
  },
  {
    number: "১৩",
    label: "অনুপাত / Ratio**",
    matchPatterns: ["ratio", "অনুপাত", "aspect ratio", "রেশিও"],
    paramKey: "aspectRatio",
    sceneParamKey: "ratio",
  },
  {
    number: "১৪",
    label: "সময়কাল / Duration**",
    matchPatterns: ["duration", "সময়কাল", "ডিউরেশন"],
    paramKey: "duration",
    sceneParamKey: "duration",
  },
  {
    number: "১৫",
    label: "রেজোলিউশন / Resolution**",
    matchPatterns: ["resolution", "রেজোলিউশন"],
    paramKey: "resolution",
    sceneParamKey: "resolution",
  },
  {
    number: "১৬",
    label: "সময় / Time of Day**",
    matchPatterns: ["time of day", "সময়", "time", "টাইম"],
    paramKey: "timeOfDay",
    sceneParamKey: "timeOfDay",
  },
  {
    number: "১৭",
    label: "আবহাওয়া / Weather**",
    matchPatterns: ["weather", "আবহাওয়া", "ওয়েদার"],
    paramKey: "weather",
    sceneParamKey: "weather",
  },
  {
    number: "১৮",
    label: "সিন / Scene-Parts**",
    matchPatterns: ["scene", "সিন", "parts", "পার্ট"],
    sceneParamKey: "scenes",
  },
  {
    number: "১৯",
    label: "AI ভিডিও মডেল**",
    matchPatterns: ["ai model", "ai video model", "এআই মডেল", "ভিডিও মডেল"],
    sceneParamKey: "aiModel",
  },
  {
    number: "২০",
    label: "ক্যামেরা মডেল / Brand**",
    matchPatterns: ["camera model", "camera brand", "ক্যামেরা মডেল", "ক্যামেরা ব্র্যান্ড"],
    sceneParamKey: "cameraBrand",
  },
  {
    number: "২১",
    label: "প্রাণী / Animal**",
    matchPatterns: ["animal", "প্রাণী", "এনিমেল"],
    sceneParamKey: "animal",
  },
  {
    number: "২২",
    label: "ভয়েস বিন্যাস (Male/Female/Age)**",
    matchPatterns: ["voice distribution", "ভয়েস বিন্যাস", "male female", "মেল ফিমেল"],
    sceneParamKey: "voiceDistribution",
  },
  {
    number: "২৩",
    label: "লাইট সোর্স ডিরেকশন / Light Source**",
    matchPatterns: ["lighting", "লাইটিং", "আলো", "lighting style", "light source"],
    paramKey: "lightSourceDirection",
    sceneParamKey: "lightingStyle",
  },
  {
    number: "২৪",
    label: "কালার গ্রেডিং / Color Grading**",
    matchPatterns: ["color grading", "কালার গ্রেডিং", "color tone", "টোন"],
    paramKey: "colorGrade",
    sceneParamKey: "colorGrading",
  },
  {
    number: "২৫",
    label: "ভিডিও স্টাইল / Video Style**",
    matchPatterns: ["video style", "ভিডিও স্টাইল", "ভিডিও ধরন"],
    sceneParamKey: "videoStyle",
  },
  {
    number: "২৬",
    label: "লেন্স টাইপ / Lens Type**",
    matchPatterns: ["lens", "লেন্স", "lens type"],
    sceneParamKey: "lensType",
  },
  {
    number: "২৭",
    label: "ফ্রেম রেট / FPS**",
    matchPatterns: ["fps", "frame rate", "ফ্রেম রেট", "এফপিএস"],
    paramKey: "frameRate",
    sceneParamKey: "frameRate",
  },
  {
    number: "২৮",
    label: "ক্যামেরা 'আই' মুভমেন্ট / Camera Eye Movement**",
    matchPatterns: ["camera movement", "ক্যামেরা মুভমেন্ট", "ক্যামেরা চলন", "camera eye"],
    paramKey: "cameraEyeMovement",
    sceneParamKey: "cameraMovement",
  },
  {
    number: "২৯",
    label: "BGM / মিউজিক জনরা**",
    matchPatterns: ["bgm", "music", "মিউজিক", "ব্যাকগ্রাউন্ড মিউজিক", "music genre"],
    sceneParamKey: "bgmGenre",
  },
  {
    number: "৩০",
    label: "সাউন্ড ইফেক্ট / SFX**",
    matchPatterns: ["sfx", "sound effect", "সাউন্ড ইফেক্ট", "এসএফএক্স"],
    sceneParamKey: "sfxStyle",
  },
  {
    number: "৩১",
    label: "ঋতু / Season**",
    matchPatterns: ["season", "ঋতু", "সিজন"],
    paramKey: "season",
    sceneParamKey: "season",
  },
  {
    number: "৩২",
    label: "মুড / Mood**",
    matchPatterns: ["mood", "মুড", "atmosphere", "পরিবেশ"],
    paramKey: "mood",
    sceneParamKey: "mood",
  },
  {
    number: "৩৩",
    label: "টার্গেট প্ল্যাটফর্ম / Platform**",
    matchPatterns: ["platform", "প্ল্যাটফর্ম", "target platform", "টার্গেট"],
    sceneParamKey: "targetPlatform",
  },
  {
    number: "৩৪",
    label: "ট্রানজিশন স্টাইল / Transition**",
    matchPatterns: ["transition", "ট্রানজিশন", "transition style"],
    paramKey: "transitionStyle",
    sceneParamKey: "transitionStyle",
  },
];

/** সারণী (খ) — Episode-Variable Data */
export const DEFAULT_LABELS_KHA: DefaultLabel[] = [
  {
    number: "১",
    label: "কোর ইভেন্ট ফ্লো**",
    matchPatterns: ["core event flow", "কোর ইভেন্ট ফ্লো", "ইভেন্ট"],
    paramKey: "coreEventFlow",
  },
  {
    number: "২",
    label: "পটভূমি মানুষ**",
    matchPatterns: ["background people", "ব্যাকগ্রাউন্ড পিপল", "পটভূমি"],
    paramKey: "backgroundPeople",
  },
  {
    number: "৩",
    label: "ভিজুয়াল উপাদান**",
    matchPatterns: ["visual elements", "ভিজুয়াল এলিমেন্টস", "ভিজুয়াল"],
    paramKey: "visualElements",
  },
];

/** সারণী (গ) — List-Based & '0' Command Data */
export const DEFAULT_LABELS_GA: DefaultLabel[] = [
  {
    number: "১",
    label: "অপরিবর্তনীয় উপাদান**",
    matchPatterns: ["unchangeable elements", "আনচেঞ্জেবল", "অপরিবর্তনীয়", "immutable"],
    paramKey: "immutableMutableElements",
  },
  {
    number: "২",
    label: "পরিবর্তনযোগ্য উপাদান**",
    matchPatterns: ["changeable elements", "পরিবর্তনযোগ্য", "mutable"],
    paramKey: "mutableElements",
  },
  {
    number: "৩",
    label: "ভেরিয়েবল চরিত্র তালিকা**",
    matchPatterns: ["variable character", "ভেরিয়েবল ক্যারেক্টার", "চরিত্র তালিকা"],
    paramKey: "variableCharacterList",
  },
  {
    number: "৪",
    label: "নিষিদ্ধ উপাদান**",
    matchPatterns: ["forbidden elements", "ফরবিডেন", "নিষিদ্ধ"],
    paramKey: "forbiddenElements",
  },
  {
    number: "৫",
    label: "সৃজনশীল অনুঘটক**",
    matchPatterns: ["creative catalyst", "ক্রিয়েটিভ ক্যাটালিস্ট", "সৃজনশীল"],
    paramKey: "creativeCatalyst",
  },
];

/** Map section key to default labels */
export const DEFAULT_LABELS_MAP: Record<string, DefaultLabel[]> = {
  ka: DEFAULT_LABELS_KA,
  kha: DEFAULT_LABELS_KHA,
  ga: DEFAULT_LABELS_GA,
};

/**
 * Normalize a label string for matching:
 * lowercase, remove **, trim, remove extra spaces
 */
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\*+/g, "")
    .replace(/[।.]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Match a parsed row's label to a default label.
 * Returns the index of the matched default label, or -1 if no match.
 */
export function matchLabelToDefault(
  parsedLabel: string,
  defaultLabels: DefaultLabel[]
): number {
  const normalized = normalizeLabel(parsedLabel);

  for (let i = 0; i < defaultLabels.length; i++) {
    const def = defaultLabels[i];
    // Check exact normalized match
    if (normalizeLabel(def.label) === normalized) return i;

    // Check patterns
    for (const pattern of def.matchPatterns) {
      if (normalized.includes(pattern) || pattern.includes(normalized)) {
        return i;
      }
    }
  }

  return -1;
}
