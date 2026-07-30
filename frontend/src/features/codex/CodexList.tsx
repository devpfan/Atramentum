import { useState } from 'react';
import { useCodexStore } from '../../store/useCodexStore';
import { Search, Plus } from 'lucide-react';

interface CodexListProps {
  selectedEntryId: number | null;
  onSelectEntry: (id: number) => void;
}

export default function CodexList({ selectedEntryId, onSelectEntry }: CodexListProps) {
  const { entries, isLoading } = useCodexStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <div className="p-4 border-b border-[var(--color-border)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Codex</h2>
          <button 
            onClick={() => onSelectEntry(-1)} 
            className="p-1 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90"
            title="Nueva Entrada"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && <div className="text-center p-4 text-sm text-[var(--color-text-secondary)]">Cargando...</div>}
        
        {!isLoading && filteredEntries.map(entry => (
          <button
            key={entry.id}
            onClick={() => onSelectEntry(entry.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex flex-col ${
              selectedEntryId === entry.id 
                ? 'bg-[#6366f1]/20 text-[#6366f1]' 
                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            <span className="font-medium truncate">{entry.name}</span>
            <span className={`text-xs ${selectedEntryId === entry.id ? 'text-[#6366f1]/80' : 'text-[var(--color-text-secondary)]'}`}>
              {entry.category}
            </span>
          </button>
        ))}
        
        {!isLoading && filteredEntries.length === 0 && (
          <div className="text-center p-4 text-sm text-[var(--color-text-secondary)]">
            No se encontraron resultados
          </div>
        )}
      </div>
    </div>
  );
}
