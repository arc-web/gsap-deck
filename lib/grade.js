// lib/grade.js
// Grade deck JSON files on content quality, 0-100. Pure heuristics, no AI.
// Ported from /tmp/grade_decks.py.
//
// Usage:
//   const { gradeAll } = require('./grade')
//   const results = gradeAll(dataDir)   // dataDir contains *.json data files
//   // OR pass a dir of full deck JSONs:
//   const results = gradeAll(decksDir, { fullDeck: true })

const fs = require('fs')
const path = require('path')
const { buildStandardDeck } = require('./standard-template')

const GENERIC_COMPARE = new Set([
  'Automated', 'Fast results', 'Reliable',
  'Manual work', 'Slow iteration', 'Repeated mistakes'
])
const GENERIC_FLOW = new Set([
  'System processes and transforms',
  'AI agent analyzes and acts',
  'Provide your data or request',
  'Get results you can use immediately'
])
const GENERIC_QUOTES = [
  'solves real problems',
  'tools that actually work',
  'Built for people who want'
]
const VALID_ARCH = new Set([
  'MCP Server', 'CLI Tool', 'Web App', 'SDK/Library', 'SDK / Toolkit',
  'AI Agent', 'AI Agent / MCP Server', 'API', 'Dashboard', 'Web Dashboard',
  'Platform', 'Configuration Tool', 'Library', 'Tool'
])

function slideByType(deck, type) {
  return (deck.slides || []).find(s => s.type === type)
}

function gradeDeck(deck, allCompareItems) {
  let score = 0
  const reasons = []

  // Early-stage decks don't have compare/flow/problem slides — score them separately.
  const isEarlyStage = !(deck.slides || []).some(s => s.type === 'compare')
  if (isEarlyStage) {
    // Give a baseline score for intentional early-stage decks.
    return { score: 60, reasons: ['early-stage deck (intentional)'], earlyStage: true }
  }

  // Compare slide "with this" (20pt)
  const compare = slideByType(deck, 'compare')
  if (compare) {
    const items = (compare.right || {}).items || []
    const generic = items.filter(i => GENERIC_COMPARE.has(i))
    if (!generic.length && items.length) {
      const dupCount = items.filter(i => (allCompareItems.get(i) || 0) > 3).length
      if (dupCount === 0) {
        score += 20
      } else {
        score += 10
        reasons.push(`compare items used in ${dupCount} other decks`)
      }
    } else {
      reasons.push(`generic compare items: ${generic.join(', ')}`)
    }
  }

  // Flow processing step (20pt)
  const flow = slideByType(deck, 'flow')
  if (flow && (flow.flow || []).length >= 2) {
    const proc = flow.flow[1]
    const desc = proc.description || ''
    if (!GENERIC_FLOW.has(desc) && desc.length > 40) {
      score += 20
    } else {
      reasons.push(`flow processing too generic: "${desc.slice(0, 50)}"`)
    }
  }

  // Quote (20pt)
  const quote = slideByType(deck, 'quote')
  if (quote) {
    const q = quote.quote || ''
    if (!GENERIC_QUOTES.some(g => q.includes(g))) {
      score += 20
    } else {
      reasons.push('quote has template filler')
    }
  }

  // Architecture (15pt)
  const codebase = (deck.slides || []).find(
    s => s.type === 'cards' && s.eyebrow === 'Codebase'
  )
  if (codebase) {
    const archCard = (codebase.cards || []).find(c => c.title === 'Architecture')
    if (archCard) {
      if (VALID_ARCH.has(archCard.description)) {
        score += 15
      } else {
        reasons.push(`generic architecture: "${archCard.description}"`)
      }
    }

    // Key deps (10pt)
    const depsCard = (codebase.cards || []).find(c => c.title === 'Key deps')
    if (depsCard) {
      const deps = depsCard.description || ''
      if (deps && !deps.toLowerCase().includes('package.json') && !deps.includes('See repository')) {
        if (/[@\w][-\w/]+/.test(deps)) {
          score += 10
        } else {
          reasons.push(`deps unclear: "${deps}"`)
        }
      } else {
        reasons.push(`deps placeholder: "${deps}"`)
      }
    }
  }

  // Problem cards (15pt)
  const problem = (deck.slides || []).find(
    s => s.type === 'cards' && s.eyebrow === 'The problem'
  )
  if (problem) {
    const cards = problem.cards || []
    if (cards.length === 3) {
      const allGood = cards.every(c =>
        (c.title || '').split(/\s+/).length <= 6 &&
        (c.description || '').length > 40 &&
        !(c.title || '').endsWith('bypa')
      )
      if (allGood) {
        score += 15
      } else {
        reasons.push('problem cards malformed')
      }
    }
  }

  return { score, reasons, earlyStage: false }
}

// Build the compare-item frequency map across all decks.
function buildCompareIndex(decks) {
  const counts = new Map()
  for (const deck of decks) {
    const compare = slideByType(deck, 'compare')
    if (compare) {
      for (const item of ((compare.right || {}).items || [])) {
        counts.set(item, (counts.get(item) || 0) + 1)
      }
    }
  }
  return counts
}

// Load data files and build full decks, or load pre-built deck JSONs.
function loadDecks(dir, opts = {}) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  const decks = []
  for (const f of files) {
    const name = f.replace(/\.json$/, '')
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    let deck
    if (opts.fullDeck || Array.isArray(raw.slides)) {
      deck = raw
    } else {
      try {
        deck = buildStandardDeck(raw)
      } catch (err) {
        decks.push({ name, deck: null, error: err.message })
        continue
      }
    }
    decks.push({ name, deck, error: null })
  }
  return decks
}

function gradeAll(dir, opts = {}) {
  const entries = loadDecks(dir, opts)
  const validDecks = entries.filter(e => e.deck).map(e => e.deck)
  const allCompareItems = buildCompareIndex(validDecks)

  const results = entries.map(({ name, deck, error }) => {
    if (error) return { name, score: 0, reasons: [`build error: ${error.slice(0, 80)}`], earlyStage: false }
    return { name, ...gradeDeck(deck, allCompareItems) }
  })

  results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return results
}

function printGradeReport(results) {
  const w = Math.max(...results.map(r => r.name.length), 4)
  console.log(`${'SCORE'.padStart(5)} ${'REPO'.padEnd(w)} ISSUES`)
  console.log('-'.repeat(5 + 1 + w + 1 + 60))
  for (const r of results) {
    const marker = r.score >= 70 ? '  ' : 'X '
    const issues = r.reasons.length ? r.reasons.join('; ').slice(0, 60) : '-'
    console.log(`${marker}${String(r.score).padStart(3)} ${r.name.padEnd(w)} ${issues}`)
  }
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length
  const below = results.filter(r => r.score < 70 && !r.earlyStage)
  console.log(`\nAverage: ${avg.toFixed(1)}/100 | ${below.length}/${results.length} below 70`)
}

module.exports = { gradeAll, printGradeReport }
