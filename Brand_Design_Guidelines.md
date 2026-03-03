## Eterny 2.0 – Brand & Design Guidelines (for AI Design Agents)

This document defines the visual and interaction language for Eterny 2.0. It is written for design AIs (e.g. Google Stitch, Figma AI) that will generate screens, components, and visuals.

The core principle: **near‑black & white first, color only as subtle emphasis.**

---

### 1. Brand Essence

- **Brand idea**: Long‑term wellness and self‑knowledge. Calm, analytical, trustworthy.
- **Tone**:
  - Calm, minimal, non‑shouty.
  - Trustworthy and data‑literate (feels like a good lab report or a well‑designed dashboard).
  - Supportive and human, but not cute or playful.
- **Overall look**: High‑contrast, monochrome UI with sparing, purposeful color accents.

---

### 2. Color System

#### 2.1 Base Palette (Monochrome)

- **Background (app)**: `#FFFFFF`
- **Background (subtle surfaces)**: `#F9FAFB`
- **Primary text**: `#111827` (near‑black)
- **Secondary text**: `#6B7280` (muted gray)
- **Borders / dividers**: `#E5E7EB`
- **Disabled / placeholders**: `#9CA3AF`

Use this palette for **80–90% of the UI**.

#### 2.2 Accent Colors (Sparing Use Only)

These exist but must be used **very selectively**, mainly for:
- Primary call‑to‑action buttons
- Focus / selection outlines
- Critical tags (e.g. “Alert”, “High Priority”)

Recommended accents:

- **Primary accent** (default): `#111827` (near‑black)
  - Preferred over bright colors. Primary buttons can be filled near‑black on white.
- **Secondary accent** (optional): `#0EA5E9` (soft cyan) or `#6366F1` (indigo)
  - Use only for special states: active tabs, important metrics in analytics, or links.
- **Semantic colors** (rare, minimal):
  - Success: `#16A34A`
  - Warning: `#F97316`
  - Error: `#DC2626`

**Rules for color usage:**
- Default screens must look almost entirely black, white, and gray.
- Do not use more than **one chromatic accent color** on screen at a time, unless in charts.
- Avoid large surfaces of saturated color; accents should be on small elements (icons, dots, pills, chart lines).

---

### 3. Typography

#### 3.1 Font Family (Inter Everywhere)

- Use **Inter** as the **single, canonical font on all platforms** (web, Android, iOS).
- Always attempt to load Inter (via font files or font service) and apply it across the app.
- Only if Inter fails to load (network/offline or technical error), fall back to a generic sans‑serif stack.

Implementation expectations for design agents:
- **Mobile (Expo / React Native)**: treat Inter as the default font (e.g. using `expo-font`), and assume all text components use Inter unless explicitly marked otherwise.
- **Web**: use CSS `font-family: "Inter", sans-serif;` globally; do not switch to system fonts intentionally.

#### 3.2 Type Scale

Use a simple, reusable scale:

- **Display** (rare hero metrics): 32–36, semi‑bold
- **H1 / Screen title**: 24, semi‑bold
- **H2 / Section title**: 20, semi‑bold
- **H3 / Card title / Label**: 16–18, semi‑bold
- **Body**: 14–16, regular
- **Caption / Meta**: 12–13, regular, secondary color (`#6B7280`)

**Rules:**
- Titles are left‑aligned, not centered (except splash).
- Use line height around **1.3–1.4×** font size.
- Button text: 14–16, medium or semi‑bold, all in sentence case (no ALL CAPS).

---

### 4. Layout & Spacing

#### 4.1 Grid & Spacing

- Horizontal padding:
  - Mobile: 16–20 px from screen edge
  - Tablet/Web: 24–32 px
- Vertical spacing increments: 4 / 8 / 12 / 16 / 24 px.
- Typical spacings:
  - Between sections: 24 px
  - Title → content: 8–12 px
  - Between list items: 8–12 px

#### 4.2 Containers & Surfaces

- Cards / sections:
  - Background: `#FFFFFF`
  - Border radius: 10–12 px
  - Border: 1 px solid `#E5E7EB` or very light shadow
  - Internal padding: 12–16 px
- Avoid heavy shadows. Prefer subtle borders and spacing to separate elements.

#### 4.3 Screen Structure

Common pattern:

1. **Header**: Title + optional actions (icon buttons).
2. Optional **sub‑navigation**: tabs, chips, date filters.
3. **Primary content**: lists, charts, cards.
4. **Primary action**: a prominent button near the bottom or in a consistent place.

Avoid more than one primary scrollable region per screen.

---

### 5. Core Components

> **Component library note:** On web, prefer shadcn UI primitives and patterns (cards, buttons, inputs, dialogs, etc.) as the baseline implementation, adapted to the monochrome + Inter system defined here. Preserve shadcn’s structural patterns but override tokens (colors, radius, spacing, fonts) to match this guideline.

#### 5.1 App Header

- Height: 56–64 px.
- Background: `#FFFFFF`.
- Left: back arrow or small wordmark (“Eterny” in system font, bold).
- Center: screen title (H1).
- Right: 1–2 icon buttons maximum (e.g. profile, menu).
- Divider line below header: 1 px, `#E5E7EB` (optional, depending on design).

#### 5.2 Tabs & Navigation

- **Bottom tabs** (mobile):
  - Background: `#FFFFFF`, 1 px top border `#E5E7EB`.
  - Icons: stroke‑based, near‑black when active, gray when inactive.
  - Labels: 12–13, semi‑bold.
- **Top tabs** (within a screen):
  - Use text tabs with an underline or pill indicator.
  - Active tab: near‑black text + near‑black underline.
  - Inactive tab: `#6B7280` text, no underline.

#### 5.3 Buttons

- **Primary button**
  - Fill: `#111827` (near‑black).
  - Text: `#FFFFFF`, 14–16, semi‑bold.
  - Radius: 10–12 px.
  - Height: ~44–48 px.
- **Secondary button**
  - Transparent/white background, 1 px `#111827` border.
  - Text: `#111827`.
- **Tertiary / text button**
  - No border, text only, `#111827` or a subtle accent color.

States:
- Hover / pressed: slight darkening and/or subtle scale (web only).
- Disabled: reduced opacity, muted text (`#9CA3AF`).

#### 5.4 Inputs

- Text input fields:
  - Border: 1 px, `#E5E7EB`, radius 8 px.
  - Label above input: 14, secondary text color.
  - Focused: border changes to near‑black (or accent color), no glow.
  - Error: border `#DC2626` + caption message below.
- Checkboxes / toggles:
  - Prefer simple, monochrome checkboxes or switches.
  - Checked: near‑black fill with white check.
  - Unchecked: white fill with `#D1D5DB` border.

#### 5.5 List Items & Cards

General pattern for list row:

- Left: icon / status indicator / checkbox.
- Middle: title (H3) + optional subtitle (caption in secondary color).
- Right: value or chevron icon (navigation hint).

Use consistent vertical padding (10–14 px) per row.

---

### 6. Iconography

- Use **simple line icons** (stroke 1.5–2 px, rounded caps).
- Default icon color: `#6B7280`.
- Active/primary icons: `#111827`.
- Error icons: `#DC2626` (sparingly).
- Do not mix multiple icon styles (e.g. don’t mix filled and outline in the same view).

---

### 7. Motion & Interaction

- Motion should be **subtle and utility‑driven**, not ornamental.
- Durations:
  - Button presses: 120–180 ms.
  - Screen transitions: 200–250 ms.
- Easing: use standard ease‑in‑out; avoid bouncy or elastic curves.
- Examples:
  - Tapping a card: slight background darkening, no strong scale.
  - Navigating screens: simple slide or fade, minimal parallax.

---

### 8. Content & Copy

- Sentence case for headings and labels: “Today’s schedule”, not “TODAY’S SCHEDULE”.
- Be concise and descriptive:
  - Good: “Today’s plan”, “Wellness summary”.
  - Avoid: overly cute or ambiguous labels.
- Error messages:
  - Clear and actionable, e.g. “Couldn’t save changes. Check your connection and try again.”

---

### 9. Do & Don’t Summary (for AI Agents)

**Do:**
- Use **near‑black and white** as the primary palette.
- Use a **single accent color at a time**, and only where it adds clarity.
- Keep layouts **simple, with clear hierarchy and generous white space**.
- Use **system fonts** and the standardized type scale.
- Ensure components across screens look like they belong to the same family.

**Don’t:**
- Don’t create colorful gradients or full‑bleed colored backgrounds.
- Don’t use more than one strong accent color on a single screen (outside data visualizations).
- Don’t introduce new fonts, rounded pills with neon colors, or skeuomorphic effects.
- Don’t overload screens with icons; text and spacing should carry most of the hierarchy.

---

### 10. How to Use These Guidelines

When generating screens or components:

1. **Start monochrome**: layout, typography, and spacing first.
2. Apply **near‑black primary elements** for the main actions.
3. Add at most **one accent color** where it clarifies state, selection, or importance.
4. Verify that the final screen still reads predominantly black–white–gray at a glance.

These rules should guide all Eterny 2.0 visuals across mobile, web, and any generated design assets.

