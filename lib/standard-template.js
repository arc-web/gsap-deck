// lib/standard-template.js
// Canonical 8-slide ARC Web deck template.
// Takes minimal repo data, returns a full deck config ready for buildDeck().

const FLOW_COLORS = ['123,47,190', '59,130,246', '16,185,129']

const CREATOR_SLIDE = {
  type: 'text',
  eyebrow: 'Built by',
  title: 'Mike Ensor\n*Arc Web*',
  subtitle: 'AI automation, marketing technology, building tools that work.',
  body: "Mike builds open-source AI tools for agencies, marketers, and operators who are done waiting for software to catch up. All Arc Web projects are open source by default — fork them, extend them, ship them."
}

const CAPABILITIES_SLIDE = {
  type: 'cards',
  eyebrow: 'What it does',
  title: 'Core *capabilities*',
  cards: [
    { icon: '⚡', title: 'Fast', description: 'Optimized for speed and efficiency.' },
    { icon: '🎯', title: 'Reliable', description: 'Built to work consistently.' },
    { icon: '🔌', title: 'Integrates', description: 'Works with your existing tools.' }
  ]
}

function requireField(data, key) {
  if (data[key] === undefined || data[key] === null) {
    throw new Error(`standard-template: missing required field "${key}"`)
  }
}

function buildHero(d) {
  const lang = d.language || 'JavaScript'
  // Prefer explicit subtitle → repo description → empty.
  // Previously defaulted to an anchor tag which rendered as an empty link.
  const subtitle = d.subtitle || d.description || ''
  return {
    type: 'hero',
    title: `${d.title}\n*${lang}*`,
    subtitle,
    badge: 'ARC Web',
    tags: [lang, 'Open Source']
  }
}

function buildProblem(d) {
  if (!Array.isArray(d.problems) || d.problems.length !== 3) {
    throw new Error('standard-template: problems must be an array of 3')
  }
  return {
    type: 'cards',
    eyebrow: 'The problem',
    title: "What's *broken* without this",
    cards: d.problems
  }
}

function buildCompare(d) {
  if (!Array.isArray(d.compareWith) || d.compareWith.length < 2) {
    throw new Error('standard-template: compareWith must be an array of 2+')
  }
  return {
    type: 'compare',
    eyebrow: 'The difference',
    title: 'Why it *matters*',
    left: { title: 'Without', items: ['Manual work', 'Slow iteration', 'Repeated mistakes'] },
    leftType: 'bad',
    right: { title: 'With this', items: d.compareWith },
    rightType: 'good'
  }
}

function buildFlow(d) {
  if (!Array.isArray(d.flowSteps) || d.flowSteps.length !== 3) {
    throw new Error('standard-template: flowSteps must be an array of 3')
  }
  return {
    type: 'flow',
    eyebrow: 'Under the hood',
    title: 'How it *works*',
    flow: d.flowSteps.map((s, i) => ({ ...s, color: FLOW_COLORS[i] }))
  }
}

function buildQuote(d) {
  requireField(d, 'quote')
  return {
    type: 'quote',
    quote: d.quote,
    attribution: `arc-web/${d.name}`
  }
}

function buildCodebase(d) {
  const lang = d.language || 'JavaScript'
  const depsStr = (Array.isArray(d.deps) && d.deps.length > 0)
    ? d.deps.slice(0, 3).join(', ')
    : 'See repository'
  const license = d.license || 'Open Source (MIT / PolyForm)'
  const arch = d.architecture || 'Tool'
  return {
    type: 'cards',
    eyebrow: 'Codebase',
    title: 'Built with *care*',
    cards: [
      { icon: '💻', title: lang, description: `Built in ${lang} for type safety and reliability.` },
      { icon: '🏗️', title: 'Architecture', description: arch },
      { icon: '📦', title: 'Key deps', description: depsStr },
      { icon: '🔓', title: license, description: "Fork it, extend it, ship it. It's yours." }
    ]
  }
}

// Detect fallback/placeholder content that indicates the AI had nothing real to synthesize.
const FALLBACK_SIGNALS = [
  'no automation yet', 'manual processes', 'tool gaps',
  'less manual work', 'faster iteration', 'consistent results',
  'input', 'processing', 'output'
]

function hasFallbackContent(data) {
  const targets = [
    ...(data.problems || []).map(p => p.title || ''),
    ...(data.compareWith || []),
    ...(data.flowSteps || []).map(s => s.title || '')
  ]
  const text = targets.join('\n').toLowerCase()
  const matches = FALLBACK_SIGNALS.filter(s => text.includes(s))
  return matches.length >= 3
}

function buildEarlyStageDeck(data) {
  requireField(data, 'title')
  requireField(data, 'name')
  const subtitle = data.subtitle || data.description || ''
  return {
    title: data.title,
    theme: data.theme || 'dark',
    slides: [
      {
        type: 'hero',
        title: `${data.title}\n*Early Stage*`,
        subtitle,
        badge: 'ARC Web',
        tags: [data.language || 'Open Source', 'Early Stage']
      },
      {
        type: 'cards',
        eyebrow: 'Status',
        title: 'Under *construction*',
        cards: [
          { icon: '🔬', title: 'Exploring', description: 'This project is in early exploration. Ideas are taking shape.' },
          { icon: '🛠️', title: 'Building', description: 'Active development — the core concept is being proven out.' },
          { icon: '🤝', title: 'Open', description: 'Early stage and open source. Fork it, break it, improve it.' }
        ]
      },
      buildCodebase(data),
      {
        type: 'quote',
        quote: data.quote || 'Every great tool starts as a rough idea.\nThis one is *just getting started.*',
        attribution: `arc-web/${data.name}`
      },
      CREATOR_SLIDE
    ]
  }
}

function buildStandardDeck(data) {
  requireField(data, 'title')
  requireField(data, 'name')
  // Auto-dispatch to early-stage builder if earlyStage flag set or fallback content detected.
  if (data.earlyStage === true || hasFallbackContent(data)) {
    return buildEarlyStageDeck(data)
  }
  return {
    title: data.title,
    theme: data.theme || 'dark',
    slides: [
      buildHero(data),
      buildProblem(data),
      buildCompare(data),
      buildFlow(data),
      CAPABILITIES_SLIDE,
      buildQuote(data),
      buildCodebase(data),
      CREATOR_SLIDE
    ]
  }
}

// Validate a standard-template data object.
// Returns { ok, errors: [{field, message}] }. Never throws.
function validateData(data) {
  const errors = []
  const add = (field, message) => errors.push({ field, message })

  if (!data || typeof data !== 'object') {
    return { ok: false, errors: [{ field: '(root)', message: 'data must be an object' }] }
  }

  // Required scalar fields
  for (const k of ['title', 'name', 'architecture', 'quote']) {
    if (!data[k] || typeof data[k] !== 'string' || !data[k].trim()) {
      add(k, `missing or empty string`)
    }
  }

  // Required array-of-3 fields
  const arr3 = (key, itemCheck) => {
    const v = data[key]
    if (!Array.isArray(v)) { add(key, 'must be an array'); return }
    if (v.length !== 3) { add(key, `must have exactly 3 items (got ${v.length})`); return }
    v.forEach((item, i) => {
      const msg = itemCheck(item)
      if (msg) add(`${key}[${i}]`, msg)
    })
  }

  arr3('problems', (p) => {
    if (!p || typeof p !== 'object') return 'must be an object'
    if (!p.icon) return 'missing icon'
    if (!p.title || p.title.split(/\s+/).length > 6) return 'title must be 1-6 words'
    if (!p.description || p.description.length < 20) return 'description must be 20+ chars'
    return null
  })

  arr3('flowSteps', (s) => {
    if (!s || typeof s !== 'object') return 'must be an object'
    if (!s.icon) return 'missing icon'
    if (!s.title) return 'missing title'
    if (!s.description) return 'missing description'
    return null
  })

  const cw = data.compareWith
  if (!Array.isArray(cw)) add('compareWith', 'must be an array')
  else if (cw.length !== 3) add('compareWith', `must have exactly 3 items (got ${cw.length})`)
  else cw.forEach((item, i) => {
    if (typeof item !== 'string' || !item.trim()) add(`compareWith[${i}]`, 'must be non-empty string')
  })

  // Optional fields: type-check when present
  if (data.deps !== undefined && !Array.isArray(data.deps)) {
    add('deps', 'must be an array when present')
  }
  if (data.theme !== undefined && typeof data.theme !== 'string') {
    add('theme', 'must be a string when present')
  }

  return { ok: errors.length === 0, errors }
}

module.exports = { buildStandardDeck, buildEarlyStageDeck, validateData }
