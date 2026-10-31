/**
 * Preset 7: GalaxyVortexVisualizer (Spiral Galaxy & Supernova Explosion)
 * Thousands of stars in rotating spiral arms with explosive supernova blasts on beat.
 */

class GalaxyVortexVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Galaxy Vortex";
    this.ctx = null;
    this.stars = [];
    this.numStars = 450;
    this.arms = 3;
    this.rot = 0;
    this.supernovaRadius = 0;
    this.supernovaAlpha = 0;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initStars();
  }

  initStars() {
    this.stars = [];
    const maxDist = Math.min(this.width, this.height) * 0.45;
    for (let i = 0; i < this.numStars; i++) {
      const arm = i % this.arms;
      const armAngle = (arm * 2 * Math.PI) / this.arms;
      const dist = Math.pow(Math.random(), 0.8) * maxDist + 20;
      const angle = armAngle + (dist * 0.012) + (Math.random() - 0.5) * 0.45;

      this.stars.push({
        origDist: dist,
        dist: dist,
        angle: angle,
        speed: (0.4 + Math.random() * 0.6) * (180 / (dist + 30)),
        size: 1.0 + Math.random() * 2.2,
        colorIndex: Math.floor(Math.random() * 3),
        blastOffset: 0
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.initStars();
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Dark deep void
    ctx.fillStyle = 'rgba(2, 1, 6, 0.2)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    // Rotation speed driven by audio volume
    this.rot += dt * (0.35 + audio.smoothMid * 0.8);

    // Supernova trigger on beat
    if (audio.isBeat) {
      this.supernovaRadius = 20;
      this.supernovaAlpha = 1.0;
      for (let s of this.stars) {
        s.blastOffset += (40 + audio.smoothBass * 80) * (Math.random() * 0.5 + 0.8);
      }
    }

    // Blend mode for luminous stellar glow
    ctx.globalCompositeOperation = 'lighter';

    // 1. Render Supernova Wave
    if (this.supernovaAlpha > 0.01) {
      this.supernovaRadius += dt * 1100;
      this.supernovaAlpha -= dt * 2.5;

      const snGrad = ctx.createRadialGradient(0, 0, this.supernovaRadius * 0.7, 0, 0, this.supernovaRadius);
      snGrad.addColorStop(0, 'transparent');
      snGrad.addColorStop(0.8, this.palette.primary);
      snGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = snGrad;
      ctx.globalAlpha = this.supernovaAlpha * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, this.supernovaRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Stars
    const colors = [this.palette.primary, this.palette.secondary, this.palette.accent];
    for (let s of this.stars) {
      s.angle += s.speed * dt * (1.0 + audio.smoothVol * 1.5);
      
      // Pull blasted stars back to their natural orbit
      s.blastOffset *= Math.max(0, 1.0 - dt * 4.0);
      const currentDist = s.origDist + s.blastOffset;

      const px = Math.cos(s.angle + this.rot) * currentDist;
      const py = Math.sin(s.angle + this.rot) * currentDist;

      ctx.fillStyle = colors[s.colorIndex];
      ctx.globalAlpha = Math.min(1.0, (currentDist / 80) * (0.5 + audio.smoothVol * 0.5));
      ctx.beginPath();
      ctx.arc(px, py, s.size * (1.0 + audio.smoothTreble * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Supermassive Core Glow (Black hole / Quasar)
    const coreRadius = 40 + audio.smoothBass * 45;
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, coreRadius * 2.2);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, this.palette.primary);
    coreGrad.addColorStop(0.7, this.palette.secondary);
    coreGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.8 + audio.smoothBass * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.stars = [];
  }
}

if (typeof window !== 'undefined') {
  window.GalaxyVortexVisualizer = GalaxyVortexVisualizer;
}
