// Fetch top dependencies from a GitHub repo's package manifest.
// Supports: package.json (Node), requirements.txt (Python), Cargo.toml (Rust).
// Returns up to `limit` dep names (default 5), or [] if no manifest found.

const { execSync } = require('child_process')

const MANIFESTS = ['package.json', 'requirements.txt', 'Cargo.toml']

function ghContents(ownerRepo, file) {
  try {
    const out = execSync(
      `gh api repos/${ownerRepo}/contents/${file} --jq .content 2>/dev/null`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim()
    if (!out) return null
    return Buffer.from(out, 'base64').toString('utf8')
  } catch {
    return null
  }
}

function parsePackageJson(content, limit) {
  try {
    const pkg = JSON.parse(content)
    // Prefer runtime deps; fall back to devDependencies for workspace roots
    // that declare only tooling (e.g., pnpm monorepo root with private: true).
    const runtime = { ...(pkg.dependencies || {}), ...(pkg.peerDependencies || {}) }
    if (Object.keys(runtime).length > 0) return Object.keys(runtime).slice(0, limit)
    return Object.keys(pkg.devDependencies || {}).slice(0, limit)
  } catch {
    return []
  }
}

function parseRequirementsTxt(content, limit) {
  return content.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('-'))
    .map(l => l.split(/[=<>!~;\s\[]/)[0].trim())
    .filter(Boolean)
    .slice(0, limit)
}

function parseCargoToml(content, limit) {
  // Minimal parser: extract keys from [dependencies] section.
  const deps = []
  let inDeps = false
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('[')) {
      inDeps = line === '[dependencies]'
      continue
    }
    if (!inDeps || !line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=/)
    if (match) deps.push(match[1])
    if (deps.length >= limit) break
  }
  return deps
}

async function fetchDeps(ownerRepo, opts = {}) {
  const limit = opts.limit || 5
  for (const manifest of MANIFESTS) {
    const content = ghContents(ownerRepo, manifest)
    if (!content) continue
    if (manifest === 'package.json') {
      const deps = parsePackageJson(content, limit)
      if (deps.length) return { manifest, deps }
    } else if (manifest === 'requirements.txt') {
      const deps = parseRequirementsTxt(content, limit)
      if (deps.length) return { manifest, deps }
    } else if (manifest === 'Cargo.toml') {
      const deps = parseCargoToml(content, limit)
      if (deps.length) return { manifest, deps }
    }
  }
  return { manifest: null, deps: [] }
}

module.exports = { fetchDeps }
