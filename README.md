<div align="center">

<a href="https://arc-web.github.io/gsap-deck/">
  <img src="https://img.shields.io/badge/🎬_Interactive_Presentation-View_Live-7B2FBE?style=for-the-badge&labelColor=0F0F1A&color=7B2FBE" alt="View Interactive Presentation" />
</a>

</div>

---

# gsap-deck

Generate stunning animated HTML presentations from JSON. One command, self-contained output, zero runtime dependencies.

Dark backgrounds, gradient text, animated particles, floating blobs, custom cursor, staggered card animations, cinematic slide transitions. Five themes. Eight slide types.

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

Output is a single self-contained HTML file. Open it in any browser. Navigate with arrow keys.

---

## Commands

### `gsap-deck build <input.json>`

Build an HTML presentation from a JSON config.

```bash
gsap-deck build deck.json                          # output: presentation.html
gsap-deck build deck.json -o pitch.html            # custom output path
gsap-deck build deck.json --theme midnight --open  # theme + auto-open
```

### `gsap-deck scaffold`

Create a starter JSON config with example slides.

```bash
gsap-deck scaffold                    # output: deck.json
gsap-deck scaffold -o my-pitch.json   # custom name
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

### `compare` - Side-by-side good vs bad

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

---

## Text formatting

Wrap text in `*asterisks*` to apply the gradient effect:

```json
"title": "This is *highlighted* text"
```

Use `\n` for line breaks in titles and quotes.

---

## Visual features

Every presentation includes:

- Floating particle field (colors match theme)
- Custom animated cursor with trailing ring
- Smooth dark overlay slide transitions
- Staggered element animations (cards, steps, stats)
- Gradient text on highlighted words
- Glowing background blobs per slide
- Navigation dots + keyboard arrows + slide counter
- Fully responsive typography (clamp-based)

---

## Output

A single HTML file with:
- Inline CSS (no external stylesheets)
- GSAP loaded from CDN
- All animations, particles, and interactions self-contained
- Works offline after first load (GSAP cached by browser)
- No build step, no server, no dependencies

Open it in any modern browser. Present from your laptop.
