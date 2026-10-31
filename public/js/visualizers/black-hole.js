/**
 * Shader Visualizer: BlackHoleVisualizer (Ultra-Smooth Relativistic Singularity)
 * Continuous Einstein gravitational lensing, silky plasma accretion disk with Doppler beaming,
 * razor-sharp photon ring, and continuous astronomical starfield with zero pixelation or harsh seams.
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

  // Smooth hash for continuous noise
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Quintic smooth C2 continuous noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Multi-octave fine plasma turbulence
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = rot(0.5);
    for(int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = m * p * 2.05;
      a *= 0.5;
    }
    return v;
  }

  // Smooth Accretion Disk Sampler
  vec4 sampleDisk(vec2 p, float innerR, float outerR) {
    float r = length(p);
    if (r < innerR * 0.95 || r > outerR * 1.25) return vec4(0.0);

    float phi = atan(p.y, p.x);

    // Dynamic spiral shear rotation
    float swirl = phi * 3.0 - u_time * 1.8 - (3.2 / (r + 0.05));
    vec2 noiseCoord = vec2(swirl, (r - innerR) * 35.0 + u_time * 0.3);

    // Multi-octave silky plasma density
    float gas = fbm(noiseCoord);
    gas += 0.3 * fbm(noiseCoord * 2.2 - vec2(u_time * 1.2, 0.0));
    gas = pow(gas, 1.2) * 1.5;

    // Relativistic Doppler beaming (smooth gradient from approaching to receding side)
    float doppler = 0.5 + 0.5 * cos(phi + 1.25);
    doppler = pow(doppler, 1.8) * 1.8 + 0.25;

    // Heat gradient from inner boundary to outer gas
    float heat = clamp((outerR - r) / (outerR - innerR), 0.0, 1.0);
    vec3 col = mix(u_col2, u_col1, pow(heat, 0.75));
    col = mix(col, vec3(1.0, 0.98, 0.92), pow(heat, 3.0) * (0.8 + u_bass * 0.5));

    // Smooth boundary falloffs (zero hard edges)
    float edgeAlpha = smoothstep(innerR * 0.95, innerR + 0.05, r) * 
                      smoothstep(outerR * 1.2, outerR - 0.15, r);

    float alpha = clamp(edgeAlpha * gas * doppler * (1.1 + u_vol * 1.4), 0.0, 1.0);
    return vec4(col * alpha, alpha);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Smooth subtle camera tilt
    uv *= rot(0.2 + sin(u_time * 0.1) * 0.05);

    float dist = length(uv);

    // Schwarzschild Event Horizon radius (pulsing to bass)
    float rs = 0.21 + u_bass * 0.06 + u_beat * 0.04;

    // Continuous Gravitational Lensing (smooth space bending)
    float deflection = (rs * rs * 1.1) / max(dist, 0.001);
    vec2 lensedUV = uv * (1.0 + deflection * 0.5);

    // 1. Smooth Anti-Aliased Starfield
    vec3 col = vec3(0.0);
    float starNoise = noise(lensedUV * 40.0);
    float starPeak = pow(starNoise, 16.0) * (0.8 + u_treble * 0.6);
    col += vec3(starPeak * 0.85);

    // Disk radii
    float innerR = rs * 1.45;
    float outerR = 0.85 + u_mid * 0.22;

    // 2. Gravitationally Lensed Upper and Lower Halo Arcs
    vec2 haloUV = uv;
    haloUV.x *= 1.0 + (abs(uv.y) / (rs * 2.0)) * 0.25;
    float haloR = length(haloUV);
    if (haloR > innerR * 0.8 && haloR < outerR * 1.1) {
      float arcIntensity = smoothstep(0.0, rs * 0.7, abs(uv.y));
      vec4 arcSample = sampleDisk(haloUV * vec2(1.0, 2.6), innerR, outerR);
      col += arcSample.rgb * arcIntensity * 0.7;
    }

    // 3. Primary Front Accretion Disk
    vec2 diskCoord = uv;
    diskCoord.y /= 0.32; // Perspective inclination
    vec4 diskSample = sampleDisk(diskCoord, innerR, outerR);

    // Alpha blending
    col = col * (1.0 - diskSample.a * 0.85) + diskSample.rgb;

    // 4. Razor-Sharp Photon Ring (Light orbit)
    float photonR = rs * 1.25;
    float photonDist = abs(dist - photonR);
    float photonRing = smoothstep(0.015, 0.001, photonDist);
    col += mix(vec3(1.0), u_col1, 0.3) * photonRing * (2.2 + u_beat * 2.0);

    // Inner glow halo toward event horizon
    float innerGlow = smoothstep(photonR, rs, dist) * (0.6 + u_bass * 0.8);
    col += u_col1 * innerGlow * 0.4;

    // 5. Polar Relativistic Plasma Jets
    float jetWidth = abs(uv.x) * 18.0;
    float jetBeam = (0.01 + u_bass * 0.015) / (jetWidth * jetWidth + 0.006);
    jetBeam *= smoothstep(rs * 0.5, 0.7, abs(uv.y));
    col += u_col3 * jetBeam * (0.8 + u_beat * 0.6);

    // 6. Absolute Event Horizon: Pitch Black Singularity
    float shadow = smoothstep(rs, rs - 0.015, dist);
    col *= (1.0 - shadow);

    // Gravitational wave ripples on beat
    if (u_beat > 0.05) {
      float rip = sin(dist * 35.0 - u_time * 8.0);
      float wave = max(0.0, rip) * smoothstep(0.85, 0.15, dist) * u_beat * 0.22;
      col += u_col1 * wave;
    }

    // Contrast curve for deep projector blacks
    col = pow(max(col, vec3(0.0)), vec3(1.2));

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
