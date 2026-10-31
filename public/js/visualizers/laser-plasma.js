/**
 * Preset: LaserPlasmaVisualizer (Concert Vector Laser Show & Tunnel Fans)
 * Volumetric 3D laser projectors firing through atmospheric haze, drawing geometric
 * spirographs, conic laser tunnels, floor reflections, and radial laser fan bursts on beat.
 */

class LaserPlasmaVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Laser Plasma";
    this.ctx = null;
    this.phase = 0;
    this.fanBursts = [];
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
    const cy = h * 0.48;

    // Atmospheric laser haze fade
    ctx.fillStyle = 'rgba(2, 1, 6, 0.2)';
    ctx.fillRect(0, 0, w, h);

    this.phase += dt * (1.4 + audio.smoothVol * 2.2);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Volumetric Floor Haze
    const floorY = h * 0.82;
    const floorGrad = ctx.createLinearGradient(0, floorY - 50, 0, h);
    floorGrad.addColorStop(0, 'transparent');
    floorGrad.addColorStop(0.5, 'rgba(0, 243, 255, 0.08)');
    floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY - 50, w, h - floorY + 50);

    // Beat trigger creates 3D laser fan burst
    if (audio.isBeat) {
      this.fanBursts.push({
        alpha: 1.0,
        decay: 2.2,
        numBeams: 24,
        rot: this.phase * 2.0
      });
    }

    // 2. Render Laser Fan Bursts
    for (let b = this.fanBursts.length - 1; b >= 0; b--) {
      const burst = this.fanBursts[b];
      burst.alpha -= dt * burst.decay;
      if (burst.alpha <= 0) {
        this.fanBursts.splice(b, 1);
        continue;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = this.palette.primary;
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = burst.alpha * 0.85;

      const beamLen = Math.max(w, h) * 0.9;
      for (let i = 0; i < burst.numBeams; i++) {
        const a = (i * Math.PI * 2) / burst.numBeams + burst.rot;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * beamLen, Math.sin(a) * beamLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Multi-Axis Harmonograph Laser Spirograph
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;
    const numRings = 5;
    const points = 160;

    for (let r = 0; r < numRings; r++) {
      const ringOffset = (r * 0.45);
      const color = r % 2 === 0 ? this.palette.primary : this.palette.secondary;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2 + audio.smoothBass * 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 0.8;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const t = (i / points);
        const bandIdx = Math.floor(t * (bandsCount - 1));
        const freq = bands[bandIdx] || 0;

        // 3D Harmonograph trajectory
        const a1 = t * Math.PI * 6 + this.phase * (1.2 + r * 0.1);
        const a2 = t * Math.PI * 4 - this.phase * 0.8 + ringOffset;
        const a3 = t * Math.PI * 2 + this.phase * 0.5;

        const radX = (w * 0.38) * (0.65 + freq * 0.45) * Math.cos(a3);
        const radY = (h * 0.35) * (0.65 + audio.smoothBass * 0.5);

        const lx = cx + Math.sin(a1) * radX;
        const ly = cy + Math.cos(a2) * radY;

        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }

    // 4. Ground Mirror Laser Projections
    ctx.save();
    ctx.translate(cx, floorY);
    ctx.scale(1.0, 0.3); // Elliptical ground perspective
    ctx.strokeStyle = this.palette.accent;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = this.palette.accent;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.4 + audio.smoothBass * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, (w * 0.35) * (1.0 + audio.smoothBass * 0.25), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Central Laser Aperture Projector Spark
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + audio.smoothBass * 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  destroy() {
    this.fanBursts = [];
  }
}

if (typeof window !== 'undefined') {
  window.LaserPlasmaVisualizer = LaserPlasmaVisualizer;
}
