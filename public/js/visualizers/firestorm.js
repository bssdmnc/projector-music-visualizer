/**
 * Preset 11: FirestormVisualizer (Audio Flame Tornado & Ember Sparks)
 * Rising column of swirling fire embers and volcanic bursts responding to drum kicks.
 */

class FirestormVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Firestorm";
    this.ctx = null;
    this.particles = [];
    this.numParticles = 280;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(burst = false) {
    const w = this.width;
    const h = this.height;
    return {
      x: w / 2 + (Math.random() - 0.5) * (w * 0.25),
      y: burst ? h * 0.85 : h + Math.random() * 50,
      vx: (Math.random() - 0.5) * (burst ? 8 : 2),
      vy: -(2 + Math.random() * (burst ? 12 : 5)),
      size: 2.0 + Math.random() * (burst ? 6 : 4),
      life: 1.0,
      decay: 0.008 + Math.random() * 0.018,
      colorType: Math.random()
    };
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
    const baselineY = h * 0.92;

    // Dark smoke fade
    ctx.fillStyle = 'rgba(6, 2, 2, 0.24)';
    ctx.fillRect(0, 0, w, h);

    // Erupt on beat
    if (audio.isBeat) {
      for (let i = 0; i < 40; i++) {
        this.particles.push(this.createParticle(true));
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Base Fire Glow
    const baseGlow = ctx.createRadialGradient(cx, baselineY, 10, cx, baselineY, w * 0.45);
    baseGlow.addColorStop(0, this.palette.primary);
    baseGlow.addColorStop(0.5, this.palette.secondary);
    baseGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = baseGlow;
    ctx.globalAlpha = 0.35 + audio.smoothBass * 0.45;
    ctx.beginPath();
    ctx.arc(cx, baselineY, w * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rising Fire Tornado Particles
    const speedBoost = 1.0 + audio.smoothVol * 2.2 + audio.smoothBass * 2.5;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += (p.vx + Math.sin(p.y * 0.02 + Date.now() * 0.003) * 2.5) * speedBoost * dt * 50.0;
      p.y += p.vy * speedBoost * dt * 50.0;
      p.life -= p.decay * (dt * 60.0);

      if (p.life <= 0 || p.y < -20) {
        if (this.particles.length > this.numParticles) {
          this.particles.splice(i, 1);
          continue;
        } else {
          this.particles[i] = this.createParticle(false);
          continue;
        }
      }

      const color = p.colorType < 0.4 
        ? '#ffffff' 
        : (p.colorType < 0.75 ? this.palette.primary : this.palette.secondary);

      ctx.fillStyle = color;
      ctx.globalAlpha = p.life * (0.5 + audio.smoothMid * 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life * (1.0 + audio.smoothBass * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  destroy() {
    this.particles = [];
  }
}

if (typeof window !== 'undefined') {
  window.FirestormVisualizer = FirestormVisualizer;
}
