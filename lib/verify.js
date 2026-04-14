// lib/verify.js
// Verify that each repo's live docs/index.html matches its expected content.
// Uses `gh api` to fetch repo contents, checking without waiting for Pages CDN.
// Ported from /tmp/verify_published.py.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { buildStandardDeck } = require('./standard-template')

// Signature: first problem-card title. Appears in the rendered HTML.
function getSignature(deck) {
  const problem = (deck.slides || []).find(
    s => s.type === 'cards' && s.eyebrow === 'The problem'
  )
  if (problem && (problem.cards || []).length > 0) {
    return problem.cards[0].title
  }
  // For early-stage decks, use a string that appears in the under-construction slide.
  const construction = (deck.slides || []).find(
    s => s.type === 'cards' && s.eyebrow === 'Status'
  )
  if (construction) return 'Under'
  return null
}

function fetchRepoFile(owner, repo, filePath) {
  try {
    const out = execSync(
      `gh api repos/${owner}/${repo}/contents/${filePath} --jq .content`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }
    ).trim()
    return Buffer.from(out, 'base64').toString('utf8')
  } catch {
    return null
  }
}

async function verifyAll(dataDir, opts = {}) {
  const owner = opts.owner || 'arc-web'
  const concurrency = opts.concurrency || 8
  const skip = new Set(opts.skip || [])

  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
    .filter(name => !skip.has(name))
    .sort()

  console.log(`Checking ${files.length} repos...\n`)

  async function checkOne(name) {
    const dataPath = path.join(dataDir, `${name}.json`)
    let deck
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
      deck = buildStandardDeck(data)
    } catch (err) {
      return { name, status: 'ERROR', msg: `build error: ${err.message.slice(0, 80)}` }
    }

    const signature = getSignature(deck)
    if (!signature) {
      return { name, status: 'SKIP', msg: 'no signature (no problem/status slide)' }
    }

    const content = fetchRepoFile(owner, name, 'docs/index.html')
    if (!content) {
      return { name, status: 'ERROR', msg: `gh api failed — repo may not exist` }
    }

    if (content.includes(signature)) {
      return { name, status: 'OK', msg: `serving: "${signature.slice(0, 40)}"` }
    } else {
      return { name, status: 'STALE', msg: `missing: "${signature.slice(0, 40)}"` }
    }
  }

  // Concurrency pool
  const results = []
  const queue = [...files]
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      results.push(await checkOne(queue.shift()))
    }
  })
  await Promise.all(workers)

  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

function printVerifyReport(results) {
  const ok = results.filter(r => r.status === 'OK').length
  const stale = results.filter(r => r.status === 'STALE')
  const errors = results.filter(r => r.status === 'ERROR')
  const w = Math.max(...results.map(r => r.name.length), 4)

  for (const { name, status, msg } of results) {
    const mark = status === 'OK' ? '\u2713' : status === 'STALE' ? '\u26a0' : status === 'SKIP' ? '-' : '\u2717'
    console.log(`  ${mark} ${status.padEnd(6)} ${name.padEnd(w)} ${msg}`)
  }

  console.log(`\n${ok}/${results.length} serving new content. Stale: ${stale.length}. Errors: ${errors.length}.`)
  if (stale.length) {
    console.log(`\nStale: ${stale.map(r => r.name).join(', ')}`)
  }
}

module.exports = { verifyAll, printVerifyReport }
