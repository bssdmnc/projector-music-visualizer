/**
 * Shader Visualizer: CyberCityVisualizer (Infinite Cyberpunk Megacity & Tron Sunset)
 * 3D raymarched skyscraper canyons, wet reflective streets, glowing neon windows, and sunset horizon.
 */

const CYBER_CITY_FS = `
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

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // 3D procedural skyscraper grid distance function
  float map(vec3 p, out vec2 buildingID) {
    vec3 q = p;
    // Infinite city grid repetition
    vec2 cell = floor((q.xz + 1.0) / 2.0);
    buildingID = cell;
    q.xz = mod(q.xz + 1.0, 2.0) - 1.0;

    // Building height based on cell random + audio bass
    float h = hash(cell) * 3.5 + 0.5;
    if (mod(cell.x + cell.y, 2.0) == 0.0) {
      h += u_bass * 1.5;
    }

    // Box distance
    vec3 d = abs(q) - vec3(0.72, h, 0.72);
    float box = min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));

    // Ground plane (wet street)
    float ground = p.y + 0.05;

    return min(box, ground);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Forward motion down the street canyon
    float speed = u_time * (2.5 + u_vol * 3.0);
    vec3 ro = vec3(0.0, 0.8, -speed);
    vec3 rd = normalize(vec3(uv.x, uv.y - 0.15, -1.2)); // Looking forward slightly angled up

    // Camera sway
    rd.xy *= rot(sin(u_time * 0.3) * 0.05);

    float t = 0.0;
    float hit = 0.0;
    vec2 bID = vec2(0.0);

    for(int i = 0; i < 48; i++) {
      vec3 pos = ro + rd * t;
      vec2 curID;
      float d = map(pos, curID);
      if (d < 0.003) {
        hit = 1.0;
        bID = curID;
        break;
      }
      t += d * 0.8;
      if (t > 24.0) break;
    }

    vec3 col = vec3(0.0);

    // Horizon glowing retrowave sunset
    if (rd.y > 0.0 && hit < 0.5) {
      // Sun sphere
      vec2 sunUV = vec2(uv.x, uv.y - 0.2);
      float sunDist = length(sunUV);
      if (sunDist < 0.35) {
        vec3 sunCol = mix(vec3(1.0, 0.9, 0.2), u_col2, (sunUV.y + 0.35) / 0.7);
        // Scanlines
        if (mod(gl_FragCoord.y, 8.0) > 3.0) {
          col += sunCol * (1.2 + u_bass * 0.5);
        }
      }
      // Horizon glow
      col += u_col1 * pow(max(0.0, 1.0 - abs(uv.y - 0.1)), 4.0) * 0.8;
    }

    if (hit > 0.5) {
      vec3 pos = ro + rd * t;

      if (pos.y < 0.02) {
        // Wet reflective street
        col = u_col1 * 0.08;
        // Street reflection of neon sky
        float reflectGlow = hash(floor(pos.xz * 12.0));
        col += mix(u_col1, u_col2, reflectGlow) * 0.2 * (1.0 + u_bass * 0.8);
      } else {
        // Skyscraper facade with glowing neon matrix windows
        float winX = step(0.35, fract(pos.x * 6.0));
        float winY = step(0.45, fract(pos.y * 5.0));
        float windowLit = winX * winY * step(0.4, hash(bID + floor(pos.y * 5.0)));

        vec3 winCol = mix(u_col1, u_col2, hash(bID));
        col = vec3(0.02); // Dark concrete
        col += winCol * windowLit * (1.2 + u_mid * 2.0);

        // Neon roof edge glow
        if (abs(pos.y - 2.5) < 0.08 || abs(pos.x) > 0.68) {
          col += u_col3 * (0.8 + u_bass);
        }
      }

      // Atmospheric cyber fog
      float fog = 1.0 - exp(-t * 0.08);
      vec3 fogCol = mix(u_col2, u_col1, 0.5) * (0.3 + u_bass * 0.2);
      col = mix(col, fogCol, fog);
    }

    // Beat pulse flash on buildings
    col += u_col1 * u_beat * 0.2;

    // Projector high contrast
    col = pow(max(col, vec3(0.0)), vec3(1.25));

    gl_FragColor = vec4(col, 1.0);
  }
`;

class CyberCityVisualizer extends ShaderVisualizerBase {
  constructor(canvas) {
    super(canvas, "Cyber Megacity 3D", CYBER_CITY_FS);
  }
}

if (typeof window !== 'undefined') {
  window.CyberCityVisualizer = CyberCityVisualizer;
}
