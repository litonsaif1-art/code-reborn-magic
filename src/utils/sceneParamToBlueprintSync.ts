/**
 * Maps Scene Parameters (rich descriptive values) → Blueprint Params (enum values).
 * This ensures the Blueprint table UI always reflects current Scene Parameter selections.
 */

import type { SceneParams } from "@/components/creative-core/SceneParameterDialog";
import type { BlueprintParams } from "@/components/creative-core/BlueprintParamsOverride";

/** Strip emojis and extra whitespace from a string for matching */
function stripEmoji(s: string): string {
  // Remove common emoji ranges + variation selectors + ZWJ
  return s
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .replace(/[\u{20E3}]/gu, "")
    .replace(/[\u{E0020}-\u{E007F}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/[\u{2702}-\u{27B0}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .trim();
}

/** Normalize a scene param value: strip emoji, lowercase, trim */
function norm(val: string): string {
  return stripEmoji(val).toLowerCase().trim();
}

/** Map resolution string like "4320p (8K)" → "8K" */
function mapResolution(val: string): BlueprintParams["resolution"] {
  const n = norm(val);
  if (n.includes("8k") || n.includes("4320")) return "8K";
  if (n.includes("4k") || n.includes("2160")) return "4K";
  if (n.includes("full hd") || n.includes("1080")) return "FHD";
  if (n.includes("hd") || n.includes("720")) return "HD";
  if (n.includes("2k") || n.includes("1440")) return "4K";
  return "";
}

/** Map frame rate like "24fps (Cinematic)" → "24fps" */
function mapFrameRate(val: string): BlueprintParams["frameRate"] {
  const n = norm(val);
  if (n.includes("24")) return "24fps";
  if (n.includes("25") || n.includes("30")) return "30fps";
  if (n.includes("60")) return "60fps";
  if (n.includes("120") || n.includes("240")) return "120fps";
  return "";
}

/** Map aspect ratio like "9:16" → "9:16" */
function mapAspectRatio(val: string): BlueprintParams["aspectRatio"] {
  const n = norm(val);
  if (n.includes("16:9")) return "16:9";
  if (n.includes("9:16")) return "9:16";
  if (n.includes("1:1")) return "1:1";
  if (n.includes("4:3")) return "4:3";
  if (n.includes("21:9")) return "21:9";
  return "";
}

/** Map duration like "15s" or "60s" */
function mapDuration(val: string): BlueprintParams["duration"] {
  const n = norm(val);
  if (n === "5s") return "5s";
  if (n === "15s") return "15s";
  if (n === "30s") return "30s";
  if (n === "60s" || n === "1min") return "60s";
  if (n === "45s" || n === "90s" || n === "2min" || n === "3min" || n === "5min" || n === "10min" || n === "15min" || n === "30min") return "custom";
  return "custom";
}

/** Map country like "Bangladesh" → "bangladesh" */
function mapCountry(val: string): BlueprintParams["country"] {
  const n = norm(val);
  const map: Record<string, BlueprintParams["country"]> = {
    "usa": "usa", "uk": "uk", "japan": "japan", "south korea": "korea",
    "india": "india", "bangladesh": "bangladesh", "france": "france",
    "germany": "germany", "italy": "italy", "spain": "spain",
    "china": "china", "brazil": "brazil", "australia": "australia",
    "canada": "canada", "egypt": "egypt", "turkey": "turkey",
    "indonesia": "indonesia", "saudi arabia": "saudi", "uae": "uae",
    "russia": "russia", "korea": "korea",
    // Extended countries
    "thailand": "usa", "mexico": "usa", "argentina": "usa",
    "nigeria": "usa", "south africa": "usa",
  };
  // Direct match
  if (map[n]) return map[n];
  // Partial match
  for (const [key, value] of Object.entries(map)) {
    if (n.includes(key) || key.includes(n)) return value;
  }
  return "";
}

/** Map location type like "🏙️ শহর (City)" → "city" */
function mapLocationType(val: string): BlueprintParams["locationType"] {
  const n = norm(val);
  if (n.includes("city") || n.includes("শহর") || n.includes("নগর") || n.includes("metropolitan")) return "city";
  if (n.includes("village") || n.includes("গ্রাম")) return "village";
  if (n.includes("forest") || n.includes("বন") || n.includes("জঙ্গল")) return "forest";
  if (n.includes("beach") || n.includes("সৈকত") || n.includes("সমুদ্র")) return "beach";
  if (n.includes("mountain") || n.includes("পাহাড়") || n.includes("পর্বত") || n.includes("হিমবাহ") || n.includes("glacier")) return "mountain";
  if (n.includes("desert") || n.includes("মরুভূমি")) return "desert";
  if (n.includes("river") || n.includes("নদী") || n.includes("হ্রদ") || n.includes("lake")) return "river";
  if (n.includes("urban") || n.includes("শিল্প") || n.includes("industrial")) return "urban";
  if (n.includes("rural") || n.includes("মাঠ") || n.includes("প্রান্তর") || n.includes("field")) return "rural";
  if (n.includes("space") || n.includes("মহাকাশ")) return "urban";
  if (n.includes("volcano") || n.includes("আগ্নেয়গিরি")) return "mountain";
  if (n.includes("historical") || n.includes("ঐতিহাসিক")) return "city";
  if (n.includes("religious") || n.includes("ধর্মীয়")) return "city";
  return "";
}

/** Map weather like "☀️ রৌদ্র (Sunny)" → "sunny" */
function mapWeather(val: string): BlueprintParams["weather"] {
  const n = norm(val);
  if (n.includes("sunny") || n.includes("রৌদ্র")) return "sunny";
  if (n.includes("cloudy") || n.includes("মেঘলা")) return "cloudy";
  if (n.includes("rain") || n.includes("বৃষ্টি")) return "rainy";
  if (n.includes("storm") || n.includes("ঝড়") || n.includes("tornado") || n.includes("টর্নেডো")) return "stormy";
  if (n.includes("snow") || n.includes("তুষার")) return "snowy";
  if (n.includes("fog") || n.includes("mist") || n.includes("কুয়াশা")) return "foggy";
  if (n.includes("wind") || n.includes("বাতাস") || n.includes("ঝোড়ো")) return "windy";
  if (n.includes("rainbow") || n.includes("রংধনু")) return "clear";
  if (n.includes("moonlit") || n.includes("জ্যোৎস্না")) return "clear";
  return "";
}

/** Map season */
function mapSeason(val: string): BlueprintParams["season"] {
  const n = norm(val);
  if (n.includes("spring") || n.includes("বসন্ত")) return "spring";
  if (n.includes("summer") || n.includes("গ্রীষ্ম")) return "summer";
  if (n.includes("autumn") || n.includes("শরৎ")) return "autumn";
  if (n.includes("winter") || n.includes("শীত")) return "winter";
  if (n.includes("monsoon") || n.includes("বর্ষা")) return "monsoon";
  return "";
}

/** Map time of day */
function mapTimeOfDay(val: string): BlueprintParams["timeOfDay"] {
  const n = norm(val);
  if (n.includes("dawn") || n.includes("ভোর")) return "dawn";
  if (n.includes("morning") || n.includes("সকাল")) return "day";
  if (n.includes("noon") || n.includes("দুপুর")) return "day";
  if (n.includes("afternoon") || n.includes("বিকেল")) return "day";
  if (n.includes("golden") || n.includes("গোধূলি")) return "golden-hour";
  if (n.includes("blue hour")) return "blue-hour";
  if (n.includes("evening") || n.includes("সন্ধ্যা")) return "golden-hour";
  if (n.includes("twilight")) return "golden-hour";
  if (n.includes("night") || n.includes("রাত")) return "night";
  if (n.includes("midnight") || n.includes("মধ্যরাত")) return "night";
  return "";
}

/** Map mood */
function mapMood(val: string): BlueprintParams["mood"] {
  const n = norm(val);
  if (n.includes("peaceful") || n.includes("calm") || n.includes("শান্ত")) return "peaceful";
  if (n.includes("happy") || n.includes("joyful") || n.includes("আনন্দ")) return "happy";
  if (n.includes("tense") || n.includes("suspense") || n.includes("উত্তেজ")) return "tense";
  if (n.includes("dramatic") || n.includes("intense") || n.includes("angry")) return "dramatic";
  if (n.includes("mysterious") || n.includes("eerie") || n.includes("horror") || n.includes("রহস্য")) return "mysterious";
  if (n.includes("melanchol") || n.includes("sad") || n.includes("বিষাদ") || n.includes("দুঃখ")) return "dramatic";
  if (n.includes("energetic") || n.includes("exciting") || n.includes("উদ্যমী")) return "happy";
  if (n.includes("romantic") || n.includes("রোমান্টিক")) return "peaceful";
  if (n.includes("inspirational") || n.includes("অনুপ্রেরণা")) return "happy";
  return "";
}

/** Map camera distance like "Medium Shot (MS)" → "standard-35mm" */
function mapFraming(val: string): BlueprintParams["lensAperture"] {
  const n = norm(val);
  if (n.includes("extreme close") || n.includes("ecu") || n.includes("macro")) return "macro-100mm";
  if (n.includes("close-up") || n.includes("close up") || n.includes("cu") || n.includes("mcu")) return "portrait-85mm";
  if (n.includes("medium") || n.includes("ms") || n.includes("mls")) return "standard-35mm";
  if (n.includes("full") || n.includes("fs") || n.includes("long") || n.includes("wide") || n.includes("els") || n.includes("bird") || n.includes("worm")) return "ultra-wide-16mm";
  if (n.includes("over-the-shoulder") || n.includes("ots")) return "standard-35mm";
  if (n.includes("dutch") || n.includes("pov")) return "standard-35mm";
  return "";
}

/** Map lighting style */
function mapLighting(val: string): BlueprintParams["lightSourceDirection"] {
  const n = norm(val);
  if (n.includes("natural") || n.includes("প্রাকৃতিক")) return "soft-ambient";
  if (n.includes("studio") || n.includes("স্টুডিও") || n.includes("high key")) return "high-contrast-rim";
  if (n.includes("cinematic") || n.includes("সিনেমা") || n.includes("dramatic")) return "dramatic-backlit";
  if (n.includes("neon") || n.includes("rgb") || n.includes("party")) return "dramatic-backlit";
  if (n.includes("golden") || n.includes("সোনালি") || n.includes("golden hour")) return "moody-side-light";
  if (n.includes("silhouette") || n.includes("low key") || n.includes("moonlight") || n.includes("candle") || n.includes("backlit")) return "dramatic-backlit";
  return "";
}

/** Map color grading */
function mapColorGrade(val: string): BlueprintParams["colorGrade"] {
  const n = norm(val);
  if (n.includes("warm") || n.includes("উষ্ণ")) return "warm";
  if (n.includes("cool") || n.includes("শীতল")) return "cool";
  if (n.includes("cinematic") || n.includes("সিনেমা")) return "cinematic";
  if (n.includes("vintage") || n.includes("retro") || n.includes("film grain") || n.includes("sepia")) return "vintage";
  if (n.includes("natural") || n.includes("neutral")) return "neutral";
  if (n.includes("desaturated") || n.includes("black") || n.includes("white") || n.includes("moody") || n.includes("dark")) return "cinematic";
  if (n.includes("pastel") || n.includes("teal") || n.includes("high contrast")) return "cinematic";
  return "";
}

/** Map camera movement */
function mapCameraMovement(val: string): BlueprintParams["cameraEyeMovement"] {
  const n = norm(val);
  if (n.includes("static") || n.includes("tripod") || n.includes("স্থির")) return "static-witness";
  if (n.includes("handheld") || n.includes("হ্যান্ড")) return "handheld-tremor";
  if (n.includes("dolly") || n.includes("ডলি") || n.includes("crane") || n.includes("jib")) return "mechanical-slide";
  if (n.includes("drone") || n.includes("aerial") || n.includes("ড্রোন")) return "predator-chase";
  if (n.includes("tracking") || n.includes("steadicam") || n.includes("gimbal")) return "slow-breathing";
  if (n.includes("orbit") || n.includes("360")) return "slow-breathing";
  if (n.includes("pan") || n.includes("tilt")) return "slow-breathing";
  if (n.includes("zoom")) return "mechanical-slide";
  return "";
}

/** Map transition style */
function mapTransitionStyle(val: string): BlueprintParams["transitionStyle"] {
  const n = norm(val);
  if (n.includes("hard cut") || n.includes("cut")) return "cut";
  if (n.includes("fade") || n.includes("dip to black") || n.includes("dip to white")) return "fade";
  if (n.includes("dissolve") || n.includes("cross") || n.includes("morph") || n.includes("seamless")) return "seamless";
  if (n.includes("wipe") || n.includes("whip") || n.includes("zoom") || n.includes("glitch")) return "creative";
  return "";
}

/**
 * Given current SceneParams, return a partial BlueprintParams object
 * with all mappable values filled in.
 */
export function mapSceneParamsToBlueprintParams(
  scene: SceneParams
): Partial<BlueprintParams> {
  const result: Partial<BlueprintParams> = {};

  // Voice & Narration sync
  result.voicePresence = scene.humanVoice ? "yes" : "no";
  
  // Narration control → Blueprint sync
  if (scene.narration === false) {
    result.narratorStyle = "";
    result.audioImmersionMode = "isolated-asmr";
  } else if (scene.narration === true) {
    result.audioImmersionMode = "";
  }

  // Location
  const country = mapCountry(scene.country);
  if (country) result.country = country;
  const locType = mapLocationType(scene.locationType);
  if (locType) result.locationType = locType;
  const weather = mapWeather(scene.weather);
  if (weather) result.weather = weather;
  const season = mapSeason(scene.season);
  if (season) result.season = season;

  // Output
  const ratio = mapAspectRatio(scene.ratio);
  if (ratio) result.aspectRatio = ratio;
  const dur = mapDuration(scene.duration);
  if (dur) result.duration = dur;
  const res = mapResolution(scene.resolution);
  if (res) result.resolution = res;
  const fps = mapFrameRate(scene.frameRate);
  if (fps) result.frameRate = fps;

  // Camera & Visual
  const framing = mapFraming(scene.cameraDistance);
  if (framing) result.lensAperture = framing;
  const lighting = mapLighting(scene.lightingStyle);
  if (lighting) result.lightSourceDirection = lighting;
  const colorGrade = mapColorGrade(scene.colorGrading);
  if (colorGrade) result.colorGrade = colorGrade;
  const camMove = mapCameraMovement(scene.cameraMovement);
  if (camMove) result.cameraEyeMovement = camMove;

  // Environment & Mood
  const timeOfDay = mapTimeOfDay(scene.timeOfDay);
  if (timeOfDay) result.timeOfDay = timeOfDay;
  const mood = mapMood(scene.mood);
  if (mood) result.mood = mood;
  
  // Transition
  const transition = mapTransitionStyle(scene.transitionStyle);
  if (transition) result.transitionStyle = transition;

  return result;
}
