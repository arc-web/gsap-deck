const themes = {
  dark: {
    name: 'dark',
    bg: '#07070F',
    surface: '#0F0F1A',
    surface2: '#16162A',
    border: 'rgba(255,255,255,0.07)',
    text: '#F0EEFF',
    muted: '#7A728A',
    primary: '#7B2FBE',
    primaryLight: '#A855F7',
    accent: '#F5A623',
    teal: '#14B8A6',
    blue: '#3B82F6',
    green: '#22C55E',
    pink: '#EC4899',
    particleColors: ['123,47,190', '245,166,35', '20,184,166']
  },
  midnight: {
    name: 'midnight',
    bg: '#020617',
    surface: '#0F172A',
    surface2: '#1E293B',
    border: 'rgba(148,163,184,0.1)',
    text: '#F1F5F9',
    muted: '#64748B',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    accent: '#F59E0B',
    teal: '#06B6D4',
    blue: '#3B82F6',
    green: '#10B981',
    pink: '#F472B6',
    particleColors: ['59,130,246', '245,158,11', '6,182,212']
  },
  ember: {
    name: 'ember',
    bg: '#0C0404',
    surface: '#1A0A0A',
    surface2: '#2A1010',
    border: 'rgba(255,100,50,0.08)',
    text: '#FFF0E8',
    muted: '#9A7A6A',
    primary: '#EF4444',
    primaryLight: '#F87171',
    accent: '#F59E0B',
    teal: '#FB923C',
    blue: '#F97316',
    green: '#F59E0B',
    pink: '#EF4444',
    particleColors: ['239,68,68', '249,115,22', '245,158,11']
  },
  forest: {
    name: 'forest',
    bg: '#030A06',
    surface: '#0A1A10',
    surface2: '#102A18',
    border: 'rgba(34,197,94,0.08)',
    text: '#E8FFF0',
    muted: '#6A9A7A',
    primary: '#22C55E',
    primaryLight: '#4ADE80',
    accent: '#A3E635',
    teal: '#14B8A6',
    blue: '#34D399',
    green: '#22C55E',
    pink: '#A3E635',
    particleColors: ['34,197,94', '163,230,53', '20,184,166']
  },
  ocean: {
    name: 'ocean',
    bg: '#020B18',
    surface: '#071528',
    surface2: '#0D2040',
    border: 'rgba(56,189,248,0.08)',
    text: '#E0F2FE',
    muted: '#5A8AAA',
    primary: '#0EA5E9',
    primaryLight: '#38BDF8',
    accent: '#A78BFA',
    teal: '#06B6D4',
    blue: '#0EA5E9',
    green: '#22D3EE',
    pink: '#A78BFA',
    particleColors: ['14,165,233', '56,189,248', '167,139,250']
  }
}

function getTheme(name) {
  return themes[name] || themes.dark
}

function listThemes() {
  return Object.keys(themes)
}

module.exports = { getTheme, listThemes }
