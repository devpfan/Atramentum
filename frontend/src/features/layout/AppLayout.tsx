import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';

export default function AppLayout() {
  const token = useAppStore(state => state.token);

  // Si no hay token, lo devolvemos al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden text-[var(--color-text-primary)]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Aquí va el header superior del área de trabajo */}
        <header className="h-14 border-b border-[var(--color-border)] flex items-center px-6 bg-[var(--color-background)]/95 backdrop-blur z-10">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">Proyecto Activo / <span className="text-[var(--color-text-primary)]">Capítulo 1</span></h2>
        </header>
        
        {/* Aquí se renderiza la vista activa (Manuscrito, Codex, etc) */}
        <div className="flex-1 overflow-auto p-6 relative">
          {/* Outlet renderizará los componentes hijos definidos en el router */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}
