function renderSlide(slide, index) {
  const id = `slide-${index + 1}`
  const blobColor = slide.blobColor || 'var(--primary)'
  const blobColor2 = slide.blobColor2 || 'var(--accent)'

  const blobs = `
    <div class="blob" style="width:${400 + Math.random()*200}px;height:${400 + Math.random()*200}px;background:${blobColor};top:${-80 - Math.random()*80}px;${Math.random()>0.5?'right':'left'}:${-60 - Math.random()*60}px;opacity:0.07"></div>
    <div class="blob" style="width:${300 + Math.random()*150}px;height:${300 + Math.random()*150}px;background:${blobColor2};bottom:${-60 - Math.random()*60}px;${Math.random()>0.5?'left':'right'}:${-40 - Math.random()*40}px;opacity:0.06"></div>`

  switch (slide.type) {
    case 'hero': return heroSlide(id, slide, blobs)
    case 'cards': return cardsSlide(id, slide, blobs)
    case 'steps': return stepsSlide(id, slide, blobs)
    case 'stats': return statsSlide(id, slide, blobs)
    case 'compare': return compareSlide(id, slide, blobs)
    case 'quote': return quoteSlide(id, slide, blobs)
    case 'code': return codeSlide(id, slide, blobs)
    case 'flow': return flowSlide(id, slide, blobs)
    case 'text': return textSlide(id, slide, blobs)
    case 'image': return imageSlide(id, slide, blobs)
    default: return textSlide(id, slide, blobs)
  }
}

function heroSlide(id, s, blobs) {
  const tags = (s.tags || []).map(t =>
    `<span class="tag">${t}</span>`
  ).join('')
  const badge = s.badge ? `<div class="hero-badge">${s.badge}</div>` : ''

  return `<div class="slide${s._first ? ' active' : ''}" id="${id}">
    ${blobs}
    <div class="slide-content" style="text-align:center">
      ${badge}
      <h1>${gradify(s.title)}</h1>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      ${tags ? `<div class="tags-row" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;opacity:0">${tags}</div>` : ''}
    </div>
  </div>`
}

function cardsSlide(id, s, blobs) {
  const cards = (s.cards || []).map(c => `
    <div class="card">
      ${c.icon ? `<span class="card-icon">${c.icon}</span>` : ''}
      <div class="card-title">${c.title}</div>
      <div class="card-desc">${c.description}</div>
    </div>`).join('')

  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title)}</h2>
      <div class="line"></div>
      <div class="cards">${cards}</div>
    </div>
  </div>`
}

function stepsSlide(id, s, blobs) {
  const steps = (s.steps || []).map((st, i) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <div class="step-text"><strong>${st.title}</strong>${st.description ? ` - ${st.description}` : ''}</div>
    </div>`).join('')

  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title)}</h2>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      <div class="steps">${steps}</div>
    </div>
  </div>`
}

function statsSlide(id, s, blobs) {
  const stats = (s.stats || []).map(st => `
    <div class="stat">
      <div class="stat-number">${st.value}</div>
      <div class="stat-label">${st.label}</div>
    </div>`).join('')

  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content" style="text-align:center">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title)}</h2>
      <div class="stat-grid">${stats}</div>
      ${s.subtitle ? `<div class="line" style="margin-top:40px"></div><div class="sub" style="margin-top:0">${s.subtitle}</div>` : ''}
    </div>
  </div>`
}

function compareSlide(id, s, blobs) {
  const renderCol = (col, type) => {
    const cls = type === 'good' ? 'good' : 'bad'
    const icon = type === 'good' ? '✓' : '✗'
    const iconCls = type === 'good' ? 'check' : 'cross'
    const items = (col.items || []).map(it => `<div class="compare-item">${it}</div>`).join('')
    return `<div class="compare-col ${cls}">
      <div class="compare-head"><span class="${iconCls}">${icon}</span> ${col.title}</div>
      ${items}
    </div>`
  }

  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title)}</h2>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      <div class="compare">
        ${s.left ? renderCol(s.left, s.leftType || 'bad') : ''}
        ${s.right ? renderCol(s.right, s.rightType || 'good') : ''}
      </div>
    </div>
  </div>`
}

function quoteSlide(id, s, blobs) {
  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content" style="text-align:center">
      <blockquote>${gradify(s.quote)}</blockquote>
      <div class="line" style="margin-top:48px"></div>
      ${s.attribution ? `<div class="sub">${s.attribution}</div>` : ''}
    </div>
  </div>`
}

function codeSlide(id, s, blobs) {
  const lines = (s.code || '').split('\n').map(line => {
    let html = line
      .replace(/^(#.*)$/, '<span class="comment">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
    if (/^(const|let|var|function|import|export|return|if|else|for|while|class)\b/.test(line.trim())) {
      html = html.replace(/^(\s*)(const|let|var|function|import|export|return|if|else|for|while|class)/, '$1<span class="keyword">$2</span>')
    }
    return `<div>${html}</div>`
  }).join('')

  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title)}</h2>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      <div class="code-block">${lines}</div>
    </div>
  </div>`
}

function flowSlide(id, s, blobs) {
  const items = (s.flow || []).map(f => `
    <div class="flow-step">
      <div class="flow-icon" style="background:rgba(${f.color || '123,47,190'},0.12);border:1px solid rgba(${f.color || '123,47,190'},0.2)">${f.icon || ''}</div>
      <div class="flow-body">
        <div class="flow-title">${f.title}</div>
        ${f.description ? `<div class="flow-desc">${f.description}</div>` : ''}
        ${f.prompt ? `<div class="flow-prompt">${f.prompt}</div>` : ''}
      </div>
    </div>`).join('')

  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title)}</h2>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      <div class="flow">${items}</div>
    </div>
  </div>`
}

function textSlide(id, s, blobs) {
  return `<div class="slide${s._first ? ' active' : ''}" id="${id}">
    ${blobs}
    <div class="slide-content" style="text-align:center">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title || '')}</h2>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      ${s.body ? `<div style="font-size:16px;color:var(--muted);line-height:1.7;max-width:700px;margin:0 auto;opacity:0" class="body-text">${s.body}</div>` : ''}
    </div>
  </div>`
}

function imageSlide(id, s, blobs) {
  return `<div class="slide" id="${id}">
    ${blobs}
    <div class="slide-content" style="text-align:center">
      ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
      <h2>${gradify(s.title || '')}</h2>
      ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
      ${s.image ? `<div style="margin-top:24px;opacity:0" class="img-wrap"><img src="${s.image}" style="max-width:100%;max-height:50vh;border-radius:16px;border:1px solid var(--border)" /></div>` : ''}
    </div>
  </div>`
}

function gradify(text) {
  return text.replace(/\*([^*]+)\*/g, '<span class="grad">$1</span>')
}

module.exports = { renderSlide }
