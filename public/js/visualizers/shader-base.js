/**
 * ShaderVisualizerBase - High-performance WebGL 1.0/2.0 Shader Engine
 * Provides boilerplate for fullscreen GLSL fragment shaders with audio uniforms.
 */

class ShaderVisualizerBase extends BaseVisualizer {
  constructor(canvas, name, fragmentShaderSource) {
    super(canvas);
    this.name = name;
    this.fsSource = fragmentShaderSource;
    this.gl = null;
    this.program = null;
    this.time = 0;
    this.beatPulse = 0;
    this.audioTexture = null;
    this.audioTexData = new Uint8Array(48 * 4); // RGBA texture for 48 bands
  }

  init() {
    this.gl = this.canvas.getContext('webgl', { 
      antialias: false, 
      powerPreference: 'high-performance',
      depth: false,
      alpha: false
    });
    if (!this.gl) {
      console.error(`WebGL not supported for ${this.name}`);
      return;
    }

    const vsSource = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    this.program = this.createProgram(vsSource, this.fsSource);
    if (!this.program) return;

    const gl = this.gl;
    const quad = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    this.posLoc = gl.getAttribLocation(this.program, 'a_pos');

    // Create 1D Audio Spectrum Texture (48x1)
    this.audioTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Uniform locations cache
    this.locs = {
      res: gl.getUniformLocation(this.program, 'u_res'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      bass: gl.getUniformLocation(this.program, 'u_bass'),
      mid: gl.getUniformLocation(this.program, 'u_mid'),
      treble: gl.getUniformLocation(this.program, 'u_treble'),
      vol: gl.getUniformLocation(this.program, 'u_vol'),
      beat: gl.getUniformLocation(this.program, 'u_beat'),
      beatIntensity: gl.getUniformLocation(this.program, 'u_beat_intensity'),
      col1: gl.getUniformLocation(this.program, 'u_col1'),
      col2: gl.getUniformLocation(this.program, 'u_col2'),
      col3: gl.getUniformLocation(this.program, 'u_col3'),
      audioTex: gl.getUniformLocation(this.program, 'u_audio_tex')
    };
  }

  createShader(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compile error in ${this.name}:`, gl.getShaderInfoLog(shader));
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
      console.error(`Program link error in ${this.name}:`, gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  render(audio, dt) {
    if (!this.gl || !this.program) return;
    const gl = this.gl;

    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);

    this.time += dt * (0.8 + audio.smoothVol * 1.6);
    if (audio.isBeat) this.beatPulse = 1.0;
    this.beatPulse *= Math.max(0, 1.0 - dt * 5.0);

    // Update 1D Audio Spectrum Texture
    if (this.audioTexture && audio.smoothedBands) {
      const bands = audio.smoothedBands;
      for (let i = 0; i < 48; i++) {
        const val = Math.min(255, Math.floor((bands[i] || 0) * 255));
        const idx = i * 4;
        this.audioTexData[idx] = val;
        this.audioTexData[idx + 1] = val;
        this.audioTexData[idx + 2] = val;
        this.audioTexData[idx + 3] = 255;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 48, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.audioTexData);
      if (this.locs.audioTex) gl.uniform1i(this.locs.audioTex, 0);
    }

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
    if (this.locs.beatIntensity) gl.uniform1f(this.locs.beatIntensity, audio.beatIntensity);

    gl.uniform3f(this.locs.col1, rgb1.r / 255.0, rgb1.g / 255.0, rgb1.b / 255.0);
    gl.uniform3f(this.locs.col2, rgb2.r / 255.0, rgb2.g / 255.0, rgb2.b / 255.0);
    gl.uniform3f(this.locs.col3, rgb3.r / 255.0, rgb3.g / 255.0, rgb3.b / 255.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy() {
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.audioTexture) this.gl.deleteTexture(this.audioTexture);
      if (this.quadBuffer) this.gl.deleteBuffer(this.quadBuffer);
    }
  }
}

if (typeof window !== 'undefined') {
  window.ShaderVisualizerBase = ShaderVisualizerBase;
}
