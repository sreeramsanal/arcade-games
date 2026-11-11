import React, { useEffect, useRef, useState } from 'react';
import { storageService } from '../services/storageService';

interface HeroShaderProps {
  isLightMode?: boolean;
}

export const HeroShader: React.FC<HeroShaderProps> = ({ isLightMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentIsLight, setCurrentIsLight] = useState<boolean>(() => {
    if (typeof isLightMode === 'boolean') return isLightMode;
    return storageService.getTheme() === 'light';
  });

  useEffect(() => {
    if (typeof isLightMode === 'boolean') {
      setCurrentIsLight(isLightMode);
      return;
    }
    const unsub = storageService.subscribe(data => {
      setCurrentIsLight(data.theme === 'light');
    });
    return () => unsub();
  }, [isLightMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let mouse = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };

    const syncSize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 580;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Stitch Dark Theme Shader: Obsidian void with undulating laser ribbons, diagonal grid, and ember particles
    const fsDark = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        vec2 m = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        uv += m * 0.12;

        float t = u_time * 0.65;
        vec3 col = vec3(0.05, 0.055, 0.08);

        for (float i = 1.0; i <= 5.0; i += 1.0) {
          float speed = t * (0.8 + i * 0.25);
          float freq = 2.0 + i * 0.85;
          float amp = 0.16 + i * 0.035;
          float yOffset = sin(uv.x * freq + speed) * amp 
                        + cos(uv.x * (freq * 0.5) - speed * 0.7) * (amp * 0.6)
                        + sin(uv.x * 1.2 + t * 0.4 + i) * 0.08;
          float dist = abs(uv.y - yOffset + (i - 3.0) * 0.12);
          float beamGlow = 0.018 / (dist + 0.015);
          float softGlow = 0.045 / (dist + 0.18);
          vec3 beamColor = mix(vec3(1.0, 0.16, 0.29), vec3(1.0, 0.35, 0.12), sin(uv.x * 2.0 + t + i) * 0.5 + 0.5);
          col += beamColor * (beamGlow * 0.65 + softGlow * 0.35);
        }

        float gridCoordY = uv.y * 3.5 - uv.x * 1.2 + t * 0.3;
        float gridPulse = smoothstep(0.02, 0.0, abs(fract(gridCoordY) - 0.5));
        col += vec3(0.8, 0.1, 0.2) * gridPulse * 0.08 * smoothstep(0.4, -0.6, uv.y);

        float radial = length(uv - vec2(0.0, -0.05));
        col += vec3(1.0, 0.12, 0.25) * (0.16 / (radial * 2.5 + 0.8));

        vec2 screenUV = gl_FragCoord.xy / u_resolution.xy;
        float vignette = screenUV.x * screenUV.y * (1.0 - screenUV.x) * (1.0 - screenUV.y);
        col *= clamp(16.0 * pow(vignette, 0.32), 0.0, 1.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // Stitch Light Theme Shader: Alabaster / snow canvas with simplex noise plasma, crimson/amber/cyan caustic ribbons, and cyber grid
    const fsLight = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        vec2 mouse = u_mouse / u_resolution.xy;
        p += (mouse - 0.5) * 0.15;

        float t = u_time * 0.35;

        float n1 = snoise(p * 1.5 + vec2(t * 0.4, -t * 0.2));
        float n2 = snoise(p * 2.8 - vec2(t * 0.3, t * 0.5) + n1 * 0.5);
        float n3 = snoise(p * 5.0 + vec2(sin(t * 0.5), cos(t * 0.4)) * 0.5 + n2 * 0.4);

        float combined = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15);

        vec3 baseColor = vec3(0.965, 0.975, 0.99); 
        vec3 softTint = vec3(0.93, 0.95, 0.98);
        vec3 crimsonGlow = vec3(1.0, 0.165, 0.294);
        vec3 amberGlow = vec3(0.98, 0.62, 0.08);
        vec3 cyberBlue = vec3(0.0, 0.72, 0.96);

        float ribbon1 = smoothstep(0.12, 0.0, abs(combined - 0.2));
        float ribbon2 = smoothstep(0.08, 0.0, abs(combined + 0.15));
        float ribbon3 = smoothstep(0.18, 0.0, abs(combined - 0.45));

        vec3 col = mix(baseColor, softTint, uv.y);
        col = mix(col, col + crimsonGlow * 0.08, smoothstep(-0.3, 0.6, combined));
        col = mix(col, col + amberGlow * 0.06, smoothstep(0.0, 0.8, n2));

        col = mix(col, crimsonGlow, ribbon1 * 0.22);
        col = mix(col, amberGlow, ribbon2 * 0.18);
        col = mix(col, cyberBlue, ribbon3 * 0.14);

        float vignette = smoothstep(1.4, 0.2, length(p * vec2(0.8, 1.2)));
        col = mix(baseColor, col, vignette);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (!gl) return;

      const createShader = (type: number, src: string) => {
        const shader = gl!.createShader(type);
        if (!shader) return null;
        gl!.shaderSource(shader, src);
        gl!.compileShader(shader);
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fsSource = currentIsLight ? fsLight : fsDark;
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (!vs || !fs) return;

      program = gl.createProgram();
      if (!program) return;

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]), gl.STATIC_DRAW);

      const pos = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(program, 'u_time');
      const uRes = gl.getUniformLocation(program, 'u_resolution');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');

      const render = (time: number) => {
        if (!gl || !canvas) return;
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, time * 0.001);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
        if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    } catch (e) {
      console.warn('WebGL Shader initialization fallback', e);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [currentIsLight]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ opacity: currentIsLight ? 0.85 : 0.95 }}
      />
    </div>
  );
};

export default HeroShader;
