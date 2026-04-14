// lib/export-pdf.js
// Export a deck HTML file to PDF using headless Chrome via puppeteer.
// puppeteer is an optional peer dependency — the tool checks at runtime
// and exits with a helpful message if it's not installed.
//
// Usage:
//   const { exportPdf } = require('./export-pdf')
//   await exportPdf(htmlPath, outputPath)

const fs = require('fs')
const path = require('path')

// Chrome executable candidates for puppeteer-core fallback
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
]

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function requirePuppeteer() {
  // Try full puppeteer (bundles Chromium) first.
  try { return { pptr: require('puppeteer'), executablePath: undefined } } catch {}
  // Fall back to puppeteer-core with system Chrome.
  try {
    const pptr = require('puppeteer-core')
    const executablePath = findChrome()
    if (!executablePath) {
      console.error('puppeteer-core found but no Chrome/Chromium installation detected.')
      console.error('Install puppeteer (bundles Chromium): npm install puppeteer')
      process.exit(1)
    }
    return { pptr, executablePath }
  } catch {}
  console.error('Neither puppeteer nor puppeteer-core is installed.')
  console.error('Run: npm install puppeteer')
  process.exit(1)
}

// Count slides in the HTML by counting id="slide-N" occurrences.
function countSlides(html) {
  const matches = html.match(/id="slide-\d+"/g)
  return matches ? matches.length : 0
}

async function exportPdf(htmlPath, outputPath, opts = {}) {
  const { pptr, executablePath } = requirePuppeteer()
  const html = fs.readFileSync(htmlPath, 'utf8')
  const slideCount = countSlides(html)

  if (slideCount === 0) {
    console.error('No slides found in HTML — is this a gsap-deck file?')
    process.exit(1)
  }

  console.log(`Exporting ${slideCount} slides to PDF...`)

  const launchOpts = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
  if (executablePath) launchOpts.executablePath = executablePath

  const browser = await pptr.launch(launchOpts)

  const page = await browser.newPage()

  // 16:9 viewport at 1280×720 — matches the deck's full-viewport layout.
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 })

  const fileUrl = `file://${path.resolve(htmlPath)}`
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 })

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  // Wait for GSAP to finish the initial slide animation.
  await sleep(800)

  // Inject helpers: expose a function to jump to slide N and wait for it.
  await page.evaluate(() => {
    window.__gotoSlide = (idx) => {
      return new Promise((resolve) => {
        const slides = document.querySelectorAll('.slide')
        if (!slides[idx]) { resolve(); return }
        // Use the existing go() function if available, else manually activate.
        if (typeof go === 'function') {
          // Bypass busy check for PDF export by forcing state.
          const ov = document.getElementById('overlay')
          if (ov) ov.style.opacity = '0'
          slides.forEach((s, i) => {
            s.classList.toggle('active', i === idx)
          })
          // Reset + re-animate elements by briefly toggling opacity.
          const els = slides[idx].querySelectorAll(
            '.eyebrow,.line,h1,h2,.sub,.card,.stat,.step,.compare-col,.code-block,blockquote,.hero-badge,.tags-row,.tag,.flow-step,.body-text,.img-wrap,.tl-node,.team-card'
          )
          els.forEach(el => { el.style.opacity = '1' })
        }
        setTimeout(resolve, 400)
      })
    }
  })

  const pdfPages = []
  const tmpDir = require('os').tmpdir()

  for (let i = 0; i < slideCount; i++) {
    await page.evaluate((idx) => window.__gotoSlide(idx), i)
    await sleep(300)

    const imgBuf = await page.screenshot({ type: 'png', fullPage: false })
    const imgPath = path.join(tmpDir, `gsap-deck-slide-${i}.png`)
    fs.writeFileSync(imgPath, imgBuf)
    pdfPages.push(imgPath)
    process.stdout.write(`  slide ${i + 1}/${slideCount}\r`)
  }

  await browser.close()
  process.stdout.write('\n')

  // Assemble PNG frames into a PDF using puppeteer's PDF generation.
  // We open a fresh page that shows each image full-viewport and print.
  const launchOpts2 = { headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  if (executablePath) launchOpts2.executablePath = executablePath
  const browser2 = await pptr.launch(launchOpts2)
  const pdfPage = await browser2.newPage()

  const imagesHtml = pdfPages.map(p => {
    const data = fs.readFileSync(p).toString('base64')
    return `<div style="width:100%;height:100vh;page-break-after:always;background:#000;display:flex;align-items:center;justify-content:center;">
      <img src="data:image/png;base64,${data}" style="width:100%;height:100%;object-fit:contain;">
    </div>`
  }).join('\n')

  await pdfPage.setContent(`<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#000}
    @page{size:1280px 720px;margin:0}
  </style></head><body>${imagesHtml}</body></html>`, { waitUntil: 'networkidle0' })

  await pdfPage.pdf({
    path: outputPath,
    width: '1280px',
    height: '720px',
    printBackground: true,
    pageRanges: ''
  })

  await browser2.close()

  // Cleanup temp PNGs
  pdfPages.forEach(p => { try { fs.unlinkSync(p) } catch {} })

  const stat = fs.statSync(outputPath)
  const kb = Math.round(stat.size / 1024)
  console.log(`Exported: ${outputPath} (${slideCount} pages, ${kb} KB)`)
}

module.exports = { exportPdf }
