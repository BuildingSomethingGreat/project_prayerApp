# Styling

## The idea

Liora should feel like warm light through frosted glass: lit from within, soft at every edge, slightly grainy, and quiet. It is the opposite of a feed. Nothing competes for attention, nothing counts, nothing glows red.

Four principles follow from that.

1. **Light is the brand.** The moving gradient is the identity. Chrome stays translucent and thin so the light is always the main thing on screen.
2. **Say less.** One idea per screen, one primary action, short sentences. If a label can go, it goes.
3. **Everything eases.** Motion is slow and decelerating, like a breath out. Nothing bounces, snaps or shakes.
4. **Never leave her waiting in the dark.** Anything that takes time shows a breath, a shimmer or a spinner straight away.

All tokens live in `src/styles/tokens.css`. Component styles are in `src/styles/app.css`, grouped by screen. There is no CSS framework; the surface is small enough that plain CSS with tokens is easier to keep consistent.

## Colour

Bold, saturated light over deep wine-dark grounds. The colour lives in the light (the scenes and the glow); the interface itself stays cream and glass so it never competes.

| Token | Value | Use |
| --- | --- | --- |
| `--cream-50` | `#fff6ea` | Primary text, primary buttons, active states |
| `--text-soft` | cream at 68% | Body copy, secondary labels |
| `--text-faint` | cream at 42% | Second line of headings, hints, eyebrows |
| `--cocoa-900` | `#1e0a10` | Text on cream buttons |
| `--cocoa-950` | `#12050a` | The ground beneath the light; browser theme colour |
| `--flame-500`, `--amber-400`, `--rose-300`, `--violet-500` | `#ff4d1f`, `#ff8a2a`, `#ff5c8a`, `#6a2bd9` | The palette of the light, for reference. Use in the interface sparingly. |
| `--amber-300` | `#ffc46b` | Focus rings, the breathing loader |
| `--glass` → `--glass-press` | cream at 11% → 27% | Translucent surfaces, resting to pressed |
| `--hairline` | cream at 22% | The 1px edge on glass |

Selection is shown by **inverting to cream**, never by adding a colour. A selected chip, the chosen length and the play button all use the same cream fill.

### Scenes

Four looping backdrops, each with a mood. Sessions choose one by theme. The first, softer set of stills is kept in `assets-src/higgsfield/v1/`.

| Scene | Feels like | Used for |
| --- | --- | --- |
| `dawn` | Vermilion and tangerine under an espresso and teal sky, into gold and cream | Splash, onboarding, home; peace, guidance, hope |
| `honey` | Saffron and marigold with coral and fuchsia | Gratitude, worth, dreams |
| `ember` | Crimson and burnt orange over aubergine, with magenta and molten gold | Voice screen; courage, strength, praying for others |
| `dusk` | Royal indigo through magenta to a low band of orange | Intention screen; rest, comfort |

### Keeping text readable

Text is always cream on a darkened scene. `Backdrop` lays a scrim over the video, and each screen sets how strong it is (`DIM` in `App.tsx`): lightest on the opener, strongest on the screens she reads and types on.

The scrim is a deep **wine-black** gradient. It darkens for legibility without browning the colour underneath, and it is heavier at the top and bottom, where the controls sit, and lightest through the middle, where the light should show.

## Grain

Grain is a large part of the look, so it is deliberately visible. Two fixed SVG noise layers (`.grain`) sit above everything, including glass and sheets: a fine, high-contrast tooth blended with `overlay`, and a coarser pass blended with `soft-light`. The grain is still: an earlier version moved, and it read as flicker. It gives the matte, analogue surface from the references, ties video, photographs and UI into one image, and hides banding in the gradients.

The loops themselves are blurred and grain-free. Grain baked into video would swim as the image moves, and would triple the file size.

## Photographs

Fifteen public-domain photographs live in `public/media/photos/`: one for each of the twelve themes and three for onboarding. Sources and photographers are in [CREDITS.md](CREDITS.md).

A photograph is never shown in its own colours. `Backdrop` lays it over the moving gradient in greyscale with `mix-blend-mode: multiply`, so it keeps its shapes and takes its colour, and its slow movement, from the light behind it. That is what lets fifteen unrelated images look like one set. Each also drifts in from a slight zoom.

- Photographs appear behind onboarding (one per slide) and in the player (by theme), and as thumbnails on Home. Screens where she types or chooses stay as pure light.
- The same image has to fill a tall phone and a wide desktop. `PHOTO_FOCUS` in `src/content/photos.ts` anchors each crop on its subject.
- Choose images with a clear silhouette against a bright ground. Evenly lit, high-key photographs turn to blotches under multiply.

## Glow

`components/GlowField.tsx` draws light that pools and drifts behind the controls at the foot of the screen. It is a WebGL fragment shader, not DOM shapes:

- Five slowly orbiting sources are summed into one smooth field, so neighbouring forms merge and part like liquid instead of overlapping like discs.
- The field is bent by flowing simplex noise, so no edge is ever a clean circle.
- The field is read three ways: a long, faint halo, a defined body, and a hot core. Colour runs from a deep rim to a bright heart using three colours per scene (`PALETTES`).
- The shader adds its own grain and fades to nothing before it reaches the words.

One canvas serves every screen and is blended with `screen`, so it behaves as light. Its strength is set per screen (`GLOW` in `App.tsx`): faint on the opener, quiet behind forms, full in the player. Changes of screen, scene and strength all ease over about a second, so the light turns rather than cuts. While the voice is speaking it moves and breathes a little more, and on desktop one source leans gently towards the pointer.

It renders at half resolution (the forms are soft, so this is invisible), pauses when the tab is hidden, holds still under `prefers-reduced-motion`, and falls back to a static CSS wash where WebGL is unavailable.

## Layout across screens

Layout is mobile-first, with two breakpoints in `app.css`.

| Width | What changes |
| --- | --- |
| under 700px | One column, 24px gutters, full-width buttons |
| 700px and up | A roomier column (580px) for tablets and small windows |
| 1000px and up | Desktop layouts, below |

Every page spans the window and keeps its content in a centred column of `--measure`, so the light and photographs are always full-bleed. On desktop:

- **Onboarding** sets the words low and left over a full-bleed photograph. Arrow keys move between slides.
- **Intention and Voice** split in two: the question on the left, the answer on the right.
- **Home** puts the greeting and today's word on the left and her moments on the right.
- **Player** becomes three columns: the parts of the session on the left, the words in the middle at a larger size, and keyboard help on the right. Space plays and pauses, left and right move by line, up and down move by part.
- **Scripture** opens as a drawer from the right instead of a sheet from the bottom.
- Buttons take their natural width, and pointer devices get hover states (`@media (hover: hover)`), which touch devices never see.

The opener is full-bleed at every size. A short-height rule tightens the player for a phone on its side.

Display and lyric sizes are fluid (`clamp`) between phone and desktop, so there are no jumps at the breakpoints.

## Type

| Role | Face | Notes |
| --- | --- | --- |
| Everything | **Outfit** (variable) | Geometric, rounded, friendly. Weight 350 for body, 400–450 for emphasis, 500 for buttons. |
| Scripture | **Newsreader** italic (variable) | Only ever used for the words of Scripture, so the Word is recognisable at a glance. |

Both are self-hosted through `@fontsource-variable`, so they work offline and make no third-party requests.

| Token | Size | Use |
| --- | --- | --- |
| `--size-display` | 42–78px, fluid | Screen headings |
| `--size-lyric` | 23–40px, fluid | Lines in the player |
| `--size-title` | 28px | Section titles |
| `--size-body` | 17px | Copy, buttons |
| `--size-small` | 14px | Secondary labels |
| `--size-micro` | 12px | Eyebrows, timestamps |

**Two-tone headings.** Display headings break into two lines: the first in full cream, the second faint ("What's on / *your heart?*"). Use the `.display` class with a `<span>` for the second line. Keep each line to two or three words.

**Eyebrows** (`.eyebrow`) are the only uppercase text: 12px, 500 weight, 0.16em tracking.

## Shape and space

- Radii: `--radius-s` 14, `--radius-m` 22, `--radius-l` 32, and `--radius-pill`. Cards and inputs use `l`; buttons and chips are pills; nothing has a sharp corner.
- Spacing is on a 4px base (`--space-1` … `--space-7`). The page gutter is 24px.
- Primary buttons are 58px tall; every tap target is at least 44px.
- Content sits in a centred column whose width (`--measure`) grows at each breakpoint; see Layout across screens.
- Safe-area insets are respected top and bottom.

## Glass

`.glass` is the one surface: 10% cream fill, 1px hairline, 22px blur with a slight saturation lift. Use it for cards, inputs, chips and secondary buttons. Raise the fill (`--glass-raised`, `--glass-press`) to show focus or selection rather than adding shadows. Shadows are reserved for the two things that physically float: the play button and artwork thumbnails.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Everything. A long, soft landing. |
| `--fast` | 180ms | Press feedback |
| `--base` | 420ms | State changes |
| `--slow` | 900ms | Scene and scrim changes |

The catalogue:

- **Opener.** The light fills the whole screen from the first frame, rising out of the dark and settling from a slight zoom while the wordmark resolves from blurred, wide tracking. The same backdrop carries straight into the first page, so the opener and the app are one continuous shot.
- **Pages** (`components/Page.tsx`). Enter with a fade and a 16px drift in the direction of travel; exit faster than they enter. Only opacity and position animate. Animating blur over blurred glass stuttered, so it was removed.
- **Rise.** Content within a page arrives in sequence, 80ms apart.
- **Press.** Buttons scale to 0.975, icon buttons to 0.9.
- **Lyrics.** The current line brightens and grows 1.5% over 600ms; the list glides to keep it just above centre.
- **Segmented control and sheet.** The only springs, and both are critically damped.
- **Loader.** A sphere that inhales and exhales on a 4.2s cycle with rings moving outward, under status lines that cross-fade.

`prefers-reduced-motion` is honoured twice: Framer Motion is set to `reducedMotion="user"`, and a CSS rule collapses animation and transition durations. The backdrop shows the still poster instead of video.

## Loading states

| Situation | What she sees |
| --- | --- |
| Session being written | The breathing loader, status text, and three shimmer lines |
| Narration buffering | A spinner inside the play button |
| Voice preview loading | A spinner in that voice's artwork, then moving bars |
| Backdrop video loading | The still poster, then the video fades in over it |
| Player waiting on capabilities | A centred spinner |

Use `.spinner` for short waits attached to a control and `.skeleton` where content is about to appear.

## Accessibility

- Controls are real `<button>`s with labels; choices use `radiogroup` and `radio`; the sheet is a labelled dialog.
- The loader's status text is a live region.
- Focus rings are amber and only appear for keyboard users.
- The scrubber exposes its position as "1:05 of 3:10".
- Text is cream on a darkened scene throughout, and the faint tier is only used for supplementary text. Contrast has been checked by eye, not yet measured against WCAG on every scene.

## Adding to the system

Before adding a colour, a radius or a duration, check for a token. If something new is truly needed, add it to `tokens.css` and to this file together.
