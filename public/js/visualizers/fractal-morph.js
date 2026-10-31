/**
 * Shader Visualizer: FractalMorphVisualizer (4D Quaternion Mandelbulb Corridors)
 * Raymarched 3D/4D fractal morphing in real-time with ambient occlusion and audio folds.
 */

const FRACTAL_MORPH_FS = `
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

  // Mandelbulb / Quaternion distance estimator
  float map(vec3 p, out float trap) {
    vec3 w = p;
    float m = dot(w, w);
    float dz = 1.0;
    
    // Audio-reactive morphing constant
    vec4 c = vec4(
      sin(u_time * 0.2) * 0.35 + u_bass * 0.2,
      cos(u_time * 0.25) * 0.35,
      sin(u_time * 0.15 + u_mid * 2.0) * 0.3,
      -0.2 + u_beat * 0.15
    );

    float minD = 1000.0;

    for(int i = 0; i < 5; i++) {
      // 4D Quaternion squaring
      dz = 2.0 * sqrt(m) * dz + 1.0;
      
      // Fold
      w = abs(w);
      if (w.x < w.y) w.xy = w.yx;
      if (w.x < w.z) w.xz = w.zx;
      if (w.y < w.z) w.yz = w.zy;
      
      w = 2.0 * w - vec3(1.1 + u_bass * 0.3, 1.1, 0.8 + u_mid * 0.2);
      w.xy *= rot(0.4 + u_treble * 0.2);
      
      m = dot(w, w);
      minD = min(minD, m);
      if (m > 256.0) break;
    }

    trap = minD;
    return 0.25 * log(m) * sqrt(m) / dz;
  }

  // Normal calculation
  vec3 calcNormal(vec3 p) {
    float dummy;
    float d = map(p, dummy);
    vec2 e = vec2(0.002, 0.0);
    return normalize(vec3(
      map(p + e.xyy, dummy) - d,
      map(p + e.yxy, dummy) - d,
      map(p + e.yyx, dummy) - d
    ));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Camera setup - orbits slowly
    float camDist = 2.5 - u_bass * 0.4;
    vec3 ro = vec3(sin(u_time * 0.15) * camDist, cos(u_time * 0.12) * 0.6, cos(u_time * 0.15) * camDist);
    vec3 ta = vec3(0.0, 0.0, 0.0);
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = normalize(cross(uu, ww));
    vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.2 * ww);

    float t = 0.0;
    float trap = 0.0;
    float hit = 0.0;

    // Raymarching
    for(int i = 0; i < 48; i++) {
      vec3 pos = ro + rd * t;
      float d = map(pos, trap);
      if (d < 0.002) {
        hit = 1.0;
        break;
      }
      t += d * 0.75;
      if (t > 7.0) break;
    }

    vec3 col = vec3(0.0);

    if (hit > 0.5) {
      vec3 pos = ro + rd * t;
      vec3 n = calcNormal(pos);

      // Dual lighting
      vec3 light1 = normalize(vec3(1.0, 2.0, 1.0));
      vec3 light2 = normalize(vec3(-1.0, -1.0, -1.0));

      float diff1 = max(0.0, dot(n, light1));
      float diff2 = max(0.0, dot(n, light2)) * 0.5;
      float ao = clamp(trap * 1.5, 0.0, 1.0);

      // Color from orbit trap & active palette
      vec3 surfCol = mix(u_col1, u_col2, sin(trap * 6.0 + u_time) * 0.5 + 0.5);
      surfCol = mix(surfCol, u_col3, pow(1.0 - ao, 2.0));

      // Specular shine
      float spec = pow(max(0.0, dot(reflect(-light1, n), -rd)), 16.0);

      col = surfCol * (diff1 + diff2 + 0.15) * ao + vec3(spec) * (u_bass * 0.6 + 0.4);
      
      // Depth fog fading to pure black
      col *= exp(-t * 0.35);
    }

    // Glow halo on beat
    col += u_col1 * (u_beat * 0.25) / (length(uv) + 0.2);

    // Deep black contrast
    col = pow(max(col, vec3(0.0)), vec3(1.3));

    gl_FragColor = vec4(col, 1.0);
  }
`;

class FractalMorphVisualizer extends ShaderVisualizerBase {
  constructor(canvas) {
    super(canvas, "4D Fractal Morph", FRACTAL_MORPH_FS);
  }
}

if (typeof window !== 'undefined') {
  window.FractalMorphVisualizer = FractalMorphVisualizer;
}
