/**
 * Preset: CrystalShardsVisualizer (True 3D Polyhedral Crystals & Shaded Geodes)
 * Full 3D octahedrons and bipyramids tumbling in 3D space with face normal shading,
 * backface culling, depth sorting, and specular audio light refractions.
 */

class CrystalShardsVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Crystal Shards";
    this.ctx = null;
    this.crystals = [];
    this.numCrystals = 24;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initCrystals();
  }

  initCrystals() {
    this.crystals = [];
    for (let i = 0; i < this.numCrystals; i++) {
      this.crystals.push({
        x: (Math.random() - 0.5) * 550,
        y: (Math.random() - 0.5) * 400,
        z: Math.random() * 450 + 80,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        vrx: (Math.random() - 0.5) * 1.6,
        vry: (Math.random() - 0.5) * 1.6,
        vrz: (Math.random() - 0.5) * 1.2,
        size: 30 + Math.random() * 40,
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

    // Dark void
    ctx.fillStyle = 'rgba(2, 2, 7, 0.24)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    const bands = audio.smoothedBands;
    const speedMult = 1.0 + audio.smoothVol * 2.0;
    const fov = 450;

    // Base 3D Octahedron Model (6 vertices, 8 triangular faces)
    // Top (0, 1, 0), Bottom (0, -1, 0), Middle (+-1, 0, +-1)
    const baseVertices = [
      { x:  0, y:  1.4, z:  0 },  // 0: Top tip
      { x:  1, y:  0,   z:  0 },  // 1: Right
      { x:  0, y:  0,   z:  1 },  // 2: Front
      { x: -1, y:  0,   z:  0 },  // 3: Left
      { x:  0, y:  0,   z: -1 },  // 4: Back
      { x:  0, y: -1.4, z:  0 }   // 5: Bottom tip
    ];

    const faces = [
      // Top 4 triangles
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
      // Bottom 4 triangles
      [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
    ];

    // Light source vector
    const lightDir = { x: 0.577, y: 0.577, z: -0.577 };

    // Sort crystals back to front for proper 3D depth rendering
    this.crystals.sort((a, b) => b.z - a.z);

    for (let c of this.crystals) {
      // Rotate crystal in 3D
      c.rx += c.vrx * speedMult * dt;
      c.ry += c.vry * speedMult * dt;
      c.rz += c.vrz * speedMult * dt;

      // React to individual frequency band + bass
      const bandVal = bands[c.bandIdx] || 0;
      const crystalScale = c.size * (1.0 + bandVal * 0.7 + audio.smoothBass * 0.35);

      // Precompute rotation matrices for this crystal
      const cosX = Math.cos(c.rx), sinX = Math.sin(c.rx);
      const cosY = Math.cos(c.ry), sinY = Math.sin(c.ry);
      const cosZ = Math.cos(c.rz), sinZ = Math.sin(c.rz);

      // Transform and project all 6 vertices to 3D camera space
      const transformedVerts = [];
      const projectedVerts = [];

      for (let v of baseVertices) {
        // Model scale
        let vx = v.x * crystalScale;
        let vy = v.y * crystalScale;
        let vz = v.z * crystalScale;

        // Rotate Y
        let x1 = vx * cosY + vz * sinY;
        let z1 = -vx * sinY + vz * cosY;

        // Rotate X
        let y2 = vy * cosX - z1 * sinX;
        let z2 = vy * sinX + z1 * cosX;

        // Rotate Z
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        // World translation
        let wx = x3 + c.x;
        let wy = y3 + c.y;
        let wz = z2 + c.z;

        transformedVerts.push({ x: wx, y: wy, z: wz });

        // Perspective projection
        const pScale = fov / Math.max(wz + 200, 10);
        projectedVerts.push({
          px: wx * pScale,
          py: wy * pScale
        });
      }

      // Render the 8 triangular 3D faces with lighting and backface culling
      for (let f of faces) {
        const vA = transformedVerts[f[0]];
        const vB = transformedVerts[f[1]];
        const vC = transformedVerts[f[2]];

        const pA = projectedVerts[f[0]];
        const pB = projectedVerts[f[1]];
        const pC = projectedVerts[f[2]];

        // Calculate 3D Face Normal via Cross Product: (B - A) x (C - A)
        const edge1 = { x: vB.x - vA.x, y: vB.y - vA.y, z: vB.z - vA.z };
        const edge2 = { x: vC.x - vA.x, y: vC.y - vA.y, z: vC.z - vA.z };

        const normX = edge1.y * edge2.z - edge1.z * edge2.y;
        const normY = edge1.z * edge2.x - edge1.x * edge2.z;
        const normZ = edge1.x * edge2.y - edge1.y * edge2.x;

        // Backface Culling: if normal points away from camera (normZ > 0), don't draw
        if (normZ > 0) continue;

        const normLen = Math.sqrt(normX * normX + normY * normY + normZ * normZ) || 1.0;
        const nx = normX / normLen;
        const ny = normY / normLen;
        const nz = normZ / normLen;

        // Diffuse Lambertian Light Intensity
        const diff = Math.max(0.1, -(nx * lightDir.x + ny * lightDir.y + nz * lightDir.z));

        // Specular highlight
        const spec = Math.pow(diff, 8.0) * (0.8 + bandVal * 0.8);

        // Draw 3D Shaded Triangular Face
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(pA.px, pA.py);
        ctx.lineTo(pB.px, pB.py);
        ctx.lineTo(pC.px, pC.py);
        ctx.closePath();

        // Shaded face color
        const baseColor = (f[0] === 0) ? this.palette.primary : this.palette.secondary;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.45 + diff * 0.45;
        ctx.fill();

        // Crystal facet specular border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5 + spec * 0.5;
        ctx.stroke();

        ctx.restore();
      }
    }

    ctx.restore();
  }

  destroy() {
    this.crystals = [];
  }
}

if (typeof window !== 'undefined') {
  window.CrystalShardsVisualizer = CrystalShardsVisualizer;
}
