/**
 * Preset: FirestormVisualizer (Fluid Inferno & Volcanic Flame Vortex)
 * Multi-layered undulating flame tongues, glowing magma core, heat distortion waves,
 * and ballistic volcanic spark embers trailing smoke.
 */

class FirestormVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Firestorm";
    this.ctx = null;
    this.sparks = [];
    this.flamePoints = 48;
    this.phase = 0;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initSparks();
  }

  initSparks() {
    this.sparks = [];
  }

  createSpark(cx, cy, isBurst = false) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (isBurst ? 1.4 : 0.7);
    const speed = (isBurst ? 14 : 6) + Math.random() * (isBurst ? 18 : 8);
    return {
      x: cx + (Math.random() - 0.5) * 80,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: (isBurst ? 3.5 : 2.0) + Math.random() * 2.5,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.02,
      gravity: 0.18
    };
  }

  resize(width, height) {
    super.resize(width, height);
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const baselineY = h * 0.94;

    // Dark smoke fade
    ctx.fillStyle = 'rgba(4, 1, 1, 0.24)';
    ctx.fillRect(0, 0, w, h);

    this.phase += dt * (2.0 + audio.smoothVol * 2.5);

    // Erupt volcanic sparks on beat kicks
    if (audio.isBeat) {
      for (let i = 0; i < 35; i++) {
        this.sparks.push(this.createSpark(cx, baselineY - 40, true));
      }
    }

    // Continuous rising sparks
    if (Math.random() > 0.4) {
      this.sparks.push(this.createSpark(cx, baselineY - 30, false));
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    // 1. Multi-Layer Undulating Fluid Flame Tongues
    const layers = 4;
    for (let l = 0; l < layers; l++) {
      const layerOffset = l * 0.8;
      const layerHeight = (h * 0.42 + l * 40) * (0.8 + audio.smoothBass * 0.7);

      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let i = 0; i <= this.flamePoints; i++) {
        const x = (i / this.flamePoints) * w;
        const normDistFromCenter = Math.abs(x - cx) / (w * 0.45);
        
        // Bell curve envelope: tallest in center
        const bell = Math.max(0.0, 1.0 - normDistFromCenter * normDistFromCenter);

        const bandIdx = Math.floor(normDistFromCenter * (bandsCount - 1));
        const freq = bands[bandIdx] || 0;

        // Turbulent wave harmonics
        const wave1 = Math.sin(i * 0.4 + this.phase * 3.0 + layerOffset) * 45;
        const wave2 = Math.cos(i * 0.8 - this.phase * 2.0) * 25;
        const wave3 = Math.sin(i * 1.6 + this.phase * 4.0) * 15;

        const flameY = baselineY - (layerHeight * bell + wave1 + wave2 + wave3 + freq * 80);
        ctx.lineTo(x, flameY);
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      // Flame gradient (White hot core -> Gold -> Red -> Dark Smoke)
      const grad = ctx.createLinearGradient(cx, baselineY, cx, baselineY - layerHeight);
      if (l === 0) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(0.8, '#ff3300');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, this.palette.primary);
        grad.addColorStop(0.6, this.palette.secondary);
        grad.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.45 + (l === 0 ? 0.35 : 0.0);
      ctx.fill();
    }

    // 2. Ballistic Volcanic Embers & Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt * 50.0;
      s.y += s.vy * dt * 50.0;
      s.vy += s.gravity * dt * 50.0;
      s.life -= s.decay * (dt * 60.0);

      if (s.life <= 0 || s.y > h + 10) {
        this.sparks.splice(i, 1);
        continue;
      }

      const sparkCol = s.life > 0.6 ? '#ffffff' : (s.life > 0.3 ? '#ffcc00' : '#ff2200');
      ctx.fillStyle = sparkCol;
      ctx.shadowColor = sparkCol;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = s.life;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Molten Magma Floor Glow
    const magmaGlow = ctx.createRadialGradient(cx, baselineY, 15, cx, baselineY, w * 0.4);
    magmaGlow.addColorStop(0, '#ffffff');
    magmaGlow.addColorStop(0.3, '#ffaa00');
    magmaGlow.addColorStop(0.7, '#ff0000');
    magmaGlow.addColorStop(1, 'transparent');

    ctx.fillStyle = magmaGlow;
    ctx.globalAlpha = 0.5 + audio.smoothBass * 0.5;
    ctx.beginPath();
    ctx.arc(cx, baselineY, w * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.sparks = [];
  }
}

if (typeof window !== 'undefined') {
  window.FirestormVisualizer = FirestormVisualizer;
}
