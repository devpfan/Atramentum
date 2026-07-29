import { Book, Library, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const setToken = useAppStore(state => state.setToken);
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className={`h-screen flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
        {!isCollapsed && <span className="font-semibold text-[var(--color-text-primary)]">Atramentum</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NavItem icon={<Book size={20} />} label="Manuscrito" isCollapsed={isCollapsed} isActive={true} />
        <NavItem icon={<Library size={20} />} label="Codex" isCollapsed={isCollapsed} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-border)] space-y-1">
        <NavItem icon={<Settings size={20} />} label="Configuración" isCollapsed={isCollapsed} />
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isCollapsed, isActive = false }: { icon: React.ReactNode, label: string, isCollapsed: boolean, isActive?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'} ${isCollapsed ? 'justify-center' : ''}`}>
      {icon}
      {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
    </button>
  );
}
