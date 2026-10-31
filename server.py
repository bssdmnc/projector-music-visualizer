"""
Projector Music Visualizer - Backend Server
Captures system audio loopback via WASAPI, calculates real-time FFT frequency bands
and beat detection with dynamic acoustic scaling, and streams telemetry via WebSockets.
"""

import asyncio
import json
import socket
import sys
import threading
import time
from pathlib import Path
import numpy as np
import soundcard as sc
from aiohttp import web

# Set UTF-8 encoding for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

PORT = 3060
SAMPLE_RATE = 44100
CHUNK_SIZE = 1024  # ~23.2ms per frame @ 44.1kHz
NUM_BANDS = 48     # 48 logarithmic bands for rich spectrum

# Global audio state & connected clients
active_websockets = set()
current_preset = 0
current_palette = "cyberpunk"
current_gain = 1.0
current_strobe = True

def get_local_ip():
    """Retrieve local LAN IP for mobile remote connection without network blocking."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return '127.0.0.1'

class AudioAnalyzer:
    def __init__(self, sample_rate=SAMPLE_RATE, chunk_size=CHUNK_SIZE, num_bands=NUM_BANDS):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.num_bands = num_bands
        self.window = np.hanning(chunk_size)
        
        # Precompute logarithmic frequency bins from 30 Hz to 16000 Hz
        min_freq = 30.0
        max_freq = 16000.0
        log_freqs = np.geomspace(min_freq, max_freq, num_bands + 1)
        freqs_fft = np.fft.rfftfreq(chunk_size, 1.0 / sample_rate)
        
        self.bin_indices = []
        for i in range(num_bands):
            f_low = log_freqs[i]
            f_high = log_freqs[i + 1]
            idx = np.where((freqs_fft >= f_low) & (freqs_fft < f_high))[0]
            if len(idx) == 0:
                idx = np.array([np.argmin(np.abs(freqs_fft - f_low))])
            self.bin_indices.append(idx)
            
        # Beat detection state
        self.bass_history = []
        self.history_size = 25
        self.last_beat_time = 0.0
        self.prev_bass = 0.0
        self.smoothed_bands = np.zeros(num_bands)

    def analyze(self, raw_audio, gain=1.0):
        # Convert to mono if multi-channel
        if raw_audio.ndim > 1:
            mono = np.mean(raw_audio, axis=1)
        else:
            mono = raw_audio

        if len(mono) < self.chunk_size:
            mono = np.pad(mono, (0, self.chunk_size - len(mono)))
        elif len(mono) > self.chunk_size:
            mono = mono[:self.chunk_size]

        # Overall RMS volume
        rms = np.sqrt(np.mean(mono ** 2))
        vol = float(np.clip(rms * 2.5 * gain, 0.0, 1.0))

        # Normalized FFT (divide by N/2 so pure sine amplitude 1.0 -> FFT peak 1.0)
        windowed = mono * self.window
        fft_norm = np.abs(np.fft.rfft(windowed)) / (self.chunk_size / 2.0)

        # Calculate energy per band with balanced acoustic tilt (natural human loudness curve)
        bands = np.zeros(self.num_bands)
        for i, idx in enumerate(self.bin_indices):
            energy = np.mean(fft_norm[idx]) if len(idx) > 0 else 0.0
            # Sqrt acoustic compression + frequency tilt (higher frequencies need slight boost)
            tilt = 1.6 + (i / self.num_bands) * 3.4
            bands[i] = np.sqrt(energy) * tilt * gain

        # Clip within [0, 1] range
        bands = np.clip(bands, 0.0, 1.0)
        
        # Smooth bands with fast rise, smooth fall
        for i in range(self.num_bands):
            if bands[i] > self.smoothed_bands[i]:
                self.smoothed_bands[i] = bands[i]
            else:
                self.smoothed_bands[i] = self.smoothed_bands[i] * 0.75 + bands[i] * 0.25

        # Sub-bass + Bass: bands ~0 to 8 (approx 30Hz - 250Hz)
        bass = float(np.mean(self.smoothed_bands[:8]))
        # Mid: bands 8 to 28 (approx 250Hz - 2500Hz)
        mid = float(np.mean(self.smoothed_bands[8:28]))
        # Treble: bands 28 to end (approx 2500Hz - 16000Hz)
        treble = float(np.mean(self.smoothed_bands[28:]))

        # Transient Onset + Energy Ratio Beat Detection
        now = time.time()
        self.bass_history.append(bass)
        if len(self.bass_history) > self.history_size:
            self.bass_history.pop(0)

        avg_bass = np.mean(self.bass_history) if self.bass_history else 0.1
        onset = bass - self.prev_bass
        self.prev_bass = bass

        is_beat = False
        beat_intensity = 0.0
        
        # Kick trigger: sudden jump in bass energy or strong threshold over rolling average
        if (onset > 0.07 or (bass > avg_bass * 1.22 and bass > 0.18)) and (now - self.last_beat_time) > 0.18:
            is_beat = True
            beat_intensity = min(1.0, float(max(onset * 3.0, (bass - avg_bass) / max(0.1, avg_bass))))
            self.last_beat_time = now

        return {
            "type": "audio",
            "bands": [round(float(b), 3) for b in self.smoothed_bands],
            "bass": round(bass, 3),
            "mid": round(mid, 3),
            "treble": round(treble, 3),
            "vol": round(vol, 3),
            "beat": is_beat,
            "bi": round(beat_intensity, 3)
        }


def find_active_loopback_mic():
    """Find the speaker with active sound playing, or fallback to default speaker."""
    default_spk = sc.default_speaker()
    active_mic = None
    max_peak = 0.0
    for spk in sc.all_speakers():
        try:
            mic = sc.get_microphone(id=str(spk.name), include_loopback=True)
            with mic.recorder(samplerate=SAMPLE_RATE) as rec:
                data = rec.record(numframes=512)
                peak = np.max(np.abs(data))
                if peak > max_peak:
                    max_peak = peak
                    active_mic = mic
        except Exception:
            pass
    if active_mic and max_peak > 0.005:
        return active_mic
    return sc.get_microphone(id=str(default_spk.name), include_loopback=True)


# Dedicated thread for WASAPI loopback audio capture
def audio_capture_loop(loop, analyzer):
    global current_gain
    print("🎧 Initializing Windows WASAPI Loopback Capture...", flush=True)
    
    while True:
        try:
            loopback_mic = find_active_loopback_mic()
            print(f"✨ Recording loopback from: {loopback_mic.name}", flush=True)
            
            with loopback_mic.recorder(samplerate=SAMPLE_RATE, blocksize=CHUNK_SIZE) as recorder:
                while True:
                    data = recorder.record(numframes=CHUNK_SIZE)
                    if active_websockets:
                        payload = analyzer.analyze(data, gain=current_gain)
                        msg = json.dumps(payload)
                        asyncio.run_coroutine_threadsafe(broadcast_message(msg), loop)
        except Exception as e:
            print(f"⚠️ Audio capture warning: {e}. Retrying in 1.5 seconds...", flush=True)
            time.sleep(1.5)


async def broadcast_message(message_str):
    """Broadcast raw string message to all connected clients."""
    if not active_websockets:
        return
    stale = []
    for ws in active_websockets:
        try:
            await ws.send_str(message_str)
        except Exception:
            stale.append(ws)
    for ws in stale:
        active_websockets.discard(ws)


async def ws_handler(request):
    """Handle visualizer & remote control WebSocket connections."""
    global current_preset, current_palette, current_gain, current_strobe
    ws = web.WebSocketResponse(heartbeat=15.0)
    await ws.prepare(request)
    active_websockets.add(ws)
    
    # Send current state immediately on connect
    initial_state = {
        "type": "state",
        "preset": current_preset,
        "palette": current_palette,
        "gain": current_gain,
        "strobe": current_strobe
    }
    await ws.send_str(json.dumps(initial_state))

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                data = json.loads(msg.data)
                action = data.get("type")
                
                # Update global state and relay to all other clients
                if action == "set_preset":
                    current_preset = int(data.get("preset", 0))
                    await broadcast_message(json.dumps({"type": "set_preset", "preset": current_preset}))
                elif action == "set_palette":
                    current_palette = data.get("palette", "cyberpunk")
                    await broadcast_message(json.dumps({"type": "set_palette", "palette": current_palette}))
                elif action == "set_gain":
                    current_gain = float(data.get("gain", 1.0))
                    await broadcast_message(json.dumps({"type": "set_gain", "gain": current_gain}))
                elif action == "set_strobe":
                    current_strobe = bool(data.get("strobe", True))
                    await broadcast_message(json.dumps({"type": "set_strobe", "strobe": current_strobe}))
            elif msg.type == web.WSMsgType.ERROR:
                pass
    finally:
        active_websockets.discard(ws)
    return ws


async def api_info(request):
    """Returns server and network information."""
    local_ip = get_local_ip()
    return web.json_response({
        "status": "online",
        "port": PORT,
        "local_url": f"http://localhost:{PORT}",
        "remote_url": f"http://{local_ip}:{PORT}/remote.html",
        "ip": local_ip,
        "preset": current_preset,
        "palette": current_palette,
        "gain": current_gain
    })


def create_app():
    app = web.Application()
    app.router.add_get('/ws', ws_handler)
    app.router.add_get('/api/info', api_info)
    
    # Serve static frontend files
    public_path = Path(__file__).parent / "public"
    app.router.add_static('/', path=public_path, name='public', show_index=True)
    return app


def main():
    local_ip = get_local_ip()
    print("=" * 65, flush=True)
    print(" 🌟 PROJECTOR MUSIC VISUALIZER 🌟", flush=True)
    print("=" * 65, flush=True)
    print(f" 📽️  Projector Screen (PC):   http://localhost:{PORT}", flush=True)
    print(f" 📱 Mobile Remote (Phone):   http://{local_ip}:{PORT}/remote.html", flush=True)
    print("=" * 65, flush=True)
    print(" ⌨️  Hotkeys on Visualizer Window:", flush=True)
    print("     [F] / [F11]  : Toggle Fullscreen (Projector)", flush=True)
    print("     [Space]      : Next Visualizer Preset", flush=True)
    print("     [1] - [5]    : Direct Preset Select", flush=True)
    print("     [C]          : Cycle Color Palette", flush=True)
    print("     [B]          : Toggle Beat Flash Strobe", flush=True)
    print("     [↑] / [↓]    : Adjust Audio Sensitivity", flush=True)
    print("     [H]          : Hide / Show Controls HUD", flush=True)
    print("=" * 65, flush=True)
    
    analyzer = AudioAnalyzer()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    capture_thread = threading.Thread(
        target=audio_capture_loop, 
        args=(loop, analyzer), 
        daemon=True,
        name="WASAPIAudioCapture"
    )
    capture_thread.start()

    app = create_app()
    web.run_app(app, host='0.0.0.0', port=PORT, loop=loop)

if __name__ == '__main__':
    main()
