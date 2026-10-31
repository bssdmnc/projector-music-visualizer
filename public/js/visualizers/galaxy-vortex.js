/**
 * Preset: GalaxyVortexVisualizer (3D Tilted Spiral Galaxy & Cosmic Gas Nebula)
 * 3D-inclined galactic disk with volumetric nebula gas arms, dense stellar populations,
 * relativistic polar pulsar jets, and supernova gravitational shockwaves.
 */

class GalaxyVortexVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Galaxy Vortex";
    this.ctx = null;
    this.stars = [];
    this.numStars = 550;
    this.arms = 4;
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
    const maxDist = Math.min(this.width, this.height) * 0.46;
    for (let i = 0; i < this.numStars; i++) {
      const arm = i % this.arms;
      const armAngle = (arm * 2 * Math.PI) / this.arms;
      const dist = Math.pow(Math.random(), 0.75) * maxDist + 15;
      const angle = armAngle + (dist * 0.014) + (Math.random() - 0.5) * 0.4;
      const heightZ = (Math.random() - 0.5) * 45.0 * (1.0 - dist / maxDist);

      this.stars.push({
        origDist: dist,
        dist: dist,
        angle: angle,
        z: heightZ,
        speed: (0.35 + Math.random() * 0.5) * (190 / (dist + 35)),
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

    // Deep cosmic space
    ctx.fillStyle = 'rgba(1, 1, 4, 0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    this.rot += dt * (0.3 + audio.smoothMid * 0.5);

    // Supernova trigger on beat
    if (audio.isBeat) {
      this.supernovaRadius = 25;
      this.supernovaAlpha = 1.0;
      for (let s of this.stars) {
        s.blastOffset += (45 + audio.smoothBass * 75) * (Math.random() * 0.5 + 0.8);
      }
    }

    ctx.globalCompositeOperation = 'lighter';

    // 1. Volumetric Gas Nebula Arms
    const maxDist = Math.min(w, h) * 0.44;
    for (let a = 0; a < this.arms; a++) {
      const armAngle = (a * 2 * Math.PI) / this.arms + this.rot;
      for (let step = 30; step < maxDist; step += 60) {
        const spiralA = armAngle + (step * 0.014);
        const gx = Math.cos(spiralA) * step;
        const gy = Math.sin(spiralA) * step * 0.45; // 3D Tilt perspective

        const gasR = 40 + step * 0.15;
        const gasGrad = ctx.createRadialGradient(gx, gy, 2, gx, gy, gasR);
        gasGrad.addColorStop(0, a % 2 === 0 ? this.palette.primary : this.palette.secondary);
        gasGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = gasGrad;
        ctx.globalAlpha = 0.18 + audio.smoothVol * 0.15;
        ctx.beginPath();
        ctx.arc(gx, gy, gasR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Supernova Wave
    if (this.supernovaAlpha > 0.01) {
      this.supernovaRadius += dt * 1050;
      this.supernovaAlpha -= dt * 2.2;

      ctx.save();
      ctx.scale(1.0, 0.45); // Elliptical disk wave
      const snGrad = ctx.createRadialGradient(0, 0, this.supernovaRadius * 0.65, 0, 0, this.supernovaRadius);
      snGrad.addColorStop(0, 'transparent');
      snGrad.addColorStop(0.85, this.palette.primary);
      snGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = snGrad;
      ctx.globalAlpha = this.supernovaAlpha * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, this.supernovaRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Dense 3D Stars with 3D Depth Sorting
    const colors = [this.palette.primary, this.palette.secondary, '#ffffff'];

    for (let s of this.stars) {
      s.angle += s.speed * dt * (1.0 + audio.smoothVol * 1.2);
      s.blastOffset *= Math.max(0, 1.0 - dt * 3.5);
      const currentDist = s.origDist + s.blastOffset;

      const px = Math.cos(s.angle + this.rot) * currentDist;
      // 3D perspective pitch tilt (Y compressed by 0.45)
      const py = Math.sin(s.angle + this.rot) * currentDist * 0.45 + s.z;

      // Depth alpha: stars in front are brighter
      const depthFactor = 0.6 + (Math.sin(s.angle + this.rot) * 0.4);

      ctx.fillStyle = colors[s.colorIndex];
      ctx.globalAlpha = depthFactor * (0.45 + audio.smoothTreble * 0.55);
      ctx.beginPath();
      ctx.arc(px, py, s.size * (0.8 + audio.smoothMid * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Polar Relativistic Pulsar Jets
    const jetH = Math.min(w, h) * 0.42 * (1.0 + audio.smoothBass * 0.4);
    ctx.save();
    ctx.strokeStyle = this.palette.accent;
    ctx.lineWidth = 3.0;
    ctx.shadowColor = this.palette.accent;
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.6 + audio.smoothBass * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -jetH);
    ctx.lineTo(0, jetH);
    ctx.stroke();
    ctx.restore();

    // 5. Supermassive Core Glow (Galactic Bulge)
    const coreR = 45 + audio.smoothBass * 35;
    const coreGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, coreR * 2.2);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, this.palette.primary);
    coreGrad.addColorStop(0.7, this.palette.secondary);
    coreGrad.addColorStop(1, 'transparent');

    ctx.save();
    ctx.scale(1.0, 0.7);
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.85 + audio.smoothBass * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, coreR * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  destroy() {
    this.stars = [];
  }
}

if (typeof window !== 'undefined') {
  window.GalaxyVortexVisualizer = GalaxyVortexVisualizer;
}
