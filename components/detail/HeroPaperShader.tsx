"use client";

import { useEffect, useRef } from "react";

export default function HeroPaperShader({
  accent,
}: {
  accent: "course" | "teacher" | "resource";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let width = 0;
    let height = 0;
    const startedAt = performance.now();

    const palettes = {
      course: [
        "rgba(56,189,248,0.12)",
        "rgba(129,140,248,0.10)",
        "rgba(255,255,255,0.16)",
      ],
      teacher: [
        "rgba(251,113,133,0.11)",
        "rgba(251,191,36,0.10)",
        "rgba(255,255,255,0.16)",
      ],
      resource: [
        "rgba(16,185,129,0.11)",
        "rgba(34,211,238,0.10)",
        "rgba(255,255,255,0.16)",
      ],
    };

    const noiseSeed = Array.from({ length: 42 }, (_, index) => ({
      x: (index * 83) % 1000,
      y: (index * 61) % 700,
      size: 0.6 + ((index * 13) % 5) / 4,
      alpha: 0.018 + ((index * 17) % 10) / 900,
    }));

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(255,255,255,0.14)");
      gradient.addColorStop(0.45, "rgba(255,255,255,0.03)");
      gradient.addColorStop(1, "rgba(255,255,255,0.10)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      palettes[accent].forEach((color, index) => {
        const orbitX = width * (0.24 + index * 0.26) + Math.sin(elapsed * (0.32 + index * 0.08)) * 28;
        const orbitY = height * (0.18 + index * 0.24) + Math.cos(elapsed * (0.28 + index * 0.06)) * 20;
        const radius = Math.max(width, height) * (0.24 + index * 0.08);
        const radial = context.createRadialGradient(orbitX, orbitY, radius * 0.08, orbitX, orbitY, radius);
        radial.addColorStop(0, color);
        radial.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = radial;
        context.beginPath();
        context.arc(orbitX, orbitY, radius, 0, Math.PI * 2);
        context.fill();
      });

      context.save();
      context.globalAlpha = 0.28;
      context.strokeStyle = "rgba(255,255,255,0.22)";
      context.lineWidth = 1;
      for (let x = -80; x < width + 80; x += 88) {
        context.beginPath();
        context.moveTo(x + Math.sin(elapsed * 0.3 + x * 0.01) * 12, 0);
        context.lineTo(x - 80 + Math.sin(elapsed * 0.45 + x * 0.008) * 16, height);
        context.stroke();
      }
      context.restore();

      noiseSeed.forEach((dot, index) => {
        const x = (dot.x + elapsed * (4 + (index % 3))) % Math.max(width, 1);
        const y = (dot.y + Math.sin(elapsed * 0.4 + index) * 10 + height) % Math.max(height, 1);
        context.fillStyle = `rgba(255,255,255,${dot.alpha})`;
        context.fillRect(x, y, dot.size, dot.size);
      });

      context.save();
      context.globalAlpha = 0.16;
      context.fillStyle = "rgba(255,255,255,0.75)";
      for (let i = 0; i < 5; i += 1) {
        const waveY = height * (0.12 + i * 0.16) + Math.sin(elapsed * 0.35 + i) * 6;
        context.fillRect(0, waveY, width, 1);
      }
      context.restore();

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(parent);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [accent]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
