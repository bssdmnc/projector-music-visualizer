/**
 * Preset 12: CrystalShardsVisualizer (Prismatic 3D Crystal Shards)
 * Tumbling multifaceted 3D polygonal crystal shards catching audio light refraction.
 */

class CrystalShardsVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Crystal Shards";
    this.ctx = null;
    this.shards = [];
    this.numShards = 45;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initShards();
  }

  initShards() {
    this.shards = [];
    for (let i = 0; i < this.numShards; i++) {
      this.shards.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 450,
        z: Math.random() * 400 + 50,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        vrx: (Math.random() - 0.5) * 1.5,
        vry: (Math.random() - 0.5) * 1.5,
        size: 20 + Math.random() * 35,
        bandIdx: Math.floor(Math.random() * 48)
      });
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

    // Dark background
    ctx.fillStyle = 'rgba(2, 2, 8, 0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';

    const bands = audio.smoothedBands;
    const speedMult = 1.0 + audio.smoothVol * 2.0;

    for (let s of this.shards) {
      s.rx += s.vrx * speedMult * dt;
      s.ry += s.vry * speedMult * dt;

      const bandVal = bands[s.bandIdx] || 0;
      const pulseSize = s.size * (1.0 + bandVal * 0.8 + audio.smoothBass * 0.4);

      // Simple 3D perspective projection
      const fov = 400;
      const scale = fov / (fov + s.z);
      const px = s.x * scale;
      const py = s.y * scale;

      // Draw multifaceted triangular crystal shard
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(s.rx);
      ctx.scale(scale, scale * Math.cos(s.ry));

      // Shard facet 1
      ctx.fillStyle = bandVal > 0.4 ? this.palette.secondary : this.palette.primary;
      ctx.globalAlpha = 0.45 + bandVal * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, -pulseSize);
      ctx.lineTo(pulseSize * 0.6, pulseSize * 0.5);
      ctx.lineTo(-pulseSize * 0.6, pulseSize * 0.5);
      ctx.closePath();
      ctx.fill();

      // Specular wireframe outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.6 + bandVal * 0.4;
      ctx.stroke();

      // Gleam spark on facet
      if (audio.isBeat || bandVal > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  destroy() {
    this.shards = [];
  }
}

if (typeof window !== 'undefined') {
  window.CrystalShardsVisualizer = CrystalShardsVisualizer;
}
