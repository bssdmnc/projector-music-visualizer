/**
 * Audio Client for Projector Music Visualizer
 * Receives real-time WASAPI FFT telemetry from Python backend over WebSocket,
 * applies silky interpolation, and provides fallback to browser Web Audio if needed.
 */

class AudioClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectTimer = null;
    
    // Audio telemetry state
    this.bands = new Float32Array(48);
    this.smoothedBands = new Float32Array(48);
    this.bass = 0.0;
    this.mid = 0.0;
    this.treble = 0.0;
    this.vol = 0.0;
    this.isBeat = false;
    this.beatIntensity = 0.0;
    
    // Smooth interpolated values for 60fps rendering
    this.smoothBass = 0.0;
    this.smoothMid = 0.0;
    this.smoothTreble = 0.0;
    this.smoothVol = 0.0;
    
    // Listeners
    this.onStateChange = null;
    this.onBeat = null;
    this.onConnectionChange = null;
    this.onDeviceChange = null;
    this.activeDevice = 'Auto';
    
    // Browser fallback support
    this.webAudioCtx = null;
    this.webAudioAnalyser = null;
    this.isWebAudioActive = false;
  }

  connect() {
    if (this.ws) {
      try { this.ws.close(); } catch(e) {}
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws`;

    console.log(`🔌 Connecting to audio server: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Connected to WASAPI Audio Server');
      this.connected = true;
      if (this.onConnectionChange) this.onConnectionChange(true);
    };

    this.ws.onclose = () => {
      console.log('❌ Disconnected from Audio Server. Reconnecting in 2s...');
      this.connected = false;
      if (this.onConnectionChange) this.onConnectionChange(false);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = (err) => {
      console.warn('⚠️ WebSocket error:', err);
      this.ws.close();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = jsonParse(event.data);
        if (!data) return;

        if (data.type === 'audio') {
          this.handleAudioFrame(data);
        } else if (data.type === 'device_info') {
          this.activeDevice = data.device;
          if (this.onDeviceChange) this.onDeviceChange(data.device, data.devices);
        } else if (data.type === 'state') {
          if (data.device) {
            this.activeDevice = data.device;
            if (this.onDeviceChange) this.onDeviceChange(data.device, data.devices);
          }
          if (this.onStateChange) this.onStateChange(data);
        } else if (['set_preset', 'set_palette', 'set_gain', 'set_strobe'].includes(data.type)) {
          if (this.onStateChange) this.onStateChange(data);
        }
      } catch (e) {
        console.error('Error parsing audio message:', e);
      }
    };
  }

  handleAudioFrame(data) {
    if (data.bands && data.bands.length) {
      for (let i = 0; i < this.bands.length && i < data.bands.length; i++) {
        this.bands[i] = data.bands[i];
      }
    }
    this.bass = data.bass || 0;
    this.mid = data.mid || 0;
    this.treble = data.treble || 0;
    this.vol = data.vol || 0;
    this.isBeat = !!data.beat;
    this.beatIntensity = data.bi || 0;

    if (this.isBeat && this.onBeat) {
      this.onBeat(this.beatIntensity);
    }
  }

  /**
   * Called every animation frame (e.g. 60 or 120 fps) to smoothly interpolate
   */
  update(dt = 0.016) {
    if (this.isWebAudioActive && this.webAudioAnalyser) {
      this.pollWebAudio();
    }

    // Exponential smoothing for butter-smooth visual transitions
    const alphaFast = Math.min(1.0, dt * 18.0);
    const alphaSlow = Math.min(1.0, dt * 8.0);

    for (let i = 0; i < this.bands.length; i++) {
      const target = this.bands[i];
      if (target > this.smoothedBands[i]) {
        this.smoothedBands[i] += (target - this.smoothedBands[i]) * alphaFast;
      } else {
        this.smoothedBands[i] += (target - this.smoothedBands[i]) * alphaSlow;
      }
    }

    this.smoothBass += (this.bass - this.smoothBass) * alphaFast;
    this.smoothMid += (this.mid - this.smoothMid) * alphaFast;
    this.smoothTreble += (this.treble - this.smoothTreble) * alphaFast;
    this.smoothVol += (this.vol - this.smoothVol) * alphaFast;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  setPreset(index) {
    this.send({ type: 'set_preset', preset: index });
  }

  setPalette(name) {
    this.send({ type: 'set_palette', palette: name });
  }

  setGain(val) {
    this.send({ type: 'set_gain', gain: val });
  }

  setStrobe(val) {
    this.send({ type: 'set_strobe', strobe: val });
  }

  /**
   * Browser microphone / screen audio fallback if Python backend is offline
   */
  async startBrowserAudioFallback(sourceType = 'mic') {
    try {
      this.webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let stream;
      if (sourceType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const source = this.webAudioCtx.createMediaStreamSource(stream);
      this.webAudioAnalyser = this.webAudioCtx.createAnalyser();
      this.webAudioAnalyser.fftSize = 1024;
      this.webAudioAnalyser.smoothingTimeConstant = 0.8;
      source.connect(this.webAudioAnalyser);
      this.isWebAudioActive = true;
      this.connected = true;
      if (this.onConnectionChange) this.onConnectionChange(true);
      console.log('🎤 Fallback WebAudio stream started');
    } catch (e) {
      console.warn('Could not initialize browser WebAudio:', e);
    }
  }

  pollWebAudio() {
    const buffer = new Uint8Array(this.webAudioAnalyser.frequencyBinCount);
    this.webAudioAnalyser.getByteFrequencyData(buffer);
    
    // Group into 48 bands
    const step = Math.floor(buffer.length / 48);
    for (let i = 0; i < 48; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += buffer[i * step + j];
      }
      this.bands[i] = (sum / step) / 255.0;
    }

    let bSum = 0;
    for (let i = 0; i < 6; i++) bSum += this.bands[i];
    this.bass = bSum / 6.0;

    let mSum = 0;
    for (let i = 6; i < 24; i++) mSum += this.bands[i];
    this.mid = mSum / 18.0;

    let tSum = 0;
    for (let i = 24; i < 48; i++) tSum += this.bands[i];
    this.treble = tSum / 24.0;

    this.vol = (this.bass * 0.5 + this.mid * 0.3 + this.treble * 0.2);
    
    // Simple beat detection
    if (this.bass > 0.45 && this.bass > this.smoothBass * 1.3) {
      if (this.onBeat) this.onBeat(this.bass);
    }
  }
}

function jsonParse(str) {
  try { return JSON.parse(str); } catch(e) { return null; }
}

if (typeof window !== 'undefined') {
  window.AudioClient = AudioClient;
}
