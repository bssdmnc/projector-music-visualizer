/**
 * Preset 2: NeonRingVisualizer (Circular Audio Reactor & Particle Vortex)
 * Radial spectrum bars, pulsing energy core, and exploding particle stardust.
 */

class NeonRingVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Neon Ring";
    this.ctx = null;
    this.particles = [];
    this.rotAngle = 0;
    this.shockwaves = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const count = 250;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * this.width,
        y: (Math.random() - 0.5) * this.height,
        angle: Math.random() * Math.PI * 2,
        dist: 120 + Math.random() * 400,
        speed: 0.2 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 2.5,
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

    // Dark background with slight motion trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    this.rotAngle += dt * (0.3 + audio.smoothVol * 0.6);

    // Trigger shockwave on beat
    if (audio.isBeat) {
      this.shockwaves.push({
        r: 100 + audio.smoothBass * 50,
        maxR: Math.max(w, h) * 0.7,
        alpha: 0.9,
        speed: 800 + audio.smoothBass * 400
      });
    }

    // Render shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.r += sw.speed * dt;
      sw.alpha -= dt * 1.8;
      if (sw.alpha <= 0 || sw.r >= sw.maxR) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(0, 0, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha * 0.4})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Blend mode for neon glow
    ctx.globalCompositeOperation = 'lighter';

    // 1. Particle Vortex
    const colors = [this.palette.primary, this.palette.secondary, this.palette.accent];
    for (let p of this.particles) {
      p.angle += (p.speed * 0.015) + (audio.smoothBass * 0.04);
      p.dist += (audio.isBeat ? 15 : 0) - (dt * 15);
      if (p.dist < 80) p.dist = Math.min(w, h) * 0.45;
      if (p.dist > Math.min(w, h) * 0.55) p.dist = 90;

      const px = Math.cos(p.angle + this.rotAngle * 0.5) * p.dist;
      const py = Math.sin(p.angle + this.rotAngle * 0.5) * p.dist;

      ctx.fillStyle = colors[p.colorIndex];
      ctx.globalAlpha = p.alpha * (0.4 + audio.smoothVol * 0.6);
      ctx.beginPath();
      ctx.arc(px, py, p.size * (1.0 + audio.smoothMid), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 2. Pulsing Central Core
    const baseRadius = Math.min(w, h) * 0.16;
    const coreRadius = baseRadius * (1.0 + audio.smoothBass * 0.35);

    // Inner radial glow
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, coreRadius * 1.5);
    grad.addColorStop(0, this.palette.primary);
    grad.addColorStop(0.5, this.palette.secondary);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Core circle outline
    ctx.strokeStyle = this.palette.primary;
    ctx.lineWidth = 3 + audio.smoothBass * 4;
    ctx.shadowColor = this.palette.primary;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Radial Frequency Bars
    const totalBars = 96; // Symmetrical dual half-circle
    const barAngle = (Math.PI * 2) / totalBars;
    const bandsCount = audio.smoothedBands.length;

    for (let i = 0; i < totalBars; i++) {
      // Map half circle symmetry (0..48..0)
      const bandIndex = i < totalBars / 2 
        ? Math.floor((i / (totalBars / 2)) * bandsCount)
        : Math.floor(((totalBars - i) / (totalBars / 2)) * bandsCount);
        
      const bandVal = audio.smoothedBands[Math.min(bandIndex, bandsCount - 1)] || 0;
      const barLen = Math.pow(bandVal, 1.2) * (Math.min(w, h) * 0.28);
      
      const angle = i * barAngle + this.rotAngle;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x1 = cosA * coreRadius;
      const y1 = sinA * coreRadius;
      const x2 = cosA * (coreRadius + barLen + 4);
      const y2 = sinA * (coreRadius + barLen + 4);

      // Gradient color for each bar
      const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      barGrad.addColorStop(0, this.palette.primary);
      barGrad.addColorStop(0.6, this.palette.secondary);
      barGrad.addColorStop(1, this.palette.accent);

      ctx.strokeStyle = barGrad;
      ctx.lineWidth = Math.max(2, (Math.PI * 2 * coreRadius) / totalBars * 0.65);
      ctx.shadowColor = this.palette.secondary;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Peak dot at top of bar
      if (barLen > 15) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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
