import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  flipAngle: number;
  vFlip: number;
  opacity: number;
  targetOpacity: number;
  type: 'papyrus' | 'leaf' | 'spark';
  papyrusVariant?: 'scroll' | 'torn_papyrus';
  rollRadius?: number;
  color: string;
  darkColor: string;
  swaySpeed: number;
  swayOffset: number;
  size: number;
}

export default function HelpBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      // 18 Floating Papyri & Ancient Scrolls
      for (let i = 0; i < 18; i++) {
        particles.push(createPapyrusParticle(true));
      }
      // 14 Golden / autumn leaves
      for (let i = 0; i < 14; i++) {
        particles.push(createLeafParticle(true));
      }
      // 35 Magical dust motes / sparks
      for (let i = 0; i < 35; i++) {
        particles.push(createSparkParticle(true));
      }
    };

    function createPapyrusParticle(randomY = false): Particle {
      const pWidth = Math.random() * 16 + 22; // 22 - 38px
      const pHeight = pWidth * (Math.random() * 0.4 + 1.25); // Aspect ratio of ancient papyrus/scroll
      const isScroll = Math.random() > 0.45;
      
      const papyrusTones = [
        { bg: '240, 222, 180', dark: '180, 145, 105' }, // Classic golden papyrus
        { bg: '228, 204, 155', dark: '160, 125, 85' },  // Aged parchment
        { bg: '248, 235, 205', dark: '190, 160, 120' }, // Ivory papyrus
        { bg: '215, 188, 140', dark: '145, 110, 75' },  // Ancient weathered scroll
      ];
      const tone = papyrusTones[Math.floor(Math.random() * papyrusTones.length)];

      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -pHeight - 30,
        width: pWidth,
        height: pHeight,
        vx: (Math.random() - 0.42) * 0.45,
        vy: Math.random() * 0.42 + 0.3,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.012,
        flipAngle: Math.random() * Math.PI * 2,
        vFlip: Math.random() * 0.018 + 0.006,
        opacity: Math.random() * 0.35 + 0.35,
        targetOpacity: Math.random() * 0.35 + 0.35,
        type: 'papyrus',
        papyrusVariant: isScroll ? 'scroll' : 'torn_papyrus',
        rollRadius: Math.random() * 2 + 3.5,
        color: tone.bg,
        darkColor: tone.dark,
        swaySpeed: Math.random() * 0.012 + 0.006,
        swayOffset: Math.random() * Math.PI * 2,
        size: 1,
      };
    }

    function createLeafParticle(randomY = false): Particle {
      const size = Math.random() * 9 + 8; // 8 - 17px
      const leafColors = [
        'rgba(217, 119, 6, ',  // Amber
        'rgba(245, 158, 11, ',  // Golden
        'rgba(180, 83, 9, ',   // Deep rust brown
        'rgba(194, 65, 12, ',  // Autumn orange
        'rgba(147, 51, 234, ', // Mythic purple hint
      ];
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -size - 25,
        width: size,
        height: size * 1.65,
        vx: (Math.random() - 0.4) * 0.5,
        vy: Math.random() * 0.5 + 0.38,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.028,
        flipAngle: Math.random() * Math.PI * 2,
        vFlip: Math.random() * 0.03 + 0.01,
        opacity: Math.random() * 0.4 + 0.35,
        targetOpacity: Math.random() * 0.4 + 0.35,
        type: 'leaf',
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        darkColor: '',
        swaySpeed: Math.random() * 0.018 + 0.008,
        swayOffset: Math.random() * Math.PI * 2,
        size,
      };
    }

    function createSparkParticle(randomY = false): Particle {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 10,
        width: 0,
        height: 0,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.35 + 0.15),
        angle: 0,
        vAngle: 0,
        flipAngle: 0,
        vFlip: 0,
        opacity: Math.random() * 0.6 + 0.25,
        targetOpacity: Math.random() * 0.6 + 0.25,
        type: 'spark',
        color: Math.random() > 0.5 ? 'rgba(251, 191, 36, ' : 'rgba(192, 132, 252, ',
        darkColor: '',
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayOffset: Math.random() * Math.PI * 2,
        size: Math.random() * 1.8 + 0.6,
      };
    }

    window.addEventListener('resize', resize);
    initParticles();

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.66, 2.0);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Wind sway
        p.swayOffset += p.swaySpeed * dt;
        const sway = Math.sin(p.swayOffset) * 0.55;

        p.x += (p.vx + sway) * dt;
        p.y += p.vy * dt;
        p.angle += p.vAngle * dt;
        p.flipAngle += p.vFlip * dt;

        // Reset if offscreen
        if (p.type === 'spark') {
          if (p.y < -10 || p.x < -20 || p.x > width + 20) {
            Object.assign(p, createSparkParticle(false));
          }
        } else {
          if (p.y > height + 45 || p.x < -45 || p.x > width + 45) {
            if (p.type === 'papyrus') Object.assign(p, createPapyrusParticle(false));
            else Object.assign(p, createLeafParticle(false));
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // 3D perspective flip effect
        const scaleX = Math.cos(p.flipAngle);
        ctx.scale(scaleX, 1);

        if (p.type === 'papyrus') {
          const currentAlpha = Math.abs(scaleX) * p.opacity;
          const w = p.width;
          const h = p.height;
          const r = p.rollRadius || 4;

          if (p.papyrusVariant === 'scroll') {
            // ==========================================
            // 📜 RENDER ANCIENT ROLLED SCROLL (PAPIRO)
            // ==========================================
            
            // 1. Center Unrolled Sheet
            ctx.beginPath();
            ctx.moveTo(-w / 2 + 2, -h / 2 + r);
            ctx.quadraticCurveTo(-w / 2 - 1, 0, -w / 2 + 2, h / 2 - r); // Organic wavy left edge
            ctx.lineTo(w / 2 - 2, h / 2 - r);
            ctx.quadraticCurveTo(w / 2 + 1, 0, w / 2 - 2, -h / 2 + r);  // Organic wavy right edge
            ctx.closePath();
            
            ctx.fillStyle = `rgba(${p.color}, ${currentAlpha * 0.9})`;
            ctx.fill();

            // Sheet border & golden glow
            ctx.strokeStyle = `rgba(255, 240, 210, ${currentAlpha * 0.85})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // 2. Top Rolled Cylinder (El rollo superior del papiro)
            ctx.beginPath();
            ctx.ellipse(0, -h / 2 + r / 2, w / 2, r, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.darkColor}, ${currentAlpha * 0.95})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 235, 190, ${currentAlpha * 0.9})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Left & right scroll wooden handles/ends
            ctx.beginPath();
            ctx.ellipse(-w / 2, -h / 2 + r / 2, 1.8, r * 0.85, 0, 0, Math.PI * 2);
            ctx.ellipse(w / 2, -h / 2 + r / 2, 1.8, r * 0.85, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120, 80, 45, ${currentAlpha * 0.9})`;
            ctx.fill();

            // 3. Bottom Rolled Cylinder (El rollo inferior del papiro)
            ctx.beginPath();
            ctx.ellipse(0, h / 2 - r / 2, w / 2, r, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.darkColor}, ${currentAlpha * 0.95})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 235, 190, ${currentAlpha * 0.9})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Bottom scroll ends
            ctx.beginPath();
            ctx.ellipse(-w / 2, h / 2 - r / 2, 1.8, r * 0.85, 0, 0, Math.PI * 2);
            ctx.ellipse(w / 2, h / 2 - r / 2, 1.8, r * 0.85, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120, 80, 45, ${currentAlpha * 0.9})`;
            ctx.fill();

            // 4. Ancient Script / Calligraphy lines
            if (Math.abs(scaleX) > 0.3) {
              ctx.strokeStyle = `rgba(90, 65, 45, ${currentAlpha * 0.6})`;
              ctx.lineWidth = 0.7;
              const lineCount = 3;
              const usableH = h - r * 3;
              const spacing = usableH / (lineCount + 1);
              for (let l = 1; l <= lineCount; l++) {
                const ly = -h / 2 + r * 1.5 + l * spacing;
                const lineW = l === 2 ? w * 0.65 : w * 0.48;
                ctx.beginPath();
                ctx.moveTo(-w / 2 + 6, ly);
                ctx.lineTo(-w / 2 + 6 + lineW, ly);
                ctx.stroke();
              }
            }

          } else {
            // ==========================================
            // 📜 RENDER TORN DECKLE-EDGE PAPYRUS FRAGMENT
            // ==========================================
            
            // Draw organic, fiber-cut deckle edge polygon
            ctx.beginPath();
            // Top ragged edge with curl
            ctx.moveTo(-w / 2, -h / 2 + 3);
            ctx.quadraticCurveTo(-w / 4, -h / 2 - 2, 0, -h / 2 + 1);
            ctx.quadraticCurveTo(w / 4, -h / 2 - 1, w / 2 - 4, -h / 2 + 2);
            
            // Right irregular edge
            ctx.quadraticCurveTo(w / 2 + 2, -h / 4, w / 2 - 1, 0);
            ctx.quadraticCurveTo(w / 2 + 3, h / 4, w / 2 - 3, h / 2 - 2);

            // Bottom ragged torn edge
            ctx.quadraticCurveTo(w / 4, h / 2 + 3, 0, h / 2 - 1);
            ctx.quadraticCurveTo(-w / 4, h / 2 + 2, -w / 2 + 3, h / 2 - 3);

            // Left fibrous edge
            ctx.quadraticCurveTo(-w / 2 - 2, h / 4, -w / 2 + 1, 0);
            ctx.quadraticCurveTo(-w / 2 - 3, -h / 4, -w / 2, -h / 2 + 3);
            ctx.closePath();

            ctx.fillStyle = `rgba(${p.color}, ${currentAlpha * 0.9})`;
            ctx.fill();

            // Organic fiber border
            ctx.strokeStyle = `rgba(255, 245, 215, ${currentAlpha * 0.8})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();

            // Papyrus fiber horizontal textures
            if (Math.abs(scaleX) > 0.25) {
              ctx.strokeStyle = `rgba(${p.darkColor}, ${currentAlpha * 0.25})`;
              ctx.lineWidth = 0.5;
              for (let f = -h / 2 + 4; f < h / 2 - 4; f += 4) {
                ctx.beginPath();
                ctx.moveTo(-w / 2 + 4, f);
                ctx.lineTo(w / 2 - 4, f);
                ctx.stroke();
              }

              // Ink script verses
              ctx.strokeStyle = `rgba(80, 55, 35, ${currentAlpha * 0.65})`;
              ctx.lineWidth = 0.75;
              const lines = 4;
              const sp = (h - 10) / (lines + 1);
              for (let l = 1; l <= lines; l++) {
                const ly = -h / 2 + 5 + l * sp;
                const lw = l === lines ? w * 0.4 : w * 0.68;
                ctx.beginPath();
                ctx.moveTo(-w / 2 + 5, ly);
                ctx.lineTo(-w / 2 + 5 + lw, ly);
                ctx.stroke();
              }
            }

            // Top-right parchment corner curl
            ctx.beginPath();
            ctx.moveTo(w / 2 - 7, -h / 2 + 1);
            ctx.lineTo(w / 2 - 1, -h / 2 + 7);
            ctx.lineTo(w / 2 - 7, -h / 2 + 7);
            ctx.closePath();
            ctx.fillStyle = `rgba(${p.darkColor}, ${currentAlpha * 0.85})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 245, 220, ${currentAlpha * 0.9})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }

        } else if (p.type === 'leaf') {
          // ==========================================
          // 🍂 RENDER AUTUMN / MAGIC LEAF
          // ==========================================
          const currentAlpha = Math.abs(scaleX) * p.opacity;
          const s = p.size;

          ctx.beginPath();
          ctx.moveTo(0, -s * 1.25);
          ctx.quadraticCurveTo(s * 0.95, -s * 0.2, 0, s * 1.25);
          ctx.quadraticCurveTo(-s * 0.95, -s * 0.2, 0, -s * 1.25);
          ctx.fillStyle = `${p.color}${currentAlpha * 0.85})`;
          ctx.fill();

          // Leaf center vein & delicate side veins
          ctx.beginPath();
          ctx.moveTo(0, -s * 1.15);
          ctx.lineTo(0, s * 1.15);
          ctx.strokeStyle = `rgba(255, 240, 190, ${currentAlpha * 0.75})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // Side branching veins
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.4);
          ctx.lineTo(s * 0.45, -s * 0.6);
          ctx.moveTo(0, -s * 0.4);
          ctx.lineTo(-s * 0.45, -s * 0.6);
          ctx.moveTo(0, s * 0.3);
          ctx.lineTo(s * 0.45, s * 0.1);
          ctx.moveTo(0, s * 0.3);
          ctx.lineTo(-s * 0.45, s * 0.1);
          ctx.strokeStyle = `rgba(255, 240, 190, ${currentAlpha * 0.45})`;
          ctx.lineWidth = 0.45;
          ctx.stroke();

        } else if (p.type === 'spark') {
          // ==========================================
          // ✨ RENDER MAGICAL DUST / SPARK
          // ==========================================
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color === 'rgba(251, 191, 36, ' ? '#f59e0b' : '#c084fc';
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic Ambient Glowing Orbs */}
      <div className="absolute top-10 left-1/4 w-[520px] h-[520px] bg-indigo-600/15 rounded-full mix-blend-screen filter blur-[140px] animate-blob"></div>
      <div className="absolute top-1/3 right-10 w-[480px] h-[480px] bg-amber-500/12 rounded-full mix-blend-screen filter blur-[130px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-10 left-10 w-[550px] h-[550px] bg-purple-600/15 rounded-full mix-blend-screen filter blur-[150px] animate-blob animation-delay-4000"></div>

      {/* Floating Papyri & Leaves Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-90 mix-blend-screen"
      />

      {/* Subtle vignette for reading comfort in the center */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-background)]/60 via-transparent to-[var(--color-background)]/80"></div>
    </div>
  );
}
