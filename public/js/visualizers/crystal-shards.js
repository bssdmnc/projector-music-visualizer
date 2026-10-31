/**
 * Preset: CrystalShardsVisualizer (Monolithic 3D Gemstones & Radiant Geodes)
 * True connected polyhedral crystal geometry with unified edge wireframes,
 * mathematically flawless 2D screen-space face culling, smooth Lambertian facet shading,
 * internal glowing crystal core, and zero separated or broken facets.
 */

class CrystalShardsVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Crystal Shards";
    this.ctx = null;
    this.crystals = [];
    this.numCrystals = 14;
    this.sparkles = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initCrystals();
    this.initSparkles();
  }

  initSparkles() {
    this.sparkles = [];
    for (let i = 0; i < 180; i++) {
      this.sparkles.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 500 + 50,
        size: 1.0 + Math.random() * 2.0,
        alpha: 0.2 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.6
      });
    }
  }

  initCrystals() {
    this.crystals = [];

    // Central Master Crystal Cluster + Surrounding Satellite Gems
    // 0: Giant central master crystal
    this.crystals.push({
      x: 0,
      y: 10,
      z: 220,
      rx: 0.2,
      ry: 0.4,
      rz: 0.1,
      vrx: 0.25,
      vry: 0.45,
      vrz: 0.15,
      size: 95,
      bandIdx: 4,
      isMaster: true
    });

    // 1-13: Orbiting satellite polyhedral crystals
    for (let i = 1; i < this.numCrystals; i++) {
      const angle = (i / (this.numCrystals - 1)) * Math.PI * 2;
      const radius = 220 + (i % 3) * 60;
      this.crystals.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.65 + (Math.random() - 0.5) * 60,
        z: Math.sin(angle) * 120 + 260,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        vrx: (Math.random() - 0.5) * 0.8,
        vry: (Math.random() - 0.5) * 0.9,
        vrz: (Math.random() - 0.5) * 0.7,
        size: 32 + (i % 4) * 12,
        bandIdx: (i * 3) % 48,
        isMaster: false
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

    // Deep starry void for projector black levels
    ctx.fillStyle = 'rgba(2, 2, 7, 0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    const bands = audio.smoothedBands;
    const speedMult = 1.0 + audio.smoothVol * 2.2;
    const fov = 480;

    // 1. Ambient Sparkle Dust
    ctx.fillStyle = '#ffffff';
    for (let sp of this.sparkles) {
      sp.y -= sp.speed * 20 * dt;
      if (sp.y < -350) sp.y = 350;

      const pScale = fov / Math.max(sp.z + 200, 10);
      const px = sp.x * pScale;
      const py = sp.y * pScale;

      ctx.globalAlpha = sp.alpha * (0.4 + audio.smoothTreble * 0.6);
      ctx.beginPath();
      ctx.arc(px, py, sp.size * pScale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 2. Monolithic 3D Crystal Polyhedron Model
    // 6 Vertices, 8 Triangular Faces, 12 Connected Edges
    const baseVertices = [
      { x:  0.0, y:  1.6, z:  0.0 }, // 0: Top Apex
      { x:  1.0, y:  0.0, z:  0.0 }, // 1: Right
      { x:  0.0, y:  0.0, z:  1.0 }, // 2: Front
      { x: -1.0, y:  0.0, z:  0.0 }, // 3: Left
      { x:  0.0, y:  0.0, z: -1.0 }, // 4: Back
      { x:  0.0, y: -1.6, z:  0.0 }  // 5: Bottom Apex
    ];

    // Consistent counter-clockwise winding faces
    const faces = [
      // Top 4 facets (Apex 0)
      [0, 2, 1],
      [0, 3, 2],
      [0, 4, 3],
      [0, 1, 4],
      // Bottom 4 facets (Apex 5)
      [5, 1, 2],
      [5, 2, 3],
      [5, 3, 4],
      [5, 4, 1]
    ];

    // Unique continuous edges connecting the monolithic crystal
    const edges = [
      // Top pyramid edges
      [0, 1], [0, 2], [0, 3], [0, 4],
      // Equator belt edges
      [1, 2], [2, 3], [3, 4], [4, 1],
      // Bottom pyramid edges
      [5, 1], [5, 2], [5, 3], [5, 4]
    ];

    // Directional light vector (Normalized)
    const lightDir = { x: 0.577, y: 0.577, z: -0.577 };

    // Sort crystals from back to front for proper 3D depth layering
    this.crystals.sort((a, b) => b.z - a.z);

    for (let c of this.crystals) {
      // Rotate crystal
      c.rx += c.vrx * speedMult * dt;
      c.ry += c.vry * speedMult * dt;
      c.rz += c.vrz * speedMult * dt;

      // Frequency reaction
      const bandVal = bands[c.bandIdx] || 0;
      const pulse = c.isMaster ? (audio.smoothBass * 0.45 + (audio.isBeat ? 0.2 : 0)) : (bandVal * 0.5);
      const crystalScale = c.size * (1.0 + pulse);

      const cosX = Math.cos(c.rx), sinX = Math.sin(c.rx);
      const cosY = Math.cos(c.ry), sinY = Math.sin(c.ry);
      const cosZ = Math.cos(c.rz), sinZ = Math.sin(c.rz);

      // Transform all vertices
      const transVerts = [];
      const projVerts = [];

      for (let v of baseVertices) {
        let vx = v.x * crystalScale;
        let vy = v.y * crystalScale;
        let vz = v.z * crystalScale;

        // Y-axis rotation
        let x1 = vx * cosY + vz * sinY;
        let z1 = -vx * sinY + vz * cosY;

        // X-axis rotation
        let y2 = vy * cosX - z1 * sinX;
        let z2 = vy * sinX + z1 * cosX;

        // Z-axis rotation
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        // Translation to 3D world space
        let wx = x3 + c.x;
        let wy = y3 + c.y;
        let wz = z2 + c.z;

        transVerts.push({ x: wx, y: wy, z: wz });

        const pScale = fov / Math.max(wz + 200, 10);
        projVerts.push({
          px: wx * pScale,
          py: wy * pScale,
          pScale: pScale
        });
      }

      // 1. Render Solid Shaded Polygonal Facets
      // Flawless 2D screen-space cross product winding backface culling
      for (let f of faces) {
        const pA = projVerts[f[0]];
        const pB = projVerts[f[1]];
        const pC = projVerts[f[2]];

        // 2D Screen Space Signed Area Cross Product
        const cross2D = (pB.px - pA.px) * (pC.py - pA.py) - (pB.py - pA.py) * (pC.px - pA.px);

        // In HTML canvas (where Y goes downward), counter-clockwise triangles have cross2D > 0
        // If cross2D <= 0, the face is pointing away from the camera — skip backfaces cleanly
        if (cross2D <= 0) continue;

        // Calculate 3D normal for Lambertian lighting
        const vA = transVerts[f[0]];
        const vB = transVerts[f[1]];
        const vC = transVerts[f[2]];

        const e1x = vB.x - vA.x, e1y = vB.y - vA.y, e1z = vB.z - vA.z;
        const e2x = vC.x - vA.x, e2y = vC.y - vA.y, e2z = vC.z - vA.z;

        const nx = e1y * e2z - e1z * e2y;
        const ny = e1z * e2x - e1x * e2z;
        const nz = e1x * e2y - e1y * e2x;

        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
        const norm = { x: nx / nLen, y: ny / nLen, z: nz / nLen };

        // Diffuse light intensity
        const diff = Math.max(0.15, norm.x * lightDir.x + norm.y * lightDir.y + norm.z * lightDir.z);
        const spec = Math.pow(diff, 6.0) * (0.6 + bandVal * 0.8);

        // Draw solid, non-tearing facet with gemstone gradient
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pA.px, pA.py);
        ctx.lineTo(pB.px, pB.py);
        ctx.lineTo(pC.px, pC.py);
        ctx.closePath();

        const grad = ctx.createLinearGradient(pA.px, pA.py, pB.px, pB.py);
        const faceColor = (f[0] === 0) ? this.palette.primary : this.palette.secondary;
        grad.addColorStop(0, faceColor);
        grad.addColorStop(1, this.palette.accent);

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.65 + diff * 0.35;
        ctx.fill();

        // Subtle specular sheen on face surface
        if (spec > 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = (spec - 0.4) * 0.6;
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Render Unified Continuous Wireframe Edges
      // All edges are rendered as a unified pass over the solid facets so they never disconnect
      ctx.save();
      ctx.lineWidth = c.isMaster ? 2.8 : 1.8;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = c.isMaster ? 16 : 8;
      ctx.globalAlpha = 0.85 + (audio.isBeat ? 0.15 : 0.0);

      ctx.beginPath();
      for (let e of edges) {
        const p1 = projVerts[e[0]];
        const p2 = projVerts[e[1]];
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
      }
      ctx.stroke();

      // Glowing corner vertex nodes
      ctx.fillStyle = '#ffffff';
      for (let pv of projVerts) {
        ctx.beginPath();
        ctx.arc(pv.px, pv.py, c.isMaster ? 3.0 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Glowing Internal Heart Singularity (Master Crystal only)
      if (c.isMaster) {
        const centerP = projVerts[0];
        const heartPScale = fov / Math.max(c.z + 200, 10);
        const hx = c.x * heartPScale;
        const hy = c.y * heartPScale;

        const coreGlow = ctx.createRadialGradient(hx, hy, 5, hx, hy, crystalScale * 0.75 * heartPScale);
        coreGlow.addColorStop(0, '#ffffff');
        coreGlow.addColorStop(0.35, this.palette.secondary);
        coreGlow.addColorStop(1, 'transparent');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(hx, hy, crystalScale * 0.75 * heartPScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  destroy() {
    this.crystals = [];
    this.sparkles = [];
  }
}

if (typeof window !== 'undefined') {
  window.CrystalShardsVisualizer = CrystalShardsVisualizer;
}
