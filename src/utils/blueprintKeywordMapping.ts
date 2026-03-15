/**
 * Smart Keyword Mapping for Blueprint ↔ Parameter Sync
 * 
 * This file contains mappings between parameter values and their
 * Bengali/English keywords that might appear in blueprint text.
 * Used for in-place replacement when parameters match blueprint content.
 */

import type { BlueprintParams } from "@/components/creative-core/BlueprintParamsOverride";

// Each mapping contains: value → [keywords that identify it, replacement text]
export interface KeywordMapping {
  keywords: RegExp[];  // Patterns to detect in blueprint
  replacement: string; // What to replace with (Bengali preferred)
}

export type ParamKeywordMap = {
  [K in keyof BlueprintParams]?: {
    [value: string]: KeywordMapping;
  };
};

// === TIME OF DAY ===
const timeOfDayMap: ParamKeywordMap["timeOfDay"] = {
  "day": {
    keywords: [/দিনের\s*আলো/gi, /দিনের\s*বেলা/gi, /সকাল/gi, /দুপুর/gi, /বিকেল/gi, /daytime/gi, /daylight/gi, /afternoon/gi, /morning/gi],
    replacement: "দিনের আলোয়",
  },
  "night": {
    keywords: [/রাত/gi, /রাতের/gi, /রাত্রি/gi, /অন্ধকার/gi, /নিশি/gi, /night/gi, /nighttime/gi, /midnight/gi, /darkness/gi],
    replacement: "রাতের অন্ধকারে",
  },
  "golden-hour": {
    keywords: [/সোনালি\s*আলো/gi, /গোধূলি/gi, /সন্ধ্যা/gi, /golden\s*hour/gi, /sunset\s*light/gi],
    replacement: "সোনালি আলোর গোধূলিতে",
  },
  "blue-hour": {
    keywords: [/নীল\s*আলো/gi, /blue\s*hour/gi, /twilight/gi],
    replacement: "নীল আলোর সন্ধ্যায়",
  },
  "dawn": {
    keywords: [/ভোর/gi, /প্রভাত/gi, /ঊষা/gi, /dawn/gi, /sunrise/gi, /early\s*morning/gi],
    replacement: "ভোরের আলোয়",
  },
};

// === WEATHER ===
const weatherMap: ParamKeywordMap["weather"] = {
  "sunny": {
    keywords: [/রোদ/gi, /সূর্যালোক/gi, /ঝলমলে/gi, /sunny/gi, /bright\s*sun/gi],
    replacement: "রোদেলা আবহাওয়ায়",
  },
  "cloudy": {
    keywords: [/মেঘলা/gi, /মেঘাচ্ছন্ন/gi, /আকাশ\s*ঢাকা/gi, /cloudy/gi, /overcast/gi],
    replacement: "মেঘলা আকাশের নিচে",
  },
  "rainy": {
    keywords: [/বৃষ্টি/gi, /বর্ষা/gi, /ঝড়/gi, /rainy/gi, /rain/gi, /monsoon/gi, /shower/gi],
    replacement: "বৃষ্টির মধ্যে",
  },
  "stormy": {
    keywords: [/ঝড়/gi, /তুফান/gi, /প্রবল\s*বাতাস/gi, /stormy/gi, /storm/gi, /tempest/gi],
    replacement: "ঝড়ের মধ্যে",
  },
  "snowy": {
    keywords: [/তুষার/gi, /বরফ/gi, /snowy/gi, /snow/gi, /winter\s*snow/gi],
    replacement: "তুষারপাতের মধ্যে",
  },
  "foggy": {
    keywords: [/কুয়াশা/gi, /ধোঁয়াশা/gi, /foggy/gi, /fog/gi, /mist/gi, /misty/gi],
    replacement: "কুয়াশাচ্ছন্ন পরিবেশে",
  },
  "windy": {
    keywords: [/বাতাস/gi, /হাওয়া/gi, /ঝোড়ো\s*হাওয়া/gi, /windy/gi, /wind/gi, /breezy/gi],
    replacement: "ঝড়ো হাওয়ায়",
  },
  "clear": {
    keywords: [/পরিষ্কার\s*আকাশ/gi, /ফরসা/gi, /clear\s*sky/gi, /clear/gi],
    replacement: "পরিষ্কার আকাশের নিচে",
  },
};

// === ENVIRONMENT ===
const environmentMap: ParamKeywordMap["environment"] = {
  "indoor": {
    keywords: [/ঘরের\s*ভিতর/gi, /বাড়ির\s*ভিতর/gi, /indoor/gi, /inside/gi, /interior/gi, /room/gi],
    replacement: "অভ্যন্তরীণ পরিবেশে",
  },
  "outdoor": {
    keywords: [/বাইরে/gi, /খোলা\s*আকাশ/gi, /মাঠ/gi, /outdoor/gi, /outside/gi, /exterior/gi, /open\s*air/gi],
    replacement: "বহিরাঙ্গনে",
  },
  "studio": {
    keywords: [/স্টুডিও/gi, /studio/gi, /set/gi],
    replacement: "স্টুডিও সেটিংয়ে",
  },
  "mixed": {
    keywords: [/মিশ্র/gi, /mixed/gi],
    replacement: "মিশ্র পরিবেশে",
  },
};

// === MOOD ===
const moodMap: ParamKeywordMap["mood"] = {
  "happy": {
    keywords: [/আনন্দ/gi, /খুশি/gi, /হাসি/gi, /উৎফুল্ল/gi, /happy/gi, /joyful/gi, /cheerful/gi],
    replacement: "আনন্দময় পরিবেশে",
  },
  "tense": {
    keywords: [/উত্তেজনা/gi, /টানটান/gi, /থ্রিল/gi, /tense/gi, /tension/gi, /suspense/gi, /thrilling/gi],
    replacement: "টানটান উত্তেজনায়",
  },
  "peaceful": {
    keywords: [/শান্ত/gi, /নির্মল/gi, /প্রশান্ত/gi, /peaceful/gi, /calm/gi, /serene/gi, /tranquil/gi],
    replacement: "শান্ত ও প্রশান্ত পরিবেশে",
  },
  "dramatic": {
    keywords: [/নাটকীয়/gi, /ড্রামাটিক/gi, /dramatic/gi],
    replacement: "নাটকীয় পরিবেশে",
  },
  "mysterious": {
    keywords: [/রহস্যময়/gi, /অজানা/gi, /গোপন/gi, /mysterious/gi, /mystery/gi, /enigmatic/gi],
    replacement: "রহস্যময় পরিবেশে",
  },
};

// === LIGHT SOURCE DIRECTION (replaces lighting) ===
const lightSourceDirectionMap: ParamKeywordMap["lightSourceDirection"] = {
  "soft-ambient": {
    keywords: [/প্রাকৃতিক\s*আলো/gi, /স্বাভাবিক\s*আলো/gi, /natural\s*light/gi, /সফট/gi, /ambient/gi],
    replacement: "সফট অ্যাম্বিয়েন্ট আলোয়",
  },
  "high-contrast-rim": {
    keywords: [/স্টুডিও\s*আলো/gi, /studio\s*light/gi, /রিম/gi, /rim\s*light/gi],
    replacement: "হাই-কনট্রাস্ট রিম লাইটে",
  },
  "dramatic-backlit": {
    keywords: [/নাটকীয়\s*আলো/gi, /ছায়া/gi, /dramatic\s*light/gi, /chiaroscuro/gi, /backlit/gi],
    replacement: "ড্রামাটিক ব্যাকলিটে",
  },
  "moody-side-light": {
    keywords: [/সোনালি\s*আলো/gi, /গোধূলি/gi, /golden\s*hour\s*light/gi, /সাইড/gi, /side\s*light/gi],
    replacement: "মুডি সাইড-লাইটে",
  },
};

// === LOCATION TYPE ===
const locationTypeMap: ParamKeywordMap["locationType"] = {
  "city": {
    keywords: [/শহর/gi, /নগর/gi, /city/gi, /urban\s*area/gi, /metropolis/gi],
    replacement: "শহরে",
  },
  "village": {
    keywords: [/গ্রাম/gi, /পল্লী/gi, /village/gi, /countryside/gi],
    replacement: "গ্রামে",
  },
  "forest": {
    keywords: [/বন/gi, /জঙ্গল/gi, /অরণ্য/gi, /forest/gi, /jungle/gi, /woods/gi],
    replacement: "বনের মধ্যে",
  },
  "beach": {
    keywords: [/সমুদ্র/gi, /সৈকত/gi, /সাগর/gi, /beach/gi, /seaside/gi, /ocean/gi, /coast/gi],
    replacement: "সমুদ্র সৈকতে",
  },
  "mountain": {
    keywords: [/পাহাড়/gi, /পর্বত/gi, /mountain/gi, /hill/gi, /highland/gi],
    replacement: "পাহাড়ে",
  },
  "desert": {
    keywords: [/মরুভূমি/gi, /মরু/gi, /desert/gi, /sandy/gi],
    replacement: "মরুভূমিতে",
  },
  "river": {
    keywords: [/নদী/gi, /নদীর\s*ধার/gi, /river/gi, /riverbank/gi, /riverside/gi],
    replacement: "নদীর পাড়ে",
  },
  "urban": {
    keywords: [/নগর/gi, /urban/gi],
    replacement: "নগরে",
  },
  "suburban": {
    keywords: [/উপনগর/gi, /suburban/gi],
    replacement: "উপনগরে",
  },
  "rural": {
    keywords: [/গ্রামীণ/gi, /মফস্বল/gi, /rural/gi],
    replacement: "গ্রামীণ এলাকায়",
  },
};

// === SEASON ===
const seasonMap: ParamKeywordMap["season"] = {
  "spring": {
    keywords: [/বসন্ত/gi, /ফাল্গুন/gi, /spring/gi],
    replacement: "বসন্তকালে",
  },
  "summer": {
    keywords: [/গ্রীষ্ম/gi, /গরম/gi, /তাপ/gi, /summer/gi, /hot/gi],
    replacement: "গ্রীষ্মকালে",
  },
  "autumn": {
    keywords: [/শরৎ/gi, /হেমন্ত/gi, /autumn/gi, /fall/gi],
    replacement: "শরৎকালে",
  },
  "winter": {
    keywords: [/শীত/gi, /ঠাণ্ডা/gi, /winter/gi, /cold/gi],
    replacement: "শীতকালে",
  },
  "monsoon": {
    keywords: [/বর্ষা/gi, /বৃষ্টি/gi, /monsoon/gi, /rainy\s*season/gi],
    replacement: "বর্ষাকালে",
  },
  "dry": {
    keywords: [/শুষ্ক/gi, /খরা/gi, /dry/gi, /arid/gi],
    replacement: "শুষ্ক মৌসুমে",
  },
};

// === LENS APERTURE (replaces framing) ===
const lensApertureMap: ParamKeywordMap["lensAperture"] = {
  "macro-100mm": {
    keywords: [/ম্যাক্রো/gi, /অতি\s*কাছে/gi, /macro/gi, /extreme\s*close/gi, /100mm/gi],
    replacement: "ম্যাক্রো ডিটেইলে (১০০মিমি)",
  },
  "ultra-wide-16mm": {
    keywords: [/ফুল\s*শট/gi, /পুরো\s*শরীর/gi, /full\s*shot/gi, /full\s*body/gi, /ওয়াইড/gi, /wide/gi, /16mm/gi],
    replacement: "আল্ট্রা-ওয়াইডে (১৬মিমি)",
  },
  "standard-35mm": {
    keywords: [/মিডিয়াম\s*শট/gi, /মাঝারি\s*শট/gi, /medium\s*shot/gi, /35mm/gi],
    replacement: "সাধারণ লেন্সে (৩৫মিমি)",
  },
  "portrait-85mm": {
    keywords: [/ক্লোজ\s*আপ/gi, /কাছে/gi, /close\s*up/gi, /closeup/gi, /পোর্ট্রেট/gi, /85mm/gi],
    replacement: "পোর্ট্রেট ডেপথে (৮৫মিমি)",
  },
};

// === CAMERA EYE MOVEMENT (replaces cameraMovement) ===
const cameraEyeMovementMap: ParamKeywordMap["cameraEyeMovement"] = {
  "static-witness": {
    keywords: [/স্থির/gi, /নড়াচড়াহীন/gi, /static/gi, /fixed/gi, /stationary/gi],
    replacement: "স্থির সাক্ষী দৃষ্টিতে",
  },
  "handheld-tremor": {
    keywords: [/হ্যান্ডহেল্ড/gi, /হাতে\s*ধরা/gi, /handheld/gi],
    replacement: "হ্যান্ডহেল্ড কম্পনে",
  },
  "mechanical-slide": {
    keywords: [/ডলি/gi, /dolly/gi, /tracking\s*shot/gi, /মেকানিক্যাল/gi],
    replacement: "মেকানিক্যাল স্লাইডে",
  },
  "predator-chase": {
    keywords: [/ড্রোন/gi, /আকাশ\s*থেকে/gi, /drone/gi, /aerial/gi, /প্রিডেটর/gi],
    replacement: "প্রিডেটর চেজে",
  },
  "slow-breathing": {
    keywords: [/ট্র্যাকিং/gi, /অনুসরণ/gi, /tracking/gi, /following/gi, /ধীর\s*শ্বাস/gi],
    replacement: "ধীর শ্বাসের মতো মুভমেন্টে",
  },
};

// === FUTURISTIC SYSTEMS (নতুন) ===
const futuristicSystemsMap: ParamKeywordMap["futuristicSystems"] = {
  "temporal-engine": {
    keywords: [/টেম্পোরাল/gi, /সময়-ভিত্তিক/gi, /temporal/gi, /time\s*engine/gi, /প্রেডিক্টিভ\s*ইঞ্জিন/gi, /predictive\s*engine/gi],
    replacement: "টেম্পোরাল প্রেডিক্টিভ ইঞ্জিন সক্রিয়",
  },
  "dimensional-mapping": {
    keywords: [/বহুমাত্রিক/gi, /নন-ইউক্লিডিয়ান/gi, /non-euclidean/gi, /dimensional/gi, /multi-dimensional/gi, /মেমোরি\s*ম্যাপিং/gi],
    replacement: "নন-ইউক্লিডিয়ান মেমোরি ম্যাপিংয়ে",
  },
  "ghost-protocol": {
    keywords: [/ঘোস্ট/gi, /ghost/gi, /অদৃশ্য/gi, /সর্বব্যাপী/gi, /omnipresent/gi, /phantom/gi],
    replacement: "ঘোস্ট ইন দ্য মেশিন প্রোটোকলে",
  },
  "quantum-density": {
    keywords: [/সাব-অ্যাটমিক/gi, /sub-atomic/gi, /কোয়ান্টাম/gi, /quantum/gi, /ডেটা\s*ডেনসিটি/gi, /data\s*density/gi],
    replacement: "সাব-অ্যাটমিক ডেটা ডেনসিটিতে",
  },
  "network-dominance": {
    keywords: [/নেটওয়ার্ক\s*শাসন/gi, /গ্লোবাল\s*নেটওয়ার্ক/gi, /ডিজিটাল\s*আধিপত্য/gi, /network\s*dominance/gi, /digital\s*supremacy/gi],
    replacement: "গ্লোবাল নেটওয়ার্ক ডমিন্যান্সে",
  },
  "reality-simulation": {
    keywords: [/সিমুলেশন/gi, /ফলাফল\s*সিমুলেট/gi, /simulation/gi, /reality\s*simulation/gi, /ট্রিলিয়ন\s*সম্ভাবনা/gi],
    replacement: "রিয়ালিটি সিমুলেশন ম্যাট্রিক্সে",
  },
};

// Complete mapping object
export const PARAM_KEYWORD_MAPPINGS: ParamKeywordMap = {
  timeOfDay: timeOfDayMap,
  weather: weatherMap,
  environment: environmentMap,
  mood: moodMap,
  lightSourceDirection: lightSourceDirectionMap,
  locationType: locationTypeMap,
  season: seasonMap,
  lensAperture: lensApertureMap,
  cameraEyeMovement: cameraEyeMovementMap,
  futuristicSystems: futuristicSystemsMap,
};

// Parameters that support in-place replacement
export const REPLACEABLE_PARAMS: (keyof BlueprintParams)[] = [
  "timeOfDay",
  "weather",
  "environment",
  "mood",
  "lightSourceDirection",
  "locationType",
  "season",
  "lensAperture",
  "cameraEyeMovement",
  "futuristicSystems",
];

/**
 * Detect if a parameter value's keywords exist in the blueprint text
 * Returns the matched text and its position if found
 */
export function detectKeywordInBlueprint(
  blueprintText: string,
  paramKey: keyof BlueprintParams,
  currentValue: string
): { matched: boolean; matchedText?: string; index?: number } {
  const paramMap = PARAM_KEYWORD_MAPPINGS[paramKey];
  if (!paramMap) return { matched: false };

  // Check ALL values of this param to find if any keyword exists in blueprint
  for (const [value, mapping] of Object.entries(paramMap)) {
    for (const pattern of mapping.keywords) {
      const match = blueprintText.match(pattern);
      if (match) {
        return {
          matched: true,
          matchedText: match[0],
          index: match.index,
        };
      }
    }
  }

  return { matched: false };
}

/**
 * Replace matched keyword in blueprint with the new parameter value's text
 */
export function replaceKeywordInBlueprint(
  blueprintText: string,
  paramKey: keyof BlueprintParams,
  newValue: string
): { replaced: boolean; newContent: string; replacedFrom?: string; replacedTo?: string } {
  const paramMap = PARAM_KEYWORD_MAPPINGS[paramKey];
  if (!paramMap) return { replaced: false, newContent: blueprintText };

  const newValueMapping = paramMap[newValue];
  if (!newValueMapping) return { replaced: false, newContent: blueprintText };

  let content = blueprintText;
  let replaced = false;
  let replacedFrom: string | undefined;
  let replacedTo: string | undefined;

  // Find and replace keywords from OTHER values of this param
  for (const [value, mapping] of Object.entries(paramMap)) {
    if (value === newValue) continue; // Skip the new value's keywords

    for (const pattern of mapping.keywords) {
      const match = content.match(pattern);
      if (match) {
        replacedFrom = match[0];
        replacedTo = newValueMapping.replacement;
        content = content.replace(pattern, newValueMapping.replacement);
        replaced = true;
        break; // Only replace first match per param
      }
    }
    if (replaced) break;
  }

  return { replaced, newContent: content, replacedFrom, replacedTo };
}

/**
 * Check if a parameter value's keywords already exist in blueprint
 * (meaning no replacement needed, it's already matching)
 */
export function isValueAlreadyInBlueprint(
  blueprintText: string,
  paramKey: keyof BlueprintParams,
  value: string
): boolean {
  const paramMap = PARAM_KEYWORD_MAPPINGS[paramKey];
  if (!paramMap) return false;

  const valueMapping = paramMap[value];
  if (!valueMapping) return false;

  // Check if any of this value's keywords exist in blueprint
  for (const pattern of valueMapping.keywords) {
    if (pattern.test(blueprintText)) {
      return true;
    }
  }

  return false;
}
