/**
 * Preset 5: SpectrumBarsVisualizer (Futuristic Equalizer & Mirror Floor)
 * Symmetrical 3D-styled equalizer bars with falling peak meters and floor reflection.
 */

class SpectrumBarsVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Spectrum 3D";
    this.ctx = null;
    this.peaks = new Float32Array(48);
    this.peakDecay = 1.8;
    this.waveOffset = 0;
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
  }

  render(audio, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const floorY = h * 0.72; // Floor baseline

    // Clean background
    ctx.fillStyle = '#020106';
    ctx.fillRect(0, 0, w, h);

    const bands = audio.smoothedBands;
    const numBars = 40;
    const barWidth = (w * 0.88) / numBars;
    const barSpacing = Math.max(2, barWidth * 0.18);
    const actualWidth = barWidth - barSpacing;
    const startX = (w - (numBars * barWidth)) / 2;

    this.waveOffset += dt * 3.0;

    // 1. Oscilloscope Neon Ribbon in Background
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = this.palette.accent;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.palette.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    
    for (let x = 0; x <= w; x += 10) {
      const normX = x / w;
      const bandIdx = Math.floor(normX * (bands.length - 1));
      const freq = bands[bandIdx] || 0;
      const waveY = (h * 0.35) + Math.sin(normX * 10 + this.waveOffset) * (30 + audio.smoothBass * 50) 
                    - freq * 80;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Render Bars and Reflections
    for (let i = 0; i < numBars; i++) {
      // Symmetrical mapping: lowest bass in center, higher frequencies on outer edges
      const centerDist = Math.abs(i - (numBars - 1) / 2) / ((numBars - 1) / 2);
      const bandIdx = Math.floor(centerDist * (bands.length - 1));
      const val = bands[bandIdx] || 0;
      
      const maxHeight = h * 0.52;
      const barHeight = Math.max(6, Math.pow(val, 1.2) * maxHeight);
      const x = startX + i * barWidth;
      const y = floorY - barHeight;

      // Update falling peaks
      if (barHeight > this.peaks[i]) {
        this.peaks[i] = barHeight;
      } else {
        this.peaks[i] = Math.max(0, this.peaks[i] - dt * this.peakDecay * 180);
      }

      // Bar gradient (Bottom to top)
      const grad = ctx.createLinearGradient(x, floorY, x, y);
      grad.addColorStop(0, this.palette.primary);
      grad.addColorStop(0.5, this.palette.secondary);
      grad.addColorStop(1, '#ffffff');

      // Draw Main Bar
      ctx.fillStyle = grad;
      ctx.shadowColor = this.palette.secondary;
      ctx.shadowBlur = val > 0.4 ? 12 : 0;
      ctx.fillRect(x, y, actualWidth, barHeight);

      // Top glowing cap
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, actualWidth, 3);

      // Draw Peak Indicator
      const peakY = floorY - this.peaks[i];
      ctx.fillStyle = this.palette.primary;
      ctx.shadowColor = this.palette.primary;
      ctx.shadowBlur = 8;
      ctx.fillRect(x, peakY - 3, actualWidth, 3);

      // 3. Mirror Reflection on Floor
      const reflectHeight = barHeight * 0.42;
      const refGrad = ctx.createLinearGradient(x, floorY, x, floorY + reflectHeight);
      refGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      refGrad.addColorStop(0.3, this.palette.primary);
      refGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = refGrad;
      ctx.shadowBlur = 0;
      ctx.fillRect(x, floorY + 1, actualWidth, reflectHeight);
    }

    // 4. Floor Grid Horizon Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // Subtle perspective floor lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = startX; x <= w - startX; x += barWidth * 4) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      const spreadX = w / 2 + (x - w / 2) * 2.2;
      ctx.lineTo(spreadX, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  destroy() {
    this.peaks.fill(0);
  }
}

if (typeof window !== 'undefined') {
  window.SpectrumBarsVisualizer = SpectrumBarsVisualizer;
}
