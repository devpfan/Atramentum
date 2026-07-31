import { Book, Library, Settings, LogOut, ChevronLeft, ChevronRight, Plus, Folder, BarChart2, HelpCircle, Shield } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import { StatisticsModal } from './StatisticsModal';
import { ProjectManagementModal } from './ProjectManagementModal';
import { Tooltip } from '../../components/Tooltip';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isProjectManagementOpen, setIsProjectManagementOpen] = useState(false);
  const setToken = useAppStore(state => state.setToken);
  const user = useAppStore(state => state.user);
  const { books, activeBookId, fetchBooks, setActiveBookId, createBook } = useManuscriptStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const handleCreateBook = async () => {
    const title = prompt("Nombre del nuevo proyecto:");
    if (title) {
      await createBook(title);
    }
  };

  return (
    <>
    <div className={`h-screen flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
        {!isCollapsed && <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><Folder size={18} className="text-[#6366f1]" /> Proyectos</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Project Selector */}
      {!isCollapsed && (
        <div className="p-3 border-b border-[var(--color-border)]">
          <div className="flex gap-2">
            <select 
              value={activeBookId || ''} 
              onChange={(e) => setActiveBookId(Number(e.target.value))}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md py-1.5 px-2 text-sm focus:outline-none focus:border-[#6366f1]"
            >
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <Tooltip content="Renombrar Proyecto" position="right">
              <button
                onClick={() => {
                  if (!activeBookId) return;
                  const book = books.find(b => b.id === activeBookId);
                  const newTitle = prompt("Renombrar proyecto (El título anterior se guardará en el historial):", book?.title);
                  if (newTitle && newTitle !== book?.title) {
                    useManuscriptStore.getState().updateBook(activeBookId, { title: newTitle });
                  }
                }}
                className="p-1.5 shrink-0 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[#6366f1] transition-colors border border-transparent hover:border-[var(--color-border)]"
              >
                <Settings size={16} />
              </button>
            </Tooltip>
          </div>
          <button 
            onClick={handleCreateBook}
            className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 px-2 text-xs font-medium text-[#6366f1] bg-[#6366f1]/10 hover:bg-[#6366f1]/20 rounded-md transition-colors"
          >
            <Plus size={14} /> Nuevo Proyecto
          </button>
          <button 
            onClick={() => setIsProjectManagementOpen(true)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 px-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] rounded-md transition-colors border border-transparent hover:border-[var(--color-border)]"
          >
            <Folder size={14} /> Gestionar Proyectos
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NavItem to="/app" icon={<Book size={20} />} label="Manuscrito" isCollapsed={isCollapsed} end />
        <NavItem to="/app/codex" icon={<Library size={20} />} label="Archivum" isCollapsed={isCollapsed} />
        <NavItem to="/app/help" icon={<HelpCircle size={20} />} label="Guía de Uso" isCollapsed={isCollapsed} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-border)] space-y-1">
        <Tooltip content="Estadísticas y Metas" position="right">
          <button 
            onClick={() => setIsStatsOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[#6366f1]/10 hover:text-[#6366f1] transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <BarChart2 size={20} />
            {!isCollapsed && <span className="font-medium text-sm">Estadísticas</span>}
          </button>
        </Tooltip>
        <Tooltip content="Configuración" position="right">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[#6366f1]/10 hover:text-[#6366f1] transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Settings size={20} />
            {!isCollapsed && <span className="font-medium text-sm">Configuración</span>}
          </button>
        </Tooltip>
        
        {user?.is_superuser && (
          <Tooltip content="Panel de Administración" position="right">
            <button 
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Shield size={20} />
              {!isCollapsed && <span className="font-medium text-sm">Administración</span>}
            </button>
          </Tooltip>
        )}

        <Tooltip content="Cerrar Sesión" position="right">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
          </button>
        </Tooltip>
      </div>
    </div>
    {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    {isStatsOpen && <StatisticsModal onClose={() => setIsStatsOpen(false)} />}
    {isProjectManagementOpen && <ProjectManagementModal onClose={() => setIsProjectManagementOpen(false)} />}
    </>
  );
}

function NavItem({ to, icon, label, isCollapsed, end = false }: { to: string, icon: React.ReactNode, label: string, isCollapsed: boolean, end?: boolean }) {
  return (
    <NavLink 
      to={to}
      end={end}
      className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'} ${isCollapsed ? 'justify-center' : ''}`}
    >
      {icon}
      {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
    </NavLink>
  );
}
