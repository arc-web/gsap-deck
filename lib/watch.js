// lib/watch.js
// Watch a data JSON or full deck JSON, rebuild on change, serve with live-reload.
// No external deps: uses node:fs.watch, node:http, node:net.
//
// Usage (from bin/gsap-deck.js):
//   const { watchDeck } = require('../lib/watch')
//   watchDeck(inputPath, { port: 7555 })

const fs = require('fs')
const path = require('path')
const http = require('http')
const net = require('net')

const DEFAULT_PORT = 7555

// Sniff whether this is a standard-template data file (has `name` field but no `slides`)
// or a full deck config (has `slides`).
function isDataFile(parsed) {
  return !Array.isArray(parsed.slides) && parsed.name !== undefined
}

function build(inputPath) {
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  if (isDataFile(raw)) {
    const { buildStandardDeck, validateData } = require('./standard-template')
    const { buildDeck } = require('./build')
    const result = validateData(raw)
    if (!result.ok) {
      const errs = result.errors.map(e => `  ${e.field}: ${e.message}`).join('\n')
      throw new Error(`Validation errors:\n${errs}`)
    }
    return buildDeck(buildStandardDeck(raw))
  } else {
    const { buildDeck } = require('./build')
    return buildDeck(raw)
  }
}

// Inject live-reload script into the HTML just before </body>
function injectLiveReload(html, port) {
  const script = `
<script>
(function() {
  var ws;
  function connect() {
    ws = new WebSocket('ws://localhost:${port}/__lr');
    ws.onmessage = function(e) { if (e.data === 'reload') location.reload(); };
    ws.onclose = function() { setTimeout(connect, 1000); };
    ws.onerror = function() { ws.close(); };
  }
  connect();
})();
</script>`
  return html.includes('</body>') ? html.replace('</body>', script + '\n</body>') : html + script
}

// Minimal WebSocket handshake + broadcast helper
function makeWsServer(server) {
  const clients = new Set()

  server.on('upgrade', (req, socket) => {
    if (req.url !== '/__lr') { socket.destroy(); return }
    const key = req.headers['sec-websocket-key']
    const accept = require('crypto')
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64')
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    )
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))
    socket.on('error', () => clients.delete(socket))
  })

  function broadcast(msg) {
    const buf = Buffer.from(msg)
    // WebSocket text frame: 0x81, length, data
    const frame = Buffer.alloc(2 + buf.length)
    frame[0] = 0x81
    frame[1] = buf.length
    buf.copy(frame, 2)
    for (const s of clients) {
      try { s.write(frame) } catch {}
    }
  }

  return { broadcast }
}

function watchDeck(inputPath, opts = {}) {
  const port = opts.port || DEFAULT_PORT
  let currentHtml = ''
  let lastErr = null

  function rebuild() {
    try {
      currentHtml = injectLiveReload(build(inputPath), port)
      lastErr = null
      console.log(`[watch] Rebuilt OK  ${new Date().toLocaleTimeString()}`)
      return true
    } catch (err) {
      lastErr = err
      console.error(`[watch] Build error: ${err.message}`)
      return false
    }
  }

  // Initial build
  rebuild()

  const server = http.createServer((req, res) => {
    if (lastErr) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<pre style="color:red;font-family:monospace;padding:2em">${lastErr.message}</pre>`)
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(currentHtml)
  })

  const { broadcast } = makeWsServer(server)

  server.listen(port, () => {
    const label = path.basename(inputPath)
    console.log(`Watching ${label} ...`)
    console.log(`http://localhost:${port}  (Ctrl-C to stop)`)
  })

  // Debounce: wait 80ms after last event before rebuilding
  let timer = null
  const debounced = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (rebuild()) broadcast('reload')
    }, 80)
  }

  // Watch the input file. Fall back to polling on FSEvents-less filesystems.
  try {
    fs.watch(inputPath, debounced)
  } catch {
    setInterval(() => {
      try {
        const mtime = fs.statSync(inputPath).mtimeMs
        if (mtime !== watchDeck._lastMtime) {
          watchDeck._lastMtime = mtime
          debounced()
        }
      } catch {}
    }, 500)
  }
}

module.exports = { watchDeck }
