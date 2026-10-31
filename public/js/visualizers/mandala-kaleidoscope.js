/**
 * Preset 8: MandalaKaleidoscopeVisualizer (Psychedelic Sacred Geometry Mandala)
 * Multi-fold rotational symmetry blooming fractal petals reacting to frequency harmonics.
 */

class MandalaKaleidoscopeVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Mandala Kaleidoscope";
    this.ctx = null;
    this.rot = 0;
    this.symmetry = 10;
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

    // Dark fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';

    this.rot += dt * (0.2 + audio.smoothMid * 0.4);

    const bands = audio.smoothedBands;
    const bandsCount = bands.length;
    const maxRadius = Math.min(w, h) * 0.44;

    const layers = 6;
    for (let l = 0; l < layers; l++) {
      const layerRadius = (maxRadius / layers) * (l + 1);
      const layerRot = this.rot * (l % 2 === 0 ? 1 : -1) * (0.6 + l * 0.2);
      const bandIdx = Math.floor((l / layers) * bandsCount);
      const bandVal = bands[bandIdx] || 0;

      const layerColor = l % 3 === 0 
        ? this.palette.primary 
        : (l % 3 === 1 ? this.palette.secondary : this.palette.accent);

      ctx.save();
      ctx.rotate(layerRot);
      ctx.strokeStyle = layerColor;
      ctx.lineWidth = 1.5 + bandVal * 2.5;
      ctx.shadowColor = layerColor;
      ctx.shadowBlur = bandVal > 0.4 ? 12 : 0;
      ctx.globalAlpha = 0.5 + bandVal * 0.5;

      // Draw symmetrical petals
      for (let s = 0; s < this.symmetry; s++) {
        const angle = (s * 2 * Math.PI) / this.symmetry;
        ctx.save();
        ctx.rotate(angle);

        // Petal shape
        const petalLen = layerRadius * (1.0 + bandVal * 0.4 + audio.smoothBass * 0.2);
        const petalWidth = (petalLen / 4) * (0.8 + audio.smoothTreble * 0.5);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          petalWidth, petalLen * 0.4,
          petalWidth * 1.5, petalLen * 0.8,
          0, petalLen
        );
        ctx.bezierCurveTo(
          -petalWidth * 1.5, petalLen * 0.8,
          -petalWidth, petalLen * 0.4,
          0, 0
        );
        ctx.stroke();

        // Inner glowing pearl on petal tip
        if (bandVal > 0.35) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, petalLen, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
    }

    // Central pulsing gem
    const coreR = 25 * (1.0 + audio.smoothBass * 0.6);
    const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, coreR);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, this.palette.primary);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {}
}

if (typeof window !== 'undefined') {
  window.MandalaKaleidoscopeVisualizer = MandalaKaleidoscopeVisualizer;
}
