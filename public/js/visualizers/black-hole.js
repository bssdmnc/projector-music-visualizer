/**
 * Shader Visualizer: BlackHoleVisualizer (Gravitational Singularity & Relativistic Accretion Disk)
 * Relativistic gravitational lensing, glowing accretion disk with Doppler beaming, and bass shockwaves.
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
  uniform sampler2D u_audio_tex;

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  // Pseudo-random noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
    
    // Camera pitch and tilt
    uv *= rot(0.25 + sin(u_time * 0.15) * 0.1);
    
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Gravitational Lensing Deflection (Einstein ring distortion)
    float rs = 0.22 + u_bass * 0.08 + u_beat * 0.05; // Schwarzschild radius
    float deflection = rs * rs / max(dist, 0.001);
    vec2 lensedUV = uv + (uv / max(dist, 0.001)) * deflection * 0.45;

    // Distant background starfield
    float stars = pow(hash(floor(lensedUV * 120.0)), 28.0) * (0.6 + u_treble * 0.5);
    vec3 col = vec3(stars);

    // Accretion Disk (Tilted 3D plane projection)
    vec2 diskUV = uv;
    diskUV.y /= 0.35; // Tilt perspective
    float diskDist = length(diskUV);
    float diskAngle = atan(diskUV.y, diskUV.x);

    // Disk boundaries: inner edge to outer edge
    float innerR = rs * 1.5;
    float outerR = 0.85 + u_mid * 0.3;

    if (diskDist > innerR && diskDist < outerR) {
      // Swirling gas texture with audio turbulence
      float swirl = diskAngle * 4.0 - u_time * 2.5 - (1.0 / diskDist) * 3.0;
      float gas = noise(vec2(swirl, diskDist * 18.0 - u_time * 1.2));
      gas += 0.5 * noise(vec2(swirl * 2.0, diskDist * 36.0 + u_time));

      // Relativistic Doppler beaming: approaching side is much brighter
      float doppler = 0.5 + 0.5 * cos(diskAngle + 1.2);
      doppler = pow(doppler, 1.8) * 1.8;

      // Color gradient from inner hot core to outer cool gas
      float heat = (outerR - diskDist) / (outerR - innerR);
      vec3 diskCol = mix(u_col2, u_col1, heat);
      diskCol = mix(diskCol, vec3(1.0, 1.0, 1.0), pow(heat, 3.0) * (0.8 + u_bass * 0.5));

      float alpha = smoothstep(innerR, innerR + 0.08, diskDist) * 
                    smoothstep(outerR, outerR - 0.15, diskDist) * gas;
      
      col += diskCol * alpha * doppler * (1.2 + u_vol * 1.5);
    }

    // Polar Relativistic Jets (beams of plasma shooting vertically)
    float jetX = abs(uv.x);
    float jetGlow = (0.015 + u_bass * 0.02 + u_beat * 0.03) / (jetX * jetX * 12.0 + 0.005);
    jetGlow *= smoothstep(0.0, 0.7, abs(uv.y));
    col += u_col3 * jetGlow;

    // Photon Sphere (glowing halo around event horizon)
    float photonSphere = smoothstep(0.06, 0.0, abs(dist - rs * 1.15));
    col += (u_col1 + vec3(0.5)) * photonSphere * (1.5 + u_beat * 1.5);

    // Event Horizon: Complete darkness inside the black hole
    float shadow = smoothstep(rs, rs - 0.02, dist);
    col *= (1.0 - shadow);

    // Gravitational wave ripples on beat
    float ripple = sin(dist * 35.0 - u_time * 8.0) * u_beat * 0.15;
    col += u_col2 * max(0.0, ripple) * smoothstep(0.8, 0.1, dist);

    // Contrast boost for deep projector blacks
    col = pow(max(col, vec3(0.0)), vec3(1.25));

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
