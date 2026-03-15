import { useState, useCallback, useMemo } from "react";
import { SlidersHorizontal, ChevronDown, ChevronRight, X, Check, Plus, RotateCcw, Save, FolderOpen, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

// ─── Preset Storage ───

interface ScenePreset {
  id: string;
  name: string;
  params: SceneParams;
  savedAt: number;
}

const PRESET_STORAGE_KEY = "scene-param-presets";
const DISABLED_SECTIONS_KEY = "scene-param-disabled-sections";

function loadDisabledSections(): Set<string> {
  try {
    const raw = localStorage.getItem(DISABLED_SECTIONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveDisabledSections(sections: Set<string>) {
  localStorage.setItem(DISABLED_SECTIONS_KEY, JSON.stringify([...sections]));
}

function loadPresets(): ScenePreset[] {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePresets(presets: ScenePreset[]) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

// ─── Parameter Data ───

const COUNTRIES = [
  "USA", "UK", "Japan", "South Korea", "India", "Bangladesh", "France", "Germany",
  "Italy", "Spain", "China", "Brazil", "Australia", "Canada", "Mexico", "Russia",
  "Egypt", "Turkey", "Thailand", "Indonesia", "Saudi Arabia", "UAE", "Nigeria",
  "South Africa", "Argentina", "Norway", "Sweden", "Iceland", "New Zealand",
  "Portugal", "Netherlands", "Belgium", "Switzerland", "Austria", "Denmark",
  "Finland", "Ireland", "Poland", "Czech Republic", "Hungary", "Romania",
  "Greece", "Croatia", "Serbia", "Bulgaria", "Slovakia", "Slovenia",
  "Lithuania", "Latvia", "Estonia", "Luxembourg", "Malta", "Cyprus",
  "Montenegro", "North Macedonia", "Albania", "Bosnia & Herzegovina",
  "Moldova", "Ukraine", "Belarus", "Georgia", "Armenia", "Azerbaijan",
  "Liechtenstein", "Monaco", "Andorra", "San Marino",
];

const COUNTRY_CITIES: Record<string, string[]> = {
  "USA": ["New York", "Los Angeles", "Chicago", "Miami", "San Francisco", "Las Vegas", "Seattle", "Houston", "Dallas", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Austin", "Denver", "Boston", "Nashville", "Portland", "Atlanta", "Detroit", "Minneapolis", "Orlando", "Tampa", "Charlotte", "Salt Lake City", "Memphis", "New Orleans", "Washington D.C.", "Baltimore", "Milwaukee", "Kansas City", "Cleveland", "Pittsburgh", "Cincinnati", "Indianapolis", "Columbus", "Sacramento", "St. Louis", "Honolulu", "Anchorage"],
  "UK": ["London", "Manchester", "Edinburgh", "Liverpool", "Bristol", "Oxford", "Cambridge"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Hiroshima", "Yokohama", "Sapporo", "Nagoya"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Jeju"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Jaipur", "Hyderabad"],
  "Bangladesh": ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Cox's Bazar", "Rangpur"],
  "France": ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  "Italy": ["Rome", "Milan", "Florence", "Venice", "Naples"],
  "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary"],
  "Egypt": ["Cairo", "Alexandria", "Luxor", "Aswan"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Antalya"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
  "Spain": ["Madrid", "Barcelona", "Seville", "Valencia", "Bilbao", "Granada", "Málaga"],
  "Portugal": ["Lisbon", "Porto", "Faro", "Coimbra", "Braga", "Funchal"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen"],
  "Belgium": ["Brussels", "Antwerp", "Ghent", "Bruges", "Liège"],
  "Switzerland": ["Zurich", "Geneva", "Bern", "Basel", "Lausanne", "Lucerne", "Interlaken"],
  "Austria": ["Vienna", "Salzburg", "Innsbruck", "Graz", "Linz"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense", "Aalborg"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala"],
  "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø"],
  "Finland": ["Helsinki", "Tampere", "Turku", "Oulu", "Rovaniemi"],
  "Iceland": ["Reykjavik", "Akureyri", "Vik", "Húsavík"],
  "Ireland": ["Dublin", "Cork", "Galway", "Limerick", "Killarney"],
  "Poland": ["Warsaw", "Kraków", "Gdańsk", "Wrocław", "Poznań", "Łódź"],
  "Czech Republic": ["Prague", "Brno", "Ostrava", "Plzeň", "Český Krumlov"],
  "Hungary": ["Budapest", "Debrecen", "Szeged", "Pécs", "Eger"],
  "Romania": ["Bucharest", "Cluj-Napoca", "Brașov", "Timișoara", "Sibiu"],
  "Greece": ["Athens", "Thessaloniki", "Santorini", "Mykonos", "Crete", "Rhodes", "Corfu"],
  "Croatia": ["Zagreb", "Dubrovnik", "Split", "Pula", "Zadar"],
  "Serbia": ["Belgrade", "Novi Sad", "Niš"],
  "Bulgaria": ["Sofia", "Plovdiv", "Varna", "Burgas"],
  "Slovakia": ["Bratislava", "Košice", "Banská Bystrica"],
  "Slovenia": ["Ljubljana", "Maribor", "Bled", "Piran"],
  "Lithuania": ["Vilnius", "Kaunas", "Klaipėda"],
  "Latvia": ["Riga", "Jūrmala", "Liepāja"],
  "Estonia": ["Tallinn", "Tartu", "Pärnu"],
  "Luxembourg": ["Luxembourg City", "Echternach", "Vianden"],
  "Malta": ["Valletta", "Mdina", "Sliema", "Gozo"],
  "Cyprus": ["Nicosia", "Limassol", "Paphos", "Larnaca"],
  "Montenegro": ["Podgorica", "Kotor", "Budva", "Herceg Novi"],
  "Albania": ["Tirana", "Durrës", "Vlorë", "Berat", "Gjirokastër"],
  "Ukraine": ["Kyiv", "Lviv", "Odessa", "Kharkiv", "Dnipro"],
  "Georgia": ["Tbilisi", "Batumi", "Kutaisi", "Mestia"],
  "Russia": ["Moscow", "Saint Petersburg", "Kazan", "Sochi", "Novosibirsk"],
  "Mexico": ["Mexico City", "Cancún", "Guadalajara", "Monterrey", "Oaxaca"],
  "Argentina": ["Buenos Aires", "Mendoza", "Córdoba", "Bariloche"],
  "Indonesia": ["Jakarta", "Bali", "Yogyakarta", "Bandung", "Surabaya"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah"],
  "Nigeria": ["Lagos", "Abuja", "Kano", "Port Harcourt"],
  "South Africa": ["Cape Town", "Johannesburg", "Durban", "Pretoria"],
  "New Zealand": ["Auckland", "Wellington", "Queenstown", "Christchurch"],
  "Monaco": ["Monte Carlo"],
  "Andorra": ["Andorra la Vella"],
  "San Marino": ["San Marino City"],
};

const RATIOS = ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9", "2.35:1", "2:1"];
const DURATIONS = ["15s", "30s", "45s", "60s", "90s", "2min", "3min", "5min", "10min", "15min", "30min", "Custom"];
const RESOLUTIONS = ["720p (HD)", "1080p (Full HD)", "1440p (2K)", "2160p (4K)", "4320p (8K)"];
const SCENES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "15", "20", "Custom"];
const CAMERA_DISTANCES = [
  "Extreme Close-Up (ECU)", "Close-Up (CU)", "Medium Close-Up (MCU)",
  "Medium Shot (MS)", "Medium Long Shot (MLS)", "Full Shot (FS)",
  "Long Shot (LS)", "Extreme Long Shot (ELS)", "Over-the-Shoulder (OTS)",
  "Bird's Eye View", "Worm's Eye View", "Dutch Angle", "POV Shot",
];
const TIME_OF_DAY = [
  "ভোর (Dawn)", "সকাল (Morning)", "দুপুর (Noon)", "বিকেল (Afternoon)",
  "সন্ধ্যা (Evening)", "গোধূলি (Twilight)", "রাত (Night)", "মধ্যরাত (Midnight)",
  "Golden Hour", "Blue Hour",
];
const WEATHER = [
  "☀️ রৌদ্র (Sunny)", "☁️ মেঘলা (Cloudy)", "🌧️ বৃষ্টি (Rain)", "⛈️ ঝড় (Storm)",
  "❄️ তুষারপাত (Snow)", "🌫️ কুয়াশা (Fog/Mist)", "🌪️ টর্নেডো (Tornado)",
  "🌈 রংধনু (Rainbow)", "💨 ঝোড়ো বাতাস (Windy)", "🌙 জ্যোৎস্না (Moonlit)",
];
const LOCATION_TYPES = [
  "🏘️ গ্রাম (Village)", "🏙️ শহর (City)", "🏛️ নগর (Metropolitan)",
  "🌳 বন/জঙ্গল (Forest)", "🏖️ সমুদ্র সৈকত (Beach)", "⛰️ পাহাড়/পর্বত (Mountain)",
  "🏜️ মরুভূমি (Desert)", "🌊 নদী/হ্রদ (River/Lake)", "🏔️ হিমবাহ (Glacier)",
  "🌾 মাঠ/প্রান্তর (Field)", "🏗️ শিল্প এলাকা (Industrial)", "🏰 ঐতিহাসিক স্থান (Historical)",
  "🚀 মহাকাশ (Space)", "🌋 আগ্নেয়গিরি (Volcano)", "🕌 ধর্মীয় স্থান (Religious)",
];
const AI_MODELS = [
  "Runway Gen-4", "Kling 2.0", "Kling 1.6", "Sora", "Pika 2.0",
  "Hailuo MiniMax", "Luma Dream Machine", "Stable Video Diffusion",
  "Vidu", "Wan 2.1", "HunyuanVideo", "CogVideoX",
];
const ANIMALS = [
  "🐅 বাঘ (Tiger)", "🦁 সিংহ (Lion)", "🐘 হাতি (Elephant)",
  "🐻 ভালুক (Bear)", "🦊 শিয়াল (Fox)", "🐺 নেকড়ে (Wolf)",
  "🦅 ঈগল (Eagle)", "🐍 সাপ (Snake)", "🦈 হাঙ্গর (Shark)",
  "🐬 ডলফিন (Dolphin)", "🐎 ঘোড়া (Horse)", "🐄 গরু (Cow)",
  "🐕 কুকুর (Dog)", "🐈 বিড়াল (Cat)", "🐦 পাখি (Bird)",
  "🦋 প্রজাপতি (Butterfly)", "🐊 কুমির (Crocodile)", "🦌 হরিণ (Deer)",
  "Custom",
];
const CAMERA_BRANDS = [
  "Sony (A7S III / FX6)", "RED (Komodo / V-Raptor)", "ARRI (Alexa Mini)",
  "Blackmagic (URSA Mini Pro)", "Canon (EOS R5 C)", "Nikon (Z9)",
  "Panasonic (GH6 / S1H)", "Fujifilm (X-H2S)", "DJI (Inspire 3)",
  "GoPro (Hero 12)", "iPhone 15 Pro Max", "Drone Shot", "Custom",
];

const AGE_RANGES = ["শিশু (0-12)", "কিশোর (13-17)", "তরুণ (18-25)", "প্রাপ্তবয়স্ক (26-40)", "মধ্যবয়সী (41-60)", "বৃদ্ধ (60+)"];

const LIGHTING_STYLES = [
  "🌤️ Natural", "💡 Studio", "🎬 Cinematic", "💜 Neon", "🌅 Golden Hour",
  "🌑 Silhouette", "🔦 Backlit", "🕯️ Candlelight", "🌙 Moonlight",
  "💥 High Key", "🖤 Low Key", "🌈 RGB/Party", "Custom",
];
const COLOR_GRADINGS = [
  "🔥 Warm", "❄️ Cool", "📷 Vintage/Retro", "🖤 Desaturated", "⚡ High Contrast",
  "🌧️ Moody/Dark", "🎞️ Film Grain", "🌸 Pastel", "🌊 Teal & Orange",
  "⬛ Black & White", "🟡 Sepia", "Custom",
];
const VIDEO_STYLES = [
  "🎬 Cinematic", "📹 Documentary", "📱 Vlog", "🎨 Animation/2D", "🖥️ 3D Animation",
  "🐌 Slow Motion", "⏩ Timelapse", "🔄 Hyperlapse", "🎭 Music Video",
  "📰 News Style", "🎮 Gaming", "Custom",
];
const LENS_TYPES = [
  "📐 Wide Angle (14-24mm)", "🔭 Telephoto (70-200mm)", "🔬 Macro",
  "🐟 Fish-eye", "↗️ Tilt-shift", "🎞️ Anamorphic",
  "📷 Standard (35-50mm)", "🌀 Vintage/Helios", "Custom",
];
const FRAME_RATES = ["24fps (Cinematic)", "25fps (PAL)", "30fps (Standard)", "48fps (HFR)", "60fps (Smooth)", "120fps (Slow-Mo)", "240fps (Ultra Slow-Mo)"];
const CAMERA_MOVEMENTS = [
  "🔒 Static/Tripod", "↔️ Pan (Left-Right)", "↕️ Tilt (Up-Down)",
  "🚂 Dolly (In-Out)", "🏗️ Crane/Jib", "🖐️ Handheld",
  "🚁 Drone/Aerial", "🎯 Steadicam/Gimbal", "🔄 Orbit/360°",
  "🏃 Tracking Shot", "📐 Zoom In/Out", "Custom",
];
const BGM_GENRES = [
  "🎹 Ambient", "🎬 Cinematic/Orchestral", "🎵 Lo-fi/Chill",
  "⚡ Electronic/EDM", "🎻 Classical", "🎸 Acoustic/Folk",
  "🥁 Hip-Hop/Trap", "🎷 Jazz", "🎼 Dramatic/Epic",
  "🌿 Nature Sounds", "🔇 No BGM", "Custom",
];
const SFX_STYLES = [
  "🎙️ Realistic/Natural", "💥 Exaggerated/Dramatic", "🤫 Minimal/Subtle",
  "🫧 ASMR", "👣 Foley (Footsteps etc.)", "🔊 Cinematic Boom",
  "🌊 Environmental/Ambient", "🔇 No SFX", "Custom",
];
const SEASONS = [
  "🌸 বসন্ত (Spring)", "☀️ গ্রীষ্ম (Summer)", "🍂 শরৎ (Autumn)",
  "❄️ শীত (Winter)", "🌧️ বর্ষা (Monsoon)",
];
const MOODS = [
  "🔮 Mysterious", "💕 Romantic", "😰 Tense/Suspenseful", "🕊️ Peaceful/Calm",
  "⚡ Energetic/Exciting", "😢 Melancholic/Sad", "😂 Funny/Comedic",
  "👻 Eerie/Horror", "🌄 Inspirational", "😤 Angry/Intense",
  "🎉 Joyful/Celebratory", "🧐 Thoughtful/Philosophical", "Custom",
];
const TARGET_PLATFORMS = [
  "▶️ YouTube (Long-form)", "📱 YouTube Shorts", "🎵 TikTok",
  "📸 Instagram Reels", "📘 Facebook", "🐦 Twitter/X",
  "💼 LinkedIn", "📺 TV/Broadcast", "🎬 Film/Theater", "Custom",
];
const VARIATION_CATEGORIES = [
  { id: "character", icon: "🧑", label: "Character / চরিত্র", desc: "চরিত্রের বৈশিষ্ট্য, পোশাক, বয়স পরিবর্তন" },
  { id: "setting", icon: "🏞️", label: "Setting / পরিবেশ", desc: "লোকেশন, দেশ, শহর পরিবর্তন" },
  { id: "time-weather", icon: "🌦️", label: "Time & Weather", desc: "সময়, আবহাওয়া, ঋতু পরিবর্তন" },
  { id: "camera", icon: "📷", label: "Camera / Angle", desc: "ক্যামেরা মুভমেন্ট, এঙ্গেল, ডিস্ট্যান্স" },
  { id: "mood", icon: "🎭", label: "Mood / টোন", desc: "আবেগ, পরিবেশের ভাব পরিবর্তন" },
  { id: "color", icon: "🎨", label: "Color / Grading", desc: "রঙ, গ্রেডিং, ভিজ্যুয়াল টোন" },
  { id: "lighting", icon: "💡", label: "Lighting", desc: "আলো, ছায়া, আলোর দিক" },
  { id: "music", icon: "🎵", label: "Music / Sound", desc: "BGM, SFX, ভয়েস পরিবর্তন" },
  { id: "story", icon: "📖", label: "Story / Plot", desc: "গল্পের মোড়, ঘটনাক্রম পরিবর্তন" },
  { id: "style", icon: "🎞️", label: "Visual Style", desc: "ভিডিও স্টাইল, ট্রানজিশন পরিবর্তন" },
];

// ─── Sub-parameters for each variation category ───
interface VariationSubType {
  id: string;
  icon: string;
  label: string;
  children?: { id: string; label: string }[];
}

const VARIATION_SUB_PARAMS: Record<string, VariationSubType[]> = {
  character: [
    { id: "human", icon: "🧑", label: "মানুষ (Human)", children: [
      { id: "man", label: "👨 পুরুষ (Man)" }, { id: "woman", label: "👩 নারী (Woman)" },
      { id: "child", label: "👦 শিশু (Child)" }, { id: "elderly", label: "👴 বৃদ্ধ (Elderly)" },
      { id: "couple", label: "💑 দম্পতি (Couple)" }, { id: "group", label: "👥 গ্রুপ (Group)" },
      { id: "warrior", label: "⚔️ যোদ্ধা (Warrior)" }, { id: "dancer", label: "💃 নৃত্যশিল্পী (Dancer)" },
    ]},
    { id: "animal", icon: "🐾", label: "পশু (Animal)", children: [
      { id: "tiger", label: "🐅 বাঘ (Tiger)" }, { id: "lion", label: "🦁 সিংহ (Lion)" },
      { id: "elephant", label: "🐘 হাতি (Elephant)" }, { id: "horse", label: "🐎 ঘোড়া (Horse)" },
      { id: "dog", label: "🐕 কুকুর (Dog)" }, { id: "cat", label: "🐈 বিড়াল (Cat)" },
      { id: "wolf", label: "🐺 নেকড়ে (Wolf)" }, { id: "fox", label: "🦊 শিয়াল (Fox)" },
      { id: "bear", label: "🐻 ভালুক (Bear)" }, { id: "deer", label: "🦌 হরিণ (Deer)" },
      { id: "monkey", label: "🐒 বানর (Monkey)" }, { id: "rabbit", label: "🐇 খরগোশ (Rabbit)" },
      { id: "cow", label: "🐄 গরু (Cow)" }, { id: "goat", label: "🐐 ছাগল (Goat)" },
      { id: "snake", label: "🐍 সাপ (Snake)" }, { id: "crocodile", label: "🐊 কুমির (Crocodile)" },
    ]},
    { id: "bird", icon: "🐦", label: "পাখি (Bird)", children: [
      { id: "eagle", label: "🦅 ঈগল (Eagle)" }, { id: "parrot", label: "🦜 টিয়া (Parrot)" },
      { id: "owl", label: "🦉 পেঁচা (Owl)" }, { id: "crow", label: "🐦‍⬛ কাক (Crow)" },
      { id: "peacock", label: "🦚 ময়ূর (Peacock)" }, { id: "dove", label: "🕊️ ঘুঘু (Dove)" },
      { id: "sparrow", label: "🐤 চড়ুই (Sparrow)" }, { id: "flamingo", label: "🦩 ফ্লেমিংগো (Flamingo)" },
      { id: "hawk", label: "🦅 বাজপাখি (Hawk)" }, { id: "kingfisher", label: "🐦 মাছরাঙা (Kingfisher)" },
    ]},
    { id: "fish", icon: "🐟", label: "মাছ (Fish)", children: [
      { id: "shark", label: "🦈 হাঙ্গর (Shark)" }, { id: "dolphin", label: "🐬 ডলফিন (Dolphin)" },
      { id: "whale", label: "🐋 তিমি (Whale)" }, { id: "goldfish", label: "🐠 গোল্ডফিশ (Goldfish)" },
      { id: "clownfish", label: "🐟 ক্লাউনফিশ (Clownfish)" }, { id: "jellyfish", label: "🪼 জেলিফিশ (Jellyfish)" },
      { id: "octopus", label: "🐙 অক্টোপাস (Octopus)" }, { id: "turtle", label: "🐢 কচ্ছপ (Turtle)" },
    ]},
    { id: "insect", icon: "🦋", label: "পোকামাকড় (Insect)", children: [
      { id: "butterfly", label: "🦋 প্রজাপতি (Butterfly)" }, { id: "bee", label: "🐝 মৌমাছি (Bee)" },
      { id: "ant", label: "🐜 পিঁপড়া (Ant)" }, { id: "dragonfly", label: "🪰 ফড়িং (Dragonfly)" },
      { id: "ladybug", label: "🐞 লেডিবাগ (Ladybug)" }, { id: "firefly", label: "✨ জোনাকি (Firefly)" },
    ]},
    { id: "mythical", icon: "🐉", label: "কাল্পনিক (Mythical)", children: [
      { id: "dragon", label: "🐉 ড্রাগন (Dragon)" }, { id: "phoenix", label: "🔥 ফিনিক্স (Phoenix)" },
      { id: "unicorn", label: "🦄 ইউনিকর্ন (Unicorn)" }, { id: "mermaid", label: "🧜 মৎস্যকন্যা (Mermaid)" },
      { id: "fairy", label: "🧚 পরী (Fairy)" }, { id: "ghost", label: "👻 ভূত (Ghost)" },
    ]},
  ],
  setting: [
    { id: "indoor", icon: "🏠", label: "ইনডোর (Indoor)", children: [
      { id: "home", label: "🏠 ঘর (Home)" }, { id: "office", label: "🏢 অফিস (Office)" },
      { id: "restaurant", label: "🍽️ রেস্তোরাঁ (Restaurant)" }, { id: "museum", label: "🏛️ মিউজিয়াম (Museum)" },
      { id: "temple", label: "🕌 মন্দির/মসজিদ (Temple)" }, { id: "studio", label: "🎬 স্টুডিও (Studio)" },
    ]},
    { id: "outdoor", icon: "🌳", label: "আউটডোর (Outdoor)", children: [
      { id: "forest", label: "🌲 বন (Forest)" }, { id: "mountain", label: "⛰️ পাহাড় (Mountain)" },
      { id: "beach", label: "🏖️ সমুদ্র সৈকত (Beach)" }, { id: "desert", label: "🏜️ মরুভূমি (Desert)" },
      { id: "river", label: "🌊 নদী (River)" }, { id: "field", label: "🌾 মাঠ (Field)" },
    ]},
    { id: "urban", icon: "🏙️", label: "শহুরে (Urban)", children: [
      { id: "street", label: "🛣️ রাস্তা (Street)" }, { id: "rooftop", label: "🏗️ ছাদ (Rooftop)" },
      { id: "market", label: "🏪 বাজার (Market)" }, { id: "bridge", label: "🌉 ব্রিজ (Bridge)" },
    ]},
  ],
  "time-weather": [
    { id: "time-vary", icon: "🕐", label: "সময় পরিবর্তন", children: [
      { id: "dawn-to-dusk", label: "🌅 ভোর থেকে সন্ধ্যা" }, { id: "day-night", label: "☀️🌙 দিন-রাত" },
      { id: "golden-hour", label: "🌇 গোল্ডেন আওয়ার" },
    ]},
    { id: "weather-vary", icon: "🌦️", label: "আবহাওয়া পরিবর্তন", children: [
      { id: "sunny-rainy", label: "☀️🌧️ রোদ-বৃষ্টি" }, { id: "storm", label: "⛈️ ঝড়" },
      { id: "snow", label: "❄️ তুষারপাত" }, { id: "fog", label: "🌫️ কুয়াশা" },
    ]},
  ],
  camera: [
    { id: "angle-vary", icon: "📐", label: "এঙ্গেল পরিবর্তন", children: [
      { id: "close-wide", label: "ক্লোজ → ওয়াইড" }, { id: "high-low", label: "হাই → লো এঙ্গেল" },
      { id: "orbit", label: "🔄 অরবিট শট" }, { id: "pov", label: "👁️ POV শট" },
    ]},
    { id: "movement-vary", icon: "🏃", label: "মুভমেন্ট পরিবর্তন", children: [
      { id: "static-dynamic", label: "স্ট্যাটিক → ডায়নামিক" }, { id: "tracking", label: "ট্র্যাকিং" },
      { id: "drone", label: "🚁 ড্রোন শট" },
    ]},
  ],
  mood: [
    { id: "emotional", icon: "💕", label: "আবেগ পরিবর্তন", children: [
      { id: "happy-sad", label: "😊😢 সুখ-দুঃখ" }, { id: "calm-tense", label: "🕊️😰 শান্ত-উত্তেজনা" },
      { id: "romantic", label: "💕 রোমান্টিক" }, { id: "horror", label: "👻 ভয়ংকর" },
      { id: "epic", label: "⚡ এপিক" }, { id: "nostalgic", label: "🌅 নস্টালজিক" },
    ]},
  ],
  color: [
    { id: "tone-vary", icon: "🎨", label: "টোন পরিবর্তন", children: [
      { id: "warm-cool", label: "🔥❄️ ওয়ার্ম-কুল" }, { id: "vibrant-muted", label: "🌈 ভাইব্র্যান্ট-মিউটেড" },
      { id: "monochrome", label: "⬛ মনোক্রোম" }, { id: "neon", label: "💜 নিয়ন" },
    ]},
  ],
  lighting: [
    { id: "light-vary", icon: "💡", label: "আলো পরিবর্তন", children: [
      { id: "natural-studio", label: "🌤️💡 ন্যাচারাল-স্টুডিও" }, { id: "backlit", label: "🔦 ব্যাকলিট" },
      { id: "silhouette", label: "🌑 সিলুয়েট" }, { id: "neon-lights", label: "💜 নিয়ন লাইট" },
    ]},
  ],
  music: [
    { id: "bgm-vary", icon: "🎵", label: "BGM পরিবর্তন", children: [
      { id: "cinematic", label: "🎬 সিনেম্যাটিক" }, { id: "lofi", label: "🎵 Lo-fi" },
      { id: "electronic", label: "⚡ ইলেকট্রনিক" }, { id: "acoustic", label: "🎸 অ্যাকুস্টিক" },
      { id: "no-music", label: "🔇 শুধু SFX" },
    ]},
  ],
  story: [
    { id: "plot-vary", icon: "📖", label: "প্লট পরিবর্তন", children: [
      { id: "twist", label: "🔄 টুইস্ট" }, { id: "flashback", label: "⏪ ফ্ল্যাশব্যাক" },
      { id: "parallel", label: "🔀 প্যারালেল ন্যারেটিভ" }, { id: "climax", label: "📈 ক্লাইম্যাক্স ভ্যারি" },
    ]},
  ],
  style: [
    { id: "style-vary", icon: "🎞️", label: "স্টাইল পরিবর্তন", children: [
      { id: "cinematic-vlog", label: "🎬📱 সিনেম্যাটিক-ভ্লগ" }, { id: "animation", label: "🎨 অ্যানিমেশন" },
      { id: "slowmo", label: "🐌 স্লো মোশন" }, { id: "timelapse", label: "⏩ টাইমল্যাপস" },
    ]},
  ],
};

const TRANSITION_STYLES = [
  "✂️ Hard Cut", "🌫️ Fade In/Out", "💫 Dissolve/Cross-fade",
  "🔍 Zoom Transition", "💨 Whip Pan", "🎬 Match Cut",
  "📐 Wipe", "🖤 Dip to Black", "⬜ Dip to White",
  "🔄 Morph/Seamless", "⚡ Glitch", "Custom",
];

const AUDIENCES = [
  { id: "general", label: "🌍 General", desc: "সবার জন্য" },
  { id: "gen-z", label: "⚡ Gen Z (13-25)", desc: "TikTok/Shorts ভাইব" },
  { id: "millennials", label: "🎯 Millennials (26-40)", desc: "Nostalgia + মানসম্মত" },
  { id: "adventure", label: "🏔️ Adventure", desc: "থ্রিল + এক্সট্রিম" },
  { id: "education", label: "📚 Educational", desc: "তথ্যমূলক + শিক্ষামূলক" },
  { id: "horror-thriller", label: "😱 Horror/Thriller", desc: "ভয় + রহস্য" },
  { id: "nature-wildlife", label: "🐾 Nature/Wildlife", desc: "প্রকৃতি + বন্যপ্রাণী" },
  { id: "urban-street", label: "🏙️ Urban/Street", desc: "শহুরে ক্যাপচার" },
];

export interface SceneParams {
  country: string;
  city: string;
  scenes: string;
  ratio: string;
  duration: string;
  resolution: string;
  cameraDistance: string;
  timeOfDay: string;
  weather: string;
  locationType: string;
  aiModel: string;
  narration: boolean;
  narrationNote: string;
  humanVoice: boolean;
  voiceCount: number;
  maleCount: number;
  femaleCount: number;
  voiceAge: string;
  hasAnimal: boolean;
  animal: string;
  cameraBrand: string;
  audience: string;
  lightingStyle: string;
  colorGrading: string;
  videoStyle: string;
  lensType: string;
  frameRate: string;
  cameraMovement: string;
  bgmGenre: string;
  sfxStyle: string;
  season: string;
  mood: string;
  targetPlatform: string;
  transitionStyle: string;
  variationCategories: string[];
  variationDetails: Record<string, string[]>;
  customValues: Record<string, string>;
}

const DEFAULT_SCENE_PARAMS: SceneParams = {
  country: "", city: "", scenes: "", ratio: "", duration: "",
  resolution: "", cameraDistance: "",
  timeOfDay: "", weather: "",
  locationType: "", aiModel: "",
  narration: false, narrationNote: "", humanVoice: false, voiceCount: 1, maleCount: 1, femaleCount: 0,
  voiceAge: "", hasAnimal: false, animal: "",
  cameraBrand: "", audience: "",
  lightingStyle: "", colorGrading: "", videoStyle: "",
  lensType: "", frameRate: "",
  cameraMovement: "", bgmGenre: "",
  sfxStyle: "", season: "",
  mood: "", targetPlatform: "",
  transitionStyle: "",
  variationCategories: [],
  variationDetails: {},
  customValues: {},
};

interface Props {
  params: SceneParams;
  onChange: (params: SceneParams) => void;
  disabled?: boolean;
  onClose?: () => void;
}

// ─── Section accent colors (richer, more vibrant) ───
const SECTION_ACCENTS: Record<string, { bg: string; border: string; iconBg: string; badgeBg: string; badgeColor: string; badgeBorder: string }> = {
  "🌍": { bg: "hsl(220 65% 96%)", border: "hsl(220 55% 82%)", iconBg: "linear-gradient(135deg, hsl(220 70% 88%), hsl(240 60% 85%))", badgeBg: "linear-gradient(135deg, hsl(220 70% 50%), hsl(240 65% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(220 65% 60%)" },
  "🎬": { bg: "hsl(280 60% 96%)", border: "hsl(280 50% 82%)", iconBg: "linear-gradient(135deg, hsl(280 65% 88%), hsl(300 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(280 65% 50%), hsl(300 60% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(280 60% 60%)" },
  "📐": { bg: "hsl(200 60% 96%)", border: "hsl(200 50% 82%)", iconBg: "linear-gradient(135deg, hsl(200 65% 88%), hsl(180 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(200 65% 45%), hsl(180 60% 50%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(200 60% 55%)" },
  "⏱️": { bg: "hsl(30 65% 96%)", border: "hsl(30 55% 82%)", iconBg: "linear-gradient(135deg, hsl(30 70% 88%), hsl(15 60% 85%))", badgeBg: "linear-gradient(135deg, hsl(25 75% 50%), hsl(10 70% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(25 70% 58%)" },
  "🖥️": { bg: "hsl(160 55% 96%)", border: "hsl(160 45% 82%)", iconBg: "linear-gradient(135deg, hsl(160 60% 88%), hsl(140 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(160 60% 40%), hsl(140 55% 45%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(160 55% 50%)" },
  "📷": { bg: "hsl(340 55% 96%)", border: "hsl(340 45% 82%)", iconBg: "linear-gradient(135deg, hsl(340 60% 88%), hsl(355 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(340 60% 48%), hsl(355 55% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(340 55% 58%)" },
  "🕐": { bg: "hsl(45 60% 96%)", border: "hsl(45 50% 82%)", iconBg: "linear-gradient(135deg, hsl(45 65% 88%), hsl(35 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(45 70% 45%), hsl(35 65% 48%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(45 65% 55%)" },
  "🌦️": { bg: "hsl(190 60% 96%)", border: "hsl(190 50% 82%)", iconBg: "linear-gradient(135deg, hsl(190 65% 88%), hsl(210 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(190 65% 42%), hsl(210 60% 48%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(190 60% 52%)" },
  "📍": { bg: "hsl(10 60% 96%)", border: "hsl(10 50% 82%)", iconBg: "linear-gradient(135deg, hsl(10 65% 88%), hsl(0 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(10 65% 50%), hsl(0 60% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(10 60% 58%)" },
  "🤖": { bg: "hsl(260 60% 96%)", border: "hsl(260 50% 82%)", iconBg: "linear-gradient(135deg, hsl(260 65% 88%), hsl(280 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(260 65% 50%), hsl(280 60% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(260 60% 58%)" },
  "🎙️": { bg: "hsl(140 55% 96%)", border: "hsl(140 45% 82%)", iconBg: "linear-gradient(135deg, hsl(140 60% 88%), hsl(120 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(140 60% 38%), hsl(120 55% 42%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(140 55% 48%)" },
  "🐾": { bg: "hsl(25 60% 96%)", border: "hsl(25 50% 82%)", iconBg: "linear-gradient(135deg, hsl(25 65% 88%), hsl(15 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(25 65% 45%), hsl(15 60% 48%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(25 60% 55%)" },
  "🎥": { bg: "hsl(300 55% 96%)", border: "hsl(300 45% 82%)", iconBg: "linear-gradient(135deg, hsl(300 60% 88%), hsl(320 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(300 60% 48%), hsl(320 55% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(300 55% 58%)" },
  "👥": { bg: "hsl(250 60% 96%)", border: "hsl(250 50% 82%)", iconBg: "linear-gradient(135deg, hsl(250 65% 88%), hsl(270 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(250 65% 50%), hsl(270 60% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(250 60% 58%)" },
  "💡": { bg: "hsl(50 65% 96%)", border: "hsl(50 55% 82%)", iconBg: "linear-gradient(135deg, hsl(50 70% 88%), hsl(40 60% 85%))", badgeBg: "linear-gradient(135deg, hsl(45 75% 45%), hsl(35 70% 48%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(45 70% 55%)" },
  "🎨": { bg: "hsl(320 55% 96%)", border: "hsl(320 45% 82%)", iconBg: "linear-gradient(135deg, hsl(320 60% 88%), hsl(340 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(320 60% 48%), hsl(340 55% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(320 55% 58%)" },
  "🎞️": { bg: "hsl(15 60% 96%)", border: "hsl(15 50% 82%)", iconBg: "linear-gradient(135deg, hsl(15 65% 88%), hsl(5 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(15 65% 48%), hsl(5 60% 50%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(15 60% 58%)" },
  "🔭": { bg: "hsl(230 60% 96%)", border: "hsl(230 50% 82%)", iconBg: "linear-gradient(135deg, hsl(230 65% 88%), hsl(250 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(230 65% 50%), hsl(250 60% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(230 60% 58%)" },
  "🏃": { bg: "hsl(170 55% 96%)", border: "hsl(170 45% 82%)", iconBg: "linear-gradient(135deg, hsl(170 60% 88%), hsl(150 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(170 60% 40%), hsl(150 55% 44%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(170 55% 50%)" },
  "🎵": { bg: "hsl(290 60% 96%)", border: "hsl(290 50% 82%)", iconBg: "linear-gradient(135deg, hsl(290 65% 88%), hsl(310 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(290 65% 50%), hsl(310 60% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(290 60% 58%)" },
  "🔊": { bg: "hsl(100 55% 96%)", border: "hsl(100 45% 82%)", iconBg: "linear-gradient(135deg, hsl(100 60% 88%), hsl(120 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(100 60% 38%), hsl(120 55% 42%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(100 55% 48%)" },
  "🍂": { bg: "hsl(35 65% 96%)", border: "hsl(35 55% 82%)", iconBg: "linear-gradient(135deg, hsl(35 70% 88%), hsl(20 60% 85%))", badgeBg: "linear-gradient(135deg, hsl(35 70% 45%), hsl(20 65% 48%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(35 65% 55%)" },
  "🎭": { bg: "hsl(355 55% 96%)", border: "hsl(355 45% 82%)", iconBg: "linear-gradient(135deg, hsl(355 60% 88%), hsl(340 50% 85%))", badgeBg: "linear-gradient(135deg, hsl(355 60% 48%), hsl(340 55% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(355 55% 58%)" },
  "📱": { bg: "hsl(210 60% 96%)", border: "hsl(210 50% 82%)", iconBg: "linear-gradient(135deg, hsl(210 65% 88%), hsl(230 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(210 65% 48%), hsl(230 60% 52%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(210 60% 58%)" },
  "✨": { bg: "hsl(270 60% 96%)", border: "hsl(270 50% 82%)", iconBg: "linear-gradient(135deg, hsl(270 65% 88%), hsl(290 55% 85%))", badgeBg: "linear-gradient(135deg, hsl(270 65% 50%), hsl(290 60% 55%))", badgeColor: "hsl(0 0% 100%)", badgeBorder: "hsl(270 60% 58%)" },
};



// ─── Sub Components ───

function ParamSection({ title, icon, children, defaultOpen = false, enabled = true, onToggle, value }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
  enabled?: boolean; onToggle?: (enabled: boolean) => void; value?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accent = SECTION_ACCENTS[icon] || SECTION_ACCENTS["🌍"];
  const selectedItems = value ? value.split(" | ").map(s => s.trim()).filter(Boolean) : [];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: open ? accent.bg : "hsl(var(--muted) / 0.08)",
        border: `1.5px solid ${open ? accent.border : "hsl(var(--border) / 0.2)"}`,
        boxShadow: open ? `0 6px 24px -6px ${accent.border}, inset 0 1px 0 hsl(0 0% 100% / 0.5)` : "0 1px 4px -1px hsl(0 0% 0% / 0.06)",
        opacity: enabled ? 1 : 0.5,
      }}
    >
      <div
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all group"
        style={{ background: open ? "hsl(0 0% 100% / 0.4)" : "hsl(0 0% 100% / 0.25)" }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 flex-1 text-left min-w-0"
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110 shadow-sm"
            style={{ background: accent.iconBg }}
          >
            {icon}
          </span>
          <span className="text-sm font-black text-foreground shrink-0 tracking-tight">{title}</span>
          {/* Inline selected values — vibrant colored badges */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0 ml-1">
              {selectedItems.slice(0, 3).map((item, i) => (
                <span
                  key={i}
                  className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg truncate max-w-[140px] whitespace-nowrap transition-all shadow-sm"
                  style={enabled ? {
                    background: accent.badgeBg,
                    color: accent.badgeColor,
                    border: `1.5px solid ${accent.badgeBorder}`,
                    boxShadow: `0 2px 10px -2px ${accent.badgeBorder}`,
                    letterSpacing: "0.01em",
                  } : {
                    background: "hsl(var(--muted) / 0.5)",
                    color: "hsl(var(--muted-foreground) / 0.5)",
                    border: "1.5px solid hsl(var(--border) / 0.3)",
                    textDecoration: "line-through",
                    opacity: 0.6,
                  }}
                  title={item}
                >
                  {item.replace(/^[^\w\u0980-\u09FF]+/, "").trim() || item.trim()}
                </span>
              ))}
              {selectedItems.length > 3 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm" style={{
                  background: accent.badgeBg,
                  color: accent.badgeColor,
                  border: `1.5px solid ${accent.badgeBorder}`,
                }}>
                  +{selectedItems.length - 3}
                </span>
              )}
            </div>
          )}
        </button>
        {onToggle && (
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="shrink-0 mx-1 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted"
          />
        )}
        <button onClick={() => setOpen(!open)} className="shrink-0">
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={cn("px-4 pb-4 pt-1 space-y-2", !enabled && "pointer-events-none opacity-40")}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Helper: parse multi-value string into array */
function parseMulti(value: string): string[] {
  if (!value) return [];
  return value.split(" | ").map(s => s.trim()).filter(Boolean);
}

/** Helper: toggle an item in a multi-value string */
function toggleMulti(current: string, item: string): string {
  const arr = parseMulti(current);
  const idx = arr.indexOf(item);
  if (idx >= 0) {
    arr.splice(idx, 1);
    return arr.join(" | ");
  }
  return [...arr, item].join(" | ");
}

function OptionGrid({ options, value, onSelect, allowCustom = false, customKey, customValues, onCustomChange, multiSelect = false }: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  allowCustom?: boolean;
  customKey?: string;
  customValues?: Record<string, string>;
  onCustomChange?: (key: string, val: string) => void;
  multiSelect?: boolean;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal] = useState(customValues?.[customKey || ""] || "");
  const selectedSet = useMemo(() => new Set(parseMulti(value)), [value]);

  const handleClick = (opt: string) => {
    if (opt === "Custom") {
      setShowCustom(true);
      return;
    }
    if (multiSelect) {
      onSelect(toggleMulti(value, opt));
    } else {
      // single select: click again to deselect
      onSelect(value === opt ? "" : opt);
    }
    setShowCustom(false);
  };

  const isSelected = (opt: string) => selectedSet.has(opt);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleClick(opt)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              isSelected(opt)
                ? "text-primary-foreground shadow-lg"
                : "text-foreground hover:shadow-sm"
            )}
            style={isSelected(opt) ? {
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(260 65% 52%), hsl(280 60% 50%))",
              border: "1.5px solid hsl(260 60% 55%)",
              boxShadow: "0 4px 16px -3px hsl(260 65% 45% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
              letterSpacing: "0.01em",
            } : {
              background: "hsl(0 0% 100% / 0.7)",
              border: "1.5px solid hsl(var(--border) / 0.35)",
              backdropFilter: "blur(4px)",
            }}
          >
            {opt}
          </motion.button>
        ))}
        {allowCustom && !options.includes("Custom") && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCustom(!showCustom)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-foreground transition-all"
            style={{
              border: "1.5px dashed hsl(var(--border) / 0.5)",
              background: "hsl(var(--muted) / 0.2)",
            }}
          >
            <Plus className="w-3 h-3" /> Custom
          </motion.button>
        )}
      </div>
      {multiSelect && selectedSet.size > 1 && (
        <p className="text-[10px] text-muted-foreground italic">
          ✨ {selectedSet.size}টি সিলেক্ট করা হয়েছে
        </p>
      )}
      {showCustom && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Input
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Custom value..."
            className="text-xs h-8 rounded-xl"
          />
          <button
            onClick={() => {
              if (customVal.trim()) {
                if (multiSelect) {
                  onSelect(toggleMulti(value, customVal.trim()));
                } else {
                  onSelect(customVal.trim());
                }
                onCustomChange?.(customKey || "", customVal.trim());
                setShowCustom(false);
              }
            }}
            className="px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
          >
            <Check className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Variation Sub Dropdown (collapsible per-category) ───

function VariationSubDropdown({ variationCategories, variationDetails, onUpdateDetails }: {
  variationCategories: string[];
  variationDetails: Record<string, string[]>;
  onUpdateDetails: (catId: string, details: string[]) => void;
}) {
  const [mainOpen, setMainOpen] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const toggleCat = (catId: string) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const totalDetails = variationCategories.reduce((sum, catId) => sum + (variationDetails[catId]?.length || 0), 0);

  return (
    <div className="space-y-1.5">
      {/* Main dropdown bar */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setMainOpen(!mainOpen)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all"
        style={{
          background: mainOpen
            ? "linear-gradient(135deg, hsl(260 55% 48%), hsl(280 50% 45%))"
            : "linear-gradient(135deg, hsl(260 40% 94%), hsl(280 35% 93%))",
          border: mainOpen ? "1.5px solid hsl(260 50% 55%)" : "1.5px solid hsl(260 30% 85%)",
          color: mainOpen ? "hsl(0 0% 100%)" : "hsl(var(--foreground))",
          boxShadow: mainOpen ? "0 4px 16px -4px hsl(260 55% 40% / 0.4)" : "0 1px 4px -1px hsl(0 0% 0% / 0.06)",
        }}
      >
        <span className="text-sm">🎯</span>
        <span className="text-[11px] font-black flex-1">সাব-প্যারামিটার নির্বাচন করুন</span>
        {totalDetails > 0 && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg"
            style={{
              background: mainOpen ? "hsl(0 0% 100% / 0.25)" : "linear-gradient(135deg, hsl(140 55% 45%), hsl(160 50% 42%))",
              color: "hsl(0 0% 100%)",
              border: mainOpen ? "1px solid hsl(0 0% 100% / 0.3)" : "1px solid hsl(140 45% 52%)",
            }}>
            ✅ {totalDetails}
          </span>
        )}
        <motion.div animate={{ rotate: mainOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" style={{ opacity: 0.7 }} />
        </motion.div>
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {mainOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-1">
              {variationCategories.map((catId, idx) => {
                const subParams = VARIATION_SUB_PARAMS[catId];
                if (!subParams) return null;
                const catDef = VARIATION_CATEGORIES.find(c => c.id === catId);
                const selectedDetails = variationDetails[catId] || [];
                const isCatOpen = openCats.has(catId);

                return (
                  <div key={catId} className="rounded-lg overflow-hidden" style={{
                    background: "hsl(0 0% 100% / 0.5)",
                    border: "1px solid hsl(280 35% 88%)",
                  }}>
                    {/* Per-category header (clickable) */}
                    <button
                      onClick={() => toggleCat(catId)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all hover:bg-white/30"
                    >
                      <span className="text-[10px] font-black text-muted-foreground">{idx + 1}.</span>
                      <span className="text-sm">{catDef?.icon}</span>
                      <span className="text-[11px] font-black text-foreground flex-1">{catDef?.label}</span>
                      {selectedDetails.length > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "hsl(140 50% 92%)", color: "hsl(140 50% 30%)", border: "1px solid hsl(140 40% 78%)" }}>
                          ✅ {selectedDetails.length}
                        </span>
                      )}
                      <motion.div animate={{ rotate: isCatOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </motion.div>
                    </button>

                    {/* Sub-params content */}
                    <AnimatePresence>
                      {isCatOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-2.5 space-y-1.5">
                            {subParams.map(sub => (
                              <div key={sub.id}>
                                <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 mb-1">
                                  {sub.icon} {sub.label}
                                </span>
                                <div className="flex flex-wrap gap-1 pl-1">
                                  {(sub.children || []).map(child => {
                                    const childKey = `${sub.id}:${child.id}`;
                                    const isSelected = selectedDetails.includes(childKey);
                                    return (
                                      <motion.button
                                        key={childKey}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          const current = variationDetails[catId] || [];
                                          const next = isSelected
                                            ? current.filter(d => d !== childKey)
                                            : [...current, childKey];
                                          onUpdateDetails(catId, next);
                                        }}
                                        className="px-2 py-1 rounded text-[9px] font-bold transition-all"
                                        style={isSelected ? {
                                          background: "linear-gradient(135deg, hsl(280 60% 52%), hsl(320 55% 50%))",
                                          border: "1px solid hsl(280 50% 58%)",
                                          color: "hsl(0 0% 100%)",
                                          boxShadow: "0 2px 6px -2px hsl(280 60% 45% / 0.3)",
                                        } : {
                                          background: "hsl(0 0% 100% / 0.7)",
                                          border: "1px solid hsl(var(--border) / 0.3)",
                                          color: "hsl(var(--foreground) / 0.7)",
                                        }}
                                      >
                                        {isSelected ? "✓ " : ""}{child.label}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              <p className="text-[10px] text-muted-foreground italic px-1">
                ✨ সিলেক্ট করা আইটেমগুলো C1-C5 কনসেপ্টে পর্যায়ক্রমে পরিবর্তন হবে
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───

export function SceneParameterDialog({ params, onChange, disabled, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<ScenePreset[]>(() => loadPresets());
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [disabledSections, setDisabledSections] = useState<Set<string>>(() => loadDisabledSections());

  const toggleSection = useCallback((sectionKey: string, enabled: boolean) => {
    setDisabledSections(prev => {
      const next = new Set(prev);
      if (enabled) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      saveDisabledSections(next);
      return next;
    });
  }, []);

  const isSectionEnabled = useCallback((sectionKey: string) => {
    return !disabledSections.has(sectionKey);
  }, [disabledSections]);

  const update = useCallback((partial: Partial<SceneParams>) => {
    onChange({ ...params, ...partial });
  }, [params, onChange]);

  const updateCustom = useCallback((key: string, val: string) => {
    onChange({ ...params, customValues: { ...params.customValues, [key]: val } });
  }, [params, onChange]);

  const resetAll = useCallback(() => {
    onChange({ ...DEFAULT_SCENE_PARAMS });
  }, [onChange]);

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim();
    if (!name) {
      toast({ title: "⚠️ নাম দিন", description: "প্রিসেটের একটি নাম লিখুন।", variant: "destructive" });
      return;
    }
    const existing = loadPresets();
    const duplicate = existing.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      toast({ title: "⚠️ ডুপ্লিকেট নাম", description: `"${name}" নামে ইতিমধ্যে একটি প্রিসেট আছে।`, variant: "destructive" });
      return;
    }
    const newPreset: ScenePreset = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      params: { ...params },
      savedAt: Date.now(),
    };
    const updated = [...existing, newPreset];
    savePresets(updated);
    setPresets(updated);
    setPresetName("");
    toast({ title: "✅ প্রিসেট সংরক্ষিত", description: `"${name}" সফলভাবে সেভ হয়েছে।` });
  }, [presetName, params]);

  const handleLoadPreset = useCallback((preset: ScenePreset) => {
    onChange({ ...preset.params });
    setShowPresetPanel(false);
    toast({ title: "📂 প্রিসেট লোড হয়েছে", description: `"${preset.name}" প্রয়োগ করা হয়েছে।` });
  }, [onChange]);

  const handleDeletePreset = useCallback((id: string) => {
    const updated = loadPresets().filter(p => p.id !== id);
    savePresets(updated);
    setPresets(updated);
    toast({ title: "🗑️ প্রিসেট মুছে ফেলা হয়েছে" });
  }, []);

  const cities = useMemo(() => {
    if (!params.country) return [];
    return COUNTRY_CITIES[params.country] || [];
  }, [params.country]);

  const activeCount = useMemo(() => {
    const e = (k: string) => !disabledSections.has(k);
    let count = 0;
    if (e("country") && params.country) count++;
    if (e("country") && params.city) count++;
    if (e("ratio") && params.ratio) count++;
    if (e("duration") && params.duration) count++;
    if (e("resolution") && params.resolution) count++;
    if (e("cameraDistance") && params.cameraDistance) count++;
    if (e("timeOfDay") && params.timeOfDay) count++;
    if (e("weather") && params.weather) count++;
    if (e("locationType") && params.locationType) count++;
    if (e("aiModel") && params.aiModel) count++;
    if (e("narration")) count++;
    if (e("humanVoice") && params.humanVoice) count++;
    if (e("animal") && params.hasAnimal && params.animal) count++;
    if (e("cameraBrand") && params.cameraBrand) count++;
    if (e("scenes") && params.scenes) count++;
    if (e("audience") && params.audience) count++;
    if (e("lightingStyle") && params.lightingStyle) count++;
    if (e("colorGrading") && params.colorGrading) count++;
    if (e("videoStyle") && params.videoStyle) count++;
    if (e("lensType") && params.lensType) count++;
    if (e("frameRate") && params.frameRate) count++;
    if (e("cameraMovement") && params.cameraMovement) count++;
    if (e("bgmGenre") && params.bgmGenre) count++;
    if (e("sfxStyle") && params.sfxStyle) count++;
    if (e("season") && params.season) count++;
    if (e("mood") && params.mood) count++;
    if (e("targetPlatform") && params.targetPlatform) count++;
    if (e("transitionStyle") && params.transitionStyle) count++;
    if (e("variationControl") && params.variationCategories && params.variationCategories.length > 0) count++;
    return count;
  }, [params, disabledSections]);

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v && onClose) onClose();
    }}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.12, y: -2, rotate: -3 }}
          whileTap={{ scale: 0.88 }}
          disabled={disabled}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden disabled:opacity-40 group"
          style={{
            background: "linear-gradient(145deg, hsl(165 70% 42%), hsl(180 65% 38%), hsl(195 60% 40%))",
            border: "2px solid hsl(170 55% 50%)",
            boxShadow: "0 6px 24px -4px hsl(170 65% 35% / 0.55), 0 2px 8px -2px hsl(190 55% 40% / 0.3), inset 0 1px 0 hsl(160 70% 70% / 0.4), inset 0 -1px 0 hsl(195 50% 30% / 0.3)",
          }}
          title="Scene Parameters"
        >
          {/* Animated glow ring */}
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "conic-gradient(from 0deg, hsl(160 70% 60% / 0), hsl(175 65% 50% / 0.5), hsl(195 60% 45% / 0.4), hsl(160 70% 60% / 0))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner shine */}
          <span
            className="absolute inset-[2px] rounded-xl"
            style={{
              background: "linear-gradient(155deg, hsl(165 68% 44%), hsl(180 60% 38%), hsl(195 55% 38%))",
            }}
          />
          <SlidersHorizontal
            className="w-[18px] h-[18px] relative z-10"
            style={{
              color: "hsl(0 0% 100%)",
              filter: "drop-shadow(0 1px 3px hsl(0 0% 0% / 0.3)) drop-shadow(0 0 8px hsl(170 80% 65% / 0.5))",
            }}
          />
          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center z-20"
              style={{
                background: "linear-gradient(135deg, hsl(45 95% 55%), hsl(35 90% 50%))",
                color: "hsl(0 0% 100%)",
                boxShadow: "0 2px 8px hsl(40 90% 45% / 0.5), 0 0 0 2px hsl(0 0% 100% / 0.9)",
                border: "1.5px solid hsl(45 85% 60%)",
              }}
            >
              {activeCount}
            </motion.span>
          )}
        </motion.button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[92vh] p-0 gap-0 overflow-hidden rounded-3xl" style={{
        background: "linear-gradient(170deg, hsl(250 50% 98%), hsl(220 45% 97%) 30%, hsl(200 40% 96%) 60%, hsl(260 35% 97%))",
        border: "1.5px solid hsl(250 40% 88%)",
        boxShadow: "0 30px 70px -15px hsl(250 50% 20% / 0.3), 0 0 0 1px hsl(250 40% 90% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
      }}>
        <DialogHeader className="px-6 pt-6 pb-4" style={{
          background: "linear-gradient(135deg, hsl(260 55% 94%), hsl(220 50% 95%), hsl(280 45% 95%))",
          borderBottom: "1.5px solid hsl(250 40% 86%)",
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(260 72% 52%), hsl(290 65% 48%), hsl(320 60% 52%))",
                  boxShadow: "0 6px 20px -4px hsl(260 70% 45% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
                }}
              >
                <SlidersHorizontal className="w-5 h-5" style={{ color: "hsl(0 0% 100%)", filter: "drop-shadow(0 1px 2px hsl(0 0% 0% / 0.3))" }} />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                  Scene Parameters
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  🔒 স্থায়ীভাবে সংরক্ষিত — নতুন session/blueprint এও এই settings বজায় থাকবে
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
              style={{
                background: "hsl(0 0% 100% / 0.7)",
                border: "1.5px solid hsl(var(--border) / 0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </motion.button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(92vh-160px)]">
          <div className="p-5 space-y-3">

            {/* ─── Concept Variation Control ─── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(280 55% 96%), hsl(320 50% 96%), hsl(350 45% 97%))",
                border: "2px solid hsl(280 50% 80%)",
                boxShadow: "0 6px 24px -6px hsl(280 50% 40% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
              }}
            >
              <div className="px-4 py-3.5 flex items-center gap-3" style={{
                background: "linear-gradient(135deg, hsl(280 60% 92%), hsl(320 55% 93%))",
                borderBottom: "1.5px solid hsl(280 45% 85%)",
              }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg, hsl(280 65% 88%), hsl(320 55% 85%))" }}>
                  🔄
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-foreground tracking-tight block">
                    Concept Variation Control
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    প্রতিটি কনসেপ্টে (C1-C5) কোন কোন বিষয় পরিবর্তন হবে তা সিলেক্ট করুন
                  </span>
                </div>
                <Switch
                  checked={isSectionEnabled("variationControl")}
                  onCheckedChange={(v) => toggleSection("variationControl", v)}
                  className="shrink-0 mx-1 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted"
                />
                {params.variationCategories.length > 0 && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0"
                    style={{
                      background: "linear-gradient(135deg, hsl(280 65% 50%), hsl(320 60% 52%))",
                      color: "hsl(0 0% 100%)",
                      border: "1.5px solid hsl(280 55% 60%)",
                      boxShadow: "0 2px 8px -2px hsl(280 60% 45% / 0.4)",
                    }}>
                    {params.variationCategories.length}টি সক্রিয়
                  </span>
                )}
              </div>

              <div className={cn("px-4 py-3 space-y-3", !isSectionEnabled("variationControl") && "pointer-events-none opacity-40")}>

                {/* ─── Active Selections Summary (removable tags) ─── */}
                {params.variationCategories.length > 0 && (
                  <div className="rounded-xl p-2.5 space-y-1.5" style={{
                    background: "hsl(140 50% 96%)",
                    border: "1.5px solid hsl(140 40% 82%)",
                  }}>
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      ✅ সিলেক্ট করা আছে:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {params.variationCategories.map((catId) => {
                        const catDef = VARIATION_CATEGORIES.find(c => c.id === catId);
                        const details = params.variationDetails?.[catId] || [];
                        // Build readable label
                        const detailLabels = details.map(d => {
                          const parts = d.split(":");
                          const subParams = VARIATION_SUB_PARAMS[catId] || [];
                          if (parts.length === 2) {
                            const sub = subParams.find(s => s.id === parts[0]);
                            const child = sub?.children?.find(c => c.id === parts[1]);
                            return child?.label?.replace(/^[^\w\u0980-\u09FF]+/, "").trim() || parts[1];
                          }
                          const sub = subParams.find(s => s.id === parts[0]);
                          return sub?.label || parts[0];
                        });
                        return (
                          <span key={catId} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                            style={{
                              background: "linear-gradient(135deg, hsl(280 60% 50%), hsl(320 55% 50%))",
                              color: "hsl(0 0% 100%)",
                              border: "1px solid hsl(280 50% 58%)",
                            }}>
                            <span>{catDef?.icon}</span>
                            <span>{catDef?.label?.split("/")[0]?.trim()}</span>
                            {detailLabels.length > 0 && (
                              <span className="opacity-80">({detailLabels.slice(0, 2).join(", ")}{detailLabels.length > 2 ? ` +${detailLabels.length - 2}` : ""})</span>
                            )}
                            <button
                              onClick={() => {
                                const next = params.variationCategories.filter(c => c !== catId);
                                const newDetails = { ...(params.variationDetails || {}) };
                                delete newDetails[catId];
                                update({ variationCategories: next, variationDetails: newDetails });
                              }}
                              className="ml-0.5 hover:bg-white/20 rounded px-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── Category Buttons ─── */}
                <div className="flex flex-wrap gap-2">
                  {VARIATION_CATEGORIES.map((cat) => {
                    const isActive = params.variationCategories.includes(cat.id);
                    const detailCount = (params.variationDetails?.[cat.id] || []).length;
                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          const current = params.variationCategories;
                          const next = isActive
                            ? current.filter(c => c !== cat.id)
                            : [...current, cat.id];
                          const newDetails = { ...(params.variationDetails || {}) };
                          if (isActive) delete newDetails[cat.id];
                          update({ variationCategories: next, variationDetails: newDetails });
                        }}
                        className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                        style={isActive ? {
                          background: "linear-gradient(135deg, hsl(280 65% 50%), hsl(320 60% 48%))",
                          border: "1.5px solid hsl(280 55% 58%)",
                          color: "hsl(0 0% 100%)",
                          boxShadow: "0 4px 16px -3px hsl(280 65% 45% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
                        } : {
                          background: "hsl(0 0% 100% / 0.7)",
                          border: "1.5px solid hsl(var(--border) / 0.35)",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {/* Checkbox indicator */}
                        <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0"
                          style={isActive ? {
                            background: "hsl(0 0% 100% / 0.3)",
                            border: "1.5px solid hsl(0 0% 100% / 0.5)",
                          } : {
                            background: "hsl(var(--muted) / 0.3)",
                            border: "1.5px solid hsl(var(--border) / 0.5)",
                          }}>
                          {isActive && "✓"}
                        </span>
                        <span className="text-base">{cat.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold leading-tight">{cat.label}</span>
                          <span className={cn("text-[9px] leading-tight", isActive ? "opacity-70" : "text-muted-foreground")}>
                            {cat.desc}
                          </span>
                        </div>
                        {isActive && detailCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center"
                            style={{
                              background: "linear-gradient(135deg, hsl(45 95% 55%), hsl(35 90% 50%))",
                              color: "hsl(0 0% 100%)",
                              boxShadow: "0 2px 6px hsl(40 90% 45% / 0.5), 0 0 0 2px hsl(0 0% 100% / 0.9)",
                              border: "1px solid hsl(45 85% 60%)",
                            }}>
                            {detailCount}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* ─── Dropdown bar to show/hide sub-parameter details ─── */}
                {params.variationCategories.length > 0 && (
                  <VariationSubDropdown
                    variationCategories={params.variationCategories}
                    variationDetails={params.variationDetails || {}}
                    onUpdateDetails={(catId, next) => {
                      update({ variationDetails: { ...(params.variationDetails || {}), [catId]: next } });
                    }}
                  />
                )}
              </div>
            </div>

            {/* Country + City */}
            <ParamSection title="Country & City" icon="🌍" enabled={isSectionEnabled("country")} onToggle={(v) => toggleSection("country", v)} value={[params.country, params.city].filter(Boolean).join(" | ")}>
              <OptionGrid
                options={COUNTRIES}
                value={params.country}
                onSelect={(v) => update({ country: v, city: "" })}
                allowCustom
                customKey="country"
                customValues={params.customValues}
                onCustomChange={updateCustom}
                multiSelect
              />
              {(params.country && cities.length > 0) && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.2)" }}>
                  <p className="text-xs font-bold text-muted-foreground mb-2">
                    📍 City — {params.country}
                  </p>
                  <OptionGrid
                    options={["All Cities", ...cities]}
                    value={params.city}
                    onSelect={(v) => update({ city: v })}
                    multiSelect
                  />
                </div>
              )}
            </ParamSection>

            {/* Scene / Parts */}
            <ParamSection title="Scene / Parts" icon="🎬" enabled={isSectionEnabled("scenes")} onToggle={(v) => toggleSection("scenes", v)} value={params.scenes}>
              <OptionGrid
                options={SCENES}
                value={params.scenes}
                onSelect={(v) => update({ scenes: v })}
                customKey="scenes"
                customValues={params.customValues}
                onCustomChange={updateCustom}
              />
            </ParamSection>

            {/* Ratio */}
            <ParamSection title="Aspect Ratio" icon="📐" enabled={isSectionEnabled("ratio")} onToggle={(v) => toggleSection("ratio", v)} value={params.ratio}>
              <OptionGrid options={RATIOS} value={params.ratio} onSelect={(v) => update({ ratio: v })} />
            </ParamSection>

            {/* Duration */}
            <ParamSection title="Duration" icon="⏱️" enabled={isSectionEnabled("duration")} onToggle={(v) => toggleSection("duration", v)} value={params.duration}>
              <OptionGrid
                options={DURATIONS}
                value={params.duration}
                onSelect={(v) => update({ duration: v })}
                customKey="duration"
                customValues={params.customValues}
                onCustomChange={updateCustom}
              />
            </ParamSection>

            {/* Resolution */}
            <ParamSection title="Resolution" icon="🖥️" enabled={isSectionEnabled("resolution")} onToggle={(v) => toggleSection("resolution", v)} value={params.resolution}>
              <OptionGrid options={RESOLUTIONS} value={params.resolution} onSelect={(v) => update({ resolution: v })} />
            </ParamSection>

            {/* Camera Distance */}
            <ParamSection title="Camera Distance / Angle" icon="📷" enabled={isSectionEnabled("cameraDistance")} onToggle={(v) => toggleSection("cameraDistance", v)} value={params.cameraDistance}>
              <OptionGrid
                options={CAMERA_DISTANCES}
                value={params.cameraDistance}
                onSelect={(v) => update({ cameraDistance: v })}
                allowCustom
                customKey="cameraDistance"
                customValues={params.customValues}
                onCustomChange={updateCustom}
              />
            </ParamSection>

            {/* Time of Day */}
            <ParamSection title="Time of Day" icon="🕐" enabled={isSectionEnabled("timeOfDay")} onToggle={(v) => toggleSection("timeOfDay", v)} value={params.timeOfDay}>
              <OptionGrid options={TIME_OF_DAY} value={params.timeOfDay} onSelect={(v) => update({ timeOfDay: v })} multiSelect />
            </ParamSection>

            {/* Weather */}
            <ParamSection title="Weather" icon="🌦️" enabled={isSectionEnabled("weather")} onToggle={(v) => toggleSection("weather", v)} value={params.weather}>
              <OptionGrid options={WEATHER} value={params.weather} onSelect={(v) => update({ weather: v })} multiSelect />
            </ParamSection>

            {/* Location Type */}
            <ParamSection title="Location / Place Type" icon="📍" enabled={isSectionEnabled("locationType")} onToggle={(v) => toggleSection("locationType", v)} value={params.locationType}>
              <OptionGrid
                options={LOCATION_TYPES}
                value={params.locationType}
                onSelect={(v) => update({ locationType: v })}
                allowCustom customKey="locationType" customValues={params.customValues} onCustomChange={updateCustom}
                multiSelect
              />
            </ParamSection>

            {/* AI Video Model */}
            <ParamSection title="AI Video Model" icon="🤖" enabled={isSectionEnabled("aiModel")} onToggle={(v) => toggleSection("aiModel", v)} value={params.aiModel}>
              <OptionGrid
                options={AI_MODELS}
                value={params.aiModel}
                onSelect={(v) => update({ aiModel: v })}
                allowCustom
                customKey="aiModel"
                customValues={params.customValues}
                onCustomChange={updateCustom}
              />
            </ParamSection>

            {/* Narration / Voiceover — single toggle only */}
            <ParamSection
              title="Narration / বর্ণনা"
              icon="🗣️"
              enabled={isSectionEnabled("narration")}
              onToggle={(v) => {
                toggleSection("narration", v);
                update({ narration: v });
              }}
              value={params.narration ? "ON — বর্ণনা সহ" : "OFF — Scene Sound Only"}
            >
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {params.narration
                    ? "🎙️ বাইরে থেকে কেউ দৃশ্য বর্ণনা করবে (Narrator/Voiceover)"
                    : "🔊 শুধু দৃশ্যের শব্দ — বাতাস, পানি, পায়ের শব্দ, পাখি — কোনো বাইরের বর্ণনা নেই"}
                </p>
                {!params.narration && (
                  <div className="text-[10px] px-3 py-2 rounded-xl" style={{ background: "hsl(var(--accent) / 0.15)", border: "1px solid hsl(var(--accent) / 0.3)" }}>
                    ✅ Scene Sound Only — দৃশ্যে যা ঘটছে তার যথার্থ শব্দ
                  </div>
                )}
                {/* Custom instruction */}
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">📝 তোমার নির্দেশনা (ঐচ্ছিক)</p>
                  <textarea
                    value={params.narrationNote}
                    onChange={(e) => update({ narrationNote: e.target.value })}
                    placeholder={params.narration
                      ? "যেমন: ধীর গম্ভীর পুরুষ কণ্ঠে বর্ণনা হবে, প্রতিটি দৃশ্যের শুরুতে..."
                      : "যেমন: বাতাসের শব্দ জোরে রাখো, পাখির ডাক যোগ করো..."}
                    className="w-full text-xs rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                    style={{
                      background: "hsl(var(--background))",
                      border: "1.5px solid hsl(var(--border) / 0.4)",
                      minHeight: "56px",
                    }}
                    rows={2}
                  />
                </div>
              </div>
            </ParamSection>

            {/* Human Voice */}
            <ParamSection title="Human Voice" icon="🎙️" enabled={isSectionEnabled("humanVoice")} onToggle={(v) => toggleSection("humanVoice", v)} value={params.humanVoice ? `Voice ×${params.voiceCount}` : "No"}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">ভয়েস থাকবে?</span>
                  <Switch
                    checked={params.humanVoice}
                    onCheckedChange={(v) => update({ humanVoice: v })}
                  />
                </div>
                {params.humanVoice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.2)" }}
                  >
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">মোট কতজন?</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <motion.button
                            key={n}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => update({ voiceCount: n, maleCount: Math.min(params.maleCount, n), femaleCount: Math.min(params.femaleCount, n) })}
                            className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
                            style={params.voiceCount === n ? {
                              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                              border: "1.5px solid hsl(var(--primary))",
                              color: "hsl(var(--primary-foreground))",
                              boxShadow: "0 3px 10px -2px hsl(var(--primary) / 0.4)",
                            } : {
                              background: "hsl(var(--background))",
                              border: "1.5px solid hsl(var(--border) / 0.4)",
                            }}
                          >
                            {n}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1.5">👨 Male কতজন?</p>
                        <div className="flex gap-1.5">
                          {Array.from({ length: params.voiceCount + 1 }, (_, i) => i).map((n) => (
                            <motion.button
                              key={n}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => update({ maleCount: n, femaleCount: params.voiceCount - n })}
                              className="w-8 h-8 rounded-xl text-xs font-bold transition-all"
                              style={params.maleCount === n ? {
                                background: "linear-gradient(135deg, hsl(210 80% 55%), hsl(210 70% 48%))",
                                border: "1.5px solid hsl(210 70% 55%)",
                                color: "hsl(0 0% 100%)",
                                boxShadow: "0 3px 10px -2px hsl(210 80% 50% / 0.4)",
                              } : {
                                background: "hsl(var(--background))",
                                border: "1.5px solid hsl(var(--border) / 0.4)",
                              }}
                            >
                              {n}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1.5">👩 Female কতজন?</p>
                        <div className="flex gap-1.5">
                          {Array.from({ length: params.voiceCount + 1 }, (_, i) => i).map((n) => (
                            <motion.button
                              key={n}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => update({ femaleCount: n, maleCount: params.voiceCount - n })}
                              className="w-8 h-8 rounded-xl text-xs font-bold transition-all"
                              style={params.femaleCount === n ? {
                                background: "linear-gradient(135deg, hsl(330 70% 55%), hsl(330 60% 48%))",
                                border: "1.5px solid hsl(330 60% 55%)",
                                color: "hsl(0 0% 100%)",
                                boxShadow: "0 3px 10px -2px hsl(330 70% 50% / 0.4)",
                              } : {
                                background: "hsl(var(--background))",
                                border: "1.5px solid hsl(var(--border) / 0.4)",
                              }}
                            >
                              {n}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">বয়স</p>
                      <OptionGrid
                        options={AGE_RANGES}
                        value={params.voiceAge}
                        onSelect={(v) => update({ voiceAge: v })} multiSelect
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </ParamSection>

            {/* Animal */}
            <ParamSection title="প্রাণী (Animal)" icon="🐾" enabled={isSectionEnabled("animal")} onToggle={(v) => toggleSection("animal", v)} value={params.hasAnimal ? params.animal : ""}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">প্রাণী থাকবে?</span>
                  <Switch
                    checked={params.hasAnimal}
                    onCheckedChange={(v) => update({ hasAnimal: v })}
                  />
                </div>
                {params.hasAnimal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <OptionGrid
                      options={ANIMALS}
                      value={params.animal}
                      onSelect={(v) => update({ animal: v })}
                      customKey="animal" customValues={params.customValues} onCustomChange={updateCustom}
                      multiSelect
                    />
                  </motion.div>
                )}
              </div>
            </ParamSection>

            {/* Camera Brand */}
            <ParamSection title="Camera Model / Brand" icon="🎥" enabled={isSectionEnabled("cameraBrand")} onToggle={(v) => toggleSection("cameraBrand", v)} value={params.cameraBrand}>
              <OptionGrid
                options={CAMERA_BRANDS}
                value={params.cameraBrand}
                onSelect={(v) => update({ cameraBrand: v })}
                customKey="cameraBrand"
                customValues={params.customValues}
                onCustomChange={updateCustom}
              />
            </ParamSection>

            {/* Lighting Style */}
            <ParamSection title="Lighting Style" icon="💡" enabled={isSectionEnabled("lightingStyle")} onToggle={(v) => toggleSection("lightingStyle", v)} value={params.lightingStyle}>
              <OptionGrid options={LIGHTING_STYLES} value={params.lightingStyle} onSelect={(v) => update({ lightingStyle: v })} customKey="lightingStyle" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Color Grading */}
            <ParamSection title="Color Grading / Tone" icon="🎨" enabled={isSectionEnabled("colorGrading")} onToggle={(v) => toggleSection("colorGrading", v)} value={params.colorGrading}>
              <OptionGrid options={COLOR_GRADINGS} value={params.colorGrading} onSelect={(v) => update({ colorGrading: v })} customKey="colorGrading" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Video Style */}
            <ParamSection title="Video Style" icon="🎞️" enabled={isSectionEnabled("videoStyle")} onToggle={(v) => toggleSection("videoStyle", v)} value={params.videoStyle}>
              <OptionGrid options={VIDEO_STYLES} value={params.videoStyle} onSelect={(v) => update({ videoStyle: v })} customKey="videoStyle" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Lens Type */}
            <ParamSection title="Lens Type" icon="🔭" enabled={isSectionEnabled("lensType")} onToggle={(v) => toggleSection("lensType", v)} value={params.lensType}>
              <OptionGrid options={LENS_TYPES} value={params.lensType} onSelect={(v) => update({ lensType: v })} customKey="lensType" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Frame Rate */}
            <ParamSection title="Frame Rate (FPS)" icon="🏃" enabled={isSectionEnabled("frameRate")} onToggle={(v) => toggleSection("frameRate", v)} value={params.frameRate}>
              <OptionGrid options={FRAME_RATES} value={params.frameRate} onSelect={(v) => update({ frameRate: v })} />
            </ParamSection>

            {/* Camera Movement */}
            <ParamSection title="Camera Movement" icon="🎥" enabled={isSectionEnabled("cameraMovement")} onToggle={(v) => toggleSection("cameraMovement", v)} value={params.cameraMovement}>
              <OptionGrid options={CAMERA_MOVEMENTS} value={params.cameraMovement} onSelect={(v) => update({ cameraMovement: v })} customKey="cameraMovement" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* BGM Genre */}
            <ParamSection title="BGM / Music Genre" icon="🎵" enabled={isSectionEnabled("bgmGenre")} onToggle={(v) => toggleSection("bgmGenre", v)} value={params.bgmGenre}>
              <OptionGrid options={BGM_GENRES} value={params.bgmGenre} onSelect={(v) => update({ bgmGenre: v })} customKey="bgmGenre" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* SFX Style */}
            <ParamSection title="Sound Effect Style" icon="🔊" enabled={isSectionEnabled("sfxStyle")} onToggle={(v) => toggleSection("sfxStyle", v)} value={params.sfxStyle}>
              <OptionGrid options={SFX_STYLES} value={params.sfxStyle} onSelect={(v) => update({ sfxStyle: v })} customKey="sfxStyle" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Season */}
            <ParamSection title="ঋতু / Season" icon="🍂" enabled={isSectionEnabled("season")} onToggle={(v) => toggleSection("season", v)} value={params.season}>
              <OptionGrid options={SEASONS} value={params.season} onSelect={(v) => update({ season: v })} multiSelect />
            </ParamSection>

            {/* Mood */}
            <ParamSection title="Mood / Atmosphere" icon="🎭" enabled={isSectionEnabled("mood")} onToggle={(v) => toggleSection("mood", v)} value={params.mood}>
              <OptionGrid options={MOODS} value={params.mood} onSelect={(v) => update({ mood: v })} customKey="mood" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Target Platform */}
            <ParamSection title="Target Platform" icon="📱" enabled={isSectionEnabled("targetPlatform")} onToggle={(v) => toggleSection("targetPlatform", v)} value={params.targetPlatform}>
              <OptionGrid options={TARGET_PLATFORMS} value={params.targetPlatform} onSelect={(v) => update({ targetPlatform: v })} customKey="targetPlatform" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Transition Style */}
            <ParamSection title="Transition Style" icon="✨" enabled={isSectionEnabled("transitionStyle")} onToggle={(v) => toggleSection("transitionStyle", v)} value={params.transitionStyle}>
              <OptionGrid options={TRANSITION_STYLES} value={params.transitionStyle} onSelect={(v) => update({ transitionStyle: v })} customKey="transitionStyle" customValues={params.customValues} onCustomChange={updateCustom} multiSelect />
            </ParamSection>

            {/* Audience Targeting */}
            <ParamSection title="Audience Targeting" icon="👥" enabled={isSectionEnabled("audience")} onToggle={(v) => toggleSection("audience", v)} value={AUDIENCES.find(a => a.id === params.audience)?.label || params.audience}>
              <div className="flex flex-wrap gap-2">
                {/* Skip button */}
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => update({ audience: "" })}
                  className="flex flex-col px-3 py-2 rounded-xl text-left transition-all"
                  style={params.audience === "" ? {
                    background: "linear-gradient(135deg, hsl(0 0% 45%), hsl(0 0% 35%))",
                    border: "1.5px solid hsl(0 0% 50%)",
                    color: "hsl(0 0% 100%)",
                  } : {
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1.5px dashed hsl(var(--border) / 0.5)",
                  }}
                >
                  <span className="text-[10px] font-bold">✕ Skip</span>
                </motion.button>
                {AUDIENCES.map((a) => {
                  const audienceSelected = parseMulti(params.audience);
                  const isActive = audienceSelected.includes(a.id);
                  return (
                    <motion.button
                      key={a.id}
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => update({ audience: toggleMulti(params.audience, a.id) })}
                      className="flex flex-col px-3.5 py-2.5 rounded-xl text-left transition-all"
                      style={isActive ? {
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                        border: "1.5px solid hsl(var(--primary))",
                        boxShadow: "0 4px 14px -3px hsl(var(--primary) / 0.4)",
                        color: "hsl(var(--primary-foreground))",
                      } : {
                        background: "hsl(var(--background))",
                        border: "1.5px solid hsl(var(--border) / 0.4)",
                      }}
                    >
                      <span className="text-xs font-bold">{a.label}</span>
                      <span className={cn(
                        "text-[10px]",
                        isActive ? "opacity-75" : "text-muted-foreground"
                      )}>{a.desc}</span>
                    </motion.button>
                  );
                })}
              </div>
            </ParamSection>
          </div>
        </ScrollArea>

        {/* Footer summary - all selected/changed params */}
        <div className="flex flex-col flex-shrink-0" style={{
          background: "linear-gradient(135deg, hsl(260 60% 96%), hsl(220 50% 96%))",
          borderTop: "2px solid hsl(var(--primary) / 0.15)",
        }}>
          {/* Header row with buttons */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1.5">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">🎯 Active Selections</span>
            <div className="flex items-center gap-2">
              {/* Save Preset Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPresetPanel(!showPresetPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: showPresetPanel
                    ? "linear-gradient(135deg, hsl(38 95% 55%), hsl(25 90% 52%))"
                    : "hsl(var(--background))",
                  color: showPresetPanel ? "hsl(0 0% 100%)" : "hsl(var(--foreground))",
                  border: `1.5px solid ${showPresetPanel ? "hsl(38 85% 62%)" : "hsl(var(--border) / 0.4)"}`,
                  boxShadow: showPresetPanel ? "0 4px 12px -3px hsl(38 90% 50% / 0.4)" : "none",
                }}
              >
                <Save className="w-3.5 h-3.5" />
                প্রিসেট
              </motion.button>

              {/* Done Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-black text-primary-foreground transition-all"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                  boxShadow: "0 4px 14px -3px hsl(var(--primary) / 0.4)",
                }}
              >
                ✅ Done
              </motion.button>
            </div>
          </div>

          {/* Preset Save/Load Panel */}
          <AnimatePresence>
            {showPresetPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-3 space-y-2.5">
                  {/* Save row */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="প্রিসেটের নাম লিখুন..."
                      className="h-8 text-xs rounded-xl flex-1"
                      style={{ background: "hsl(var(--background))", border: "1.5px solid hsl(var(--border) / 0.4)" }}
                      onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSavePreset}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-primary-foreground shrink-0"
                      style={{
                        background: "linear-gradient(135deg, hsl(150 70% 42%), hsl(160 65% 38%))",
                        boxShadow: "0 3px 10px -3px hsl(150 70% 40% / 0.4)",
                      }}
                    >
                      <Save className="w-3 h-3" />
                      সেভ করুন
                    </motion.button>
                  </div>

                  {/* Saved Presets List */}
                  {presets.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{
                      border: "1.5px solid hsl(var(--border) / 0.3)",
                      background: "hsl(var(--background) / 0.6)",
                    }}>
                      <div className="px-3 py-1.5 flex items-center gap-1.5" style={{
                        background: "hsl(var(--muted) / 0.4)",
                        borderBottom: "1px solid hsl(var(--border) / 0.2)",
                      }}>
                        <FolderOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          সংরক্ষিত প্রিসেট ({presets.length})
                        </span>
                      </div>
                      <ScrollArea className="max-h-[100px]">
                        {presets.map((preset, idx) => (
                          <div
                            key={preset.id}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all hover:bg-accent/50 group/preset"
                            style={{
                              borderBottom: idx < presets.length - 1 ? "1px solid hsl(var(--border) / 0.15)" : "none",
                            }}
                            onClick={() => handleLoadPreset(preset)}
                          >
                            <span className="text-[11px] font-bold text-foreground flex-1 truncate">
                              📁 {preset.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground shrink-0">
                              {new Date(preset.savedAt).toLocaleDateString("bn-BD")}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                              className="opacity-0 group-hover/preset:opacity-70 hover:!opacity-100 p-1 rounded-lg transition-all shrink-0"
                              style={{ background: "hsl(0 70% 95%)" }}
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3 h-3" style={{ color: "hsl(0 55% 50%)" }} />
                            </button>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                  {presets.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-1 italic">
                      কোনো সংরক্ষিত প্রিসেট নেই — উপরে নাম দিয়ে সেভ করুন
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Utility: Build param string for prompt injection ───

export function buildSceneParamString(params: SceneParams): string {
  const disabled = loadDisabledSections();
  const e = (k: string) => !disabled.has(k);
  const parts: string[] = [];
  if (e("country") && params.country) parts.push(`Country: ${params.country}${params.city && params.city !== "All" && params.city !== "All Cities" ? `, City: ${params.city}` : params.city === "All" || params.city === "All Cities" ? " (All cities)" : ""}`);
  if (e("scenes") && params.scenes) parts.push(`Scenes/Parts: ${params.scenes}`);
  if (e("ratio") && params.ratio) parts.push(`Aspect Ratio: ${params.ratio}`);
  if (e("duration") && params.duration) parts.push(`Duration: ${params.duration}`);
  if (e("resolution") && params.resolution) parts.push(`Resolution: ${params.resolution}`);
  if (e("cameraDistance") && params.cameraDistance) parts.push(`Camera Distance: ${params.cameraDistance}`);
  if (e("timeOfDay") && params.timeOfDay) parts.push(`Time: ${params.timeOfDay}`);
  if (e("weather") && params.weather) parts.push(`Weather: ${params.weather}`);
  if (e("locationType") && params.locationType) parts.push(`Location: ${params.locationType}`);
  if (e("aiModel") && params.aiModel) parts.push(`AI Video Model: ${params.aiModel}`);
  if (e("narration")) {
    parts.push(params.narration
      ? `Narration/Voiceover: YES — include external narrator describing scenes`
      : `Narration/Voiceover: NO — ABSOLUTELY NO external narration, NO voiceover, NO narrator. ONLY natural scene sounds (wind, footsteps, water, impacts, ambient environment). The video must have ZERO spoken narration or descriptive voice.`
    );
    if (params.narrationNote && params.narrationNote.trim()) {
      parts.push(`Sound/Narration Custom Instruction: ${params.narrationNote.trim()}`);
    }
  }
  if (e("humanVoice") && params.humanVoice) {
    parts.push(`Human Voice: Yes — Total ${params.voiceCount} (Male: ${params.maleCount}, Female: ${params.femaleCount}), Age: ${params.voiceAge}`);
  }
  if (e("animal") && params.hasAnimal && params.animal) {
    parts.push(`Animal: ${params.animal}`);
  }
  if (e("cameraBrand") && params.cameraBrand) parts.push(`Camera: ${params.cameraBrand}`);
  if (e("lightingStyle") && params.lightingStyle) parts.push(`Lighting: ${params.lightingStyle}`);
  if (e("colorGrading") && params.colorGrading) parts.push(`Color Grading: ${params.colorGrading}`);
  if (e("videoStyle") && params.videoStyle) parts.push(`Video Style: ${params.videoStyle}`);
  if (e("lensType") && params.lensType) parts.push(`Lens: ${params.lensType}`);
  if (e("frameRate") && params.frameRate) parts.push(`FPS: ${params.frameRate}`);
  if (e("cameraMovement") && params.cameraMovement) parts.push(`Camera Movement: ${params.cameraMovement}`);
  if (e("bgmGenre") && params.bgmGenre) parts.push(`BGM: ${params.bgmGenre}`);
  if (e("sfxStyle") && params.sfxStyle) parts.push(`SFX: ${params.sfxStyle}`);
  if (e("season") && params.season) parts.push(`Season: ${params.season}`);
  if (e("mood") && params.mood) parts.push(`Mood: ${params.mood}`);
  if (e("targetPlatform") && params.targetPlatform) parts.push(`Platform: ${params.targetPlatform}`);
  if (e("transitionStyle") && params.transitionStyle) parts.push(`Transition: ${params.transitionStyle}`);
  if (e("audience") && params.audience) {
    const audienceLabels = parseMulti(params.audience).map(id => {
      const item = AUDIENCES.find(a => a.id === id);
      return item ? `${item.label}` : id;
    });
    if (audienceLabels.length) parts.push(`Audience: ${audienceLabels.join(", ")}`);
  }
  // Variation categories with details
  if (e("variationControl") && params.variationCategories && params.variationCategories.length > 0) {
    const catDetails = params.variationCategories.map(catId => {
      const cat = VARIATION_CATEGORIES.find(c => c.id === catId);
      const catLabel = cat ? cat.label : catId;
      const details = params.variationDetails?.[catId] || [];
      if (details.length === 0) return catLabel;
      
      // Resolve detail labels
      const subParams = VARIATION_SUB_PARAMS[catId] || [];
      const detailLabels = details.map(d => {
        if (d.includes(":")) {
          const [subId, childId] = d.split(":");
          const sub = subParams.find(s => s.id === subId);
          const child = sub?.children?.find(c => c.id === childId);
          return child?.label || d;
        }
        const sub = subParams.find(s => s.id === d);
        return sub?.label || d;
      });
      return `${catLabel} (${detailLabels.join(", ")})`;
    });
    parts.push(`[VARIATION CONTROL — প্রতিটি কনসেপ্টে (C1-C5) নিচের বিষয়গুলো ভিন্ন হবে: ${catDetails.join(" | ")}. বাকি সব একই থাকবে।]`);
  }
  return parts.join(" | ");
}

export { DEFAULT_SCENE_PARAMS };
export type { SceneParams as SceneParamsType };
