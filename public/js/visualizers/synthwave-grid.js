/**
 * Preset 3: SynthwaveGridVisualizer (80s Outrun Wireframe Mountain & Pulsing Sun)
 * 3D perspective grid undulating with audio, retro sunset, and starry sky.
 */

class SynthwaveGridVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Synthwave 80s";
    this.ctx = null;
    this.cols = 28;
    this.rows = 24;
    this.terrain = [];
    this.scrollSpeed = 0;
    this.stars = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.initTerrain();
    this.initStars();
  }

  initTerrain() {
    this.terrain = [];
    for (let y = 0; y < this.rows; y++) {
      this.terrain[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.terrain[y][x] = 0;
      }
    }
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.45),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  resize(width, height) {
    super.resize(width, height);
    this.initStars();
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.46;

    // Dark sky and space
    ctx.fillStyle = '#05020a';
    ctx.fillRect(0, 0, w, h);

    // 1. Distant Stars
    ctx.fillStyle = '#ffffff';
    for (let star of this.stars) {
      ctx.globalAlpha = star.alpha * (0.5 + audio.smoothTreble * 0.5);
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // 2. Glowing Synthwave Sun on the Horizon
    const sunRadius = Math.min(w, h) * 0.22 * (1.0 + audio.smoothBass * 0.18);
    const sunX = w / 2;
    const sunY = horizonY - sunRadius * 0.3;

    ctx.save();
    // Sun glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.8);
    sunGlow.addColorStop(0, this.palette.primary);
    sunGlow.addColorStop(0.5, this.palette.secondary);
    sunGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Sun body gradient
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGrad.addColorStop(0, '#ffe600');
    sunGrad.addColorStop(0.5, this.palette.secondary);
    sunGrad.addColorStop(1, this.palette.primary);
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Retro horizontal sun scanline slits
    const numSlits = 7;
    ctx.fillStyle = '#05020a';
    for (let i = 0; i < numSlits; i++) {
      const slitY = sunY + (i / numSlits) * sunRadius;
      const slitHeight = 3 + i * 2.5;
      if (slitY + slitHeight < horizonY) {
        ctx.fillRect(sunX - sunRadius - 10, slitY, (sunRadius + 10) * 2, slitHeight);
      }
    }
    ctx.restore();

    // 3. Update Terrain with Audio Energy
    this.scrollSpeed += dt * (12.0 + audio.smoothVol * 25.0);
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    // Shift rows forward when scroll threshold reached
    if (this.scrollSpeed >= 1.0) {
      this.scrollSpeed -= 1.0;
      for (let y = this.rows - 1; y > 0; y--) {
        this.terrain[y] = [...this.terrain[y - 1]];
      }
      
      // Generate new back row with audio-reactive mountain peaks on the sides
      for (let x = 0; x < this.cols; x++) {
        const centerDist = Math.abs(x - (this.cols - 1) / 2) / ((this.cols - 1) / 2);
        // Valley in center, mountains on edges
        if (centerDist > 0.25) {
          const bandIdx = Math.floor(centerDist * (bandsCount - 1));
          const freqHeight = Math.pow(bands[bandIdx] || 0, 1.4) * 220;
          this.terrain[0][x] = freqHeight * (centerDist * 1.4);
        } else {
          this.terrain[0][x] = Math.sin(x + Date.now() * 0.005) * 8 * audio.smoothBass;
        }
      }
    }

    // 4. Render 3D Perspective Wireframe Grid
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Projection helper: transforms (gridX, gridY, height) to screen (px, py)
    const project = (gx, gy, gz) => {
      const normY = (gy + this.scrollSpeed) / this.rows;
      const pY = Math.pow(normY, 2.2); // Exponential depth
      const screenY = horizonY + pY * (h - horizonY) - gz * (0.2 + pY * 0.8);
      
      const spread = 0.15 + pY * 1.25;
      const screenX = w / 2 + ((gx / (this.cols - 1)) - 0.5) * (w * spread);
      return { x: screenX, y: screenY };
    };

    // Horizontal lines
    for (let y = 0; y < this.rows - 1; y++) {
      const depthAlpha = Math.min(1.0, y / (this.rows * 0.5));
      ctx.strokeStyle = this.palette.primary;
      ctx.lineWidth = 1.2 + depthAlpha * 1.8;
      ctx.globalAlpha = 0.25 + depthAlpha * 0.75;
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = depthAlpha > 0.6 ? 10 : 0;

      ctx.beginPath();
      for (let x = 0; x < this.cols; x++) {
        const p = project(x, y, this.terrain[y][x]);
        if (x === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Longitudinal perspective lines
    for (let x = 0; x < this.cols; x++) {
      const centerDist = Math.abs(x - (this.cols - 1) / 2) / ((this.cols - 1) / 2);
      ctx.strokeStyle = centerDist > 0.4 ? this.palette.secondary : this.palette.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;

      ctx.beginPath();
      for (let y = 0; y < this.rows; y++) {
        const p = project(x, y, this.terrain[y][x]);
        if (y === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  destroy() {
    this.terrain = [];
    this.stars = [];
  }
}

if (typeof window !== 'undefined') {
  window.SynthwaveGridVisualizer = SynthwaveGridVisualizer;
}
