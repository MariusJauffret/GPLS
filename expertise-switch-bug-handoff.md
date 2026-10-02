# Debug task: stuttering CSS transitions on a 3-state "segmented tab + panel" widget

## Your goal
A custom UI widget has a visible **stutter / judder ("saccade")** during some of its state transitions. Diagnose the real cause and fix it so **every** transition is smooth. The motion design (colors, sizes, which tab expands, the drop-down text panel) must stay as-is — only the *smoothness* of the transitions needs fixing. Prefer a robust, modern technique over piling on more easing tweaks (those have already failed — see "What was already tried").

## Stack / constraints
- Plain **vanilla HTML + CSS + JS**. No framework, no build step. Files: `index.html`, `styles.css`, `script.js`.
- The widget appears 3× on the page (one per team member). All share the same markup/CSS/JS.
- Must keep working with `prefers-reduced-motion` (a global rule already forces `transition/animation-duration: 0.01ms`).
- Design tokens available: `--blue: #005488` (blue-700), `--blue-active: #0d7ec9` (blue-500), `--white`, `--radius-card: 10px`, `--shadow`.

## What the widget is
A segmented control of two tabs — **"Expertise"** (left, blue-500) and **"En savoir plus"** (right, blue-700) — joined into one pill (inner corners flattened, no gap). Below the bar is a drop-down **panel** (its own rounded card) that reveals a block of text. Three states:

- **e0 (rest):** the two tabs are equal width (50/50), each showing its label + a `›` chevron. Panel closed (hidden).
- **e1 (Expertise active):** the Expertise tab widens; "En savoir plus" collapses to just its `›` arrow (~44px). Expertise's icon becomes `✕`. Panel opens **below** in blue-500, showing Expertise text.
- **e2 (En savoir plus active):** mirror of e1; the panel opens in blue-700 with different text.
- Panel background always matches the active tab's color. Clicking the active tab again, or tapping outside the bar, returns to e0.

## The bug (precise symptom matrix)
Let e0 = no tab active, e1 = Expertise active, e2 = En savoir plus active.

- **Smooth (no stutter):** `e0→e1`, and `e1↔e2` (switching directly between the two active tabs).
- **Stutters:** `e1→e0`, `e2→e0`, and `e0→e2`.

## Frame-by-frame observations (from a 30fps screen recording, mobile ~488px wide)
Captured a `e2→e0` close at 30fps. What is visible during the close:
1. The **tab bar snaps back to the rest layout (both labels reappear) in ~2 frames (~66ms)** while the **panel is still fully open below it** → you briefly get a "rest bar sitting on top of a still-open panel," which looks broken.
2. As the panel collapses, a **thin colored strip of clipped, half-faded text lingers for 2–3 frames** before the element below (a "languages" bar) snaps back up.
3. On `e0→e2` (open with a color change) the panel appears to reveal in **two stages** (open, then darken) rather than one coherent motion.

The consistent theme: **different sub-properties of one transition run at different speeds / finish at different times**, so they desync. Opening to e1 hides it (no color change; content fades into an already-open panel); switching hides it (panel height doesn't change). The desync only becomes visible when the panel opens/closes AND/OR the color changes.

## Current implementation (this is the *latest* attempt, which still stutters)

### DOM (one instance; repeated 3× with different ids/text)
```html
<div class="expertise-switch" data-expertise-switch>
  <div class="expertise-switch__bar">
    <button type="button" class="expertise-switch__tab expertise-switch__tab--expertise"
            data-expertise-tab="expertise" aria-expanded="false" aria-controls="expertise-maria">
      <span class="expertise-switch__label">Expertise</span>
      <span class="expertise-switch__icon" aria-hidden="true">
        <svg class="expertise-switch__ico expertise-switch__ico--chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <svg class="expertise-switch__ico expertise-switch__ico--close" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </span>
    </button>
    <button type="button" class="expertise-switch__tab expertise-switch__tab--more"
            data-expertise-tab="more" aria-expanded="false" aria-controls="more-maria">
      <span class="expertise-switch__label">En savoir plus</span>
      <span class="expertise-switch__icon" aria-hidden="true"> …same two svgs… </span>
    </button>
  </div>
  <div class="expertise-switch__panel">
    <div class="expertise-switch__content" id="expertise-maria" data-panel="expertise" role="region">
      <p>Drainage lymphatique<br/>Rhumatologie<br/>Rééducation musculo-squelettique<br/>Physiothérapie à domicile</p>
    </div>
    <div class="expertise-switch__content" id="more-maria" data-panel="more" role="region">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit… (a paragraph)</p>
    </div>
  </div>
</div>
```
Note: the panel is `display:grid` and both `.expertise-switch__content` blocks are stacked in the same cell (`grid-area: 1/1`) so they can crossfade. The panel height is animated via a `--panel-height` CSS var that JS sets to the active content's `scrollHeight`. State is driven by `data-state="expertise"|"more"` (absent = e0) on `.expertise-switch`, and `aria-expanded` on each tab.

### CSS (current)
```css
.therapist-card__details > .expertise-switch {
  padding: 0; background: none; box-shadow: none; border-radius: 0; overflow: visible;
  --xp-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --xp-ease-in: cubic-bezier(0.5, 0, 0.75, 0.35);
  --xp-open: 420ms var(--xp-ease-out);
  --xp-close: 340ms var(--xp-ease-in);
}
.expertise-switch__bar { display: flex; gap: 0px; }

.expertise-switch__tab {
  display: flex; flex: 1 1 0; min-width: min-content; min-height: 60px;
  align-items: center; justify-content: space-between; gap: 8px; padding: 10px 16px;
  border: 0; border-radius: var(--radius-card); box-shadow: var(--shadow);
  color: var(--white); cursor: pointer; font: inherit; font-size: 15px; line-height: 1.3;
  text-align: left; white-space: nowrap; overflow: hidden;
  transition: flex-grow var(--xp-close), background-color var(--xp-close), color var(--xp-close);
}
.expertise-switch[data-state] .expertise-switch__tab {
  transition: flex-grow var(--xp-open), background-color var(--xp-open), color var(--xp-open);
}
.expertise-switch__tab--expertise { background: var(--blue-active); border-radius: var(--radius-card) 0 0 var(--radius-card); }
.expertise-switch__tab--more      { background: var(--blue);        border-radius: 0 var(--radius-card) var(--radius-card) 0; }

.expertise-switch__label {
  min-width: 0; max-width: 12rem; overflow: hidden; text-overflow: ellipsis;
  transition: max-width var(--xp-close), opacity var(--xp-close), margin-right var(--xp-close);
}
.expertise-switch[data-state] .expertise-switch__label {
  transition: max-width var(--xp-open), opacity var(--xp-open), margin-right var(--xp-open);
}
/* inactive tab keeps only its arrow when the other is active */
.expertise-switch[data-state="expertise"] .expertise-switch__tab--more .expertise-switch__label,
.expertise-switch[data-state="more"] .expertise-switch__tab--expertise .expertise-switch__label {
  max-width: 0; opacity: 0; margin-right: -8px;
}

.expertise-switch__icon { position: relative; display: inline-flex; flex: 0 0 auto; width: 12px; height: 12px; }
.expertise-switch__ico { position: absolute; inset: 0; margin: auto; transition: opacity var(--xp-close), transform var(--xp-close); }
.expertise-switch[data-state] .expertise-switch__ico { transition: opacity var(--xp-open), transform var(--xp-open); }
.expertise-switch__ico--close { opacity: 0; transform: rotate(-45deg); }
.expertise-switch__tab[aria-expanded="true"] .expertise-switch__ico--chevron { opacity: 0; transform: rotate(45deg); }
.expertise-switch__tab[aria-expanded="true"] .expertise-switch__ico--close   { opacity: 1; transform: rotate(0deg); }

.expertise-switch[data-state="expertise"] .expertise-switch__tab--expertise,
.expertise-switch[data-state="more"] .expertise-switch__tab--more { flex-grow: 8; }
.expertise-switch[data-state="expertise"] .expertise-switch__tab--more,
.expertise-switch[data-state="more"] .expertise-switch__tab--expertise { flex-grow: 0; }

.expertise-switch__panel {
  display: grid; overflow: hidden; max-height: 0; margin-top: 0;
  border-radius: var(--radius-card); background: var(--blue-active);
  transition: max-height var(--xp-close), margin-top var(--xp-close),
    background-color var(--xp-close), box-shadow var(--xp-close);
}
.expertise-switch[data-state="more"] .expertise-switch__panel { background: var(--blue); }
.expertise-switch[data-state="expertise"] .expertise-switch__panel,
.expertise-switch[data-state="more"] .expertise-switch__panel {
  max-height: var(--panel-height, 400px); margin-top: 10px; box-shadow: var(--shadow);
  transition: max-height var(--xp-open), margin-top var(--xp-open),
    background-color var(--xp-open), box-shadow var(--xp-open);
}

.expertise-switch__content {
  grid-area: 1 / 1; padding: 14px 20px; opacity: 0; visibility: hidden;
  transition: opacity 150ms var(--xp-ease-in), visibility 0s linear 150ms;
}
.expertise-switch[data-state="expertise"] .expertise-switch__content[data-panel="expertise"],
.expertise-switch[data-state="more"] .expertise-switch__content[data-panel="more"] {
  opacity: 1; visibility: visible;
  transition: opacity 240ms var(--xp-ease-out) 60ms, visibility 0s;
}
```

### JS (current)
```js
const expertiseSwitches = [...document.querySelectorAll("[data-expertise-switch]")];

function sizeExpertisePanel(sw) {
  const state = sw.dataset.state;
  if (!state) return;
  const panel = sw.querySelector(".expertise-switch__panel");
  const content = sw.querySelector(`.expertise-switch__content[data-panel="${state}"]`);
  if (panel && content) panel.style.setProperty("--panel-height", `${content.scrollHeight}px`);
}

expertiseSwitches.forEach((sw) => {
  const bar = sw.querySelector(".expertise-switch__bar");
  const tabs = [...sw.querySelectorAll("[data-expertise-tab]")];

  const setState = (state) => {
    if (state) sw.dataset.state = state;
    else delete sw.dataset.state;
    tabs.forEach((tab) => tab.setAttribute("aria-expanded", String(tab.dataset.expertiseTab === state)));
    sizeExpertisePanel(sw);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const next = tab.dataset.expertiseTab;
      setState(sw.dataset.state === next ? null : next);
    });
  });

  document.addEventListener("click", (event) => {
    if (sw.dataset.state && !bar.contains(event.target)) setState(null);
  });
});

window.addEventListener("resize", () => expertiseSwitches.forEach(sizeExpertisePanel), { passive: true });
document.fonts?.ready.then(() => expertiseSwitches.forEach(sizeExpertisePanel));
```

## What was already tried (do NOT just re-suggest these)
1. Started with a single expo-out easing `cubic-bezier(0.16,1,0.3,1)` at 240ms, then 520ms. Too front-loaded → snappy/abrupt.
2. Content entrance was a keyframe `@keyframes` (rise+fade). It caused a **jump on rapid open/close** because a running CSS *animation*, when its selector stops matching, is removed instantly and the `transform` snaps. → Replaced with a pure opacity **transition** (interruptible).
3. Current attempt: **direction-aware, synchronized** transitions — on OPEN every property uses `420ms ease-out`; on CLOSE every property uses `340ms ease-in`; content fades out fast (150ms) to "lead" the close. This reduced but **did not eliminate** the stutter — `e1→e0`, `e2→e0`, `e0→e2` still judder.

## Strong hypotheses to investigate (verify before committing)
- **Animating `max-height` is inherently janky** (browser relayouts each frame; interpolation isn't uniform). Even though JS sets `--panel-height` to the exact `scrollHeight`, the open/close may not be frame-smooth. Consider replacing the height animation with a technique that interpolates real intrinsic size smoothly:
  - CSS **grid-template-rows `0fr → 1fr`** (wrap the content, animate the row track) — usually much smoother than `max-height`.
  - Or the **Web Animations API / FLIP** measuring first→last and animating a `transform`.
  - Or modern `interpolate-size: allow-keywords` / `calc-size()` (check browser support for the target audience — this is a Swiss physio site, mainstream browsers).
- **Forced synchronous reflow / layout thrash:** `sizeExpertisePanel()` reads `content.scrollHeight` *immediately after* mutating `data-state` (which changes many styles). This forced reflow at the start of the transition may drop the first frame. Consider measuring **before** mutating, or measuring once and caching (both content blocks are the same across state changes; heights only change on resize/font-load), or using `requestAnimationFrame`/`getBoundingClientRect` ordering to avoid thrash.
- **The stacked-grid crossfade + collapsing overflow:** during close, the outgoing text is in `overflow:hidden` and gets clipped by the shrinking panel. Confirm whether the "lingering thin strip" is the panel's `max-height` tail, the `box-shadow`, the `margin-top`, or the languages element below reflowing.
- **`box-shadow` and `background-color` transitions force repaints** on a resizing box → possible compositor stutter. Test whether dropping/【simplifying】the shadow or color transition during open/close removes the judder.

## Deliverable
1. Identify the actual root cause (say which property/mechanism, with reasoning).
2. Implement a fix in `styles.css` (+ `script.js`/`index.html` if the technique needs it) so `e1→e0`, `e2→e0`, `e0→e2` are as smooth as `e0→e1`.
3. Keep the exact visual design and the 3-state behavior (tab widths, colors, arrow-only collapsed tab, outside-tap-to-close, `prefers-reduced-motion`).
4. Explain what you changed and why. If you switch away from `max-height`, note any layout caveats (the panel sits in a `display:grid; gap:10px` container with a "languages" bar as the next sibling).

## How to reproduce / verify
Open `index.html`, scroll to the "Notre Équipe" section, and on a therapist card click: Expertise, then click outside (e1→e0); En savoir plus, then outside (e2→e0); and from rest click En savoir plus (e0→e2). The judder is easiest to see on a slow/throttled CPU or by recording at 30–60fps and stepping frame by frame.
