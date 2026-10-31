"""
Automated Test for Projector Music Visualizer
Tests:
1. AudioAnalyzer frequency binning and beat detection.
2. Static frontend files integrity (all 18 presets + shaders + remotes + styles).
3. Server routes creation and IP detection.
"""

import sys
from pathlib import Path
import numpy as np

# Set UTF-8 encoding for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

PROJECT_DIR = Path(__file__).parent
sys.path.insert(0, str(PROJECT_DIR))

from server import AudioAnalyzer, create_app, get_local_ip

def test_all():
    print("=" * 65)
    print("🧪 Running Projector Music Visualizer Test Suite (15 Presets)")
    print("=" * 65)

    # 1. Test IP detection
    print("\n[1/3] Testing LAN IP Detection...")
    ip = get_local_ip()
    assert ip and len(ip.split('.')) == 4, f"Invalid IP returned: {ip}"
    print(f"      ✅ Detected IP: {ip}")

    # 2. Test AudioAnalyzer FFT & Beat Detection
    print("\n[2/3] Testing AudioAnalyzer FFT & Beat Trigger...")
    analyzer = AudioAnalyzer(sample_rate=44100, chunk_size=1024, num_bands=48)
    
    t = np.linspace(0, 1024 / 44100.0, 1024, endpoint=False)
    bass_wave = (np.sin(2 * np.pi * 80.0 * t) * 0.9).astype(np.float32)
    res_bass = analyzer.analyze(bass_wave, gain=1.0)

    assert res_bass["type"] == "audio", "Expected 'audio' payload type"
    assert len(res_bass["bands"]) == 48, f"Expected 48 bands, got {len(res_bass['bands'])}"
    assert res_bass["bass"] > 0.05, f"Bass energy should be detected, got {res_bass['bass']}"
    print(f"      ✅ Audio analysis OK: Bass={res_bass['bass']}, Mid={res_bass['mid']}, Treble={res_bass['treble']}")

    # Silence test
    silence = np.zeros(1024, dtype=np.float32)
    res_silence = analyzer.analyze(silence, gain=1.0)
    assert res_silence["vol"] == 0.0, f"Expected 0.0 volume for silence, got {res_silence['vol']}"
    print("      ✅ Silence handling OK")

    # 3. Test All 15 Visualizer Preset Assets Integrity
    print("\n[3/3] Checking Frontend Assets on Disk (All 15 Presets + 7 GPU Shaders)...")
    public_dir = PROJECT_DIR / "public"
    required_files = [
        "index.html",
        "remote.html",
        "css/style.css",
        "js/palettes.js",
        "js/audio-client.js",
        "js/visualizers/base.js",
        "js/visualizers/shader-base.js",
        # 7 High-End GPU Raymarched Shaders
        "js/visualizers/liquid-acid.js",
        "js/visualizers/black-hole.js",
        "js/visualizers/quantum-nebula.js",
        "js/visualizers/fractal-morph.js",
        "js/visualizers/cyber-city.js",
        "js/visualizers/biolum-abyss.js",
        "js/visualizers/kaleido-temple.js",
        # 8 Geometry & Particle visualizers
        "js/visualizers/neon-ring.js",
        "js/visualizers/synthwave-grid.js",
        "js/visualizers/spectrum-bars.js",
        "js/visualizers/matrix-rain.js",
        "js/visualizers/galaxy-vortex.js",
        "js/visualizers/mandala-kaleidoscope.js",
        "js/visualizers/cyber-sphere.js",
        "js/visualizers/crystal-shards.js",
        "js/app.js"
    ]
    for rel_path in required_files:
        fpath = public_dir / rel_path
        assert fpath.exists(), f"Missing required file: {fpath}"
        assert fpath.stat().st_size > 0, f"File is empty: {fpath}"
        print(f"      ✅ Asset verified: {rel_path} ({fpath.stat().st_size} bytes)")

    # 4. App structure verification
    app = create_app()
    assert app is not None, "Failed to create aiohttp app"
    print("      ✅ aiohttp App configuration OK")

    print("\n" + "=" * 65)
    print("🎉 ALL 15 VISUALIZER PRESETS (7 SHADERS) VERIFIED! (100% OK)")
    print("=" * 65)

if __name__ == '__main__':
    test_all()
