import React, { useMemo } from "react";
import { type BlueprintParams, DEFAULT_PARAMS } from "./BlueprintParamsOverride";

/**
 * সারণী (ঘ) — Parameter Override Table
 * 
 * This component renders ALL parameter values that differ from defaults
 * in a reactive table. When any parameter changes, the table auto-updates.
 */

interface ParamDisplayItem {
  serial: string;
  label: string;
  value: string;
  category: string;
}

// Bengali serial numbers
const BN_NUMBERS = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০", "১১", "১২", "১৩", "১৪", "১৫", "১৬", "১৭", "১৮", "১৯", "২০", "২১", "২২", "২৩", "২৪", "২৫", "২৬", "২৭", "২৮", "২৯", "৩০", "৩১", "৩২", "৩৩", "৩৪", "৩৫", "৩৬", "৩৭", "৩৮", "৩৯", "৪০", "৪১", "৪২", "৪৩", "৪৪", "৪৫"];

// Parameter label mappings (key → Bengali label)
const PARAM_LABELS: Record<keyof BlueprintParams, { label: string; category: string }> = {
  // Core
  voicePresence: { label: "কথাবার্তার উপস্থিতি", category: "🎯 কোর" },
  realismLevel: { label: "রিয়েলিজম মোড", category: "🎯 কোর" },
  episodeCount: { label: "পর্ব সংখ্যা", category: "🎯 কোর" },
  // Voice
  voiceLanguage: { label: "ভয়েস ভাষা", category: "🎤 ভয়েস" },
  voiceGender: { label: "ভয়েস লিঙ্গ", category: "🎤 ভয়েস" },
  voiceAge: { label: "ভয়েস বয়স", category: "🎤 ভয়েস" },
  voiceEmotion: { label: "ভয়েস আবেগ", category: "🎤 ভয়েস" },
  voiceTone: { label: "ভয়েস টোন", category: "🎤 ভয়েস" },
  voiceAccent: { label: "ভয়েস অ্যাক্সেন্ট", category: "🎤 ভয়েস" },
  narratorStyle: { label: "ন্যারেটর স্টাইল", category: "🎤 ভয়েস" },
  // Location
  country: { label: "দেশ", category: "🌍 লোকেশন" },
  locationType: { label: "লোকেশন ধরন", category: "🌍 লোকেশন" },
  locationVibe: { label: "লোকেশন ভাইব", category: "🌍 লোকেশন" },
  weather: { label: "আবহাওয়া", category: "🌍 লোকেশন" },
  season: { label: "ঋতু", category: "🌍 লোকেশন" },
  // Output
  aspectRatio: { label: "অ্যাসপেক্ট রেশিও", category: "📹 আউটপুট" },
  duration: { label: "ভিডিও দৈর্ঘ্য", category: "📹 আউটপুট" },
  resolution: { label: "রেজোলিউশন", category: "📹 আউটপুট" },
  frameRate: { label: "ফ্রেম রেট", category: "📹 আউটপুট" },
  // Camera
  colorGrade: { label: "কালার গ্রেড", category: "🎥 ক্যামেরা" },
  // Environment
  environment: { label: "পরিবেশ", category: "🌿 পরিবেশ" },
  timeOfDay: { label: "দিনের সময়", category: "🌿 পরিবেশ" },
  mood: { label: "মুড/আবেগ", category: "🌿 পরিবেশ" },
  // Viral - Hook
  openingStyle: { label: "শুরুর ধরন", category: "🚀 ভাইরাল" },
  curiosityGap: { label: "কৌতূহল তৈরি", category: "🚀 ভাইরাল" },
  // Viral - Story
  narrativeArc: { label: "গল্পের কাঠামো", category: "🚀 ভাইরাল" },
  emotionalJourney: { label: "আবেগের যাত্রা", category: "🚀 ভাইরাল" },
  twistIntensity: { label: "টুইস্ট তীব্রতা", category: "🚀 ভাইরাল" },
  peakMoment: { label: "চরম মুহূর্ত", category: "🚀 ভাইরাল" },
  // Viral - Visual
  speedDynamics: { label: "গতি ডায়নামিক্স", category: "🚀 ভাইরাল" },
  transitionStyle: { label: "ট্রানজিশন স্টাইল", category: "🎥 ক্যামেরা" },
  vfxIntensity: { label: "VFX তীব্রতা", category: "🎥 ক্যামেরা" },
  // Viral - Engagement
  relatability: { label: "সম্পর্কযোগ্যতা", category: "🚀 ভাইরাল" },
  nostalgiaLevel: { label: "নস্টালজিয়া লেভেল", category: "🚀 ভাইরাল" },
  shockValue: { label: "শক ভ্যালু", category: "🚀 ভাইরাল" },
  shareability: { label: "শেয়ারযোগ্যতা", category: "🚀 ভাইরাল" },
  // Viral - Platform
  loopFriendly: { label: "লুপ ফ্রেন্ডলি", category: "🚀 ভাইরাল" },
  pacing: { label: "গতি/পেসিং", category: "🚀 ভাইরাল" },
  ctaPlacement: { label: "CTA অবস্থান", category: "🚀 ভাইরাল" },
  soundTrend: { label: "সাউন্ড ট্রেন্ড", category: "🚀 ভাইরাল" },
  // Futuristic Systems
  futuristicSystems: { label: "ফিউচারিস্টিক সিস্টেম", category: "⚡ ফিউচারিস্টিক" },
  // ভাইরাল সাইকোলজি
  patternDisruption: { label: "প্যাটার্ন ডিসরাপশন", category: "🧠 সাইকোলজি" },
  audiencePsychologyTrigger: { label: "অডিয়েন্স সাইকোলজি ট্রিগার", category: "🧠 সাইকোলজি" },
  // টেকনিক্যাল ভিজুয়াল
  lensAperture: { label: "লেন্স ও অ্যাপারচার", category: "🎥 ক্যামেরা" },
  lightSourceDirection: { label: "লাইট সোর্স ডিরেকশন", category: "🎥 ক্যামেরা" },
  // 💎 Supreme Power
  visualDramaLevel: { label: "ভিজ্যুয়াল ড্রামা লেভেল", category: "🎥 ক্যামেরা" },
  cameraEyeMovement: { label: "ক্যামেরা 'আই' মুভমেন্ট", category: "🎥 ক্যামেরা" },
  audioImmersionMode: { label: "অডিও ইমার্সন মোড", category: "🎥 ক্যামেরা" },
  informationDensity: { label: "ইনফরমেশন ডেনসিটি", category: "🧠 সাইকোলজি" },
  viralHookArchetype: { label: "ভাইরাল হুক আর্কিটাইপ", category: "🧠 সাইকোলজি" },
  // 🔥 মহা-শক্তি (Mega Power)
  backgroundPeople: { label: "পটভূমি মানুষ", category: "🎥 ক্যামেরা" },
  visualElements: { label: "ভিজুয়াল উপাদান", category: "🎥 ক্যামেরা" },
  creativeCatalyst: { label: "সৃজনশীল অনুঘটক", category: "🧠 সাইকোলজি" },
  fixedTheme: { label: "ফিক্সড থিম", category: "🎯 কোর" },
  centralAttraction: { label: "কেন্দ্রীয় আকর্ষণ", category: "🎯 কোর" },
  fixedCharacter: { label: "ফিক্সড ক্যারেক্টার", category: "🎯 কোর" },
  forbiddenElements: { label: "নিষিদ্ধ উপাদান", category: "🧠 সাইকোলজি" },
  // 🆕 NEW
  coreWorkflow: { label: "কোর ওয়ার্কফ্লো", category: "🎯 কোর" },
  coreEventFlow: { label: "কোর ইভেন্ট ফ্লো", category: "🎥 ক্যামেরা" },
  immutableMutableElements: { label: "অপরিবর্তনীয় উপাদান", category: "🧠 সাইকোলজি" },
  mutableElements: { label: "পরিবর্তনযোগ্য উপাদান", category: "🧠 সাইকোলজি" },
  variableCharacterList: { label: "ভেরিয়েবল চরিত্র তালিকা", category: "🧠 সাইকোলজি" },
};

// Value display labels (convert internal values to readable Bengali)
const VALUE_DISPLAY: Record<string, string> = {
  // Voice Presence
  "yes": "হ্যাঁ", "no": "না",
  // Framing
  "macro": "ম্যাক্রো", "full-shot": "ফুল শট", "medium-shot": "মিডিয়াম", "close-up": "ক্লোজ-আপ", "wide-shot": "ওয়াইড",
  // Audio
  "foley": "ফলি", "music": "মিউজিক", "silent-focus": "নীরব", "ambient": "অ্যাম্বিয়েন্ট",
  // Realism
  "strict-realism": "কঠোর", "bio-authentic-mutation": "মিউটেশন", "stylized": "স্টাইলাইজড",
  // Episode
  "series": "সিরিজ",
  // Voice Language
  "bengali": "বাংলা", "english": "English", "hindi": "हिंदी", "arabic": "العربية",
  // Voice Gender
  "male": "পুরুষ", "female": "মহিলা", "neutral": "নিউট্রাল", "child": "শিশু",
  // Voice Age
  "young": "তরুণ", "adult": "প্রাপ্তবয়স্ক", "mature": "পরিণত", "elderly": "বৃদ্ধ",
  // Voice Emotion
  "happy": "আনন্দিত", "sad": "দুঃখিত", "angry": "রাগান্বিত", "excited": "উত্তেজিত",
  "calm": "শান্ত", "fearful": "ভীত", "surprised": "বিস্মিত", "loving": "স্নেহপূর্ণ", "confident": "আত্মবিশ্বাসী",
  // Voice Tone
  "formal": "ফর্মাল", "casual": "ক্যাজুয়াল", "dramatic": "নাটকীয়", "whispery": "ফিসফিস", "energetic": "উদ্যমী", "soothing": "প্রশান্তিদায়ক",
  // Voice Accent
  "native": "দেশীয়", "british": "ব্রিটিশ", "american": "আমেরিকান", "australian": "অস্ট্রেলিয়ান", "indian": "ভারতীয়", "middle-eastern": "মধ্যপ্রাচ্য", "european": "ইউরোপীয়",
  // Narrator
  "storyteller": "গল্পকার", "documentary": "ডকুমেন্টারি", "news-anchor": "সংবাদ", "conversational": "কথোপকথন", "poetic": "কাব্যিক", "suspenseful": "সাসপেন্স",
  // Country
  "bangladesh": "🇧🇩 বাংলাদেশ", "india": "🇮🇳 ভারত", "usa": "🇺🇸 আমেরিকা", "uk": "🇬🇧 যুক্তরাজ্য", "uae": "🇦🇪 সংযুক্ত আরব", "saudi": "🇸🇦 সৌদি", "japan": "🇯🇵 জাপান", "china": "🇨🇳 চীন", "korea": "🇰🇷 কোরিয়া", "germany": "🇩🇪 জার্মানি", "france": "🇫🇷 ফ্রান্স", "italy": "🇮🇹 ইতালি", "spain": "🇪🇸 স্পেন", "russia": "🇷🇺 রাশিয়া", "brazil": "🇧🇷 ব্রাজিল", "australia": "🇦🇺 অস্ট্রেলিয়া", "canada": "🇨🇦 কানাডা", "egypt": "🇪🇬 মিশর", "turkey": "🇹🇷 তুরস্ক", "indonesia": "🇮🇩 ইন্দোনেশিয়া",
  // Location Type
  "city": "শহর", "village": "গ্রাম", "forest": "বন", "beach": "সমুদ্র সৈকত", "mountain": "পাহাড়", "desert": "মরুভূমি", "river": "নদী", "urban": "নগর", "suburban": "উপনগর", "rural": "গ্রামীণ",
  // Location Vibe
  "modern": "আধুনিক", "traditional": "ঐতিহ্যবাহী", "futuristic": "ভবিষ্যৎমুখী", "historical": "ঐতিহাসিক", "natural": "প্রাকৃতিক", "industrial": "শিল্প", "spiritual": "আধ্যাত্মিক",
  // Weather
  "sunny": "রৌদ্রোজ্জ্বল", "cloudy": "মেঘলা", "rainy": "বৃষ্টি", "stormy": "ঝড়", "snowy": "তুষারপাত", "foggy": "কুয়াশা", "windy": "ঝড়ো হাওয়া", "clear": "পরিষ্কার",
  // Season
  "spring": "বসন্ত", "summer": "গ্রীষ্ম", "autumn": "শরৎ", "winter": "শীত", "monsoon": "বর্ষা", "dry": "শুষ্ক",
  // Environment
  "indoor": "ইনডোর", "outdoor": "আউটডোর", "studio": "স্টুডিও", "mixed": "মিক্সড",
  // Time of Day
  "day": "দিন", "night": "রাত", "golden-hour": "সোনালি", "blue-hour": "নীল", "dawn": "ভোর",
  // Mood
  "tense": "উত্তেজনাপূর্ণ", "peaceful": "শান্ত", "mysterious": "রহস্যময়",
  // Lighting
  "low-key": "কম আলো",
  // Color Grade
  "warm": "উষ্ণ", "cool": "শীতল", "cinematic": "সিনেমাটিক", "vintage": "ভিন্টেজ",
  // Camera Movement
  "static": "স্থির", "handheld": "হ্যান্ডহেল্ড", "dolly": "ডলি", "drone": "ড্রোন", "tracking": "ট্র্যাকিং",
  // Hook
  "soft": "হালকা", "medium": "মাঝারি", "strong": "শক্তিশালী", "explosive": "বিস্ফোরক",
  // Opening
  "question": "প্রশ্ন", "shock": "শক", "mystery": "রহস্য", "action": "অ্যাকশন", "emotion": "আবেগ",
  // Curiosity
  "none": "নেই", "mild": "হালকা", "intense": "তীব্র", "cliffhanger": "ক্লিফহ্যাঙ্গার",
  // Narrative Arc
  "linear": "সোজা", "non-linear": "জটিল", "circular": "বৃত্তাকার", "twist-ending": "টুইস্ট",
  // Emotional Journey
  "flat": "সমতল", "build-up": "ক্রমবর্ধমান", "roller-coaster": "রোলার", "crescendo": "ক্রিসেন্ডো",
  // Twist
  "subtle": "সূক্ষ্ম", "mind-blowing": "মাইন্ডব্লো",
  // Peak
  "early": "শুরুতে", "middle": "মাঝে", "climax": "ক্লাইম্যাক্স", "end-reveal": "শেষে",
  // Visual Contrast
  "low": "কম", "balanced": "সুষম", "high": "উচ্চ", "extreme": "চরম",
  // Speed
  "normal": "স্বাভাবিক", "slow-mo": "স্লো-মো", "speed-ramp": "র‍্যাম্প", "time-lapse": "টাইমল্যাপস",
  // Transition
  "cut": "কাট", "fade": "ফেড", "creative": "ক্রিয়েটিভ", "seamless": "সিমলেস",
  // VFX
  "moderate": "মাঝারি", "heavy": "ভারী",
  // Relatability
  "niche": "নিশ", "universal": "সার্বজনীন", "deeply-personal": "ব্যক্তিগত",
  // Nostalgia
  "hint": "ইঙ্গিত", "core-theme": "মূল থিম",
  // Shareability
  "viral-bait": "ভাইরাল",
  // Loop
  "soft-loop": "হালকা লুপ", "perfect-loop": "পারফেক্ট লুপ",
  // Pacing
  "slow": "ধীর", "fast": "দ্রুত", "hyper": "হাইপার",
  // CTA
  "end": "শেষে", "throughout": "সর্বত্র",
  // Sound Trend
  "original": "অরিজিনাল", "trending": "ট্রেন্ডিং", "remix": "রিমিক্স", "iconic": "আইকনিক",
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
};

function getDisplayValue(value: string): string {
  return VALUE_DISPLAY[value] || value.toUpperCase();
}

interface ParameterTableGhaProps {
  params: BlueprintParams;
}

export function ParameterTableGha({ params }: ParameterTableGhaProps) {
  const changedParams = useMemo(() => {
    const items: ParamDisplayItem[] = [];
    let serial = 0;

    const allKeys = Object.keys(PARAM_LABELS) as (keyof BlueprintParams)[];
    
    for (const key of allKeys) {
      const currentValue = params[key];
      const defaultValue = DEFAULT_PARAMS[key];
      
      if (currentValue !== defaultValue) {
        serial++;
        const meta = PARAM_LABELS[key];
        items.push({
          serial: BN_NUMBERS[serial - 1] || String(serial),
          label: meta.label,
          value: getDisplayValue(currentValue),
          category: meta.category,
        });
      }
    }

    return items;
  }, [params]);

  const accentColor = "hsl(25 80% 50%)";
  const accentLight = "hsl(25 70% 96%)";
  const accentBorder = "hsl(25 60% 82%)";
  const accentText = "hsl(25 80% 38%)";

  if (changedParams.length === 0) {
    return (
      <div className="py-3 px-4 text-center">
        <p className="text-[10px] italic" style={{ color: "hsl(25 30% 55%)" }}>
          ডিফল্ট সেটিংস সক্রিয় — কোনো প্যারামিটার পরিবর্তন করলে এখানে দেখাবে
        </p>
      </div>
    );
  }

  // Group by category
  let lastCategory = "";

  return (
    <div className="space-y-0">
      <table
        className="w-full border-collapse text-xs"
        style={{
          border: `1.5px solid ${accentBorder}`,
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{
              background: accentLight,
              borderBottom: `1.5px solid ${accentBorder}`,
            }}
          >
            <th
              className="py-1.5 px-2 text-left font-extrabold uppercase tracking-wider"
              style={{
                color: accentText,
                borderRight: `1px solid ${accentBorder}80`,
                width: "36px",
                fontSize: "9px",
              }}
            >
              #
            </th>
            <th
              className="py-1.5 px-3 text-left font-extrabold uppercase tracking-wider"
              style={{
                color: accentText,
                borderRight: `1px solid ${accentBorder}80`,
                width: "35%",
                fontSize: "9px",
              }}
            >
              Label
            </th>
            <th
              className="py-1.5 px-3 text-left font-extrabold uppercase tracking-wider"
              style={{
                color: accentText,
                fontSize: "9px",
              }}
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {changedParams.map((item, idx) => {
            const showCategoryHeader = item.category !== lastCategory;
            lastCategory = item.category;

            return (
              <React.Fragment key={`param-${idx}`}>
                {showCategoryHeader && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-1 px-3 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: `linear-gradient(135deg, hsl(25 75% 94%), hsl(30 70% 92%))`,
                        color: accentText,
                        borderBottom: `1px solid ${accentBorder}60`,
                      }}
                    >
                      {item.category}
                    </td>
                  </tr>
                )}
                <tr
                  className="transition-colors"
                  style={{
                    borderBottom: idx < changedParams.length - 1 ? `1px solid ${accentBorder}40` : "none",
                    background: idx % 2 === 0 ? "transparent" : `${accentLight}80`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(25 60% 95%)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : `${accentLight}80`)}
                >
                  <td
                    className="py-1.5 px-2 text-center font-bold"
                    style={{
                      color: `${accentText}90`,
                      borderRight: `1px solid ${accentBorder}40`,
                      fontSize: "10px",
                    }}
                  >
                    {item.serial}
                  </td>
                  <td
                    className="py-1.5 px-3 font-semibold"
                    style={{
                      color: accentText,
                      borderRight: `1px solid ${accentBorder}40`,
                      fontSize: "11px",
                    }}
                  >
                    {item.label}
                  </td>
                  <td
                    className="py-1.5 px-3"
                    style={{
                      color: "hsl(var(--foreground) / 0.85)",
                      fontSize: "11px",
                    }}
                  >
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{
                        background: `linear-gradient(135deg, hsl(25 85% 52%), hsl(30 80% 48%))`,
                        color: "hsl(0 0% 100%)",
                        boxShadow: "0 1px 3px hsl(25 80% 40% / 0.2)",
                      }}
                    >
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
