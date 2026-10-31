/**
 * Preset 1: LiquidAcidVisualizer (GLSL Fragment Shader on WebGL)
 * Mesmerizing organic fluid, psychedelic raymarched plasma reacting to bass drops.
 */

class LiquidAcidVisualizer extends BaseVisualizer {
  constructor(canvas) {
    super(canvas);
    this.name = "Liquid Acid";
    this.gl = null;
    this.program = null;
    this.time = 0;
    this.beatPulse = 0;
  }

  init() {
    this.gl = this.canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' });
    if (!this.gl) {
      console.error('WebGL not supported for LiquidAcid');
      return;
    }

    const vsSource = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `
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

      // 2D rotation
      mat2 rot(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
        
        // Dynamic zoom & twist from bass
        float r = length(uv);
        float a = atan(uv.y, uv.x);
        
        uv *= (1.0 - u_bass * 0.25 - u_beat * 0.15);
        uv *= rot(sin(u_time * 0.2) * 0.2 + u_bass * 0.4);

        vec2 p = uv * 2.5;
        float d = 0.0;
        
        // Fluid domain warping
        for(float i = 1.0; i <= 4.0; i++) {
          p += vec2(
            sin(p.y * 1.5 + u_time * 0.4 * i + u_bass * 2.0),
            cos(p.x * 1.5 + u_time * 0.3 * i + u_mid * 2.0)
          ) / i;
          p *= rot(0.5 + u_treble * 0.1);
        }

        float plasma = sin(p.x * 2.0) * cos(p.y * 2.0) + sin(p.x + p.y + u_time);
        plasma = 0.5 + 0.5 * plasma;

        // Chromatic aberration based on bass & treble
        float shift = (0.015 + u_bass * 0.04 + u_beat * 0.03);
        float c1 = sin((length(uv + vec2(shift, 0.0)) * 6.0) - u_time * 1.5 + plasma * 3.0);
        float c2 = sin((length(uv) * 6.0) - u_time * 1.5 + plasma * 3.0);
        float c3 = sin((length(uv - vec2(shift, 0.0)) * 6.0) - u_time * 1.5 + plasma * 3.0);

        // Mix colors according to active palette
        vec3 col = mix(u_col1, u_col2, c1 * 0.5 + 0.5);
        col = mix(col, u_col3, c3 * 0.5 + 0.5);

        // Vignette & contrast boost for projector depth
        float vig = smoothstep(1.4, 0.2, length(uv));
        col *= vig;
        
        // Beat glow center
        float centerGlow = (1.0 - smoothstep(0.0, 0.6, r)) * (u_bass * 0.8 + u_beat * 0.6);
        col += u_col1 * centerGlow;

        // Contrast curve for deep blacks
        col = pow(max(col, vec3(0.0)), vec3(1.35));

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    this.program = this.createProgram(vsSource, fsSource);
    if (!this.program) return;

    // Fullscreen quad buffer
    const gl = this.gl;
    const quad = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    this.locs = {
      res: gl.getUniformLocation(this.program, 'u_res'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      bass: gl.getUniformLocation(this.program, 'u_bass'),
      mid: gl.getUniformLocation(this.program, 'u_mid'),
      treble: gl.getUniformLocation(this.program, 'u_treble'),
      vol: gl.getUniformLocation(this.program, 'u_vol'),
      beat: gl.getUniformLocation(this.program, 'u_beat'),
      col1: gl.getUniformLocation(this.program, 'u_col1'),
      col2: gl.getUniformLocation(this.program, 'u_col2'),
      col3: gl.getUniformLocation(this.program, 'u_col3'),
    };
  }

  createShader(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vs, fs) {
    const gl = this.gl;
    const v = this.createShader(gl.VERTEX_SHADER, vs);
    const f = this.createShader(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  render(audio, dt) {
    if (!this.gl || !this.program) return;
    const gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);

    this.time += dt * (1.0 + audio.smoothVol * 1.5);
    if (audio.isBeat) this.beatPulse = 1.0;
    this.beatPulse *= Math.max(0, 1.0 - dt * 6.0);

    const rgb1 = window.hexToRgb(this.palette.primary);
    const rgb2 = window.hexToRgb(this.palette.secondary);
    const rgb3 = window.hexToRgb(this.palette.accent);

    gl.uniform2f(this.locs.res, this.width, this.height);
    gl.uniform1f(this.locs.time, this.time);
    gl.uniform1f(this.locs.bass, audio.smoothBass);
    gl.uniform1f(this.locs.mid, audio.smoothMid);
    gl.uniform1f(this.locs.treble, audio.smoothTreble);
    gl.uniform1f(this.locs.vol, audio.smoothVol);
    gl.uniform1f(this.locs.beat, this.beatPulse);

    gl.uniform3f(this.locs.col1, rgb1.r / 255.0, rgb1.g / 255.0, rgb1.b / 255.0);
    gl.uniform3f(this.locs.col2, rgb2.r / 255.0, rgb2.g / 255.0, rgb2.b / 255.0);
    gl.uniform3f(this.locs.col3, rgb3.r / 255.0, rgb3.g / 255.0, rgb3.b / 255.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy() {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

if (typeof window !== 'undefined') {
  window.LiquidAcidVisualizer = LiquidAcidVisualizer;
}
