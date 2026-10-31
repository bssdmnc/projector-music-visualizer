/**
 * Shader Visualizer: CyberCityVisualizer (Lush Neo-Tokyo Cyberpunk Megacity)
 * Dense luminous skyscraper canyon, wet reflective highway with neon light trails,
 * anti-aliased window matrices, volumetric atmospheric cyber glow, and radiant horizon sun.
 * Completely eliminates ragged geometry tearing and pitch-black voids.
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

  // Smooth pseudo-random hash
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Signed distance to 3D box
  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }

  // City distance estimator with smooth ground and dense tiered towers
  float map(vec3 p, out float matType, out vec2 cellID) {
    // 1. Wet Highway Ground Plane
    float d = p.y;
    matType = 0.0; // 0 = Highway Road
    cellID = vec2(0.0);

    float roadWidth = 2.0;

    // 2. Skyscraper canyons along left and right flanks
    if (abs(p.x) > roadWidth) {
      float side = sign(p.x);
      float posX = abs(p.x) - roadWidth;

      // Two tiers of dense buildings: frontage towers and background megatall towers
      vec2 cellSize = vec2(1.9, 3.4);
      vec2 id = floor(vec2(posX, p.z) / cellSize);
      cellID = id;

      vec2 localXZ = mod(vec2(posX, p.z), cellSize) - cellSize * 0.5;

      // Deterministic architectural height per building with audio pulsation
      float hRand = hash(id * 13.37);
      float baseH = 2.4 + hRand * 4.8;
      if (hRand > 0.6) baseH += u_bass * 2.2;

      // Structured skyscraper box
      vec3 bSize = vec3(0.78, baseH, 1.35);
      vec3 bPos = vec3(localXZ.x, p.y - baseH * 0.5, localXZ.y);
      float tower = sdBox(bPos, bSize * 0.5);

      if (tower < d) {
        d = tower;
        matType = 1.0; // 1 = Building Facade
      }
    }

    return d;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    // Forward drive speed through megacity
    float speed = u_time * (3.8 + u_vol * 3.0);
    vec3 ro = vec3(0.0, 1.15 + sin(u_time * 0.4) * 0.04, -speed);
    vec3 rd = normalize(vec3(uv.x * 1.12, uv.y - 0.14, -1.25));

    // Gentle camera sway
    rd.xy *= rot(sin(u_time * 0.2) * 0.025);

    float t = 0.0;
    float hit = 0.0;
    float matType = 0.0;
    vec2 cellID = vec2(0.0);

    // Lipschitz-safe raymarching (prevents tearing / ragged artifacts)
    for (int i = 0; i < 64; i++) {
      vec3 pos = ro + rd * t;
      float curMat;
      vec2 curID;
      float d = map(pos, curMat, curID);

      if (d < 0.003) {
        hit = 1.0;
        matType = curMat;
        cellID = curID;
        break;
      }
      // Safe step bounds
      t += max(d * 0.65, 0.012);
      if (t > 35.0) break;
    }

    // --- Rich Synthwave Horizon Sky & Luminous Sunset ---
    // Deep cosmic gradient: violet / magenta / electric indigo (never pitch black)
    float skyY = uv.y - 0.12;
    vec3 skyGradient = mix(
      mix(vec3(0.04, 0.02, 0.10), u_col2 * 0.25, clamp(skyY * 2.5, 0.0, 1.0)),
      mix(u_col1 * 0.6, vec3(0.95, 0.45, 0.15), 0.5),
      pow(max(0.0, 1.0 - abs(skyY) * 2.2), 3.5)
    );
    vec3 col = skyGradient;

    // Radiant Horizon Sun
    vec2 sunUV = vec2(uv.x, uv.y - 0.16);
    float sunDist = length(sunUV);
    if (sunDist < 0.45 && (hit < 0.5 || matType == 0.0)) {
      float sunBody = smoothstep(0.42, 0.40, sunDist);
      vec3 sunColor = mix(vec3(1.0, 0.95, 0.4), u_col2, (sunUV.y + 0.42) / 0.84);
      col = mix(col, sunColor * (1.6 + u_bass * 0.8), sunBody);

      // Warm radial sun corona
      float corona = pow(max(0.0, 1.0 - sunDist / 0.9), 3.0);
      col += u_col1 * corona * (0.8 + u_bass * 0.4);
    }

    // --- Surface Shading for Hit Geometry ---
    if (hit > 0.5) {
      vec3 pos = ro + rd * t;

      if (matType < 0.5) {
        // === HIGHWAY PAVEMENT & WET REFLECTIONS ===
        col = mix(vec3(0.03, 0.03, 0.05), u_col2 * 0.08, 0.5); // Rich dark asphalt

        float laneX = abs(pos.x);

        // Continuous Center Double Neon Divider Line
        if (laneX < 0.16) {
          float dash = smoothstep(0.15, 0.25, fract(pos.z * 1.2));
          col += mix(u_col1, vec3(1.0, 0.95, 0.8), 0.6) * dash * (2.8 + u_bass * 2.0);
        }

        // Secondary Lane Markers
        if (abs(laneX - 0.95) < 0.06) {
          float dash2 = smoothstep(0.2, 0.35, fract(pos.z * 0.8));
          col += u_col2 * dash2 * (1.8 + u_mid * 1.5);
        }

        // Glowing Highway Guardrails
        if (abs(laneX - 1.95) < 0.08) {
          col += u_col1 * (2.5 + u_bass * 1.8);
        }

        // Wet Highway Specular Surface Reflection
        float wetSpecular = pow(max(0.0, -rd.y), 0.4) * smoothstep(25.0, 0.0, pos.y);
        vec3 reflectCol = mix(u_col1, u_col2, 0.5) * (0.35 + u_bass * 0.45);
        col += reflectCol * wetSpecular;

      } else {
        // === SKYSCRAPERS & NEON ARCHITECTURE ===
        col = vec3(0.04, 0.04, 0.06); // Dark architectural facade

        // Skyscraper Corner Neon Trims (Vertical laser tracks)
        vec2 localCell = mod(vec2(abs(pos.x) - 2.0, pos.z), vec2(1.9, 3.4)) - vec2(0.95, 1.7);
        float edgeX = abs(abs(localCell.x) - 0.38);
        float edgeZ = abs(abs(localCell.y) - 0.66);
        if (edgeX < 0.04 || edgeZ < 0.04) {
          col += u_col1 * (1.6 + u_mid * 2.2);
        }

        // Dense Anti-Aliased Window Grid
        vec2 winUV = vec2(pos.y * 3.8, pos.z * 2.8);
        vec2 winFract = fract(winUV);
        float winShape = smoothstep(0.12, 0.22, winFract.x) * smoothstep(0.88, 0.78, winFract.x) *
                         smoothstep(0.15, 0.25, winFract.y) * smoothstep(0.85, 0.75, winFract.y);

        float winRandom = hash(cellID * 7.1 + floor(winUV));
        if (winRandom > 0.38) {
          vec3 winTint = mix(u_col2, u_col3, fract(winRandom * 5.0));
          col += winTint * winShape * (1.3 + u_treble * 1.8);
        }

        // Rooftop Neon Beacons and Holographic Antennas
        if (fract(pos.y * 0.45) > 0.75) {
          col += u_col3 * (sin(u_time * 6.0 + cellID.x) * 0.5 + 0.5) * 1.5;
        }
      }

      // Volumetric Atmospheric Depth Fog (Cyan / Magenta Neon Haze)
      float fogDensity = 1.0 - exp(-t * 0.065);
      vec3 neonFog = mix(u_col2, u_col1, 0.45) * (0.35 + u_bass * 0.25);
      col = mix(col, neonFog, fogDensity);
    }

    // Moving Cyber Traffic Light Streams (Headlights & Taillights)
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float vY = 0.35 + fi * 0.4;
      float vX = (fi - 1.5) * 0.55;
      float vZ = mod(-u_time * (9.0 + fi * 3.5), 32.0) - 16.0;
      float dV = length(uv - vec2(vX / max(abs(vZ), 0.8), (vY - 1.15) / max(abs(vZ), 0.8)));

      if (vZ < 0.0) {
        // Red taillights
        col += vec3(1.0, 0.2, 0.1) * smoothstep(0.045, 0.0, dV) * 2.5;
      } else {
        // Cyan / white headlights
        col += vec3(0.5, 0.9, 1.0) * smoothstep(0.045, 0.0, dV) * 2.5;
      }
    }

    // Bass beat flash across the entire city skyline
    col += u_col1 * u_beat * 0.22;

    // Projector tone curve (vibrant colors, deep contrast)
    col = pow(max(col, vec3(0.0)), vec3(1.15));

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
