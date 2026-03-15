# 🔄 RESTORE GUIDE — Creative Core Project
**Version:** v2.0  
**Last Updated:** 2026-03-15

---

## 🚀 একক মেসেজে পুরো Restore (Copy-Paste Prompt)

> **নতুন Lovable account এ GitHub থেকে কোড আনার পরে, AI কে নিচের prompt টি হুবহু copy-paste করো।**  
> **AI একটি মেসেজ পড়েই পুরো backend + database + auth + storage সম্পূর্ণ restore করবে।**

---

```
আমার Creative Core প্রোজেক্ট সম্পূর্ণ restore করো। GitHub থেকে কোড আছে, এখন database + backend সেটআপ করো। নিচের সব Part একসাথে execute করো — কোনো ধাপ বাদ দেবে না।

### Part A: Database Schema (MUST READ FILE)
`database-snapshot.sql` ফাইলটি পড়ো এবং migration tool দিয়ে execute করো।  
ফাইলে 20টি table, সব RLS policies, functions, triggers আছে।

⚠️ CRITICAL RULES:
- auth.users এ foreign key দেবে না → profiles.user_id ব্যবহার করো
- used_elements.user_id হলো TEXT type → RLS এ (auth.uid())::text cast করো
- blueprint_history.session_id হলো TEXT → UUID reference না
- সব RLS policy PERMISSIVE (default) রাখো → explicitly RESTRICTIVE লিখো না
- used_elements এ UPDATE policy নেই → intentional, দেবে না
- "ALTER DATABASE postgres" ব্যবহার করো না → not allowed
- supabase config/client/types/.env ফাইল edit করো না → auto-generated

### Part B: Auth Configuration
- Email/password auth enabled রাখো
- Auto-confirm email: OFF (users must verify email)
- Anonymous signup: OFF
- handle_new_user trigger auth.users এ attach করো (profiles auto-create)

### Part C: Secrets (Auto-Configured)
এই secrets গুলো Lovable Cloud এ auto-configured, কিছু করতে হবে না:
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
- LOVABLE_API_KEY (Lovable AI gateway)

### Part D: Edge Functions (Auto-Deploy)
এই edge functions গুলো supabase/functions/ ফোল্ডারে আছে, auto-deploy হবে:
- creative-core, concept-fusion, concept-scorer, content-safety
- evolve-concept, generate-storyboard, smart-suggest, bulk-smart-suggest
- agent-orchestrator, ai-memory, get-analytics, track-analytics
- analyze-video, concept-reanimation, concept-to-script
- manage-api-keys, realism-guard-pro, refine-concepts
- _shared/ai-gateway.ts (shared utility)

### Part E: Storage
- `storyboard-images` bucket তৈরি করো (public: true)

### Part F: Verification (সব check করো)
- 20টি table তৈরি হয়েছে কিনা
- সব table এ RLS enabled কিনা
- সব RLS policies PERMISSIVE কিনা
- handle_new_user function exists কিনা
- update_updated_at_column function exists কিনা
- 9টি updated_at triggers আছে কিনা
- Signup করলে profiles এ auto-create হচ্ছে কিনা
- storyboard-images bucket exists (public) কিনা
- Edge functions deploy হয়েছে কিনা

সব শেষে verification checklist result দেখাও।
```

---

## 📋 Restore Flow (Step-by-Step Timeline)

```
1. নতুন Lovable project তৈরি করো
2. GitHub connect করো → existing repo select করো → কোড auto-sync হবে
3. AI কে উপরের "একক মেসেজ" prompt দাও
4. AI পড়ে → database-snapshot.sql execute করে (migration tool)
5. AI → Auth configure করে (auto-confirm OFF)
6. AI → handle_new_user trigger attach করে
7. AI → Storage bucket তৈরি করে
8. AI → Edge functions auto-deploy verify করে
9. AI → Verification checklist result দেয়
10. তুমি → Signup করো → Email verify করো → Login করো
11. তুমি → (Optional) Admin Panel → Import All → JSON backup upload
12. ✅ 100% Restored!
```

---

## ⚠️ CRITICAL MISTAKES TO AVOID

| # | ❌ ভুল | ✅ সঠিক |
|---|--------|---------|
| 1 | `auth.users` এ foreign key reference | `profiles` টেবিল ব্যবহার করো |
| 2 | `used_elements.user_id` কে UUID type ধরা | এটা `TEXT` — RLS এ `(auth.uid())::text` cast করো |
| 3 | `blueprint_history.session_id` কে UUID ধরা | এটা `TEXT` — UUID reference না |
| 4 | RLS policies explicitly RESTRICTIVE লেখা | Default PERMISSIVE রাখো |
| 5 | `config.toml`, `client.ts`, `types.ts`, `.env` edit করা | Auto-generated — touch করো না |
| 6 | `ALTER DATABASE postgres` ব্যবহার | Not allowed |
| 7 | Anonymous signup enable করা | শুধু email/password signup |
| 8 | Edge function এ API key hardcode করা | Secrets ব্যবহার করো (`Deno.env.get()`) |
| 9 | `used_elements` এ UPDATE policy দেওয়া | Intentionally নেই — দেবে না |
| 10 | auth schema modify করা | Reserved — only handle_new_user trigger |

---

## 📊 Project Structure Summary

### Tables (20টি)
| Table | Key Notes |
|-------|-----------|
| `profiles` | user_id UUID UNIQUE, auto-created by trigger |
| `chat_sessions` | pinned, serial_label, active_variant_id columns |
| `session_variants` | FK → chat_sessions, variant_label |
| `chat_messages` | FK → chat_sessions, optional FK → session_variants |
| `blueprint_history` | session_id TEXT (not UUID), pinned, concept_count |
| `saved_blueprints` | is_default, serial_number |
| `bookmarked_concepts` | session_id, message_id, concept_content |
| `concept_scores` | 7 scoring metrics + ai_feedback |
| `concept_runs` | QC pipeline: strictness, passes, realism_score |
| `evolution_chains` | self-referential parent_chain_id |
| `creative_knowledge_base` | FK → evolution_chains, tags array |
| `ai_memory` | key-value with weight + context |
| `analytics_events` | event_type + event_data JSONB |
| `storyboard_frames` | generation_status, image_url |
| `theme_dna` | dna_string + selections JSONB |
| `used_elements` | ⚠️ user_id TEXT, no UPDATE policy |
| `advisor_messages` | role + content per session |
| `app_settings` | setting_key/value, updated_by |
| `saved_suggestions` | section_key, field_label, suggestions JSONB |
| `scene_params_defaults` | params JSONB per user |

### Edge Functions (18টি + 1 shared)
| Function | কাজ |
|----------|------|
| `creative-core` | Main AI content generation |
| `concept-fusion` | Concept merging/fusion |
| `concept-scorer` | Quality scoring (7 metrics) |
| `content-safety` | Safety checking |
| `evolve-concept` | Evolution chain generation |
| `generate-storyboard` | Storyboard frame creation |
| `smart-suggest` | Auto-suggestions |
| `bulk-smart-suggest` | Batch suggestions |
| `agent-orchestrator` | Multi-agent orchestration |
| `ai-memory` | Persistent AI memory |
| `get-analytics` | Analytics retrieval |
| `track-analytics` | Event tracking |
| `analyze-video` | Video analysis |
| `concept-reanimation` | Concept revival |
| `concept-to-script` | Concept → script conversion |
| `manage-api-keys` | API key management |
| `realism-guard-pro` | Realism QC |
| `refine-concepts` | Concept refinement |
| `_shared/ai-gateway.ts` | Shared AI model gateway |

### Secrets (Auto-Provided)
| Secret | Source |
|--------|--------|
| `SUPABASE_URL` | Auto |
| `SUPABASE_ANON_KEY` | Auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto |
| `SUPABASE_DB_URL` | Auto |
| `LOVABLE_API_KEY` | Auto |

### Storage
- `storyboard-images` bucket (public: true)

---

## 🔄 Data Migration (Optional)

আগের account থেকে user data migrate করতে:
1. আগের account এ login → Admin Panel → **Export All** → JSON ডাউনলোড
2. নতুন account এ signup → email verify → login
3. Admin Panel → **Import All** → JSON আপলোড
4. Page reload → সব data restore!

---

## Changelog

### v2.0 (2026-03-15)
- Schema updated: 20টি table (আগে 14টি ছিল)
- নতুন tables: session_variants, concept_runs, advisor_messages, app_settings, saved_suggestions, scene_params_defaults
- নতুন columns: chat_sessions.pinned/serial_label/active_variant_id, blueprint_history.pinned/concept_count, chat_messages.variant_id
- Edge functions: 18টি + 1 shared (আগে 11টি ছিল)
- নতুন edge functions: bulk-smart-suggest, analyze-video, concept-reanimation, concept-to-script, manage-api-keys, realism-guard-pro, refine-concepts
- Restore prompt simplified — একটি মাত্র message এ সম্পূর্ণ restore

### v1.0 (2026-02-26)
- Initial snapshot — 14টি table, 11টি edge functions
