/**
 * Preset: NeonRingVisualizer (Arc Reactor & Quantum Cyber Core)
 * Multi-tiered concentric plasma rings, segmented rotating calipers,
 * radial equalizer needles, electric lightning arcs, and shockwave pulses.
 */

class NeonRingVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Neon Ring";
    this.ctx = null;
    this.particles = [];
    this.rotAngle = 0;
    this.rotInner = 0;
    this.shockwaves = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const count = 300;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 90 + Math.random() * 420,
        speed: 0.3 + Math.random() * 0.9,
        size: 1.0 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.7,
        colorIndex: Math.floor(Math.random() * 3)
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.initParticles();
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // Smooth motion trail fade
    ctx.fillStyle = 'rgba(2, 2, 6, 0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    this.rotAngle += dt * (0.35 + audio.smoothMid * 0.5);
    this.rotInner -= dt * (0.6 + audio.smoothBass * 0.8);

    // Shockwaves on beat
    if (audio.isBeat) {
      this.shockwaves.push({
        r: 60,
        maxR: Math.max(w, h) * 0.65,
        alpha: 1.0,
        speed: 900 + audio.smoothBass * 500
      });
    }

    // Render shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.r += sw.speed * dt;
      sw.alpha -= dt * 2.0;
      if (sw.alpha <= 0 || sw.r >= sw.maxR) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = this.palette.primary;
      ctx.globalAlpha = sw.alpha * 0.7;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'lighter';

    // 1. Swirling Stardust Particle Vortex
    const colors = [this.palette.primary, this.palette.secondary, this.palette.accent];
    for (let p of this.particles) {
      p.angle += (p.speed * 0.012) + (audio.smoothBass * 0.025);
      p.dist += (audio.isBeat ? 12 : 0) - (dt * 12);
      if (p.dist < 70) p.dist = Math.min(w, h) * 0.42;
      if (p.dist > Math.min(w, h) * 0.46) p.dist = 75;

      const px = Math.cos(p.angle) * p.dist;
      const py = Math.sin(p.angle) * p.dist;

      ctx.fillStyle = colors[p.colorIndex];
      ctx.globalAlpha = p.alpha * (0.4 + audio.smoothVol * 0.6);
      ctx.beginPath();
      ctx.arc(px, py, p.size * (1.0 + audio.smoothMid * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const baseRadius = Math.min(w, h) * 0.17;
    const coreRadius = baseRadius * (1.0 + audio.smoothBass * 0.3);

    // 2. Outer Segmented Laser Calipers (Industrial Arc Reactor look)
    const caliperRadius = coreRadius * 1.65;
    const numSegments = 16;
    ctx.save();
    ctx.rotate(this.rotAngle * 0.5);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = this.palette.accent;
    ctx.shadowColor = this.palette.accent;
    ctx.shadowBlur = 14;

    for (let s = 0; s < numSegments; s++) {
      const aStart = (s * 2 * Math.PI) / numSegments;
      const aEnd = aStart + (Math.PI / numSegments) * 0.75;
      ctx.beginPath();
      ctx.arc(0, 0, caliperRadius, aStart, aEnd);
      ctx.stroke();
    }
    ctx.restore();

    // 3. High-Definition Radial Equalizer Blades
    const totalBars = 96;
    const barAngle = (Math.PI * 2) / totalBars;
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    for (let i = 0; i < totalBars; i++) {
      const normIdx = i < totalBars / 2 
        ? (i / (totalBars / 2)) 
        : ((totalBars - i) / (totalBars / 2));
      const bandIdx = Math.floor(normIdx * (bandsCount - 1));
      const val = bands[bandIdx] || 0;

      const barLen = Math.pow(val, 1.2) * (Math.min(w, h) * 0.26);
      const angle = i * barAngle + this.rotAngle;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const r1 = coreRadius + 4;
      const r2 = coreRadius + barLen + 8;

      const x1 = cosA * r1;
      const y1 = sinA * r1;
      const x2 = cosA * r2;
      const y2 = sinA * r2;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, this.palette.primary);
      grad.addColorStop(0.6, this.palette.secondary);
      grad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(2.0, (Math.PI * 2 * coreRadius) / totalBars * 0.6);
      ctx.shadowColor = this.palette.secondary;
      ctx.shadowBlur = val > 0.4 ? 12 : 0;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Sharp glowing tip point
      if (barLen > 18) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x2, y2, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Inner Counter-Rotating Plasma Turbine
    ctx.save();
    ctx.rotate(this.rotInner);
    ctx.strokeStyle = this.palette.primary;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.palette.primary;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // 6 turbine spokes with electric arcs
    for (let k = 0; k < 6; k++) {
      const spokeA = (k * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const sx = Math.cos(spokeA) * coreRadius * 0.65;
      const sy = Math.sin(spokeA) * coreRadius * 0.65;
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Central Singularity Core Glow
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, coreRadius * 0.5);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, this.palette.primary);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.particles = [];
    this.shockwaves = [];
  }
}

if (typeof window !== 'undefined') {
  window.NeonRingVisualizer = NeonRingVisualizer;
}
