const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const CACHE_DIR = path.join(process.env.HOME || '/tmp', '.gsap-deck')
const PRESENTATIONS_REPO = 'arc-web/presentations'
const PRESENTATIONS_DIR = path.join(CACHE_DIR, 'presentations')

function run(cmd, opts = {}) {
  const result = execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts })
  return (result || '').toString().trim()
}

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function slugFromFile(htmlPath) {
  return path.basename(htmlPath, '.html')
    .replace(/-deck$/, '')
    .replace(/-presentation$/, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase()
}

// Phase 1: Central presentations repo
async function publishToGitHub(htmlPath, slug) {
  ensureCacheDir()

  // Create repo if it doesn't exist
  try {
    run(`gh repo view ${PRESENTATIONS_REPO} --json name`, { silent: true })
  } catch {
    console.log('Creating presentations repo...')
    run(`gh repo create ${PRESENTATIONS_REPO} --public --description "Animated presentations by ARC Web"`)
    // Initialize with a README
    const tmpInit = path.join(CACHE_DIR, '_init')
    fs.mkdirSync(tmpInit, { recursive: true })
    fs.writeFileSync(path.join(tmpInit, 'README.md'), '# Presentations\n\nAnimated decks built with [gsap-deck](https://github.com/arc-web/gsap-deck).\n')
    run(`cd "${tmpInit}" && git init && git add . && git commit -m "init" && git branch -M main && git remote add origin https://github.com/${PRESENTATIONS_REPO}.git && git push -u origin main`)
    fs.rmSync(tmpInit, { recursive: true, force: true })
  }

  // Clone or pull
  if (fs.existsSync(path.join(PRESENTATIONS_DIR, '.git'))) {
    run(`cd "${PRESENTATIONS_DIR}" && git pull --ff-only`, { silent: true })
  } else {
    if (fs.existsSync(PRESENTATIONS_DIR)) fs.rmSync(PRESENTATIONS_DIR, { recursive: true, force: true })
    run(`gh repo clone ${PRESENTATIONS_REPO} "${PRESENTATIONS_DIR}"`)
  }

  // Copy HTML
  const destDir = path.join(PRESENTATIONS_DIR, slug)
  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(htmlPath, path.join(destDir, 'index.html'))

  // Update index
  updateIndex(PRESENTATIONS_DIR)

  // Commit and push
  run(`cd "${PRESENTATIONS_DIR}" && git add -A && git diff --cached --quiet || git commit -m "publish: ${slug}" && git push`)

  // Enable Pages if needed
  try {
    run(`gh api repos/${PRESENTATIONS_REPO}/pages --jq .html_url`, { silent: true })
  } catch {
    try {
      run(`gh api -X POST repos/${PRESENTATIONS_REPO}/pages -f source.branch=main -f source.path=/`, { silent: true })
      console.log('GitHub Pages enabled.')
    } catch (e) {
      console.log('Note: Enable GitHub Pages manually in repo settings if needed.')
    }
  }

  const url = `https://arc-web.github.io/presentations/${slug}/`
  console.log(`\nPublished: ${url}`)
  console.log('(Pages may take 1-2 minutes to deploy)')
  return url
}

// Phase 2: Per-repo presentation page
async function publishToRepo(htmlPath, repo) {
  const tmpDir = path.join(CACHE_DIR, `_repo_${repo.replace('/', '_')}`)

  // Clone
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
  run(`gh repo clone ${repo} "${tmpDir}"`)

  // Copy HTML to both docs/index.html (home page served by GH Pages)
  // and docs/presentation/index.html (back-compat path for existing links)
  const docsDir = path.join(tmpDir, 'docs')
  const presDir = path.join(docsDir, 'presentation')
  fs.mkdirSync(presDir, { recursive: true })
  fs.copyFileSync(htmlPath, path.join(docsDir, 'index.html'))
  fs.copyFileSync(htmlPath, path.join(presDir, 'index.html'))

  // Commit and push
  run(`cd "${tmpDir}" && git add -A && git diff --cached --quiet || git commit -m "docs: update presentation (home + /presentation)" && git push`)

  // Enable Pages from /docs if needed
  try {
    run(`gh api repos/${repo}/pages --jq .html_url`, { silent: true })
  } catch {
    // Check if repo is private
    const visibility = run(`gh repo view ${repo} --json visibility --jq .visibility`, { silent: true })
    if (visibility === 'PRIVATE') {
      console.log('Warning: GitHub Pages requires GitHub Pro for private repos.')
    }
    try {
      run(`gh api -X POST repos/${repo}/pages -f source.branch=main -f source.path=/docs`, { silent: true })
      console.log('GitHub Pages enabled from /docs.')
    } catch {
      console.log('Note: Enable GitHub Pages manually (source: /docs on main branch).')
    }
  }

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true })

  const repoName = repo.split('/')[1]
  const owner = repo.split('/')[0]
  const url = `https://${owner}.github.io/${repoName}/presentation/`
  console.log(`\nPublished: ${url}`)
  console.log('(Pages may take 1-2 minutes to deploy)')
  return url
}

// Phase 3a: Hostinger VPS
async function publishToHostinger(htmlPath, domain) {
  const remotePath = `/var/www/${domain}/presentation/index.html`
  run(`ssh zeroclaw "mkdir -p /var/www/${domain}/presentation/"`)
  run(`scp "${htmlPath}" zeroclaw:${remotePath}`)
  const url = `https://${domain}/presentation/`
  console.log(`\nPublished: ${url}`)
  console.log('Note: Ensure nginx is configured to serve this path.')
  return url
}

// Phase 3b: Vercel
async function publishToVercel(htmlPath, domain) {
  // Check vercel CLI
  try {
    run('which vercel', { silent: true })
  } catch {
    console.error('Vercel CLI not installed. Run: npm i -g vercel')
    process.exit(1)
  }

  const tmpDir = path.join(CACHE_DIR, '_vercel_deploy')
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
  fs.mkdirSync(tmpDir, { recursive: true })
  fs.copyFileSync(htmlPath, path.join(tmpDir, 'index.html'))

  const output = run(`cd "${tmpDir}" && vercel deploy --prod --yes 2>&1`, { silent: true })
  fs.rmSync(tmpDir, { recursive: true, force: true })

  // Extract URL from vercel output
  const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app[^\s]*/)
  const url = urlMatch ? urlMatch[0] : output

  if (domain) {
    try {
      run(`vercel alias ${url} ${domain}`, { silent: true })
      console.log(`\nPublished: https://${domain}`)
    } catch {
      console.log(`\nPublished: ${url}`)
      console.log(`Alias failed. Run manually: vercel alias ${url} ${domain}`)
    }
  } else {
    console.log(`\nPublished: ${url}`)
  }
  return url
}

// Phase 3c: Cloudflare Pages — delegates to cloudflare_deploy library.
const CF_PROJECT_DEFAULT = 'gsap-deck-live'
const CF_DOMAIN_DEFAULT = 'lonopack.com'

async function publishToCloudflare(htmlPath, opts = {}) {
  const project = opts.project || CF_PROJECT_DEFAULT
  const domain = opts.domain || CF_DOMAIN_DEFAULT
  const { deploy } = require('cloudflare_deploy')
  await deploy({ source: htmlPath, project, domain })
  return `https://${domain}`
}

// Phase 5: Custom targets
async function publishCustom(htmlPath, method, dest) {
  switch (method) {
    case 'scp':
      run(`scp "${htmlPath}" "${dest}"`)
      console.log(`\nPublished via SCP to ${dest}`)
      break
    case 's3':
      run(`aws s3 cp "${htmlPath}" "${dest}"`)
      console.log(`\nPublished to S3: ${dest}`)
      break
    case 'netlify': {
      const tmpDir = path.join(CACHE_DIR, '_netlify_deploy')
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
      fs.mkdirSync(tmpDir, { recursive: true })
      fs.copyFileSync(htmlPath, path.join(tmpDir, 'index.html'))
      run(`cd "${tmpDir}" && netlify deploy --prod --dir=.`)
      fs.rmSync(tmpDir, { recursive: true, force: true })
      break
    }
    case 'cloudflare':
      await publishToCloudflare(htmlPath)
      break
    default:
      console.error(`Unknown method: ${method}. Use: scp, s3, netlify, cloudflare`)
      process.exit(1)
  }
}

// Generate index.html listing all presentations
function updateIndex(repoDir) {
  const dirs = fs.readdirSync(repoDir).filter(d => {
    if (d.startsWith('.') || d === 'node_modules' || d === 'README.md') return false
    const stat = fs.statSync(path.join(repoDir, d))
    return stat.isDirectory() && fs.existsSync(path.join(repoDir, d, 'index.html'))
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presentations - ARC Web</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #07070F; color: #F0EEFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .container { max-width: 600px; width: 100%; padding: 48px 24px; }
  h1 { font-size: 32px; margin-bottom: 8px; }
  .sub { color: #7A728A; margin-bottom: 40px; }
  a { display: block; padding: 16px 20px; margin-bottom: 12px; background: #0F0F1A; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; color: #F0EEFF; text-decoration: none; font-size: 18px; transition: border-color 0.2s; }
  a:hover { border-color: #7B2FBE; }
  .arrow { float: right; color: #7A728A; }
</style>
</head>
<body>
<div class="container">
  <h1>Presentations</h1>
  <p class="sub">ARC Web</p>
  ${dirs.map(d => `<a href="./${d}/">${d.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} <span class="arrow">&rarr;</span></a>`).join('\n  ')}
</div>
</body>
</html>`

  fs.writeFileSync(path.join(repoDir, 'index.html'), html)
}

// Batch: build + publish every data JSON in a directory through the standard template.
// Concurrency-limited. Returns {ok, failed} counts.
async function publishAllStandard(dataDir, opts = {}) {
  const { buildStandardDeck } = require('./standard-template')
  const { buildDeck } = require('./build')
  const owner = opts.owner || 'arc-web'
  const concurrency = opts.concurrency || 5
  const archived = new Set(opts.archived || [])

  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    throw new Error(`Not a directory: ${dataDir}`)
  }

  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json'))
    .filter(f => !archived.has(f.replace(/\.json$/, '')))

  console.log(`Publishing ${files.length} decks from ${dataDir}...`)

  async function publishOne(file) {
    const name = file.replace(/\.json$/, '')
    const dataPath = path.join(dataDir, file)
    const htmlPath = path.join(CACHE_DIR, `_batch_${name}.html`)
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
      const config = buildStandardDeck(data)
      fs.writeFileSync(htmlPath, buildDeck(config))
      await publishToRepo(htmlPath, `${owner}/${name}`)
      fs.rmSync(htmlPath, { force: true })
      console.log(`  [\u2713] ${name}`)
      return { name, ok: true }
    } catch (err) {
      fs.rmSync(htmlPath, { force: true })
      console.log(`  [\u2717] ${name} \u2014 ${err.message.split('\n')[0].slice(0, 120)}`)
      return { name, ok: false, error: err.message }
    }
  }

  // Simple concurrency pool
  const results = []
  const queue = [...files]
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const f = queue.shift()
      results.push(await publishOne(f))
    }
  })
  await Promise.all(workers)

  const ok = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok)
  console.log(`\n\u2713 Published ${ok}/${files.length}`)
  if (failed.length) {
    console.log(`Failed: ${failed.map(f => f.name).join(', ')}`)
  }
  return { ok, failed }
}

module.exports = {
  slugFromFile,
  publishToGitHub,
  publishToRepo,
  publishToHostinger,
  publishToVercel,
  publishToCloudflare,
  publishCustom,
  publishAllStandard,
}
