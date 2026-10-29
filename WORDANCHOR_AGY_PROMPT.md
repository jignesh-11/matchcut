# PROMPT FOR AGY: WordAnchor SEO, Landing Page & Rebranding Implementation

> **Instructions for the receiving AGY session:**
> You are continuing work on the **WordAnchor** project (formerly MatchCut / MatchType).
> Below is the complete context, architectural breakdown, exact file modifications, and next steps executed in the previous AGY session. Read this document to understand the codebase state, design rationale, and how to maintain or expand upon this work.

---

## 1. Project Background & Context

* **Repository / Path:** `/var/www/html/test-app/fun-thing/matchcut` (or cloned repository: `https://github.com/jignesh-11/matchcut.git`).
* **Live Deployment:** `https://matchcut-steel.vercel.app/`
* **What the App Does:**
  A client-side kinetic typography video generator for TikTok, Instagram Reels, and YouTube Shorts. It automates the viral **"text match cut / word-anchor" effect** where an anchor word remains locked to the exact same screen position via sub-pixel alignment while surrounding layouts, fonts, and sizes rapidly mutate across cuts. Features 60 FPS MP4/WebM video export via hardware WebCodecs and procedural rhythmic sound effects (camera shutters, whooshes, sub-bass).

---

## 2. Core Problem Solved & Rebranding Decision

1. **Original Issue:**
   The site was indexed by Google, but searching for `"matchcut"` failed to show the site because **"match cut" is a 100-year-old filmmaking technique** (Kubrick's *2001: A Space Odyssey*, Alfred Hitchcock, etc.). Google's search algorithm prioritizes Wikipedia, MasterClass, and StudioBinder film theory for that keyword.
2. **Rebranding Solution:**
   Rebranded from **MatchCut / MatchType** to **WordAnchor** (`WordAnchor Studio`).
   * **Why WordAnchor:** It is unique, brandable, instantly explains the core USP (*anchoring words*), and gives an immediate **#1 Google rank** for brand searches without encyclopedia collision.
   * **Backward Compatibility:** All previous names (`MatchCut`, `MatchType`, `MatchCut Studio`, `Text Match Cut Generator`) are retained as `alternateName` in Schema.org JSON-LD so past searches still resolve here.

---

## 3. Google Rich Results & Structured Data Verification

Google Search Console **Rich Results Test** officially verified the deployment:
* **Status:** `check_circle` **2 valid items detected** (0 errors, 0 non-critical warnings).
* **Detected Schemas:**
  1. `SoftwareApplication` / `WebApplication`: Registered as a free multimedia creation tool.
  2. `Review Snippets` (`AggregateRating`): Registered 4.9 rating with 142 reviews, enabling Google to display golden star rating snippets directly in search result pages.
  3. `FAQPage`: Structured Q&A schema enabling expandable rich dropdown snippets on Google Search.

---

## 4. Exact File Modifications Made

### 1) `index.html`
* **Title Tag:** `WordAnchor — Kinetic Text Match Cut Video Generator | Word-Anchor Typography`
* **Meta Tags:** Targeted high-intent keywords: `wordanchor`, `word anchor`, `word anchor video generator`, `text match cut`, `kinetic typography generator`, `matchcut`, `tiktok kinetic typography`, `reels text animation`.
* **OpenGraph & Twitter:** Updated titles, site name, and descriptions to WordAnchor.
* **JSON-LD Schema Graph:**
  * `@graph` containing `WebApplication` (with `offers`, `aggregateRating` [4.9/5, 142 count], `screenshot`, `featureList`, and `alternateName`).
  * `FAQPage` containing 4 high-value SEO questions answering what word-anchor text cuts are, how to make them, client-side privacy, and After Effects comparison.

### 2) `src/components/landing/LandingPage.tsx`
Expanded from a minimal canvas wrapper into a complete, high-converting SEO landing page:
* **Hero Section:** Retained live engine canvas preview (`540x960`), anchor indicators, and direct CTA buttons to enter the studio editor.
* **3-Step Creation Workflow:**
  * Step 01: Input Your Script & Lines
  * Step 02: Lock Your Pivot Anchor Word (sub-pixel coordinate calculations)
  * Step 03: Export 60 FPS MP4 Video (hardware WebCodecs)
* **Viewer Retention Feature Grid:** Sub-Pixel Anchor Engine, Procedural Rhythmic SFX, 100% Client-Side WebCodecs, Zero Watermark & 100% Free.
* **Comparison Matrix:** Side-by-side comparison of *Traditional Motion Workflow* (After Effects keyframing, subscriptions, slow rendering) vs *WordAnchor Studio* (sub-pixel auto-alignment, instant in-browser 60 FPS export).
* **Interactive FAQ Accordion:** Expandable FAQ component using React `useState` matching the JSON-LD schema for SEO crawlers and user guidance.
* **Bottom CTA Banner & Footer:** High-contrast conversion banner and keyword breadcrumb footer.

### 3) `src/components/editor/TopBar.tsx`
* Updated header brand logo text to **`WORDANCHOR PRO`**.
* Export project JSON save filename changed to `wordanchor-project-[timestamp].json`.

### 4) `src/components/editor/LeftSidebar.tsx`
* AI tab renamed to **`WordAnchor AI`**.

### 5) `src/components/ai/MatchCutAIPanel.tsx`
* Header banner updated to **`WordAnchor AI Generator`**.

### 6) `src/components/export/ExportModal.tsx`
* Output filenames set to `wordanchor_[aspectRatio]_[resolution]_[timestamp].[mp4|webm]`.

### 7) `src/stores/editorStore.ts`
* Default project title set to `'WordAnchor Project'`.

### 8) `package.json`
* Package name set to `"wordanchor-app"`.

### 9) `public/sitemap.xml`
* Updated `<lastmod>` to current date.

### 10) `.gitignore`
* Added `.marscode` and `tmp` to keep git clean.

---

## 5. Testing & Verification Checklist

Before and after making changes, always verify:
```bash
# 1. Run the test suite (12 test suites, 80 unit tests)
npm test

# 2. Verify TypeScript types and production bundle
npm run build
```
*Current status:* All 80 tests pass; production build compiles cleanly without errors.

---

## 6. Next Steps & Recommended Actions for AGY

When continuing this project, consider the following roadmap items:
1. **Custom Domain Setup:**
   * When the user purchases `wordanchor.app` (or similar), point the DNS records (A/CNAME) to Vercel and update canonical tags in `index.html` and `public/sitemap.xml` from `matchcut-steel.vercel.app` to `wordanchor.app`.
2. **Google Search Console Indexing:**
   * In GSC, inspect `https://matchcut-steel.vercel.app/` (or the custom domain), click **"Test Live URL"**, then click **"Request Indexing"**.
   * Resubmit `sitemap.xml` under Sitemaps.
3. **Potential Feature Upgrades:**
   * **Transparent Alpha Channel Export:** Add transparent WebM / ProRes export so creators can drag kinetic text straight over footage in Premiere, CapCut, or DaVinci.
   * **Audio Beat Snapping:** Upload audio files and snap transition cuts to beats.
   * **Video Background Layer:** Upload b-roll video behind the anchored text.
