import React, { useMemo } from "react";
import { type BlueprintParams, DEFAULT_PARAMS } from "./BlueprintParamsOverride";

/**
 * Renders changed parameter overrides for a specific blueprint section (ক/খ/গ).
 * Parameters are distributed across sections based on their category.
 */

type SectionKey = "ka" | "kha" | "ga";

interface ParamMeta {
  label: string;
  category: string;
  section: SectionKey;
}

// Bengali serial numbers
const BN_NUMBERS = [
  "১","২","৩","৪","৫","৬","৭","৮","৯","১০",
  "১১","১২","১৩","১৪","১৫","১৬","১৭","১৮","১৯","২০",
  "২১","২২","২৩","২৪","২৫","২৬","২৭","২৮","২৯","৩০",
  "৩১","৩২","৩৩","৩৪","৩৫","৩৬","৩৭","৩৮","৩৯","৪০",
];

/**
 * Mapping: each parameter → Bengali label + category + which section it belongs to.
 * 
 * ক (ka): Core + Voice & Narration
 * খ (kha): Location + Environment + Camera
 * গ (ga): Output + Viral Mastery
 */
const PARAM_META: Record<keyof BlueprintParams, ParamMeta> = {
  // ===== ক — Core & Voice =====
  voicePresence:   { label: "কথাবার্তার উপস্থিতি", category: "🎯 কোর",       section: "ka" },
  realismLevel:    { label: "রিয়েলিজম মোড",       category: "🎯 কোর",       section: "ka" },
  episodeCount:    { label: "পর্ব সংখ্যা",         category: "🎯 কোর",       section: "ka" },
  voiceLanguage:   { label: "ভয়েস ভাষা",          category: "🎤 ভয়েস",     section: "ka" },
  voiceGender:     { label: "ভয়েস লিঙ্গ",         category: "🎤 ভয়েস",     section: "ka" },
  voiceAge:        { label: "ভয়েস বয়স",           category: "🎤 ভয়েস",     section: "ka" },
  voiceEmotion:    { label: "ভয়েস আবেগ",          category: "🎤 ভয়েস",     section: "ka" },
  voiceTone:       { label: "ভয়েস টোন",           category: "🎤 ভয়েস",     section: "ka" },
  voiceAccent:     { label: "ভয়েস অ্যাক্সেন্ট",    category: "🎤 ভয়েস",     section: "ka" },
  narratorStyle:   { label: "ন্যারেটর স্টাইল",     category: "🎤 ভয়েস",     section: "ka" },

  // ===== খ — Location, Environment & Camera =====
  country:         { label: "দেশ",                 category: "🌍 লোকেশন",    section: "kha" },
  locationType:    { label: "লোকেশন ধরন",          category: "🌍 লোকেশন",    section: "kha" },
  locationVibe:    { label: "লোকেশন ভাইব",         category: "🌍 লোকেশন",    section: "kha" },
  weather:         { label: "আবহাওয়া",             category: "🌍 লোকেশন",    section: "kha" },
  season:          { label: "ঋতু",                 category: "🌍 লোকেশন",    section: "kha" },
  environment:     { label: "পরিবেশ",              category: "🌿 পরিবেশ",    section: "kha" },
  timeOfDay:       { label: "দিনের সময়",           category: "🌿 পরিবেশ",    section: "kha" },
  mood:            { label: "মুড/আবেগ",            category: "🌿 পরিবেশ",    section: "kha" },
  colorGrade:      { label: "কালার গ্রেড",          category: "🎥 ক্যামেরা",   section: "kha" },

  // ===== গ — Output & Viral =====
  aspectRatio:     { label: "অ্যাসপেক্ট রেশিও",    category: "📹 আউটপুট",   section: "ga" },
  duration:        { label: "ভিডিও দৈর্ঘ্য",        category: "📹 আউটপুট",   section: "ga" },
  resolution:      { label: "রেজোলিউশন",           category: "📹 আউটপুট",   section: "ga" },
  frameRate:       { label: "ফ্রেম রেট",            category: "📹 আউটপুট",   section: "ga" },
  openingStyle:    { label: "শুরুর ধরন",            category: "🚀 ভাইরাল",   section: "ga" },
  curiosityGap:    { label: "কৌতূহল তৈরি",          category: "🚀 ভাইরাল",   section: "ga" },
  narrativeArc:    { label: "গল্পের কাঠামো",        category: "🚀 ভাইরাল",   section: "ga" },
  emotionalJourney:{ label: "আবেগের যাত্রা",        category: "🚀 ভাইরাল",   section: "ga" },
  twistIntensity:  { label: "টুইস্ট তীব্রতা",       category: "🚀 ভাইরাল",   section: "ga" },
  peakMoment:      { label: "চরম মুহূর্ত",          category: "🚀 ভাইরাল",   section: "ga" },
  speedDynamics:   { label: "গতি ডায়নামিক্স",       category: "🚀 ভাইরাল",   section: "ga" },
  transitionStyle: { label: "ট্রানজিশন স্টাইল",     category: "🎥 ক্যামেরা",   section: "kha" },
  vfxIntensity:    { label: "VFX তীব্রতা",          category: "🎥 ক্যামেরা",   section: "kha" },
  relatability:    { label: "সম্পর্কযোগ্যতা",       category: "🚀 ভাইরাল",   section: "ga" },
  nostalgiaLevel:  { label: "নস্টালজিয়া লেভেল",     category: "🚀 ভাইরাল",   section: "ga" },
  shockValue:      { label: "শক ভ্যালু",            category: "🚀 ভাইরাল",   section: "ga" },
  shareability:    { label: "শেয়ারযোগ্যতা",         category: "🚀 ভাইরাল",   section: "ga" },
  loopFriendly:    { label: "লুপ ফ্রেন্ডলি",        category: "🚀 ভাইরাল",   section: "ga" },
  pacing:          { label: "গতি/পেসিং",            category: "🚀 ভাইরাল",   section: "ga" },
  ctaPlacement:    { label: "CTA অবস্থান",          category: "🚀 ভাইরাল",   section: "ga" },
  soundTrend:      { label: "সাউন্ড ট্রেন্ড",       category: "🚀 ভাইরাল",   section: "ga" },
  // ===== Futuristic Systems =====
  futuristicSystems: { label: "ফিউচারিস্টিক সিস্টেম", category: "⚡ ফিউচারিস্টিক", section: "ga" },
  // ভাইরাল সাইকোলজি (সারণী গ)
  patternDisruption: { label: "প্যাটার্ন ডিসরাপশন", category: "🧠 সাইকোলজি", section: "ga" },
  audiencePsychologyTrigger: { label: "অডিয়েন্স সাইকোলজি ট্রিগার", category: "🧠 সাইকোলজি", section: "ga" },
  // টেকনিক্যাল ভিজুয়াল (সারণী খ)
  lensAperture: { label: "লেন্স ও অ্যাপারচার", category: "🎥 ক্যামেরা", section: "kha" },
  lightSourceDirection: { label: "লাইট সোর্স ডিরেকশন", category: "🎥 ক্যামেরা", section: "kha" },
  // 💎 Supreme Power
  visualDramaLevel: { label: "ভিজ্যুয়াল ড্রামা লেভেল", category: "🎥 ক্যামেরা", section: "kha" },
  cameraEyeMovement: { label: "ক্যামেরা 'আই' মুভমেন্ট", category: "🎥 ক্যামেরা", section: "kha" },
  audioImmersionMode: { label: "অডিও ইমার্সন মোড", category: "🎥 ক্যামেরা", section: "kha" },
  informationDensity: { label: "ইনফরমেশন ডেনসিটি", category: "🧠 সাইকোলজি", section: "ga" },
  viralHookArchetype: { label: "ভাইরাল হুক আর্কিটাইপ", category: "🧠 সাইকোলজি", section: "ga" },
  // 🔥 মহা-শক্তি (Mega Power)
  backgroundPeople: { label: "পটভূমি মানুষ", category: "🎥 ক্যামেরা", section: "kha" },
  visualElements: { label: "ভিজুয়াল উপাদান", category: "🎥 ক্যামেরা", section: "kha" },
  creativeCatalyst: { label: "সৃজনশীল অনুঘটক", category: "🧠 সাইকোলজি", section: "ga" },
  fixedTheme: { label: "ফিক্সড থিম", category: "🎯 কোর", section: "ka" },
  centralAttraction: { label: "কেন্দ্রীয় আকর্ষণ", category: "🎯 কোর", section: "ka" },
  fixedCharacter: { label: "ফিক্সড ক্যারেক্টার", category: "🎯 কোর", section: "ka" },
  forbiddenElements: { label: "নিষিদ্ধ উপাদান", category: "🧠 সাইকোলজি", section: "ga" },
  // 🆕 NEW
  coreWorkflow: { label: "কোর ওয়ার্কফ্লো", category: "🎯 কোর", section: "ka" },
  coreEventFlow: { label: "কোর ইভেন্ট ফ্লো", category: "🎥 ক্যামেরা", section: "kha" },
  immutableMutableElements: { label: "অপরিবর্তনীয় উপাদান", category: "🧠 সাইকোলজি", section: "ga" },
  mutableElements: { label: "পরিবর্তনযোগ্য উপাদান", category: "🧠 সাইকোলজি", section: "ga" },
  variableCharacterList: { label: "ভেরিয়েবল চরিত্র তালিকা", category: "🧠 সাইকোলজি", section: "ga" },
};

// Value display labels
const VALUE_DISPLAY: Record<string, string> = {
  "yes": "হ্যাঁ", "no": "না",
  "macro": "ম্যাক্রো", "full-shot": "ফুল শট", "medium-shot": "মিডিয়াম", "close-up": "ক্লোজ-আপ", "wide-shot": "ওয়াইড",
  "foley": "ফলি", "music": "মিউজিক", "silent-focus": "নীরব", "ambient": "অ্যাম্বিয়েন্ট",
  "strict-realism": "কঠোর", "bio-authentic-mutation": "মিউটেশন", "stylized": "স্টাইলাইজড",
  "series": "সিরিজ",
  "bengali": "বাংলা", "english": "English", "hindi": "हिंदी", "arabic": "العربية",
  "male": "পুরুষ", "female": "মহিলা", "neutral": "নিউট্রাল", "child": "শিশু",
  "young": "তরুণ", "adult": "প্রাপ্তবয়স্ক", "mature": "পরিণত", "elderly": "বৃদ্ধ",
  "happy": "আনন্দিত", "sad": "দুঃখিত", "angry": "রাগান্বিত", "excited": "উত্তেজিত",
  "calm": "শান্ত", "fearful": "ভীত", "surprised": "বিস্মিত", "loving": "স্নেহপূর্ণ", "confident": "আত্মবিশ্বাসী",
  "formal": "ফর্মাল", "casual": "ক্যাজুয়াল", "dramatic": "নাটকীয়", "whispery": "ফিসফিস", "energetic": "উদ্যমী", "soothing": "প্রশান্তিদায়ক",
  "native": "দেশীয়", "british": "ব্রিটিশ", "american": "আমেরিকান", "australian": "অস্ট্রেলিয়ান", "indian": "ভারতীয়", "middle-eastern": "মধ্যপ্রাচ্য", "european": "ইউরোপীয়",
  "storyteller": "গল্পকার", "documentary": "ডকুমেন্টারি", "news-anchor": "সংবাদ", "conversational": "কথোপকথন", "poetic": "কাব্যিক", "suspenseful": "সাসপেন্স",
  "bangladesh": "🇧🇩 বাংলাদেশ", "india": "🇮🇳 ভারত", "usa": "🇺🇸 আমেরিকা", "uk": "🇬🇧 যুক্তরাজ্য", "uae": "🇦🇪 সংযুক্ত আরব", "saudi": "🇸🇦 সৌদি", "japan": "🇯🇵 জাপান", "china": "🇨🇳 চীন", "korea": "🇰🇷 কোরিয়া", "germany": "🇩🇪 জার্মানি", "france": "🇫🇷 ফ্রান্স", "italy": "🇮🇹 ইতালি", "spain": "🇪🇸 স্পেন", "russia": "🇷🇺 রাশিয়া", "brazil": "🇧🇷 ব্রাজিল", "australia": "🇦🇺 অস্ট্রেলিয়া", "canada": "🇨🇦 কানাডা", "egypt": "🇪🇬 মিশর", "turkey": "🇹🇷 তুরস্ক", "indonesia": "🇮🇩 ইন্দোনেশিয়া",
  "city": "শহর", "village": "গ্রাম", "forest": "বন", "beach": "সমুদ্র সৈকত", "mountain": "পাহাড়", "desert": "মরুভূমি", "river": "নদী", "urban": "নগর", "suburban": "উপনগর", "rural": "গ্রামীণ",
  "modern": "আধুনিক", "traditional": "ঐতিহ্যবাহী", "futuristic": "ভবিষ্যৎমুখী", "historical": "ঐতিহাসিক", "natural": "প্রাকৃতিক", "industrial": "শিল্প", "spiritual": "আধ্যাত্মিক",
  "sunny": "রৌদ্রোজ্জ্বল", "cloudy": "মেঘলা", "rainy": "বৃষ্টি", "stormy": "ঝড়", "snowy": "তুষারপাত", "foggy": "কুয়াশা", "windy": "ঝড়ো হাওয়া", "clear": "পরিষ্কার",
  "spring": "বসন্ত", "summer": "গ্রীষ্ম", "autumn": "শরৎ", "winter": "শীত", "monsoon": "বর্ষা", "dry": "শুষ্ক",
  "indoor": "ইনডোর", "outdoor": "আউটডোর", "studio": "স্টুডিও", "mixed": "মিক্সড",
  "day": "দিন", "night": "রাত", "golden-hour": "সোনালি", "blue-hour": "নীল", "dawn": "ভোর",
  "tense": "উত্তেজনাপূর্ণ", "peaceful": "শান্ত", "mysterious": "রহস্যময়",
  "low-key": "কম আলো",
  "warm": "উষ্ণ", "cool": "শীতল", "cinematic": "সিনেমাটিক", "vintage": "ভিন্টেজ",
  "static": "স্থির", "handheld": "হ্যান্ডহেল্ড", "dolly": "ডলি", "drone": "ড্রোন", "tracking": "ট্র্যাকিং",
  "soft": "হালকা", "medium": "মাঝারি", "strong": "শক্তিশালী", "explosive": "বিস্ফোরক",
  "question": "প্রশ্ন", "shock": "শক", "mystery": "রহস্য", "action": "অ্যাকশন", "emotion": "আবেগ",
  "none": "নেই", "mild": "হালকা", "intense": "তীব্র", "cliffhanger": "ক্লিফহ্যাঙ্গার",
  "linear": "সোজা", "non-linear": "জটিল", "circular": "বৃত্তাকার", "twist-ending": "টুইস্ট",
  "flat": "সমতল", "build-up": "ক্রমবর্ধমান", "roller-coaster": "রোলার", "crescendo": "ক্রিসেন্ডো",
  "subtle": "সূক্ষ্ম", "mind-blowing": "মাইন্ডব্লো",
  "early": "শুরুতে", "middle": "মাঝে", "climax": "ক্লাইম্যাক্স", "end-reveal": "শেষে",
  "low": "কম", "balanced": "সুষম", "high": "উচ্চ", "extreme": "চরম",
  "normal": "স্বাভাবিক", "slow-mo": "স্লো-মো", "speed-ramp": "র‍্যাম্প", "time-lapse": "টাইমল্যাপস",
  "cut": "কাট", "fade": "ফেড", "creative": "ক্রিয়েটিভ", "seamless": "সিমলেস",
  "moderate": "মাঝারি", "heavy": "ভারী",
  "niche": "নিশ", "universal": "সার্বজনীন", "deeply-personal": "ব্যক্তিগত",
  "hint": "ইঙ্গিত", "core-theme": "মূল থিম",
  "viral-bait": "ভাইরাল",
  "soft-loop": "হালকা লুপ", "perfect-loop": "পারফেক্ট লুপ",
  "slow": "ধীর", "fast": "দ্রুত", "hyper": "হাইপার",
  "end": "শেষে", "throughout": "সর্বত্র",
  "original": "অরিজিনাল", "trending": "ট্রেন্ডিং", "remix": "রিমিক্স", "iconic": "আইকনিক",
  // Advanced Creative
  "subtle-twist": "সূক্ষ্ম মোড়", "shocking-ending": "চমকে দেওয়া সমাপ্তি", "full-perspective-shift": "সম্পূর্ণ দৃষ্টিভঙ্গি পরিবর্তন",
  "deep-asmr": "গভীর তৃপ্তি (ASMR)", "primal-fear": "আদিম ভয়", "intense-curiosity": "তীব্র কৌতূহল", "viral-attraction": "ভাইরাল আকর্ষণ",
  "ultra-wide-16mm": "আল্ট্রা-ওয়াইড (১৬মিমি)", "standard-35mm": "সাধারণ লেন্স (৩৫মিমি)", "portrait-85mm": "পোর্টেট ডেপথ (৮৫মিমি)", "macro-100mm": "ম্যাক্রো ডিটেইল (১০০মিমি)",
  "moody-side-light": "মুডি সাইড-লাইট", "dramatic-backlit": "ড্রামাটিক ব্যাকলিট", "soft-ambient": "সফট অ্যাম্বিয়েন্ট", "high-contrast-rim": "হাই-কনট্রাস্ট রিম লাইট",
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
  // 🔥 মহা-শক্তি (Mega Power)
  "blurry-pedestrians": "ঝাপসা পথচারী", "dynamic-crowd": "গতিশীল ভিড়",
  "statue-still": "মূর্তির মতো স্থির", "shadowy-figures": "ছায়াময় অবয়ব",
  "hostile-audience": "শত্রুভাবাপন্ন দর্শক", "distant-observers": "দূরবর্তী পর্যবেক্ষক",
  "cinematic-particles": "সিনেমাটিক কণা", "flying-dust": "উড়ন্ত ধূলিকণা",
  "neon-fog": "নিয়ন কুয়াশা", "volumetric-lighting": "ভলিউমেট্রিক লাইটিং",
  "glitch-effect": "গ্লিচ ইফেক্ট", "natural-overlay": "প্রাকৃতিক ওভারলে",
  "high-detail-texture": "হাই-ডিটেইল টেক্সচার", "otherworldly-glow": "অপার্থিব আভা",
  "chaos-factor": "বিশৃঙ্খল ফ্যাক্টর", "sudden-silence": "আকস্মিক নীরবতা",
  "color-shift": "রঙের পরিবর্তন", "zero-gravity": "মাধ্যাকর্ষণহীনতা",
  "time-slow": "সময়ের ধীরগতি", "reality-crack": "বাস্তবতায় ফাটল",
  "emotional-explosion": "আবেগীয় বিস্ফোরণ", "hidden-signal": "লুকানো সংকেত",
  "cyberpunk-dystopia": "সাইবারপাঙ্ক ডিস্টোপিয়া", "ancient-mythology": "প্রাচীন মিথলজি",
  "surreal-dreamworld": "পরাবাস্তব স্বপ্নজগত", "hyper-realistic-noir": "হাইপার-রিয়েলিস্টিক নোয়ার",
  "cosmic-horror": "কসমিক হরর", "minimalist-zen": "মিনিমালিস্ট জেন",
  "futuristic-tech": "ফিউচারিস্টিক টেক", "survival-fight": "সারভাইভাল লড়াই",
  "lone-hero": "একাকী নায়ক", "mysterious-artifact": "রহস্যময় নিদর্শন",
  "impossible-architecture": "অসম্ভব স্থাপত্য", "hidden-monster": "লুকানো দানব",
  "sacred-geometry": "পবিত্র জ্যামিতি", "floating-monolith": "ভাসমান মনোলিথ",
  "silent-hero": "নির্বাক নায়ক", "mysterious-stranger": "রহস্যময় আগন্তুক",
  "divine-entity": "ঐশ্বরিক সত্তা", "cybernetic-outlook": "সাইবারনেটিক আউটলক",
  "lost-child": "হারিয়ে যাওয়া শিশু", "ancient-sage": "প্রাচীন ঋষি",
  "no-human-face": "মানুষের মুখ নিষিদ্ধ", "no-bright-colors": "উজ্জ্বল রং নিষিদ্ধ",
  "no-modern-tech": "আধুনিক প্রযুক্তি নিষিদ্ধ", "no-dialogue": "সংলাপ নিষিদ্ধ",
  "no-gravity": "মাধ্যাকর্ষণ নিষিদ্ধ", "no-sound": "শব্দ নিষিদ্ধ", "no-fast-motion": "দ্রুত গতি নিষিদ্ধ",
};

function getDisplayValue(value: string): string {
  // Handle comma-separated multi-values
  if (value.includes(",")) {
    return value.split(",").map(v => VALUE_DISPLAY[v.trim()] || v.trim().toUpperCase()).join(" + ");
  }
  return VALUE_DISPLAY[value] || value.toUpperCase();
}

// Section accent colors (matches BlueprintDisplay section accents)
const sectionAccentColors: Record<SectionKey, {
  border: string; headerBg: string; text: string; tagBg: string; rowAlt: string;
}> = {
  ka: {
    border: "hsl(250 60% 82%)",
    headerBg: "hsl(250 50% 96%)",
    text: "hsl(250 70% 45%)",
    tagBg: "hsl(250 60% 55%)",
    rowAlt: "hsl(250 40% 97%)",
  },
  kha: {
    border: "hsl(320 55% 82%)",
    headerBg: "hsl(320 45% 96%)",
    text: "hsl(320 65% 42%)",
    tagBg: "hsl(320 60% 52%)",
    rowAlt: "hsl(320 35% 97%)",
  },
  ga: {
    border: "hsl(160 50% 78%)",
    headerBg: "hsl(160 45% 95%)",
    text: "hsl(160 60% 32%)",
    tagBg: "hsl(160 55% 42%)",
    rowAlt: "hsl(160 35% 96%)",
  },
};

interface SectionParamOverridesProps {
  sectionKey: SectionKey;
  params: BlueprintParams;
}

export function SectionParamOverrides({ sectionKey, params }: SectionParamOverridesProps) {
  const changedItems = useMemo(() => {
    const items: { serial: string; label: string; value: string; category: string }[] = [];
    let serial = 0;

    const allKeys = Object.keys(PARAM_META) as (keyof BlueprintParams)[];
    for (const key of allKeys) {
      const meta = PARAM_META[key];
      if (meta.section !== sectionKey) continue;
      
      const currentValue = params[key];
      const defaultValue = DEFAULT_PARAMS[key];
      if (currentValue !== defaultValue) {
        serial++;
        items.push({
          serial: BN_NUMBERS[serial - 1] || String(serial),
          label: meta.label,
          value: getDisplayValue(currentValue),
          category: meta.category,
        });
      }
    }
    return items;
  }, [sectionKey, params]);

  if (changedItems.length === 0) return null;

  const accent = sectionAccentColors[sectionKey];
  let lastCategory = "";

  return (
    <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${accent.border}` }}>
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <span
          className="text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
          style={{ background: accent.tagBg }}
        >
          🎛️ Override
        </span>
        <span className="text-[9px] font-medium" style={{ color: accent.text, opacity: 0.7 }}>
          {changedItems.length}টি পরিবর্তিত
        </span>
      </div>
      <table
        className="w-full border-collapse text-xs"
        style={{
          border: `1px solid ${accent.border}80`,
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: accent.headerBg, borderBottom: `1px solid ${accent.border}60` }}>
            <th className="py-1 px-1.5 text-left font-extrabold uppercase tracking-wider"
              style={{ color: accent.text, borderRight: `1px solid ${accent.border}40`, width: "28px", fontSize: "8px" }}>#</th>
            <th className="py-1 px-2 text-left font-extrabold uppercase tracking-wider"
              style={{ color: accent.text, borderRight: `1px solid ${accent.border}40`, width: "40%", fontSize: "8px" }}>Label</th>
            <th className="py-1 px-2 text-left font-extrabold uppercase tracking-wider"
              style={{ color: accent.text, fontSize: "8px" }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {changedItems.map((item, idx) => {
            const showCatHeader = item.category !== lastCategory;
            lastCategory = item.category;
            return (
              <React.Fragment key={`override-${idx}`}>
                {showCatHeader && (
                  <tr>
                    <td colSpan={3} className="py-0.5 px-2 text-[8px] font-bold uppercase tracking-wider"
                      style={{ background: accent.headerBg, color: accent.text, borderBottom: `1px solid ${accent.border}40` }}>
                      {item.category}
                    </td>
                  </tr>
                )}
                <tr
                  className="transition-colors"
                  style={{
                    borderBottom: idx < changedItems.length - 1 ? `1px solid ${accent.border}30` : "none",
                    background: idx % 2 === 0 ? "transparent" : accent.rowAlt,
                  }}
                >
                  <td className="py-1 px-1.5 text-center font-bold"
                    style={{ color: `${accent.text}90`, borderRight: `1px solid ${accent.border}30`, fontSize: "9px" }}>
                    {item.serial}
                  </td>
                  <td className="py-1 px-2 font-semibold"
                    style={{ color: accent.text, borderRight: `1px solid ${accent.border}30`, fontSize: "10px" }}>
                    {item.label}
                  </td>
                  <td className="py-1 px-2" style={{ fontSize: "10px" }}>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-white"
                      style={{ background: accent.tagBg, fontSize: "9px" }}>
                      {item.value}
                    </span>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
