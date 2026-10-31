/**
 * Preset 9: CyberSphereVisualizer (3D Rotating Wireframe Audio Orb)
 * 3D spherical mesh deforming with frequency bands, with gyroscopic orbit rings.
 */

class CyberSphereVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Cyber Sphere 3D";
    this.ctx = null;
    this.rotX = 0;
    this.rotY = 0;
    this.rotZ = 0;
    this.points = [];
    this.latLines = 14;
    this.lonLines = 24;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initSphere();
  }

  initSphere() {
    this.points = [];
    const radius = 180;
    for (let i = 0; i <= this.latLines; i++) {
      const theta = (i * Math.PI) / this.latLines;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const ring = [];
      for (let j = 0; j < this.lonLines; j++) {
        const phi = (j * 2 * Math.PI) / this.lonLines;
        ring.push({
          x: radius * sinT * Math.cos(phi),
          y: radius * cosT,
          z: radius * sinT * Math.sin(phi),
          origRadius: radius
        });
      }
      this.points.push(ring);
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

    // Dark void
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, 0, w, h);

    // Dynamic 3D rotation speed
    this.rotX += dt * (0.3 + audio.smoothBass * 0.4);
    this.rotY += dt * (0.5 + audio.smoothMid * 0.5);
    this.rotZ += dt * (0.15 + audio.smoothTreble * 0.3);

    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
    const cosZ = Math.cos(this.rotZ), sinZ = Math.sin(this.rotZ);

    // 3D rotation + projection helper
    const project = (p, deform) => {
      let x = p.x * deform;
      let y = p.y * deform;
      let z = p.z * deform;

      // Rotate Y
      let x1 = x * cosY + z * sinY;
      let z1 = -x * sinY + z * cosY;

      // Rotate X
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      // Rotate Z
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;

      const fov = 450;
      const scale = fov / (fov + z2 + 100);
      return {
        px: cx + x3 * scale,
        py: cy + y3 * scale,
        z: z2,
        scale: scale
      };
    };

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    // 1. Draw Latitude Rings
    for (let i = 0; i <= this.latLines; i++) {
      const ring = this.points[i];
      const bandIdx = Math.floor((i / this.latLines) * bandsCount);
      const bandVal = bands[bandIdx] || 0;
      const deform = 1.0 + bandVal * 0.55 + audio.smoothBass * 0.25;

      ctx.beginPath();
      let firstPt = null;
      for (let j = 0; j < ring.length; j++) {
        const pt = project(ring[j], deform);
        if (j === 0) {
          firstPt = pt;
          ctx.moveTo(pt.px, pt.py);
        } else {
          ctx.lineTo(pt.px, pt.py);
        }
      }
      if (firstPt) ctx.lineTo(firstPt.px, firstPt.py);

      ctx.strokeStyle = i % 2 === 0 ? this.palette.primary : this.palette.secondary;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.4 + bandVal * 0.6;
      ctx.stroke();
    }

    // 2. Draw Longitude Lines
    for (let j = 0; j < this.lonLines; j += 2) {
      ctx.beginPath();
      for (let i = 0; i <= this.latLines; i++) {
        const bandIdx = Math.floor((i / this.latLines) * bandsCount);
        const deform = 1.0 + (bands[bandIdx] || 0) * 0.55 + audio.smoothBass * 0.25;
        const pt = project(this.points[i][j], deform);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = this.palette.accent;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
    }

    // 3. Gyroscopic Orbit Ring
    const orbitRadius = 240 * (1.0 + audio.smoothBass * 0.15);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.rotY * 0.8);
    ctx.scale(1.0, 0.35);
    ctx.strokeStyle = this.palette.primary;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.palette.primary;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  destroy() {
    this.points = [];
  }
}

if (typeof window !== 'undefined') {
  window.CyberSphereVisualizer = CyberSphereVisualizer;
}
