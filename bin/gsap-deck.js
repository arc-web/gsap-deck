#!/usr/bin/env node

const { program } = require('commander')
const fs = require('fs')
const path = require('path')
const { buildDeck } = require('../lib/build')
const { buildStandardDeck, validateData } = require('../lib/standard-template')
const { fetchDeps } = require('../lib/fetch-deps')
const { listThemes } = require('../lib/themes')
const { slugFromFile, publishToGitHub, publishToRepo, publishToHostinger, publishToVercel, publishToCloudflare, publishCustom, publishAllStandard } = require('../lib/publish')
const { watchDeck } = require('../lib/watch')

// export-pdf is loaded lazily in the command action (puppeteer optional peer dep)

program
  .name('gsap-deck')
  .description('Generate stunning animated HTML presentations from JSON')
  .version('1.0.0')

program
  .command('build <input>')
  .description('Build a presentation from a JSON config file')
  .option('-o, --output <path>', 'Output HTML file path', 'presentation.html')
  .option('-t, --theme <name>', 'Theme: dark, midnight, ember, forest, ocean', 'dark')
  .option('--open', 'Open in browser after build')
  .action((input, opts) => {
    const inputPath = path.resolve(input)
    if (!fs.existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`)
      process.exit(1)
    }

    const config = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
    if (opts.theme) config.theme = opts.theme

    const html = buildDeck(config)
    const outputPath = path.resolve(opts.output)
    fs.writeFileSync(outputPath, html)
    console.log(`Built: ${outputPath} (${config.slides.length} slides, theme: ${config.theme || 'dark'})`)

    if (opts.open) {
      require('child_process').execSync(`open "${outputPath}"`)
    }
  })

program
  .command('build-standard <input>')
  .description('Build a standard ARC Web 8-slide deck from minimal data JSON')
  .option('-o, --output <path>', 'Output HTML file path', 'presentation.html')
  .option('--open', 'Open in browser after build')
  .action((input, opts) => {
    const inputPath = path.resolve(input)
    if (!fs.existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`)
      process.exit(1)
    }

    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
    const result = validateData(data)
    if (!result.ok) {
      console.error(`Validation failed for ${inputPath}:`)
      result.errors.forEach(e => console.error(`  ${e.field.padEnd(20)} ${e.message}`))
      process.exit(1)
    }
    const config = buildStandardDeck(data)
    const html = buildDeck(config)
    const outputPath = path.resolve(opts.output)
    fs.writeFileSync(outputPath, html)
    console.log(`Built: ${outputPath} (${config.slides.length} slides, theme: ${config.theme})`)

    if (opts.open) {
      require('child_process').execSync(`open "${outputPath}"`)
    }
  })

program
  .command('export-pdf <html>')
  .description('Export a presentation to PDF (requires: npm install puppeteer)')
  .option('-o, --output <path>', 'Output PDF path', 'presentation.pdf')
  .action(async (html, opts) => {
    const htmlPath = path.resolve(html)
    if (!fs.existsSync(htmlPath)) {
      console.error(`File not found: ${htmlPath}`)
      process.exit(1)
    }
    const outputPath = path.resolve(opts.output)
    const { exportPdf } = require('../lib/export-pdf')
    await exportPdf(htmlPath, outputPath)
  })

program
  .command('themes')
  .description('List available themes')
  .action(() => {
    console.log('Available themes:')
    listThemes().forEach(t => console.log(`  - ${t}`))
  })

program
  .command('scaffold')
  .description('Create a starter JSON config file')
  .option('-o, --output <path>', 'Output file path', 'deck.json')
  .action((opts) => {
    const starter = {
      title: 'My Presentation',
      theme: 'dark',
      slides: [
        {
          type: 'hero',
          title: 'The *Big Idea*',
          subtitle: 'A one-line description of what this is about.',
          badge: 'Your Event Name',
          tags: ['Tag 1', 'Tag 2', 'Tag 3']
        },
        {
          type: 'cards',
          eyebrow: 'The problem',
          title: 'Why this *matters*',
          cards: [
            { icon: '⏱️', title: 'First pain point', description: 'Explain why this hurts.' },
            { icon: '🧠', title: 'Second pain point', description: 'Explain why this matters.' },
            { icon: '🔁', title: 'Third pain point', description: 'Explain the consequence.' }
          ]
        },
        {
          type: 'steps',
          eyebrow: 'The solution',
          title: 'How it *works*',
          steps: [
            { title: 'Step one', description: 'what happens first' },
            { title: 'Step two', description: 'what happens next' },
            { title: 'Step three', description: 'the result' }
          ]
        },
        {
          type: 'stats',
          eyebrow: 'By the numbers',
          title: 'The *impact*',
          stats: [
            { value: '10x', label: 'Faster' },
            { value: '50%', label: 'Less effort' },
            { value: '4', label: 'Teams using it' }
          ]
        },
        {
          type: 'compare',
          eyebrow: 'Before vs after',
          title: 'The *difference*',
          left: {
            title: 'Before',
            items: ['Manual process', 'Took 3 hours', 'Error prone']
          },
          leftType: 'bad',
          right: {
            title: 'After',
            items: ['Automated', 'Takes 5 minutes', 'Consistent results']
          },
          rightType: 'good'
        },
        {
          type: 'quote',
          quote: 'Come with a problem.<br>Leave with something *that works.*',
          attribution: 'Your name or event'
        }
      ]
    }

    const outputPath = path.resolve(opts.output)
    fs.writeFileSync(outputPath, JSON.stringify(starter, null, 2) + '\n')
    console.log(`Created: ${outputPath}`)
    console.log(`Edit the file, then run: gsap-deck build ${opts.output} --open`)
  })

program
  .command('publish <html>')
  .description('Publish a presentation to a hosting target')
  .option('-t, --target <target>', 'Target: github, repo, hostinger, vercel, cloudflare, custom', 'github')
  .option('-s, --slug <slug>', 'URL slug (default: inferred from filename)')
  .option('-r, --repo <owner/name>', 'Target repo (for --target repo)')
  .option('-d, --domain <domain>', 'Custom domain (for hostinger/vercel/cloudflare)')
  .option('-p, --project <name>', 'Cloudflare Pages project name (default: gsap-deck-live)')
  .option('-m, --method <method>', 'Deploy method for custom: scp, s3, netlify, cloudflare')
  .option('--dest <destination>', 'Destination path for custom deploy')
  .action(async (html, opts) => {
    const htmlPath = path.resolve(html)
    if (!fs.existsSync(htmlPath)) {
      console.error(`File not found: ${htmlPath}`)
      process.exit(1)
    }

    const slug = opts.slug || slugFromFile(htmlPath)

    switch (opts.target) {
      case 'github':
        await publishToGitHub(htmlPath, slug)
        break
      case 'repo':
        if (!opts.repo) {
          console.error('--repo <owner/name> is required for target "repo"')
          process.exit(1)
        }
        await publishToRepo(htmlPath, opts.repo)
        break
      case 'hostinger':
        if (!opts.domain) {
          console.error('--domain <domain> is required for target "hostinger"')
          process.exit(1)
        }
        await publishToHostinger(htmlPath, opts.domain)
        break
      case 'vercel':
        await publishToVercel(htmlPath, opts.domain)
        break
      case 'cloudflare':
        await publishToCloudflare(htmlPath, { domain: opts.domain, project: opts.project })
        break
      case 'custom':
        if (!opts.method) {
          console.error('--method <scp|s3|netlify|cloudflare> is required for target "custom"')
          process.exit(1)
        }
        if (!opts.dest && opts.method === 'scp') {
          console.error('--dest <user@host:/path/> is required for SCP')
          process.exit(1)
        }
        await publishCustom(htmlPath, opts.method, opts.dest)
        break
      default:
        console.error(`Unknown target: ${opts.target}. Use: github, repo, hostinger, vercel, cloudflare, custom`)
        process.exit(1)
    }
  })

program
  .command('watch <input>')
  .description('Watch a JSON file and serve with live-reload at localhost:7555')
  .option('-p, --port <port>', 'Port to serve on', (v) => parseInt(v, 10), 7555)
  .action((input, opts) => {
    const inputPath = path.resolve(input)
    if (!fs.existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`)
      process.exit(1)
    }
    watchDeck(inputPath, { port: opts.port })
  })

program
  .command('fetch-deps [owner/repo]')
  .description('Fetch top dependencies from a GitHub repo (package.json / requirements.txt / Cargo.toml)')
  .option('-u, --update <data.json>', 'Update the `deps` field in this data JSON file')
  .option('-a, --all <data-dir>', 'Batch mode: update every *.json in this directory')
  .option('-o, --owner <owner>', 'Org/user for batch mode (used with --all)', 'arc-web')
  .option('-l, --limit <n>', 'Max deps to return', (v) => parseInt(v, 10), 5)
  .action(async (ownerRepo, opts) => {
    if (opts.all) {
      const dir = path.resolve(opts.all)
      if (!fs.existsSync(dir)) { console.error(`Directory not found: ${dir}`); process.exit(1) }
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      let updated = 0, skipped = 0
      for (const f of files) {
        const name = f.replace(/\.json$/, '')
        const repo = `${opts.owner}/${name}`
        const { manifest, deps } = await fetchDeps(repo, { limit: opts.limit })
        if (!deps.length) {
          console.log(`  [-] ${name.padEnd(35)} no manifest found`)
          skipped++
          continue
        }
        const dataPath = path.join(dir, f)
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
        data.deps = deps
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
        console.log(`  [\u2713] ${name.padEnd(35)} ${manifest.padEnd(18)} ${deps.join(', ')}`)
        updated++
      }
      console.log(`\nUpdated ${updated}; skipped ${skipped} (no manifest)`)
      return
    }

    if (!ownerRepo || !ownerRepo.includes('/')) {
      console.error('Provide <owner/repo>, or use --all <data-dir> for batch mode')
      process.exit(1)
    }
    const { manifest, deps } = await fetchDeps(ownerRepo, { limit: opts.limit })
    if (!deps.length) {
      console.log(`No manifest found for ${ownerRepo} (checked: package.json, requirements.txt, Cargo.toml)`)
      process.exit(1)
    }
    console.log(`${manifest}: ${deps.join(', ')}`)
    if (opts.update) {
      const dataPath = path.resolve(opts.update)
      if (!fs.existsSync(dataPath)) { console.error(`File not found: ${dataPath}`); process.exit(1) }
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
      data.deps = deps
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
      console.log(`Updated ${dataPath}`)
    }
  })

program
  .command('validate <input>')
  .description('Check a standard-template data JSON for shape errors without building')
  .action((input) => {
    const inputPath = path.resolve(input)
    if (!fs.existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`)
      process.exit(1)
    }
    let data
    try {
      data = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
    } catch (e) {
      console.error(`Invalid JSON: ${e.message}`)
      process.exit(1)
    }
    const result = validateData(data)
    if (result.ok) {
      console.log(`PASS  ${inputPath}`)
      return
    }
    console.log(`FAIL  ${inputPath}`)
    result.errors.forEach(e => console.log(`  ${e.field.padEnd(20)} ${e.message}`))
    process.exit(1)
  })

program
  .command('update-all <data-dir>')
  .description('Build + publish every *.json data file in a directory via the standard template')
  .option('-o, --owner <owner>', 'GitHub org/user (infers repo as owner/{filename})', 'arc-web')
  .option('-c, --concurrency <n>', 'Parallel publishes', (v) => parseInt(v, 10), 5)
  .option('--skip <names>', 'Comma-separated data file basenames to skip')
  .action(async (dataDir, opts) => {
    const resolved = path.resolve(dataDir)
    if (!fs.existsSync(resolved)) {
      console.error(`Directory not found: ${resolved}`)
      process.exit(1)
    }
    const archived = opts.skip ? opts.skip.split(',').map(s => s.trim()).filter(Boolean) : []
    const result = await publishAllStandard(resolved, {
      owner: opts.owner,
      concurrency: opts.concurrency,
      archived,
    })
    if (result.failed.length) process.exit(1)
  })

program
  .command('grade <data-dir>')
  .description('Score every data JSON in a directory on content quality (0-100)')
  .option('--full-deck', 'Treat files as pre-built full deck JSONs instead of data files')
  .action((dataDir, opts) => {
    const resolved = path.resolve(dataDir)
    if (!fs.existsSync(resolved)) {
      console.error(`Directory not found: ${resolved}`)
      process.exit(1)
    }
    const { gradeAll, printGradeReport } = require('../lib/grade')
    const results = gradeAll(resolved, { fullDeck: opts.fullDeck })
    printGradeReport(results)
    const below = results.filter(r => r.score < 70 && !r.earlyStage)
    if (below.length) process.exit(1)
  })

program
  .command('verify <data-dir>')
  .description('Check each repo\'s live docs/index.html matches its expected content')
  .option('-o, --owner <owner>', 'GitHub org/user', 'arc-web')
  .option('--skip <names>', 'Comma-separated repo names to skip')
  .option('-c, --concurrency <n>', 'Parallel checks', (v) => parseInt(v, 10), 8)
  .action(async (dataDir, opts) => {
    const resolved = path.resolve(dataDir)
    if (!fs.existsSync(resolved)) {
      console.error(`Directory not found: ${resolved}`)
      process.exit(1)
    }
    const skip = opts.skip ? opts.skip.split(',').map(s => s.trim()).filter(Boolean) : []
    const { verifyAll, printVerifyReport } = require('../lib/verify')
    const results = await verifyAll(resolved, {
      owner: opts.owner,
      concurrency: opts.concurrency,
      skip,
    })
    printVerifyReport(results)
    const stale = results.filter(r => r.status === 'STALE')
    if (stale.length) process.exit(1)
  })

program.parse()
