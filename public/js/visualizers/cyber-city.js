/**
 * Shader Visualizer: CyberCityVisualizer (Cinematic Neo-Tokyo Megacity & Sunset Avenue)
 * Majestic 3D central highway flanked by towering neon skyscrapers, wet reflective asphalt,
 * airborne flying vehicle streams, and giant pulsing synthwave sun on the horizon.
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

  // 3D Distance field: Central grand avenue flanked by structured towers
  float map(vec3 p, out float matType, out vec2 towerID) {
    // Ground road plane
    float ground = p.y;
    matType = 0.0; // 0 = Road
    towerID = vec2(0.0);

    float roadHalfWidth = 1.6;
    float d = ground;

    // Only place skyscrapers outside the central road avenue
    if (abs(p.x) > roadHalfWidth) {
      float side = sign(p.x);
      float posX = abs(p.x) - roadHalfWidth;

      // Regular structured building grid
      vec2 gridPos = vec2(posX, p.z);
      vec2 cell = floor(gridPos / vec2(1.8, 3.2));
      towerID = cell;

      vec2 localP = mod(gridPos, vec2(1.8, 3.2)) - vec2(0.9, 1.6);

      // Procedural height based on cell + audio bass pulse
      float h = 1.8 + hash(cell) * 4.2 + (hash(cell + 5.0) > 0.6 ? u_bass * 2.5 : 0.0);
      
      // Building box with setback antenna
      vec3 bSize = vec3(0.72, h, 1.25);
      vec3 q = vec3(localP.x, p.y - h * 0.5, localP.y);
      vec3 boxDist = abs(q) - bSize * 0.5;
      float tower = max(boxDist.x, max(boxDist.y, boxDist.z));

      if (tower < d) {
        d = tower;
        matType = 1.0; // 1 = Building
      }
    }

    return d;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Forward speed along highway
    float speed = u_time * (3.0 + u_vol * 2.5);
    vec3 ro = vec3(0.0, 0.9 + sin(u_time * 0.5) * 0.05, -speed);
    vec3 rd = normalize(vec3(uv.x * 1.1, uv.y - 0.12, -1.25));

    // Gentle camera banking
    rd.xy *= rot(sin(u_time * 0.25) * 0.03);

    float t = 0.0;
    float hit = 0.0;
    float matType = 0.0;
    vec2 towerID = vec2(0.0);

    // Clean raymarching
    for (int i = 0; i < 54; i++) {
      vec3 pos = ro + rd * t;
      float curMat;
      vec2 curID;
      float d = map(pos, curMat, curID);
      if (d < 0.003) {
        hit = 1.0;
        matType = curMat;
        towerID = curID;
        break;
      }
      t += d * 0.85;
      if (t > 28.0) break;
    }

    vec3 col = vec3(0.003, 0.005, 0.015); // Deep twilight sky

    // Horizon Sun & Sky
    if (rd.y > 0.0 && (hit < 0.5 || matType == 0.0)) {
      vec2 sunUV = vec2(uv.x, uv.y - 0.15);
      float sunDist = length(sunUV);
      if (sunDist < 0.38) {
        float sunScan = step(0.35, fract(sunUV.y * 24.0));
        vec3 sunGrad = mix(vec3(1.0, 0.85, 0.2), u_col2, (sunUV.y + 0.38) / 0.76);
        col += sunGrad * sunScan * (1.3 + u_bass * 0.6);
      }
      // Warm horizon atmospheric glow
      float horizGlow = pow(max(0.0, 1.0 - abs(uv.y - 0.05)), 5.0);
      col += u_col1 * horizGlow * 0.65;
    }

    if (hit > 0.5) {
      vec3 pos = ro + rd * t;

      if (matType < 0.5) {
        // --- Grand Highway Asphalt & Wet Neon Reflections ---
        col = vec3(0.015); // Dark wet tarmac
        
        // Highway neon center divider lines
        float laneX = abs(pos.x);
        if (laneX < 0.08) {
          float dash = step(0.4, fract(pos.z * 1.5));
          col += u_col1 * dash * 2.5; // Glowing central lane
        } else if (abs(laneX - 0.8) < 0.04) {
          float dash2 = step(0.5, fract(pos.z * 0.8));
          col += u_col2 * dash2 * 1.8; // Secondary lanes
        }

        // Highway border guardrail neon strips
        if (abs(laneX - 1.55) < 0.06) {
          col += u_col1 * (2.2 + u_bass * 1.5);
        }

        // Wet asphalt specular reflection of horizon sun & towers
        float wetGlow = smoothstep(12.0, 0.0, pos.y);
        col += mix(u_col2, u_col1, 0.5) * (0.15 + u_bass * 0.2) * wetGlow;

      } else {
        // --- Structured Skyscrapers ---
        col = vec3(0.02, 0.02, 0.03); // Dark architectural composite

        // Vertical glowing neon light tracks on building corners
        vec2 localGrid = mod(vec2(abs(pos.x) - 1.6, pos.z), vec2(1.8, 3.2)) - vec2(0.9, 1.6);
        if (abs(abs(localGrid.x) - 0.34) < 0.03 || abs(abs(localGrid.y) - 0.6) < 0.03) {
          col += u_col1 * (1.2 + u_mid * 1.5);
        }

        // Clean structured window matrix
        float winY = step(0.4, fract(pos.y * 3.5));
        float winZ = step(0.35, fract(pos.z * 2.5));
        float isLit = winY * winZ * step(0.45, hash(towerID + floor(pos.y * 3.5)));
        vec3 winCol = mix(u_col2, u_col3, hash(towerID));
        col += winCol * isLit * (1.1 + u_treble * 1.4);

        // Rooftop warning beacon
        if (pos.y > 3.5 && fract(pos.y * 0.5) > 0.4) {
          col += vec3(1.0, 0.1, 0.1) * (sin(u_time * 8.0) * 0.5 + 0.5);
        }
      }

      // Atmospheric volumetric depth fog
      float fog = 1.0 - exp(-t * 0.075);
      vec3 fogCol = mix(u_col2, u_col1, 0.4) * (0.25 + u_bass * 0.15);
      col = mix(col, fogCol, fog);
    }

    // Flying Vehicles (Airborne traffic light streams)
    for (int v = 0; v < 3; v++) {
      float vLaneY = 0.45 + float(v) * 0.5;
      float vLaneX = (float(v) - 1.0) * 0.7;
      float vZ = mod(-u_time * (8.0 + float(v) * 4.0), 30.0) - 15.0;
      float dV = length(uv - vec2(vLaneX / max(abs(vZ), 1.0), (vLaneY - 0.9) / max(abs(vZ), 1.0)));
      if (vZ < 0.0) {
        col += vec3(1.0, 0.2, 0.1) * smoothstep(0.04, 0.0, dV) * 2.0; // Red taillights
      }
    }

    // Bass beat flash on horizon
    col += u_col1 * u_beat * 0.18;

    // High contrast projector tone mapping
    col = pow(max(col, vec3(0.0)), vec3(1.2));

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
