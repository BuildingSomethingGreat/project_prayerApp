import { useEffect, useRef, useState } from "react";
import type { SceneId } from "../lib/types";
import { PALETTES } from "../content/palettes";

/**
 * The voice, made visible. A soft sphere of light whose edge ripples with the
 * loudness of the speech, ringed by faint waves that widen as she speaks. It
 * is what the player shows in place of words and controls.
 *
 * Drawn in a WebGL fragment shader. `level` is read every frame, so the orb
 * follows the voice without React re-rendering.
 */

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uSize;
uniform float uTime;
uniform float uLevel;  // loudness now, smoothed, 0-1
uniform float uSwell;  // slower follower of loudness: the orb's overall size
uniform float uAwake;  // 0 paused, 1 playing
uniform vec3 uDeep;
uniform vec3 uBody;
uniform vec3 uCore;

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

void main() {
  vec2 uv = (gl_FragCoord.xy / uSize) * 2.0 - 1.0;
  float r = length(uv);
  vec2 dir = uv / max(r, 0.0001);
  float t = uTime;

  // The edge: a slow organic wobble always, and a quicker ripple driven by the voice.
  float slow = snoise(dir * 1.0 + t * 0.22);
  float quick = snoise(dir * 1.7 - t * 0.9) * 0.7 + snoise(dir * 3.1 + t * 1.5) * 0.3;
  float breath = 0.012 * sin(t * 0.9);
  // Mostly the whole sphere swells with the voice; the edge only ripples a little, so it stays round.
  float R = 0.39 + breath + 0.022 * slow + uSwell * 0.06 + uLevel * (0.035 + 0.04 * quick);

  // Body: lit from the upper left, deep at the rim, so it reads as a sphere of light.
  float inside = smoothstep(R, R - 0.035, r);
  vec2 lit = uv - vec2(-0.1, 0.12);
  float depth = clamp(length(lit) / max(R, 0.001), 0.0, 1.0);
  vec3 col = mix(uCore, uBody, smoothstep(0.0, 0.75, depth));
  col = mix(col, uDeep, smoothstep(0.6, 1.05, depth));
  // Light moving inside it, like something alive.
  float inner = snoise(uv * 2.2 + vec2(t * 0.25, -t * 0.18)) * 0.5 + 0.5;
  col += uCore * 0.22 * inner * (0.4 + uLevel);
  float alpha = inside * 0.96;

  // Glow beyond the edge, stronger as she speaks.
  float out_ = max(r - R, 0.0);
  float glow = exp(-out_ * (9.0 - 3.5 * uSwell)) * (0.34 + 0.4 * uLevel) * (1.0 - inside);
  col = mix(col, mix(uBody, uCore, 0.35), (1.0 - inside));
  alpha += glow;

  // Rings of sound: three faint waves that travel outward and tremble with the voice.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float phase = fract(t * 0.16 + fi / 3.0);
    float ringR = R + 0.05 + phase * 0.5;
    float wobble = 0.018 * uLevel * snoise(dir * (3.0 + fi) + t * 1.4 + fi * 7.0);
    float ring = smoothstep(0.012, 0.0, abs(r - ringR - wobble));
    alpha += ring * (1.0 - phase) * (0.05 + 0.3 * uSwell) * uAwake;
  }

  // Grain, and a soft square-to-circle fade so the canvas edge never shows.
  alpha += (hash(gl_FragCoord.xy + fract(t) * 37.0) - 0.5) * 0.03 * step(0.02, alpha);
  alpha *= smoothstep(1.0, 0.82, r);
  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

interface Props {
  scene: SceneId;
  playing: boolean;
  /** Called every frame for the loudness of the voice right now, 0–1. */
  level: () => number;
}

export function VoiceOrb({ scene, playing, level }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);
  const live = useRef({ scene, playing, level });
  useEffect(() => {
    live.current = { scene, playing, level };
  }, [scene, playing, level]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
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
    const u = Object.fromEntries(["uSize", "uTime", "uLevel", "uSwell", "uAwake", "uDeep", "uBody", "uCore"].map((name) => [name, gl.getUniformLocation(program, name)]));

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.max(2, Math.round(el.clientWidth * scale));
      el.height = Math.max(2, Math.round(el.clientHeight * scale));
      gl.viewport(0, 0, el.width, el.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = { level: 0, swell: 0, awake: 0 };
    let frame = 0;
    let last = performance.now();
    let time = 12;

    const draw = (stamp: number) => {
      const dt = Math.min((stamp - last) / 1000, 0.1);
      last = stamp;
      if (!still) time += dt;
      const want = live.current;
      const loud = want.playing ? want.level() : 0;
      // Rise quickly with the voice and fall away more slowly, the way a meter does.
      now.level += (loud - now.level) * (1 - Math.exp(-dt * (loud > now.level ? 22 : 7)));
      now.swell += (loud - now.swell) * (1 - Math.exp(-dt * 2.4));
      now.awake += ((want.playing ? 1 : 0) - now.awake) * (1 - Math.exp(-dt * 2));

      const palette = PALETTES[want.scene];
      gl.uniform2f(u.uSize, el.width, el.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uLevel, still ? 0 : now.level);
      gl.uniform1f(u.uSwell, still ? 0.2 * now.awake : now.swell);
      gl.uniform1f(u.uAwake, now.awake);
      gl.uniform3fv(u.uDeep, palette[0]);
      gl.uniform3fv(u.uBody, palette[1]);
      gl.uniform3fv(u.uCore, [1, 0.93, 0.8]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  if (!supported) return <span className="orb__flat" data-playing={playing} aria-hidden />;
  return <canvas ref={canvas} className="orb__canvas" aria-hidden />;
}
