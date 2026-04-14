#!/usr/bin/env node

const { program } = require('commander')
const fs = require('fs')
const path = require('path')
const { buildDeck } = require('../lib/build')
const { buildStandardDeck } = require('../lib/standard-template')
const { listThemes } = require('../lib/themes')
const { slugFromFile, publishToGitHub, publishToRepo, publishToHostinger, publishToVercel, publishCustom } = require('../lib/publish')

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
  .option('-t, --target <target>', 'Target: github, repo, hostinger, vercel, custom', 'github')
  .option('-s, --slug <slug>', 'URL slug (default: inferred from filename)')
  .option('-r, --repo <owner/name>', 'Target repo (for --target repo)')
  .option('-d, --domain <domain>', 'Custom domain (for hostinger/vercel)')
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
        console.error(`Unknown target: ${opts.target}. Use: github, repo, hostinger, vercel, custom`)
        process.exit(1)
    }
  })

program.parse()
