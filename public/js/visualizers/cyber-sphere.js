/**
 * Preset: CyberSphereVisualizer (Dyson Sphere & Quantum Holo-Globe)
 * Multi-shell 3D structure: internal nuclear plasma singularity, 3D geodesic equalizer lattice,
 * tri-axial gyroscopic gimbal rings with laser tick marks, and orbiting data satellites.
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
    this.satellites = [];
    this.latLines = 16;
    this.lonLines = 28;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initSphere();
    this.initSatellites();
  }

  initSphere() {
    this.points = [];
    const radius = 170;
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

  initSatellites() {
    this.satellites = [];
    for (let i = 0; i < 8; i++) {
      this.satellites.push({
        orbitR: 220 + Math.random() * 60,
        speed: 0.6 + Math.random() * 0.8,
        angle: (i * Math.PI * 2) / 8,
        tilt: (Math.random() - 0.5) * 1.2
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

    // 3D rotation
    this.rotX += dt * (0.35 + audio.smoothBass * 0.4);
    this.rotY += dt * (0.55 + audio.smoothMid * 0.5);
    this.rotZ += dt * (0.2 + audio.smoothTreble * 0.3);

    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
    const cosZ = Math.cos(this.rotZ), sinZ = Math.sin(this.rotZ);

    // 3D projection helper
    const project = (x, y, z) => {
      // Rotate Y
      let x1 = x * cosY + z * sinY;
      let z1 = -x * sinY + z * cosY;
      // Rotate X
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;
      // Rotate Z
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;

      const fov = 480;
      const scale = fov / (fov + z2 + 120);
      return { px: cx + x3 * scale, py: cy + y3 * scale, z: z2, scale: scale };
    };

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    // 1. Central Quantum Singularity Core
    const coreR = 60 * (1.0 + audio.smoothBass * 0.45);
    const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, coreR * 1.8);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, this.palette.primary);
    coreGrad.addColorStop(0.8, this.palette.secondary);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. 3D Geodesic Equalizer Lattice
    for (let i = 0; i <= this.latLines; i++) {
      const ring = this.points[i];
      const bandIdx = Math.floor((i / this.latLines) * bandsCount);
      const bandVal = bands[bandIdx] || 0;
      const deform = 1.0 + bandVal * 0.6 + audio.smoothBass * 0.3;

      ctx.beginPath();
      let firstPt = null;
      for (let j = 0; j < ring.length; j++) {
        const p = ring[j];
        const pt = project(p.x * deform, p.y * deform, p.z * deform);
        if (j === 0) {
          firstPt = pt;
          ctx.moveTo(pt.px, pt.py);
        } else {
          ctx.lineTo(pt.px, pt.py);
        }
      }
      if (firstPt) ctx.lineTo(firstPt.px, firstPt.py);

      ctx.strokeStyle = i % 2 === 0 ? this.palette.primary : this.palette.secondary;
      ctx.lineWidth = 1.3;
      ctx.globalAlpha = 0.4 + bandVal * 0.6;
      ctx.stroke();
    }

    // Longitude lines
    for (let j = 0; j < this.lonLines; j += 2) {
      ctx.beginPath();
      for (let i = 0; i <= this.latLines; i++) {
        const bandIdx = Math.floor((i / this.latLines) * bandsCount);
        const deform = 1.0 + (bands[bandIdx] || 0) * 0.6 + audio.smoothBass * 0.3;
        const p = this.points[i][j];
        const pt = project(p.x * deform, p.y * deform, p.z * deform);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = this.palette.accent;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
    }

    // 3. Tri-Axial Gyroscopic Gimbal Rings (Yaw, Pitch, Roll)
    const drawGimbalRing = (radius, angleOffset, color, lineWidth) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      const segments = 48;
      for (let s = 0; s <= segments; s++) {
        const theta = (s * Math.PI * 2) / segments;
        const x = Math.cos(theta + angleOffset) * radius;
        const y = 0;
        const z = Math.sin(theta + angleOffset) * radius;
        const pt = project(x, y, z);
        if (s === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.stroke();
    };

    drawGimbalRing(230 * (1.0 + audio.smoothBass * 0.1), this.rotY * 0.5, this.palette.primary, 2.5);
    drawGimbalRing(250 * (1.0 + audio.smoothMid * 0.1), -this.rotX * 0.6, this.palette.secondary, 2.0);
    drawGimbalRing(270 * (1.0 + audio.smoothTreble * 0.1), this.rotZ * 0.7, this.palette.accent, 1.8);

    // 4. Orbiting Quantum Data Satellites with Laser Beams
    for (let sat of this.satellites) {
      sat.angle += sat.speed * dt * (1.0 + audio.smoothVol);
      const satX = Math.cos(sat.angle) * sat.orbitR;
      const satY = Math.sin(sat.angle * 2.0) * (sat.orbitR * 0.35);
      const satZ = Math.sin(sat.angle) * sat.orbitR;

      const satPt = project(satX, satY, satZ);

      // Satellite body
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(satPt.px, satPt.py, 3.5 * satPt.scale, 0, Math.PI * 2);
      ctx.fill();

      // Laser telemetry beam connecting to center sphere
      if (audio.isBeat || Math.random() > 0.4) {
        ctx.strokeStyle = this.palette.primary;
        ctx.lineWidth = 1.0;
        ctx.globalAlpha = 0.5 * satPt.scale;
        ctx.beginPath();
        ctx.moveTo(satPt.px, satPt.py);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  destroy() {
    this.points = [];
    this.satellites = [];
  }
}

if (typeof window !== 'undefined') {
  window.CyberSphereVisualizer = CyberSphereVisualizer;
}
