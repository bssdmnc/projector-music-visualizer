/**
 * Shader Visualizer: BlackHoleVisualizer (HD Interstellar Singularity & Curved Accretion Disk)
 * High-definition relativistic gravitational lensing, multi-octave plasma filaments,
 * razor-sharp photon ring, and ultra-fine sub-pixel starfield without any blocky pixelation.
 */

const BLACK_HOLE_FS = `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_treble;
  uniform float u_vol;
  uniform float u_beat;
  uniform vec3 u_col1;
  uniform vec3 u_col2;
  uniform vec3 u_col3;

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  // High-performance hash for smooth sub-pixel noise
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  // Quintic smooth Hermite noise (smooth C2 continuous, zero blocky edges)
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // 5-Octave fine plasma FBM (dense silky filament streams)
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = rot(0.52);
    for(int i = 0; i < 5; i++) {
      v += a * smoothNoise(p);
      p = m * p * 2.08;
      a *= 0.5;
    }
    return v;
  }

  // Evaluates accretion disk plasma density & radiance at given 2D disk coords
  vec4 sampleDisk(vec2 p, float innerR, float outerR, float tiltAngle) {
    float r = length(p);
    if (r < innerR || r > outerR) return vec4(0.0);

    float phi = atan(p.y, p.x);

    // Dynamic spiral shear rotation
    float swirl = phi * 3.0 - u_time * 2.2 - (3.5 / (r + 0.05));
    vec2 noiseCoord = vec2(swirl, (r - innerR) * 45.0 + u_time * 0.4);

    // Multi-octave fine plasma filaments
    float gas = fbm(noiseCoord);
    gas += 0.35 * fbm(noiseCoord * 2.4 - vec2(u_time * 1.5, 0.0));
    gas = pow(gas, 1.3) * 1.6;

    // Relativistic Doppler beaming (approaching plasma is blue-shifted & intensely bright)
    float doppler = 0.5 + 0.5 * cos(phi + 1.25);
    doppler = pow(doppler, 1.9) * 2.0 + 0.2;

    // Thermal color gradient: inner white-hot border -> palette 1 -> palette 2
    float heat = clamp((outerR - r) / (outerR - innerR), 0.0, 1.0);
    vec3 col = mix(u_col2, u_col1, pow(heat, 0.8));
    col = mix(col, vec3(1.0, 0.98, 0.95), pow(heat, 3.2) * (0.8 + u_bass * 0.6));

    // Smooth boundary falloffs (zero hard clipping)
    float edgeAlpha = smoothstep(innerR, innerR + 0.04, r) * 
                      smoothstep(outerR, outerR - 0.12, r);

    float alpha = clamp(edgeAlpha * gas * doppler * (1.1 + u_vol * 1.6), 0.0, 1.0);
    return vec4(col * alpha, alpha);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Slight camera tilt & slow majestic roll
    uv *= rot(0.22 + sin(u_time * 0.12) * 0.08);

    float dist = length(uv);

    // Event Horizon radius (pulsing dynamically to bass hits)
    float rs = 0.22 + u_bass * 0.07 + u_beat * 0.05;

    // Gravitational Lensing coordinates (Einstein ring light bending)
    float deflection = (rs * rs * 1.15) / max(dist, 0.001);
    vec2 lensedUV = uv * (1.0 + deflection * 0.55);

    // 1. Ultra-fine Anti-Aliased Starfield (no coarse blocks)
    vec3 col = vec3(0.0);
    vec2 starUV = lensedUV * 55.0;
    vec2 starCell = floor(starUV);
    vec2 starFrac = fract(starUV) - 0.5;
    float starH = hash21(starCell);
    if (starH > 0.93) {
      float starD = length(starFrac);
      float starBright = pow((starH - 0.93) / 0.07, 3.0) * (0.7 + u_treble * 0.5);
      float starGlow = smoothstep(0.12, 0.0, starD) * starBright;
      col += vec3(starGlow);
    }

    // Disk geometry parameters
    float innerR = rs * 1.45;
    float outerR = 0.88 + u_mid * 0.25;

    // 2. Gravitationally Lensed UPPER & LOWER Arcs (Interstellar Gargantua bending effect)
    // The back half of the accretion disk is bent over and under the black hole sphere
    vec2 haloUV = uv;
    haloUV.x *= 1.0 + (abs(uv.y) / (rs * 2.0)) * 0.3; // Spherical lensing arc
    float haloR = length(haloUV);
    if (haloR > innerR * 0.8 && haloR < outerR * 1.05) {
      float arcIntensity = smoothstep(0.0, rs * 0.8, abs(uv.y)); // Visible above & below
      vec4 arcSample = sampleDisk(haloUV * vec2(1.0, 2.8), innerR, outerR, 0.0);
      col += arcSample.rgb * arcIntensity * 0.75;
    }

    // 3. Primary Front Accretion Disk (Equatorial Plane)
    vec2 diskCoord = uv;
    diskCoord.y /= 0.32; // Realistic 3D tilt perspective
    vec4 diskSample = sampleDisk(diskCoord, innerR, outerR, 0.32);

    // Foreground compositing: disk in front occludes background
    col = col * (1.0 - diskSample.a * 0.85) + diskSample.rgb;

    // 4. Razor-Sharp Photon Ring (Light trapped in unstable orbit at 1.5 * rs)
    float photonR = rs * 1.25;
    float photonDist = abs(dist - photonR);
    float photonRing = smoothstep(0.018, 0.001, photonDist);
    vec3 photonCol = mix(vec3(1.0), u_col1, 0.35);
    col += photonCol * photonRing * (2.2 + u_beat * 2.5);

    // Inner exponential glow halo bleeding toward event horizon
    float innerGlow = smoothstep(photonR, rs, dist) * (0.8 + u_bass * 1.2);
    col += u_col1 * innerGlow * 0.45;

    // 5. Relativistic Polar Magnetic Jets (subtle ionized plasma ejection)
    float jetWidth = abs(uv.x) * 16.0;
    float jetBeam = (0.012 + u_bass * 0.02) / (jetWidth * jetWidth + 0.008);
    jetBeam *= smoothstep(rs * 0.5, 0.75, abs(uv.y));
    col += u_col3 * jetBeam * (0.8 + u_beat * 0.6);

    // 6. Absolute Event Horizon Shadow: Total darkness inside the singularity
    float eventHorizon = smoothstep(rs, rs - 0.015, dist);
    col *= (1.0 - eventHorizon);

    // Gravitational wave ripples on drum kicks
    if (u_beat > 0.05) {
      float rip = sin(dist * 40.0 - u_time * 10.0);
      float wave = max(0.0, rip) * smoothstep(0.9, 0.15, dist) * u_beat * 0.25;
      col += u_col1 * wave;
    }

    // High-contrast tone mapping for projector deep blacks
    col = pow(max(col, vec3(0.0)), vec3(1.22));

    gl_FragColor = vec4(col, 1.0);
  }
`;

class BlackHoleVisualizer extends ShaderVisualizerBase {
  constructor(canvas) {
    super(canvas, "Black Hole Singularity", BLACK_HOLE_FS);
  }
}

if (typeof window !== 'undefined') {
  window.BlackHoleVisualizer = BlackHoleVisualizer;
}
