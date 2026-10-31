/**
 * Preset: SynthwaveGridVisualizer (High-Octane Sonic Highway & Outrun Mountain Grid)
 * The central highway undulates and ripples vertically to the music waveform like a sonic roller-coaster,
 * flanked by audio-reactive wireframe mountain ridges and a pulsating retrowave sun.
 */

class SynthwaveGridVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Synthwave 80s";
    this.ctx = null;
    this.cols = 32;
    this.rows = 26;
    this.terrain = [];
    this.roadWaveform = [];
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
    this.roadWaveform = [];
    for (let y = 0; y < this.rows; y++) {
      this.terrain[y] = [];
      this.roadWaveform[y] = 0;
      for (let x = 0; x < this.cols; x++) {
        this.terrain[y][x] = 0;
      }
    }
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.44),
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
    const horizonY = h * 0.44;

    // Deep starry void
    ctx.fillStyle = '#040108';
    ctx.fillRect(0, 0, w, h);

    // 1. Twinkling Stars
    ctx.fillStyle = '#ffffff';
    for (let star of this.stars) {
      ctx.globalAlpha = star.alpha * (0.6 + audio.smoothTreble * 0.4);
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // 2. Giant Pulsing Synthwave Sun
    const sunRadius = Math.min(w, h) * 0.23 * (1.0 + audio.smoothBass * 0.22);
    const sunX = w / 2;
    const sunY = horizonY - sunRadius * 0.32;

    ctx.save();
    // Sun corona glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.9);
    sunGlow.addColorStop(0, this.palette.primary);
    sunGlow.addColorStop(0.5, this.palette.secondary);
    sunGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Sun gradient body
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGrad.addColorStop(0, '#fff000');
    sunGrad.addColorStop(0.5, this.palette.secondary);
    sunGrad.addColorStop(1, this.palette.primary);
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Retro horizontal scanline slits
    const numSlits = 8;
    ctx.fillStyle = '#040108';
    for (let i = 0; i < numSlits; i++) {
      const slitY = sunY + (i / numSlits) * sunRadius;
      const slitHeight = 3 + i * 2.8;
      if (slitY + slitHeight < horizonY) {
        ctx.fillRect(sunX - sunRadius - 15, slitY, (sunRadius + 15) * 2, slitHeight);
      }
    }
    ctx.restore();

    // 3. Terrain & Road Simulation
    // Scroll speed accelerates aggressively with tempo and bass
    this.scrollSpeed += dt * (16.0 + audio.smoothVol * 28.0 + (audio.isBeat ? 20.0 : 0.0));
    const bands = audio.smoothedBands;
    const bandsCount = bands.length;

    // Shift rows forward when scroll threshold reached
    if (this.scrollSpeed >= 1.0) {
      this.scrollSpeed -= 1.0;
      for (let y = this.rows - 1; y > 0; y--) {
        this.terrain[y] = [...this.terrain[y - 1]];
        this.roadWaveform[y] = this.roadWaveform[y - 1];
      }

      // Dynamic Road Wave: road undulates with audio bass & volume
      this.roadWaveform[0] = Math.sin(Date.now() * 0.008) * 35.0 * audio.smoothBass 
                           + (audio.isBeat ? -45.0 : 10.0 * audio.smoothVol);

      // Generate new back row
      for (let x = 0; x < this.cols; x++) {
        const centerDist = Math.abs(x - (this.cols - 1) / 2) / ((this.cols - 1) / 2);
        
        // Road is in center (centerDist < 0.22)
        if (centerDist <= 0.22) {
          this.terrain[0][x] = this.roadWaveform[0];
        } else {
          // Flanking mountain ridges: height spikes to audio frequency bands
          const bandIdx = Math.floor(centerDist * (bandsCount - 1));
          const freqVal = Math.pow(bands[bandIdx] || 0, 1.3) * 260.0;
          const mountainBase = (centerDist - 0.22) * 1.8;
          this.terrain[0][x] = this.roadWaveform[0] + freqVal * mountainBase;
        }
      }
    }

    // 4. Render 3D Perspective Grid
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Projection function: transforms grid coordinates into 3D screen space
    const project = (gx, gy, gz) => {
      const normY = (gy + this.scrollSpeed) / this.rows;
      const pY = Math.pow(normY, 2.3); // Exponential depth
      const screenY = horizonY + pY * (h - horizonY) - gz * (0.25 + pY * 0.75);

      const spread = 0.14 + pY * 1.35;
      const screenX = w / 2 + ((gx / (this.cols - 1)) - 0.5) * (w * spread);
      return { x: screenX, y: screenY, depth: pY };
    };

    // Horizontal Lines
    for (let y = 0; y < this.rows - 1; y++) {
      const depthAlpha = Math.min(1.0, y / (this.rows * 0.45));
      ctx.strokeStyle = this.palette.primary;
      ctx.lineWidth = 1.2 + depthAlpha * 2.2;
      ctx.globalAlpha = 0.3 + depthAlpha * 0.7;
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = depthAlpha > 0.6 ? 12 : 0;

      ctx.beginPath();
      for (let x = 0; x < this.cols; x++) {
        const p = project(x, y, this.terrain[y][x]);
        if (x === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Longitudinal Perspective Lines
    const midCol = (this.cols - 1) / 2;
    for (let x = 0; x < this.cols; x++) {
      const centerDist = Math.abs(x - midCol) / midCol;
      const isRoadBorder = (Math.abs(x - (midCol - 3)) < 0.5 || Math.abs(x - (midCol + 3)) < 0.5);
      const isRoadCenter = (Math.abs(x - midCol) < 0.5);

      if (isRoadCenter) {
        // Glowing Neon Center Stripe
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.95;
      } else if (isRoadBorder) {
        // Glowing Road Guardrail
        ctx.strokeStyle = this.palette.secondary;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = this.palette.secondary;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.85;
      } else {
        // Outer mountain grid lines
        ctx.strokeStyle = centerDist > 0.4 ? this.palette.secondary : this.palette.accent;
        ctx.lineWidth = 1.3;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.45;
      }

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
    this.roadWaveform = [];
    this.stars = [];
  }
}

if (typeof window !== 'undefined') {
  window.SynthwaveGridVisualizer = SynthwaveGridVisualizer;
}
