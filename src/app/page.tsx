"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const PHOTOS: {
  src: string;
  top: number; left: number; w: number; h: number;
  rotate: number; z: number;
  mTop?: number; mLeft?: number; mW?: number; mH?: number;
}[] = [
  { src: "/images/pistol-8.jpg", top: 5, left: 25, w: 50, h: 85, rotate: 0, z: 1, mTop: 2, mLeft: 5, mW: 90, mH: 50 },
  { src: "/images/pistol-1.jpg", top: 2, left: 3, w: 28, h: 35, rotate: -4, z: 4, mTop: 1, mLeft: 2, mW: 45, mH: 28 },
  { src: "/images/pistol-2.jpg", top: 8, left: 65, w: 30, h: 42, rotate: 3, z: 3, mTop: 26, mLeft: 52, mW: 46, mH: 28 },
  { src: "/images/pistol-4.jpg", top: 38, left: 5, w: 35, h: 30, rotate: -2, z: 5, mTop: 48, mLeft: 3, mW: 50, mH: 22 },
  { src: "/images/pistol-3.jpg", top: 45, left: 55, w: 38, h: 28, rotate: 2.5, z: 4, mTop: 52, mLeft: 45, mW: 52, mH: 20 },
  { src: "/images/pistol-6.jpg", top: 62, left: 8, w: 30, h: 25, rotate: -3, z: 6, mTop: 70, mLeft: 2, mW: 48, mH: 18 },
  { src: "/images/pistol-5.jpg", top: 65, left: 45, w: 32, h: 26, rotate: 1.5, z: 5, mTop: 72, mLeft: 48, mW: 48, mH: 18 },
  { src: "/images/pistol-7.jpg", top: 82, left: 15, w: 42, h: 22, rotate: -1, z: 7, mTop: 88, mLeft: 8, mW: 55, mH: 14 },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseX, setMouseX] = useState(0.5);
  const [mouseY, setMouseY] = useState(0.5);
  const [isMobile, setIsMobile] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, speed: 0 });

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleMove = (e: MouseEvent) => {
      const mx = e.clientX / window.innerWidth;
      const my = e.clientY / window.innerHeight;
      const dx = mx - mouseRef.current.x;
      const dy = my - mouseRef.current.y;
      mouseRef.current.speed = Math.sqrt(dx * dx + dy * dy);
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = mx;
      mouseRef.current.y = my;
      setMouseX(mx);
      setMouseY(my);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let frameCount = 0;

    // ─── PARTICLE TYPES ───
    type Ember = {
      x: number; y: number; vx: number; vy: number;
      size: number; life: number; maxLife: number;
      r: number; g: number; b: number;
      flickerSpeed: number; flickerPhase: number;
      trail: { x: number; y: number; alpha: number }[];
      gravity: number; drag: number;
      spin: number; angle: number;
    };

    type Smoke = {
      x: number; y: number; vx: number; vy: number;
      size: number; life: number; maxLife: number;
      opacity: number; rotSpeed: number; rotation: number;
    };

    type Flash = {
      x: number; y: number; life: number; maxLife: number;
      size: number; intensity: number;
      shockwave: number; shockwaveSpeed: number;
    };

    type Spark = {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number;
      r: number; g: number; b: number;
    };

    type FireColumn = {
      x: number; baseY: number; width: number;
      height: number; phase: number; speed: number;
    };

    const embers: Ember[] = [];
    const smokeParticles: Smoke[] = [];
    const flashes: Flash[] = [];
    const sparks: Spark[] = [];
    const fireColumns: FireColumn[] = [];
    let mouseTrail: { x: number; y: number; age: number; size: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize fire columns along bottom
    const initFireColumns = () => {
      fireColumns.length = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < 15; i++) {
        fireColumns.push({
          x: (i / 15) * w + Math.random() * (w / 15),
          baseY: h,
          width: 30 + Math.random() * 60,
          height: 80 + Math.random() * 200,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
        });
      }
    };
    initFireColumns();

    const emberColor = (): [number, number, number] => {
      const c = Math.random();
      if (c < 0.2) return [255, 60, 20];       // red-orange
      if (c < 0.4) return [255, 100, 25];       // orange
      if (c < 0.55) return [255, 160, 40];      // amber
      if (c < 0.7) return [255, 200, 60];       // gold
      if (c < 0.82) return [255, 230, 100];     // yellow
      if (c < 0.92) return [255, 245, 180];     // pale yellow
      return [255, 255, 220];                     // white-hot
    };

    const spawnEmber = (ox?: number, oy?: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const [r, g, b] = emberColor();
      embers.push({
        x: ox ?? Math.random() * w,
        y: oy ?? h + Math.random() * 30,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(0.5 + Math.random() * 1.8),
        size: 0.3 + Math.random() * 3,
        life: 0, maxLife: 150 + Math.random() * 450,
        r, g, b,
        flickerSpeed: 4 + Math.random() * 12,
        flickerPhase: Math.random() * Math.PI * 2,
        trail: [],
        gravity: -0.001 - Math.random() * 0.003,
        drag: 0.997 + Math.random() * 0.002,
        spin: (Math.random() - 0.5) * 0.1,
        angle: Math.random() * Math.PI * 2,
      });
    };

    const spawnSmoke = (ox?: number, oy?: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      smokeParticles.push({
        x: ox ?? Math.random() * w,
        y: oy ?? h + 20 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.1 + Math.random() * 0.4),
        size: 50 + Math.random() * 120,
        life: 0, maxLife: 400 + Math.random() * 600,
        opacity: 0.01 + Math.random() * 0.02,
        rotSpeed: (Math.random() - 0.5) * 0.005,
        rotation: Math.random() * Math.PI * 2,
      });
    };

    const spawnFlash = (fx?: number, fy?: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const f: Flash = {
        x: fx ?? Math.random() * w,
        y: fy ?? Math.random() * h * 0.8,
        life: 0, maxLife: 12 + Math.random() * 20,
        size: 120 + Math.random() * 300,
        intensity: 0.06 + Math.random() * 0.1,
        shockwave: 0, shockwaveSpeed: 3 + Math.random() * 5,
      };
      flashes.push(f);
      // Spawn burst of sparks from flash
      for (let i = 0; i < 15 + Math.random() * 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const [r, g, b] = emberColor();
        sparks.push({
          x: f.x, y: f.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, maxLife: 20 + Math.random() * 40,
          size: 0.5 + Math.random() * 1.5, r, g, b,
        });
      }
    };

    // Seed particles
    for (let i = 0; i < 120; i++) spawnEmber(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
    for (let i = 0; i < 15; i++) spawnSmoke(Math.random() * window.innerWidth, Math.random() * window.innerHeight);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      time += 0.005;
      frameCount++;

      // Motion trail fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mSpeed = mouseRef.current.speed;

      // ─── FIRE COLUMNS along the bottom edge ───
      fireColumns.forEach((col, ci) => {
        const flameHeight = col.height * (0.6 + Math.sin(time * col.speed + col.phase) * 0.4);
        const layers = 6;
        for (let l = 0; l < layers; l++) {
          const layerRatio = l / layers;
          const lx = col.x + Math.sin(time * (1.5 + l * 0.3) + col.phase + l) * (col.width * 0.4 * (1 - layerRatio));
          const ly = col.baseY - flameHeight * layerRatio;
          const lSize = col.width * (1 - layerRatio * 0.7) * (0.7 + Math.sin(time * 3 + ci + l * 2) * 0.3);

          const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lSize);
          // Color shifts from white-hot at base to red at top
          const rr = Math.floor(255 - layerRatio * 80);
          const gg = Math.floor(180 - layerRatio * 150);
          const bb = Math.floor(40 - layerRatio * 30);
          const alpha = (0.015 + Math.sin(time * 2.5 + ci * 0.7 + l) * 0.008) * (1 - layerRatio * 0.5);
          grad.addColorStop(0, `rgba(${rr}, ${gg}, ${bb}, ${alpha})`);
          grad.addColorStop(0.5, `rgba(${rr}, ${Math.max(gg - 40, 0)}, ${Math.max(bb - 20, 0)}, ${alpha * 0.4})`);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fillRect(lx - lSize, ly - lSize, lSize * 2, lSize * 2);
        }
      });

      // ─── AMBIENT BREATHING LIGHTS ───
      const ambientLights = [
        { x: 0.12, y: 0.2, r: 450, color: [200, 20, 10], sX: 0.18, sY: 0.12, aX: 0.15, aY: 0.12 },
        { x: 0.85, y: 0.7, r: 380, color: [220, 90, 15], sX: 0.15, sY: 0.2, aX: 0.1, aY: 0.15 },
        { x: 0.5, y: 0.08, r: 350, color: [160, 25, 15], sX: 0.22, sY: 0.1, aX: 0.18, aY: 0.08 },
        { x: 0.3, y: 0.85, r: 320, color: [240, 120, 20], sX: 0.25, sY: 0.15, aX: 0.1, aY: 0.07 },
        { x: 0.7, y: 0.4, r: 400, color: [180, 35, 12], sX: 0.12, sY: 0.25, aX: 0.12, aY: 0.12 },
        { x: 0.15, y: 0.55, r: 280, color: [255, 80, 20], sX: 0.2, sY: 0.18, aX: 0.08, aY: 0.1 },
        { x: 0.9, y: 0.15, r: 300, color: [200, 50, 15], sX: 0.14, sY: 0.22, aX: 0.06, aY: 0.1 },
      ];

      ambientLights.forEach((al, i) => {
        const bx = (al.x + Math.sin(time * al.sX + i * 2) * al.aX) * w;
        const by = (al.y + Math.cos(time * al.sY + i * 1.5) * al.aY) * h;
        const pulse = 0.035 + Math.sin(time * 1.0 + i * 1.3) * 0.018 + Math.sin(time * 2.3 + i) * 0.008;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, al.r);
        grad.addColorStop(0, `rgba(${al.color[0]}, ${al.color[1]}, ${al.color[2]}, ${pulse})`);
        grad.addColorStop(0.4, `rgba(${al.color[0]}, ${al.color[1]}, ${al.color[2]}, ${pulse * 0.4})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(bx - al.r, by - al.r, al.r * 2, al.r * 2);
      });

      // ─── SMOKE ───
      if (Math.random() < 0.12) spawnSmoke();

      for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const s = smokeParticles[i];
        s.x += s.vx + Math.sin(time * 0.4 + i * 0.5) * 0.3;
        s.y += s.vy;
        s.size += 0.12;
        s.rotation += s.rotSpeed;
        s.life++;
        if (s.life > s.maxLife) { smokeParticles.splice(i, 1); continue; }

        const lr = s.life / s.maxLife;
        const alpha = lr < 0.12 ? lr / 0.12 : lr > 0.5 ? (1 - lr) / 0.5 : 1;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        const sGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size);
        sGrad.addColorStop(0, `rgba(140, 40, 15, ${alpha * s.opacity})`);
        sGrad.addColorStop(0.3, `rgba(80, 20, 10, ${alpha * s.opacity * 0.7})`);
        sGrad.addColorStop(0.7, `rgba(40, 10, 5, ${alpha * s.opacity * 0.3})`);
        sGrad.addColorStop(1, "transparent");
        ctx.fillStyle = sGrad;
        ctx.fillRect(-s.size, -s.size, s.size * 2, s.size * 2);
        ctx.restore();
      }

      // ─── VOLUMETRIC LIGHT RAYS ───
      for (let i = 0; i < 8; i++) {
        const rayAngle = -0.35 + i * 0.1 + Math.sin(time * 0.12 + i * 0.8) * 0.06;
        const rayX = w * (0.05 + i * 0.12) + Math.sin(time * 0.18 + i * 2.5) * 50;
        const rayAlpha = 0.01 + Math.sin(time * 0.35 + i * 1.2) * 0.006;
        const rayWidth = 10 + Math.sin(time * 0.8 + i) * 8;

        ctx.save();
        ctx.translate(rayX, 0);
        ctx.rotate(rayAngle);
        const rGrad = ctx.createLinearGradient(0, 0, 0, h * 1.6);
        rGrad.addColorStop(0, "transparent");
        rGrad.addColorStop(0.2, `rgba(255, 100, 30, ${rayAlpha * 0.5})`);
        rGrad.addColorStop(0.4, `rgba(255, 70, 20, ${rayAlpha})`);
        rGrad.addColorStop(0.6, `rgba(220, 50, 15, ${rayAlpha})`);
        rGrad.addColorStop(0.8, `rgba(180, 30, 10, ${rayAlpha * 0.5})`);
        rGrad.addColorStop(1, "transparent");
        ctx.fillStyle = rGrad;
        ctx.fillRect(-rayWidth, 0, rayWidth * 2, h * 1.6);
        ctx.restore();
      }

      // ─── HEAT SHIMMER LINES ───
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 12; i++) {
        const lineY = h * (0.05 + i * 0.08) + Math.sin(time * 0.7 + i * 1.4) * 20;
        const lineAlpha = 0.004 + Math.sin(time * 0.4 + i * 1.8) * 0.002;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const wave1 = Math.sin(x * 0.008 + time * 2.5 + i) * 4;
          const wave2 = Math.sin(x * 0.015 + time * 1.8 + i * 3) * 2;
          const wave3 = Math.sin(x * 0.003 + time * 0.6 + i * 0.5) * 8;
          const y = lineY + wave1 + wave2 + wave3;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255, 130, 50, ${lineAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";

      // ─── GUNFIRE FLASHES ───
      if (Math.random() < 0.02) spawnFlash();

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life++;
        f.shockwave += f.shockwaveSpeed;
        if (f.life > f.maxLife) { flashes.splice(i, 1); continue; }

        const p = f.life / f.maxLife;
        const fa = p < 0.15 ? p / 0.15 : (1 - p) / 0.85;

        // Main flash
        ctx.globalCompositeOperation = "lighter";
        const fGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
        fGrad.addColorStop(0, `rgba(255, 240, 200, ${fa * f.intensity * 1.5})`);
        fGrad.addColorStop(0.15, `rgba(255, 180, 80, ${fa * f.intensity})`);
        fGrad.addColorStop(0.4, `rgba(255, 100, 30, ${fa * f.intensity * 0.4})`);
        fGrad.addColorStop(1, "transparent");
        ctx.fillStyle = fGrad;
        ctx.fillRect(f.x - f.size, f.y - f.size, f.size * 2, f.size * 2);

        // Shockwave ring
        if (f.shockwave < f.size * 2) {
          const ringAlpha = fa * 0.08 * (1 - f.shockwave / (f.size * 2));
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.shockwave, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 180, 80, ${ringAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ─── SPARKS (from flashes) ───
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.08; // gravity
        sp.vx *= 0.98;
        sp.vy *= 0.98;
        sp.life++;
        if (sp.life > sp.maxLife) { sparks.splice(i, 1); continue; }

        const sa = 1 - sp.life / sp.maxLife;
        // Spark line (motion direction)
        const len = Math.sqrt(sp.vx * sp.vx + sp.vy * sp.vy) * 3;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x - (sp.vx / Math.max(0.01, Math.sqrt(sp.vx * sp.vx + sp.vy * sp.vy))) * len,
                   sp.y - (sp.vy / Math.max(0.01, Math.sqrt(sp.vx * sp.vx + sp.vy * sp.vy))) * len);
        ctx.strokeStyle = `rgba(${sp.r}, ${sp.g}, ${sp.b}, ${sa * 0.8})`;
        ctx.lineWidth = sp.size;
        ctx.stroke();

        // Spark glow
        const spGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.size * 4);
        spGrad.addColorStop(0, `rgba(${sp.r}, ${sp.g}, ${sp.b}, ${sa * 0.3})`);
        spGrad.addColorStop(1, "transparent");
        ctx.fillStyle = spGrad;
        ctx.fillRect(sp.x - sp.size * 4, sp.y - sp.size * 4, sp.size * 8, sp.size * 8);
      }
      ctx.globalCompositeOperation = "source-over";

      // ─── EMBERS — dense, trailing, flickering ───
      if (Math.random() < 0.8) spawnEmber();
      if (Math.random() < 0.3) spawnEmber(Math.random() * w, h + 5);
      // Spawn from edges too
      if (Math.random() < 0.1) spawnEmber(-5, Math.random() * h);
      if (Math.random() < 0.1) spawnEmber(w + 5, Math.random() * h);

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];

        // Trail
        if (e.life % 2 === 0) {
          e.trail.push({ x: e.x, y: e.y, alpha: 1 });
          if (e.trail.length > 18) e.trail.shift();
        }
        // Fade trail
        for (const tp of e.trail) tp.alpha *= 0.92;

        // Physics
        const windX = Math.sin(time * 1.5 + e.y * 0.005) * 0.15 + Math.cos(time * 3 + i * 0.3) * 0.08;
        const windY = Math.cos(time * 0.8 + e.x * 0.003) * 0.05;
        e.vx = (e.vx + windX * 0.01) * e.drag;
        e.vy = (e.vy + e.gravity + windY * 0.01) * e.drag;
        e.x += e.vx;
        e.y += e.vy;
        e.angle += e.spin;
        e.life++;

        if (e.life > e.maxLife || e.y < -50 || e.x < -50 || e.x > w + 50) {
          embers.splice(i, 1); continue;
        }

        const lr = e.life / e.maxLife;
        const baseAlpha = lr < 0.06 ? lr / 0.06 : lr > 0.65 ? (1 - lr) / 0.35 : 1;
        const flicker = 0.5 + Math.sin(time * e.flickerSpeed + e.flickerPhase) * 0.3
                           + Math.sin(time * e.flickerSpeed * 1.7 + e.flickerPhase * 2.3) * 0.2;
        const alpha = baseAlpha * Math.max(0, flicker);

        // Draw trail
        ctx.globalCompositeOperation = "lighter";
        for (let t = 0; t < e.trail.length; t++) {
          const tp = e.trail[t];
          const trailAlpha = tp.alpha * alpha * 0.12;
          const trailSize = e.size * (t / e.trail.length) * 0.6;
          if (trailAlpha < 0.001 || trailSize < 0.1) continue;
          const tGrad = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, trailSize * 3);
          tGrad.addColorStop(0, `rgba(${e.r}, ${e.g}, ${e.b}, ${trailAlpha})`);
          tGrad.addColorStop(1, "transparent");
          ctx.fillStyle = tGrad;
          ctx.fillRect(tp.x - trailSize * 3, tp.y - trailSize * 3, trailSize * 6, trailSize * 6);
        }

        // Outer glow
        const glowR = e.size * 8;
        const eGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowR);
        eGrad.addColorStop(0, `rgba(${e.r}, ${e.g}, ${e.b}, ${alpha * 0.18})`);
        eGrad.addColorStop(0.3, `rgba(${e.r}, ${Math.max(0, e.g - 40)}, ${Math.max(0, e.b - 15)}, ${alpha * 0.06})`);
        eGrad.addColorStop(1, "transparent");
        ctx.fillStyle = eGrad;
        ctx.fillRect(e.x - glowR, e.y - glowR, glowR * 2, glowR * 2);

        // Bright core
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (0.3 + alpha * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, e.r + 40)}, ${Math.min(255, e.g + 40)}, ${Math.min(255, e.b + 30)}, ${alpha * 0.9})`;
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      // ─── MOUSE INTERACTION ───
      if (!isMobile) {
        const mgx = mx * w;
        const mgy = my * h;

        // Track mouse trail
        if (frameCount % 2 === 0) {
          mouseTrail.push({ x: mgx, y: mgy, age: 0, size: 8 + mSpeed * 200 });
        }

        // Spawn embers at cursor when moving fast
        if (mSpeed > 0.005) {
          for (let j = 0; j < Math.min(5, Math.floor(mSpeed * 100)); j++) {
            spawnEmber(mgx + (Math.random() - 0.5) * 30, mgy + (Math.random() - 0.5) * 30);
          }
        }

        // Draw mouse trail
        for (let i = mouseTrail.length - 1; i >= 0; i--) {
          mouseTrail[i].age++;
          if (mouseTrail[i].age > 40) { mouseTrail.splice(i, 1); continue; }
          const mt = mouseTrail[i];
          const trailFade = 1 - mt.age / 40;
          const mtGrad = ctx.createRadialGradient(mt.x, mt.y, 0, mt.x, mt.y, mt.size * trailFade);
          mtGrad.addColorStop(0, `rgba(255, 150, 50, ${trailFade * 0.08})`);
          mtGrad.addColorStop(1, "transparent");
          ctx.fillStyle = mtGrad;
          ctx.fillRect(mt.x - mt.size, mt.y - mt.size, mt.size * 2, mt.size * 2);
        }

        // Main cursor glow
        ctx.globalCompositeOperation = "lighter";
        const glowSize = 200 + mSpeed * 800;
        const mGrad = ctx.createRadialGradient(mgx, mgy, 0, mgx, mgy, glowSize);
        mGrad.addColorStop(0, `rgba(255, 160, 60, ${0.06 + mSpeed * 0.5})`);
        mGrad.addColorStop(0.2, `rgba(255, 100, 30, ${0.03 + mSpeed * 0.2})`);
        mGrad.addColorStop(0.5, `rgba(200, 50, 15, ${0.015 + mSpeed * 0.1})`);
        mGrad.addColorStop(1, "transparent");
        ctx.fillStyle = mGrad;
        ctx.fillRect(mgx - glowSize, mgy - glowSize, glowSize * 2, glowSize * 2);

        // Bright core
        const coreSize = 25 + mSpeed * 100;
        const cGrad = ctx.createRadialGradient(mgx, mgy, 0, mgx, mgy, coreSize);
        cGrad.addColorStop(0, `rgba(255, 220, 140, ${0.12 + mSpeed * 0.4})`);
        cGrad.addColorStop(0.5, `rgba(255, 160, 60, ${0.04 + mSpeed * 0.15})`);
        cGrad.addColorStop(1, "transparent");
        ctx.fillStyle = cGrad;
        ctx.fillRect(mgx - coreSize, mgy - coreSize, coreSize * 2, coreSize * 2);

        // Expanding pulse rings
        const ringCount = 2;
        for (let r = 0; r < ringCount; r++) {
          const ringPhase = (time * 2 + r * 3) % 5;
          const ringR = ringPhase * 60;
          const ringA = Math.max(0, 0.06 - ringPhase * 0.012) * (1 + mSpeed * 5);
          if (ringA > 0.001) {
            ctx.beginPath();
            ctx.arc(mgx, mgy, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 180, 80, ${ringA})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ─── HORIZONTAL FIRE LINE at bottom ───
      const fireLineY = h - 2;
      const flGrad = ctx.createLinearGradient(0, fireLineY - 30, 0, fireLineY);
      flGrad.addColorStop(0, "transparent");
      flGrad.addColorStop(0.5, `rgba(255, 80, 20, ${0.02 + Math.sin(time * 2) * 0.01})`);
      flGrad.addColorStop(1, `rgba(255, 120, 40, ${0.04 + Math.sin(time * 3) * 0.02})`);
      ctx.fillStyle = flGrad;
      ctx.fillRect(0, fireLineY - 30, w, 32);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen bg-black overflow-hidden"
      style={{ height: "110vh" }}
    >
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {PHOTOS.map((photo, i) => {
        const parallaxStrength = (photo.z / 10) * 15;
        const px = isMobile ? 0 : (mouseX - 0.5) * parallaxStrength;
        const py = isMobile ? 0 : (mouseY - 0.5) * parallaxStrength;
        const top = isMobile && photo.mTop !== undefined ? photo.mTop : photo.top;
        const left = isMobile && photo.mLeft !== undefined ? photo.mLeft : photo.left;
        const w = isMobile && photo.mW !== undefined ? photo.mW : photo.w;
        const h = isMobile && photo.mH !== undefined ? photo.mH : photo.h;

        return (
          <div
            key={i}
            className="absolute transition-transform duration-300 ease-out"
            style={{
              top: `${top}%`, left: `${left}%`,
              width: `${w}vw`, height: `${h}vh`,
              zIndex: photo.z,
              transform: `rotate(${photo.rotate}deg) translate(${px}px, ${py}px)`,
            }}
          >
            <div className="absolute -inset-2 rounded-sm" style={{ background: "rgba(0,0,0,0.6)", filter: "blur(20px)", zIndex: -1 }} />
            <div className="relative w-full h-full overflow-hidden rounded-sm border border-white/[0.06] group">
              <Image src={photo.src} alt="" fill className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" sizes="(max-width: 640px) 80vw, 50vw" priority={i < 3} />
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)" }} />
            </div>
          </div>
        );
      })}

      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)", zIndex: 50 }} />

      <div className="fixed bottom-6 right-6 flex items-center gap-4" style={{ zIndex: 60 }}>
        <a
          href="https://pump.fun/coin/B9E8LZ1SsZaNhgLwLzMotPViaTzKUUzYvLREQWJgpump"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-white/40 hover:text-white/90 transition-opacity duration-300"
          style={{ cursor: "pointer", textDecoration: "none" }}
        >
          $Suarez
        </a>
        <a
          href="https://x.com/LuisSuarez9"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white/90 transition-opacity duration-300 p-1"
          style={{ cursor: "pointer", textDecoration: "none", fontSize: 20 }}
        >
          𝕏
        </a>
      </div>
    </div>
  );
}
