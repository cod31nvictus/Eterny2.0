## Eterny 2.0 – Phase 1 Screen Prompts for Google Stitch

Each section contains a ready-to-use prompt for designing a specific screen. Paste the full prompt (including the design guidelines) into Google Stitch or another design AI.

Before individual prompts, here are **global visual constraints** that must apply to **every** screen:

> IMPORTANT GLOBAL VISUAL CONSTRAINTS (apply to the entire screen):
>
> - The design MUST be **light mode only**.
> - The main app background MUST be pure white `#FFFFFF`. Do **not** use dark or black full-screen backgrounds.
> - Cards and surfaces can use white `#FFFFFF` or very light gray (`#F9FAFB` / `#F3F4F6`), but at a glance the screen should read as a white/light UI.
> - Do **not** produce dark mode, inverted colors, or black/dark full-screen backgrounds.
> - Color palette is monochrome:
>   - Primary text: near-black `#111827`
>   - Secondary text: gray `#6B7280`
>   - Borders: light gray `#E5E7EB`
>   - Disabled/meta: gray `#9CA3AF`
> - Any chromatic accents (if used at all) must be small, subtle elements on top of a white/light base (e.g. icons, tiny indicators), never as background fills.

---

### 1. Phone Login (phone + password) screen

```text
Design a “Phone Login” screen for Eterny 2.0.

Functional requirements:
- Inputs:
  - Phone number (primary identifier; international friendly, but you can assume a standard numeric field with country code selector or simple prefix).
  - Password.
- Actions:
  - Primary button: “Sign in”.
  - Secondary text link: “Create account” (navigates to Signup).
  - Secondary text link: “Sign in with OTP instead” (navigates to OTP flow).
- Social stubs:
  - Row of secondary buttons or icon buttons for “Continue with Google”, “Continue with Apple”, “Continue with Microsoft”.
  - These are clearly marked as “Coming soon” (e.g. small caption under the row).
- Error display:
  - Space for an inline error message (e.g. “Invalid phone or password”) under the form.
- State:
  - Loading state on the primary button when a sign‑in request is in progress.

Information architecture and layout:
- Simple vertical layout:
  - Top: minimal header with small Eterny wordmark or app name, left‑aligned.
  - Middle: form card containing phone + password fields and primary button.
  - Below form: links for Signup and OTP, then social buttons group.
  - Bottom: small legal text (e.g. “By signing in you agree to…”).

Design guidelines (apply strictly to this screen):
- Brand & tone:
  - Eterny 2.0 is calm, analytical, and minimalist. No playful or loud visuals.
- Color:
  - Almost entirely monochrome: white (#FFFFFF), near‑black (#111827), grays (#F9FAFB, #E5E7EB, #6B7280, #9CA3AF).
  - Primary button is near‑black fill (#111827) with white text.
  - Avoid large areas of bright color. If any accent is used (e.g. for links), keep it subtle and limited.
- Typography:
  - Use the Inter font family on all platforms. Do NOT intentionally fall back to system fonts unless Inter fails to load.
  - Screen title: 24, semi‑bold. Labels: 14, regular. Input text and body: 14–16, regular. Button text: 14–16, semi‑bold, sentence case.
- Layout & spacing:
  - Horizontal padding: 16–20 px on mobile, 24–32 px on web.
  - Use generous white space; clearly separate the form card from the background with padding and a subtle border or light shadow.
  - Inputs: full‑width, 1 px border (#E5E7EB), 8 px radius, label above input.
- Components:
  - Buttons: rounded rectangle (10–12 px radius); primary filled in near‑black; secondary as outline or text button.
  - Inputs: labeled text fields with clear focus states (border darkens to near‑black).
  - Social buttons: quiet, not brand‑colored; use monochrome icons and text with a border.
- Iconography:
  - Simple line icons only if needed (e.g., phone icon inside the phone field); use monochrome stroke, no filled icons.
- Motion:
  - Very subtle; e.g., slight darkening on button press. No bouncy animations.
- Web implementation note:
  - For web, this screen should map cleanly onto shadcn UI primitives (card, input, button) with tokens (colors, font = Inter, radius, spacing) adjusted to match the above design system.
```

---

### 2. Signup (phone + password) screen

```text
Design a “Signup” screen for Eterny 2.0.

Functional requirements:
- Inputs:
  - Phone number.
  - Password.
  - Confirm password.
  - Optional: a simple name field (“Name”) if needed to personalize the app.
- Actions:
  - Primary button: “Create account”.
  - Secondary text link: “Already have an account? Sign in” (navigates back to Login).
  - Secondary text link: “Use OTP instead” (links to OTP flow).
- Social stubs:
  - Same social row as Login (“Continue with Google / Apple / Microsoft”) shown as “Coming soon” stubs.
- Error display:
  - Inline validation for password mismatch and basic phone validity.
  - Room for a global error (e.g. “Phone already registered”).

Information architecture and layout:
- Similar structure to Login, but with a clear title and short one‑line description (e.g. “Create your Eterny account”).

Design guidelines (apply strictly to this screen):
- Brand & tone:
  - Same minimalist, clinical feel as Login. No illustrations or gradients.
- Color:
  - Same monochrome palette: white background, near‑black text, subtle gray borders and dividers.
  - Primary call‑to‑action in near‑black; avoid other strong colors.
- Typography:
  - Inter only; no other fonts. Title 24 semi‑bold, subtitle 14–16 regular, labels 14, body text 14–16, button text 14–16 semi‑bold.
- Layout & spacing:
  - Centered or top‑aligned card with consistent padding. Use 8 / 12 / 16 / 24 px spacing increments between groups (title, form, footer).
- Components:
  - Inputs and buttons consistent with Login screen (borders, radius, focus states).
  - Social buttons visually subordinate to the primary form.
- Iconography & motion:
  - Same as Login: minimal line icons, subtle press feedback.
- Web implementation note:
  - Design should map to shadcn UI components (card, form, input, button) styled with the same token set as Login so both screens feel like a coherent flow.
```

---

### 3. OTP Flow screens (Request OTP + Verify OTP)

```text
Design the OTP authentication flow for Eterny 2.0 as two related screens:

Screen A: “Request OTP”
- Inputs:
  - Phone number.
- Actions:
  - Primary button: “Send OTP”.
  - Secondary text link: “Sign in with password instead”.
- Behavior:
  - After pressing “Send OTP”, show a subtle confirmation (“Code sent to your phone” or for dev: “OTP: 123456”) and transition to Verify screen.

Screen B: “Verify OTP”
- Inputs:
  - OTP code (4–6 digit numeric).
- Actions:
  - Primary button: “Verify”.
  - Secondary text link: “Resend code” (non‑prominent).
  - Secondary text link: “Use password instead”.
- State:
  - Show remaining time or simple text like “Code expires in X minutes” (optional).
  - Space for error message (“Invalid or expired code”).

Design guidelines (apply strictly to these screens):
- Brand & tone:
  - Same monochrome, minimal aesthetic as Login/Signup. These screens should visually read like part of the same auth suite.
- Color:
  - Use the same black/white/gray palette:
    - Background: #FFFFFF.
    - Text: #111827, #6B7280 for secondary.
    - Borders: #E5E7EB.
  - Primary buttons filled with #111827; no bright colored highlights.
- Typography:
  - Inter as the only font.
  - Title: 24 semi‑bold (“Sign in with code” / “Verify code”).
  - OTP digits large enough for comfortable reading (18–24), but still clean and minimal.
- Layout & spacing:
  - Single column layout:
    - Title.
    - Short explanation.
    - Phone or OTP input block.
    - Primary action.
    - Secondary links at the bottom of the form.
  - Use generous vertical spacing; screens should feel uncluttered.
- Components:
  - OTP input can be either:
    - One single input field, or
    - 4–6 evenly spaced boxes for each digit.
  - Apply the same border radius and border color as other inputs.
- Motion:
  - Minimal: simple transitions between Request and Verify screens; slight highlight on OTP input when focused.
- Web implementation note:
  - For web, map to shadcn UI form primitives (label, input, button, possibly a segmented OTP input) and keep styling consistent with other auth screens (same tokens and Inter font).
```

---

### 4. Thread List screen (Chat home)

```text
Design the “Thread List” screen (chat home) for Eterny 2.0.

Functional requirements:
- Purpose: show the user’s chat threads and allow starting a new one.
- Content:
  - List of threads with:
    - Thread title (e.g. “Lab results discussion”, “Sleep questions”).
    - Last message snippet (single line, secondary text).
    - Last updated time (e.g. “2h ago”).
  - Empty state when there are no threads (“No conversations yet. Start your first conversation.”).
- Actions:
  - Primary action: “New conversation” button (could be a full‑width button at the top or a floating action button).
  - Tapping a thread opens the Chat Thread screen.

Information architecture and layout:
- Top header:
  - Title: “Conversations” or “Chat”.
  - Optional small profile icon or settings icon on the right.
- Below header:
  - Primary action (New conversation).
  - Search/filter bar (optional, simple text field) to filter threads by keyword.
- Main area:
  - Vertical list of cards/rows; each row is a tappable thread.

Design guidelines (apply strictly to this screen):
- Brand & tone:
  - Monochrome, calm, and oriented toward information clarity.
- Color:
  - Background: white (#FFFFFF).
  - Thread cards: white with border (#E5E7EB) and subtle shadow or no shadow.
  - Text:
    - Title: near‑black (#111827).
    - Snippet and meta: #6B7280.
  - Active selection (if any) can use a very subtle gray background (#F3F4F6); avoid bright highlights.
- Typography:
  - Font: Inter everywhere.
  - Screen title: 24 semi‑bold.
  - Thread title: 16–18 semi‑bold.
  - Snippet: 14 regular, truncated with ellipsis.
  - Timestamp: 12–13, secondary color.
- Layout & spacing:
  - Card padding: 12–16 px inside each thread row.
  - Spacing between cards: 8–12 px.
  - Top padding below header: 16–24 px.
- Components:
  - New conversation action:
    - Either a primary near‑black button labeled “New conversation” or a near‑black circular FAB with a plus icon.
  - Thread row:
    - Left: initial or small avatar (optional) or a simple icon.
    - Center: title + last message.
    - Right: timestamp and (optional) chevron icon.
- Iconography & motion:
  - Use simple line icons (e.g., plus, chevron).
  - Tapping a row shows a slightly darker background on press; transitions to thread screen are simple slide/fade.
- Web implementation note:
  - On web, this should correspond to shadcn UI card/list components with a simple layout that can expand to a two‑pane view later (thread list + active chat) but for Phase 1 you can design it as a single‑pane list.
```

---

### 5. Chat Thread screen (messages + input, with streaming)

```text
Design the “Chat Thread” screen for Eterny 2.0.

STRICT COLOR REQUIREMENTS (override all defaults):
- This chat UI must be fully monochrome. Do NOT use blue or any other color for chat bubbles, backgrounds, or UI elements, except for semantic error text if absolutely needed.
- Background: pure white (#FFFFFF).
- User message bubble:
  - Background: near‑black (#111827) ONLY.
  - Text: white (#FFFFFF).
- Assistant message bubble:
  - Background: light gray (#F9FAFB or #F3F4F6) ONLY.
  - Text: near‑black (#111827).
- Timestamps and meta text: gray (#9CA3AF).
- No blue, green, purple, or any other chromatic color in bubbles, headers, or controls.

Functional requirements:
- Purpose: show a single conversation (user and assistant messages) and allow sending new messages.
- Content:
  - Scrollable message history:
    - User messages.
    - Assistant messages.
    - Visual distinction between the two (position, bubble style).
  - Streaming assistant responses:
    - While streaming, show the assistant message as it grows; final message looks like a normal assistant bubble.
- Actions:
  - Message input at bottom:
    - Multi-line text box (or auto‑expanding).
    - Send button (icon + label or icon only).
- State:
  - Loading indicator for the thread when first opened.
  - Optional subtle “Thinking…” state for assistant while waiting for the first token.

Information architecture and layout:
- Header:
  - Back arrow, thread title (or truncated last user prompt).
  - Optional subtle indicators (e.g. “Using memories” icon, not required in Phase 1).
- Body:
  - Chat bubbles in a vertical scroll area; newest messages near bottom.
- Footer:
  - Input bar with text field and Send button.

Design guidelines (apply strictly to this screen):
- Brand & tone:
  - Clean, almost clinical chat UI. No colored balloons, no chatty decorative elements.
- Color:
  - Follow the strict monochrome rules above; no blue or colored chat bubbles.
- Typography:
  - Font: Inter throughout. Do not intentionally use any other font unless Inter fails to load.
  - Message text: 14–16, regular.
  - Header title: 20–24, semi‑bold.
  - Input text: 14–16.
- Layout & spacing:
  - Bubbles have 10–12 px radius, 8–12 px internal padding.
  - Vertical gap between messages: 4–8 px.
  - Larger gap between user/assistant “groups.”
- Components:
  - Input bar:
    - Full‑width text field with 1 px border (#E5E7EB), 8 px radius.
    - Send button: small near‑black filled button or icon button to the right.
  - Streaming state:
    - Assistant bubble can have a subtle “typing” indicator (e.g., three small dots) while text is streaming in.
    - No fancy animations; minimal pulsing is acceptable.
- Iconography & motion:
  - Send icon: simple arrow or paper plane line icon.
  - Back icon: simple chevron/arrow.
  - Transitions between screens are simple; within the thread, new messages can fade in or slide up slightly.
- Web implementation note:
  - For web, use shadcn primitives for layout (e.g., scroll area, input, button) and restyle them to match the strict monochrome chat aesthetic described here.
```

---

### 6. Profile screen (read‑only buckets list)

```text
Design a read‑only “Profile” screen for Eterny 2.0, focused on structured health and lifestyle data buckets.

Functional requirements:
- Purpose: show the current user profile snapshot grouped into buckets:
  - BasicInfo
  - MedicalProfile
  - Constraints
  - Biomarkers
  - BodyComposition
  - PersonalCare
  - Lifestyle
- Content:
  - Each bucket displayed as a collapsible or card section:
    - Section title (e.g. “Biomarkers”).
    - List of key/value pairs inside (e.g. “HbA1c: 6.2% (Jan 2025)”, “Weight: 72 kg”).
  - Empty states per bucket (e.g. “No data yet”).
- Actions:
  - Phase 1: read‑only; no edit or add buttons required.
  - Top‑right action (optional): info icon or future “Edit” stub, but keep it visually quiet.

Information architecture and layout:
- Header:
  - Title: “Profile”.
  - Optional “Back” navigation or bottom tab integration.
- Body:
  - Vertical list of sections (cards or accordions), one per bucket.
  - Within each section, simple rows with label and value; optional date or source shown in smaller caption text.

Design guidelines (apply strictly to this screen):
- Brand & tone:
  - Strongly minimal, feels like a well‑designed lab report or medical summary.
- Color:
  - Background: #FFFFFF.
  - Section cards: #FFFFFF with subtle border (#E5E7EB) and radius 10–12 px.
  - Text:
    - Section titles: #111827.
    - Field labels: #6B7280.
    - Field values: #111827.
    - Meta (date, source): #9CA3AF.
- Typography:
  - Font: Inter only.
  - Screen title: 24 semi‑bold.
  - Section titles: 16–18 semi‑bold.
  - Field labels: 14 regular, secondary color.
  - Field values: 14–16 regular, primary color.
  - Meta text: 12–13.
- Layout & spacing:
  - Section spacing: 12–16 px between cards.
  - Inside cards: 12–16 px padding; 8–10 px between rows.
- Components:
  - Sections can be:
    - Static open cards; or
    - Simple accordions (shadcn style) with chevron to collapse/expand.
  - Rows: two‑column layout (label on left, value on right) or simple stacked (label above, value below) depending on width.
- Iconography & motion:
  - Optional chevron icons for collapsible sections; simple and monochrome.
  - Expansion/collapse animations should be minimal and fast.
- Web implementation note:
  - For web, this maps cleanly to shadcn’s Accordion or Card + List components, styled with the same monochrome + Inter system defined elsewhere (no additional colors introduced on this screen).
```

