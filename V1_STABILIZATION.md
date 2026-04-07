# Eidomancer V1 Stabilization Checklist

## Purpose
Stabilize Eidomancer so it:
- loads reliably
- generates a cast
- renders the cast cleanly

This is NOT a feature-building phase.

> V1 Goal: **Simple. Stable. Finishable.**

---

## Core Rule

Only change a file if it:
- helps the app load
- helps a cast generate
- helps a cast render
- reduces fragility/confusion

Otherwise: **leave it alone**

---

# PASS 1 — CORE APP STABILITY

## /src/App.jsx
**Status:** 🔥 HOT

### Check
- [ ] App loads with no blank screen
- [ ] All imports resolve (no missing files)
- [ ] No duplicate or legacy components imported
- [ ] Navigation does not point to dead views
- [ ] One clear default screen (no confusion on load)

### Fix if needed
- [ ] Comment out unfinished views (SkillTree, Journal, Export if unstable)
- [ ] Remove orphan buttons/links
- [ ] Clean obvious patch logic from debugging

### Do NOT
- Redesign layout
- Add new UI sections
- Add features

---

## /package.json
**Status:** 🔥 HOT

### Check
- [ ] `npm install` works cleanly
- [ ] `npm run dev` (or equivalent) starts app
- [ ] No obviously unused dependencies
- [ ] Scripts are minimal and understandable

### Fix if needed
- [ ] Remove dead dependencies (ONLY if obvious)
- [ ] Simplify scripts

### Do NOT
- Add Electron
- Add packaging logic
- Prepare for distribution

---

# PASS 2 — CAST SYSTEM (HEART OF APP)

## /src/castEngine.js
**Status:** 🔥 CRITICAL

### Check
- [ ] Output structure is consistent every time
- [ ] Sections always exist (signal, tension, pattern, poem, echo)
- [ ] Section names NEVER change dynamically
- [ ] Short input still produces valid output
- [ ] No undefined/null crashes

### Fix if needed
- [ ] Standardize section keys EXACTLY:
  - signal
  - tension
  - pattern
  - poem
  - echo
- [ ] Add fallback text if generation fails
- [ ] Remove unstable experimental branches

### Do NOT
- Add new section types
- Add complex symbolic layering
- Expand logic depth

---

## /src/components/CastSection.jsx
**Status:** 🔥 CRITICAL

### Check
- [ ] Every section renders
- [ ] Each section has a sigil
- [ ] Each section has a style
- [ ] Long text does NOT collapse layout
- [ ] Empty/missing section handled gracefully

### Fix if needed
- [ ] Add fallback sigil + style
- [ ] Improve spacing/padding
- [ ] Ensure sections feel distinct (not identical blocks)

### Do NOT
- Add animations
- Add heavy visual effects
- Add image rendering yet

---

## /src/styles/castStyles.js (or styles object inside component)
**Status:** 🔥 HOT

### Check
- [ ] ONE source of truth for styles
- [ ] ONE source of truth for sigils
- [ ] Keys match castEngine EXACTLY
- [ ] No duplicate style definitions elsewhere

### Fix if needed
- [ ] Consolidate style objects into one file/location
- [ ] Standardize keys:
  - signal
  - tension
  - pattern
  - poem
  - echo
- [ ] Remove conflicting or duplicate maps

### Do NOT
- Add theme switching
- Add user-adaptive styling

---

# PASS 3 — STATE STABILITY

## /src/hooks/useEidomancerStore.js
**Status:** 🔥 HOT

### Check
- [ ] Default values exist (no undefined crashes)
- [ ] Cast data survives normal navigation
- [ ] No leftover debug/test state
- [ ] State names match component usage

### Fix if needed
- [ ] Remove unused state fields
- [ ] Add safe defaults
- [ ] Clean naming inconsistencies

### Do NOT
- Add persistence systems
- Add advanced syncing
- Expand feature scope

---

## /src/data/starterPrompts.js
**Status:** 🟡 WARM

### Check
- [ ] Prompts are usable and on-theme
- [ ] Format matches input system
- [ ] List is short (3–6 strong prompts)

### Fix if needed
- [ ] Remove weak prompts
- [ ] Keep only strong examples

### Do NOT
- Add large libraries
- Categorize prompts

---

# PASS 4 — SCOPE CONTROL (CRITICAL)

## /src/components/CulturalProfileSetup.jsx
**Status:** 🟡 WARM

### Check
- [ ] Only essential fields visible
- [ ] Setup is short and understandable
- [ ] Inputs affect something real

### Fix if needed
- [ ] Hide unused inputs
- [ ] Simplify wording/flow

### Do NOT
- Expand profile system
- Add new fields

---

## /src/components/FlipJournal.jsx
**Status:** ❄️ FREEZE

### Check
- [ ] Does not break app load

### Fix if needed
- [ ] Remove from navigation if unstable
- [ ] Leave as placeholder if needed

### Do NOT
- Improve functionality
- Expand system

---

## /src/components/SkillTreeTips.jsx
**Status:** ❄️ FREEZE

### Check
- [ ] Does not cause errors

### Fix if needed
- [ ] Remove from navigation

### Do NOT
- Expand or refine
- Add visuals

---

## /src/components/ExportDeck.jsx
**Status:** 🟡 WARM

### Check
- [ ] Loads without errors
- [ ] UI only visible if usable

### Fix if needed
- [ ] Limit to ONE simple export path
- [ ] Hide incomplete options

### Do NOT
- Build full export system
- Add monetization features

---

# WORK SESSIONS

## Session A — CORE STABILITY (DO THIS FIRST)
Work ONLY on:
- App.jsx
- castEngine.js
- CastSection.jsx
- castStyles.js
- package.json

**Goal:**
- App loads
- Cast generates
- Cast renders cleanly

---

## Session B — FLOW
- useEidomancerStore.js
- starterPrompts.js
- CulturalProfileSetup.jsx

**Goal:**
- User can enter → cast → view without confusion

---

## Session C — CLEANUP ONLY
- FlipJournal.jsx
- SkillTreeTips.jsx
- ExportDeck.jsx

**Goal:**
- These do NOT break the app

---

# STOP CONDITIONS

Stop when ALL are true:
- [ ] App loads cleanly
- [ ] One cast works end-to-end
- [ ] Sections are visually distinct
- [ ] No dead navigation paths
- [ ] Optional features are not interfering

> STOP HERE. DO NOT ADD FEATURES.

---

# COMMIT RULES

Commit ONLY when:
- App load is fixed
- Cast structure stabilized
- Rendering improved
- Broken navigation removed

### Good commit messages
- `fix app shell imports`
- `stabilize cast output structure`
- `clean cast section styles`
- `hide unstable v1 views`

### Do NOT commit
- experiments
- partial changes
- visual tinkering

---

# PRIORITY MAP

## 🔥 HOT (ACTIVE WORK)
- App.jsx
- castEngine.js
- CastSection.jsx
- castStyles.js
- useEidomancerStore.js
- package.json

## 🟡 WARM (LIGHT TOUCH)
- starterPrompts.js
- CulturalProfileSetup.jsx
- ExportDeck.jsx

## ❄️ FREEZE (DO NOT EXPAND)
- FlipJournal.jsx
- SkillTreeTips.jsx
- advanced visuals
- experimental systems

---

# FINAL REMINDER

> A stable Eidomancer beats a powerful broken one.

Ship the core.
Then expand.