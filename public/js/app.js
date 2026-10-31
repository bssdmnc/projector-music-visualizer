/**
 * Master Application Controller
 * Coordinates audio telemetry, dual canvases (WebGL + 2D), 18 visualizer presets (7 AAA Shaders), hotkeys, and HUD.
 */

(function() {
  const canvasWebgl = document.getElementById('canvas-webgl');
  const canvas2d = document.getElementById('canvas-2d');
  const hud = document.getElementById('hud');
  const strobeEl = document.getElementById('beat-strobe');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const gainSlider = document.getElementById('gain-slider');
  const remoteModal = document.getElementById('remote-modal');

  // Audio Client
  const audio = new AudioClient();

  // 18 Visualizer Presets:
  // Presets 0..6: High-end GPU GLSL WebGL Shaders
  // Presets 7..17: Canvas 2D/3D Particle & Geometry engines
  const visualizers = [
    // --- 7 AAA GPU Raymarched Shaders ---
    new LiquidAcidVisualizer(canvasWebgl),           // 0: 🧪 Кислота
    new BlackHoleVisualizer(canvasWebgl),            // 1: 🕳️ Черная Дыра
    new QuantumNebulaVisualizer(canvasWebgl),        // 2: 🌌 Квантовая Туманность
    new FractalMorphVisualizer(canvasWebgl),         // 3: 🔮 4D Фрактал
    new CyberCityVisualizer(canvasWebgl),            // 4: 🌆 Кибер-Сити
    new BiolumAbyssVisualizer(canvasWebgl),          // 5: 🪼 Био-Бездна
    new KaleidoTempleVisualizer(canvasWebgl),        // 6: 🏛️ Калейдо-Храм KIFS

    // --- 11 Canvas 2D/3D Engines ---
    new NeonRingVisualizer(canvas2d),               // 7: ⭕ Кольцо
    new SynthwaveGridVisualizer(canvas2d),          // 8: 🌅 Ретровейв
    new CosmicTunnelVisualizer(canvas2d),           // 9: 🚀 Туннель
    new SpectrumBarsVisualizer(canvas2d),           // 10: 📊 3D Бары
    new MatrixRainVisualizer(canvas2d),             // 11: 💻 Матрица
    new GalaxyVortexVisualizer(canvas2d),           // 12: 🌀 Галактика
    new MandalaKaleidoscopeVisualizer(canvas2d),    // 13: 🌸 Мандала
    new CyberSphereVisualizer(canvas2d),            // 14: 🌐 3D Сфера
    new LaserPlasmaVisualizer(canvas2d),            // 15: ⚡ Лазер
    new FirestormVisualizer(canvas2d),              // 16: 🔥 Огонь
    new CrystalShardsVisualizer(canvas2d)           // 17: 💎 Кристаллы
  ];

  let currentPresetIndex = 0;
  let currentPaletteName = "cyberpunk";
  let strobeEnabled = true;
  let lastTime = performance.now();
  let idleTimer = null;

  // Initialize Canvas Sizes
  function resizeCanvases() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvasWebgl.width = w;
    canvasWebgl.height = h;
    canvas2d.width = w;
    canvas2d.height = h;
    for (let v of visualizers) {
      v.resize(w, h);
    }
  }
  window.addEventListener('resize', resizeCanvases);

  // Switch Visualizer Preset
  function setPreset(index, notifyServer = true) {
    if (index < 0 || index >= visualizers.length) return;
    
    currentPresetIndex = index;

    // Toggle active canvas: 0..6 are WebGL, 7..17 are 2D
    if (currentPresetIndex <= 6) {
      canvasWebgl.style.display = 'block';
      canvas2d.style.display = 'none';
    } else {
      canvasWebgl.style.display = 'none';
      canvas2d.style.display = 'block';
    }

    const activeViz = visualizers[currentPresetIndex];
    activeViz.setPalette(window.getPalette(currentPaletteName));

    // Update UI Buttons & scroll active into view
    document.querySelectorAll('.preset-btn').forEach((btn, i) => {
      const isActive = (i === currentPresetIndex);
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    if (notifyServer) {
      audio.setPreset(currentPresetIndex);
    }
  }

  // Switch Color Palette
  function setPalette(name, notifyServer = true) {
    currentPaletteName = name;
    const pal = window.getPalette(name);
    for (let v of visualizers) {
      v.setPalette(pal);
    }

    if (notifyServer) {
      audio.setPalette(currentPaletteName);
    }
  }

  function cyclePalette() {
    const keys = window.PALETTE_KEYS;
    const nextIdx = (keys.indexOf(currentPaletteName) + 1) % keys.length;
    setPalette(keys[nextIdx]);
  }

  // Beat flash / strobe trigger
  audio.onBeat = (intensity) => {
    if (strobeEnabled && strobeEl) {
      const pal = window.getPalette(currentPaletteName);
      strobeEl.style.backgroundColor = pal.primary;
      strobeEl.style.opacity = Math.min(0.4, 0.15 + intensity * 0.25);
      setTimeout(() => {
        strobeEl.style.opacity = '0';
      }, 70);
    }
  };

  // State sync from server or mobile remote
  audio.onStateChange = (state) => {
    if (typeof state.preset === 'number' && state.preset !== currentPresetIndex) {
      setPreset(state.preset, false);
    }
    if (state.palette && state.palette !== currentPaletteName) {
      setPalette(state.palette, false);
    }
    if (typeof state.gain === 'number') {
      gainSlider.value = state.gain;
    }
    if (typeof state.strobe === 'boolean') {
      strobeEnabled = state.strobe;
    }
  };

  // Connection status & active device display
  audio.onConnectionChange = (connected) => {
    if (connected) {
      statusDot.classList.add('connected');
      statusText.textContent = audio.activeDevice || 'WASAPI Live';
    } else {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Connecting...';
    }
  };

  audio.onDeviceChange = (device) => {
    if (statusText) {
      let shortName = device.replace('Speakers (', '').replace(')', '').replace(' - ', ' ');
      if (shortName.length > 22) shortName = shortName.substring(0, 20) + '..';
      statusText.textContent = shortName;
      statusText.title = `Активное аудиоустройство: ${device}`;
    }
  };

  // ==========================================================================
  // Auto-hide HUD & Mouse cursor after 2.5s of inactivity
  // ==========================================================================
  function resetIdleTimer() {
    document.body.classList.remove('hide-cursor');
    hud.classList.remove('hidden');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      document.body.classList.add('hide-cursor');
      hud.classList.add('hidden');
    }, 2500);
  }

  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('mousedown', resetIdleTimer);
  window.addEventListener('keydown', resetIdleTimer);
  window.addEventListener('touchstart', resetIdleTimer);

  // ==========================================================================
  // Keyboard Hotkeys
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // Number keys 1 - 9: Presets 0 - 8
    if (e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key) - 1;
      if (idx < visualizers.length) setPreset(idx);
    }
    // '0': Preset 9
    else if (e.key === '0') {
      setPreset(9);
    }
    // '-': Preset 10
    else if (e.key === '-' || e.key === '_') {
      setPreset(10);
    }
    // '=': Preset 11
    else if (e.key === '=' || e.key === '+') {
      setPreset(11);
    }
    // Space: Next preset (cycle through all 18)
    else if (e.code === 'Space') {
      e.preventDefault();
      setPreset((currentPresetIndex + 1) % visualizers.length);
    }
    // C: Cycle Palette
    else if (e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С') {
      cyclePalette();
    }
    // B: Toggle Strobe
    else if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
      strobeEnabled = !strobeEnabled;
      audio.setStrobe(strobeEnabled);
    }
    // F / F11: Fullscreen
    else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') {
      toggleFullscreen();
    }
    // H: Toggle HUD
    else if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
      hud.classList.toggle('hidden');
    }
    // Arrow Up: Increase Gain
    else if (e.key === 'ArrowUp') {
      let g = Math.min(3.0, parseFloat(gainSlider.value) + 0.15);
      gainSlider.value = g.toFixed(2);
      audio.setGain(g);
    }
    // Arrow Down: Decrease Gain
    else if (e.key === 'ArrowDown') {
      let g = Math.max(0.2, parseFloat(gainSlider.value) - 0.15);
      gainSlider.value = g.toFixed(2);
      audio.setGain(g);
    }
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {});
    }
  }

  // ==========================================================================
  // UI Button Bindings
  // ==========================================================================
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.preset);
      setPreset(idx);
    });
  });

  document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

  document.getElementById('btn-palette').addEventListener('click', cyclePalette);

  gainSlider.addEventListener('input', (e) => {
    audio.setGain(parseFloat(e.target.value));
  });

  // Mobile Remote Modal
  const btnRemote = document.getElementById('btn-remote');
  const remoteLink = document.getElementById('remote-url-link');
  btnRemote.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/info');
      const data = await res.json();
      remoteLink.textContent = data.remote_url;
      remoteLink.href = data.remote_url;
    } catch(e) {}
    remoteModal.classList.add('open');
  });

  remoteModal.addEventListener('click', (e) => {
    if (e.target === remoteModal || e.target.classList.contains('btn-close-modal')) {
      remoteModal.classList.remove('open');
    }
  });

  // ==========================================================================
  // Main Animation Render Loop (60 - 120 FPS)
  // ==========================================================================
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - lastTime) / 1000.0);
    lastTime = now;

    // Smooth audio interpolation
    audio.update(dt);

    // Render current active visualizer
    const currentViz = visualizers[currentPresetIndex];
    if (currentViz) {
      currentViz.render(audio, dt);
    }
  }

  // Initialize all visualizers
  resizeCanvases();
  for (let v of visualizers) {
    v.init();
    v.setPalette(window.getPalette(currentPaletteName));
  }
  setPreset(0, false);

  audio.connect();
  resetIdleTimer();
  requestAnimationFrame(animate);

  // Fetch initial info for remote URL
  fetch('/api/info').then(r => r.json()).then(info => {
    if (remoteLink && info.remote_url) {
      remoteLink.textContent = info.remote_url;
      remoteLink.href = info.remote_url;
    }
  }).catch(() => {});

})();
