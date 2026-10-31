/**
 * Shader Visualizer: BiolumAbyssVisualizer (Bioluminescent Abyss & Jelly Metaballs)
 * Raymarched organic fluid metaballs with subsurface bioluminescence and chromatic refraction.
 */

const BIOLUM_ABYSS_FS = `
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

  // Smooth minimum for organic fluid metaball blending
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // SDF map of multiple swimming bioluminescent spheres
  float map(vec3 p) {
    float d = 1000.0;
    
    // Central pulsating jellyfish bell
    vec3 c1 = p + vec3(sin(u_time * 0.4) * 0.2, cos(u_time * 0.5) * 0.2, 0.0);
    float r1 = 0.65 + u_bass * 0.35 + u_beat * 0.2;
    float s1 = length(c1) - r1;

    // Orbiting organic spheres
    vec3 c2 = p + vec3(cos(u_time * 0.6) * 1.1, sin(u_time * 0.7) * 0.8, sin(u_time * 0.5) * 0.5);
    float r2 = 0.38 + u_mid * 0.25;
    float s2 = length(c2) - r2;

    vec3 c3 = p + vec3(-sin(u_time * 0.5) * 1.0, -cos(u_time * 0.8) * 0.9, cos(u_time * 0.6) * 0.6);
    float r3 = 0.32 + u_treble * 0.2;
    float s3 = length(c3) - r3;

    vec3 c4 = p + vec3(sin(u_time * 0.7 + 1.5) * 0.8, -sin(u_time * 0.4) * 1.0, -cos(u_time * 0.7) * 0.5);
    float r4 = 0.28 + u_bass * 0.2;
    float s4 = length(c4) - r4;

    // Organic blend factor
    d = smin(s1, s2, 0.45);
    d = smin(d, s3, 0.4);
    d = smin(d, s4, 0.35);

    // Surface wave ripples
    d += sin(p.x * 6.0 + u_time * 2.0) * cos(p.y * 6.0 + u_time) * 0.04 * (1.0 + u_mid);

    return d;
  }

  vec3 calcNormal(vec3 p) {
    float d = map(p);
    vec2 e = vec2(0.003, 0.0);
    return normalize(vec3(
      map(p + e.xyy) - d,
      map(p + e.yxy) - d,
      map(p + e.yyx) - d
    ));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    vec3 ro = vec3(0.0, 0.0, -2.8);
    vec3 rd = normalize(vec3(uv, 1.3));

    ro.xy *= rot(sin(u_time * 0.2) * 0.1);
    rd.xy *= rot(sin(u_time * 0.2) * 0.1);

    float t = 0.0;
    float hit = 0.0;

    for(int i = 0; i < 48; i++) {
      vec3 pos = ro + rd * t;
      float d = map(pos);
      if (d < 0.003) {
        hit = 1.0;
        break;
      }
      t += d * 0.8;
      if (t > 5.5) break;
    }

    vec3 col = vec3(0.002, 0.004, 0.01); // Deep oceanic abyss

    if (hit > 0.5) {
      vec3 pos = ro + rd * t;
      vec3 n = calcNormal(pos);

      // Fresnel reflection (jelly membrane rim light)
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      
      // Internal translucent subsurface glow
      float subGlow = pow(clamp(dot(n, -rd), 0.0, 1.0), 2.0) * (u_bass * 1.5 + 0.5);

      vec3 rimCol = mix(u_col1, vec3(1.0), 0.5);
      vec3 coreCol = mix(u_col2, u_col3, sin(length(pos) * 5.0 - u_time * 2.0) * 0.5 + 0.5);

      col = coreCol * subGlow * 0.8 + rimCol * fresnel * 2.2;
      
      // Specular highlight
      vec3 lightDir = normalize(vec3(0.5, 1.0, -1.0));
      float spec = pow(max(0.0, dot(reflect(-lightDir, n), -rd)), 32.0);
      col += vec3(spec) * (1.0 + u_treble);

      // Depth fade
      col *= exp(-t * 0.2);
    }

    // Floating plankton motes in the water
    vec2 pGrid = fract(uv * 18.0 + vec2(sin(u_time * 0.3) * 0.5, u_time * 0.2)) - 0.5;
    float plankton = smoothstep(0.08, 0.0, length(pGrid)) * (0.3 + u_treble * 0.7);
    col += u_col1 * plankton * (1.0 - hit * 0.7);

    // Beat shock flash
    col += u_col2 * (u_beat * 0.2);

    col = pow(max(col, vec3(0.0)), vec3(1.3));

    gl_FragColor = vec4(col, 1.0);
  }
`;

class BiolumAbyssVisualizer extends ShaderVisualizerBase {
  constructor(canvas) {
    super(canvas, "Bioluminescent Abyss", BIOLUM_ABYSS_FS);
  }
}

if (typeof window !== 'undefined') {
  window.BiolumAbyssVisualizer = BiolumAbyssVisualizer;
}
