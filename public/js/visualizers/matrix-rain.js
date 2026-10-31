/**
 * Preset 6: MatrixRainVisualizer (Digital Matrix Rain & Audio Glitch Shockwaves)
 * Falling code streams that accelerate with audio tempo, with bass glitch ripples.
 */

class MatrixRainVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Matrix Rain";
    this.ctx = null;
    this.fontSize = 18;
    this.columns = 0;
    this.drops = [];
    this.speeds = [];
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
    this.speeds = [];
    for (let i = 0; i < this.columns; i++) {
      this.drops[i] = Math.random() * -100;
      this.speeds[i] = 0.6 + Math.random() * 1.4;
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

    // Dark fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, w, h);

    // Bass trigger creates a shockwave ripple
    if (audio.isBeat) {
      this.glitchRipples.push({
        y: Math.random() * h,
        radius: 0,
        maxRadius: Math.max(w, h),
        intensity: 1.0 + audio.smoothBass * 1.5,
        alpha: 1.0
      });
    }

    // Update ripples
    for (let i = this.glitchRipples.length - 1; i >= 0; i--) {
      const rip = this.glitchRipples[i];
      rip.radius += dt * 1200;
      rip.alpha -= dt * 2.2;
      if (rip.alpha <= 0 || rip.radius > rip.maxRadius) {
        this.glitchRipples.splice(i, 1);
      }
    }

    ctx.save();
    ctx.font = `${this.fontSize}px monospace`;

    const bands = audio.smoothedBands;
    const bandsCount = bands.length;
    const speedMultiplier = 1.0 + audio.smoothVol * 2.5 + audio.smoothBass * 1.8;

    for (let i = 0; i < this.columns; i++) {
      // Pick random glyph
      const char = this.chars[Math.floor(Math.random() * this.chars.length)];
      
      // Calculate column audio influence
      const bandIdx = Math.floor((i / this.columns) * bandsCount);
      const bandVal = bands[bandIdx] || 0;

      // X coordinate with optional glitch offset
      let x = i * this.fontSize;
      let y = this.drops[i] * this.fontSize;

      // Apply ripple displacement on beat
      for (let rip of this.glitchRipples) {
        const dist = Math.abs(y - rip.y);
        if (Math.abs(dist - rip.radius) < 60) {
          x += (Math.sin(dist * 0.1) * 15 * rip.alpha);
        }
      }

      // Head character (Glowing White / Accent)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = bandVal > 0.4 ? 14 : 4;
      ctx.fillText(char, x, y);

      // Trailing character
      const trailChar = this.chars[Math.floor(Math.random() * this.chars.length)];
      ctx.fillStyle = bandVal > 0.5 ? this.palette.secondary : this.palette.primary;
      ctx.shadowBlur = 0;
      ctx.fillText(trailChar, x, y - this.fontSize);

      // Advance drop
      this.drops[i] += this.speeds[i] * speedMultiplier * (1.0 + bandVal * 0.8) * dt * 28.0;

      // Reset drop when off screen
      if (this.drops[i] * this.fontSize > h && Math.random() > 0.96) {
        this.drops[i] = 0;
        this.speeds[i] = 0.6 + Math.random() * 1.4;
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
