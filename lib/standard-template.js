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
  return {
    type: 'hero',
    title: `${d.title}\n*${lang}*`,
    subtitle: d.subtitle || `<a href="https://arc-web.github.io/${d.name}/">`,
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

function buildStandardDeck(data) {
  requireField(data, 'title')
  requireField(data, 'name')
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

module.exports = { buildStandardDeck }
