/**
 * Preset: MatrixRainVisualizer (Hypnotic Multi-Layer Matrix Rain)
 * Calibrated majestic rain speed with 3 depth layers, glowing glyph leaders, and audio glitch ripples.
 */

class MatrixRainVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Matrix Rain";
    this.ctx = null;
    this.fontSize = 18;
    this.columns = 0;
    this.drops = [];
    this.chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF$#@*+-%=";
    this.glitchRipples = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.resetColumns();
  }

  resetColumns() {
    this.columns = Math.floor(this.width / this.fontSize);
    this.drops = [];
    for (let i = 0; i < this.columns; i++) {
      this.drops[i] = {
        y: Math.random() * -120,
        // Base speed is now calm and majestic (0.2 to 0.55 instead of 1.4!)
        speed: 0.22 + Math.random() * 0.35,
        depth: Math.random(), // 0 = Far, 1 = Close
        currentChar: this.chars[Math.floor(Math.random() * this.chars.length)],
        lastCharChange: 0
      };
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.resetColumns();
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Smooth phosphor decay
    ctx.fillStyle = 'rgba(1, 4, 2, 0.14)';
    ctx.fillRect(0, 0, w, h);

    // Bass trigger sends a horizontal ripple wave
    if (audio.isBeat) {
      this.glitchRipples.push({
        y: Math.random() * h,
        radius: 0,
        maxRadius: Math.max(w, h) * 0.8,
        alpha: 1.0
      });
    }

    // Update ripples
    for (let i = this.glitchRipples.length - 1; i >= 0; i--) {
      const rip = this.glitchRipples[i];
      rip.radius += dt * 900;
      rip.alpha -= dt * 2.2;
      if (rip.alpha <= 0 || rip.radius > rip.maxRadius) {
        this.glitchRipples.splice(i, 1);
      }
    }

    ctx.save();
    ctx.font = `${this.fontSize}px monospace`;

    const bands = audio.smoothedBands;
    const bandsCount = bands.length;
    // Modest, elegant speed boost from audio
    const speedMultiplier = 1.0 + audio.smoothVol * 0.8;

    for (let i = 0; i < this.columns; i++) {
      const drop = this.drops[i];
      const bandIdx = Math.floor((i / this.columns) * bandsCount);
      const bandVal = bands[bandIdx] || 0;

      // Randomly change glyph periodically
      if (Math.random() > 0.94) {
        drop.currentChar = this.chars[Math.floor(Math.random() * this.chars.length)];
      }

      let x = i * this.fontSize;
      let y = drop.y * this.fontSize;

      // Ripple glitch displacement
      for (let rip of this.glitchRipples) {
        const dist = Math.abs(y - rip.y);
        if (Math.abs(dist - rip.radius) < 50) {
          x += Math.sin(dist * 0.15) * 12 * rip.alpha;
        }
      }

      // 1. Head Glyphs (Bright white with intense neon halo)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = drop.depth > 0.6 ? (bandVal > 0.4 ? 16 : 8) : 2;
      ctx.globalAlpha = 0.95;
      ctx.fillText(drop.currentChar, x, y);

      // 2. Trailing Glyphs
      const trailChar = this.chars[Math.floor(Math.random() * this.chars.length)];
      ctx.fillStyle = drop.depth > 0.5 ? this.palette.primary : this.palette.secondary;
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.5 + drop.depth * 0.35;
      ctx.fillText(trailChar, x, y - this.fontSize);

      // Advance at calibrated graceful speed
      drop.y += drop.speed * speedMultiplier * dt * 22.0;

      // Wrap around
      if (drop.y * this.fontSize > h && Math.random() > 0.975) {
        drop.y = Math.random() * -30;
        drop.speed = 0.22 + Math.random() * 0.35;
        drop.depth = Math.random();
      }
    }

    ctx.restore();
  }

  destroy() {
    this.drops = [];
    this.glitchRipples = [];
  }
}

if (typeof window !== 'undefined') {
  window.MatrixRainVisualizer = MatrixRainVisualizer;
}
