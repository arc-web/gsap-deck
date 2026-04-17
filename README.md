<div align="center">

<a href="https://arc-web.github.io/gsap-deck/">
  <img src="https://img.shields.io/badge/🎬_Interactive_Presentation-View_Live-7B2FBE?style=for-the-badge&labelColor=0F0F1A&color=7B2FBE" alt="View Interactive Presentation" />
</a>

</div>

---

# gsap-deck

Generate stunning animated HTML presentations from JSON. One command, self-contained output, zero runtime dependencies.

Dark backgrounds, gradient text, animated particles, floating blobs, custom cursor, staggered card animations, cinematic slide transitions, immersive ambient audio. Five themes. Ten slide types.

Used to power the Arc Web project fleet - 37 repos, each with a live animated deck at `arc-web.github.io/<repo>/`.

---

## Install

```bash
npm install -g gsap-deck
```

Or run directly:
```bash
npx gsap-deck build deck.json --open
```

---

## Quick start

```bash
# Create a starter config
gsap-deck scaffold

# Edit deck.json with your content

# Build and open
gsap-deck build deck.json --open
```

Output is a single self-contained HTML file. Open in any browser. Navigate with arrow keys. Press `F` for fullscreen, `M` to mute the ambient drone.

---

## Commands

### `gsap-deck build <input.json>`

Build an HTML presentation from a full JSON config.

```bash
gsap-deck build deck.json                          # output: presentation.html
gsap-deck build deck.json -o pitch.html            # custom output path
gsap-deck build deck.json --theme midnight --open  # theme + auto-open
```

### `gsap-deck build-standard <data.json>`

Build a standard 8-slide Arc Web deck from a minimal data file. Handles the full slide structure automatically - you just supply the content.

```bash
gsap-deck build-standard my-repo.json -o deck.html --open
```

### `gsap-deck scaffold`

Create a starter JSON config with example slides.

```bash
gsap-deck scaffold                    # output: deck.json
gsap-deck scaffold -o my-pitch.json
```

### `gsap-deck validate <data.json>`

Check a standard-template data file for shape errors without building. Catches wrong array lengths, missing fields, and bad types before they blow up at build time.

```bash
gsap-deck validate my-repo.json
# title                PASS
# problems[3]          FAIL  expected 3 items, got 4
```

### `gsap-deck watch <data.json>`

Watch a JSON file and serve a live-reloading deck at `localhost:7555`. Edit and save - browser updates automatically.

```bash
gsap-deck watch my-repo.json
gsap-deck watch my-repo.json -p 8080
```

### `gsap-deck fetch-deps <owner/repo>`

Fetch top dependencies from a GitHub repo's manifest (`package.json`, `requirements.txt`, `Cargo.toml`). Writes them back into your data file.

```bash
gsap-deck fetch-deps arc-web/diet-claude --update /tmp/data/diet-claude.json
gsap-deck fetch-deps --all /tmp/data/ --owner arc-web   # batch update all
```

### `gsap-deck publish <html>`

Publish a presentation to a hosting target.

```bash
gsap-deck publish deck.html                               # GitHub Pages (default)
gsap-deck publish deck.html -t repo -r arc-web/my-repo   # specific repo
gsap-deck publish deck.html -t vercel
gsap-deck publish deck.html -t cloudflare --project gsap-deck-live
gsap-deck publish deck.html -t hostinger --domain mysite.com
gsap-deck publish deck.html -t custom --method scp --dest user@host:/path/
```

### `gsap-deck update-all <data-dir>`

Build and publish every `*.json` in a directory via the standard template. Runs up to 5 publishes in parallel.

```bash
gsap-deck update-all /tmp/data/ --owner arc-web
gsap-deck update-all /tmp/data/ --owner arc-web --skip archived-repo,old-repo
```

### `gsap-deck grade <data-dir>`

Score every deck in a directory on content quality (0-100). Catches generic filler, placeholder deps, bad architecture labels, and malformed problem cards.

```bash
gsap-deck grade /tmp/data/
# SCORE REPO            ISSUES
#   100 diet-claude     -
#    90 my-repo         deps placeholder: "See repository"
#    60 early-project   early-stage deck (intentional)
# Average: 96.8/100 | 0/37 below 70
```

### `gsap-deck verify <data-dir>`

Check each repo's live `docs/index.html` against its expected content. Catches stale deployments without waiting for the Pages CDN.

```bash
gsap-deck verify /tmp/data/ --owner arc-web
# ✓ OK     diet-claude   serving: "Hardcoded model names inflating your bill"
# ⚠ STALE  my-repo       missing: "expected content"
```

### `gsap-deck export-pdf <html>`

Export a presentation to PDF. Requires `npm install puppeteer`.

```bash
gsap-deck export-pdf deck.html -o deck.pdf
```

### `gsap-deck themes`

List available themes.

---

## Themes

| Theme | Vibe |
|-------|------|
| `dark` | Purple/orange on deep black - the default |
| `midnight` | Blue/amber on navy - professional |
| `ember` | Red/orange on charcoal - bold and warm |
| `forest` | Green/lime on dark green - natural |
| `ocean` | Cyan/purple on deep blue - calm and deep |

---

## Slide types

### `hero` - Title slide with badge and tags

```json
{
  "type": "hero",
  "title": "The *Big Idea*",
  "subtitle": "One-line description.",
  "badge": "Event Name",
  "tags": ["Tag 1", "Tag 2"]
}
```

### `cards` - Grid of feature cards with icons

```json
{
  "type": "cards",
  "eyebrow": "Section label",
  "title": "Why this *matters*",
  "cards": [
    { "icon": "⏱️", "title": "Card title", "description": "Card description." }
  ]
}
```

### `steps` - Numbered sequential steps

```json
{
  "type": "steps",
  "eyebrow": "How it works",
  "title": "Three *steps*",
  "steps": [
    { "title": "Step one", "description": "what happens" }
  ]
}
```

### `stats` - Big number stats grid

```json
{
  "type": "stats",
  "title": "The *numbers*",
  "stats": [
    { "value": "10x", "label": "Faster" },
    { "value": "50%", "label": "Less effort" }
  ]
}
```

### `compare` - Side-by-side before/after

```json
{
  "type": "compare",
  "title": "Before vs *after*",
  "left": { "title": "Before", "items": ["Problem 1", "Problem 2"] },
  "leftType": "bad",
  "right": { "title": "After", "items": ["Solution 1", "Solution 2"] },
  "rightType": "good"
}
```

### `quote` - Centered blockquote

```json
{
  "type": "quote",
  "quote": "Come with a problem.\nLeave with something *that works.*",
  "attribution": "Speaker name"
}
```

### `code` - Syntax-highlighted code block

```json
{
  "type": "code",
  "title": "How to *start*",
  "code": "# Just type this\nclaude\n\n\"Build me a tool that does X\""
}
```

### `flow` - Vertical flow diagram with icons

```json
{
  "type": "flow",
  "title": "The *workflow*",
  "flow": [
    { "icon": "🎨", "title": "Design", "description": "Create the layout", "color": "20,184,166" },
    { "icon": "⚙️", "title": "Build", "description": "Wire up the logic" }
  ]
}
```

### `timeline` - Horizontal roadmap with milestone markers

```json
{
  "type": "timeline",
  "eyebrow": "Roadmap",
  "title": "What's *next*",
  "timeline": [
    { "date": "2026-Q1", "title": "Milestone 1", "description": "What shipped", "done": true },
    { "date": "2026-Q2", "title": "Milestone 2", "description": "What's coming" }
  ]
}
```

### `team` - Team member grid with avatars

```json
{
  "type": "team",
  "eyebrow": "The team",
  "title": "Built by",
  "team": [
    { "name": "Mike Ensor", "role": "Founder", "avatar": "https://..." }
  ]
}
```

---

## Standard template (`build-standard`)

The standard template generates a consistent 8-slide Arc Web deck from a compact data file. Used across the entire Arc Web project fleet.

**Slide structure:**
1. Hero - name, description, tags, badge
2. The problem - 3 pain-point cards with icons
3. How it works - 3-step flow diagram
4. Codebase - architecture, language, key deps, creator
5. Before / after - side-by-side compare
6. By the numbers - impact stats (if provided)
7. Creator - who built it and why
8. Quote - closing line

**Minimal data file:**
```json
{
  "name": "my-repo",
  "title": "My Tool",
  "description": "What it does in one line.",
  "theme": "dark",
  "language": "TypeScript",
  "architecture": "CLI Tool",
  "creator": "Your Name",
  "deps": ["commander", "zod"],
  "problems": [
    { "icon": "⏱️", "title": "Pain point title", "description": "Why this hurts." },
    { "icon": "🧠", "title": "Second pain point", "description": "Why this matters." },
    { "icon": "🔁", "title": "Third pain point", "description": "The consequence." }
  ],
  "flowSteps": [
    { "icon": "📥", "title": "Input", "description": "What the user provides." },
    { "icon": "⚙️", "title": "Processing", "description": "What the tool does." },
    { "icon": "📤", "title": "Output", "description": "What comes out." }
  ],
  "compareWith": ["Specific benefit 1", "Specific benefit 2", "Specific benefit 3"],
  "quote": "A memorable closing line about what this does."
}
```

Run `gsap-deck validate` before building to catch shape errors.

---

## Audio

Every deck includes a Web Audio API ambient engine - no external audio files, no dependencies, inlined in the HTML output.

- **Ambient drone** tuned to Om frequency (136.1 Hz) with just-intonation ratios. Binaural beat at 0.7 Hz. Chord cycles every 22 seconds.
- **Slide transition sounds** - glass synth hit on each slide change
- **Widget clink sounds** - lighter version on card/step stagger animations
- **M key** - toggle mute. A mute indicator appears in the corner.

The drone fades in when autoplay starts, fades out when it stops. Designed to feel meditative rather than distracting.

---

## Text formatting

Wrap text in `*asterisks*` for gradient highlight:

```json
"title": "This is *highlighted* text"
```

Use `<br>` for line breaks in quotes.

---

## Visual features

Every presentation includes:

- Floating particle field (colors match theme)
- Custom animated cursor with trailing ring
- Smooth dark overlay slide transitions
- Staggered element animations (cards, steps, stats, timeline nodes, team cards)
- Gradient text on highlighted words
- Glowing background blobs per slide
- Navigation dots + keyboard arrows + slide counter
- Autoplay progress bar with play/pause
- Fullscreen mode (`F` key)
- Mute toggle (`M` key)
- Fully responsive typography (clamp-based)

---

## Output

A single HTML file with:
- Inline CSS (no external stylesheets)
- GSAP loaded from CDN
- Web Audio API engine (no audio files)
- All animations, particles, and interactions self-contained
- Works offline after first load (GSAP cached by browser)
- No build step, no server, no runtime dependencies

Open in any modern browser. Present from your laptop.

---

## In use

gsap-deck powers the Arc Web project fleet - 37 open-source repos, each with a live animated deck:

- [arc-web.github.io/diet-claude](https://arc-web.github.io/diet-claude/)
- [arc-web.github.io/gsap-deck](https://arc-web.github.io/gsap-deck/)
- [arc-web.github.io/discord-manager](https://arc-web.github.io/discord-manager/)
- ... and 34 more

Also used at the StellarPH x KMC Claude AI Workshop (April 2026) to generate per-pod and per-project decks for 60+ attendees.
