/**
 * Shader Visualizer: QuantumNebulaVisualizer (Volumetric Raymarched Cosmic Nebula)
 * True 3D raymarched cosmic dust clouds with volumetric light scattering and audio expansion.
 */

const QUANTUM_NEBULA_FS = `
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

  // 3D Noise for volumetric cloud density
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 w = fract(x);
    vec3 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
    
    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(
      mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), u.x),
          mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), u.x), u.y),
      mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), u.x),
          mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), u.x), u.y), u.z);
  }

  // Fractional Brownian Motion for complex smoke tendrils
  float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) {
      f += amp * noise(p);
      p = p * 2.02 + vec3(0.0, 0.0, u_time * 0.08);
      amp *= 0.5;
    }
    return f;
  }

  // Density map
  float map(vec3 p) {
    vec3 q = p;
    q.xy *= rot(u_time * 0.1);
    q.yz *= rot(u_time * 0.08);
    
    float d = 0.85 - length(p) * 0.45;
    d += fbm(q * 1.5 + vec3(0.0, 0.0, -u_time * 0.15)) * (1.2 + u_bass * 0.8);
    d += u_beat * 0.25;
    return clamp(d, 0.0, 1.0);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Ray setup
    vec3 ro = vec3(0.0, 0.0, -2.6 + u_bass * 0.4); // Camera origin moves on bass
    vec3 rd = normalize(vec3(uv, 1.3));             // Ray direction

    rd.xy *= rot(sin(u_time * 0.1) * 0.15);
    rd.xz *= rot(u_time * 0.08);

    // Light positions inside the cloud
    vec3 light1 = vec3(sin(u_time * 0.6) * 1.2, cos(u_time * 0.5) * 0.8, sin(u_time * 0.4) * 0.8);
    vec3 light2 = vec3(cos(u_time * 0.4) * 1.0, sin(u_time * 0.7) * 1.0, cos(u_time * 0.5) * 0.8);

    vec4 acc = vec4(0.0); // Accumulated color + opacity
    float t = 0.4;
    
    // 32-step volumetric raymarching for buttery 60 FPS
    for(int i = 0; i < 32; i++) {
      vec3 pos = ro + rd * t;
      float dens = map(pos);

      if (dens > 0.01) {
        // Lighting from light 1 & 2
        float d1 = length(pos - light1);
        float d2 = length(pos - light2);
        
        vec3 lColor1 = u_col1 * (1.0 / (1.0 + d1 * d1 * 2.5));
        vec3 lColor2 = u_col2 * (1.0 / (1.0 + d2 * d2 * 2.5));
        vec3 ambient = u_col3 * 0.25;

        vec3 col = (lColor1 + lColor2 + ambient) * dens;
        
        // Internal glow on treble
        col += vec3(0.8) * pow(dens, 3.0) * u_treble * 0.8;

        // Front-to-back alpha blending
        float alpha = dens * 0.18;
        acc.rgb += col * alpha * (1.0 - acc.a);
        acc.a += alpha * (1.0 - acc.a);

        if (acc.a >= 0.95) break;
      }
      t += 0.09;
    }

    // Background deep cosmic black
    vec3 finalColor = acc.rgb;
    
    // Subtle distant star dust
    float dust = pow(hash(vec3(uv * 180.0, 1.0)), 35.0) * (0.8 + u_treble * 0.6);
    finalColor += vec3(dust) * (1.0 - acc.a);

    // Projector contrast curve
    finalColor = pow(max(finalColor, vec3(0.0)), vec3(1.3));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

class QuantumNebulaVisualizer extends ShaderVisualizerBase {
  constructor(canvas) {
    super(canvas, "Quantum Nebula 3D", QUANTUM_NEBULA_FS);
  }
}

if (typeof window !== 'undefined') {
  window.QuantumNebulaVisualizer = QuantumNebulaVisualizer;
}
