import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dna, Sparkles, Save, RotateCcw, Copy, Check, Zap, Shuffle, Info, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ===== TYPES =====
interface CategoryOption {
  id: string;
  label: string;
  labelBn: string;
  emoji?: string;
  tags?: string[];
}

interface Category {
  id: string;
  title: string;
  titleBn: string;
  icon: string;
  step: number;
  options: CategoryOption[];
}

// ===== WIZARD STEPS — 8 clear questions =====
const WIZARD_STEPS = [
  { id: 0, icon: "🎭", question: "কে বা কী থাকবে?", questionEn: "Who or What?", desc: "ভিডিওর মূল চরিত্র বা বিষয় বাছুন", color: "from-violet-500 to-purple-600" },
  { id: 1, icon: "⚡", question: "কী ঘটবে?", questionEn: "What Happens?", desc: "অ্যাকশন, ঘটনা বা গল্পের ধরন বাছুন", color: "from-orange-500 to-red-500" },
  { id: 2, icon: "🌍", question: "কোথায় ঘটবে?", questionEn: "Where?", desc: "পটভূমি ও পরিবেশ বাছুন", color: "from-emerald-500 to-teal-600" },
  { id: 3, icon: "🔧", question: "কীভাবে ঘটবে?", questionEn: "How?", desc: "পদ্ধতি, প্রক্রিয়া ও কার্যকারণ বাছুন", color: "from-amber-500 to-orange-600" },
  { id: 4, icon: "🕐", question: "কখন ঘটবে?", questionEn: "When?", desc: "সময়, পরিস্থিতি ও শর্ত বাছুন", color: "from-indigo-500 to-violet-600" },
  { id: 5, icon: "📈", question: "কী পরিবর্তন হবে?", questionEn: "Escalation?", desc: "পরিস্থিতি কীভাবে বদলাবে বাছুন", color: "from-red-500 to-rose-600" },
  { id: 6, icon: "💫", question: "কেমন অনুভূতি?", questionEn: "What Feeling?", desc: "আবেগ, মুড ও গল্পের গঠন বাছুন", color: "from-pink-500 to-rose-600" },
  { id: 7, icon: "🎨", question: "দেখতে কেমন হবে?", questionEn: "How It Looks?", desc: "ভিজ্যুয়াল স্টাইল, সাউন্ড ও ক্যামেরা বাছুন", color: "from-cyan-500 to-blue-600" },
];

// ===== CATEGORIES organized by step =====
const DNA_CATEGORIES: Category[] = [
  // ╔═══════════════════════════════════════════════════════════════╗
  // ║              STEP 0: কে বা কী থাকবে? (চরিত্র/বিষয়)         ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- প্রাণী: স্থলচর শিকারী ----
  {
    id: "animal_predator", title: "Land Predators", titleBn: "🐺 স্থলচর শিকারী", icon: "🐺", step: 0,
    options: [
      { id: "wolf", label: "Wolf Pack", labelBn: "নেকড়ে দল", emoji: "🐺", tags: ["pack", "wild"] },
      { id: "lion", label: "Lion", labelBn: "সিংহ", emoji: "🦁", tags: ["pride", "wild"] },
      { id: "tiger", label: "Tiger", labelBn: "বাঘ", emoji: "🐯", tags: ["solitary", "wild"] },
      { id: "bear", label: "Bear", labelBn: "ভালুক", emoji: "🐻", tags: ["wild"] },
      { id: "panther", label: "Panther", labelBn: "প্যান্থার", emoji: "🐆", tags: ["stealth", "wild"] },
      { id: "hyena", label: "Hyena Pack", labelBn: "হায়েনা দল", emoji: "🦴", tags: ["pack", "wild"] },
      { id: "cheetah", label: "Cheetah", labelBn: "চিতা", emoji: "🐆", tags: ["speed", "wild"] },
      { id: "leopard", label: "Leopard", labelBn: "চিতাবাঘ", emoji: "🐆", tags: ["stealth", "wild"] },
      { id: "fox", label: "Fox", labelBn: "শেয়াল", emoji: "🦊", tags: ["clever", "wild"] },
      { id: "jaguar", label: "Jaguar", labelBn: "জাগুয়ার", emoji: "🐆", tags: ["solitary", "wild"] },
      { id: "wild_dog", label: "Wild Dog", labelBn: "বুনো কুকুর", emoji: "🐕", tags: ["pack", "wild"] },
      { id: "wolverine", label: "Wolverine", labelBn: "উলভেরিন", emoji: "🦡", tags: ["fierce", "wild"] },
      { id: "cougar", label: "Cougar / Puma", labelBn: "কুগার / পিউমা", emoji: "🐆", tags: ["stealth", "wild"] },
      { id: "coyote", label: "Coyote", labelBn: "কোয়োট", emoji: "🐺", tags: ["clever", "wild"] },
      { id: "caracal", label: "Caracal", labelBn: "কারাকাল", emoji: "🐱", tags: ["speed", "wild"] },
      { id: "lynx", label: "Lynx", labelBn: "লিংক্স", emoji: "🐱", tags: ["stealth", "cold"] },
      { id: "dingo", label: "Dingo", labelBn: "ডিঙ্গো", emoji: "🐕", tags: ["wild", "pack"] },
      { id: "ocelot", label: "Ocelot", labelBn: "অসিলট", emoji: "🐆", tags: ["stealth", "wild"] },
      { id: "snow_leopard", label: "Snow Leopard", labelBn: "তুষার চিতা", emoji: "🐆", tags: ["cold", "wild"] },
    ],
  },
  // ---- প্রাণী: পাখি ----
  {
    id: "animal_bird", title: "Birds", titleBn: "🦅 পাখি", icon: "🦅", step: 0,
    options: [
      { id: "eagle", label: "Eagle", labelBn: "ঈগল", emoji: "🦅", tags: ["sky", "wild"] },
      { id: "hawk", label: "Hawk", labelBn: "বাজপাখি", emoji: "🦅", tags: ["sky", "wild"] },
      { id: "owl", label: "Owl", labelBn: "পেঁচা", emoji: "🦉", tags: ["night", "wise"] },
      { id: "vulture", label: "Vulture", labelBn: "শকুন", emoji: "🦅", tags: ["death", "sky"] },
      { id: "crow", label: "Crow / Raven", labelBn: "কাক / দাঁড়কাক", emoji: "🐦‍⬛", tags: ["dark", "clever"] },
      { id: "parrot", label: "Parrot", labelBn: "টিয়া", emoji: "🦜", tags: ["color", "safe"] },
      { id: "peacock", label: "Peacock", labelBn: "ময়ূর", emoji: "🦚", tags: ["beauty", "nature"] },
      { id: "flamingo", label: "Flamingo", labelBn: "ফ্লেমিংগো", emoji: "🦩", tags: ["color", "nature"] },
      { id: "penguin", label: "Penguin", labelBn: "পেঙ্গুইন", emoji: "🐧", tags: ["cold", "cute"] },
      { id: "falcon", label: "Falcon", labelBn: "ফ্যালকন", emoji: "🦅", tags: ["speed", "sky"] },
      { id: "crane", label: "Crane", labelBn: "সারস", emoji: "🦢", tags: ["grace", "nature"] },
      { id: "hummingbird", label: "Hummingbird", labelBn: "হামিংবার্ড", emoji: "🐦", tags: ["tiny", "speed"] },
      { id: "swan", label: "Swan", labelBn: "রাজহাঁস", emoji: "🦢", tags: ["beauty", "grace"] },
      { id: "woodpecker", label: "Woodpecker", labelBn: "কাঠঠোকরা", emoji: "🐦", tags: ["nature"] },
      { id: "toucan", label: "Toucan", labelBn: "টুকান", emoji: "🦜", tags: ["color", "wild"] },
      { id: "pelican", label: "Pelican", labelBn: "পেলিকান", emoji: "🦅", tags: ["sea", "nature"] },
      { id: "kingfisher", label: "Kingfisher", labelBn: "মাছরাঙা", emoji: "🐦", tags: ["speed", "color"] },
      { id: "stork", label: "Stork", labelBn: "মানিকজোড়", emoji: "🦢", tags: ["nature", "grace"] },
      { id: "albatross", label: "Albatross", labelBn: "অ্যালবাট্রস", emoji: "🦅", tags: ["sea", "sky"] },
      { id: "robin", label: "Robin", labelBn: "রবিন", emoji: "🐦", tags: ["safe", "nature"] },
      { id: "ostrich", label: "Ostrich", labelBn: "উটপাখি", emoji: "🦤", tags: ["wild", "speed"] },
      { id: "pigeon", label: "Pigeon / Dove", labelBn: "কবুতর / ঘুঘু", emoji: "🕊️", tags: ["peaceful", "safe"] },
      { id: "sparrow", label: "Sparrow", labelBn: "চড়ুই", emoji: "🐦", tags: ["safe", "nature"] },
    ],
  },
  // ---- প্রাণী: সামুদ্রিক ----
  {
    id: "animal_sea", title: "Sea & Marine", titleBn: "🐙 সামুদ্রিক প্রাণী", icon: "🐙", step: 0,
    options: [
      { id: "shark", label: "Shark", labelBn: "হাঙর", emoji: "🦈", tags: ["sea", "wild"] },
      { id: "whale", label: "Whale", labelBn: "তিমি", emoji: "🐋", tags: ["gentle", "sea"] },
      { id: "orca", label: "Orca", labelBn: "অর্কা", emoji: "🐬", tags: ["pack", "sea"] },
      { id: "dolphin", label: "Dolphin", labelBn: "ডলফিন", emoji: "🐬", tags: ["clever", "sea"] },
      { id: "octopus", label: "Octopus", labelBn: "অক্টোপাস", emoji: "🐙", tags: ["clever", "sea"] },
      { id: "jellyfish", label: "Jellyfish", labelBn: "জেলিফিশ", emoji: "🪼", tags: ["alien", "sea"] },
      { id: "crocodile", label: "Crocodile", labelBn: "কুমির", emoji: "🐊", tags: ["reptile", "wild"] },
      { id: "sea_turtle", label: "Sea Turtle", labelBn: "সামুদ্রিক কচ্ছপ", emoji: "🐢", tags: ["ancient", "sea"] },
      { id: "stingray", label: "Stingray", labelBn: "স্টিংরে", emoji: "🐟", tags: ["sea", "stealth"] },
      { id: "seal", label: "Seal", labelBn: "সীল", emoji: "🦭", tags: ["cold", "cute"] },
      { id: "deep_sea", label: "Deep Sea Creatures", labelBn: "গভীর সমুদ্রের প্রাণী", emoji: "🦑", tags: ["dark", "sea"] },
      { id: "coral_reef", label: "Coral Reef Life", labelBn: "প্রবাল জীবন", emoji: "🪸", tags: ["color", "sea"] },
      { id: "seahorse", label: "Seahorse", labelBn: "সামুদ্রিক ঘোড়া", emoji: "🐴", tags: ["cute", "sea"] },
      { id: "piranha", label: "Piranha", labelBn: "পিরানহা", emoji: "🐟", tags: ["wild", "sea"] },
      { id: "pufferfish", label: "Pufferfish", labelBn: "পটকা মাছ", emoji: "🐡", tags: ["strange", "sea"] },
      { id: "clownfish", label: "Clownfish", labelBn: "ক্লাউনফিশ", emoji: "🐠", tags: ["color", "cute"] },
      { id: "barracuda", label: "Barracuda", labelBn: "ব্যারাকুডা", emoji: "🐟", tags: ["speed", "wild"] },
      { id: "narwhal", label: "Narwhal", labelBn: "নারহোয়াল", emoji: "🦄", tags: ["cold", "sea"] },
      { id: "manta_ray", label: "Manta Ray", labelBn: "ম্যান্টা রে", emoji: "🐟", tags: ["gentle", "sea"] },
      { id: "lobster", label: "Lobster / Crab", labelBn: "গলদা চিংড়ি / কাঁকড়া", emoji: "🦀", tags: ["sea"] },
      { id: "electric_eel", label: "Electric Eel", labelBn: "ইলেক্ট্রিক ইল", emoji: "⚡", tags: ["strange", "sea"] },
      { id: "swordfish", label: "Swordfish", labelBn: "সোর্ডফিশ", emoji: "🐟", tags: ["speed", "sea"] },
      { id: "walrus", label: "Walrus", labelBn: "ওয়ালরাস", emoji: "🦭", tags: ["cold", "wild"] },
    ],
  },
  // ---- প্রাণী: সরীসৃপ ও উভচর ----
  {
    id: "animal_reptile", title: "Reptiles & Amphibians", titleBn: "🐍 সরীসৃপ ও উভচর", icon: "🐍", step: 0,
    options: [
      { id: "snake", label: "Snake / Cobra", labelBn: "সাপ / কোবরা", emoji: "🐍", tags: ["reptile", "wild"] },
      { id: "komodo", label: "Komodo Dragon", labelBn: "কমোডো ড্রাগন", emoji: "🦎", tags: ["reptile", "wild"] },
      { id: "chameleon", label: "Chameleon", labelBn: "গিরগিটি", emoji: "🦎", tags: ["stealth", "color"] },
      { id: "lizard", label: "Lizard", labelBn: "টিকটিকি", emoji: "🦎", tags: ["reptile"] },
      { id: "frog", label: "Frog / Toad", labelBn: "ব্যাঙ", emoji: "🐸", tags: ["nature", "strange"] },
      { id: "salamander", label: "Salamander", labelBn: "সালামান্ডার", emoji: "🦎", tags: ["fire", "mythic"] },
      { id: "tortoise", label: "Tortoise", labelBn: "কচ্ছপ", emoji: "🐢", tags: ["ancient", "wise"] },
      { id: "gecko", label: "Gecko", labelBn: "গেকো", emoji: "🦎", tags: ["stealth"] },
      { id: "alligator", label: "Alligator", labelBn: "অ্যালিগেটর", emoji: "🐊", tags: ["wild", "reptile"] },
      { id: "iguana", label: "Iguana", labelBn: "ইগুয়ানা", emoji: "🦎", tags: ["nature", "reptile"] },
      { id: "anaconda", label: "Anaconda", labelBn: "অ্যানাকোন্ডা", emoji: "🐍", tags: ["wild", "sea"] },
      { id: "python", label: "Python", labelBn: "অজগর", emoji: "🐍", tags: ["wild", "stealth"] },
      { id: "poison_dart_frog", label: "Poison Dart Frog", labelBn: "বিষাক্ত ব্যাঙ", emoji: "🐸", tags: ["color", "wild"] },
      { id: "sea_snake", label: "Sea Snake", labelBn: "সামুদ্রিক সাপ", emoji: "🐍", tags: ["sea", "wild"] },
    ],
  },
  // ---- প্রাণী: পোকামাকড় ----
  {
    id: "animal_insect", title: "Insects & Arachnids", titleBn: "🕷️ পোকামাকড়", icon: "🕷️", step: 0,
    options: [
      { id: "spider", label: "Spider", labelBn: "মাকড়সা", emoji: "🕷️", tags: ["horror", "wild"] },
      { id: "scorpion", label: "Scorpion", labelBn: "বিছা", emoji: "🦂", tags: ["desert", "wild"] },
      { id: "ant_colony", label: "Ant Colony", labelBn: "পিঁপড়ে দল", emoji: "🐜", tags: ["pack", "clever"] },
      { id: "bee_hive", label: "Bee Hive", labelBn: "মৌমাছি ঝাঁক", emoji: "🐝", tags: ["pack", "nature"] },
      { id: "butterfly", label: "Butterfly", labelBn: "প্রজাপতি", emoji: "🦋", tags: ["beauty", "nature"] },
      { id: "beetle", label: "Beetle", labelBn: "গুবরে পোকা", emoji: "🪲", tags: ["nature"] },
      { id: "mantis", label: "Praying Mantis", labelBn: "ফড়িং", emoji: "🦗", tags: ["stealth", "wild"] },
      { id: "firefly", label: "Firefly", labelBn: "জোনাকি", emoji: "✨", tags: ["light", "nature"] },
      { id: "centipede", label: "Centipede", labelBn: "খানাপোকা", emoji: "🐛", tags: ["horror"] },
      { id: "dragonfly", label: "Dragonfly", labelBn: "ফড়িং", emoji: "🪰", tags: ["speed", "nature"] },
      { id: "moth", label: "Moth", labelBn: "মথ", emoji: "🦋", tags: ["night", "nature"] },
      { id: "snail", label: "Snail / Slug", labelBn: "শামুক", emoji: "🐌", tags: ["nature", "slow"] },
      { id: "grasshopper", label: "Grasshopper / Cricket", labelBn: "ঘাসফড়িং / ঝিঁঝি", emoji: "🦗", tags: ["nature"] },
      { id: "wasp", label: "Wasp / Hornet", labelBn: "বোলতা", emoji: "🐝", tags: ["wild", "pack"] },
      { id: "ladybug", label: "Ladybug", labelBn: "লেডিবাগ", emoji: "🐞", tags: ["cute", "nature"] },
      { id: "cockroach", label: "Cockroach", labelBn: "তেলাপোকা", emoji: "🪳", tags: ["horror", "nature"] },
      { id: "mosquito", label: "Mosquito", labelBn: "মশা", emoji: "🦟", tags: ["horror", "nature"] },
      { id: "termite", label: "Termite Colony", labelBn: "উইপোকা", emoji: "🐛", tags: ["pack", "nature"] },
      { id: "worm", label: "Earthworm", labelBn: "কেঁচো", emoji: "🪱", tags: ["nature", "strange"] },
    ],
  },
  // ---- প্রাণী: গৃহপালিত ও বন্য স্তন্যপায়ী ----
  {
    id: "animal_domestic", title: "Domestic & Mammals", titleBn: "🐴 গৃহপালিত ও স্তন্যপায়ী", icon: "🐴", step: 0,
    options: [
      { id: "horse", label: "Horse", labelBn: "ঘোড়া", emoji: "🐎", tags: ["speed", "nature"] },
      { id: "dog", label: "Dog", labelBn: "কুকুর", emoji: "🐕", tags: ["loyal", "safe"] },
      { id: "cat", label: "Cat", labelBn: "বিড়াল", emoji: "🐈", tags: ["stealth", "safe"] },
      { id: "elephant", label: "Elephant", labelBn: "হাতি", emoji: "🐘", tags: ["wise", "wild"] },
      { id: "gorilla", label: "Gorilla", labelBn: "গরিলা", emoji: "🦍", tags: ["wild", "pack"] },
      { id: "deer", label: "Deer", labelBn: "হরিণ", emoji: "🦌", tags: ["gentle", "nature"] },
      { id: "rhino", label: "Rhino", labelBn: "গন্ডার", emoji: "🦏", tags: ["wild", "battle"] },
      { id: "buffalo", label: "Buffalo", labelBn: "মহিষ", emoji: "🐃", tags: ["wild", "battle"] },
      { id: "rabbit", label: "Rabbit", labelBn: "খরগোশ", emoji: "🐇", tags: ["cute", "safe"] },
      { id: "monkey", label: "Monkey", labelBn: "বানর", emoji: "🐒", tags: ["clever", "wild"] },
      { id: "bat", label: "Bat", labelBn: "বাদুড়", emoji: "🦇", tags: ["night", "dark"] },
      { id: "hippo", label: "Hippo", labelBn: "জলহস্তী", emoji: "🦛", tags: ["wild", "sea"] },
      { id: "giraffe", label: "Giraffe", labelBn: "জিরাফ", emoji: "🦒", tags: ["gentle", "wild"] },
      { id: "zebra", label: "Zebra", labelBn: "জেব্রা", emoji: "🦓", tags: ["wild", "nature"] },
      { id: "camel", label: "Camel", labelBn: "উট", emoji: "🐫", tags: ["desert", "nature"] },
      { id: "kangaroo", label: "Kangaroo", labelBn: "ক্যাঙ্গারু", emoji: "🦘", tags: ["wild", "speed"] },
      { id: "koala", label: "Koala", labelBn: "কোয়ালা", emoji: "🐨", tags: ["cute", "nature"] },
      { id: "panda", label: "Panda", labelBn: "পান্ডা", emoji: "🐼", tags: ["cute", "nature"] },
      { id: "moose", label: "Moose", labelBn: "মুস", emoji: "🫎", tags: ["cold", "wild"] },
      { id: "hedgehog", label: "Hedgehog", labelBn: "কাঁটাচুয়া", emoji: "🦔", tags: ["cute", "nature"] },
      { id: "squirrel", label: "Squirrel", labelBn: "কাঠবিড়ালি", emoji: "🐿️", tags: ["clever", "nature"] },
      { id: "sloth", label: "Sloth", labelBn: "স্লথ", emoji: "🦥", tags: ["slow", "cute"] },
      { id: "raccoon", label: "Raccoon", labelBn: "র্যাকুন", emoji: "🦝", tags: ["clever", "night"] },
      { id: "armadillo", label: "Armadillo", labelBn: "আর্মাডিলো", emoji: "🐾", tags: ["armored", "nature"] },
      { id: "otter", label: "Otter", labelBn: "ভোঁদড়", emoji: "🦦", tags: ["cute", "sea"] },
      { id: "warthog", label: "Warthog", labelBn: "ওয়ার্থগ", emoji: "🐗", tags: ["wild", "nature"] },
      { id: "wild_boar", label: "Wild Boar", labelBn: "বন্য শূকর", emoji: "🐗", tags: ["wild", "battle"] },
    ],
  },
  // ---- প্রাণী: প্রাইমেট ----
  {
    id: "animal_primate", title: "Primates", titleBn: "🐵 প্রাইমেট", icon: "🐵", step: 0,
    options: [
      { id: "chimpanzee", label: "Chimpanzee", labelBn: "শিম্পাঞ্জি", emoji: "🐵", tags: ["clever", "pack"] },
      { id: "orangutan", label: "Orangutan", labelBn: "ওরাংওটান", emoji: "🦧", tags: ["wise", "solitary"] },
      { id: "lemur", label: "Lemur", labelBn: "লেমুর", emoji: "🐒", tags: ["strange", "nature"] },
      { id: "baboon", label: "Baboon", labelBn: "বেবুন", emoji: "🐒", tags: ["wild", "pack"] },
      { id: "gibbon", label: "Gibbon", labelBn: "গিবন", emoji: "🐒", tags: ["speed", "nature"] },
      { id: "mandrill", label: "Mandrill", labelBn: "ম্যান্ড্রিল", emoji: "🐒", tags: ["color", "wild"] },
      { id: "capuchin", label: "Capuchin", labelBn: "কাপুচিন", emoji: "🐒", tags: ["clever", "cute"] },
      { id: "tarsier", label: "Tarsier", labelBn: "টার্সিয়ার", emoji: "🐒", tags: ["night", "strange"] },
    ],
  },
  // ---- প্রাণী: গৃহপালিত / খামার ----
  {
    id: "animal_farm", title: "Farm Animals", titleBn: "🐄 খামারের প্রাণী", icon: "🐄", step: 0,
    options: [
      { id: "cow", label: "Cow / Bull", labelBn: "গরু / ষাঁড়", emoji: "🐄", tags: ["farm", "nature"] },
      { id: "sheep", label: "Sheep / Lamb", labelBn: "ভেড়া", emoji: "🐑", tags: ["gentle", "farm"] },
      { id: "goat", label: "Goat", labelBn: "ছাগল", emoji: "🐐", tags: ["farm", "nature"] },
      { id: "pig", label: "Pig", labelBn: "শূকর", emoji: "🐖", tags: ["farm", "clever"] },
      { id: "donkey", label: "Donkey / Mule", labelBn: "গাধা", emoji: "🫏", tags: ["farm", "nature"] },
      { id: "chicken", label: "Chicken / Rooster", labelBn: "মুরগি / মোরগ", emoji: "🐓", tags: ["farm", "nature"] },
      { id: "duck", label: "Duck / Goose", labelBn: "হাঁস", emoji: "🦆", tags: ["farm", "nature"] },
      { id: "turkey", label: "Turkey", labelBn: "টার্কি", emoji: "🦃", tags: ["farm", "nature"] },
      { id: "llama", label: "Llama / Alpaca", labelBn: "লামা / আলপাকা", emoji: "🦙", tags: ["gentle", "nature"] },
      { id: "yak", label: "Yak", labelBn: "ইয়াক", emoji: "🐃", tags: ["cold", "nature"] },
    ],
  },
  // ---- প্রাণী: আর্কটিক / মেরু ----
  {
    id: "animal_arctic", title: "Arctic & Polar", titleBn: "🐻‍❄️ আর্কটিক প্রাণী", icon: "🐻‍❄️", step: 0,
    options: [
      { id: "polar_bear", label: "Polar Bear", labelBn: "মেরু ভালুক", emoji: "🐻‍❄️", tags: ["cold", "wild"] },
      { id: "arctic_fox", label: "Arctic Fox", labelBn: "আর্কটিক শেয়াল", emoji: "🦊", tags: ["cold", "stealth"] },
      { id: "snowy_owl", label: "Snowy Owl", labelBn: "তুষার পেঁচা", emoji: "🦉", tags: ["cold", "night"] },
      { id: "reindeer", label: "Reindeer / Caribou", labelBn: "রেইনডিয়ার", emoji: "🦌", tags: ["cold", "nature"] },
      { id: "emperor_penguin", label: "Emperor Penguin", labelBn: "সম্রাট পেঙ্গুইন", emoji: "🐧", tags: ["cold", "pack"] },
      { id: "arctic_hare", label: "Arctic Hare", labelBn: "আর্কটিক খরগোশ", emoji: "🐇", tags: ["cold", "speed"] },
      { id: "musk_ox", label: "Musk Ox", labelBn: "মাস্ক অক্স", emoji: "🐃", tags: ["cold", "battle"] },
      { id: "beluga", label: "Beluga Whale", labelBn: "বেলুগা তিমি", emoji: "🐋", tags: ["cold", "sea"] },
      { id: "snow_leopard_arc", label: "Snow Leopard", labelBn: "তুষার চিতা", emoji: "🐆", tags: ["cold", "stealth"] },
      { id: "seal_arctic", label: "Harp Seal", labelBn: "হার্প সীল", emoji: "🦭", tags: ["cold", "cute"] },
    ],
  },
  // ---- প্রাণী: প্রাগৈতিহাসিক ----
  {
    id: "animal_prehistoric", title: "Prehistoric", titleBn: "🦕 প্রাগৈতিহাসিক প্রাণী", icon: "🦕", step: 0,
    options: [
      { id: "trex", label: "T-Rex", labelBn: "টি-রেক্স", emoji: "🦖", tags: ["dinosaur"] },
      { id: "raptor", label: "Velociraptor", labelBn: "ভেলোসিরেপ্টর", emoji: "🦎", tags: ["dinosaur", "pack"] },
      { id: "mammoth", label: "Mammoth", labelBn: "ম্যামথ", emoji: "🦣", tags: ["ice_age"] },
      { id: "sabertooth", label: "Sabertooth", labelBn: "স্যাবারটুথ", emoji: "🐯", tags: ["ice_age"] },
      { id: "pterodactyl", label: "Pterodactyl", labelBn: "টেরোড্যাক্টিল", emoji: "🦅", tags: ["dinosaur", "sky"] },
      { id: "megalodon", label: "Megalodon", labelBn: "মেগালোডন", emoji: "🦷", tags: ["prehistoric", "sea"] },
      { id: "triceratops", label: "Triceratops", labelBn: "ট্রাইসেরাটপস", emoji: "🦏", tags: ["dinosaur"] },
      { id: "brachiosaurus", label: "Brachiosaurus", labelBn: "ব্র্যাকিওসরাস", emoji: "🦕", tags: ["dinosaur", "gentle"] },
      { id: "stegosaurus", label: "Stegosaurus", labelBn: "স্টেগোসরাস", emoji: "🦕", tags: ["dinosaur"] },
      { id: "spinosaurus", label: "Spinosaurus", labelBn: "স্পাইনোসরাস", emoji: "🦖", tags: ["dinosaur", "sea"] },
    ],
  },
  // ---- প্রাণী: অদ্ভুত ও কাল্পনিক ----
  {
    id: "animal_strange", title: "Strange Creatures", titleBn: "🧬 অদ্ভুত প্রাণী", icon: "🧬", step: 0,
    options: [
      { id: "chimera", label: "Chimera / Hybrid", labelBn: "কাইমেরা", emoji: "🧬", tags: ["mythic", "strange"] },
      { id: "bioluminescent", label: "Bioluminescent", labelBn: "জৈবআলো প্রাণী", emoji: "✨", tags: ["alien", "sea"] },
      { id: "symbiotic", label: "Symbiotic", labelBn: "সিম্বায়োটিক", emoji: "🔗", tags: ["strange"] },
      { id: "armored", label: "Armored Beast", labelBn: "বর্মযুক্ত", emoji: "🛡️", tags: ["battle"] },
      { id: "parasite", label: "Parasitic", labelBn: "পরজীবী", emoji: "🦠", tags: ["horror", "strange"] },
      { id: "swarm", label: "Swarm Intelligence", labelBn: "ঝাঁক বুদ্ধিমত্তা", emoji: "🐝", tags: ["alien", "strange"] },
      { id: "shapeshifter", label: "Shapeshifter", labelBn: "রূপবদল", emoji: "🎭", tags: ["mythic", "strange"] },
      { id: "kaiju", label: "Kaiju / Giant", labelBn: "কাইজু / দৈত্য", emoji: "🦖", tags: ["epic", "battle"] },
      { id: "mutant", label: "Mutant", labelBn: "মিউট্যান্ট", emoji: "☣️", tags: ["strange", "dark"] },
    ],
  },
  // ---- মানুষ ও সম্পর্ক ----
  {
    id: "human_drama", title: "Human Characters", titleBn: "👥 মানুষ ও সম্পর্ক", icon: "👥", step: 0,
    options: [
      { id: "family_bond", label: "Family", labelBn: "পরিবার", emoji: "👨‍👩‍👧‍👦", tags: ["emotion", "safe"] },
      { id: "parent_child", label: "Parent-Child", labelBn: "মা-বাবা ও সন্তান", emoji: "🤱", tags: ["emotion", "safe"] },
      { id: "love_story", label: "Love Story", labelBn: "প্রেমের গল্প", emoji: "💕", tags: ["romance"] },
      { id: "betrayal", label: "Betrayal", labelBn: "বিশ্বাসঘাতকতা", emoji: "🗡️", tags: ["dark", "twist"] },
      { id: "rivalry", label: "Rivalry", labelBn: "প্রতিদ্বন্দ্বিতা", emoji: "🥊", tags: ["tension"] },
      { id: "orphan", label: "Orphan", labelBn: "অনাথ", emoji: "🥺", tags: ["sorrow", "emotion"] },
      { id: "refugee", label: "Refugee", labelBn: "শরণার্থী", emoji: "🏚️", tags: ["social", "emotion"] },
      { id: "coming_of_age", label: "Coming of Age", labelBn: "বেড়ে ওঠা", emoji: "🌱", tags: ["growth"] },
      { id: "old_age", label: "Old Age", labelBn: "বার্ধক্য", emoji: "👴", tags: ["sorrow", "emotion"] },
      { id: "disability", label: "Resilience", labelBn: "সহনশীলতা", emoji: "💪", tags: ["inspire"] },
      { id: "twins", label: "Twins", labelBn: "যমজ", emoji: "👯", tags: ["bond", "twist"] },
      { id: "stranger", label: "Stranger", labelBn: "অপরিচিত", emoji: "🕴️", tags: ["mystery"] },
    ],
  },
  // ---- পেশা ও ভূমিকা ----
  {
    id: "human_profession", title: "Profession & Role", titleBn: "👔 পেশা ও ভূমিকা", icon: "👔", step: 0,
    options: [
      { id: "soldier", label: "Soldier", labelBn: "সৈনিক", emoji: "🪖", tags: ["battle", "honor"] },
      { id: "doctor", label: "Doctor", labelBn: "ডাক্তার", emoji: "🩺", tags: ["save", "emotion"] },
      { id: "scientist", label: "Scientist", labelBn: "বিজ্ঞানী", emoji: "🔬", tags: ["clever", "future"] },
      { id: "teacher", label: "Teacher", labelBn: "শিক্ষক", emoji: "📚", tags: ["wise", "emotion"] },
      { id: "farmer", label: "Farmer", labelBn: "কৃষক", emoji: "👨‍🌾", tags: ["nature", "simple"] },
      { id: "thief", label: "Thief / Assassin", labelBn: "চোর / ঘাতক", emoji: "🥷", tags: ["stealth", "dark"] },
      { id: "king", label: "King / Queen", labelBn: "রাজা / রানী", emoji: "👑", tags: ["power", "ancient"] },
      { id: "priest", label: "Priest / Monk", labelBn: "পুরোহিত / সন্ন্যাসী", emoji: "🙏", tags: ["sacred", "wise"] },
      { id: "detective", label: "Detective", labelBn: "গোয়েন্দা", emoji: "🕵️", tags: ["mystery", "clever"] },
      { id: "pilot", label: "Pilot", labelBn: "পাইলট", emoji: "✈️", tags: ["sky", "modern"] },
      { id: "explorer", label: "Explorer", labelBn: "অভিযাত্রী", emoji: "🧭", tags: ["adventure"] },
      { id: "artist", label: "Artist", labelBn: "শিল্পী", emoji: "🎨", tags: ["art", "emotion"] },
    ],
  },
  // ---- চরিত্রের ধরন ----
  {
    id: "character_arch", title: "Character Archetype", titleBn: "🎭 চরিত্রের ধরন", icon: "🎭", step: 0,
    options: [
      { id: "hero", label: "Hero", labelBn: "নায়ক", emoji: "🦸", tags: ["inspire"] },
      { id: "villain", label: "Villain", labelBn: "খলনায়ক", emoji: "🦹", tags: ["dark"] },
      { id: "anti_hero", label: "Anti-Hero", labelBn: "অ্যান্টি-হিরো", emoji: "😎", tags: ["complex"] },
      { id: "mentor", label: "Mentor", labelBn: "গুরু", emoji: "🧙", tags: ["wise"] },
      { id: "child", label: "Innocent Child", labelBn: "নিষ্পাপ শিশু", emoji: "👶", tags: ["pure", "emotion"] },
      { id: "trickster", label: "Trickster", labelBn: "ধূর্ত", emoji: "🃏", tags: ["chaos"] },
      { id: "lone_wolf", label: "Lone Wolf", labelBn: "একা নেকড়ে", emoji: "🐺", tags: ["solitary"] },
      { id: "mother", label: "Mother / Protector", labelBn: "মা / রক্ষাকর্তা", emoji: "🛡️", tags: ["emotion", "safe"] },
      { id: "fallen", label: "Fallen / Corrupted", labelBn: "পতিত", emoji: "😈", tags: ["dark", "tragic"] },
      { id: "chosen_one", label: "Chosen One", labelBn: "নির্বাচিত", emoji: "⭐", tags: ["mythic", "epic"] },
      { id: "outcast", label: "Outcast", labelBn: "বহিষ্কৃত", emoji: "🚪", tags: ["sorrow", "complex"] },
    ],
  },
  // ---- পৌরাণিক ও ফ্যান্টাসি ----
  {
    id: "mythology", title: "Mythology & Fantasy", titleBn: "🐉 পৌরাণিক ও ফ্যান্টাসি", icon: "🐉", step: 0,
    options: [
      { id: "dragon", label: "Dragon", labelBn: "ড্রাগন", emoji: "🐉", tags: ["mythic", "epic"] },
      { id: "gods", label: "Gods", labelBn: "দেবতা", emoji: "⚡", tags: ["mythic", "cosmic"] },
      { id: "titan", label: "Titan / Giant", labelBn: "টাইটান / দৈত্য", emoji: "🗿", tags: ["mythic", "epic"] },
      { id: "phoenix", label: "Phoenix", labelBn: "ফিনিক্স", emoji: "🔥", tags: ["mythic", "hope"] },
      { id: "unicorn", label: "Unicorn", labelBn: "ইউনিকর্ন", emoji: "🦄", tags: ["mythic", "pure"] },
      { id: "werewolf", label: "Werewolf", labelBn: "ওয়্যারউলফ", emoji: "🐺", tags: ["horror", "mythic"] },
      { id: "fairy", label: "Fairy / Elf", labelBn: "পরী / এলফ", emoji: "🧚", tags: ["mythic", "nature"] },
      { id: "golem", label: "Golem", labelBn: "গোলেম", emoji: "🗿", tags: ["mythic"] },
      { id: "mermaid", label: "Mermaid", labelBn: "মৎস্যকন্যা", emoji: "🧜", tags: ["mythic", "sea"] },
      { id: "minotaur", label: "Minotaur", labelBn: "মিনোটর", emoji: "🐂", tags: ["mythic", "battle"] },
      { id: "kraken", label: "Kraken", labelBn: "ক্র্যাকেন", emoji: "🐙", tags: ["mythic", "sea"] },
      { id: "leviathan", label: "Leviathan", labelBn: "লেভিয়াথান", emoji: "🌊", tags: ["mythic", "sea"] },
      { id: "angel", label: "Angel", labelBn: "দেবদূত", emoji: "😇", tags: ["sacred", "mythic"] },
      { id: "demon_myth", label: "Demon Lord", labelBn: "রাক্ষস রাজ", emoji: "👿", tags: ["dark", "mythic"] },
      { id: "sea_serpent", label: "Sea Serpent", labelBn: "সামুদ্রিক সর্প", emoji: "🐉", tags: ["mythic", "sea"] },
    ],
  },
  // ---- সাই-ফাই ও প্রযুক্তি ----
  {
    id: "scifi", title: "Sci-Fi & Tech", titleBn: "🤖 সাই-ফাই ও প্রযুক্তি", icon: "🤖", step: 0,
    options: [
      { id: "ai_sentience", label: "AI", labelBn: "কৃত্রিম চেতনা", emoji: "🤖", tags: ["future", "philosophy"] },
      { id: "space_travel", label: "Space Travel", labelBn: "মহাকাশ যাত্রা", emoji: "🚀", tags: ["cosmic", "epic"] },
      { id: "cyborg", label: "Cyborg", labelBn: "সাইবর্গ", emoji: "🦾", tags: ["future", "body"] },
      { id: "time_travel", label: "Time Travel", labelBn: "সময় ভ্রমণ", emoji: "⏰", tags: ["paradox", "twist"] },
      { id: "simulation", label: "Simulation", labelBn: "সিমুলেশন", emoji: "💻", tags: ["philosophy"] },
      { id: "alien_contact", label: "Alien", labelBn: "ভিনগ্রহী", emoji: "👽", tags: ["cosmic", "mystery"] },
      { id: "dystopia", label: "Dystopia", labelBn: "ডিসটোপিয়া", emoji: "🏗️", tags: ["dark", "social"] },
      { id: "mech_suit", label: "Mech / Robot War", labelBn: "রোবট যুদ্ধ", emoji: "🤖", tags: ["battle", "future"] },
      { id: "clone", label: "Clone", labelBn: "ক্লোন", emoji: "👥", tags: ["future", "philosophy"] },
      { id: "nanotech", label: "Nanotech", labelBn: "ন্যানো প্রযুক্তি", emoji: "🔬", tags: ["future", "tech"] },
      { id: "space_station", label: "Space Station", labelBn: "স্পেস স্টেশন", emoji: "🛸", tags: ["cosmic", "future"] },
      { id: "virtual_reality", label: "Virtual Reality", labelBn: "ভার্চুয়াল রিয়ালিটি", emoji: "🥽", tags: ["future", "tech"] },
    ],
  },
  // ---- যানবাহন ও মেশিন ----
  {
    id: "vehicle", title: "Vehicles & Machines", titleBn: "🚗 যানবাহন ও মেশিন", icon: "🚗", step: 0,
    options: [
      { id: "car_race", label: "Race Car", labelBn: "রেসিং কার", emoji: "🏎️", tags: ["speed", "modern"] },
      { id: "motorcycle", label: "Motorcycle", labelBn: "মোটরসাইকেল", emoji: "🏍️", tags: ["speed", "wild"] },
      { id: "tank", label: "Tank", labelBn: "ট্যাংক", emoji: "🪖", tags: ["battle", "modern"] },
      { id: "spaceship", label: "Spaceship", labelBn: "মহাকাশযান", emoji: "🚀", tags: ["cosmic", "future"] },
      { id: "submarine", label: "Submarine", labelBn: "সাবমেরিন", emoji: "🛥️", tags: ["sea", "modern"] },
      { id: "helicopter", label: "Helicopter", labelBn: "হেলিকপ্টার", emoji: "🚁", tags: ["sky", "modern"] },
      { id: "fighter_jet", label: "Fighter Jet", labelBn: "যুদ্ধ বিমান", emoji: "✈️", tags: ["battle", "sky"] },
      { id: "ship", label: "Ship / Warship", labelBn: "জাহাজ", emoji: "🚢", tags: ["sea", "battle"] },
      { id: "train", label: "Train", labelBn: "ট্রেন", emoji: "🚂", tags: ["speed", "modern"] },
      { id: "truck", label: "Truck", labelBn: "ট্রাক", emoji: "🚛", tags: ["power", "modern"] },
      { id: "bicycle", label: "Bicycle", labelBn: "সাইকেল", emoji: "🚲", tags: ["simple", "safe"] },
      { id: "drone_machine", label: "Drone", labelBn: "ড্রোন", emoji: "🛸", tags: ["future", "tech"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║              STEP 1: কী ঘটবে? (অ্যাকশন/ঘটনা)               ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- যুদ্ধ ও লড়াই ----
  {
    id: "animal_combat", title: "Combat & Battle", titleBn: "⚔️ যুদ্ধ ও লড়াই", icon: "⚔️", step: 1,
    options: [
      { id: "territorial", label: "Territorial Fight", labelBn: "এলাকার লড়াই", emoji: "🏔️", tags: ["battle"] },
      { id: "mating_battle", label: "Mating Battle", labelBn: "সঙ্গী দখল", emoji: "💪", tags: ["battle"] },
      { id: "predator_prey", label: "Predator vs Prey", labelBn: "শিকারী বনাম শিকার", emoji: "🎯", tags: ["chase", "battle"] },
      { id: "pack_hunt", label: "Pack Hunting", labelBn: "দলবদ্ধ শিকার", emoji: "🐺", tags: ["pack", "battle"] },
      { id: "apex_clash", label: "Apex Clash", labelBn: "শীর্ষ সংঘর্ষ", emoji: "💥", tags: ["epic", "battle"] },
      { id: "survival", label: "Last Stand", labelBn: "শেষ রক্ষা", emoji: "🔥", tags: ["drama", "battle"] },
      { id: "ambush", label: "Ambush", labelBn: "অতর্কিত আক্রমণ", emoji: "🎪", tags: ["stealth", "battle"] },
      { id: "siege", label: "Siege", labelBn: "অবরোধ", emoji: "🏰", tags: ["battle", "epic"] },
      { id: "duel", label: "One-on-One Duel", labelBn: "একক দ্বন্দ্ব", emoji: "🤺", tags: ["battle", "honor"] },
      { id: "arena", label: "Arena Fight", labelBn: "এরিনা লড়াই", emoji: "🏟️", tags: ["battle", "epic"] },
    ],
  },
  // ---- উদ্ধার ও বেঁচে থাকা ----
  {
    id: "rescue_survival", title: "Rescue & Survival", titleBn: "🆘 উদ্ধার ও বেঁচে থাকা", icon: "🆘", step: 1,
    options: [
      { id: "rescue_mission", label: "Rescue Mission", labelBn: "উদ্ধার অভিযান", emoji: "🚨", tags: ["tension", "hope"] },
      { id: "escape", label: "Escape", labelBn: "পলায়ন", emoji: "🏃", tags: ["chase", "tension"] },
      { id: "natural_disaster", label: "Natural Disaster", labelBn: "প্রাকৃতিক দুর্যোগ", emoji: "🌪️", tags: ["epic", "nature"] },
      { id: "stranded", label: "Stranded / Lost", labelBn: "নির্বাসিত", emoji: "🏝️", tags: ["solitary", "tension"] },
      { id: "famine", label: "Famine / Drought", labelBn: "দুর্ভিক্ষ", emoji: "🏜️", tags: ["dark", "nature"] },
      { id: "pandemic", label: "Pandemic", labelBn: "মহামারী", emoji: "🦠", tags: ["dark", "modern"] },
      { id: "flood", label: "Flood", labelBn: "বন্যা", emoji: "🌊", tags: ["nature", "epic"] },
      { id: "earthquake", label: "Earthquake", labelBn: "ভূমিকম্প", emoji: "🫨", tags: ["nature", "epic"] },
      { id: "volcano_eruption", label: "Volcano Eruption", labelBn: "আগ্নেয়গিরি বিস্ফোরণ", emoji: "🌋", tags: ["fire", "epic"] },
      { id: "shipwreck", label: "Shipwreck", labelBn: "জাহাজডুবি", emoji: "🚢", tags: ["sea", "drama"] },
    ],
  },
  // ---- অভিযান ও আবিষ্কার ----
  {
    id: "adventure", title: "Adventure & Discovery", titleBn: "🧭 অভিযান ও আবিষ্কার", icon: "🧭", step: 1,
    options: [
      { id: "treasure_hunt", label: "Treasure Hunt", labelBn: "ধনসন্ধান", emoji: "💎", tags: ["adventure", "mystery"] },
      { id: "expedition", label: "Expedition", labelBn: "অভিযান", emoji: "🏔️", tags: ["adventure", "epic"] },
      { id: "first_contact", label: "First Contact", labelBn: "প্রথম সংযোগ", emoji: "👽", tags: ["cosmic", "mystery"] },
      { id: "migration", label: "Migration", labelBn: "পরিযান", emoji: "🦢", tags: ["nature", "journey"] },
      { id: "voyage", label: "Voyage", labelBn: "সমুদ্রযাত্রা", emoji: "⛵", tags: ["sea", "adventure"] },
      { id: "underground_exp", label: "Underground Exploration", labelBn: "ভূগর্ভ অন্বেষণ", emoji: "🕳️", tags: ["dark", "mystery"] },
      { id: "lost_civilization", label: "Lost Civilization", labelBn: "হারানো সভ্যতা", emoji: "🏛️", tags: ["ancient", "mystery"] },
      { id: "space_exploration", label: "Space Exploration", labelBn: "মহাকাশ অন্বেষণ", emoji: "🌌", tags: ["cosmic", "adventure"] },
    ],
  },
  // ---- হরর ও অতিপ্রাকৃত ----
  {
    id: "horror", title: "Horror & Supernatural", titleBn: "👻 হরর ও অতিপ্রাকৃত", icon: "👻", step: 1,
    options: [
      { id: "ghost", label: "Ghost", labelBn: "ভূত / আত্মা", emoji: "👻", tags: ["supernatural"] },
      { id: "demon", label: "Demon", labelBn: "দানব", emoji: "😈", tags: ["supernatural", "dark"] },
      { id: "curse", label: "Curse", labelBn: "অভিশাপ", emoji: "🧿", tags: ["supernatural", "dark"] },
      { id: "zombie", label: "Zombie", labelBn: "জম্বি", emoji: "🧟", tags: ["horror"] },
      { id: "body_horror", label: "Body Horror", labelBn: "শারীরিক বিকৃতি", emoji: "🫠", tags: ["horror", "strange"] },
      { id: "psychological", label: "Psychological", labelBn: "মনস্তাত্ত্বিক আতঙ্ক", emoji: "🧠", tags: ["dark", "mind"] },
      { id: "cult", label: "Cult / Occult", labelBn: "গুপ্ত সংঘ", emoji: "🕯️", tags: ["dark", "mystery"] },
      { id: "eldritch", label: "Lovecraftian", labelBn: "এলড্রিচ", emoji: "🌀", tags: ["cosmic", "dark"] },
      { id: "haunted", label: "Haunted Place", labelBn: "ভুতুড়ে জায়গা", emoji: "🏚️", tags: ["supernatural", "tension"] },
      { id: "possession", label: "Possession", labelBn: "ভূতে পাওয়া", emoji: "😱", tags: ["supernatural", "horror"] },
      { id: "nightmare", label: "Nightmare", labelBn: "দুঃস্বপ্ন", emoji: "😰", tags: ["dark", "mind"] },
    ],
  },
  // ---- যুদ্ধ ও ইতিহাস ----
  {
    id: "war_history", title: "War & History", titleBn: "🏛️ যুদ্ধ ও ইতিহাস", icon: "🏛️", step: 1,
    options: [
      { id: "empire", label: "Empire", labelBn: "সাম্রাজ্য", emoji: "👑", tags: ["ancient", "power"] },
      { id: "revolution", label: "Revolution", labelBn: "বিপ্লব", emoji: "✊", tags: ["social", "battle"] },
      { id: "world_war", label: "World War", labelBn: "বিশ্বযুদ্ধ", emoji: "💣", tags: ["modern", "battle"] },
      { id: "samurai", label: "Samurai", labelBn: "সামুরাই", emoji: "⚔️", tags: ["ancient", "honor"] },
      { id: "viking", label: "Viking", labelBn: "ভাইকিং", emoji: "🪓", tags: ["ancient", "wild"] },
      { id: "gladiator", label: "Gladiator", labelBn: "গ্ল্যাডিয়েটর", emoji: "🏟️", tags: ["ancient", "battle"] },
      { id: "pirate", label: "Pirate", labelBn: "জলদস্যু", emoji: "🏴‍☠️", tags: ["adventure", "sea"] },
      { id: "colonialism", label: "Resistance", labelBn: "প্রতিরোধ", emoji: "🏴", tags: ["social", "dark"] },
      { id: "civil_war", label: "Civil War", labelBn: "গৃহযুদ্ধ", emoji: "⚔️", tags: ["battle", "dark"] },
      { id: "cold_war", label: "Cold War / Spy", labelBn: "স্নায়ুযুদ্ধ / গুপ্তচর", emoji: "🕵️", tags: ["modern", "mystery"] },
      { id: "crusade", label: "Crusade", labelBn: "ক্রুসেড", emoji: "⚔️", tags: ["ancient", "sacred"] },
    ],
  },
  // ---- সামাজিক সমস্যা ----
  {
    id: "social_issue", title: "Social Issues", titleBn: "✊ সামাজিক সমস্যা", icon: "✊", step: 1,
    options: [
      { id: "poverty", label: "Poverty", labelBn: "দারিদ্র্য", emoji: "💔", tags: ["social", "emotion"] },
      { id: "corruption", label: "Corruption", labelBn: "দুর্নীতি", emoji: "💰", tags: ["dark", "social"] },
      { id: "discrimination", label: "Discrimination", labelBn: "বৈষম্য", emoji: "🚫", tags: ["social", "dark"] },
      { id: "freedom_fight", label: "Freedom Fight", labelBn: "স্বাধীনতা সংগ্রাম", emoji: "🗽", tags: ["inspire", "battle"] },
      { id: "environmental", label: "Environmental Crisis", labelBn: "পরিবেশ সংকট", emoji: "🌍", tags: ["nature", "social"] },
      { id: "migration_crisis", label: "Migration Crisis", labelBn: "অভিবাসন সংকট", emoji: "🚶", tags: ["social", "sorrow"] },
      { id: "child_labor", label: "Child Labor", labelBn: "শিশু শ্রম", emoji: "👧", tags: ["social", "sorrow"] },
      { id: "addiction", label: "Addiction", labelBn: "আসক্তি", emoji: "💊", tags: ["dark", "emotion"] },
    ],
  },
  // ---- ভাইরাল হুক ----
  {
    id: "viral_hook", title: "Viral Hook", titleBn: "🪝 ভাইরাল হুক", icon: "🪝", step: 1,
    options: [
      { id: "emotional_shock", label: "Emotional Shock", labelBn: "আবেগীয় শক", emoji: "😱", tags: ["emotion"] },
      { id: "curiosity_gap", label: "Curiosity Gap", labelBn: "কৌতূহল ফাঁদ", emoji: "🤔", tags: ["mystery"] },
      { id: "visual_spectacle", label: "Visual Spectacle", labelBn: "দৃশ্যগত বিস্ময়", emoji: "🤩", tags: ["epic"] },
      { id: "contrast", label: "Extreme Contrast", labelBn: "চরম বৈপরীত্য", emoji: "⚫", tags: ["twist"] },
      { id: "forbidden", label: "Forbidden", labelBn: "নিষিদ্ধ", emoji: "🚫", tags: ["dark"] },
      { id: "cuteness_overload", label: "Cuteness", labelBn: "কিউটনেস", emoji: "🥰", tags: ["cute", "safe"] },
      { id: "justice", label: "Justice / Karma", labelBn: "ন্যায়বিচার", emoji: "⚖️", tags: ["moral"] },
      { id: "underdog", label: "Underdog Victory", labelBn: "দুর্বলের জয়", emoji: "🏆", tags: ["inspire"] },
      { id: "what_if", label: "What If?", labelBn: "যদি হতো?", emoji: "❓", tags: ["philosophy", "twist"] },
      { id: "before_after", label: "Before & After", labelBn: "আগে ও পরে", emoji: "🔄", tags: ["twist"] },
      { id: "countdown", label: "Countdown", labelBn: "কাউন্টডাউন", emoji: "⏱️", tags: ["tension"] },
      { id: "size_comparison", label: "Size Comparison", labelBn: "আকার তুলনা", emoji: "📏", tags: ["epic", "viral"] },
    ],
  },
  // ---- খেলাধুলা ও প্রতিযোগিতা ----
  {
    id: "sports_competition", title: "Sports & Competition", titleBn: "🏆 খেলাধুলা ও প্রতিযোগিতা", icon: "🏆", step: 1,
    options: [
      { id: "race", label: "Race", labelBn: "দৌড়/রেস", emoji: "🏁", tags: ["speed", "tension"] },
      { id: "tournament", label: "Tournament", labelBn: "টুর্নামেন্ট", emoji: "🏆", tags: ["battle", "epic"] },
      { id: "extreme_sport", label: "Extreme Sport", labelBn: "এক্সট্রিম স্পোর্ট", emoji: "🪂", tags: ["wild", "speed"] },
      { id: "martial_arts", label: "Martial Arts", labelBn: "মার্শাল আর্ট", emoji: "🥋", tags: ["battle", "honor"] },
      { id: "olympic", label: "Olympic", labelBn: "অলিম্পিক", emoji: "🥇", tags: ["inspire", "epic"] },
      { id: "wrestling", label: "Wrestling", labelBn: "কুস্তি", emoji: "🤼", tags: ["battle"] },
      { id: "chess_game", label: "Strategic Game", labelBn: "কৌশলগত খেলা", emoji: "♟️", tags: ["clever", "mind"] },
      { id: "survival_game", label: "Survival Game", labelBn: "সারভাইভাল গেম", emoji: "🎮", tags: ["tension", "dark"] },
    ],
  },
  // ---- প্রাণীর আচরণ ----
  {
    id: "animal_behavior", title: "Animal Behaviors", titleBn: "🦁 প্রাণীর আচরণ", icon: "🦁", step: 1,
    options: [
      { id: "migration_journey", label: "Migration", labelBn: "পরিযান", emoji: "🦢", tags: ["journey", "nature"] },
      { id: "nesting", label: "Nesting / Breeding", labelBn: "বাসা তৈরি / প্রজনন", emoji: "🪺", tags: ["nature", "safe"] },
      { id: "hibernation", label: "Hibernation", labelBn: "শীতনিদ্রা", emoji: "💤", tags: ["cold", "nature"] },
      { id: "mating_dance", label: "Mating Dance", labelBn: "সঙ্গী আকর্ষণ", emoji: "💃", tags: ["beauty", "nature"] },
      { id: "foraging", label: "Foraging", labelBn: "খাদ্য সন্ধান", emoji: "🔍", tags: ["nature", "simple"] },
      { id: "camouflage", label: "Camouflage", labelBn: "ছদ্মবেশ", emoji: "🦎", tags: ["stealth", "nature"] },
      { id: "stampede", label: "Stampede", labelBn: "পাল ছুটে চলা", emoji: "🐃", tags: ["speed", "epic"] },
      { id: "nurturing", label: "Mother Nurturing", labelBn: "মা-সন্তান যত্ন", emoji: "🤱", tags: ["emotion", "safe"] },
      { id: "play_fight", label: "Play Fighting", labelBn: "খেলার লড়াই", emoji: "🐾", tags: ["cute", "nature"] },
      { id: "scavenging", label: "Scavenging", labelBn: "মৃতভোজী", emoji: "🦅", tags: ["wild", "dark"] },
      { id: "symbiosis", label: "Symbiosis", labelBn: "সহজীবন", emoji: "🤝", tags: ["nature", "strange"] },
      { id: "territorial_mark", label: "Marking Territory", labelBn: "এলাকা চিহ্নিত", emoji: "🏷️", tags: ["wild", "nature"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║              STEP 2: কোথায় ও কখন? (পটভূমি)                ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- লক্ষ্য দর্শক ----
  {
    id: "target_audience", title: "Target Audience", titleBn: "🎯 লক্ষ্য দর্শক", icon: "🎯", step: 2,
    options: [
      { id: "usa", label: "USA", labelBn: "আমেরিকান", emoji: "🇺🇸", tags: ["western", "viral"] },
      { id: "global_viral", label: "Global Viral", labelBn: "গ্লোবাল ভাইরাল", emoji: "🌐", tags: ["viral"] },
      { id: "south_asia", label: "South Asian", labelBn: "দক্ষিণ এশীয়", emoji: "🇮🇳", tags: ["regional"] },
      { id: "european", label: "European", labelBn: "ইউরোপীয়", emoji: "🇪🇺", tags: ["western"] },
      { id: "middle_east", label: "Middle East", labelBn: "মধ্যপ্রাচ্য", emoji: "🕌", tags: ["regional"] },
      { id: "east_asia", label: "East Asian", labelBn: "পূর্ব এশীয়", emoji: "🇯🇵", tags: ["regional"] },
      { id: "african", label: "African", labelBn: "আফ্রিকান", emoji: "🌍", tags: ["regional"] },
      { id: "latin_america", label: "Latin American", labelBn: "ল্যাটিন আমেরিকান", emoji: "🌎", tags: ["regional"] },
      { id: "gen_z", label: "Gen Z", labelBn: "জেন Z", emoji: "📱", tags: ["young", "viral"] },
      { id: "gen_alpha", label: "Gen Alpha / Kids", labelBn: "শিশু", emoji: "🧒", tags: ["young"] },
      { id: "cinephile", label: "Cinephile", labelBn: "সিনেফিল", emoji: "🎬", tags: ["niche"] },
      { id: "family", label: "Family", labelBn: "পারিবারিক", emoji: "👨‍👩‍👧", tags: ["safe"] },
    ],
  },
  // ---- যুগ / সময় ----
  {
    id: "era", title: "Era / Time", titleBn: "⏳ যুগ / সময়", icon: "⏳", step: 2,
    options: [
      { id: "prehistoric", label: "Prehistoric", labelBn: "প্রাগৈতিহাসিক", emoji: "🦕", tags: ["ancient"] },
      { id: "ancient", label: "Ancient Civilization", labelBn: "প্রাচীন সভ্যতা", emoji: "🏛️", tags: ["ancient"] },
      { id: "medieval", label: "Medieval", labelBn: "মধ্যযুগ", emoji: "🏰", tags: ["ancient"] },
      { id: "renaissance", label: "Renaissance", labelBn: "রেনেসাঁ", emoji: "🎨", tags: ["ancient", "art"] },
      { id: "industrial", label: "Industrial", labelBn: "শিল্প বিপ্লব", emoji: "🏭", tags: ["modern"] },
      { id: "colonial", label: "Colonial Era", labelBn: "ঔপনিবেশিক যুগ", emoji: "⛵", tags: ["ancient", "dark"] },
      { id: "world_war_era", label: "World War Era", labelBn: "বিশ্বযুদ্ধ কাল", emoji: "💣", tags: ["modern", "battle"] },
      { id: "cold_war_era", label: "Cold War", labelBn: "স্নায়ুযুদ্ধ কাল", emoji: "🧊", tags: ["modern"] },
      { id: "modern", label: "Modern", labelBn: "আধুনিক", emoji: "🏙️", tags: ["modern"] },
      { id: "near_future", label: "Near Future", labelBn: "নিকট ভবিষ্যৎ", emoji: "🔮", tags: ["future"] },
      { id: "far_future", label: "Far Future", labelBn: "সুদূর ভবিষ্যৎ", emoji: "🌌", tags: ["future", "cosmic"] },
      { id: "post_apocalypse", label: "Post-Apocalyptic", labelBn: "সর্বনাশের পর", emoji: "☢️", tags: ["dark", "future"] },
      { id: "timeless", label: "Timeless", labelBn: "কালোত্তীর্ণ", emoji: "♾️", tags: ["surreal"] },
    ],
  },
  // ---- প্রাকৃতিক পরিবেশ ----
  {
    id: "biome_natural", title: "Natural Environment", titleBn: "🌿 প্রাকৃতিক পরিবেশ", icon: "🌿", step: 2,
    options: [
      { id: "jungle", label: "Dense Jungle", labelBn: "ঘন জঙ্গল", emoji: "🌴", tags: ["wild", "nature"] },
      { id: "desert", label: "Desert", labelBn: "মরুভূমি", emoji: "🏜️", tags: ["harsh"] },
      { id: "arctic", label: "Arctic / Ice", labelBn: "হিমশীতল", emoji: "❄️", tags: ["cold", "harsh"] },
      { id: "ocean", label: "Open Ocean", labelBn: "খোলা সমুদ্র", emoji: "🌊", tags: ["sea"] },
      { id: "ocean_floor", label: "Ocean Abyss", labelBn: "সমুদ্র তলদেশ", emoji: "🐚", tags: ["sea", "dark"] },
      { id: "volcanic", label: "Volcanic", labelBn: "আগ্নেয়গিরি", emoji: "🌋", tags: ["fire", "harsh"] },
      { id: "mountain", label: "Mountains", labelBn: "পাহাড়", emoji: "🏔️", tags: ["nature", "epic"] },
      { id: "river_delta", label: "River / Delta", labelBn: "নদী / ব-দ্বীপ", emoji: "🏞️", tags: ["nature"] },
      { id: "savannah", label: "Savannah", labelBn: "সাভানা তৃণভূমি", emoji: "🌾", tags: ["wild", "nature"] },
      { id: "swamp", label: "Swamp / Marsh", labelBn: "জলাভূমি", emoji: "🐊", tags: ["dark", "nature"] },
      { id: "island", label: "Island", labelBn: "দ্বীপ", emoji: "🏝️", tags: ["solitary", "nature"] },
      { id: "forest", label: "Deep Forest", labelBn: "গভীর বন", emoji: "🌲", tags: ["nature", "dark"] },
      { id: "cave", label: "Underground / Cave", labelBn: "গুহা / ভূগর্ভ", emoji: "🕳️", tags: ["dark", "mystery"] },
      { id: "waterfall", label: "Waterfall", labelBn: "জলপ্রপাত", emoji: "💧", tags: ["nature", "beauty"] },
      { id: "tundra", label: "Tundra", labelBn: "তুন্দ্রা", emoji: "🧊", tags: ["cold", "harsh"] },
      { id: "mangrove", label: "Mangrove Forest", labelBn: "ম্যানগ্রোভ / সুন্দরবন", emoji: "🌳", tags: ["sea", "nature"] },
      { id: "coral_reef_biome", label: "Coral Reef", labelBn: "প্রবাল প্রাচীর", emoji: "🪸", tags: ["sea", "color"] },
      { id: "bamboo_forest", label: "Bamboo Forest", labelBn: "বাঁশবন", emoji: "🎋", tags: ["nature", "peaceful"] },
      { id: "steppe", label: "Steppe / Prairie", labelBn: "স্তেপ / প্রেইরি", emoji: "🌾", tags: ["wild", "nature"] },
      { id: "glacier", label: "Glacier", labelBn: "হিমবাহ", emoji: "🏔️", tags: ["cold", "epic"] },
      { id: "rainforest", label: "Rainforest", labelBn: "রেইনফরেস্ট", emoji: "🌧️", tags: ["wild", "nature"] },
      { id: "tide_pool", label: "Tide Pool", labelBn: "জোয়ারের পুল", emoji: "🦀", tags: ["sea", "nature"] },
    ],
  },
  // ---- নির্মিত পরিবেশ ----
  {
    id: "biome_built", title: "Built Environment", titleBn: "🏙️ নির্মিত পরিবেশ", icon: "🏙️", step: 2,
    options: [
      { id: "mega_city", label: "Mega City", labelBn: "মেগা সিটি", emoji: "🌃", tags: ["future", "modern"] },
      { id: "slum", label: "Slum / Shanty", labelBn: "বস্তি", emoji: "🏚️", tags: ["dark", "social"] },
      { id: "palace", label: "Palace / Castle", labelBn: "রাজপ্রাসাদ", emoji: "🏰", tags: ["ancient", "power"] },
      { id: "prison", label: "Prison", labelBn: "কারাগার", emoji: "🔒", tags: ["dark", "tension"] },
      { id: "hospital", label: "Hospital", labelBn: "হাসপাতাল", emoji: "🏥", tags: ["emotion", "modern"] },
      { id: "school", label: "School", labelBn: "স্কুল", emoji: "🏫", tags: ["safe", "growth"] },
      { id: "temple", label: "Temple / Church", labelBn: "মন্দির / গির্জা", emoji: "⛪", tags: ["sacred", "ancient"] },
      { id: "factory", label: "Factory", labelBn: "কারখানা", emoji: "🏭", tags: ["modern", "dark"] },
      { id: "laboratory", label: "Laboratory", labelBn: "গবেষণাগার", emoji: "🔬", tags: ["future", "tech"] },
      { id: "abandoned", label: "Abandoned Building", labelBn: "পরিত্যক্ত ভবন", emoji: "🏗️", tags: ["dark", "mystery"] },
      { id: "market", label: "Market / Bazaar", labelBn: "বাজার", emoji: "🏪", tags: ["modern", "simple"] },
      { id: "village", label: "Village", labelBn: "প্রত্যন্ত গ্রাম", emoji: "🏘️", tags: ["peaceful", "nature"] },
    ],
  },
  // ---- মহাকাশ ও অন্যান্য জগৎ ----
  {
    id: "biome_cosmic", title: "Cosmic & Other Worlds", titleBn: "🌌 মহাকাশ ও অন্য জগৎ", icon: "🌌", step: 2,
    options: [
      { id: "outer_space", label: "Outer Space", labelBn: "মহাকাশ", emoji: "🌠", tags: ["cosmic"] },
      { id: "alien_planet", label: "Alien Planet", labelBn: "ভিনগ্রহ", emoji: "🪐", tags: ["cosmic", "alien"] },
      { id: "parallel_universe", label: "Parallel Universe", labelBn: "সমান্তরাল মহাবিশ্ব", emoji: "🔮", tags: ["surreal", "cosmic"] },
      { id: "dream_world", label: "Dream World", labelBn: "স্বপ্নের জগৎ", emoji: "💭", tags: ["surreal"] },
      { id: "afterlife", label: "Afterlife", labelBn: "পরকাল", emoji: "☁️", tags: ["sacred", "mythic"] },
      { id: "spirit_world", label: "Spirit World", labelBn: "আত্মার জগৎ", emoji: "👻", tags: ["supernatural"] },
      { id: "sky_floating", label: "Sky / Floating", labelBn: "আকাশ / ভাসমান", emoji: "☁️", tags: ["mythic", "epic"] },
      { id: "virtual_world", label: "Virtual World", labelBn: "ভার্চুয়াল জগৎ", emoji: "🎮", tags: ["future", "tech"] },
      { id: "micro_world", label: "Microscopic World", labelBn: "ক্ষুদ্র জগৎ", emoji: "🔬", tags: ["strange", "alien"] },
      { id: "black_hole", label: "Black Hole", labelBn: "ব্ল্যাক হোল", emoji: "🕳️", tags: ["cosmic", "dark"] },
    ],
  },
  // ---- জগতের মূল প্রকৃতি ----
  {
    id: "core_nature", title: "World Essence", titleBn: "🔮 জগতের মূল প্রকৃতি", icon: "🔮", step: 2,
    options: [
      { id: "mechanical", label: "Mechanical", labelBn: "যান্ত্রিক", emoji: "⚙️", tags: ["tech"] },
      { id: "surreal", label: "Surreal", labelBn: "স্বপ্নীল", emoji: "🎭", tags: ["strange", "art"] },
      { id: "organic", label: "Organic / Living", labelBn: "জীবন্ত", emoji: "🌱", tags: ["nature"] },
      { id: "cosmic", label: "Cosmic", labelBn: "মহাজাগতিক", emoji: "🌌", tags: ["cosmic", "epic"] },
      { id: "primal", label: "Primal / Raw", labelBn: "আদিম", emoji: "🪨", tags: ["wild"] },
      { id: "digital", label: "Digital", labelBn: "ডিজিটাল", emoji: "💾", tags: ["tech", "future"] },
      { id: "ethereal", label: "Ethereal", labelBn: "ভৌতিক", emoji: "👻", tags: ["supernatural"] },
      { id: "brutal", label: "Brutal", labelBn: "নৃশংস", emoji: "💀", tags: ["dark", "battle"] },
      { id: "sacred", label: "Sacred", labelBn: "পবিত্র", emoji: "🙏", tags: ["mythic", "pure"] },
      { id: "chaotic", label: "Chaotic", labelBn: "বিশৃঙ্খল", emoji: "🌪️", tags: ["chaos", "wild"] },
      { id: "peaceful", label: "Peaceful / Zen", labelBn: "শান্তিময়", emoji: "🕊️", tags: ["peaceful"] },
    ],
  },
  // ---- আবহাওয়া ও আলো ----
  {
    id: "weather_light", title: "Weather & Light", titleBn: "🌤️ আবহাওয়া ও আলো", icon: "🌤️", step: 2,
    options: [
      { id: "storm", label: "Storm", labelBn: "ঝড়", emoji: "⛈️", tags: ["epic", "nature"] },
      { id: "rain", label: "Heavy Rain", labelBn: "মুষলধারে বৃষ্টি", emoji: "🌧️", tags: ["nature", "emotion"] },
      { id: "fog", label: "Dense Fog", labelBn: "ঘন কুয়াশা", emoji: "🌫️", tags: ["mystery", "dark"] },
      { id: "snow", label: "Snowfall", labelBn: "তুষারপাত", emoji: "❄️", tags: ["cold", "peaceful"] },
      { id: "sunset", label: "Sunset / Sunrise", labelBn: "সূর্যাস্ত / সূর্যোদয়", emoji: "🌅", tags: ["beauty", "peaceful"] },
      { id: "night", label: "Moonlit Night", labelBn: "জ্যোৎস্নার রাত", emoji: "🌙", tags: ["dark", "peaceful"] },
      { id: "eclipse", label: "Eclipse", labelBn: "গ্রহণ", emoji: "🌑", tags: ["mythic", "dark"] },
      { id: "aurora", label: "Aurora / Northern Lights", labelBn: "মেরুজ্যোতি", emoji: "🌌", tags: ["beauty", "cosmic"] },
      { id: "sandstorm", label: "Sandstorm", labelBn: "বালিঝড়", emoji: "🌪️", tags: ["desert", "harsh"] },
      { id: "lightning", label: "Lightning", labelBn: "বিদ্যুৎ চমক", emoji: "⚡", tags: ["epic", "nature"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║              STEP 6: কেমন অনুভূতি? (আবেগ/মুড)              ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- মূল আবেগ ----
  {
    id: "emotion", title: "Core Emotion", titleBn: "💔 মূল আবেগ", icon: "💔", step: 6,
    options: [
      { id: "deep_sorrow", label: "Deep Sorrow", labelBn: "গভীর বিষাদ", emoji: "😢", tags: ["sorrow"] },
      { id: "existential", label: "Existential", labelBn: "অস্তিত্বের লড়াই", emoji: "🤯", tags: ["philosophy"] },
      { id: "primal_fear", label: "Primal Fear", labelBn: "আদিম ভয়", emoji: "😨", tags: ["horror"] },
      { id: "wonder", label: "Awe & Wonder", labelBn: "বিস্ময়", emoji: "🤩", tags: ["inspire"] },
      { id: "rage", label: "Rage", labelBn: "ক্রোধ", emoji: "🤬", tags: ["battle"] },
      { id: "serenity", label: "Peace", labelBn: "প্রশান্তি", emoji: "😌", tags: ["peaceful"] },
      { id: "loneliness", label: "Loneliness", labelBn: "একাকীত্ব", emoji: "😔", tags: ["sorrow"] },
      { id: "sacrifice", label: "Sacrifice", labelBn: "আত্মত্যাগ", emoji: "🙏", tags: ["emotion", "moral"] },
      { id: "defiance", label: "Defiance", labelBn: "বিদ্রোহ", emoji: "✊", tags: ["battle", "social"] },
      { id: "hope", label: "Hope", labelBn: "আশা", emoji: "🌅", tags: ["inspire", "hope"] },
      { id: "nostalgia", label: "Nostalgia", labelBn: "নস্টালজিয়া", emoji: "🎞️", tags: ["sorrow", "peaceful"] },
      { id: "guilt", label: "Guilt", labelBn: "অপরাধবোধ", emoji: "😞", tags: ["dark", "emotion"] },
      { id: "joy", label: "Joy", labelBn: "আনন্দ", emoji: "😄", tags: ["happy", "safe"] },
      { id: "jealousy", label: "Jealousy", labelBn: "ঈর্ষা", emoji: "😤", tags: ["dark", "emotion"] },
      { id: "gratitude", label: "Gratitude", labelBn: "কৃতজ্ঞতা", emoji: "🥹", tags: ["emotion", "pure"] },
      { id: "despair", label: "Despair", labelBn: "হতাশা", emoji: "😩", tags: ["dark", "sorrow"] },
      { id: "ecstasy", label: "Ecstasy", labelBn: "পরম আনন্দ", emoji: "🤤", tags: ["happy", "epic"] },
      { id: "confusion", label: "Confusion", labelBn: "বিভ্রান্তি", emoji: "😵", tags: ["mind", "strange"] },
    ],
  },
  // ---- গল্পের উপাদান ----
  {
    id: "narrative", title: "Story Element", titleBn: "📖 গল্পের উপাদান", icon: "📖", step: 6,
    options: [
      { id: "twist", label: "Plot Twist", labelBn: "প্লট টুইস্ট", emoji: "🔄", tags: ["twist"] },
      { id: "tragedy", label: "Tragedy", labelBn: "ট্র্যাজেডি", emoji: "💔", tags: ["sorrow", "dark"] },
      { id: "redemption", label: "Redemption", labelBn: "মুক্তির আর্ক", emoji: "🌅", tags: ["hope", "growth"] },
      { id: "mystery", label: "Mystery", labelBn: "রহস্য", emoji: "🔍", tags: ["mystery"] },
      { id: "cycle", label: "Cycle of Life", labelBn: "জীবন চক্র", emoji: "♻️", tags: ["nature", "philosophy"] },
      { id: "forbidden_bond", label: "Forbidden Bond", labelBn: "নিষিদ্ধ বন্ধন", emoji: "🚫", tags: ["romance", "dark"] },
      { id: "prophecy", label: "Prophecy", labelBn: "ভবিষ্যদ্বাণী", emoji: "🔮", tags: ["mythic"] },
      { id: "revenge", label: "Revenge", labelBn: "প্রতিশোধ", emoji: "⚔️", tags: ["dark", "battle"] },
      { id: "transformation", label: "Transformation", labelBn: "রূপান্তর", emoji: "🦋", tags: ["growth", "strange"] },
      { id: "parallel", label: "Parallel Stories", labelBn: "সমান্তরাল গল্প", emoji: "📎", tags: ["complex"] },
      { id: "cliffhanger", label: "Cliffhanger", labelBn: "ক্লিফহ্যাঙ্গার", emoji: "😱", tags: ["tension", "twist"] },
      { id: "flashback", label: "Flashback", labelBn: "ফ্ল্যাশব্যাক", emoji: "⏪", tags: ["complex"] },
      { id: "sacrifice_arc", label: "Sacrifice Arc", labelBn: "আত্মত্যাগের গল্প", emoji: "💀", tags: ["emotion", "dark"] },
      { id: "rise_fall", label: "Rise & Fall", labelBn: "উত্থান ও পতন", emoji: "📈", tags: ["drama", "complex"] },
      { id: "moral_dilemma", label: "Moral Dilemma", labelBn: "নৈতিক দ্বিধা", emoji: "⚖️", tags: ["philosophy", "complex"] },
    ],
  },
  // ---- ঘরানা / টোন ----
  {
    id: "genre", title: "Genre / Tone", titleBn: "🎬 ঘরানা / টোন", icon: "🎬", step: 6,
    options: [
      { id: "thriller", label: "Thriller", labelBn: "থ্রিলার", emoji: "😰", tags: ["tension"] },
      { id: "romance", label: "Romance", labelBn: "রোমান্স", emoji: "💕", tags: ["romance"] },
      { id: "comedy_dark", label: "Dark Comedy", labelBn: "ডার্ক কমেডি", emoji: "🤡", tags: ["humor", "dark"] },
      { id: "epic", label: "Epic", labelBn: "মহাকাব্যিক", emoji: "🏔️", tags: ["epic"] },
      { id: "noir", label: "Noir / Crime", labelBn: "নোয়ার", emoji: "🕵️", tags: ["dark", "modern"] },
      { id: "fairy_tale", label: "Fairy Tale", labelBn: "রূপকথা", emoji: "🏰", tags: ["mythic", "safe"] },
      { id: "documentary", label: "Documentary", labelBn: "ডকুমেন্টারি", emoji: "📹", tags: ["realistic"] },
      { id: "musical", label: "Musical", labelBn: "মিউজিক্যাল", emoji: "🎵", tags: ["art"] },
      { id: "satire", label: "Satire", labelBn: "ব্যঙ্গ", emoji: "🎭", tags: ["humor", "social"] },
      { id: "western", label: "Western", labelBn: "ওয়েস্টার্ন", emoji: "🤠", tags: ["wild", "modern"] },
      { id: "anime_style", label: "Anime Style", labelBn: "এনিমে স্টাইল", emoji: "🎌", tags: ["art", "young"] },
      { id: "folk_tale", label: "Folk Tale", labelBn: "লোকগল্প", emoji: "📜", tags: ["ancient", "safe"] },
      { id: "psychological_drama", label: "Psychological Drama", labelBn: "মনস্তাত্ত্বিক নাটক", emoji: "🧠", tags: ["mind", "complex"] },
      { id: "action", label: "Pure Action", labelBn: "খাঁটি অ্যাকশন", emoji: "💥", tags: ["battle", "speed"] },
    ],
  },
  // ---- থিম ও বার্তা ----
  {
    id: "theme_message", title: "Theme & Message", titleBn: "💡 থিম ও বার্তা", icon: "💡", step: 6,
    options: [
      { id: "good_vs_evil", label: "Good vs Evil", labelBn: "ভালো বনাম মন্দ", emoji: "⚔️", tags: ["moral", "battle"] },
      { id: "survival_fittest", label: "Survival of Fittest", labelBn: "যোগ্যতমের টিকে থাকা", emoji: "🦁", tags: ["wild", "dark"] },
      { id: "power_corrupts", label: "Power Corrupts", labelBn: "ক্ষমতা দুর্নীতি আনে", emoji: "👑", tags: ["dark", "social"] },
      { id: "love_conquers", label: "Love Conquers", labelBn: "ভালোবাসা জয়ী হয়", emoji: "❤️", tags: ["romance", "hope"] },
      { id: "nature_vs_tech", label: "Nature vs Technology", labelBn: "প্রকৃতি বনাম প্রযুক্তি", emoji: "🌿", tags: ["nature", "tech"] },
      { id: "identity", label: "Identity", labelBn: "পরিচয় সন্ধান", emoji: "🪞", tags: ["philosophy", "growth"] },
      { id: "freedom", label: "Freedom", labelBn: "স্বাধীনতা", emoji: "🗽", tags: ["inspire", "social"] },
      { id: "death_rebirth", label: "Death & Rebirth", labelBn: "মৃত্যু ও পুনর্জন্ম", emoji: "🔄", tags: ["mythic", "philosophy"] },
      { id: "forgiveness", label: "Forgiveness", labelBn: "ক্ষমা", emoji: "🕊️", tags: ["pure", "emotion"] },
      { id: "greed", label: "Greed", labelBn: "লোভ", emoji: "💰", tags: ["dark", "moral"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║              STEP 7: দেখতে কেমন হবে? (ভিজ্যুয়াল)          ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- ভিজ্যুয়াল স্টাইল ----
  {
    id: "visual_style", title: "Visual Style", titleBn: "👁️ ভিজ্যুয়াল স্টাইল", icon: "👁️", step: 7,
    options: [
      { id: "hyperreal", label: "Hyper-Realistic", labelBn: "হাইপার-রিয়ালিস্টিক", emoji: "📸", tags: ["realistic"] },
      { id: "chiaroscuro", label: "Chiaroscuro", labelBn: "অন্ধকার-আলো", emoji: "🌓", tags: ["dark", "art"] },
      { id: "epic_scale", label: "Epic Wide", labelBn: "বিশাল স্কেল", emoji: "🏔️", tags: ["epic"] },
      { id: "intimate", label: "Intimate Close-up", labelBn: "অন্তরঙ্গ ক্লোজ-আপ", emoji: "👁️", tags: ["emotion"] },
      { id: "film_noir", label: "Film Noir", labelBn: "ফিল্ম নোয়ার", emoji: "🖤", tags: ["dark", "art"] },
      { id: "golden_hour", label: "Golden Hour", labelBn: "গোল্ডেন আওয়ার", emoji: "🌅", tags: ["peaceful"] },
      { id: "monochrome", label: "Monochrome", labelBn: "মনোক্রোম", emoji: "🔘", tags: ["art"] },
      { id: "neon_glow", label: "Neon / Cyberpunk", labelBn: "নিওন সাইবারপাঙ্ক", emoji: "💜", tags: ["future", "modern"] },
      { id: "watercolor", label: "Watercolor", labelBn: "ওয়াটারকালার", emoji: "🎨", tags: ["art", "soft"] },
      { id: "oil_painting", label: "Oil Painting", labelBn: "তেলচিত্র", emoji: "🖼️", tags: ["art", "ancient"] },
      { id: "pixel_art", label: "Pixel Art", labelBn: "পিক্সেল আর্ট", emoji: "🕹️", tags: ["retro", "art"] },
      { id: "3d_render", label: "3D Render", labelBn: "থ্রিডি রেন্ডার", emoji: "💎", tags: ["future", "tech"] },
      { id: "anime_visual", label: "Anime Visual", labelBn: "এনিমে ভিজ্যুয়াল", emoji: "🎌", tags: ["art", "young"] },
      { id: "stop_motion", label: "Stop Motion", labelBn: "স্টপ মোশন", emoji: "🧸", tags: ["art", "cute"] },
      { id: "sketch", label: "Sketch / Line Art", labelBn: "স্কেচ", emoji: "✏️", tags: ["art", "simple"] },
      { id: "collage", label: "Collage / Mixed Media", labelBn: "কোলাজ", emoji: "📰", tags: ["art", "strange"] },
      { id: "nature_doc", label: "Nature Documentary", labelBn: "প্রকৃতি ডকুমেন্টারি", emoji: "📹", tags: ["nature", "realistic"] },
      { id: "thermal_vision", label: "Thermal Vision", labelBn: "থার্মাল ভিশন", emoji: "🌡️", tags: ["tech", "strange"] },
      { id: "night_vision", label: "Night Vision", labelBn: "নাইট ভিশন", emoji: "🌙", tags: ["dark", "tech"] },
      { id: "macro_photo", label: "Macro Photography", labelBn: "ম্যাক্রো ফটোগ্রাফি", emoji: "🔬", tags: ["nature", "art"] },
      { id: "aerial_view", label: "Aerial / Satellite", labelBn: "বায়বীয় / স্যাটেলাইট", emoji: "🛰️", tags: ["epic", "tech"] },
      { id: "vintage_film", label: "Vintage Film", labelBn: "ভিনটেজ ফিল্ম", emoji: "🎞️", tags: ["retro", "art"] },
    ],
  },
  // ---- রঙ প্যালেট ----
  {
    id: "color_palette", title: "Color Palette", titleBn: "🎨 রঙ প্যালেট", icon: "🎨", step: 7,
    options: [
      { id: "dark_moody", label: "Dark & Moody", labelBn: "গাঢ় ও মুডি", emoji: "🖤", tags: ["dark"] },
      { id: "warm_golden", label: "Warm Golden", labelBn: "উষ্ণ সোনালি", emoji: "🟡", tags: ["peaceful"] },
      { id: "cool_blue", label: "Cool Blue", labelBn: "শীতল নীল", emoji: "🔵", tags: ["cold", "peaceful"] },
      { id: "blood_red", label: "Blood Red", labelBn: "রক্ত লাল", emoji: "🔴", tags: ["dark", "battle"] },
      { id: "earth_tone", label: "Earth Tones", labelBn: "মাটির রঙ", emoji: "🟤", tags: ["nature"] },
      { id: "vibrant_pop", label: "Vibrant Pop", labelBn: "উজ্জ্বল পপ", emoji: "🌈", tags: ["color", "happy"] },
      { id: "pastel", label: "Soft Pastel", labelBn: "নরম প্যাস্টেল", emoji: "🩷", tags: ["soft", "safe"] },
      { id: "desaturated", label: "Desaturated / Muted", labelBn: "ফ্যাকাশে", emoji: "🩶", tags: ["art", "sorrow"] },
      { id: "neon_electric", label: "Neon Electric", labelBn: "নিওন ইলেক্ট্রিক", emoji: "⚡", tags: ["future", "color"] },
      { id: "black_white", label: "Black & White", labelBn: "সাদা-কালো", emoji: "⬛", tags: ["art", "classic"] },
      { id: "gradient_sunset", label: "Sunset Gradient", labelBn: "সূর্যাস্তের গ্রেডিয়েন্ট", emoji: "🌇", tags: ["beauty", "color"] },
    ],
  },
  // ---- শব্দ ও মুড ----
  {
    id: "sound_mood", title: "Sound & Music", titleBn: "🔊 শব্দ ও সংগীত", icon: "🔊", step: 7,
    options: [
      { id: "silence", label: "Deep Silence", labelBn: "গভীর নীরবতা", emoji: "🤫", tags: ["tension", "peaceful"] },
      { id: "heavy_breath", label: "Heavy Breathing", labelBn: "ভারী নিঃশ্বাস", emoji: "😮‍💨", tags: ["tension", "intimate"] },
      { id: "orchestral", label: "Orchestral / Epic", labelBn: "অর্কেস্ট্রাল", emoji: "🎻", tags: ["epic"] },
      { id: "ambient", label: "Nature Sounds", labelBn: "প্রাকৃতিক শব্দ", emoji: "🌿", tags: ["nature"] },
      { id: "heartbeat", label: "Heartbeat", labelBn: "হৃদস্পন্দন", emoji: "💓", tags: ["tension", "intimate"] },
      { id: "industrial_noise", label: "Industrial", labelBn: "শিল্পজাত শব্দ", emoji: "🏗️", tags: ["dark", "tech"] },
      { id: "whisper", label: "Whisper / ASMR", labelBn: "ফিসফিস", emoji: "🗣️", tags: ["intimate"] },
      { id: "war_drums", label: "War Drums", labelBn: "যুদ্ধের ঢোল", emoji: "🥁", tags: ["battle", "primal"] },
      { id: "electronic", label: "Electronic / Synth", labelBn: "ইলেক্ট্রনিক", emoji: "🎹", tags: ["future", "modern"] },
      { id: "chanting", label: "Chanting / Choir", labelBn: "মন্ত্রোচ্চারণ", emoji: "🎶", tags: ["sacred", "epic"] },
      { id: "folk_music", label: "Folk Music", labelBn: "লোকসংগীত", emoji: "🪕", tags: ["ancient", "emotion"] },
      { id: "hip_hop", label: "Hip Hop / Trap", labelBn: "হিপ-হপ / ট্র্যাপ", emoji: "🎤", tags: ["modern", "young"] },
      { id: "piano_solo", label: "Piano Solo", labelBn: "পিয়ানো সলো", emoji: "🎹", tags: ["emotion", "art"] },
      { id: "heavy_metal", label: "Heavy Metal / Rock", labelBn: "হেভি মেটাল", emoji: "🎸", tags: ["battle", "wild"] },
    ],
  },
  // ---- ক্যামেরা কৌশল ----
  {
    id: "camera", title: "Camera Technique", titleBn: "📷 ক্যামেরা কৌশল", icon: "📷", step: 7,
    options: [
      { id: "one_shot", label: "One Shot", labelBn: "একটানা শট", emoji: "🎬", tags: ["dramatic"] },
      { id: "pov", label: "POV / First Person", labelBn: "POV", emoji: "👀", tags: ["intimate"] },
      { id: "drone", label: "Drone / Aerial", labelBn: "ড্রোন", emoji: "🚁", tags: ["epic"] },
      { id: "handheld", label: "Handheld", labelBn: "হ্যান্ডহেল্ড", emoji: "📱", tags: ["realistic", "tension"] },
      { id: "tracking", label: "Tracking Shot", labelBn: "ট্র্যাকিং শট", emoji: "🎥", tags: ["dramatic"] },
      { id: "macro", label: "Macro", labelBn: "ম্যাক্রো ক্লোজ", emoji: "🔬", tags: ["intimate", "strange"] },
      { id: "timelapse", label: "Timelapse", labelBn: "টাইমল্যাপস", emoji: "⏩", tags: ["epic", "nature"] },
      { id: "split_screen", label: "Split Screen", labelBn: "স্প্লিট স্ক্রিন", emoji: "📐", tags: ["complex"] },
      { id: "slow_motion", label: "Slow Motion", labelBn: "স্লো মোশন", emoji: "🐌", tags: ["dramatic"] },
      { id: "zoom_crash", label: "Crash Zoom", labelBn: "ক্র্যাশ জুম", emoji: "🔭", tags: ["tension", "dramatic"] },
      { id: "dolly_zoom", label: "Dolly Zoom", labelBn: "ডলি জুম", emoji: "😵", tags: ["strange", "dramatic"] },
      { id: "steadicam", label: "Steadicam", labelBn: "স্টেডিক্যাম", emoji: "🎥", tags: ["dramatic"] },
      { id: "underwater_cam", label: "Underwater Camera", labelBn: "পানির নিচের ক্যামেরা", emoji: "🤿", tags: ["sea"] },
      { id: "360_cam", label: "360° Camera", labelBn: "৩৬০° ক্যামেরা", emoji: "🔄", tags: ["epic", "immersive"] },
    ],
  },
  // ---- ভিজ্যুয়াল ইফেক্ট ----
  {
    id: "vfx", title: "Visual Effects", titleBn: "✨ ভিজ্যুয়াল ইফেক্ট", icon: "✨", step: 7,
    options: [
      { id: "particle", label: "Particle Effects", labelBn: "পার্টিকেল ইফেক্ট", emoji: "✨", tags: ["epic", "art"] },
      { id: "fire_vfx", label: "Fire / Explosion", labelBn: "আগুন / বিস্ফোরণ", emoji: "🔥", tags: ["battle", "epic"] },
      { id: "water_vfx", label: "Water / Splash", labelBn: "পানির ইফেক্ট", emoji: "💧", tags: ["sea", "nature"] },
      { id: "smoke_fog", label: "Smoke / Fog", labelBn: "ধোঁয়া / কুয়াশা", emoji: "🌫️", tags: ["dark", "mystery"] },
      { id: "glitch", label: "Glitch Effect", labelBn: "গ্লিচ ইফেক্ট", emoji: "📺", tags: ["tech", "strange"] },
      { id: "motion_blur", label: "Motion Blur", labelBn: "মোশন ব্লার", emoji: "💨", tags: ["speed"] },
      { id: "lens_flare", label: "Lens Flare", labelBn: "লেন্স ফ্লেয়ার", emoji: "☀️", tags: ["epic", "beauty"] },
      { id: "hologram", label: "Hologram", labelBn: "হলোগ্রাম", emoji: "🔮", tags: ["future", "tech"] },
      { id: "morphing", label: "Morphing", labelBn: "মর্ফিং", emoji: "🔄", tags: ["strange", "art"] },
      { id: "miniature", label: "Miniature / Tilt-shift", labelBn: "মিনিয়েচার", emoji: "🔍", tags: ["art", "cute"] },
    ],
  },
  // ---- ট্রানজিশন ----
  {
    id: "transition", title: "Transitions", titleBn: "🔀 ট্রানজিশন", icon: "🔀", step: 7,
    options: [
      { id: "cut_hard", label: "Hard Cut", labelBn: "হার্ড কাট", emoji: "✂️", tags: ["tension", "speed"] },
      { id: "dissolve", label: "Dissolve", labelBn: "ডিজলভ", emoji: "🌊", tags: ["peaceful", "art"] },
      { id: "whip_pan", label: "Whip Pan", labelBn: "হুইপ প্যান", emoji: "💨", tags: ["speed", "dramatic"] },
      { id: "match_cut", label: "Match Cut", labelBn: "ম্যাচ কাট", emoji: "🔗", tags: ["clever", "art"] },
      { id: "fade_black", label: "Fade to Black", labelBn: "ফেড টু ব্ল্যাক", emoji: "⬛", tags: ["dark", "dramatic"] },
      { id: "zoom_transition", label: "Zoom Transition", labelBn: "জুম ট্রানজিশন", emoji: "🔭", tags: ["speed", "epic"] },
      { id: "morph_transition", label: "Morph Transition", labelBn: "মর্ফ ট্রানজিশন", emoji: "🔄", tags: ["art", "strange"] },
      { id: "jump_cut", label: "Jump Cut", labelBn: "জাম্প কাট", emoji: "⏭️", tags: ["modern", "speed"] },
    ],
  },
  // ---- আলোকসজ্জা কৌশল ----
  {
    id: "lighting", title: "Lighting Technique", titleBn: "💡 আলোকসজ্জা কৌশল", icon: "💡", step: 7,
    options: [
      { id: "rembrandt", label: "Rembrandt Lighting", labelBn: "রেমব্র্যান্ট লাইটিং", emoji: "🎨", tags: ["art", "dramatic"] },
      { id: "silhouette", label: "Silhouette", labelBn: "সিলুয়েট", emoji: "🌅", tags: ["dramatic", "dark"] },
      { id: "rim_light", label: "Rim Light", labelBn: "রিম লাইট", emoji: "✨", tags: ["dramatic", "epic"] },
      { id: "natural_light", label: "Natural Light", labelBn: "প্রাকৃতিক আলো", emoji: "☀️", tags: ["nature", "realistic"] },
      { id: "candlelight", label: "Candlelight", labelBn: "মোমবাতির আলো", emoji: "🕯️", tags: ["intimate", "ancient"] },
      { id: "neon_lighting", label: "Neon Lighting", labelBn: "নিওন লাইটিং", emoji: "💜", tags: ["future", "color"] },
      { id: "strobe", label: "Strobe / Flash", labelBn: "স্ট্রোব / ফ্ল্যাশ", emoji: "⚡", tags: ["tension", "modern"] },
      { id: "bioluminescence", label: "Bioluminescence", labelBn: "জৈব আলো", emoji: "🌊", tags: ["alien", "sea"] },
      { id: "backlight", label: "Backlight", labelBn: "ব্যাকলাইট", emoji: "🌄", tags: ["dramatic", "beauty"] },
      { id: "volumetric", label: "Volumetric / God Rays", labelBn: "ভলিউমেট্রিক রে", emoji: "🌥️", tags: ["epic", "sacred"] },
      { id: "low_key", label: "Low Key", labelBn: "লো-কি লাইটিং", emoji: "🖤", tags: ["dark", "dramatic"] },
      { id: "high_key", label: "High Key", labelBn: "হাই-কি লাইটিং", emoji: "⬜", tags: ["bright", "safe"] },
      { id: "moonlight", label: "Moonlight", labelBn: "চাঁদের আলো", emoji: "🌙", tags: ["night", "peaceful"] },
      { id: "fire_light", label: "Firelight", labelBn: "আগুনের আলো", emoji: "🔥", tags: ["primal", "ancient"] },
    ],
  },
  // ---- অ্যাসপেক্ট রেশিও / ফর্ম্যাট ----
  {
    id: "aspect_format", title: "Aspect Ratio & Format", titleBn: "📐 অ্যাসপেক্ট রেশিও", icon: "📐", step: 7,
    options: [
      { id: "vertical_916", label: "9:16 (Shorts/Reels)", labelBn: "৯:১৬ শর্টস/রিলস", emoji: "📱", tags: ["young", "viral"] },
      { id: "cinematic_219", label: "21:9 Cinematic", labelBn: "২১:৯ সিনেমাটিক", emoji: "🎬", tags: ["epic", "art"] },
      { id: "widescreen_169", label: "16:9 Widescreen", labelBn: "১৬:৯ ওয়াইডস্ক্রিন", emoji: "🖥️", tags: ["modern"] },
      { id: "square_11", label: "1:1 Square", labelBn: "১:১ স্কয়ার", emoji: "⬜", tags: ["modern", "viral"] },
      { id: "imax", label: "IMAX (1.43:1)", labelBn: "আইম্যাক্স", emoji: "🎥", tags: ["epic", "immersive"] },
      { id: "portrait_34", label: "3:4 Portrait", labelBn: "৩:৪ পোর্ট্রেট", emoji: "📷", tags: ["intimate"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║        STEP 0 ADDITIONS: নতুন Entity ক্যাটেগরি              ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- উদ্ভিদ ও ফ্লোরা ----
  {
    id: "plants_flora", title: "Plants & Flora", titleBn: "🌿 উদ্ভিদ ও ফ্লোরা", icon: "🌿", step: 0,
    options: [
      { id: "carnivorous_plant", label: "Carnivorous Plant", labelBn: "মাংসাশী উদ্ভিদ", emoji: "🪴", tags: ["strange", "wild"] },
      { id: "giant_tree", label: "Giant Tree / Baobab", labelBn: "মহীরুহ / বাওবাব", emoji: "🌳", tags: ["ancient", "epic"] },
      { id: "flower", label: "Flower / Bloom", labelBn: "ফুল / প্রস্ফুটন", emoji: "🌸", tags: ["beauty", "nature"] },
      { id: "vine_creeper", label: "Vine / Creeper", labelBn: "লতা / গুল্ম", emoji: "🌿", tags: ["nature", "stealth"] },
      { id: "mangrove_root", label: "Mangrove Roots", labelBn: "ম্যানগ্রোভ শিকড়", emoji: "🌴", tags: ["sea", "nature"] },
      { id: "mushroom_fungi", label: "Mushroom / Fungi", labelBn: "মাশরুম / ছত্রাক", emoji: "🍄", tags: ["strange", "nature"] },
      { id: "cactus", label: "Cactus", labelBn: "ক্যাকটাস", emoji: "🌵", tags: ["desert", "nature"] },
      { id: "seaweed_kelp", label: "Seaweed / Kelp Forest", labelBn: "সামুদ্রিক শৈবাল", emoji: "🌊", tags: ["sea", "nature"] },
      { id: "bonsai", label: "Bonsai", labelBn: "বনসাই", emoji: "🌳", tags: ["art", "peaceful"] },
      { id: "lotus", label: "Lotus", labelBn: "পদ্ম", emoji: "🪷", tags: ["sacred", "beauty"] },
      { id: "bamboo", label: "Bamboo", labelBn: "বাঁশ", emoji: "🎋", tags: ["nature", "peaceful"] },
      { id: "moss_lichen", label: "Moss / Lichen", labelBn: "শ্যাওলা", emoji: "🌱", tags: ["nature", "ancient"] },
      { id: "poison_plant", label: "Poison Plant", labelBn: "বিষাক্ত উদ্ভিদ", emoji: "☠️", tags: ["dark", "wild"] },
      { id: "cherry_blossom", label: "Cherry Blossom", labelBn: "চেরি ব্লসম", emoji: "🌸", tags: ["beauty", "peaceful"] },
    ],
  },
  // ---- অণুজীব ও কোষ ----
  {
    id: "microorganism", title: "Microorganisms & Cells", titleBn: "🦠 অণুজীব ও কোষ", icon: "🦠", step: 0,
    options: [
      { id: "bacteria", label: "Bacteria", labelBn: "ব্যাক্টেরিয়া", emoji: "🦠", tags: ["strange", "nature"] },
      { id: "virus_entity", label: "Virus", labelBn: "ভাইরাস", emoji: "🧬", tags: ["horror", "strange"] },
      { id: "amoeba", label: "Amoeba", labelBn: "অ্যামিবা", emoji: "🫧", tags: ["strange", "nature"] },
      { id: "blood_cell", label: "Blood Cell", labelBn: "রক্তকণিকা", emoji: "🔴", tags: ["nature", "intimate"] },
      { id: "neuron", label: "Neuron", labelBn: "নিউরন", emoji: "🧠", tags: ["mind", "tech"] },
      { id: "dna_strand", label: "DNA Strand", labelBn: "ডিএনএ সূত্র", emoji: "🧬", tags: ["nature", "strange"] },
      { id: "plankton", label: "Plankton", labelBn: "প্ল্যাঙ্কটন", emoji: "🌊", tags: ["sea", "nature"] },
      { id: "tardigrade", label: "Tardigrade", labelBn: "টার্ডিগ্রেড", emoji: "🐻", tags: ["strange", "nature"] },
      { id: "fungal_network", label: "Fungal Network", labelBn: "ছত্রাক নেটওয়ার্ক", emoji: "🍄", tags: ["nature", "strange"] },
      { id: "cell_division", label: "Cell Division", labelBn: "কোষ বিভাজন", emoji: "🔬", tags: ["nature", "growth"] },
    ],
  },
  // ---- প্রাকৃতিক শক্তি ও মৌলিক উপাদান ----
  {
    id: "natural_force", title: "Natural Forces & Elements", titleBn: "🌪️ প্রাকৃতিক শক্তি", icon: "🌪️", step: 0,
    options: [
      { id: "fire_element", label: "Fire", labelBn: "আগুন", emoji: "🔥", tags: ["fire", "primal"] },
      { id: "water_element", label: "Water", labelBn: "পানি / জল", emoji: "💧", tags: ["sea", "nature"] },
      { id: "wind_element", label: "Wind / Storm", labelBn: "বাতাস / ঝড়", emoji: "🌪️", tags: ["nature", "epic"] },
      { id: "earth_element", label: "Earth / Soil", labelBn: "মাটি / পৃথিবী", emoji: "🪨", tags: ["nature", "primal"] },
      { id: "lightning_element", label: "Lightning", labelBn: "বজ্রপাত", emoji: "⚡", tags: ["epic", "primal"] },
      { id: "ice_element", label: "Ice / Frost", labelBn: "বরফ / তুষার", emoji: "❄️", tags: ["cold", "nature"] },
      { id: "lava_magma", label: "Lava / Magma", labelBn: "লাভা / ম্যাগমা", emoji: "🌋", tags: ["fire", "epic"] },
      { id: "gravity", label: "Gravity", labelBn: "মাধ্যাকর্ষণ", emoji: "🕳️", tags: ["cosmic", "strange"] },
      { id: "tsunami", label: "Tsunami", labelBn: "সুনামি", emoji: "🌊", tags: ["sea", "epic"] },
      { id: "tornado", label: "Tornado", labelBn: "টর্নেডো", emoji: "🌪️", tags: ["nature", "epic"] },
      { id: "solar_flare", label: "Solar Flare", labelBn: "সৌরঝড়", emoji: "☀️", tags: ["cosmic", "epic"] },
      { id: "earthquake_force", label: "Earthquake", labelBn: "ভূমিকম্প", emoji: "🫨", tags: ["nature", "epic"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║        STEP 1 ADDITIONS: নতুন Action/Event ক্যাটেগরি        ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- উৎসব ও রীতিনীতি ----
  {
    id: "festival_ritual", title: "Festival & Ritual", titleBn: "🎪 উৎসব ও রীতিনীতি", icon: "🎪", step: 1,
    options: [
      { id: "tribal_dance", label: "Tribal Dance", labelBn: "গোত্রীয় নৃত্য", emoji: "💃", tags: ["ancient", "primal"] },
      { id: "harvest_festival", label: "Harvest Festival", labelBn: "ফসল উৎসব", emoji: "🌾", tags: ["nature", "happy"] },
      { id: "fire_ritual", label: "Fire Ritual", labelBn: "আগুনের আচার", emoji: "🔥", tags: ["sacred", "primal"] },
      { id: "wedding_ceremony", label: "Wedding Ceremony", labelBn: "বিবাহ অনুষ্ঠান", emoji: "💒", tags: ["romance", "happy"] },
      { id: "funeral_rite", label: "Funeral Rite", labelBn: "শেষকৃত্য", emoji: "⚰️", tags: ["sorrow", "sacred"] },
      { id: "coronation", label: "Coronation", labelBn: "রাজ্যাভিষেক", emoji: "👑", tags: ["power", "epic"] },
      { id: "blood_oath", label: "Blood Oath", labelBn: "রক্তশপথ", emoji: "🩸", tags: ["dark", "sacred"] },
      { id: "carnival", label: "Carnival / Parade", labelBn: "কার্নিভাল / শোভাযাত্রা", emoji: "🎭", tags: ["happy", "color"] },
      { id: "sacrifice_ritual", label: "Sacrifice Ritual", labelBn: "বলিদান আচার", emoji: "🗡️", tags: ["dark", "sacred"] },
      { id: "initiation", label: "Initiation / Coming-of-Age", labelBn: "দীক্ষা", emoji: "🌅", tags: ["growth", "sacred"] },
      { id: "prayer_gathering", label: "Prayer Gathering", labelBn: "সমবেত প্রার্থনা", emoji: "🙏", tags: ["sacred", "peaceful"] },
      { id: "lantern_festival", label: "Lantern Festival", labelBn: "প্রদীপ উৎসব", emoji: "🏮", tags: ["beauty", "peaceful"] },
    ],
  },
  // ---- বৈজ্ঞানিক আবিষ্কার ----
  {
    id: "science_discovery", title: "Scientific Discovery", titleBn: "🔬 বৈজ্ঞানিক আবিষ্কার", icon: "🔬", step: 1,
    options: [
      { id: "lab_experiment", label: "Lab Experiment", labelBn: "গবেষণাগার পরীক্ষা", emoji: "🧪", tags: ["tech", "future"] },
      { id: "eureka_moment", label: "Eureka Moment", labelBn: "ইউরেকা মুহূর্ত", emoji: "💡", tags: ["inspire", "clever"] },
      { id: "gene_editing", label: "Gene Editing", labelBn: "জিন সম্পাদনা", emoji: "🧬", tags: ["future", "strange"] },
      { id: "fossil_discovery", label: "Fossil Discovery", labelBn: "জীবাশ্ম আবিষ্কার", emoji: "🦴", tags: ["ancient", "mystery"] },
      { id: "particle_collision", label: "Particle Collision", labelBn: "কণা সংঘর্ষ", emoji: "⚛️", tags: ["cosmic", "epic"] },
      { id: "telescope_discovery", label: "Deep Space Discovery", labelBn: "মহাকাশ আবিষ্কার", emoji: "🔭", tags: ["cosmic", "inspire"] },
      { id: "medical_breakthrough", label: "Medical Breakthrough", labelBn: "চিকিৎসা সাফল্য", emoji: "💉", tags: ["hope", "modern"] },
      { id: "ai_awakening", label: "AI Awakening", labelBn: "এআই জাগরণ", emoji: "🤖", tags: ["future", "philosophy"] },
      { id: "quantum_discovery", label: "Quantum Discovery", labelBn: "কোয়ান্টাম আবিষ্কার", emoji: "🔮", tags: ["strange", "cosmic"] },
      { id: "evolution_event", label: "Evolution Event", labelBn: "বিবর্তন ঘটনা", emoji: "🧬", tags: ["nature", "growth"] },
    ],
  },
  // ---- প্রশিক্ষণ ও রূপান্তর ----
  {
    id: "training_mastery", title: "Training & Mastery", titleBn: "🥋 প্রশিক্ষণ ও দক্ষতা", icon: "🥋", step: 1,
    options: [
      { id: "training_montage", label: "Training Montage", labelBn: "প্রশিক্ষণ মন্তাজ", emoji: "💪", tags: ["inspire", "growth"] },
      { id: "mentorship", label: "Mentorship", labelBn: "গুরু-শিষ্য", emoji: "🧙", tags: ["wise", "growth"] },
      { id: "trial_by_fire", label: "Trial by Fire", labelBn: "আগুনে পরীক্ষা", emoji: "🔥", tags: ["battle", "growth"] },
      { id: "skill_unlock", label: "Skill Unlock", labelBn: "দক্ষতা অর্জন", emoji: "🔓", tags: ["growth", "inspire"] },
      { id: "failure_lesson", label: "Failure & Lesson", labelBn: "ব্যর্থতা ও শিক্ষা", emoji: "📉", tags: ["sorrow", "growth"] },
      { id: "meditation", label: "Meditation / Focus", labelBn: "ধ্যান / একাগ্রতা", emoji: "🧘", tags: ["peaceful", "mind"] },
      { id: "forging_weapon", label: "Forging / Crafting", labelBn: "অস্ত্র তৈরি", emoji: "⚒️", tags: ["ancient", "art"] },
      { id: "physical_transform", label: "Physical Transformation", labelBn: "শারীরিক রূপান্তর", emoji: "🦋", tags: ["growth", "strange"] },
      { id: "awakening_power", label: "Power Awakening", labelBn: "শক্তি জাগরণ", emoji: "⚡", tags: ["epic", "mythic"] },
      { id: "final_test", label: "Final Test", labelBn: "চূড়ান্ত পরীক্ষা", emoji: "🏆", tags: ["tension", "growth"] },
    ],
  },
  // ---- অপরাধ ও রহস্য ----
  {
    id: "crime_mystery", title: "Crime & Mystery", titleBn: "🕵️ অপরাধ ও রহস্য", icon: "🕵️", step: 1,
    options: [
      { id: "heist", label: "Heist", labelBn: "ডাকাতি / হাইস্ট", emoji: "🏦", tags: ["tension", "clever"] },
      { id: "murder_mystery", label: "Murder Mystery", labelBn: "হত্যা রহস্য", emoji: "🔪", tags: ["dark", "mystery"] },
      { id: "kidnapping", label: "Kidnapping", labelBn: "অপহরণ", emoji: "🚐", tags: ["tension", "dark"] },
      { id: "investigation", label: "Investigation", labelBn: "তদন্ত", emoji: "🔍", tags: ["mystery", "clever"] },
      { id: "prison_break", label: "Prison Break", labelBn: "কারাগার ভাঙা", emoji: "🔓", tags: ["tension", "chase"] },
      { id: "undercover", label: "Undercover", labelBn: "ছদ্মবেশী অভিযান", emoji: "🕶️", tags: ["stealth", "tension"] },
      { id: "conspiracy", label: "Conspiracy", labelBn: "ষড়যন্ত্র", emoji: "🕸️", tags: ["dark", "mystery"] },
      { id: "chase_pursuit", label: "Chase / Pursuit", labelBn: "তাড়া / পলায়ন", emoji: "🏃", tags: ["speed", "chase"] },
      { id: "courtroom", label: "Courtroom Drama", labelBn: "আদালত নাটক", emoji: "⚖️", tags: ["tension", "moral"] },
      { id: "blackmail", label: "Blackmail", labelBn: "ব্ল্যাকমেইল", emoji: "📧", tags: ["dark", "tension"] },
    ],
  },
  // ---- সৃজনশীলতা ও শিল্প ----
  {
    id: "creativity_art", title: "Creativity & Art", titleBn: "🎭 সৃজনশীলতা ও শিল্প", icon: "🎭", step: 1,
    options: [
      { id: "performance", label: "Performance / Concert", labelBn: "পারফরম্যান্স / কনসার্ট", emoji: "🎤", tags: ["art", "epic"] },
      { id: "painting_scene", label: "Painting / Sculpting", labelBn: "ছবি আঁকা / ভাস্কর্য", emoji: "🎨", tags: ["art", "intimate"] },
      { id: "dance_scene", label: "Dance", labelBn: "নৃত্য", emoji: "💃", tags: ["art", "beauty"] },
      { id: "storytelling", label: "Storytelling", labelBn: "গল্প বলা", emoji: "📖", tags: ["ancient", "emotion"] },
      { id: "magic_show", label: "Magic / Illusion", labelBn: "জাদু / ইলিউশন", emoji: "🎩", tags: ["strange", "inspire"] },
      { id: "cooking", label: "Cooking / Cuisine", labelBn: "রান্না", emoji: "👨‍🍳", tags: ["art", "safe"] },
      { id: "architecture", label: "Architecture / Building", labelBn: "স্থাপত্য / নির্মাণ", emoji: "🏗️", tags: ["art", "epic"] },
      { id: "fashion", label: "Fashion / Design", labelBn: "ফ্যাশন / ডিজাইন", emoji: "👗", tags: ["art", "beauty"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║        STEP 3 ADDITIONS: নতুন Mood/Feel ক্যাটেগরি           ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- গতিবিধি ও ছন্দ ----
  {
    id: "pacing_rhythm", title: "Pacing & Rhythm", titleBn: "⏱️ গতিবিধি ও ছন্দ", icon: "⏱️", step: 6,
    options: [
      { id: "slow_burn", label: "Slow Burn", labelBn: "ধীর জ্বালা", emoji: "🕐", tags: ["tension", "art"] },
      { id: "rapid_fire", label: "Rapid Fire", labelBn: "দ্রুতগতি", emoji: "⚡", tags: ["speed", "modern"] },
      { id: "crescendo", label: "Crescendo / Build-up", labelBn: "ক্রমবর্ধমান", emoji: "📈", tags: ["epic", "dramatic"] },
      { id: "pulse", label: "Pulsing / Rhythmic", labelBn: "ছন্দময়", emoji: "💓", tags: ["art", "intimate"] },
      { id: "stillness", label: "Stillness / Pause", labelBn: "স্থিরতা / বিরতি", emoji: "🧘", tags: ["peaceful", "art"] },
      { id: "chaotic_pace", label: "Chaotic / Erratic", labelBn: "বিশৃঙ্খল গতি", emoji: "🌀", tags: ["chaos", "tension"] },
      { id: "wave_rhythm", label: "Wave Rhythm", labelBn: "তরঙ্গ ছন্দ", emoji: "🌊", tags: ["nature", "art"] },
      { id: "explosive_start", label: "Cold Open / Explosive Start", labelBn: "বিস্ফোরক শুরু", emoji: "💥", tags: ["tension", "modern"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║        STEP 2 ADDITIONS: নতুন Setting ক্যাটেগরি             ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ---- সংস্কৃতি ও অঞ্চল ----
  {
    id: "cultural_setting", title: "Cultural Setting", titleBn: "🏯 সংস্কৃতি ও অঞ্চল", icon: "🏯", step: 2,
    options: [
      { id: "ancient_egypt", label: "Ancient Egypt", labelBn: "প্রাচীন মিশর", emoji: "🏛️", tags: ["ancient", "sacred"] },
      { id: "feudal_japan", label: "Feudal Japan", labelBn: "সামন্ত জাপান", emoji: "🏯", tags: ["ancient", "honor"] },
      { id: "viking_north", label: "Viking North", labelBn: "ভাইকিং উত্তর", emoji: "🪓", tags: ["cold", "wild"] },
      { id: "amazon_tribe", label: "Amazon Tribe", labelBn: "আমাজন উপজাতি", emoji: "🌴", tags: ["wild", "primal"] },
      { id: "silk_road", label: "Silk Road", labelBn: "সিল্ক রুট", emoji: "🐫", tags: ["ancient", "adventure"] },
      { id: "greek_olympus", label: "Greek / Olympus", labelBn: "গ্রিক / অলিম্পাস", emoji: "🏛️", tags: ["mythic", "ancient"] },
      { id: "mayan_aztec", label: "Mayan / Aztec", labelBn: "মায়া / অ্যাজটেক", emoji: "🗿", tags: ["ancient", "sacred"] },
      { id: "african_kingdom", label: "African Kingdom", labelBn: "আফ্রিকান রাজ্য", emoji: "👑", tags: ["ancient", "power"] },
      { id: "bengal_delta", label: "Bengal Delta", labelBn: "বাংলার ব-দ্বীপ", emoji: "🌊", tags: ["nature", "regional"] },
      { id: "arabian_nights", label: "Arabian Nights", labelBn: "আরব্য রজনী", emoji: "🕌", tags: ["mythic", "ancient"] },
    ],
  },
  // ╔═══════════════════════════════════════════════════════════════╗
  // ║         STEP 3: কীভাবে ঘটবে? (Method/Mechanism)             ║
  // ╚═══════════════════════════════════════════════════════════════╝
  {
    id: "method_how", title: "How It Happens", titleBn: "🔧 কীভাবে ঘটবে", icon: "🔧", step: 3,
    options: [
      { id: "suddenly", label: "Suddenly", labelBn: "হঠাৎ করে", emoji: "💥", tags: ["tension", "speed"] },
      { id: "gradually", label: "Gradually", labelBn: "ধীরে ধীরে", emoji: "🐌", tags: ["tension", "art"] },
      { id: "chain_reaction", label: "Chain Reaction", labelBn: "চেইন রিঅ্যাকশন", emoji: "🔗", tags: ["complex", "epic"] },
      { id: "accident", label: "By Accident", labelBn: "দুর্ঘটনাক্রমে", emoji: "💫", tags: ["twist"] },
      { id: "curiosity", label: "Out of Curiosity", labelBn: "কৌতূহলবশত", emoji: "🔍", tags: ["mystery"] },
      { id: "forced", label: "Forced / Compelled", labelBn: "বাধ্য হয়ে", emoji: "⛓️", tags: ["dark", "tension"] },
      { id: "while_fleeing", label: "While Fleeing", labelBn: "পালাতে গিয়ে", emoji: "🏃", tags: ["chase", "tension"] },
      { id: "while_searching", label: "While Searching", labelBn: "খুঁজতে গিয়ে", emoji: "🔦", tags: ["mystery", "adventure"] },
      { id: "ignoring_warning", label: "Ignoring Warning", labelBn: "সতর্কতা উপেক্ষা করে", emoji: "⚠️", tags: ["horror", "tension"] },
      { id: "betrayal", label: "Through Betrayal", labelBn: "বিশ্বাসঘাতকতার মাধ্যমে", emoji: "🗡️", tags: ["dark", "twist"] },
      { id: "ritual", label: "Through Ritual", labelBn: "আচার/অনুষ্ঠানের মাধ্যমে", emoji: "🕯️", tags: ["sacred", "mythic"] },
      { id: "technology", label: "Via Technology", labelBn: "প্রযুক্তির মাধ্যমে", emoji: "💻", tags: ["tech", "future"] },
      { id: "nature_force", label: "By Natural Force", labelBn: "প্রাকৃতিক শক্তিতে", emoji: "🌪️", tags: ["nature", "epic"] },
      { id: "manipulation", label: "Through Manipulation", labelBn: "ম্যানিপুলেশনে", emoji: "🎭", tags: ["dark", "clever"] },
      { id: "sacrifice_method", label: "Through Sacrifice", labelBn: "আত্মত্যাগের মাধ্যমে", emoji: "💀", tags: ["emotion", "dark"] },
      { id: "by_mistake", label: "By Mistake", labelBn: "ভুলবশত", emoji: "🫣", tags: ["twist", "tension"] },
      { id: "by_deception", label: "Through Deception", labelBn: "প্রতারণায়", emoji: "🎭", tags: ["dark", "clever"] },
      { id: "during_training", label: "During Training", labelBn: "প্রশিক্ষণের সময়", emoji: "🏋️", tags: ["tension", "modern"] },
      { id: "inherited", label: "Inherited / Generational", labelBn: "উত্তরাধিকারসূত্রে", emoji: "🧬", tags: ["ancient", "dark"] },
      { id: "by_greed", label: "Out of Greed", labelBn: "লোভের কারণে", emoji: "💰", tags: ["dark", "moral"] },
      { id: "misunderstanding", label: "Through Misunderstanding", labelBn: "ভুল বোঝাবুঝিতে", emoji: "😵‍💫", tags: ["twist", "emotion"] },
      { id: "by_revenge", label: "Out of Revenge", labelBn: "প্রতিশোধস্পৃহায়", emoji: "🔥", tags: ["dark", "battle"] },
      { id: "by_love", label: "Out of Love", labelBn: "ভালোবাসার কারণে", emoji: "❤️‍🔥", tags: ["emotion", "romance"] },
      { id: "by_jealousy", label: "Out of Jealousy", labelBn: "ঈর্ষার কারণে", emoji: "😤", tags: ["dark", "emotion"] },
      { id: "by_experiment", label: "During Experiment", labelBn: "পরীক্ষা-নিরীক্ষায়", emoji: "🧪", tags: ["tech", "strange"] },
      { id: "by_instinct", label: "By Pure Instinct", labelBn: "সহজাত প্রবৃত্তিতে", emoji: "🧠", tags: ["primal", "wild"] },
      { id: "by_prophecy", label: "Fulfilling Prophecy", labelBn: "ভবিষ্যদ্বাণী পূরণে", emoji: "🔮", tags: ["mythic", "sacred"] },
      { id: "by_madness", label: "Through Madness", labelBn: "উন্মাদনায়", emoji: "🤪", tags: ["horror", "dark"] },
      { id: "by_addiction", label: "Through Addiction", labelBn: "আসক্তির কারণে", emoji: "💊", tags: ["dark", "modern"] },
    ],
  },
  {
    id: "agent_cause", title: "Agent / Cause", titleBn: "⚙️ কার/কীসের দ্বারা", icon: "⚙️", step: 3,
    options: [
      { id: "animal_agent", label: "Animal / Creature", labelBn: "প্রাণী / জীব", emoji: "🐺", tags: ["wild", "nature"] },
      { id: "nature_agent", label: "Natural Force", labelBn: "প্রাকৃতিক শক্তি", emoji: "🌊", tags: ["nature", "epic"] },
      { id: "human_agent", label: "Human / Person", labelBn: "মানুষ", emoji: "👤", tags: ["social"] },
      { id: "machine_agent", label: "Machine / Tech Failure", labelBn: "যান্ত্রিক ত্রুটি", emoji: "⚙️", tags: ["tech", "tension"] },
      { id: "unknown_agent", label: "Unknown / Unseen", labelBn: "অজানা / অদৃশ্য", emoji: "👁️", tags: ["mystery", "horror"] },
      { id: "self_caused", label: "Self-Caused", labelBn: "নিজের কারণে", emoji: "🪞", tags: ["philosophy", "dark"] },
      { id: "group_agent", label: "Group / Mob", labelBn: "দল / জনতা", emoji: "👥", tags: ["social", "pack"] },
      { id: "supernatural_agent", label: "Supernatural", labelBn: "অতিপ্রাকৃত শক্তি", emoji: "👻", tags: ["supernatural", "dark"] },
      { id: "disease_agent", label: "Disease / Virus", labelBn: "রোগ / ভাইরাস", emoji: "🦠", tags: ["horror", "nature"] },
      { id: "gravity_agent", label: "Gravity / Fall", labelBn: "মাধ্যাকর্ষণ / পতন", emoji: "⬇️", tags: ["nature", "tension"] },
      { id: "rope_break", label: "Equipment Failure", labelBn: "সরঞ্জাম বিকল", emoji: "🔧", tags: ["tension", "tech"] },
      { id: "companion_betrayal", label: "Companion Betrayal", labelBn: "সঙ্গীর বিশ্বাসঘাতকতা", emoji: "💔", tags: ["dark", "twist"] },
      { id: "corrupt_leader", label: "Corrupt Leader", labelBn: "দুর্নীতিগ্রস্ত নেতা", emoji: "👑", tags: ["social", "dark"] },
      { id: "child_agent", label: "A Child", labelBn: "একটি শিশু", emoji: "🧒", tags: ["emotion", "twist"] },
      { id: "ancestor_spirit", label: "Ancestor Spirit", labelBn: "পূর্বপুরুষের আত্মা", emoji: "👴", tags: ["mythic", "supernatural"] },
      { id: "ai_agent", label: "AI / Robot", labelBn: "কৃত্রিম বুদ্ধিমত্তা", emoji: "🤖", tags: ["tech", "future"] },
      { id: "fate_destiny", label: "Fate / Destiny", labelBn: "ভাগ্য / নিয়তি", emoji: "🌟", tags: ["mythic", "philosophy"] },
      { id: "parasite", label: "Parasite", labelBn: "পরজীবী", emoji: "🦠", tags: ["horror", "strange"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║         STEP 4: কখন ঘটবে? (Time/Condition)                 ║
  // ╚═══════════════════════════════════════════════════════════════╝
  {
    id: "time_when", title: "Time of Day", titleBn: "🕐 কখন / সময়", icon: "🕐", step: 4,
    options: [
      { id: "midnight", label: "Midnight", labelBn: "মধ্যরাতে", emoji: "🌑", tags: ["dark", "horror"] },
      { id: "dawn", label: "Dawn / Early Morning", labelBn: "ভোরে / প্রত্যুষে", emoji: "🌅", tags: ["peaceful", "hope"] },
      { id: "golden_hour_time", label: "Golden Hour", labelBn: "সোনালি আলোয়", emoji: "🌇", tags: ["beauty", "peaceful"] },
      { id: "dusk", label: "Dusk / Twilight", labelBn: "সন্ধ্যায় / গোধূলিতে", emoji: "🌆", tags: ["mystery", "dark"] },
      { id: "deep_night", label: "Deep Night (3 AM)", labelBn: "গভীর রাতে (৩টা)", emoji: "🌙", tags: ["horror", "dark"] },
      { id: "high_noon", label: "High Noon", labelBn: "দুপুরের তীব্র রোদে", emoji: "☀️", tags: ["harsh", "tension"] },
      { id: "blue_hour", label: "Blue Hour", labelBn: "নীল ঘণ্টায়", emoji: "🔵", tags: ["art", "peaceful"] },
      { id: "witching_hour", label: "Witching Hour (3 AM)", labelBn: "ডাইনির প্রহরে", emoji: "🧙", tags: ["horror", "supernatural"] },
      { id: "season_monsoon", label: "Monsoon Season", labelBn: "বর্ষাকালে", emoji: "🌧️", tags: ["nature", "epic"] },
      { id: "season_winter", label: "Deep Winter", labelBn: "কনকনে শীতে", emoji: "❄️", tags: ["cold", "harsh"] },
      { id: "season_summer", label: "Scorching Summer", labelBn: "তীব্র গ্রীষ্মে", emoji: "🥵", tags: ["harsh", "nature"] },
      { id: "season_autumn", label: "Autumn / Fall", labelBn: "শরৎকালে", emoji: "🍂", tags: ["beauty", "sorrow"] },
      { id: "season_spring", label: "Spring Bloom", labelBn: "বসন্তে", emoji: "🌸", tags: ["hope", "beauty"] },
      { id: "new_year_eve", label: "New Year's Eve", labelBn: "বছরের শেষ রাতে", emoji: "🎆", tags: ["social", "twist"] },
      { id: "full_moon", label: "Full Moon Night", labelBn: "পূর্ণিমার রাতে", emoji: "🌕", tags: ["mythic", "beauty"] },
    ],
  },
  {
    id: "condition_when", title: "Condition / Circumstance", titleBn: "🌧️ পরিস্থিতি / শর্ত", icon: "🌧️", step: 4,
    options: [
      { id: "during_storm", label: "During Storm", labelBn: "ঝড়ের মধ্যে", emoji: "⛈️", tags: ["epic", "nature"] },
      { id: "in_fog", label: "In Dense Fog", labelBn: "ঘন কুয়াশায়", emoji: "🌫️", tags: ["mystery", "dark"] },
      { id: "alone", label: "Completely Alone", labelBn: "সম্পূর্ণ একা", emoji: "🧍", tags: ["solitary", "tension"] },
      { id: "with_team", label: "With a Team", labelBn: "দলের সাথে", emoji: "👥", tags: ["pack"] },
      { id: "first_time", label: "First Time Ever", labelBn: "প্রথমবার", emoji: "🆕", tags: ["mystery", "tension"] },
      { id: "last_attempt", label: "Last Attempt", labelBn: "শেষ চেষ্টায়", emoji: "⏳", tags: ["tension", "drama"] },
      { id: "under_water", label: "Underwater", labelBn: "পানির নিচে", emoji: "🤿", tags: ["sea", "tension"] },
      { id: "in_darkness", label: "Complete Darkness", labelBn: "সম্পূর্ণ অন্ধকারে", emoji: "⬛", tags: ["horror", "dark"] },
      { id: "during_eclipse", label: "During Eclipse", labelBn: "গ্রহণের সময়", emoji: "🌑", tags: ["mythic", "dark"] },
      { id: "power_outage", label: "Power Outage", labelBn: "বিদ্যুৎ চলে যাওয়ায়", emoji: "🔌", tags: ["tension", "modern"] },
      { id: "while_sleeping", label: "While Sleeping", labelBn: "ঘুমের মধ্যে", emoji: "😴", tags: ["horror", "strange"] },
      { id: "during_celebration", label: "During Celebration", labelBn: "উৎসবের মধ্যে", emoji: "🎉", tags: ["twist", "social"] },
      { id: "after_disaster", label: "After a Disaster", labelBn: "দুর্যোগের পরে", emoji: "🏚️", tags: ["dark", "sorrow"] },
      { id: "communication_lost", label: "Communication Lost", labelBn: "যোগাযোগ বিচ্ছিন্ন", emoji: "📵", tags: ["tension", "solitary"] },
      { id: "on_wedding_day", label: "On Wedding Day", labelBn: "বিয়ের দিনে", emoji: "💒", tags: ["twist", "emotion"] },
      { id: "during_funeral", label: "During Funeral", labelBn: "জানাজা/শ্মশানে", emoji: "⚰️", tags: ["dark", "sorrow"] },
      { id: "during_prayer", label: "During Prayer", labelBn: "প্রার্থনার সময়", emoji: "🙏", tags: ["sacred", "twist"] },
      { id: "during_exam", label: "During Exam / Test", labelBn: "পরীক্ষার সময়", emoji: "📝", tags: ["tension", "modern"] },
      { id: "during_travel", label: "While Traveling", labelBn: "ভ্রমণের সময়", emoji: "✈️", tags: ["adventure", "twist"] },
      { id: "during_pregnancy", label: "During Pregnancy", labelBn: "গর্ভাবস্থায়", emoji: "🤰", tags: ["emotion", "tension"] },
      { id: "during_war", label: "During War", labelBn: "যুদ্ধের মধ্যে", emoji: "💣", tags: ["battle", "dark"] },
      { id: "childhood", label: "In Childhood", labelBn: "শৈশবে", emoji: "🧒", tags: ["emotion", "safe"] },
      { id: "old_age", label: "In Old Age", labelBn: "বৃদ্ধ বয়সে", emoji: "👴", tags: ["sorrow", "emotion"] },
      { id: "during_festival", label: "During Religious Festival", labelBn: "ধর্মীয় উৎসবে", emoji: "🕌", tags: ["sacred", "social"] },
      { id: "after_betrayal", label: "After Being Betrayed", labelBn: "বিশ্বাসঘাতকতার পরে", emoji: "💔", tags: ["dark", "emotion"] },
      { id: "during_interview", label: "During Interview", labelBn: "সাক্ষাৎকারের সময়", emoji: "🎙️", tags: ["modern", "tension"] },
      { id: "in_prison", label: "In Prison / Captivity", labelBn: "বন্দি অবস্থায়", emoji: "🔒", tags: ["dark", "tension"] },
      { id: "on_deathbed", label: "On Deathbed", labelBn: "মৃত্যুশয্যায়", emoji: "🛏️", tags: ["sorrow", "drama"] },
    ],
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║         STEP 5: কী পরিবর্তন হবে? (Escalation)              ║
  // ╚═══════════════════════════════════════════════════════════════╝
  {
    id: "escalation", title: "Escalation / Change", titleBn: "📈 পরিবর্তন / উত্তেজনা বৃদ্ধি", icon: "📈", step: 5,
    options: [
      { id: "situation_worsens", label: "Situation Worsens", labelBn: "পরিস্থিতি আরও খারাপ", emoji: "📉", tags: ["tension", "dark"] },
      { id: "new_danger", label: "New Danger Arrives", labelBn: "নতুন বিপদ আসে", emoji: "⚠️", tags: ["tension", "twist"] },
      { id: "escape_blocked", label: "Escape Route Blocked", labelBn: "পালানোর পথ বন্ধ", emoji: "🚧", tags: ["tension", "dark"] },
      { id: "equipment_breaks", label: "Equipment Breaks", labelBn: "সরঞ্জাম নষ্ট", emoji: "🔧", tags: ["tension", "tech"] },
      { id: "ally_injured", label: "Ally Injured", labelBn: "সঙ্গী আহত", emoji: "🩹", tags: ["emotion", "tension"] },
      { id: "visibility_drops", label: "Visibility Drops", labelBn: "দৃশ্যমানতা কমে যায়", emoji: "🌫️", tags: ["dark", "tension"] },
      { id: "time_running_out", label: "Time Running Out", labelBn: "সময় শেষ হয়ে আসে", emoji: "⏰", tags: ["tension", "speed"] },
      { id: "oxygen_low", label: "Oxygen Running Low", labelBn: "অক্সিজেন কমে আসে", emoji: "💨", tags: ["tension", "sea"] },
      { id: "unexpected_ally", label: "Unexpected Ally", labelBn: "অপ্রত্যাশিত সাহায্য", emoji: "🤝", tags: ["hope", "twist"] },
      { id: "truth_revealed", label: "Truth Revealed", labelBn: "সত্য প্রকাশ", emoji: "💡", tags: ["twist", "drama"] },
      { id: "power_shift", label: "Power Shift", labelBn: "ক্ষমতার পরিবর্তন", emoji: "⚖️", tags: ["twist", "battle"] },
      { id: "sacrifice_needed", label: "Sacrifice Needed", labelBn: "আত্মত্যাগ প্রয়োজন", emoji: "💀", tags: ["emotion", "dark"] },
      { id: "environment_changes", label: "Environment Changes", labelBn: "পরিবেশ বদলায়", emoji: "🌊", tags: ["nature", "epic"] },
      { id: "enemy_multiplies", label: "Enemy Multiplies", labelBn: "শত্রু বেড়ে যায়", emoji: "👥", tags: ["tension", "battle"] },
      { id: "moral_choice", label: "Moral Choice Forced", labelBn: "নৈতিক সিদ্ধান্ত নিতে হয়", emoji: "⚖️", tags: ["philosophy", "emotion"] },
      { id: "betrayal_revealed", label: "Betrayal Revealed", labelBn: "বিশ্বাসঘাতকতা প্রকাশ", emoji: "🗡️", tags: ["dark", "twist"] },
      { id: "goes_mad", label: "Goes Insane", labelBn: "পাগল হয়ে যায়", emoji: "🤯", tags: ["horror", "mind"] },
      { id: "memory_loss", label: "Memory Loss", labelBn: "স্মৃতি হারায়", emoji: "🧠", tags: ["mind", "strange"] },
      { id: "shape_shifts", label: "Shape Shifts", labelBn: "রূপ বদলে যায়", emoji: "🦋", tags: ["supernatural", "strange"] },
      { id: "ground_collapses", label: "Ground Collapses", labelBn: "মাটি ধসে যায়", emoji: "🕳️", tags: ["nature", "tension"] },
      { id: "flood_rises", label: "Water Level Rises", labelBn: "পানি বাড়তে থাকে", emoji: "🌊", tags: ["sea", "tension"] },
      { id: "fire_spreads", label: "Fire Spreads", labelBn: "আগুন ছড়িয়ে পড়ে", emoji: "🔥", tags: ["fire", "epic"] },
      { id: "poison_spreads", label: "Poison / Gas Spreads", labelBn: "বিষ / গ্যাস ছড়ায়", emoji: "☠️", tags: ["horror", "tension"] },
      { id: "ally_turns_enemy", label: "Ally Turns Enemy", labelBn: "মিত্র শত্রু হয়ে যায়", emoji: "😈", tags: ["dark", "twist"] },
      { id: "body_transforms", label: "Body Transforms", labelBn: "শরীর বদলে যায়", emoji: "🫠", tags: ["horror", "strange"] },
      { id: "reality_breaks", label: "Reality Breaks", labelBn: "বাস্তবতা ভেঙে পড়ে", emoji: "🌀", tags: ["cosmic", "mind"] },
      { id: "aging_rapid", label: "Rapid Aging", labelBn: "দ্রুত বুড়ো হয়ে যায়", emoji: "👴", tags: ["horror", "strange"] },
      { id: "blindness", label: "Loses Sight", labelBn: "দৃষ্টি হারায়", emoji: "🕶️", tags: ["dark", "tension"] },
      { id: "voice_lost", label: "Loses Voice", labelBn: "কণ্ঠ হারায়", emoji: "🤐", tags: ["emotion", "tension"] },
      { id: "gravity_shifts", label: "Gravity Shifts", labelBn: "মাধ্যাকর্ষণ বদলায়", emoji: "🔄", tags: ["cosmic", "strange"] },
      { id: "temperature_extreme", label: "Extreme Temperature", labelBn: "তাপমাত্রা চরমে যায়", emoji: "🌡️", tags: ["nature", "harsh"] },
      { id: "hallucination", label: "Hallucination Begins", labelBn: "হ্যালুসিনেশন শুরু হয়", emoji: "👁️", tags: ["mind", "horror"] },
      { id: "pregnancy_reveal", label: "Pregnancy Revealed", labelBn: "গর্ভবতী প্রকাশ", emoji: "🤰", tags: ["emotion", "twist"] },
      { id: "curse_activates", label: "Curse Activates", labelBn: "অভিশাপ সক্রিয় হয়", emoji: "🧿", tags: ["supernatural", "dark"] },
      { id: "crowd_turns", label: "Crowd Turns Hostile", labelBn: "জনতা বিরূপ হয়", emoji: "😡", tags: ["social", "tension"] },
    ],
  },
];

// ===== DEFAULT =====
const DEFAULT_SELECTIONS: Record<string, string[]> = {};

// ===== SMART DNA ENGINE =====
function buildSmartDNA(selections: Record<string, string[]>, customInputs?: Record<number, string>): { dna: string; strength: number; tips: string[] } {
  const allTags: Record<string, number> = {};
  let totalSelected = 0;

  for (const cat of DNA_CATEGORIES) {
    const sel = selections[cat.id] || [];
    for (const optId of sel) {
      totalSelected++;
      const opt = cat.options.find((o) => o.id === optId);
      if (!opt) continue;
      for (const tag of opt.tags || []) {
        allTags[tag] = (allTags[tag] || 0) + 1;
      }
    }
  }

  if (totalSelected === 0) return { dna: "", strength: 0, tips: [] };

  const parts: string[] = [];
  for (const cat of DNA_CATEGORIES) {
    const selected = selections[cat.id] || [];
    if (selected.length === 0) continue;
    const labels = selected.map((optId) => {
      const opt = cat.options.find((o) => o.id === optId);
      return opt ? opt.labelBn : optId;
    });
    parts.push(`[${cat.icon} ${cat.titleBn}]: ${labels.join(" + ")}`);
  }

  // Add custom inputs to DNA
  if (customInputs) {
    for (const [stepIdx, text] of Object.entries(customInputs)) {
      const trimmed = text.trim();
      if (!trimmed) continue;
      const step = WIZARD_STEPS[Number(stepIdx)];
      if (step) {
        parts.push(`[✏️ কাস্টম ${step.icon}]: ${trimmed}`);
        totalSelected++;
      }
    }
  }

  const sortedTags = Object.entries(allTags).sort((a, b) => b[1] - a[1]);
  const dominantTags = sortedTags.slice(0, 5).map(([tag]) => tag);

  const glue: string[] = [];
  if (dominantTags.includes("dark") && dominantTags.includes("emotion")) glue.push("🔥 গভীর আবেগ + অন্ধকার = মুক্তির আকাঙ্ক্ষা");
  if (dominantTags.includes("battle") && dominantTags.includes("wild")) glue.push("⚡ বন্য শক্তি + সংঘর্ষ = আদিম আকর্ষণ");
  if (dominantTags.includes("mythic") && dominantTags.includes("epic")) glue.push("✨ পৌরাণিক মহিমা + বিশাল স্কেল = মহাকাব্যিক");
  if (dominantTags.includes("future") && dominantTags.includes("dark")) glue.push("🌌 ভবিষ্যতের অন্ধকার = ডিসটোপিয়ান আতঙ্ক");
  if (dominantTags.includes("sea") && dominantTags.includes("dark")) glue.push("🌊 গভীর সমুদ্র + অজানা = অতলের বিস্ময়");
  if (dominantTags.includes("emotion") && dominantTags.includes("safe")) glue.push("❤️ নিরাপদ আবেগ + পরিবার = হৃদয়গ্রাহী ভাইরাল");
  if (dominantTags.includes("cosmic") || dominantTags.includes("philosophy")) glue.push("🧠 দার্শনিক গভীরতা = চিন্তা-উদ্দীপক");
  if (dominantTags.includes("twist")) glue.push("🔄 অপ্রত্যাশিত মোড় = রিওয়াচ ভ্যালু");
  if (dominantTags.includes("sacred") && dominantTags.includes("primal")) glue.push("🕯️ আদিম আচার + পবিত্রতা = আধ্যাত্মিক গভীরতা");
  if (dominantTags.includes("growth") && dominantTags.includes("inspire")) glue.push("🌱 রূপান্তর + অনুপ্রেরণা = মোটিভেশনাল ভাইরাল");
  if (dominantTags.includes("nature") && dominantTags.includes("strange")) glue.push("🍄 প্রকৃতির অদ্ভুত রূপ = কৌতূহল-উদ্দীপক");
  if (dominantTags.includes("clever") && dominantTags.includes("tension")) glue.push("🧩 বুদ্ধিমত্তা + উত্তেজনা = মাইন্ড-গেম থ্রিলার");
  if (dominantTags.includes("art") && dominantTags.includes("dramatic")) glue.push("🎨 শৈল্পিক দৃশ্যায়ন + নাটকীয়তা = সিনেমাটিক মাস্টারপিস");
  if (dominantTags.includes("fire") && dominantTags.includes("epic")) glue.push("🔥 আগুনের শক্তি + মহাকাব্যিক স্কেল = ধ্বংসাত্মক সৌন্দর্য");
  glue.push("🌍 সাংস্কৃতিক বাধা অতিক্রমকারী সর্বজনীন আবেগ");

  const stepsWithSelection = new Set(DNA_CATEGORIES.filter(c => (selections[c.id] || []).length > 0).map(c => c.step));
  const categoryCount = Object.keys(selections).filter(k => (selections[k] || []).length > 0).length;
  const tagDiversity = Object.keys(allTags).length;
  const strength = Math.min(100, Math.round(
    (stepsWithSelection.size / 8) * 40 +
    (Math.min(totalSelected, 20) / 20) * 30 +
    (Math.min(tagDiversity, 15) / 15) * 30
  ));

  const tips: string[] = [];
  if (!stepsWithSelection.has(0)) tips.push("'কে থাকবে' স্টেপ থেকে চরিত্র বাছুন");
  if (!stepsWithSelection.has(1)) tips.push("'কী ঘটবে' স্টেপ থেকে অ্যাকশন বাছুন");
  if (!stepsWithSelection.has(3)) tips.push("'কীভাবে ঘটবে' স্টেপে পদ্ধতি বাছুন");
  if (!stepsWithSelection.has(5)) tips.push("'পরিবর্তন' স্টেপে escalation বাছুন");
  if (!stepsWithSelection.has(6)) tips.push("'অনুভূতি' স্টেপ থেকে আবেগ বাছলে ভাইরাল হবে");
  if (!stepsWithSelection.has(7)) tips.push("'স্টাইল' স্টেপ থেকে ভিজ্যুয়াল বাছুন");

  const fullDNA = `🧬 THEME DNA [শক্তি: ${strength}%]: ${parts.join(" | ")}${glue.length > 0 ? "\n\n🔗 VIRAL HARMONIZE:\n" + glue.join("\n") : ""}`;
  return { dna: fullDNA, strength, tips };
}

// ===== COMPONENT =====
interface ThemeDNALabProps {
  onDNAGenerated?: (dna: string) => void;
}

export function ThemeDNALab({ onDNAGenerated }: ThemeDNALabProps) {
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({ ...DEFAULT_SELECTIONS });
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({}); // per step
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const smartDNA = useMemo(() => buildSmartDNA(selections, customInputs), [selections, customInputs]);
  const totalSelected = useMemo(
    () => Object.values(selections).reduce((sum, arr) => sum + arr.length, 0),
    [selections]
  );

  // Load saved DNA
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("theme_dna")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
        if (data?.selections) {
          setSelections(data.selections as Record<string, string[]>);
        }
        setLoaded(true);
      } catch {
        setLoaded(true);
      }
    })();
  }, [open, loaded]);

  // Only keep expanded accordions that still have selections (persist state)
  // Do NOT auto-expand on step change
  useEffect(() => {
    const catsInStep = DNA_CATEGORIES.filter(c => c.step === currentStep);
    const validCatIds = new Set(catsInStep.map(c => c.id));
    
    // Keep only expanded categories that are in the current step
    setExpandedCats(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        if (validCatIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [currentStep]);

  const toggleOption = useCallback((catId: string, optId: string) => {
    setSelections((prev) => {
      const current = prev[catId] || [];
      const next = current.includes(optId)
        ? current.filter((id) => id !== optId)
        : [...current, optId];
      return { ...prev, [catId]: next };
    });
  }, []);

  const toggleCatExpand = useCallback((catId: string) => {
    setExpandedCats(prev => {
      // If already expanded, collapse it
      if (prev.has(catId)) {
        const next = new Set(prev);
        next.delete(catId);
        return next;
      }
      // If not expanded, close all others and open this one
      return new Set([catId]);
    });
  }, []);

  const resetAll = useCallback(() => {
    setSelections({ ...DEFAULT_SELECTIONS });
    setCustomInputs({});
    setCurrentStep(0);
    setExpandedCats(new Set());
  }, []);

  const randomize = useCallback(() => {
    const newSel: Record<string, string[]> = { ...DEFAULT_SELECTIONS };
    for (const cat of DNA_CATEGORIES) {
      if (cat.id === "target_audience") continue;
      const count = Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0;
      if (count > 0) {
        const shuffled = [...cat.options].sort(() => Math.random() - 0.5);
        newSel[cat.id] = shuffled.slice(0, count).map(o => o.id);
      }
    }
    setSelections(newSel);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { dna } = buildSmartDNA(selections, customInputs);
      await supabase.from("theme_dna").delete().eq("user_id", user.id);
      await supabase.from("theme_dna").insert({
        user_id: user.id,
        dna_string: dna,
        selections: selections as any,
      });
      localStorage.setItem("theme-dna-string", dna);
      localStorage.setItem("theme-dna-selections", JSON.stringify(selections));
      onDNAGenerated?.(dna);
      toast({ title: "🧬 DNA সেভ হয়েছে!", description: `শক্তি: ${smartDNA.strength}% — Blueprint-এ ইনজেক্ট হবে।` });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "❌ সেভ করতে সমস্যা", description: err.message || "আবার চেষ্টা করুন।", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [selections, onDNAGenerated, smartDNA.strength]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(smartDNA.dna);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [smartDNA.dna]);

  // Collect all tags from selections in OTHER steps (for conditional highlighting)
  const relevantTags = useMemo(() => {
    const tags: Record<string, number> = {};
    for (const cat of DNA_CATEGORIES) {
      if (cat.step === currentStep) continue; // skip current step
      const sel = selections[cat.id] || [];
      for (const optId of sel) {
        const opt = cat.options.find(o => o.id === optId);
        if (!opt) continue;
        for (const tag of opt.tags || []) {
          tags[tag] = (tags[tag] || 0) + 1;
        }
      }
    }
    return tags;
  }, [selections, currentStep]);

  const isOptionRelevant = useCallback((opt: CategoryOption) => {
    if (Object.keys(relevantTags).length === 0) return false;
    return (opt.tags || []).some(tag => relevantTags[tag]);
  }, [relevantTags]);

  const getRelevanceScore = useCallback((opt: CategoryOption) => {
    if (Object.keys(relevantTags).length === 0) return 0;
    return (opt.tags || []).reduce((score, tag) => score + (relevantTags[tag] || 0), 0);
  }, [relevantTags]);

  const stepCats = DNA_CATEGORIES.filter(c => c.step === currentStep);
  const stepSelCount = stepCats.reduce((sum, c) => sum + (selections[c.id]?.length || 0), 0);

  const strengthColor = smartDNA.strength >= 70
    ? "hsl(var(--primary))"
    : smartDNA.strength >= 40
    ? "hsl(35 95% 55%)"
    : "hsl(0 85% 55%)";

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-extrabold tracking-wide transition-all duration-300 overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, hsl(210 100% 56%), hsl(190 95% 50%), hsl(165 90% 45%))",
          color: "white",
          boxShadow: "0 6px 24px -6px hsl(200 100% 50% / 0.55), inset 0 1px 0 0 hsl(200 100% 80% / 0.35)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 10px 36px -6px hsl(200 100% 50% / 0.7), inset 0 1px 0 0 hsl(200 100% 80% / 0.4)";
          e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 24px -6px hsl(200 100% 50% / 0.55), inset 0 1px 0 0 hsl(200 100% 80% / 0.35)";
          e.currentTarget.style.transform = "translateY(0) scale(1)";
        }}
        title="Generate Theme DNA"
      >
        <Zap className="w-4 h-4 drop-shadow-sm" />
        <span className="hidden sm:inline">DNA</span>
      </button>

      {/* Wizard Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[98vw] h-[94vh] flex flex-col p-0 gap-0 overflow-hidden">
          
          {/* === HEADER === */}
          <div className="px-5 pt-4 pb-3 border-b border-border/50 shrink-0 space-y-3">
            <DialogHeader className="space-y-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Dna className="w-5 h-5 text-primary" />
                Theme DNA Builder
              </DialogTitle>
              <DialogDescription className="sr-only">Theme DNA Builder</DialogDescription>
            </DialogHeader>

            {/* === STEP PROGRESS BAR === */}
            <div className="flex items-center gap-1">
              {WIZARD_STEPS.map((step, i) => {
                const stepTotal = DNA_CATEGORIES.filter(c => c.step === i)
                  .reduce((sum, c) => sum + (selections[c.id]?.length || 0), 0);
                const isActive = currentStep === i;
                const isDone = stepTotal > 0;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "flex-1 flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 border relative overflow-hidden",
                      isActive
                        ? "border-transparent text-white shadow-lg scale-[1.02]"
                        : isDone
                        ? "border-transparent text-white/90 shadow-md hover:shadow-lg hover:scale-[1.01]"
                        : "border-border/40 text-muted-foreground hover:border-border hover:shadow-sm bg-secondary/30"
                    )}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${step.color.includes('violet') ? 'hsl(var(--primary))' : step.color.includes('orange') ? 'hsl(25 95% 53%)' : step.color.includes('emerald') ? 'hsl(var(--btn-params))' : step.color.includes('pink') ? 'hsl(var(--accent))' : 'hsl(var(--btn-blueprint))'}, ${step.color.includes('violet') ? 'hsl(280 70% 55%)' : step.color.includes('orange') ? 'hsl(0 85% 55%)' : step.color.includes('emerald') ? 'hsl(180 70% 40%)' : step.color.includes('pink') ? 'hsl(340 75% 50%)' : 'hsl(240 80% 55%)'})`,
                      boxShadow: `0 6px 20px -4px ${step.color.includes('violet') ? 'hsl(var(--primary) / 0.5)' : step.color.includes('orange') ? 'hsl(25 95% 53% / 0.5)' : step.color.includes('emerald') ? 'hsl(var(--btn-params) / 0.5)' : step.color.includes('pink') ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--btn-blueprint) / 0.5)'}`,
                    } : isDone ? {
                      background: `linear-gradient(135deg, ${step.color.includes('violet') ? 'hsl(var(--primary) / 0.7)' : step.color.includes('orange') ? 'hsl(25 95% 53% / 0.7)' : step.color.includes('emerald') ? 'hsl(var(--btn-params) / 0.7)' : step.color.includes('pink') ? 'hsl(var(--accent) / 0.7)' : 'hsl(var(--btn-blueprint) / 0.7)'}, ${step.color.includes('violet') ? 'hsl(280 70% 55% / 0.7)' : step.color.includes('orange') ? 'hsl(0 85% 55% / 0.7)' : step.color.includes('emerald') ? 'hsl(180 70% 40% / 0.7)' : step.color.includes('pink') ? 'hsl(340 75% 50% / 0.7)' : 'hsl(240 80% 55% / 0.7)'})`,
                    } : undefined}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all",
                      isActive
                        ? "bg-white/25 text-white shadow-inner"
                        : isDone
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isDone && !isActive ? "✓" : step.icon}
                    </span>
                    <span className="hidden md:inline truncate">{step.question}</span>
                    {stepTotal > 0 && (
                      <span className={cn(
                        "text-[9px] px-1.5 rounded-full min-w-[16px] text-center font-black ml-auto shrink-0",
                        isActive || isDone
                          ? "bg-white/25 text-white"
                          : "bg-primary text-primary-foreground"
                      )}>
                        {stepTotal}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* DNA Strength Mini Bar — Premium */}
            <div className="flex items-center gap-3">
              {/* Glowing progress bar */}
              <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: 'hsl(var(--muted) / 0.5)', boxShadow: 'inset 0 1px 3px hsl(0 0% 0% / 0.15)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out relative"
                  style={{
                    width: `${smartDNA.strength}%`,
                    background: smartDNA.strength >= 70
                      ? 'linear-gradient(90deg, hsl(160 85% 45%), hsl(140 90% 50%), hsl(80 95% 55%))'
                      : smartDNA.strength >= 40
                      ? 'linear-gradient(90deg, hsl(35 95% 50%), hsl(45 100% 55%), hsl(55 95% 60%))'
                      : 'linear-gradient(90deg, hsl(0 85% 50%), hsl(15 90% 55%), hsl(30 95% 55%))',
                    boxShadow: smartDNA.strength >= 70
                      ? '0 0 12px hsl(140 90% 50% / 0.6), 0 0 4px hsl(80 95% 55% / 0.4)'
                      : smartDNA.strength >= 40
                      ? '0 0 12px hsl(45 100% 55% / 0.6), 0 0 4px hsl(35 95% 50% / 0.4)'
                      : '0 0 12px hsl(0 85% 50% / 0.5), 0 0 4px hsl(15 90% 55% / 0.3)',
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.6), transparent)',
                        animation: 'shimmer 2.5s infinite',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* DNA % label — glowing pill */}
              <span
                className="text-[11px] font-black tracking-wider shrink-0 px-3 py-1 rounded-full"
                style={{
                  background: smartDNA.strength >= 70
                    ? 'linear-gradient(135deg, hsl(160 85% 40%), hsl(140 90% 45%))'
                    : smartDNA.strength >= 40
                    ? 'linear-gradient(135deg, hsl(35 95% 45%), hsl(45 100% 50%))'
                    : 'linear-gradient(135deg, hsl(0 75% 45%), hsl(15 85% 50%))',
                  color: 'white',
                  boxShadow: smartDNA.strength >= 70
                    ? '0 4px 16px -4px hsl(140 90% 45% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    : smartDNA.strength >= 40
                    ? '0 4px 16px -4px hsl(45 100% 50% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    : '0 4px 16px -4px hsl(0 75% 45% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
                  textShadow: '0 1px 2px hsl(0 0% 0% / 0.3)',
                }}
              >
                DNA {smartDNA.strength}%
              </span>

              {/* Selected count — premium badge */}
              <span
                className="text-[10px] font-black shrink-0 px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{
                  background: 'linear-gradient(135deg, hsl(260 85% 55%), hsl(280 80% 60%), hsl(300 75% 55%))',
                  color: 'white',
                  boxShadow: '0 4px 14px -4px hsl(270 80% 55% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
                  textShadow: '0 1px 2px hsl(0 0% 0% / 0.3)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                {totalSelected} সিলেক্টেড
              </span>

              {/* Random button — premium animated */}
              <button
                onClick={randomize}
                className="group/rand relative text-[10px] font-black shrink-0 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-300 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsl(210 100% 55%), hsl(190 95% 50%), hsl(170 90% 45%))',
                  color: 'white',
                  boxShadow: '0 4px 16px -4px hsl(200 100% 50% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.25)',
                  textShadow: '0 1px 2px hsl(0 0% 0% / 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px -4px hsl(200 100% 50% / 0.75), inset 0 1px 0 hsl(0 0% 100% / 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px -4px hsl(200 100% 50% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.25)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                <Shuffle className="w-3 h-3 group-hover/rand:animate-spin" />
                র‍্যান্ডম
              </button>
            </div>

            {/* Shimmer keyframes */}
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `}</style>
          </div>

          {/* === STEP CONTENT === */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Step Question Header — removed to maximize space for selections */}

            {/* Categories as Accordion Cards */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-2 space-y-1.5">
                {stepCats.map((cat) => {
                  const catSelCount = (selections[cat.id] || []).length;
                  const isExpanded = expandedCats.has(cat.id);
                  return (
                    <div key={cat.id} className={cn(
                      "rounded-xl border transition-all duration-200",
                      catSelCount > 0 ? "border-primary/30 bg-primary/[0.03]" : "border-border/50 bg-secondary/20"
                    )}>
                      {/* Category Header — clickable to expand/collapse */}
                      <button
                        onClick={() => toggleCatExpand(cat.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-secondary/40 rounded-xl transition-colors"
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-bold text-sm text-foreground flex-1 text-left">
                          {cat.titleBn.replace(/^[^\s]+\s/, '')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{cat.options.length} অপশন</span>
                        {catSelCount > 0 && (
                          <Badge className="text-[9px] h-5 bg-primary text-primary-foreground">
                            {catSelCount} টি
                          </Badge>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>

                      {/* Options — shown when expanded */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-0">
                          <div className="flex flex-wrap gap-1.5">
                            {/* Sort: relevant options first */}
                            {[...cat.options]
                              .sort((a, b) => {
                                const aSelected = (selections[cat.id] || []).includes(a.id) ? 1 : 0;
                                const bSelected = (selections[cat.id] || []).includes(b.id) ? 1 : 0;
                                if (aSelected !== bSelected) return bSelected - aSelected;
                                return getRelevanceScore(b) - getRelevanceScore(a);
                              })
                              .map((opt) => {
                              const isSelected = (selections[cat.id] || []).includes(opt.id);
                              const relevant = isOptionRelevant(opt);
                              const relevanceScore = getRelevanceScore(opt);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => toggleOption(cat.id, opt.id)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer relative",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                                      : relevant
                                      ? "bg-accent/15 border-accent/50 text-foreground ring-1 ring-accent/30 hover:bg-accent/25 hover:shadow-sm"
                                      : "bg-background/80 border-border/60 text-foreground/70 hover:bg-secondary hover:text-foreground hover:border-border hover:shadow-sm"
                                  )}
                                >
                                  {opt.emoji && <span className="text-sm">{opt.emoji}</span>}
                                  <span>{opt.labelBn}</span>
                                  {relevant && !isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 animate-pulse" title="আগের সিলেকশনের সাথে মিলে" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Custom Input for this step */}
                <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">✏️</span>
                    <span className="font-bold text-sm text-foreground/80">কাস্টম ইনপুট</span>
                    <span className="text-[10px] text-muted-foreground">নিজের মতো লিখুন</span>
                  </div>
                  <input
                    type="text"
                    placeholder={`যেমন: ${WIZARD_STEPS[currentStep]?.desc || 'আপনার পছন্দ লিখুন'}...`}
                    value={customInputs[currentStep] || ""}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 200);
                      setCustomInputs(prev => ({ ...prev, [currentStep]: val }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    maxLength={200}
                  />
                  {(customInputs[currentStep] || "").length > 0 && (
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {(customInputs[currentStep] || "").length}/200
                      </span>
                      <button
                        onClick={() => setCustomInputs(prev => ({ ...prev, [currentStep]: "" }))}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        মুছুন
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>


            {/* DNA Preview (collapsible) */}
            {smartDNA.dna && (
              <div className="px-4 py-2 shrink-0 border-t border-border/30">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Sparkles className="w-3 h-3" />
                  তৈরি হওয়া DNA দেখুন
                  {showPreview ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                  <Copy
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(smartDNA.dna);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  />
                  {copied && <Check className="w-3 h-3 text-primary" />}
                </button>
                {showPreview && (
                  <pre className="text-[10px] mt-1.5 p-2 rounded bg-muted/50 whitespace-pre-wrap max-h-20 overflow-auto">
                    {smartDNA.dna}
                  </pre>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="px-4 py-2 flex items-center justify-end gap-2 border-t border-border/30 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1"
                onClick={resetAll}
              >
                <RotateCcw className="w-3 h-3" /> রিসেট
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 gap-1 bg-gradient-to-r from-primary to-primary/80"
                onClick={handleSave}
                disabled={saving || totalSelected === 0}
              >
                <Save className="w-3 h-3" /> {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
