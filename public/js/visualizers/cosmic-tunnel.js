/**
 * Preset 4: CosmicTunnelVisualizer (Hyperspace Warp & Wormhole Tunnel)
 * Flying at lightspeed through audio-reactive geometric rings with star streaks.
 */

class CosmicTunnelVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Cosmic Tunnel";
    this.ctx = null;
    this.rings = [];
    this.numRings = 24;
    this.stars = [];
    this.numStars = 200;
    this.rotZ = 0;
    this.speed = 1.0;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initRings();
    this.initStars();
  }

  initRings() {
    this.rings = [];
    for (let i = 0; i < this.numRings; i++) {
      this.rings.push({
        z: (i / this.numRings) * 1000,
        sides: 8, // Octagon
        rot: (i * 0.15)
      });
    }
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 1000,
        prevZ: 0
      });
      this.stars[i].prevZ = this.stars[i].z;
    }
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
    const cy = h / 2;

    // Dark deep void
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(0, 0, w, h);

    // Calculate dynamic speed from audio
    const targetSpeed = 300 + (audio.smoothVol * 800) + (audio.isBeat ? 1600 : 0);
    this.speed += (targetSpeed - this.speed) * Math.min(1.0, dt * 6.0);
    this.rotZ += dt * (0.4 + audio.smoothMid * 1.2);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';

    // 1. Hyperspace Star Streaks
    ctx.strokeStyle = '#ffffff';
    for (let star of this.stars) {
      star.prevZ = star.z;
      star.z -= this.speed * dt;
      if (star.z <= 10) {
        star.z = 1000;
        star.prevZ = 1000;
        star.x = (Math.random() - 0.5) * 2000;
        star.y = (Math.random() - 0.5) * 2000;
      }

      const fov = 350;
      const sx = (star.x / star.z) * fov;
      const sy = (star.y / star.z) * fov;
      const px = (star.x / star.prevZ) * fov;
      const py = (star.y / star.prevZ) * fov;

      const alpha = Math.min(1.0, (1000 - star.z) / 400);
      ctx.globalAlpha = alpha * (0.4 + audio.smoothTreble * 0.6);
      ctx.lineWidth = Math.min(3, (1000 - star.z) / 300);

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 2. Audio-Reactive Geometric Rings
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ring.z -= this.speed * dt;
      if (ring.z <= 15) {
        ring.z += 1000;
      }

      const fov = 400;
      const scale = fov / Math.max(ring.z, 1);
      const ringAlpha = Math.min(1.0, Math.pow((1000 - ring.z) / 700, 1.5));

      const sides = ring.sides;
      const baseRadius = 250 * scale;
      const ringRot = this.rotZ + ring.rot;

      ctx.save();
      ctx.rotate(ringRot);

      // Color based on depth
      const colorIndex = i % 3;
      const color = colorIndex === 0 ? this.palette.primary : (colorIndex === 1 ? this.palette.secondary : this.palette.accent);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, scale * 3.5);
      ctx.globalAlpha = ringAlpha * 0.85;
      ctx.shadowColor = color;
      ctx.shadowBlur = scale > 0.8 ? 15 : 0;

      ctx.beginPath();
      for (let s = 0; s <= sides; s++) {
        const theta = (s / sides) * Math.PI * 2;
        // Modulate vertex with frequency band
        const bandIdx = (s * 4 + i) % bandsCount;
        const deform = 1.0 + (bands[bandIdx] || 0) * 0.45 + (audio.smoothBass * 0.2);
        const r = baseRadius * deform;

        const vx = Math.cos(theta) * r;
        const vy = Math.sin(theta) * r;

        if (s === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    // 3. Central Event Horizon Glow
    const coreGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, 180);
    coreGlow.addColorStop(0, this.palette.primary);
    coreGlow.addColorStop(0.4, this.palette.secondary);
    coreGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGlow;
    ctx.globalAlpha = 0.3 + audio.smoothBass * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.rings = [];
    this.stars = [];
  }
}

if (typeof window !== 'undefined') {
  window.CosmicTunnelVisualizer = CosmicTunnelVisualizer;
}
