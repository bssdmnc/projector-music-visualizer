/**
 * Preset: NeonRingVisualizer (Arc Reactor & Continuous Quantum Neon Halo)
 * Continuous, unbroken concentric plasma rings, undulating audio-reactive waveform perimeter,
 * dense radial spectrum blades, orbiting energy photons, and shockwave pulses.
 * Guarantees zero gaps or broken segments in the neon ring.
 */

class NeonRingVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Neon Ring";
    this.ctx = null;
    this.particles = [];
    this.orbiters = [];
    this.rotAngle = 0;
    this.rotInner = 0;
    this.shockwaves = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
    this.initOrbiters();
  }

  initParticles() {
    this.particles = [];
    const count = 260;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 70 + Math.random() * 450,
        speed: 0.25 + Math.random() * 0.85,
        size: 1.0 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        colorIndex: Math.floor(Math.random() * 3)
      });
    }
  }

  initOrbiters() {
    this.orbiters = [];
    // Orbiting energy photons travelling continuously around the ring
    for (let i = 0; i < 8; i++) {
      this.orbiters.push({
        angle: (i * Math.PI * 2) / 8,
        speed: (0.8 + (i % 2) * 0.5) * (i % 2 === 0 ? 1 : -1),
        trail: []
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

    // Smooth motion trail fade for projector deep blacks
    ctx.fillStyle = 'rgba(2, 2, 6, 0.20)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    this.rotAngle += dt * (0.35 + audio.smoothMid * 0.5);
    this.rotInner -= dt * (0.5 + audio.smoothBass * 0.7);

    // Shockwaves on beat
    if (audio.isBeat) {
      this.shockwaves.push({
        r: 60,
        maxR: Math.max(w, h) * 0.65,
        alpha: 1.0,
        speed: 850 + audio.smoothBass * 550
      });
    }

    // Render continuous expanding shockwaves
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
      ctx.globalAlpha = sw.alpha * 0.75;
      ctx.lineWidth = 3.0;
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'lighter';

    // 1. Ambient Stardust Particle Field
    const colors = [this.palette.primary, this.palette.secondary, this.palette.accent];
    for (let p of this.particles) {
      p.angle += (p.speed * 0.01) + (audio.smoothBass * 0.02);
      p.dist += (audio.isBeat ? 10 : 0) - (dt * 10);
      if (p.dist < 60) p.dist = Math.min(w, h) * 0.44;
      if (p.dist > Math.min(w, h) * 0.48) p.dist = 65;

      const px = Math.cos(p.angle) * p.dist;
      const py = Math.sin(p.angle) * p.dist;

      ctx.fillStyle = colors[p.colorIndex];
      ctx.globalAlpha = p.alpha * (0.35 + audio.smoothVol * 0.65);
      ctx.beginPath();
      ctx.arc(px, py, p.size * (1.0 + audio.smoothMid * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const baseRadius = Math.min(w, h) * 0.18;
    const coreRadius = baseRadius * (1.0 + audio.smoothBass * 0.28);
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    // 2. Continuous Radial Equalizer Blades (Rooted in core ring)
    const totalBars = 96;
    const barAngle = (Math.PI * 2) / totalBars;

    for (let i = 0; i < totalBars; i++) {
      const normIdx = i < totalBars / 2 
        ? (i / (totalBars / 2)) 
        : ((totalBars - i) / (totalBars / 2));
      const bandIdx = Math.floor(normIdx * (bandsCount - 1));
      const val = bands[bandIdx] || 0;

      const barLen = Math.pow(val, 1.25) * (Math.min(w, h) * 0.22);
      const angle = i * barAngle + this.rotAngle;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const r1 = coreRadius;
      const r2 = coreRadius + barLen + 4;

      const x1 = cosA * r1;
      const y1 = sinA * r1;
      const x2 = cosA * r2;
      const y2 = sinA * r2;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, this.palette.primary);
      grad.addColorStop(0.6, this.palette.secondary);
      grad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(2.2, (Math.PI * 2 * coreRadius) / totalBars * 0.65);
      ctx.shadowColor = this.palette.secondary;
      ctx.shadowBlur = val > 0.35 ? 12 : 0;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (barLen > 15) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x2, y2, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Continuous Undulating Outer Waveform Ring (Connecting all audio peaks seamlessly)
    const wavePoints = 180;
    const waveAngleStep = (Math.PI * 2) / wavePoints;
    ctx.save();
    ctx.beginPath();
    for (let k = 0; k <= wavePoints; k++) {
      const wa = k * waveAngleStep + this.rotAngle;
      const normW = Math.abs((k % (wavePoints / 2)) - (wavePoints / 4)) / (wavePoints / 4);
      const bIdx = Math.floor(normW * (bandsCount - 1));
      const bVal = bands[bIdx] || 0;

      const waveRadius = coreRadius + Math.pow(bVal, 1.15) * (Math.min(w, h) * 0.22) + 12;
      const wx = Math.cos(wa) * waveRadius;
      const wy = Math.sin(wa) * waveRadius;

      if (k === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.strokeStyle = this.palette.secondary;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.palette.secondary;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    // White core laser line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.95;
    ctx.stroke();
    ctx.restore();

    // 4. Solid Continuous Unbroken Primary Core Ring (Never interrupted)
    ctx.save();
    // Broad outer glow aura
    ctx.strokeStyle = this.palette.primary;
    ctx.lineWidth = 6.0;
    ctx.shadowColor = this.palette.primary;
    ctx.shadowBlur = 24;
    ctx.globalAlpha = 0.55 + audio.smoothBass * 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Intense vibrant mid ring
    ctx.strokeStyle = this.palette.secondary;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.palette.secondary;
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp white hot core line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Unbroken Concentric Outer Halo Ring
    const outerHaloRadius = coreRadius * 1.55 + audio.smoothBass * 20;
    ctx.save();
    ctx.strokeStyle = this.palette.accent;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = this.palette.accent;
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.75 + audio.smoothMid * 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, outerHaloRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 6. Smooth Orbiting Photons along Ring Perimeters
    for (let o of this.orbiters) {
      o.angle += o.speed * dt * (1.2 + audio.smoothBass * 1.5);
      const orbX = Math.cos(o.angle) * coreRadius;
      const orbY = Math.sin(o.angle) * coreRadius;

      // Glow flare
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 4.0 + audio.smoothBass * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Inner Counter-Rotating Plasma Turbine Ring (Unbroken circle with electric spokes)
    ctx.save();
    ctx.rotate(this.rotInner);
    ctx.strokeStyle = this.palette.primary;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = this.palette.primary;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // 6 symmetrical turbine spokes
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

    // 8. Central Singularity Core Glow
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, coreRadius * 0.5);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, this.palette.primary);
    coreGrad.addColorStop(0.8, this.palette.secondary);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.particles = [];
    this.orbiters = [];
    this.shockwaves = [];
  }
}

if (typeof window !== 'undefined') {
  window.NeonRingVisualizer = NeonRingVisualizer;
}
