/**
 * Shader Visualizer: KaleidoTempleVisualizer (Hyper-dimensional KIFS Sacred Temple)
 * Infinite raymarched kaleidoscopic sacred geometry cathedral with glowing crystal corridors.
 */

const KALEIDO_TEMPLE_FS = `
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

  // Kaleidoscopic Iterated Function System (KIFS) Distance Field
  float map(vec3 p, out float glow) {
    // Forward tunnel translation
    p.z += u_time * (0.8 + u_vol * 1.5);
    
    // Audio rotational fold
    p.xy *= rot(p.z * 0.15 + u_time * 0.1);

    vec3 w = p;
    float scale = 1.0;
    float g = 0.0;

    for (int i = 0; i < 5; i++) {
      // Symmetrical octahedral folding
      w = abs(w) - vec3(0.85 + u_bass * 0.3, 0.85, 1.2 + u_mid * 0.4);
      
      if (w.x < w.y) w.xy = w.yx;
      if (w.x < w.z) w.xz = w.zx;
      if (w.y < w.z) w.yz = w.zy;

      w.xy *= rot(0.6 + u_treble * 0.3);
      w.yz *= rot(0.4 + u_bass * 0.2);

      w *= 1.45;
      scale *= 1.45;

      g += exp(-abs(length(w) - 1.2) * 4.0);
    }

    glow = g;
    // Box corridor cross-section
    float d = (length(w.xy) - 0.45) / scale;
    return d;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    vec3 ro = vec3(0.0, 0.0, 0.0);
    vec3 rd = normalize(vec3(uv, 1.0)); // Wide FOV for immersion

    // Roll rotation
    rd.xy *= rot(sin(u_time * 0.2) * 0.2);

    float t = 0.05;
    float glowAcc = 0.0;
    float hit = 0.0;

    for(int i = 0; i < 48; i++) {
      vec3 pos = ro + rd * t;
      float g;
      float d = map(pos, g);
      glowAcc += g * 0.025;

      if (d < 0.003) {
        hit = 1.0;
        break;
      }
      t += d * 0.7;
      if (t > 12.0) break;
    }

    // Sacred stained-glass crystal colors
    vec3 col = vec3(0.0);

    // Glowing structure
    vec3 structColor = mix(u_col1, u_col2, sin(t * 1.5 + u_time) * 0.5 + 0.5);
    col += structColor * glowAcc * (1.0 + u_bass * 1.2);

    if (hit > 0.5) {
      // Solid crystal surface highlight
      float fog = exp(-t * 0.25);
      vec3 surfCol = mix(u_col3, vec3(1.0), 0.4);
      col += surfCol * fog * (0.8 + u_mid);
    }

    // Center focal glow on beat
    float centerGlow = (0.04 + u_beat * 0.1) / (length(uv) + 0.05);
    col += u_col1 * centerGlow;

    // Deep black contrast
    col = pow(max(col, vec3(0.0)), vec3(1.3));

    gl_FragColor = vec4(col, 1.0);
  }
`;

class KaleidoTempleVisualizer extends ShaderVisualizerBase {
  constructor(canvas) {
    super(canvas, "Kaleido Temple 3D", KALEIDO_TEMPLE_FS);
  }
}

if (typeof window !== 'undefined') {
  window.KaleidoTempleVisualizer = KaleidoTempleVisualizer;
}
