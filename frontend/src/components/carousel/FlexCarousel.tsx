import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { coverPair, hashString, hexAlpha } from "../../utils/cover";
import { FlexCarouselFallback } from "./FlexCarouselFallback";

export interface FlexCarouselItem {
  slug: string;
  title: string;
  subtitle?: string | null;
  /** Absolute URL of the cover image; procedural art is used when absent. */
  image?: string | null;
  href: string;
}

const AUTOPLAY_MS = 4500;

const VERT = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uAlpha;
uniform float uPlaneAspect;
uniform float uTextureAspect;
varying vec2 vUv;
void main() {
  // Cover-fit: crop the longer axis so any aspect fills the plane.
  vec2 uv = vUv;
  float scaleX = 1.0;
  float scaleY = 1.0;
  if (uTextureAspect > uPlaneAspect) {
    scaleX = uPlaneAspect / uTextureAspect;
  } else {
    scaleY = uTextureAspect / uPlaneAspect;
  }
  uv = vec2((uv.x - 0.5) * scaleX + 0.5, (uv.y - 0.5) * scaleY + 0.5);
  vec3 color = texture2D(uMap, uv).rgb;
  // Graduated darkening toward the bottom edge keeps captions legible.
  float shade = 1.0 - smoothstep(0.0, 0.78, vUv.y);
  color = mix(color, color * 0.28, shade * 0.6);
  gl_FragColor = vec4(color, uAlpha);
}`;

/** Deterministic procedural cover art when a project has no image. */
function drawCoverCanvas(slug: string): HTMLCanvasElement {
  const [from, to] = coverPair(slug);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return canvas;

  let seed = hashString(slug) % 2147483647 || 1;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const base = ctx.createLinearGradient(0, 0, 640, 400);
  base.addColorStop(0, "#151322");
  base.addColorStop(1, "#0b0a14");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 640, 400);

  // Brand gradient beam.
  const beam = ctx.createLinearGradient(0, 400, 640, 0);
  beam.addColorStop(0, hexAlpha(from, 0.85));
  beam.addColorStop(0.55, hexAlpha(to, 0.5));
  beam.addColorStop(1, "rgba(8, 7, 16, 0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.moveTo(640 * rand(), 400);
  ctx.lineTo(640, 400 * rand());
  ctx.lineTo(640, 400);
  ctx.closePath();
  ctx.fillStyle = beam;
  ctx.fill();

  // Soft glow orbs.
  for (let i = 0; i < 3; i += 1) {
    const cx = 640 * rand();
    const cy = 400 * rand();
    const r = 90 + 160 * rand();
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    glow.addColorStop(0, i % 2 === 0 ? hexAlpha(from, 0.35) : hexAlpha(to, 0.35));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 640, 400);
  }

  // Faint grid.
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(247,247,251,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 400);
    ctx.stroke();
  }
  for (let y = 0; y <= 400; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Vignette.
  const vignette = ctx.createRadialGradient(320, 200, 120, 320, 200, 460);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(4,3,10,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 640, 400);

  return canvas;
}

function supportsWebGL2(): boolean {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

interface CarouselState {
  position: number;
  target: number;
  dragging: boolean;
  autoT: number;
}

/**
 * FlexCarousel — a WebGL2 cover-flow carousel built on OGL.
 *
 * - Smooth horizontal motion via frame-rate-independent damping
 * - Pointer drag with fling velocity, wheel, and keyboard navigation
 * - Autoplay that pauses on hover, drag, and off-screen; reduced motion or
 *   missing WebGL2 falls back to a scroll-snap DOM version
 * - Click a side card to focus it; click the focused card to open the project
 * - Procedural canvas cover art for items without images
 */
export function FlexCarousel({ items }: { items: FlexCarouselItem[] }) {
  const webgl = useMemo(supportsWebGL2, []);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  if (!webgl || reduced || items.length === 0) {
    return <FlexCarouselFallback items={items} />;
  }
  return <WebGLCarousel items={items} />;
}

function WebGLCarousel({ items }: { items: FlexCarouselItem[] }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const stateRef = useRef<CarouselState>({ position: 0, target: 0, dragging: false, autoT: 0 });
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const n = items.length;

  const goTo = useCallback((delta: number) => {
    stateRef.current.target += delta;
    stateRef.current.autoT = 0;
  }, []);

  const goToIndex = useCallback(
    (target: number) => {
      const current = ((Math.round(stateRef.current.target) % n) + n) % n;
      let delta = ((target - current) % n + n) % n;
      if (delta > n / 2) delta -= n;
      stateRef.current.target += delta;
      stateRef.current.autoT = 0;
    },
    [n],
  );

  const onKey = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(1);
      else if (event.key === "ArrowLeft") goTo(-1);
      else if (event.key === "Home") goToIndex(0);
      else if (event.key === "End") goToIndex(n - 1);
    },
    [goTo, goToIndex, n],
  );

  // Re-init the scene only when the actual content changes (not array identity).
  const itemsKey = useMemo(() => items.map((item) => `${item.slug}:${item.image ?? ""}`).join("|"), [items]);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage === null) return;
    const state = stateRef.current;
    const currentItems = itemsRef.current;
    const count = currentItems.length;

    const canvas = document.createElement("canvas");
    canvas.className = "fc-canvas";
    stage.appendChild(canvas);

    const renderer = new Renderer({ canvas, alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    renderer.disable(gl.DEPTH_TEST);
    renderer.enable(gl.BLEND);
    renderer.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const camera = new Camera(gl, { fov: 35, near: 0.1, far: 50 });
    const camZ = 4.2;
    camera.position.set(0, 0, camZ);

    const scene = new Transform();
    const geometry = new Plane(gl, { width: 1, height: 1 });

    const meshes: Array<{ mesh: Mesh; program: Program }> = currentItems.map((item) => {
      const texture = new Texture(gl, { image: drawCoverCanvas(item.slug), generateMipmaps: true });
      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        transparent: true,
        uniforms: {
          uMap: { value: texture },
          uAlpha: { value: 0 },
          uPlaneAspect: { value: 1.6 },
          uTextureAspect: { value: 1.6 },
        },
      });
      if (item.image !== undefined && item.image !== null && item.image !== "") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          texture.image = img;
          texture.needsUpdate = true;
          program.uniforms.uTextureAspect.value = img.naturalWidth / Math.max(img.naturalHeight, 1);
        };
        img.src = item.image;
      }
      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      return { mesh, program };
    });

    /* ---------- sizing ---------- */
    let planeW = 1;
    let planeH = 1;
    let spacing = 1;
    let pxPerWorld = 1;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      renderer.setSize(width, height);
      camera.perspective({ fov: 35, aspect: width / height });
      const visibleH = 2 * Math.tan((35 / 2) * (Math.PI / 180)) * camZ;
      const visibleW = visibleH * (width / height);
      planeH = visibleH * 0.5;
      planeW = Math.min(planeH * 1.62, visibleW * 0.44);
      spacing = planeW * 1.05;
      pxPerWorld = width / visibleW;
      const aspect = planeW / planeH;
      for (const { program } of meshes) program.uniforms.uPlaneAspect.value = aspect;
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    /* ---------- helpers ---------- */
    const wrapOffset = (value: number) => ((value % count) + count + count / 2) % count - count / 2;

    // Camera sits at (0,0,camZ) looking down -Z, so view space is a simple
    // translation; project a world point through the projection matrix.
    const project = (worldX: number, worldY: number, worldZ: number) => {
      const p = camera.projectionMatrix;
      const viewX = worldX;
      const viewY = worldY;
      const viewZ = worldZ - camZ;
      const clipX = p[0] * viewX + p[4] * viewY + p[8] * viewZ + p[12];
      const clipY = p[1] * viewX + p[5] * viewY + p[9] * viewZ + p[13];
      const clipW = p[3] * viewX + p[7] * viewY + p[11] * viewZ + p[15];
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clipX / clipW) * 0.5 + 0.5) * rect.width,
        y: (1 - ((clipY / clipW) * 0.5 + 0.5)) * rect.height,
      };
    };

    const hitTest = (clientX: number, clientY: number): number | null => {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      let best: number | null = null;
      let bestDist = Infinity;
      meshes.forEach(({ mesh }, i) => {
        const center = project(mesh.position.x, mesh.position.y, mesh.position.z);
        const right = project(mesh.position.x + mesh.scale.x / 2, mesh.position.y, mesh.position.z);
        const top = project(mesh.position.x, mesh.position.y + mesh.scale.y / 2, mesh.position.z);
        const halfW = Math.abs(right.x - center.x);
        const halfH = Math.abs(center.y - top.y);
        if (px >= center.x - halfW && px <= center.x + halfW && py >= center.y - halfH && py <= center.y + halfH) {
          const dist = Math.abs(px - center.x);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
      });
      return best;
    };

    /* ---------- interaction ---------- */
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let moved = 0;
    let downTime = 0;
    let velocity = 0;
    let lastMoveTime = 0;
    let lastPointerX = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = event.pointerId;
      try {
        canvas.setPointerCapture(pointerId);
      } catch {
        /* capture is best-effort */
      }
      startX = event.clientX;
      startY = event.clientY;
      lastPointerX = event.clientX;
      moved = 0;
      downTime = performance.now();
      lastMoveTime = downTime;
      velocity = 0;
      state.dragging = true;
      state.autoT = 0;
      stage.classList.add("dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const now = performance.now();
      moved = Math.max(moved, Math.hypot(event.clientX - startX, event.clientY - startY));
      const dx = event.clientX - lastPointerX;
      // Flings are tracked in items per second (low-pass filtered).
      const dt = Math.max((now - lastMoveTime) / 1000, 1 / 240);
      const deltaItems = -dx / (pxPerWorld * spacing);
      velocity = velocity * 0.7 + (deltaItems / dt) * 0.3;
      // Dragging moves position and target together so there is no snap-back.
      state.position -= dx / (pxPerWorld * spacing);
      state.target = state.position;
      lastPointerX = event.clientX;
      lastMoveTime = now;
    };

    const endDrag = (fling: boolean) => {
      if (!state.dragging) return;
      state.dragging = false;
      stage.classList.remove("dragging");
      state.target = Math.round(state.position + (fling ? velocity * 0.25 : 0));
      state.autoT = 0;
      pointerId = null;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const quickTap = moved < 8 && performance.now() - downTime < 500;
      if (!quickTap) {
        endDrag(true);
        return;
      }
      state.dragging = false;
      stage.classList.remove("dragging");
      pointerId = null;
      const hit = hitTest(event.clientX, event.clientY);
      if (hit === null) {
        state.target = Math.round(state.position);
      } else {
        const focused = ((Math.round(state.target) % count) + count) % count;
        if (hit === focused) {
          navigate(itemsRef.current[hit]!.href);
        } else {
          let delta = ((hit - focused) % count + count) % count;
          if (delta > count / 2) delta -= count;
          state.target += delta;
        }
      }
      state.autoT = 0;
    };

    const onPointerCancel = () => {
      endDrag(false);
    };

    let lastWheel = 0;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 6) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel < 380 || Math.abs(state.target - state.position) > 0.4) return;
      lastWheel = now;
      state.target += delta > 0 ? 1 : -1;
      state.autoT = 0;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* ---------- render loop ---------- */
    const hoveredRef = { current: false };
    const onEnter = () => {
      hoveredRef.current = true;
    };
    const onLeave = () => {
      hoveredRef.current = false;
    };
    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let running = true;
    let last = performance.now();

    const frame = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Autoplay pauses on hover, drag, and hidden tab.
      if (count > 1 && !state.dragging && !hoveredRef.current && !document.hidden) {
        state.autoT += dt;
        if (state.autoT >= AUTOPLAY_MS / 1000) {
          state.autoT = 0;
          state.target += 1;
        }
      }

      state.position += (state.target - state.position) * (1 - Math.exp(-6 * dt));

      const rounded = ((Math.round(state.position) % count) + count) % count;
      if (rounded !== indexRef.current) {
        indexRef.current = rounded;
        setIndex(rounded);
      }

      meshes.forEach(({ mesh, program }, i) => {
        const offset = wrapOffset(i - state.position);
        const absOffset = Math.min(Math.abs(offset), 2.75);
        mesh.position.x = offset * spacing;
        mesh.position.z = -absOffset * 0.55;
        mesh.rotation.y = -offset * 0.22;
        const scale = 1 - absOffset * 0.1;
        mesh.scale.set(planeW * scale, planeH * scale, 1);
        program.uniforms.uAlpha.value = Math.max(0.05, 1 - absOffset * 0.42);
      });

      renderer.render({ scene, camera });
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame();
    };

    // Pause the loop entirely while off-screen.
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !running) {
          running = true;
          last = performance.now();
          loop();
        } else if (!visible && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.15 },
    );
    intersectionObserver.observe(stage);

    loop();

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("wheel", onWheel);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [itemsKey, navigate]);

  const item = items[index]!;

  return (
    <div
      className="fc-root"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured projects"
      tabIndex={0}
      onKeyDown={onKey}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="fc-stage" ref={stageRef}>
        <div className="fc-hint" aria-hidden="true">
          <Hand size={13} /> Drag · Click · Scroll
        </div>

        <div className="fc-caption" key={index} aria-live="polite">
          <p className="fc-caption-title">{item.title}</p>
          {item.subtitle ? (
            <p className="fc-caption-sub">
              <span className="dot" aria-hidden="true" />
              {item.subtitle}
            </p>
          ) : null}
        </div>

        <div className="fc-controls">
          <button type="button" className="btn-icon" onClick={() => goTo(-1)} aria-label="Previous project">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className="btn-icon" onClick={() => goTo(1)} aria-label="Next project">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        {n > 1 ? (
          <div className={`fc-progress${hovered ? "" : " visible"}`} aria-hidden="true">
            <div
              className="fc-progress-bar"
              key={index}
              style={{
                animation: `fc-progress ${AUTOPLAY_MS}ms linear forwards`,
                animationPlayState: hovered ? "paused" : "running",
              }}
            />
          </div>
        ) : null}

        <div className="fc-dots" role="tablist" aria-label="Choose slide">
          {items.map((dot, i) => (
            <button
              key={dot.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${dot.title}`}
              className={`fc-dot${i === index ? " active" : ""}`}
              onClick={() => goToIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
