import { useEffect, useRef } from 'react';

export default function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number; opacitySpeed: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    const createParticles = () => {
      particles = [];
      const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 1) * 0.3 - 0.1, // Move upwards slowly
          opacity: Math.random() * 0.5,
          opacitySpeed: (Math.random() * 0.01) * (Math.random() < 0.5 ? 1 : -1)
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacitySpeed;

        if (p.opacity <= 0 || p.opacity >= 0.6) p.opacitySpeed *= -1;
        
        // Loop around edges
        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Soft golden/magic color
        ctx.fillStyle = `rgba(192, 160, 255, ${Math.max(0, p.opacity)})`;
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(192, 160, 255, 0.5)';
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[#0a0a10]">
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Magic Dust Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 opacity-80 mix-blend-screen"
      />
      
      {/* Overlay vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent z-0 opacity-50"></div>
    </div>
  );
}
