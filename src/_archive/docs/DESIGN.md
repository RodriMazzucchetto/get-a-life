# Design System Philosophy: The Focused Architect

This design system is built for high-performance productivity. We are moving beyond the "SaaS-template" look to create an environment that feels like a high-end physical workspace: quiet, organized, and tactically precise. We prioritize cognitive ease through tonal depth and editorial spacing rather than rigid containment.

## 1. Creative North Star: "Atmospheric Precision"
The system is anchored by the **"Atmospheric Precision"** concept. While many task managers feel cluttered and "boxy," this system utilizes intentional asymmetry and tonal layering to guide the eye. We treat the interface as a series of sophisticated, nested planes. By removing heavy lines and utilizing high-contrast typography scales, we transform a utility tool into a premium executive experience.

---

## 2. Color & Surface Architecture
Our palette uses a foundation of Deep Blue and Soft Gray, but we apply them through a lens of depth rather than flat fills.

### Surface Hierarchy & Nesting
We reject the flat grid. Hierarchy is achieved through "Tonal Stacking."
*   **Base Layer:** The `background` (#f8f9fb) acts as the canvas.
*   **Sectioning:** Use `surface_container_low` (#f3f4f6) to define large functional areas (like a sidebar or navigation rail).
*   **Interaction Planes:** Cards or task items should use `surface_container_lowest` (#ffffff) to "lift" off the page naturally.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established via background shifts or vertical whitespace. A `surface_container_high` section sitting on a `surface` background provides all the definition a user needs without the visual "noise" of a border.

### The "Glass & Gradient" Rule
To inject "soul" into the professional aesthetic:
*   **Floating Elements:** Use `surface_container_lowest` with a 20px backdrop-blur and 80% opacity for modals and dropdowns to create a frosted glass effect.
*   **Signature Textures:** For primary CTAs and high-level progress summaries, apply a subtle linear gradient from `primary` (#00288e) to `primary_container` (#1e40af). This adds a "weighted" feel that flat hex codes lack.

---

## 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headlines) with **Inter** (Body/Labels) to create a "Technical Editorial" look.

*   **Display & Headlines (Manrope):** Use `display-md` for empty states or dashboard greetings to provide a sense of premium craft.
*   **Body & Utility (Inter):** Inter is our workhorse. Use `body-md` for task descriptions and `label-sm` for metadata.
*   **Contrast as Navigation:** High-importance task titles should use `title-lg` in `on_surface`, while secondary metadata (dates, tags) must drop to `label-md` using `on_surface_variant`. This creates a clear "skimming" path for the user.

---

## 4. Elevation & Depth
Depth is a functional tool, not a decoration.

*   **The Layering Principle:** Stack `surface_container` tiers. A `surface_container_lowest` card placed on a `surface_container_low` background creates an immediate, soft focal point.
*   **Ambient Shadows:** If a card requires a floating state (e.g., during a drag-and-drop action), use a highly diffused shadow: `y-12, blur-24, color: rgba(25, 28, 30, 0.06)`. This mimics natural light rather than digital "glow."
*   **The Ghost Border Fallback:** If accessibility requires a border, use the `outline_variant` (#c4c5d5) at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons & Actions
*   **Primary:** Uses the `primary` fill with a subtle gradient to `primary_container`. Roundedness is fixed at `lg` (0.5rem/8px).
*   **Secondary:** No fill. Use `surface_container_high` background on hover.
*   **Tertiary:** Text-only using `on_secondary_fixed_variant`, reserved for low-priority actions like "Cancel."

### Input Fields
*   **The "Quiet" State:** Inputs should not have a full border. Use a `surface_container_high` background with a 2px `primary` bottom-bar that animates to full width only on focus. This keeps the form looking clean until the moment of interaction.

### Cards & Task Lists
*   **Forbid Dividers:** Do not use lines between list items. Use `spacing-4` (1rem) of vertical gap and subtle background color shifts on hover (`surface_container_highest`).
*   **Chips:** Use `tertiary_fixed` for "Success" states and a tinted orange for "Warning." Chips must be pill-shaped (`full` roundedness) to contrast against the `lg` (8px) corners of cards.

### Contextual Components
*   **The Progress Veil:** Use a semi-transparent `primary` gradient overlay on task cards to indicate completion percentage, rather than a standard thin loading bar.
*   **The Focused Blade:** A sliding side-panel (using `surface_container_lowest` and a heavy `24` spacing blur) for task details, ensuring the user never loses the context of their main list.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place high-level stats in a left-aligned editorial layout, leaving "breathing room" (the "White Space of Power") on the right.
*   **Tint Your Neutrals:** Ensure your "Soft Grays" have a hint of blue from the `secondary` palette to keep the workspace feeling cohesive and "cool."
*   **Respect the 8px Grid:** Every margin and padding must be a multiple of the **Spacing Scale** (e.g., `4`, `8`, `12`).

### Don’t:
*   **Don't use 100% Black:** Use `on_surface` (#191c1e) for text. Pure black is too harsh for a "Professional & Productive" aesthetic.
*   **Don't over-shadow:** If more than three elements on a screen have shadows, the interface will feel heavy. Rely on tonal shifts first.
*   **Don't use default "Success" Green:** Use our `tertiary` tokens (#003d27 and its variants). They are more sophisticated and "Forest" toned, avoiding the "neon" look of standard apps.