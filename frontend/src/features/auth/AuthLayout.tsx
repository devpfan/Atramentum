import { Outlet } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import AuthBackground from './AuthBackground';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <AuthBackground />

      <div className="max-w-md w-full bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-10 relative">
        <div className="p-8 pb-6 text-center border-b border-[var(--color-border)]/50">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#6366f1]/10 rounded-xl border border-[#6366f1]/30 mb-4 shadow-inner">
            <PenTool className="w-6 h-6 text-[#6366f1]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Atramentum</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">El Entorno de Escritura Inteligente</p>
        </div>
        
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
