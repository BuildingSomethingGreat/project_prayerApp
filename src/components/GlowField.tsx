import { useEffect, useRef, useState } from "react";
import { PALETTES } from "../content/palettes";
import type { SceneId } from "../lib/types";

/**
 * Light that pools and drifts behind the controls, drawn on the GPU.
 *
 * A fragment shader sums a handful of slowly orbiting sources into one smooth
 * field, bends it with flowing noise so the forms never look geometric, and
 * turns the field into a bright body with a long glowing falloff. The result is
 * composited as light over the backdrop. One canvas serves every screen, so the
 * glow carries through navigation instead of restarting.
 */

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uSize;
uniform float uTime;
uniform float uLevel;   // overall strength, 0-1
uniform float uEnergy;  // 0 at rest, 1 while the voice is speaking
uniform vec2 uPointer;  // -1..1, eased
uniform vec3 uDeep;
uniform vec3 uBody;
uniform vec3 uCore;

// Simplex noise, after Ian McEwan / Ashima Arts.
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// One source of light: a soft inverse-square bump.
float source(vec2 uv, vec2 at, float r) {
  vec2 d = uv - at;
  return (r * r) / (dot(d, d) + r * r * 0.35);
}

void main() {
  // x runs -aspect..aspect, y runs 0 at the bottom edge to 1 at the top of the canvas.
  float aspect = uSize.x / uSize.y;
  vec2 uv = vec2((gl_FragCoord.x / uSize.x * 2.0 - 1.0) * aspect, gl_FragCoord.y / uSize.y);
  float t = uTime * (0.055 + 0.03 * uEnergy);

  // Bend space with two scales of slow flowing noise, so the light reads as one
  // liquid mass with wandering edges rather than as separate round sources.
  vec2 flow = vec2(snoise(uv * 0.55 + vec2(t * 1.3, -t)), snoise(uv * 0.55 + vec2(-t, t * 1.1) + 7.3));
  flow += 0.22 * vec2(snoise(uv * 1.15 + vec2(-t * 1.7, t * 0.6) + 3.1), snoise(uv * 1.15 + vec2(t * 0.9, t * 1.5) + 11.7));
  vec2 q = uv + flow * (0.15 + 0.04 * uEnergy);

  // Sources sit low, mostly below the edge, so what shows is their rolling crest.
  // On a narrow screen they shrink, or they would fill it.
  float w = min(aspect, 1.5);
  float s = clamp(aspect / 1.5, 0.6, 1.0);
  float breath = 0.5 + 0.5 * sin(uTime * (0.5 + 0.5 * uEnergy));
  float f = 0.0;
  f += source(q, vec2(-0.50 * w + 0.20 * sin(t * 2.1), -0.10 + 0.08 * sin(t * 1.7 + 1.0)), 0.34 * s);
  f += source(q, vec2( 0.52 * w + 0.18 * cos(t * 1.6 + 2.0), -0.12 + 0.09 * cos(t * 2.3)), 0.31 * s);
  f += source(q, vec2( 0.04 + 0.30 * w * sin(t * 1.2 + 4.0), -0.20 + 0.07 * sin(t * 2.9 + 0.5)), 0.40 * s);
  f += source(q, vec2( 0.26 * w * cos(t * 2.6 + 1.0) + uPointer.x * 0.12, 0.08 + 0.08 * sin(t * 2.0 + 3.0) + uPointer.y * 0.04), (0.16 + 0.03 * breath * (0.4 + uEnergy)) * s);
  f += source(q, vec2(-0.22 * w * sin(t * 1.9 + 2.5), 0.03 + 0.07 * cos(t * 1.4 + 5.0)), 0.14 * s);

  // A soft-edged body, and a long glow reaching beyond it.
  float body = smoothstep(1.0, 2.6, f);
  float halo = smoothstep(0.12, 1.4, f);
  float core = smoothstep(2.2, 3.6, f);

  // Colour shifts across the form: deep at the rim, hot at the heart.
  float hue = 0.5 + 0.5 * snoise(q * 0.7 + vec2(t * 0.8, 3.0));
  vec3 col = mix(uDeep, uBody, smoothstep(0.15, 0.95, body + hue * 0.35));
  col = mix(col, uCore, core * (0.55 + 0.25 * breath));

  float light = halo * 0.34 + body * 0.5 + core * 0.18;

  // Fade out towards the top of the canvas so it never reaches the words.
  light *= smoothstep(0.95, 0.2, uv.y);

  // Grain, so it sits in the same film as everything else, and to prevent banding.
  float n = hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5;
  light = clamp(light + n * 0.035, 0.0, 1.0) * uLevel;

  gl_FragColor = vec4(col * light, light); // premultiplied
}
`;

interface Props {
  scene: SceneId;
  /** 0 hides the light, 1 is full strength. */
  level: number;
  /** True while the voice is speaking: the light moves and breathes more. */
  lively: boolean;
}

export function GlowField({ scene, level, lively }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);
  // The draw loop reads these, so props can change without rebuilding the GL program.
  const target = useRef({ scene, level, lively });
  useEffect(() => {
    target.current = { scene, level, lively };
  }, [scene, level, lively]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) {
      setSupported(false);
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setSupported(false);
      return;
    }
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const u = Object.fromEntries(["uSize", "uTime", "uLevel", "uEnergy", "uPointer", "uDeep", "uBody", "uCore"].map((name) => [name, gl.getUniformLocation(program, name)]));

    // The forms are soft, so half resolution is indistinguishable and far cheaper.
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
      el.width = Math.max(2, Math.round(el.clientWidth * scale));
      el.height = Math.max(2, Math.round(el.clientHeight * scale));
      gl.viewport(0, 0, el.width, el.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = 1 - (e.clientY / window.innerHeight) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Everything eases towards its target, so a change of screen or scene is a slow turn, not a cut.
    const now = { level: 0, energy: 0, colors: PALETTES[target.current.scene].map((c) => [...c]) };
    let frame = 0;
    let last = performance.now();
    let time = 40; // start mid-motion rather than from a symmetrical first frame

    const draw = (stamp: number) => {
      const dt = Math.min((stamp - last) / 1000, 0.1);
      last = stamp;
      if (!still) time += dt;

      const want = target.current;
      const ease = 1 - Math.exp(-dt * 2.2);
      now.level += (want.level - now.level) * ease;
      now.energy += ((want.lively ? 1 : 0) - now.energy) * ease;
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      PALETTES[want.scene].forEach((color, i) => color.forEach((channel, j) => (now.colors[i][j] += (channel - now.colors[i][j]) * ease * 0.6)));

      gl.uniform2f(u.uSize, el.width, el.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uLevel, still ? want.level : now.level);
      gl.uniform1f(u.uEnergy, now.energy);
      gl.uniform2f(u.uPointer, pointer.x, pointer.y);
      gl.uniform3fv(u.uDeep, now.colors[0]);
      gl.uniform3fv(u.uBody, now.colors[1]);
      gl.uniform3fv(u.uCore, now.colors[2]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Reduced motion: keep redrawing so level and scene changes still land, but time stands still.
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : cancelAnimationFrame(frame));
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  // Without WebGL, a still wash of the same light.
  if (!supported) return <div className="glowfield glowfield--flat" style={{ opacity: level * 0.7 }} aria-hidden />;
  return <canvas ref={canvas} className="glowfield" aria-hidden />;
}
