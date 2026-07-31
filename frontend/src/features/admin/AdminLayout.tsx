import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Users, Settings, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const token = useAppStore(state => state.token);
  const user = useAppStore(state => state.user);
  const setToken = useAppStore(state => state.setToken);
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si ya cargó el usuario y no es admin, kick out. (Si es null está cargando, dejamos renderizar)
  if (user && !user.is_superuser) {
    return <Navigate to="/app" replace />;
  }

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Sidebar Admin */}
      <div className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
        <div className="h-14 flex items-center px-6 border-b border-[var(--color-border)] gap-2">
          <Shield size={20} className="text-red-500" />
          <span className="font-bold tracking-wide">Atramentum Admin</span>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1">
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-red-500/10 text-red-500' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
          >
            <Users size={18} />
            <span className="font-medium text-sm">Usuarios</span>
          </NavLink>
          
          <NavLink 
            to="/admin/settings" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-red-500/10 text-red-500' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
          >
            <Settings size={18} />
            <span className="font-medium text-sm">Config. Global</span>
          </NavLink>
        </div>
        
        <div className="p-3 border-t border-[var(--color-border)]">
          <button 
            onClick={() => navigate('/app')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[#6366f1]/10 hover:text-[#6366f1] transition-colors group mb-1"
          >
            Volver al Editor
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors group"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <main className="flex-1 overflow-auto bg-[var(--color-background)] p-8">
        <Outlet />
      </main>
    </div>
  );
}
