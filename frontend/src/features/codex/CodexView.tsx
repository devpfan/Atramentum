import { useState, useEffect } from 'react';
import { useCodexStore } from '../../store/useCodexStore';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import CodexList from './CodexList';
import CodexEditor from './CodexEditor';
import { BookOpen } from 'lucide-react';

export default function CodexView() {
  const { entries, fetchEntries } = useCodexStore();
  const activeBookId = useManuscriptStore(state => state.activeBookId);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  // Cargar las entradas al montar y al cambiar de libro
  useEffect(() => {
    fetchEntries();
    setSelectedEntryId(null);
  }, [fetchEntries, activeBookId]);

  const selectedEntry = entries.find(e => e.id === selectedEntryId) || null;

  return (
    <div className="flex h-full w-full bg-[var(--color-background)] relative">
      {/* Panel Izquierdo: Lista (Oculto en móvil si hay selección) */}
      <div className={`
        ${selectedEntryId !== null ? 'hidden md:block' : 'block'} 
        w-full md:w-64 border-r border-[var(--color-border)] h-full shrink-0
      `}>
        <CodexList 
          selectedEntryId={selectedEntryId} 
          onSelectEntry={setSelectedEntryId} 
        />
      </div>

      {/* Panel Derecho: Editor (Oculto en móvil si NO hay selección) */}
      <div className={`
        ${selectedEntryId !== null ? 'flex' : 'hidden md:flex'}
        flex-1 h-full overflow-hidden bg-[var(--color-surface)] flex-col
      `}>
        {selectedEntryId ? (
          <CodexEditor 
            entry={selectedEntry} 
            onClose={() => setSelectedEntryId(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p>Selecciona una entrada del Archivum para ver o editar sus detalles.</p>
            <button 
              onClick={() => setSelectedEntryId(-1)} // -1 means "New Entry"
              className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Crear Nueva Entrada
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
