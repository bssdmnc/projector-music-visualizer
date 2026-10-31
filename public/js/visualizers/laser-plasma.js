/**
 * Preset 10: LaserPlasmaVisualizer (Neon Laser Oscilloscope Ribbon)
 * High-voltage multi-harmonic vector laser beam weaving with Lissajous curves.
 */

class LaserPlasmaVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Laser Plasma";
    this.ctx = null;
    this.phase = 0;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Dark background with long phosphor decay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.fillRect(0, 0, w, h);

    this.phase += dt * (1.2 + audio.smoothVol * 2.0);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const numRibbons = 4;
    const pointsPerRibbon = 120;
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    for (let r = 0; r < numRibbons; r++) {
      const ribbonPhase = this.phase + (r * 0.45);
      const color = r % 2 === 0 ? this.palette.primary : this.palette.secondary;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0 + audio.smoothBass * 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.globalAlpha = 0.8;

      ctx.beginPath();
      for (let i = 0; i <= pointsPerRibbon; i++) {
        const t = (i / pointsPerRibbon);
        const bandIdx = Math.floor(t * (bandsCount - 1));
        const freq = bands[bandIdx] || 0;

        // Lissajous 3D harmonic trajectory
        const angle1 = t * Math.PI * 4 + ribbonPhase;
        const angle2 = t * Math.PI * 3 + ribbonPhase * 1.3;

        const radiusX = (w * 0.38) * (0.8 + freq * 0.4);
        const radiusY = (h * 0.32) * (0.8 + audio.smoothBass * 0.5);

        const x = cx + Math.sin(angle1) * radiusX;
        const y = cy + Math.cos(angle2) * radiusY + Math.sin(t * 12 + this.phase * 2) * (20 + freq * 40);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Central high-energy laser spark on beat
    if (audio.isBeat) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + audio.smoothBass * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  destroy() {}
}

if (typeof window !== 'undefined') {
  window.LaserPlasmaVisualizer = LaserPlasmaVisualizer;
}
