/**
 * Preset: CosmicTunnelVisualizer (Winding 3D Wormhole & Morphing Geometric Warp)
 * Flying through a winding, curving 3D geometric tunnel that twists and bends through space,
 * with shape-shifting rings (Hexagon -> Octagon -> Star), neon rails, and hyperspace warp boosts.
 */

class CosmicTunnelVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Cosmic Tunnel";
    this.ctx = null;
    this.rings = [];
    this.numRings = 28;
    this.stars = [];
    this.numStars = 220;
    this.rotZ = 0;
    this.speed = 1.0;
    this.shapeMorph = 6.0; // Starts as Hexagon, smoothly morphs
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
        z: (i / this.numRings) * 1100,
        rot: i * 0.12
      });
    }
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 2200,
        y: (Math.random() - 0.5) * 2200,
        z: Math.random() * 1100,
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

    // Deep void
    ctx.fillStyle = 'rgba(1, 1, 6, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Speed accelerates dynamically with music volume and beat kicks
    const targetSpeed = 350 + (audio.smoothVol * 800) + (audio.isBeat ? 1800 : 0);
    this.speed += (targetSpeed - this.speed) * Math.min(1.0, dt * 6.0);
    this.rotZ += dt * (0.35 + audio.smoothMid * 0.8);

    // Shape morphs over time: Hexagon (6) -> Octagon (8) -> Decagon (10) -> Triangle (3)
    this.shapeMorph = 6.0 + Math.sin(Date.now() * 0.0008) * 3.0;

    // 3D flight trajectory: Tunnel winds and curves like a roller coaster
    const curveX = (z) => Math.sin(z * 0.0025 + this.rotZ * 0.7) * 160.0;
    const curveY = (z) => Math.cos(z * 0.002 + this.rotZ * 0.5) * 120.0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';

    // 1. Hyperspace Star Streaks
    ctx.strokeStyle = '#ffffff';
    for (let star of this.stars) {
      star.prevZ = star.z;
      star.z -= this.speed * dt;
      if (star.z <= 12) {
        star.z = 1100;
        star.prevZ = 1100;
        star.x = (Math.random() - 0.5) * 2200;
        star.y = (Math.random() - 0.5) * 2200;
      }

      const fov = 380;
      const offX = curveX(star.z);
      const offY = curveY(star.z);
      const prevOffX = curveX(star.prevZ);
      const prevOffY = curveY(star.prevZ);

      const sx = ((star.x + offX) / star.z) * fov;
      const sy = ((star.y + offY) / star.z) * fov;
      const px = ((star.x + prevOffX) / star.prevZ) * fov;
      const py = ((star.y + prevOffY) / star.prevZ) * fov;

      const alpha = Math.min(1.0, (1100 - star.z) / 400);
      ctx.globalAlpha = alpha * (0.4 + audio.smoothTreble * 0.6);
      ctx.lineWidth = Math.min(3, (1100 - star.z) / 280);

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 2. Audio-Reactive Morphing Geometric Rings
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;
    const sides = Math.max(4, Math.round(this.shapeMorph));

    // Store projected ring points to draw connecting longitudinal neon rails
    const ringPoints = [];

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ring.z -= this.speed * dt;
      if (ring.z <= 15) {
        ring.z += 1100;
      }

      const fov = 420;
      const scale = fov / Math.max(ring.z, 1);
      const ringAlpha = Math.min(1.0, Math.pow((1100 - ring.z) / 750, 1.4));

      const offX = curveX(ring.z) * scale;
      const offY = curveY(ring.z) * scale;

      const baseRadius = 260 * scale;
      const ringRot = this.rotZ + ring.rot;

      const colorIndex = i % 3;
      const color = colorIndex === 0 ? this.palette.primary : (colorIndex === 1 ? this.palette.secondary : this.palette.accent);

      ctx.save();
      ctx.translate(offX, offY);
      ctx.rotate(ringRot);

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, scale * 3.8);
      ctx.globalAlpha = ringAlpha * 0.9;
      ctx.shadowColor = color;
      ctx.shadowBlur = scale > 0.75 ? 16 : 0;

      ctx.beginPath();
      const currentRingPts = [];

      for (let s = 0; s <= sides; s++) {
        const theta = (s / sides) * Math.PI * 2;
        const bandIdx = (s * 4 + i) % bandsCount;
        const deform = 1.0 + (bands[bandIdx] || 0) * 0.5 + (audio.smoothBass * 0.25);
        const r = baseRadius * deform;

        const vx = Math.cos(theta) * r;
        const vy = Math.sin(theta) * r;

        if (s === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);

        if (s < sides) {
          currentRingPts.push({ x: vx + offX, y: vy + offY });
        }
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
      ringPoints.push(currentRingPts);
    }

    // 3. Central Event Horizon Core Glow
    const coreGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, 200);
    coreGlow.addColorStop(0, this.palette.primary);
    coreGlow.addColorStop(0.4, this.palette.secondary);
    coreGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGlow;
    ctx.globalAlpha = 0.35 + audio.smoothBass * 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
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
