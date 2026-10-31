/**
 * Color Palettes for Projector Music Visualizer
 * High-contrast, vivid palettes designed for projected light on dark backgrounds.
 */

const PALETTES = {
  cyberpunk: {
    name: "Cyberpunk Neon",
    primary: "#00f3ff",    // Cyan
    secondary: "#ff007f",  // Hot Magenta
    accent: "#7928ca",     // Electric Violet
    glow: "rgba(0, 243, 255, 0.6)",
    gradient: ["#00f3ff", "#7928ca", "#ff007f", "#ffe600"],
    background: "#040209",
    strobeColor: "rgba(0, 243, 255, 0.35)"
  },
  sunset: {
    name: "Sunset Outrun",
    primary: "#ff3b00",    // Intense Tangerine
    secondary: "#ff0078",  // Neon Pink
    accent: "#7209b7",     // Deep Indigo
    glow: "rgba(255, 59, 0, 0.6)",
    gradient: ["#ff0078", "#ff5400", "#ffbd00", "#7209b7"],
    background: "#08020a",
    strobeColor: "rgba(255, 90, 0, 0.35)"
  },
  matrix: {
    name: "Emerald Matrix",
    primary: "#00ff88",    // Toxic Green
    secondary: "#39ff14",  // Neon Lime
    accent: "#00b4d8",     // Dark Cyan
    glow: "rgba(0, 255, 136, 0.6)",
    gradient: ["#00ff88", "#39ff14", "#00b4d8", "#9ef01a"],
    background: "#010803",
    strobeColor: "rgba(0, 255, 136, 0.35)"
  },
  acid: {
    name: "Acid Psychedelic",
    primary: "#ff0055",
    secondary: "#00ffee",
    accent: "#ffee00",
    glow: "rgba(255, 0, 85, 0.6)",
    gradient: ["#ff0055", "#ffee00", "#00ffee", "#b000ff"],
    background: "#06010a",
    strobeColor: "rgba(255, 238, 0, 0.35)"
  },
  ice: {
    name: "Glacial Aurora",
    primary: "#00d4ff",
    secondary: "#a0e7e5",
    accent: "#7000ff",
    glow: "rgba(0, 212, 255, 0.6)",
    gradient: ["#00d4ff", "#a0e7e5", "#b8c0ff", "#7000ff"],
    background: "#010408",
    strobeColor: "rgba(160, 231, 229, 0.35)"
  },
  fire: {
    name: "Inferno Blaze",
    primary: "#ff8c00",
    secondary: "#ff1e00",
    accent: "#ffd000",
    glow: "rgba(255, 140, 0, 0.6)",
    gradient: ["#ffd000", "#ff8c00", "#ff1e00", "#9e0000"],
    background: "#0a0201",
    strobeColor: "rgba(255, 140, 0, 0.35)"
  }
};

const PALETTE_KEYS = Object.keys(PALETTES);

function getPalette(name) {
  return PALETTES[name] || PALETTES.cyberpunk;
}

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Export for ES modules and standard script loading
if (typeof window !== 'undefined') {
  window.PALETTES = PALETTES;
  window.PALETTE_KEYS = PALETTE_KEYS;
  window.getPalette = getPalette;
  window.hexToRgb = hexToRgb;
}
