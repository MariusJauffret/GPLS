# GPLS typography review

Reviewed 10 September 2026. Based on the current stylesheet and browser-computed styles at 390px mobile and 1280px desktop widths. This is an assessment and proposed direction; it does not change the site's typography.

The site already has a consistent font family, Urbanist, and the beginnings of a useful hierarchy. The main opportunity is to make differences depend on the text's role and background, instead of defining them independently for every component.

The user's intended direction is retained: text inside compact cards can be smaller than open-section text; white text on blue can be lighter and more tightly spaced than dark text; headings should have a recognisable hierarchy.

**What already works**

- Open-section body text is consistently 16px / 400 weight / 1.55 line height on mobile and 18px / 400 / 1.6 on desktop.
- Access-card text is 14px / 400 / 1.5, giving it the more compact character the user prefers.
- Mobile pricing-card text also uses 14px, with weight 300 on blue.
- The main section titles share 28px / 500 on mobile.
- Most uppercase section captions and dropdown labels share 11px / 500 / 0.16em letter spacing on mobile.
- The light italic word in the hero is a deliberate brand accent that can remain an exception.

**Measured mobile body and control styles**

Weights: 200 extra light, 300 light, 400 regular, 500 medium, 600 semibold. Tracking means letter spacing. Normal means the browser's normal letter spacing, with no extra spacing requested here.

| Text role | Size | Weight | Tracking | Line height |
| --- | ---: | ---: | --- | ---: |
| Open-section body on white/cream | 16px | 400 | normal | 24.8px |
| Open-section body on blue | 16px | 300 | 0.04em | 24.8px |
| Access-card body | 14px | 400 | normal | 21px |
| Pricing-card body, notes and insurance text | 14px | 300 | 0.04em | 21.7px |
| Therapist expertise panel | 16px | 300 | 0.04em | 24.8px |
| Therapist languages | 14px | 200 | 0.04em | 21.7px |
| Practical information in the unboxed mobile layout | 16px | 400 | normal | 24.8px |
| Form introduction | 16px | 300 | 0.04em | 24.8px |
| Form inputs and consent | 15px | 300 | 0.04em | 23.25px |
| Privacy panel | 14px | 400 | 0.04em | 21px |
| FAQ questions / answers | 15px | 400 | normal | 18.75px / 23.25px |
| Hero appointment button | 15px | 500 | normal | 18px |
| Menu appointment button | 15px | 400 | 0.04em | 18px |
| Form submit button | 16px | 400 | 0.04em | 19.2px |
| Expanded specialty choices | 13px | 600 | 0.04em | 15.6px |

Collapsed controls were included in the style inventory, but their visibility is separate from their computed text styling. These measurements describe CSS results; they do not certify the exact font face used for every requested weight.

**Measured mobile heading hierarchy**

| Heading | Size | Weight | Tracking | Line height |
| --- | ---: | ---: | --- | ---: |
| Hero | 36px | 500; italic 200 | -0.03em | 37.8px |
| Cabinet, treatments, team and contact | 28px | 500 | 0.02em | 32.2px |
| Blue expertise-section title | 28px | 500 | 0.02em | 32.2px |
| Selected specialty title | 28px | 500 | normal | 35px |
| Online booking | 26px | 500 | 0.02em | 29.9px |
| Contact form | 22px | 500 | 0.04em | 25.3px |
| Therapist name | 17px | 400 | 0.02em | 21.25px |
| FAQ | 40px | 500 | -0.01em | 42px |

Different sizes can express different roles. The questions to resolve are which titles are peers and which are subordinate. The form can reasonably be subordinate to online booking. The selected specialty should read as subordinate to the overall expertise section. FAQ currently receives more visual emphasis than other main sections and even exceeds the hero's font size on mobile.

**Where the current rules diverge from the intended system**

1. White body text is lighter, but it is usually more widely spaced than dark body text: 0.04em versus normal. That is the opposite of the requested direction for spacing. This is repeated in pricing, specialties, therapist details, the form and the main footer.
2. Card density is inconsistent. Access and pricing use 14px on mobile, while therapist expertise uses 16px. On desktop, pricing rows return to 18px, while access remains 14px and therapist expertise remains 16px.
3. The same appointment action has two typographic treatments: hero 15px / 500 / normal spacing and mobile menu 15px / 400 / 0.04em. This is a clear shared-component inconsistency.
4. The form heading has the widest positive tracking among the major mobile headings. A broad form rule applies 0.04em to every descendant, including titles, labels and buttons.
5. The main footer applies weight 300 and 0.04em to all descendants, including its heading. This largely removes weight-based hierarchy. The legal footer then returns to 400 and normal spacing on the same blue background, with reduced text opacity.
6. Uppercase access-card text uses 600, while otherwise similar mobile dropdown labels use 500. This may be intentional for dark-on-white text, but it should be defined as a background variant rather than an isolated override.

**Proposed typographic roles to trial**

These are starting values for a visual comparison, not changes already applied.

| Role | Mobile starting size | Typical use |
| --- | ---: | --- |
| Display | 36px | Hero; preserve the italic accent |
| Section title | 28px | Cabinet, treatments, expertise, team, contact, booking, FAQ |
| Subsection title | 22px | Selected specialty and contact form |
| Card/profile title | 18px | Therapist names and comparable compact headings |
| Open-section body | 16px | Paragraphs outside compact cards |
| Card body | 14px | Access, pricing, therapist expertise and languages |
| Action label | 15px | Shared appointment buttons and comparable actions |
| Input text | 16px | Form entry text, treated as a control rather than card copy |
| Small supporting text | 13px | Secondary booking information and short supporting labels |
| Uppercase caption | 11px | Section captions and dropdown labels |

For desktop, retain the established 18px open body and fluid hero/section headings. Give compact card copy an explicit 14–16px role instead of allowing it to inherit 18px accidentally. Define each role's mobile and desktop values together.

**Background variants to trial**

| Role | White or cream background | Blue background |
| --- | --- | --- |
| Body/card prose | 400 weight; 0 to 0.01em spacing | 300 weight; 0em spacing |
| Section/subsection titles | 500 weight; around 0em spacing | 400 weight; around -0.01em spacing |
| Actions | 500 weight; around 0em spacing | 400 weight; around 0em spacing |
| Uppercase captions | 500 weight; around 0.12em spacing | 400 weight; around 0.10em spacing |

Do not tighten all text mechanically. Uppercase captions still need space between letters, and short action labels need sufficient weight. Visually check the smaller 14px white copy before settling on 300; use 400 if it becomes too delicate. Retain the chosen sizes across backgrounds so that the hierarchy stays recognisable.

Keep body line height around 1.55, card copy around 1.5, titles around 1.15–1.2 and short action labels around 1.2. A multiline FAQ question may benefit from more leading than its current 1.25.

**How the current stylesheet produces the variation**

- Urbanist and base text defaults are set globally near the start of styles.css.
- A mobile scale is documented at styles.css:2083: 40 / 28 / 19 / 16 / 14 / 11. Later component rules override it, and some earlier component selectors are specific enough to win over the generic heading rules.
- There are central colour, radius and spacing variables, but no equivalent typography variables. Font sizes, weights and tracking are assigned repeatedly to components.
- styles.css:1442 sets letter spacing on the entire form and all descendants. styles.css:1919 does the same for the main footer and also sets every descendant's weight.
- The desktop FAQ question inherits its size from the browser's default h3 sizing rather than an explicit shared role; the measured result at 1280px was 21.06px. Mobile explicitly overrides it to 15px.
- The font is requested both through an HTML stylesheet link and a CSS import. Normal weights 300–600 and italic 200/300 are requested. Normal 200 is nevertheless requested by the language bar, and 700 by the transport badges; these are outside the explicitly imported normal weights. Align the requested font files and the selected design weights during cleanup.

**Suggested implementation order**

1. Agree the heading roles, including whether FAQ should remain a special display heading.
2. Introduce shared text roles and white/cream versus blue background variants.
3. Align the repeated appointment buttons, dropdown captions and compact-card bodies.
4. Replace broad descendant rules in the form and footer with explicit text roles.
5. Recheck line wrapping and expanded-card heights after the typography changes. Review at 360px, 390px and desktop width.

Use visual context rather than a blanket rule for every element whose class contains “card.” The practical-information block is unboxed on mobile, and the form changes from a white desktop card to a full-width blue mobile section. Their typography should follow those visible roles.
